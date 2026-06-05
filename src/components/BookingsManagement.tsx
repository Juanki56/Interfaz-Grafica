import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  CheckCircle,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  MapPin,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Calendar as BookingCalendar } from './ui/calendar';
import {
  programacionAPI,
  reservasAPI,
  clientesAPI,
  rutasAPI,
  fincasAPI,
  pagosAPI,
  type PagoCliente,
} from '../services/api';
import {
  enrichReservaRouteContext,
  resolveRouteIdFromReservaPayload,
  resolveRouteNameFromReservaPayload,
} from '../utils/reservaRouteDisplay';
import {
  resolveReservaProductoNombre,
  resolveReservaServicioEtiqueta,
} from '../utils/reservaProductoDisplay';
import {
  addDays,
  durationDaysFromRutaDetail,
  formatRutaDuracionHoras,
  normalizeOccupiedYmd,
  toYMD,
} from '../utils/routeDateCalendar';
import { staffReservaPaymentStatusForUi } from '../utils/clientPaymentFlow';
import { clienteProgramacionPrecioFila } from '../utils/programacionLinePricing';
import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';
import {
  BookingClientPicker,
  BookingFincaPicker,
  BookingProgramacionPicker,
  BookingRoutePicker,
} from './booking/BookingSearchPickers';
import {
  formatDateDisplay,
  formatDateTimeDisplay,
  formatTimeDisplay,
  toCalendarYmd,
} from '../utils/dateTimeDisplay';
import { ReceiptProofViewerDialog } from './ReceiptProofViewerDialog';
import { normalizeReceiptUrl } from '../utils/receiptProof';

type StaffView = 'list' | 'create' | 'edit' | 'detail';

type BookingRecord = {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientDocument: string;
  packageName: string;
  productName: string;
  serviceTypeLabel: string;
  serviceTypeForm: 'ruta' | 'finca';
  date: string;
  bookingDateRaw: string;
  createdAtLabel: string;
  createdAtMs: number;
  participants: number;
  adults: number;
  children: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  paidAmount: number;
  pendingAmount: number;
  specialRequests: string;
  cancellationReason?: string;
};

type BookingSortField = 'created' | 'bookingDate' | 'id' | 'client' | 'total' | 'status';
type SortDirection = 'asc' | 'desc';

const toYmdOnly = (value?: string | null): string => toCalendarYmd(value);

const parseBookingTimestamp = (
  fechaCreacion?: string | null,
  fechaReserva?: string | null,
  idReserva?: number | string | null,
): number => {
  for (const candidate of [fechaCreacion, fechaReserva]) {
    if (!candidate) continue;
    const raw = String(candidate).trim();
    const parsed = Date.parse(raw.includes('T') ? raw : `${raw.slice(0, 10)}T12:00:00`);
    if (Number.isFinite(parsed)) return parsed;
  }
  const idNum = Number(idReserva);
  return Number.isFinite(idNum) && idNum > 0 ? idNum : 0;
};

const matchesBookingDateRange = (ymd: string, from: string, to: string): boolean => {
  if (!from && !to) return true;
  if (!ymd) return false;
  if (from && ymd < from) return false;
  if (to && ymd > to) return false;
  return true;
};

const matchesServiceTypeFilter = (booking: BookingRecord, filter: string): boolean => {
  if (filter === 'all') return true;
  const label = booking.serviceTypeLabel.toLowerCase();
  if (filter === 'ruta') return label.includes('ruta') || booking.serviceTypeForm === 'ruta';
  if (filter === 'finca') return label.includes('finca') || booking.serviceTypeForm === 'finca';
  if (filter === 'servicio') return label.includes('servicio');
  if (filter === 'reserva') {
    return (
      label === 'reserva' ||
      (!label.includes('ruta') && !label.includes('finca') && !label.includes('servicio'))
    );
  }
  return true;
};

const compareBookings = (
  a: BookingRecord,
  b: BookingRecord,
  field: BookingSortField,
  direction: SortDirection,
): number => {
  let cmp = 0;
  switch (field) {
    case 'id':
      cmp = Number(a.id) - Number(b.id);
      break;
    case 'client':
      cmp = a.clientName.localeCompare(b.clientName, 'es', { sensitivity: 'base' });
      break;
    case 'bookingDate':
      cmp = a.bookingDateRaw.localeCompare(b.bookingDateRaw, 'es');
      break;
    case 'total':
      cmp = a.total - b.total;
      break;
    case 'status':
      cmp = a.status.localeCompare(b.status, 'es', { sensitivity: 'base' });
      break;
    case 'created':
    default:
      cmp = a.createdAtMs - b.createdAtMs;
      break;
  }
  return direction === 'asc' ? cmp : -cmp;
};

const STAFF_CANCEL_MOTIVO_MIN = 10;

type ClientSummary = {
  id: string;
  name: string;
  document: string;
  email?: string;
  phone?: string;
};

type ServiceOption = {
  id: string;
  name: string;
  price?: number;
};

type CompanionDraft = {
  nombre: string;
  apellido: string;
  tipo_documento: string;
  numero_documento: string;
  telefono: string;
  fecha_nacimiento: string;
};

type ProgramacionOption = {
  id: string;
  routeId: string;
  routeName: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingPoint: string;
  availableSeats: number;
  totalSeats: number;
  price: number;
  status: string;
};

const normalizeReservationStatus = (status?: string | null) => {
  const normalized = String(status || '').trim();
  return ['Pendiente', 'Confirmada', 'Cancelada', 'Completada'].includes(normalized)
    ? normalized
    : 'Pendiente';
};

const normalizePaymentStatus = (status?: string | null) => {
  const normalized = String(status || '').trim();
  return ['Pendiente', 'Parcial', 'Pagado', 'Cancelado'].includes(normalized)
    ? normalized
    : 'Pendiente';
};

const canReservationBeConfirmed = (paymentStatus?: string | null) =>
  ['Parcial', 'Pagado'].includes(normalizePaymentStatus(paymentStatus));

const formatCurrency = (value?: number | string | null) =>
  `${Number(value || 0).toLocaleString('es-CO')}`;

const bookingClientContactLine = (booking: {
  clientEmail?: string;
  clientPhone?: string;
  clientDocument?: string;
}) => {
  const email = String(booking.clientEmail || '').trim();
  if (email) return email;
  const phone = String(booking.clientPhone || '').trim();
  if (phone) return phone;
  const doc = String(booking.clientDocument || '').trim();
  if (doc) return doc;
  return 'Sin datos de contacto';
};

const formatDate = (value?: string | null) => formatDateDisplay(value);

const formatDateTime = (date?: string | null, time?: string | null) =>
  formatDateTimeDisplay(date, time);

