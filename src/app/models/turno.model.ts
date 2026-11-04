export type EstadoTurno = 'confirmado' | 'cancelado' | 'atendido';

/** Turno de GET /turnos/mis-turnos (paciente). */
export interface TurnoPaciente {
  id: number;
  fecha: string;
  hora: string;
  estado: EstadoTurno;
  nota: string | null;
  medico_nombre: string;
  medico_apellido: string;
  especialidad: string;
  sede: string;
}

/** Turno de GET /turnos/sede (operador). */
export interface TurnoSede {
  id: number;
  fecha: string;
  hora: string;
  estado: EstadoTurno;
  nota: string | null;
  id_paciente: number;
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_dni: string;
  id_medico: number;
  medico_nombre: string;
  medico_apellido: string;
  id_especialidad: number;
  especialidad: string;
}

/** Body de POST /turnos/altaTurno. id_paciente solo lo envía el operador. */
export interface NuevoTurno {
  id_medico: number;
  id_especialidad: number;
  id_sede: number;
  fecha: string;
  hora: string;
  nota: string;
  id_paciente?: number;
}

export interface HorariosDisponibles {
  fecha: string;
  duracion_minutos: number;
  horarios: string[];
}
