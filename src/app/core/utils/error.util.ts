import { HttpErrorResponse } from '@angular/common/http';

/**
 * Devuelve el mensaje para mostrarle al usuario cuando falla una petición al backend.
 *
 * - Si el backend respondió con la estructura uniforme, usa su "estado"
 *   (por ejemplo "El DNI ya está registrado").
 * - Si no hubo respuesta (backend apagado o sin conexión), lo informa.
 * - En cualquier otro caso, usa el mensaje alternativo de la pantalla.
 */
export function mensajeError(error: unknown, alternativo: string): string {
  if (error instanceof HttpErrorResponse) {
    const payload: unknown = error.error;
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'estado' in payload &&
      typeof payload.estado === 'string'
    ) {
      return payload.estado;
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verificá que el backend esté funcionando.';
    }
  }

  return alternativo;
}
