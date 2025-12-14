import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'; 
import { HttpClient } from '@angular/common/http';
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

  // Variable para saber si estamos en "Modo Cambio de Abogado"
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
    
    // --- NUEVOS CAMPOS DE TEXTO (Para Rechazo) ---
    jornada_laboral: [''],
    direccion_laboral: [''],
    trayecto_habitual: [''],

    // Switch para abogado anterior
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

  activarModoRevoca() {
    this.modoRevoca = true;
    this.pasoActual = 0; 
    this.reclamoForm.patchValue({ tiene_abogado_anterior: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarModoRevoca() {
    this.modoRevoca = false;
    this.reclamoForm.patchValue({ tiene_abogado_anterior: false });
  }

  seleccionarTramite(tipo: string) {
    // A. Si el usuario tocó la tarjeta "Cambiar de asesoramiento"
    if (tipo === 'Revoca') {
      this.activarModoRevoca();
      return; 
    }

    // B. Seteamos el valor del trámite
    this.reclamoForm.patchValue({ tipo_tramite: tipo });

    // C. Si estamos en Modo Revoca, aseguramos que el switch esté en TRUE
    if (this.modoRevoca) {
      this.reclamoForm.patchValue({ tiene_abogado_anterior: true });
    }

    // D. ACTUALIZAMOS LAS REGLAS DE VALIDACIÓN
    this.actualizarReglasValidacion(tipo);

    // E. Avanzamos
    this.pasoActual = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Método auxiliar para validaciones dependientes del TIPO
  // Asegurate de importar 'Validators' arriba
  // import { Validators } from '@angular/forms';

  // Asegurate de que Validators esté importado
// import { Validators } from '@angular/forms';

  private actualizarReglasValidacion(tipo: string) {
    const subtipoCtrl = this.reclamoForm.get('subtipo_tramite');
    const cartaDocCtrl = this.reclamoForm.get('fileCartaDocumento');
    
    const rechazoControls = ['jornada_laboral', 'direccion_laboral', 'trayecto_habitual'];

    // Limpieza inicial
    subtipoCtrl?.clearValidators();
    cartaDocCtrl?.clearValidators();
    rechazoControls.forEach(key => this.reclamoForm.get(key)?.clearValidators());

    if (tipo === 'Rechazo') {
      cartaDocCtrl?.setValidators([Validators.required]);

      // --- VALIDACIÓN ANTI-ESPACIOS ---
      const antiEspacios = Validators.pattern(/.*\S.*/); // <--- ESTA ES LA CLAVE

      // a) Jornada
      this.reclamoForm.get('jornada_laboral')?.setValidators([
        Validators.required,
        Validators.minLength(5),
        antiEspacios // Agregamos la validación acá
      ]);

      // b) Dirección
      this.reclamoForm.get('direccion_laboral')?.setValidators([
        Validators.required,
        Validators.minLength(5),
        antiEspacios
      ]);

      // c) Trayecto
      this.reclamoForm.get('trayecto_habitual')?.setValidators([
        Validators.required,
        Validators.minLength(20),
        antiEspacios
      ]);

    } else if (tipo === 'Prestaciones') {
      subtipoCtrl?.setValidators([Validators.required]);
    }
    
    // Actualizamos todo
    subtipoCtrl?.updateValueAndValidity();
    cartaDocCtrl?.updateValueAndValidity();
    rechazoControls.forEach(key => this.reclamoForm.get(key)?.updateValueAndValidity());
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

    // Append Datos Básicos
    formData.append('nombre', formValue.nombre!);
    formData.append('dni', formValue.dni!);
    formData.append('email', formValue.email!);
    formData.append('tipo_tramite', formValue.tipo_tramite!);
    formData.append('tiene_abogado_anterior', String(formValue.tiene_abogado_anterior));
    
    if (formValue.subtipo_tramite) {
      formData.append('subtipo_tramite', formValue.subtipo_tramite);
    }

    // Append Datos de Rechazo (si corresponde)
    if (formValue.tipo_tramite === 'Rechazo') {
      formData.append('jornada_laboral', formValue.jornada_laboral || '');
      formData.append('direccion_laboral', formValue.direccion_laboral || '');
      formData.append('trayecto_habitual', formValue.trayecto_habitual || '');
    }

    // Append Archivos Base
    formData.append('fileDNI', formValue.fileDNI!);
    formData.append('fileRecibo', formValue.fileRecibo!);
    formData.append('fileForm1', formValue.fileForm1!);
    formData.append('fileForm2', formValue.fileForm2!);

    // Append Archivos Condicionales
    if (formValue.fileAlta) formData.append('fileAlta', formValue.fileAlta);
    if (formValue.fileCartaDocumento) formData.append('fileCartaDocumento', formValue.fileCartaDocumento);
    
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
    this.modoRevoca = false; 
    this.pasoActual = 0; 
    this.reclamoForm.reset();
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

    this.reclamoForm.patchValue({ [controlName]: file });
    this.reclamoForm.get(controlName)?.updateValueAndValidity();
  }

  copiarCodigo() {
    if (this.codigoExito) {
      navigator.clipboard.writeText(this.codigoExito).then(() => {
        this.notificacionService.showSuccess('Código copiado al portapapeles');
      }).catch(err => console.error('Error al copiar', err));
    }
  }
}