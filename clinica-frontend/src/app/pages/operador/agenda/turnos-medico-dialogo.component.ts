import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TurnoService } from '../../../core/services/turno.service';
import { mensajeError } from '../../../core/utils/error.util';
import { desdeFechaISO } from '../../../core/utils/fecha.util';
import { TurnoSede } from '../../../models/turno.model';
import { ConfirmarDialogoComponent } from '../../../shared/confirmar-dialogo/confirmar-dialogo.component';

export interface DatosTurnosMedicoDialogo {
  /** Fecha (YYYY-MM-DD). */
  fecha: string;
  medico: { id: number; nombre: string };
}

/** Turnos confirmados de un médico en la sede del operador para una fecha, con la opción de cancelarlos. */
@Component({
  selector: 'app-turnos-medico-dialogo',
  imports: [DatePipe, MatDialogModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>Turnos de {{ datos.medico.nombre }}</h2>
    <mat-dialog-content>
      <p class="fecha">{{ fecha | date: "EEEE d 'de' MMMM 'de' y" }} · solo turnos confirmados</p>

      @if (errorMensaje()) {
        <div class="error-banner"><mat-icon>error</mat-icon> {{ errorMensaje() }}</div>
      }

      @if (cargando()) {
        <div class="cargando-centro"><mat-spinner diameter="32" /></div>
      } @else if (turnos().length === 0) {
        <p class="estado-vacio">El médico no tiene turnos confirmados para esta fecha.</p>
      } @else {
        <table mat-table [dataSource]="turnos()" class="tabla">
          <ng-container matColumnDef="hora">
            <th mat-header-cell *matHeaderCellDef>Hora</th>
            <td mat-cell *matCellDef="let t">{{ t.hora }}</td>
          </ng-container>
          <ng-container matColumnDef="paciente">
            <th mat-header-cell *matHeaderCellDef>Paciente</th>
            <td mat-cell *matCellDef="let t">{{ t.paciente_apellido }}, {{ t.paciente_nombre }} <span class="dni">DNI {{ t.paciente_dni }}</span></td>
          </ng-container>
          <ng-container matColumnDef="especialidad">
            <th mat-header-cell *matHeaderCellDef>Especialidad</th>
            <td mat-cell *matCellDef="let t">{{ t.especialidad }}</td>
          </ng-container>
          <ng-container matColumnDef="nota">
            <th mat-header-cell *matHeaderCellDef>Motivo</th>
            <td mat-cell *matCellDef="let t">{{ t.nota }}</td>
          </ng-container>
          <ng-container matColumnDef="accion">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let t">
              <button mat-stroked-button color="warn" (click)="cancelar(t)" [disabled]="cancelandoId() === t.id">Cancelar</button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columnas"></tr>
          <tr mat-row *matRowDef="let row; columns: columnas"></tr>
        </table>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .fecha { color: #555; margin-top: 0; }
    .fecha::first-letter { text-transform: uppercase; }
    .tabla { width: 100%; }
    .dni { color: #777; font-size: 0.85rem; margin-left: 4px; }
  `]
})
export class TurnosMedicoDialogoComponent implements OnInit {
  private turnoService = inject(TurnoService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  datos = inject<DatosTurnosMedicoDialogo>(MAT_DIALOG_DATA);

  readonly columnas = ['hora', 'paciente', 'especialidad', 'nota', 'accion'];
  readonly fecha = desdeFechaISO(this.datos.fecha);

  turnos = signal<TurnoSede[]>([]);
  cargando = signal(true);
  cancelandoId = signal<number | null>(null);
  errorMensaje = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  cancelar(turno: TurnoSede): void {
    this.dialog
      .open(ConfirmarDialogoComponent, {
        data: {
          titulo: 'Cancelar turno',
          mensaje: `¿Está seguro de cancelar el turno de ${turno.paciente_apellido}, ${turno.paciente_nombre} a las ${turno.hora}?`,
          textoConfirmar: 'Cancelar turno'
        }
      })
      .afterClosed()
      .subscribe(confirmado => {
        if (!confirmado) return;
        this.cancelandoId.set(turno.id);
        this.errorMensaje.set('');
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
    this.cargando.set(true);
    this.turnoService.deSede(this.datos.fecha).subscribe({
      next: (res) => {
        this.cargando.set(false);
        this.turnos.set(
          (res.datos ?? [])
            .filter(t => t.id_medico === this.datos.medico.id && t.estado === 'confirmado')
            .sort((a, b) => a.hora.localeCompare(b.hora))
        );
      },
      error: (err: unknown) => {
        this.cargando.set(false);
        this.errorMensaje.set(mensajeError(err, 'No se pudieron cargar los turnos.'));
      }
    });
  }
}
