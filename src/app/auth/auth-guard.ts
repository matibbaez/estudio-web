import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {

  const router = inject(Router); // Inyectamos el Router

  // 1. Chequeamos si el "sello" (token) existe en localStorage
  const token = localStorage.getItem('access_token');

  if (token) {
    // ¡PERFECTO! Tiene el sello. Dejalo pasar.
    return true;
  } else {
    // ¡NO TIENE SELLO!
    // console.log('AuthGuard: No hay token, redirigiendo a /login');

    // 2. Lo pateamos de vuelta al Login
    router.navigate(['/login']);
    return false; // No lo dejamos pasar
  }
};