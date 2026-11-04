import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PacienteBusqueda,
  RegistroHistorialClinico,
  RespuestaHistorialApi
} from '../../models/historial-clinico.model';

@Injectable({ providedIn: 'root' })
export class HistorialClinicoService {
  private http = inject(HttpClient);
  private readonly pacientesUrl = `${environment.apiUrl}/pacientes`;
  private readonly historialUrl = `${environment.apiUrl}/historial`;

  buscarPacientes(
    criterio: 'dni' | 'apellido',
    valor: string
  ): Observable<RespuestaHistorialApi<PacienteBusqueda[]>> {
    const params = new HttpParams().set(criterio, valor.trim());
    return this.http.get<RespuestaHistorialApi<PacienteBusqueda[]>>(this.pacientesUrl, { params });
  }

  historialPaciente(
    idPaciente: number
  ): Observable<RespuestaHistorialApi<RegistroHistorialClinico[]>> {
    return this.http.get<RespuestaHistorialApi<RegistroHistorialClinico[]>>(
      `${this.historialUrl}/${idPaciente}`
    );
  }
}
