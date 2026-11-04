export interface PacienteBusqueda {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string | null;
  edad: number | null;
  id_cobertura: number | null;
  cobertura: string | null;
}

export interface RegistroHistorialClinico {
  id: number;
  diagnostico: string;
  tratamiento: string | null;
  observaciones: string | null;
  fecha_registro: string;
  fecha_turno: string;
  hora_turno: string;
  paciente_nombre: string;
  paciente_apellido: string;
}

export interface RespuestaHistorialApi<T> {
  codigo: number;
  estado: string;
  datos: T | null;
}
