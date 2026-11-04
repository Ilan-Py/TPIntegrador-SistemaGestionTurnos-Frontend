/** Paciente de GET /pacientes (búsqueda del operador y del médico). */
export interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  edad: number;
  id_cobertura: number | null;
  cobertura: string | null;
}

/** Datos mínimos del paciente para el que se pide un turno. */
export interface PacienteTurno {
  id: number;
  nombre: string;
  apellido: string;
  dni?: string;
  cobertura: string | null;
}

/** Body de PUT /auth/perfil: solo los campos que cambian. */
export interface CambiosPerfil {
  email?: string;
  password?: string;
  telefono?: string;
  id_cobertura?: number;
}
