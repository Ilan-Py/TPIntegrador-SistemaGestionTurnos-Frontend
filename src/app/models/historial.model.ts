/** Registro de historial clínico de GET /historial/:id_paciente. */
export interface RegistroHistorial {
  id: number;
  diagnostico: string;
  tratamiento: string | null;
  observaciones: string | null;
  fecha_registro: string;
  fecha_turno: string;
  hora_turno: string;
  medico_nombre?: string;
  medico_apellido?: string;
  especialidad?: string;
  paciente_nombre?: string;
  paciente_apellido?: string;
}
