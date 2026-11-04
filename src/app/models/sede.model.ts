export interface Sede {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
}

export interface RespuestaSedeApi<T> {
  codigo: number;
  estado: string;
  datos: T | null;
}
