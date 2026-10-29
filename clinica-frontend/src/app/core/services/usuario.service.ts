import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  DatosUsuario,
  FiltrosUsuarios,
  ListadoUsuarios
} from '../../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/usuarios`;

  listar(filtros: FiltrosUsuarios): Observable<ApiResponse<ListadoUsuarios>> {
    let params = new HttpParams()
      .set('pagina', filtros.pagina)
      .set('limite', filtros.limite);

    if (filtros.nombre.trim()) params = params.set('nombre', filtros.nombre.trim());
    if (filtros.apellido.trim()) params = params.set('apellido', filtros.apellido.trim());
    if (filtros.rol) params = params.set('rol', filtros.rol);
    if (filtros.id_sede !== '') params = params.set('id_sede', filtros.id_sede);

    return this.http.get<ApiResponse<ListadoUsuarios>>(this.url, { params });
  }

  crear(datos: DatosUsuario): Observable<ApiResponse<{ id: number }>> {
    return this.http.post<ApiResponse<{ id: number }>>(this.url, datos);
  }

  actualizar(id: number, datos: DatosUsuario): Observable<ApiResponse<{ id: number }>> {
    return this.http.put<ApiResponse<{ id: number }>>(`${this.url}/${id}`, datos);
  }
}
