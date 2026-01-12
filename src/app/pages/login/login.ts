import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CardComponent } from '../../components/card/card';
import { NotificacionService } from '../../services/notificacion';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CardComponent], // ¡Importamos la Card!
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private notificacionService = inject(NotificacionService);
  private router = inject(Router); // 2. ¡Inyectamos el Router!

  isLoading = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  constructor() {}

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.notificacionService.showError('Formulario inválido');
      return;
    }

    this.isLoading = true;
    const url = `${environment.apiUrl}/auth/login`; 
    const credentials = this.loginForm.value;

    this.http.post(url, credentials).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        // console.log('¡Login exitoso! Token:', response.access_token);
        
        // 3. ¡LA MAGIA! Guardamos el "sello" en el navegador
        localStorage.setItem('access_token', response.access_token);
        
        this.notificacionService.showSuccess('¡Bienvenido!');
        
        // 4. ¡Redirigimos al Admin al Dashboard! (que todavía no existe)
        this.router.navigate(['/admin-dashboard']); 
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 401) { // 401 Unauthorized
          this.notificacionService.showError('Credenciales incorrectas');
        } else {
          this.notificacionService.showError('Error al conectar con el servidor');
        }
        console.error('Error en el login:', error.message);
      }
    });
  }
}