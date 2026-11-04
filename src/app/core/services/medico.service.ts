import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/usuario.model';
import { FiltrosMedicos, Medico } from '../../models/medico.model';

@Injectable({ providedIn: 'root' })
export class MedicoService {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/medicos`;

  listar(filtros: FiltrosMedicos = {}): Observable<ApiResponse<Medico[]>> {
    let params = new HttpParams();
    if (filtros.id_especialidad) params = params.set('id_especialidad', filtros.id_especialidad);
    if (filtros.id_sede) params = params.set('id_sede', filtros.id_sede);
    if (filtros.con_agenda) params = params.set('con_agenda', 'true');
    return this.http.get<ApiResponse<Medico[]>>(this.url, { params });
  }
}
