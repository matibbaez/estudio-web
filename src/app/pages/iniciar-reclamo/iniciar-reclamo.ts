import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'; 
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router'; 
import { environment } from '../../../environments/environment';
import { CardComponent } from '../../components/card/card';
import { NotificacionService } from '../../services/notificacion';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

@Component({
  selector: 'app-iniciar-reclamo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent], 
  templateUrl: './iniciar-reclamo.html',
  styleUrl: './iniciar-reclamo.scss'
})
export class IniciarReclamoComponent implements OnInit {
  
  private fb = inject(FormBuilder);
  private http = inject(HttpClient); 
  private notificacionService = inject(NotificacionService);
  private route = inject(ActivatedRoute);

  isLoading = false;
  isSubmitted = false; 
  codigoExito: string | null = null; 
  
  // Controla qué pantalla vemos (0: Tarjetas, 1: Formulario)
  pasoActual = 0;

  // NUEVO: Variable para saber si estamos en "Modo Cambio de Abogado"
  modoRevoca = false;

  // --- DEFINICIÓN DEL FORMULARIO ---
  reclamoForm = this.fb.group({
    nombre: ['', [
      Validators.required, 
      Validators.minLength(3), 
      Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ][a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/) 
    ]],
    dni: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(8), Validators.pattern(/^[0-9]*$/)]],
    email: ['', [Validators.required, Validators.email]],
    
    // Tipo de Trámite
    tipo_tramite: ['', Validators.required], 
    subtipo_tramite: [''], // Se vuelve required si es 'Prestaciones'
    
    // NUEVO: Switch para abogado anterior
    tiene_abogado_anterior: [false],

    // Archivos Base (Siempre obligatorios)
    fileDNI: [null as File | null, Validators.required],
    fileRecibo: [null as File | null, Validators.required],
    fileForm1: [null as File | null, Validators.required], 
    fileForm2: [null as File | null, Validators.required],
    
    // Archivos Opcionales / Condicionales
    fileAlta: [null as File | null], 
    fileCartaDocumento: [null as File | null], // Se vuelve required si es 'Rechazo'
    fileRevoca: [null as File | null]          // Se vuelve required si 'tiene_abogado_anterior' es true
  });

  constructor() {}

  ngOnInit(): void {
    // 1. Detectar si viene del banner (?revoca=true)
    this.route.queryParams.subscribe(params => {
      if (params['revoca'] === 'true') {
        this.activarModoRevoca();
      }
    });

    // 2. ESCUCHAR CAMBIOS DEL SWITCH "TIENE ABOGADO ANTERIOR"
    // Esto hace que la validación del archivo sea dinámica
    this.reclamoForm.get('tiene_abogado_anterior')?.valueChanges.subscribe(tieneAbogado => {
      const fileRevocaCtrl = this.reclamoForm.get('fileRevoca');
      
      if (tieneAbogado) {
        fileRevocaCtrl?.setValidators([Validators.required]);
      } else {
        fileRevocaCtrl?.clearValidators();
      }
      fileRevocaCtrl?.updateValueAndValidity();
    });
  }

  // =========================================================
  // 1. LÓGICA DE MODOS Y SELECCIÓN
  // =========================================================

  // Activa el modo visual y pre-setea el switch
  // Activa el modo visual y pre-setea el switch
  activarModoRevoca() {
    this.modoRevoca = true;
    this.pasoActual = 0; 
    this.reclamoForm.patchValue({ tiene_abogado_anterior: true });
    
    // AGREGAR ESTA LÍNEA AQUÍ:
    // Fuerza al navegador a subir suavemente para que vean el nuevo título naranja
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarModoRevoca() {
    this.modoRevoca = false;
    this.reclamoForm.patchValue({ tiene_abogado_anterior: false });
  }

  seleccionarTramite(tipo: string) {
    // A. Si el usuario tocó la tarjeta "Cambiar de asesoramiento" (la que aparece en el grid normal)
    if (tipo === 'Revoca') {
      this.activarModoRevoca();
      return; // No avanzamos al form todavía, esperamos que elija el tipo de accidente
    }

    // B. Seteamos el valor del trámite
    this.reclamoForm.patchValue({ tipo_tramite: tipo });

    // C. Si estamos en Modo Revoca, aseguramos que el switch esté en TRUE
    if (this.modoRevoca) {
      this.reclamoForm.patchValue({ tiene_abogado_anterior: true });
    }

    // D. ACTUALIZAMOS LAS REGLAS DE VALIDACIÓN (Carta Doc / Subtipo)
    this.actualizarReglasValidacion(tipo);

    // E. Avanzamos
    this.pasoActual = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Método auxiliar para validaciones dependientes del TIPO (no del switch)
  private actualizarReglasValidacion(tipo: string) {
    const subtipoCtrl = this.reclamoForm.get('subtipo_tramite');
    const cartaDocCtrl = this.reclamoForm.get('fileCartaDocumento');
    
    // 1. LIMPIEZA
    subtipoCtrl?.clearValidators();
    cartaDocCtrl?.clearValidators();

    // 2. ASIGNACIÓN
    if (tipo === 'Rechazo') {
      cartaDocCtrl?.setValidators([Validators.required]); // Pide Carta Doc
    } 
    else if (tipo === 'Prestaciones') {
      subtipoCtrl?.setValidators([Validators.required]); // Pide Select Subtipo
    }
    
    // NOTA: La validación de 'fileRevoca' ya no va aquí, 
    // la maneja el listener de 'tiene_abogado_anterior' en ngOnInit.

    // 3. ACTUALIZACIÓN
    subtipoCtrl?.updateValueAndValidity();
    cartaDocCtrl?.updateValueAndValidity();
    this.reclamoForm.updateValueAndValidity();
  }

  // =========================================================
  // 2. LOGICA DE ENVÍO
  // =========================================================
  onSubmit() {
    if (this.reclamoForm.invalid) {
      this.reclamoForm.markAllAsTouched();
      this.notificacionService.showError('Faltan datos obligatorios. Revise el formulario.');
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    const formValue = this.reclamoForm.value;

    // Append Datos Texto
    formData.append('nombre', formValue.nombre!);
    formData.append('dni', formValue.dni!);
    formData.append('email', formValue.email!);
    formData.append('tipo_tramite', formValue.tipo_tramite!);
    
    // Enviamos el booleano también (útil para el backend)
    formData.append('tiene_abogado_anterior', String(formValue.tiene_abogado_anterior));
    
    if (formValue.subtipo_tramite) {
      formData.append('subtipo_tramite', formValue.subtipo_tramite);
    }

    // Append Archivos Base
    formData.append('fileDNI', formValue.fileDNI!);
    formData.append('fileRecibo', formValue.fileRecibo!);
    formData.append('fileForm1', formValue.fileForm1!);
    formData.append('fileForm2', formValue.fileForm2!);

    // Append Archivos Condicionales
    if (formValue.fileAlta) formData.append('fileAlta', formValue.fileAlta);
    if (formValue.fileCartaDocumento) formData.append('fileCartaDocumento', formValue.fileCartaDocumento);
    
    // Revoca solo si el switch es true y hay archivo
    if (formValue.tiene_abogado_anterior && formValue.fileRevoca) {
      formData.append('fileRevoca', formValue.fileRevoca);
    }

    const url = `${environment.apiUrl}/reclamos`;

    this.http.post(url, formData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.isSubmitted = true; 
        this.codigoExito = response.codigo_seguimiento; 
        this.notificacionService.showSuccess('¡Reclamo enviado con éxito!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error backend:', error);
        const msg = error.error?.message || 'Error al enviar el reclamo.';
        this.notificacionService.showError(msg);
      }
    });
  }

  // =========================================================
  // 3. UTILS (Archivos, Reiniciar)
  // =========================================================
  iniciarOtroReclamo() {
    this.isSubmitted = false;
    this.codigoExito = null;
    this.modoRevoca = false; // Reseteamos modo
    this.pasoActual = 0; 
    this.reclamoForm.reset();
    // Reseteamos valores por defecto
    this.reclamoForm.patchValue({ tiene_abogado_anterior: false });
  }

  onFileChange(event: any, controlName: string) {
    if (event.target.files.length === 0) {
      this.reclamoForm.get(controlName)?.reset(); 
      return;
    }

    const file = event.target.files[0];

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      this.notificacionService.showError(`Formato no permitido. Use PDF, JPG o PNG.`);
      this.reclamoForm.get(controlName)?.reset(); 
      event.target.value = null; 
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      this.notificacionService.showError(`Archivo muy pesado. Máximo 5 MB.`);
      this.reclamoForm.get(controlName)?.reset(); 
      event.target.value = null;
      return;
    }

    // Guardamos el archivo y validamos
    this.reclamoForm.patchValue({ [controlName]: file });
    this.reclamoForm.get(controlName)?.updateValueAndValidity();
  }

  copiarCodigo() {
    if (this.codigoExito) {
      navigator.clipboard.writeText(this.codigoExito).then(() => {
        this.notificacionService.showSuccess('Código copiado al portapapeles');
      }).catch(err => {
        console.error('Error al copiar', err);
      });
    }
  }
}