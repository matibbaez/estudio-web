import { trigger, transition, style, query, animate } from '@angular/animations';

export const fadeAnimation = trigger('routeAnimations', [
  transition('* <=> *', [
    // Cuando la página entra (:enter)
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }) // Empieza invisible y 20px abajo
    ], { optional: true }),

    // La animamos hacia su posición final
    query(':enter', [
      animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ], { optional: true })
  ])
]);