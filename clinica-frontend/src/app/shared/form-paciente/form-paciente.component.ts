import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { CoberturaService } from '../../core/services/cobertura.service';
import { Cobertura } from '../../models/cobertura.model';
import { mensajeError } from '../../core/utils/error.util';
import { aFechaISO } from '../../core/utils/fecha.util';

export interface PacienteRegistrado {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
}

/**
 * Formulario de alta de paciente. Lo usan el registro público (/registro)
 * y el alta de pacientes del operador, con los mismos datos y validaciones.
 */
@Component({
  selector: 'app-form-paciente',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './form-paciente.component.html',
  styleUrl: './form-paciente.component.css'
})
export class FormPacienteComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private coberturaService = inject(CoberturaService);

  textoBoton = input('Guardar');
  registrado = output<PacienteRegistrado>();

  coberturas = signal<Cobertura[]>([]);
  cargando = signal(false);
  errorMensaje = signal('');
  mostrarPassword = signal(false);
  fechaMax = new Date();

  form = this.fb.group({
    // Los máximos coinciden con el tamaño de las columnas de la base de datos.
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
    apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(30)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    fecha_nacimiento: [null as Date | null, Validators.required],
    id_cobertura: [null as number | null, Validators.required],
    telefono: ['', [Validators.maxLength(10), Validators.pattern(/^[0-9+()\s-]*$/)]]
  });

  ngOnInit(): void {
    this.coberturaService.listarPublicas().subscribe({
      next: (res) => {
        if (res.datos) this.coberturas.set(res.datos);
      },
      error: (err: unknown) => {
        this.errorMensaje.set(mensajeError(err, 'No se pudieron cargar las coberturas. Intentá más tarde.'));
      }
    });
  }

  togglePassword(): void {
    this.mostrarPassword.update(v => !v);
  }

  campo(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set('');

    const v = this.form.value;
    const fechaStr = v.fecha_nacimiento ? aFechaISO(new Date(v.fecha_nacimiento)) : '';
    const datos = {
      nombre: v.nombre!.trim(),
      apellido: v.apellido!.trim(),
      dni: v.dni!,
      email: v.email!.trim(),
      password: v.password!,
      fecha_nacimiento: fechaStr,
      id_cobertura: v.id_cobertura!,
      telefono: v.telefono?.trim() || undefined
    };

    this.auth.registro(datos).subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.codigo === 201 || res.codigo === 200) {
          this.registrado.emit({ id: res.datos?.id, nombre: datos.nombre, apellido: datos.apellido, dni: datos.dni });
          this.form.reset();
        } else {
          this.errorMensaje.set(res.estado ?? 'Error al registrar el paciente.');
        }
      },
      error: (err: unknown) => {
        this.cargando.set(false);
        this.errorMensaje.set(mensajeError(err, 'Error al registrar el paciente. Verificá los datos.'));
      }
    });
  }
}
