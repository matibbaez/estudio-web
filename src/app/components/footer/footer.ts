import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // ¡IMPORTANTE!

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule], // ¡AGREGAR!
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent {}