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

export function durationDaysFromRutaDetail(duracion_dias: unknown): number {
  const n = Number(duracion_dias);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}
