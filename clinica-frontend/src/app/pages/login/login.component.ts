import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { normalizarRol } from '../../core/utils/rol.util';
import { mensajeError } from '../../core/utils/error.util';

// Asocia cada rol devuelto por el backend con la sección a la que debe entrar.
const rutaPorRol = {
  administrador: '/admin',
  medico: '/medico',
  operador: '/operador',
  paciente: '/paciente'
} as const;

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
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  cargando = signal(false);
  errorMensaje = signal('');
  mostrarPassword = signal(false);
  // Se muestra cuando el usuario llega al login porque su sesión venció.
  sesionVencida = signal(this.route.snapshot.queryParamMap.get('sesion') === 'vencida');

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
    this.sesionVencida.set(false);

    const { dni, password } = this.form.value;

    this.auth.login({ dni: dni!, password: password! }).subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.datos?.token) {
          // Normaliza el rol antes de buscar la ruta correspondiente.
          const rol = normalizarRol(res.datos.usuario.rol);
          // Si el rol no se reconoce, no intenta navegar con una ruta indefinida.
          const ruta = rol ? rutaPorRol[rol] : undefined;

          if (ruta) {
            // Redirige al usuario a la ruta definida para su rol.
            this.router.navigate([ruta]);
          } else {
            // Informa que el backend devolvió un rol sin ruta configurada.
            this.errorMensaje.set('El servidor devolvió un rol desconocido.');
          }
        } else {
          this.errorMensaje.set(res.estado ?? 'Error al iniciar sesión.');
        }
      },
      error: (err: unknown) => {
        this.cargando.set(false);
        this.errorMensaje.set(mensajeError(err, 'No se pudo iniciar sesión. Intentá nuevamente.'));
      }
    });
  }
}
