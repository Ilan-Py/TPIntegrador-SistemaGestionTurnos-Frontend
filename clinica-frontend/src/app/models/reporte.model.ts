export interface CantidadPorCategoria {
  id: number;
  nombre: string;
  cantidad_turnos: number;
}

export interface RankingMedico {
  id_medico: number;
  nombre: string;
  apellido: string;
  cantidad_turnos: number;
}

export interface TasaCancelacion {
  total_cancelados: number;
  total_efectivos: number;
  total_turnos: number;
  porcentaje_cancelacion: number;
}

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
