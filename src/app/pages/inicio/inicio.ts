import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // 1. Importar RouterModule

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterModule], // 2. Agregar a los imports
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss'
})
export class InicioComponent {
  // Lógica de bienvenida (si la necesitara)
}