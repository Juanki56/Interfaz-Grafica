/**
 * Distingue de dónde viene el pago del cliente para textos y ayuda contextual.
 * - Programada: paga en el acto para apartar cupo (ProgrammedRouteBookingModal / pagarCompleto).
 * - Personalizada: suele esperar aprobación del asesor antes de habilitar pago (solicitud).
 */
export type ClientPaymentFlowKind = 'programmed_route' | 'custom_request' | 'finca' | 'generic';

export function resolveClientPaymentFlowKind(booking: any): ClientPaymentFlowKind {
  const tipo = String(booking?.tipo_servicio ?? '').toLowerCase();
  if (tipo.includes('finca')) return 'finca';
  if (tipo.includes('personaliz') || tipo.includes('solicitud personal')) return 'custom_request';
  if (tipo.includes('programad')) return 'programmed_route';
  // El backend suele mandar "Ruta" sin la palabra "programada"; mismo flujo de pago que la salida operativa.
  if (tipo.includes('ruta')) return 'programmed_route';

  const progs = Array.isArray(booking?.programaciones) ? booking.programaciones : [];
  const hasSalidaOperativa = progs.some((p: any) => {
    if (p == null || typeof p !== 'object') return false;
    const flag = (p as { es_personalizada?: unknown }).es_personalizada;
    return flag === false || flag === 0 || flag === '0';
  });
  if (hasSalidaOperativa) return 'programmed_route';

  return 'generic';
}

export function clientPaymentFlowLabel(kind: ClientPaymentFlowKind): string {
  switch (kind) {
    case 'programmed_route':
      return 'Salida programada';
    case 'custom_request':
      return 'Solicitud personalizada';
    case 'finca':
      return 'Reserva de finca';
    default:
      return 'Reserva';
  }
}

/** Tipos de servicio en listados de cliente (mismo criterio que reserva). */
export type ClientServiceTypeForPago = 'Ruta' | 'Finca' | 'Servicio' | 'Reserva';

/**
 * Normaliza textos de `estado_pago` del API (mayúsculas, sin tildes coherentes, sinónimos).
 */
export function normalizeVentaEstadoPagoForClient(
  estado?: string | null,
): 'Pendiente' | 'Parcial' | 'Pagado' | 'Cancelado' {
  const t = String(estado ?? '').trim();
  if (!t) return 'Pendiente';
  const s = t.toLowerCase();

  if (s.includes('cancel')) return 'Cancelado';
  if (s.includes('parcial')) return 'Parcial';
  if (s.includes('pend')) return 'Pendiente';

  if (s.includes('pagad')) return 'Pagado';
  if (/\bpaid\b/.test(s)) return 'Pagado';
  if (s.includes('complet') && (s.includes('pag') || s.includes('vent') || s.includes('cobr'))) return 'Pagado';
  if (s.includes('liquid') || s.includes('cobrad') || s.includes('saldad')) return 'Pagado';
  if (s.includes('verific')) return 'Pagado';
  if (s.includes('aprob')) return 'Pagado';

  const legacy = ['Pendiente', 'Parcial', 'Pagado', 'Cancelado'].find((x) => x.toLowerCase() === s);
  if (legacy) return legacy as 'Pendiente' | 'Parcial' | 'Pagado' | 'Cancelado';

  return 'Pendiente';
}

/**
 * Reservas (vista staff): en **fincas** el pago puede ser Parcial; en **rutas** no hay abonos, no se muestra Parcial.
 * Si la reserva está confirmada/completada, el pago se muestra como Pagado (coherente con el negocio de ruta).
 */
export function staffReservaPaymentStatusForUi(opts: {
  tipoServicio?: string | null;
  estadoPago?: string | null;
  estadoReserva?: string | null;
  saldoPendiente?: number | string | null;
  montoPagado?: number | string | null;
  montoTotal?: number | string | null;
}): 'Pendiente' | 'Parcial' | 'Pagado' | 'Cancelado' {
  const tipo = String(opts.tipoServicio || '').toLowerCase();
  const esFinca = tipo.includes('finca');

  const canon = normalizeVentaEstadoPagoForClient(opts.estadoPago);

  const reserva = String(opts.estadoReserva || '').trim().toLowerCase();
  const reservaListaParaSalida = reserva.includes('confirm') || reserva.includes('complet');

  const saldoRaw = opts.saldoPendiente;
  const saldo =
    saldoRaw === null || saldoRaw === undefined || String(saldoRaw).trim() === ''
      ? NaN
      : Number(saldoRaw);
  const pagado = Number(opts.montoPagado ?? 0);
  const total = Number(opts.montoTotal ?? 0);

  if (esFinca) {
    return canon;
  }

  if (canon === 'Cancelado') return 'Cancelado';

  if (reservaListaParaSalida) return 'Pagado';

  if (canon === 'Pagado') return 'Pagado';
  if (Number.isFinite(saldo) && saldo <= 0 && total > 0) return 'Pagado';
  if (total > 0 && pagado >= total) return 'Pagado';

  return 'Pendiente';
}

/**
 * Estado de pago en fila de solicitud personalizada: si ya está convertida y no hay saldo pendiente,
 * mostrar Pagado aunque el API siga mandando texto vacío o "pendiente" obsoleto en `venta_estado_pago`.
 */
