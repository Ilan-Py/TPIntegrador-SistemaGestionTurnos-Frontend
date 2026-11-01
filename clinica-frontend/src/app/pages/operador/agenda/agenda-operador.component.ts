import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { AgendaService } from '../../../core/services/agenda.service';
import { SedeService } from '../../../core/services/sede.service';
import { MedicoService } from '../../../core/services/medico.service';
import { EspecialidadService } from '../../../core/services/especialidad.service';
import { mensajeError } from '../../../core/utils/error.util';
import { aFechaISO } from '../../../core/utils/fecha.util';
import { Sede } from '../../../models/sede.model';
import { Medico } from '../../../models/medico.model';
import { Especialidad } from '../../../models/especialidad.model';
import { Agenda } from '../../../models/agenda.model';
import { AgendaMedicoDialogoComponent, DatosAgendaMedicoDialogo } from './agenda-medico-dialogo.component';
import { TurnosMedicoDialogoComponent, DatosTurnosMedicoDialogo } from './turnos-medico-dialogo.component';

/** Una fila de la tabla: un médico con sus rangos horarios del día en la sede elegida. */
interface FilaAgenda {
  idMedico: number;
  medico: Medico | null;
  nombre: string;
  especialidades: string;
  rangos: Agenda[];
}

@Component({
  selector: 'app-agenda-operador',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './agenda-operador.component.html',
  styleUrl: './agenda-operador.component.css'
})
export class AgendaOperadorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private auth = inject(AuthService);
  private agendaService = inject(AgendaService);
  private sedeService = inject(SedeService);
  private medicoService = inject(MedicoService);
  private especialidadService = inject(EspecialidadService);

  miSede = computed(() => this.auth.usuario()?.id_sede ?? null);

  sedes = signal<Sede[]>([]);
  medicos = signal<Medico[]>([]);
  especialidades = signal<Especialidad[]>([]);
  filas = signal<FilaAgenda[]>([]);
  cargando = signal(true);
  errorMensaje = signal('');

  filtros = this.fb.nonNullable.group({
    fecha: [new Date()],
    id_sede: [this.miSede() ?? 0]
  });

  private sedeFiltro = signal(this.miSede());
  // Las acciones (nueva agenda, editar y ver turnos) solo están disponibles en la sede del operador.
  esMiSede = computed(() => this.sedeFiltro() === this.miSede());
  nombreSede = computed(() => this.sedes().find(s => s.id === this.sedeFiltro())?.nombre ?? '');
  columnas = computed(() =>
    this.esMiSede() ? ['medico', 'especialidad', 'horario', 'acciones'] : ['medico', 'especialidad', 'horario']
  );

  ngOnInit(): void {
    // Catálogos para mostrar nombres en lugar de ids (se cargan una vez).
    forkJoin({
      sedes: this.sedeService.listar(),
      medicos: this.medicoService.listar(),
      especialidades: this.especialidadService.listar()
    }).subscribe({
      next: ({ sedes, medicos, especialidades }) => {
        this.sedes.set(sedes.datos ?? []);
        this.medicos.set(medicos.datos ?? []);
        this.especialidades.set(especialidades.datos ?? []);
        this.cargar();
      },
      error: (err: unknown) => {
        this.cargando.set(false);
        this.errorMensaje.set(mensajeError(err, 'No se pudieron cargar los datos de la agenda.'));
      }
    });

    this.filtros.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.filtros.valid && this.filtros.controls.fecha.value) this.cargar();
    });
  }

  nuevaAgenda(): void {
    this.abrirAgenda(null);
  }

  editar(fila: FilaAgenda): void {
    this.abrirAgenda(fila.medico);
  }

  verTurnos(fila: FilaAgenda): void {
    const data: DatosTurnosMedicoDialogo = {
      fecha: this.fechaFiltro(),
      medico: { id: fila.idMedico, nombre: fila.nombre }
    };
    this.dialog.open(TurnosMedicoDialogoComponent, { data, width: '880px', maxWidth: '95vw' });
  }

  horario(rango: Agenda): string {
    const especialidad = this.especialidades().find(e => e.id === rango.id_especialidad)?.descripcion ?? '';
    return `${rango.hora_entrada} a ${rango.hora_salida} (${especialidad})`;
  }

  private abrirAgenda(medico: Medico | null): void {
    const sede = this.miSede();
    if (!sede) return;
    const data: DatosAgendaMedicoDialogo = {
      fecha: this.fechaFiltro(),
      idSede: sede,
      nombreSede: this.sedes().find(s => s.id === sede)?.nombre ?? '',
      medico,
      medicos: this.medicos()
    };
    this.dialog
      .open(AgendaMedicoDialogoComponent, { data, width: '720px' })
      .afterClosed()
      .subscribe(huboCambios => {
        if (huboCambios) this.cargar();
      });
  }

  private fechaFiltro(): string {
    return aFechaISO(this.filtros.controls.fecha.value);
  }

  private cargar(): void {
    const idSede = this.filtros.controls.id_sede.value;
    this.sedeFiltro.set(idSede);
    this.cargando.set(true);
    this.errorMensaje.set('');

    this.agendaService.listar({ fecha: this.fechaFiltro(), id_sede: idSede }).subscribe({
      next: (res) => {
        this.cargando.set(false);
        // Agrupa los rangos horarios por médico.
        const porMedico = new Map<number, Agenda[]>();
        for (const rango of res.datos ?? []) {
          porMedico.set(rango.id_medico, [...(porMedico.get(rango.id_medico) ?? []), rango]);
        }
        const filas: FilaAgenda[] = [...porMedico.entries()].map(([idMedico, rangos]) => {
          const medico = this.medicos().find(m => m.id === idMedico) ?? null;
          const especialidades = [...new Set(rangos.map(r => r.id_especialidad))]
            .map(id => this.especialidades().find(e => e.id === id)?.descripcion ?? '')
            .join(', ');
          return {
            idMedico,
            medico,
            nombre: medico ? `${medico.apellido}, ${medico.nombre}` : `Médico ${idMedico}`,
            especialidades,
            rangos: [...rangos].sort((a, b) => a.hora_entrada.localeCompare(b.hora_entrada))
          };
        });
        this.filas.set(filas.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      },
      error: (err: unknown) => {
        this.cargando.set(false);
        this.filas.set([]);
        this.errorMensaje.set(mensajeError(err, 'No se pudo cargar la agenda.'));
      }
    });
  }
}
