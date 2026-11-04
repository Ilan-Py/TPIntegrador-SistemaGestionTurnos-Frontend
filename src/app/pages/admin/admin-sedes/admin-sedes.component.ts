import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { SedeService } from '../../../core/services/sede.service';
import { Sede } from '../../../models/sede.model';

@Component({
  selector: 'app-admin-sedes',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './admin-sedes.component.html',
  styleUrl: './admin-sedes.component.css'
})
export class AdminSedesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private sedeService = inject(SedeService);

  sedes = signal<Sede[]>([]);
  filtro = signal('');
  cargando = signal(true);
  guardando = signal(false);
  eliminandoId = signal<number | null>(null);
  editandoId = signal<number | null>(null);
  errorMensaje = signal('');

  sedesFiltradas = computed(() => {
    const termino = this.filtro().trim().toLocaleLowerCase();
    return this.sedes().filter(sede =>
      sede.nombre.toLocaleLowerCase().includes(termino)
    );
  });

  form = this.fb.nonNullable.group({
    nombre: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100),
      Validators.pattern(/\S/)
    ]],
    direccion: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100),
      Validators.pattern(/\S/)
    ]],
    telefono: ['', [
      Validators.required,
      Validators.minLength(7),
      Validators.maxLength(15),
      Validators.pattern(/^(?=.*\d)[0-9+()\s-]+$/)
    ]]
  });

  ngOnInit(): void {
    this.cargarSedes();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const datos = {
      nombre: this.form.controls.nombre.value.trim(),
      direccion: this.form.controls.direccion.value.trim(),
      telefono: this.form.controls.telefono.value.trim()
    };
    const id = this.editandoId();
    this.errorMensaje.set('');
    this.guardando.set(true);

    const operacion = id === null
      ? this.sedeService.crear(datos)
      : this.sedeService.actualizar(id, datos);

    operacion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.limpiarFormulario();
        this.cargarSedes();
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        this.errorMensaje.set(this.mensajeError(error, 'No se pudo guardar la sede.'));
      }
    });
  }

  editar(sede: Sede): void {
    this.editandoId.set(sede.id);
    this.form.setValue({
      nombre: sede.nombre,
      direccion: sede.direccion,
      telefono: sede.telefono
    });
    this.errorMensaje.set('');
  }

  cancelarEdicion(): void {
    this.limpiarFormulario();
  }

  actualizarFiltro(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) this.filtro.set(input.value);
  }

  eliminar(sede: Sede): void {
    const confirmar = window.confirm(
      `¿Está seguro de eliminar la sede "${sede.nombre}"?`
    );
    if (!confirmar) return;

    this.errorMensaje.set('');
    this.eliminandoId.set(sede.id);

    this.sedeService.eliminar(sede.id).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        if (this.editandoId() === sede.id) this.limpiarFormulario();
        this.cargarSedes();
      },
      error: (error: unknown) => {
        this.eliminandoId.set(null);
        this.errorMensaje.set(this.mensajeError(error, 'No se pudo eliminar la sede.'));
      }
    });
  }

  private cargarSedes(): void {
    this.cargando.set(true);
    this.sedeService.listar().subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        if (!respuesta.datos) {
          this.errorMensaje.set(respuesta.estado || 'El backend no devolvió las sedes.');
          return;
        }
        this.sedes.set(respuesta.datos);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.errorMensaje.set(this.mensajeError(error, 'No se pudieron cargar las sedes.'));
      }
    });
  }

  private limpiarFormulario(): void {
    this.form.reset({ nombre: '', direccion: '', telefono: '' });
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
