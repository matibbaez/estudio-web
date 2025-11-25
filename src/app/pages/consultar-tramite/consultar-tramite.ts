import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { forkJoin, timer, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CardComponent } from '../../components/card/card'; // <--- ¡IMPORTANTE!
import { NotificacionService } from '../../services/notificacion';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-consultar-tramite',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CardComponent], // <--- ¡AGREGADO!
  templateUrl: './consultar-tramite.html',
  styleUrl: './consultar-tramite.scss'
})
export class ConsultarTramiteComponent {
  
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private notificacionService = inject(NotificacionService);

  resultado: any = null;
  errorMensaje: string | null = null;
  isLoading = false;

  consultaForm = this.fb.group({
    codigo: ['', Validators.required]
  });

  constructor() {}

  onSubmit() {
    this.resultado = null;
    this.errorMensaje = null;
    
    if (this.consultaForm.invalid) {
      this.consultaForm.markAllAsTouched();
      this.notificacionService.showError('El código es obligatorio.');
      return;
    }

    this.isLoading = true; 
    const codigo = this.consultaForm.value.codigo!.trim().toUpperCase();
    const url = `${environment.apiUrl}/reclamos/consultar/${codigo}`;
    const minTime = timer(1000); // Spinner de 1 segundo mínimo

    const apiCall = this.http.get(url).pipe(
      catchError((err: HttpErrorResponse) => {
        return of({ error: err });
      })
    );

    forkJoin({ response: apiCall, timer: minTime })
    .pipe(
      finalize(() => {
        this.isLoading = false; 
      })
    )
    .subscribe(({ response }) => {
      if ((response as any).error) {
        const error = (response as any).error as HttpErrorResponse;
        if (error.status === 404) {
          this.errorMensaje = 'Código no encontrado. Verifique los datos.';
        } else {
          this.errorMensaje = 'Error al conectar con el servidor.';
        }
        this.notificacionService.showError(this.errorMensaje);
      } else {
        this.resultado = response; 
        this.notificacionService.showSuccess('Consulta exitosa.');
      }
    });
  }

  resetForm() {
    this.consultaForm.reset();
    this.resultado = null;
    this.errorMensaje = null;
    this.isLoading = false;
  }
}