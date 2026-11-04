import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/usuario.model';
import { NuevoTurno, TurnoPaciente, TurnoSede } from '../../models/turno.model';

@Injectable({ providedIn: 'root' })
export class TurnoService {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/turnos`;

  crear(datos: NuevoTurno): Observable<ApiResponse<{ id: number }>> {
    return this.http.post<ApiResponse<{ id: number }>>(`${this.url}/altaTurno`, datos);
  }

  cancelar(id: number): Observable<ApiResponse<unknown>> {
    return this.http.patch<ApiResponse<unknown>>(`${this.url}/bajaTurno/${id}`, {});
  }

  misTurnos(): Observable<ApiResponse<TurnoPaciente[]>> {
    return this.http.get<ApiResponse<TurnoPaciente[]>>(`${this.url}/mis-turnos`);
  }

  /** Turnos de la sede del operador para una fecha (YYYY-MM-DD). */
  deSede(fecha: string): Observable<ApiResponse<TurnoSede[]>> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<ApiResponse<TurnoSede[]>>(`${this.url}/sede`, { params });
  }
}
