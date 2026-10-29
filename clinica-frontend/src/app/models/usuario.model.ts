export type RolUsuario = 'administrador' | 'medico' | 'operador' | 'paciente';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  rol: RolUsuario;
  telefono?: string;
  fecha_nacimiento?: string;
  id_cobertura?: number | null;
  id_sede?: number | null;
  sede?: string | null;
  cobertura?: string | null;
  id_especialidades?: number[];
  especialidades?: string[];
}

export interface FiltrosUsuarios {
  nombre: string;
  apellido: string;
  rol: RolUsuario | '';
  id_sede: number | '';
  pagina: number;
  limite: number;
}

export interface ListadoUsuarios {
  usuarios: Usuario[];
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

export interface DatosUsuario {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  password?: string;
  rol: RolUsuario;
  id_sede: number | null;
  id_cobertura: number | null;
  id_especialidades: number[];
}

export interface LoginRequest {
  dni: string;
  password: string;
}

export interface RegistroRequest {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  password: string;
  fecha_nacimiento: string;
  id_cobertura: number;
  telefono?: string;
}

export interface AuthResponse {
  codigo: number;
  estado: string;
  datos: {
    token: string;
    usuario: Usuario;
  } | null;
}

export interface ApiResponse<T> {
  codigo: number;
  estado: string;
  datos: T | null;
}
