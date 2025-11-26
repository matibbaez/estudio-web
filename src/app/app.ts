import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router'; // IMPORTAR ROUTER
import { NavbarComponent } from './components/navbar/navbar';
import { CommonModule } from '@angular/common';
import { NotificacionComponent } from './components/notificacion/notificacion';
import { FooterComponent } from './components/footer/footer';
import { NotificacionService } from './services/notificacion';
import { fadeAnimation } from './animations';
import Lenis from 'lenis';
import { filter } from 'rxjs/operators'; // IMPORTAR FILTER

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
  private router = inject(Router); // INYECTAMOS EL ROUTER

  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }

  ngOnInit() {
    // 1. Configuración de Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    // 2. Loop de animación
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // 3. ¡LA MAGIA! DETECTAMOS CUANDO CAMBIA LA RUTA
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd) // Solo cuando terminó de navegar
    ).subscribe(() => {
      // Le decimos a Lenis: "Llevame arriba suavemente"
      // immediate: false fuerza la animación suave
      lenis.scrollTo(0, { immediate: false });
    });
  }
}