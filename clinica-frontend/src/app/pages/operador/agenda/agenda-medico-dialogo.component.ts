import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AgendaService } from '../../../core/services/agenda.service';
import { mensajeError } from '../../../core/utils/error.util';
import { aFechaISO, desdeFechaISO, fechaDeApi } from '../../../core/utils/fecha.util';
import { Medico } from '../../../models/medico.model';
import { Agenda, DatosAgenda } from '../../../models/agenda.model';
import { ConfirmarDialogoComponent } from '../../../shared/confirmar-dialogo/confirmar-dialogo.component';

export interface DatosAgendaMedicoDialogo {
  /** Fecha inicial (YYYY-MM-DD). */
  fecha: string;
  /** Sede del operador: los rangos se cargan siempre en esta sede. */
  idSede: number;
  nombreSede: string;
  /** Médico a editar (ícono de lápiz). Si es null, se elige de la lista ("Nueva agenda"). */
  medico: Medico | null;
  medicos: Medico[];
}

/** La hora de salida tiene que ser posterior a la de entrada. */
function salidaPosterior(grupo: AbstractControl): ValidationErrors | null {
  const entrada = grupo.get('hora_entrada')?.value;
  const salida = grupo.get('hora_salida')?.value;
  return entrada && salida && salida <= entrada ? { salidaAnterior: true } : null;
}

/**
 * Agenda de un médico para una fecha en la sede del operador:
 * lista sus rangos horarios y permite agregar, modificar y eliminar.
 * Se cierra devolviendo true si hubo cambios.
 */
@Component({
  selector: 'app-agenda-medico-dialogo',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './agenda-medico-dialogo.component.html',
  styleUrl: './agenda-medico-dialogo.component.css'
})
export class AgendaMedicoDialogoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<AgendaMedicoDialogoComponent, boolean>);
  private agendaService = inject(AgendaService);
  datos = inject<DatosAgendaMedicoDialogo>(MAT_DIALOG_DATA);

  rangos = signal<Agenda[]>([]);
  cargando = signal(false);
  guardando = signal(false);
  errorMensaje = signal('');
  editandoId = signal<number | null>(null);
  private huboCambios = false;

  form = this.fb.group(
    {
      id_medico: [this.datos.medico?.id ?? (null as number | null), Validators.required],
      fecha: [desdeFechaISO(this.datos.fecha) as Date | null, Validators.required],
      id_especialidad: [null as number | null, Validators.required],
      hora_entrada: ['', Validators.required],
      hora_salida: ['', Validators.required]
    },
    { validators: salidaPosterior }
  );

  private idMedico = signal<number | null>(this.datos.medico?.id ?? null);
  medicoElegido = computed(() => this.datos.medicos.find(m => m.id === this.idMedico()) ?? this.datos.medico);
  titulo = computed(() => {
    const m = this.medicoElegido();
    return this.datos.medico && m ? `Agenda de ${m.apellido}, ${m.nombre}` : 'Nueva agenda';
  });

  ngOnInit(): void {
    this.form.controls.id_medico.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(id => {
      this.idMedico.set(id);
      this.cancelarEdicion();
      // Si el médico tiene una sola especialidad, se elige sola.
      const especialidades = this.medicoElegido()?.especialidades ?? [];
      this.form.controls.id_especialidad.setValue(especialidades.length === 1 ? especialidades[0].id : null);
      this.cargarRangos();
    });

    this.form.controls.fecha.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (!this.editandoId()) this.cargarRangos();
    });

    const especialidades = this.medicoElegido()?.especialidades ?? [];
    if (especialidades.length === 1) this.form.controls.id_especialidad.setValue(especialidades[0].id);
    this.cargarRangos();
  }

  descripcionEspecialidad(id: number): string {
    return this.medicoElegido()?.especialidades.find(e => e.id === id)?.descripcion ?? '';
  }

  editarRango(rango: Agenda): void {
    this.errorMensaje.set('');
    this.editandoId.set(rango.id);
    this.form.patchValue({
      fecha: desdeFechaISO(fechaDeApi(rango.fecha)),
      id_especialidad: rango.id_especialidad,
      hora_entrada: rango.hora_entrada,
      hora_salida: rango.hora_salida
    }, { emitEvent: false });
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.form.patchValue({ hora_entrada: '', hora_salida: '' }, { emitEvent: false });
    this.form.controls.hora_entrada.markAsUntouched();
    this.form.controls.hora_salida.markAsUntouched();
  }

  guardar(): void {
    this.errorMensaje.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const datos: DatosAgenda = {
      id_medico: v.id_medico!,
      fecha: aFechaISO(v.fecha!),
      id_especialidad: v.id_especialidad!,
      id_sede: this.datos.idSede,
      hora_entrada: v.hora_entrada!,
      hora_salida: v.hora_salida!
    };

    const id = this.editandoId();
    const operacion = id ? this.agendaService.actualizar(id, datos) : this.agendaService.crear(datos);

    this.guardando.set(true);
    operacion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.huboCambios = true;
        this.cancelarEdicion();
        this.cargarRangos();
      },
      error: (err: unknown) => {
        this.guardando.set(false);
        // Por ejemplo: rango superpuesto, o turnos confirmados que quedarían afuera.
        this.errorMensaje.set(mensajeError(err, 'No se pudo guardar el rango horario.'));
      }
    });
  }

  eliminarRango(rango: Agenda): void {
    this.dialog
      .open(ConfirmarDialogoComponent, {
        data: {
          titulo: 'Eliminar rango horario',
          mensaje: `¿Está seguro de eliminar el rango de ${rango.hora_entrada} a ${rango.hora_salida}?`,
          textoConfirmar: 'Eliminar'
        }
      })
      .afterClosed()
      .subscribe(confirmado => {
        if (!confirmado) return;
        this.errorMensaje.set('');
        this.agendaService.eliminar(rango.id).subscribe({
          next: () => {
            this.huboCambios = true;
            if (this.editandoId() === rango.id) this.cancelarEdicion();
            this.cargarRangos();
          },
          error: (err: unknown) => {
            // Por ejemplo: el rango tiene turnos confirmados.
            this.errorMensaje.set(mensajeError(err, 'No se pudo eliminar el rango horario.'));
          }
        });
      });
  }

  cerrar(): void {
    this.dialogRef.close(this.huboCambios);
  }

  private cargarRangos(): void {
    const idMedico = this.form.controls.id_medico.value;
    const fecha = this.form.controls.fecha.value;
    if (!idMedico || !fecha) {
      this.rangos.set([]);
      return;
    }

    this.cargando.set(true);
    this.agendaService.listar({ fecha: aFechaISO(fecha), id_sede: this.datos.idSede, id_medico: idMedico }).subscribe({
      next: (res) => {
        this.cargando.set(false);
        this.rangos.set((res.datos ?? []).sort((a, b) => a.hora_entrada.localeCompare(b.hora_entrada)));
      },
      error: (err: unknown) => {
        this.cargando.set(false);
        this.errorMensaje.set(mensajeError(err, 'No se pudo cargar la agenda del médico.'));
      }
    });
  }
}
