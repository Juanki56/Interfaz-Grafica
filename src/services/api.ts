/**
 * =====================================================
 * API SERVICE - OCCITOURS FRONTEND
 * =====================================================
 * Servicio para conectar con el backend
 */

import { buildApiUrl } from '../config/api.config';

// =====================================================
// TIPOS
// =====================================================

export interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  status?: string;
  tipo_usuario?: string;
}

export interface UsuarioBackend {
  id?: number | string;
  id_usuario?: number;
  id_usuarios?: number;
  nombre?: string;
  apellido?: string | null;
  correo?: string;
  email?: string;
  telefono?: string | null;
  rol?: string;
  rol_nombre?: string;
  role?: string;
  tipo_usuario?: string;
  estado?: boolean | string | null;
  fecha_registro?: string | null;
  fecha_creacion?: string | null;
  created_at?: string | null;
}

export interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  tipo_documento: string;
  numero_documento: string;
  direccion: string;
  fecha_nacimiento: string;
  estado: boolean;
}

export interface Empleado {
  id_empleado: number;
  id_usuarios?: number;
  id_roles?: number;
  nombre: string;
  apellido: string;
  correo?: string;           // viene del JOIN con usuarios
  telefono?: string | null;
  cargo: string;
  tipo_documento?: string | null;
  numero_documento?: string | null;
  fecha_contratacion?: string | null;
  estado?: boolean | null;
  rol_nombre?: string | null;
  ultimo_acceso?: string | null;
  fecha_registro?: string | null;
}

/** Filas de `detalle_reserva_acompanante` incluidas en GET /api/reservas/:id */
export interface DetalleReservaAcompanante {
  id_detalle_reserva_acompanante?: number;
  nombre?: string | null;
  apellido?: string | null;
  tipo_documento?: string | null;
  numero_documento?: string | null;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
}

export interface Reserva {
  id_reserva?: number;
  id?: number;
  id_venta?: number | null;

  id_cliente: number;
  fecha_reserva: string;
  estado: string;

  // Totales (según implementación backend puede venir como total o monto_total)
  total?: number | string | null;
  monto_total?: number | string | null;

  numero_participantes?: number | null;
  tipo_servicio?: string | null;
  notas?: string | null;
  estado_pago?: string | null;
  monto_pagado?: number | string | null;
  saldo_pendiente?: number | string | null;
  metodo_pago?: string | null;

  // Campos de JOIN (si el backend devuelve vista enriquecida)
  cliente_nombre?: string | null;
  cliente_apellido?: string | null;
  cliente_email?: string | null;
  cliente_telefono?: string | null;

  acompanantes?: DetalleReservaAcompanante[] | null;

  // Detalles opcionales (según implementación backend)
  id_programacion?: number | null;
  id_ruta?: number | null;
  programacion?: any;
  programaciones?: any[];
  servicios?: any[];
}

export interface AcompananteReservaPayload {
  id_cliente?: number | null;
  nombre: string;
  apellido: string;
  tipo_documento?: string | null;
  numero_documento?: string | null;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
}

export interface Ruta {
  id_ruta: number;
  nombre: string;
  descripcion?: string | null;        // text NULL en BD
  ubicacion?: string | null;          // text/varchar NULL (según BD)
  capacidad_maxima?: number | null;   // int4 NULL (según BD)
  destacado?: boolean | null;         // bool NULL (según BD)
  duracion_dias?: number | null;      // int4 NULL en BD
  precio_base?: number | null;        // numeric NULL en BD
  dificultad?: string | null;         // varchar NULL en BD
  imagen_url?: string | null;         // text NULL en BD
  estado?: boolean | null;            // bool NULL en BD
  fecha_creacion?: string | null;     // timestamp NULL en BD
  /** Texto largo para participantes (cliente / público): qué llevar, hidratación, puntualidad, etc. */
  recomendaciones_participantes?: string | null;
  /** Briefing operativo solo para guías y equipo OCCITOUR (no mostrar en catálogo público). */
  briefing_operativo_equipo?: string | null;
  servicios_predefinidos?: RutaServicioPredefinido[] | null;
  servicios_opcionales?: RutaServicioOpcional[] | null;
}

export interface RutaServicioPredefinido {
  id_ruta_servicio_predefinido?: number;
  id_ruta?: number;
  id_servicio: number;
  cantidad_default: number;
  requerido: boolean;
  fecha_creacion?: string;
  servicio?: {
    id_servicio: number;
    nombre: string;
    descripcion?: string | null;
    precio?: number | null;
    imagen_url?: string | null;
    estado?: boolean | null;
    fecha_creacion?: string | null;
  };
}

export interface RutaServicioOpcional {
  id_ruta_servicio_opcional?: number;
  id_ruta?: number;
  id_servicio: number;
  cantidad_default: number;
  fecha_creacion?: string;
  servicio?: {
    id_servicio: number;
    nombre: string;
    descripcion?: string | null;
    precio?: number | null;
    imagen_url?: string | null;
    estado?: boolean | null;
    fecha_creacion?: string | null;
  };
}

/**
 * Texto de recomendaciones al cliente desde la ruta (tolerante a nombres de campo del backend).
 */
