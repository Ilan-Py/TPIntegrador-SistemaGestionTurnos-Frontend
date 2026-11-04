import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-acceso-denegado',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="center">
      <mat-icon class="big-icon">block</mat-icon>
      <h2>Acceso denegado</h2>
      <p>No tenés permisos para acceder a esta sección.</p>
      <a mat-raised-button color="primary" routerLink="/">Volver al inicio</a>
    </div>
  `,
  styles: [`
    .center { text-align: center; padding: 64px 16px; }
    .big-icon { font-size: 72px; width: 72px; height: 72px; color: #e53935; }
    h2 { font-size: 2rem; margin: 8px 0; color: #333; }
    p { font-size: 1.1rem; color: #666; margin-bottom: 24px; }
  `]
})
export class AccesoDenegadoComponent {}
