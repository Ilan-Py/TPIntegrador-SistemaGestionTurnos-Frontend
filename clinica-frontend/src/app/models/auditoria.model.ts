export interface RegistroAuditoria {
  id: number;
  id_usuario: number;
  usuario: string;
  id_entidad: number | null;
  usuario_afectado: string | null;
  accion: 'ALTA' | 'BAJA' | 'MODIFICACION' | string;
  entidad: string;
  detalle: string | null;
  fecha: string;
}

export interface FiltrosAuditoria {
  usuario: string;
  entidad: string;
  fechaDesde: string;
  fechaHasta: string;
  pagina: number;
  limite: number;
}

export interface ListadoAuditoria {
  registros: RegistroAuditoria[];
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

export interface RespuestaAuditoria<T> {
  codigo: number;
  estado: string;
  datos: T | null;
}
