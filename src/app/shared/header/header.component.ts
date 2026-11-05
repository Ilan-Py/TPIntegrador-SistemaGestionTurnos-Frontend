import { Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
    DatePipe
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  auth = inject(AuthService);
  notifService = inject(NotificacionesService);

  estaLogueado = this.auth.estaLogueado;
  usuario = this.auth.usuario;
  rol = this.auth.rol;

  notificaciones = this.notifService.notificaciones;

  noLeidas = computed(() =>
    this.notificaciones().filter(n => n.leida !== true && n.leida !== 1).length
  );

  nombreCompleto = computed(() => {
    const u = this.usuario();
    return u ? `${u.nombre} ${u.apellido}` : '';
  });

  etiquetaRol = computed(() => {
    const roles: Record<string, string> = {
      administrador: 'Administrador',
      medico: 'Médico',
      operador: 'Operador',
      paciente: 'Paciente'
    };
    return roles[this.rol() ?? ''] ?? '';
  });

  iconoRol = computed(() => {
    const iconos: Record<string, string> = {
      administrador: 'admin_panel_settings',
      medico: 'medical_services',
      operador: 'support_agent',
      paciente: 'person'
    };
    return iconos[this.rol() ?? ''] ?? 'person';
  });

  menuItems = computed(() => {
    switch (this.rol()) {
      case 'administrador':
        return [
          { label: 'Panel Admin', ruta: '/admin' },
          { label: 'Sedes', ruta: '/admin/sedes' },
          { label: 'Especialidades', ruta: '/admin/especialidades' },
          { label: 'Coberturas', ruta: '/admin/coberturas' },
          { label: 'Usuarios', ruta: '/admin/usuarios' },
          { label: 'Auditoría', ruta: '/admin/auditoria' },
          { label: 'Reportes', ruta: '/admin/reportes' },
          { label: 'Mi Perfil', ruta: '/perfil' }
        ];
      case 'medico':
        return [
          { label: 'Panel médico', ruta: '/medico' },
          { label: 'Mi agenda', ruta: '/medico/agenda' },
          { label: 'Mis turnos', ruta: '/medico/turnos' },
          { label: 'Historial clínico', ruta: '/medico/historial' },
          { label: 'Mi perfil', ruta: '/perfil' }
        ];
      case 'operador':
        return [
          { label: 'Agenda y turnos', ruta: '/operador/agenda' },
          { label: 'Alta de paciente', ruta: '/operador/alta-paciente' },
          { label: 'Asignar turno', ruta: '/operador/asignar-turno' },
          { label: 'Mi Perfil', ruta: '/perfil' }
        ];
      case 'paciente':
        return [
          { label: 'Nuevo turno', ruta: '/paciente/nuevo-turno' },
          { label: 'Mis turnos', ruta: '/paciente/mis-turnos' },
          { label: 'Mis datos', ruta: '/paciente/mis-datos' }
        ];
      default:
        return [];
    }
  });

  constructor() {
    // Cargar notificaciones cuando el usuario inicia sesión; limpiar al cerrar
    effect(() => {
      if (this.estaLogueado()) {
        this.notifService.cargar();
      } else {
        this.notifService.limpiar();
      }
    });
  }

  marcarLeida(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.notifService.marcarLeida(id).subscribe();
  }

  esLeida(notif: { leida: boolean | number }): boolean {
    return notif.leida === true || notif.leida === 1;
  }

  logout(): void {
    this.auth.logout();
  }
}
