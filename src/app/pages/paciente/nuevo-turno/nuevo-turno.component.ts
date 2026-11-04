import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SolicitarTurnoComponent, TurnoConfirmado } from '../../../shared/solicitar-turno/solicitar-turno.component';
import { desdeFechaISO } from '../../../core/utils/fecha.util';

@Component({
  selector: 'app-nuevo-turno',
  imports: [SolicitarTurnoComponent],
  providers: [DatePipe],
  template: `
    <h1 class="titulo-pagina">Nuevo turno</h1>
    <p class="subtitulo-pagina">Elegí la especialidad, la sede, el médico y el horario que prefieras.</p>
    <app-solicitar-turno (turnoConfirmado)="onConfirmado($event)" />
  `
})
export class NuevoTurnoComponent {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private datePipe = inject(DatePipe);

  onConfirmado(turno: TurnoConfirmado): void {
    const fecha = this.datePipe.transform(desdeFechaISO(turno.fecha), "EEEE dd/MM");
    this.snackBar.open(`Turno confirmado: ${fecha} a las ${turno.hora} con ${turno.medico}.`, 'OK', {
      duration: 5000,
      panelClass: 'snack-success'
    });
    this.router.navigate(['/paciente/mis-turnos']);
  }
}
