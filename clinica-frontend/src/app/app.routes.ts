import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { rolGuard } from './core/guards/rol.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.component').then(m => m.RegistroComponent)
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.PerfilComponent)
  },

  // Sección Administrador
  {
    path: 'admin',
    canActivate: [authGuard, rolGuard],
    data: { roles: ['administrador'] },
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/en-construccion/en-construccion.component').then(m => m.EnConstruccionComponent)
      },
      {
        path: '**',
        loadComponent: () => import('./pages/en-construccion/en-construccion.component').then(m => m.EnConstruccionComponent)
      }
    ]
  },

  // Sección Médico
  {
    path: 'medico',
    canActivate: [authGuard, rolGuard],
    data: { roles: ['medico'] },
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/en-construccion/en-construccion.component').then(m => m.EnConstruccionComponent)
      },
      {
        path: '**',
        loadComponent: () => import('./pages/en-construccion/en-construccion.component').then(m => m.EnConstruccionComponent)
      }
    ]
  },

  // Sección Operador
  {
    path: 'operador',
    canActivate: [authGuard, rolGuard],
    data: { roles: ['operador'] },
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/en-construccion/en-construccion.component').then(m => m.EnConstruccionComponent)
      },
      {
        path: '**',
        loadComponent: () => import('./pages/en-construccion/en-construccion.component').then(m => m.EnConstruccionComponent)
      }
    ]
  },

  // Sección Paciente
  {
    path: 'paciente',
    canActivate: [authGuard, rolGuard],
    data: { roles: ['paciente'] },
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/en-construccion/en-construccion.component').then(m => m.EnConstruccionComponent)
      },
      {
        path: '**',
        loadComponent: () => import('./pages/en-construccion/en-construccion.component').then(m => m.EnConstruccionComponent)
      }
    ]
  },

  {
    path: 'acceso-denegado',
    loadComponent: () => import('./pages/acceso-denegado/acceso-denegado.component').then(m => m.AccesoDenegadoComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
