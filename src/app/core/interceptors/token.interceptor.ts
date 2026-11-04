import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  const peticion = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((error: unknown) => {
      // Si una petición con token recibe 401, el token venció o es inválido:
      // se cierra la sesión y se vuelve al login.
      // En /auth/login un 401 significa "DNI o contraseña incorrectos", así que ahí no se toca la sesión.
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        token &&
        !req.url.endsWith('/auth/login')
      ) {
        auth.cerrarSesionVencida();
      }
      return throwError(() => error);
    })
  );
};
