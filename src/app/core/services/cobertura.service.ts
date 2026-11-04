import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cobertura, RespuestaApi } from '../../models/cobertura.model';

/**
 * Centraliza las llamadas HTTP relacionadas con coberturas.
 *
 * El componente que usa este servicio no necesita conocer los detalles de
 * HttpClient ni construir las direcciones de la API: solo llama al método
 * que necesita y se suscribe al Observable para recibir la respuesta.
 *
 * Observable representa una operación asíncrona: subscribe() inicia la
 * petición y permite definir qué hacer cuando llega la respuesta (next) o
 * cuando ocurre un error (error).
 */
@Injectable({ providedIn: 'root' })
export class CoberturaService {
  // Angular entrega HttpClient mediante inyección de dependencias.
  private http = inject(HttpClient);

  // Dirección común a todos los endpoints de coberturas.
  // environment.apiUrl se configura en src/environments/environment.ts.
  private readonly url = `${environment.apiUrl}/coberturas`;

  /**
   * Obtiene coberturas sin requerir permisos de administrador.
   * Se usa, por ejemplo, para llenar el selector del formulario de registro.
   *
   * GET /coberturas/public
   * Devuelve un Observable; la petición se ejecuta al llamar a subscribe().
   */
  listarPublicas(): Observable<RespuestaApi<Cobertura[]>> {
    return this.http.get<RespuestaApi<Cobertura[]>>(`${this.url}/public`);
  }

  /**
   * Obtiene todas las coberturas para la pantalla de administración.
   * El backend protege esta ruta: requiere una sesión válida de administrador.
   *
   * GET /coberturas
   */
  listar(): Observable<RespuestaApi<Cobertura[]>> {
    return this.http.get<RespuestaApi<Cobertura[]>>(this.url);
  }

  /**
   * Crea una cobertura con el nombre indicado.
   *
   * POST /coberturas
   * El segundo argumento de post es el cuerpo enviado al backend:
   * en este caso, un objeto con la forma { nombre: "..." }.
   */
  crear(nombre: string): Observable<RespuestaApi<Cobertura>> {
    return this.http.post<RespuestaApi<Cobertura>>(this.url, { nombre });
  }

  /**
   * Cambia el nombre de una cobertura existente.
   *
   * PUT /coberturas/:id
   * El id identifica qué cobertura actualizar; el nombre va en el cuerpo.
   */
  actualizar(id: number, nombre: string): Observable<RespuestaApi<Cobertura>> {
    return this.http.put<RespuestaApi<Cobertura>>(`${this.url}/${id}`, { nombre });
  }

  /**
   * Solicita eliminar una cobertura por su id.
   * El backend puede rechazar la baja si hay usuarios asociados; en ese caso,
   * el Observable informa el error y el componente debe mostrar el mensaje.
   *
   * DELETE /coberturas/:id
   */
  eliminar(id: number): Observable<RespuestaApi<{ mensaje: string }>> {
    return this.http.delete<RespuestaApi<{ mensaje: string }>>(`${this.url}/${id}`);
  }
}
