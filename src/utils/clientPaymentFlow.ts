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
