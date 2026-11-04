/** Turno individual devuelto por POST /reportesYEstadisticas/especialidad */
export interface TurnoReporteEspecialidad {
  id_turno: number;
  fecha: string;
  id_paciente: number;
  descripcion: string;   // nombre de la especialidad
}

/** Turno individual devuelto por POST /reportesYEstadisticas/sede */
export interface TurnoReporteSede {
  id_turno: number;
  fecha: string;
  id_paciente: number;
  sede: string;          // nombre de la sede
}

/** Agrupado en el frontend a partir de los arrays de turnos */
export interface CantidadPorCategoria {
  nombre: string;
  cantidad_turnos: number;
}

/** Devuelto por POST /reportesYEstadisticas/ranking-medicos */
export interface RankingMedico {
  id_medico: number;
  nombre: string;
  apellido: string;
  cantidad_turnos: number;
}

/** Devuelto por POST /reportesYEstadisticas/tasa-cancelacion */
export interface TasaCancelacion {
  total_cancelados: number;
  total_efectivos: number;
  total_turnos: number;
  porcentaje_cancelacion: number;
}

/** Estructura interna que usa el componente para renderizar los gráficos */
export interface DashboardReportes {
  porEspecialidad: CantidadPorCategoria[];
  porSede: CantidadPorCategoria[];
  rankingMedicos: RankingMedico[];
  tasaCancelacion: TasaCancelacion;
}

export interface RespuestaReporte<T> {
  codigo: number;
  estado: string;
  datos: T | null;
}
