import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { CommonModule } from '@angular/common'; // ¡Necesario para *ngFor y async!

// 1. Importar el servicio y el componente
import { NotificacionService } from './services/notificacion';
import { NotificacionComponent } from './components/notificacion/notificacion';

@Component({
  selector: 'app-root',
  standalone: true,
  // 2. Agregar CommonModule y NotificacionComponent
  imports: [RouterOutlet, NavbarComponent, CommonModule, NotificacionComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  // 3. Inyectar el servicio
  public notificacionService = inject(NotificacionService);
}