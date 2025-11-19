import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { forkJoin, timer, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

// 1. ¡Importamos environment!
import { environment } from '../../../environments/environment';

// 2. Corregimos los imports (agregando .component y .service)
import { CardComponent } from '../../components/card/card';
import { NotificacionService } from '../../services/notificacion';

@Component({
  selector: 'app-consultar-tramite',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent],
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
    
    // 3. ¡USAMOS LA URL DEL ENVIRONMENT!
    const url = `${environment.apiUrl}/reclamos/consultar/${codigo}`;

    const minTime = timer(2000); 

    const apiCall = this.http.get(url).pipe(
      catchError((err: HttpErrorResponse) => {
        return of({ error: err });
      })
    );

    forkJoin({
      response: apiCall, 
      timer: minTime    
    })
    .pipe(
      finalize(() => {
        this.isLoading = false; 
        console.log('Finalizado, spinner apagado.');
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
        console.error('Error al consultar:', error.message);

      } else {
        this.resultado = response; 
        this.notificacionService.showSuccess('Consulta exitosa.');
        console.log('Respuesta del backend:', response);
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