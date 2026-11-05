import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);
  estaLogueado = this.auth.estaLogueado;
  usuario = this.auth.usuario;

  ngOnInit() {
    const rol = this.auth.rol();
    if (rol === 'administrador') this.router.navigate(['/admin']);
    else if (rol === 'medico') this.router.navigate(['/medico']);
    else if (rol === 'operador') this.router.navigate(['/operador']);
    else if (rol === 'paciente') this.router.navigate(['/paciente']);
  }
}
