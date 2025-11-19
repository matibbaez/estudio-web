import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { CommonModule } from '@angular/common';
import { NotificacionService } from './services/notificacion';
import { NotificacionComponent } from './components/notificacion/notificacion';

// 1. ¡IMPORTAR FOOTER!
import { FooterComponent } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  // 2. ¡AGREGAR AL ARRAY DE IMPORTS!
  imports: [
    RouterOutlet, 
    NavbarComponent, 
    CommonModule, 
    NotificacionComponent,
    FooterComponent 
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  public notificacionService = inject(NotificacionService);
}