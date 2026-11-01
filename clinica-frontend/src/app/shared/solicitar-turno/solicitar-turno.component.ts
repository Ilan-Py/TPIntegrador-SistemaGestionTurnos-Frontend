import { Component, DestroyRef, OnInit, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of, catchError, map } from 'rxjs';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/services/auth.service';
import { EspecialidadService } from '../../core/services/especialidad.service';
import { SedeService } from '../../core/services/sede.service';
import { MedicoService } from '../../core/services/medico.service';
import { DisponibilidadService } from '../../core/services/disponibilidad.service';
import { TurnoService } from '../../core/services/turno.service';
import { mensajeError } from '../../core/utils/error.util';
import { aFechaISO, desdeFechaISO } from '../../core/utils/fecha.util';
import { Especialidad } from '../../models/especialidad.model';
import { Sede } from '../../models/sede.model';
import { Medico } from '../../models/medico.model';
import { PacienteTurno } from '../../models/paciente.model';
import { NuevoTurno } from '../../models/turno.model';

/** Datos del turno confirmado, para que la pantalla que usa el componente decida qué hacer. */
export interface TurnoConfirmado {
  id: number;
  especialidad: string;
  medico: string;
  sede: string;
  fecha: string;
  hora: string;
}

/**
 * Solicitud de turno paso a paso: especialidad → sede → médico → fecha → horario → nota y confirmación.
 * Cada paso filtra las opciones del siguiente.
 *
 * - Paciente: <app-solicitar-turno /> (el turno es para el usuario logueado).
 * - Operador: <app-solicitar-turno [paciente]="pacienteElegido" [sedeFija]="miSede" />
 */
