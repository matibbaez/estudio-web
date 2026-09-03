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

  // 1. Diccionario con los textos exactos solicitados
  readonly diccionarioEstados: { [key: string]: { titulo: string, descripcion: string } } = {
    'Recibido': { titulo: 'Recibido', descripcion: 'Recibimos tu caso. En las próximas 48 horas hábiles revisamos la documentación.' },
    'En revisión': { titulo: 'En revisión', descripcion: 'Un abogado está revisando lo que cargaste. Si falta algo te escribimos por WhatsApp.' },
    'Presentado': { titulo: 'Presentado', descripcion: 'Presentamos tu reclamo. A partir de acá los tiempos los marca el organismo.' },
    'Con fecha': { titulo: 'Con fecha', descripcion: 'Ya tenés fecha de audiencia. Te vamos a avisar qué llevar y a qué hora.' },
    'Audiencia hecha': { titulo: 'Audiencia hecha', descripcion: 'Se hizo la audiencia. Ahora esperamos el dictamen.' },
    'Dictamen': { titulo: 'Dictamen', descripcion: 'Salió el dictamen. Un abogado te va a explicar qué dice y cómo sigue.' },
    'Cerrado': { titulo: 'Cerrado', descripcion: 'Tu trámite terminó.' },
    'Falta documentación': { titulo: 'Falta documentación', descripcion: 'Necesitamos que nos acerques algo para seguir. Te escribimos por WhatsApp con el detalle.' },
    'No podemos tomarlo': { titulo: 'No podemos tomarlo', descripcion: 'Revisamos tu caso y no podemos tomarlo. Te explicamos por qué y te orientamos sobre cómo seguir.' }
  };

  // 2. Array de la línea de tiempo normal
  readonly pasosNormales = [
    'Recibido', 'En revisión', 'Presentado', 'Con fecha', 'Audiencia hecha', 'Dictamen', 'Cerrado'
  ];

  // Helpers para la vista
  getDatosEstado(estado: string) {
    return this.diccionarioEstados[estado] || { titulo: estado, descripcion: 'Estamos gestionando tu trámite.' };
  }

  isEstadoExcepcion(estado: string): boolean {
    return estado === 'Falta documentación' || estado === 'No podemos tomarlo';
  }

  getCurrentStepIndex(estado: string): number {
    return this.pasosNormales.indexOf(estado);
  }

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