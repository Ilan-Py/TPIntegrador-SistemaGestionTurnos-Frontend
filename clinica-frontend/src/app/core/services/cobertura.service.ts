import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cobertura } from '../../models/cobertura.model';
import { ApiResponse } from '../../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class CoberturaService {
  constructor(private http: HttpClient) {}

  listar(): Observable<ApiResponse<Cobertura[]>> {
    return this.http.get<ApiResponse<Cobertura[]>>(`${environment.apiUrl}/auth/coberturas`);
  }
}
