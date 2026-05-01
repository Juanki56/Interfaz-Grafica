import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { programacionAPI, reservasAPI, clientesAPI, rutasAPI, fincasAPI } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';

type StaffView = 'list' | 'create' | 'edit' | 'detail';

type BookingRecord = {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  packageName: string;
  serviceTypeForm: 'ruta' | 'finca';
  date: string;
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
};

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
  programacionId: '',
  companions: 0,
  total: 0,
  status: 'Pendiente',
  specialRequests: '',
  checkIn: '',
  checkOut: '',
  nights: 1,
  nightlyPrice: 0,
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

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRouteDetail, setIsLoadingRouteDetail] = useState(false);
  const [isLoadingProgramacionesRuta, setIsLoadingProgramacionesRuta] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [reservaDetalle, setReservaDetalle] = useState<any>(null);
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

  const filteredProgramacionesRuta = useMemo(() => {
    if (formData.serviceType !== 'ruta' || !formData.routeId) return [];
    return programacionesRuta.filter((programacion) => {
      if (programacion.routeId !== formData.routeId) return false;
      return true;
    });
  }, [programacionesRuta, formData.serviceType, formData.routeId]);

  const selectedProgramacion = useMemo(
    () => filteredProgramacionesRuta.find((item) => item.id === formData.programacionId) || null,
    [filteredProgramacionesRuta, formData.programacionId]
  );

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

  const resolveRouteIdFromReservaDetalle = (payload: any): number | null => {
    const candidates = [
      payload?.id_ruta,
      payload?.ruta?.id_ruta,
      payload?.programacion?.id_ruta,
      payload?.programacion?.ruta?.id_ruta,
      payload?.programaciones?.[0]?.id_ruta,
      payload?.programaciones?.[0]?.ruta?.id_ruta,
      payload?.detalle_programacion?.id_ruta,
    ];
    for (const candidate of candidates) {
      const value = Number(candidate);
      if (Number.isFinite(value) && value > 0) return value;
    }
    return null;
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

  const loadReservas = async () => {
    try {
      setIsLoading(true);
      const data = await reservasAPI.getAll();
      const reservasMapeadas: BookingRecord[] = data.map((r: any) => {
        const tipoServicio = String(r.tipo_servicio || 'Reserva');
        const serviceTypeForm = tipoServicio.toLowerCase().includes('finca') ? 'finca' : 'ruta';
        const total = Number(r.total ?? r.monto_total ?? 0);
        return {
          id: String(r.id_reserva ?? r.id ?? ''),
          clientId: String(r.id_cliente ?? ''),
          clientName: `${r.cliente_nombre || ''} ${r.cliente_apellido || ''}`.trim() || 'Cliente',
          clientEmail: r.cliente_email || r.correo || '',
          clientPhone: r.cliente_telefono || r.telefono || '',
          packageName: tipoServicio,
          serviceTypeForm,
          date: formatDate(r.fecha_reserva),
          participants: Number(r.numero_participantes ?? 1),
          adults: 1,
          children: Math.max(0, Number(r.numero_participantes ?? 1) - 1),
          status: normalizeReservationStatus(r.estado),
          paymentStatus: normalizePaymentStatus(r.estado_pago),
          paymentMethod: r.metodo_pago || 'Por definir',
          total,
          paidAmount: Number(r.monto_pagado ?? 0),
          pendingAmount: Number(r.saldo_pendiente ?? total),
          specialRequests: r.notas || '',
        };
      });
      setBookings(reservasMapeadas);
    } catch (error) {
      console.error('Error al cargar reservas:', error);
      toast.error('No se pudieron cargar las reservas.');
      setBookings([]);
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
      const data = await fincasAPI.getAll();
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
      const data = await programacionAPI.getAll();
      const mapped = (data || [])
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
    try {
      setIsLoadingDetail(true);
      const detalle = await reservasAPI.getById(idReserva);
      setReservaDetalle(detalle);

      const idProgramacion = resolveProgramacionIdFromReservaDetalle(detalle);
      setDetalleProgramacionId(idProgramacion ? String(idProgramacion) : '');

      const idRuta = resolveRouteIdFromReservaDetalle(detalle);
      if (!idRuta) {
        setDetalleRuta(null);
        setDetalleOpcionalesSeleccion({});
        return;
      }

      const ruta = await rutasAPI.getById(idRuta);
      setDetalleRuta(ruta);
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
    } catch (error) {
      console.error('Error al cargar detalle de reserva:', error);
      toast.error('No se pudo cargar el detalle completo de la reserva.');
      setReservaDetalle(null);
      setDetalleRuta(null);
      setDetalleOpcionalesSeleccion({});
    } finally {
      setIsLoadingDetail(false);
    }
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
    if (activeView !== 'detail') return;
    const idReserva = Number(selectedBooking?.id);
    if (!Number.isFinite(idReserva) || idReserva <= 0) return;
    void loadReservaDetail(idReserva);
  }, [activeView, selectedBooking?.id]);

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
    const totalCalculado = Math.max(0, Number(selectedProgramacion?.price || 0)) * participantTotal + formOptionalServicesTotal;
    if (Number(formData.total || 0) === totalCalculado) return;
    setFormData((prev) => ({ ...prev, total: totalCalculado }));
  }, [formData.serviceType, selectedProgramacion?.price, participantTotal, formOptionalServicesTotal]);

  useEffect(() => {
    if (formData.serviceType !== 'ruta') return;
    if (!formData.programacionId) return;
    const stillValid = filteredProgramacionesRuta.some((programacion) => programacion.id === formData.programacionId);
    if (stillValid) return;
    setFormData((prev) => ({ ...prev, programacionId: '' }));
  }, [filteredProgramacionesRuta, formData.serviceType, formData.programacionId]);

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
        booking.id.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      const matchesDate = !dateFilter || booking.date === dateFilter;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bookings, searchTerm, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / itemsPerPage));
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const dashboardStats = useMemo(() => {
    return {
      total: bookings.length,
      confirmed: bookings.filter((booking) => booking.status === 'Confirmada').length,
      pending: bookings.filter((booking) => booking.status === 'Pendiente').length,
      totalAmount: bookings.reduce((sum, booking) => sum + booking.total, 0),
      pendingAmount: bookings.reduce((sum, booking) => sum + booking.pendingAmount, 0),
    };
  }, [bookings]);

  const goBackToList = () => {
    setActiveView('list');
    setSelectedBooking(null);
    setReservaDetalle(null);
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
    });
    setActiveView('edit');
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

        if (!selectedProgramacion) {
          throw new Error('Selecciona una programación disponible para esa ruta.');
        }
        if (Number(selectedProgramacion.availableSeats || 0) < participantTotal) {
          throw new Error('La programación seleccionada no tiene cupos suficientes para esa cantidad de personas.');
        }

        const idProgramacion = Number(selectedProgramacion.id);

        await reservasAPI.agregarProgramacion(idReserva, {
          id_programacion: idProgramacion,
          cantidad_personas: participantTotal,
          precio_unitario: Number(selectedProgramacion.price || 0),
        });

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
      await loadReservas();
      setSelectedBooking({
        id: String(idReserva),
        clientId: formData.clientId,
        clientName: selectedClient?.name || formData.clientName || 'Cliente',
        clientEmail: selectedClient?.email || '',
        clientPhone: selectedClient?.phone || '',
        packageName: formData.serviceType === 'ruta' ? 'Ruta' : 'Finca',
        serviceTypeForm: formData.serviceType,
        date: formData.bookingDate,
        participants: participantTotal,
        adults: 1,
        children: Math.max(0, Number(formData.companions || 0)),
        status: 'Pendiente',
        paymentStatus: 'Pendiente',
        paymentMethod: 'Por definir',
        total: Number(formData.total || 0),
        paidAmount: 0,
        pendingAmount: Number(formData.total || 0),
        specialRequests: formData.specialRequests || '',
      });
      resetForm();
      setActiveView('detail');
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

    try {
      setIsLoading(true);
      await reservasAPI.update(Number(selectedBooking.id), {
        id_cliente: Number(formData.clientId),
        fecha_reserva: formData.bookingDate,
        estado: formData.status,
        total: Number(formData.total) || 0,
        notas: formData.specialRequests || '',
      });

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
      await loadReservas();
      setActiveView('detail');
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

    try {
      if (newStatus === 'Cancelada') {
        await reservasAPI.cancelar(Number(bookingId), 'Cancelación solicitada desde gestión de reservas');
      } else {
        await reservasAPI.update(Number(bookingId), { estado: newStatus });
      }
      toast.success(`Estado actualizado a ${newStatus}.`);
      await loadReservas();
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev) => (prev ? { ...prev, status: newStatus } : prev));
      }
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      toast.error(error?.message || 'No se pudo actualizar el estado.');
    }
  };

  const handleDeleteBooking = async () => {
    if (!canDeleteReservas || !selectedBooking?.id) {
      toast.error('No tienes permiso para eliminar reservas.');
      return;
    }

    try {
      setIsLoading(true);
      await reservasAPI.delete(Number(selectedBooking.id));
      toast.success('Reserva eliminada correctamente.');
      setIsDeleteDialogOpen(false);
      await loadReservas();
      goBackToList();
    } catch (error: any) {
      console.error('Error al eliminar reserva:', error);
      toast.error(error?.message || 'No se pudo eliminar la reserva.');
    } finally {
      setIsLoading(false);
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
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <Label>Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Cliente, servicio o ID..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Confirmada">Confirmada</SelectItem>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Cancelada">Cancelada</SelectItem>
                      <SelectItem value="Completada">Completada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setDateFilter('');
                      setCurrentPage(1);
                    }}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-green-800">
                Reservas ({filteredBookings.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Fecha</TableHead>
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
                          {isLoading ? 'Cargando reservas...' : 'No hay reservas para mostrar.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{booking.clientName}</p>
                              <p className="text-xs text-gray-500">{booking.clientEmail || 'Sin correo'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{booking.packageName}</p>
                              <p className="text-xs text-gray-500">Reserva #{booking.id}</p>
                            </div>
                          </TableCell>
                          <TableCell>{booking.date}</TableCell>
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
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setIsDeleteDialogOpen(true);
                                  }}
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
                  Mostrando {filteredBookings.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} a{' '}
                  {Math.min(currentPage * itemsPerPage, filteredBookings.length)} de {filteredBookings.length} reservas
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
                      <Label>Cliente *</Label>
                      <Select
                        value={formData.clientId}
                        onValueChange={(value) => {
                          const client = clientes.find((item) => item.id === value);
                          setFormData((prev) => ({
                            ...prev,
                            clientId: value,
                            clientName: client?.name || '',
                          }));
                        }}
                      >
                        <SelectTrigger className="bg-gray-50">
                          <SelectValue placeholder="Seleccione un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} {client.document ? `- ${client.document}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          setFormData((prev) => ({ ...prev, status: value }));
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
                          <div>
                            <Label>Ruta *</Label>
                            <Select
                              value={formData.routeId}
                              onValueChange={(value) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  routeId: value,
                                  farmId: '',
                                  programacionId: '',
                                }));
                              }}
                            >
                              <SelectTrigger className="bg-gray-50">
                                <SelectValue placeholder="Seleccione una ruta" />
                              </SelectTrigger>
                              <SelectContent>
                                {rutas.map((route) => (
                                  <SelectItem key={route.id} value={route.id}>
                                    {route.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div>
                            <Label>Finca *</Label>
                            <Select
                              value={formData.farmId}
                              onValueChange={(value) => {
                                const finca = fincas.find((item) => item.id === value);
                                setFormData((prev) => ({
                                  ...prev,
                                  farmId: value,
                                  routeId: '',
                                  nightlyPrice: Number(finca?.price || 0),
                                  total: Number(finca?.price || 0) * Number(prev.nights || 1),
                                }));
                              }}
                            >
                              <SelectTrigger className="bg-gray-50">
                                <SelectValue placeholder="Seleccione una finca" />
                              </SelectTrigger>
                              <SelectContent>
                                {fincas.map((farm) => (
                                  <SelectItem key={farm.id} value={farm.id}>
                                    {farm.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {formData.serviceType === 'ruta' ? (
                        <>
                          <div>
                            <Label>Salida programada *</Label>
                            <Select
                              value={formData.programacionId}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  programacionId: value,
                                }))
                              }
                            >
                              <SelectTrigger className="bg-gray-50">
                                <SelectValue placeholder="Selecciona una programación disponible" />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredProgramacionesRuta.map((programacion) => (
                                  <SelectItem key={programacion.id} value={programacion.id}>
                                    {`${programacion.routeName} • ${programacion.date}${programacion.startTime ? ` ${programacion.startTime}` : ''} • ${programacion.availableSeats}/${programacion.totalSeats} cupos${programacion.availableSeats < participantTotal ? ' • Cupo insuficiente' : ''}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="mt-1 text-xs text-gray-500">
                              {isLoadingProgramacionesRuta
                                ? 'Cargando salidas operativas...'
                                : filteredProgramacionesRuta.length > 0
                                  ? 'Elige la salida operativa real donde quedará registrada la reserva.'
                                  : 'No hay programaciones operativas registradas para esta ruta.'}
                            </p>
                          </div>

                          {selectedProgramacion && (
                            <div className="grid grid-cols-1 gap-4 rounded-lg border bg-green-50 p-4 md:grid-cols-4">
                              <div>
                                <p className="text-xs text-gray-500">Fecha salida</p>
                                <p className="font-medium text-gray-900">{selectedProgramacion.date}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Hora</p>
                                <p className="font-medium text-gray-900">{selectedProgramacion.startTime || 'Por definir'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Punto encuentro</p>
                                <p className="font-medium text-gray-900">{selectedProgramacion.meetingPoint}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Cupos</p>
                                <p className={`font-medium ${selectedProgramacion.availableSeats < participantTotal ? 'text-red-700' : 'text-gray-900'}`}>
                                  {selectedProgramacion.availableSeats} disponibles de {selectedProgramacion.totalSeats}
                                </p>
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
                        Registra aquí a las {companionDetails.length} personas adicionales de la reserva.
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
                              <Label>Número de documento</Label>
                              <Input
                                value={companion.numero_documento}
                                onChange={(e) => updateCompanionField(index, 'numero_documento', e.target.value)}
                                className="bg-white"
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
                      <p className="text-sm text-gray-600">Participantes</p>
                      <p className="font-medium text-gray-900">{participantTotal}</p>
                    </div>
                    {activeView === 'create' && formData.serviceType === 'ruta' && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600">Programación seleccionada</p>
                          <p className="font-medium text-gray-900">
                            {selectedProgramacion
                              ? `#${selectedProgramacion.id} · ${selectedProgramacion.date}`
                              : 'Sin seleccionar'}
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
                    <p>Para rutas manuales, primero se elige una programación operativa real; ya no se escribe el ID a mano.</p>
                    <p>El total de una ruta se calcula con el precio de la programación seleccionada y los opcionales agregados.</p>
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
                    {getPaymentStatusBadge(reservaDetalle?.estado_pago || selectedBooking.paymentStatus)}
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
                        {resolveRouteIdFromReservaDetalle(reservaDetalle) || '—'}
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
                          <TableHead>ID programación</TableHead>
                          <TableHead>Personas</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reservaDetalle.programaciones.map((item: any) => (
                          <TableRow
                            key={item.id_detalle_reserva_programacion || `${item.id_programacion}-${item.subtotal}`}
                          >
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
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar reserva
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">¿Eliminar reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la reserva de{' '}
              <span className="font-semibold">{selectedBooking?.clientName || 'este cliente'}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBooking}
              disabled={!canDeleteReservas || isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
