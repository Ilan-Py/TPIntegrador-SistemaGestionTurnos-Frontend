import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-paciente-home',
  imports: [RouterLink],
  templateUrl: './paciente-home.component.html',
  styleUrl: './paciente-home.component.css'
})
export class PacienteHomeComponent {
  private auth = inject(AuthService);

  readonly nombrePaciente = computed(() => {
    const usuario = this.auth.usuario();
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Paciente';
  });
}
