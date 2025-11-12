import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notificacion } from '../../services/notificacion'; // Importamos la "forma"

@Component({
  selector: 'app-notificacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificacion.html',
  styleUrl: './notificacion.scss'
})
export class NotificacionComponent {
  // Recibimos la notificación completa
  @Input() notificacion!: Notificacion;

  // Creamos un evento para "avisar" que queremos cerrarla (con la 'X')
  @Output() close = new EventEmitter<number>();

  // Cuando tocan la 'X', emitimos nuestro ID
  onClose() {
    this.close.emit(this.notificacion.id);
  }
}