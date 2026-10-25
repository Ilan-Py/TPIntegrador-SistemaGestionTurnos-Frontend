export interface Especialidad {
    id: number;
    descripcion: string;
}

export interface RespuestaApi<T> {
    codigo: number;
    estado: string;
    datos: T | null;
}