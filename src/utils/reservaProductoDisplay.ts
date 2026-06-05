import type { Reserva, Venta } from '../services/api';
import {
  resolveRouteIdFromReservaPayload,
  resolveRouteNameFromReservaPayload,
} from './reservaRouteDisplay';

/** Nombre de finca desde fila de detalle o resumen de listado API. */
function fincaNombreFromPayload(payload: any): string {
  const finca = payload?.fincas?.[0];
  const fromDetalle = String(finca?.finca_nombre ?? finca?.nombre ?? '').trim();
  if (fromDetalle) return fromDetalle;
  return String(payload?.finca_nombre_resumen ?? '').trim();
}

/** Nombre del producto principal reservado (ruta, finca o servicio). */
export function resolveReservaProductoNombre(
  payload: any,
  opts?: {
    rutaDetalle?: { nombre?: string } | null;
    solicitud?: { ruta_nombre?: string | null } | null;
  },
): string {
  if (!payload || typeof payload !== 'object') return '';

  const fincaNombre = fincaNombreFromPayload(payload);
  if (fincaNombre) return fincaNombre;

  const rutaNombre = resolveRouteNameFromReservaPayload(payload, opts);
  if (rutaNombre) return rutaNombre;

  const servicios = payload?.servicios;
  if (Array.isArray(servicios) && servicios.length > 0) {
    const nombres = servicios
      .map((s: any) =>
        String(s?.servicio_nombre ?? s?.nombre_servicio ?? s?.nombre ?? '').trim(),
      )
      .filter(Boolean);
    if (nombres.length === 1) return nombres[0];
    if (nombres.length > 0) return nombres.join(', ');
  }

  const idRuta = resolveRouteIdFromReservaPayload(payload);
  if (idRuta) return `Ruta #${idRuta}`;

  return '';
}

/** Etiqueta para tablas: nombre del producto o tipo genérico si falta detalle. */
export function resolveReservaServicioEtiqueta(
  payload: any,
  opts?: {
    rutaDetalle?: { nombre?: string } | null;
    solicitud?: { ruta_nombre?: string | null } | null;
  },
): string {
  const nombre = resolveReservaProductoNombre(payload, opts);
  if (nombre) return nombre;
  const tipo = String(payload?.tipo_servicio ?? payload?.reserva_tipo_servicio ?? '').trim();
  return tipo || 'Reserva';
}

/** Texto para columna «Servicios adquiridos» en ventas. */
export function resolveVentaServiciosAdquiridosLabel(venta: Record<string, unknown> | null | undefined): string {
  if (!venta || typeof venta !== 'object') return 'Reserva';

  const pseudo: Record<string, unknown> = {
    tipo_servicio: venta.reserva_tipo_servicio ?? venta.tipo_servicio,
    ruta_nombre_resumen: venta.ruta_nombre_resumen,
    finca_nombre_resumen: venta.finca_nombre_resumen,
  };
  const finca = String(venta.finca_nombre_resumen ?? '').trim();
  if (finca) pseudo.fincas = [{ finca_nombre: finca }];
  const ruta = String(venta.ruta_nombre_resumen ?? '').trim();
  if (ruta) pseudo.programaciones = [{ ruta_nombre: ruta }];

  const nombre = resolveReservaProductoNombre(pseudo);
  const tipo = String(venta.reserva_tipo_servicio ?? venta.tipo_servicio ?? '').trim();

  if (nombre && tipo && !nombre.toLowerCase().includes(tipo.toLowerCase())) {
    return `${tipo}: ${nombre}`;
  }
  if (nombre) return nombre;
  return tipo || 'Reserva';
}

/** Pseudo-reserva desde campos de resumen del listado de ventas (sin cargar detalle). */
export function buildReservaSummaryFromVenta(venta: Venta | Record<string, unknown>): Reserva | null {
  const idReserva = Number((venta as Venta).id_reserva);
  if (!Number.isFinite(idReserva) || idReserva <= 0) return null;

  const ruta = String((venta as Venta).ruta_nombre_resumen ?? '').trim();
  const finca = String((venta as Venta).finca_nombre_resumen ?? '').trim();
  const tipo = String((venta as Venta).reserva_tipo_servicio ?? '').trim();

  const pseudo: Reserva = {
    id_reserva: idReserva,
    id_cliente: Number((venta as Venta).id_cliente) || 0,
    fecha_reserva: String((venta as Venta).fecha_reserva ?? ''),
    estado: String((venta as Venta).reserva_estado ?? ''),
    tipo_servicio: tipo || undefined,
    ruta_nombre_resumen: ruta || undefined,
    finca_nombre_resumen: finca || undefined,
  };

  if (finca) (pseudo as any).fincas = [{ finca_nombre: finca }];
  if (ruta) (pseudo as any).programaciones = [{ ruta_nombre: ruta }];

  return pseudo;
}
