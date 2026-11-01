import { Especialidad } from './especialidad.model';

/** Médico de GET /medicos (sin datos personales). */
export interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  id_sede: number | null;
  sede: string | null;
  especialidades: Especialidad[];
}

export interface FiltrosMedicos {
  id_especialidad?: number;
  id_sede?: number;
  con_agenda?: boolean;
}
