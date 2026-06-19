import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Ban,
  Calendar,
  CheckCircle,
  CreditCard,
  DollarSign,
  Eye,
  ExternalLink,
  FileText,
  Filter,
  Mail,
  MapPin,
  Phone,
  Search,
  TreePine,
  Route as RouteIcon,
  Upload,
  Users,
  Package,
  Receipt,
  UserCircle,
  ClipboardList,
  Loader2,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { DashboardLayout, DashboardSection } from './DashboardLayout';
import {
  pagosAPI,
  reservasAPI,
  rutasAPI,
  programacionAPI,
  solicitudesPersonalizadasAPI,
  ventasAPI,
  extractRecomendacionesParticipantes,
  extractRutaServiciosPredefinidos,
  type PagoCliente,
  type PagoSolicitud,
  type Ruta,
  type SolicitudPersonalizada,
  type Venta,
} from '../services/api';
import {
  clientPaymentFlowLabel,
  clientDisplayEstadoPagoVenta,
  clientDisplayEstadoPagoVentaSolicitudPersonalizada,
  montoPagoUnicoSalidaProgramada,
  montoPagoUnicoSolicitudPersonalizada,
  normalizeVentaEstadoPagoForClient,
  resolveClientPaymentFlowKind,
  type ClientPaymentFlowKind,
} from '../utils/clientPaymentFlow';
import { estadoSalidaParaCliente } from '../utils/programacionEstadoCliente';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { OccitoursPaymentBankDetails } from './OccitoursPaymentBankDetails';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { toast } from 'sonner';
import { clienteProgramacionPrecioFila } from '../utils/programacionLinePricing';
import { resolveClientIdForSession } from '../utils/resolveClientId';
import {
  formatDateDisplay,
  formatDateTimeDisplay,
  formatInstantDisplay,
  formatTimeDisplay,
  isoStringHasExplicitZone,
} from '../utils/dateTimeDisplay';
import {
  enrichReservaRouteContext,
  resolveRouteIdFromReservaPayload,
  resolveRouteNameFromReservaPayload,
} from '../utils/reservaRouteDisplay';
import {
  resolveReservaProductoNombre,
  resolveReservaServicioEtiqueta,
} from '../utils/reservaProductoDisplay';
import { formatRutaDuracionHoras } from '../utils/routeDateCalendar';
import { formatDocumentoClienteDisplay } from '../utils/documentIdentityValidation';

const CLIENT_DASHBOARD_TABS = new Set(['bookings', 'programming', 'sales', 'payments', 'profile']);

type ClientBookingView = 'list' | 'detail';

type ClientBookingSummary = {
  id: string;
  saleId?: number | null;
  serviceType: 'Ruta' | 'Finca' | 'Servicio' | 'Reserva';
  serviceName: string;
  date: string;
  /** Orden “última reserva”: ms de creación o, si no viene, fecha de reserva. */
  reservedAtMs: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  participants: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  specialRequests: string;
  /** Si el listado trae programación: horarios, encuentro, etc. */
  tripSummaryLine?: string;
  /** Motivo que el equipo dejó en la reserva al desaprobar un comprobante (visible para el cliente). */
  paymentRejectionNote?: string | null;
};

type ClientRequestSummary = {
  id: string;
  routeName: string;
  requestedDate: string;
  requestedTime: string;
  /** Orden respecto al resto de filas (creación de solicitud o fecha deseada como respaldo). */
  reservedAtMs: number;
  status: string;
  /** Si el API no manda `estado` pero sí programación, el estado mostrado se infiere en carga. */
  programacionId: number | null;
  people: number;
  quoteAmount: number;
  reservationId: number | null;
  saleId: number | null;
  paymentStatus: string;
  pendingBalance: number;
  observations: string;
  /** Texto corto: fecha/hora y encuentro solicitados. */
  tripSummaryLine?: string;
};

type ClientSaleView = 'list' | 'detail';
type ClientPaymentView = 'list' | 'detail';
type ClientProgrammingView = 'list' | 'detail';

type ClientSaleSummary = {
  id: string;
  saleId: number;
  reservationId: number;
  serviceName: string;
  serviceType: ClientBookingSummary['serviceType'];
  date: string;
  total: number;
  paid: number;
  pending: number;
  paymentStatus: string;
  paymentMethod: string;
};

type ClientPaymentSummary = {
  id: string;
  paymentId: number;
  reservationId: number;
  saleId: number;
  serviceName: string;
  serviceType: ClientBookingSummary['serviceType'];
  paymentFlowKind: ClientPaymentFlowKind;
  date: string;
  amount: number;
  status: string;
  method: string;
  receiptUrl?: string | null;
  /** Copia del motivo en la reserva cuando el equipo desaprueba un pago (texto orientativo para el cliente). */
  paymentRejectionNote?: string | null;
};

type ClientProgrammingSummary = {
  id: string;
  programacionId: number;
  reservationId: number;
  routeName: string;
  date: string;
  startTime: string;
  people: number;
  subtotal: number;
  meetingPoint: string;
  difficulty: string;
  createdAtMs: number;
  salidaAtMs: number;
};

const CLIENT_LIST_PER_PAGE = 10;

type ClientProgrammingsSort =
  | 'created-desc'
  | 'created-asc'
  | 'date-asc'
  | 'date-desc'
  | 'time-asc'
  | 'time-desc';

function sortClientProgrammings(
  list: ClientProgrammingSummary[],
  sort: ClientProgrammingsSort,
): ClientProgrammingSummary[] {
  const copy = [...list];
  copy.sort((a, b) => {
    switch (sort) {
      case 'created-desc':
        return b.createdAtMs - a.createdAtMs;
      case 'created-asc':
        return a.createdAtMs - b.createdAtMs;
      case 'date-desc':
        return b.salidaAtMs - a.salidaAtMs;
      case 'date-asc':
        return a.salidaAtMs - b.salidaAtMs;
      case 'time-desc':
        return (b.startTime || '').localeCompare(a.startTime || '');
      case 'time-asc':
        return (a.startTime || '').localeCompare(b.startTime || '');
      default:
        return 0;
    }
  });
  return copy;
}

type ClientListPaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (updater: (prev: number) => number) => void;
  itemLabel: string;
};

function ClientListPagination({
  page,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  itemLabel,
}: ClientListPaginationProps) {
  if (totalItems <= 0) return null;
  return (
    <div className="flex flex-col gap-2 border-t p-4 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-gray-600">
        Mostrando {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalItems)} de {totalItems}{' '}
        {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          Anterior
        </Button>
        <Badge variant="secondary">
          Página {page} / {totalPages}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}

type ClientModuleFiltersCardProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  onClear: () => void;
  children?: React.ReactNode;
};

function ClientModuleFiltersCard({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  onClear,
  children,
}: ClientModuleFiltersCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Buscar</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-10"
              />
            </div>
          </div>
          {children}
          <div className="flex items-end">
            <Button variant="outline" className="w-full" onClick={onClear}>
              <Filter className="mr-2 h-4 w-4" />
              Limpiar filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CLIENT_RESUBMIT_PROOF_MAX = 5 * 1024 * 1024;
const CLIENT_RESUBMIT_PROOF_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

const normalizeReservationStatus = (status?: string | null) => {
  const normalized = String(status || '').trim();
  return ['Pendiente', 'Confirmada', 'Cancelada', 'Completada'].includes(normalized)
    ? normalized
    : 'Pendiente';
};

const normalizePaymentStatus = (status?: string | null) => {
  return normalizeVentaEstadoPagoForClient(status);
};

const normalizeInstallmentStatus = (status?: string | null) => {
  const key = String(status || '').trim().toLowerCase();
  if (key === 'pendiente') return 'Pendiente';
  if (key === 'verificado') return 'Verificado';
  if (key === 'aprobado') return 'Aprobado';
  if (key === 'rechazado') return 'Rechazado';
  return 'Pendiente';
};

/** Motivo persistido en la reserva cuando se desaprueba un abono (el API puede usar otros nombres de campo). */
function reservaMotivoDesaprobacionPago(row: unknown): string | null {
  if (row == null || typeof row !== 'object') return null;
  const o = row as Record<string, unknown>;
  const v =
    o.motivo_desaprobacion_pago ??
    o.motivo_desaprobacion_comprobante ??
    o.ultimo_motivo_rechazo_pago;
  const s = v != null ? String(v).trim() : '';
  return s || null;
}

const formatCurrency = (value?: number | string | null) =>
  `$${Number(value || 0).toLocaleString('es-CO')}`;

const formatDate = (value?: string | null) => formatDateDisplay(value);

/** Timestamp para ordenar “lo último que reservó” (personalizada, programada o finca). */
const parseReservaOrdenMs = (raw: unknown): number => {
  if (raw == null) return 0;
  const s = String(raw).trim();
  if (!s) return 0;
  const hasClock = /[T ]\d{1,2}:\d/.test(s);
  const candidate = hasClock ? s : `${s.slice(0, 10)}T12:00:00`;
  const ms = Date.parse(candidate);
  return Number.isFinite(ms) ? ms : 0;
};

const reservadaEnMsFromReservaRow = (booking: Record<string, unknown>): number => {
  const created = parseReservaOrdenMs(
    booking.fecha_creacion ?? booking.created_at ?? booking.fecha_registro,
  );
  if (created > 0) return created;
  return parseReservaOrdenMs(booking.fecha_reserva);
};

const reservadaEnMsFromSolicitud = (request: SolicitudPersonalizada): number => {
  const r = request as SolicitudPersonalizada & {
    created_at?: string | null;
    fecha_registro?: string | null;
  };
  const created = parseReservaOrdenMs(r.fecha_creacion ?? r.created_at ?? r.fecha_registro);
  if (created > 0) return created;
  return parseReservaOrdenMs(request.fecha_deseada);
};

const getStatusBadge = (status: string) => {
  const normalized = normalizeReservationStatus(status);
  const classes: Record<string, string> = {
    Confirmada: 'bg-green-600 text-white',
    Pendiente: 'bg-amber-500 text-white',
    Cancelada: 'bg-red-600 text-white',
    Completada: 'bg-blue-600 text-white',
  };
  return <Badge className={classes[normalized] || 'bg-slate-500 text-white'}>{normalized}</Badge>;
};

const getPaymentStatusBadge = (status: string) => {
  const normalized = normalizePaymentStatus(status);
  const classes: Record<string, string> = {
    Pagado: 'bg-green-600 text-white',
    Parcial: 'bg-blue-600 text-white',
    Pendiente: 'bg-amber-500 text-white',
    Cancelado: 'bg-red-600 text-white',
  };
  return <Badge className={classes[normalized] || 'bg-slate-500 text-white'}>{normalized}</Badge>;
};

const getInstallmentStatusBadge = (status?: string | null) => {
  const normalized = normalizeInstallmentStatus(status);
  const classes: Record<string, string> = {
    Aprobado: 'bg-green-600 text-white',
    Verificado: 'bg-blue-600 text-white',
    Pendiente: 'bg-amber-500 text-white',
    Rechazado: 'bg-red-600 text-white',
  };
  return <Badge className={classes[normalized] || 'bg-slate-500 text-white'}>{normalized}</Badge>;
};

const normalizeSolicitudStatus = (status?: string | null) => {
  const normalized = String(status || '').trim();
  if (!normalized) return 'PendienteRevision';
  return normalized;
};

/** El listado del cliente a veces omite `estado` o usa otra clave; unificamos antes de badge y filtros. */
const rawEstadoFromSolicitudPayload = (input: unknown): string => {
  if (input == null || typeof input !== 'object') return '';
  const p = input as Record<string, unknown>;
  const candidates: unknown[] = [
    p.estado,
    p.Estado,
    p.estado_solicitud,
    p.estado_descripcion,
    p.nombre_estado,
    p.estado_texto,
    p.estadoSolicitud,
    p.status,
  ];
  for (const c of candidates) {
    if (c == null) continue;
    if (typeof c === 'string') {
      const t = c.trim();
      if (t && t.toLowerCase() !== 'null' && t.toLowerCase() !== 'undefined') return t;
    }
    if (typeof c === 'number' || typeof c === 'boolean') return String(c);
    if (typeof c === 'object' && c !== null && 'label' in c) {
      const lab = (c as { label?: unknown }).label;
      if (typeof lab === 'string' && lab.trim()) return lab.trim();
    }
    if (typeof c === 'object' && c !== null && 'nombre' in c) {
      const nom = (c as { nombre?: unknown }).nombre;
      if (typeof nom === 'string' && nom.trim()) return nom.trim();
    }
  }
  const re = p.reserva_estado;
  if (typeof re === 'string' && re.trim()) return re.trim();
  return '';
};

const resolveSolicitudStatusForUi = (input: unknown): string => {
  const raw = rawEstadoFromSolicitudPayload(input);
  const p = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const idProg = Number(p.id_programacion ?? p.programacionId ?? 0);
  let effective = raw;
  if (!effective.trim() && Number.isFinite(idProg) && idProg > 0) effective = 'Convertida';
  return normalizeSolicitudStatus(effective);
};

/** Texto de estado para reglas de negocio (habilitar formulario de pago): acepta fila resumen o detalle API. */
const estadoTextoParaReglasSolicitud = (
  detail: SolicitudPersonalizada | null | undefined,
  summaryStatusFallback?: string | null,
) => {
  const fromDetail = detail ? rawEstadoFromSolicitudPayload(detail) || String(detail.estado || '').trim() : '';
  const merged = fromDetail || String(summaryStatusFallback || '').trim();
  return merged;
};

/** Sin espacios ni guiones bajos, para alinear variantes del API (`AprobadaParaPago`, `pago_habilitado`, `Pago habilitado`). */
const compactSolicitudEstado = (status?: string | null) =>
  String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-]+/g, '');

const solicitudEsPagoHabilitadoEstado = (status?: string | null) => {
  const c = compactSolicitudEstado(status);
  if (!c) return false;
  if (c.includes('aprobadaparapago')) return true;
  if (c.includes('pagohabilitado')) return true;
  if (c.includes('aprobada') && c.includes('pago') && !c.includes('rech')) return true;
  return false;
};

const solicitudEsConvertidaEstado = (status?: string | null) => {
  const n = String(status || '').trim().toLowerCase();
  const c = compactSolicitudEstado(status);
  if (/\bconvertida\b/.test(n)) return true;
  if (c.includes('convertida')) return true;
  return false;
};

const getSolicitudStatusBadge = (status?: string | null) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (/\brechaz/.test(normalized) || normalized.includes('rechaz')) {
    return (
      <Badge className="border border-red-200 bg-red-100 text-red-800 hover:bg-red-100">Rechazada</Badge>
    );
  }
  if (solicitudEsPagoHabilitadoEstado(status)) {
    return (
      <Badge className="border border-emerald-200 bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
        Pago habilitado
      </Badge>
    );
  }
  if (solicitudEsConvertidaEstado(status)) {
    return (
      <Badge className="border border-blue-200 bg-blue-100 text-blue-900 hover:bg-blue-100">Convertida</Badge>
    );
  }
  if (normalized.includes('coti')) {
    return (
      <Badge className="border border-sky-200 bg-sky-100 text-sky-900 hover:bg-sky-100">Cotizada</Badge>
    );
  }
  if (normalized.includes('cancel')) {
    return (
      <Badge className="border border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-100">Cancelada</Badge>
    );
  }
  return (
    <Badge className="border border-amber-200 bg-amber-100 text-amber-950 hover:bg-amber-100">
      Pendiente revisión
    </Badge>
  );
};

/** Misma lógica que en programación staff: quitar espacios y usar includes para variantes del backend ("Aprobada para pago", etc.). */
const solicitudHabilitadaParaPago = (status?: string | null) => {
  const c = compactSolicitudEstado(status);
  if (!c) return false;
  if (c.includes('aprobadaparapago')) return true;
  if (c.includes('pagohabilitado')) return true;
  if (c === 'cotizada') return true;
  return false;
};

const formatDateTime = (date?: string | null, time?: string | null) =>
  formatDateTimeDisplay(date, time);

function getPagoFechaHoraRaw(payment: {
  fecha_pago?: string | null;
  fecha_verificacion?: string | null;
  fecha_creacion?: string | null;
  created_at?: string | null;
}): string | null {
  return (
    payment.fecha_pago ||
    payment.fecha_verificacion ||
    payment.fecha_creacion ||
    payment.created_at ||
    null
  );
}

const formatPaymentDateTime = (value?: string | null) => {
  const raw = String(value || '').trim();
  if (!raw) return '—';

  if (isoStringHasExplicitZone(raw)) {
    return formatInstantDisplay(raw);
  }

  if (raw.includes('T')) {
    const [datePart, timePart] = raw.split('T');
    const time = timePart?.replace(/Z$/i, '').slice(0, 8);
    if (time && /^\d{2}:\d{2}/.test(time)) {
      return formatDateTime(datePart, time);
    }
  }

  const spaceMatch = raw.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}(?::\d{2})?)/);
  if (spaceMatch) {
    return formatDateTime(spaceMatch[1], spaceMatch[2]);
  }

  return formatInstantDisplay(raw, formatDate(raw));
};

/** Alinea filtro de estado de reservas con filas de solicitud personalizada en la tabla unificada. */
const requestMatchesBookingsStatusFilter = (request: ClientRequestSummary, statusFilter: string) => {
  if (statusFilter === 'all') return true;
  const st = String(request.status || '').trim().toLowerCase();
  if (statusFilter === 'Pendiente') {
    return !st.includes('rech') && !solicitudEsConvertidaEstado(request.status);
  }
  if (statusFilter === 'Cancelada') {
    return st.includes('rech');
  }
  if (statusFilter === 'Confirmada' || statusFilter === 'Completada') {
    return solicitudEsConvertidaEstado(request.status);
  }
  return false;
};

const resolveServiceType = (value?: string | null): ClientBookingSummary['serviceType'] => {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('finca')) return 'Finca';
  if (normalized.includes('servicio')) return 'Servicio';
  if (normalized.includes('ruta')) return 'Ruta';
  return 'Reserva';
};

const resolveProgrammingRouteName = (detail: any) =>
  detail?.ruta_nombre ||
  detail?.nombre_ruta ||
  detail?.programacion?.ruta_nombre ||
  detail?.programacion?.nombre_ruta ||
  (detail?.id_ruta ? `Ruta #${detail.id_ruta}` : 'Ruta programada');

/** API `detalle_reserva_finca` usa `finca_nombre` (JOIN con finca); el cliente a veces esperaba `nombre_finca`. */
const fincaDisplayName = (item: any) =>
  item?.finca_nombre ||
  item?.nombre_finca ||
  item?.nombre ||
  (item?.id_finca != null ? `Finca #${item.id_finca}` : 'Finca');

const firstProgramacionLineFromReservaPayload = (booking: any): any | null => {
  if (!booking || typeof booking !== 'object') return null;
  if (Array.isArray(booking.programaciones) && booking.programaciones.length > 0) {
    return booking.programaciones[0];
  }
  if (booking.programacion && typeof booking.programacion === 'object') {
    return booking.programacion;
  }
  return null;
};

const collectIdRutasFromProgramacionLines = (lines: any[]): number[] => {
  const s = new Set<number>();
  if (!Array.isArray(lines)) return [];
  for (const item of lines) {
    const id = Number(item?.id_ruta ?? item?.programacion?.id_ruta ?? 0);
    if (Number.isFinite(id) && id > 0) s.add(id);
  }
  return [...s];
};

const formatOptionalServiciosOpcionales = (raw: unknown): string => {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw.trim();
  if (!Array.isArray(raw)) return '';
  const parts = raw
    .map((item: any) => {
      if (!item || typeof item !== 'object') return null;
      const id = Number(item.id_servicio ?? item.idServicio);
      const name = item.nombre ?? item.servicio_nombre ?? item.nombre_servicio ?? item.servicio?.nombre ?? '';
      const qty = Number(item.cantidad ?? item.cantidad_default ?? 1);
      const n = String(name).trim();
      if (n) return `${n}${Number.isFinite(qty) && qty > 1 ? ` ×${qty}` : ''}`;
      if (Number.isFinite(id) && id > 0) return `Servicio #${id}${Number.isFinite(qty) && qty > 1 ? ` ×${qty}` : ''}`;
      return null;
    })
    .filter(Boolean);
  return parts.length ? parts.join(', ') : '';
};

const formatOptionalServiciosOpcionalesFromReserva = (
  raw: unknown,
  reservaServicios: unknown,
): string => {
  if (raw == null) return '';
  if (!Array.isArray(raw)) return formatOptionalServiciosOpcionales(raw);

  const byId = new Map<number, string>();
  if (Array.isArray(reservaServicios)) {
    for (const s of reservaServicios as any[]) {
      const id = Number(s?.id_servicio ?? s?.idServicio ?? s?.id ?? 0);
      if (!Number.isFinite(id) || id <= 0) continue;
      const name =
        String(s?.servicio_nombre ?? s?.nombre_servicio ?? s?.nombre ?? s?.servicio?.nombre ?? '').trim();
      if (name) byId.set(id, name);
    }
  }

  const parts = (raw as any[])
    .map((item: any) => {
      if (!item || typeof item !== 'object') return null;
      const id = Number(item.id_servicio ?? item.idServicio ?? item.id);
      if (!Number.isFinite(id) || id <= 0) return null;
      const qty = Math.max(1, Number(item.cantidad ?? item.cantidad_default ?? item.cantidadDefault ?? 1) || 1);
      const directName = String(
        item.nombre ?? item.servicio_nombre ?? item.nombre_servicio ?? item.servicio?.nombre ?? ''
      ).trim();
      const mapped = byId.get(id) || '';
      const name = directName || mapped;
      const label = name ? name : `Servicio #${id}`;
      return `${label}${qty > 1 ? ` ×${qty}` : ''}`;
    })
    .filter(Boolean) as string[];

  return parts.length ? parts.join(', ') : '';
};

const mergeRecomendacionesFromRutas = (byId: Record<number, Ruta>): string => {
  const chunks: string[] = [];
  const seen = new Set<string>();
  for (const r of Object.values(byId)) {
    const t = extractRecomendacionesParticipantes(r);
    if (!t) continue;
    const key = t.slice(0, 160);
    if (seen.has(key)) continue;
    seen.add(key);
    chunks.push(t);
  }
  return chunks.join('\n\n');
};

