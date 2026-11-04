import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DatosHistorialClinico, RespuestaTurnoApi, TurnoMedico } from '../../models/turno.model';

@Injectable({ providedIn: 'root' })
export class TurnoService {
  private http = inject(HttpClient);
  private readonly turnosUrl = `${environment.apiUrl}/turnos`;
  private readonly historialUrl = `${environment.apiUrl}/historial`;

  listarMedico(fecha: string, idSede: number | null): Observable<RespuestaTurnoApi<TurnoMedico[]>> {
    let params = new HttpParams().set('fecha', fecha);
    if (idSede !== null) params = params.set('id_sede', idSede);
    return this.http.get<RespuestaTurnoApi<TurnoMedico[]>>(`${this.turnosUrl}/medico`, { params });
  }

  cancelar(id: number): Observable<RespuestaTurnoApi<TurnoMedico>> {
    return this.http.patch<RespuestaTurnoApi<TurnoMedico>>(`${this.turnosUrl}/bajaTurno/${id}`, {});
  }

  marcarAtendido(id: number): Observable<RespuestaTurnoApi<{ turno_id: number; estado: string }>> {
    return this.http.patch<RespuestaTurnoApi<{ turno_id: number; estado: string }>>(
      `${this.turnosUrl}/${id}/atender`,
      {}
    );
  }

  registrarHistorial(
    idTurno: number,
    datos: DatosHistorialClinico
  ): Observable<RespuestaTurnoApi<DatosHistorialClinico>> {
    return this.http.post<RespuestaTurnoApi<DatosHistorialClinico>>(
      `${this.historialUrl}/${idTurno}`,
      datos
    );
  }
}
