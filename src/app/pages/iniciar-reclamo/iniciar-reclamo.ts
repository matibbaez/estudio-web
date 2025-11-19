import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'; 
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
export class IniciarReclamoComponent {
  
  private fb = inject(FormBuilder);
  private http = inject(HttpClient); 
  private notificacionService = inject(NotificacionService);

  isLoading = false;
  isSubmitted = false; 
  codigoExito: string | null = null; 

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
    fileDNI: [null as File | null, Validators.required],
    fileRecibo: [null as File | null, Validators.required],
    fileAlta: [null as File | null], 
    fileForm1: [null as File | null, Validators.required], 
    fileForm2: [null as File | null, Validators.required], 
  });

  constructor() {}

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

    formData.append('nombre', formValue.nombre!);
    formData.append('dni', formValue.dni!);
    formData.append('email', formValue.email!);
    formData.append('fileDNI', formValue.fileDNI!);
    formData.append('fileRecibo', formValue.fileRecibo!);
    formData.append('fileForm1', formValue.fileForm1!);
    formData.append('fileForm2', formValue.fileForm2!);

    if (formValue.fileAlta) {
      formData.append('fileAlta', formValue.fileAlta);
    }

    // 3. ¡USAMOS LA URL DEL ENVIRONMENT!
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
        
        // (Opcional) Si querés mostrar el mensaje específico del backend (como "Tipo de archivo no permitido")
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
    this.reclamoForm.reset();
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