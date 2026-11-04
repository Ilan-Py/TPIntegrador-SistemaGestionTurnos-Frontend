import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-medico-home',
  imports: [RouterLink],
  templateUrl: './medico-home.component.html',
  styleUrl: './medico-home.component.css'
})
export class MedicoHomeComponent {
  private auth = inject(AuthService);

  readonly nombreMedico = computed(() => {
    const usuario = this.auth.usuario();
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Médico';
  });
}