export function extractRecomendacionesParticipantes(source: unknown): string {
  if (source == null) return '';
  if (typeof source === 'string') return source.trim();
  if (typeof source !== 'object') return '';
  const o = source as Record<string, unknown>;
  const keys = ['recomendaciones_participantes', 'recomendaciones_cliente', 'recomendacionesCliente'] as const;
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

/**
 * Normaliza los servicios incluidos con la ruta aunque el backend use otro nombre,
 * anidación ({ data: ... }) o una lista plana en `servicios` con banderas.
 */
export function extractRutaServiciosPredefinidos(ruta: unknown, depth = 0): RutaServicioPredefinido[] {
  if (depth > 4 || !ruta || typeof ruta !== 'object') return [];
  const o = ruta as Record<string, unknown>;

  const mapRow = (raw: unknown): RutaServicioPredefinido | null => {
    if (!raw || typeof raw !== 'object') return null;
    const row = raw as Record<string, unknown>;
    const idServicio = Number(row.id_servicio ?? row.idServicio);
    if (!Number.isFinite(idServicio) || idServicio <= 0) return null;
    const nested = row.servicio;
    const cantidadRaw = Number(row.cantidad_default ?? row.cantidad ?? 1);
    const cantidad = Number.isFinite(cantidadRaw) && cantidadRaw > 0 ? cantidadRaw : 1;
    const requerido = Boolean(row.requerido);

    if (nested && typeof nested === 'object') {
      const sn = nested as Record<string, unknown>;
      return {
        id_ruta_servicio_predefinido: row.id_ruta_servicio_predefinido as number | undefined,
        id_ruta: row.id_ruta as number | undefined,
        id_servicio: idServicio,
        cantidad_default: cantidad,
        requerido,
        servicio: {
          id_servicio: Number(sn.id_servicio) || idServicio,
          nombre: String(sn.nombre || 'Servicio'),
          descripcion: (sn.descripcion as string | null | undefined) ?? null,
          precio: sn.precio != null ? Number(sn.precio) : null,
          imagen_url: (sn.imagen_url as string | null | undefined) ?? null,
          estado: sn.estado != null ? Boolean(sn.estado) : null,
          fecha_creacion: (sn.fecha_creacion as string | null | undefined) ?? null,
        },
      };
    }

    return {
      id_ruta_servicio_predefinido: row.id_ruta_servicio_predefinido as number | undefined,
      id_ruta: row.id_ruta as number | undefined,
      id_servicio: idServicio,
      cantidad_default: cantidad,
      requerido,
      servicio: {
        id_servicio: idServicio,
        nombre: String(row.nombre || 'Servicio'),
        descripcion: (row.descripcion as string | null | undefined) ?? null,
        precio: row.precio != null ? Number(row.precio) : null,
        imagen_url: (row.imagen_url as string | null | undefined) ?? null,
        estado: null,
        fecha_creacion: (row.fecha_creacion as string | null | undefined) ?? null,
      },
    };
  };

  const tryArray = (value: unknown): RutaServicioPredefinido[] => {
    if (!Array.isArray(value)) return [];
    const out: RutaServicioPredefinido[] = [];
    for (const item of value) {
      const mapped = mapRow(item);
      if (mapped) out.push(mapped);
    }
    return out;
  };

  const nested =
    o.data && typeof o.data === 'object' ? (o.data as Record<string, unknown>) : null;

  const fromKeys = [
    o.servicios_predefinidos,
    o.serviciosPredefinidos,
    nested?.servicios_predefinidos,
    nested?.serviciosPredefinidos,
  ];

  for (const k of fromKeys) {
    const arr = tryArray(k);
    if (arr.length > 0) return arr;
  }

  const serviciosRaw = (o.servicios ?? nested?.servicios) as unknown;
  if (Array.isArray(serviciosRaw)) {
    const predefFlags = serviciosRaw.filter((item) => {
      if (!item || typeof item !== 'object') return false;
      const r = item as Record<string, unknown>;
      return (
        r.predefinido === true ||
        r.es_predefinido === true ||
        r.incluido === true ||
        r.tipo === 'predefinido' ||
        String(r.tipo_servicio || '')
          .toLowerCase()
          .includes('predef')
      );
    });
    const fromFiltered = tryArray(predefFlags);
    if (fromFiltered.length > 0) return fromFiltered;
  }

  if (nested) {
    const deeper = extractRutaServiciosPredefinidos(nested, depth + 1);
    if (deeper.length > 0) return deeper;
  }

  return [];
}

export function extractRutaServiciosOpcionales(ruta: unknown, depth = 0): RutaServicioOpcional[] {
  if (depth > 4 || !ruta || typeof ruta !== 'object') return [];
  const o = ruta as Record<string, unknown>;

  const mapRow = (raw: unknown): RutaServicioOpcional | null => {
    if (!raw || typeof raw !== 'object') return null;
    const row = raw as Record<string, unknown>;
    const idServicio = Number(row.id_servicio ?? row.idServicio);
    if (!Number.isFinite(idServicio) || idServicio <= 0) return null;
    const nested = row.servicio;
    const cantidadRaw = Number(row.cantidad_default ?? row.cantidad ?? 1);
    const cantidad = Number.isFinite(cantidadRaw) && cantidadRaw > 0 ? cantidadRaw : 1;

    const servicioFrom = (sn: Record<string, unknown>) => ({
      id_servicio: Number(sn.id_servicio) || idServicio,
      nombre: String(sn.nombre || 'Servicio'),
      descripcion: (sn.descripcion as string | null | undefined) ?? null,
      precio: sn.precio != null ? Number(sn.precio) : null,
      imagen_url: (sn.imagen_url as string | null | undefined) ?? null,
      estado: sn.estado != null ? Boolean(sn.estado) : null,
      fecha_creacion: (sn.fecha_creacion as string | null | undefined) ?? null,
    });

    if (nested && typeof nested === 'object') {
      return {
        id_ruta_servicio_opcional: row.id_ruta_servicio_opcional as number | undefined,
        id_ruta: row.id_ruta as number | undefined,
        id_servicio: idServicio,
        cantidad_default: cantidad,
        fecha_creacion: row.fecha_creacion as string | undefined,
        servicio: servicioFrom(nested as Record<string, unknown>),
      };
    }

    return {
      id_ruta_servicio_opcional: row.id_ruta_servicio_opcional as number | undefined,
      id_ruta: row.id_ruta as number | undefined,
      id_servicio: idServicio,
      cantidad_default: cantidad,
      fecha_creacion: row.fecha_creacion as string | undefined,
      servicio: {
        id_servicio: idServicio,
        nombre: String(row.nombre || 'Servicio'),
        descripcion: (row.descripcion as string | null | undefined) ?? null,
        precio: row.precio != null ? Number(row.precio) : null,
        imagen_url: (row.imagen_url as string | null | undefined) ?? null,
        estado: null,
        fecha_creacion: (row.fecha_creacion as string | null | undefined) ?? null,
      },
    };
  };

  const tryArray = (value: unknown): RutaServicioOpcional[] => {
    if (!Array.isArray(value)) return [];
    const out: RutaServicioOpcional[] = [];
    for (const item of value) {
      const mapped = mapRow(item);
      if (mapped) out.push(mapped);
    }
    return out;
  };

  const nested =
    o.data && typeof o.data === 'object' ? (o.data as Record<string, unknown>) : null;

  const fromKeys = [
    o.servicios_opcionales,
    o.serviciosOpcionales,
    nested?.servicios_opcionales,
    nested?.serviciosOpcionales,
  ];

  for (const k of fromKeys) {
    const arr = tryArray(k);
    if (arr.length > 0) return arr;
  }

  const serviciosRaw = (o.servicios ?? nested?.servicios) as unknown;
  if (Array.isArray(serviciosRaw)) {
    const opcFlags = serviciosRaw.filter((item) => {
      if (!item || typeof item !== 'object') return false;
      const r = item as Record<string, unknown>;
      return (
        r.opcional === true ||
        r.es_opcional === true ||
        r.tipo === 'opcional' ||
        String(r.tipo_servicio || '')
          .toLowerCase()
          .includes('opc')
      );
    });
    const fromFiltered = tryArray(opcFlags);
    if (fromFiltered.length > 0) return fromFiltered;
  }

  if (nested) {
    const deeper = extractRutaServiciosOpcionales(nested, depth + 1);
    if (deeper.length > 0) return deeper;
  }

  return [];
}

export interface Programacion {
  id_programacion: number;
  id_ruta: number;
  id_empleado?: number | null;

  fecha_salida: string;
  hora_salida?: string | null;
  fecha_regreso: string;
  hora_regreso?: string | null;
  lugar_encuentro?: string | null;

  cupos_totales?: number | null;
  cupos_disponibles?: number | null;
  precio_programacion?: number | string | null;
  estado?: string | null;
  es_personalizada?: boolean | null;

  ruta_nombre?: string | null;
  /** URL de imagen si el backend la incluye en el JOIN (p. ej. detalle de programación). */
  ruta_imagen_url?: string | null;
  empleado_nombre?: string | null;
  empleado_apellido?: string | null;
}

export interface Propietario {
  id_propietario: number;
  nombre: string;
  apellido?: string;
  tipo_documento?: string;
  numero_documento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  estado?: boolean;
  fecha_registro?: string;
}

export interface Finca {
  id_finca: number;
  id_propietario?: number;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  ubicacion?: string;
  capacidad_personas?: number;
  precio_por_noche?: number;
  imagen_principal?: string;
  estado?: boolean;
  fecha_registro?: string;
  // Datos del propietario (JOIN)
  propietario_nombre?: string;
  propietario_apellido?: string;
  propietario_telefono?: string;
  propietario_email?: string;
}

export interface Rol {
  id_roles: number;
  nombre: string;
  descripcion?: string;
  estado?: boolean;
  fecha_creacion?: string;
}

export interface Permiso {
  id_permisos: number;
  nombre: string;
  descripcion?: string | null;
  fecha_creacion?: string | null;
}

export interface PagoProveedor {
  id_pago_proveedor: number;
  id_proveedores: number;
  observaciones: string;
  monto: number;
  fecha_pago: string;
  metodo_pago?: string | null;
  numero_transaccion?: string | null;
  comprobante_pago?: string | null;
  estado?: string | null;
}

export interface VentaReserva {
  id_venta: number;
  id_reserva: number;
  monto_total: number | string;
  monto_pagado: number | string;
  saldo_pendiente: number | string;
  estado_pago: string;
  metodo_pago?: string | null;
  fecha_venta?: string | null;
}

export interface SolicitudPersonalizada {
  id_solicitud_personalizada: number;
  id_cliente: number;
  id_reserva?: number | null;
  id_ruta: number;
  cantidad_personas: number;
  fecha_deseada: string;
  hora_deseada?: string | null;
  fecha_regreso_deseada?: string | null;
  hora_regreso_deseada?: string | null;
  lugar_encuentro?: string | null;
  observaciones?: string | null;
  servicios_opcionales?: any | null;
  precio_cotizado?: number | null;
  estado: string;
  id_empleado_cotizador?: number | null;
  id_programacion?: number | null;

  // Campos enriquecidos (JOIN backend)
  reserva_codigo_qr?: string | null;
  reserva_estado?: string | null;
  reserva_monto_total?: number | string | null;
  ruta_nombre?: string | null;
  ruta_duracion_dias?: number | null;
  ruta_dificultad?: string | null;
  ruta_imagen_url?: string | null;

  // Venta (para mostrar id_venta cuando esté lista para pagar)
  id_venta?: number | null;
  venta_estado_pago?: string | null;
  venta_saldo_pendiente?: number | string | null;
}

export interface PagoSolicitud {
  id_pago: number;
  id_venta: number;
  id_reserva: number;
  monto: number;
  metodo_pago?: string | null;
  numero_transaccion?: string | null;
  comprobante_url?: string | null;
  comprobante_nombre?: string | null;
  comprobante_tipo?: string | null;
  estado?: string | null;
  fecha_pago?: string | null;
  observaciones?: string | null;
}

export interface PagoReservaProgramada extends PagoSolicitud {}

export interface PagoCliente {
  id_pago: number;
  id_venta: number;
  id_reserva: number;
  monto: number | string;
  metodo_pago?: string | null;
  numero_transaccion?: string | null;
  comprobante_url?: string | null;
  comprobante_nombre?: string | null;
  comprobante_tipo?: string | null;
  estado?: string | null;
  fecha_pago?: string | null;
  observaciones?: string | null;
  motivo_rechazo?: string | null;
  fecha_verificacion?: string | null;
  monto_total?: number | string | null;
  monto_pagado?: number | string | null;
  saldo_pendiente?: number | string | null;
  estado_pago?: string | null;
  cliente_nombre?: string | null;
  cliente_apellido?: string | null;
  cliente_telefono?: string | null;
  numero_documento?: string | null;
}

export interface Venta {
  id_venta: number;
  id_reserva: number;
  fecha_venta?: string | null;
  monto_total: number | string;
  monto_pagado: number | string;
  saldo_pendiente: number | string;
  estado_pago: string;
  metodo_pago?: string | null;
  fecha_creacion?: string | null;
  fecha_reserva?: string | null;
  reserva_estado?: string | null;
  notas?: string | null;
  id_cliente?: number | null;
  cliente_nombre?: string | null;
  cliente_apellido?: string | null;
  cliente_telefono?: string | null;
  numero_documento?: string | null;
  email?: string | null;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

type FetchApiOptions = RequestInit & {
  /**
   * Evita adjuntar Authorization aunque exista `token`.
   * Útil para endpoints públicos que fallan si se envía un JWT vencido.
   */
  skipAuth?: boolean;
};

async function fetchAPI<T = any>(endpoint: string, options: FetchApiOptions = {}): Promise<T> {
  const { skipAuth, ...requestInit } = options;
  const token = skipAuth ? null : localStorage.getItem('token');
  const isFormDataBody =
    typeof FormData !== 'undefined' && options?.body != null && options.body instanceof FormData;

  const baseHeaders: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
  };

  const config: RequestInit = {
    ...requestInit,
    headers: {
      ...baseHeaders,
      ...(options.headers as Record<string, string> | undefined),
    },
  };

  try {
    const response = await fetch(buildApiUrl(endpoint), config);
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();

    // Si hay token y el backend responde 401 (token inválido/expirado), limpiar sesión.
    // Importante: si NO hay token (catálogo público), no debemos redirigir.
    const isAuthEndpoint = endpoint.startsWith('/api/auth/');
    const hasToken = !!localStorage.getItem('token');
    if (response.status === 401 && hasToken && !isAuthEndpoint) {
      // No forzamos logout aquí: primero dejamos que la app valide el token con /api/auth/profile.
      // Esto evita falsos positivos (p.ej. 401 por permisos/rutas específicas).
      try {
        window.dispatchEvent(
          new CustomEvent('occitours:auth-401', {
            detail: {
              endpoint,
              status: response.status,
              payload: data,
            },
          })
        );
      } catch {
        // ignore
      }

      if (data && typeof data === 'object') {
        throw new Error((data as any)?.mensaje || (data as any)?.message || (data as any)?.error || 'No autorizado');
      }
      throw new Error('No autorizado');
    }

    if (!response.ok) {
      // Mejorar mensaje de error con detalles del backend
      const errorMessage =
        data && typeof data === 'object'
          ? (data as any).mensaje || (data as any).message || (data as any).error || `Error ${response.status}`
          : `Error ${response.status}`;
      const errorDetails = data && typeof data === 'object' ? (data as any).detalles || (data as any).details || '' : '';
      const fullError = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
      
      console.error('❌ Error del backend:', { status: response.status, data });
      throw new Error(fullError);
    }

    return data;
  } catch (error: any) {
    // Si es un error de red o parsing
    if (error.message.includes('Failed to fetch')) {
      console.error('❌ Error de conexión:', error);
      throw new Error('Error de conexión con el servidor. Verifica que el backend esté corriendo.');
    }
    throw error;
  }
}

// Normaliza respuestas del backend para que funciones como `getAll()` devuelvan siempre un array.
// Soporta: [...], { data: [...] }, { data: { data: [...] } }, { servicios: [...] }, etc.
function unwrapApiArray<T>(payload: any): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];

  const data = payload?.data;
  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const dataObj = data as Record<string, unknown>;
    const nestedImagenes = dataObj.imagenes;
    if (Array.isArray(nestedImagenes)) return nestedImagenes as T[];
    const nestedUrls = dataObj.urls;
    if (Array.isArray(nestedUrls)) return nestedUrls as T[];
  }

  const nestedData = payload?.data?.data;
  if (Array.isArray(nestedData)) return nestedData as T[];

  if (nestedData && typeof nestedData === 'object' && !Array.isArray(nestedData)) {
    const nd = nestedData as Record<string, unknown>;
    const ndImgs = nd.imagenes;
    if (Array.isArray(ndImgs)) return ndImgs as T[];
    const ndUrls = nd.urls;
    if (Array.isArray(ndUrls)) return ndUrls as T[];
  }

  const rows = payload?.rows;
  if (Array.isArray(rows)) return rows as T[];

  const results = payload?.results;
  if (Array.isArray(results)) return results as T[];

  const records = payload?.records;
  if (Array.isArray(records)) return records as T[];

  const files = payload?.files;
  if (Array.isArray(files)) return files as T[];

  const servicios = payload?.servicios;
  if (Array.isArray(servicios)) return servicios as T[];

  const proveedores = payload?.proveedores;
  if (Array.isArray(proveedores)) return proveedores as T[];

  const items = payload?.items;
  if (Array.isArray(items)) return items as T[];

  const imagenes = payload?.imagenes;
  if (Array.isArray(imagenes)) return imagenes as T[];

  const urls = payload?.urls;
  if (Array.isArray(urls)) return urls as T[];

  return [];
}

