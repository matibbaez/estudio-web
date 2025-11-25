import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { CommonModule } from '@angular/common';
import { NotificacionComponent } from './components/notificacion/notificacion';
import { FooterComponent } from './components/footer/footer';
import { NotificacionService } from './services/notificacion';
import { fadeAnimation } from './animations';
import Lenis from 'lenis';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    NavbarComponent, 
    CommonModule, 
    NotificacionComponent,
    FooterComponent 
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  animations: [fadeAnimation]
})
export class AppComponent implements OnInit {
  public notificacionService = inject(NotificacionService);

  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }

  ngOnInit() {
    // 2. ¡INICIALIZAMOS EL SCROLL FLUIDO!
    const lenis = new Lenis({
      duration: 1.2, // Cuánto tarda en frenar (más alto = más suave)
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Matemáticas para la suavidad
      smoothWheel: true, // Activar para la ruedita
    });

    // 3. El loop de animación (necesario para que funcione)
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  }
}