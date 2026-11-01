import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { mensajeError } from '../../../core/utils/error.util';
import { desdeFechaISO } from '../../../core/utils/fecha.util';
import { Paciente, PacienteTurno } from '../../../models/paciente.model';
import { SolicitarTurnoComponent, TurnoConfirmado } from '../../../shared/solicitar-turno/solicitar-turno.component';

@Component({
  selector: 'app-asignar-turno',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    SolicitarTurnoComponent
  ],
  templateUrl: './asignar-turno.component.html',
  styleUrl: './asignar-turno.component.css'
})
export class AsignarTurnoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private pacienteService = inject(PacienteService);

  // El operador asigna turnos solo en su sede.
  miSede = computed(() => this.auth.usuario()?.id_sede ?? null);

  resultados = signal<Paciente[] | null>(null);
  buscando = signal(false);
  errorMensaje = signal('');
  pacienteElegido = signal<PacienteTurno | null>(null);
  turnoAsignado = signal<(TurnoConfirmado & { paciente: string }) | null>(null);

  readonly columnas = ['paciente', 'dni', 'edad', 'cobertura', 'accion'];

  busqueda = this.fb.nonNullable.group({
    texto: ['', [Validators.required, Validators.pattern(/^(\d+|.*[A-Za-zÁÉÍÓÚáéíóúÑñ].*)$/)]]
  });

  ngOnInit(): void {
    // Si viene desde el alta de paciente, busca directamente por su DNI.
    const dni = this.route.snapshot.queryParamMap.get('dni');
    if (dni) {
      this.busqueda.controls.texto.setValue(dni);
      this.buscar();
    }
  }

  buscar(): void {
    if (this.busqueda.invalid) {
      this.busqueda.markAllAsTouched();
      return;
    }
    const texto = this.busqueda.controls.texto.value.trim();
    this.buscando.set(true);
    this.errorMensaje.set('');
    this.pacienteService.buscar(texto).subscribe({
      next: (res) => {
        this.buscando.set(false);
        const pacientes = res.datos ?? [];
        this.resultados.set(pacientes);
        // Si la búsqueda es un DNI exacto, lo elige directamente.
        const exacto = pacientes.find(p => p.dni === texto);
        if (exacto && pacientes.length === 1) this.elegir(exacto);
      },
      error: (err: unknown) => {
        this.buscando.set(false);
        this.errorMensaje.set(mensajeError(err, 'No se pudo buscar el paciente.'));
      }
    });
  }

  elegir(p: Paciente): void {
    this.turnoAsignado.set(null);
    this.pacienteElegido.set({ id: p.id, nombre: p.nombre, apellido: p.apellido, dni: p.dni, cobertura: p.cobertura });
  }

  cambiarPaciente(): void {
    this.pacienteElegido.set(null);
    this.turnoAsignado.set(null);
  }

  onConfirmado(turno: TurnoConfirmado): void {
    const p = this.pacienteElegido();
    this.turnoAsignado.set({ ...turno, paciente: p ? `${p.apellido}, ${p.nombre}` : '' });
  }

  fechaTurno(fecha: string): Date {
    return desdeFechaISO(fecha);
  }
}
