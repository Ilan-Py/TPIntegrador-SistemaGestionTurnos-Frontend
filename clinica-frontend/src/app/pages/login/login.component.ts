import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  cargando = signal(false);
  errorMensaje = signal('');
  mostrarPassword = signal(false);

  togglePassword(): void {
    this.mostrarPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set('');

    const { dni, password } = this.form.value;

    this.auth.login({ dni: dni!, password: password! }).subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.datos?.token) {
          this.router.navigate(['/']);
        } else {
          this.errorMensaje.set(res.estado ?? 'Error al iniciar sesión.');
        }
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(
          err.error?.estado ?? 'Credenciales inválidas. Verificá tu DNI y contraseña.'
        );
      }
    });
  }
}
