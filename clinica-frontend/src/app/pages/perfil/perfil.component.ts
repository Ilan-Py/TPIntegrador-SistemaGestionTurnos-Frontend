import { Component, inject, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../models/usuario.model';
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-perfil',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, MatDividerModule, SlicePipe],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {
  private auth = inject(AuthService);

  usuario = signal<Usuario | null>(null);
  cargando = signal(true);
  error = signal('');

  etiquetaRol: Record<string, string> = {
    administrador: 'Administrador',
    medico: 'Médico',
    operador: 'Operador',
    paciente: 'Paciente'
  };

  ngOnInit(): void {
    this.auth.perfil().subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.datos) this.usuario.set(res.datos);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('No se pudo cargar el perfil.');
      }
    });
  }
}