@Component({
  selector: 'app-solicitar-turno',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  templateUrl: './solicitar-turno.component.html',
  styleUrl: './solicitar-turno.component.css'
})
export class SolicitarTurnoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private auth = inject(AuthService);
  private especialidadService = inject(EspecialidadService);
  private sedeService = inject(SedeService);
  private medicoService = inject(MedicoService);
  private disponibilidadService = inject(DisponibilidadService);
  private turnoService = inject(TurnoService);

  /** Paciente para el que se pide el turno. Si no se indica, es el usuario logueado. */
  paciente = input<PacienteTurno | null>(null);
  /** Si se indica, la sede no se elige (el operador asigna turnos solo en su sede). */
  sedeFija = input<number | null>(null);
  turnoConfirmado = output<TurnoConfirmado>();

  private stepper = viewChild.required<MatStepper>('stepper');

  // Opciones de cada paso
  especialidades = signal<Especialidad[]>([]);
  sedes = signal<Sede[]>([]);
  sedesConTurnos = signal<Set<number>>(new Set());
  medicos = signal<Medico[]>([]);
  fechas = signal<string[]>([]);
  horarios = signal<string[]>([]);
  duracion = signal(30);

  // Paciente propio (cuando no viene por input)
  pacientePropio = signal<PacienteTurno | null>(null);
  pacienteTurno = computed(() => this.paciente() ?? this.pacientePropio());

  // Estado
  cargando = signal<'inicio' | 'sedes' | 'medicos' | 'fechas' | 'horarios' | 'confirmando' | null>('inicio');
  errorMensaje = signal('');

  pasoEspecialidad = this.fb.group({ id_especialidad: [null as number | null, Validators.required] });
  pasoSede = this.fb.group({ id_sede: [null as number | null, Validators.required] });
  pasoMedico = this.fb.group({ id_medico: [null as number | null, Validators.required] });
  pasoFecha = this.fb.group({ fecha: [null as string | null, Validators.required] });
  pasoHorario = this.fb.group({ hora: [null as string | null, Validators.required] });
  pasoNota = this.fb.group({
    // turno.nota es varchar(55) en la base.
    nota: ['', [Validators.required, Validators.maxLength(55), Validators.pattern(/\S/)]]
  });

  // Fechas para el calendario: solo se pueden elegir las que tienen horarios libres.
  fechaSeleccionada = computed(() => {
    const fecha = this.valorFecha();
    return fecha ? desdeFechaISO(fecha) : null;
  });
  fechaMin = computed(() => (this.fechas().length ? desdeFechaISO(this.fechas()[0]) : null));
  fechaMax = computed(() => (this.fechas().length ? desdeFechaISO(this.fechas()[this.fechas().length - 1]) : null));
  filtroFechas = computed(() => {
    const disponibles = new Set(this.fechas());
    return (fecha: Date | null) => !!fecha && disponibles.has(aFechaISO(fecha));
  });
  private valorFecha = signal<string | null>(null);

  // Textos del resumen
  especialidadElegida = computed(() => this.especialidades().find(e => e.id === this.idEspecialidad()));
  sedeElegida = computed(() => this.sedes().find(s => s.id === this.idSede()));
  medicoElegido = computed(() => this.medicos().find(m => m.id === this.idMedico()));
  private idEspecialidad = signal<number | null>(null);
  private idSede = signal<number | null>(null);
  private idMedico = signal<number | null>(null);
  horaElegida = signal<string | null>(null);

  ngOnInit(): void {
    const sedeFija = this.sedeFija();
    if (sedeFija) {
      this.pasoSede.controls.id_sede.setValue(sedeFija);
      this.idSede.set(sedeFija);
    }

    forkJoin({
      especialidades: this.especialidadService.listar(),
      sedes: this.sedeService.listar(),
      perfil: this.paciente() ? of(null) : this.auth.perfil()
    }).subscribe({
      next: ({ especialidades, sedes, perfil }) => {
        this.especialidades.set(especialidades.datos ?? []);
        this.sedes.set(sedes.datos ?? []);
        if (perfil?.datos) {
          const u = perfil.datos;
          this.pacientePropio.set({ id: u.id, nombre: u.nombre, apellido: u.apellido, cobertura: u.cobertura ?? null });
        }
        this.cargando.set(null);
      },
      error: (err: unknown) => {
        this.cargando.set(null);
        this.errorMensaje.set(mensajeError(err, 'No se pudieron cargar las especialidades y sedes.'));
      }
    });

    // Cada cambio limpia los pasos siguientes y carga las opciones que dependen de él.
    this.pasoEspecialidad.controls.id_especialidad.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => {
        this.idEspecialidad.set(id);
        if (!this.sedeFija()) this.pasoSede.controls.id_sede.setValue(null);
        this.limpiarDesde('medico');
        if (id) {
          this.cargarSedesConTurnos(id);
          // Con sede fija la sede no cambia, así que los médicos se cargan acá.
          if (this.sedeFija()) this.cargarMedicos();
        }
      });

    this.pasoSede.controls.id_sede.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => {
        this.idSede.set(id);
        this.limpiarDesde('medico');
        if (id && this.idEspecialidad()) this.cargarMedicos();
      });

    this.pasoMedico.controls.id_medico.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => {
        this.idMedico.set(id);
        this.limpiarDesde('fecha');
        if (id) this.cargarFechas();
      });

    this.pasoFecha.controls.fecha.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(fecha => {
        this.valorFecha.set(fecha);
        this.limpiarDesde('horario');
        if (fecha) this.cargarHorarios();
      });

    this.pasoHorario.controls.hora.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(hora => this.horaElegida.set(hora));
  }

  elegirFecha(fecha: Date | null): void {
    this.pasoFecha.controls.fecha.setValue(fecha ? aFechaISO(fecha) : null);
  }

  confirmar(): void {
    const paciente = this.pacienteTurno();
    if (this.pasoNota.invalid || !paciente) {
      this.pasoNota.markAllAsTouched();
      return;
    }

    const datos: NuevoTurno = {
      id_especialidad: this.pasoEspecialidad.controls.id_especialidad.value!,
      id_sede: this.pasoSede.controls.id_sede.value!,
      id_medico: this.pasoMedico.controls.id_medico.value!,
      fecha: this.pasoFecha.controls.fecha.value!,
      hora: this.pasoHorario.controls.hora.value!,
      nota: this.pasoNota.controls.nota.value!.trim()
    };
    if (this.paciente()) datos.id_paciente = paciente.id;

    this.cargando.set('confirmando');
    this.errorMensaje.set('');

    this.turnoService.crear(datos).subscribe({
      next: (res) => {
        this.cargando.set(null);
        const medico = this.medicoElegido();
        this.turnoConfirmado.emit({
          id: res.datos?.id ?? 0,
          especialidad: this.especialidadElegida()?.descripcion ?? '',
          medico: medico ? `${medico.apellido}, ${medico.nombre}` : '',
          sede: this.sedeElegida()?.nombre ?? '',
          fecha: datos.fecha,
          hora: datos.hora
        });
        this.reiniciar();
      },
      error: (err: unknown) => {
        this.cargando.set(null);
        // Por ejemplo, el horario se ocupó mientras tanto: se informa y se vuelve a elegir horario.
        this.errorMensaje.set(mensajeError(err, 'No se pudo confirmar el turno.') + ' Elegí otro horario.');
        this.pasoHorario.controls.hora.setValue(null);
        this.cargarHorarios(true);
      }
    });
  }

  reiniciar(): void {
    this.stepper().reset();
    this.errorMensaje.set('');
    const sedeFija = this.sedeFija();
    if (sedeFija) this.pasoSede.controls.id_sede.setValue(sedeFija);
  }

  private cargarSedesConTurnos(idEspecialidad: number): void {
    const sedes = this.sedeFija() ? this.sedes().filter(s => s.id === this.sedeFija()) : this.sedes();
    if (sedes.length === 0) return;

    this.cargando.set('sedes');
    forkJoin(
      sedes.map(sede =>
        this.medicoService
          .listar({ id_especialidad: idEspecialidad, id_sede: sede.id, con_agenda: true })
          .pipe(
            map(res => ((res.datos ?? []).length > 0 ? sede.id : null)),
            catchError(() => of(null))
          )
      )
    ).subscribe(ids => {
      this.sedesConTurnos.set(new Set(ids.filter((id): id is number => id !== null)));
      this.cargando.set(null);
    });
  }

  private cargarMedicos(): void {
    const id_especialidad = this.pasoEspecialidad.controls.id_especialidad.value;
    const id_sede = this.pasoSede.controls.id_sede.value;
    if (!id_especialidad || !id_sede) return;

    this.cargando.set('medicos');
    this.medicoService.listar({ id_especialidad, id_sede, con_agenda: true }).subscribe({
      next: (res) => {
        this.cargando.set(null);
        this.medicos.set(res.datos ?? []);
      },
      error: (err: unknown) => {
        this.cargando.set(null);
        this.errorMensaje.set(mensajeError(err, 'No se pudieron cargar los médicos.'));
      }
    });
  }

  private cargarFechas(): void {
    this.cargando.set('fechas');
    this.disponibilidadService.fechas(this.consulta()).subscribe({
      next: (res) => {
        this.cargando.set(null);
        this.fechas.set(res.datos ?? []);
      },
      error: (err: unknown) => {
        this.cargando.set(null);
        this.errorMensaje.set(mensajeError(err, 'No se pudieron cargar las fechas disponibles.'));
      }
    });
  }

  /** Carga los horarios libres. Si venimos de un turno rechazado, vuelve al paso del horario (o de la fecha si ya no quedan). */
  private cargarHorarios(volverAlPaso = false): void {
    const fecha = this.pasoFecha.controls.fecha.value;
    if (!fecha) return;

    this.cargando.set('horarios');
    this.disponibilidadService.horarios(this.consulta(), fecha).subscribe({
      next: (res) => {
        this.cargando.set(null);
        this.horarios.set(res.datos?.horarios ?? []);
        this.duracion.set(res.datos?.duracion_minutos ?? 30);
        if (volverAlPaso) {
          if (this.horarios().length > 0) {
            this.stepper().selectedIndex = 4;
          } else {
            this.pasoFecha.controls.fecha.setValue(null);
            this.cargarFechas();
            this.stepper().selectedIndex = 3;
          }
        }
      },
      error: (err: unknown) => {
        this.cargando.set(null);
        this.errorMensaje.set(mensajeError(err, 'No se pudieron cargar los horarios.'));
      }
    });
  }

  private consulta() {
    return {
      id_medico: this.pasoMedico.controls.id_medico.value!,
      id_especialidad: this.pasoEspecialidad.controls.id_especialidad.value!,
      id_sede: this.pasoSede.controls.id_sede.value!
    };
  }

  private limpiarDesde(paso: 'medico' | 'fecha' | 'horario'): void {
    if (paso === 'medico') {
      this.medicos.set([]);
      this.pasoMedico.controls.id_medico.setValue(null, { emitEvent: false });
      this.idMedico.set(null);
    }
    if (paso === 'medico' || paso === 'fecha') {
      this.fechas.set([]);
      this.pasoFecha.controls.fecha.setValue(null, { emitEvent: false });
      this.valorFecha.set(null);
    }
    this.horarios.set([]);
    this.pasoHorario.controls.hora.setValue(null, { emitEvent: false });
    this.horaElegida.set(null);
  }
}