function mergePagosReservaDedupe(pagosLists: PagoCliente[][]): PagoCliente[] {
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

function pagoComprobanteRaw(p: PagoCliente): string {
  return String(
    p.comprobante_url ||
      (p as { url_comprobante?: string | null }).url_comprobante ||
      (p as { comprobante?: string | null }).comprobante ||
      ''
  ).trim();
}

function pagoComprobanteUrl(p: PagoCliente): string | null {
  return normalizeReceiptUrl(pagoComprobanteRaw(p));
}

function pagoTieneComprobante(p: PagoCliente): boolean {
  return Boolean(pagoComprobanteUrl(p));
}

const fincaDetalleLabel = (item: any) =>
  item?.finca_nombre ||
  item?.nombre_finca ||
  item?.nombre ||
  (item?.id_finca != null ? `Finca #${item.id_finca}` : 'Finca');

const rutaProgramacionLabel = (item: any) =>
  item?.ruta_nombre || item?.nombre_ruta || (item?.id_ruta ? `Ruta #${item.id_ruta}` : 'Ruta programada');




const getStatusBadge = (status: string) => {
  const normalized = normalizeReservationStatus(status);
  const classes: Record<string, string> = {
    Confirmada: 'bg-green-600 text-white',
    Pendiente: 'bg-amber-500 text-white',
    Cancelada: 'bg-red-600 text-white',
    Completada: 'bg-blue-600 text-white',
  };

  return (
    <Badge className={classes[normalized] || 'bg-slate-500 text-white'}>
      {normalized}
    </Badge>
  );
};

const getPaymentStatusBadge = (status: string) => {
  const normalized = normalizePaymentStatus(status);
  const classes: Record<string, string> = {
    Pagado: 'bg-green-600 text-white',
    Parcial: 'bg-blue-600 text-white',
    Pendiente: 'bg-amber-500 text-white',
    Cancelado: 'bg-red-600 text-white',
  };

  return (
    <Badge className={classes[normalized] || 'bg-slate-500 text-white'}>
      {normalized}
    </Badge>
  );
};

const EMPTY_FORM = {
  clientId: '',
  clientName: '',
  bookingDate: '',
  routeId: '',
  farmId: '',
  serviceType: 'ruta' as 'ruta' | 'finca',
  /** programada = salida del calendario con cupos; taquilla_personalizada = fecha en mostrador, crea programación al guardar */
  rutaReservaModo: 'programada' as 'programada' | 'taquilla_personalizada',
  programacionId: '',
  companions: 0,
  total: 0,
  status: 'Pendiente',
  specialRequests: '',
  cancellationReason: '',
  checkIn: '',
  checkOut: '',
  nights: 1,
  nightlyPrice: 0,
  personalizadaFechaSalida: '',
  personalizadaFechaRegreso: '',
  personalizadaHoraSalida: '',
  personalizadaHoraRegreso: '',
  personalizadaLugarEncuentro: '',
  personalizadaCuposSalida: '',
};

export function BookingsManagement() {
  const permisos = usePermissions();
  const reservasPerms = createModulePermissions(permisos, 'Reservas');
  const clientesPerms = createModulePermissions(permisos, 'Clientes');
  const canViewReservas = reservasPerms.canView();
  const canCreateReservas = reservasPerms.canCreate();
  const canEditReservas = reservasPerms.canEdit();
  const canDeleteReservas = reservasPerms.canDelete();
  const canViewClientes = clientesPerms.canView();

  const [activeView, setActiveView] = useState<StaffView>('list');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [clientes, setClientes] = useState<ClientSummary[]>([]);
  const [rutas, setRutas] = useState<ServiceOption[]>([]);
  const [fincas, setFincas] = useState<ServiceOption[]>([]);
  const [programacionesRuta, setProgramacionesRuta] = useState<ProgramacionOption[]>([]);
  const [taquillaOccupiedDates, setTaquillaOccupiedDates] = useState<Set<string>>(new Set());
  const [isLoadingTaquillaCalendar, setIsLoadingTaquillaCalendar] = useState(false);
  const [taquillaAvailabilityWarning, setTaquillaAvailabilityWarning] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<BookingSortField>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRouteDetail, setIsLoadingRouteDetail] = useState(false);
  const [isLoadingProgramacionesRuta, setIsLoadingProgramacionesRuta] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingReservaPagos, setIsLoadingReservaPagos] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteCancelMotivo, setDeleteCancelMotivo] = useState('');
  const [staffCancelDialogOpen, setStaffCancelDialogOpen] = useState(false);
  const [staffCancelMotivo, setStaffCancelMotivo] = useState('');
  const [isCancellingStaffReserva, setIsCancellingStaffReserva] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [reservaDetalle, setReservaDetalle] = useState<any>(null);
  const [reservaDetallePagos, setReservaDetallePagos] = useState<PagoCliente[]>([]);
  const [reservaComprobanteDialogOpen, setReservaComprobanteDialogOpen] = useState(false);
  const [reservaComprobanteViewer, setReservaComprobanteViewer] = useState<{
    open: boolean;
    url: string | null;
    fileName?: string | null;
    mimeType?: string | null;
  }>({ open: false, url: null });
  const [detalleRuta, setDetalleRuta] = useState<any>(null);
  const [detalleProgramacionId, setDetalleProgramacionId] = useState('');
  const [detalleOpcionalesSeleccion, setDetalleOpcionalesSeleccion] = useState<Record<number, number>>({});

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formRutaDetalle, setFormRutaDetalle] = useState<any>(null);
  const [formRutaOpcionalesSeleccion, setFormRutaOpcionalesSeleccion] = useState<Record<number, number>>({});
  const [companionDetails, setCompanionDetails] = useState<CompanionDraft[]>([]);

  const participantTotal = Math.max(
    1,
    1 + Number(formData.companions || 0)
  );

  const selectedClient = useMemo(
    () => clientes.find((cliente) => cliente.id === formData.clientId) || null,
    [clientes, formData.clientId]
  );

  /** Salidas que aún admiten reserva manual (no canceladas ni ya completadas). */
  const programacionesReservables = useMemo(() => {
    return programacionesRuta.filter((programacion) => {
      const s = String(programacion.status || '').toLowerCase();
      if (s.includes('cancel')) return false;
      if (s.includes('complet')) return false;
      return true;
    });
  }, [programacionesRuta]);

  const routeIdsConSalidaActiva = useMemo(() => {
    const ids = new Set<string>();
    for (const p of programacionesReservables) {
      ids.add(p.routeId);
    }
    return ids;
  }, [programacionesReservables]);

  const rutasConSalidaProgramada = useMemo(
    () => rutas.filter((r) => routeIdsConSalidaActiva.has(r.id)),
    [rutas, routeIdsConSalidaActiva]
  );

  const routesForCurrentModo = useMemo(() => {
    if (formData.serviceType !== 'ruta') return [];
    if (formData.rutaReservaModo === 'taquilla_personalizada') return rutas;
    return rutasConSalidaProgramada;
  }, [formData.serviceType, formData.rutaReservaModo, rutas, rutasConSalidaProgramada]);

  const filteredProgramacionesRuta = useMemo(() => {
    if (formData.serviceType !== 'ruta' || !formData.routeId) return [];
    return programacionesReservables.filter((programacion) => programacion.routeId === formData.routeId);
  }, [programacionesReservables, formData.serviceType, formData.routeId]);

  const selectedProgramacion = useMemo(
    () => filteredProgramacionesRuta.find((item) => item.id === formData.programacionId) || null,
    [filteredProgramacionesRuta, formData.programacionId]
  );

  const taquillaDurationDays = useMemo(
    () => durationDaysFromRutaDetail(formRutaDetalle?.duracion_dias),
    [formRutaDetalle?.duracion_dias]
  );

  const taquillaCalendarModifiers = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return {
      past: (date: Date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d < startOfToday;
      },
      reserved: (date: Date) => taquillaOccupiedDates.has(toYMD(date)),
    };
  }, [taquillaOccupiedDates]);

  const taquillaCalendarClassNames = useMemo(
    () => ({
      past: 'rdp-day-past bg-slate-100 text-slate-400 line-through decoration-slate-400/90 opacity-65',
      reserved:
        'rdp-day-reserved bg-gray-200 text-gray-600 line-through decoration-gray-500 shadow-inner opacity-95 border border-gray-400/50',
    }),
    []
  );

  const isTaquillaStartDateDisabled = (date: Date) => {
    const base = new Date(date);
    base.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (base < today) return true;
    for (let i = 0; i < taquillaDurationDays; i += 1) {
      if (taquillaOccupiedDates.has(toYMD(addDays(base, i)))) return true;
    }
    return false;
  };

  const taquillaSelectedCalendarDate = formData.personalizadaFechaSalida
    ? new Date(`${formData.personalizadaFechaSalida}T00:00:00`)
    : undefined;

  const formatTaquillaSelectedDate = (date: Date | undefined) => {
    if (!date) return 'Selecciona una fecha';
    return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' });
  };

  const formOptionalServicesTotal = useMemo(() => {
    if (!formRutaDetalle) return 0;
    return Object.entries(formRutaOpcionalesSeleccion).reduce((sum, [rawId, cantidadRaw]) => {
      const idServicio = Number(rawId);
      const cantidad = Number(cantidadRaw || 0);
      if (!Number.isFinite(idServicio) || idServicio <= 0 || cantidad <= 0) return sum;
      const optional = Array.isArray(formRutaDetalle?.servicios_opcionales)
        ? formRutaDetalle.servicios_opcionales.find((item: any) => Number(item?.id_servicio) === idServicio)
        : null;
      const precio = Number(optional?.servicio?.precio ?? optional?.precio_unitario ?? optional?.precio ?? 0);
      return sum + Math.max(0, precio) * cantidad;
    }, 0);
  }, [formRutaDetalle, formRutaOpcionalesSeleccion]);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setFormRutaDetalle(null);
    setFormRutaOpcionalesSeleccion({});
    setCompanionDetails([]);
  };

  const resolveProgramacionIdFromReservaDetalle = (payload: any): number | null => {
    const candidates = [
      payload?.id_programacion,
      payload?.programacion?.id_programacion,
      payload?.programaciones?.[0]?.id_programacion,
      payload?.detalle_programacion?.id_programacion,
    ];
    for (const candidate of candidates) {
      const value = Number(candidate);
      if (Number.isFinite(value) && value > 0) return value;
    }
    return null;
  };

  const obtenerIdReservaDesdeRespuesta = (payload: any): number | null => {
    const candidates = [
      payload?.id_reserva,
      payload?.id,
      payload?.data?.id_reserva,
      payload?.data?.id,
      payload?.reserva?.id_reserva,
      payload?.reserva?.id,
    ];
    for (const candidate of candidates) {
      const value = Number(candidate);
      if (Number.isFinite(value) && value > 0) return value;
    }
    return null;
  };

  const loadReservas = async (): Promise<BookingRecord[]> => {
    try {
      setIsLoading(true);
      const data = await reservasAPI.getAll();
      const reservasMapeadas: BookingRecord[] = data.map((r: any) => {
        const tipoServicio = String(r.tipo_servicio || 'Reserva');
        const serviceTypeForm = tipoServicio.toLowerCase().includes('finca') ? 'finca' : 'ruta';
        const total = Number(r.total ?? r.monto_total ?? 0);
        const idReserva = r.id_reserva ?? r.id;
        const bookingDateRaw = toYmdOnly(r.fecha_reserva);
        const createdAtMs = parseBookingTimestamp(r.fecha_creacion, r.fecha_reserva, idReserva);
        const createdAtLabel = formatDateDisplay(r.fecha_creacion || r.fecha_reserva, {
          style: 'numeric',
        });
        return {
          id: String(idReserva ?? ''),
          clientId: String(r.id_cliente ?? ''),
          clientName: `${r.cliente_nombre || ''} ${r.cliente_apellido || ''}`.trim() || 'Cliente',
          clientEmail: String(r.cliente_email || r.correo || '').trim(),
          clientPhone: r.cliente_telefono || r.telefono || '',
          clientDocument: [r.tipo_documento, r.numero_documento].filter(Boolean).join(' ').trim(),
          packageName: tipoServicio,
          productName: resolveReservaProductoNombre(r) || resolveReservaServicioEtiqueta(r),
          serviceTypeLabel: tipoServicio,
          serviceTypeForm,
          date: bookingDateRaw,
          bookingDateRaw,
          createdAtLabel,
          createdAtMs,
          participants: Number(r.numero_participantes ?? 1),
          adults: 1,
          children: Math.max(0, Number(r.numero_participantes ?? 1) - 1),
          status: normalizeReservationStatus(r.estado),
          paymentStatus: staffReservaPaymentStatusForUi({
            tipoServicio: tipoServicio,
            estadoPago: r.estado_pago,
            estadoReserva: r.estado,
            saldoPendiente: r.saldo_pendiente,
            montoPagado: r.monto_pagado,
            montoTotal: total,
          }),
          paymentMethod: r.metodo_pago || 'Por definir',
          total,
          paidAmount: Number(r.monto_pagado ?? 0),
          pendingAmount: Number(r.saldo_pendiente ?? total),
          specialRequests: r.notas || '',
          cancellationReason: r.motivo_cancelacion || '',
        };
      });
      reservasMapeadas.sort((a, b) => compareBookings(a, b, 'created', 'desc'));
      setBookings(reservasMapeadas);
      return reservasMapeadas;
    } catch (error) {
      console.error('Error al cargar reservas:', error);
      toast.error('No se pudieron cargar las reservas.');
      setBookings([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const loadClientes = async () => {
    try {
      const data = await clientesAPI.getAll();
      setClientes(
        data.map((cliente: any) => ({
          id: String(cliente.id_cliente ?? ''),
          name: `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim(),
          document: cliente.numero_documento || '',
          email: cliente.correo || '',
          phone: cliente.telefono || '',
        }))
      );
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const loadRutas = async () => {
    try {
      const data = await rutasAPI.getAll();
      setRutas(
        (data || []).map((ruta: any) => ({
          id: String(ruta.id_ruta),
          name: ruta.nombre,
          price: Number(ruta.precio || ruta.precio_base || 0),
        }))
      );
    } catch (error) {
      console.error('Error al cargar rutas:', error);
    }
  };

  const loadFincas = async () => {
    try {
      const data = await fincasAPI.getActivas();
      setFincas(
        (data || []).map((finca: any) => ({
          id: String(finca.id_finca),
          name: finca.nombre,
          price: Number(finca.precio_por_noche || 0),
        }))
      );
    } catch (error) {
      console.error('Error al cargar fincas:', error);
    }
  };

  const loadProgramacionesRuta = async () => {
    try {
      setIsLoadingProgramacionesRuta(true);
      let raw: any[] = [];
      try {
        raw = await programacionAPI.getPublicas();
      } catch {
        raw = [];
      }
      if (!raw.length) {
        try {
          const all = await programacionAPI.getAll();
          const today = new Date().toISOString().slice(0, 10);
          raw = (all || []).filter((p: any) => {
            if (p?.es_personalizada) return false;
            const est = String(p?.estado || '').toLowerCase();
            if (est.includes('cancel')) return false;
            if (est.includes('complet')) return false;
            const fr = String(p?.fecha_regreso ?? p?.fecha_salida ?? '').slice(0, 10);
            if (fr && fr < today) return false;
            return Math.max(0, Number(p?.cupos_disponibles ?? 0)) > 0;
          });
        } catch {
          raw = [];
        }
      }

      const mapped = (raw || [])
        .filter((programacion: any) => !programacion?.es_personalizada)
        .map((programacion: any) => ({
          id: String(programacion.id_programacion),
          routeId: String(programacion.id_ruta),
          routeName: programacion.ruta_nombre || `Ruta ${programacion.id_ruta}`,
          date: formatDate(programacion.fecha_salida),
          startTime: String(programacion.hora_salida || '').slice(0, 5),
          endTime: String(programacion.hora_regreso || '').slice(0, 5),
          meetingPoint: programacion.lugar_encuentro || 'Por confirmar',
          availableSeats: Math.max(0, Number(programacion.cupos_disponibles ?? 0)),
          totalSeats: Math.max(0, Number(programacion.cupos_totales ?? 0)),
          price: Math.max(0, Number(programacion.precio_programacion ?? 0)),
          status: String(programacion.estado || 'Programado'),
        }))
        .filter((programacion) => !String(programacion.status).toLowerCase().includes('cancel'));
      setProgramacionesRuta(mapped);
    } catch (error) {
      console.error('Error al cargar programaciones para reservas manuales:', error);
      setProgramacionesRuta([]);
    } finally {
      setIsLoadingProgramacionesRuta(false);
    }
  };

  const loadRouteDetailForForm = async (routeId: number) => {
    try {
      setIsLoadingRouteDetail(true);
      const ruta = await rutasAPI.getById(routeId);
      setFormRutaDetalle(ruta);
      setFormRutaOpcionalesSeleccion((prev) => {
        const next: Record<number, number> = {};
        const opcionales = Array.isArray(ruta?.servicios_opcionales) ? ruta.servicios_opcionales : [];
        for (const so of opcionales) {
          const idServicio = Number(so?.id_servicio);
          if (!Number.isFinite(idServicio) || idServicio <= 0) continue;
          next[idServicio] = prev[idServicio] ?? 0;
        }
        return next;
      });
    } catch (error) {
      console.error('Error al cargar la ruta:', error);
      setFormRutaDetalle(null);
      setFormRutaOpcionalesSeleccion({});
    } finally {
      setIsLoadingRouteDetail(false);
    }
  };

  const loadReservaDetail = async (idReserva: number) => {
    setIsLoadingDetail(true);
    setIsLoadingReservaPagos(true);
    let detalle: any = null;
    let rutaDetalleLoaded: any = null;

    try {
      const [detalleReserva, pagosReserva] = await Promise.all([
        reservasAPI.getById(idReserva),
        pagosAPI.getByReserva(idReserva).catch(() => [] as PagoCliente[]),
      ]);
      detalle = detalleReserva;

      const idVenta = Number(
        detalle?.id_venta ?? detalle?.venta?.id_venta ?? detalle?.idVenta ?? 0,
      );
      const pagosVenta =
        idVenta > 0
          ? await pagosAPI.getByVenta(idVenta).catch(() => [] as PagoCliente[])
          : ([] as PagoCliente[]);

      setReservaDetallePagos(mergePagosReservaDedupe([pagosReserva, pagosVenta]));

      const enriched = await enrichReservaRouteContext(detalle);
      detalle = enriched.detalleEnriched;
      rutaDetalleLoaded = enriched.rutaDetalle;
      setReservaDetalle(detalle);
      setDetalleRuta(rutaDetalleLoaded);

      setSelectedBooking((prev) => {
        if (!prev || String(prev.id) !== String(idReserva)) return prev;
        const tipoServicio = String(detalle?.tipo_servicio || prev.packageName);
        const total = Number(detalle?.total ?? detalle?.monto_total ?? prev.total);
        return {
          ...prev,
          packageName: tipoServicio,
          productName:
            resolveReservaProductoNombre(detalle) || resolveReservaServicioEtiqueta(detalle) || prev.productName,
          serviceTypeLabel: tipoServicio,
          status: normalizeReservationStatus(detalle?.estado ?? prev.status),
          paymentStatus: staffReservaPaymentStatusForUi({
            tipoServicio,
            estadoPago: detalle?.estado_pago,
            estadoReserva: detalle?.estado,
            saldoPendiente: detalle?.saldo_pendiente,
            montoPagado: detalle?.monto_pagado,
            montoTotal: total,
          }),
          paymentMethod: detalle?.metodo_pago || prev.paymentMethod,
          total,
          paidAmount: Number(detalle?.monto_pagado ?? prev.paidAmount),
          pendingAmount: Number(detalle?.saldo_pendiente ?? prev.pendingAmount),
          specialRequests: detalle?.notas || prev.specialRequests,
          cancellationReason: detalle?.motivo_cancelacion || prev.cancellationReason,
        };
      });

      const idProgramacion = resolveProgramacionIdFromReservaDetalle(detalle);
      setDetalleProgramacionId(idProgramacion ? String(idProgramacion) : '');
    } catch (error) {
      console.error('Error al cargar detalle de reserva:', error);
      toast.error('No se pudo cargar el detalle completo de la reserva.');
      setReservaDetalle(null);
      setReservaDetallePagos([]);
      setDetalleRuta(null);
      setDetalleOpcionalesSeleccion({});
      detalle = null;
    } finally {
      setIsLoadingReservaPagos(false);
      setIsLoadingDetail(false);
    }

    const ruta = rutaDetalleLoaded;
    if (!ruta) {
      setDetalleOpcionalesSeleccion({});
      return;
    }

    setDetalleOpcionalesSeleccion((prev) => {
      const next: Record<number, number> = {};
      const opcionales = Array.isArray(ruta?.servicios_opcionales) ? ruta.servicios_opcionales : [];
      for (const so of opcionales) {
        const idServicio = Number(so?.id_servicio);
        if (!Number.isFinite(idServicio) || idServicio <= 0) continue;
        next[idServicio] = prev[idServicio] ?? 0;
      }
      return next;
    });
  };

  useEffect(() => {
    if (permisos.loadingRoles) return;
    if (!canViewReservas) {
      setBookings([]);
      return;
    }

    void loadReservas();
    void loadRutas();
    void loadFincas();
    void loadProgramacionesRuta();
    if (canViewClientes) {
      void loadClientes();
    }
  }, [permisos.loadingRoles, canViewReservas, canViewClientes]);

  useEffect(() => {
    if (formData.serviceType !== 'ruta' || Number(formData.routeId) <= 0) {
      setFormRutaDetalle(null);
      setFormRutaOpcionalesSeleccion({});
      return;
    }
    void loadRouteDetailForForm(Number(formData.routeId));
  }, [formData.serviceType, formData.routeId]);

  useEffect(() => {
    if (formData.serviceType !== 'ruta' || formData.rutaReservaModo !== 'taquilla_personalizada') {
      setTaquillaOccupiedDates(new Set());
      setTaquillaAvailabilityWarning(false);
      return;
    }
    const idRuta = Number(formData.routeId);
    if (!Number.isFinite(idRuta) || idRuta <= 0) {
      setTaquillaOccupiedDates(new Set());
      return;
    }
    let cancelled = false;
    setIsLoadingTaquillaCalendar(true);
    setTaquillaAvailabilityWarning(false);
    programacionAPI
      .getFechasOcupadasRuta(idRuta)
      .then((dates) => {
        if (cancelled) return;
        setTaquillaOccupiedDates(
          new Set((dates || []).map((d) => normalizeOccupiedYmd(String(d))).filter(Boolean))
        );
      })
      .catch(() => {
        if (cancelled) return;
        setTaquillaOccupiedDates(new Set());
        setTaquillaAvailabilityWarning(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTaquillaCalendar(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formData.serviceType, formData.rutaReservaModo, formData.routeId]);

  useEffect(() => {
    if (formData.serviceType !== 'ruta' || formData.rutaReservaModo !== 'taquilla_personalizada') {
      setTaquillaOccupiedDates(new Set());
      setTaquillaAvailabilityWarning(false);
      return;
    }
    const idRuta = Number(formData.routeId);
    if (!Number.isFinite(idRuta) || idRuta <= 0) {
      setTaquillaOccupiedDates(new Set());
      return;
    }
    let cancelled = false;
    setIsLoadingTaquillaCalendar(true);
    setTaquillaAvailabilityWarning(false);
    programacionAPI
      .getFechasOcupadasRuta(idRuta)
      .then((dates) => {
        if (cancelled) return;
        setTaquillaOccupiedDates(
          new Set((dates || []).map((d) => normalizeOccupiedYmd(String(d))).filter(Boolean))
        );
      })
      .catch(() => {
        if (cancelled) return;
        setTaquillaOccupiedDates(new Set());
        setTaquillaAvailabilityWarning(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTaquillaCalendar(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formData.serviceType, formData.rutaReservaModo, formData.routeId]);

  useEffect(() => {
    if (activeView !== 'detail' && activeView !== 'edit') return;
    const idReserva = Number(selectedBooking?.id);
    if (!Number.isFinite(idReserva) || idReserva <= 0) return;
    void loadReservaDetail(idReserva);
  }, [activeView, selectedBooking?.id]);

  useEffect(() => {
    if (formData.serviceType !== 'ruta') return;
    if (!formData.routeId) return;
    const ok = rutasConSalidaProgramada.some((r) => r.id === formData.routeId);
    if (ok) return;
    setFormData((prev) => ({ ...prev, routeId: '', programacionId: '' }));
    setFormRutaDetalle(null);
    setFormRutaOpcionalesSeleccion({});
  }, [formData.serviceType, formData.routeId, rutasConSalidaProgramada]);

  useEffect(() => {
    if (formData.serviceType !== 'finca') return;
    const finca = fincas.find((item) => item.id === formData.farmId);
    if (finca && Number(finca.price || 0) > 0 && Number(formData.nightlyPrice || 0) <= 0) {
      setFormData((prev) => ({
        ...prev,
        nightlyPrice: Number(finca.price || 0),
      }));
    }
  }, [fincas, formData.serviceType, formData.farmId, formData.nightlyPrice]);

  useEffect(() => {
    const companionCount = Math.max(0, participantTotal - 1);
    setCompanionDetails((prev) =>
      Array.from({ length: companionCount }, (_, index) => (
        prev[index] || {
          nombre: '',
          apellido: '',
          tipo_documento: 'CC',
          numero_documento: '',
          telefono: '',
          fecha_nacimiento: '',
        }
      ))
    );
  }, [participantTotal]);

  useEffect(() => {
    if (formData.serviceType !== 'ruta') return;
    const opc = formOptionalServicesTotal;
    if (formData.rutaReservaModo === 'programada') {
      const totalCalculado =
        Math.max(0, Number(selectedProgramacion?.price || 0)) * participantTotal + opc;
      if (Number(formData.total || 0) === totalCalculado) return;
      setFormData((prev) => ({ ...prev, total: totalCalculado }));
      return;
    }
    const unit = Number(formRutaDetalle?.precio_base ?? 0);
    if (unit <= 0) return;
    const totalCalculado = unit * participantTotal + opc;
    if (Number(formData.total || 0) === totalCalculado) return;
    setFormData((prev) => ({ ...prev, total: totalCalculado }));
  }, [
    formData.serviceType,
    formData.rutaReservaModo,
    selectedProgramacion?.price,
    participantTotal,
    formOptionalServicesTotal,
    formRutaDetalle?.precio_base,
    formData.total,
  ]);

  useEffect(() => {
    if (formData.serviceType !== 'ruta') return;
    if (!formData.programacionId) return;
    const stillValid = filteredProgramacionesRuta.some((programacion) => programacion.id === formData.programacionId);
    if (stillValid) return;
    setFormData((prev) => ({ ...prev, programacionId: '' }));
  }, [filteredProgramacionesRuta, formData.serviceType, formData.programacionId]);

  useEffect(() => {
    if (formData.serviceType !== 'ruta') return;
    if (!formData.routeId) return;
    const ok = routesForCurrentModo.some((r) => r.id === formData.routeId);
    if (ok) return;
    setFormData((prev) => ({ ...prev, routeId: '', programacionId: '' }));
    setFormRutaDetalle(null);
    setFormRutaOpcionalesSeleccion({});
  }, [formData.serviceType, formData.routeId, routesForCurrentModo]);

  useEffect(() => {
    if (formData.serviceType !== 'ruta' || formData.rutaReservaModo !== 'taquilla_personalizada') return;
    const d = formData.personalizadaFechaSalida?.trim();
    if (!d) return;
    setFormData((prev) => (prev.bookingDate === d ? prev : { ...prev, bookingDate: d }));
  }, [formData.serviceType, formData.rutaReservaModo, formData.personalizadaFechaSalida]);

  useEffect(() => {
    if (formData.serviceType !== 'finca') return;
    if (!formData.checkIn || !formData.checkOut) return;
    const start = new Date(formData.checkIn);
    const end = new Date(formData.checkOut);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (nights > 0 && nights !== formData.nights) {
      setFormData((prev) => ({
        ...prev,
        nights,
        total: Number(prev.nightlyPrice || 0) * nights,
      }));
    }
  }, [formData.serviceType, formData.checkIn, formData.checkOut, formData.nights]);

  const filteredBookings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesSearch =
        !query ||
        booking.clientName.toLowerCase().includes(query) ||
        booking.packageName.toLowerCase().includes(query) ||
        booking.productName.toLowerCase().includes(query) ||
        booking.serviceTypeLabel.toLowerCase().includes(query) ||
        booking.id.toLowerCase().includes(query) ||
        booking.clientPhone.toLowerCase().includes(query) ||
        booking.clientEmail.toLowerCase().includes(query) ||
        booking.paymentStatus.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      const matchesPayment =
        paymentFilter === 'all' ||
        normalizePaymentStatus(booking.paymentStatus) === paymentFilter;
      const matchesService = matchesServiceTypeFilter(booking, serviceTypeFilter);
      const matchesDate = matchesBookingDateRange(booking.bookingDateRaw, dateFrom, dateTo);
      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment &&
        matchesService &&
        matchesDate
      );
    });
  }, [
    bookings,
    searchTerm,
    statusFilter,
    paymentFilter,
    serviceTypeFilter,
    dateFrom,
    dateTo,
  ]);

  const sortedBookings = useMemo(() => {
    const list = [...filteredBookings];
    list.sort((a, b) => compareBookings(a, b, sortField, sortDirection));
    return list;
  }, [filteredBookings, sortField, sortDirection]);

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    statusFilter !== 'all' ||
    paymentFilter !== 'all' ||
    serviceTypeFilter !== 'all' ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    sortField !== 'created' ||
    sortDirection !== 'desc';

  const clearBookingFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setServiceTypeFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortField('created');
    setSortDirection('desc');
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(sortedBookings.length / itemsPerPage));
  const paginatedBookings = sortedBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, serviceTypeFilter, dateFrom, dateTo, sortField, sortDirection]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const dashboardStats = useMemo(() => {
    return {
      total: bookings.length,
      confirmed: bookings.filter((booking) => booking.status === 'Confirmada').length,
      pending: bookings.filter((booking) => booking.status === 'Pendiente').length,
      totalAmount: bookings.reduce((sum, booking) => sum + booking.total, 0),
      pendingAmount: bookings.reduce((sum, booking) => sum + booking.pendingAmount, 0),
    };
  }, [bookings]);

  const reservaPagosConComprobante = useMemo(() => {
    const list = reservaDetallePagos.filter(pagoTieneComprobante);
    const ts = (p: PagoCliente) => {
      const t = Date.parse(String((p.fecha_pago ?? p.fecha_verificacion ?? '').toString()).trim());
      return Number.isFinite(t) ? t : 0;
    };
    return [...list].sort((a, b) => ts(b) - ts(a));
  }, [reservaDetallePagos]);

  const abrirVisorComprobantePago = (pago: PagoCliente) => {
    const url = pagoComprobanteUrl(pago);
    if (!url) {
      toast.error('Este abono no tiene comprobante adjunto.');
      return;
    }
    setReservaComprobanteViewer({
      open: true,
      url,
      fileName: pago.comprobante_nombre,
      mimeType: pago.comprobante_tipo,
    });
  };

  const abrirComprobantesReserva = () => {
    if (isLoadingReservaPagos) {
      toast.info('Cargando comprobantes…');
      return;
    }
    if (reservaPagosConComprobante.length === 0) {
      toast.error('No hay comprobante registrado para esta reserva.');
      return;
    }
    if (reservaPagosConComprobante.length === 1) {
      abrirVisorComprobantePago(reservaPagosConComprobante[0]);
      return;
    }
    setReservaComprobanteDialogOpen(true);
  };

  const goBackToList = () => {
    setActiveView('list');
    setSelectedBooking(null);
    setReservaDetalle(null);
    setReservaDetallePagos([]);
    setReservaComprobanteDialogOpen(false);
    setReservaComprobanteViewer({ open: false, url: null });
    setStaffCancelDialogOpen(false);
    setStaffCancelMotivo('');
    setDetalleRuta(null);
    setDetalleProgramacionId('');
    setDetalleOpcionalesSeleccion({});
    resetForm();
  };

  const openCreateView = () => {
    resetForm();
    setSelectedBooking(null);
    setActiveView('create');
  };

  const openDetailView = (booking: BookingRecord) => {
    setSelectedBooking(booking);
    setActiveView('detail');
  };

  const openEditView = (booking: BookingRecord) => {
    setSelectedBooking(booking);
    setFormData({
      ...EMPTY_FORM,
      clientId: booking.clientId,
      clientName: booking.clientName,
      bookingDate: booking.date,
      serviceType: booking.serviceTypeForm,
      companions: Math.max(0, Number(booking.participants || 1) - 1),
      total: booking.total,
      status: booking.status,
      specialRequests: booking.specialRequests || '',
      cancellationReason:
        booking.cancellationReason ||
        reservaDetalle?.motivo_cancelacion ||
        '',
    });
    setActiveView('edit');
  };

  const ejecutarCancelacionReservaStaff = async (idReserva: number, motivo: string) => {
    await reservasAPI.cancelar(idReserva, motivo, {
      cancelado_por: 'Personal OCCITOUR',
      liberar_programacion: true,
    });
    await reservasAPI.liberarProgramacionesVinculadas(idReserva);
  };

  const confirmarCancelacionStaff = async () => {
    const idReserva = Number(selectedBooking?.id ?? 0);
    if (!idReserva) return;
    const motivo = staffCancelMotivo.trim();
    if (motivo.length < STAFF_CANCEL_MOTIVO_MIN) {
      toast.error(`Indica el motivo de cancelación (mínimo ${STAFF_CANCEL_MOTIVO_MIN} caracteres).`);
      return;
    }
    setIsCancellingStaffReserva(true);
    try {
      await ejecutarCancelacionReservaStaff(idReserva, motivo);
      toast.success('Reserva cancelada. El motivo quedó registrado.');
      setStaffCancelDialogOpen(false);
      setStaffCancelMotivo('');
      const fresh = await loadReservas();
      const row = fresh.find((b) => b.id === String(idReserva));
      if (row) setSelectedBooking(row);
      if (activeView === 'detail') {
        void loadReservaDetail(idReserva);
      }
    } catch (error: any) {
      console.error('Error al cancelar reserva:', error);
      toast.error(error?.message || 'No se pudo cancelar la reserva.');
    } finally {
      setIsCancellingStaffReserva(false);
    }
  };

  const applySelectedServices = async (idReserva: number, map: Record<number, number>, rutaDetalle: any) => {
    const servicios = Object.entries(map)
      .map(([id_servicio, cantidad]) => {
        const optional = Array.isArray(rutaDetalle?.servicios_opcionales)
          ? rutaDetalle.servicios_opcionales.find(
              (item: any) => Number(item?.id_servicio) === Number(id_servicio)
            )
          : null;

        return {
          id_servicio: Number(id_servicio),
          cantidad: Number(cantidad),
          precio_unitario: Number(
            optional?.servicio?.precio ?? optional?.precio_unitario ?? optional?.precio ?? 0
          ),
        };
      })
      .filter((item) => Number.isFinite(item.id_servicio) && item.id_servicio > 0 && item.cantidad > 0);

    for (const servicio of servicios) {
      await reservasAPI.agregarServicio(idReserva, servicio);
    }
  };

  const updateCompanionField = (index: number, field: keyof CompanionDraft, value: string) => {
    setCompanionDetails((prev) =>
      prev.map((companion, companionIndex) =>
        companionIndex === index ? { ...companion, [field]: value } : companion
      )
    );
  };

  const handleCreateBooking = async () => {
    if (!canCreateReservas) {
      toast.error('No tienes permiso para crear reservas.');
      return;
    }

    if (!formData.clientId || !formData.bookingDate) {
      toast.error('Selecciona el cliente y la fecha de la reserva.');
      return;
    }

    if (participantTotal <= 0) {
      toast.error('La reserva debe tener al menos un participante.');
      return;
    }

    if (Number(formData.total || 0) <= 0) {
      toast.error('Ingresa un valor total válido.');
      return;
    }

    try {
      setIsLoading(true);

      const created = await reservasAPI.create({
        id_cliente: Number(formData.clientId),
        fecha_reserva: formData.bookingDate,
        estado: 'Pendiente',
        total: Number(formData.total) || 0,
        notas: formData.specialRequests || '',
        numero_participantes: participantTotal,
        tipo_servicio: formData.serviceType === 'ruta' ? 'Ruta' : 'Finca',
      });

      const idReserva = obtenerIdReservaDesdeRespuesta(created);
      if (!idReserva) {
        throw new Error('La reserva se creó, pero no se pudo recuperar su identificador.');
      }

      if (formData.serviceType === 'ruta') {
        if (!formData.routeId) {
          throw new Error('Selecciona una ruta.');
        }

        if (formData.rutaReservaModo === 'programada') {
          if (!selectedProgramacion) {
            throw new Error('Selecciona una programación disponible para esa ruta.');
          }
          if (Number(selectedProgramacion.availableSeats || 0) < participantTotal) {
            throw new Error(
              'La programación seleccionada no tiene cupos suficientes para esa cantidad de personas.'
            );
          }

          const idProgramacion = Number(selectedProgramacion.id);

          await reservasAPI.agregarProgramacion(idReserva, {
            id_programacion: idProgramacion,
            cantidad_personas: participantTotal,
            precio_unitario: Number(selectedProgramacion.price || 0),
          });
        } else {
          const fs = formData.personalizadaFechaSalida?.trim();
          if (!fs) {
            throw new Error('Indica la fecha de salida para la reserva en taquilla.');
          }
          let fr = formData.personalizadaFechaRegreso?.trim() || fs;
          if (fr < fs) {
            throw new Error('La fecha de regreso no puede ser anterior a la fecha de salida.');
          }
          const cuposNum = Number(formData.personalizadaCuposSalida);
          const cuposTotales =
            Number.isFinite(cuposNum) && cuposNum >= participantTotal
              ? Math.floor(cuposNum)
              : Math.max(participantTotal, 1);

          const opcTotal = formOptionalServicesTotal;
          const totalReserva = Number(formData.total || 0);
          const lineTotal = Math.max(0, totalReserva - opcTotal);
          let precioUnitario = Number(formRutaDetalle?.precio_base ?? 0);
          if (precioUnitario <= 0 && participantTotal > 0) {
            precioUnitario = lineTotal / participantTotal;
          }
          if (!Number.isFinite(precioUnitario) || precioUnitario <= 0) {
            throw new Error(
              'No se pudo calcular el precio por persona. Revisa el precio base de la ruta o el total de la reserva.'
            );
          }

          const hs = formData.personalizadaHoraSalida?.trim();
          const hr = formData.personalizadaHoraRegreso?.trim();

          const rawProg = await programacionAPI.create({
            id_ruta: Number(formData.routeId),
            fecha_salida: fs,
            fecha_regreso: fr,
            hora_salida: hs || null,
            hora_regreso: hr || null,
            lugar_encuentro: formData.personalizadaLugarEncuentro?.trim() || null,
            cupos_totales: cuposTotales,
            precio_programacion: precioUnitario,
            es_personalizada: true,
          });

          const createdProg = (rawProg as any)?.data ?? rawProg;
          const idNuevaProgramacion = Number(createdProg?.id_programacion);
          if (!Number.isFinite(idNuevaProgramacion) || idNuevaProgramacion <= 0) {
            throw new Error(
              'No se pudo crear la salida en taquilla. Verifica que tu usuario sea empleado o administrador.'
            );
          }

          await reservasAPI.agregarProgramacion(idReserva, {
            id_programacion: idNuevaProgramacion,
            cantidad_personas: participantTotal,
            precio_unitario: precioUnitario,
          });
        }

        await applySelectedServices(idReserva, formRutaOpcionalesSeleccion, formRutaDetalle);
      } else {
        const idFinca = Number(formData.farmId);
        const numeroNoches = Number(formData.nights);
        const precioPorNoche = Number(formData.nightlyPrice);

        if (!Number.isFinite(idFinca) || idFinca <= 0) {
          throw new Error('Selecciona una finca válida.');
        }
        if (!formData.checkIn || !formData.checkOut) {
          throw new Error('Debes registrar check-in y check-out.');
        }
        if (!Number.isFinite(numeroNoches) || numeroNoches <= 0) {
          throw new Error('El número de noches debe ser mayor a cero.');
        }
        if (!Number.isFinite(precioPorNoche) || precioPorNoche <= 0) {
          throw new Error('El precio por noche debe ser mayor a cero.');
        }

        await reservasAPI.agregarFinca(idReserva, {
          id_finca: idFinca,
          fecha_checkin: formData.checkIn,
          fecha_checkout: formData.checkOut,
          numero_noches: numeroNoches,
          precio_por_noche: precioPorNoche,
        });
      }

      for (let index = 0; index < companionDetails.length; index += 1) {
        const companion = companionDetails[index];
        if (!companion?.nombre.trim() || !companion?.apellido.trim()) {
          throw new Error(`Completa nombre y apellido del acompañante ${index + 1}.`);
        }
        if (!companion?.numero_documento?.trim()) {
          throw new Error(`El número de documento del acompañante ${index + 1} es obligatorio.`);
        }
      }

      if (companionDetails.length > 0) {
        await Promise.all(
          companionDetails.map((companion) =>
            reservasAPI.agregarAcompanante(idReserva, {
              nombre: companion.nombre.trim(),
              apellido: companion.apellido.trim(),
              tipo_documento: companion.tipo_documento || null,
              numero_documento: companion.numero_documento.trim() || null,
              telefono: companion.telefono.trim() || null,
              fecha_nacimiento: companion.fecha_nacimiento || null,
            })
          )
        );
      }

      toast.success('Reserva creada correctamente.');
      resetForm();
      const fresh = await loadReservas();
      const row = fresh.find((booking) => booking.id === String(idReserva));
      if (row) {
        setSelectedBooking(row);
        setActiveView('detail');
      } else {
        setActiveView('list');
      }
    } catch (error: any) {
      console.error('Error al crear reserva:', error);
      toast.error(error?.message || 'No se pudo crear la reserva.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBooking = async () => {
    if (!canEditReservas || !selectedBooking?.id) {
      toast.error('No tienes permiso para editar reservas.');
      return;
    }

    if (!formData.clientId || !formData.bookingDate) {
      toast.error('Completa los datos principales de la reserva.');
      return;
    }

    if (formData.status === 'Confirmada' && !canReservationBeConfirmed(selectedBooking.paymentStatus)) {
      toast.error('Solo puedes confirmar una reserva cuando la venta tenga pago parcial o completo aprobado.');
      return;
    }

    if (formData.status === 'Cancelada' && selectedBooking.status !== 'Cancelada') {
      const motivo = formData.cancellationReason.trim();
      if (motivo.length < STAFF_CANCEL_MOTIVO_MIN) {
        toast.error(`Debes indicar el motivo de cancelación (mínimo ${STAFF_CANCEL_MOTIVO_MIN} caracteres).`);
        return;
      }
    }

    try {
      setIsLoading(true);
      const idReserva = Number(selectedBooking.id);
      if (formData.status === 'Cancelada') {
        const motivo =
          selectedBooking.status === 'Cancelada'
            ? (selectedBooking.cancellationReason || formData.cancellationReason || '').trim()
            : formData.cancellationReason.trim();
        if (selectedBooking.status !== 'Cancelada') {
          await ejecutarCancelacionReservaStaff(idReserva, motivo);
        } else {
          await reservasAPI.update(idReserva, {
            id_cliente: Number(formData.clientId),
            fecha_reserva: formData.bookingDate,
            estado: 'Cancelada',
            total: Number(formData.total) || 0,
            notas: formData.specialRequests || '',
            motivo_cancelacion: motivo || undefined,
          });
        }
      } else {
        await reservasAPI.update(idReserva, {
          id_cliente: Number(formData.clientId),
          fecha_reserva: formData.bookingDate,
          estado: formData.status,
          total: Number(formData.total) || 0,
          notas: formData.specialRequests || '',
        });
      }

      toast.success('Reserva actualizada correctamente.');
      setSelectedBooking((prev) =>
        prev
          ? {
              ...prev,
              clientId: formData.clientId,
              clientName: selectedClient?.name || prev.clientName,
              clientEmail: selectedClient?.email || prev.clientEmail,
              clientPhone: selectedClient?.phone || prev.clientPhone,
              date: formData.bookingDate,
              participants: participantTotal,
              adults: 1,
              children: Math.max(0, Number(formData.companions || 0)),
              total: Number(formData.total || 0),
              pendingAmount:
                prev.paymentStatus === 'Pagado'
                  ? 0
                  : Math.max(0, Number(formData.total || 0) - Number(prev.paidAmount || 0)),
              status: formData.status,
              specialRequests: formData.specialRequests || '',
            }
          : prev
      );
      const fresh = await loadReservas();
      const row = fresh.find((b) => b.id === String(selectedBooking.id));
      if (row) setSelectedBooking(row);
      setActiveView('detail');
      void loadReservaDetail(idReserva);
    } catch (error: any) {
      console.error('Error al editar reserva:', error);
      toast.error(error?.message || 'No se pudo actualizar la reserva.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeStatus = async (bookingId: string, newStatus: string) => {
    if (!canEditReservas) {
      toast.error('No tienes permiso para editar reservas.');
      return;
    }

    const current = bookings.find((booking) => booking.id === bookingId);
    if (!current) {
      toast.error('Reserva no encontrada.');
      return;
    }

    if (newStatus === 'Confirmada' && !canReservationBeConfirmed(current.paymentStatus)) {
      toast.error('Solo puedes confirmar una reserva cuando la venta tenga pago parcial o completo aprobado.');
      return;
    }

    if (newStatus === 'Cancelada') {
      const booking = bookings.find((b) => b.id === bookingId) || selectedBooking;
      if (booking) {
        setSelectedBooking(booking);
        setStaffCancelMotivo(booking.cancellationReason || '');
      }
      setStaffCancelDialogOpen(true);
      return;
    }

    try {
      await reservasAPI.update(Number(bookingId), { estado: newStatus });
      toast.success(`Estado actualizado a ${newStatus}.`);
      const fresh = await loadReservas();
      if (selectedBooking?.id === bookingId) {
        const row = fresh.find((b) => b.id === bookingId);
        if (row) setSelectedBooking(row);
      }
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      toast.error(error?.message || 'No se pudo actualizar el estado.');
    }
  };

  const openDeleteReservaDialog = (booking?: BookingRecord) => {
    const target = booking ?? selectedBooking;
    if (!target?.id) return;

    if (target.status === 'Cancelada') {
      toast.info('Esta reserva ya está cancelada.');
      return;
    }

    if (booking) setSelectedBooking(booking);
    setDeleteCancelMotivo('');
    setIsDeleteDialogOpen(true);
  };

  /** El botón «Eliminar» cancela la reserva (misma lógica que cancelar), no borra el registro. */
  const handleDeleteBooking = async () => {
    if (!canDeleteReservas || !selectedBooking?.id) {
      toast.error('No tienes permiso para cancelar reservas.');
      return;
    }

    if (selectedBooking.status === 'Cancelada') {
      toast.info('Esta reserva ya está cancelada.');
      setIsDeleteDialogOpen(false);
      return;
    }

    const idReserva = Number(selectedBooking.id);
    const motivo = deleteCancelMotivo.trim();
    if (motivo.length < STAFF_CANCEL_MOTIVO_MIN) {
      toast.error(`Indica el motivo (mínimo ${STAFF_CANCEL_MOTIVO_MIN} caracteres).`);
      return;
    }

    setIsCancellingStaffReserva(true);
    try {
      await ejecutarCancelacionReservaStaff(idReserva, motivo);
      toast.success(
        'Reserva cancelada. Quedó registrada en el historial; si era hospedaje en finca, ya no bloquea eliminar la finca.',
      );
      setIsDeleteDialogOpen(false);
      setDeleteCancelMotivo('');
      const fresh = await loadReservas();
      const row = fresh.find((b) => b.id === String(idReserva));
      if (row && activeView === 'detail') {
        setSelectedBooking(row);
        void loadReservaDetail(idReserva);
      } else {
        goBackToList();
      }
    } catch (error: any) {
      console.error('Error al cancelar reserva (desde eliminar):', error);
      toast.error(error?.message || 'No se pudo cancelar la reserva.');
    } finally {
      setIsCancellingStaffReserva(false);
    }
  };

  const handleAssociateProgramacion = async () => {
    const idReserva = Number(selectedBooking?.id);
    const idProgramacion = Number(detalleProgramacionId);

    if (!Number.isFinite(idReserva) || idReserva <= 0) {
      toast.error('Reserva inválida.');
      return;
    }
    if (!Number.isFinite(idProgramacion) || idProgramacion <= 0) {
      toast.error('Ingresa un ID de programación válido.');
      return;
    }

    try {
      await reservasAPI.agregarProgramacion(idReserva, {
        id_programacion: idProgramacion,
        cantidad_personas: Number(reservaDetalle?.numero_participantes ?? selectedBooking?.participants ?? 1),
      });
      toast.success('Programación asociada correctamente.');
      await loadReservaDetail(idReserva);
      await loadReservas();
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo asociar la programación.');
    }
  };

  const handleSaveOptionalServicesFromDetail = async () => {
    const idReserva = Number(selectedBooking?.id);
    if (!Number.isFinite(idReserva) || idReserva <= 0) {
      toast.error('Reserva inválida.');
      return;
    }

    const hasAnySelection = Object.values(detalleOpcionalesSeleccion).some((qty) => Number(qty) > 0);
    if (!hasAnySelection) {
      toast.info('Selecciona al menos un servicio opcional.');
      return;
    }

    try {
      await applySelectedServices(idReserva, detalleOpcionalesSeleccion, detalleRuta);
      toast.success('Servicios opcionales agregados correctamente.');
      await loadReservaDetail(idReserva);
      await loadReservas();
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron guardar los servicios opcionales.');
    }
  };

  const handleGeneratePDF = () => {
    toast.success('La exportación PDF queda lista para conectarse al flujo real.');
  };

  const renderServiceOptionList = (
    source: 'form' | 'detail',
    routeDetail: any,
    selectionMap: Record<number, number>,
    setSelectionMap: React.Dispatch<React.SetStateAction<Record<number, number>>>
  ) => {
    if (source === 'form' && isLoadingRouteDetail) {
      return <p className="text-sm text-gray-500">Cargando servicios opcionales...</p>;
    }

    const opcionales = Array.isArray(routeDetail?.servicios_opcionales)
      ? routeDetail.servicios_opcionales
      : [];

    if (!opcionales.length) {
      return <p className="text-sm text-gray-500">Esta ruta no tiene servicios opcionales configurados.</p>;
    }

    return (
      <div className="space-y-3">
        {opcionales.map((so: any) => {
          const idServicio = Number(so?.id_servicio);
          if (!Number.isFinite(idServicio) || idServicio <= 0) return null;

          const checked = Number(selectionMap[idServicio] ?? 0) > 0;
          const cantidadDefault = Number(so?.cantidad_default ?? 1) || 1;
          const nombreServicio = so?.servicio?.nombre ?? `Servicio #${idServicio}`;
          const precio = Number(
            so?.servicio?.precio ?? so?.precio_unitario ?? so?.precio ?? 0
          );

          return (
            <div
              key={String(so?.id_ruta_servicio_opcional ?? idServicio)}
              className="flex flex-col gap-3 rounded-lg border bg-gray-50 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => {
                    const willCheck = Boolean(value);
                    setSelectionMap((prev) => ({
                      ...prev,
                      [idServicio]: willCheck ? (prev[idServicio] > 0 ? prev[idServicio] : cantidadDefault) : 0,
                    }));
                  }}
                />
                <div>
                  <p className="font-medium text-gray-900">{nombreServicio}</p>
                  <p className="text-xs text-gray-500">
                    ID: {idServicio} {precio > 0 ? `• ${formatCurrency(precio)}` : '• Precio por definir'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-600">Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={checked ? Number(selectionMap[idServicio] ?? cantidadDefault) : ''}
                  disabled={!checked}
                  onChange={(e) => {
                    const nextQty = Math.max(1, Number(e.target.value) || 1);
                    setSelectionMap((prev) => ({ ...prev, [idServicio]: nextQty }));
                  }}
                  className="w-24 bg-white"
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!permisos.loadingRoles && !canViewReservas) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Acceso denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">No tienes permiso para ver reservas.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h2 className="text-2xl font-semibold text-green-800">Gestión de Reservas</h2>
          <p className="text-gray-600">
            Vista completa para staff, con estados reales de reserva, venta y pago.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeView !== 'list' && (
            <Button variant="outline" onClick={goBackToList}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al listado
            </Button>
          )}
          <Button variant="outline" onClick={() => void loadReservas()} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          {canCreateReservas && activeView === 'list' && (
            <Button onClick={openCreateView} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Reserva
            </Button>
          )}
        </div>
      </motion.div>

      {activeView === 'list' && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-green-200">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Reservas registradas</p>
                  <p className="text-2xl font-semibold text-green-800">{dashboardStats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Confirmadas</p>
                  <p className="text-2xl font-semibold text-green-800">{dashboardStats.confirmed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-2xl font-semibold text-amber-700">{dashboardStats.pending}</p>
                </div>
                <CalendarDays className="h-8 w-8 text-amber-600" />
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Saldo pendiente</p>
                  <p className="text-xl font-semibold text-blue-800">
                    {formatCurrency(dashboardStats.pendingAmount)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </CardContent>
            </Card>
          </div>

          <Card className="border-green-200">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-green-800">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Buscar y filtrar reservas</span>
                {hasActiveFilters && (
                  <Badge variant="outline" className="border-green-300 text-green-800">
                    Filtros activos
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="md:col-span-2 xl:col-span-3">
                  <Label>Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="ID, cliente, teléfono, correo, tipo de servicio o estado de pago..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Tipo de servicio</Label>
                  <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ruta">Ruta</SelectItem>
                      <SelectItem value="finca">Finca</SelectItem>
                      <SelectItem value="servicio">Servicio</SelectItem>
                      <SelectItem value="reserva">Reserva (sin detalle)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estado de la reserva</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Confirmada">Confirmada</SelectItem>
                      <SelectItem value="Completada">Completada</SelectItem>
                      <SelectItem value="Cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estado del pago</Label>
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos los pagos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Parcial">Parcial</SelectItem>
                      <SelectItem value="Pagado">Pagado</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fecha de reserva (desde)</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <Label>Fecha de reserva (hasta)</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
                <div>
                  <Label>Ordenar por</Label>
                  <Select
                    value={sortField}
                    onValueChange={(value) => setSortField(value as BookingSortField)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Campo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Fecha de registro (más recientes)</SelectItem>
                      <SelectItem value="bookingDate">Fecha de la reserva</SelectItem>
                      <SelectItem value="id">ID de reserva</SelectItem>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="total">Monto total</SelectItem>
                      <SelectItem value="status">Estado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Orden</Label>
                  <Select
                    value={sortDirection}
                    onValueChange={(value) => setSortDirection(value as SortDirection)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Dirección" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descendente (más reciente primero)</SelectItem>
                      <SelectItem value="asc">Ascendente (más antiguo primero)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                    onClick={clearBookingFilters}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-green-800">
                Reservas ({sortedBookings.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Fechas</TableHead>
                      <TableHead>Participantes</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead className="w-[230px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-10 text-center text-gray-500">
                          {isLoading
                            ? 'Cargando reservas...'
                            : hasActiveFilters
                              ? 'No hay reservas que coincidan con los filtros aplicados.'
                              : 'No hay reservas para mostrar.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{booking.clientName}</p>
                              <p className="text-xs text-gray-500">{bookingClientContactLine(booking)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">
                                {booking.productName || booking.packageName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {booking.productName
                                  ? `${booking.packageName} · #${booking.id}`
                                  : `Reserva #${booking.id}`}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm text-gray-900">
                                Reserva: {formatDateDisplay(booking.bookingDateRaw || booking.date, { style: 'numeric' })}
                              </p>
                              <p className="text-xs text-gray-500">Registrada: {booking.createdAtLabel}</p>
                            </div>
                          </TableCell>
                          <TableCell>{booking.participants}</TableCell>
                          <TableCell>{formatCurrency(booking.total)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={booking.status === 'Confirmada'}
                                onCheckedChange={(checked) => {
                                  const nextStatus = checked ? 'Confirmada' : 'Pendiente';
                                  void handleChangeStatus(booking.id, nextStatus);
                                }}
                                disabled={
                                  !canEditReservas ||
                                  (booking.status !== 'Confirmada' &&
                                    !canReservationBeConfirmed(booking.paymentStatus))
                                }
                                className={booking.status === 'Confirmada' ? 'bg-green-600' : 'bg-gray-300'}
                              />
                              {getStatusBadge(booking.status)}
                            </div>
                          </TableCell>
                          <TableCell>{getPaymentStatusBadge(booking.paymentStatus)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDetailView(booking)}
                                className="border-green-600 text-green-700 hover:bg-green-50"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canEditReservas && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditView(booking)}
                                  className="border-blue-600 text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDeleteReservas && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openDeleteReservaDialog(booking)}
                                  disabled={booking.status === 'Cancelada'}
                                  title={
                                    booking.status === 'Cancelada'
                                      ? 'La reserva ya está cancelada'
                                      : 'Cancelar reserva (dar de baja)'
                                  }
                                  className="border-red-600 text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleGeneratePDF}
                                className="border-green-600 text-green-700 hover:bg-green-50"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-gray-600">
                  Mostrando {sortedBookings.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} a{' '}
                  {Math.min(currentPage * itemsPerPage, sortedBookings.length)} de {sortedBookings.length} reservas
                  {bookings.length !== sortedBookings.length
                    ? ` (filtradas de ${bookings.length})`
                    : ''}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="px-3 text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {(activeView === 'create' || activeView === 'edit') && (
        <Card className="border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-green-800">
              {activeView === 'create' ? 'Nueva Reserva' : 'Editar Reserva'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <Card className="border-green-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-green-800">1. Cliente y datos base</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <BookingClientPicker
                        clients={clientes}
                        value={formData.clientId}
                        disabled={clientes.length === 0}
                        onChange={(value, client) => {
                          setFormData((prev) => ({
                            ...prev,
                            clientId: value,
                            clientName: client?.name || '',
                          }));
                        }}
                      />
                      {clientes.length === 0 && (
                        <p className="text-xs text-amber-700 mt-1">
                          No hay clientes cargados. Revisa permisos del módulo Clientes o recarga la página.
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Fecha de reserva *</Label>
                      <Input
                        type="date"
                        value={formData.bookingDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, bookingDate: e.target.value }))}
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label>Estado</Label>
                      <Select
                        value={activeView === 'edit' ? formData.status : 'Pendiente'}
                        onValueChange={(value) => {
                          if (value === 'Confirmada' && !canReservationBeConfirmed(selectedBooking?.paymentStatus)) {
                            toast.error('Solo puedes confirmar una reserva cuando la venta tenga pago parcial o completo aprobado.');
                            return;
                          }
                          setFormData((prev) => ({
                            ...prev,
                            status: value,
                            cancellationReason:
                              value === 'Cancelada' && prev.status !== 'Cancelada'
                                ? ''
                                : prev.cancellationReason,
                          }));
                        }}
                        disabled={activeView === 'create'}
                      >
                        <SelectTrigger className="bg-gray-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                          <SelectItem value="Confirmada">Confirmada</SelectItem>
                          <SelectItem value="Cancelada">Cancelada</SelectItem>
                          <SelectItem value="Completada">Completada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {activeView === 'edit' && formData.status === 'Cancelada' ? (
                      <div className="md:col-span-2">
                        <Label htmlFor="staff-cancel-motivo-edit">
                          Motivo de cancelación *{' '}
                          <span className="font-normal text-gray-500">(mín. {STAFF_CANCEL_MOTIVO_MIN} caracteres)</span>
                        </Label>
                        <Textarea
                          id="staff-cancel-motivo-edit"
                          rows={3}
                          value={formData.cancellationReason}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, cancellationReason: e.target.value }))
                          }
                          className="bg-gray-50 border-red-200 focus-visible:ring-red-400"
                          placeholder="Ej: solicitud del cliente, falta de pago, cambio de fecha no disponible..."
                          readOnly={selectedBooking?.status === 'Cancelada'}
                        />
                        {selectedBooking?.status === 'Cancelada' ? (
                          <p className="mt-1 text-xs text-gray-500">Motivo registrado al cancelar la reserva.</p>
                        ) : (
                          <p className="mt-1 text-xs text-amber-800">
                            Al guardar, la reserva pasará a <strong>Cancelada</strong> y este texto quedará almacenado.
                          </p>
                        )}
                      </div>
                    ) : null}
                    <div>
                      <Label>Acompañantes</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.companions}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            companions: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label>Total participantes</Label>
                      <Input value={participantTotal} disabled className="bg-gray-100" />
                    </div>
                    <div>
                      <Label>Total reserva *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.total}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            total: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Observaciones</Label>
                      <Textarea
                        rows={4}
                        value={formData.specialRequests}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, specialRequests: e.target.value }))
                        }
                        className="bg-gray-50"
                        placeholder="Notas internas u observaciones de la reserva"
                      />
                    </div>
                  </CardContent>
                </Card>

                {activeView === 'create' && (
                  <Card className="border-green-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-green-800">2. Servicio asociado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Label>Tipo de servicio *</Label>
                          <Select
                            value={formData.serviceType}
                            onValueChange={(value) => {
                              const next = value === 'finca' ? 'finca' : 'ruta';
                              setFormData((prev) => ({
                                ...prev,
                                serviceType: next,
                                routeId: '',
                                farmId: '',
                                programacionId: '',
                                rutaReservaModo: 'programada',
                                personalizadaFechaSalida: '',
                                personalizadaFechaRegreso: '',
                                personalizadaHoraSalida: '',
                                personalizadaHoraRegreso: '',
                                personalizadaLugarEncuentro: '',
                                personalizadaCuposSalida: '',
                                checkIn: '',
                                checkOut: '',
                                nights: 1,
                                nightlyPrice: 0,
                              }));
                              setFormRutaDetalle(null);
                              setFormRutaOpcionalesSeleccion({});
                            }}
                          >
                            <SelectTrigger className="bg-gray-50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ruta">Ruta turística</SelectItem>
                              <SelectItem value="finca">Finca</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.serviceType === 'ruta' ? (
                          <div className="space-y-3">
                            <div>
                              <Label>¿Cómo vas a tomar la ruta? *</Label>
                              <Select
                                value={formData.rutaReservaModo}
                                onValueChange={(value) => {
                                  const v = value as 'programada' | 'taquilla_personalizada';
                                  setFormData((prev) => ({
                                    ...prev,
                                    rutaReservaModo: v,
                                    routeId: '',
                                    programacionId: '',
                                    personalizadaFechaSalida:
                                      v === 'taquilla_personalizada' ? prev.bookingDate || '' : '',
                                    personalizadaFechaRegreso:
                                      v === 'taquilla_personalizada' ? prev.bookingDate || '' : '',
                                    personalizadaHoraSalida: '',
                                    personalizadaHoraRegreso: '',
                                    personalizadaLugarEncuentro: '',
                                    personalizadaCuposSalida: '',
                                  }));
                                  setFormRutaDetalle(null);
                                  setFormRutaOpcionalesSeleccion({});
                                }}
                              >
                                <SelectTrigger className="bg-gray-50">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="programada">
                                    Salida del calendario (cupos ya creados)
                                  </SelectItem>
                                  <SelectItem value="taquilla_personalizada">
                                    Mostrador: elijo la fecha aquí (cliente físico, sin solicitud web)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="mt-1 text-xs text-gray-500">
                                La segunda opción crea la salida al guardar la reserva (programación
                                personalizada interna), lista para cobrar en taquilla.
                              </p>
                            </div>
                            <BookingRoutePicker
                              routes={routesForCurrentModo}
                              value={formData.routeId}
                              disabled={
                                formData.rutaReservaModo === 'programada' && isLoadingProgramacionesRuta
                              }
                              placeholder={
                                formData.rutaReservaModo === 'programada' && isLoadingProgramacionesRuta
                                  ? 'Cargando rutas con salida…'
                                  : formData.rutaReservaModo === 'programada' &&
                                      routesForCurrentModo.length === 0
                                    ? 'No hay rutas con salida en calendario'
                                    : undefined
                              }
                              hint={
                                formData.rutaReservaModo === 'taquilla_personalizada'
                                  ? 'Todas las rutas del catálogo. Luego defines fecha y cupos de esta salida.'
                                  : isLoadingProgramacionesRuta
                                    ? 'Sincronizando calendario…'
                                    : routesForCurrentModo.length === 0
                                      ? 'No hay salidas activas: cambia a “Mostrador” arriba o crea programaciones en el módulo Programación.'
                                      : 'Solo rutas que tienen al menos una salida programada y reservable.'
                              }
                              onChange={(value) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  routeId: value,
                                  farmId: '',
                                  programacionId: '',
                                }));
                              }}
                            />
                          </div>
                        ) : (
                          <BookingFincaPicker
                            fincas={fincas}
                            value={formData.farmId}
                            disabled={fincas.length === 0}
                            onChange={(value, finca) => {
                              setFormData((prev) => ({
                                ...prev,
                                farmId: value,
                                routeId: '',
                                nightlyPrice: Number(finca?.price || 0),
                                total: Number(finca?.price || 0) * Number(prev.nights || 1),
                              }));
                            }}
                          />
                        )}
                      </div>

                      {formData.serviceType === 'ruta' ? (
                        <>
                          {formData.rutaReservaModo === 'programada' ? (
                            <>
                              <BookingProgramacionPicker
                                programaciones={filteredProgramacionesRuta}
                                value={formData.programacionId}
                                participantTotal={participantTotal}
                                loading={isLoadingProgramacionesRuta}
                                onChange={(value) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    programacionId: value,
                                  }))
                                }
                              />

                              {selectedProgramacion && (
                                <div className="grid grid-cols-1 gap-4 rounded-lg border bg-green-50 p-4 md:grid-cols-4">
                                  <div>
                                    <p className="text-xs text-gray-500">Fecha salida</p>
                                    <p className="font-medium text-gray-900">
                                      {formatDateDisplay(selectedProgramacion.date, { style: 'numeric' })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Hora</p>
                                    <p className="font-medium text-gray-900">
                                      {formatTimeDisplay(selectedProgramacion.startTime, 'Por definir')}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Punto encuentro</p>
                                    <p className="font-medium text-gray-900">
                                      {selectedProgramacion.meetingPoint}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Cupos</p>
                                    <p
                                      className={`font-medium ${selectedProgramacion.availableSeats < participantTotal ? 'text-red-700' : 'text-gray-900'}`}
                                    >
                                      {selectedProgramacion.availableSeats} disponibles de{' '}
                                      {selectedProgramacion.totalSeats}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/40 p-4">
                              <p className="text-sm font-medium text-amber-950">
                                Salida en taquilla: se crea al guardar y se vincula a esta reserva (sin
                                solicitud del cliente).
                              </p>
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                  <Label>Fecha de salida *</Label>
                                  {taquillaAvailabilityWarning ? (
                                    <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                      No se cargaron las fechas ocupadas. Confirma disponibilidad o recarga; el
                                      calendario puede estar incompleto.
                                    </div>
                                  ) : null}
                                  <p className="mb-2 text-sm text-gray-600">
                                    Fecha elegida:{' '}
                                    <span className="font-medium text-gray-900">
                                      {formatTaquillaSelectedDate(taquillaSelectedCalendarDate)}
                                    </span>
                                  </p>
                                  <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
                                    {isLoadingTaquillaCalendar ? (
                                      <p className="py-10 text-center text-sm text-gray-500">
                                        Cargando calendario…
                                      </p>
                                    ) : !formData.routeId ? (
                                      <p className="py-6 text-center text-sm text-gray-500">
                                        Primero elige una ruta para ver disponibilidad (igual que en reserva
                                        personalizada del sitio).
                                      </p>
                                    ) : (
                                      <>
                                        <div className="flex justify-center overflow-x-auto">
                                          <BookingCalendar
                                            mode="single"
                                            weekStartsOn={1}
                                            selected={taquillaSelectedCalendarDate}
                                            onSelect={(date) => {
                                              if (!date) return;
                                              const ymd = toYMD(date);
                                              const reg = toYMD(addDays(date, taquillaDurationDays - 1));
                                              setFormData((prev) => ({
                                                ...prev,
                                                personalizadaFechaSalida: ymd,
                                                personalizadaFechaRegreso: reg,
                                              }));
                                            }}
                                            disabled={isTaquillaStartDateDisabled}
                                            modifiers={taquillaCalendarModifiers}
                                            modifiersClassNames={taquillaCalendarClassNames}
                                            defaultMonth={taquillaSelectedCalendarDate || new Date()}
                                            className="rounded-md"
                                          />
                                        </div>
                                        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-amber-100 pt-3 text-xs text-gray-600">
                                          <span className="inline-flex items-center gap-1.5">
                                            <span className="h-3.5 w-3.5 rounded border border-green-300 bg-white shadow-sm" />
                                            Disponible
                                          </span>
                                          <span className="inline-flex items-center gap-1.5">
                                            <span className="h-3.5 w-3.5 rounded border border-slate-200 bg-slate-100 opacity-75">
                                              —
                                            </span>
                                            Pasado
                                          </span>
                                          <span className="inline-flex items-center gap-1.5">
                                            <span className="h-3.5 w-3.5 rounded border border-dashed border-gray-400 bg-gray-200 shadow-inner" />
                                            Ocupado o conflicto por duración
                                          </span>
                                        </div>
                                        {taquillaDurationDays > 1 ? (
                                          <p className="mt-2 text-center text-xs text-gray-500">
                                            {formRutaDetalle?.duracion_dias != null &&
                                            Number(formRutaDetalle.duracion_dias) > 0 ? (
                                              <>
                                                La ruta está registrada con{' '}
                                                {formatRutaDuracionHoras(formRutaDetalle.duracion_dias)}: en el
                                                calendario eso equivale a {taquillaDurationDays} día
                                                {taquillaDurationDays === 1 ? '' : 's'} natural
                                                {taquillaDurationDays === 1 ? '' : 'es'}. Un día gris bloquea iniciar la
                                                salida si el viaje cruzaría una fecha ocupada.
                                              </>
                                            ) : (
                                              <>
                                                En el calendario se bloquean hasta {taquillaDurationDays} día
                                                {taquillaDurationDays === 1 ? '' : 's'} natural
                                                {taquillaDurationDays === 1 ? '' : 'es'} según la duración de la ruta.
                                                Un día gris bloquea iniciar la salida si el viaje cruzaría una fecha
                                                ocupada.
                                              </>
                                            )}
                                          </p>
                                        ) : (
                                          <p className="mt-2 text-center text-xs text-gray-500">
                                            Misma lógica que el calendario del cliente: días ocupados o en
                                            conflicto no son seleccionables.
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="md:col-span-2">
                                  <Label>Fecha de regreso (ajustable)</Label>
                                  <Input
                                    type="date"
                                    className="max-w-xs bg-white"
                                    value={formData.personalizadaFechaRegreso}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        personalizadaFechaRegreso: e.target.value,
                                      }))
                                    }
                                  />
                                  <p className="mt-1 text-xs text-gray-500">
                                    Se rellena sola según las horas de la ruta en la ficha
                                    {formRutaDetalle?.duracion_dias != null &&
                                    Number(formRutaDetalle.duracion_dias) > 0
                                      ? ` (${formatRutaDuracionHoras(formRutaDetalle.duracion_dias)} ≈ ${taquillaDurationDays} día${taquillaDurationDays === 1 ? '' : 's'} en calendario)`
                                      : ` (${taquillaDurationDays} día${taquillaDurationDays === 1 ? '' : 's'} en calendario)`}
                                    ; corrige si hace falta.
                                  </p>
                                </div>
                                <div>
                                  <Label>Hora salida</Label>
                                  <Input
                                    type="time"
                                    className="bg-white"
                                    value={formData.personalizadaHoraSalida}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        personalizadaHoraSalida: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Hora regreso</Label>
                                  <Input
                                    type="time"
                                    className="bg-white"
                                    value={formData.personalizadaHoraRegreso}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        personalizadaHoraRegreso: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <Label>Punto de encuentro</Label>
                                  <Input
                                    className="bg-white"
                                    placeholder="Ej. Parque principal — se puede completar luego"
                                    value={formData.personalizadaLugarEncuentro}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        personalizadaLugarEncuentro: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Cupos de esta salida</Label>
                                  <Input
                                    type="number"
                                    min={participantTotal}
                                    className="bg-white"
                                    placeholder={String(Math.max(participantTotal, 1))}
                                    value={formData.personalizadaCuposSalida}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        personalizadaCuposSalida: e.target.value,
                                      }))
                                    }
                                  />
                                  <p className="mt-1 text-xs text-gray-500">
                                    Mínimo {participantTotal} (participantes de esta reserva). Si lo dejas
                                    vacío, se usa ese mínimo.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div>
                            <Label>Servicios opcionales de la ruta</Label>
                            <div className="mt-3">
                              {renderServiceOptionList(
                                'form',
                                formRutaDetalle,
                                formRutaOpcionalesSeleccion,
                                setFormRutaOpcionalesSeleccion
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                          <div>
                            <Label>Check-in *</Label>
                            <Input
                              type="date"
                              value={formData.checkIn}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, checkIn: e.target.value }))
                              }
                              className="bg-gray-50"
                            />
                          </div>
                          <div>
                            <Label>Check-out *</Label>
                            <Input
                              type="date"
                              value={formData.checkOut}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, checkOut: e.target.value }))
                              }
                              className="bg-gray-50"
                            />
                          </div>
                          <div>
                            <Label>Noches *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={formData.nights}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  nights: Math.max(1, Number(e.target.value) || 1),
                                  total:
                                    Math.max(1, Number(e.target.value) || 1) *
                                    Number(prev.nightlyPrice || 0),
                                }))
                              }
                              className="bg-gray-50"
                            />
                          </div>
                          <div>
                            <Label>Precio por noche *</Label>
                            <Input
                              type="number"
                              min="0"
                              value={formData.nightlyPrice}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  nightlyPrice: Math.max(0, Number(e.target.value) || 0),
                                  total:
                                    Math.max(0, Number(e.target.value) || 0) *
                                    Number(prev.nights || 1),
                                }))
                              }
                              className="bg-gray-50"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {activeView === 'create' && companionDetails.length > 0 && (
                  <Card className="border-green-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-green-800">3. Acompañantes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Registra aquí a las {companionDetails.length} personas adicionales de la reserva. El número de
                        documento de cada acompañante es obligatorio.
                      </p>
                      {companionDetails.map((companion, index) => (
                        <div key={`companion-${index}`} className="rounded-lg border bg-gray-50 p-4">
                          <p className="mb-4 text-sm font-medium text-gray-900">Acompañante {index + 1}</p>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <div>
                              <Label>Nombre *</Label>
                              <Input
                                value={companion.nombre}
                                onChange={(e) => updateCompanionField(index, 'nombre', e.target.value)}
                                className="bg-white"
                              />
                            </div>
                            <div>
                              <Label>Apellido *</Label>
                              <Input
                                value={companion.apellido}
                                onChange={(e) => updateCompanionField(index, 'apellido', e.target.value)}
                                className="bg-white"
                              />
                            </div>
                            <div>
                              <Label>Tipo de documento</Label>
                              <Select
                                value={companion.tipo_documento || 'CC'}
                                onValueChange={(value) => updateCompanionField(index, 'tipo_documento', value)}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CC">CC</SelectItem>
                                  <SelectItem value="TI">TI</SelectItem>
                                  <SelectItem value="CE">CE</SelectItem>
                                  <SelectItem value="PAS">Pasaporte</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Número de documento *</Label>
                              <Input
                                value={companion.numero_documento}
                                onChange={(e) => updateCompanionField(index, 'numero_documento', e.target.value)}
                                className="bg-white"
                                required
                              />
                            </div>
                            <div>
                              <Label>Teléfono</Label>
                              <Input
                                value={companion.telefono}
                                onChange={(e) => updateCompanionField(index, 'telefono', e.target.value)}
                                className="bg-white"
                              />
                            </div>
                            <div>
                              <Label>Fecha de nacimiento</Label>
                              <Input
                                type="date"
                                value={companion.fecha_nacimiento}
                                onChange={(e) => updateCompanionField(index, 'fecha_nacimiento', e.target.value)}
                                className="bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {activeView === 'edit' && selectedBooking && (
                  <Card className="border-blue-100 bg-blue-50/40">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-blue-900">Servicio actual</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm text-gray-600">Tipo</p>
                        <p className="font-medium">
                          {selectedBooking.serviceTypeForm === 'ruta' ? 'Ruta' : 'Finca'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Reserva</p>
                        <p className="font-medium">#{selectedBooking.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Estado de pago</p>
                        <div className="mt-1">
                          {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <p className="text-sm text-gray-600">
                          La reasignación de programación, finca o servicios se gestiona desde el detalle completo.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <Card className="border-green-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-green-800">Resumen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Cliente</p>
                      <p className="font-medium text-gray-900">
                        {selectedClient?.name || formData.clientName || 'Sin seleccionar'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Documento</p>
                      <p className="font-medium text-gray-900">
                        {selectedClient?.document || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contacto</p>
                      <p className="font-medium text-gray-900 text-sm">
                        {selectedClient?.email || selectedClient?.phone || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Participantes</p>
                      <p className="font-medium text-gray-900">{participantTotal}</p>
                    </div>
                    {activeView === 'create' && formData.serviceType === 'ruta' && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600">
                            {formData.rutaReservaModo === 'programada'
                              ? 'Salida del calendario'
                              : 'Taquilla (fecha elegida)'}
                          </p>
                          <p className="font-medium text-gray-900">
                            {formData.rutaReservaModo === 'programada'
                              ? selectedProgramacion
                                ? `#${selectedProgramacion.id} · ${selectedProgramacion.date}`
                                : 'Sin seleccionar'
                              : formData.personalizadaFechaSalida
                                ? `${formData.personalizadaFechaSalida}${formData.personalizadaHoraSalida ? ` · ${formData.personalizadaHoraSalida}` : ''}`
                                : 'Indica la fecha de salida'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Acompañantes</p>
                          <p className="font-medium text-gray-900">{companionDetails.length}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Estado</p>
                      <div className="mt-1">
                        {getStatusBadge(activeView === 'edit' ? formData.status : 'Pendiente')}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estado de pago</p>
                      <div className="mt-1">
                        {getPaymentStatusBadge(
                          activeView === 'edit' ? selectedBooking?.paymentStatus || 'Pendiente' : 'Pendiente'
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-xl font-semibold text-green-800">
                        {formatCurrency(formData.total)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-green-800">Reglas del flujo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-gray-600">
                    <p>Toda reserva nueva se crea como `Pendiente`.</p>
                    <p>`Confirmada` solo se permite cuando la venta esté en `Parcial` o `Pagado`.</p>
                    <p>
                      Modo <strong>calendario</strong>: solo rutas con salida ya creada; eliges la salida con cupos.
                      Modo <strong>mostrador</strong>: cualquier ruta del catálogo, defines fecha (y cupos) aquí; al guardar se
                      crea la programación interna y se descuenta el cupo — sin solicitud web del cliente.
                    </p>
                    <p>
                      El total en calendario sigue el precio de la salida elegida; en mostrador usa el precio base de la ruta
                      (o reparte el total entre participantes si el base es 0) más opcionales.
                    </p>
                    <p>Los acompañantes del formulario se registran directamente en `detalle_reserva_acompanante` al crear la reserva.</p>
                    <p>Los comprobantes y validaciones pertenecen a `Ventas` y `Abonos`.</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={goBackToList}>
                Cancelar
              </Button>
              <Button
                onClick={activeView === 'create' ? handleCreateBooking : handleEditBooking}
                disabled={
                  isLoading ||
                  (activeView === 'create' && !canCreateReservas) ||
                  (activeView === 'edit' && !canEditReservas)
                }
                className="bg-green-600 hover:bg-green-700"
              >
                {activeView === 'create' ? (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear reserva
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeView === 'detail' && selectedBooking && (
        <>
          <ReceiptProofViewerDialog
            open={reservaComprobanteViewer.open}
            onOpenChange={(open) =>
              setReservaComprobanteViewer((prev) => ({ ...prev, open, url: open ? prev.url : null }))
            }
            url={reservaComprobanteViewer.url}
            fileName={reservaComprobanteViewer.fileName}
            mimeType={reservaComprobanteViewer.mimeType}
          />
          <Dialog open={reservaComprobanteDialogOpen} onOpenChange={setReservaComprobanteDialogOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Comprobantes de pago</DialogTitle>
                <DialogDescription>
                  Reserva #{selectedBooking.id}. Selecciona un abono para ver el soporte en pantalla completa.
                </DialogDescription>
              </DialogHeader>
              {reservaPagosConComprobante.length === 0 ? (
                <p className="text-sm text-gray-600">No hay comprobantes cargados para esta reserva.</p>
              ) : (
                <div className="space-y-3">
                  {reservaPagosConComprobante.map((pago) => (
                    <div
                      key={pago.id_pago}
                      className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="text-sm text-gray-800">
                        <p className="font-semibold text-green-900">Abono #{pago.id_pago}</p>
                        <p className="text-gray-600">
                          {formatCurrency(pago.monto)} · {pago.metodo_pago || '—'} · {pago.estado || 'Pendiente'}
                        </p>
                        {pago.fecha_pago ? (
                          <p className="text-xs text-gray-500">{formatDate(pago.fecha_pago)}</p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 shrink-0"
                        onClick={() => {
                          setReservaComprobanteDialogOpen(false);
                          abrirVisorComprobantePago(pago);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver comprobante
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-green-200">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Reserva</p>
                  <p className="text-2xl font-semibold text-green-800">#{selectedBooking.id}</p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Participantes</p>
                  <p className="text-2xl font-semibold text-green-800">
                    {reservaDetalle?.numero_participantes || selectedBooking.participants}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-semibold text-green-800">
                    {formatCurrency(reservaDetalle?.monto_total || selectedBooking.total)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Pago</p>
                  <div className="mt-2">
                    {getPaymentStatusBadge(
                      staffReservaPaymentStatusForUi({
                        tipoServicio: reservaDetalle?.tipo_servicio || selectedBooking.packageName,
                        estadoPago: reservaDetalle?.estado_pago ?? selectedBooking.paymentStatus,
                        estadoReserva: reservaDetalle?.estado ?? selectedBooking.status,
                        saldoPendiente: reservaDetalle?.saldo_pendiente ?? selectedBooking.pendingAmount,
                        montoPagado: reservaDetalle?.monto_pagado ?? selectedBooking.paidAmount,
                        montoTotal:
                          reservaDetalle?.monto_total ?? reservaDetalle?.total ?? selectedBooking.total,
                      }),
                    )}
                  </div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <Card className="border-green-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="text-green-800">Detalle completo de la reserva</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-gray-600">Cliente</p>
                      <p className="font-medium">{selectedBooking.clientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Correo</p>
                      <p className="font-medium">
                        {reservaDetalle?.cliente_email || selectedBooking.clientEmail || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-medium">
                        {reservaDetalle?.cliente_telefono || selectedBooking.clientPhone || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tipo de servicio</p>
                      <p className="font-medium">{reservaDetalle?.tipo_servicio || selectedBooking.packageName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Servicio reservado</p>
                      <p className="font-medium">
                        {resolveReservaProductoNombre(reservaDetalle, { rutaDetalle: detalleRuta }) ||
                          selectedBooking.productName ||
                          resolveRouteNameFromReservaPayload(reservaDetalle, {
                            rutaDetalle: detalleRuta,
                          }) ||
                          '—'}
                      </p>
                      {resolveRouteIdFromReservaPayload(reservaDetalle) ? (
                        <p className="text-xs text-gray-500 mt-0.5">
                          ID ruta: {resolveRouteIdFromReservaPayload(reservaDetalle)}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fecha de reserva</p>
                      <p className="font-medium">
                        {formatDate(reservaDetalle?.fecha_reserva || selectedBooking.date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estado</p>
                      <div className="mt-1">
                        {getStatusBadge(reservaDetalle?.estado || selectedBooking.status)}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pagado</p>
                      <p className="font-medium">
                        {formatCurrency(reservaDetalle?.monto_pagado || selectedBooking.paidAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Saldo pendiente</p>
                      <p className="font-medium">
                        {formatCurrency(reservaDetalle?.saldo_pendiente || selectedBooking.pendingAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Método de pago</p>
                      <p className="font-medium">
                        {reservaDetalle?.metodo_pago || selectedBooking.paymentMethod || 'Por definir'}
                      </p>
                    </div>
                    {reservaDetalle?.motivo_desaprobacion_pago ? (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Motivo de desaprobación del pago</p>
                        <p className="font-medium text-red-700 mt-1">
                          {reservaDetalle.motivo_desaprobacion_pago}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-lg border bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">Observaciones</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                      {reservaDetalle?.notas || selectedBooking.specialRequests || 'Sin observaciones registradas.'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-green-800">Asociaciones operativas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-gray-600">ID reserva</p>
                      <p className="font-medium">{selectedBooking.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ID programación</p>
                      <p className="font-medium">{detalleProgramacionId || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ID ruta</p>
                      <p className="font-medium">
                        {resolveRouteIdFromReservaPayload(reservaDetalle) || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <Label>ID de programación</Label>
                      <Input
                        type="number"
                        min="1"
                        value={detalleProgramacionId}
                        onChange={(e) => setDetalleProgramacionId(e.target.value)}
                        className="bg-gray-50"
                        placeholder="Ej: 12"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={handleAssociateProgramacion}
                        disabled={isLoadingDetail}
                      >
                        Asociar programación
                      </Button>
                    </div>
                  </div>

                  {Boolean(detalleRuta?.nombre) && (
                    <div className="rounded-lg border bg-green-50 p-4">
                      <p className="font-medium text-green-900">Ruta detectada: {detalleRuta.nombre}</p>
                      <p className="mt-1 text-sm text-green-700">
                        Puedes agregar servicios opcionales definidos para esta ruta.
                      </p>
                    </div>
                  )}

                  <div>
                    <Label>Servicios opcionales disponibles</Label>
                    <div className="mt-3">
                      {renderServiceOptionList(
                        'detail',
                        detalleRuta,
                        detalleOpcionalesSeleccion,
                        setDetalleOpcionalesSeleccion
                      )}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        className="border-green-600 text-green-700 hover:bg-green-50"
                        onClick={handleSaveOptionalServicesFromDetail}
                        disabled={isLoadingDetail}
                      >
                        Guardar servicios opcionales
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {Array.isArray(reservaDetalle?.programaciones) && reservaDetalle.programaciones.length > 0 && (
                <Card className="border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-green-800">Programaciones asociadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ruta y salida</TableHead>
                          <TableHead>Encuentro</TableHead>
                          <TableHead>Personas</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reservaDetalle.programaciones.map((item: any) => {
                          const p = clienteProgramacionPrecioFila(item, reservaDetalle, {
                            listMontoTotal: selectedBooking?.total,
                          });
                          return (
                          <TableRow
                            key={item.id_detalle_reserva_programacion || `${item.id_programacion}-${item.subtotal}`}
                          >
                            <TableCell>
                              <div className="font-medium text-gray-900">{rutaProgramacionLabel(item)}</div>
                              <div className="text-sm text-gray-600">
                                Salida: {formatDateTime(item.fecha_salida, item.hora_salida)}
                                {item.fecha_regreso
                                  ? ` · Regreso: ${formatDateTime(item.fecha_regreso, item.hora_regreso)}`
                                  : ''}
                              </div>
                              <div className="text-xs text-gray-400">Ref. programación #{item.id_programacion}</div>
                            </TableCell>
                            <TableCell className="max-w-[200px] text-sm">
                              {item.lugar_encuentro?.trim() || '—'}
                            </TableCell>
                            <TableCell>{item.cantidad_personas}</TableCell>
                            <TableCell>{formatCurrency(p.precioUnitarioMostrado)}</TableCell>
                            <TableCell>{formatCurrency(p.subtotalMostrado)}</TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {Array.isArray(reservaDetalle?.fincas) && reservaDetalle.fincas.length > 0 && (
                <Card className="border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-green-800">Detalle de finca</CardTitle>
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
                        {reservaDetalle.fincas.map((item: any) => (
                          <TableRow
                            key={item.id_detalle_reserva_finca || `${item.id_finca}-${item.subtotal}`}
                          >
                            <TableCell>
                              <div className="font-medium">{fincaDetalleLabel(item)}</div>
                              {item.id_finca != null && (
                                <div className="text-xs text-gray-400">Ref. #{item.id_finca}</div>
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

              {Array.isArray(reservaDetalle?.servicios) && reservaDetalle.servicios.length > 0 && (
                <Card className="border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-green-800">Servicios agregados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Servicio</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio unitario</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reservaDetalle.servicios.map((item: any) => (
                          <TableRow
                            key={item.id_detalle_reserva_servicio || `${item.id_servicio}-${item.subtotal}`}
                          >
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
                  </CardContent>
                </Card>
              )}

              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-green-800">Pagos y abonos</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingReservaPagos ? (
                    <p className="text-sm text-gray-500">Cargando pagos de la reserva…</p>
                  ) : reservaDetallePagos.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No hay pagos registrados. Si el cliente acaba de pagar, usa «Recargar detalle».
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Abono</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Comprobante</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reservaDetallePagos.map((pago) => (
                          <TableRow key={pago.id_pago}>
                            <TableCell className="font-medium">#{pago.id_pago}</TableCell>
                            <TableCell>{formatCurrency(pago.monto)}</TableCell>
                            <TableCell>{pago.estado || 'Pendiente'}</TableCell>
                            <TableCell>{pago.fecha_pago ? formatDate(pago.fecha_pago) : '—'}</TableCell>
                            <TableCell className="text-right">
                              {pagoTieneComprobante(pago) ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="border-blue-300 text-blue-700"
                                  onClick={() => abrirVisorComprobantePago(pago)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-500">Sin archivo</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  <p className="mt-3 text-xs text-gray-500">
                    La verificación de comprobantes se realiza en el módulo Abonos.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-green-800">Acompañantes</CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(reservaDetalle?.acompanantes) && reservaDetalle.acompanantes.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Documento</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Fecha de nacimiento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reservaDetalle.acompanantes.map((acompanante: any) => (
                          <TableRow key={acompanante.id_detalle_reserva_acompanante}>
                            <TableCell>{`${acompanante.nombre || ''} ${acompanante.apellido || ''}`.trim()}</TableCell>
                            <TableCell>
                              {acompanante.tipo_documento || '—'} {acompanante.numero_documento || ''}
                            </TableCell>
                            <TableCell>{acompanante.telefono || '—'}</TableCell>
                            <TableCell>{formatDate(acompanante.fecha_nacimiento)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Esta reserva no tiene acompañantes registrados.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-green-800">Acciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canEditReservas && (
                    <Button
                      variant="outline"
                      className="w-full border-blue-600 text-blue-700 hover:bg-blue-50"
                      onClick={() => openEditView(selectedBooking)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar reserva
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => void loadReservaDetail(Number(selectedBooking.id))}
                    disabled={isLoadingDetail}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Recargar detalle
                  </Button>
                  {canEditReservas &&
                    selectedBooking.status !== 'Cancelada' &&
                    selectedBooking.status !== 'Completada' && (
                      <Button
                        variant="outline"
                        className="w-full border-red-600 text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setStaffCancelMotivo(
                            reservaDetalle?.motivo_cancelacion || selectedBooking.cancellationReason || '',
                          );
                          setStaffCancelDialogOpen(true);
                        }}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Cancelar reserva
                      </Button>
                    )}
                  <Button
                    variant="outline"
                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                    disabled={isLoadingReservaPagos || reservaPagosConComprobante.length === 0}
                    title={
                      isLoadingReservaPagos
                        ? 'Cargando comprobantes…'
                        : reservaPagosConComprobante.length === 0
                          ? 'No hay comprobante registrado. Usa Recargar detalle si el cliente acaba de pagar.'
                          : undefined
                    }
                    onClick={abrirComprobantesReserva}
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    Comprobante
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                    onClick={handleGeneratePDF}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar PDF
                  </Button>
                  {canDeleteReservas && (
                    <Button
                      variant="outline"
                      className="w-full border-red-600 text-red-700 hover:bg-red-50"
                      onClick={() => openDeleteReservaDialog()}
                      disabled={selectedBooking?.status === 'Cancelada'}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Cancelar reserva
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-green-800">Fechas y control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Creada el</p>
                    <p className="font-medium">{formatDate(reservaDetalle?.fecha_creacion)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Actualizada el</p>
                    <p className="font-medium">{formatDate(reservaDetalle?.fecha_actualizacion)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cancelada el</p>
                    <p className="font-medium">{formatDate(reservaDetalle?.fecha_cancelacion)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Motivo de cancelación</p>
                    <p className="font-medium">{reservaDetalle?.motivo_cancelacion || '—'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-green-800">Resumen del servicio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Tipo</p>
                      <p className="font-medium">
                        {reservaDetalle?.tipo_servicio || selectedBooking.packageName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Fecha</p>
                      <p className="font-medium">
                        {formatDate(reservaDetalle?.fecha_reserva || selectedBooking.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="mt-0.5 h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Participantes</p>
                      <p className="font-medium">
                        {reservaDetalle?.numero_participantes || selectedBooking.participants}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      <AlertDialog
        open={staffCancelDialogOpen}
        onOpenChange={(open) => {
          setStaffCancelDialogOpen(open);
          if (!open) setStaffCancelMotivo('');
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Cancelar reserva</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  La reserva #{selectedBooking?.id} pasará a estado <strong>Cancelada</strong>. Indica el motivo; quedará
                  guardado con la reserva.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="staff-cancel-motivo-dialog">
                    Motivo de cancelación *{' '}
                    <span className="font-normal text-gray-500">(mín. {STAFF_CANCEL_MOTIVO_MIN} caracteres)</span>
                  </Label>
                  <Textarea
                    id="staff-cancel-motivo-dialog"
                    value={staffCancelMotivo}
                    onChange={(e) => setStaffCancelMotivo(e.target.value)}
                    rows={4}
                    className="bg-white"
                    placeholder="Ej: el cliente solicitó cancelación, no hubo pago a tiempo, cupo no disponible..."
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancellingStaffReserva}>Volver</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={isCancellingStaffReserva || staffCancelMotivo.trim().length < STAFF_CANCEL_MOTIVO_MIN}
              onClick={(e) => {
                e.preventDefault();
                void confirmarCancelacionStaff();
              }}
            >
              {isCancellingStaffReserva ? 'Cancelando…' : 'Confirmar cancelación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setDeleteCancelMotivo('');
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">¿Cancelar reserva?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  La reserva de{' '}
                  <span className="font-semibold text-gray-900">
                    {selectedBooking?.clientName || 'este cliente'}
                  </span>{' '}
                  pasará a estado <strong>Cancelada</strong>. No se borra de la base de datos: queda el
                  historial y el motivo. Si incluye hospedaje en finca, al cancelar ya no impedirá
                  eliminar esa finca.
                </p>
                <div>
                  <Label htmlFor="delete-cancel-motivo" className="text-gray-800">
                    Motivo de cancelación{' '}
                    <span className="font-normal text-gray-500">(mín. {STAFF_CANCEL_MOTIVO_MIN} caracteres)</span>
                  </Label>
                  <Textarea
                    id="delete-cancel-motivo"
                    value={deleteCancelMotivo}
                    onChange={(e) => setDeleteCancelMotivo(e.target.value)}
                    rows={4}
                    className="mt-1 bg-white"
                    placeholder="Ej: cliente desistió, duplicado, prueba, no hubo pago..."
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancellingStaffReserva}>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteBooking();
              }}
              disabled={
                !canDeleteReservas ||
                isCancellingStaffReserva ||
                deleteCancelMotivo.trim().length < STAFF_CANCEL_MOTIVO_MIN
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancellingStaffReserva ? 'Cancelando…' : 'Confirmar cancelación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
