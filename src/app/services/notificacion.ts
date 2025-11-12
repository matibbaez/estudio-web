import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs'; // Usamos un BehaviorSubject para la lista

// Esta es la "forma" de una notificación
export interface Notificacion {
  id: number;
  mensaje: string;
  tipo: 'success' | 'error'; // Solo aceptamos éxito o error
  isFadingOut?: boolean; // Para la animación de salida
}

@Injectable({
  providedIn: 'root' // ¡Servicio global!
})
export class NotificacionService {

  // Un "array" reactivo que guarda las notificaciones activas
  private notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);
  public notificaciones$ = this.notificacionesSubject.asObservable();

  private idCounter = 0;

  constructor() { }

  // El método para mostrar un TOAST DE ÉXITO
  showSuccess(mensaje: string) {
    this.mostrarNotificacion(mensaje, 'success');
  }

  // El método para mostrar un TOAST DE ERROR
  showError(mensaje: string) {
    this.mostrarNotificacion(mensaje, 'error');
  }

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error') {
    const id = this.idCounter++;
    const nuevaNotificacion: Notificacion = { id, mensaje, tipo };

    // 1. Agregamos la nueva notificación a la lista
    const notificacionesActuales = [...this.notificacionesSubject.value, nuevaNotificacion];
    this.notificacionesSubject.next(notificacionesActuales);

    // --- La magia de la animación ---

    // 2. Después de 4 segundos, activamos la animación de "salida"
    setTimeout(() => {
      this.setFadeOut(id);
    }, 4000); // 4 segundos visible

    // 3. 500ms después (para que termine de irse), la borramos del array
    setTimeout(() => {
      this.removerNotificacion(id);
    }, 4500); // 4s + 0.5s de animación
  }

  // Pone la bandera de "isFadingOut" en true
  private setFadeOut(id: number) {
    const notificaciones = this.notificacionesSubject.value.map(n => 
      n.id === id ? { ...n, isFadingOut: true } : n
    );
    this.notificacionesSubject.next(notificaciones);
  }

  // La remueve 100% de la lista
  removerNotificacion(id: number) {
    const notificaciones = this.notificacionesSubject.value.filter(n => n.id !== id);
    this.notificacionesSubject.next(notificaciones);
  }
}