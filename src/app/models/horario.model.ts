export interface HorarioMedico {
  id: number;
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  id_especialidad: number;
  especialidad?: string;
  id_sede: number;
  sede?: string;
}

export interface DatosHorarioMedico {
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  id_especialidad: number;
  id_sede: number;
}

export interface RespuestaHorarioApi<T> {
  codigo: number;
  estado: string;
  datos: T | null;
}
