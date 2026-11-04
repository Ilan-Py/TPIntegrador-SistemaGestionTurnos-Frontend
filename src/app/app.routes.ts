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
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/admin/admin-home/admin-home').then(m => m.AdminHome)
      },
      {
        path: 'sedes',
        loadComponent: () => import('./pages/admin/admin-sedes/admin-sedes.component').then(m => m.AdminSedesComponent)
      },
      {
        path: 'especialidades',
        loadComponent: () => import('./pages/admin/admin-especialidades/admin-especialidades.component').then(m => m.AdminEspecialidadesComponent)
        },
      {
        path: 'coberturas',
        loadComponent: () => import('./pages/admin/admin-coberturas/admin-coberturas.component').then(m => m.AdminCoberturasComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/admin/admin-usuarios/admin-usuarios.component').then(m => m.AdminUsuariosComponent)
      },
      {
        path: 'auditoria',
        loadComponent: () => import('./pages/admin/admin-auditoria/admin-auditoria.component').then(m => m.AdminAuditoriaComponent)
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

  // Sección Operador (rutas en pages/operador/operador.routes.ts)
  {
    path: 'operador',
    canActivate: [authGuard, rolGuard],
    data: { roles: ['operador'] },
    loadChildren: () => import('./pages/operador/operador.routes').then(m => m.OPERADOR_ROUTES)
  },

  // Sección Paciente (rutas en pages/paciente/paciente.routes.ts)
  {
    path: 'paciente',
    canActivate: [authGuard, rolGuard],
    data: { roles: ['paciente'] },
    loadChildren: () => import('./pages/paciente/paciente.routes').then(m => m.PACIENTE_ROUTES)
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
