import { rutasAPI, solicitudesPersonalizadasAPI } from '../services/api';

/** ID de ruta asociada a una reserva (programación, solicitud personalizada o campo directo). */
export function resolveRouteIdFromReservaPayload(payload: any): number | null {
  const candidates = [
    payload?.id_ruta,
    payload?.ruta?.id_ruta,
    payload?.programacion?.id_ruta,
    payload?.programacion?.ruta?.id_ruta,
    payload?.programaciones?.[0]?.id_ruta,
    payload?.programaciones?.[0]?.ruta?.id_ruta,
    payload?.detalle_programacion?.id_ruta,
    payload?.solicitud?.id_ruta,
    payload?.solicitud_personalizada?.id_ruta,
  ];
  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

/** Nombre legible de la ruta reservada. */
export function resolveRouteNameFromReservaPayload(
  payload: any,
  opts?: {
    rutaDetalle?: { nombre?: string } | null;
    solicitud?: { ruta_nombre?: string | null; id_ruta?: number | null } | null;
  },
): string {
  const catalogName = String(opts?.rutaDetalle?.nombre ?? '').trim();
  if (catalogName) return catalogName;

  const solicitudName = String(
    opts?.solicitud?.ruta_nombre ??
      payload?.solicitud?.ruta_nombre ??
      payload?.solicitud_personalizada?.ruta_nombre ??
      '',
  ).trim();
  if (solicitudName) return solicitudName;

  const prog = payload?.programaciones?.[0] ?? payload?.programacion ?? payload?.detalle_programacion;
  if (prog) {
    const fromProg = String(
      prog?.ruta_nombre ?? prog?.nombre_ruta ?? prog?.ruta?.nombre ?? '',
    ).trim();
    if (fromProg) return fromProg;
  }

  const resumenListado = String(payload?.ruta_nombre_resumen ?? '').trim();
  if (resumenListado) return resumenListado;

  const direct = String(
    payload?.ruta_nombre ?? payload?.nombre_ruta ?? payload?.ruta?.nombre ?? '',
  ).trim();
  if (direct) return direct;

  const idRuta = resolveRouteIdFromReservaPayload(payload);
  if (idRuta) return `Ruta #${idRuta}`;

  return '';
}

/** Carga solicitud vinculada y detalle de catálogo de ruta si hace falta. */
export async function enrichReservaRouteContext(detalle: any): Promise<{
  detalleEnriched: any;
  rutaDetalle: { id_ruta?: number; nombre?: string } | null;
  solicitud: Record<string, unknown> | null;
}> {
  if (!detalle || typeof detalle !== 'object') {
    return { detalleEnriched: detalle, rutaDetalle: null, solicitud: null };
  }

  let solicitud: Record<string, unknown> | null =
    detalle.solicitud ?? detalle.solicitud_personalizada ?? null;

  const idSolicitud = Number(
    detalle.id_solicitud_personalizada ??
      solicitud?.id_solicitud_personalizada ??
      0,
  );

  if (!solicitud && Number.isFinite(idSolicitud) && idSolicitud > 0) {
    try {
      solicitud = (await solicitudesPersonalizadasAPI.getById(idSolicitud)) as Record<
        string,
        unknown
      >;
    } catch {
      solicitud = null;
    }
  }

  const detalleEnriched =
    solicitud != null
      ? { ...detalle, solicitud_personalizada: solicitud }
      : detalle;

  let idRuta = resolveRouteIdFromReservaPayload(detalleEnriched);
  if (!idRuta && solicitud) {
    const fromSol = Number(solicitud.id_ruta);
    if (Number.isFinite(fromSol) && fromSol > 0) idRuta = fromSol;
  }

  let rutaDetalle: { id_ruta?: number; nombre?: string } | null = null;
  if (idRuta) {
    try {
      rutaDetalle = await rutasAPI.getById(idRuta);
    } catch {
      rutaDetalle = null;
    }
  }

  return { detalleEnriched, rutaDetalle, solicitud };
}
