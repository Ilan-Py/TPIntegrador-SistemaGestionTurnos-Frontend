import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-en-construccion',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="center">
      <mat-icon class="big-icon">construction</mat-icon>
      <h2>Sección en construcción</h2>
      <p>Esta funcionalidad estará disponible próximamente.</p>
      <a mat-stroked-button routerLink="/">Volver al inicio</a>
    </div>
  `,
  styles: [`
    .center { text-align: center; padding: 64px 16px; }
    .big-icon { font-size: 72px; width: 72px; height: 72px; color: #f9a825; }
    h2 { font-size: 2rem; margin: 8px 0; color: #333; }
    p { font-size: 1.1rem; color: #666; margin-bottom: 24px; }
  `]
})
export class EnConstruccionComponent {}
