/**
 * Formato de fechas y horas para la interfaz (es-CO, 12 h, fechas legibles).
 * Zona de negocio: Colombia (America/Bogota, UTC−5 sin horario de verano).
 * - Horas `HH:mm` del API (salida, regreso, hora deseada): hora civil Colombia, sin conversión.
 * - Timestamps ISO (creación, pagos): se muestran en hora de Colombia.
 */

const LOCALE = 'es-CO';

/** Zona horaria OCCITOUR (Colombia). */
export const COLOMBIA_TIME_ZONE = 'America/Bogota';

function colombiaCalendarPartsFromInstant(d: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: COLOMBIA_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month'), day: get('day') };
}

export type DateDisplayStyle = 'short' | 'long' | 'numeric';

export type DateDisplayOptions = {
  style?: DateDisplayStyle;
  fallback?: string;
};

export function parseTimeParts(value?: string | null): { hours: number; minutes: number } | null {
  if (value == null || String(value).trim() === '') return null;
  const raw = String(value).trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 23 || minutes > 59) {
    return null;
  }
  return { hours, minutes };
}

/** Hora en formato 12 h (ej. 2:30 p. m.) */
export function formatTimeDisplay(value?: string | null, fallback = ''): string {
  const parts = parseTimeParts(value);
  if (!parts) {
    const raw = String(value ?? '').trim();
    return raw || fallback;
  }
  const d = new Date();
  d.setHours(parts.hours, parts.minutes, 0, 0);
  return d.toLocaleTimeString(LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Hora 00:00:00 en ISO: suele ser un DATE del API serializado sin zona horaria útil. */
function isoTimeIsMidnight(raw: string): boolean {
  const m = raw.match(/T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return false;
  return Number(m[1]) === 0 && Number(m[2]) === 0 && Number(m[3] ?? 0) === 0;
}

/**
 * Día calendario para mostrar en UI.
 * - `YYYY-MM-DD` o `…T00:00:00…` → día del prefijo (fechas solo-día / DATE).
 * - ISO con hora distinta de medianoche → día en zona local (timestamps de creación).
 */
export function parseDateOnly(value?: string | null): Date | null {
  if (value == null || String(value).trim() === '') return null;
  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    const [, y, m, day] = ymd;
    if (/T/.test(raw) && !isoTimeIsMidnight(raw)) {
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) return null;
      const { year, month, day } = colombiaCalendarPartsFromInstant(parsed);
      return new Date(year, month - 1, day, 12, 0, 0);
    }
    const d = new Date(`${y}-${m}-${day}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  const { year, month, day } = colombiaCalendarPartsFromInstant(parsed);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/** Fecha y hora de un instante ISO (pagos, creación, etc.) en hora de Colombia. */
export function formatInstantDisplay(value?: string | null, fallback = '—'): string {
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleString(LOCALE, {
    timeZone: COLOMBIA_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** ¿El string trae zona explícita (UTC u offset)? */
export function isoStringHasExplicitZone(raw: string): boolean {
  return /Z$/i.test(raw) || /[+-]\d{2}:?\d{2}$/.test(raw);
}

/** `YYYY-MM-DD` alineado con parseDateOnly (filtros, inputs). */
export function toCalendarYmd(value?: string | null): string {
  const d = parseDateOnly(value);
  if (!d) {
    const raw = String(value ?? '').trim();
    return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : '';
  }
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

/** Fecha legible (evita desfase en fechas solo-día del API). */
export function formatDateDisplay(
  value?: string | null,
  options?: DateDisplayOptions,
): string {
  const fallback = options?.fallback ?? '—';
  const d = parseDateOnly(value);
  if (!d) {
    const raw = String(value ?? '').trim();
    return raw || fallback;
  }
  const style = options?.style ?? 'short';
  if (style === 'numeric') {
    return d.toLocaleDateString(LOCALE, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  if (style === 'long') {
    return d.toLocaleDateString(LOCALE, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  return d.toLocaleDateString(LOCALE, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTimeDisplay(
  date?: string | null,
  time?: string | null,
  options?: { dateFallback?: string; separator?: string; dateStyle?: DateDisplayStyle },
): string {
  const sep = options?.separator ?? ' · ';
  const dateLabel = formatDateDisplay(date, {
    fallback: options?.dateFallback ?? 'Sin definir',
    style: options?.dateStyle,
  });
  const timeLabel = formatTimeDisplay(time);
  if (!timeLabel) return dateLabel;
  if (!date || dateLabel === '—' || dateLabel === 'Sin definir') {
    return timeLabel;
  }
  return `${dateLabel}${sep}${timeLabel}`;
}
