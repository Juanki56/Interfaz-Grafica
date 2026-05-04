import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../App';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  Filter,
  Mail,
  MapPin,
  Phone,
  Search,
  TreePine,
  Route as RouteIcon,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
  solicitudesPersonalizadasAPI,
  ventasAPI,
  type PagoCliente,
  type PagoSolicitud,
  type SolicitudPersonalizada,
  type Venta,
} from '../services/api';
import {
  clientPaymentFlowLabel,
  resolveClientPaymentFlowKind,
  type ClientPaymentFlowKind,
} from '../utils/clientPaymentFlow';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

type ClientBookingView = 'list' | 'detail';

type ClientBookingSummary = {
  id: string;
  saleId?: number | null;
  serviceType: 'Ruta' | 'Finca' | 'Servicio' | 'Reserva';
  serviceName: string;
  date: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  participants: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  specialRequests: string;
};

type ClientRequestSummary = {
  id: string;
  routeName: string;
  requestedDate: string;
  requestedTime: string;
  status: string;
  people: number;
  quoteAmount: number;
  reservationId: number | null;
  saleId: number | null;
  paymentStatus: string;
  pendingBalance: number;
  observations: string;
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
};

const CLIENT_RESUBMIT_PROOF_MAX = 5 * 1024 * 1024;
const CLIENT_RESUBMIT_PROOF_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

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

const normalizeInstallmentStatus = (status?: string | null) => {
  const key = String(status || '').trim().toLowerCase();
  if (key === 'pendiente') return 'Pendiente';
  if (key === 'verificado') return 'Verificado';
  if (key === 'aprobado') return 'Aprobado';
  if (key === 'rechazado') return 'Rechazado';
  return 'Pendiente';
};

const formatCurrency = (value?: number | string | null) =>
  `$${Number(value || 0).toLocaleString('es-CO')}`;

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return String(value).split('T')[0] || '—';
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

const getSolicitudStatusBadge = (status?: string | null) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized.includes('aprobadaparapago') || normalized.includes('aprobada')) {
    return <Badge className="bg-emerald-600 text-white">Pago habilitado</Badge>;
  }
  if (normalized.includes('convert')) {
    return <Badge className="bg-blue-600 text-white">Convertida</Badge>;
  }
  if (normalized.includes('rech')) {
    return <Badge className="bg-red-600 text-white">Rechazada</Badge>;
  }
  return <Badge className="bg-amber-500 text-white">Pendiente revisión</Badge>;
};

const solicitudHabilitadaParaPago = (status?: string | null) => {
  const normalized = String(status || '').trim().toLowerCase();
  return normalized === 'aprobadaparapago' || normalized === 'cotizada';
};

