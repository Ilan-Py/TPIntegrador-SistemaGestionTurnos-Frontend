import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../core/services/auth.service';
import { EspecialidadService } from '../../../core/services/especialidad.service';
import { HorarioService } from '../../../core/services/horario.service';
import { SedeService } from '../../../core/services/sede.service';
import { Especialidad } from '../../../models/especialidad.model';
import { DatosHorarioMedico, HorarioMedico } from '../../../models/horario.model';
import { Sede } from '../../../models/sede.model';

function rangoHorarioValido(control: AbstractControl): ValidationErrors | null {
  const entrada = control.get('hora_entrada')?.value as string | undefined;
  const salida = control.get('hora_salida')?.value as string | undefined;
  return entrada && salida && salida <= entrada ? { rangoHorario: true } : null;
}

function fechaLocalActual(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

@Component({
  selector: 'app-medico-agenda',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './medico-agenda.component.html',
  styleUrl: './medico-agenda.component.css'
})
export class MedicoAgendaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private horarioService = inject(HorarioService);
  private especialidadService = inject(EspecialidadService);
  private sedeService = inject(SedeService);

  readonly usuario = this.auth.usuario;
  readonly fechaSeleccionada = signal(fechaLocalActual());
  readonly horarios = signal<HorarioMedico[]>([]);
  readonly especialidades = signal<Especialidad[]>([]);
  readonly sedes = signal<Sede[]>([]);
  readonly cargandoAgenda = signal(false);
  readonly guardando = signal(false);
  readonly eliminandoId = signal<number | null>(null);
  readonly cargandoCatalogos = signal(true);
  readonly editandoId = signal<number | null>(null);
  readonly errorMensaje = signal('');
  readonly mensajeCatalogos = signal('');
  readonly nombreMedico = computed(() => {
    const usuario = this.usuario();
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Médico';
  });

  readonly form = this.fb.nonNullable.group({
    fecha: [fechaLocalActual(), Validators.required],
    hora_entrada: ['', Validators.required],
    hora_salida: ['', Validators.required],
    id_especialidad: [0, [Validators.required, Validators.min(1)]],
    id_sede: [0, [Validators.required, Validators.min(1)]]
  }, { validators: rangoHorarioValido });

  ngOnInit(): void {
    this.cargarAgenda(this.fechaSeleccionada());
    this.auth.perfil().subscribe({
      next: respuesta => {
        if (!respuesta.datos) {
          this.mensajeCatalogos.set(respuesta.estado || 'No se pudieron actualizar los datos del médico.');
        }
        this.cargarCatalogos();
      },
      error: (error: unknown) => {
        this.mensajeCatalogos.set(this.mensajeError(error, 'No se pudieron actualizar los datos del médico.'));
        this.cargarCatalogos();
      }
    });
  }

  cambiarFecha(fecha: string): void {
    if (!fecha) return;
    this.fechaSeleccionada.set(fecha);
    this.form.controls.fecha.setValue(fecha);
    this.cargarAgenda(fecha);
  }

  cambiarFechaDesdeEvento(evento: Event): void {
    const entrada = evento.target;
    if (entrada instanceof HTMLInputElement) this.cambiarFecha(entrada.value);
  }

  nombreEspecialidad(id: number): string {
    return this.especialidades().find(especialidad => especialidad.id === id)?.descripcion
      ?? 'Especialidad';
  }

  nombreSede(id: number): string {
    return this.sedes().find(sede => sede.id === id)?.nombre ?? 'Sede';
  }

  editar(horario: HorarioMedico): void {
    this.editandoId.set(horario.id);
    this.errorMensaje.set('');
    const fecha = horario.fecha.slice(0, 10);
    this.fechaSeleccionada.set(fecha);
    this.form.setValue({
      fecha,
      hora_entrada: horario.hora_entrada.slice(0, 5),
      hora_salida: horario.hora_salida.slice(0, 5),
      id_especialidad: horario.id_especialidad,
      id_sede: horario.id_sede
    });
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.limpiarFormulario();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valor = this.form.getRawValue();
    const datos: DatosHorarioMedico = {
      fecha: valor.fecha,
      hora_entrada: valor.hora_entrada,
      hora_salida: valor.hora_salida,
      id_especialidad: valor.id_especialidad,
      id_sede: valor.id_sede
    };
    const id = this.editandoId();
    this.errorMensaje.set('');
    this.guardando.set(true);

    const operacion = id === null
      ? this.horarioService.crear(datos)
      : this.horarioService.actualizar(id, datos);

    operacion.subscribe({
      next: respuesta => {
        this.guardando.set(false);
        if (!respuesta.datos) {
          this.errorMensaje.set(respuesta.estado || 'No se pudo guardar el rango horario.');
          return;
        }
        this.fechaSeleccionada.set(datos.fecha);
        this.limpiarFormulario();
        this.cargarAgenda(datos.fecha);
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        this.errorMensaje.set(this.mensajeError(error, 'No se pudo guardar el rango horario.'));
      }
    });
  }

  eliminar(horario: HorarioMedico): void {
    const confirmar = window.confirm('¿Querés eliminar este rango horario?');
    if (!confirmar) return;

    this.errorMensaje.set('');
    this.eliminandoId.set(horario.id);
    this.horarioService.eliminar(horario.id).subscribe({
      next: respuesta => {
        this.eliminandoId.set(null);
        if (!respuesta.datos) {
          this.errorMensaje.set(respuesta.estado || 'No se pudo eliminar el rango horario.');
          return;
        }
        this.cargarAgenda(this.fechaSeleccionada());
      },
      error: (error: unknown) => {
        this.eliminandoId.set(null);
        this.errorMensaje.set(this.mensajeError(error, 'No se pudo eliminar el rango horario.'));
      }
    });
  }

  private cargarCatalogos(): void {
    const usuario = this.usuario();
    const idsEspecialidades = Array.isArray(usuario?.id_especialidades)
      ? usuario.id_especialidades.map(Number).filter(Number.isInteger)
      : [];
    const nombresEspecialidades = Array.isArray(usuario?.especialidades)
      ? usuario.especialidades
        .filter((nombre): nombre is string => typeof nombre === 'string')
        .map(nombre => this.normalizarTexto(nombre))
      : [];
    let respuestasPendientes = 2;
    const finalizarCarga = (): void => {
      respuestasPendientes--;
      if (respuestasPendientes === 0) this.cargandoCatalogos.set(false);
    };

    this.especialidadService.listar().subscribe({
      next: respuesta => {
        if (respuesta.datos) {
          let especialidadesMedico = respuesta.datos.filter(especialidad =>
            idsEspecialidades.includes(Number(especialidad.id)) ||
            nombresEspecialidades.includes(this.normalizarTexto(especialidad.descripcion))
          );
          // Si el perfil no incluye asociaciones y el catálogo tiene una sola opción, no hay otra especialidad para ofrecer.
          if (especialidadesMedico.length === 0 && idsEspecialidades.length === 0 &&
            nombresEspecialidades.length === 0 && respuesta.datos.length === 1) {
            especialidadesMedico = respuesta.datos;
          }
          this.especialidades.set(especialidadesMedico);
          if (especialidadesMedico.length === 1) {
            this.form.controls.id_especialidad.setValue(Number(especialidadesMedico[0].id));
          }
          if (especialidadesMedico.length === 0) {
            this.mensajeCatalogos.set('Tu usuario no tiene especialidades asignadas.');
          } else {
            this.mensajeCatalogos.set('');
          }
        } else {
          this.mensajeCatalogos.set(respuesta.estado || 'No se pudieron cargar tus especialidades.');
        }
        finalizarCarga();
      },
      error: (error: unknown) => {
        this.mensajeCatalogos.set(this.mensajeError(error, 'No se pudieron cargar tus especialidades.'));
        finalizarCarga();
      }
    });

    this.sedeService.listar().subscribe({
      next: respuesta => {
        if (respuesta.datos) {
          this.sedes.set(respuesta.datos);
          const sedeInicial = this.sedeInicial();
          if (sedeInicial) this.form.controls.id_sede.setValue(sedeInicial);
        } else {
          this.mensajeCatalogos.update(mensaje =>
            [mensaje, respuesta.estado || 'No se pudieron cargar las sedes.'].filter(Boolean).join(' ')
          );
        }
        finalizarCarga();
      },
      error: (error: unknown) => {
        this.mensajeCatalogos.update(mensaje =>
          [mensaje, this.mensajeError(error, 'No se pudieron cargar las sedes.')].filter(Boolean).join(' ')
        );
        finalizarCarga();
      }
    });
  }

  private cargarAgenda(fecha: string): void {
    this.cargandoAgenda.set(true);
    this.errorMensaje.set('');
    this.horarioService.listar(fecha).subscribe({
      next: respuesta => {
        this.cargandoAgenda.set(false);
        if (respuesta.datos) {
          this.horarios.set(respuesta.datos);
        } else {
          this.horarios.set([]);
          this.errorMensaje.set(respuesta.estado || 'No se pudo cargar la agenda.');
        }
      },
      error: (error: unknown) => {
        this.cargandoAgenda.set(false);
        this.horarios.set([]);
        this.errorMensaje.set(this.mensajeError(error, 'No se pudo cargar la agenda.'));
      }
    });
  }

  private limpiarFormulario(): void {
    this.editandoId.set(null);
    this.form.reset({
      fecha: this.fechaSeleccionada(),
      hora_entrada: '',
      hora_salida: '',
      id_especialidad: 0,
      id_sede: this.sedeInicial()
    });
  }

  private sedeInicial(): number {
    const sedeAsignada = this.usuario()?.id_sede;
    if (sedeAsignada && this.sedes().some(sede => sede.id === sedeAsignada)) return sedeAsignada;
    return this.sedes().length === 1 ? this.sedes()[0].id : 0;
  }

  private normalizarTexto(texto: string): string {
    return texto.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  }

  private mensajeError(error: unknown, alternativo: string): string {
    if (error instanceof HttpErrorResponse) {
      const payload: unknown = error.error;
      if (typeof payload === 'object' && payload !== null && 'estado' in payload) {
        const estado = (payload as { estado?: unknown }).estado;
        if (typeof estado === 'string' && estado.trim()) return estado;
      }
    }
    return alternativo;
  }
}
