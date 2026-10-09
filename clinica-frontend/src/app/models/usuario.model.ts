export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  rol: 'administrador' | 'medico' | 'operador' | 'paciente';
  telefono?: string;
  fecha_nacimiento?: string;
  id_cobertura?: number;
  id_sede?: number;
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
