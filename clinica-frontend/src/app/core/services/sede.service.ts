import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaSedeApi, Sede } from '../../models/sede.model';

@Injectable({ providedIn: 'root' })
export class SedeService {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/sedes`;

  listar(): Observable<RespuestaSedeApi<Sede[]>> {
    return this.http.get<RespuestaSedeApi<Sede[]>>(this.url);
  }

  crear(datos: Omit<Sede, 'id'>): Observable<RespuestaSedeApi<Sede>> {
    return this.http.post<RespuestaSedeApi<Sede>>(this.url, datos);
  }

  actualizar(id: number, datos: Omit<Sede, 'id'>): Observable<RespuestaSedeApi<Sede>> {
    return this.http.put<RespuestaSedeApi<Sede>>(`${this.url}/${id}`, datos);
  }

  eliminar(id: number): Observable<RespuestaSedeApi<{ mensaje: string }>> {
    return this.http.delete<RespuestaSedeApi<{ mensaje: string }>>(`${this.url}/${id}`);
  }
}
