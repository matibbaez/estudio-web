import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; // ¡Necesitamos CommonModule para *ngIf!

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule], // 2. Agregá CommonModule
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {

  // 1. Propiedad para saber si el menú móvil está abierto
  menuAbierto = false;

  // 2. Función para "togglear" el estado
  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  // 3. (Opcional pero pro) Función para cerrar el menú si se hace clic en un link
  cerrarMenu() {
    this.menuAbierto = false;
  }
}