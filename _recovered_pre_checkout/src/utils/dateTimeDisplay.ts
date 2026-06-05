/**
 * Formato de fechas y horas para la interfaz (es-CO, 12 h, fechas legibles).
 * Los inputs type="time" y el API siguen usando HH:mm internamente.
 */

const LOCALE = 'es-CO';

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

export function parseDateOnly(value?: string | null): Date | null {
  if (value == null || String(value).trim() === '') return null;
  const raw = String(value).trim();
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    const d = new Date(`${ymd[1]}-${ymd[2]}-${ymd[3]}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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
