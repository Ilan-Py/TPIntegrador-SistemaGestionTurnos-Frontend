import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../core/services/auth.service';
import { HorarioService } from '../../../core/services/horario.service';
import { SedeService } from '../../../core/services/sede.service';
import { TurnoService } from '../../../core/services/turno.service';
import { DatosHistorialClinico, TurnoMedico } from '../../../models/turno.model';
import { Sede } from '../../../models/sede.model';

function fechaLocalActual(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-medico-turnos',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './medico-turnos.component.html',
  styleUrl: './medico-turnos.component.css'
})
export class MedicoTurnosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private turnoService = inject(TurnoService);
  private horarioService = inject(HorarioService);
  private sedeService = inject(SedeService);

  readonly fechaSeleccionada = signal(fechaLocalActual());
  readonly sedeSeleccionada = signal<number | null>(null);
  readonly turnos = signal<TurnoMedico[]>([]);
  readonly sedes = signal<Sede[]>([]);
  readonly cargando = signal(false);
  readonly cargandoSedes = signal(true);
  readonly errorMensaje = signal('');
  readonly detalleAbiertoId = signal<number | null>(null);
  readonly formularioTurnoId = signal<number | null>(null);
  readonly enviando = signal(false);
  readonly mensajeFormulario = signal('');
  readonly turnoAtendidoId = signal<number | null>(null);

  readonly historialForm = this.fb.nonNullable.group({
    diagnostico: ['', [Validators.required, Validators.maxLength(255)]],
    tratamiento: ['', Validators.maxLength(255)],
    observaciones: ['', Validators.maxLength(255)]
  });

  readonly turnosOrdenados = computed(() => [...this.turnos()].sort((a, b) =>
    a.hora.localeCompare(b.hora)
  ));

  ngOnInit(): void {
    this.cargarSedes();
    this.cargarTurnos();
  }

  cambiarFecha(evento: Event): void {
    const entrada = evento.target;
    if (!(entrada instanceof HTMLInputElement) || !entrada.value) return;
    this.fechaSeleccionada.set(entrada.value);
    this.cargarTurnos();
  }

  cambiarSede(idSede: number | null): void {
    this.sedeSeleccionada.set(idSede);
    this.cargarTurnos();
  }

  alternarDetalle(idTurno: number): void {
    this.detalleAbiertoId.update(actual => actual === idTurno ? null : idTurno);
  }

  edad(fechaNacimiento: string | null): number | null {
    if (!fechaNacimiento) return null;
    const nacimiento = new Date(`${fechaNacimiento.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(nacimiento.getTime())) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const noCumplioAnios =
      hoy.getMonth() < nacimiento.getMonth() ||
      (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
    if (noCumplioAnios) edad--;
    return edad >= 0 ? edad : null;
  }

  abrirFormularioAtencion(turno: TurnoMedico): void {
    this.formularioTurnoId.set(turno.id);
    this.turnoAtendidoId.set(null);
    this.mensajeFormulario.set('');
    this.historialForm.reset({ diagnostico: '', tratamiento: '', observaciones: '' });
  }

  cerrarFormularioAtencion(): void {
    if (this.enviando() || this.turnoAtendidoId() !== null) return;
    this.formularioTurnoId.set(null);
    this.mensajeFormulario.set('');
  }

  guardarAtencion(turno: TurnoMedico): void {
    if (this.historialForm.invalid) {
      this.historialForm.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.mensajeFormulario.set('');
    if (this.turnoAtendidoId() === turno.id) {
      this.guardarHistorial(turno.id, this.historialForm.getRawValue());
      return;
    }

    this.turnoService.marcarAtendido(turno.id).subscribe({
      next: respuesta => {
        if (!respuesta.datos) {
          this.enviando.set(false);
          this.mensajeFormulario.set(respuesta.estado || 'No se pudo marcar el turno como atendido.');
          return;
        }
        this.turnoAtendidoId.set(turno.id);
        this.turnos.update(turnos => turnos.map(actual =>
          actual.id === turno.id ? { ...actual, estado: 'atendido' } : actual
        ));
        this.guardarHistorial(turno.id, this.historialForm.getRawValue());
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.mensajeFormulario.set(this.mensajeError(error, 'No se pudo marcar el turno como atendido.'));
      }
    });
  }

  cancelar(turno: TurnoMedico): void {
    if (!window.confirm(`¿Querés cancelar el turno de ${turno.paciente_nombre} ${turno.paciente_apellido} a las ${turno.hora.slice(0, 5)}?`)) {
      return;
    }

    this.errorMensaje.set('');
    this.turnoService.cancelar(turno.id).subscribe({
      next: respuesta => {
        if (!respuesta.datos) {
          this.errorMensaje.set(respuesta.estado || 'No se pudo cancelar el turno.');
          return;
        }
        this.turnos.update(turnos => turnos.filter(actual => actual.id !== turno.id));
      },
      error: (error: unknown) => {
        this.errorMensaje.set(this.mensajeError(error, 'No se pudo cancelar el turno.'));
      }
    });
  }

  private guardarHistorial(idTurno: number, datos: DatosHistorialClinico): void {
    this.turnoService.registrarHistorial(idTurno, datos).subscribe({
      next: respuesta => {
        this.enviando.set(false);
        if (!respuesta.datos) {
          this.mensajeFormulario.set(respuesta.estado || 'El turno fue atendido, pero no se pudo guardar el historial.');
          return;
        }
        this.formularioTurnoId.set(null);
        this.turnoAtendidoId.set(null);
        this.cargarTurnos();
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.mensajeFormulario.set(this.mensajeError(error, 'El turno fue atendido, pero no se pudo guardar el historial. Podés reintentar sin volver a marcarlo.'));
      }
    });
  }

  private cargarTurnos(): void {
    this.cargando.set(true);
    this.errorMensaje.set('');
    this.turnoService.listarMedico(this.fechaSeleccionada(), this.sedeSeleccionada()).subscribe({
      next: respuesta => {
        this.cargando.set(false);
        if (respuesta.datos) {
          this.turnos.set(respuesta.datos);
        } else {
          this.turnos.set([]);
          this.errorMensaje.set(respuesta.estado || 'No se pudieron cargar los turnos.');
        }
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.turnos.set([]);
        this.errorMensaje.set(this.mensajeError(error, 'No se pudieron cargar los turnos.'));
      }
    });
  }

  private cargarSedes(): void {
    this.horarioService.listar().subscribe({
      next: respuesta => {
        if (!respuesta.datos) {
          this.cargandoSedes.set(false);
          this.errorMensaje.set(respuesta.estado || 'No se pudieron cargar las sedes de atención.');
          return;
        }
        const idsAgendados = new Set(respuesta.datos.map(horario => Number(horario.id_sede)));
        const sedePrincipal = Number(this.auth.usuario()?.id_sede ?? 0);
        if (sedePrincipal) idsAgendados.add(sedePrincipal);

        this.sedeService.listar().subscribe({
          next: sedesRespuesta => {
            this.cargandoSedes.set(false);
            if (!sedesRespuesta.datos) {
              this.errorMensaje.set(sedesRespuesta.estado || 'No se pudieron cargar las sedes.');
              return;
            }
            this.sedes.set(sedesRespuesta.datos.filter(sede => idsAgendados.has(sede.id)));
          },
          error: (error: unknown) => {
            this.cargandoSedes.set(false);
            this.errorMensaje.set(this.mensajeError(error, 'No se pudieron cargar las sedes.'));
          }
        });
      },
      error: (error: unknown) => {
        this.cargandoSedes.set(false);
        this.errorMensaje.set(this.mensajeError(error, 'No se pudieron cargar tus sedes de atención.'));
      }
    });
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
