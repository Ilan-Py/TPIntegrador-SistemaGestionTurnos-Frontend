import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/usuario.model';
import { HorariosDisponibles } from '../../models/turno.model';

interface ConsultaDisponibilidad {
  id_medico: number;
  id_especialidad: number;
  id_sede: number;
}

@Injectable({ providedIn: 'root' })
export class DisponibilidadService {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/disponibilidad`;

  /** Fechas (YYYY-MM-DD) con horarios libres para ese médico, especialidad y sede. */
  fechas(consulta: ConsultaDisponibilidad): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.url}/fechas`, { params: this.params(consulta) });
  }

  /** Horarios libres de una fecha. */
  horarios(consulta: ConsultaDisponibilidad, fecha: string): Observable<ApiResponse<HorariosDisponibles>> {
    const params = this.params(consulta).set('fecha', fecha);
    return this.http.get<ApiResponse<HorariosDisponibles>>(`${this.url}/horarios`, { params });
  }

  private params(consulta: ConsultaDisponibilidad): HttpParams {
    return new HttpParams()
      .set('id_medico', consulta.id_medico)
      .set('id_especialidad', consulta.id_especialidad)
      .set('id_sede', consulta.id_sede);
  }
}
