import { Routes } from '@angular/router';

// Rutas de la sección operador. La protección por sesión y rol está en app.routes.ts.
export const OPERADOR_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'agenda' },
  {
    path: 'agenda',
    loadComponent: () => import('./agenda/agenda-operador.component').then(m => m.AgendaOperadorComponent)
  },
  {
    path: 'alta-paciente',
    loadComponent: () => import('./alta-paciente/alta-paciente.component').then(m => m.AltaPacienteComponent)
  },
  {
    path: 'asignar-turno',
    loadComponent: () => import('./asignar-turno/asignar-turno.component').then(m => m.AsignarTurnoComponent)
  }
];