/** Normaliza entradas de GET .../imagenes (strings u objetos con url). */
function normalizeImagenesListPayload(items: unknown[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (typeof item === 'string') {
      const s = item.trim();
      if (s) out.push(s);
      continue;
    }
    if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      const s = String(
        o.url ??
          o.imagen_url ??
          o.imagen ??
          o.uri ??
          o.path ??
          o.file_url ??
          o.publicUrl ??
          o.signedUrl ??
          o.link ??
          o.href ??
          o.src ??
          ''
      ).trim();
      if (s) out.push(s);
    }
  }
  return out;
}

/**
 * Lista de URLs de GET .../imagenes: tolera envoltorios raros o un único objeto con `url`.
 */
function coerceImagenesApiResponseToUrls(payload: any): string[] {
  const fromUnwrap = normalizeImagenesListPayload(unwrapApiArray<unknown>(payload));
  if (fromUnwrap.length) return fromUnwrap;
  if (typeof payload === 'string') {
    const s = payload.trim();
    return s ? [s] : [];
  }
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return normalizeImagenesListPayload([payload]);
  }
  return [];
}

// =====================================================
// CACHE LIGERO (solo memoria) PARA LISTADOS PÚBLICOS
// =====================================================

type ApiMemoryCacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const apiMemoryCache = new Map<string, ApiMemoryCacheEntry<any>>();
const apiInFlight = new Map<string, Promise<any>>();

function appendQuery(endpoint: string, query?: Record<string, unknown>): string {
  if (!query) return endpoint;
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(query)) {
    if (raw == null) continue;
    const value = typeof raw === 'string' ? raw.trim() : String(raw);
    if (!value) continue;
    params.set(key, value);
  }

  const qs = params.toString();
  if (!qs) return endpoint;
  return endpoint.includes('?') ? `${endpoint}&${qs}` : `${endpoint}?${qs}`;
}

async function fetchCached<T>(cacheKey: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = apiMemoryCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.value as T;

  const inFlight = apiInFlight.get(cacheKey);
  if (inFlight) return (await inFlight) as T;

  const p = (async () => {
    try {
      const value = await fetcher();
      if (ttlMs > 0) {
        apiMemoryCache.set(cacheKey, { expiresAt: now + ttlMs, value });
      }
      return value;
    } finally {
      apiInFlight.delete(cacheKey);
    }
  })();

  apiInFlight.set(cacheKey, p);
  return (await p) as T;
}

