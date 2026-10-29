import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import {
  FiltrosAuditoria,
  RegistroAuditoria
} from '../../../models/auditoria.model';

@Component({
  selector: 'app-admin-auditoria',
  imports: [
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './admin-auditoria.component.html',
  styleUrl: './admin-auditoria.component.css'
})
export class AdminAuditoriaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auditoriaService = inject(AuditoriaService);

  registros = signal<RegistroAuditoria[]>([]);
  pagina = signal(1);
  total = signal(0);
  totalPaginas = signal(0);
  cargando = signal(false);
  errorMensaje = signal('');

  readonly limite = 10;

  filtros = this.fb.nonNullable.group({
    usuario: '',
    entidad: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  ngOnInit(): void {
    this.cargarRegistros();
  }

  buscar(): void {
    const { fechaDesde, fechaHasta } = this.filtros.getRawValue();
    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      this.errorMensaje.set('La fecha desde no puede ser posterior a la fecha hasta.');
      return;
    }
    this.pagina.set(1);
    this.cargarRegistros();
  }

  actualizar(): void {
    this.cargarRegistros();
  }

  limpiarFiltros(): void {
    this.filtros.reset({ usuario: '', entidad: '', fechaDesde: '', fechaHasta: '' });
    this.pagina.set(1);
    this.cargarRegistros();
  }

  cambiarPagina(direccion: -1 | 1): void {
    const siguiente = this.pagina() + direccion;
    if (siguiente < 1 || siguiente > this.totalPaginas()) return;
    this.pagina.set(siguiente);
    this.cargarRegistros();
  }

  private cargarRegistros(): void {
    const valores = this.filtros.getRawValue();
    const filtros: FiltrosAuditoria = {
      ...valores,
      pagina: this.pagina(),
      limite: this.limite
    };

    this.cargando.set(true);
    this.errorMensaje.set('');
    this.auditoriaService.listar(filtros).subscribe({
      next: respuesta => {
        this.cargando.set(false);
        if (!respuesta.datos) {
          this.errorMensaje.set(respuesta.estado || 'El servidor no devolvió los registros de auditoría.');
          return;
        }
        this.registros.set(respuesta.datos.registros);
        this.pagina.set(respuesta.datos.pagina);
        this.total.set(respuesta.datos.total);
        this.totalPaginas.set(respuesta.datos.totalPaginas);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.errorMensaje.set(this.mensajeError(error));
      }
    });
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const payload: unknown = error.error;
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'estado' in payload &&
        typeof payload.estado === 'string'
      ) {
        return payload.estado;
      }
      if (error.status === 0) return 'No se pudo conectar con el backend. Verificá que esté disponible.';
    }
    return 'No se pudo cargar el registro de auditoría.';
  }
}
