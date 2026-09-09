import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router'; // ¡IMPORTANTE!

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule], // ¡AGREGAR!
  templateUrl: './footer.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './footer.scss'
})
export class FooterComponent {}