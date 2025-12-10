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

  // Variable para el cartel de alerta naranja en el HTML
  esRevocaPatrocinio = false; 

  // --- DEFINICIÓN DEL FORMULARIO ---
  // Nota: Los campos condicionales arrancan SIN required. Se agregan dinámicamente.
  reclamoForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)]],
    dni: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(8), Validators.pattern(/^[0-9]*$/)]],
    email: ['', [Validators.required, Validators.email]],
    
    // Tipo de Trámite
    tipo_tramite: ['', Validators.required], 
    subtipo_tramite: [''], // Se vuelve required si es 'Prestaciones'
    
    // Archivos Base (Siempre obligatorios)
    fileDNI: [null as File | null, Validators.required],
    fileRecibo: [null as File | null, Validators.required],
    fileForm1: [null as File | null, Validators.required], 
    fileForm2: [null as File | null, Validators.required],
    
    // Archivos Opcionales / Condicionales
    fileAlta: [null as File | null], 
    fileCartaDocumento: [null as File | null], // Se vuelve required si es 'Rechazo'
    fileRevoca: [null as File | null]          // Se vuelve required si es 'Revoca'
  });

  constructor() {}

  ngOnInit(): void {
    // Detectamos si viene del banner del Home (Query Param ?revoca=true)
    this.route.queryParams.subscribe(params => {
      if (params['revoca'] === 'true') {
        // Entramos directo al modo Revoca
        this.seleccionarTramite('Revoca');
      }
    });
  }

  // =========================================================
  // 1. LÓGICA DE SELECCIÓN (EL CEREBRO DEL FORMULARIO)
  // =========================================================
  seleccionarTramite(tipo: string) {
    // A. Seteamos el valor
    this.reclamoForm.patchValue({ tipo_tramite: tipo });
    
    // B. Actualizamos bandera para el HTML (Cartel Naranja)
    this.esRevocaPatrocinio = (tipo === 'Revoca');

    // C. ACTUALIZAMOS LAS REGLAS DE VALIDACIÓN (CRÍTICO)
    this.actualizarReglasValidacion(tipo);

    // D. Cambiamos de pantalla
    this.pasoActual = 1;
    
    // E. Scroll arriba suave
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Método auxiliar para limpiar y re-asignar validators
  private actualizarReglasValidacion(tipo: string) {
    const subtipoCtrl = this.reclamoForm.get('subtipo_tramite');
    const cartaDocCtrl = this.reclamoForm.get('fileCartaDocumento');
    const revocaCtrl = this.reclamoForm.get('fileRevoca');

    // 1. LIMPIEZA: Primero sacamos la obligatoriedad a todo lo condicional
    subtipoCtrl?.clearValidators();
    cartaDocCtrl?.clearValidators();
    revocaCtrl?.clearValidators();

    // 2. ASIGNACIÓN: Según el caso, hacemos obligatorio lo que corresponda
    if (tipo === 'Rechazo') {
      cartaDocCtrl?.setValidators([Validators.required]); // Pide Carta Doc
    } 
    else if (tipo === 'Prestaciones') {
      subtipoCtrl?.setValidators([Validators.required]); // Pide Select Subtipo
    } 
    else if (tipo === 'Revoca') {
      revocaCtrl?.setValidators([Validators.required]); // Pide Escrito Revoca
    }
    // 'Alta Medica' no pide nada extra, queda con los base.

    // 3. ACTUALIZACIÓN: Avisamos a Angular que recalcule el estado
    subtipoCtrl?.updateValueAndValidity();
    cartaDocCtrl?.updateValueAndValidity();
    revocaCtrl?.updateValueAndValidity();
    this.reclamoForm.updateValueAndValidity(); // Actualiza el form completo
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
    
    if (formValue.subtipo_tramite) {
      formData.append('subtipo_tramite', formValue.subtipo_tramite);
    }

    // Append Archivos Base
    formData.append('fileDNI', formValue.fileDNI!);
    formData.append('fileRecibo', formValue.fileRecibo!);
    formData.append('fileForm1', formValue.fileForm1!);
    formData.append('fileForm2', formValue.fileForm2!);

    // Append Archivos Condicionales (Solo si tienen valor)
    if (formValue.fileAlta) formData.append('fileAlta', formValue.fileAlta);
    if (formValue.fileCartaDocumento) formData.append('fileCartaDocumento', formValue.fileCartaDocumento);
    if (formValue.fileRevoca) formData.append('fileRevoca', formValue.fileRevoca);

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
    this.esRevocaPatrocinio = false; 
    this.pasoActual = 0; // Vuelve a las tarjetas
    this.reclamoForm.reset();
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
}