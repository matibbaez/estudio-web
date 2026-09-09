import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './card.scss'
})
export class CardComponent {
  @Input() titulo: string = ''; 
}