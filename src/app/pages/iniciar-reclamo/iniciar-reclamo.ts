import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'; 
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router'; 
import { environment } from '../../../environments/environment';
import { CardComponent } from '../../components/card/card';
import { NotificacionService } from '../../services/notificacion';
import { ImageCompressService } from '../../services/image-compress.service';
import { SeoService } from '../../core/seo.service'; // <-- Importamos el servicio SEO

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

@Component({
  selector: 'app-iniciar-reclamo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent], 
  templateUrl: './iniciar-reclamo.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './iniciar-reclamo.scss'
})
export class IniciarReclamoComponent implements OnInit {

  private fb = inject(FormBuilder);
  private http = inject(HttpClient); 
  private notificacionService = inject(NotificacionService);
  private route = inject(ActivatedRoute);
  private imageCompress = inject(ImageCompressService);
  private seoService = inject(SeoService); // <-- Inyectamos el servicio SEO

  isLoading = false;
  isSubmitted = false; 
  codigoExito: string | null = null; 

  pasoActual = 0;
  modoRevoca = false;

  reclamoForm = this.fb.group({
    nombre: ['', [
      Validators.required, 
      Validators.minLength(3), 
      Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ][a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/) 
    ]],
    dni: ['', [
      Validators.required,
      Validators.minLength(7),
      Validators.maxLength(8),
      Validators.pattern(/^[0-9]*$/)
    ]],
    email: ['', [Validators.required, Validators.email]],

    tipo_tramite: ['', Validators.required], 
    subtipo_tramite: [''], 

    jornada_laboral: [''],
    direccion_laboral: [''],
    trayecto_habitual: [''],

    tiene_abogado_anterior: [false],

    fileDNI: [null as File | null, Validators.required],
    fileRecibo: [null as File | null],
    fileFormSRT: [null as File | null],
    fileAlta: [null as File | null],
    fileCartaDocumento: [null as File | null],
    fileRevoca: [null as File | null]
  });

  ngOnInit(): void {
    // --- SEO TAGS ---
    this.seoService.generarTags({
      title: 'Iniciar Trámite | ReclamARTe',
      description: 'Seleccioná tu tipo de reclamo, cargá la documentación desde tu celular y nosotros nos encargamos del resto.',
      image: 'https://reclamarte.ar/logo-seo-compartir.png', 
      url: 'https://reclamarte.ar/iniciar-reclamo'
    });

    this.route.queryParams.subscribe(params => {
      if (params['revoca'] === 'true') {
        this.activarModoRevoca();
      }
    });

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
  // FILES
  // =========================================================
  private resetFiles() {
    const fileControls = [
      'fileDNI', 'fileRecibo', 'fileFormSRT', 
      'fileAlta', 'fileCartaDocumento', 'fileRevoca'
    ];
    fileControls.forEach(ctrl => {
      this.reclamoForm.get(ctrl)?.reset();
    });
  }

  // =========================================================
  // MODOS Y SELECCIÓN
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
    if (tipo === 'Revoca') {
      this.activarModoRevoca();
      return;
    }

    this.resetFiles(); 

    this.reclamoForm.patchValue({ tipo_tramite: tipo });

    if (this.modoRevoca) {
      this.reclamoForm.patchValue({ tiene_abogado_anterior: true });
    }

    this.actualizarReglasValidacion(tipo);

    this.pasoActual = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get pideAlta(): boolean {
    const t = this.reclamoForm.get('tipo_tramite')?.value;
    return t === 'Medico' || t === 'Incapacidad';
  }

  get pideFormularios(): boolean {
    const t = this.reclamoForm.get('tipo_tramite')?.value;
    return t === 'Incapacidad' || t === 'Rechazo';
  }

  get pideRecibo(): boolean {
    const t = this.reclamoForm.get('tipo_tramite')?.value;
    return t === 'Incapacidad' || t === 'Rechazo';
  }

  get pideCartaYTextos(): boolean {
    return this.reclamoForm.get('tipo_tramite')?.value === 'Rechazo';
  }

  private actualizarReglasValidacion(tipo: string) {
    const c = this.reclamoForm.controls;

    const campos = [
      'fileRecibo', 'fileFormSRT', 'fileAlta', 'fileCartaDocumento', 'fileRevoca',
      'subtipo_tramite', 'jornada_laboral', 'direccion_laboral', 'trayecto_habitual'
    ];

    campos.forEach(key => {
      // @ts-ignore
      const ctrl = this.reclamoForm.get(key);
      ctrl?.clearValidators();
      ctrl?.setErrors(null);
      if (key !== 'fileRevoca') { 
         ctrl?.reset();
      }
      ctrl?.updateValueAndValidity({ emitEvent: false });
    });

    if (tipo === 'Medico') {
      c.fileAlta.setValidators([Validators.required]);
      c.subtipo_tramite.setValidators([Validators.required]);
    }
    else if (tipo === 'Incapacidad') {
      c.fileAlta.setValidators([Validators.required]);
      c.fileFormSRT.setValidators([Validators.required]);
      c.fileRecibo.setValidators([Validators.required]);
    }
    else if (tipo === 'Rechazo') {
      c.fileFormSRT.setValidators([Validators.required]);
      c.fileRecibo.setValidators([Validators.required]);
      c.fileCartaDocumento.setValidators([Validators.required]);

      const antiEspacios = Validators.pattern(/.*\S.*/);
      c.jornada_laboral.setValidators([Validators.required, Validators.minLength(5), antiEspacios]);
      c.direccion_laboral.setValidators([Validators.required, Validators.minLength(5), antiEspacios]);
      c.trayecto_habitual.setValidators([Validators.required, Validators.minLength(20), antiEspacios]);
    }

    if (this.reclamoForm.get('tiene_abogado_anterior')?.value) {
      c.fileRevoca.setValidators([Validators.required]);
      c.fileRevoca.updateValueAndValidity();
    }

    this.reclamoForm.updateValueAndValidity({ emitEvent: false });
  }

  // =========================================================
  // ENVÍO
  // =========================================================
  onSubmit() {
    if (this.reclamoForm.invalid) {
      this.reclamoForm.markAllAsTouched();
      
      Object.keys(this.reclamoForm.controls).forEach(key => {
        // @ts-ignore
        if (this.reclamoForm.get(key).invalid) {
          console.error(`❌ CAMPO INVÁLIDO: ${key}`);
        }
      });

      this.notificacionService.showError('Faltan datos obligatorios para este trámite.');
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    const v = this.reclamoForm.value;

    formData.append('nombre', v.nombre!);
    formData.append('dni', v.dni!);
    formData.append('email', v.email!);
    formData.append('tipo_tramite', v.tipo_tramite!);
    
    const tieneAbogado = v.tiene_abogado_anterior ? 'true' : 'false';
    formData.append('tiene_abogado_anterior', tieneAbogado);

    if (this.reclamoForm.get('tipo_tramite')?.value === 'Medico' && v.subtipo_tramite) {
      formData.append('subtipo_tramite', v.subtipo_tramite);
    }

    if (this.pideCartaYTextos) {
      formData.append('jornada_laboral', v.jornada_laboral || '');
      formData.append('direccion_laboral', v.direccion_laboral || '');
      formData.append('trayecto_habitual', v.trayecto_habitual || '');
    }

    if (v.fileDNI) formData.append('fileDNI', v.fileDNI);
    
    if (this.pideRecibo && v.fileRecibo) formData.append('fileRecibo', v.fileRecibo);
    
    if (this.pideFormularios && v.fileFormSRT) {
      formData.append('fileFormSRT', v.fileFormSRT);
    }
    
    if (this.pideAlta && v.fileAlta) formData.append('fileAlta', v.fileAlta);
    
    if (this.pideCartaYTextos && v.fileCartaDocumento) {
      formData.append('fileCartaDocumento', v.fileCartaDocumento);
    }
    
    if (v.tiene_abogado_anterior && v.fileRevoca) {
      formData.append('fileRevoca', v.fileRevoca);
    }

    this.http.post(`${environment.apiUrl}/reclamos`, formData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.isSubmitted = true;
        this.codigoExito = res.codigo_seguimiento;
        this.notificacionService.showSuccess('¡Reclamo enviado con éxito!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: err => {
        this.isLoading = false;
        console.error('Error Backend:', err);
        const msg = err.error?.message || 'Error al enviar el reclamo.';
        this.notificacionService.showError(msg);
      }
    });
  }

  // =========================================================
  // UTILIDADES
  // =========================================================
  iniciarOtroReclamo() {
    this.isSubmitted = false;
    this.codigoExito = null;
    this.modoRevoca = false;
    this.pasoActual = 0;
    this.reclamoForm.reset();
    this.reclamoForm.patchValue({ tiene_abogado_anterior: false });
    this.resetFiles();
  }

  volverAStep1() {
    this.reclamoForm.reset();
    this.reclamoForm.patchValue({ tiene_abogado_anterior: false });
    this.resetFiles();
    this.modoRevoca = false;
    this.pasoActual = 0;
    this.actualizarReglasValidacion('');
  }

  async onFileChange(event: any, controlName: string) {
    if (!event.target.files || event.target.files.length === 0) {
      this.reclamoForm.get(controlName)?.reset();
      return;
    }

    const fileOriginal = event.target.files[0];

    if (!ALLOWED_MIME_TYPES.includes(fileOriginal.type)) {
      this.notificacionService.showError('Formato no permitido (Use PDF, JPG o PNG).');
      this.reclamoForm.get(controlName)?.reset();
      event.target.value = null; 
      return;
    }

    this.isLoading = true;

    try {
      const fileProcesado = await this.imageCompress.compressFile(fileOriginal);

      if (fileProcesado.size > MAX_SIZE_BYTES) {
        this.notificacionService.showError('El archivo sigue siendo muy pesado (máx 5MB).');
        this.reclamoForm.get(controlName)?.reset();
        event.target.value = null;
        return;
      }

      this.reclamoForm.patchValue({ [controlName]: fileProcesado });
      this.reclamoForm.get(controlName)?.updateValueAndValidity();

    } catch (error) {
      console.error('Error al procesar archivo:', error);
      this.notificacionService.showError('Error al procesar la imagen.');
      this.reclamoForm.get(controlName)?.reset();
      event.target.value = null;
    } finally {
      this.isLoading = false;
    }
  }

  copiarCodigo() {
    if (this.codigoExito) {
      navigator.clipboard.writeText(this.codigoExito);
      this.notificacionService.showSuccess('Código copiado');
    }
  }
}