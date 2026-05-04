/**
 * Estados de salida para el cliente (paleta verde / esmeralda Occitours).
 *
 * Importante: en las cards usar siempre <Badge variant="outline" className={...} />.
 * Si omites variant="outline", el Badge usa `default` → `bg-primary` (#030213, casi negro).
 */

function normalizarEstadoClave(raw: string | null | undefined): string {
  return String(raw || '')
    .trim()
    .replace(/\u00a0/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Clases extra para chips del carrusel (siempre con Badge variant="outline") */
const CHIP = 'px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm bg-white/95';

export type EstadoSalidaCliente = {
  /** Texto largo (p. ej. modal de reserva) */
  label: string;
  /** Texto corto (overlay del carrusel) */
  compactLabel: string;
  /** Usar con <Badge variant="outline" className={badgeClassName} /> */
  badgeClassName: string;
};

export function estadoSalidaParaCliente(estadoRaw: string | null | undefined): EstadoSalidaCliente {
  const e = normalizarEstadoClave(estadoRaw).replace(/\s+/g, ' ');

  if (e === 'en progreso') {
    return {
      label: 'En progreso',
      compactLabel: 'En progreso',
      badgeClassName: `${CHIP} border-emerald-400 text-emerald-950`,
    };
  }

  if (
    e === 'programado' ||
    e === 'programada' ||
    e === 'activa' ||
    e === 'activo' ||
    e.startsWith('programad')
  ) {
    return {
      label: 'Activa · aún puedes reservar cupo',
      compactLabel: 'Activa',
      badgeClassName: `${CHIP} border-green-500 text-green-950`,
    };
  }

  return {
    label: estadoRaw?.trim() || 'Salida programada',
    compactLabel: estadoRaw?.trim() || 'Salida',
    badgeClassName: `${CHIP} border-green-600 text-green-950`,
  };
}