const formatDateTime = (date?: string | null, time?: string | null) => {
  const dateLabel = formatDate(date);
  if (!time) return dateLabel;
  return `${dateLabel} · ${String(time).slice(0, 5)}`;
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

export function ClientDashboardImproved() {
  const { user, adminActiveTab } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
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
  const [selectedRequest, setSelectedRequest] = useState<ClientRequestSummary | null>(null);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState<SolicitudPersonalizada | null>(null);
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
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isLoadingBookingDetail, setIsLoadingBookingDetail] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingRequestDetail, setIsLoadingRequestDetail] = useState(false);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [isLoadingSaleDetail, setIsLoadingSaleDetail] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isLoadingPaymentDetail, setIsLoadingPaymentDetail] = useState(false);
  const [isLoadingProgrammings, setIsLoadingProgrammings] = useState(false);
  const [isLoadingProgrammingDetail, setIsLoadingProgrammingDetail] = useState(false);
  const [isSubmittingRequestPayment, setIsSubmittingRequestPayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requestPaymentData, setRequestPaymentData] = useState({
    monto: '',
    metodo_pago: 'Transferencia',
    numero_transaccion: '',
    comprobante_url: '',
    observaciones: '',
  });
  const [resubmitPago, setResubmitPago] = useState({
    metodo_pago: 'Transferencia',
    numero_transaccion: '',
    observaciones: '',
  });
  const [resubmitProofName, setResubmitProofName] = useState('');
  const [resubmitProofDataUrl, setResubmitProofDataUrl] = useState('');
  const [resubmitProofMime, setResubmitProofMime] = useState('');
  const [isSubmittingResubmitPago, setIsSubmittingResubmitPago] = useState(false);

  useEffect(() => {
    if (!selectedPayment) {
      setResubmitPago({ metodo_pago: 'Transferencia', numero_transaccion: '', observaciones: '' });
      setResubmitProofName('');
      setResubmitProofDataUrl('');
      setResubmitProofMime('');
    }
  }, [selectedPayment]);

  useEffect(() => {
    if (adminActiveTab) {
      setActiveTab(adminActiveTab);
    }
  }, [adminActiveTab]);

  const loadBookings = async () => {
    if (!user?.id) {
      setBookings([]);
      return;
    }

    try {
      setIsLoadingBookings(true);
      const data = await reservasAPI.getByCliente(Number(user.id));
      const mapped: ClientBookingSummary[] = data.map((booking: any) => ({
        id: String(booking.id_reserva ?? booking.id ?? ''),
        serviceType: resolveServiceType(booking.tipo_servicio),
        serviceName: String(booking.tipo_servicio || 'Reserva'),
        date: formatDate(booking.fecha_reserva),
        status: normalizeReservationStatus(booking.estado),
        paymentStatus: normalizePaymentStatus(booking.estado_pago),
        paymentMethod: booking.metodo_pago || 'Por definir',
        participants: Number(booking.numero_participantes ?? 1),
        totalAmount: Number(booking.total ?? booking.monto_total ?? 0),
        paidAmount: Number(booking.monto_pagado ?? 0),
        pendingAmount: Number(booking.saldo_pendiente ?? booking.total ?? booking.monto_total ?? 0),
        specialRequests: booking.notas || '',
      }));
      setBookings(mapped);
    } catch (error) {
      console.error('Error al cargar las reservas del cliente:', error);
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const loadRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const data = await solicitudesPersonalizadasAPI.getMine();
      const mapped: ClientRequestSummary[] = data.map((request) => ({
        id: String(request.id_solicitud_personalizada),
        routeName: request.ruta_nombre || `Ruta #${request.id_ruta}`,
        requestedDate: formatDate(request.fecha_deseada),
        requestedTime: request.hora_deseada || '',
        status: normalizeSolicitudStatus(request.estado),
        people: Number(request.cantidad_personas || 1),
        quoteAmount: Number(request.precio_cotizado || request.reserva_monto_total || 0),
        reservationId: request.id_reserva != null ? Number(request.id_reserva) : null,
        saleId: request.id_venta != null ? Number(request.id_venta) : null,
        paymentStatus: normalizePaymentStatus(request.venta_estado_pago),
        pendingBalance: Number(request.venta_saldo_pendiente ?? request.reserva_monto_total ?? request.precio_cotizado ?? 0),
        observations: request.observaciones || '',
      }));
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
      const reservas = await reservasAPI.getByCliente(Number(user.id));
      const mapped: ClientSaleSummary[] = reservas
        .filter((booking: any) => Number(booking.id_venta ?? 0) > 0)
        .map((booking: any) => {
          const reservationId = Number(booking.id_reserva ?? booking.id ?? 0);
          const saleId = Number(booking.id_venta ?? 0);
          return {
            id: `VEN-${saleId}`,
            saleId,
            reservationId,
            serviceName: String(booking.tipo_servicio || `Reserva #${reservationId}`),
            serviceType: resolveServiceType(booking.tipo_servicio),
            date: formatDate(booking.fecha_reserva),
            total: Number(booking.total ?? booking.monto_total ?? 0),
            paid: Number(booking.monto_pagado ?? 0),
            pending: Number(booking.saldo_pendiente ?? booking.total ?? booking.monto_total ?? 0),
            paymentStatus: normalizePaymentStatus(booking.estado_pago),
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
      const reservas = await reservasAPI.getByCliente(Number(user.id));
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
        return {
          id: `PAG-${payment.id_pago}`,
          paymentId: Number(payment.id_pago),
          reservationId,
          saleId,
          serviceName: String(booking.tipo_servicio || `Reserva #${reservationId}`),
          serviceType: resolveServiceType(booking.tipo_servicio),
          paymentFlowKind: resolveClientPaymentFlowKind(booking),
          date: formatDate(payment.fecha_pago || payment.fecha_creacion),
          amount: Number(payment.monto ?? 0),
          status: normalizeInstallmentStatus(payment.estado),
          method: payment.metodo_pago || 'Por definir',
          receiptUrl: payment.comprobante_url || null,
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
      const reservas = await reservasAPI.getByCliente(Number(user.id));
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
        detail.programaciones.forEach((item: any) => {
          const programacionId = Number(item.id_programacion ?? 0);
          if (!programacionId) return;
          items.push({
            id: `PRO-${programacionId}-${detail.id_reserva}`,
            programacionId,
            reservationId: Number(detail.id_reserva),
            routeName: item.ruta_nombre || item.nombre_ruta || detail.tipo_servicio || `Programación #${programacionId}`,
            date: formatDate(item.fecha_programada || item.fecha_salida),
            startTime: String(item.hora_salida || '').slice(0, 5),
            people: Number(item.cantidad_personas ?? detail.numero_participantes ?? 1),
            subtotal: Number(item.subtotal ?? item.precio_programacion ?? item.precio_unitario ?? 0),
            meetingPoint: item.lugar_encuentro || 'Por confirmar',
            difficulty: item.dificultad || 'No definida',
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
    try {
      setIsLoadingBookingDetail(true);
      const detail = await reservasAPI.getById(Number(bookingId));
      setSelectedBookingDetail(detail);
    } catch (error) {
      console.error('Error al cargar detalle de reserva del cliente:', error);
      setSelectedBookingDetail(null);
    } finally {
      setIsLoadingBookingDetail(false);
    }
  };

  const loadRequestDetail = async (requestId: string) => {
    try {
      setIsLoadingRequestDetail(true);
      const [detail, payments] = await Promise.all([
        solicitudesPersonalizadasAPI.getById(Number(requestId)),
        solicitudesPersonalizadasAPI.listPagos(Number(requestId)),
      ]);
      setSelectedRequestDetail(detail);
      setSelectedRequestPayments(payments);
    } catch (error) {
      console.error('Error al cargar detalle de solicitud personalizada:', error);
      setSelectedRequestDetail(null);
      setSelectedRequestPayments([]);
    } finally {
      setIsLoadingRequestDetail(false);
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
      const [bookingDetail, programacionDetail] = await Promise.all([
        reservasAPI.getById(programming.reservationId),
        reservasAPI.getById(programming.reservationId)
          .then((detail) => {
            const item = Array.isArray(detail?.programaciones)
              ? detail.programaciones.find((entry: any) => Number(entry.id_programacion) === programming.programacionId)
              : null;
            return item || null;
          }),
      ]);
      setSelectedProgrammingBooking(bookingDetail);
      setSelectedProgrammingDetail(programacionDetail);
    } catch (error) {
      console.error('Error al cargar detalle de programación del cliente:', error);
      setSelectedProgrammingBooking(null);
      setSelectedProgrammingDetail(null);
    } finally {
      setIsLoadingProgrammingDetail(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'bookings') return;
    void loadBookings();
    void loadRequests();
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (activeTab !== 'sales') return;
    void loadSales();
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (activeTab !== 'payments') return;
    void loadPayments();
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (activeTab !== 'programming') return;
    void loadProgrammings();
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (activeTab !== 'bookings' || bookingsView !== 'detail' || !selectedBooking?.id) return;
    void loadBookingDetail(selectedBooking.id);
  }, [activeTab, bookingsView, selectedBooking?.id]);

  useEffect(() => {
    if (activeTab !== 'bookings' || !selectedRequest?.id) return;
    void loadRequestDetail(selectedRequest.id);
  }, [activeTab, selectedRequest?.id]);

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
    const query = searchTerm.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesSearch =
        !query ||
        booking.serviceName.toLowerCase().includes(query) ||
        booking.id.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

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

  const openDetailView = (booking: ClientBookingSummary) => {
    setSelectedBooking(booking);
    setSelectedRequest(null);
    setSelectedBookingDetail(null);
    setBookingsView('detail');
  };

  const openRequestDetail = (request: ClientRequestSummary) => {
    setSelectedRequest(request);
    setSelectedBooking(null);
    setSelectedRequestDetail(null);
    setSelectedRequestPayments([]);
    setRequestPaymentData({
      monto: '',
      metodo_pago: 'Transferencia',
      numero_transaccion: '',
      comprobante_url: '',
      observaciones: '',
    });
    setBookingsView('detail');
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
    setProgrammingView('detail');
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
      toast.error('Solo se permiten PDF, JPG o PNG.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setResubmitProofDataUrl(String(reader.result || ''));
      setResubmitProofName(file.name);
      setResubmitProofMime(file.type || 'application/octet-stream');
    };
    reader.onerror = () => {
      toast.error('No se pudo leer el archivo.');
      event.target.value = '';
    };
    reader.readAsDataURL(file);
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
    setIsSubmittingResubmitPago(true);
    try {
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
          comprobante_url: resubmitProofDataUrl.trim(),
          comprobante_nombre: resubmitProofName || 'comprobante',
          comprobante_tipo: resubmitProofMime || 'application/octet-stream',
          observaciones,
        });
        toast.success('Comprobante reenviado', {
          description: 'Registramos un nuevo abono pendiente de revisión. Revísalo en la lista de Mis abonos.',
        });
      } else {
        await reservasAPI.pagarCompleto(selectedPayment.reservationId, {
          metodo_pago: resubmitPago.metodo_pago || null,
          numero_transaccion: resubmitPago.numero_transaccion.trim() || null,
          comprobante_url: resubmitProofDataUrl.trim(),
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
      const canUploadPayment =
        detail &&
        solicitudHabilitadaParaPago(detail.estado) &&
        detail.id_solicitud_personalizada &&
        detail.id_venta != null &&
        String(detail.venta_estado_pago || '') !== 'Pagado';

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
                setSelectedRequestPayments([]);
                setBookingsView('list');
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a mis reservas
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Ruta solicitada</p>
                  <p className="text-lg font-semibold text-green-800">{selectedRequest.routeName}</p>
                </div>
                <RouteIcon className="h-8 w-8 text-blue-600" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Personas</p>
                  <p className="text-2xl font-semibold text-green-800">{selectedRequest.people}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Cotización</p>
                  <p className="text-xl font-semibold text-green-800">{formatCurrency(detail?.precio_cotizado ?? selectedRequest.quoteAmount)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <div className="mt-2">{getSolicitudStatusBadge(detail?.estado || selectedRequest.status)}</div>
                </div>
                <CreditCard className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de la solicitud</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-gray-600">Fecha solicitada</p>
                      <p className="font-medium">{formatDateTime(detail?.fecha_deseada, detail?.hora_deseada)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Reserva asociada</p>
                      <p className="font-medium">{detail?.id_reserva != null ? `#${detail.id_reserva}` : 'Aún no disponible'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Venta asociada</p>
                      <p className="font-medium">{detail?.id_venta != null ? `#${detail.id_venta}` : 'Aún no disponible'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estado del pago</p>
                      <div className="mt-1">{getPaymentStatusBadge(detail?.venta_estado_pago || selectedRequest.paymentStatus)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Saldo pendiente</p>
                      <p className="font-medium">{formatCurrency(detail?.venta_saldo_pendiente ?? selectedRequest.pendingBalance)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Punto de encuentro</p>
                      <p className="font-medium">{detail?.lugar_encuentro || 'Lo define el asesor al programar la salida'}</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">Observaciones</p>
                    <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
                      {detail?.observaciones || selectedRequest.observations || 'Sin observaciones registradas.'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                    {solicitudHabilitadaParaPago(detail?.estado)
                      ? 'Tu solicitud ya está habilitada para pago. Puedes subir el comprobante aquí mismo.'
                      : 'Tu solicitud sigue en revisión. Cuando el asesor habilite el pago, aquí aparecerá el formulario para subir el comprobante.'}
                  </div>
                </CardContent>
              </Card>

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
              <Card>
                <CardHeader>
                  <CardTitle>Subir comprobante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {canUploadPayment ? (
                    <>
                      <div>
                        <Label>Monto</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={requestPaymentData.monto}
                          onChange={(e) => setRequestPaymentData((prev) => ({ ...prev, monto: e.target.value }))}
                          placeholder={String(detail?.venta_saldo_pendiente ?? detail?.precio_cotizado ?? 0)}
                        />
                      </div>
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
                      <div>
                        <Label>URL del comprobante</Label>
                        <Input
                          value={requestPaymentData.comprobante_url}
                          onChange={(e) => setRequestPaymentData((prev) => ({ ...prev, comprobante_url: e.target.value }))}
                          placeholder="Pega aquí el link del comprobante"
                        />
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
                        disabled={isSubmittingRequestPayment}
                        onClick={async () => {
                          try {
                            if (!detail?.id_solicitud_personalizada) return;
                            const monto = Number(
                              requestPaymentData.monto || detail.venta_saldo_pendiente || detail.precio_cotizado || 0
                            );
                            if (!Number.isFinite(monto) || monto <= 0) {
                              toast.error('Monto inválido');
                              return;
                            }
                            if (!requestPaymentData.comprobante_url.trim()) {
                              toast.error('Debes pegar la URL del comprobante');
                              return;
                            }

                            setIsSubmittingRequestPayment(true);
                            await solicitudesPersonalizadasAPI.crearPago(detail.id_solicitud_personalizada, {
                              monto,
                              metodo_pago: requestPaymentData.metodo_pago || null,
                              numero_transaccion: requestPaymentData.numero_transaccion.trim() || null,
                              comprobante_url: requestPaymentData.comprobante_url.trim(),
                              observaciones: requestPaymentData.observaciones.trim() || null,
                            });

                            await Promise.all([loadRequests(), loadRequestDetail(selectedRequest.id)]);
                            setRequestPaymentData({
                              monto: '',
                              metodo_pago: 'Transferencia',
                              numero_transaccion: '',
                              comprobante_url: '',
                              observaciones: '',
                            });
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
      return (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Detalle de mi reserva</h3>
              <p className="text-sm text-gray-600">Reserva #{selectedBooking.id}</p>
            </div>
            <Button variant="outline" onClick={() => setBookingsView('list')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a mis reservas
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-gray-600">Servicio</p>
                  <p className="text-lg font-semibold text-green-800">{selectedBooking.serviceName}</p>
                </div>
                {selectedBooking.serviceType === 'Ruta' ? (
                  <RouteIcon className="h-8 w-8 text-blue-600" />
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

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Información de la reserva</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-gray-600">Tipo de servicio</p>
                      <p className="font-medium">{selectedBooking.serviceType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fecha</p>
                      <p className="font-medium">{selectedBooking.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estado</p>
                      <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pagado</p>
                      <p className="font-medium">{formatCurrency(selectedBooking.paidAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Saldo pendiente</p>
                      <p className="font-medium">{formatCurrency(selectedBooking.pendingAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Método de pago</p>
                      <p className="font-medium">{selectedBooking.paymentMethod}</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">Observaciones</p>
                    <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
                      {selectedBookingDetail?.notas || selectedBooking.specialRequests || 'Sin observaciones registradas.'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {Array.isArray(selectedBookingDetail?.programaciones) && selectedBookingDetail.programaciones.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Programación asociada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID programación</TableHead>
                          <TableHead>Personas</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBookingDetail.programaciones.map((item: any) => (
                          <TableRow key={item.id_detalle_reserva_programacion || `${item.id_programacion}-${item.subtotal}`}>
                            <TableCell>{item.id_programacion}</TableCell>
                            <TableCell>{item.cantidad_personas}</TableCell>
                            <TableCell>{formatCurrency(item.precio_programacion || item.precio_unitario)}</TableCell>
                            <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

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
                          <TableHead>Check-in</TableHead>
                          <TableHead>Check-out</TableHead>
                          <TableHead>Noches</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBookingDetail.fincas.map((item: any) => (
                          <TableRow key={item.id_detalle_reserva_finca || `${item.id_finca}-${item.subtotal}`}>
                            <TableCell>{item.nombre_finca || `Finca #${item.id_finca}`}</TableCell>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Servicios incluidos</CardTitle>
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
                        {selectedBookingDetail.servicios.map((item: any) => (
                          <TableRow key={item.id_detalle_reserva_servicio || `${item.id_servicio}-${item.subtotal}`}>
                            <TableCell>{item.nombre_servicio || item.servicio_nombre || `Servicio #${item.id_servicio}`}</TableCell>
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

              <Card>
                <CardHeader>
                  <CardTitle>Acompañantes</CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(selectedBookingDetail?.acompanantes) && selectedBookingDetail.acompanantes.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Documento</TableHead>
                          <TableHead>Teléfono</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBookingDetail.acompanantes.map((acompanante: any) => (
                          <TableRow key={acompanante.id_detalle_reserva_acompanante}>
                            <TableCell>{`${acompanante.nombre || ''} ${acompanante.apellido || ''}`.trim()}</TableCell>
                            <TableCell>
                              {acompanante.tipo_documento || '—'} {acompanante.numero_documento || ''}
                            </TableCell>
                            <TableCell>{acompanante.telefono || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-gray-500">No hay acompañantes registrados en esta reserva.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Seguimiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Creada el</p>
                    <p className="font-medium">{formatDate(selectedBookingDetail?.fecha_creacion)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Actualizada el</p>
                    <p className="font-medium">{formatDate(selectedBookingDetail?.fecha_actualizacion)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pago</p>
                    <div className="mt-1">{getPaymentStatusBadge(selectedBooking.paymentStatus)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reserva</p>
                    <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
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

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Buscar</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Servicio o ID de reserva..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <div className="mt-1">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
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
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis Reservas</CardTitle>
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
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-gray-500">
                      {isLoadingBookings ? 'Cargando reservas...' : 'No tienes reservas registradas.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {booking.serviceType === 'Ruta' ? (
                            <RouteIcon className="h-4 w-4 text-blue-600" />
                          ) : (
                            <TreePine className="h-4 w-4 text-green-600" />
                          )}
                          <span className="font-medium">{booking.serviceType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.serviceName}</p>
                          <p className="text-xs text-gray-500">Reserva #{booking.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>{booking.date}</TableCell>
                      <TableCell>{booking.participants}</TableCell>
                      <TableCell>{formatCurrency(booking.totalAmount)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(booking.paymentStatus)}</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openDetailView(booking)}>
                          Ver detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis solicitudes personalizadas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Fecha solicitada</TableHead>
                  <TableHead>Personas</TableHead>
                  <TableHead>Cotización</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-gray-500">
                      {isLoadingRequests ? 'Cargando solicitudes...' : 'No tienes solicitudes personalizadas registradas.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.routeName}</p>
                          <p className="text-xs text-gray-500">Solicitud #{request.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(request.requestedDate, request.requestedTime)}</TableCell>
                      <TableCell>{request.people}</TableCell>
                      <TableCell>{formatCurrency(request.quoteAmount)}</TableCell>
                      <TableCell>{getSolicitudStatusBadge(request.status)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(request.paymentStatus)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openRequestDetail(request)}>
                          Continuar solicitud
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
                {sales.length > 0 ? sales.map((sale) => (
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
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-gray-500">
                      {isLoadingSales ? 'Cargando ventas...' : 'No tienes ventas registradas.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
                  <div><p className="text-sm text-gray-600">Estado de la venta</p><div className="mt-1">{getPaymentStatusBadge(selectedPaymentSale?.estado_pago || 'Pendiente')}</div></div>
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
                <strong>habilita el pago</strong> y recién ahí subes el comprobante desde el detalle de la solicitud.
              </li>
            </ul>
          </CardContent>
        </Card>

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
                {payments.length > 0 ? payments.map((payment) => (
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
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-gray-500">
                      {isLoadingPayments ? 'Cargando abonos...' : 'Aún no tienes abonos registrados.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
              <p className="text-sm text-gray-600">Programación #{selectedProgramming.programacionId}</p>
            </div>
            <Button variant="outline" onClick={() => {
              setSelectedProgramming(null);
              setSelectedProgrammingDetail(null);
              setSelectedProgrammingBooking(null);
              setProgrammingView('list');
            }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a mis programaciones
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Ruta</p><p className="text-lg font-semibold text-green-800">{detail?.nombre_ruta || selectedProgramming.routeName}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Fecha</p><p className="text-lg font-semibold text-green-800">{selectedProgramming.date}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Personas</p><p className="text-2xl font-semibold text-green-800">{selectedProgramming.people}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-600">Subtotal</p><p className="text-xl font-semibold text-green-800">{formatCurrency(selectedProgramming.subtotal)}</p></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <Card>
                <CardHeader><CardTitle>Resumen de la salida</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div><p className="text-sm text-gray-600">ID programación</p><p className="font-medium">{selectedProgramming.programacionId}</p></div>
                  <div><p className="text-sm text-gray-600">Reserva asociada</p><p className="font-medium">#{selectedProgramming.reservationId}</p></div>
                  <div><p className="text-sm text-gray-600">Hora de salida</p><p className="font-medium">{selectedProgramming.startTime || 'Por definir'}</p></div>
                  <div><p className="text-sm text-gray-600">Punto de encuentro</p><p className="font-medium">{detail?.lugar_encuentro || selectedProgramming.meetingPoint}</p></div>
                  <div><p className="text-sm text-gray-600">Dificultad</p><p className="font-medium">{detail?.dificultad || selectedProgramming.difficulty}</p></div>
                  <div><p className="text-sm text-gray-600">Estado de la reserva</p><div className="mt-1">{getStatusBadge(selectedProgrammingBooking?.estado || 'Pendiente')}</div></div>
                </CardContent>
              </Card>

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

        <Card>
          <CardHeader><CardTitle>Mis programaciones</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Personas</TableHead>
                  <TableHead>Punto de encuentro</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programmings.length > 0 ? programmings.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">#{item.programacionId}</TableCell>
                    <TableCell>{item.routeName}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.startTime || '—'}</TableCell>
                    <TableCell>{item.people}</TableCell>
                    <TableCell>{item.meetingPoint}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openProgrammingDetail(item)}>
                        Ver detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-gray-500">
                      {isLoadingProgrammings ? 'Cargando programaciones...' : 'Todavía no tienes programaciones activas.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
