import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DatosHorarioMedico,
  HorarioMedico,
  RespuestaHorarioApi
} from '../../models/horario.model';

@Injectable({ providedIn: 'root' })
export class HorarioService {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/agendas`;

  listar(fecha?: string): Observable<RespuestaHorarioApi<HorarioMedico[]>> {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get<RespuestaHorarioApi<HorarioMedico[]>>(this.url, { params });
  }

  crear(datos: DatosHorarioMedico): Observable<RespuestaHorarioApi<HorarioMedico>> {
    return this.http.post<RespuestaHorarioApi<HorarioMedico>>(this.url, datos);
  }

  actualizar(
    id: number,
    datos: DatosHorarioMedico
  ): Observable<RespuestaHorarioApi<HorarioMedico>> {
    return this.http.put<RespuestaHorarioApi<HorarioMedico>>(`${this.url}/${id}`, datos);
  }

  eliminar(id: number): Observable<RespuestaHorarioApi<{ mensaje: string }>> {
    return this.http.delete<RespuestaHorarioApi<{ mensaje: string }>>(`${this.url}/${id}`);
  }
}
