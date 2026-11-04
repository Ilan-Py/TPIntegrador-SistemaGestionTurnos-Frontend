import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { EspecialidadService } from '../../../core/services/especialidad.service';
import { Especialidad } from '../../../models/especialidad.model';

@Component({
  selector: 'app-admin-especialidades',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './admin-especialidades.component.html',
  styleUrl: './admin-especialidades.component.css'
})
export class AdminEspecialidadesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private especialidadService = inject(EspecialidadService);

  especialidades = signal<Especialidad[]>([]);
  filtro = signal('');
  cargando = signal(true);
  guardando = signal(false);
  eliminandoId = signal<number | null>(null);
  editandoId = signal<number | null>(null);
  errorMensaje = signal('');

  especialidadesFiltradas = computed(() => {
    const termino = this.filtro().trim().toLocaleLowerCase();
    return this.especialidades().filter(especialidad =>
      especialidad.descripcion.toLocaleLowerCase().includes(termino)
    );
  });

  form = this.fb.nonNullable.group({
    descripcion: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100),
      Validators.pattern(/\S/)
    ]]
  });

  ngOnInit(): void {
    this.cargarEspecialidades();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const descripcion = this.form.controls.descripcion.value.trim();
    const id = this.editandoId();
    this.errorMensaje.set('');
    this.guardando.set(true);

    const operacion = id === null
      ? this.especialidadService.crear(descripcion)
      : this.especialidadService.actualizar(id, descripcion);

    operacion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.limpiarFormulario();
        this.cargarEspecialidades();
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        this.errorMensaje.set(this.mensajeError(
          error,
          'No se pudo guardar la especialidad.'
        ));
      }
    });
  }

  editar(especialidad: Especialidad): void {
    this.editandoId.set(especialidad.id);
    this.form.controls.descripcion.setValue(especialidad.descripcion);
    this.errorMensaje.set('');
  }

  cancelarEdicion(): void {
    this.limpiarFormulario();
  }

  actualizarFiltro(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) this.filtro.set(input.value);
  }

  eliminar(especialidad: Especialidad): void {
    const confirmar = window.confirm(
      `¿Está seguro de eliminar la especialidad "${especialidad.descripcion}"?`
    );
    if (!confirmar) return;

    this.errorMensaje.set('');
    this.eliminandoId.set(especialidad.id);

    this.especialidadService.eliminar(especialidad.id).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        if (this.editandoId() === especialidad.id) this.limpiarFormulario();
        this.cargarEspecialidades();
      },
      error: (error: unknown) => {
        this.eliminandoId.set(null);
        this.errorMensaje.set(this.mensajeError(
          error,
          'No se pudo eliminar la especialidad.'
        ));
      }
    });
  }

  private cargarEspecialidades(): void {
    this.cargando.set(true);
    this.especialidadService.listar().subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        if (!respuesta.datos) {
          this.errorMensaje.set(respuesta.estado || 'El backend no devolvió las especialidades.');
          return;
        }
        this.especialidades.set(respuesta.datos);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.errorMensaje.set(this.mensajeError(
          error,
          'No se pudieron cargar las especialidades.'
        ));
      }
    });
  }

  private limpiarFormulario(): void {
    this.form.reset({ descripcion: '' });
    this.editandoId.set(null);
    this.errorMensaje.set('');
  }

  private mensajeError(error: unknown, alternativo: string): string {
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

      if (error.status === 0) {
        return 'No se pudo conectar con el backend. Verificá que esté disponible.';
      }
    }

    return alternativo;
  }
}