export function clientDisplayEstadoPagoVentaSolicitudPersonalizada(request: {
  venta_estado_pago?: string | null;
  venta_saldo_pendiente?: number | string | null;
  id_programacion?: number | null;
  estado?: string | null;
}): 'Pendiente' | 'Parcial' | 'Pagado' | 'Cancelado' {
  const idProg = Number(request.id_programacion ?? 0);
  const estadoSol = String(request.estado || '').trim().toLowerCase();
  const tieneProgramacion = Number.isFinite(idProg) && idProg > 0;
  const convertidaPorEstado = estadoSol.includes('convert');
  const convertida = tieneProgramacion || convertidaPorEstado;

  if (convertida) {
    const fromVenta = normalizeVentaEstadoPagoForClient(request.venta_estado_pago);
    if (fromVenta === 'Cancelado') return 'Cancelado';

    const saldoRaw = request.venta_saldo_pendiente;
    const saldo =
      saldoRaw === null || saldoRaw === undefined || String(saldoRaw).trim() === ''
        ? NaN
        : Number(saldoRaw);
    if (Number.isFinite(saldo) && saldo > 0) {
      return clientDisplayEstadoPagoVenta('Ruta', request.venta_estado_pago);
    }
    return 'Pagado';
  }

  return clientDisplayEstadoPagoVenta('Ruta', request.venta_estado_pago);
}

/**
 * Cómo mostrar `estado_pago` de la venta al cliente.
 * Solo **fincas** tienen abonos → puede mostrarse "Parcial". Rutas y demás se tratan como pago directo.
 */
export function clientDisplayEstadoPagoVenta(
  serviceType: ClientServiceTypeForPago,
  estado?: string | null,
): 'Pendiente' | 'Parcial' | 'Pagado' | 'Cancelado' {
  const n = normalizeVentaEstadoPagoForClient(estado);
  if (serviceType === 'Finca') return n;
  if (n === 'Parcial') return 'Pendiente';
  return n;
}

/**
 * Ruta personalizada: un solo comprobante por el **total acordado** (no abonos).
 * No se prioriza `venta_saldo_pendiente` porque el API a veces lo deja en la mitad del total; solo se usa si no hay otra señal del precio completo.
 */
export function montoPagoUnicoSolicitudPersonalizada(
  detail: {
    venta_saldo_pendiente?: number | string | null;
    venta_monto_total?: number | string | null;
    venta_monto_pagado?: number | string | null;
    monto_total?: number | string | null;
    precio_cotizado?: number | null;
    reserva_monto_total?: number | string | null;
  } | null | undefined,
  opts?: {
    reservaTotal?: number | string | null;
    reservaMontoTotal?: number | string | null;
  },
): number {
  const n = (v: unknown) => {
    const x = Number(v);
    return Number.isFinite(x) && x > 0 ? x : 0;
  };

  const nest = (detail ?? null) as Record<string, unknown> | null;
  const ventaNest =
    nest && typeof nest['venta'] === 'object' && nest['venta'] !== null
      ? (nest['venta'] as Record<string, unknown>)
      : null;

  const ventaTotal = Math.max(
    n(detail?.venta_monto_total),
    n(detail?.monto_total),
    n(ventaNest?.['monto_total']),
    n(ventaNest?.['total']),
  );

  const cot = n(detail?.precio_cotizado);
  const reservaTot = Math.max(
    n(detail?.reserva_monto_total),
    n(opts?.reservaTotal),
    n(opts?.reservaMontoTotal),
  );

  const saldo = Math.max(n(detail?.venta_saldo_pendiente), n(ventaNest?.['saldo_pendiente']));
  const pagado = Math.max(n(detail?.venta_monto_pagado), n(ventaNest?.['monto_pagado']));

  const reconstruidoDesdePartes = pagado > 0 && saldo > 0 ? pagado + saldo : 0;

  const acordado = Math.max(ventaTotal, cot, reservaTot, reconstruidoDesdePartes);

  if (acordado > 0) return acordado;

  if (saldo > 0) return saldo;

  return 0;
}

/**
 * Salida programada (ruta con programación): un solo pago por el total del servicio.
 * No se prioriza `saldo_pendiente` porque el API a veces lo deja en ~50% del total real.
 */
export function montoPagoUnicoSalidaProgramada(opts: {
  checkoutMontoTotal?: number | string | null;
  venta?: {
    monto_total?: number | string | null;
    monto_pagado?: number | string | null;
    saldo_pendiente?: number | string | null;
  } | null;
  estimate?: number | string | null;
}): number {
  const n = (v: unknown) => {
    const x = Number(v);
    return Number.isFinite(x) && x > 0 ? x : 0;
  };

  const venta = opts.venta ?? null;
  const ventaTotal = n(venta?.monto_total);
  const checkout = n(opts.checkoutMontoTotal);
  const saldo = n(venta?.saldo_pendiente);
  const pagado = n(venta?.monto_pagado);
  const reconstruidoDesdePartes = pagado > 0 && saldo > 0 ? pagado + saldo : 0;
  const estimado = n(opts.estimate);

  const acordado = Math.max(ventaTotal, checkout, reconstruidoDesdePartes, estimado);

  if (acordado > 0) return acordado;
  if (saldo > 0) return saldo;
  return 0;
}
