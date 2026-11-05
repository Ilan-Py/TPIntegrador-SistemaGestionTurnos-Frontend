import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-operador-home',
  imports: [RouterLink],
  templateUrl: './operador-home.component.html',
  styleUrl: './operador-home.component.css'
})
export class OperadorHomeComponent {
  private auth = inject(AuthService);

  readonly nombreOperador = computed(() => {
    const usuario = this.auth.usuario();
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Operador';
  });
}