function pickProgramacionEstadoRaw(item: any): string {
  if (!item || typeof item !== 'object') return '';
  const nested = item.programacion ?? item.detalle_programacion ?? null;
  const candidates = [
    item.estado_programacion,
    item.programacion_estado,
    item.estado_salida,
    nested?.estado,
    nested?.estado_programacion,
    item.estado,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return '';
}

function mergeProgramacionLineWithEnriched(line: any, enriched?: Record<string, unknown> | null) {
  if (!enriched) return line;
  const merged = { ...enriched, ...line, programacion: enriched };
  const fromEnriched = pickProgramacionEstadoRaw(enriched);
  const fromLine = pickProgramacionEstadoRaw(line);
  if (!fromLine && fromEnriched) {
    merged.estado_programacion = fromEnriched;
  }
  return merged;
}

function ProgramacionEstadoClienteCell({
  item,
  reserva,
}: {
  item: any;
  reserva?: Record<string, unknown> | null;
}) {
  const salidaRaw = pickProgramacionEstadoRaw(item);
  const reservaRaw = String((reserva as Record<string, unknown> | null)?.estado ?? '').trim();

  if (salidaRaw) {
    const salida = estadoSalidaParaCliente(salidaRaw);
    return (
      <Badge variant="outline" className={`font-normal text-xs ${salida.badgeClassName}`}>
        {salida.compactLabel}
      </Badge>
    );
  }

  if (reservaRaw) {
    return (
      <div className="space-y-1">
        {getStatusBadge(normalizeReservationStatus(reservaRaw))}
        <p className="text-[10px] text-gray-500 leading-tight">Según tu reserva</p>
      </div>
    );
  }

  if (Number(item?.id_programacion) > 0 && (item.fecha_salida || item.fecha_programada)) {
    const salida = estadoSalidaParaCliente('Programado');
    return (
      <Badge variant="outline" className={`font-normal text-xs ${salida.badgeClassName}`}>
        {salida.compactLabel}
      </Badge>
    );
  }

  const salida = estadoSalidaParaCliente(null);
  return (
    <Badge variant="outline" className={`font-normal text-xs ${salida.badgeClassName}`}>
      {salida.compactLabel}
    </Badge>
  );
}

function resolveGuiaPrincipalNombre(item: any): string {
  const parts = [
    item?.empleado_nombre,
    item?.empleado_apellido,
    item?.guia_nombre,
    item?.nombre_guia,
    item?.guia_principal_nombre,
    item?.programacion?.empleado_nombre,
    item?.programacion?.empleado_apellido,
  ]
    .map((x) => String(x || '').trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`.trim();
  }
  if (parts.length === 1) return parts[0];
  const id = Number(
    item?.id_empleado ?? item?.id_guia ?? item?.programacion?.id_empleado ?? 0,
  );
  return Number.isFinite(id) && id > 0 ? `Guía asignado (#${id})` : 'Por confirmar';
}

function resolveGuiaPrincipalTelefono(item: any): string {
  return String(
    item?.empleado_telefono ??
      item?.programacion?.empleado_telefono ??
      item?.guia_telefono ??
      '',
  ).trim();
}

function resolveGuiaPrincipalCorreo(item: any): string {
  return String(
    item?.empleado_correo ??
      item?.programacion?.empleado_correo ??
      item?.guia_correo ??
      item?.guia_email ??
      '',
  ).trim();
}

function resolveGuiaPrincipalRol(item: any): string {
  const parts = [
    item?.empleado_cargo,
    item?.empleado_rol_nombre,
    item?.programacion?.empleado_cargo,
    item?.programacion?.empleado_rol_nombre,
  ]
    .map((x) => String(x || '').trim())
    .filter(Boolean);
  return parts.join(' · ') || 'Guía turístico';
}

function resolveGuiasApoyoText(item: any): string {
  const nombres = item?.guias_apoyo_nombres ?? item?.empleados_apoyo_nombres;
  if (Array.isArray(nombres) && nombres.length > 0) {
    return nombres
      .map((n) => String(n || '').trim())
      .filter(Boolean)
      .join(', ');
  }
  const nested = item?.guias_apoyo;
  if (Array.isArray(nested) && nested.length > 0) {
    const asNames = nested
      .map((g) => {
        if (g && typeof g === 'object') {
          const o = g as Record<string, unknown>;
          const nom = [o.nombre, o.apellido, o.empleado_nombre, o.empleado_apellido]
            .map((x) => String(x || '').trim())
            .filter(Boolean)
            .join(' ');
          if (nom) return nom;
          const id = Number(o.id_empleado ?? o.id ?? 0);
          return id > 0 ? `Apoyo #${id}` : null;
        }
        const id = Number(g);
        return Number.isFinite(id) && id > 0 ? `Apoyo #${id}` : null;
      })
      .filter(Boolean);
    if (asNames.length) return asNames.join(', ');
  }
  const ids =
    item?.guias_apoyo_ids ??
    (Array.isArray(item?.guias_apoyo) &&
    item.guias_apoyo.every((x: unknown) => typeof x === 'number')
      ? item.guias_apoyo
      : null);
  if (Array.isArray(ids) && ids.length > 0) {
    return ids.map((id) => `Apoyo #${id}`).join(', ');
  }
  return '—';
}

function ReservaPagosClienteTable({
  pagos,
  isLoading,
  onVerComprobantes,
  comprobantesCount,
}: {
  pagos: PagoCliente[];
  isLoading: boolean;
  onVerComprobantes: () => void;
  comprobantesCount: number;
}) {
  const sorted = useMemo(
    () =>
      [...pagos].sort((a, b) => {
        const ta = parseReservaOrdenMs(getPagoFechaHoraRaw(a));
        const tb = parseReservaOrdenMs(getPagoFechaHoraRaw(b));
        return tb - ta;
      }),
    [pagos],
  );

  const totalAprobado = sorted
    .filter((p) => String(p.estado || '').toLowerCase().includes('apro'))
    .reduce((sum, p) => sum + Number(p.monto || 0), 0);

  return (
    <Card className="border-green-100 shadow-sm">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-green-900">Pagos realizados</CardTitle>
          <p className="text-sm font-normal text-muted-foreground mt-1">
            Abonos y comprobantes enviados para esta reserva. El estado lo valida OCCITOUR.
          </p>
        </div>
        {comprobantesCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-green-600 text-green-700 shrink-0"
            onClick={onVerComprobantes}
          >
            <Receipt className="mr-2 h-4 w-4" />
            Ver comprobantes ({comprobantesCount})
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {sorted.length > 0 ? (
          <>
            <div className="mb-4 flex flex-wrap gap-4 rounded-lg border border-green-100 bg-green-50/50 px-4 py-3 text-sm">
              <span>
                <span className="text-gray-600">Registros:</span>{' '}
                <strong className="text-green-900">{sorted.length}</strong>
              </span>
              <span>
                <span className="text-gray-600">Aprobado acumulado:</span>{' '}
                <strong className="text-green-900">{formatCurrency(totalAprobado)}</strong>
              </span>
            </div>
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead>ID</TableHead>
                    <TableHead>Fecha y hora</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Transacción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead className="text-right">Comprobante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((pago) => {
                    const url = String(pago.comprobante_url || '').trim();
                    return (
                      <TableRow key={pago.id_pago}>
                        <TableCell className="font-medium text-green-900">#{pago.id_pago}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatPaymentDateTime(getPagoFechaHoraRaw(pago))}
                        </TableCell>
                        <TableCell className="font-semibold text-green-800">
                          {formatCurrency(pago.monto)}
                        </TableCell>
                        <TableCell>{pago.metodo_pago || '—'}</TableCell>
                        <TableCell className="max-w-[140px] truncate text-sm" title={pago.numero_transaccion || ''}>
                          {pago.numero_transaccion?.trim() || '—'}
                        </TableCell>
                        <TableCell>{getInstallmentStatusBadge(pago.estado)}</TableCell>
                        <TableCell className="max-w-[200px] text-sm text-gray-700 whitespace-pre-wrap">
                          {pago.observaciones?.trim() || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-green-700 hover:underline inline-flex items-center gap-1"
                            >
                              Ver
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-500">Sin archivo</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600 py-4 text-center">
            {isLoading
              ? 'Cargando historial de pagos…'
              : 'Aún no hay pagos registrados para esta reserva.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ReservaGuiasClienteTable({
  lines,
  enrichedByProgId,
  reserva,
}: {
  lines: any[];
  enrichedByProgId?: Record<number, Record<string, unknown>>;
  reserva?: Record<string, unknown> | null;
}) {
  if (!Array.isArray(lines) || lines.length === 0) return null;

  return (
    <Card className="border-violet-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-violet-900 flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          Guías asignados
        </CardTitle>
        <p className="text-sm font-normal text-muted-foreground">
          Personal de OCCITOUR confirmado para tu salida (principal y apoyo).
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-violet-50/60">
                <TableHead>Salida</TableHead>
                <TableHead>Guía principal</TableHead>
                <TableHead>Guías de apoyo</TableHead>
                <TableHead>Estado de la salida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((rawLine) => {
                const progId = Number(rawLine?.id_programacion ?? 0);
                const item = mergeProgramacionLineWithEnriched(
                  rawLine,
                  progId > 0 ? enrichedByProgId?.[progId] : null,
                );
                return (
                  <TableRow key={rawLine.id_detalle_reserva_programacion || `g-${progId}`}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{resolveProgrammingRouteName(item)}</div>
                      <div className="text-xs text-gray-500">Programación #{progId || '—'}</div>
                    </TableCell>
                    <TableCell className="font-medium">{resolveGuiaPrincipalNombre(item)}</TableCell>
                    <TableCell className="text-sm">{resolveGuiasApoyoText(item)}</TableCell>
                    <TableCell>
                      <ProgramacionEstadoClienteCell item={item} reserva={reserva} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ReservaObservacionesClienteCard({ reserva, booking }: { reserva: any; booking: ClientBookingSummary }) {
  const notasReserva = String(reserva?.notas ?? booking.specialRequests ?? '').trim();
  const obsVenta = String(reserva?.venta?.observaciones ?? reserva?.observaciones_venta ?? '').trim();
  const motivoCancel = String(reserva?.motivo_cancelacion ?? '').trim();
  const obsPago = String(reserva?.motivo_desaprobacion_pago ?? booking.paymentRejectionNote ?? '').trim();

  const bloques: { titulo: string; texto: string; tono?: 'neutral' | 'alert' }[] = [];
  if (notasReserva) bloques.push({ titulo: 'Observaciones de tu reserva', texto: notasReserva });
  if (obsVenta) bloques.push({ titulo: 'Notas de la venta', texto: obsVenta });
  if (obsPago) bloques.push({ titulo: 'Motivo de revisión de pago', texto: obsPago, tono: 'alert' });
  if (motivoCancel) bloques.push({ titulo: 'Motivo de cancelación', texto: motivoCancel });

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <ClipboardList className="h-5 w-5" />
          Observaciones y notas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bloques.length > 0 ? (
          bloques.map((b) => (
            <div
              key={b.titulo}
              className={
                b.tono === 'alert'
                  ? 'rounded-lg border border-red-200 bg-red-50/80 p-4'
                  : 'rounded-lg border border-gray-100 bg-gray-50/80 p-4'
              }
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{b.titulo}</p>
              <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{b.texto}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No hay observaciones registradas para esta reserva.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ProgramacionesReservaClienteTable({
  lines,
  reserva,
  listMontoTotalHint,
  enrichedByProgId,
}: {
  lines: any[];
  /** Reserva/detalle (getById) para alinear totales con `monto_total` cuando el API duplica subtotal. */
  reserva?: Record<string, unknown> | null;
  /** Total de la misma reserva en el listado, si el detalle trae `monto_total` inflado. */
  listMontoTotalHint?: number | null;
  enrichedByProgId?: Record<number, Record<string, unknown>>;
}) {
  if (!Array.isArray(lines) || lines.length === 0) return null;

  const num = (v: unknown) => {
    const x = Number(v);
    return Number.isFinite(x) && x > 0 ? x : 0;
  };

  const hints =
    listMontoTotalHint != null && Number(listMontoTotalHint) > 0
      ? { listMontoTotal: listMontoTotalHint }
      : null;

  const filas = lines.map((item: any) => ({
    item,
    precio: clienteProgramacionPrecioFila(item, reserva ?? null, hints),
  }));

  const totalReserva = (() => {
    const r = reserva ?? null;
    if (!r) return 0;
    const venta =
      r['venta'] && typeof r['venta'] === 'object'
        ? (r['venta'] as Record<string, unknown>)
        : null;
    return Math.max(
      num(r['monto_total']),
      num(r['total']),
      venta ? num(venta['monto_total']) : 0,
      venta ? num(venta['total']) : 0,
    );
  })();

  const totalServicios = (() => {
    const r = reserva ?? null;
    const servicios = r && typeof r === 'object' ? (r['servicios'] as any) : null;
    if (!Array.isArray(servicios)) return 0;
    return servicios.reduce((acc: number, s: any) => acc + Math.max(0, Number(s?.subtotal ?? 0)), 0);
  })();

  const filasAjustadas =
    lines.length === 1 && totalReserva > 0 && totalServicios > 0
      ? filas.map(({ item, precio }) => {
          const people = Math.max(1, Math.floor(num(item?.cantidad_personas)) || 1);
          return {
            item,
            precio: {
              precioUnitarioMostrado: totalReserva / people,
              subtotalMostrado: totalReserva,
              ajusteTotalGrupo: true,
            },
          };
        })
      : filas;
  const mostrarNota = filasAjustadas.some((r) => r.precio.ajusteTotalGrupo);

  return (
    <Card className="border-blue-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-blue-900">Programación de la ruta</CardTitle>
        <p className="text-sm font-normal text-muted-foreground">
          Fechas, horarios, punto de encuentro, cupos y valores de tu salida programada.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50/60">
                <TableHead>Ruta / referencia</TableHead>
                <TableHead>Salida</TableHead>
                <TableHead>Regreso</TableHead>
                <TableHead>Punto de encuentro</TableHead>
                <TableHead>Dificultad</TableHead>
                <TableHead>Estado de salida</TableHead>
                <TableHead>Personas</TableHead>
                <TableHead>Precio u.</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filasAjustadas.map(({ item: rawItem, precio: p }) => {
                const progId = Number(rawItem?.id_programacion ?? 0);
                const item = mergeProgramacionLineWithEnriched(
                  rawItem,
                  progId > 0 ? enrichedByProgId?.[progId] : null,
                );
                const ubicacion = String(
                  item?.ruta_ubicacion ?? item?.ubicacion ?? item?.ruta?.ubicacion ?? '',
                ).trim();
                return (
                <TableRow key={item.id_detalle_reserva_programacion || `${item.id_programacion}-${item.subtotal}`}>
                  <TableCell className="min-w-[160px]">
                    <div className="font-medium text-gray-900">{resolveProgrammingRouteName(item)}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Programación #{item.id_programacion}</div>
                    {ubicacion ? (
                      <div className="text-xs text-gray-600 mt-1 flex items-start gap-1">
                        <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                        {ubicacion}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="min-w-[130px] text-sm whitespace-normal">
                    {formatDateTime(item.fecha_salida ?? item.fecha_programada, item.hora_salida)}
                  </TableCell>
                  <TableCell className="min-w-[130px] text-sm whitespace-normal">
                    {item.fecha_regreso || item.fecha_regreso_programada
                      ? formatDateTime(item.fecha_regreso ?? item.fecha_regreso_programada, item.hora_regreso)
                      : '—'}
                  </TableCell>
                  <TableCell className="max-w-[220px] text-sm whitespace-pre-wrap">
                    {item.lugar_encuentro?.trim() || 'Por confirmar'}
                  </TableCell>
                  <TableCell className="text-sm whitespace-normal">{item.dificultad?.trim() || '—'}</TableCell>
                  <TableCell>
                    <ProgramacionEstadoClienteCell item={item} reserva={reserva} />
                  </TableCell>
                  <TableCell className="text-center">{item.cantidad_personas ?? '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatCurrency(p.precioUnitarioMostrado)}</TableCell>
                  <TableCell className="whitespace-nowrap font-medium text-green-800">
                    {formatCurrency(p.subtotalMostrado)}
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </div>
        {mostrarNota ? (
          <p className="mt-3 text-xs text-muted-foreground">
            El <strong>subtotal</strong> mostrado coincide con el total de tu reserva para esta salida (precio acordado
            para el grupo). La columna <strong>Precio u.</strong> es el valor por persona calculado a partir de ese total.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ClienteRutaServiciosPredefinidosCard({ rutasById }: { rutasById: Record<number, Ruta> }) {
  const rows: { key: string; nombre: string; cantidad: number; requerido: boolean }[] = [];
  const seen = new Set<string>();
  for (const m of Object.values(rutasById)) {
    for (const p of extractRutaServiciosPredefinidos(m)) {
      const id = Number(p.id_servicio);
      const nombre = String(p.servicio?.nombre || '').trim() || `Servicio #${id}`;
      const key = `${id}-${nombre}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        key,
        nombre,
        cantidad: Number(p.cantidad_default ?? 1) || 1,
        requerido: Boolean(p.requerido),
      });
    }
  }
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Servicios incluidos con la ruta</CardTitle>
        <p className="text-sm font-normal text-muted-foreground">
          Lo que contempla el producto base de la ruta (puede sumarse a servicios adicionales contratados en tu reserva).
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-amber-50/50">
                <TableHead>Servicio</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Incluido en ruta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.key}>
                  <TableCell className="font-medium">{r.nombre}</TableCell>
                  <TableCell>{r.cantidad}</TableCell>
                  <TableCell>
                    {r.requerido ? (
                      <Badge variant="outline" className="font-normal text-xs border-green-300 text-green-800">
                        Sí
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-500">Opcional</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function pickPrimaryRutaForClienteDetalle(
  detail: Record<string, unknown> | null | undefined,
  rutasById: Record<number, Ruta>,
): Ruta | null {
  const idFromPayload = resolveRouteIdFromReservaPayload(detail);
  if (idFromPayload && rutasById[idFromPayload]) return rutasById[idFromPayload];
  const values = Object.values(rutasById);
  return values.length > 0 ? values[0] : null;
}

function ClienteReservaDetalleHero({
  booking,
  detail,
  rutasById,
  primaryProg,
}: {
  booking: ClientBookingSummary;
  detail: Record<string, unknown> | null | undefined;
  rutasById: Record<number, Ruta>;
  primaryProg: Record<string, unknown> | null;
}) {
  const ruta = pickPrimaryRutaForClienteDetalle(detail, rutasById);
  const titulo =
    resolveReservaProductoNombre(detail, { rutaDetalle: ruta }) ||
    (booking.serviceType === 'Finca' && Array.isArray((detail as any)?.fincas) && (detail as any).fincas[0]
      ? fincaDisplayName((detail as any).fincas[0])
      : resolveRouteNameFromReservaPayload(detail, { rutaDetalle: ruta }) ||
        (primaryProg ? resolveProgrammingRouteName(primaryProg) : '') ||
        booking.serviceName);

  const imagen = String(ruta?.imagen_principal ?? '').trim();
  const descripcion = String(ruta?.descripcion ?? '').trim();
  const salida = primaryProg
    ? formatDateTime(
        (primaryProg as any).fecha_salida ?? (primaryProg as any).fecha_programada,
        (primaryProg as any).hora_salida,
      )
    : booking.date;
  const regreso =
    primaryProg && ((primaryProg as any).fecha_regreso || (primaryProg as any).fecha_regreso_programada)
      ? formatDateTime(
          (primaryProg as any).fecha_regreso ?? (primaryProg as any).fecha_regreso_programada,
          (primaryProg as any).hora_regreso,
        )
      : null;
  const encuentro = String((primaryProg as any)?.lugar_encuentro ?? '').trim();

  return (
    <Card className="overflow-hidden border-green-200 shadow-md">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="relative min-h-[200px] bg-gradient-to-br from-green-800 to-emerald-600 lg:min-h-[240px]">
          {imagen ? (
            <ImageWithFallback
              src={imagen}
              alt={titulo}
              className="absolute inset-0 h-full w-full object-cover opacity-90"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-green-950/80 via-green-900/30 to-transparent" />
          <div className="relative flex h-full flex-col justify-end p-5 text-white">
            <Badge className="mb-2 w-fit bg-white/20 text-white hover:bg-white/25">{booking.serviceType}</Badge>
            <h3 className="text-2xl font-semibold leading-snug">{titulo}</h3>
            {booking.tripSummaryLine ? (
              <p className="mt-2 text-sm text-green-50/95 leading-relaxed">{booking.tripSummaryLine}</p>
            ) : null}
          </div>
        </div>
        <CardContent className="flex flex-col justify-center gap-4 p-5 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-green-100 bg-green-50/60 p-3">
              <p className="text-xs text-gray-500">Salida / inicio</p>
              <p className="font-semibold text-gray-900">{salida}</p>
            </div>
            {regreso ? (
              <div className="rounded-lg border border-green-100 bg-green-50/60 p-3">
                <p className="text-xs text-gray-500">Regreso</p>
                <p className="font-semibold text-gray-900">{regreso}</p>
              </div>
            ) : null}
            {encuentro ? (
              <div className="rounded-lg border border-green-100 bg-green-50/60 p-3 sm:col-span-2">
                <p className="text-xs text-gray-500">Punto de encuentro</p>
                <p className="font-medium text-gray-900 whitespace-pre-wrap">{encuentro}</p>
              </div>
            ) : null}
          </div>
          {descripcion ? (
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">{descripcion}</p>
          ) : (
            <p className="text-sm text-gray-500">
              Aquí verás la información operativa completa de tu reserva, pagos, guías y acompañantes.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {getStatusBadge(booking.status)}
            {getPaymentStatusBadge(booking.paymentStatus)}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function ClienteRutaContextoCard({ rutasById }: { rutasById: Record<number, Ruta> }) {
  const ruta = Object.values(rutasById)[0];
  if (!ruta) return null;
  const ubicacion = String(ruta.ubicacion ?? '').trim();
  const dificultad = String(ruta.dificultad ?? '').trim();
  const duracion =
    ruta.duracion_dias != null && Number(ruta.duracion_dias) > 0
      ? formatRutaDuracionHoras(ruta.duracion_dias)
      : '';

  if (!ubicacion && !dificultad && !duracion && !ruta.descripcion?.trim()) return null;

  return (
    <Card className="border-blue-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-blue-900 flex items-center gap-2">
          <RouteIcon className="h-5 w-5" />
          Sobre la ruta reservada
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        {duracion ? (
          <div>
            <p className="text-gray-500">Duración</p>
            <p className="font-medium text-gray-900">{duracion}</p>
          </div>
        ) : null}
        {dificultad ? (
          <div>
            <p className="text-gray-500">Dificultad</p>
            <p className="font-medium text-gray-900">{dificultad}</p>
          </div>
        ) : null}
        {ubicacion ? (
          <div className="sm:col-span-3">
            <p className="text-gray-500">Ubicación</p>
            <p className="font-medium text-gray-900">{ubicacion}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ClienteTitularReservaCard({
  user,
  detail,
}: {
  user: { name?: string; email?: string; phone?: string; tipo_documento?: string; numero_documento?: string } | null;
  detail: Record<string, unknown> | null | undefined;
}) {
  const nombre =
    String(
      (detail as any)?.cliente_nombre ??
        (detail as any)?.nombre_cliente ??
        user?.name ??
        '',
    ).trim() || 'Titular';
  const apellido = String((detail as any)?.cliente_apellido ?? '').trim();
  const nombreCompleto = `${nombre} ${apellido}`.trim();
  const documento = formatDocumentoClienteDisplay({
    tipo: (detail as any)?.tipo_documento ?? user?.tipo_documento,
    numero: (detail as any)?.numero_documento ?? user?.numero_documento,
    cliente: (detail as any)?.cliente,
  });

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-green-700" />
          Titular de la reserva
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Nombre</p>
          <p className="font-medium text-gray-900">{nombreCompleto}</p>
        </div>
        <div>
          <p className="text-gray-500">Documento</p>
          <p className="font-medium text-gray-900">{documento}</p>
        </div>
        <div>
          <p className="text-gray-500">Correo</p>
          <p className="font-medium text-gray-900 break-all">{user?.email || (detail as any)?.cliente_email || '—'}</p>
        </div>
        <div>
          <p className="text-gray-500">Teléfono</p>
          <p className="font-medium text-gray-900">
            {String((detail as any)?.cliente_telefono ?? user?.phone ?? '').trim() || '—'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ClienteRecomendacionesSalidaCard({ texto }: { texto: string }) {
  const t = texto.trim();
  if (!t) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recomendaciones para participantes</CardTitle>
        <p className="text-sm font-normal text-muted-foreground">
          Indicaciones de la ruta: equipaje, clima, puntualidad, hidratación, etc.
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{t}</p>
      </CardContent>
    </Card>
  );
}

const CLIENT_FINCA_BALANCE_PROOF_MAX = 5 * 1024 * 1024;
const CLIENT_FINCA_BALANCE_PROOF_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

/** Comprobante de pago para solicitud personalizada (mismo criterio que salida programada). */
const CLIENT_SOLICITUD_PROOF_MAX = 5 * 1024 * 1024;
const CLIENT_SOLICITUD_PROOF_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

const CLIENT_CANCEL_MOTIVO_MIN = 10;
const CLIENT_COMPROBANTE_NOMBRE_MAX = 180;
const CLIENT_METODO_PAGO_MAX = 40;
const CLIENT_TRANSACCION_MAX = 80;



function mergePagosClienteDedupe(pagosLists: Array<PagoCliente[] | undefined | null>): PagoCliente[] {
  const seen = new Set<number>();
  const out: PagoCliente[] = [];
  for (const list of pagosLists) {
    if (!Array.isArray(list)) continue;
    for (const p of list) {
      const id = Number(p?.id_pago);
      if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue;
      seen.add(id);
      out.push(p);
    }
  }
  return out;
}

function clientePagoTieneComprobante(p: PagoCliente): boolean {
  return Boolean(String(p?.comprobante_url || '').trim());
}

/** Detecta si el comprobante se puede incrustar como imagen */
function clienteComprobanteEsImagenParaVista(url: string, mime?: string | null): boolean {
  if (mime && String(mime).toLowerCase().startsWith('image/')) return true;
  const u = url.toLowerCase();
  if (u.startsWith('data:image/')) return true;
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(u);
}

function clienteComprobanteEsPdfParaVista(url: string, mime?: string | null): boolean {
  if (mime && String(mime).toLowerCase().includes('pdf')) return true;
  const u = url.toLowerCase();
  return u.includes('application/pdf') || u.endsWith('.pdf');
}

export function ClientDashboardImproved({ initialSelectedItemId }: { initialSelectedItemId?: string }) {
  const { user, adminActiveTab } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [clientId, setClientId] = useState<number | null>(null);
  const [isResolvingClientId, setIsResolvingClientId] = useState(true);
  const [bookingsView, setBookingsView] = useState<ClientBookingView>('list');
  const [salesView, setSalesView] = useState<ClientSaleView>('list');
  const [paymentsView, setPaymentsView] = useState<ClientPaymentView>('list');
  const [programmingView, setProgrammingView] = useState<ClientProgrammingView>('list');
  const [bookings, setBookings] = useState<ClientBookingSummary[]>([]);
  const [requests, setRequests] = useState<ClientRequestSummary[]>([]);
  const [sales, setSales] = useState<ClientSaleSummary[]>([]);
  const [payments, setPayments] = useState<ClientPaymentSummary[]>([]);
  const [programmings, setProgrammings] = useState<ClientProgrammingSummary[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<ClientBookingSummary | null>(null);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<any>(null);
  const [bookingDetailPagos, setBookingDetailPagos] = useState<PagoCliente[]>([]);
  const [bookingProgEnriched, setBookingProgEnriched] = useState<Record<number, Record<string, unknown>>>({});
  const [bookingComprobanteDialogOpen, setBookingComprobanteDialogOpen] = useState(false);
  const [bookingDetailRutasById, setBookingDetailRutasById] = useState<Record<number, Ruta>>({});
  const [selectedRequest, setSelectedRequest] = useState<ClientRequestSummary | null>(null);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState<SolicitudPersonalizada | null>(null);
  const [selectedRequestLinkedBooking, setSelectedRequestLinkedBooking] = useState<any>(null);
  const [requestDetailRutasById, setRequestDetailRutasById] = useState<Record<number, Ruta>>({});
  const [requestProgEnriched, setRequestProgEnriched] = useState<Record<number, Record<string, unknown>>>({});
  const [selectedRequestPayments, setSelectedRequestPayments] = useState<PagoSolicitud[]>([]);
  const [selectedSale, setSelectedSale] = useState<ClientSaleSummary | null>(null);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Venta | null>(null);
  const [selectedSalePayments, setSelectedSalePayments] = useState<PagoCliente[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<ClientPaymentSummary | null>(null);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<PagoCliente | null>(null);
  const [selectedPaymentSale, setSelectedPaymentSale] = useState<Venta | null>(null);
  const [selectedProgramming, setSelectedProgramming] = useState<ClientProgrammingSummary | null>(null);
  const [selectedProgrammingDetail, setSelectedProgrammingDetail] = useState<any>(null);
  const [selectedProgrammingBooking, setSelectedProgrammingBooking] = useState<any>(null);
  const [selectedProgrammingRoute, setSelectedProgrammingRoute] = useState<Ruta | null>(null);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isLoadingBookingDetail, setIsLoadingBookingDetail] = useState(false);
  const [isLoadingBookingPagos, setIsLoadingBookingPagos] = useState(false);
  const [cancelReservaOpen, setCancelReservaOpen] = useState(false);
  const [cancelReservaMotivo, setCancelReservaMotivo] = useState('');
  const [isCancellingReserva, setIsCancellingReserva] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingRequestDetail, setIsLoadingRequestDetail] = useState(false);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [isLoadingSaleDetail, setIsLoadingSaleDetail] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isLoadingPaymentDetail, setIsLoadingPaymentDetail] = useState(false);
  const [isLoadingProgrammings, setIsLoadingProgrammings] = useState(false);
  const [isLoadingProgrammingDetail, setIsLoadingProgrammingDetail] = useState(false);
  const [isSubmittingRequestPayment, setIsSubmittingRequestPayment] = useState(false);
  const [bookingsSearchTerm, setBookingsSearchTerm] = useState('');
  const [bookingsStatusFilter, setBookingsStatusFilter] = useState('all');
  const [bookingsPage, setBookingsPage] = useState(1);

  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [salesStatusFilter, setSalesStatusFilter] = useState('all');
  const [salesPage, setSalesPage] = useState(1);

  const [paymentsSearchTerm, setPaymentsSearchTerm] = useState('');
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState('all');
  const [paymentsFlowFilter, setPaymentsFlowFilter] = useState<'all' | ClientPaymentFlowKind>('all');
  const [paymentsPage, setPaymentsPage] = useState(1);

  const [programmingSearchTerm, setProgrammingSearchTerm] = useState('');
  const [programmingSortFilter, setProgrammingSortFilter] = useState<ClientProgrammingsSort>('date-asc');
  const [programmingPage, setProgrammingPage] = useState(1);
  const [requestPaymentData, setRequestPaymentData] = useState({
    monto: '',
    metodo_pago: 'Transferencia',
    numero_transaccion: '',
    /** Data URL del archivo (PDF o imagen). */
    comprobante_url: '',
    comprobante_nombre: '',
    comprobante_tipo: '',
    observaciones: '',
  });
  const [requestProofFile, setRequestProofFile] = useState<File | null>(null);
  const requestProofInputRef = useRef<HTMLInputElement>(null);
  const bookingDetailLoadTokenRef = useRef(0);
  const requestDetailLoadTokenRef = useRef(0);
  const [resubmitPago, setResubmitPago] = useState({
    metodo_pago: 'Transferencia',
    numero_transaccion: '',
    observaciones: '',
  });
  const [resubmitProofName, setResubmitProofName] = useState('');
  const [resubmitProofDataUrl, setResubmitProofDataUrl] = useState('');
  const [resubmitProofMime, setResubmitProofMime] = useState('');
  const [resubmitProofFile, setResubmitProofFile] = useState<File | null>(null);
  const [isSubmittingResubmitPago, setIsSubmittingResubmitPago] = useState(false);
  const [fincaSaldoComprobanteBloqueado, setFincaSaldoComprobanteBloqueado] = useState(false);
  const [isCheckingFincaSaldoGate, setIsCheckingFincaSaldoGate] = useState(false);
  const [fincaSaldoPagoForm, setFincaSaldoPagoForm] = useState({
    metodo_pago: 'Transferencia',
    numero_transaccion: '',
    observaciones: '',
  });
  const [fincaSaldoProofFile, setFincaSaldoProofFile] = useState<File | null>(null);
  const [isSubmittingFincaSaldoPago, setIsSubmittingFincaSaldoPago] = useState(false);

  useEffect(() => {
    if (!selectedPayment) {
      setResubmitPago({ metodo_pago: 'Transferencia', numero_transaccion: '', observaciones: '' });
      setResubmitProofName('');
      setResubmitProofDataUrl('');
      setResubmitProofMime('');
      setResubmitProofFile(null);
    }
  }, [selectedPayment]);

  useEffect(() => {
    if (adminActiveTab && CLIENT_DASHBOARD_TABS.has(adminActiveTab)) {
      setActiveTab(adminActiveTab);
    }
  }, [adminActiveTab]);

  const initialSelectionHandledRef = useRef(false);

  useEffect(() => {
    if (initialSelectedItemId) {
      if (initialSelectedItemId.startsWith('reserva-') || initialSelectedItemId.startsWith('solicitud-')) {
        setActiveTab('bookings');
      }
    }
  }, [initialSelectedItemId]);

  useEffect(() => {
    if (initialSelectedItemId && activeTab === 'bookings' && !initialSelectionHandledRef.current) {
      if (initialSelectedItemId.startsWith('solicitud-') && requests.length > 0) {
        const id = initialSelectedItemId.replace('solicitud-', '');
        const req = requests.find((r) => r.id === id);
        if (req) {
          openRequestDetail(req);
          initialSelectionHandledRef.current = true;
        }
      } else if (initialSelectedItemId.startsWith('reserva-') && bookings.length > 0) {
        const id = initialSelectedItemId.replace('reserva-', '');
        const bk = bookings.find((b) => b.id === id);
        if (bk) {
          openDetailView(bk);
          initialSelectionHandledRef.current = true;
        }
      }
    }
  }, [initialSelectedItemId, requests, bookings, activeTab]);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      if (!user?.id && !user?.email) {
        if (!cancelled) {
          setClientId(null);
          setIsResolvingClientId(false);
        }
        return;
      }

      setIsResolvingClientId(true);
      try {
        const fromUser = Number(user?.clientId ?? 0);
        const id =
          Number.isFinite(fromUser) && fromUser > 0
            ? fromUser
            : await resolveClientIdForSession({ userId: user?.id, email: user?.email });
        if (!cancelled) setClientId(id);
      } catch {
        if (!cancelled) setClientId(null);
      } finally {
        if (!cancelled) setIsResolvingClientId(false);
      }
    };

    void resolve();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.email]);

  const fetchMisReservas = async (): Promise<any[]> => {
    try {
      return await reservasAPI.getMine();
    } catch (error) {
      console.warn('GET /api/reservas/mias no disponible, intentando por id_cliente…', error);
    }
    const fromUser = Number(user?.clientId ?? 0);
    const idCliente =
      (Number.isFinite(fromUser) && fromUser > 0 ? fromUser : null) ??
      clientId ??
      (await resolveClientIdForSession({ userId: user?.id, email: user?.email }));
    if (idCliente) {
      return reservasAPI.getByCliente(idCliente);
    }
    return [];
  };

  const loadBookings = async () => {
    if (!user?.id) {
      setBookings([]);
      return;
    }

    try {
      setIsLoadingBookings(true);
      const data = await fetchMisReservas();
      const mapped: ClientBookingSummary[] = data.map((booking: any) => {
        const serviceType = resolveServiceType(booking.tipo_servicio);
        const prog = firstProgramacionLineFromReservaPayload(booking);
        const tripParts: string[] = [];
        if (prog) {
          const dep = formatDateTime(prog.fecha_salida ?? prog.fecha_programada, prog.hora_salida);
          if (dep && dep !== '—') tripParts.push(`Salida: ${dep}`);
          if (prog.fecha_regreso || prog.fecha_regreso_programada) {
            const ret = formatDateTime(
              prog.fecha_regreso ?? prog.fecha_regreso_programada,
              prog.hora_regreso,
            );
            if (ret && ret !== '—') tripParts.push(`Regreso: ${ret}`);
          }
          const meet = String(prog.lugar_encuentro || '').trim();
          if (meet) tripParts.push(`Encuentro: ${meet}`);
          const dif = String(prog.dificultad || '').trim();
          if (dif) tripParts.push(dif);
        }
        return {
          id: String(booking.id_reserva ?? booking.id ?? ''),
          saleId: booking.id_venta != null ? Number(booking.id_venta) : null,
          serviceType,
          serviceName: resolveReservaServicioEtiqueta(booking),
          date: formatDate(booking.fecha_reserva),
          reservedAtMs: reservadaEnMsFromReservaRow(booking as Record<string, unknown>),
          status: normalizeReservationStatus(booking.estado),
          paymentStatus: clientDisplayEstadoPagoVenta(serviceType, booking.estado_pago),
          paymentMethod: booking.metodo_pago || 'Por definir',
          participants: Number(booking.numero_participantes ?? 1),
          totalAmount: Number(booking.total ?? booking.monto_total ?? 0),
          paidAmount: Number(booking.monto_pagado ?? 0),
          pendingAmount: Number(booking.saldo_pendiente ?? booking.total ?? booking.monto_total ?? 0),
          specialRequests: booking.notas || '',
          tripSummaryLine: tripParts.length ? tripParts.join(' · ') : undefined,
          paymentRejectionNote: reservaMotivoDesaprobacionPago(booking),
        };
      });
      setBookings(mapped);
    } catch (error: any) {
      console.error('Error al cargar las reservas del cliente:', error);
      toast.error('No se pudieron cargar tus reservas', {
        description: error?.message || 'Revisa que el backend esté activo e inicia sesión de nuevo.',
      });
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const loadRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const data = await solicitudesPersonalizadasAPI.getMine();
      const mapped: ClientRequestSummary[] = data.map((request) => {
        const tripParts: string[] = [];
        const sol = formatDateTime(request.fecha_deseada, request.hora_deseada);
        if (sol && sol !== '—') tripParts.push(`Solicitado: ${sol}`);
        const le = String(request.lugar_encuentro || '').trim();
        if (le) tripParts.push(`Encuentro: ${le}`);
        if (request.fecha_regreso_deseada) {
          const reg = formatDateTime(request.fecha_regreso_deseada, request.hora_regreso_deseada);
          if (reg && reg !== '—') tripParts.push(`Regreso: ${reg}`);
        }
        return {
          id: String(request.id_solicitud_personalizada),
          routeName: request.ruta_nombre || `Ruta #${request.id_ruta}`,
          requestedDate: formatDate(request.fecha_deseada),
          requestedTime: request.hora_deseada || '',
          reservedAtMs: reservadaEnMsFromSolicitud(request),
          status: resolveSolicitudStatusForUi(request),
          programacionId: request.id_programacion != null ? Number(request.id_programacion) : null,
          people: Number(request.cantidad_personas || 1),
          quoteAmount: Number(request.precio_cotizado || request.reserva_monto_total || 0),
          reservationId: request.id_reserva != null ? Number(request.id_reserva) : null,
          saleId: request.id_venta != null ? Number(request.id_venta) : null,
          paymentStatus: clientDisplayEstadoPagoVentaSolicitudPersonalizada(request),
          pendingBalance: Number(
            request.venta_saldo_pendiente ?? request.reserva_monto_total ?? request.precio_cotizado ?? 0,
          ),
          observations: request.observaciones || '',
          tripSummaryLine: tripParts.length ? tripParts.join(' · ') : undefined,
        };
      });
      setRequests(mapped);
    } catch (error) {
      console.error('Error al cargar solicitudes personalizadas del cliente:', error);
      setRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const loadSales = async () => {
    if (!user?.id) {
      setSales([]);
      return;
    }

    try {
      setIsLoadingSales(true);
      const reservas = await fetchMisReservas();
      const mapped: ClientSaleSummary[] = reservas
        .filter((booking: any) => Number(booking.id_venta ?? 0) > 0)
        .map((booking: any) => {
          const reservationId = Number(booking.id_reserva ?? booking.id ?? 0);
          const saleId = Number(booking.id_venta ?? 0);
          return {
            id: `VEN-${saleId}`,
            saleId,
            reservationId,
            serviceName: resolveReservaServicioEtiqueta(booking),
            serviceType: resolveServiceType(booking.tipo_servicio),
            date: formatDate(booking.fecha_reserva),
            total: Number(booking.total ?? booking.monto_total ?? 0),
            paid: Number(booking.monto_pagado ?? 0),
            pending: Number(booking.saldo_pendiente ?? booking.total ?? booking.monto_total ?? 0),
            paymentStatus: clientDisplayEstadoPagoVenta(
              resolveServiceType(booking.tipo_servicio),
              booking.estado_pago,
            ),
            paymentMethod: booking.metodo_pago || 'Por definir',
          };
        });
      setSales(mapped);
    } catch (error) {
      console.error('Error al cargar ventas del cliente:', error);
      setSales([]);
    } finally {
      setIsLoadingSales(false);
    }
  };

  const loadPayments = async () => {
    if (!user?.id) {
      setPayments([]);
      return;
    }

    try {
      setIsLoadingPayments(true);
      const reservas = await fetchMisReservas();
      const pagosPorReserva = await Promise.all(
        reservas.map(async (booking: any) => {
          const reservationId = Number(booking.id_reserva ?? booking.id ?? 0);
          if (!reservationId) return [];
          try {
            const pagos = await pagosAPI.getByReserva(reservationId);
            return pagos.map((payment) => ({ payment, booking }));
          } catch (error) {
            console.error(`Error al cargar abonos de la reserva ${reservationId}:`, error);
            return [];
          }
        })
      );

      const mapped: ClientPaymentSummary[] = pagosPorReserva.flat().map(({ payment, booking }: any) => {
        const reservationId = Number(payment.id_reserva ?? booking.id_reserva ?? booking.id ?? 0);
        const saleId = Number(payment.id_venta ?? booking.id_venta ?? 0);
        const flow = resolveClientPaymentFlowKind(booking);
        const declared = Number(payment.monto ?? 0);
        const totalSalida =
          flow === 'programmed_route'
            ? montoPagoUnicoSalidaProgramada({
                checkoutMontoTotal: booking.monto_total ?? booking.total,
                venta: {
                  monto_total: booking.monto_total ?? booking.total,
                  monto_pagado: booking.monto_pagado,
                  saldo_pendiente: booking.saldo_pendiente,
                },
                estimate: null,
              })
            : 0;
        return {
          id: `PAG-${payment.id_pago}`,
          paymentId: Number(payment.id_pago),
          reservationId,
          saleId,
          serviceName: resolveReservaServicioEtiqueta(booking),
          serviceType: resolveServiceType(booking.tipo_servicio),
          paymentFlowKind: flow,
          date: formatDate(payment.fecha_pago || payment.fecha_creacion),
          amount: flow === 'programmed_route' && totalSalida > 0 ? Math.max(declared, totalSalida) : declared,
          status: normalizeInstallmentStatus(payment.estado),
          method: payment.metodo_pago || 'Por definir',
          receiptUrl: payment.comprobante_url || null,
          paymentRejectionNote: reservaMotivoDesaprobacionPago(booking),
        };
      });
      setPayments(mapped);
    } catch (error) {
      console.error('Error al cargar abonos del cliente:', error);
      setPayments([]);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const loadProgrammings = async () => {
    if (!user?.id) {
      setProgrammings([]);
      return;
    }

    try {
      setIsLoadingProgrammings(true);
      const reservas = await fetchMisReservas();
      const listTotalByReservaId = new Map<number, number>();
      for (const row of reservas as any[]) {
        const id = Number(row?.id_reserva ?? row?.id ?? 0);
        if (!id) continue;
        const t = Number(row?.total ?? row?.monto_total ?? 0);
        if (t > 0) listTotalByReservaId.set(id, t);
      }

      const detailedBookings = await Promise.all(
        reservas.map(async (booking: any) => {
          const bookingId = Number(booking.id_reserva ?? booking.id ?? 0);
          try {
            return await reservasAPI.getById(bookingId);
          } catch (error) {
            console.error(`Error al cargar programación de la reserva ${bookingId}:`, error);
            return null;
          }
        })
      );

      const items: ClientProgrammingSummary[] = [];
      detailedBookings.forEach((detail: any) => {
        if (!detail || !Array.isArray(detail.programaciones)) return;
        const est = String(detail.estado || '').trim().toLowerCase();
        if (est === 'cancelada') return;
        detail.programaciones.forEach((item: any) => {
          const programacionId = Number(item.id_programacion ?? 0);
          if (!programacionId) return;
          const reservaId = Number(detail.id_reserva ?? 0);
          const listHint = reservaId ? listTotalByReservaId.get(reservaId) : undefined;
          const createdAtMs =
            parseReservaOrdenMs(
              item.fecha_creacion ??
                item.created_at ??
                detail.fecha_creacion ??
                detail.created_at ??
                detail.fecha_registro,
            ) || programacionId;

          items.push({
            id: `PRO-${programacionId}-${detail.id_reserva}`,
            programacionId,
            reservationId: reservaId,
            routeName: item.ruta_nombre || item.nombre_ruta || detail.tipo_servicio || `Programación #${programacionId}`,
            date: formatDate(item.fecha_programada || item.fecha_salida),
            startTime: String(item.hora_salida || '').slice(0, 5),
            people: Number(item.cantidad_personas ?? detail.numero_participantes ?? 1),
            subtotal: clienteProgramacionPrecioFila(
              item,
              detail,
              listHint ? { listMontoTotal: listHint } : null,
            ).subtotalMostrado,
            meetingPoint: item.lugar_encuentro || 'Por confirmar',
            difficulty: item.dificultad || 'No definida',
            createdAtMs,
            salidaAtMs:
              parseReservaOrdenMs(item.fecha_programada || item.fecha_salida) || createdAtMs,
          });
        });
      });
      setProgrammings(items);
    } catch (error) {
      console.error('Error al cargar programaciones del cliente:', error);
      setProgrammings([]);
    } finally {
      setIsLoadingProgrammings(false);
    }
  };

  const loadBookingDetail = async (bookingId: string) => {
    const loadToken = ++bookingDetailLoadTokenRef.current;
    const idNum = Number(bookingId);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      setSelectedBookingDetail(null);
      setBookingDetailPagos([]);
      setBookingProgEnriched({});
      return;
    }

    try {
      setIsLoadingBookingDetail(true);
      setIsLoadingBookingPagos(true);

      const [detail, pagosReserva] = await Promise.all([
        reservasAPI.getById(idNum),
        pagosAPI.getByReserva(idNum).catch(() => [] as PagoCliente[]),
      ]);

      if (loadToken !== bookingDetailLoadTokenRef.current) return;

      // Muestra el detalle base lo antes posible; el resto se completa en background.
      setSelectedBookingDetail(detail);
      setIsLoadingBookingDetail(false);

      const idVenta = Number(
        (detail as any)?.id_venta ?? (detail as any)?.venta?.id_venta ?? (detail as any)?.idVenta ?? 0,
      );

      const pagosVentaPromise =
        idVenta > 0 ? pagosAPI.getByVenta(idVenta).catch(() => [] as PagoCliente[]) : Promise.resolve([] as PagoCliente[]);

      const enrichPromise = enrichReservaRouteContext(detail).catch(() => ({
        detalleEnriched: detail,
        rutaDetalle: null,
        solicitud: null,
      }));

      const progLines = Array.isArray((detail as any)?.programaciones)
        ? (((detail as any).programaciones as any[]) ?? [])
        : [];
      const progIds = [
        ...new Set(
          progLines
            .map((line) => Number(line?.id_programacion ?? 0))
            .filter((id) => Number.isFinite(id) && id > 0),
        ),
      ];
      const progPromise = (async () => {
        if (progIds.length === 0) return {} as Record<number, Record<string, unknown>>;
        const results = await Promise.all(progIds.map((id) => programacionAPI.getById(id).catch(() => null)));
        const map: Record<number, Record<string, unknown>> = {};
        for (const p of results) {
          const pid = Number((p as any)?.id_programacion ?? 0);
          if (pid > 0) map[pid] = p as Record<string, unknown>;
        }
        return map;
      })();

      const [pagosVenta, enrichResult, progMap] = await Promise.all([pagosVentaPromise, enrichPromise, progPromise]);

      if (loadToken !== bookingDetailLoadTokenRef.current) return;

      setBookingDetailPagos(mergePagosClienteDedupe([pagosReserva, pagosVenta]));
      setIsLoadingBookingPagos(false);

      const detailForUi = enrichResult?.detalleEnriched ?? detail;
      setSelectedBookingDetail(detailForUi);

      // Cachea ruta si el enrich ya la trajo, para evitar un request extra.
      const rutaDetalle = enrichResult?.rutaDetalle as Ruta | null;
      const idRutaEnriquecida = Number(rutaDetalle?.id_ruta ?? resolveRouteIdFromReservaPayload(detailForUi) ?? 0);
      if (rutaDetalle && Number.isFinite(idRutaEnriquecida) && idRutaEnriquecida > 0) {
        setBookingDetailRutasById((prev) => ({ ...prev, [idRutaEnriquecida]: rutaDetalle }));
      }

      setBookingProgEnriched(progMap);

      setSelectedBooking((prev) => {
        if (!prev || String(prev.id) !== String(bookingId)) return prev;
        const note = reservaMotivoDesaprobacionPago(detailForUi);
        const estadoRaw = String((detailForUi as any)?.estado || '').trim();
        const nextStatus =
          estadoRaw && ['Pendiente', 'Confirmada', 'Cancelada', 'Completada'].includes(estadoRaw)
            ? estadoRaw
            : prev.status;
        if (note === prev.paymentRejectionNote && nextStatus === prev.status) return prev;
        return { ...prev, paymentRejectionNote: note, status: nextStatus };
      });
    } catch (error: any) {
      console.error('Error al cargar detalle de reserva del cliente:', error);
      setSelectedBookingDetail(null);
      setBookingDetailPagos([]);
      setBookingProgEnriched({});
      toast.error('No se pudo cargar el detalle de la reserva', {
        description: error?.message || 'Pulsa «Actualizar detalle» o vuelve al listado.',
      });
    } finally {
      if (loadToken === bookingDetailLoadTokenRef.current) {
        setIsLoadingBookingPagos(false);
        setIsLoadingBookingDetail(false);
        setTimeout(() => {
          document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 400);
      }
    }
  };

  const loadRequestDetail = async (requestId: string) => {
    const loadToken = ++requestDetailLoadTokenRef.current;
    const idNum = Number(requestId);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      setSelectedRequestDetail(null);
      setSelectedRequestPayments([]);
      setSelectedRequestLinkedBooking(null);
      return;
    }

    try {
      setIsLoadingRequestDetail(true);
      setSelectedRequestLinkedBooking(null);
      const [detail, payments] = await Promise.all([
        solicitudesPersonalizadasAPI.getById(idNum),
        solicitudesPersonalizadasAPI.listPagos(idNum).catch(() => [] as PagoSolicitud[]),
      ]);

      if (loadToken !== requestDetailLoadTokenRef.current) return;

      setSelectedRequestDetail(detail);
      setSelectedRequestPayments(payments);

      // No bloquea la vista esperando la reserva vinculada.
      setIsLoadingRequestDetail(false);

      const idRes = detail?.id_reserva != null ? Number(detail.id_reserva) : 0;
      if (Number.isFinite(idRes) && idRes > 0) {
        void reservasAPI
          .getById(idRes)
          .then((linked) => {
            if (loadToken !== requestDetailLoadTokenRef.current) return;
            setSelectedRequestLinkedBooking(linked);
          })
          .catch((e) => {
            if (loadToken !== requestDetailLoadTokenRef.current) return;
            console.error('Error al cargar la reserva vinculada a la solicitud:', e);
            setSelectedRequestLinkedBooking(null);
          });
      } else {
        setSelectedRequestLinkedBooking(null);
      }
    } catch (error) {
      console.error('Error al cargar detalle de solicitud personalizada:', error);
      setSelectedRequestDetail(null);
      setSelectedRequestPayments([]);
      setSelectedRequestLinkedBooking(null);
    } finally {
      if (loadToken === requestDetailLoadTokenRef.current) {
        setIsLoadingRequestDetail(false);
        setTimeout(() => {
          document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 400);
      }
    }
  };

  const loadSaleDetail = async (sale: ClientSaleSummary) => {
    try {
      setIsLoadingSaleDetail(true);
      const [detail, payments] = await Promise.all([
        ventasAPI.getById(sale.saleId),
        sale.saleId ? pagosAPI.getByVenta(sale.saleId) : Promise.resolve([]),
      ]);
      setSelectedSaleDetail(detail);
      setSelectedSalePayments(payments);
    } catch (error) {
      console.error('Error al cargar detalle de venta del cliente:', error);
      setSelectedSaleDetail(null);
      setSelectedSalePayments([]);
    } finally {
      setIsLoadingSaleDetail(false);
    }
  };

  const loadPaymentDetail = async (payment: ClientPaymentSummary) => {
    try {
      setIsLoadingPaymentDetail(true);
      const [detail, saleDetail] = await Promise.all([
        pagosAPI.getById(payment.paymentId),
        payment.saleId ? ventasAPI.getById(payment.saleId) : Promise.resolve(null),
      ]);
      setSelectedPaymentDetail(detail);
      setSelectedPaymentSale(saleDetail);
    } catch (error) {
      console.error('Error al cargar detalle del abono del cliente:', error);
      setSelectedPaymentDetail(null);
      setSelectedPaymentSale(null);
    } finally {
      setIsLoadingPaymentDetail(false);
    }
  };

  const loadProgrammingDetail = async (programming: ClientProgrammingSummary) => {
    try {
      setIsLoadingProgrammingDetail(true);
      setSelectedProgrammingRoute(null);
      const [bookingDetail, progFull] = await Promise.all([
        reservasAPI.getById(programming.reservationId),
        programacionAPI.getById(programming.programacionId).catch(() => null),
      ]);
      const line = Array.isArray(bookingDetail?.programaciones)
        ? bookingDetail.programaciones.find(
            (entry: any) => Number(entry.id_programacion) === programming.programacionId,
          )
        : null;

      const mergedDetail =
        line && progFull
          ? { ...line, ...progFull, programacion: progFull }
          : progFull ?? line;

      setSelectedProgrammingBooking(bookingDetail);
      setSelectedProgrammingDetail(mergedDetail);

      let idRuta = Number(
        mergedDetail?.id_ruta ??
          line?.id_ruta ??
          (line as any)?.idRuta ??
          (line as any)?.programacion?.id_ruta ??
          progFull?.id_ruta ??
          0,
      );
      if (!Number.isFinite(idRuta) || idRuta <= 0) {
        idRuta = Number(progFull?.id_ruta ?? 0);
      }
      if (!Number.isFinite(idRuta) || idRuta <= 0) {
        try {
          const prog = progFull ?? (await programacionAPI.getById(programming.programacionId));
          idRuta = Number(prog?.id_ruta ?? 0);
        } catch {
          idRuta = 0;
        }
      }

      if (Number.isFinite(idRuta) && idRuta > 0) {
        try {
          const [rById, rActiva] = await Promise.all([
            rutasAPI.getById(idRuta).catch(() => null),
            rutasAPI.getActivaById(idRuta).catch(() => null),
          ]);
          const merged =
            rById || rActiva
              ? ({ ...(rActiva as object), ...(rById as object), id_ruta: idRuta } as Ruta)
              : null;
          setSelectedProgrammingRoute(merged);
        } catch {
          setSelectedProgrammingRoute(null);
        }
      } else {
        setSelectedProgrammingRoute(null);
      }
    } catch (error) {
      console.error('Error al cargar detalle de programación del cliente:', error);
      setSelectedProgrammingBooking(null);
      setSelectedProgrammingDetail(null);
      setSelectedProgrammingRoute(null);
    } finally {
      setIsLoadingProgrammingDetail(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'bookings' || !user?.id) return;
    void loadBookings();
    void loadRequests();
  }, [activeTab, user?.id, user?.email, clientId]);

  useEffect(() => {
    if (activeTab !== 'sales' || !user?.id) return;
    void loadSales();
  }, [activeTab, user?.id, user?.email, clientId]);

  useEffect(() => {
    if (activeTab !== 'payments' || !user?.id) return;
    void loadPayments();
  }, [activeTab, user?.id, user?.email, clientId]);

  useEffect(() => {
    if (activeTab !== 'programming' || !user?.id) return;
    void loadProgrammings();
  }, [activeTab, user?.id, user?.email, clientId]);

  useEffect(() => {
    if (activeTab !== 'bookings' || bookingsView !== 'detail' || !selectedBooking?.id) return;
    void loadBookingDetail(selectedBooking.id);
  }, [activeTab, bookingsView, selectedBooking?.id]);

  useEffect(() => {
    setFincaSaldoProofFile(null);
    setFincaSaldoPagoForm({ metodo_pago: 'Transferencia', numero_transaccion: '', observaciones: '' });
    setFincaSaldoComprobanteBloqueado(false);
  }, [selectedBooking?.id, bookingsView]);

  useEffect(() => {
    if (activeTab !== 'bookings' || bookingsView !== 'detail' || !selectedBookingDetail) {
      return;
    }
    const saldo = Math.max(
      0,
      Number(selectedBookingDetail.saldo_pendiente ?? selectedBooking?.pendingAmount ?? 0),
    );
    const ventaId = Number(selectedBookingDetail.id_venta ?? selectedBooking?.saleId ?? 0);
    if (saldo <= 0 || ventaId <= 0) {
      setFincaSaldoComprobanteBloqueado(false);
      setIsCheckingFincaSaldoGate(false);
      return;
    }
    const rid = Number(selectedBookingDetail.id_reserva ?? selectedBooking?.id ?? 0);
    if (!rid) {
      setIsCheckingFincaSaldoGate(false);
      return;
    }

    const aplicarBloqueoFinca = (pagos: PagoCliente[]) => {
      const bloqueado = (pagos || []).some((p) =>
        ['Pendiente', 'Verificado'].includes(String(p.estado || '').trim()),
      );
      setFincaSaldoComprobanteBloqueado(bloqueado);
    };

    if (bookingDetailPagos.length > 0) {
      aplicarBloqueoFinca(bookingDetailPagos);
      setIsCheckingFincaSaldoGate(false);
      return;
    }

    let cancelled = false;
    setIsCheckingFincaSaldoGate(true);
    void pagosAPI
      .getByReserva(rid)
      .then((pagos) => {
        if (cancelled) return;
        aplicarBloqueoFinca(pagos);
      })
      .catch(() => {
        if (!cancelled) setFincaSaldoComprobanteBloqueado(true);
      })
      .finally(() => {
        if (!cancelled) setIsCheckingFincaSaldoGate(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    bookingsView,
    selectedBookingDetail,
    selectedBooking?.serviceType,
    selectedBooking?.id,
    bookingDetailPagos,
  ]);

  useEffect(() => {
    if (activeTab !== 'bookings' || bookingsView !== 'detail' || !selectedRequest?.id) return;
    void loadRequestDetail(selectedRequest.id);
  }, [activeTab, bookingsView, selectedRequest?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (activeTab !== 'bookings' || bookingsView !== 'detail' || !selectedBooking || selectedRequest) {
        if (!cancelled) setBookingDetailRutasById({});
        return;
      }
      const lines = Array.isArray(selectedBookingDetail?.programaciones)
        ? selectedBookingDetail.programaciones
        : [];
      const idPayload = resolveRouteIdFromReservaPayload(selectedBookingDetail);
      const ids = [
        ...new Set([
          ...collectIdRutasFromProgramacionLines(lines),
          ...(idPayload != null && idPayload > 0 ? [idPayload] : []),
        ]),
      ];
      if (ids.length === 0) {
        if (!cancelled) setBookingDetailRutasById({});
        return;
      }
      const next: Record<number, Ruta> = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const r = await rutasAPI.getById(id);
            if (!cancelled) next[id] = r;
          } catch {
            try {
              const r2 = await rutasAPI.getActivaById(id);
              if (!cancelled && r2) next[id] = r2 as Ruta;
            } catch {
              /* ignore */
            }
          }
        }),
      );
      if (!cancelled) setBookingDetailRutasById(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, bookingsView, selectedBooking?.id, selectedRequest, selectedBookingDetail]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (activeTab !== 'bookings' || bookingsView !== 'detail' || !selectedRequest) {
        if (!cancelled) { setRequestDetailRutasById({}); setRequestProgEnriched({}); }
        return;
      }
      const ids = new Set<number>();
      const rid = Number(selectedRequestDetail?.id_ruta ?? 0);
      if (Number.isFinite(rid) && rid > 0) ids.add(rid);
      const progLines: any[] = Array.isArray(selectedRequestLinkedBooking?.programaciones)
        ? selectedRequestLinkedBooking.programaciones
        : [];
      collectIdRutasFromProgramacionLines(progLines).forEach((id) => ids.add(id));

      // Enriquecer programaciones con detalle de guías para la solicitud vinculada
      const progIds = [
        ...new Set(
          progLines
            .map((line: any) => Number(line?.id_programacion ?? 0))
            .filter((id) => Number.isFinite(id) && id > 0),
        ),
      ];
      const progEnrichPromise = (async () => {
        if (progIds.length === 0) return {} as Record<number, Record<string, unknown>>;
        const results = await Promise.all(progIds.map((id) => programacionAPI.getById(id).catch(() => null)));
        const map: Record<number, Record<string, unknown>> = {};
        for (const p of results) {
          const pid = Number((p as any)?.id_programacion ?? 0);
          if (pid > 0) map[pid] = p as Record<string, unknown>;
        }
        return map;
      })();

      if (ids.size === 0) {
        if (!cancelled) setRequestDetailRutasById({});
        const progMap = await progEnrichPromise;
        if (!cancelled) setRequestProgEnriched(progMap);
        return;
      }
      const next: Record<number, Ruta> = {};
      await Promise.all(
        [...ids].map(async (id) => {
          try {
            const r = await rutasAPI.getById(id);
            if (!cancelled) next[id] = r;
          } catch {
            try {
              const r2 = await rutasAPI.getActivaById(id);
              if (!cancelled && r2) next[id] = r2 as Ruta;
            } catch {
              /* ignore */
            }
          }
        }),
      );
      const progMap = await progEnrichPromise;
      if (!cancelled) { setRequestDetailRutasById(next); setRequestProgEnriched(progMap); }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, bookingsView, selectedRequest?.id, selectedRequestDetail?.id_ruta, selectedRequestLinkedBooking]);

  useEffect(() => {
    if (activeTab !== 'sales' || salesView !== 'detail' || !selectedSale) return;
    void loadSaleDetail(selectedSale);
  }, [activeTab, salesView, selectedSale?.saleId]);

  useEffect(() => {
    if (activeTab !== 'payments' || paymentsView !== 'detail' || !selectedPayment) return;
    void loadPaymentDetail(selectedPayment);
  }, [activeTab, paymentsView, selectedPayment?.paymentId]);

  useEffect(() => {
    if (activeTab !== 'programming' || programmingView !== 'detail' || !selectedProgramming) return;
    void loadProgrammingDetail(selectedProgramming);
  }, [activeTab, programmingView, selectedProgramming?.id]);

  const filteredBookings = useMemo(() => {
    const query = bookingsSearchTerm.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesSearch =
        !query ||
        booking.serviceName.toLowerCase().includes(query) ||
        booking.id.toLowerCase().includes(query) ||
        String(booking.tripSummaryLine || '')
          .toLowerCase()
          .includes(query);
      const matchesStatus = bookingsStatusFilter === 'all' || booking.status === bookingsStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, bookingsSearchTerm, bookingsStatusFilter]);

  const filteredRequests = useMemo(() => {
    const query = bookingsSearchTerm.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesSearch =
        !query ||
        request.routeName.toLowerCase().includes(query) ||
        request.id.toLowerCase().includes(query) ||
        String(request.observations || '')
          .toLowerCase()
          .includes(query) ||
        String(request.tripSummaryLine || '')
          .toLowerCase()
          .includes(query);
      return matchesSearch && requestMatchesBookingsStatusFilter(request, bookingsStatusFilter);
    });
  }, [requests, bookingsSearchTerm, bookingsStatusFilter]);

  const unifiedBookingRows = useMemo(() => {
    type Row =
      | { kind: 'booking'; sortKey: string; sortId: number; booking: ClientBookingSummary }
      | { kind: 'solicitud'; sortKey: string; sortId: number; request: ClientRequestSummary };

    /**
     * Ruta personalizada: el backend crea también una reserva (`id_reserva` en la solicitud).
     * En "Mis reservas" solo debe verse la fila **Personalizada**; el resto (programada, finca, etc.) sigue como reserva.
     */
    const reservaIdsCubiertasPorSolicitud = new Set<number>();
    for (const r of filteredRequests) {
      const rid = r.reservationId;
      if (rid == null || !Number.isFinite(Number(rid)) || Number(rid) <= 0) continue;
      reservaIdsCubiertasPorSolicitud.add(Number(rid));
    }

    const bookingsVisibles = filteredBookings.filter((b) => {
      const id = Number(b.id);
      if (!Number.isFinite(id) || id <= 0) return true;
      return !reservaIdsCubiertasPorSolicitud.has(id);
    });

    const bookingRows: Row[] = bookingsVisibles.map((booking) => ({
      kind: 'booking',
      booking,
      sortKey: booking.date || '',
      sortId: Number(booking.id) || 0,
    }));
    const solicitudRows: Row[] = filteredRequests.map((request) => ({
      kind: 'solicitud',
      request,
      sortKey: request.requestedDate || '',
      sortId: Number(request.id) || 0,
    }));

    return [...bookingRows, ...solicitudRows].sort((a, b) => {
      const ta = a.kind === 'booking' ? a.booking.reservedAtMs : a.request.reservedAtMs;
      const tb = b.kind === 'booking' ? b.booking.reservedAtMs : b.request.reservedAtMs;
      if (tb !== ta) return tb - ta;
      if (b.sortId !== a.sortId) return b.sortId - a.sortId;
      if (a.sortKey < b.sortKey) return 1;
      if (a.sortKey > b.sortKey) return -1;
      return 0;
    });
  }, [filteredBookings, filteredRequests]);

  useEffect(() => {
    setBookingsPage(1);
  }, [bookingsSearchTerm, bookingsStatusFilter]);

  const bookingsTotalPages = useMemo(
    () => Math.max(1, Math.ceil(unifiedBookingRows.length / CLIENT_LIST_PER_PAGE)),
    [unifiedBookingRows.length],
  );

  useEffect(() => {
    setBookingsPage((prev) => Math.min(Math.max(1, prev), bookingsTotalPages));
  }, [bookingsTotalPages]);

  const paginatedUnifiedBookingRows = useMemo(() => {
    const start = (bookingsPage - 1) * CLIENT_LIST_PER_PAGE;
    return unifiedBookingRows.slice(start, start + CLIENT_LIST_PER_PAGE);
  }, [unifiedBookingRows, bookingsPage]);

  const filteredSales = useMemo(() => {
    const query = salesSearchTerm.trim().toLowerCase();
    return sales.filter((sale) => {
      const matchesSearch =
        !query ||
        sale.serviceName.toLowerCase().includes(query) ||
        String(sale.saleId).includes(query) ||
        String(sale.reservationId).includes(query);
      const normalizedStatus = normalizeVentaEstadoPagoForClient(sale.paymentStatus);
      const matchesStatus = salesStatusFilter === 'all' || normalizedStatus === salesStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sales, salesSearchTerm, salesStatusFilter]);

  useEffect(() => {
    setSalesPage(1);
  }, [salesSearchTerm, salesStatusFilter]);

  const salesTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredSales.length / CLIENT_LIST_PER_PAGE)),
    [filteredSales.length],
  );

  useEffect(() => {
    setSalesPage((prev) => Math.min(Math.max(1, prev), salesTotalPages));
  }, [salesTotalPages]);

  const paginatedSales = useMemo(() => {
    const start = (salesPage - 1) * CLIENT_LIST_PER_PAGE;
    return filteredSales.slice(start, start + CLIENT_LIST_PER_PAGE);
  }, [filteredSales, salesPage]);

  const filteredPayments = useMemo(() => {
    const query = paymentsSearchTerm.trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesSearch =
        !query ||
        payment.serviceName.toLowerCase().includes(query) ||
        String(payment.paymentId).includes(query) ||
        String(payment.reservationId).includes(query) ||
        String(payment.saleId || '').includes(query);
      const matchesStatus =
        paymentsStatusFilter === 'all' || payment.status === paymentsStatusFilter;
      const matchesFlow =
        paymentsFlowFilter === 'all' || payment.paymentFlowKind === paymentsFlowFilter;
      return matchesSearch && matchesStatus && matchesFlow;
    });
  }, [payments, paymentsSearchTerm, paymentsStatusFilter, paymentsFlowFilter]);

  useEffect(() => {
    setPaymentsPage(1);
  }, [paymentsSearchTerm, paymentsStatusFilter, paymentsFlowFilter]);

  const paymentsTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredPayments.length / CLIENT_LIST_PER_PAGE)),
    [filteredPayments.length],
  );

  useEffect(() => {
    setPaymentsPage((prev) => Math.min(Math.max(1, prev), paymentsTotalPages));
  }, [paymentsTotalPages]);

  const paginatedPayments = useMemo(() => {
    const start = (paymentsPage - 1) * CLIENT_LIST_PER_PAGE;
    return filteredPayments.slice(start, start + CLIENT_LIST_PER_PAGE);
  }, [filteredPayments, paymentsPage]);

  const filteredProgrammings = useMemo(() => {
    const query = programmingSearchTerm.trim().toLowerCase();
    const filtered = programmings.filter((item) => {
      if (!query) return true;
      return (
        item.routeName.toLowerCase().includes(query) ||
        String(item.programacionId).includes(query) ||
        String(item.reservationId).includes(query) ||
        item.meetingPoint.toLowerCase().includes(query) ||
        item.date.toLowerCase().includes(query)
      );
    });
    return sortClientProgrammings(filtered, programmingSortFilter);
  }, [programmings, programmingSearchTerm, programmingSortFilter]);

  useEffect(() => {
    setProgrammingPage(1);
  }, [programmingSearchTerm, programmingSortFilter]);

  const programmingTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredProgrammings.length / CLIENT_LIST_PER_PAGE)),
    [filteredProgrammings.length],
  );

  useEffect(() => {
    setProgrammingPage((prev) => Math.min(Math.max(1, prev), programmingTotalPages));
  }, [programmingTotalPages]);

  const paginatedProgrammings = useMemo(() => {
    const start = (programmingPage - 1) * CLIENT_LIST_PER_PAGE;
    return filteredProgrammings.slice(start, start + CLIENT_LIST_PER_PAGE);
  }, [filteredProgrammings, programmingPage]);

  const bookingStats = useMemo(() => {
    return {
      total: bookings.length,
      confirmed: bookings.filter((booking) => booking.status === 'Confirmada').length,
      pending: bookings.filter((booking) => booking.status === 'Pendiente').length,
      totalSpent: bookings.reduce((sum, booking) => sum + booking.paidAmount, 0),
      pendingBalance: bookings.reduce((sum, booking) => sum + booking.pendingAmount, 0),
    };
  }, [bookings]);

  const salesStats = useMemo(() => ({
    total: sales.length,
    paid: sales.filter((sale) => sale.paymentStatus === 'Pagado').length,
    pending: sales.filter((sale) => sale.paymentStatus !== 'Pagado').length,
    totalAmount: sales.reduce((sum, sale) => sum + sale.total, 0),
  }), [sales]);

  const paymentStats = useMemo(() => ({
    total: payments.length,
    approved: payments.filter((payment) => payment.status === 'Aprobado').length,
    pending: payments.filter((payment) => payment.status === 'Pendiente').length,
    rejected: payments.filter((payment) => payment.status === 'Rechazado').length,
    totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
  }), [payments]);

  const programmingStats = useMemo(() => ({
    total: programmings.length,
    totalPeople: programmings.reduce((sum, item) => sum + item.people, 0),
    totalValue: programmings.reduce((sum, item) => sum + item.subtotal, 0),
  }), [programmings]);

  /** Pagos con archivo adjunto, más recientes primero (para diálogo de comprobantes en detalle reserva). */
  const bookingPagosConComprobante = useMemo(() => {
    const list = bookingDetailPagos.filter(clientePagoTieneComprobante);
    const ts = (p: PagoCliente) => {
      const t = Date.parse(String((p.fecha_pago ?? p.fecha_verificacion ?? '').toString()).trim());
      return Number.isFinite(t) ? t : 0;
    };
    return [...list].sort((a, b) => ts(b) - ts(a));
  }, [bookingDetailPagos]);

  const openDetailView = (booking: ClientBookingSummary) => {
    setSelectedBooking(booking);
    setSelectedRequest(null);
    setSelectedRequestLinkedBooking(null);
    setBookingDetailPagos([]);
    setBookingProgEnriched({});
    setSelectedBookingDetail(null);
    setBookingsView('detail');
  };

  const confirmarCancelacionCliente = async () => {
    const id = Number(selectedBooking?.id ?? 0);
    if (!id || !user?.id) return;
    const motivoCliente = cancelReservaMotivo.trim();
    if (motivoCliente.length < CLIENT_CANCEL_MOTIVO_MIN) {
      toast.error(`Indica el motivo de cancelación (mínimo ${CLIENT_CANCEL_MOTIVO_MIN} caracteres).`);
      return;
    }
    setIsCancellingReserva(true);
    try {
      await reservasAPI.cancelar(id, motivoCliente, {
        cancelado_por: 'Cliente',
        liberar_programacion: true,
      });
      const { intentos, eliminados } = await reservasAPI.liberarProgramacionesVinculadas(id);
      if (intentos > 0 && eliminados === 0) {
        toast.warning(
          'Reserva cancelada. No pudimos confirmar la desvinculación automática de la salida programada; si sigues viendo la fecha ocupada, contacta a OCCITOUR.',
        );
      } else {
        toast.success(
          'Reserva cancelada. No aplica devolución de dinero según las políticas. Para otra fecha deberás hacer una reserva nueva.',
        );
      }
      setCancelReservaOpen(false);
      setCancelReservaMotivo('');
      setSelectedBooking((prev) => (prev ? { ...prev, status: 'Cancelada' } : prev));
      await loadBookings();
      await loadBookingDetail(String(id));
      void loadProgrammings();
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo cancelar la reserva. Contacta a soporte.');
    } finally {
      setIsCancellingReserva(false);
    }
  };

  const openRequestDetail = (request: ClientRequestSummary) => {
    setSelectedRequest(request);
    setSelectedBooking(null);
    setSelectedBookingDetail(null);
    setSelectedRequestDetail(null);
    setSelectedRequestLinkedBooking(null);
    setSelectedRequestPayments([]);
    setRequestPaymentData({
      monto: '',
      metodo_pago: 'Transferencia',
      numero_transaccion: '',
      comprobante_url: '',
      comprobante_nombre: '',
      comprobante_tipo: '',
      observaciones: '',
    });
    if (requestProofInputRef.current) requestProofInputRef.current.value = '';
    setBookingsView('detail');
  };

  const handleRequestSolicitudProofChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > CLIENT_SOLICITUD_PROOF_MAX) {
      toast.error('El archivo no debe exceder 5 MB.');
      event.target.value = '';
      return;
    }
    if (!CLIENT_SOLICITUD_PROOF_TYPES.includes(file.type)) {
      toast.error('Solo se permiten archivos PDF, JPG, PNG o WEBP.');
      event.target.value = '';
      return;
    }
    if (String(file.name || '').length > CLIENT_COMPROBANTE_NOMBRE_MAX) {
      toast.error('El nombre del archivo es demasiado largo. Renómbralo e intenta de nuevo.');
      event.target.value = '';
      return;
    }
    try {
      setRequestProofFile(file);
      setRequestPaymentData((prev) => ({
        ...prev,
        comprobante_url: 'pending-upload', // placeholder para pasar validación vacía
        comprobante_nombre: file.name,
        comprobante_tipo: file.type || 'application/octet-stream',
      }));
      toast.success('Comprobante cargado.');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo cargar el comprobante.');
      event.target.value = '';
    }
  };

  const clearRequestSolicitudProof = () => {
    setRequestPaymentData((prev) => ({
      ...prev,
      comprobante_url: '',
      comprobante_nombre: '',
      comprobante_tipo: '',
    }));
    setRequestProofFile(null);
    if (requestProofInputRef.current) requestProofInputRef.current.value = '';
  };

  const openSaleDetail = (sale: ClientSaleSummary) => {
    setSelectedSale(sale);
    setSelectedSaleDetail(null);
    setSelectedSalePayments([]);
    setSalesView('detail');
  };

  const openPaymentDetail = (payment: ClientPaymentSummary) => {
    setSelectedPayment(payment);
    setSelectedPaymentDetail(null);
    setSelectedPaymentSale(null);
    setPaymentsView('detail');
  };

  const openProgrammingDetail = (programming: ClientProgrammingSummary) => {
    setSelectedProgramming(programming);
    setSelectedProgrammingDetail(null);
    setSelectedProgrammingBooking(null);
    setSelectedProgrammingRoute(null);
    setProgrammingView('detail');
  };

  const handleFincaSaldoProofChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFincaSaldoProofFile(null);
      event.target.value = '';
      return;
    }
    if (file.size > CLIENT_FINCA_BALANCE_PROOF_MAX) {
      toast.error('El archivo no debe exceder 5MB.');
      event.target.value = '';
      return;
    }
    if (!CLIENT_FINCA_BALANCE_PROOF_TYPES.includes(file.type)) {
      toast.error('Solo se permiten PDF, JPG, PNG o WEBP.');
      event.target.value = '';
      return;
    }
    if (String(file.name || '').length > CLIENT_COMPROBANTE_NOMBRE_MAX) {
      toast.error('El nombre del archivo es demasiado largo. Renómbralo e intenta de nuevo.');
      event.target.value = '';
      return;
    }
    setFincaSaldoProofFile(file);
  };

  const handleFincaSaldoPagoSubmit = async () => {
    if (!selectedBooking || !selectedBookingDetail) return;
    const idReserva = Number(selectedBookingDetail.id_reserva ?? selectedBooking.id ?? 0);
    const idVenta = Number(selectedBookingDetail.id_venta ?? selectedBooking.saleId ?? 0);
    const saldo = Math.max(
      0,
      Number(selectedBookingDetail.saldo_pendiente ?? selectedBooking.pendingAmount ?? 0),
    );
    if (!idReserva || !idVenta) {
      toast.error('No se pudo obtener la venta de la reserva. Pulsa "Actualizar detalle" o contacta a soporte.');
      return;
    }
    if (saldo <= 0) {
      toast.info('No hay saldo pendiente en esta reserva.');
      return;
    }
    if (!fincaSaldoProofFile) {
      toast.error('Adjunta el comprobante del pago.');
      return;
    }
    if (fincaSaldoComprobanteBloqueado) {
      toast.error('Ya hay un comprobante en revisión. Espera a que el equipo lo verifique en abonos.');
      return;
    }

    if (String(fincaSaldoPagoForm.metodo_pago || '').trim().length > CLIENT_METODO_PAGO_MAX) {
      toast.error('El método de pago es demasiado largo.');
      return;
    }

    if (String(fincaSaldoPagoForm.numero_transaccion || '').trim().length > CLIENT_TRANSACCION_MAX) {
      toast.error('El número de transacción es demasiado largo.');
      return;
    }

    if (String(fincaSaldoProofFile.name || '').trim().length > CLIENT_COMPROBANTE_NOMBRE_MAX) {
      toast.error('El nombre del comprobante es demasiado largo.');
      return;
    }

    setIsSubmittingFincaSaldoPago(true);
    try {
      const uploadRes = await pagosAPI.uploadComprobante(fincaSaldoProofFile, user?.id || 0);
      const comprobanteUrl = uploadRes.url;
      
      const observaciones =
        fincaSaldoPagoForm.observaciones.trim() ||
        `Abono saldo restante — reserva #${idReserva}`;
      await pagosAPI.create({
        id_venta: idVenta,
        id_reserva: idReserva,
        monto: saldo,
        metodo_pago: fincaSaldoPagoForm.metodo_pago || null,
        numero_transaccion: fincaSaldoPagoForm.numero_transaccion.trim() || null,
        comprobante_url: comprobanteUrl,
        comprobante_nombre: fincaSaldoProofFile.name,
        comprobante_tipo: fincaSaldoProofFile.type || 'application/octet-stream',
        observaciones,
      });
      toast.success('Comprobante enviado', {
        description: 'Queda pendiente de verificación en abonos.',
      });
      setFincaSaldoProofFile(null);
      setFincaSaldoPagoForm({ metodo_pago: 'Transferencia', numero_transaccion: '', observaciones: '' });
      setFincaSaldoComprobanteBloqueado(true);
      void loadBookingDetail(selectedBooking.id);
      void loadBookings();
      void loadPayments();
      void loadSales();
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo registrar el abono.');
    } finally {
      setIsSubmittingFincaSaldoPago(false);
    }
  };

  const handleResubmitRejectedProofFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > CLIENT_RESUBMIT_PROOF_MAX) {
      toast.error('El archivo no debe exceder 5MB.');
      event.target.value = '';
      return;
    }
    if (!CLIENT_RESUBMIT_PROOF_TYPES.includes(file.type)) {
      toast.error('Solo se permiten PDF, JPG, PNG o WEBP.');
      event.target.value = '';
      return;
    }
    if (String(file.name || '').length > CLIENT_COMPROBANTE_NOMBRE_MAX) {
      toast.error('El nombre del archivo es demasiado largo. Renómbralo e intenta de nuevo.');
      event.target.value = '';
      return;
    }
    setResubmitProofFile(file);
    setResubmitProofDataUrl('pending-upload'); // marcador de subida
    setResubmitProofName(file.name);
    setResubmitProofMime(file.type || 'application/octet-stream');
  };

  const handleResubmitRejectedPago = async () => {
    if (!selectedPayment || selectedPayment.status !== 'Rechazado') return;
    if (selectedPayment.paymentFlowKind === 'custom_request') {
      toast.info('Para solicitudes personalizadas, reenvía el comprobante desde el detalle de tu solicitud (Mis solicitudes).');
      return;
    }
    if (!selectedPayment.reservationId) {
      toast.error('No se pudo vincular la reserva. Contacta a soporte.');
      return;
    }
    if (selectedPayment.paymentFlowKind === 'finca' && !selectedPayment.saleId) {
      toast.error('No se pudo vincular la venta. Contacta a soporte.');
      return;
    }
    if (!resubmitProofDataUrl.trim()) {
      toast.error('Adjunta el nuevo comprobante.');
      return;
    }

    if (String(resubmitPago.metodo_pago || '').trim().length > CLIENT_METODO_PAGO_MAX) {
      toast.error('El método de pago es demasiado largo.');
      return;
    }

    if (String(resubmitPago.numero_transaccion || '').trim().length > CLIENT_TRANSACCION_MAX) {
      toast.error('El número de transacción es demasiado largo.');
      return;
    }

    if (String(resubmitProofName || '').trim().length > CLIENT_COMPROBANTE_NOMBRE_MAX) {
      toast.error('El nombre del comprobante es demasiado largo.');
      return;
    }

    setIsSubmittingResubmitPago(true);
    try {
      const uploadRes = await pagosAPI.uploadComprobante(resubmitProofFile!, user?.id || 0);
      const comprobanteUrl = uploadRes.url;

      const observaciones =
        resubmitPago.observaciones.trim() ||
        `Reenvío de comprobante tras rechazo del pago #${selectedPayment.paymentId}`;

      // El backend solo permite POST /api/pagos (nuevo abono) para clientes en reservas de finca.
      // Rutas / salidas (aunque el flujo quede como "genérico") se reenvían con pago-completo como al reservar.
      if (selectedPayment.paymentFlowKind === 'finca') {
        await pagosAPI.create({
          id_venta: selectedPayment.saleId,
          id_reserva: selectedPayment.reservationId,
          monto: Number(selectedPayment.amount),
          metodo_pago: resubmitPago.metodo_pago || null,
          numero_transaccion: resubmitPago.numero_transaccion.trim() || null,
          comprobante_url: comprobanteUrl,
          comprobante_nombre: resubmitProofName || 'comprobante',
          comprobante_tipo: resubmitProofMime || 'application/octet-stream',
          observaciones,
        });
        toast.success('Comprobante reenviado', {
          description: 'Registramos un nuevo abono pendiente de revisión. Revísalo en la lista de Mis abonos.',
        });
      } else {
        let ventaParaMonto: Venta | null = selectedPaymentSale;
        if (
          selectedPayment.paymentFlowKind === 'programmed_route' &&
          !ventaParaMonto &&
          selectedPayment.saleId
        ) {
          try {
            ventaParaMonto = await ventasAPI.getById(selectedPayment.saleId);
          } catch {
            ventaParaMonto = null;
          }
        }
        let montoCompleto = Number(selectedPayment.amount);
        if (selectedPayment.paymentFlowKind === 'programmed_route' && ventaParaMonto) {
          montoCompleto = montoPagoUnicoSalidaProgramada({
            checkoutMontoTotal: ventaParaMonto.monto_total,
            venta: {
              monto_total: ventaParaMonto.monto_total,
              monto_pagado: ventaParaMonto.monto_pagado,
              saldo_pendiente: ventaParaMonto.saldo_pendiente,
            },
            estimate: null,
          });
        }
        if (!Number.isFinite(montoCompleto) || montoCompleto <= 0) {
          montoCompleto = Number(selectedPayment.amount);
        }
        await reservasAPI.pagarCompleto(selectedPayment.reservationId, {
          monto: montoCompleto,
          metodo_pago: resubmitPago.metodo_pago || null,
          numero_transaccion: resubmitPago.numero_transaccion.trim() || null,
          comprobante_url: comprobanteUrl,
          comprobante_nombre: resubmitProofName || 'comprobante',
          comprobante_tipo: resubmitProofMime || 'application/octet-stream',
          observaciones,
        });
        toast.success('Comprobante reenviado', {
          description:
            selectedPayment.paymentFlowKind === 'programmed_route'
              ? 'Actualizamos el pago de tu salida programada. Queda pendiente de verificación del equipo.'
              : 'Actualizamos el comprobante de tu reserva. Queda pendiente de verificación del equipo.',
        });
      }
      setResubmitPago({ metodo_pago: 'Transferencia', numero_transaccion: '', observaciones: '' });
      setResubmitProofName('');
      setResubmitProofDataUrl('');
      setResubmitProofMime('');
      setSelectedPayment(null);
      setSelectedPaymentDetail(null);
      setSelectedPaymentSale(null);
      setPaymentsView('list');
      await loadPayments();
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo registrar el comprobante. Si el backend no permite otro abono, contacta a tu asesor.');
    } finally {
      setIsSubmittingResubmitPago(false);
    }
  };

  const renderBookings = () => {
    if (bookingsView === 'detail' && selectedRequest) {
      const detail = selectedRequestDetail;
      /** Venta: si el backend aún no devuelve `id_venta` al habilitar pago, el formulario debe verse igual; el envío valida antes de llamar al API. */
      const canUploadPayment =
        Boolean(detail) &&
        solicitudHabilitadaParaPago(estadoTextoParaReglasSolicitud(detail, selectedRequest.status)) &&
        Boolean(detail.id_solicitud_personalizada) &&
        String(detail.venta_estado_pago || '') !== 'Pagado';

      const paymentStatusSolicitud = detail
        ? clientDisplayEstadoPagoVentaSolicitudPersonalizada(detail)
        : clientDisplayEstadoPagoVenta('Ruta', selectedRequest.paymentStatus);

      const reservaEstadoForUi =
        selectedRequestLinkedBooking != null
          ? normalizeReservationStatus(selectedRequestLinkedBooking.estado)
          : 'Pendiente';

      const pseudoBookingForSolicitud: ClientBookingSummary = {
        id: String(detail?.id_reserva ?? selectedRequest.id),
        saleId: detail?.id_venta != null ? Number(detail.id_venta) : selectedRequest.saleId ?? null,
        serviceType: 'Ruta',
        serviceName: selectedRequest.routeName,
        date:
          formatDate(detail?.fecha_deseada) ||
          selectedRequest.requestedDate ||
          selectedRequest.date ||
          '—',
        reservedAtMs: Number(selectedRequest.reservedAtMs ?? Date.now()),
        status: reservaEstadoForUi,
        paymentStatus: paymentStatusSolicitud,
        paymentMethod: 'Por definir',
        participants: Number(detail?.cantidad_personas ?? selectedRequest.people ?? 1),
        totalAmount: Number(detail?.precio_cotizado ?? selectedRequest.quoteAmount ?? 0),
        paidAmount: 0,
        pendingAmount: Number(detail?.venta_saldo_pendiente ?? selectedRequest.pendingBalance ?? 0),
        specialRequests: String(detail?.observaciones ?? selectedRequest.observations ?? ''),
        tripSummaryLine: selectedRequest.tripSummaryLine,
        paymentRejectionNote: null,
      };

      const primaryProgSolicitud = selectedRequestLinkedBooking
        ? (firstProgramacionLineFromReservaPayload(selectedRequestLinkedBooking) as Record<string, unknown> | null)
        : null;

      const recomTextSolicitudCliente = mergeRecomendacionesFromRutas(requestDetailRutasById);
      const opcionalesTxt = formatOptionalServiciosOpcionalesFromReserva(
        detail?.servicios_opcionales,
        selectedRequestLinkedBooking?.servicios,
      );
      const montoPagoUnicoSolicitud = detail
        ? montoPagoUnicoSolicitudPersonalizada(detail, {
            reservaTotal: selectedRequestLinkedBooking?.total,
            reservaMontoTotal: selectedRequestLinkedBooking?.monto_total,
          })
        : 0;

      const motivoDesaprobacionVisible =
        reservaMotivoDesaprobacionPago(selectedRequestLinkedBooking) ??
        reservaMotivoDesaprobacionPago(detail) ??
        null;

      const solicitudPagoRechazado = selectedRequestPayments.find(
        (p) => normalizeInstallmentStatus(p.estado) === 'Rechazado',
      );

      const reservaVinculadaCancelada =
        selectedRequestLinkedBooking != null &&
        normalizeReservationStatus(selectedRequestLinkedBooking.estado) === 'Cancelada';

      const puedeCancelarCliente =
        selectedRequestLinkedBooking != null &&
        normalizeReservationStatus(selectedRequestLinkedBooking.estado) !== 'Cancelada' &&
        normalizeReservationStatus(selectedRequestLinkedBooking.estado) !== 'Completada';

      return (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Detalle de mi solicitud personalizada</h3>
              <p className="text-sm text-gray-600">Solicitud #{selectedRequest.id}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setSelectedRequestDetail(null);
                setSelectedRequestLinkedBooking(null);
                setSelectedRequestPayments([]);
                setBookingsView('list');
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a mis reservas
            </Button>
          </div>

          <ClienteReservaDetalleHero
            booking={pseudoBookingForSolicitud}
            detail={(selectedRequestLinkedBooking ?? detail ?? null) as any}
            rutasById={requestDetailRutasById}
            primaryProg={primaryProgSolicitud}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Servicio</p>
                  <p className="text-lg font-semibold text-green-800">
                    {resolveReservaProductoNombre(selectedRequestLinkedBooking) || selectedRequest.routeName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Ruta</p>
                </div>
                <RouteIcon className="h-8 w-8 text-blue-600" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Participantes</p>
                  <p className="text-2xl font-semibold text-green-800">{pseudoBookingForSolicitud.participants}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-semibold text-green-800">
                    {formatCurrency(pseudoBookingForSolicitud.totalAmount)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Estado de pago</p>
                  <div className="mt-2">{getPaymentStatusBadge(paymentStatusSolicitud)}</div>
                </div>
                <CreditCard className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
          </div>

          {motivoDesaprobacionVisible ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-950">
              <p className="font-semibold">
                Motivo de desaprobación de tu comprobante (guardado en tu reserva por OCCITOUR)
              </p>
              <p className="mt-2 whitespace-pre-wrap">{motivoDesaprobacionVisible}</p>
              <p className="mt-2 text-xs opacity-90">
                Corrige lo indicado y vuelve a enviar el comprobante desde <strong>Mis abonos</strong> o el bloque de pago de
                esta reserva, según el tipo de servicio.
              </p>
            </div>
          ) : null}

          {reservaVinculadaCancelada ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
              La reserva vinculada está <strong>cancelada</strong>. No aplica devolución de dinero según las políticas; para una
              nueva fecha o estadía debes hacer una <strong>reserva nueva</strong>.
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <ClienteTitularReservaCard user={user} detail={(selectedRequestLinkedBooking ?? null) as any} />

              {solicitudPagoRechazado ? (
                <Card className="border-red-200 bg-red-50 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-red-900">Comprobante no aceptado</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-red-950">
                    <p className="text-xs font-medium uppercase tracking-wide text-red-800">
                      Solicitud personalizada
                    </p>
                    <p>
                      OCCITOUR revisó tu comprobante y lo marcó como <strong>rechazado</strong>. El asesor debe habilitar el
                      pago para que puedas volver a enviarlo desde el formulario de esta solicitud.
                    </p>
                    {String((solicitudPagoRechazado as { motivo_rechazo?: string }).motivo_rechazo || '').trim() ? (
                      <div className="rounded-lg border border-red-200 bg-white/80 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-800">Motivo del abono</p>
                        <p className="mt-1 text-red-900">
                          {(solicitudPagoRechazado as { motivo_rechazo?: string }).motivo_rechazo}
                        </p>
                      </div>
                    ) : motivoDesaprobacionVisible ? (
                      <div className="rounded-lg border border-red-200 bg-white/80 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-800">Motivo en tu reserva</p>
                        <p className="mt-1 whitespace-pre-wrap text-red-900">{motivoDesaprobacionVisible}</p>
                      </div>
                    ) : (
                      <p className="text-red-900/90">
                        No se registró un motivo en el sistema. Contacta a tu asesor para saber qué corregir.
                      </p>
                    )}
                    <p className="text-red-900/85">
                      El pago rechazado queda en historial. Cuando el pago siga habilitado, sube un nuevo comprobante en el
                      bloque <strong>Subir comprobante</strong>.
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>Información de la reserva</CardTitle>
                  <p className="text-sm font-normal text-muted-foreground">
                    Resumen de tu ruta personalizada, estado y valores asociados.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="overflow-x-auto rounded-md border border-gray-200">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="w-[40%] text-gray-600 bg-gray-50/80">Tipo de servicio</TableCell>
                          <TableCell className="font-medium">Ruta (personalizada)</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Ruta solicitada</TableCell>
                          <TableCell className="font-medium">{selectedRequest.routeName}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Fecha solicitada</TableCell>
                          <TableCell className="font-medium">
                            {formatDateTime(detail?.fecha_deseada, detail?.hora_deseada) ||
                              formatDateTime(selectedRequest.requestedDate, selectedRequest.requestedTime)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Estado de la solicitud</TableCell>
                          <TableCell>
                            {getSolicitudStatusBadge(
                              resolveSolicitudStatusForUi(
                                detail
                                  ? {
                                      ...detail,
                                      id_programacion:
                                        detail.id_programacion ?? selectedRequest.programacionId ?? undefined,
                                    }
                                  : {
                                      estado: selectedRequest.status,
                                      id_programacion: selectedRequest.programacionId ?? undefined,
                                    },
                              ),
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Reserva asociada</TableCell>
                          <TableCell className="font-medium">
                            {detail?.id_reserva != null ? `#${detail.id_reserva}` : 'Aún no disponible'}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Venta asociada</TableCell>
                          <TableCell className="font-medium">
                            {detail?.id_venta != null ? `#${detail.id_venta}` : 'Aún no disponible'}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Monto total / cotización</TableCell>
                          <TableCell className="font-semibold text-green-800">
                            {formatCurrency(detail?.precio_cotizado ?? selectedRequest.quoteAmount)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Saldo pendiente</TableCell>
                          <TableCell className="font-medium text-amber-800">
                            {formatCurrency(detail?.venta_saldo_pendiente ?? selectedRequest.pendingBalance)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Estado del pago</TableCell>
                          <TableCell>{getPaymentStatusBadge(paymentStatusSolicitud)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Punto de encuentro</TableCell>
                          <TableCell className="text-sm font-medium whitespace-pre-wrap">
                            {String(detail?.lugar_encuentro || '').trim() ||
                              String(primaryProgSolicitud?.lugar_encuentro || '').trim() ||
                              'Lo define el asesor al programar la salida'}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Regreso deseado</TableCell>
                          <TableCell className="font-medium">
                            {detail?.fecha_regreso_deseada
                              ? formatDateTime(detail.fecha_regreso_deseada, detail.hora_regreso_deseada)
                              : '—'}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Programación OCCITOUR</TableCell>
                          <TableCell className="font-medium">
                            {detail?.id_programacion != null && Number(detail.id_programacion) > 0
                              ? `#${detail.id_programacion}`
                              : '—'}
                          </TableCell>
                        </TableRow>
                        {opcionalesTxt ? (
                          <TableRow>
                            <TableCell className="text-gray-600 bg-gray-50/80 align-top">
                              Servicios opcionales elegidos
                            </TableCell>
                            <TableCell className="text-sm whitespace-pre-wrap">{opcionalesTxt}</TableCell>
                          </TableRow>
                        ) : null}
                        {(detail?.observaciones || selectedRequest.observations) ? (
                          <TableRow>
                            <TableCell className="text-gray-600 bg-gray-50/80 align-top">Observaciones</TableCell>
                            <TableCell className="text-sm whitespace-pre-wrap">
                              {detail?.observaciones || selectedRequest.observations}
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                    {solicitudHabilitadaParaPago(estadoTextoParaReglasSolicitud(detail, selectedRequest.status))
                      ? 'Tu solicitud ya está habilitada para pago. Puedes subir el comprobante aquí mismo.'
                      : 'Tu solicitud sigue en revisión. Cuando el asesor habilite el pago, aquí aparecerá el formulario para subir el comprobante.'}
                  </div>
                </CardContent>
              </Card>

              {selectedRequestLinkedBooking &&
              Array.isArray(selectedRequestLinkedBooking.programaciones) &&
              selectedRequestLinkedBooking.programaciones.length > 0 ? (
                <>
                  <ProgramacionesReservaClienteTable
                    lines={selectedRequestLinkedBooking.programaciones}
                    reserva={selectedRequestLinkedBooking}
                    enrichedByProgId={requestProgEnriched}
                    listMontoTotalHint={
                      Number(
                        selectedRequestLinkedBooking.monto_total ??
                          selectedRequestLinkedBooking.total ??
                          selectedRequest?.quoteAmount ??
                          0,
                      ) || null
                    }
                  />
                  <ReservaGuiasClienteTable
                    lines={selectedRequestLinkedBooking.programaciones}
                    enrichedByProgId={requestProgEnriched}
                    reserva={selectedRequestLinkedBooking}
                  />
                </>
              ) : null}

              <ClienteRutaContextoCard rutasById={requestDetailRutasById} />
              <ClienteRecomendacionesSalidaCard texto={recomTextSolicitudCliente} />
              <ClienteRutaServiciosPredefinidosCard rutasById={requestDetailRutasById} />

              {selectedRequestLinkedBooking &&
              Array.isArray(selectedRequestLinkedBooking.servicios) &&
              selectedRequestLinkedBooking.servicios.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Servicios adicionales en tu reserva</CardTitle>
                    <p className="text-sm font-normal text-muted-foreground">
                      Contratados sobre esta reserva (además de lo incluido en la ruta).
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Servicio</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Precio u.</TableHead>
                            <TableHead>Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedRequestLinkedBooking.servicios.map((item: any) => (
                            <TableRow key={item.id_detalle_reserva_servicio || `${item.id_servicio}-${item.subtotal}`}>
                              <TableCell>
                                {item.nombre_servicio || item.servicio_nombre || `Servicio #${item.id_servicio}`}
                              </TableCell>
                              <TableCell>{item.cantidad}</TableCell>
                              <TableCell>{formatCurrency(item.precio_unitario)}</TableCell>
                              <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedRequestLinkedBooking &&
                Array.isArray(selectedRequestLinkedBooking.acompanantes) &&
                selectedRequestLinkedBooking.acompanantes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Acompañantes</CardTitle>
                      <p className="text-sm font-normal text-muted-foreground">
                        Personas registradas en la reserva vinculada a esta solicitud.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Documento</TableHead>
                              <TableHead>Teléfono</TableHead>
                              <TableHead>Nacimiento</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedRequestLinkedBooking.acompanantes.map((acompanante: any) => (
                              <TableRow key={acompanante.id_detalle_reserva_acompanante}>
                                <TableCell>
                                  {`${acompanante.nombre || ''} ${acompanante.apellido || ''}`.trim()}
                                </TableCell>
                                <TableCell>
                                  {acompanante.tipo_documento || '—'} {acompanante.numero_documento || ''}
                                </TableCell>
                                <TableCell>{acompanante.telefono || '—'}</TableCell>
                                <TableCell>{formatDate(acompanante.fecha_nacimiento)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

              <Card>
                <CardHeader>
                  <CardTitle>Historial de pagos enviados</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedRequestPayments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Fecha y hora</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Comprobante</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRequestPayments.map((payment) => (
                          <TableRow key={payment.id_pago}>
                            <TableCell>#{payment.id_pago}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {formatPaymentDateTime(getPagoFechaHoraRaw(payment))}
                            </TableCell>
                            <TableCell>{formatCurrency(payment.monto)}</TableCell>
                            <TableCell>{payment.metodo_pago || '—'}</TableCell>
                            <TableCell>{payment.estado || 'Pendiente'}</TableCell>
                            <TableCell>
                              {payment.comprobante_url ? (
                                <a href={payment.comprobante_url} target="_blank" rel="noreferrer" className="text-green-700 underline">
                                  Ver comprobante
                                </a>
                              ) : (
                                '—'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-gray-500">Todavía no has enviado pagos para esta solicitud.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card id="payment-section">
                <CardHeader>
                  <CardTitle>Subir comprobante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {canUploadPayment ? (
                    <>
                      {detail?.id_venta == null ? (
                        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                          Si acaban de habilitar tu pago, espera unos segundos y pulsa <strong>Actualizar solicitud</strong>. Debe
                          aparecer un <strong>Nº de venta</strong> en el resumen; sin venta el sistema no puede registrar el
                          comprobante aún.
                        </p>
                      ) : null}
                      <div>
                        <Label>Monto a pagar (total de la venta)</Label>
                        <p className="mt-1 text-lg font-semibold text-green-900">{formatCurrency(montoPagoUnicoSolicitud)}</p>
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                          En rutas personalizadas el comprobante corresponde al <strong>pago único</strong> por el total pendiente
                          de la reserva: <strong>no hay abonos parciales</strong> (eso aplica en fincas).
                        </p>
                      </div>

                      <OccitoursPaymentBankDetails />

                      <div>
                        <Label>Método</Label>
                        <Input
                          value={requestPaymentData.metodo_pago}
                          onChange={(e) => setRequestPaymentData((prev) => ({ ...prev, metodo_pago: e.target.value }))}
                          placeholder="Transferencia / QR / PSE"
                        />
                      </div>
                      <div>
                        <Label>Número de transacción</Label>
                        <Input
                          value={requestPaymentData.numero_transaccion}
                          onChange={(e) => setRequestPaymentData((prev) => ({ ...prev, numero_transaccion: e.target.value }))}
                          placeholder="Opcional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="solicitud-comprobante-file">Comprobante (imagen o PDF) *</Label>
                        <Input
                          id="solicitud-comprobante-file"
                          ref={requestProofInputRef}
                          type="file"
                          accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
                          className="cursor-pointer"
                          onChange={handleRequestSolicitudProofChange}
                        />
                        <p className="text-xs text-gray-500">
                          Máx. 5 MB. Formatos: PDF, JPG o PNG. El archivo se envía de forma segura al registrar el pago.
                        </p>
                        {requestPaymentData.comprobante_nombre ? (
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                            <span className="truncate font-medium" title={requestPaymentData.comprobante_nombre}>
                              {requestPaymentData.comprobante_nombre}
                            </span>
                            <Button type="button" variant="outline" size="sm" onClick={clearRequestSolicitudProof}>
                              Quitar archivo
                            </Button>
                          </div>
                        ) : null}
                      </div>
                      <div>
                        <Label>Observaciones</Label>
                        <Textarea
                          value={requestPaymentData.observaciones}
                          onChange={(e) => setRequestPaymentData((prev) => ({ ...prev, observaciones: e.target.value }))}
                          placeholder="Ej: transferencia desde Bancolombia"
                        />
                      </div>
                      <Button
                        className="w-full bg-green-700 hover:bg-green-800"
                        disabled={isSubmittingRequestPayment || detail?.id_venta == null}
                        onClick={async () => {
                          try {
                            if (!detail?.id_solicitud_personalizada) return;
                            if (detail.id_venta == null) {
                              toast.error(
                                'Tu solicitud está habilitada pero aún no tiene venta asociada. Espera un momento, pulsa «Actualizar solicitud» o contacta a tu asesor.',
                              );
                              return;
                            }
                            if (!String(requestPaymentData.comprobante_url || '').trim()) {
                              toast.error('Debes adjuntar el comprobante (PDF o imagen).');
                              return;
                            }

                            if (String(requestPaymentData.metodo_pago || '').trim().length > CLIENT_METODO_PAGO_MAX) {
                              toast.error('El método de pago es demasiado largo.');
                              return;
                            }

                            if (String(requestPaymentData.numero_transaccion || '').trim().length > CLIENT_TRANSACCION_MAX) {
                              toast.error('El número de transacción es demasiado largo.');
                              return;
                            }

                            if (String(requestPaymentData.comprobante_nombre || '').trim().length > CLIENT_COMPROBANTE_NOMBRE_MAX) {
                              toast.error('El nombre del comprobante es demasiado largo.');
                              return;
                            }

                            setIsSubmittingRequestPayment(true);
                            const uploadRes = await pagosAPI.uploadComprobante(requestProofFile!, user?.id || 0);
                            await solicitudesPersonalizadasAPI.crearPago(detail.id_solicitud_personalizada, {
                              metodo_pago: requestPaymentData.metodo_pago || null,
                              numero_transaccion: requestPaymentData.numero_transaccion.trim() || null,
                              comprobante_url: uploadRes.url,
                              comprobante_nombre: requestPaymentData.comprobante_nombre.trim() || null,
                              comprobante_tipo: requestPaymentData.comprobante_tipo.trim() || null,
                              observaciones: requestPaymentData.observaciones.trim() || null,
                            });

                            await Promise.all([loadRequests(), loadRequestDetail(selectedRequest.id)]);
                            setRequestPaymentData({
                              monto: '',
                              metodo_pago: 'Transferencia',
                              numero_transaccion: '',
                              comprobante_url: '',
                              comprobante_nombre: '',
                              comprobante_tipo: '',
                              observaciones: '',
                            });
                            if (requestProofInputRef.current) requestProofInputRef.current.value = '';
                            toast.success('Comprobante enviado', {
                              description: 'Tu pago quedó pendiente de validación en abonos.',
                            });
                          } catch (error: any) {
                            toast.error(error?.message || 'No se pudo enviar el comprobante.');
                          } finally {
                            setIsSubmittingRequestPayment(false);
                          }
                        }}
                      >
                        Subir comprobante
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                      {isLoadingRequestDetail
                        ? 'Cargando estado de la solicitud...'
                        : 'El comprobante se habilita aquí cuando el asesor apruebe la solicitud para pago.'}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Acciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {puedeCancelarCliente ? (
                    <Button
                      variant="outline"
                      className="w-full border-red-600 text-red-700 hover:bg-red-50"
                      onClick={() => setCancelReservaOpen(true)}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Cancelar mi reserva
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => {
                      if (selectedRequest?.id) {
                        void Promise.all([loadRequests(), loadRequestDetail(selectedRequest.id)]);
                      }
                    }}
                    disabled={isLoadingRequestDetail}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Actualizar solicitud
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    if (bookingsView === 'detail' && selectedBooking) {
      const saldoRestanteReserva = Math.max(
        0,
        Number(selectedBookingDetail?.saldo_pendiente ?? selectedBooking.pendingAmount ?? 0),
      );
      const ventaIdForPago = Number(selectedBookingDetail?.id_venta ?? selectedBooking.saleId ?? 0);
      const reservaIdForPago = Number(selectedBookingDetail?.id_reserva ?? selectedBooking.id ?? 0);
      const showSaldoPagoForm =
        saldoRestanteReserva > 0 &&
        ventaIdForPago > 0 &&
        reservaIdForPago > 0 &&
        selectedBooking.status !== 'Cancelada' &&
        selectedBooking.status !== 'Completada';

      const primaryProgBooking = firstProgramacionLineFromReservaPayload(selectedBookingDetail);
      const recomTextReservaCliente = mergeRecomendacionesFromRutas(bookingDetailRutasById);
      const motivoDesaprobacionVisible =
        reservaMotivoDesaprobacionPago(selectedBookingDetail) ?? selectedBooking.paymentRejectionNote ?? null;
      const bookingPagoRechazado = bookingDetailPagos.find(
        (p) => normalizeInstallmentStatus(p.estado) === 'Rechazado',
      );
      const puedeCancelarCliente =
        selectedBooking.status !== 'Cancelada' && selectedBooking.status !== 'Completada';
      const saldoPagoTitulo =
        selectedBooking.serviceType === 'Finca'
          ? 'Pagar saldo pendiente (finca)'
          : selectedBooking.serviceType === 'Ruta'
            ? 'Pagar saldo pendiente (ruta)'
            : 'Pagar saldo pendiente';

      return (
        <div className="space-y-6">
          <AlertDialog open={cancelReservaOpen} onOpenChange={setCancelReservaOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cancelar esta reserva?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      Al confirmar, la reserva pasará a <strong>Cancelada</strong>. Según las políticas de OCCITOUR{' '}
                      <strong>no se realiza devolución de dinero</strong>. Para viajar en otra fecha deberás hacer una{' '}
                      <strong>nueva reserva</strong>.
                    </p>
                    <p>
                      Si tenías una <strong>salida programada</strong>, el sistema solicitará liberar el cupo y desvincular
                      esa fecha.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="cliente-cancel-motivo">
                        Motivo de cancelación *{' '}
                        <span className="font-normal text-gray-500">(mín. {CLIENT_CANCEL_MOTIVO_MIN} caracteres)</span>
                      </Label>
                      <Textarea
                        id="cliente-cancel-motivo"
                        value={cancelReservaMotivo}
                        onChange={(e) => setCancelReservaMotivo(e.target.value)}
                        placeholder="Ej: cambio de planes, imprevisto médico..."
                        rows={3}
                        className="bg-white"
                      />
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isCancellingReserva}>Volver</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  disabled={
                    isCancellingReserva || cancelReservaMotivo.trim().length < CLIENT_CANCEL_MOTIVO_MIN
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    void confirmarCancelacionCliente();
                  }}
                >
                  {isCancellingReserva ? 'Cancelando…' : 'Sí, cancelar reserva'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Dialog open={bookingComprobanteDialogOpen} onOpenChange={setBookingComprobanteDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Comprobante</DialogTitle>
                <DialogDescription>
                  Pagos registrados con comprobante para la reserva #{selectedBooking?.id}. Puedes abrir cada archivo en una nueva
                  pestaña.
                </DialogDescription>
              </DialogHeader>
              {bookingPagosConComprobante.length === 0 ? (
                <p className="text-sm text-gray-600">No hay comprobantes cargados para esta reserva.</p>
              ) : (
                <div className="space-y-6">
                  {bookingPagosConComprobante.map((pago) => {
                    const url = String(pago.comprobante_url || '').trim();
                    const tipo = String(pago.comprobante_tipo || '');
                    const esImg = clienteComprobanteEsImagenParaVista(url, tipo);
                    const esPdf = clienteComprobanteEsPdfParaVista(url, tipo);
                    return (
                      <div key={pago.id_pago} className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-800">
                          <span className="font-semibold text-green-900">Abono #{pago.id_pago}</span>
                          <span>Monto: {formatCurrency(pago.monto)}</span>
                          <span>Método: {pago.metodo_pago || '—'}</span>
                          <span>Estado: {pago.estado || 'Pendiente'}</span>
                          {getPagoFechaHoraRaw(pago) ? (
                            <span>Fecha y hora: {formatPaymentDateTime(getPagoFechaHoraRaw(pago))}</span>
                          ) : null}
                        </div>
                        {pago.comprobante_nombre ? (
                          <p className="text-xs text-gray-600">Archivo: {pago.comprobante_nombre}</p>
                        ) : null}
                        {esImg ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                            <img
                              src={url}
                              alt={`Comprobante abono ${pago.id_pago}`}
                              className="max-h-72 max-w-full rounded-md border border-gray-300 bg-white object-contain mx-auto"
                            />
                          </a>
                        ) : null}
                        {esPdf && !esImg ? (
                          <iframe title={`PDF comprobante ${pago.id_pago}`} src={url} className="h-[min(420px,50vh)] w-full rounded-md border bg-white" />
                        ) : null}
                        {!esImg && !esPdf ? (
                          <p className="text-xs text-gray-700">Vista previa no disponible para este tipo de archivo.</p>
                        ) : null}
                        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Abrir comprobante
                          </a>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </DialogContent>
          </Dialog>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Detalle de mi reserva</h3>
              <p className="text-sm text-gray-600">Reserva #{selectedBooking.id}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setBookingDetailPagos([]);
                setBookingProgEnriched({});
                setSelectedBookingDetail(null);
                setBookingsView('list');
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a mis reservas
            </Button>
          </div>

          {isLoadingBookingDetail ? (
            <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-900">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
              Cargando el detalle completo de tu reserva (pagos, guías, servicios y acompañantes)…
            </div>
          ) : null}

          {!isLoadingBookingDetail && !selectedBookingDetail ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p>
                No se pudo cargar toda la información. Puedes reintentar o volver al listado; los datos del resumen
                siguen visibles abajo.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-600 shrink-0"
                onClick={() => {
                  if (selectedBooking?.id) void loadBookingDetail(selectedBooking.id);
                }}
              >
                Reintentar carga
              </Button>
            </div>
          ) : null}

          <ClienteReservaDetalleHero
            booking={selectedBooking}
            detail={selectedBookingDetail}
            rutasById={bookingDetailRutasById}
            primaryProg={primaryProgBooking as Record<string, unknown> | null}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Servicio</p>
                  <p className="text-lg font-semibold text-green-800">
                    {resolveReservaProductoNombre(selectedBookingDetail) ||
                      (selectedBooking.serviceType === 'Finca' && selectedBookingDetail?.fincas?.[0]
                        ? fincaDisplayName(selectedBookingDetail.fincas[0])
                        : resolveRouteNameFromReservaPayload(selectedBookingDetail) ||
                          (selectedBooking.serviceType === 'Ruta' &&
                          selectedBookingDetail?.programaciones?.[0]
                            ? resolveProgrammingRouteName(selectedBookingDetail.programaciones[0])
                            : selectedBooking.serviceType === 'Servicio' &&
                                selectedBookingDetail?.servicios?.[0]
                              ? selectedBookingDetail.servicios[0].servicio_nombre ||
                                selectedBookingDetail.servicios[0].nombre_servicio ||
                                selectedBooking.serviceName
                              : selectedBooking.serviceName))}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedBooking.serviceType}</p>
                </div>
                {selectedBooking.serviceType === 'Ruta' ? (
                  <RouteIcon className="h-8 w-8 text-blue-600" />
                ) : selectedBooking.serviceType === 'Servicio' ? (
                  <Package className="h-8 w-8 text-amber-600" />
                ) : (
                  <TreePine className="h-8 w-8 text-green-600" />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Participantes</p>
                  <p className="text-2xl font-semibold text-green-800">
                    {selectedBookingDetail?.numero_participantes || selectedBooking.participants}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-semibold text-green-800">
                    {formatCurrency(selectedBooking.totalAmount)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Estado de pago</p>
                  <div className="mt-2">{getPaymentStatusBadge(selectedBooking.paymentStatus)}</div>
                </div>
                <CreditCard className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
          </div>

          {motivoDesaprobacionVisible ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-950">
              <p className="font-semibold">
                Motivo de desaprobación de tu comprobante (guardado en tu reserva por OCCITOUR)
              </p>
              <p className="mt-2 whitespace-pre-wrap">{motivoDesaprobacionVisible}</p>
              <p className="mt-2 text-xs opacity-90">
                Corrige lo indicado y vuelve a enviar el comprobante desde <strong>Mis abonos</strong> o el bloque de pago de
                esta reserva, según el tipo de servicio.
              </p>
            </div>
          ) : null}

          {selectedBooking.status === 'Cancelada' ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
              Esta reserva está <strong>cancelada</strong>. No aplica devolución de dinero según las políticas; para una nueva
              fecha o estadía debes hacer una <strong>reserva nueva</strong>.
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <ClienteTitularReservaCard user={user} detail={selectedBookingDetail} />

              {bookingPagoRechazado ? (
                <Card className="border-red-200 bg-red-50 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-red-900">Comprobante no aceptado</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-red-950">
                    <p>
                      OCCITOUR revisó un comprobante de esta reserva y lo marcó como <strong>rechazado</strong>. Corrige
                      lo indicado y envía un nuevo abono desde el bloque de pago o desde <strong>Mis abonos</strong>.
                    </p>
                    {String((bookingPagoRechazado as { motivo_rechazo?: string }).motivo_rechazo || '').trim() ? (
                      <div className="rounded-lg border border-red-200 bg-white/80 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-800">Motivo del abono</p>
                        <p className="mt-1 text-red-900">
                          {(bookingPagoRechazado as { motivo_rechazo?: string }).motivo_rechazo}
                        </p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              <Card className="border-green-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-green-900">Información de la reserva</CardTitle>
                  <p className="text-sm font-normal text-muted-foreground">
                    Resumen económico, fechas y estado de tu servicio contratado.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-x-auto rounded-md border border-gray-200">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="w-[40%] text-gray-600 bg-gray-50/80">Tipo de servicio</TableCell>
                          <TableCell className="font-medium">{selectedBooking.serviceType}</TableCell>
                        </TableRow>
                        {resolveReservaProductoNombre(selectedBookingDetail) ||
                        resolveRouteNameFromReservaPayload(selectedBookingDetail) ? (
                          <TableRow>
                            <TableCell className="text-gray-600 bg-gray-50/80">
                              {selectedBooking.serviceType === 'Finca' ? 'Finca reservada' : 'Ruta / servicio reservado'}
                            </TableCell>
                            <TableCell className="font-medium">
                              {resolveReservaProductoNombre(selectedBookingDetail) ||
                                resolveRouteNameFromReservaPayload(selectedBookingDetail)}
                            </TableCell>
                          </TableRow>
                        ) : null}
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Fecha de reserva</TableCell>
                          <TableCell className="font-medium">
                            {formatDate(selectedBookingDetail?.fecha_reserva) || selectedBooking.date}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Estado de la reserva</TableCell>
                          <TableCell>{getStatusBadge(selectedBooking.status)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">ID venta</TableCell>
                          <TableCell className="font-medium">
                            {selectedBookingDetail?.id_venta ?? selectedBooking.saleId
                              ? `#${selectedBookingDetail?.id_venta ?? selectedBooking.saleId}`
                              : '—'}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Monto total</TableCell>
                          <TableCell className="font-semibold text-green-800">
                            {formatCurrency(
                              selectedBookingDetail?.monto_total ??
                                selectedBookingDetail?.total ??
                                selectedBooking.totalAmount,
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Pagado</TableCell>
                          <TableCell className="font-medium text-green-800">
                            {formatCurrency(
                              selectedBookingDetail?.monto_pagado ?? selectedBooking.paidAmount,
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Saldo pendiente</TableCell>
                          <TableCell className="font-medium text-amber-800">
                            {formatCurrency(
                              selectedBookingDetail?.saldo_pendiente ?? selectedBooking.pendingAmount,
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Método de pago</TableCell>
                          <TableCell className="font-medium">
                            {selectedBookingDetail?.metodo_pago || selectedBooking.paymentMethod || '—'}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-gray-600 bg-gray-50/80">Estado del pago</TableCell>
                          <TableCell>{getPaymentStatusBadge(selectedBooking.paymentStatus)}</TableCell>
                        </TableRow>
                        {primaryProgBooking ? (
                          <>
                            <TableRow>
                              <TableCell className="text-gray-600 bg-gray-50/80 align-top">Salida programada</TableCell>
                              <TableCell className="text-sm">
                                <span className="font-medium">
                                  {formatDateTime(
                                    primaryProgBooking.fecha_salida ?? primaryProgBooking.fecha_programada,
                                    primaryProgBooking.hora_salida,
                                  )}
                                </span>
                              </TableCell>
                            </TableRow>
                            {(primaryProgBooking.fecha_regreso || primaryProgBooking.fecha_regreso_programada) ? (
                              <TableRow>
                                <TableCell className="text-gray-600 bg-gray-50/80">Regreso programado</TableCell>
                                <TableCell className="text-sm font-medium">
                                  {formatDateTime(
                                    primaryProgBooking.fecha_regreso ?? primaryProgBooking.fecha_regreso_programada,
                                    primaryProgBooking.hora_regreso,
                                  )}
                                </TableCell>
                              </TableRow>
                            ) : null}
                            {primaryProgBooking.lugar_encuentro?.trim() ? (
                              <TableRow>
                                <TableCell className="text-gray-600 bg-gray-50/80">Punto de encuentro</TableCell>
                                <TableCell className="text-sm font-medium whitespace-pre-wrap">
                                  {primaryProgBooking.lugar_encuentro.trim()}
                                </TableCell>
                              </TableRow>
                            ) : null}
                            {String(primaryProgBooking.dificultad || '').trim() ? (
                              <TableRow>
                                <TableCell className="text-gray-600 bg-gray-50/80">Dificultad</TableCell>
                                <TableCell className="text-sm font-medium">
                                  {String(primaryProgBooking.dificultad).trim()}
                                </TableCell>
                              </TableRow>
                            ) : null}
                          </>
                        ) : null}
                        {selectedBooking.specialRequests?.trim() ? (
                          <TableRow>
                            <TableCell className="text-gray-600 bg-gray-50/80 align-top">Notas al reservar</TableCell>
                            <TableCell className="text-sm whitespace-pre-wrap">
                              {selectedBooking.specialRequests.trim()}
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <ReservaPagosClienteTable
                pagos={bookingDetailPagos}
                isLoading={isLoadingBookingPagos}
                comprobantesCount={bookingPagosConComprobante.length}
                onVerComprobantes={() => setBookingComprobanteDialogOpen(true)}
              />

              {showSaldoPagoForm ? (
                <Card id="payment-section" className="border-amber-300 bg-amber-50/60 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-amber-950 flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      {saldoPagoTitulo}
                    </CardTitle>
                    <p className="text-sm font-normal text-amber-950/90">
                      Registra el comprobante por el saldo restante de tu reserva. El monto enviado será{' '}
                      <strong>{formatCurrency(saldoRestanteReserva)}</strong> (saldo actual según el sistema).
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isCheckingFincaSaldoGate ? (
                      <p className="text-sm text-amber-900">Comprobando si puedes enviar un nuevo abono…</p>
                    ) : fincaSaldoComprobanteBloqueado ? (
                      <div className="rounded-lg border border-amber-400 bg-white/80 px-3 py-2 text-sm text-amber-950">
                        Ya hay un <strong>comprobante en revisión</strong> (pendiente o verificado) para esta reserva. Cuando
                        OCCITOUR lo apruebe o rechace, podrás enviar otro si aún queda saldo. Revisa también{' '}
                        <strong>Mis abonos</strong>.
                      </div>
                    ) : (
                      <>
                        <OccitoursPaymentBankDetails />

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Método de pago</Label>
                            <Select
                              value={fincaSaldoPagoForm.metodo_pago}
                              onValueChange={(value) =>
                                setFincaSaldoPagoForm((p) => ({ ...p, metodo_pago: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Transferencia">Transferencia</SelectItem>
                                <SelectItem value="QR">QR</SelectItem>
                                <SelectItem value="PSE">PSE</SelectItem>
                                <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                                <SelectItem value="Efectivo">Efectivo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Número de transacción (opcional)</Label>
                            <Input
                              value={fincaSaldoPagoForm.numero_transaccion}
                              onChange={(e) =>
                                setFincaSaldoPagoForm((p) => ({ ...p, numero_transaccion: e.target.value }))
                              }
                              placeholder="Referencia del banco"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="finca-saldo-comprobante">Comprobante (PDF, JPG o PNG, máx. 5MB)</Label>
                          <Input
                            id="finca-saldo-comprobante"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            onChange={handleFincaSaldoProofChange}
                          />
                          {fincaSaldoProofFile ? (
                            <p className="text-xs text-green-800">Archivo: {fincaSaldoProofFile.name}</p>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <Label>Nota para OCCITOUR (opcional)</Label>
                          <Textarea
                            value={fincaSaldoPagoForm.observaciones}
                            onChange={(e) =>
                              setFincaSaldoPagoForm((p) => ({ ...p, observaciones: e.target.value }))
                            }
                            className="min-h-[72px]"
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                  {!isCheckingFincaSaldoGate && !fincaSaldoComprobanteBloqueado ? (
                    <CardFooter className="flex flex-col items-stretch gap-2 border-t border-amber-200/80 bg-amber-50 pt-4 pb-6">
                      <button
                        type="button"
                        className="flex h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-green-700 px-4 text-base font-semibold text-white shadow-md transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                        disabled={isSubmittingFincaSaldoPago || fincaSaldoComprobanteBloqueado}
                        onClick={() => void handleFincaSaldoPagoSubmit()}
                      >
                        {isSubmittingFincaSaldoPago ? 'Enviando…' : 'Enviar comprobante del saldo'}
                      </button>
                      <p className="text-center text-xs text-amber-950/80">
                        Revisa método y archivo; el monto registrado será el saldo indicado arriba.
                      </p>
                    </CardFooter>
                  ) : null}
                </Card>
              ) : null}

              {Array.isArray(selectedBookingDetail?.programaciones) &&
              selectedBookingDetail.programaciones.length > 0 ? (
                <>
                  <ProgramacionesReservaClienteTable
                    lines={selectedBookingDetail.programaciones}
                    reserva={selectedBookingDetail}
                    enrichedByProgId={bookingProgEnriched}
                    listMontoTotalHint={
                      Number(selectedBookingDetail.id_reserva ?? selectedBookingDetail.id) ===
                        Number(selectedBooking?.id) && selectedBooking
                        ? selectedBooking.totalAmount
                        : null
                    }
                  />
                  <ReservaGuiasClienteTable
                    lines={selectedBookingDetail.programaciones}
                    enrichedByProgId={bookingProgEnriched}
                    reserva={selectedBookingDetail}
                  />
                </>
              ) : null}

              <ClienteRutaContextoCard rutasById={bookingDetailRutasById} />
              <ClienteRecomendacionesSalidaCard texto={recomTextReservaCliente} />
              <ClienteRutaServiciosPredefinidosCard rutasById={bookingDetailRutasById} />

              {Array.isArray(selectedBookingDetail?.fincas) && selectedBookingDetail.fincas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detalle de finca</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Finca</TableHead>
                          <TableHead>Ubicación</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead>Check-out</TableHead>
                          <TableHead>Noches</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBookingDetail.fincas.map((item: any) => (
                          <TableRow key={item.id_detalle_reserva_finca || `${item.id_finca}-${item.subtotal}`}>
                            <TableCell>
                              <div className="font-medium">{fincaDisplayName(item)}</div>
                              {item.id_finca != null && (
                                <div className="text-xs text-gray-400">Ref.c #{item.id_finca}</div>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[220px] text-sm text-gray-700">
                              {item.ubicacion?.trim() || '—'}
                            </TableCell>
                            <TableCell>{formatDate(item.fecha_checkin)}</TableCell>
                            <TableCell>{formatDate(item.fecha_checkout)}</TableCell>
                            <TableCell>{item.numero_noches || '—'}</TableCell>
                            <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {Array.isArray(selectedBookingDetail?.servicios) && selectedBookingDetail.servicios.length > 0 && (
                <Card className="border-amber-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-amber-900">Servicios adicionales contratados</CardTitle>
                    <p className="text-sm font-normal text-muted-foreground">
                      Extras agregados a tu reserva (seguros, personal médico, transporte, etc.).
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-md border border-gray-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-amber-50/50">
                            <TableHead>Servicio</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Precio unitario</TableHead>
                            <TableHead>Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedBookingDetail.servicios.map((item: any) => (
                            <TableRow key={item.id_detalle_reserva_servicio || `${item.id_servicio}-${item.subtotal}`}>
                              <TableCell className="font-medium">
                                {item.nombre_servicio || item.servicio_nombre || `Servicio #${item.id_servicio}`}
                              </TableCell>
                              <TableCell>{item.cantidad}</TableCell>
                              <TableCell>{formatCurrency(item.precio_unitario)}</TableCell>
                              <TableCell className="font-medium text-green-800">{formatCurrency(item.subtotal)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              <ReservaObservacionesClienteCard
                reserva={selectedBookingDetail}
                booking={selectedBooking}
              />

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Acompañantes</CardTitle>
                  <p className="text-sm font-normal text-muted-foreground">
                    Personas registradas en esta reserva además del titular.
                  </p>
                </CardHeader>
                <CardContent>
                  {Array.isArray(selectedBookingDetail?.acompanantes) && selectedBookingDetail.acompanantes.length > 0 ? (
                    <div className="overflow-x-auto rounded-md border border-gray-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50/80">
                            <TableHead>Nombre</TableHead>
                            <TableHead>Documento</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Nacimiento</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedBookingDetail.acompanantes.map((acompanante: any) => (
                            <TableRow key={acompanante.id_detalle_reserva_acompanante}>
                              <TableCell className="font-medium">
                                {`${acompanante.nombre || ''} ${acompanante.apellido || ''}`.trim() || '—'}
                              </TableCell>
                              <TableCell>
                                {[acompanante.tipo_documento, acompanante.numero_documento].filter(Boolean).join(' ') || '—'}
                              </TableCell>
                              <TableCell>{acompanante.telefono || '—'}</TableCell>
                              <TableCell>{formatDate(acompanante.fecha_nacimiento)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No hay acompañantes registrados en esta reserva.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-green-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Seguimiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between gap-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Creada</span>
                    <span className="font-medium text-right">
                      {formatPaymentDateTime(
                        selectedBookingDetail?.fecha_creacion ?? selectedBookingDetail?.created_at,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Actualizada</span>
                    <span className="font-medium text-right">
                      {formatDate(selectedBookingDetail?.fecha_actualizacion) || '—'}
                    </span>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-gray-600 mb-1">Abonos registrados</p>
                    <p className="text-2xl font-semibold text-green-800">{bookingDetailPagos.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Estado del pago</p>
                    {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Estado de la reserva</p>
                    {getStatusBadge(selectedBooking.status)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Soporte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Correo</p>
                      <p className="font-medium">{user?.email || 'No disponible'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-medium">{user?.phone || 'No registrado'}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                    El estado de tu reserva se actualiza automáticamente según la validación del pago en ventas y abonos.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Acciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {puedeCancelarCliente ? (
                    <Button
                      variant="outline"
                      className="w-full border-red-600 text-red-700 hover:bg-red-50"
                      onClick={() => setCancelReservaOpen(true)}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Cancelar mi reserva
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => {
                      if (selectedBooking?.id) {
                        void loadBookingDetail(selectedBooking.id);
                      }
                    }}
                    disabled={isLoadingBookingDetail}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Actualizar detalle
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                    type="button"
                    disabled={
                      isLoadingBookingPagos ||
                      bookingPagosConComprobante.length === 0
                    }
                    title={
                      bookingPagosConComprobante.length === 0 && !isLoadingBookingPagos
                        ? 'No hay comprobante registrado. Si pagaste recién, usa Actualizar detalle.'
                        : isLoadingBookingPagos
                          ? 'Cargando comprobantes…'
                          : undefined
                    }
                    onClick={() => setBookingComprobanteDialogOpen(true)}
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    Comprobante
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => window.print()}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Imprimir resumen
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm text-gray-600">Mis reservas</p>
                <p className="text-2xl font-semibold text-green-800">{bookingStats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm text-gray-600">Confirmadas</p>
                <p className="text-2xl font-semibold text-green-800">{bookingStats.confirmed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm text-gray-600">Pagado</p>
                <p className="text-xl font-semibold text-green-800">{formatCurrency(bookingStats.totalSpent)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm text-gray-600">Saldo pendiente</p>
                <p className="text-xl font-semibold text-amber-700">{formatCurrency(bookingStats.pendingBalance)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-amber-600" />
            </CardContent>
          </Card>
        </div>

        <ClientModuleFiltersCard
          searchValue={bookingsSearchTerm}
          onSearchChange={setBookingsSearchTerm}
          searchPlaceholder="Servicio, ID de reserva o solicitud..."
          onClear={() => {
            setBookingsSearchTerm('');
            setBookingsStatusFilter('all');
            setBookingsPage(1);
          }}
        >
          <div>
            <label className="text-sm font-medium text-gray-700">Estado</label>
            <div className="mt-1">
              <select
                value={bookingsStatusFilter}
                onChange={(e) => setBookingsStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Todos</option>
                <option value="Confirmada">Confirmada</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Cancelada">Cancelada</option>
                <option value="Completada">Completada</option>
              </select>
            </div>
          </div>
        </ClientModuleFiltersCard>

        <Card>
          <CardHeader>
            <CardTitle>Mis reservas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Las rutas personalizadas se muestran solo como fila Personalizada. El resto —programada, finca u otras— como
              reserva. El orden es el de la última reserva o solicitud registrada (fecha de creación si el servidor la envía).
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unifiedBookingRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-gray-500">
                      {isResolvingClientId
                        ? 'Cargando tu perfil de cliente...'
                        : !clientId
                          ? 'No pudimos vincular tu cuenta de cliente. Cierra sesión e inicia de nuevo.'
                          : isLoadingBookings || isLoadingRequests
                            ? 'Cargando...'
                            : 'No tienes reservas ni solicitudes personalizadas que coincidan con los filtros.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUnifiedBookingRows.map((row) =>
                    row.kind === 'booking' ? (
                      <TableRow key={`booking-${row.booking.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            {row.booking.serviceType === 'Ruta' ? (
                              <RouteIcon className="h-4 w-4 shrink-0 text-blue-600" />
                            ) : row.booking.serviceType === 'Servicio' ? (
                              <Package className="h-4 w-4 shrink-0 text-amber-600" />
                            ) : (
                              <TreePine className="h-4 w-4 shrink-0 text-green-600" />
                            )}
                            <span className="font-medium">{row.booking.serviceType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{row.booking.serviceName}</p>
                            <p className="text-xs text-gray-500">Reserva #{row.booking.id}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[280px] whitespace-normal align-top">
                          <div>{row.booking.date}</div>
                          {row.booking.tripSummaryLine ? (
                            <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                              {row.booking.tripSummaryLine}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>{row.booking.participants}</TableCell>
                        <TableCell>{formatCurrency(row.booking.totalAmount)}</TableCell>
                        <TableCell>{getPaymentStatusBadge(row.booking.paymentStatus)}</TableCell>
                        <TableCell>{getStatusBadge(row.booking.status)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => openDetailView(row.booking)}>
                            Ver detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={`solicitud-${row.request.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            <RouteIcon className="h-4 w-4 shrink-0 text-blue-600" />
                            <span className="font-medium">Ruta</span>
                            <Badge
                              variant="outline"
                              className="border-violet-300 bg-violet-50 text-violet-800 font-normal"
                            >
                              Personalizada
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{row.request.routeName}</p>
                            <p className="text-xs text-gray-500">Solicitud #{row.request.id}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[280px] whitespace-normal align-top">
                          <div>{formatDateTime(row.request.requestedDate, row.request.requestedTime)}</div>
                          {row.request.tripSummaryLine ? (
                            <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                              {row.request.tripSummaryLine}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>{row.request.people}</TableCell>
                        <TableCell>{formatCurrency(row.request.quoteAmount)}</TableCell>
                        <TableCell>{getPaymentStatusBadge(row.request.paymentStatus)}</TableCell>
                        <TableCell>{getSolicitudStatusBadge(resolveSolicitudStatusForUi(row.request))}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => openRequestDetail(row.request)}>
                            Continuar solicitud
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </Table>

            <ClientListPagination
              page={bookingsPage}
              totalPages={bookingsTotalPages}
              totalItems={unifiedBookingRows.length}
              perPage={CLIENT_LIST_PER_PAGE}
              onPageChange={setBookingsPage}
              itemLabel="registro(s)"
            />
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Mi Perfil</h3>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-green-100 text-green-600">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">{user?.name}</h4>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <div className="mt-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{user?.phone || 'No registrado'}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Correo</label>
                <div className="mt-1 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{bookingStats.total}</div>
              <div className="text-sm text-gray-600">Reservas registradas</div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">{bookingStats.confirmed}</div>
                <div className="text-xs text-gray-600">Confirmadas</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{bookings.length}</div>
                <div className="text-xs text-gray-600">Historial</div>
              </div>
            </div>
            <div className="border-t pt-4 text-center">
              <div className="text-lg font-semibold">{formatCurrency(bookingStats.totalSpent)}</div>
              <div className="text-sm text-gray-600">Total pagado</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSales = () => {
    if (salesView === 'detail' && selectedSale) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Detalle de mi venta</h3>
              <p className="text-sm text-gray-600">Venta #{selectedSale.saleId}</p>
            </div>
            <Button variant="outline" onClick={() => {
              setSelectedSale(null);
              setSelectedSaleDetail(null);
              setSelectedSalePayments([]);
              setSalesView('list');
            }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a mis ventas
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Servicio</p><p className="text-lg font-semibold text-green-800">{selectedSale.serviceName}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Total</p><p className="text-xl font-semibold text-green-800">{formatCurrency(selectedSale.total)}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Pagado</p><p className="text-xl font-semibold text-green-800">{formatCurrency(selectedSale.paid)}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Estado</p><div className="mt-2">{getPaymentStatusBadge(selectedSale.paymentStatus)}</div></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <Card>
                <CardHeader><CardTitle>Resumen de la venta</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div><p className="text-sm text-gray-600">ID venta</p><p className="font-medium">{selectedSale.saleId}</p></div>
                  <div><p className="text-sm text-gray-600">ID reserva</p><p className="font-medium">#{selectedSale.reservationId}</p></div>
                  <div><p className="text-sm text-gray-600">Fecha</p><p className="font-medium">{selectedSale.date}</p></div>
                  <div><p className="text-sm text-gray-600">Tipo</p><p className="font-medium">{selectedSale.serviceType}</p></div>
                  <div><p className="text-sm text-gray-600">Método de pago</p><p className="font-medium">{selectedSale.paymentMethod}</p></div>
                  <div><p className="text-sm text-gray-600">Saldo pendiente</p><p className="font-medium">{formatCurrency(selectedSale.pending)}</p></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Abonos asociados</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Pago</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSalePayments.length > 0 ? selectedSalePayments.map((payment: any) => (
                        <TableRow key={payment.id_pago}>
                          <TableCell className="font-medium">#{payment.id_pago}</TableCell>
                          <TableCell>{formatDate(payment.fecha_pago || payment.fecha_creacion)}</TableCell>
                          <TableCell>{formatCurrency(payment.monto)}</TableCell>
                          <TableCell>{payment.metodo_pago || 'Por definir'}</TableCell>
                          <TableCell>{getPaymentStatusBadge(payment.estado)}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-gray-500">
                            {isLoadingSaleDetail ? 'Cargando abonos...' : 'Esta venta aún no tiene abonos registrados.'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Seguimiento</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><p className="text-sm text-gray-600">Estado de pago</p><div className="mt-1">{getPaymentStatusBadge(selectedSale.paymentStatus)}</div></div>
                  <div><p className="text-sm text-gray-600">Creada el</p><p className="font-medium">{formatDate(selectedSaleDetail?.fecha_venta || selectedSaleDetail?.fecha_creacion)}</p></div>
                  <div><p className="text-sm text-gray-600">Actualizada el</p><p className="font-medium">{formatDate(selectedSaleDetail?.fecha_actualizacion)}</p></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => void loadSaleDetail(selectedSale)}
                    disabled={isLoadingSaleDetail}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Actualizar detalle
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Mis ventas</p><p className="text-2xl font-semibold text-green-800">{salesStats.total}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Pagadas</p><p className="text-2xl font-semibold text-green-800">{salesStats.paid}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Pendientes</p><p className="text-2xl font-semibold text-green-800">{salesStats.pending}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Valor total</p><p className="text-xl font-semibold text-green-800">{formatCurrency(salesStats.totalAmount)}</p></CardContent></Card>
        </div>

        <ClientModuleFiltersCard
          searchValue={salesSearchTerm}
          onSearchChange={setSalesSearchTerm}
          searchPlaceholder="Servicio, ID venta o reserva..."
          onClear={() => {
            setSalesSearchTerm('');
            setSalesStatusFilter('all');
            setSalesPage(1);
          }}
        >
          <div>
            <label className="text-sm font-medium text-gray-700">Estado de pago</label>
            <div className="mt-1">
              <select
                value={salesStatusFilter}
                onChange={(e) => setSalesStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Parcial">Parcial</option>
                <option value="Pagado">Pagado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </ClientModuleFiltersCard>

        <Card>
          <CardHeader><CardTitle>Mis ventas</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Venta</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pagado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.length > 0 ? (
                  paginatedSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">#{sale.saleId}</TableCell>
                      <TableCell>{sale.date}</TableCell>
                      <TableCell>{sale.serviceName}</TableCell>
                      <TableCell className="font-semibold text-green-600">{formatCurrency(sale.total)}</TableCell>
                      <TableCell>{formatCurrency(sale.paid)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(sale.paymentStatus)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openSaleDetail(sale)}>
                          Ver detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-gray-500">
                      {isResolvingClientId
                        ? 'Cargando tu perfil de cliente...'
                        : !clientId
                          ? 'No pudimos vincular tu cuenta de cliente.'
                          : isLoadingSales
                            ? 'Cargando ventas...'
                            : sales.length > 0
                              ? 'No hay ventas que coincidan con los filtros.'
                              : 'No tienes ventas registradas.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ClientListPagination
              page={salesPage}
              totalPages={salesTotalPages}
              totalItems={filteredSales.length}
              perPage={CLIENT_LIST_PER_PAGE}
              onPageChange={setSalesPage}
              itemLabel="venta(s)"
            />
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPayments = () => {
    if (paymentsView === 'detail' && selectedPayment) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Detalle de mi abono</h3>
              <p className="text-sm text-gray-600">Pago #{selectedPayment.paymentId}</p>
            </div>
            <Button variant="outline" onClick={() => {
              setSelectedPayment(null);
              setSelectedPaymentDetail(null);
              setSelectedPaymentSale(null);
              setPaymentsView('list');
            }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a mis abonos
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Monto</p><p className="text-xl font-semibold text-green-800">{formatCurrency(selectedPayment.amount)}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Estado</p><div className="mt-2">{getInstallmentStatusBadge(selectedPayment.status)}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Reserva</p><p className="text-lg font-semibold text-green-800">#{selectedPayment.reservationId}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Venta</p><p className="text-lg font-semibold text-green-800">#{selectedPayment.saleId || '—'}</p></CardContent></Card>
          </div>

          {selectedPayment.paymentRejectionNote ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">Indicación del equipo sobre tu pago (guardada en tu reserva)</p>
              <p className="mt-2 whitespace-pre-wrap">{selectedPayment.paymentRejectionNote}</p>
              <p className="mt-2 text-xs opacity-90">
                Este texto se actualiza cuando OCCITOUR desaprueba un comprobante; también lo verás en el detalle de la reserva
                correspondiente.
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              {selectedPayment.status === 'Rechazado' ? (
                <Card className="border-red-200 bg-red-50 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-red-900">Comprobante no aceptado</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-red-950">
                    <p className="text-xs font-medium uppercase tracking-wide text-red-800">
                      {clientPaymentFlowLabel(selectedPayment.paymentFlowKind)}
                    </p>
                    <p>
                      OCCITOUR revisó tu comprobante y lo marcó como <strong>rechazado</strong>.
                    </p>
                    {selectedPayment.paymentFlowKind === 'programmed_route' ? (
                      <p className="text-red-900/95">
                        En una <strong>salida programada</strong> pagaste en el mismo paso para apartar tu cupo y enviaste el
                        comprobante para validación. Corrige lo que indicamos abajo y, si tu venta sigue con saldo pendiente o el
                        equipo te lo indica, vuelve a <strong>registrar el pago</strong> con un comprobante válido para poder
                        verificar tu plaza.
                      </p>
                    ) : selectedPayment.paymentFlowKind === 'custom_request' ? (
                      <p className="text-red-900/95">
                        En una <strong>solicitud personalizada</strong> el flujo normal es que el asesor revise la solicitud y{' '}
                        <strong>habilite el pago</strong> antes de que subas comprobante. Si rechazamos el comprobante, revisa el
                        motivo y vuelve a enviar el pago desde el detalle de tu solicitud cuando el formulario siga habilitado.
                      </p>
                    ) : selectedPayment.paymentFlowKind === 'finca' ? (
                      <p className="text-red-900/95">
                        Este abono corresponde a tu <strong>reserva de finca</strong>. Corrige el comprobante según el motivo y,
                        si el saldo sigue pendiente, podrás registrar un <strong>nuevo abono</strong> cuando corresponda.
                      </p>
                    ) : (
                      <p className="text-red-900/95">
                        Corrige lo indicado y vuelve a registrar el pago siguiendo las indicaciones de tu asesor cuando el saldo
                        lo permita.
                      </p>
                    )}
                    {selectedPaymentDetail?.motivo_rechazo ? (
                      <div className="rounded-lg border border-red-200 bg-white/80 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-800">Motivo</p>
                        <p className="mt-1 text-red-900">{selectedPaymentDetail.motivo_rechazo}</p>
                      </div>
                    ) : (
                      <p className="text-red-900/90">
                        No se registró un motivo en el sistema. Contacta a tu asesor para saber qué corregir.
                      </p>
                    )}
                    {selectedPayment.paymentFlowKind !== 'custom_request' ? (
                      <p className="text-red-900/85">
                        Si tu venta sigue con <strong>saldo pendiente</strong>, cuando OCCITOUR lo permita podrás registrar un{' '}
                        <strong>nuevo abono</strong> con otro comprobante; el registro rechazado queda en historial.
                      </p>
                    ) : (
                      <p className="text-red-900/85">
                        El abono rechazado queda en historial; el siguiente envío depende de que el pago siga habilitado en tu
                        solicitud personalizada.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              {selectedPayment.status === 'Rechazado' && selectedPayment.paymentFlowKind === 'custom_request' ? (
                <Card className="border-amber-200 bg-amber-50/80 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-amber-950">Cómo reenviar el comprobante</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-amber-950 space-y-2">
                    <p>
                      Este abono está ligado a una <strong>solicitud personalizada</strong>. Vuelve a{' '}
                      <strong>Mis solicitudes</strong>, abre el detalle y usa el formulario de pago cuando siga habilitado.
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              {selectedPayment.status === 'Rechazado' && selectedPayment.paymentFlowKind !== 'custom_request' ? (
                <Card className="border-green-200 bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-green-900">Reenviar comprobante</CardTitle>
                    <p className="text-sm font-normal text-gray-600">
                      Registramos un <strong>nuevo abono</strong> con el mismo monto ({formatCurrency(selectedPayment.amount)})
                      para que el equipo lo revise. El pago rechazado anterior sigue en tu historial.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <OccitoursPaymentBankDetails />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Método de pago</Label>
                        <Select
                          value={resubmitPago.metodo_pago}
                          onValueChange={(value) => setResubmitPago((p) => ({ ...p, metodo_pago: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Transferencia">Transferencia</SelectItem>
                            <SelectItem value="QR">QR</SelectItem>
                            <SelectItem value="PSE">PSE</SelectItem>
                            <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                            <SelectItem value="Efectivo">Efectivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Número de transacción (opcional)</Label>
                        <Input
                          value={resubmitPago.numero_transaccion}
                          onChange={(e) => setResubmitPago((p) => ({ ...p, numero_transaccion: e.target.value }))}
                          placeholder="Referencia del banco"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client-resubmit-proof">Nuevo comprobante</Label>
                      <Input
                        id="client-resubmit-proof"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        onChange={handleResubmitRejectedProofFile}
                      />
                      {resubmitProofName ? (
                        <p className="text-xs text-green-800">Archivo: {resubmitProofName}</p>
                      ) : (
                        <p className="text-xs text-gray-500">PDF, JPG o PNG máx. 5MB.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Nota para OCCITOUR (opcional)</Label>
                      <Textarea
                        value={resubmitPago.observaciones}
                        onChange={(e) => setResubmitPago((p) => ({ ...p, observaciones: e.target.value }))}
                        placeholder="Ej. comprobante corregido según indicaciones"
                        className="min-h-[72px]"
                      />
                    </div>
                    <Button
                      type="button"
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                      disabled={isSubmittingResubmitPago}
                      onClick={() => void handleResubmitRejectedPago()}
                    >
                      {isSubmittingResubmitPago ? 'Enviando...' : 'Enviar nuevo comprobante'}
                    </Button>
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader><CardTitle>Resumen del abono</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div><p className="text-sm text-gray-600">Contexto del pago</p><p className="font-medium">{clientPaymentFlowLabel(selectedPayment.paymentFlowKind)}</p></div>
                  <div><p className="text-sm text-gray-600">Servicio</p><p className="font-medium">{selectedPayment.serviceName}</p></div>
                  <div><p className="text-sm text-gray-600">Tipo</p><p className="font-medium">{selectedPayment.serviceType}</p></div>
                  <div><p className="text-sm text-gray-600">Fecha de envío</p><p className="font-medium">{selectedPayment.date}</p></div>
                  <div><p className="text-sm text-gray-600">Método</p><p className="font-medium">{selectedPayment.method}</p></div>
                  <div><p className="text-sm text-gray-600">Transacción</p><p className="font-medium">{selectedPaymentDetail?.numero_transaccion || 'No registrada'}</p></div>
                  <div><p className="text-sm text-gray-600">Observaciones</p><p className="font-medium">{selectedPaymentDetail?.observaciones || 'Sin observaciones'}</p></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Comprobante</CardTitle></CardHeader>
                <CardContent>
                  {selectedPaymentDetail?.comprobante_url ? (
                    <a
                      href={selectedPaymentDetail.comprobante_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-green-700 underline"
                    >
                      Ver comprobante enviado
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500">Este abono no tiene comprobante adjunto.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Relacionado con</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><p className="text-sm text-gray-600">Venta</p><p className="font-medium">{selectedPaymentSale ? `#${selectedPaymentSale.id_venta}` : 'No disponible'}</p></div>
                  <div><p className="text-sm text-gray-600">Estado de la venta</p><div className="mt-1">{getPaymentStatusBadge(clientDisplayEstadoPagoVenta(selectedPayment.serviceType, selectedPaymentSale?.estado_pago || 'Pendiente'))}</div></div>
                  <div><p className="text-sm text-gray-600">Total de la venta</p><p className="font-medium">{formatCurrency(selectedPaymentSale?.total || selectedPaymentSale?.monto_total)}</p></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => void loadPaymentDetail(selectedPayment)}
                    disabled={isLoadingPaymentDetail}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Actualizar detalle
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Mis abonos</p><p className="text-2xl font-semibold text-green-800">{paymentStats.total}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Aprobados</p><p className="text-2xl font-semibold text-green-800">{paymentStats.approved}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Pendientes</p><p className="text-2xl font-semibold text-amber-700">{paymentStats.pending}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Rechazados</p><p className="text-2xl font-semibold text-red-700">{paymentStats.rejected}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Monto enviado</p><p className="text-xl font-semibold text-green-800">{formatCurrency(paymentStats.totalAmount)}</p></CardContent></Card>
        </div>

        <Card className="border-sky-100 bg-sky-50/60 shadow-sm">
          <CardContent className="py-4 text-sm text-sky-950 space-y-2">
            <p className="font-semibold text-sky-900">Dos formas distintas de pagar</p>
            <ul className="list-disc pl-5 space-y-1.5 text-sky-900/95">
              <li>
                <strong>Salida programada:</strong> pagas en el mismo flujo en el que reservas el cupo y subes el comprobante para
                que OCCITOUR lo valide.
              </li>
              <li>
                <strong>Solicitud personalizada:</strong> primero envías la solicitud; cuando el asesor la revisa,{' '}
                <strong>habilita el pago</strong> y recién ahí subes el comprobante desde el detalle de la solicitud. Ese pago es
                por el <strong>total de la venta</strong> (no hay abonos parciales en rutas).
              </li>
              <li>
                <strong>Fincas:</strong> sí puedes enviar <strong>abonos</strong>; la venta puede mostrarse como “Parcial” hasta cubrir el total.
              </li>
            </ul>
          </CardContent>
        </Card>

        <ClientModuleFiltersCard
          searchValue={paymentsSearchTerm}
          onSearchChange={setPaymentsSearchTerm}
          searchPlaceholder="ID pago, reserva, venta o servicio..."
          onClear={() => {
            setPaymentsSearchTerm('');
            setPaymentsStatusFilter('all');
            setPaymentsFlowFilter('all');
            setPaymentsPage(1);
          }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <div className="mt-1">
                <select
                  value={paymentsStatusFilter}
                  onChange={(e) => setPaymentsStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="Aprobado">Aprobado</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo de pago</label>
              <div className="mt-1">
                <select
                  value={paymentsFlowFilter}
                  onChange={(e) => setPaymentsFlowFilter(e.target.value as typeof paymentsFlowFilter)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="programmed_route">Salida programada</option>
                  <option value="custom_request">Solicitud personalizada</option>
                  <option value="finca">Reserva de finca</option>
                  <option value="generic">Otro</option>
                </select>
              </div>
            </div>
          </div>
        </ClientModuleFiltersCard>

        <Card>
          <CardHeader><CardTitle>Mis abonos</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Pago</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Reserva</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPayments.length > 0 ? (
                  paginatedPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">#{payment.paymentId}</TableCell>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell>#{payment.reservationId}</TableCell>
                      <TableCell>{payment.serviceName}</TableCell>
                      <TableCell className="font-semibold text-green-600">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{getInstallmentStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openPaymentDetail(payment)}>
                          Ver detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-gray-500">
                      {isResolvingClientId
                        ? 'Cargando tu perfil de cliente...'
                        : !clientId
                          ? 'No pudimos vincular tu cuenta de cliente.'
                          : isLoadingPayments
                            ? 'Cargando abonos...'
                            : payments.length > 0
                              ? 'No hay abonos que coincidan con los filtros.'
                              : 'Aún no tienes abonos registrados.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ClientListPagination
              page={paymentsPage}
              totalPages={paymentsTotalPages}
              totalItems={filteredPayments.length}
              perPage={CLIENT_LIST_PER_PAGE}
              onPageChange={setPaymentsPage}
              itemLabel="abono(s)"
            />
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderProgrammings = () => {
    if (programmingView === 'detail' && selectedProgramming) {
      const detail = selectedProgrammingDetail;
      return (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Detalle de mi programación</h3>
              <p className="text-sm text-gray-700">
                <span className="font-medium">{selectedProgramming.routeName}</span>
                <span className="text-gray-500"> · Ref. #{selectedProgramming.programacionId}</span>
              </p>
            </div>
            <Button variant="outline" onClick={() => {
              setSelectedProgramming(null);
              setSelectedProgrammingDetail(null);
              setSelectedProgrammingBooking(null);
              setSelectedProgrammingRoute(null);
              setProgrammingView('list');
            }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a mis programaciones
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Ruta</p><p className="text-lg font-semibold text-green-800">{resolveProgrammingRouteName(detail) || selectedProgramming.routeName}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Fecha</p><p className="text-lg font-semibold text-green-800">{selectedProgramming.date}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Personas</p><p className="text-2xl font-semibold text-green-800">{selectedProgramming.people}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Subtotal</p><p className="text-xl font-semibold text-green-800">{formatCurrency(selectedProgramming.subtotal)}</p></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <Card>
                <CardHeader><CardTitle>Resumen de la salida</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div><p className="text-sm text-gray-600">Nombre de la ruta</p><p className="font-medium">{resolveProgrammingRouteName(detail) || selectedProgramming.routeName}</p></div>
                  <div><p className="text-sm text-gray-600">Referencia interna</p><p className="font-medium text-gray-600 text-sm">Programación #{selectedProgramming.programacionId} · Reserva #{selectedProgramming.reservationId}</p></div>
                  <div><p className="text-sm text-gray-600">Hora de salida</p><p className="font-medium">{formatTimeDisplay(selectedProgramming.startTime, 'Por definir')}</p></div>
                  <div><p className="text-sm text-gray-600">Punto de encuentro</p><p className="font-medium">{detail?.lugar_encuentro || selectedProgramming.meetingPoint}</p></div>
                  <div><p className="text-sm text-gray-600">Dificultad</p><p className="font-medium">{detail?.dificultad ?? selectedProgramming.difficulty}</p></div>
                  <div><p className="text-sm text-gray-600">Estado de la reserva</p><div className="mt-1">{getStatusBadge(selectedProgrammingBooking?.estado || 'Pendiente')}</div></div>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardHeader className="bg-orange-50">
                  <CardTitle className="text-lg text-orange-950">Tu guía asignado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingProgrammingDetail ? (
                    <p className="text-sm text-gray-600">Cargando información del guía…</p>
                  ) : (
                    <>
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">
                          {resolveGuiaPrincipalNombre(detail)}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">{resolveGuiaPrincipalRol(detail)}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                        <div className="rounded-lg border border-orange-100 bg-orange-50/40 p-3">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            Teléfono
                          </p>
                          <p className="font-medium text-gray-900 mt-1">
                            {resolveGuiaPrincipalTelefono(detail) || 'Por confirmar con OCCITOUR'}
                          </p>
                        </div>
                        <div className="rounded-lg border border-orange-100 bg-orange-50/40 p-3">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            Correo
                          </p>
                          <p className="font-medium text-gray-900 mt-1 break-all">
                            {resolveGuiaPrincipalCorreo(detail) || 'Por confirmar con OCCITOUR'}
                          </p>
                        </div>
                      </div>
                      {resolveGuiasApoyoText(detail) !== '—' ? (
                        <div className="rounded-lg border border-orange-100 bg-white p-3 text-sm">
                          <p className="text-xs text-gray-500">Guías de apoyo</p>
                          <p className="font-medium text-gray-900 mt-1">{resolveGuiasApoyoText(detail)}</p>
                        </div>
                      ) : null}
                    </>
                  )}
                </CardContent>
              </Card>

              {isLoadingProgrammingDetail ? (
                <Card>
                  <CardContent className="py-6 text-sm text-gray-600">Cargando recomendaciones de la ruta…</CardContent>
                </Card>
              ) : (
                <Card className="border-teal-200 bg-teal-50/40">
                  <CardHeader>
                    <CardTitle className="text-teal-900">Recomendaciones para tu salida</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {extractRecomendacionesParticipantes(selectedProgrammingRoute) ? (
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {extractRecomendacionesParticipantes(selectedProgrammingRoute)}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600">
                        No hay texto de recomendaciones para esta ruta en el sistema, o el servidor no lo envía en la
                        API. Revisa también la ficha en <strong>Rutas</strong> o escribe a OCCITOUR.
                      </p>
                    )}
                    <p className="text-xs text-teal-900/75 mt-3">
                      Si OCCITOUR actualiza el plan, vuelve a pulsar &quot;Actualizar detalle&quot;.
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle>Reserva relacionada</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div><p className="text-sm text-gray-600">Servicio base</p><p className="font-medium">{selectedProgrammingBooking?.tipo_servicio || resolveProgrammingRouteName(detail)}</p></div>
                  <div><p className="text-sm text-gray-600">Participantes</p><p className="font-medium">{selectedProgrammingBooking?.numero_participantes || selectedProgramming.people}</p></div>
                  <div><p className="text-sm text-gray-600">Monto total</p><p className="font-medium">{formatCurrency(selectedProgrammingBooking?.monto_total || selectedProgramming.subtotal)}</p></div>
                  <div><p className="text-sm text-gray-600">Saldo</p><p className="font-medium">{formatCurrency(selectedProgrammingBooking?.saldo_pendiente)}</p></div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => void loadProgrammingDetail(selectedProgramming)}
                    disabled={isLoadingProgrammingDetail}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Actualizar detalle
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Mis programaciones</p><p className="text-2xl font-semibold text-green-800">{programmingStats.total}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Personas programadas</p><p className="text-2xl font-semibold text-green-800">{programmingStats.totalPeople}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Valor acumulado</p><p className="text-xl font-semibold text-green-800">{formatCurrency(programmingStats.totalValue)}</p></CardContent></Card>
        </div>

        <ClientModuleFiltersCard
          searchValue={programmingSearchTerm}
          onSearchChange={setProgrammingSearchTerm}
          searchPlaceholder="Ruta, ID programación o reserva..."
          onClear={() => {
            setProgrammingSearchTerm('');
            setProgrammingSortFilter('date-asc');
            setProgrammingPage(1);
          }}
        >
          <div>
            <label className="text-sm font-medium text-gray-700">Ordenar por</label>
            <div className="mt-1">
              <select
                value={programmingSortFilter}
                onChange={(e) => setProgrammingSortFilter(e.target.value as ClientProgrammingsSort)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="date-asc">Fecha salida (próximas primero)</option>
                <option value="date-desc">Fecha salida (más lejanas)</option>
                <option value="time-asc">Hora (temprano)</option>
                <option value="time-desc">Hora (tarde)</option>
                <option value="created-desc">Registro (recientes)</option>
                <option value="created-asc">Registro (antiguas)</option>
              </select>
            </div>
          </div>
        </ClientModuleFiltersCard>

        <Card>
          <CardHeader><CardTitle>Mis programaciones</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ruta y referencia</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Personas</TableHead>
                  <TableHead>Punto de encuentro</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProgrammings.length > 0 ? (
                  paginatedProgrammings.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">{item.routeName}</div>
                        <div className="text-xs text-gray-400">#{item.programacionId}</div>
                      </TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{formatTimeDisplay(item.startTime) || '—'}</TableCell>
                      <TableCell>{item.people}</TableCell>
                      <TableCell>{item.meetingPoint}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openProgrammingDetail(item)}>
                          Ver detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-gray-500">
                      {isResolvingClientId
                        ? 'Cargando tu perfil de cliente...'
                        : !clientId
                          ? 'No pudimos vincular tu cuenta de cliente.'
                          : isLoadingProgrammings
                            ? 'Cargando programaciones...'
                            : programmings.length > 0
                              ? 'No hay programaciones que coincidan con los filtros.'
                              : 'Todavía no tienes programaciones activas.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ClientListPagination
              page={programmingPage}
              totalPages={programmingTotalPages}
              totalItems={filteredProgrammings.length}
              perPage={CLIENT_LIST_PER_PAGE}
              onPageChange={setProgrammingPage}
              itemLabel="programación(es)"
            />
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <DashboardSection>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-green-100 text-green-600">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold text-green-800">Bienvenido, {user?.name}</h2>
              <p className="text-sm text-gray-600">Panel del cliente - Occitours</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {activeTab === 'bookings' && renderBookings()}
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'sales' && renderSales()}
          {activeTab === 'payments' && renderPayments()}
          {activeTab === 'programming' && renderProgrammings()}
        </motion.div>
      </DashboardSection>
    </DashboardLayout>
  );
}
