import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/usuario.model';
import { Agenda, DatosAgenda } from '../../models/agenda.model';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/agendas`;

  listar(filtros: { fecha: string; id_sede?: number; id_medico?: number }): Observable<ApiResponse<Agenda[]>> {
    let params = new HttpParams().set('fecha', filtros.fecha);
    if (filtros.id_sede) params = params.set('id_sede', filtros.id_sede);
    if (filtros.id_medico) params = params.set('id_medico', filtros.id_medico);
    return this.http.get<ApiResponse<Agenda[]>>(this.url, { params });
  }

  crear(datos: DatosAgenda): Observable<ApiResponse<Agenda>> {
    return this.http.post<ApiResponse<Agenda>>(this.url, datos);
  }

  actualizar(id: number, datos: DatosAgenda): Observable<ApiResponse<Agenda>> {
    return this.http.put<ApiResponse<Agenda>>(`${this.url}/${id}`, datos);
  }

  eliminar(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.url}/${id}`);
  }
}
