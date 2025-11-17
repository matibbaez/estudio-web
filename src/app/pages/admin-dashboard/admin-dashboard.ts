import { Component, inject, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CardComponent } from '../../components/card/card';
import { CommonModule } from '@angular/common'; 
import { NotificacionService } from '../../services/notificacion';
import { Observable, EMPTY } from 'rxjs'; 
import { catchError } from 'rxjs/operators'; 

export interface IReclamo {
  id: string;
  nombre: string;
  dni: string;
  email: string;
  codigo_seguimiento: string;
  estado: 'Recibido' | 'En Proceso' | 'Finalizado';
  fecha_creacion: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CardComponent], // (CommonModule es clave)
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboardComponent implements OnInit { // 4. Implementamos OnInit

  private http = inject(HttpClient);
  private notificacionService = inject(NotificacionService);

  // 5. ¡LA MAGIA! Creamos un Observable que va a "guardar" el stream de datos
  public reclamos$!: Observable<IReclamo[]>;

  constructor() {}

  ngOnInit(): void {
    // 6. Cuando el componente carga, llamamos a la API
    this.reclamos$ = this.http.get<IReclamo[]>('http://localhost:3000/reclamos').pipe(
      catchError((error: HttpErrorResponse) => {
        // 7. Si el "patovica" de NestJS nos rebota (token vencido, etc.)
        console.error('Error al traer reclamos:', error.message);
        if (error.status === 401) {
          this.notificacionService.showError('Error: No estás autorizado.');
          // (Acá podríamos redirigir al Login)
        } else {
          this.notificacionService.showError('Error al cargar los datos del servidor.');
        }
        return EMPTY; // Devolvemos un observable vacío para que no se rompa
      })
    );
  }

  // (Acá vamos a poner la lógica para el botón de "Actualizar Estado" después)
  actualizarEstado(id: string) {
    console.log(`TODO: Actualizar estado del ID: ${id}`);
    // (Próximamente...)
  }
}