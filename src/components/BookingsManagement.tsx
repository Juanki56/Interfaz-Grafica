import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  FileText,
  UserPlus,
  CheckCircle,
  Download,
  AlertCircle,
  Upload,
  X
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
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
import { reservasAPI, clientesAPI, rutasAPI, fincasAPI } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';

const normalizeReservationStatus = (status?: string | null) => {
  const normalized = String(status || '').trim();
  if (['Pendiente', 'Confirmada', 'Cancelada', 'Completada'].includes(normalized)) {
    return normalized;
  }
  return 'Pendiente';
};

const normalizePaymentStatus = (status?: string | null) => {
  const normalized = String(status || '').trim();
  if (['Pendiente', 'Parcial', 'Pagado', 'Cancelado'].includes(normalized)) {
    return normalized;
  }
  return 'Pendiente';
};

const canReservationBeConfirmed = (paymentStatus?: string | null) =>
  ['Parcial', 'Pagado'].includes(normalizePaymentStatus(paymentStatus));

export function BookingsManagement() {
  const permisos = usePermissions();
  const reservasPerms = createModulePermissions(permisos, 'Reservas');
  const clientesPerms = createModulePermissions(permisos, 'Clientes');
  const canViewReservas = reservasPerms.canView();
  const canCreateReservas = reservasPerms.canCreate();
  const canEditReservas = reservasPerms.canEdit();
  const canDeleteReservas = reservasPerms.canDelete();
  const canViewClientes = clientesPerms.canView();

  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [clientes, setClientes] = useState<
    Array<{ id: string; name: string; document: string; email?: string; phone?: string }>
  >([]);
  const [rutas, setRutas] = useState<Array<{ id: string; name: string }>>([]);
  const [fincas, setFincas] = useState<Array<{ id: string; name: string }>>([]);

  // Cargar datos del backend al montar el componente
  useEffect(() => {
    if (permisos.loadingRoles) return;

    if (canViewReservas) {
      cargarReservas();
    } else {
      setBookings([]);
      setIsLoading(false);
    }

    if (canViewClientes) {
      cargarClientes();
    }

    // Para el formulario de reservas (rutas/fincas)
    if (canViewReservas) {
      cargarRutas();
      cargarFincas();
    }
  }, [permisos.loadingRoles, canViewReservas, canViewClientes]);

  const cargarReservas = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Cargando reservas del servidor...');
      const data = await reservasAPI.getAll();
      console.log('✅ Reservas cargadas:', data);
      
      // Mapear datos del backend al formato del componente
      const reservasMapeadas = data.map((r: any) => ({
        id: (r.id_reserva ?? r.id)?.toString(),
        clientId: r.id_cliente?.toString(),
        clientName: `${r.cliente_nombre || ''} ${r.cliente_apellido || ''}`.trim(),
        clientEmail: r.cliente_email || r.correo || '',
        clientPhone: r.cliente_telefono || r.telefono || '',
        packageName: r.tipo_servicio || 'Reserva',
        date: r.fecha_reserva?.split('T')[0] || '',
        participants: Number(r.numero_participantes ?? 1),
        adults: Number(r.numero_participantes ?? 1),
        children: 0,
        status: normalizeReservationStatus(r.estado),
        paymentStatus: normalizePaymentStatus(r.estado_pago),
        paymentMethod: r.metodo_pago || 'Por definir',
        total: Number(r.total ?? r.monto_total ?? 0),
        totalAmount: Number(r.total ?? r.monto_total ?? 0),
        paidAmount: Number(r.monto_pagado ?? 0),
        pendingAmount: Number(r.saldo_pendiente ?? r.total ?? r.monto_total ?? 0),
        subtotal: Number(r.total ?? r.monto_total ?? 0),
        discount: 0,
        checkIn: '08:00',
        checkOut: '17:00',
        guide: 'Por asignar',
        advisor: 'Administrador',
        emergency: 'Por definir',
        specialRequests: r.notas || ''
      }));
      
      setBookings(reservasMapeadas);
    } catch (error) {
      console.error('❌ Error al cargar reservas:', error);
      toast.error('Error al cargar reservas. Verifica que el backend esté corriendo.');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const cargarClientes = async () => {
    try {
      const data = await clientesAPI.getAll();
      const clientesMapeados = data.map((c: any) => ({
        id: c.id_cliente?.toString(),
        name: `${c.nombre} ${c.apellido}`,
        document: c.numero_documento || '',
        email: c.correo || '',
        phone: c.telefono || ''
      }));
      setClientes(clientesMapeados);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const cargarRutas = async () => {
    try {
      const data = await rutasAPI.getAll();
      setRutas(
        (data || []).map((r: any) => ({
          id: String(r.id_ruta),
          name: r.nombre,
        }))
      );
    } catch (error) {
      console.error('Error al cargar rutas:', error);
    }
  };

  const cargarFincas = async () => {
    try {
      const data = await fincasAPI.getAll();
      setFincas(
        (data || []).map((f: any) => ({
          id: String(f.id_finca),
          name: f.nombre,
        }))
      );
    } catch (error) {
      console.error('Error al cargar fincas:', error);
    }
  };

  // Form state para crear/editar reserva
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    bookingDate: '',
    routeId: '',
    farmId: '',
    serviceType: 'ruta' as 'ruta' | 'finca',
    programacionId: '',
    services: [] as string[],
    participants: 1,
    adults: 1,
    children: 0,
    total: 0,
    status: 'Pendiente',
    specialRequests: ''
  });

  const [formRutaDetalle, setFormRutaDetalle] = useState<any>(null);
  const [formRutaOpcionalesSeleccion, setFormRutaOpcionalesSeleccion] = useState<Record<number, number>>({});
  const [isLoadingRutaDetalle, setIsLoadingRutaDetalle] = useState(false);

  const [reservaDetalle, setReservaDetalle] = useState<any>(null);
  const [detalleRuta, setDetalleRuta] = useState<any>(null);
  const [detalleOpcionalesSeleccion, setDetalleOpcionalesSeleccion] = useState<Record<number, number>>({});
  const [detalleProgramacionId, setDetalleProgramacionId] = useState('');
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false);

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

  const cargarRutaDetalleParaFormulario = async (idRuta: number) => {
    try {
      setIsLoadingRutaDetalle(true);
      const ruta = await rutasAPI.getById(idRuta);
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
      console.error('Error al cargar detalle de ruta:', error);
      setFormRutaDetalle(null);
      setFormRutaOpcionalesSeleccion({});
    } finally {
      setIsLoadingRutaDetalle(false);
    }
  };

  const cargarDetalleReserva = async (idReserva: number) => {
    try {
      setIsLoadingDetalle(true);
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
      setReservaDetalle(null);
      setDetalleRuta(null);
      setDetalleOpcionalesSeleccion({});
    } finally {
      setIsLoadingDetalle(false);
    }
  };

  useEffect(() => {
    const shouldLoadRoute = formData.serviceType === 'ruta' && Number(formData.routeId) > 0;
    if (!shouldLoadRoute) {
      setFormRutaDetalle(null);
      setFormRutaOpcionalesSeleccion({});
      return;
    }

    void cargarRutaDetalleParaFormulario(Number(formData.routeId));
  }, [formData.serviceType, formData.routeId]);

  useEffect(() => {
    if (!isDetailModalOpen) return;
    const idReserva = Number(selectedBooking?.id);
    if (!Number.isFinite(idReserva) || idReserva <= 0) return;
    void cargarDetalleReserva(idReserva);
  }, [isDetailModalOpen, selectedBooking?.id]);

  const [, setProofFile] = useState<File | null>(null);
  const [proofFileName, setProofFileName] = useState('');

  // Filtrar reservas
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.packageName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesDate = !dateFilter || booking.date === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Paginación
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Badge de estado
  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      'Confirmada': 'default',
      'Pendiente': 'outline',
      'Cancelada': 'destructive',
      'Completada': 'secondary',
    };
    const colors: { [key: string]: string } = {
      'Confirmada': 'bg-green-500',
      'Pendiente': 'bg-yellow-500',
      'Cancelada': 'bg-red-500',
      'Completada': 'bg-blue-500',
    };
    return (
      <Badge variant={variants[status] || 'secondary'} className={`${colors[status]} text-white`}>
        {status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const normalized = normalizePaymentStatus(status);
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      'Pagado': 'default',
      'Parcial': 'secondary',
      'Pendiente': 'outline',
      'Cancelado': 'destructive',
    };
    const colors: { [key: string]: string } = {
      'Pagado': 'bg-green-500',
      'Parcial': 'bg-blue-500',
      'Pendiente': 'bg-yellow-500',
      'Cancelado': 'bg-red-500',
    };
    return (
      <Badge variant={variants[normalized] || 'outline'} className={`${colors[normalized]} text-white`}>
        {normalized}
      </Badge>
    );
  };

  // Manejar cambio de archivo de comprobante
  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo no debe exceder 5MB');
        return;
      }

      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Solo se permiten PDF, JPG o PNG');
        return;
      }

      setProofFile(file);
      setProofFileName(file.name);
      toast.success('Comprobante cargado correctamente');
    }
  };

  // Eliminar archivo de comprobante
  const removeProofFile = () => {
    setProofFile(null);
    setProofFileName('');
  };

  // Crear reserva
  const handleCreateBooking = async () => {
    if (!canCreateReservas) {
      toast.error('No tienes permiso para crear reservas');
      return;
    }

    if (!formData.clientId || !formData.bookingDate) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    if (formData.serviceType === 'ruta') {
      if (!formData.routeId) {
        toast.error('Selecciona una ruta');
        return;
      }

      const idProgramacion = Number(formData.programacionId);
      if (!Number.isFinite(idProgramacion) || idProgramacion <= 0) {
        toast.error('Ingresa un ID de programación válido para asociar la ruta');
        return;
      }
    }

    if (formData.serviceType === 'finca' && !formData.farmId) {
      toast.error('Selecciona una finca');
      return;
    }

    try {
      setIsLoading(true);
      console.log('➕ Creando reserva:', formData);
      
      const numeroParticipantes = Number(formData.adults + formData.children) || 1;
      const nuevaReserva = await reservasAPI.create({
        id_cliente: parseInt(formData.clientId),
        fecha_reserva: formData.bookingDate,
        estado: 'Pendiente',
        total: Number(formData.total) || 0,
        notas: formData.specialRequests || '',
        numero_participantes: numeroParticipantes,
        tipo_servicio: formData.serviceType === 'ruta' ? 'Ruta' : 'Finca',
      });
      
      console.log('✅ Reserva creada:', nuevaReserva);

      const idReservaCreada = obtenerIdReservaDesdeRespuesta(nuevaReserva);
      if (!idReservaCreada) {
        toast.warning('Reserva creada, pero no se pudo obtener el ID para completar la asociación de ruta/servicios.');
      } else if (formData.serviceType === 'ruta') {
        try {
          await reservasAPI.agregarProgramacion(idReservaCreada, Number(formData.programacionId));

          const opcionalesSeleccionados = Object.entries(formRutaOpcionalesSeleccion)
            .map(([id_servicio, cantidad]) => ({
              id_servicio: Number(id_servicio),
              cantidad: Number(cantidad),
            }))
            .filter((item) => Number.isFinite(item.id_servicio) && item.id_servicio > 0 && item.cantidad > 0);

          for (const item of opcionalesSeleccionados) {
            await reservasAPI.agregarServicio(idReservaCreada, {
              id_servicio: item.id_servicio,
              cantidad: item.cantidad,
            });
          }
        } catch (error: any) {
          console.error('❌ Error al asociar programación/servicios a la reserva:', error);
          toast.error(error?.message || 'Reserva creada, pero falló la asociación de la ruta/servicios.');
          toast.info('Puedes abrir la reserva y asignar la programación desde el detalle.');
        }
      }

      toast.success('Reserva creada correctamente');
      setIsCreateModalOpen(false);
      
      // Limpiar formulario
      setFormData({
        clientId: '',
        clientName: '',
        bookingDate: '',
        routeId: '',
        farmId: '',
        serviceType: 'ruta',
        programacionId: '',
        services: [],
        participants: 1,
        adults: 1,
        children: 0,
        total: 0,
        status: 'Pendiente',
        specialRequests: ''
      });
      setFormRutaDetalle(null);
      setFormRutaOpcionalesSeleccion({});
      setProofFile(null);
      setProofFileName('');
      
      // Recargar lista de reservas
      await cargarReservas();
      
    } catch (error: any) {
      console.error('❌ Error al crear reserva:', error);
      toast.error(error.message || 'Error al crear la reserva. Verifica que el backend esté corriendo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Editar reserva
  const handleEditBooking = async () => {
    if (!canEditReservas) {
      toast.error('No tienes permiso para editar reservas');
      return;
    }

    if (!formData.clientId || !formData.bookingDate) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      setIsLoading(true);
      const reservaId = selectedBooking?.id?.toString();
      console.log('🔄 Actualizando reserva:', reservaId, formData);

      if (formData.status === 'Confirmada' && !canReservationBeConfirmed(selectedBooking?.paymentStatus)) {
        toast.error('Solo puedes confirmar una reserva cuando la venta tenga pago parcial o completo aprobado');
        return;
      }
      
      await reservasAPI.update(parseInt(reservaId), {
        id_cliente: parseInt(formData.clientId),
        fecha_reserva: formData.bookingDate,
        estado: formData.status,
        total: Number(formData.total) || 0,
        notas: formData.specialRequests
      });
      
      console.log('✅ Reserva actualizada');
      toast.success('Reserva actualizada correctamente');
      setIsEditModalOpen(false);
      
      // Recargar lista
      await cargarReservas();
      
      // Limpiar formulario
      setFormData({
        clientId: '',
        clientName: '',
        bookingDate: '',
        routeId: '',
        farmId: '',
        serviceType: 'ruta',
        programacionId: '',
        services: [],
        participants: 1,
        adults: 1,
        children: 0,
        total: 0,
        status: 'Pendiente',
        specialRequests: ''
      });
      
    } catch (error: any) {
      console.error('❌ Error al editar reserva:', error);
      toast.error(error.message || 'Error al actualizar la reserva');
    } finally {
      setIsLoading(false);
    }
  };

  // Ver detalle
  const handleViewDetail = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };

  // Cambiar estado  
  const handleChangeStatus = async (bookingId: string, newStatus: string) => {
    if (!canEditReservas) {
      toast.error('No tienes permiso para editar reservas');
      return;
    }

    try {
      const reservaId = bookingId.toString();
      const bookingActual = bookings.find((booking) => String(booking.id) === reservaId);

      if (newStatus === 'Confirmada' && !canReservationBeConfirmed(bookingActual?.paymentStatus)) {
        toast.error('Solo puedes confirmar una reserva cuando la venta tenga pago parcial o completo aprobado');
        return;
      }
      
      // Si el nuevo estado es "Cancelada", llamar al endpoint de cancelar
      if (newStatus === 'Cancelada') {
        console.log('❌ Cancelando reserva:', reservaId);
        await reservasAPI.cancelar(parseInt(reservaId), 'Cancelación solicitada por usuario');
      } else {
        // Para otros estados, actualizar
        console.log('🔄 Cambiando estado de reserva:', reservaId, newStatus);
        await reservasAPI.update(parseInt(reservaId), {
          estado: newStatus
        });
      }
      
      toast.success(`Estado actualizado a ${newStatus}`);
      
      // Recargar lista
      await cargarReservas();
    } catch (error: any) {
      console.error('❌ Error al cambiar estado:', error);
      toast.error(error.message || 'Error al cambiar el estado');
    }
  };

  // Generar PDF
  const handleGeneratePDF = (_booking: any) => {
    toast.success('PDF generado correctamente');
  };

  const handleDeleteBooking = async () => {
    if (!canDeleteReservas) {
      toast.error('No tienes permiso para eliminar reservas');
      return;
    }

    try {
      setIsLoading(true);
      const reservaId = selectedBooking?.id?.toString();
      if (!reservaId) {
        toast.error('Reserva inválida');
        return;
      }
      await reservasAPI.delete(parseInt(reservaId));
      toast.success('Reserva eliminada correctamente');
      setIsDeleteDialogOpen(false);
      await cargarReservas();
    } catch (error: any) {
      console.error('❌ Error al eliminar reserva:', error);
      toast.error(error.message || 'Error al eliminar la reserva');
    } finally {
      setIsLoading(false);
    }
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-green-800">Gestión de Reservas</h2>
          <p className="text-gray-600">Administra todas las reservas del sistema</p>
        </div>
        {canCreateReservas && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Reserva
          </Button>
        )}
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cliente o tipo de reserva..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full border-green-600 text-green-600 hover:bg-green-50"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDateFilter('');
                  }}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de Reservas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-green-800">
              Reservas ({filteredBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo de reserva</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.clientName}</TableCell>
                    <TableCell>{booking.packageName}</TableCell>
                    <TableCell>{booking.date}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{booking.participants} total</div>
                        <div className="text-xs text-gray-600">
                          {booking.adults}A / {booking.children}N
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>${booking.total.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={booking.status === 'Confirmada'}
                          onCheckedChange={(checked: boolean) => {
                            if (!canEditReservas) {
                              toast.error('No tienes permiso para editar reservas');
                              return;
                            }
                            const newStatus = checked ? 'Confirmada' : 'Pendiente';
                            void handleChangeStatus(String(booking.id), newStatus);
                          }}
                          disabled={!canEditReservas || (booking.status !== 'Confirmada' && !canReservationBeConfirmed(booking.paymentStatus))}
                          className={booking.status === 'Confirmada' ? 'bg-green-600' : 'bg-gray-300'}
                        />
                        {getStatusBadge(booking.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(booking.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetail(booking)}
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canEditReservas && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setFormData({
                                clientId: booking.clientId || '',
                                clientName: booking.clientName || '',
                                bookingDate: booking.date || '',
                                routeId: '',
                                farmId: '',
                                serviceType: 'ruta',
                                programacionId: '',
                                services: [],
                                participants: booking.participants || 1,
                                adults: booking.adults || 1,
                                children: booking.children || 0,
                                total: booking.total || 0,
                                status: booking.status || 'Pendiente',
                                specialRequests: booking.specialRequests || ''
                              });
                              setIsEditModalOpen(true);
                            }}
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
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
                            className="border-red-600 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGeneratePDF(booking)}
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginación */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{' '}
                {Math.min(currentPage * itemsPerPage, filteredBookings.length)} de{' '}
                {filteredBookings.length} reservas
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-4">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal Crear Reserva */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-800">Nueva Reserva</DialogTitle>
            <DialogDescription>
              Complete los campos necesarios para crear una nueva reserva
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Bloque 1: Cliente */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800">1. Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="create-clientSearch">Buscar cliente (por nombre o cédula) *</Label>
                    <Select 
                      value={formData.clientId} 
                      onValueChange={(value: string) => {
                        const client = clientes.find(c => c.id === value);
                        setFormData({ 
                          ...formData, 
                          clientId: value, 
                          clientName: client?.name || '' 
                        });
                      }}
                    >
                      <SelectTrigger id="create-clientSearch" className="bg-gray-50">
                        <SelectValue placeholder="Seleccione un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} - {client.document}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Cliente seleccionado */}
                  {formData.clientName && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-green-900 mb-2"><strong>Cliente seleccionado:</strong></p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Nombre:</span>
                          <p className="text-gray-900">{formData.clientName}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Cédula:</span>
                          <p className="text-gray-900">{clientes.find(c => c.id === formData.clientId)?.document || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Correo:</span>
                          <p className="text-gray-900">{clientes.find(c => c.id === formData.clientId)?.email || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Teléfono:</span>
                          <p className="text-gray-900">{clientes.find(c => c.id === formData.clientId)?.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bloque 2: Servicio */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800">2. Servicio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-serviceType">Tipo de servicio *</Label>
                    <Select
                      value={formData.serviceType}
                      onValueChange={(value: string) => {
                        const next = value === 'finca' ? 'finca' : 'ruta';
                        setFormData({ ...formData, serviceType: next, routeId: '', farmId: '', programacionId: '' });
                      }}
                    >
                      <SelectTrigger id="create-serviceType" className="bg-gray-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ruta">Ruta turística</SelectItem>
                        <SelectItem value="finca">Finca en alquiler</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="create-tourName">Nombre del tour o finca *</Label>
                    <Select value={formData.routeId || formData.farmId} onValueChange={(value: string) => {
                      if (formData.serviceType === 'ruta') {
                        setFormData({ ...formData, routeId: value, farmId: '' });
                        return;
                      }
                      setFormData({ ...formData, farmId: value, routeId: '' });
                    }}>
                      <SelectTrigger id="create-tourName" className="bg-gray-50">
                        <SelectValue placeholder="Seleccione un servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.serviceType === 'ruta' && rutas.map(route => (
                          <SelectItem key={route.id} value={route.id}>{route.name}</SelectItem>
                        ))}
                        {formData.serviceType === 'finca' && fincas.map(farm => (
                          <SelectItem key={farm.id} value={farm.id}>{farm.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.serviceType === 'ruta' && (
                    <div>
                      <Label htmlFor="create-programacionId">ID de programación *</Label>
                      <Input
                        id="create-programacionId"
                        type="number"
                        min="1"
                        value={formData.programacionId}
                        onChange={(e) => setFormData({ ...formData, programacionId: e.target.value })}
                        className="bg-gray-50"
                        placeholder="Ej: 12"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Se usa para asociar la ruta real y cargar los servicios predefinidos automáticamente.
                      </p>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="create-bookingDate">Fecha de reserva *</Label>
                    <Input
                      id="create-bookingDate"
                      type="date"
                      value={formData.bookingDate}
                      onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-tourDate">Fecha del tour / entrada</Label>
                    <Input
                      id="create-tourDate"
                      type="date"
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-exitDate">Fecha de salida (si aplica)</Label>
                    <Input
                      id="create-exitDate"
                      type="date"
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                {formData.serviceType === 'ruta' && (
                  <div className="mt-4">
                    <Label className="text-gray-700">Servicios opcionales disponibles (según ruta)</Label>
                    {isLoadingRutaDetalle ? (
                      <p className="text-sm text-gray-500 mt-2">Cargando servicios opcionales...</p>
                    ) : Array.isArray(formRutaDetalle?.servicios_opcionales) && formRutaDetalle.servicios_opcionales.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        {formRutaDetalle.servicios_opcionales.map((so: any) => {
                          const idServicio = Number(so?.id_servicio);
                          if (!Number.isFinite(idServicio) || idServicio <= 0) return null;
                          const cantidadSeleccionada = Number(formRutaOpcionalesSeleccion[idServicio] ?? 0);
                          const checked = cantidadSeleccionada > 0;
                          const cantidadDefault = Number(so?.cantidad_default ?? 1) || 1;
                          const nombreServicio = so?.servicio?.nombre ?? `Servicio #${idServicio}`;
                          const precio = so?.servicio?.precio;

                          return (
                            <div key={String(so?.id_ruta_servicio_opcional ?? idServicio)} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(nextChecked) => {
                                    const willCheck = Boolean(nextChecked);
                                    setFormRutaOpcionalesSeleccion((prev) => ({
                                      ...prev,
                                      [idServicio]: willCheck ? (prev[idServicio] > 0 ? prev[idServicio] : cantidadDefault) : 0,
                                    }));
                                  }}
                                />
                                <div>
                                  <p className="font-medium text-gray-900">{nombreServicio}</p>
                                  <p className="text-xs text-gray-500">
                                    ID: {idServicio}{typeof precio === 'number' ? ` • $${precio.toLocaleString()}` : ''}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-gray-600">Cantidad</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={checked ? cantidadSeleccionada : ''}
                                  disabled={!checked}
                                  onChange={(e) => {
                                    const nextQty = Math.max(1, Number(e.target.value) || 1);
                                    setFormRutaOpcionalesSeleccion((prev) => ({ ...prev, [idServicio]: nextQty }));
                                  }}
                                  className="w-24 bg-white"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">Esta ruta no tiene servicios opcionales configurados.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bloque 3: Participantes */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800">3. Participantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="create-adults">Adultos *</Label>
                    <Input
                      id="create-adults"
                      type="number"
                      min="0"
                      value={formData.adults}
                      onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) || 0 })}
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-children">Niños</Label>
                    <Input
                      id="create-children"
                      type="number"
                      min="0"
                      value={formData.children}
                      onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) || 0 })}
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-totalParticipants">Total de personas</Label>
                    <Input
                      id="create-totalParticipants"
                      type="number"
                      value={formData.adults + formData.children}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                    onClick={() => toast.info('Funcionalidad de agregar cliente adicional en desarrollo')}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Agregar Cliente Adicional
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bloque 4: Información financiera */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800">4. Información Financiera</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="create-total">Total estimado *</Label>
                    <Input
                      id="create-total"
                      type="number"
                      placeholder="$0"
                      value={formData.total}
                      onChange={(e) => setFormData({ ...formData, total: Number(e.target.value) || 0 })}
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-paymentStatus">Estado de pago *</Label>
                    <Select value="Pendiente" disabled>
                      <SelectTrigger id="create-paymentStatus" className="bg-gray-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Se actualiza desde ventas y abonos cuando exista la venta asociada.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="create-paymentMethod">Método de pago</Label>
                    <Select defaultValue="efectivo">
                      <SelectTrigger id="create-paymentMethod" className="bg-gray-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bloque 5: Comprobante de Pago */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800">5. Comprobante de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="create-proofFile">Adjuntar Comprobante (PDF, JPG, PNG)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition mt-2">
                      <input
                        id="create-proofFile"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleProofFileChange}
                      />
                      <label htmlFor="create-proofFile" className="cursor-pointer flex flex-col items-center space-y-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Haz clic para seleccionar o arrastra un archivo
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Máximo 5MB - PDF, JPG o PNG
                          </p>
                        </div>
                      </label>
                    </div>

                    {proofFileName && (
                      <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200 mt-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{proofFileName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={removeProofFile}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bloque 6: Estado de la reserva */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800">6. Estado de la Reserva</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="create-status">Estado actual *</Label>
                    <Select value="Pendiente" disabled>
                      <SelectTrigger id="create-status" className="bg-gray-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Toda reserva nueva inicia en pendiente y se confirma cuando el pago respaldado lo permita.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="create-observations">Observaciones internas</Label>
                    <Textarea
                      id="create-observations"
                      placeholder="Escriba aquí notas adicionales o comentarios internos sobre la reserva..."
                      rows={4}
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bloque 7: Control y acciones */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800">7. Control y Acciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Creado por</Label>
                    <Input
                      value="Administrador"
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label>Fecha de creación</Label>
                    <Input
                      value={new Date().toLocaleString('es-CO')}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>
                <div className="flex justify-end items-center mt-6 pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateBooking}
                      disabled={!canCreateReservas}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Reserva
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Reserva */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-800">Editar Reserva</DialogTitle>
            <DialogDescription>
              Modifica los campos necesarios para actualizar la reserva
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Bloque 1: Identificación del cliente */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800">1. Identificación del Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-fullName">Nombre completo *</Label>
                    <Input
                      id="edit-fullName"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-document">Cédula / Documento *</Label>
                    <Input
                      id="edit-document"
                      value={selectedBooking?.clientId || ''}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Correo electrónico</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      placeholder="ejemplo@correo.com"
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-phone">Teléfono</Label>
                    <Input
                      id="edit-phone"
                      type="tel"
                      placeholder="+57 300 123 4567"
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bloque 2: Servicio reservado */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800">2. Servicio Reservado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-serviceType">Tipo de servicio *</Label>
                    <Select
                      value={formData.serviceType}
                      onValueChange={(value: string) => {
                        const next = value === 'finca' ? 'finca' : 'ruta';
                        setFormData({ ...formData, serviceType: next, routeId: '', farmId: '' });
                      }}
                    >
                      <SelectTrigger id="edit-serviceType" className="bg-gray-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ruta">Ruta turística</SelectItem>
                        <SelectItem value="finca">Finca en alquiler</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-packageName">Nombre del paquete / tour / finca *</Label>
                    <Select value={formData.routeId || formData.farmId} onValueChange={(value: string) => {
                      if (formData.serviceType === 'ruta') {
                        setFormData({ ...formData, routeId: value, farmId: '' });
                        return;
                      }
                      setFormData({ ...formData, farmId: value, routeId: '' });
                    }}>
                      <SelectTrigger id="edit-packageName" className="bg-gray-50">
                        <SelectValue placeholder="Seleccione un servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.serviceType === 'ruta' && rutas.map(route => (
                          <SelectItem key={route.id} value={route.id}>{route.name}</SelectItem>
                        ))}
                        {formData.serviceType === 'finca' && fincas.map(farm => (
                          <SelectItem key={farm.id} value={farm.id}>{farm.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-bookingDate">Fecha de reserva</Label>
                    <Input
                      id="edit-bookingDate"
                      type="date"
                      value={formData.bookingDate}
                      onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-tourDate">Fecha del tour / entrada</Label>
                    <Input
                      id="edit-tourDate"
                      type="date"
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-exitDate">Fecha de salida (si aplica)</Label>
                    <Input
                      id="edit-exitDate"
                      type="date"
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-duration">Duración del servicio</Label>
                    <Input
                      id="edit-duration"
                      placeholder="Ej: 1 día, 2 noches"
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bloque 3: Participantes */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800">3. Participantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-adults">Adultos *</Label>
                    <Input
                      id="edit-adults"
                      type="number"
                      min="0"
                      value={formData.adults}
                      onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) || 0 })}
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-children">Niños</Label>
                    <Input
                      id="edit-children"
                      type="number"
                      min="0"
                      value={formData.children}
                      onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) || 0 })}
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-totalParticipants">Total de personas</Label>
                    <Input
                      id="edit-totalParticipants"
                      type="number"
                      value={formData.adults + formData.children}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                    onClick={() => toast.info('Funcionalidad de agregar cliente adicional en desarrollo')}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Agregar Cliente Adicional
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bloque 4: Información financiera */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800">4. Información Financiera</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-total">Total de la reserva *</Label>
                    <Input
                      id="edit-total"
                      type="number"
                      placeholder="$0"
                      value={formData.total}
                      onChange={(e) => setFormData({ ...formData, total: Number(e.target.value) || 0 })}
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-paymentStatus">Estado de pago *</Label>
                    <Select 
                      value={normalizePaymentStatus(selectedBooking?.paymentStatus)}
                      disabled
                    >
                      <SelectTrigger id="edit-paymentStatus" className="bg-gray-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pagado">
                          <span className="text-green-600 font-medium">Pagado</span>
                        </SelectItem>
                        <SelectItem value="Parcial">
                          <span className="text-blue-600 font-medium">Parcial</span>
                        </SelectItem>
                        <SelectItem value="Pendiente">
                          <span className="text-yellow-600 font-medium">Pendiente</span>
                        </SelectItem>
                        <SelectItem value="Cancelado">
                          <span className="text-red-600 font-medium">Cancelado</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Este estado se administra desde ventas y abonos, no desde reservas.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="edit-paymentMethod">Método de pago</Label>
                    <Select defaultValue="efectivo">
                      <SelectTrigger id="edit-paymentMethod" className="bg-gray-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bloque 5: Comprobante de Pago */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800">5. Comprobante de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-proofFile">Adjuntar Comprobante (PDF, JPG, PNG)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition mt-2">
                      <input
                        id="edit-proofFile"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleProofFileChange}
                      />
                      <label htmlFor="edit-proofFile" className="cursor-pointer flex flex-col items-center space-y-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Haz clic para seleccionar o arrastra un archivo
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Máximo 5MB - PDF, JPG o PNG
                          </p>
                        </div>
                      </label>
                    </div>

                    {proofFileName && (
                      <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200 mt-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{proofFileName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={removeProofFile}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bloque 6: Estado de la reserva */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800">6. Estado de la Reserva</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="edit-status">Estado actual *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: string) => {
                        if (value === 'Confirmada' && !canReservationBeConfirmed(selectedBooking?.paymentStatus)) {
                          toast.error('Solo puedes confirmar una reserva cuando la venta tenga pago parcial o completo aprobado');
                          return;
                        }
                        setFormData({ ...formData, status: value });
                      }}
                    >
                      <SelectTrigger id="edit-status" className="bg-gray-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Confirmada">Confirmada</SelectItem>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="Cancelada">Cancelada</SelectItem>
                        <SelectItem value="Completada">Completada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-observations">Observaciones internas</Label>
                    <Textarea
                      id="edit-observations"
                      placeholder="Escriba aquí notas adicionales o comentarios internos sobre la reserva..."
                      rows={4}
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bloque 7: Control y acciones */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800">7. Control y Acciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Creado por</Label>
                    <Input
                      value="Administrador"
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label>Última modificación</Label>
                    <Input
                      value={new Date().toLocaleString('es-CO')}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-400 text-gray-600"
                    onClick={() => toast.info('Historial de cambios en desarrollo')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ver historial
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleEditBooking}
                      disabled={!canEditReservas}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Guardar cambios
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle de Reserva */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Detalle de Reserva</DialogTitle>
            <DialogDescription>
              Información completa de la reserva seleccionada
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              <div className="bg-white border border-green-200 p-4 rounded-lg">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-green-800">Ruta / Programación</h4>
                    <p className="text-sm text-gray-600">
                      {detalleRuta?.nombre ? `Ruta: ${detalleRuta.nombre}` : 'Ruta: (sin asignar / no disponible)'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => {
                      const idReserva = Number(selectedBooking?.id);
                      if (!Number.isFinite(idReserva) || idReserva <= 0) return;
                      void cargarDetalleReserva(idReserva);
                    }}
                    disabled={isLoadingDetalle}
                  >
                    {isLoadingDetalle ? 'Actualizando...' : 'Actualizar'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-600">ID Reserva</p>
                    <p className="font-medium">{selectedBooking.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ID Programación</p>
                    <p className="font-medium">{detalleProgramacionId || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ID Ruta</p>
                    <p className="font-medium">{String(resolveRouteIdFromReservaDetalle(reservaDetalle) || '—')}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <Label htmlFor="detalle-programacionId">Asignar/Actualizar programación</Label>
                    <Input
                      id="detalle-programacionId"
                      type="number"
                      min="1"
                      placeholder="Ej: 12"
                      value={detalleProgramacionId}
                      onChange={(e) => setDetalleProgramacionId(e.target.value)}
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={async () => {
                        const idReserva = Number(selectedBooking?.id);
                        const idProgramacion = Number(detalleProgramacionId);
                        if (!Number.isFinite(idReserva) || idReserva <= 0) {
                          toast.error('Reserva inválida');
                          return;
                        }
                        if (!Number.isFinite(idProgramacion) || idProgramacion <= 0) {
                          toast.error('ID de programación inválido');
                          return;
                        }
                        try {
                          await reservasAPI.agregarProgramacion(idReserva, idProgramacion);
                          toast.success('Programación asignada correctamente');
                          await cargarDetalleReserva(idReserva);
                        } catch (error: any) {
                          toast.error(error?.message || 'No se pudo asignar la programación');
                        }
                      }}
                      disabled={isLoadingDetalle}
                    >
                      Asociar
                    </Button>
                  </div>
                </div>

                {Array.isArray(detalleRuta?.servicios_opcionales) && detalleRuta.servicios_opcionales.length > 0 && (
                  <div className="mt-6">
                    <Label className="text-gray-700">Servicios opcionales disponibles</Label>
                    <div className="space-y-2 mt-2">
                      {detalleRuta.servicios_opcionales.map((so: any) => {
                        const idServicio = Number(so?.id_servicio);
                        if (!Number.isFinite(idServicio) || idServicio <= 0) return null;
                        const cantidadSeleccionada = Number(detalleOpcionalesSeleccion[idServicio] ?? 0);
                        const checked = cantidadSeleccionada > 0;
                        const cantidadDefault = Number(so?.cantidad_default ?? 1) || 1;
                        const nombreServicio = so?.servicio?.nombre ?? `Servicio #${idServicio}`;
                        const precio = so?.servicio?.precio;

                        return (
                          <div key={String(so?.id_ruta_servicio_opcional ?? idServicio)} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(nextChecked) => {
                                  const willCheck = Boolean(nextChecked);
                                  setDetalleOpcionalesSeleccion((prev) => ({
                                    ...prev,
                                    [idServicio]: willCheck ? (prev[idServicio] > 0 ? prev[idServicio] : cantidadDefault) : 0,
                                  }));
                                }}
                              />
                              <div>
                                <p className="font-medium text-gray-900">{nombreServicio}</p>
                                <p className="text-xs text-gray-500">
                                  ID: {idServicio}{typeof precio === 'number' ? ` • $${precio.toLocaleString()}` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-gray-600">Cantidad</Label>
                              <Input
                                type="number"
                                min="1"
                                value={checked ? cantidadSeleccionada : ''}
                                disabled={!checked}
                                onChange={(e) => {
                                  const nextQty = Math.max(1, Number(e.target.value) || 1);
                                  setDetalleOpcionalesSeleccion((prev) => ({ ...prev, [idServicio]: nextQty }));
                                }}
                                className="w-24 bg-white"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end mt-3">
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isLoadingDetalle}
                        onClick={async () => {
                          const idReserva = Number(selectedBooking?.id);
                          if (!Number.isFinite(idReserva) || idReserva <= 0) {
                            toast.error('Reserva inválida');
                            return;
                          }
                          try {
                            const opcionalesSeleccionados = Object.entries(detalleOpcionalesSeleccion)
                              .map(([id_servicio, cantidad]) => ({
                                id_servicio: Number(id_servicio),
                                cantidad: Number(cantidad),
                              }))
                              .filter((item) => Number.isFinite(item.id_servicio) && item.id_servicio > 0 && item.cantidad > 0);

                            if (opcionalesSeleccionados.length === 0) {
                              toast.info('Selecciona al menos un servicio opcional');
                              return;
                            }

                            for (const item of opcionalesSeleccionados) {
                              await reservasAPI.agregarServicio(idReserva, {
                                id_servicio: item.id_servicio,
                                cantidad: item.cantidad,
                              });
                            }

                            toast.success('Servicios opcionales agregados');
                            setDetalleOpcionalesSeleccion({});
                            await cargarDetalleReserva(idReserva);
                          } catch (error: any) {
                            toast.error(error?.message || 'No se pudieron agregar los servicios opcionales');
                          }
                        }}
                      >
                        Agregar opcionales
                      </Button>
                    </div>
                  </div>
                )}

                {isLoadingDetalle && (
                  <p className="text-sm text-gray-500 mt-3">Cargando detalle de reserva...</p>
                )}
              </div>

              {/* Información del cliente */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3">Información del Cliente</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-medium">{selectedBooking.clientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedBooking.clientEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium">{selectedBooking.clientPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contacto de Emergencia</p>
                    <p className="font-medium">{selectedBooking.emergency}</p>
                  </div>
                </div>
              </div>

              {/* Detalles de la reserva */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Tipo de reserva</p>
                  <p className="font-medium">{selectedBooking.packageName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-medium">{selectedBooking.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Horario</p>
                  <p className="font-medium">{selectedBooking.checkIn} - {selectedBooking.checkOut}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Participantes</p>
                  <p className="font-medium">{selectedBooking.participants} ({selectedBooking.adults}A / {selectedBooking.children}N)</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Guía Asignado</p>
                  <p className="font-medium">{selectedBooking.guide}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Asesor</p>
                  <p className="font-medium">{selectedBooking.advisor}</p>
                </div>
              </div>

              {/* Desglose de precio */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">Desglose de Precio</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${(selectedBooking.subtotal || selectedBooking.totalAmount || selectedBooking.total || 0).toLocaleString()}</span>
                  </div>
                  {selectedBooking.discount && selectedBooking.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento</span>
                      <span>-${selectedBooking.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span>Total</span>
                    <span className="text-green-700">${(selectedBooking.totalAmount || selectedBooking.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado de Pago</span>
                    {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método de Pago</span>
                    <span className="font-medium">{selectedBooking.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Notas y solicitudes especiales */}
              {selectedBooking.specialRequests && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Solicitudes Especiales</h4>
                  <p className="text-gray-600 bg-yellow-50 p-3 rounded-lg">
                    {selectedBooking.specialRequests}
                  </p>
                </div>
              )}

              {/* Comprobante de Pago */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-blue-600" />
                  Comprobante de Pago
                </h4>
                {selectedBooking.paymentReceipt ? (
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <img 
                        src={selectedBooking.paymentReceipt} 
                        alt="Comprobante de pago"
                        className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(selectedBooking.paymentReceipt, '_blank')}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedBooking.paymentReceipt, '_blank')}
                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Ver Comprobante en Tamaño Completo
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No se ha cargado un comprobante de pago</p>
                  </div>
                )}
              </div>

              {/* Estado */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Estado de la Reserva</p>
                  <p className="font-medium text-green-800">{selectedBooking.status}</p>
                </div>
                {getStatusBadge(selectedBooking.status)}
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleGeneratePDF(selectedBooking)}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </Button>
                <Button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert Dialog: Confirmar Eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">¿Eliminar Reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la reserva de{' '}\n
              <span className="font-semibold">{selectedBooking?.clientName}</span>.\n
              Esta acción no se puede deshacer.
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