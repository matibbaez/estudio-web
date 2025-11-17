import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {

  // 1. Obtenemos el "sello" (token) de localStorage
  const token = localStorage.getItem('access_token');

  // 2. Si el sello existe...
  if (token) {
    // 3. Clonamos la petición y le "adjuntamos" el encabezado
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}` // ¡El formato "Bearer"!
      }
    });

    // 4. Dejamos que la petición "clonada" (con el token) continúe
    return next(clonedReq);
  }

  // 5. Si no hay sello, dejamos pasar la petición original (para el login, etc.)
  return next(req);
};