import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardReportes, RespuestaReporte } from '../../models/reporte.model';

export interface RangoFechasReporte {
  desde: string;
  hasta: string;
}

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/reportesYEstadisticas/dashboard`;

  dashboard(rango: RangoFechasReporte): Observable<RespuestaReporte<DashboardReportes>> {
    return this.http.post<RespuestaReporte<DashboardReportes>>(this.url, rango);
  }
}
