/** Utilidades compartidas: calendario de fechas para rutas (disponibilidad / ocupadas). */

export function toYMD(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function normalizeOccupiedYmd(value: string): string {
  const s = String(value).trim();
  if (!s) return '';
  const ymd = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return toYMD(parsed);
  return '';
}

/**
 * La columna API `duracion_dias` almacena ahora **horas** de la ruta.
 * Días de calendario necesarios para bloqueos de disponibilidad (mínimo 1).
 */
export function durationCalendarDaysFromRutaHoras(duracion_horas: unknown): number {
  const h = Number(duracion_horas);
  if (!Number.isFinite(h) || h <= 0) return 1;
  return Math.max(1, Math.ceil(h / 24));
}

/** @deprecated usar durationCalendarDaysFromRutaHoras — mismo nombre de columna, valor en horas */
export function durationDaysFromRutaDetail(duracion_dias: unknown): number {
  return durationCalendarDaysFromRutaHoras(duracion_dias);
}

/** Texto para catálogo / cliente: duración en horas (campo `duracion_dias` del API = horas). */
export function formatRutaDuracionHoras(duracion_horas?: number | null): string {
  if (duracion_horas == null || Number.isNaN(Number(duracion_horas))) return '—';
  const h = Math.floor(Number(duracion_horas));
  if (h <= 0) return '—';
  return h === 1 ? '1 hora' : `${h} horas`;
}
