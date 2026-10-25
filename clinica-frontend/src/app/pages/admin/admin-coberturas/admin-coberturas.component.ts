import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CoberturaService } from '../../../core/services/cobertura.service';
import { Cobertura } from '../../../models/cobertura.model';

@Component({
  selector: 'app-admin-coberturas',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './admin-coberturas.component.html',
  styleUrl: './admin-coberturas.component.css'
})
export class AdminCoberturasComponent implements OnInit {
  // FormBuilder crea el formulario y el servicio se encarga de hablar con la API.
  private fb = inject(FormBuilder);
  private coberturaService = inject(CoberturaService);

  // Estado que la pantalla muestra: datos, búsqueda, operaciones y mensajes.
  coberturas = signal<Cobertura[]>([]);
  filtro = signal('');
  cargando = signal(true);
  guardando = signal(false);
  eliminandoId = signal<number | null>(null);
  editandoId = signal<number | null>(null);
  errorMensaje = signal('');

  // Lista derivada de coberturas: cambia automáticamente al cambiar la lista
  // original o el texto de búsqueda.
  coberturasFiltradas = computed(() => {
    const termino = this.filtro().trim().toLocaleLowerCase();
    return this.coberturas().filter(cobertura =>
      cobertura.nombre.toLocaleLowerCase().includes(termino)
    );
  });

  // Formulario reactivo: el nombre es obligatorio, no puede ser solo espacios
  // y debe tener entre 2 y 100 caracteres.
  form = this.fb.nonNullable.group({
    nombre: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100),
      Validators.pattern(/\S/)
    ]]
  });

  ngOnInit(): void {
    // Al entrar a la pantalla, solicita el listado al backend.
    this.cargarCoberturas();
  }

  // Crea una cobertura nueva o guarda los cambios de la que se está editando.
  guardar(): void {
    if (this.form.invalid) {
      // Hace visibles todos los errores de validación del formulario.
      this.form.markAllAsTouched();
      return;
    }

    // Recorta espacios y decide entre POST (alta) y PUT (modificación).
    const nombre = this.form.controls.nombre.value.trim();
    const id = this.editandoId();
    this.errorMensaje.set('');
    this.guardando.set(true);

    const operacion = id === null
      ? this.coberturaService.crear(nombre)
      : this.coberturaService.actualizar(id, nombre);

    // subscribe ejecuta la petición HTTP y permite reaccionar al resultado.
    operacion.subscribe({
      next: () => {
        // Si salió bien, limpia el formulario y vuelve a consultar el listado.
        this.guardando.set(false);
        this.limpiarFormulario();
        this.cargarCoberturas();
      },
      error: (error: unknown) => {
        // Si el backend rechaza la operación, conserva la lista y muestra el error.
        this.guardando.set(false);
        this.errorMensaje.set(this.mensajeError(
          error,
          'No se pudo guardar la cobertura.'
        ));
      }
    });
  }

  // Copia los datos de la fila al formulario y activa el modo de edición.
  editar(cobertura: Cobertura): void {
    this.editandoId.set(cobertura.id);
    this.form.controls.nombre.setValue(cobertura.nombre);
    this.errorMensaje.set('');
  }

  // Sale del modo edición y deja el formulario vacío.
  cancelarEdicion(): void {
    this.limpiarFormulario();
  }

  // Lee el texto escrito en el campo de búsqueda y actualiza la señal del filtro.
  actualizarFiltro(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) this.filtro.set(input.value);
  }

  // Pide confirmación antes de solicitar la baja al backend.
  eliminar(cobertura: Cobertura): void {
    const confirmar = window.confirm(
      `¿Está seguro de eliminar la cobertura "${cobertura.nombre}"?`
    );
    if (!confirmar) return;

    this.errorMensaje.set('');
    this.eliminandoId.set(cobertura.id);

    this.coberturaService.eliminar(cobertura.id).subscribe({
      next: () => {
        // Solo recarga la tabla después de que el backend confirme la baja.
        this.eliminandoId.set(null);
        if (this.editandoId() === cobertura.id) this.limpiarFormulario();
        this.cargarCoberturas();
      },
      error: (error: unknown) => {
        // Si hay usuarios asociados u otro error, no altera la lista actual.
        this.eliminandoId.set(null);
        this.errorMensaje.set(this.mensajeError(
          error,
          'No se pudo eliminar la cobertura.'
        ));
      }
    });
  }

  // Consulta el listado y actualiza la pantalla cuando llega la respuesta.
  private cargarCoberturas(): void {
    this.cargando.set(true);
    this.coberturaService.listar().subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        if (!respuesta.datos) {
          this.errorMensaje.set(respuesta.estado || 'El backend no devolvió las coberturas.');
          return;
        }
        this.coberturas.set(respuesta.datos);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.errorMensaje.set(this.mensajeError(
          error,
          'No se pudieron cargar las coberturas.'
        ));
      }
    });
  }

  // Restablece el formulario y olvida qué registro se estaba modificando.
  private limpiarFormulario(): void {
    this.form.reset({ nombre: '' });
    this.editandoId.set(null);
    this.errorMensaje.set('');
  }

  // Prioriza el mensaje `estado` del backend; usa textos locales como alternativa.
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
