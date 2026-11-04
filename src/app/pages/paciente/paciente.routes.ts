import { Routes } from '@angular/router';

// Rutas de la sección paciente. La protección por sesión y rol está en app.routes.ts.
export const PACIENTE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'mis-turnos' },
  {
    path: 'nuevo-turno',
    loadComponent: () => import('./nuevo-turno/nuevo-turno.component').then(m => m.NuevoTurnoComponent)
  },
  {
    path: 'mis-turnos',
    loadComponent: () => import('./mis-turnos/mis-turnos.component').then(m => m.MisTurnosComponent)
  },
  {
    path: 'mis-datos',
    loadComponent: () => import('./mis-datos/mis-datos.component').then(m => m.MisDatosComponent)
  }
];
