import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { RespuestaApi } from "../../models/especialidad.model";
import { Especialidad } from "../../models/especialidad.model";
import { Observable } from "rxjs";

@Injectable ({providedIn: 'root'})
export class EspecialidadService {

    private http = inject(HttpClient);

    private readonly url = `${environment.apiUrl}/especialidades`;

    listar(): Observable<RespuestaApi<Especialidad[]>> {
        return this.http.get<RespuestaApi<Especialidad[]>>(`${this.url}`);
    }

    crear(descripcion: string): Observable<RespuestaApi<Especialidad>> {
     return this.http.post<RespuestaApi<Especialidad>>(this.url, {descripcion});   
    }

    actualizar(id: number, descripcion: string): Observable<RespuestaApi<Especialidad>> {
        return this.http.put<RespuestaApi<Especialidad>>(`${this.url}/${id}`, { descripcion });
      }

    eliminar(id: number): Observable<RespuestaApi<{ mensaje: string }>> {
    return this.http.delete<RespuestaApi<{ mensaje: string }>>(`${this.url}/${id}`);
  }
}