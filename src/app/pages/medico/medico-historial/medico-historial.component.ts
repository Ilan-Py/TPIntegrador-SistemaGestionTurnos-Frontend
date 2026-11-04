import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { HistorialClinicoService } from '../../../core/services/historial-clinico.service';
import { PacienteBusqueda, RegistroHistorialClinico } from '../../../models/historial-clinico.model';

@Component({
  selector: 'app-medico-historial',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './medico-historial.component.html',
  styleUrl: './medico-historial.component.css'
})
export class MedicoHistorialComponent {
  private fb = inject(FormBuilder);
  private historialService = inject(HistorialClinicoService);

  readonly form = this.fb.nonNullable.group({
    criterio: ['dni' as 'dni' | 'apellido', Validators.required],
    valor: ['', Validators.required]
  });
  readonly pacientes = signal<PacienteBusqueda[]>([]);
  readonly pacienteSeleccionado = signal<PacienteBusqueda | null>(null);
  readonly registros = signal<RegistroHistorialClinico[]>([]);
  readonly buscando = signal(false);
  readonly cargandoHistorial = signal(false);
  readonly errorMensaje = signal('');
  readonly mensajeResultados = signal('');

  buscar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { criterio, valor } = this.form.getRawValue();
    const consulta = valor.trim();
    if (criterio === 'dni' && !/^\d+$/.test(consulta)) {
      this.errorMensaje.set('El DNI debe contener solo números.');
      return;
    }
    if (criterio === 'apellido' && consulta.length < 2) {
      this.errorMensaje.set('Ingresá al menos 2 letras del apellido.');
      return;
    }

    this.errorMensaje.set('');
    this.mensajeResultados.set('');
    this.pacienteSeleccionado.set(null);
    this.registros.set([]);
    this.buscando.set(true);
    this.historialService.buscarPacientes(criterio, consulta).subscribe({
      next: respuesta => {
        this.buscando.set(false);
        if (respuesta.datos) {
          this.pacientes.set(respuesta.datos);
          if (respuesta.datos.length === 0) {
            this.mensajeResultados.set('No se encontraron pacientes con ese criterio.');
          }
        } else {
          this.pacientes.set([]);
          this.errorMensaje.set(respuesta.estado || 'No se pudo completar la búsqueda.');
        }
      },
      error: (error: unknown) => {
        this.buscando.set(false);
        this.pacientes.set([]);
        this.errorMensaje.set(this.mensajeError(error, 'No se pudo completar la búsqueda.'));
      }
    });
  }

  seleccionarPaciente(paciente: PacienteBusqueda): void {
    this.pacienteSeleccionado.set(paciente);
    this.registros.set([]);
    this.errorMensaje.set('');
    this.cargandoHistorial.set(true);
    this.historialService.historialPaciente(paciente.id).subscribe({
      next: respuesta => {
        this.cargandoHistorial.set(false);
        if (respuesta.datos) {
          this.registros.set(respuesta.datos);
        } else {
          this.errorMensaje.set(respuesta.estado || 'No se pudo cargar el historial clínico.');
        }
      },
      error: (error: unknown) => {
        this.cargandoHistorial.set(false);
        this.errorMensaje.set(this.mensajeError(error, 'No se pudo cargar el historial clínico.'));
      }
    });
  }

  cambiarCriterio(): void {
    this.form.controls.valor.setValue('');
    this.form.controls.valor.markAsUntouched();
    this.errorMensaje.set('');
    this.pacientes.set([]);
    this.pacienteSeleccionado.set(null);
    this.registros.set([]);
    this.mensajeResultados.set('');
  }

  fechaLegible(fecha: string): string {
    const valor = fecha.slice(0, 10);
    const partes = valor.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : valor;
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
