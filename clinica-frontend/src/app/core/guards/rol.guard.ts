import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const rolGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const rolesPermitidos: string[] = route.data['roles'] ?? [];
  const rolUsuario = auth.rol();

  if (!rolUsuario) {
    return router.createUrlTree(['/login']);
  }

  if (rolesPermitidos.includes(rolUsuario)) {
    return true;
  }

  return router.createUrlTree(['/acceso-denegado']);
};
