import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CoberturaService } from '../../../core/services/cobertura.service';
import { EspecialidadService } from '../../../core/services/especialidad.service';
import { SedeService } from '../../../core/services/sede.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Cobertura } from '../../../models/cobertura.model';
import { Especialidad } from '../../../models/especialidad.model';
import { Sede } from '../../../models/sede.model';
import {
  DatosUsuario,
  FiltrosUsuarios,
  RolUsuario,
  Usuario
} from '../../../models/usuario.model';

@Component({
  selector: 'app-admin-usuarios',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './admin-usuarios.component.html',
  styleUrl: './admin-usuarios.component.css'
})
export class AdminUsuariosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private sedeService = inject(SedeService);
  private especialidadService = inject(EspecialidadService);
  private coberturaService = inject(CoberturaService);

  usuarios = signal<Usuario[]>([]);
  sedes = signal<Sede[]>([]);
  especialidades = signal<Especialidad[]>([]);
  coberturas = signal<Cobertura[]>([]);
  pagina = signal(1);
  total = signal(0);
  totalPaginas = signal(0);
  cargando = signal(false);
  guardando = signal(false);
  editandoId = signal<number | null>(null);
  errorMensaje = signal('');
  mensajeCatalogos = signal('');

  readonly limite = 10;

  filtros = this.fb.nonNullable.group({
    nombre: '',
    apellido: '',
    rol: ['' as RolUsuario | ''],
    id_sede: ['' as number | '']
  });

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30), Validators.pattern(/\S/)]],
    apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30), Validators.pattern(/\S/)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(30)]],
    telefono: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[0-9+()\s-]{7,10}$/)]],
    fecha_nacimiento: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rol: ['operador' as RolUsuario, Validators.required],
    id_sede: this.fb.control<number | null>(null),
    id_cobertura: this.fb.control<number | null>(null),
    id_especialidades: this.fb.control<number[]>([])
  });

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarUsuarios();
    this.actualizarValidadoresRol();
  }

  buscar(): void {
    this.pagina.set(1);
    this.cargarUsuarios();
  }

  limpiarFiltros(): void {
    this.filtros.reset({ nombre: '', apellido: '', rol: '', id_sede: '' });
    this.buscar();
  }

  cambiarPagina(direccion: -1 | 1): void {
    const paginaSiguiente = this.pagina() + direccion;
    if (paginaSiguiente < 1 || paginaSiguiente > this.totalPaginas()) return;
    this.pagina.set(paginaSiguiente);
    this.cargarUsuarios();
  }

  actualizarCamposRol(): void {
    this.actualizarValidadoresRol();
  }

  editar(usuario: Usuario): void {
    this.editandoId.set(usuario.id);
    this.errorMensaje.set('');
    this.form.setValue({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni,
      email: usuario.email,
      telefono: usuario.telefono ?? '',
      fecha_nacimiento: usuario.fecha_nacimiento ?? '',
      password: '',
      rol: usuario.rol,
      id_sede: usuario.id_sede ?? null,
      id_cobertura: usuario.id_cobertura ?? null,
      id_especialidades: usuario.id_especialidades ?? []
    });
    this.actualizarValidadoresRol();
  }

  cancelarEdicion(): void {
    this.limpiarFormulario();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valor = this.form.getRawValue();
    const datos: DatosUsuario = {
      nombre: valor.nombre.trim(),
      apellido: valor.apellido.trim(),
      dni: valor.dni.trim(),
      email: valor.email.trim(),
      telefono: valor.telefono.trim(),
      fecha_nacimiento: valor.fecha_nacimiento,
      rol: valor.rol,
      id_sede: valor.rol === 'medico' || valor.rol === 'operador' ? valor.id_sede : null,
      id_cobertura: valor.rol === 'paciente' ? valor.id_cobertura : null,
      id_especialidades: valor.rol === 'medico' ? (valor.id_especialidades ?? []) : []
    };
    if (valor.password) datos.password = valor.password;

    this.errorMensaje.set('');
    this.guardando.set(true);
    const id = this.editandoId();
    const operacion = id === null
      ? this.usuarioService.crear(datos)
      : this.usuarioService.actualizar(id, datos);

    operacion.subscribe({
      next: () => {
        this.guardando.set(false);
        if (id === null) this.pagina.set(1);
        this.limpiarFormulario();
        this.cargarUsuarios();
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        this.errorMensaje.set(this.mensajeError(error, 'No se pudo guardar el usuario.'));
      }
    });
  }

  private cargarCatalogos(): void {
    this.sedeService.listar().subscribe({
      next: respuesta => {
        if (respuesta.datos) this.sedes.set(respuesta.datos);
        else this.mensajeCatalogos.set(respuesta.estado || 'No se pudieron cargar las sedes.');
      },
      error: (error: unknown) => this.mensajeCatalogos.set(this.mensajeError(error, 'No se pudieron cargar las sedes.'))
    });
    this.especialidadService.listar().subscribe({
      next: respuesta => {
        if (respuesta.datos) this.especialidades.set(respuesta.datos);
        else this.mensajeCatalogos.set(respuesta.estado || 'No se pudieron cargar las especialidades.');
      },
      error: (error: unknown) => this.mensajeCatalogos.set(this.mensajeError(error, 'No se pudieron cargar las especialidades.'))
    });
    this.coberturaService.listarPublicas().subscribe({
      next: respuesta => {
        if (respuesta.datos) this.coberturas.set(respuesta.datos);
        else this.mensajeCatalogos.set(respuesta.estado || 'No se pudieron cargar las coberturas.');
      },
      error: (error: unknown) => this.mensajeCatalogos.set(this.mensajeError(error, 'No se pudieron cargar las coberturas.'))
    });
  }

  private cargarUsuarios(): void {
    const valor = this.filtros.getRawValue();
    const filtros: FiltrosUsuarios = {
      nombre: valor.nombre,
      apellido: valor.apellido,
      rol: valor.rol,
      id_sede: valor.id_sede,
      pagina: this.pagina(),
      limite: this.limite
    };
    this.cargando.set(true);
    this.errorMensaje.set('');
    this.usuarioService.listar(filtros).subscribe({
      next: respuesta => {
        this.cargando.set(false);
        if (!respuesta.datos) {
          this.errorMensaje.set(respuesta.estado || 'El servidor no devolvió el listado de usuarios.');
          return;
        }
        this.usuarios.set(respuesta.datos.usuarios);
        this.total.set(respuesta.datos.total);
        this.totalPaginas.set(respuesta.datos.totalPaginas);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.errorMensaje.set(this.mensajeError(error, 'No se pudieron cargar los usuarios.'));
      }
    });
  }

  private actualizarValidadoresRol(): void {
    const rol = this.form.controls.rol.value;
    const requiereSede = rol === 'medico' || rol === 'operador';
    const requiereEspecialidad = rol === 'medico';

    this.form.controls.id_sede.setValidators(requiereSede ? Validators.required : []);
    this.form.controls.id_especialidades.setValidators(requiereEspecialidad ? Validators.required : []);
    this.form.controls.id_sede.updateValueAndValidity();
    this.form.controls.id_especialidades.updateValueAndValidity();

    if (!requiereSede) this.form.controls.id_sede.setValue(null);
    if (!requiereEspecialidad) this.form.controls.id_especialidades.setValue([]);
    if (rol !== 'paciente') this.form.controls.id_cobertura.setValue(null);

    if (this.editandoId() !== null) {
      this.form.controls.password.clearValidators();
      this.form.controls.password.setValidators(Validators.minLength(6));
    } else {
      this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    }
    this.form.controls.password.updateValueAndValidity();
  }

  private limpiarFormulario(): void {
    this.form.reset({
      nombre: '',
      apellido: '',
      dni: '',
      email: '',
      telefono: '',
      fecha_nacimiento: '',
      password: '',
      rol: 'operador',
      id_sede: null,
      id_cobertura: null,
      id_especialidades: []
    });
    this.editandoId.set(null);
    this.errorMensaje.set('');
    this.actualizarValidadoresRol();
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
      if (error.status === 0) return 'No se pudo conectar con el backend. Verificá que esté disponible.';
    }
    return alternativo;
  }
}
