import { Component, inject, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common'; 
import { Observable, EMPTY, BehaviorSubject, forkJoin, timer, of } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';

// 1. ¡Importamos environment!
import { environment } from '../../../environments/environment';

// 2. Importamos nuestros componentes y servicios
import { CardComponent } from '../../components/card/card';
import { NotificacionService } from '../../services/notificacion';
import { GestionarReclamoModalComponent } from '../../components/gestionar-reclamo-modal/gestionar-reclamo-modal';

export interface IReclamo {
  id: string;
  nombre: string;
  dni: string;
  email: string;
  codigo_seguimiento: string;
  estado: 'Recibido' | 'En Proceso' | 'Finalizado';
  fecha_creacion: string;
  path_dni: string;
  path_recibo: string;
  path_alta_medica: string | null;
  path_form1: string;
  path_form2: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CardComponent, GestionarReclamoModalComponent],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboardComponent implements OnInit {

  private http = inject(HttpClient);
  private notificacionService = inject(NotificacionService);

  private reclamosSubject = new BehaviorSubject<IReclamo[]>([]);
  public reclamos$ = this.reclamosSubject.asObservable();
  
  public actualizandoId: string | null = null;
  public reclamoSeleccionado: IReclamo | null = null;

  constructor() {}

  ngOnInit(): void {
    // 3. ¡USAMOS LA URL DEL ENVIRONMENT!
    this.http.get<IReclamo[]>(`${environment.apiUrl}/reclamos`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al traer reclamos:', error.message);
        if (error.status === 401) {
          this.notificacionService.showError('Error: No estás autorizado.');
        } else {
          this.notificacionService.showError('Error al cargar los datos del servidor.');
        }
        return EMPTY; 
      })
    ).subscribe(data => {
      this.reclamosSubject.next(data); 
    });
  }

  abrirModal(reclamo: IReclamo) {
    this.reclamoSeleccionado = reclamo;
  }

  cerrarModal() {
    this.reclamoSeleccionado = null;
  }

  guardarCambiosModal(nuevoEstado: 'Recibido' | 'En Proceso' | 'Finalizado') {
    if (!this.reclamoSeleccionado) return;

    const id = this.reclamoSeleccionado.id;
    console.log(`Intentando actualizar estado del ID: ${id} a ${nuevoEstado}`);
    
    this.actualizandoId = id; 
    this.cerrarModal();

    // 4. ¡USAMOS LA URL DEL ENVIRONMENT!
    const url = `${environment.apiUrl}/reclamos/${id}`;
    const body = { estado: nuevoEstado }; 

    const minTime = timer(1000); 

    const apiCall = this.http.patch<IReclamo>(url, body).pipe(
      tap(reclamoActualizado => {
        const listaActual = this.reclamosSubject.getValue();
        const index = listaActual.findIndex(r => r.id === id);
        if (index !== -1) {
          listaActual[index] = reclamoActualizado;
          this.reclamosSubject.next([...listaActual]);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error al actualizar estado:', error.message);
        this.notificacionService.showError('Error al actualizar el estado.');
        return of({ error }); 
      })
    );

    forkJoin({
      response: apiCall,
      timer: minTime
    })
    .pipe(
      finalize(() => {
        this.actualizandoId = null; 
        console.log(`Spinner apagado para ID: ${id}`);
      })
    )
    .subscribe(({ response }) => {
      if (!(response as any).error) {
        this.notificacionService.showSuccess('¡Estado actualizado!');
      }
    });
  }
}