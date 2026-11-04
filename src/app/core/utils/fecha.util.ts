import { Injectable } from '@angular/core';
import { MAT_NATIVE_DATE_FORMATS, MatDateFormats, NativeDateAdapter } from '@angular/material/core';

/**
 * Convierte una fecha a texto "YYYY-MM-DD" (el formato que espera el backend)
 * usando la fecha local. No usa toISOString() porque esa función pasa a UTC
 * y, según la hora, puede devolver el día anterior o el siguiente.
 */
export function aFechaISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Adaptador de fechas para los datepicker de Angular Material.
 *
 * El adaptador nativo interpreta lo que escribe el usuario con Date.parse, que usa
 * el formato de Estados Unidos (mes/día/año): "03/04/1999" quedaba como 4 de marzo
 * y "15/03/1999" se rechazaba. Este adaptador interpreta día/mes/año.
 */
@Injectable()
export class FechaArgentinaAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (typeof value !== 'string') {
      return super.parse(value, parseFormat as object);
    }

    const texto = value.trim();
    if (!texto) return null;

    const partes = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(texto);
    if (!partes) return this.invalid();

    const dia = Number(partes[1]);
    const mes = Number(partes[2]);
    const anio = Number(partes[3]);
    const fecha = new Date(anio, mes - 1, dia);

    // Descarta fechas que no existen, como 31/02/2000.
    if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
      return this.invalid();
    }

    return fecha;
  }
}

/** Muestra las fechas de los datepicker como dd/mm/aaaa. */
export const FORMATOS_FECHA: MatDateFormats = {
  ...MAT_NATIVE_DATE_FORMATS,
  display: {
    ...MAT_NATIVE_DATE_FORMATS.display,
    dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' }
  }
};

/**
 * Pasa una fecha que viene de la API a "YYYY-MM-DD" local.
 * El backend devuelve las columnas DATE como "2026-11-03T03:00:00.000Z" (medianoche de Argentina en UTC)
 * y algunas consultas como "2026-11-03". Sirve para comparar fechas sin problemas de zona horaria.
 */
export function fechaDeApi(valor: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : aFechaISO(new Date(valor));
}

/** Convierte "YYYY-MM-DD" en un Date local (sin pasar por UTC). */
export function desdeFechaISO(valor: string): Date {
  const [anio, mes, dia] = valor.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}
