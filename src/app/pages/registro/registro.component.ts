import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormPacienteComponent } from '../../shared/form-paciente/form-paciente.component';

@Component({
  selector: 'app-registro',
  imports: [RouterLink, MatCardModule, MatIconModule, FormPacienteComponent],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  onRegistrado(): void {
    this.snackBar.open('Registro exitoso. Ahora podés iniciar sesión.', 'OK', {
      duration: 4000,
      panelClass: 'snack-success'
    });
    this.router.navigate(['/login']);
  }
}
