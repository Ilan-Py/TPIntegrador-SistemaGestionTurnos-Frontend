import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { CoberturaService } from '../../../core/services/cobertura.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { mensajeError } from '../../../core/utils/error.util';
import { Usuario } from '../../../models/usuario.model';
import { Cobertura } from '../../../models/cobertura.model';
import { CambiosPerfil } from '../../../models/paciente.model';

/** Valida que "repetir contraseña" coincida con la nueva contraseña (si se cargó una). */
function contrasenasCoinciden(grupo: AbstractControl): ValidationErrors | null {
  const password = grupo.get('password')?.value ?? '';
  const repetir = grupo.get('repetir')?.value ?? '';
  if (!password && !repetir) return null;
  return password === repetir ? null : { noCoinciden: true };
}

@Component({
  selector: 'app-mis-datos',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './mis-datos.component.html',
  styleUrl: './mis-datos.component.css'
})
export class MisDatosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private coberturaService = inject(CoberturaService);
  private pacienteService = inject(PacienteService);
  private snackBar = inject(MatSnackBar);

  perfil = signal<Usuario | null>(null);
  coberturas = signal<Cobertura[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  errorMensaje = signal('');
  infoMensaje = signal('');
  mostrarPassword = signal(false);

  // Solo se pueden modificar email, contraseña, teléfono y cobertura.
  form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email, Validators.maxLength(30)]],
      telefono: ['', [Validators.maxLength(10), Validators.pattern(/^[0-9+()\s-]*$/)]],
      id_cobertura: [0, Validators.required],
      password: ['', Validators.minLength(6)],
      repetir: ['']
    },
    { validators: contrasenasCoinciden }
  );

  ngOnInit(): void {
    this.cargar();
  }

  guardar(): void {
    this.infoMensaje.set('');
    this.errorMensaje.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const perfil = this.perfil();
    if (!perfil) return;

    // Se envían solo los campos que cambiaron.
    const v = this.form.getRawValue();
    const cambios: CambiosPerfil = {};
    if (v.email.trim() !== perfil.email) cambios.email = v.email.trim();
    if (v.telefono.trim() !== (perfil.telefono ?? '')) cambios.telefono = v.telefono.trim();
    if (v.id_cobertura !== perfil.id_cobertura) cambios.id_cobertura = v.id_cobertura;
    if (v.password) cambios.password = v.password;

    if (Object.keys(cambios).length === 0) {
      this.infoMensaje.set('No hay cambios para guardar.');
      return;
    }

    this.guardando.set(true);
    this.pacienteService.actualizarMisDatos(cambios).subscribe({
      next: () => {
        this.guardando.set(false);
        this.snackBar.open('Tus datos se actualizaron correctamente.', 'OK', {
          duration: 4000,
          panelClass: 'snack-success'
        });
        this.cargar();
      },
      error: (err: unknown) => {
        this.guardando.set(false);
        this.errorMensaje.set(mensajeError(err, 'No se pudieron guardar los cambios.'));
      }
    });
  }

  nombreCobertura(id: number | null | undefined): string {
    return this.coberturas().find(c => c.id === id)?.nombre ?? '—';
  }

  private cargar(): void {
    this.cargando.set(true);
    forkJoin({
      perfil: this.auth.perfil(),
      coberturas: this.coberturaService.listarPublicas()
    }).subscribe({
      next: ({ perfil, coberturas }) => {
        this.cargando.set(false);
        this.coberturas.set(coberturas.datos ?? []);
        const u = perfil.datos;
        if (!u) return;
        this.perfil.set(u);
        this.form.reset({
          email: u.email,
          telefono: u.telefono ?? '',
          id_cobertura: u.id_cobertura ?? 0,
          password: '',
          repetir: ''
        });
      },
      error: (err: unknown) => {
        this.cargando.set(false);
        this.errorMensaje.set(mensajeError(err, 'No se pudieron cargar tus datos.'));
      }
    });
  }
}
