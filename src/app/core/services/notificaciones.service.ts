import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Notificacion,
  RespuestaMarcarLeida,
  RespuestaNotificaciones
} from '../../models/notificacion.model';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/notificaciones`;

  /** Lista reactiva de notificaciones; el header la consume directamente. */
  readonly notificaciones = signal<Notificacion[]>([]);

  /** Carga las notificaciones del usuario logueado y actualiza el signal. */
  cargar(): void {
    this.http
      .get<RespuestaNotificaciones>(this.url)
      .pipe(catchError(() => of({ codigo: 500, estado: 'error', datos: null })))
      .subscribe(r => {
        this.notificaciones.set(r.datos ?? []);
      });
  }

  /** Marca una notificación como leída en el backend y actualiza el signal localmente. */
  marcarLeida(id: number): Observable<RespuestaMarcarLeida> {
    return this.http
      .patch<RespuestaMarcarLeida>(`${this.url}/${id}/leer`, {})
      .pipe(
        tap(() => {
          this.notificaciones.update(lista =>
            lista.map(n => (n.id === id ? { ...n, leida: true } : n))
          );
        }),
        catchError(() => of({ codigo: 500, estado: 'error', datos: null }))
      );
  }

  /** Limpia el signal al cerrar sesión. */
  limpiar(): void {
    this.notificaciones.set([]);
  }
}
