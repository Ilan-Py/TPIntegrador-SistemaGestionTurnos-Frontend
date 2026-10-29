import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  FiltrosAuditoria,
  ListadoAuditoria,
  RespuestaAuditoria
} from '../../models/auditoria.model';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/logs/auditoria`;

  listar(filtros: FiltrosAuditoria): Observable<RespuestaAuditoria<ListadoAuditoria>> {
    let params = new HttpParams()
      .set('pagina', filtros.pagina)
      .set('limite', filtros.limite);

    if (filtros.usuario.trim()) params = params.set('usuario', filtros.usuario.trim());
    if (filtros.entidad.trim()) params = params.set('entidad', filtros.entidad.trim());
    if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);

    return this.http.get<RespuestaAuditoria<ListadoAuditoria>>(this.url, { params });
  }
}
