import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { TurnoService } from '../../../core/services/turno.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { mensajeError } from '../../../core/utils/error.util';
import { aFechaISO, desdeFechaISO, fechaDeApi } from '../../../core/utils/fecha.util';
import { ConfirmarDialogoComponent } from '../../../shared/confirmar-dialogo/confirmar-dialogo.component';
import { TurnoPaciente } from '../../../models/turno.model';
import { RegistroHistorial } from '../../../models/historial.model';

interface TurnoVista extends TurnoPaciente {
  fechaLocal: Date;
  esProximo: boolean;
  historial: RegistroHistorial | null;
}

@Component({
  selector: 'app-mis-turnos',
  imports: [
    DatePipe,
    NgTemplateOutlet,
    RouterLink,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.css'
})
export class MisTurnosComponent implements OnInit {
  private auth = inject(AuthService);
  private turnoService = inject(TurnoService);
  private pacienteService = inject(PacienteService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  turnos = signal<TurnoVista[]>([]);
  cargando = signal(true);
  cancelandoId = signal<number | null>(null);
  errorMensaje = signal('');

  // Del más próximo al menos próximo: primero los que vienen (del más cercano al más lejano)
  // y después los anteriores (del más reciente al más antiguo).
  proximos = computed(() => this.turnos().filter(t => t.esProximo));
  anteriores = computed(() => this.turnos().filter(t => !t.esProximo));

  readonly etiquetaEstado: Record<string, string> = {
    confirmado: 'Confirmado',
    cancelado: 'Cancelado',
    atendido: 'Atendido'
  };

  readonly iconoEstado: Record<string, string> = {
    confirmado: 'event_available',
    cancelado: 'event_busy',
    atendido: 'task_alt'
  };

  ngOnInit(): void {
    this.cargar();
  }

  cancelar(turno: TurnoVista): void {
    const fecha = `${aFechaISO(turno.fechaLocal).split('-').reverse().join('/')} a las ${turno.hora}`;
    this.dialog
      .open(ConfirmarDialogoComponent, {
        data: {
          titulo: 'Cancelar turno',
          mensaje: `¿Está seguro de cancelar el turno del ${fecha} con ${turno.medico_apellido}, ${turno.medico_nombre}?`,
          textoConfirmar: 'Cancelar turno'
        }
      })
      .afterClosed()
      .subscribe(confirmado => {
        if (!confirmado) return;
        this.cancelandoId.set(turno.id);
        this.turnoService.cancelar(turno.id).subscribe({
          next: () => {
            this.cancelandoId.set(null);
            this.snackBar.open('Turno cancelado.', 'OK', { duration: 4000 });
            this.cargar();
          },
          error: (err: unknown) => {
            this.cancelandoId.set(null);
            this.errorMensaje.set(mensajeError(err, 'No se pudo cancelar el turno.'));
          }
        });
      });
  }

  private cargar(): void {
    const idPaciente = this.auth.usuario()?.id;
    if (!idPaciente) return;

    this.cargando.set(true);
    this.errorMensaje.set('');

    forkJoin({
      turnos: this.turnoService.misTurnos(),
      historial: this.pacienteService.historial(idPaciente)
    }).subscribe({
      next: ({ turnos, historial }) => {
        // El historial se asocia al turno por fecha y hora.
        const historialPorTurno = new Map<string, RegistroHistorial>();
        for (const h of historial.datos ?? []) {
          historialPorTurno.set(`${fechaDeApi(h.fecha_turno)} ${h.hora_turno}`, h);
        }

        const ahora = new Date();
        const ahoraTexto = `${aFechaISO(ahora)} ${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;

        const vista: TurnoVista[] = (turnos.datos ?? []).map(t => {
          const fecha = fechaDeApi(t.fecha);
          return {
            ...t,
            fechaLocal: desdeFechaISO(fecha),
            esProximo: `${fecha} ${t.hora}` >= ahoraTexto,
            historial: historialPorTurno.get(`${fecha} ${t.hora}`) ?? null
          };
        });

        const clave = (t: TurnoVista) => `${aFechaISO(t.fechaLocal)} ${t.hora}`;
        const proximos = vista.filter(t => t.esProximo).sort((a, b) => clave(a).localeCompare(clave(b)));
        const anteriores = vista.filter(t => !t.esProximo).sort((a, b) => clave(b).localeCompare(clave(a)));

        this.turnos.set([...proximos, ...anteriores]);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.cargando.set(false);
        this.errorMensaje.set(mensajeError(err, 'No se pudieron cargar tus turnos.'));
      }
    });
  }
}
