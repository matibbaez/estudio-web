import { Component, inject, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CardComponent } from '../../components/card/card';
import { CommonModule } from '@angular/common';
import { NotificacionService } from '../../services/notificacion';
// ¡CAMBIOS ACÁ! Importamos todo lo de RxJS
import { Observable, EMPTY, BehaviorSubject, forkJoin, timer, of } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import { GestionarReclamoModalComponent } from '../../components/gestionar-reclamo-modal/gestionar-reclamo-modal';

// La "forma" (IReclamo) la dejamos igual
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
  // 2. ¡AGREGAMOS EL MODAL A LOS IMPORTS!
  imports: [CommonModule, CardComponent, GestionarReclamoModalComponent],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboardComponent implements OnInit {

  private http = inject(HttpClient);
  private notificacionService = inject(NotificacionService);

  private reclamosSubject = new BehaviorSubject<IReclamo[]>([]);
  public reclamos$ = this.reclamosSubject.asObservable();
  
  public actualizandoId: string | null = null; // Para el spinner del botón

  // --- ¡NUEVAS VARIABLES PARA EL MODAL! ---
  public reclamoSeleccionado: IReclamo | null = null; // 3. El reclamo "activo"
  // ----------------------------------------

  constructor() {}

  ngOnInit(): void {
    // ... (Esta lógica de carga queda 100% igual)
    this.http.get<IReclamo[]>('http://localhost:3000/reclamos').pipe(
      catchError((error: HttpErrorResponse) => {
        this.notificacionService.showError('Error al cargar los datos del servidor.');
        return EMPTY; 
      })
    ).subscribe(data => {
      this.reclamosSubject.next(data);
    });
  }

  // ------------------------------------------------------------------
  // ¡LÓGICA ACTUALIZADA!
  // ------------------------------------------------------------------

  // 1. El botón "Gestionar" AHORA ABRE EL MODAL
  abrirModal(reclamo: IReclamo) {
    console.log('Abriendo modal para:', reclamo.codigo_seguimiento);
    this.reclamoSeleccionado = reclamo;
  }

  // 2. Esta función CIERRA el modal
  cerrarModal() {
    this.reclamoSeleccionado = null;
  }

  // 3. Esta función GUARDA (la que antes se llamaba 'actualizarEstado')
  guardarCambiosModal(nuevoEstado: 'Recibido' | 'En Proceso' | 'Finalizado') {
    if (!this.reclamoSeleccionado) return;

    const id = this.reclamoSeleccionado.id;
    console.log(`Intentando actualizar estado del ID: ${id} a ${nuevoEstado}`);
    
    this.actualizandoId = id; // 1. ¡Spinner ON!
    this.cerrarModal();

    const url = `http://localhost:3000/reclamos/${id}`;
    const body = { estado: nuevoEstado }; 

    // --- ¡LA LÓGICA DE TIEMPO MÍNIMO! ---
    // 1. Timer de 1 segundo (1000ms)
    const minTime = timer(1000); 

    // 2. Llamada a la API (con 'tap' para la magia reactiva)
    const apiCall = this.http.patch<IReclamo>(url, body).pipe(
      tap(reclamoActualizado => {
        // Actualizamos la lista "en caliente"
        const listaActual = this.reclamosSubject.getValue();
        const index = listaActual.findIndex(r => r.id === id);
        if (index !== -1) {
          listaActual[index] = reclamoActualizado;
          this.reclamosSubject.next([...listaActual]);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // Si falla, devolvemos el error
        console.error('Error al actualizar estado:', error.message);
        this.notificacionService.showError('Error al actualizar el estado.');
        return of({ error }); // Devolvemos el error para que forkJoin lo reciba
      })
    );

    // 3. Esperamos a que AMBOS terminen
    forkJoin({
      response: apiCall,
      timer: minTime
    })
    .pipe(
      // 4. finalize() se ejecuta SIEMPRE (éxito o error)
      finalize(() => {
        this.actualizandoId = null; // ¡Spinner OFF!
        console.log(`Spinner apagado para ID: ${id}`);
      })
    )
    .subscribe(({ response }) => {
      // 5. Solo mostramos el toast si la API NO falló
      if (!(response as any).error) {
        this.notificacionService.showSuccess('¡Estado actualizado!');
      }
    });
  }
}