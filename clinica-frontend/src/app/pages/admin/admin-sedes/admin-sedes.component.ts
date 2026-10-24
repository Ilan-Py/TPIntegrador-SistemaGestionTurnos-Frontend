import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admin-sedes',
  imports: [RouterLink, MatButtonModule],
  templateUrl: './admin-sedes.component.html',
  styleUrl: './admin-sedes.component.css'
})
export class AdminSedesComponent {}
