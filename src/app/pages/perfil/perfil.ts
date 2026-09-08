import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NotificacionService } from '../../services/notificacion';
import { SeoService } from '../../core/seo.service'; // <-- Importamos el servicio SEO

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss'
})
export class PerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private notificacionService = inject(NotificacionService);
  private seoService = inject(SeoService); // <-- Inyectamos el servicio SEO

  isLoading = false;

  // Variables dinámicas
  userName: string = 'Administrador';
  userEmail: string = '';

  passwordForm = this.fb.group({
    currentPass: ['', Validators.required],
    newPass: ['', [
      Validators.required, 
      Validators.minLength(6),
      Validators.pattern(/.*[A-Z].*/)
    ]],
    confirmPass: ['', Validators.required]
  }, { validators: this.passwordsMatchValidator });

  ngOnInit() {
    // --- SEO: título propio + noindex (página privada) ---
    this.seoService.generarTags({
      title: 'Mi Perfil | ReclamARTe',
      description: 'Gestión de perfil y seguridad de la cuenta.',
      image: 'https://reclamarte.ar/logo-seo-compartir.png',
      url: 'https://reclamarte.ar/perfil'
    });
    this.seoService.bloquearIndexacion();

    this.cargarDatosUsuario();
  }

  cargarDatosUsuario() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Los JWT tienen 3 partes separadas por puntos. La del medio (índice 1) es el Payload con los datos.
          const payloadBase64 = token.split('.')[1];
          const payloadDecoded = JSON.parse(atob(payloadBase64));

          // Asignamos los datos reales que vienen en el token (ajustá las propiedades si en tu backend se llaman distinto, ej: payloadDecoded.name)
          this.userEmail = payloadDecoded.email || 'correo@estudio.com';
          this.userName = payloadDecoded.nombre || payloadDecoded.name || 'Administrador';
        } catch (e) {
          console.error('Error al decodificar el token', e);
        }
      }
    }
  }

  get userInitials(): string {
    return this.userName ? this.userName.charAt(0).toUpperCase() : 'A';
  }

  passwordsMatchValidator(form: any) {
    const newPass = form.get('newPass')?.value;
    const confirmPass = form.get('confirmPass')?.value;
    return newPass === confirmPass ? null : { mismatch: true };
  }

  onSubmitPassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { currentPass, newPass } = this.passwordForm.value;

    this.http.patch(`${environment.apiUrl}/users/me/password`, { currentPass, newPass })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.notificacionService.showSuccess('Contraseña actualizada con éxito');
          this.passwordForm.reset();
        },
        error: (err) => {
          this.isLoading = false;
          const msg = err.error?.message || 'Error al actualizar la contraseña';
          this.notificacionService.showError(msg);
        }
      });
  }
}