import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { CoberturaService } from '../../core/services/cobertura.service';
import { Cobertura } from '../../models/cobertura.model';

@Component({
  selector: 'app-registro',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private coberturaService = inject(CoberturaService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  coberturas = signal<Cobertura[]>([]);
  cargando = signal(false);
  errorMensaje = signal('');
  mostrarPassword = signal(false);
  fechaMax = new Date();

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,10}$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    fecha_nacimiento: [null as Date | null, Validators.required],
    id_cobertura: [null as number | null, Validators.required],
    telefono: ['']
  });

  ngOnInit(): void {
    this.coberturaService.listar().subscribe({
      next: (res) => {
        if (res.datos) this.coberturas.set(res.datos);
      },
      error: () => {
        this.errorMensaje.set('No se pudieron cargar las coberturas. Intentá más tarde.');
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
    const fechaStr = v.fecha_nacimiento
      ? new Date(v.fecha_nacimiento).toISOString().split('T')[0]
      : '';

    this.auth.registro({
      nombre: v.nombre!,
      apellido: v.apellido!,
      dni: v.dni!,
      email: v.email!,
      password: v.password!,
      fecha_nacimiento: fechaStr,
      id_cobertura: v.id_cobertura!,
      telefono: v.telefono || undefined
    }).subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.codigo === 201 || res.codigo === 200) {
          this.snackBar.open('Registro exitoso. Ahora podés iniciar sesión.', 'OK', {
            duration: 4000,
            panelClass: 'snack-success'
          });
          this.router.navigate(['/login']);
        } else {
          this.errorMensaje.set(res.estado ?? 'Error al registrarse.');
        }
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(
          err.error?.estado ?? 'Error al registrarse. Verificá los datos.'
        );
      }
    });
  }
}
