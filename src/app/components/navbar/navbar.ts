import { Component, inject, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule], 
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent implements OnInit {

  private router = inject(Router);
  
  menuAbierto = false;
  usuarioLogueado = false; 

  ngOnInit() {
    this.verificarSesion();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.verificarSesion();
    });
  }

  verificarSesion() {
    if (typeof window !== 'undefined') {
      // ACÁ ESTABA EL CAMBIO: Ahora busca 'access_token'
      this.usuarioLogueado = !!localStorage.getItem('access_token'); 
    }
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu() {
    this.menuAbierto = false;
  }

  cerrarSesion() {
    this.cerrarMenu();
    // ACÁ TAMBIÉN: Borramos 'access_token'
    localStorage.removeItem('access_token'); 
    this.verificarSesion(); 
    this.router.navigate(['/login']); 
  }
}