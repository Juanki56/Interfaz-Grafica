/**
 * Formato monetario Colombia (COP): miles con punto, sin decimales por defecto.
 * Ej.: 1500000 → "$ 1.500.000" (según Intl es-CO).
 */

const LOCALE = 'es-CO';
const CURRENCY = 'COP';

export type FormatCurrencyCOPOptions = {
  fallback?: string;
  /** Solo número con separador de miles (sin símbolo de moneda). */
  sinSimbolo?: boolean;
  maximumFractionDigits?: number;
};

export function parseAmountCOP(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  let s = String(value).trim();
  if (!s) return null;
  s = s.replace(/[^\d,.-]/g, '');
  if (!s || s === '-') return null;

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma > lastDot) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      s = `${parts[0].replace(/\./g, '')}.${parts[1]}`;
    } else {
      s = s.replace(/,/g, '').replace(/\./g, '');
    }
  } else if (hasDot) {
    const parts = s.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      s = s.replace(/\./g, '');
    }
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function buildFormatter(options?: FormatCurrencyCOPOptions): Intl.NumberFormat {
  const maxFrac = options?.maximumFractionDigits ?? 0;
  if (options?.sinSimbolo) {
    return new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxFrac,
    });
  }
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFrac,
  });
}

const defaultCurrencyFormatter = buildFormatter();

/**
 * Formatea un monto en pesos colombianos (COP).
 */
export function formatCurrencyCOP(
  value?: number | string | null,
  options?: FormatCurrencyCOPOptions,
): string {
  const fallback = options?.fallback ?? '—';
  const parsed =
    typeof value === 'number'
      ? Number.isFinite(value)
        ? value
        : null
      : parseAmountCOP(value);

  if (parsed == null) return fallback;

  const formatter = options ? buildFormatter(options) : defaultCurrencyFormatter;
  return formatter.format(parsed);
}

/** Alias usado en la mayoría de pantallas del sistema. */
export const formatCurrency = formatCurrencyCOP;

/** Número con miles en formato colombiano, sin símbolo $. */
export function formatAmountCOP(value?: number | string | null, fallback = '—'): string {
  return formatCurrencyCOP(value, { sinSimbolo: true, fallback });
}
