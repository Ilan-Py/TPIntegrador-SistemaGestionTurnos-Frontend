export interface TurnoMedico {
  id: number;
  fecha: string;
  hora: string;
  estado: string;
  nota: string | null;
  id_paciente: number;
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_dni: string;
  paciente_fecha_nacimiento: string | null;
  id_sede: number;
  sede: string;
}

export interface DatosHistorialClinico {
  diagnostico: string;
  tratamiento: string;
  observaciones: string;
}

export interface RespuestaTurnoApi<T> {
  codigo: number;
  estado: string;
  datos: T | null;
}