/**
 * Primera URL del listado GET .../imagenes (fotos en Storage).
 */
function firstPublicImageUrlFromList(imagenes: string[] | null | undefined): string | null {
  const urls = (imagenes ?? []).map((u) => String(u || '').trim()).filter(Boolean);
  return urls[0] ?? null;
}

/** Imagen externa explícita (no Supabase) — no la sustituimos por el bucket. */
function isExplicitExternalImageUrl(url: string): boolean {
  const s = String(url ?? '').trim();
  return /^https?:\/\//i.test(s) && !/supabase\.co/i.test(s);
}

/**
 * Cards / home: si hay archivos en Storage, usa la primera URL.
 * Sustituye `imagen_url` rota o antigua de Supabase en BD; respeta solo URLs externas no-Supabase.
 */
async function enrichRutasImagenFromStorageIfMissing(
  rutas: Ruta[],
  skipAuthForImagenes: boolean
): Promise<Ruta[]> {
  if (!Array.isArray(rutas) || rutas.length === 0) return rutas;
  return Promise.all(
    rutas.map(async (r) => {
      if (!r || typeof r !== 'object') return r;
      const id = Number(r.id_ruta);
      if (!Number.isFinite(id) || id <= 0) return r;
      try {
        const response = await fetchAPI<any>(`/api/rutas/${id}/imagenes`, {
          skipAuth: skipAuthForImagenes,
        });
        const imgs = coerceImagenesApiResponseToUrls(response);
        const fromStorage = firstPublicImageUrlFromList(imgs);
        if (fromStorage) {
          const dbUrl = String(r.imagen_url ?? '').trim();
          if (isExplicitExternalImageUrl(dbUrl)) return r;
          return { ...r, imagen_url: fromStorage };
        }
      } catch {
        // ignorar
      }
      return r;
    })
  );
}

async function enrichFincasImagenFromStorageIfMissing(
  fincas: Finca[],
  skipAuthForImagenes: boolean
): Promise<Finca[]> {
  if (!Array.isArray(fincas) || fincas.length === 0) return fincas;
  return Promise.all(
    fincas.map(async (f) => {
      if (!f || typeof f !== 'object') return f;
      const id = Number(f.id_finca);
      if (!Number.isFinite(id) || id <= 0) return f;
      try {
        const response = await fetchAPI<any>(`/api/fincas/${id}/imagenes`, {
          skipAuth: skipAuthForImagenes,
        });
        const imgs = coerceImagenesApiResponseToUrls(response);
        const fromStorage = firstPublicImageUrlFromList(imgs);
        if (fromStorage) {
          const dbUrl = String(f.imagen_principal ?? '').trim();
          if (isExplicitExternalImageUrl(dbUrl)) return f;
          return { ...f, imagen_principal: fromStorage };
        }
      } catch {
        // ignorar
      }
      return f;
    })
  );
}

// =====================================================
// AUTENTICACIÓN
// =====================================================

