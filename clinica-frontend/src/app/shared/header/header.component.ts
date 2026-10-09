import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  auth = inject(AuthService);

  estaLogueado = this.auth.estaLogueado;
  usuario = this.auth.usuario;
  rol = this.auth.rol;

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
          { label: 'Mi Perfil', ruta: '/perfil' }
        ];
      case 'medico':
        return [
          { label: 'Mis Turnos', ruta: '/medico' },
          { label: 'Mi Perfil', ruta: '/perfil' }
        ];
      case 'operador':
        return [
          { label: 'Gestión de Turnos', ruta: '/operador' },
          { label: 'Mi Perfil', ruta: '/perfil' }
        ];
      case 'paciente':
        return [
          { label: 'Mis Turnos', ruta: '/paciente' },
          { label: 'Mi Perfil', ruta: '/perfil' }
        ];
      default:
        return [];
    }
  });

  logout(): void {
    this.auth.logout();
  }
}
