import { Usuario } from '../../models/usuario.model';

// Convierte el rol recibido del backend a uno de los valores que usa el frontend.
export function normalizarRol(rol: unknown): Usuario['rol'] | null {
  // Evita operar sobre valores que no sean texto.
  if (typeof rol !== 'string') {
    return null;
  }

  // Quita espacios y unifica mayúsculas/minúsculas antes de comparar el rol.
  switch (rol.trim().toLowerCase()) {
    case 'admin':
    case 'administrador':
      return 'administrador';
    case 'medico':
      return 'medico';
    case 'operador':
      return 'operador';
    case 'paciente':
      return 'paciente';
    default:
      // Un rol no contemplado no se acepta como un rol válido.
      return null;
  }
}
