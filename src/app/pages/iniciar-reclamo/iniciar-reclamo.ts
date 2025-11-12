import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'; 
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

// --- ¡FIX DE IMPORTS! (Estos eran los que tenías mal) ---
import { CardComponent } from '../../components/card/card';
import { NotificacionService } from '../../services/notificacion';

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

  // --- ¡CAMBIOS AQUÍ! (Nuevas variables de estado) ---
  isLoading = false;
  isSubmitted = false; // <-- Para mostrar la pantalla de éxito
  codigoExito: string | null = null; // <-- Para guardar el código

  // (Tu reclamoForm está perfecto como lo tenías)
  reclamoForm = this.fb.group({
    nombre: ['', Validators.required],
    dni: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    fileDNI: [null as File | null, Validators.required],
    fileRecibo: [null as File | null, Validators.required],
    fileAlta: [null as File | null], 
    fileForm1: [null as File | null, Validators.required], 
    fileForm2: [null as File | null, Validators.required], 
  });

  constructor() {}

  // --- ¡CAMBIOS AQUÍ! (Lógica de envío actualizada) ---
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

    this.http.post('http://localhost:3000/reclamos', formData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        
        // --- ¡LA NUEVA LÓGICA DE ÉXITO! ---
        this.isSubmitted = true; // 1. Ocultamos el form
        this.codigoExito = response.codigo_seguimiento; // 2. Guardamos el código
        
        // 3. El toast ahora es más simple (¡el código se ve en la pantalla!)
        this.notificacionService.showSuccess('¡Reclamo enviado con éxito!');
        
        // 4. ¡YA NO HACEMOS reset() AQUÍ!
      },
      error: (error) => {
        this.isLoading = false;
        console.error('¡ERROR! No se pudo conectar al backend:', error);
        this.notificacionService.showError('Error al enviar el reclamo. Intente más tarde.');
      }
    });
  }

  // --- ¡CAMBIOS AQUÍ! (Nuevo método para resetear) ---
  iniciarOtroReclamo() {
    this.isSubmitted = false;
    this.codigoExito = null;
    this.reclamoForm.reset();
  }

  // (Tu función onFileChange queda 100% igual)
  onFileChange(event: any, controlName: string) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.reclamoForm.patchValue({
        [controlName]: file
      });
      this.reclamoForm.get(controlName)?.updateValueAndValidity();
    }
  }
}