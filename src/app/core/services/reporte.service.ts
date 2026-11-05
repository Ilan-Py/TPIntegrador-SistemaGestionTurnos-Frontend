import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CantidadPorCategoria,
  DashboardReportes,
  RankingMedico,
  RespuestaReporte,
  TasaCancelacion,
  TurnoReporteEspecialidad,
  TurnoReporteSede
} from '../../models/reporte.model';

export interface RangoFechasReporte {
  desde: string;
  hasta: string;
}

interface EspecialidadItem { id: number; descripcion: string; }
interface SedeItem { id: number; nombre: string; }

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/reportesYEstadisticas`;

  /**
   * Consulta los 4 endpoints de reportes en paralelo y ensambla un DashboardReportes.
   * Los endpoints /especialidad y /sede requieren un id por petición,
   * así que primero cargamos los catálogos y luego hacemos una petición por ítem.
   */
  dashboard(rango: RangoFechasReporte): Observable<RespuestaReporte<DashboardReportes>> {
    const especialidades$ = this.http
      .get<RespuestaReporte<EspecialidadItem[]>>(`${environment.apiUrl}/especialidades`)
      .pipe(map(r => this.datosRequeridos(r, 'especialidades')));

    const sedes$ = this.http
      .get<RespuestaReporte<SedeItem[]>>(`${environment.apiUrl}/sedes`)
      .pipe(map(r => this.datosRequeridos(r, 'sedes')));

    return forkJoin([especialidades$, sedes$]).pipe(
      switchMap(([especialidades, sedes]) => {
        // Una petición por especialidad; errores 404 se tratan como cero turnos
        const porEsp$: Observable<CantidadPorCategoria>[] = especialidades.map(e =>
          this.http
            .post<RespuestaReporte<TurnoReporteEspecialidad[]>>(
              `${this.base}/especialidad`,
              { ...rango, id_especialidad: e.id }
            )
            .pipe(
              map(r => ({
                nombre: e.descripcion,
                cantidad_turnos: this.datosRequeridos(r, 'turnos por especialidad').length
              })),
              catchError(error => this.sinResultados(error)
                ? of({ nombre: e.descripcion, cantidad_turnos: 0 })
                : throwError(() => error))
            )
        );

        // Una petición por sede
        const porSede$: Observable<CantidadPorCategoria>[] = sedes.map(s =>
          this.http
            .post<RespuestaReporte<TurnoReporteSede[]>>(
              `${this.base}/sede`,
              { ...rango, id_sede: s.id }
            )
            .pipe(
              map(r => ({
                nombre: s.nombre,
                cantidad_turnos: this.datosRequeridos(r, 'turnos por sede').length
              })),
              catchError(error => this.sinResultados(error)
                ? of({ nombre: s.nombre, cantidad_turnos: 0 })
                : throwError(() => error))
            )
        );

        const ranking$: Observable<RankingMedico[]> = this.http
          .post<RespuestaReporte<RankingMedico[]>>(`${this.base}/ranking-medicos`, rango)
          .pipe(
            map(r => this.datosRequeridos(r, 'ranking de médicos')),
            catchError(error => this.sinResultados(error)
              ? of([] as RankingMedico[])
              : throwError(() => error))
          );

        const cancelacionVacia: TasaCancelacion = {
          total_cancelados: 0, total_efectivos: 0,
          total_turnos: 0, porcentaje_cancelacion: 0
        };
        const cancelacion$: Observable<TasaCancelacion> = this.http
          .post<RespuestaReporte<TasaCancelacion>>(`${this.base}/tasa-cancelacion`, rango)
          .pipe(
            map(r => this.datosRequeridos(r, 'tasa de cancelación')),
            catchError(error => this.sinResultados(error)
              ? of(cancelacionVacia)
              : throwError(() => error))
          );

        const allEsp$  = porEsp$.length  ? forkJoin(porEsp$)  : of([] as CantidadPorCategoria[]);
        const allSede$ = porSede$.length ? forkJoin(porSede$) : of([] as CantidadPorCategoria[]);

        return forkJoin([allEsp$, allSede$, ranking$, cancelacion$]).pipe(
          map(([porEspecialidad, porSede, rankingMedicos, tasaCancelacion]) => ({
            codigo: 200,
            estado: 'ok',
            datos: {
              porEspecialidad: porEspecialidad.filter(e => e.cantidad_turnos > 0),
              porSede:         porSede.filter(s => s.cantidad_turnos > 0),
              rankingMedicos,
              tasaCancelacion
            } as DashboardReportes
          }))
        );
      })
    );
  }

  private datosRequeridos<T>(respuesta: RespuestaReporte<T>, reporte: string): T {
    if (respuesta.datos === null) {
      throw new Error(`El backend no devolvió datos para ${reporte}.`);
    }
    return respuesta.datos;
  }

  private sinResultados(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 404;
  }
}
