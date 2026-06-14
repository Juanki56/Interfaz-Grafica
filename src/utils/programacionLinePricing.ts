/**
 * El API a veces guarda en línea de programación un `precio_programacion` que ya es el **total del grupo**
 * pero `subtotal` = precio × personas (doble conteo). Ajustamos la vista cuando hay señales claras:
 * subtotal ≈ precio×N, y una referencia de reserva (o total del listado) coincide con el precio de línea
 * y es claramente menor que el subtotal.
 */

export type ClienteProgramacionPrecioFila = {
  precioUnitarioMostrado: number;
  subtotalMostrado: number;
  ajusteTotalGrupo: boolean;
};

export type ProgramacionPrecioHints = {
  /** Total mostrado en listado de reservas (getByCliente / tabla staff) cuando el detalle viene inflado. */
  listMontoTotal?: unknown;
};

function n(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? x : 0;
}

function near(a: number, b: number): boolean {
  if (a <= 0 || b <= 0) return false;
  const d = Math.abs(a - b);
  const tol = Math.max(1000, Math.round(Math.min(a, b) * 0.02));
  return d <= tol;
}

function collectReservaMontoCandidates(reserva: Record<string, unknown> | null | undefined): number[] {
  if (!reserva || typeof reserva !== 'object') return [];
  const venta =
    reserva['venta'] && typeof reserva['venta'] === 'object'
      ? (reserva['venta'] as Record<string, unknown>)
      : null;

  const vals: number[] = [
    n(reserva['monto_total']),
    n(reserva['total']),
    venta ? n(venta['monto_total']) : 0,
    venta ? n(venta['total']) : 0,
  ];

  const pag = Math.max(n(reserva['monto_pagado']), venta ? n(venta['monto_pagado']) : 0);
  const sal = Math.max(n(reserva['saldo_pendiente']), venta ? n(venta['saldo_pendiente']) : 0);
  if (pag > 0 && sal > 0) vals.push(pag + sal);
  if (pag > 0) vals.push(pag);

  return vals.filter((x) => x > 0);
}

function resolveGroupTotalReference(args: {
  reserva?: Record<string, unknown> | null;
  listMontoHint?: unknown;
  precioLinea: number;
  people: number;
  subApi: number;
}): number {
  const { reserva, listMontoHint, precioLinea, people, subApi } = args;
  const candidates = [
    ...collectReservaMontoCandidates(reserva ?? null),
    n(listMontoHint),
  ].filter((x) => x > 0);

  if (candidates.length === 0 || people < 2 || precioLinea <= 0 || subApi <= 0) {
    return candidates.length ? Math.max(...candidates) : 0;
  }

  const inflated = near(subApi, precioLinea * people);
  if (!inflated) {
    return Math.max(...candidates);
  }

  const plausible = candidates.filter(
    (v) =>
      v > 0 &&
      v <= subApi * 0.86 &&
      (near(v, precioLinea) || near(v, subApi / people)),
  );
  if (plausible.length) {
    return Math.max(...plausible);
  }

  const sorted = [...new Set(candidates)].sort((a, b) => a - b);
  if (sorted.length >= 2) {
    const lo = sorted[0];
    const hi = sorted[sorted.length - 1];
    if (hi >= lo * 1.45 && near(lo, precioLinea)) {
      return lo;
    }
  }

  return Math.max(...candidates);
}

export function clienteProgramacionPrecioFila(
  line: Record<string, unknown> | null | undefined,
  reserva?: Record<string, unknown> | null,
  hints?: ProgramacionPrecioHints | null,
): ClienteProgramacionPrecioFila {
  if (!line || typeof line !== 'object') {
    return { precioUnitarioMostrado: 0, subtotalMostrado: 0, ajusteTotalGrupo: false };
  }

  const people = Math.max(1, Math.floor(n(line['cantidad_personas'])) || 1);
  const precioProg = n(line['precio_programacion']);
  const precioUnit = n(line['precio_unitario']);
  const precioBase = precioProg > 0 ? precioProg : precioUnit;
  const subApi = n(line['subtotal']);

  if (people <= 1 || precioBase <= 0) {
    const sub = subApi > 0 ? subApi : precioBase;
    return {
      precioUnitarioMostrado: precioBase,
      subtotalMostrado: sub,
      ajusteTotalGrupo: false,
    };
  }

  const ref = resolveGroupTotalReference({
    reserva: reserva ?? null,
    listMontoHint: hints?.listMontoTotal,
    precioLinea: precioBase,
    people,
    subApi,
  });

  const subLooksLikeNxPrecio = subApi > 0 && near(subApi, precioBase * people);
  const shouldConsolidate =
    ref > 0 &&
    subLooksLikeNxPrecio &&
    ref <= subApi * 0.86 &&
    (near(ref, precioBase) || near(ref, subApi / people));

  if (shouldConsolidate) {
    const totalGrupo = ref;
    const porPersona = totalGrupo / people;
    return {
      precioUnitarioMostrado: porPersona,
      subtotalMostrado: totalGrupo,
      ajusteTotalGrupo: true,
    };
  }

  return {
    precioUnitarioMostrado: precioBase,
    subtotalMostrado: subApi > 0 ? subApi : precioBase * people,
    ajusteTotalGrupo: false,
  };
}
