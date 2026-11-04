import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/usuario.model';
import { CambiosPerfil, Paciente } from '../../models/paciente.model';
import { RegistroHistorial } from '../../models/historial.model';

@Injectable({ providedIn: 'root' })
export class PacienteService {
  private http = inject(HttpClient);

  /** Busca pacientes por DNI (si el texto es numérico) o por apellido. */
  buscar(texto: string): Observable<ApiResponse<Paciente[]>> {
    const valor = texto.trim();
    const params = /^\d+$/.test(valor)
      ? new HttpParams().set('dni', valor)
      : new HttpParams().set('apellido', valor);
    return this.http.get<ApiResponse<Paciente[]>>(`${environment.apiUrl}/pacientes`, { params });
  }

  /** El paciente logueado actualiza sus datos (solo email, contraseña, teléfono y cobertura). */
  actualizarMisDatos(cambios: CambiosPerfil): Observable<ApiResponse<{ id: number; campos_modificados: string[] }>> {
    return this.http.put<ApiResponse<{ id: number; campos_modificados: string[] }>>(
      `${environment.apiUrl}/auth/perfil`,
      cambios
    );
  }

  historial(idPaciente: number): Observable<ApiResponse<RegistroHistorial[]>> {
    return this.http.get<ApiResponse<RegistroHistorial[]>>(`${environment.apiUrl}/historial/${idPaciente}`);
  }
}
