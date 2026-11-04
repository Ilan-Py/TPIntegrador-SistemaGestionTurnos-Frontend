export interface Cobertura {
  id: number;
  nombre: string;
}

export interface RespuestaApi<T> {
  codigo: number;
  estado: string;
  datos: T | null;
}