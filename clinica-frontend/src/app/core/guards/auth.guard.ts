import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.estaLogueado()) {
    const queryParams = auth.consumirSesionDescartada() ? { sesion: 'vencida' } : {};
    return router.createUrlTree(['/login'], { queryParams });
  }

  // El token sigue guardado pero ya venció: se cierra la sesión antes de entrar.
  if (auth.tokenVencido()) {
    auth.limpiarSesion();
    return router.createUrlTree(['/login'], { queryParams: { sesion: 'vencida' } });
  }

  return true;
};
