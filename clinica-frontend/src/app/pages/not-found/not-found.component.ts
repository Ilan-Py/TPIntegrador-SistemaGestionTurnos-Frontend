import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="center">
      <mat-icon class="big-icon">search_off</mat-icon>
      <h1>404</h1>
      <p>La página que buscás no existe.</p>
      <a mat-raised-button color="primary" routerLink="/">Volver al inicio</a>
    </div>
  `,
  styles: [`
    .center { text-align: center; padding: 64px 16px; }
    .big-icon { font-size: 72px; width: 72px; height: 72px; color: #9e9e9e; }
    h1 { font-size: 4rem; margin: 8px 0; color: #555; }
    p { font-size: 1.1rem; color: #777; margin-bottom: 24px; }
  `]
})
export class NotFoundComponent {}
