import { Component, inject, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common'; 
import { Observable, EMPTY, BehaviorSubject, forkJoin, timer, of } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
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
  
  // Archivos viejos
  path_dni: string;
  path_recibo: string;
  path_alta_medica: string | null;
  path_form1: string;
  path_form2: string;
  
  // --- NUEVOS CAMPOS ---
  tipo_tramite: string;         
  subtipo_tramite?: string;    
  path_carta_documento?: string; 
  path_revoca_patrocinio?: string; 
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

  public filtroActual: string = '';

  constructor() {}

  ngOnInit(): void {
    this.cargarReclamos(); 
  }

  cargarReclamos(estado: string = '') {
    this.filtroActual = estado; // Guardamos el filtro actual
    
    // Armamos la URL con query param si hace falta
    let url = `${environment.apiUrl}/reclamos`;
    if (estado) {
      url += `?estado=${estado}`;
    }

    this.http.get<IReclamo[]>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al traer reclamos:', error.message);
        if (error.status === 401) {
          this.notificacionService.showError('Error: No estás autorizado.');
        } else {
          this.notificacionService.showError('Error al cargar los datos.');
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
    this.actualizandoId = id; 
    this.cerrarModal();
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
          
          // this.cargarReclamos(this.filtroActual);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.notificacionService.showError('Error al actualizar.');
        return of({ error }); 
      })
    );

    forkJoin({ response: apiCall, timer: minTime })
      .pipe(finalize(() => { this.actualizandoId = null; }))
      .subscribe(({ response }) => {
        if (!(response as any).error) {
          this.notificacionService.showSuccess('¡Estado actualizado!');
        }
      });
  }
}