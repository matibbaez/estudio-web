import { Component, inject, OnInit } from '@angular/core'; // <--- Agregamos OnInit
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'; 
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router'; // <--- Importamos ActivatedRoute
import { environment } from '../../../environments/environment';
import { CardComponent } from '../../components/card/card';
import { NotificacionService } from '../../services/notificacion';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

@Component({
  selector: 'app-iniciar-reclamo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent], 
  templateUrl: './iniciar-reclamo.html',
  styleUrl: './iniciar-reclamo.scss'
})
export class IniciarReclamoComponent implements OnInit { // <--- Implementamos OnInit
  
  private fb = inject(FormBuilder);
  private http = inject(HttpClient); 
  private notificacionService = inject(NotificacionService);
  private route = inject(ActivatedRoute); // <--- Inyectamos la Ruta

  isLoading = false;
  isSubmitted = false; 
  codigoExito: string | null = null; 
  
  // Variable para saber si mostramos el cartel de alerta roja
  esRevocaPatrocinio = false; 

  reclamoForm = this.fb.group({
    nombre: ['', [
      Validators.required,
      Validators.minLength(3), 
      Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/) 
    ]],
    dni: ['', [
      Validators.required,
      Validators.minLength(7), 
      Validators.maxLength(8), 
      Validators.pattern(/^[0-9]*$/) 
    ]],
    email: ['', [Validators.required, Validators.email]],
    
    // --- CAMPOS NUEVOS ---
    tipo_tramite: ['Alta Medica', Validators.required], // Valor por defecto
    subtipo_tramite: [''], // Opcional al inicio
    
    // Archivos Base
    fileDNI: [null as File | null, Validators.required],
    fileRecibo: [null as File | null, Validators.required],
    fileAlta: [null as File | null], // Opcional (solo si es Alta Medica)
    fileForm1: [null as File | null, Validators.required], 
    fileForm2: [null as File | null, Validators.required],
    
    // Archivos Nuevos Condicionales
    fileCartaDocumento: [null as File | null], // Solo si es Rechazo
    fileRevoca: [null as File | null]          // Solo si viene del Banner
  });

  constructor() {}

  // 1. DETECTAMOS SI VIENE DEL BANNER "REVOCA"
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['revoca'] === 'true') {
        this.esRevocaPatrocinio = true;
        // Hacemos obligatorio el archivo de Revoca
        this.reclamoForm.get('fileRevoca')?.setValidators([Validators.required]);
        this.reclamoForm.get('fileRevoca')?.updateValueAndValidity();
      }
    });
    
    // Ejecutamos la validación inicial del tipo de trámite
    this.onTipoChange();
  }

  // 2. LÓGICA DINÁMICA DEL SELECTOR (CAMBIO DE TIPO)
  onTipoChange() {
    const tipo = this.reclamoForm.get('tipo_tramite')?.value;
    const subtipoControl = this.reclamoForm.get('subtipo_tramite');
    const cdControl = this.reclamoForm.get('fileCartaDocumento');

    // Reseteamos validaciones para empezar limpio
    subtipoControl?.clearValidators();
    cdControl?.clearValidators();

    if (tipo === 'Prestaciones') {
      subtipoControl?.setValidators([Validators.required]);
    } 
    else if (tipo === 'Rechazo') {
      cdControl?.setValidators([Validators.required]);
    }

    // Actualizamos el estado de los campos
    subtipoControl?.updateValueAndValidity();
    cdControl?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.reclamoForm.invalid) {
      this.reclamoForm.markAllAsTouched();
      this.notificacionService.showError('Formulario inválido. Revise los campos en rojo.');
      return;
    }

    this.isLoading = true;
    console.log('Formulario Válido, armando FormData...');

    const formData = new FormData();
    const formValue = this.reclamoForm.value;

    // Datos Base
    formData.append('nombre', formValue.nombre!);
    formData.append('dni', formValue.dni!);
    formData.append('email', formValue.email!);
    
    // Nuevos Datos de Texto
    formData.append('tipo_tramite', formValue.tipo_tramite!);
    if (formValue.subtipo_tramite) {
      formData.append('subtipo_tramite', formValue.subtipo_tramite);
    }

    // Archivos Base
    formData.append('fileDNI', formValue.fileDNI!);
    formData.append('fileRecibo', formValue.fileRecibo!);
    formData.append('fileForm1', formValue.fileForm1!);
    formData.append('fileForm2', formValue.fileForm2!);

    // Archivos Opcionales / Condicionales
    if (formValue.fileAlta) formData.append('fileAlta', formValue.fileAlta);
    
    // Solo mandamos estos si existen (el backend debe estar preparado para recibirlos opcionalmente)
    if (formValue.fileCartaDocumento) formData.append('fileCartaDocumento', formValue.fileCartaDocumento);
    if (formValue.fileRevoca) formData.append('fileRevoca', formValue.fileRevoca);

    const url = `${environment.apiUrl}/reclamos`;

    this.http.post(url, formData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.isSubmitted = true; 
        this.codigoExito = response.codigo_seguimiento; 
        this.notificacionService.showSuccess('¡Reclamo enviado con éxito!');
      },
      error: (error) => {
        this.isLoading = false;
        console.error('¡ERROR! No se pudo conectar al backend:', error);
        if (error.error && error.error.message) {
             this.notificacionService.showError(error.error.message);
        } else {
             this.notificacionService.showError('Error al enviar el reclamo. Intente más tarde.');
        }
      }
    });
  }

  iniciarOtroReclamo() {
    this.isSubmitted = false;
    this.codigoExito = null;
    this.esRevocaPatrocinio = false; // Reseteamos esto también
    this.reclamoForm.reset();
    
    // Volvemos a poner valores por defecto
    this.reclamoForm.patchValue({ tipo_tramite: 'Alta Medica' });
    this.onTipoChange(); // Re-aplicar reglas
  }

  onFileChange(event: any, controlName: string) {
    if (event.target.files.length === 0) {
      this.reclamoForm.get(controlName)?.reset(); 
      return;
    }

    const file = event.target.files[0];

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      this.notificacionService.showError(`Tipo de archivo no permitido. Solo se aceptan PDF, JPG o PNG.`);
      this.reclamoForm.get(controlName)?.reset(); 
      event.target.value = null; 
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      this.notificacionService.showError(`Archivo demasiado grande. El límite es 5 MB.`);
      this.reclamoForm.get(controlName)?.reset(); 
      event.target.value = null;
      return;
    }

    this.reclamoForm.patchValue({
      [controlName]: file
    });
    this.reclamoForm.get(controlName)?.updateValueAndValidity();
  }
}