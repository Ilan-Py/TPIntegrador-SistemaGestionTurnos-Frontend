import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormPacienteComponent, PacienteRegistrado } from '../../../shared/form-paciente/form-paciente.component';

@Component({
  selector: 'app-alta-paciente',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, FormPacienteComponent],
  template: `
    <h1 class="titulo-pagina">Alta de paciente</h1>
    <p class="subtitulo-pagina">Registrá un paciente nuevo con los mismos datos que el registro de la web.</p>

    @if (registrado(); as p) {
      <div class="exito-banner">
        <mat-icon>check_circle</mat-icon>
        <span>Se registró a <strong>{{ p.apellido }}, {{ p.nombre }}</strong> (DNI {{ p.dni }}).</span>
        <a mat-stroked-button routerLink="/operador/asignar-turno" [queryParams]="{ dni: p.dni }" class="accion-banner">
          <mat-icon>event</mat-icon> Asignarle un turno
        </a>
      </div>
    }

    <mat-card appearance="outlined" class="tarjeta">
      <mat-card-content>
        <app-form-paciente textoBoton="Registrar paciente" (registrado)="registrado.set($event)" />
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .tarjeta { max-width: 640px; padding: 8px; }
    .accion-banner { margin-left: auto; }
  `]
})
export class AltaPacienteComponent {
  registrado = signal<PacienteRegistrado | null>(null);
}
