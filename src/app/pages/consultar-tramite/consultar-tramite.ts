import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CardComponent } from '../../components/card/card';
import { NotificacionService } from '../../services/notificacion';
import { forkJoin, timer, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

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
    const url = `http://localhost:3000/reclamos/consultar/${codigo}`;

    const minTime = timer(2000); 

    // 2. Creamos el Observable de la API
    // (Usamos catchError para que 'forkJoin' no se rompa si la API falla)
    const apiCall = this.http.get(url).pipe(
      catchError((err: HttpErrorResponse) => {
        return of({ error: err });
      })
    );

    // 3. Usamos forkJoin para esperar a que AMBOS terminen
    // (Tanto la API como el timer de 2 segundos)
    forkJoin({
      response: apiCall, 
      timer: minTime    
    })
    .pipe(
      // 4. finalize() se ejecuta SIEMPRE (éxito o error) al final
      finalize(() => {
        this.isLoading = false; 
        console.log('Finalizado, spinner apagado.');
      })
    )
    .subscribe(({ response }) => { // 5. Solo nos importa la 'response'

      // 6. Revisamos si 'response' es un error (el que devolvimos en catchError)
      if ((response as any).error) {
        // ¡ERROR!
        const error = (response as any).error as HttpErrorResponse;
        if (error.status === 404) {
          this.errorMensaje = 'Código no encontrado. Verifique los datos.';
        } else {
          this.errorMensaje = 'Error al conectar con el servidor.';
        }
        this.notificacionService.showError(this.errorMensaje);
        console.error('Error al consultar:', error.message);

      } else {
        // ¡ÉXITO!
        this.resultado = response; // 'response' es la data buena
        this.notificacionService.showSuccess('Consulta exitosa.');
        console.log('Respuesta del backend:', response);
      }
    });
  }

  // (La función resetForm() queda igual)
  resetForm() {
    this.consultaForm.reset();
    this.resultado = null;
    this.errorMensaje = null;
    this.isLoading = false;
  }
}