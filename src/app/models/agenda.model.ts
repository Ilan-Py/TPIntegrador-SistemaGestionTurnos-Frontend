/** Rango horario de la agenda de un médico (GET /agendas). */
export interface Agenda {
  id: number;
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  id_medico: number;
  id_especialidad: number;
  id_sede: number;
}

/** Body de POST /agendas y PUT /agendas/:id. */
export interface DatosAgenda {
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  id_medico: number;
  id_especialidad: number;
  id_sede: number;
}
