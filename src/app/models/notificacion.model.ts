export type TipoNotificacion = 'turno_confirmado' | 'turno_cancelado' | 'turno_atendido';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
  leida: boolean | number;   // MySQL devuelve 0/1; usamos ambos por seguridad
  fecha: string;
}

export interface RespuestaNotificaciones {
  codigo: number;
  estado: string;
  datos: Notificacion[] | null;
}

export interface RespuestaMarcarLeida {
  codigo: number;
  estado: string;
  datos: { mensaje: string } | null;
}