export const authAPI = {
  login: async (correo: string, contrasena: string) => {
    return fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, contrasena }),
    });
  },

  registerPending: async (userData: {
    correo: string;
    contrasena: string;
    nombre: string;
    apellido: string;
    tipo_documento?: string;
    numero_documento?: string;
    telefono?: string;
    direccion?: string;
    fecha_nacimiento?: string;
  }) => {
    return fetchAPI('/api/auth/register-pending', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  verificarEmail: async (correo: string, codigo: string) => {
    return fetchAPI('/api/auth/verificar-email', {
      method: 'POST',
      body: JSON.stringify({ correo, codigo }),
    });
  },

  reenviarVerificacion: async (correo: string) => {
    return fetchAPI('/api/auth/reenviar-verificacion', {
      method: 'POST',
      body: JSON.stringify({ correo }),
    });
  },

  solicitarRecuperacion: async (correo: string) => {
    return fetchAPI('/api/auth/solicitar-recuperacion', {
      method: 'POST',
      body: JSON.stringify({ correo }),
    });
  },

  resetearContrasena: async (payload: { correo: string; token: string; nuevaContrasena: string }) => {
    return fetchAPI('/api/auth/resetear-contrasena', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  register: async (userData: {
    correo: string;
    contrasena: string;
    nombre: string;
    apellido: string;
    tipo_documento?: string;
    numero_documento?: string;
    telefono?: string;
  }) => {
    return fetchAPI('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getProfile: async () => {
    return fetchAPI('/api/auth/profile');
  },

  updateProfile: async (profileUpdates: Record<string, any>) => {
    return fetchAPI('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileUpdates),
    });
  },

  cambiarContrasena: async (contrasenaActual: string, contrasenaNueva: string) => {
    return fetchAPI('/api/auth/cambiar-contrasena', {
      method: 'PUT',
      body: JSON.stringify({ contrasenaActual, contrasenaNueva }),
    });
  },
};

// =====================================================
// CLIENTES
// =====================================================

export const usersAPI = {
  getAll: async (): Promise<UsuarioBackend[]> => {
    const response = await fetchAPI<{ data: UsuarioBackend[] }>('/api/usuarios');
    return response.data || [];
  },

  create: async (userData: Record<string, any>) => {
    return fetchAPI('/api/usuarios', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  update: async (id: number | string, userData: Record<string, any>) => {
    return fetchAPI(`/api/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  updateRole: async (correo: string, rol: string) => {
    return fetchAPI('/api/usuarios/role', {
      method: 'PUT',
      body: JSON.stringify({ correo, rol }),
    });
  },

  delete: async (id: number | string) => {
  return fetchAPI(`/api/usuarios/${id}`, {
    method: 'DELETE',
  });
},
};
  



export const clientesAPI = {
  getAll: async (): Promise<Cliente[]> => {
    const response = await fetchAPI<{ data: Cliente[] }>('/api/clientes');
    return response.data || [];
  },

  getById: async (id: number): Promise<Cliente> => {
    const response = await fetchAPI<{ data: Cliente }>(`/api/clientes/${id}`);
    return response.data;
  },

  create: async (clienteData: Partial<Cliente>) => {
    return fetchAPI('/api/clientes', {
      method: 'POST',
      body: JSON.stringify(clienteData),
    });
  },

  update: async (id: number, clienteData: Partial<Cliente>) => {
    return fetchAPI(`/api/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clienteData),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/clientes/${id}`, {
      method: 'DELETE',
    });
  },

  buscar: async (termino: string): Promise<Cliente[]> => {
    const response = await fetchAPI<{ data: Cliente[] }>(`/api/clientes/buscar?q=${termino}`);
    return response.data || [];
  },
};

// =====================================================
// EMPLEADOS
// =====================================================

export const empleadosAPI = {
  getAll: async (): Promise<Empleado[]> => {
    const response = await fetchAPI<{ data: Empleado[] }>('/api/empleados');
    return response.data || [];
  },

  getById: async (id: number): Promise<Empleado> => {
    const response = await fetchAPI<{ data: Empleado }>(`/api/empleados/${id}`);
    return response.data;
  },

  create: async (empleadoData: Partial<Empleado>) => {
    return fetchAPI('/api/empleados', {
      method: 'POST',
      body: JSON.stringify(empleadoData),
    });
  },

  update: async (id: number, empleadoData: Partial<Empleado>) => {
    return fetchAPI(`/api/empleados/${id}`, {
      method: 'PUT',
      body: JSON.stringify(empleadoData),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/empleados/${id}`, {
      method: 'DELETE',
    });
  },
};

// =====================================================
// RESERVAS
// =====================================================

export const reservasAPI = {
  getAll: async (): Promise<Reserva[]> => {
    const response = await fetchAPI<any>('/api/reservas');
    return unwrapApiArray<Reserva>(response);
  },

  getById: async (id: number): Promise<Reserva> => {
    const response = await fetchAPI<{ data: Reserva }>(`/api/reservas/${id}`);
    return response.data;
  },

  getByCliente: async (idCliente: number): Promise<Reserva[]> => {
    const response = await fetchAPI<any>(`/api/reservas/cliente/${idCliente}`);
    return unwrapApiArray<Reserva>(response);
  },

  create: async (reservaData: Partial<Reserva>) => {
    return fetchAPI('/api/reservas', {
      method: 'POST',
      body: JSON.stringify(reservaData),
    });
  },

  update: async (id: number, reservaData: Partial<Reserva>) => {
    return fetchAPI(`/api/reservas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reservaData),
    });
  },

  cancelar: async (id: number, motivo: string) => {
    return fetchAPI(`/api/reservas/${id}/cancelar`, {
      method: 'POST',
      body: JSON.stringify({
        motivo_cancelacion: motivo,
        cancelado_por: 'Usuario'
      }),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/reservas/${id}`, {
      method: 'DELETE',
    });
  },

  buscar: async (termino: string): Promise<Reserva[]> => {
    const response = await fetchAPI<any>(`/api/reservas/buscar?q=${termino}`);
    return unwrapApiArray<Reserva>(response);
  },

  // Asigna una programación a la reserva. El backend deduce la ruta desde la programación.
  agregarProgramacion: async (
    idReserva: number,
    payloadOrIdProgramacion:
      | number
      | {
          id_programacion: number;
          cantidad_personas?: number;
          precio_unitario?: number | string | null;
        }
  ) => {
    const payload =
      typeof payloadOrIdProgramacion === 'number'
        ? { id_programacion: payloadOrIdProgramacion }
        : payloadOrIdProgramacion;

    return fetchAPI(`/api/reservas/${idReserva}/programacion`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  agregarFinca: async (
    idReserva: number,
    payload: {
      id_finca: number;
      fecha_checkin: string;
      fecha_checkout: string;
      numero_noches: number;
      precio_por_noche: number | string;
    }
  ) => {
    return fetchAPI(`/api/reservas/${idReserva}/finca`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Agrega un servicio adicional a la reserva (por ejemplo, uno opcional de la ruta)
  agregarServicio: async (
    idReserva: number,
    payload: {
      id_servicio: number;
      cantidad: number;
      precio_unitario?: number | string | null;
    }
  ) => {
    return fetchAPI(`/api/reservas/${idReserva}/servicio`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  agregarAcompanante: async (idReserva: number, payload: AcompananteReservaPayload) => {
    return fetchAPI(`/api/reservas/${idReserva}/acompanante`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  pagarCompleto: async (
    idReserva: number,
    payload: {
      metodo_pago?: string | null;
      numero_transaccion?: string | null;
      comprobante_url: string;
      comprobante_nombre?: string | null;
      comprobante_tipo?: string | null;
      observaciones?: string | null;
    }
  ) => {
    return fetchAPI<{
      success: boolean;
      message: string;
      data: {
        pago: PagoReservaProgramada;
        venta: VentaReserva;
        reserva: {
          id_reserva: number;
          monto_total: number | string;
        };
      };
    }>(`/api/reservas/${idReserva}/pago-completo`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// =====================================================
// VENTAS
// =====================================================

export const ventasAPI = {
  getAll: async (): Promise<Venta[]> => {
    const response = await fetchAPI<any>('/api/ventas');
    return unwrapApiArray<Venta>(response);
  },

  getById: async (id: number): Promise<Venta> => {
    const response = await fetchAPI<{ data: Venta }>(`/api/ventas/${id}`);
    return response.data;
  },

  cancelar: async (id: number) => {
    return fetchAPI(`/api/ventas/${id}/cancelar`, {
      method: 'POST',
    });
  },

  buscar: async (termino: string): Promise<Venta[]> => {
    const response = await fetchAPI<any>(`/api/ventas/buscar?q=${encodeURIComponent(termino)}`);
    return unwrapApiArray<Venta>(response);
  },
};

// =====================================================
// PAGOS / ABONOS DE CLIENTES
// =====================================================

export const pagosAPI = {
  getAll: async (): Promise<PagoCliente[]> => {
    const response = await fetchAPI<any>('/api/pagos');
    return unwrapApiArray<PagoCliente>(response);
  },

  getById: async (id: number): Promise<PagoCliente> => {
    const response = await fetchAPI<any>(`/api/pagos/${id}`);
    const inner = response?.data ?? response;
    return (inner?.data ?? inner) as PagoCliente;
  },

  getByReserva: async (idReserva: number): Promise<PagoCliente[]> => {
    const response = await fetchAPI<{ data: PagoCliente[] }>(`/api/pagos/reserva/${idReserva}`);
    return response.data || [];
  },

  getByVenta: async (idVenta: number): Promise<PagoCliente[]> => {
    const response = await fetchAPI<{ data: PagoCliente[] }>(`/api/pagos/venta/${idVenta}`);
    return response.data || [];
  },

  create: async (payload: {
    id_venta: number;
    id_reserva: number;
    monto: number;
    metodo_pago?: string | null;
    numero_transaccion?: string | null;
    comprobante_url?: string | null;
    comprobante_nombre?: string | null;
    comprobante_tipo?: string | null;
    observaciones?: string | null;
  }) => {
    return fetchAPI('/api/pagos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  verificar: async (
    id: number,
    payload: {
      estado: 'Verificado' | 'Aprobado' | 'Rechazado';
      observaciones?: string | null;
      motivo_rechazo?: string | null;
    }
  ) => {
    return fetchAPI(`/api/pagos/${id}/verificar`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/pagos/${id}`, {
      method: 'DELETE',
    });
  },
};

// =====================================================
// RUTAS
// =====================================================

export const rutasAPI = {
  getAll: async (): Promise<Ruta[]> => {
    const response = await fetchAPI<any>('/api/rutas');
    const list = unwrapApiArray<Ruta>(response);
    return enrichRutasImagenFromStorageIfMissing(list, false);
  },

  // Catálogo público (clientes / no autenticado). Tras el listado, rellena imagen desde Storage (home, cards).
  getActivas: async (opts?: { limit?: number; cacheTtlMs?: number }): Promise<Ruta[]> => {
    const endpoint = appendQuery('/api/rutas/activas', { limit: opts?.limit });
    const cacheKey = `GET:${endpoint}:catalog_img_v1`;
    const ttlMs = opts?.cacheTtlMs ?? 0;
    return fetchCached<Ruta[]>(
      cacheKey,
      ttlMs,
      async () => {
        const response = await fetchAPI<any>(endpoint, { skipAuth: true });
        const raw = unwrapApiArray<Ruta>(response);
        return enrichRutasImagenFromStorageIfMissing(raw, true);
      },
    );
  },

  getById: async (id: number): Promise<Ruta> => {
    const response = await fetchAPI<any>(`/api/rutas/${id}`);
    const r = (response?.data ?? response) as Ruta;
    const out = await enrichRutasImagenFromStorageIfMissing([r], false);
    return out[0];
  },

  // Detalle público (solo si está activa)
  getActivaById: async (id: number): Promise<Ruta> => {
    const response = await fetchAPI<any>(`/api/rutas/activas/${id}`, { skipAuth: true });
    const r = (response?.data ?? response) as Ruta;
    const out = await enrichRutasImagenFromStorageIfMissing([r], true);
    return out[0];
  },

  create: async (rutaData: Partial<Ruta>) => {
    return fetchAPI('/api/rutas', {
      method: 'POST',
      body: JSON.stringify(rutaData),
    });
  },

  update: async (id: number, rutaData: Partial<Ruta>) => {
    return fetchAPI(`/api/rutas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rutaData),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/rutas/${id}`, {
      method: 'DELETE',
    });
  },

  getImagenes: async (id: number): Promise<string[]> => {
    const response = await fetchAPI<any>(`/api/rutas/${id}/imagenes`);
    return coerceImagenesApiResponseToUrls(response);
  },

  uploadImagenes: async (id: number, files: File[]): Promise<string[]> => {
    const form = new FormData();
    for (const file of files) form.append('imagenes', file);

    const response = await fetchAPI<any>(`/api/rutas/${id}/imagenes`, {
      method: 'POST',
      body: form,
    });

    return unwrapApiArray<string>(response);
  },
};

// =====================================================
// FINCAS
// =====================================================

export const fincasAPI = {
  // Público: catálogo de fincas activas (sin token)
  getPublicas: async (opts?: { limit?: number; cacheTtlMs?: number }): Promise<Finca[]> => {
    const endpoint = appendQuery('/api/fincas/publicas', { limit: opts?.limit });
    const cacheKey = `GET:${endpoint}:catalog_img_v1`;
    const ttlMs = opts?.cacheTtlMs ?? 0;
    return fetchCached<Finca[]>(
      cacheKey,
      ttlMs,
      async () => {
        const response = await fetchAPI<any>(endpoint, { skipAuth: true });
        const raw = (response?.data ?? response) as Finca[];
        const list = Array.isArray(raw) ? raw : [];
        return enrichFincasImagenFromStorageIfMissing(list, true);
      },
    );
  },

  // Público: detalle de finca activa por id (sin token)
  getPublicaById: async (id: number): Promise<Finca> => {
    const response = await fetchAPI<any>(`/api/fincas/publicas/${id}`, { skipAuth: true });
    const f = (response?.data ?? response) as Finca;
    const out = await enrichFincasImagenFromStorageIfMissing([f], true);
    return out[0];
  },

  getAll: async (): Promise<Finca[]> => {
    const response = await fetchAPI<{ data: Finca[] }>('/api/fincas');
    const list = response.data || [];
    return enrichFincasImagenFromStorageIfMissing(list, false);
  },

  getById: async (id: number): Promise<Finca> => {
    const response = await fetchAPI<{ data: Finca }>(`/api/fincas/${id}`);
    const f = response.data;
    if (!f) return f as Finca;
    const out = await enrichFincasImagenFromStorageIfMissing([f], false);
    return out[0];
  },

  create: async (fincaData: Partial<Finca>) => {
    return fetchAPI('/api/fincas', {
      method: 'POST',
      body: JSON.stringify(fincaData),
    });
  },

  update: async (id: number, fincaData: Partial<Finca>) => {
    return fetchAPI(`/api/fincas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fincaData),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/fincas/${id}`, {
      method: 'DELETE',
    });
  },

  getImagenes: async (id: number): Promise<string[]> => {
    const response = await fetchAPI<any>(`/api/fincas/${id}/imagenes`);
    return coerceImagenesApiResponseToUrls(response);
  },

  uploadImagenes: async (id: number, files: File[]): Promise<string[]> => {
    const form = new FormData();
    for (const file of files) form.append('imagenes', file);

    const response = await fetchAPI<any>(`/api/fincas/${id}/imagenes`, {
      method: 'POST',
      body: form,
    });

    return unwrapApiArray<string>(response);
  },
};

// =====================================================
// PROPIETARIOS
// =====================================================

export const propietariosAPI = {
  getAll: async (): Promise<Propietario[]> => {
    const response = await fetchAPI<{ data: Propietario[] }>('/api/propietarios');
    return response.data || [];
  },

  getById: async (id: number): Promise<Propietario> => {
    const response = await fetchAPI<{ data: Propietario }>(`/api/propietarios/${id}`);
    return response.data;
  },

  create: async (propietarioData: Partial<Propietario>) => {
    return fetchAPI('/api/propietarios', {
      method: 'POST',
      body: JSON.stringify(propietarioData),
    });
  },

  update: async (id: number, propietarioData: Partial<Propietario>) => {
    return fetchAPI(`/api/propietarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propietarioData),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/propietarios/${id}`, {
      method: 'DELETE',
    });
  },

  getFincas: async (id: number) => {
    const response = await fetchAPI<{ data: Finca[] }>(`/api/propietarios/${id}/fincas`);
    return response.data || [];
  },
};

// =====================================================
// DASHBOARD
// =====================================================

export const dashboardAPI = {
  getEstadisticas: async () => {
    return fetchAPI('/api/dashboard/estadisticas');
  },

  getReservasRecientes: async () => {
    return fetchAPI('/api/dashboard/reservas-recientes');
  },

  getVentasPorMes: async () => {
    return fetchAPI('/api/dashboard/ventas-por-mes');
  },
};

// =====================================================
// ROLES Y PERMISOS
// =====================================================

export const rolesAPI = {
  getAll: async (): Promise<Rol[]> => {
    const response = await fetchAPI<{ data: Rol[] }>('/api/roles');
    return response.data || [];
  },

  getById: async (id: number): Promise<Rol> => {
    const response = await fetchAPI<{ data: Rol }>(`/api/roles/${id}`);
    return response.data;
  },

  getByIdWithPermisos: async (id: number) => {
    return fetchAPI<any>(`/api/roles/${id}`);
  },

  /**
   * Obtener todos los permisos asignados a un rol específico
   */
  getPermisosDeRol: async (idRol: number): Promise<Permiso[]> => {
    try {
      const response = await fetchAPI<{ data: Permiso[] } | Permiso[]>(`/api/roles/${idRol}/permisos`);
      // Soportar tanto { data: [...] } como [...]
      if (Array.isArray(response)) {
        return response;
      }
      return (response as any).data || [];
    } catch (error) {
      console.warn(`No se pudieron cargar permisos para el rol ${idRol}:`, error);
      return [];
    }
  },

  create: async (rolData: Partial<Rol>) => {
    return fetchAPI('/api/roles', {
      method: 'POST',
      body: JSON.stringify(rolData),
    });
  },

  update: async (id: number, rolData: Partial<Rol>) => {
    return fetchAPI(`/api/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rolData),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/roles/${id}`, {
      method: 'DELETE',
    });
  },

  asignarPermiso: async (idRol: number, idPermiso: number) => {
    return fetchAPI(`/api/roles/${idRol}/permisos`, {
      method: 'POST',
      body: JSON.stringify({ id_permiso: idPermiso }),
    });
  },

  removerPermiso: async (idRol: number, idPermiso: number) => {
    return fetchAPI(`/api/roles/${idRol}/permisos/${idPermiso}`, {
      method: 'DELETE',
    });
  },

  /**
   * Actualizar todos los permisos de un rol de una vez
   */
  actualizarPermisos: async (idRol: number, idPermisos: number[]) => {
    return fetchAPI(`/api/roles/${idRol}/permisos`, {
      method: 'PUT',
      body: JSON.stringify({ id_permisos: idPermisos }),
    });
  },

  /**
   * Obtener permisos del rol del usuario actual (sin requerir Admin)
   */
  getPermisosDelUsuarioActual: async (): Promise<Permiso[]> => {
    try {
      const response = await fetchAPI<Permiso[] | { data: Permiso[] }>('/api/roles/mi-rol/permisos');
      if (Array.isArray(response)) {
        return response;
      }
      return (response as any).data || [];
    } catch (error) {
      console.warn('No se pudieron cargar permisos del usuario actual:', error);
      return [];
    }
  },
};

export const permisosAPI = {
  getAll: async (): Promise<Permiso[]> => {
    try {
      const response = await fetchAPI<{ data: Permiso[] }>('/api/permisos');
      return response.data || [];
    } catch (error) {
      // Fallback: el backend expone el catálogo también bajo /api/roles/permisos
      // protegido por permiso `roles.leer` (útil para roles no-admin con permisos).
      const response = await fetchAPI<Permiso[] | { data: Permiso[] }>('/api/roles/permisos');
      if (Array.isArray(response)) {
        return response;
      }
      return (response as any).data || [];
    }
  },

  /** Alta de permiso en catálogo (si el backend lo expone). Body típico: nombre, descripcion. */
  create: async (payload: { nombre: string; descripcion?: string }): Promise<Permiso | null> => {
    const response = await fetchAPI<Permiso | { data: Permiso }>('/api/permisos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response) return null;
    if (typeof response === 'object' && 'data' in response && response.data) {
      return response.data;
    }
    return response as Permiso;
  },
};

// =====================================================
// TIPOS DE PROVEEDORES
// =====================================================

export interface TipoProveedor {
  id_tipo: number;
  nombre: string;
  descripcion?: string | null;
  estado?: boolean | null;
  fecha_creacion?: string | null;
}

export const tiposProveedorAPI = {
  getAll: async (): Promise<TipoProveedor[]> => {
    const response = await fetchAPI<{ data: TipoProveedor[] }>('/api/tipo-proveedores');
    return response.data || [];
  },

  getById: async (id: number): Promise<TipoProveedor> => {
    const response = await fetchAPI<{ data: TipoProveedor }>(`/api/tipo-proveedores/${id}`);
    return response.data;
  },

  create: async (tipoData: Partial<TipoProveedor>) => {
    return fetchAPI('/api/tipo-proveedores', {
      method: 'POST',
      body: JSON.stringify(tipoData),
    });
  },

  update: async (id: number, tipoData: Partial<TipoProveedor>) => {
    return fetchAPI(`/api/tipo-proveedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tipoData),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/tipo-proveedores/${id}`, {
      method: 'DELETE',
    });
  },
};

// =====================================================
// PROVEEDORES
// =====================================================

export interface Proveedor {
  id_proveedores: number;  // Cambiado de id_proveedor
  nombre: string;
  id_tipo: number;  // Cambiado de id_tipo_proveedor
  telefono?: string | null;
  email?: string | null;  // Cambiado de correo
  direccion?: string | null;
  observaciones?: string | null;
  estado?: boolean | null;
  fecha_registro?: string | null;  // Cambiado de fecha_creacion
  // Campos relacionados (join)
  tipo_proveedor_nombre?: string;
}

export const proveedoresAPI = {
  getAll: async (): Promise<Proveedor[]> => {
    const response = await fetchAPI<any>('/api/proveedores');
    return unwrapApiArray<Proveedor>(response);
  },

  getById: async (id: number): Promise<Proveedor> => {
    const response = await fetchAPI<{ data: Proveedor }>(`/api/proveedores/${id}`);
    return response.data;
  },

  getByTipo: async (idTipo: number): Promise<Proveedor[]> => {
    const response = await fetchAPI<{ data: Proveedor[] }>(`/api/proveedores/tipo/${idTipo}`);
    return response.data || [];
  },

  create: async (proveedorData: Partial<Proveedor>) => {
    return fetchAPI('/api/proveedores', {
      method: 'POST',
      body: JSON.stringify(proveedorData),
    });
  },

  update: async (id: number, proveedorData: Partial<Proveedor>) => {
    return fetchAPI(`/api/proveedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(proveedorData),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/proveedores/${id}`, {
      method: 'DELETE',
    });
  },

  buscar: async (termino: string): Promise<Proveedor[]> => {
    const response = await fetchAPI<{ data: Proveedor[] }>(`/api/proveedores/buscar?q=${termino}`);
    return response.data || [];
  },
};

// =====================================================
// SERVICIOS
// =====================================================

// export interface Servicio {
//   id_servicio: number;
//   nombre: string;
//   descripcion?: string | null;
//   precio?: number | null;
//   imagen_url?: string | null;
//   estado?: boolean | null;
//   fecha_creacion?: string | null;
// }

// export const serviciosAPI = {
//   getAll: async (): Promise<Servicio[]> => {
//     const response = await fetchAPI<{ data: Servicio[] }>('/api/servicios');
//     return response.data || [];
//   },

//   getById: async (id: number): Promise<Servicio> => {
//     const response = await fetchAPI<{ data: Servicio }>(`/api/servicios/${id}`);
//     return response.data;
//   },

//   getDisponibles: async (): Promise<Servicio[]> => {
//     const response = await fetchAPI<{ data: Servicio[] }>('/api/servicios/disponibles');
//     return response.data || [];
//   },

//   create: async (servicioData: Partial<Servicio>) => {
//     return fetchAPI('/api/servicios', {
//       method: 'POST',
//       body: JSON.stringify(servicioData),
//     });
//   },

//   update: async (id: number, servicioData: Partial<Servicio>) => {
//     return fetchAPI(`/api/servicios/${id}`, {
//       method: 'PUT',
//       body: JSON.stringify(servicioData),
//     });
//   },

//   delete: async (id: number) => {
//     return fetchAPI(`/api/servicios/${id}`, {
//       method: 'DELETE',
//     });
//   },

//   buscar: async (termino: string): Promise<Servicio[]> => {
//     const response = await fetchAPI<{ data: Servicio[] }>(`/api/servicios/buscar?q=${termino}`);
//     return response.data || [];
//   },
// };


export const pagosProveedoresAPI = {
  getAll: async (): Promise<PagoProveedor[]> => {
    const response = await fetchAPI<{ data: PagoProveedor[] }>('/api/pago-proveedores');
    return response.data || [];
  },
  getById: async (id: number): Promise<PagoProveedor> => {
    const response = await fetchAPI<{ data: PagoProveedor }>(`/api/pago-proveedores/${id}`);
    return response.data;
  },
  create: async (pago: Omit<PagoProveedor, 'id_pago_proveedor'>) => {
    return fetchAPI('/api/pago-proveedores', {
      method: 'POST',
      body: JSON.stringify(pago),
    });
  },
  update: async (id: number, pago: Partial<PagoProveedor>) => {
    return fetchAPI(`/api/pago-proveedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pago),
    });
  },
  delete: async (id: number) => {
    return fetchAPI(`/api/pago-proveedores/${id}`, {
      method: 'DELETE',
    });
  }
};


// =====================================================
// SERVICIOS API - Incluye servicios con proveedor
// =====================================================

export interface Servicio {
  id_servicio: number;
  nombre: string;
  descripcion?: string | null;
  precio?: number | null;
  categoria?: string | null;
  imagen_url?: string | null;
  // Backend puede devolver estado como boolean o string ('Activo'/'Inactivo')
  estado?: boolean | string | null;
  // Campos usados en el front para mostrar/crear (aunque tu backend actual no los persista en la tabla `servicio`)
  duracion?: string | null;
  capacidad?: number | null;
  // Relación proveedor
  id_proveedores?: number | null;
  proveedor?: string | null;
  proveedor_nombre?: string | null;
  // Teléfono / contacto (algunos componentes lo llaman "contacto" y otros "telefono")
  telefono?: string | null;
  contacto?: string | null;
  fecha_creacion?: string | null;
  /** 'ruta' | 'finca' — catálogo global; rutas además enlazan por ruta en el backend. */
  aplica_a?: string | null;
}

// EXTENSIÓN para incluir proveedor en las filas:
export interface ServicioConProveedor extends Servicio {
  id_proveedores?: number | null;
  proveedor_nombre?: string | null;
}

export const serviciosAPI = {
  // Listado normal (sin proveedor)
  getAll: async (): Promise<Servicio[]> => {
    const response = await fetchAPI<any>('/api/servicios');
    return unwrapApiArray<Servicio>(response);
  },

  // Listar servicios DISPONIBLES (requiere sesión). Opcional: ?aplica_a=finca|ruta via query.
  getDisponibles: async (opts?: { aplica_a?: 'finca' | 'ruta' }): Promise<Servicio[]> => {
    const q =
      opts?.aplica_a === 'finca' || opts?.aplica_a === 'ruta'
        ? `?aplica_a=${opts.aplica_a}`
        : '';
    const response = await fetchAPI<any>(`/api/servicios/disponibles${q}`);
    return unwrapApiArray<Servicio>(response);
  },

  /** Catálogo público para reserva de finca (sin JWT): solo activos con aplica_a=finca. */
  getDisponiblesFincaPublicos: async (): Promise<Servicio[]> => {
    const response = await fetchAPI<any>('/api/servicios/publicos/finca', { skipAuth: true });
    return unwrapApiArray<Servicio>(response);
  },

  // Buscar servicios
  buscar: async (termino: string): Promise<Servicio[]> => {
    const response = await fetchAPI<any>(`/api/servicios/buscar?q=${termino}`);
    return unwrapApiArray<Servicio>(response);
  },

  // Traer servicio por id
  getById: async (id: number): Promise<Servicio> => {
    const response = await fetchAPI<{ data?: Servicio } | Servicio>(`/api/servicios/${id}`);
    if ('id_servicio' in (response as any)) {
      return response as Servicio;
    }
    return (response as any).data;
  },

  // Crear servicio
  create: async (servicioData: Partial<Servicio>) => {
    return fetchAPI('/api/servicios', {
      method: 'POST',
      body: JSON.stringify(servicioData),
    });
  },

  // Actualizar servicio
  update: async (id: number, servicioData: Partial<Servicio>) => {
    return fetchAPI(`/api/servicios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(servicioData),
    });
  },

  // Eliminar servicio
  delete: async (id: number) => {
    return fetchAPI(`/api/servicios/${id}`, {
      method: 'DELETE',
    });
  },

  // ===========================
  // 🚩 NUEVO 🚩 obtener servicios + proveedor
  // ===========================
  getAllConProveedor: async (): Promise<ServicioConProveedor[]> => {
    const response = await fetchAPI<any>('/api/servicios/con-proveedor');
    return unwrapApiArray<ServicioConProveedor>(response);
  },

  // 🚩 Traer proveedores de un servicio específico (opcional extra)
  getProveedores: async (id: number) => {
    const response = await fetchAPI<any>(`/api/servicios/${id}/proveedores`);
    return unwrapApiArray<any>(response);
  },
};

// =====================================================
// SOLICITUDES PERSONALIZADAS (CLIENTE + STAFF)
// =====================================================

export const solicitudesPersonalizadasAPI = {
  create: async (payload: {
    id_ruta: number;
    fecha_deseada: string;
    hora_deseada?: string;
    cantidad_personas: number;
    observaciones?: string;
    servicios_opcionales?: any;
  }) => {
    return fetchAPI('/api/solicitudes-personalizadas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMine: async (): Promise<SolicitudPersonalizada[]> => {
    const response = await fetchAPI<{ data: SolicitudPersonalizada[] }>('/api/solicitudes-personalizadas/mias');
    return response.data || [];
  },

  getById: async (id: number): Promise<SolicitudPersonalizada> => {
    const response = await fetchAPI<{ data: SolicitudPersonalizada }>(`/api/solicitudes-personalizadas/${id}`);
    return response.data;
  },

  listPagos: async (id: number): Promise<PagoSolicitud[]> => {
    const response = await fetchAPI<{ data: PagoSolicitud[] }>(`/api/solicitudes-personalizadas/${id}/pagos`);
    return response.data || [];
  },

  crearPago: async (
    id: number,
    payload: {
      monto: number;
      metodo_pago?: string | null;
      numero_transaccion?: string | null;
      comprobante_url: string;
      comprobante_nombre?: string | null;
      comprobante_tipo?: string | null;
      observaciones?: string | null;
    }
  ) => {
    return fetchAPI(`/api/solicitudes-personalizadas/${id}/pagos`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // STAFF: listar todas (opcionalmente por estado)
  listAll: async (params?: { estado?: string | null }): Promise<SolicitudPersonalizada[]> => {
    const estado = params?.estado ? String(params.estado) : '';
    const qs = estado ? `?estado=${encodeURIComponent(estado)}` : '';
    const response = await fetchAPI<{ data: SolicitudPersonalizada[] }>(`/api/solicitudes-personalizadas${qs}`);
    return response.data || [];
  },

  // STAFF: cotizar/actualizar estado
  cotizar: async (
    id: number,
    payload: {
      precio_cotizado?: number | null;
      estado?: string | null;
    }
  ) => {
    return fetchAPI(`/api/solicitudes-personalizadas/${id}/cotizar`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // STAFF: convertir solicitud a programación + reserva + venta
  convertirAProgramacion: async (
    id: number,
    payload: {
      fecha_salida: string;
      fecha_regreso: string;
      precio_programacion: number;
      hora_salida?: string | null;
      hora_regreso?: string | null;
      cupos_totales?: number | null;
      id_empleado?: number | null;
      lugar_encuentro?: string | null;
      precio_cotizado?: number | null;
    }
  ) => {
    return fetchAPI(`/api/solicitudes-personalizadas/${id}/convertir-a-programacion`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// =====================================================
// PROGRAMACION
// =====================================================

/** Todos los id_programacion asociados a una reserva (lista o detalle). */
export function collectProgramacionIdsFromReservaPayload(r: unknown): number[] {
  const ids = new Set<number>();
  if (!r || typeof r !== 'object') return [];

  const add = (v: unknown) => {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) ids.add(n);
  };

  const o = r as Record<string, unknown>;

  add(o.id_programacion);

  const nestedProg = o.programacion;
  if (nestedProg && typeof nestedProg === 'object') {
    add((nestedProg as Record<string, unknown>).id_programacion);
  }

  const nestedDet = o.detalle_programacion;
  if (nestedDet && typeof nestedDet === 'object') {
    add((nestedDet as Record<string, unknown>).id_programacion);
  }

  const pushFromArray = (arr: unknown) => {
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      if (item && typeof item === 'object') {
        add((item as Record<string, unknown>).id_programacion);
      }
    }
  };

  pushFromArray(o.programaciones);
  pushFromArray(o.detalles_programacion);
  pushFromArray(o.detalle_reserva_programacion);

  return [...ids];
}

/** @deprecated usar collectProgramacionIdsFromReservaPayload; se mantiene por compatibilidad */
export function pickProgramacionIdFromReservaPayload(r: unknown): number | null {
  const all = collectProgramacionIdsFromReservaPayload(r);
  return all.length > 0 ? all[0]! : null;
}

export const programacionAPI = {
  getAll: async (): Promise<Programacion[]> => {
    const response = await fetchAPI<any>('/api/programaciones');
    return unwrapApiArray<Programacion>(response);
  },

  // Público: programaciones activas/futuras para Home (sin token)
  getPublicas: async (opts?: { limit?: number; cacheTtlMs?: number }): Promise<Programacion[]> => {
    const endpoint = appendQuery('/api/programaciones/publicas', { limit: opts?.limit });
    const cacheKey = `GET:${endpoint}`;
    const ttlMs = opts?.cacheTtlMs ?? 0;
    const response = await fetchCached<any>(
      cacheKey,
      ttlMs,
      () => fetchAPI<any>(endpoint, { skipAuth: true }),
    );
    return unwrapApiArray<Programacion>(response);
  },

  getFechasOcupadasRuta: async (idRuta: number): Promise<string[]> => {
    const response = await fetchAPI<any>(`/api/programaciones/ruta/${idRuta}/fechas-ocupadas`);
    return unwrapApiArray<string>(response);
  },

  getById: async (id: number): Promise<Programacion> => {
    const response = await fetchAPI<any>(`/api/programaciones/${id}`);
    return (response?.data ?? response) as Programacion;
  },

  /**
   * Reservas vinculadas a una programación.
   * - Si GET /api/programaciones/:id/reservas devuelve filas, se usan.
   * - Si viene vacío o falla, se filtra GET /api/reservas (incluye filas con `programaciones[].id_programacion`).
   * - Si el listado no trae la relación, se consulta getById por reserva (acotado por id_ruta si se indica).
   */
  getReservasForProgramacion: async (
    idProgramacion: number,
    opts?: { idRuta?: number | null },
  ): Promise<Reserva[]> => {
    let fromEndpoint: Reserva[] | undefined;
    try {
      const response = await fetchAPI<any>(`/api/programaciones/${idProgramacion}/reservas`);
      fromEndpoint = unwrapApiArray<Reserva>(response);
    } catch {
      fromEndpoint = undefined;
    }

    if (fromEndpoint && fromEndpoint.length > 0) {
      return fromEndpoint;
    }

    const all = await reservasAPI.getAll();
    const fromListFilter = all.filter((row) =>
      collectProgramacionIdsFromReservaPayload(row).includes(idProgramacion),
    );

    if (fromListFilter.length > 0) {
      return fromListFilter;
    }

    let idRutaProgramacion: number | null =
      opts?.idRuta != null && Number(opts.idRuta) > 0 ? Number(opts.idRuta) : null;
    if (idRutaProgramacion == null) {
      try {
        const prog = await programacionAPI.getById(idProgramacion);
        const r = Number(prog?.id_ruta);
        if (Number.isFinite(r) && r > 0) idRutaProgramacion = r;
      } catch {
        idRutaProgramacion = null;
      }
    }

    const candidateIds: number[] = [];
    const maxCandidates = 48;
    for (const row of all) {
      if (candidateIds.length >= maxCandidates) break;
      if (collectProgramacionIdsFromReservaPayload(row).length > 0) continue;
      const tipo = String((row as any).tipo_servicio || '').toLowerCase();
      if (tipo.includes('finca')) continue;

      if (idRutaProgramacion != null) {
        const rutaRes = Number((row as any).id_ruta);
        if (Number.isFinite(rutaRes) && rutaRes > 0 && rutaRes !== idRutaProgramacion) continue;
      }

      const rid = Number((row as any).id_reserva ?? (row as any).id);
      if (!Number.isFinite(rid) || rid <= 0) continue;
      candidateIds.push(rid);
    }

    const enriched: Reserva[] = [];
    const seen = new Set<number>();
    const chunkSize = 12;
    for (let i = 0; i < candidateIds.length; i += chunkSize) {
      const chunk = candidateIds.slice(i, i + chunkSize);
      const results = await Promise.all(
        chunk.map(async (rid) => {
          try {
            return await reservasAPI.getById(rid);
          } catch {
            return null;
          }
        }),
      );
      for (const full of results) {
        if (!full) continue;
        if (!collectProgramacionIdsFromReservaPayload(full).includes(idProgramacion)) continue;
        const rid = Number((full as any).id_reserva ?? (full as any).id);
        if (!Number.isFinite(rid) || rid <= 0 || seen.has(rid)) continue;
        seen.add(rid);
        enriched.push(full);
      }
    }

    return enriched;
  },

  create: async (data: Partial<Programacion>) => {
    return fetchAPI('/api/programaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<Programacion>) => {
    return fetchAPI(`/api/programaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/programaciones/${id}`, {
      method: 'DELETE',
    });
  },
};