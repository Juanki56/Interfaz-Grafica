import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Printer,
  AlertTriangle,
  Upload,
  Download,
  DollarSign,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { usePermissions } from '../hooks/usePermissions';
import {
  clientesAPI,
  pagosAPI,
  reservasAPI,
  ventasAPI,
  type Cliente as ClienteBackend,
  type PagoCliente,
  type Reserva,
  type Venta,
} from '../services/api';

interface Client {
  id: string;
  backendId?: number;
  name: string;
  document: string;
  phone: string;
  email: string;
}

interface ReservationSummary {
  id: string;
  backendId: number;
  ventaId?: number;
  client: Client;
  serviceType: 'Ruta' | 'Finca' | 'Servicio';
  serviceName: string;
  totalAmount: number;
  paidAmount: number;
  pendingBalance: number;
  date: string;
  serviceDetails?: {
    location?: string;
    capacity?: number;
    distance?: string;
    difficulty?: string;
  };
}

type InstallmentStatus = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Verificado';
type ViewMode = 'list' | 'create' | 'detail';

interface PaymentInstallment {
  id: string;
  backendId: number;
  ventaId?: number;
  client: Client;
  reservation: ReservationSummary;
  amount: number;
  date: string;
  status: InstallmentStatus;
  paymentMethod: string;
  receiptUrl?: string;
  receiptName?: string;
  receiptType?: string;
  transactionNumber?: string;
  observations?: string;
  rejectionReason?: string;
  verificationDate?: string;
  verifiedBy?: string;
}

interface PaymentInstallmentsManagementProps {
  userRole?: 'admin' | 'advisor';
}

function toNumber(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string | null, fallback = '—') {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10) || fallback;
  return parsed.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatInputDate(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10);
  return parsed.toISOString().split('T')[0];
}

function buildFullName(nombre?: string | null, apellido?: string | null, fallback = 'Cliente') {
  return `${String(nombre || '').trim()} ${String(apellido || '').trim()}`.trim() || fallback;
}

function normalizeStatus(status?: string | null): InstallmentStatus {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'aprobado') return 'Aprobado';
  if (normalized === 'rechazado') return 'Rechazado';
  if (normalized === 'verificado') return 'Verificado';
  return 'Pendiente';
}

function getStatusBadge(status: InstallmentStatus) {
  const styles: Record<InstallmentStatus, string> = {
    Pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Aprobado: 'bg-green-100 text-green-700 border-green-200',
    Rechazado: 'bg-red-100 text-red-700 border-red-200',
    Verificado: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return styles[status];
}

function mapCliente(cliente: ClienteBackend): Client {
  return {
    id: String(cliente.id_cliente),
    backendId: Number(cliente.id_cliente),
    name: buildFullName(cliente.nombre, cliente.apellido, 'Cliente'),
    document: String(cliente.numero_documento || 'Documento no disponible'),
    phone: String(cliente.telefono || '—'),
    email: String(cliente.correo || '—'),
  };
}

function resolveReservationServiceType(reserva?: Reserva | null): ReservationSummary['serviceType'] {
  const tipo = String(reserva?.tipo_servicio || '').trim().toLowerCase();
  if ((reserva as any)?.fincas?.length || tipo.includes('finca')) return 'Finca';
  if ((reserva as any)?.programaciones?.length || tipo.includes('ruta')) return 'Ruta';
  return 'Servicio';
}

function resolveReservationServiceName(reserva?: Reserva | null): string {
  const finca = (reserva as any)?.fincas?.[0];
  const programacion = (reserva as any)?.programaciones?.[0];
  const servicio = reserva?.servicios?.[0] as any;

  return (
    finca?.finca_nombre ||
    finca?.nombre ||
    programacion?.ruta_nombre ||
    programacion?.nombre_ruta ||
    servicio?.servicio_nombre ||
    `Reserva #${reserva?.id_reserva || reserva?.id || ''}`
  );
}

function resolveReservationDetails(reserva?: Reserva | null) {
  const finca = (reserva as any)?.fincas?.[0];
  const programacion = (reserva as any)?.programaciones?.[0];

  if (finca) {
    return {
      location: String(finca.ubicacion || 'Por definir'),
      capacity: toNumber(finca.capacidad_personas),
    };
  }

  if (programacion) {
    return {
      distance: programacion.fecha_salida
        ? `Salida ${formatInputDate(programacion.fecha_salida)}`
        : 'Ruta programada',
      difficulty: String(programacion.dificultad || 'Por definir'),
    };
  }

  return undefined;
}

function isReservationFinca(reserva?: Reserva | null): boolean {
  return resolveReservationServiceType(reserva) === 'Finca';
}

function mapReservationSummary(
  venta: Venta,
  reserva: Reserva | undefined,
  clientFallback?: Client
): ReservationSummary {
  const backendReservationId = Number(reserva?.id_reserva || reserva?.id || venta.id_reserva || 0);
  const totalAmount = toNumber(venta.monto_total || reserva?.monto_total || reserva?.total);
  const paidAmount = toNumber(venta.monto_pagado);
  const pendingBalance = toNumber(venta.saldo_pendiente);
  const serviceType = resolveReservationServiceType(reserva);

  return {
    id: `R-${String(backendReservationId).padStart(3, '0')}`,
    backendId: backendReservationId,
    ventaId: Number(venta.id_venta),
    client:
      clientFallback ||
      ({
        id: String(venta.id_cliente || reserva?.id_cliente || backendReservationId),
        name: buildFullName(venta.cliente_nombre, venta.cliente_apellido, 'Cliente'),
        document: String(venta.numero_documento || 'Documento no disponible'),
        phone: String(venta.cliente_telefono || '—'),
        email: String(venta.email || '—'),
      } as Client),
    serviceType,
    serviceName: resolveReservationServiceName(reserva),
    totalAmount,
    paidAmount,
    pendingBalance,
    date: formatInputDate(venta.fecha_venta || reserva?.fecha_reserva) || new Date().toISOString().split('T')[0],
    serviceDetails: resolveReservationDetails(reserva),
  };
}

function mapPagoToInstallment(
  pago: PagoCliente,
  venta: Venta | undefined,
  reserva: Reserva | undefined
): PaymentInstallment {
  const fallbackClient: Client = {
    id: String(venta?.id_cliente || reserva?.id_cliente || pago.id_reserva || pago.id_pago),
    name: buildFullName(pago.cliente_nombre, pago.cliente_apellido, 'Cliente'),
    document: String(pago.numero_documento || venta?.numero_documento || 'Documento no disponible'),
    phone: String(pago.cliente_telefono || venta?.cliente_telefono || '—'),
    email: String(venta?.email || '—'),
  };

  return {
    id: `A-${String(pago.id_pago).padStart(3, '0')}`,
    backendId: Number(pago.id_pago),
    ventaId: Number(pago.id_venta),
    client: fallbackClient,
    reservation: mapReservationSummary(
      venta || {
        id_venta: Number(pago.id_venta),
        id_reserva: Number(pago.id_reserva),
        monto_total: pago.monto_total || 0,
        monto_pagado: pago.monto_pagado || 0,
        saldo_pendiente: pago.saldo_pendiente || 0,
        estado_pago: pago.estado_pago || 'Pendiente',
      },
      reserva,
      fallbackClient
    ),
    amount: toNumber(pago.monto),
    date: formatInputDate(pago.fecha_pago) || new Date().toISOString().split('T')[0],
    status: normalizeStatus(pago.estado),
    paymentMethod: String(pago.metodo_pago || 'Por definir'),
    receiptUrl: pago.comprobante_url || undefined,
    receiptName: pago.comprobante_nombre || undefined,
    receiptType: pago.comprobante_tipo || undefined,
    transactionNumber: pago.numero_transaccion || undefined,
    observations: pago.observaciones || undefined,
    rejectionReason: pago.motivo_rechazo || undefined,
    verificationDate: pago.fecha_verificacion || undefined,
    verifiedBy: buildFullName((pago as any).verificado_por_nombre, (pago as any).verificado_por_apellido, ''),
  };
}

function openReceipt(url?: string | null) {
  if (!url) {
    toast.error('Este pago no tiene comprobante adjunto');
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el comprobante'));
    reader.readAsDataURL(file);
  });
}

export function PaymentInstallmentsManagement({ userRole = 'admin' }: PaymentInstallmentsManagementProps) {
  const { hasPermission } = usePermissions();

  const canViewAbonos = hasPermission('abonos.leer') || hasPermission('pagos.leer') || userRole === 'admin';
  const canCreateAbono = hasPermission('abonos.crear') || hasPermission('pagos.crear') || userRole === 'admin';
  const canEditAbono = hasPermission('abonos.editar') || hasPermission('pagos.editar') || userRole === 'admin';
  const canDeleteAbono = hasPermission('abonos.eliminar') || hasPermission('pagos.eliminar') || userRole === 'admin';

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null);
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [availableReservations, setAvailableReservations] = useState<ReservationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [installmentToCancel, setInstallmentToCancel] = useState<PaymentInstallment | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pagos, clientes, ventas] = await Promise.all([
        pagosAPI.getAll(),
        clientesAPI.getAll(),
        ventasAPI.getAll(),
      ]);

      const uniqueReservationIds = Array.from(
        new Set(
          [...pagos.map((pago) => Number(pago.id_reserva)), ...ventas.map((venta) => Number(venta.id_reserva))]
            .filter((id) => Number.isFinite(id) && id > 0)
        )
      );

      const reservationResults = await Promise.allSettled(
        uniqueReservationIds.map(async (idReserva) => {
          const reserva = await reservasAPI.getById(idReserva);
          return [idReserva, reserva] as const;
        })
      );

      const reservationMap = new Map<number, Reserva>();
      reservationResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          reservationMap.set(result.value[0], result.value[1]);
        }
      });

      const ventasMap = new Map<number, Venta>();
      ventas.forEach((venta) => {
        ventasMap.set(Number(venta.id_venta), venta);
      });

      const mappedInstallments = pagos.map((pago) =>
        mapPagoToInstallment(
          pago,
          ventasMap.get(Number(pago.id_venta)),
          reservationMap.get(Number(pago.id_reserva))
        )
      );

      const clientMap = new Map<string, Client>();
      clientes.forEach((cliente) => {
        const mappedClient = mapCliente(cliente);
        clientMap.set(mappedClient.id, mappedClient);
      });
      mappedInstallments.forEach((installment) => {
        clientMap.set(installment.client.id, installment.client);
      });

      const fincaReservations = ventas
        .map((venta) => {
          const reserva = reservationMap.get(Number(venta.id_reserva));
          if (!reserva || !isReservationFinca(reserva) || toNumber(venta.saldo_pendiente) <= 0) {
            return null;
          }
          const backendClientId = String(venta.id_cliente || reserva.id_cliente || '');
          const knownClient = clientMap.get(backendClientId);
          return mapReservationSummary(venta, reserva, knownClient);
        })
        .filter((item): item is ReservationSummary => Boolean(item))
        .sort((a, b) => b.backendId - a.backendId);

      setInstallments(mappedInstallments);
      setAvailableClients(Array.from(clientMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
      setAvailableReservations(fincaReservations);

      setSelectedInstallment((previous) => {
        if (!previous) return null;
        return mappedInstallments.find((item) => item.backendId === previous.backendId) || null;
      });
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron cargar los abonos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canViewAbonos) return;
    void loadData();
  }, [canViewAbonos, loadData]);

  const filteredInstallments = useMemo(() => {
    return installments.filter((installment) => {
      const matchesSearch =
        installment.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        installment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        installment.reservation.serviceName.toLowerCase().includes(searchTerm.toLowerCase());

      const installmentDate = installment.date;
      const matchesDateFrom = !dateFrom || installmentDate >= dateFrom;
      const matchesDateTo = !dateTo || installmentDate <= dateTo;

      return matchesSearch && matchesDateFrom && matchesDateTo;
    });
  }, [installments, searchTerm, dateFrom, dateTo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredInstallments.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInstallments = filteredInstallments.slice(startIndex, startIndex + itemsPerPage);

  const handleViewDetail = async (installment: PaymentInstallment) => {
    setLoadingDetail(true);
    setSelectedInstallment(installment);
    setViewMode('detail');
    try {
      const pago = await pagosAPI.getById(installment.backendId);
      const venta = await ventasAPI.getById(Number(pago.id_venta));
      const reserva = await reservasAPI.getById(Number(pago.id_reserva));
      setSelectedInstallment(mapPagoToInstallment(pago, venta, reserva));
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cargar el detalle del abono');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateInstallment = async (payload: {
    reservation: ReservationSummary;
    amount: number;
    paymentMethod: string;
    transactionNumber?: string;
    observations?: string;
    receiptFile?: File | null;
  }) => {
    if (!canCreateAbono) {
      toast.error('No tienes permiso para registrar abonos');
      return;
    }

    setSubmitting(true);
    try {
      let comprobanteUrl: string | null = null;
      let comprobanteNombre: string | null = null;
      let comprobanteTipo: string | null = null;

      if (payload.receiptFile) {
        comprobanteUrl = await fileToDataUrl(payload.receiptFile);
        comprobanteNombre = payload.receiptFile.name;
        comprobanteTipo = payload.receiptFile.type;
      }

      await pagosAPI.create({
        id_venta: Number(payload.reservation.ventaId),
        id_reserva: payload.reservation.backendId,
        monto: payload.amount,
        metodo_pago: payload.paymentMethod,
        numero_transaccion: payload.transactionNumber || null,
        comprobante_url: comprobanteUrl,
        comprobante_nombre: comprobanteNombre,
        comprobante_tipo: comprobanteTipo,
        observaciones: payload.observations || null,
      });

      toast.success('Abono registrado correctamente');
      setViewMode('list');
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo registrar el abono');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (installment: PaymentInstallment, decision: 'Aprobado' | 'Rechazado', notes?: string, reason?: string) => {
    if (!canEditAbono) {
      toast.error('No tienes permiso para verificar abonos');
      return;
    }

    setProcessing(true);
    try {
      await pagosAPI.verificar(installment.backendId, {
        estado: decision,
        observaciones: notes || null,
        motivo_rechazo: decision === 'Rechazado' ? reason || null : null,
      });

      toast.success(decision === 'Aprobado' ? 'Comprobante aprobado correctamente' : 'Comprobante rechazado correctamente');
      await loadData();
      const updated = await pagosAPI.getById(installment.backendId);
      const venta = await ventasAPI.getById(Number(updated.id_venta));
      const reserva = await reservasAPI.getById(Number(updated.id_reserva));
      setSelectedInstallment(mapPagoToInstallment(updated, venta, reserva));
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo actualizar el estado del comprobante');
    } finally {
      setProcessing(false);
    }
  };

  const handleInitiateCancellation = (installment: PaymentInstallment) => {
    setInstallmentToCancel(installment);
    setShowCancelDialog(true);
  };

  const handleConfirmCancellation = async () => {
    if (!installmentToCancel) return;

    if (!canDeleteAbono) {
      toast.error('No tienes permiso para anular abonos');
      return;
    }

    setProcessing(true);
    try {
      await pagosAPI.delete(installmentToCancel.backendId);
      toast.success('Abono anulado correctamente');
      setShowCancelDialog(false);
      setInstallmentToCancel(null);
      setCancellationReason('');
      if (selectedInstallment?.backendId === installmentToCancel.backendId) {
        setViewMode('list');
      }
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo anular el abono');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelDialogClose = () => {
    setShowCancelDialog(false);
    setInstallmentToCancel(null);
    setCancellationReason('');
  };

  if (!canViewAbonos) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="border-green-100 shadow-sm">
          <CardContent className="p-8">
            <p className="text-gray-700">No tienes permiso para ver abonos.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AnimatePresence mode="wait">
        {viewMode === 'list' && (
          <InstallmentsListView
            key="list"
            installments={paginatedInstallments}
            totalInstallments={filteredInstallments.length}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalPages={totalPages}
            startIndex={startIndex}
            loading={loading}
            canCreateAbono={canCreateAbono}
            canDeleteAbono={canDeleteAbono && userRole === 'admin'}
            onCreateNew={() => setViewMode('create')}
            onViewDetail={handleViewDetail}
            onCancelInstallment={handleInitiateCancellation}
          />
        )}

        {viewMode === 'create' && (
          <CreateInstallmentView
            key="create"
            onBack={() => setViewMode('list')}
            onCreate={handleCreateInstallment}
            clients={availableClients}
            reservations={availableReservations}
            installments={installments}
            submitting={submitting}
          />
        )}

        {viewMode === 'detail' && selectedInstallment && (
          <InstallmentDetailView
            key="detail"
            installment={selectedInstallment}
            onBack={() => setViewMode('list')}
            onCancel={() => handleInitiateCancellation(selectedInstallment)}
            onVerify={handleVerify}
            canDeleteAbono={canDeleteAbono && userRole === 'admin'}
            canEditAbono={canEditAbono}
            loading={loadingDetail}
            processing={processing}
          />
        )}
      </AnimatePresence>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-white border-2 border-red-200">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-red-900">Advertencia: Anular Abono</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p className="text-gray-700">
                  Estás a punto de anular permanentemente el abono{' '}
                  <span className="font-semibold text-red-700">{installmentToCancel?.id}</span>.
                </p>
                <p className="text-gray-700">
                  Esta acción eliminará el registro del pago y devolverá el saldo a la venta asociada.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Esta acción no se puede deshacer. El motivo se conserva como trazabilidad operativa.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cancellation-reason" className="text-gray-900">
                    Motivo de la anulación
                  </Label>
                  <Textarea
                    id="cancellation-reason"
                    placeholder="Ej: comprobante duplicado, error de registro, cliente anuló la operación..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="min-h-[80px] border-gray-300 focus:border-red-500"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelDialogClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancellation}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sí, Anular Abono
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface InstallmentsListViewProps {
  installments: PaymentInstallment[];
  totalInstallments: number;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  totalPages: number;
  startIndex: number;
  loading: boolean;
  canCreateAbono: boolean;
  canDeleteAbono: boolean;
  onCreateNew: () => void;
  onViewDetail: (installment: PaymentInstallment) => void;
  onCancelInstallment: (installment: PaymentInstallment) => void;
}

function InstallmentsListView({
  installments,
  totalInstallments,
  searchTerm,
  setSearchTerm,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  totalPages,
  startIndex,
  loading,
  canCreateAbono,
  canDeleteAbono,
  onCreateNew,
  onViewDetail,
  onCancelInstallment,
}: InstallmentsListViewProps) {
  const handleGeneratePDF = (installment: PaymentInstallment) => {
    alert(`Generando PDF para el abono ${installment.id}...`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-green-800">Gestión de Abonos</h1>
          <p className="text-gray-600 mt-1">Administra pagos de clientes, comprobantes y verificación operativa</p>
        </div>
        {canCreateAbono && (
          <Button onClick={onCreateNew} size="lg" className="bg-green-600 hover:bg-green-700 text-white px-6">
            <Plus className="w-5 h-5 mr-2" />
            Registrar Abono
          </Button>
        )}
      </div>

      <Card className="border-green-100 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <Label>Buscar</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por cliente, abono o servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <Label>Desde</Label>
              <div className="relative mt-2">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <Label>Hasta</Label>
              <div className="relative mt-2">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-green-500"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-100 shadow-sm">
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow className="border-green-100 bg-green-50">
                <TableHead className="text-green-800">ID Abono</TableHead>
                <TableHead className="text-green-800">Cliente</TableHead>
                <TableHead className="text-green-800">Servicio Asociado</TableHead>
                <TableHead className="text-green-800">Monto</TableHead>
                <TableHead className="text-green-800">Fecha</TableHead>
                <TableHead className="text-green-800">Estado</TableHead>
                <TableHead className="text-green-800 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                    Cargando abonos...
                  </TableCell>
                </TableRow>
              ) : installments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                    No se encontraron abonos con los criterios seleccionados
                  </TableCell>
                </TableRow>
              ) : (
                installments.map((installment, index) => (
                  <TableRow
                    key={installment.backendId}
                    className={`border-green-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <TableCell className="font-medium text-green-700">{installment.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{installment.client.name}</p>
                        <p className="text-sm text-gray-500">{installment.client.document}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{installment.reservation.serviceName}</p>
                        <p className="text-sm text-gray-500">{installment.reservation.serviceType}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{formatCurrency(installment.amount)}</TableCell>
                    <TableCell className="text-gray-600">{formatDate(installment.date)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusBadge(installment.status)}>
                        {installment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetail(installment)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGeneratePDF(installment)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Generar PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        {canDeleteAbono && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCancelInstallment(installment)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Anular abono"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalInstallments > 0 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Mostrando {Math.min(startIndex + 1, totalInstallments)} - {Math.min(startIndex + itemsPerPage, totalInstallments)} de {totalInstallments} abonos
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface CreateInstallmentViewProps {
  onBack: () => void;
  onCreate: (payload: {
    reservation: ReservationSummary;
    amount: number;
    paymentMethod: string;
    transactionNumber?: string;
    observations?: string;
    receiptFile?: File | null;
  }) => Promise<void>;
  clients: Client[];
  reservations: ReservationSummary[];
  installments: PaymentInstallment[];
  submitting: boolean;
}

function CreateInstallmentView({
  onBack,
  onCreate,
  clients,
  reservations,
  installments,
  submitting,
}: CreateInstallmentViewProps) {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedReservation, setSelectedReservation] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [observations, setObservations] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const clientData = clients.find((client) => client.id === selectedClient);

  const clientReservations = selectedClient
    ? reservations.filter((reservation) => reservation.client.id === selectedClient && reservation.pendingBalance > 0)
    : [];

  const reservationData = reservations.find((reservation) => reservation.id === selectedReservation);
  const amount = toNumber(installmentAmount);
  const remainingBalance = reservationData ? reservationData.pendingBalance - amount : 0;

  const clientInstallmentHistory = selectedClient
    ? installments.filter((installment) => installment.client.id === selectedClient).slice(0, 3)
    : [];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('El comprobante no puede superar los 5MB');
      return;
    }

    setReceiptFile(file);
  };

  const handleSubmit = async () => {
    if (!clientData) {
      toast.error('Debes seleccionar un cliente');
      return;
    }

    if (!reservationData) {
      toast.error('Debes seleccionar una reserva de finca asociada');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Debes ingresar un monto válido');
      return;
    }

    if (amount > reservationData.pendingBalance) {
      toast.error('El monto abonado no puede ser mayor al saldo pendiente');
      return;
    }

    await onCreate({
      reservation: reservationData,
      amount,
      paymentMethod,
      transactionNumber: transactionNumber || undefined,
      observations: observations || undefined,
      receiptFile,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-green-700 hover:bg-green-50">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-green-800">Registrar Nuevo Abono</h1>
          <p className="text-gray-600 mt-1">Solo se permiten abonos para reservas de finca con saldo pendiente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Sección 1: Datos del Cliente</h2>
              <div className="space-y-4">
                <div>
                  <Label>Cliente *</Label>
                  <Select value={selectedClient} onValueChange={(value) => {
                    setSelectedClient(value);
                    setSelectedReservation('');
                  }}>
                    <SelectTrigger className="mt-2 border-gray-200 focus:border-green-500">
                      <SelectValue placeholder="Selecciona un cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} — {client.document}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {clientData && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Documento</p>
                        <p className="font-medium text-gray-900">{clientData.document}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Teléfono</p>
                        <p className="font-medium text-gray-900">{clientData.phone}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {clientInstallmentHistory.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Historial reciente de abonos:</p>
                    <div className="space-y-2">
                      {clientInstallmentHistory.map((installment) => (
                        <div key={installment.backendId} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                          <span className="text-gray-600">{formatDate(installment.date)}</span>
                          <span className="font-medium text-gray-900">{formatCurrency(installment.amount)}</span>
                          <Badge variant="secondary" className={`text-xs ${getStatusBadge(installment.status)}`}>
                            {installment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Sección 2: Información del Servicio Asociado</h2>
              <div className="space-y-4">
                <div>
                  <Label>Reserva de Finca *</Label>
                  <Select
                    value={selectedReservation}
                    onValueChange={setSelectedReservation}
                    disabled={!selectedClient}
                  >
                    <SelectTrigger className="mt-2 border-gray-200 focus:border-green-500">
                      <SelectValue placeholder={selectedClient ? 'Selecciona una reserva...' : 'Primero selecciona un cliente'} />
                    </SelectTrigger>
                    <SelectContent>
                      {clientReservations.length > 0 ? (
                        clientReservations.map((reservation) => (
                          <SelectItem key={reservation.backendId} value={reservation.id}>
                            {reservation.id} — {reservation.serviceName} — Pendiente: {formatCurrency(reservation.pendingBalance)}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No hay reservas de finca con saldo pendiente
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {reservationData && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Tipo de Servicio</p>
                        <p className="font-medium text-gray-900">{reservationData.serviceType}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Fecha</p>
                        <p className="font-medium text-gray-900">{formatDate(reservationData.date)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Precio Total</p>
                        <p className="font-medium text-gray-900">{formatCurrency(reservationData.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Saldo Pendiente</p>
                        <p className="font-medium text-red-700">{formatCurrency(reservationData.pendingBalance)}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-blue-300">
                      <p className="text-xs text-gray-600 mb-1">Monto sugerido:</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInstallmentAmount(String(Math.ceil(reservationData.pendingBalance / 2)))}
                          className="text-xs border-green-300 text-green-700 hover:bg-green-50"
                        >
                          50% — {formatCurrency(Math.ceil(reservationData.pendingBalance / 2))}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInstallmentAmount(String(reservationData.pendingBalance))}
                          className="text-xs border-green-300 text-green-700 hover:bg-green-50"
                        >
                          100% — {formatCurrency(reservationData.pendingBalance)}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Sección 3: Monto del Abono</h2>
              <div className="space-y-4">
                <div>
                  <Label>Monto Abonado *</Label>
                  <div className="relative mt-2">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="Ingresa el monto abonado..."
                      value={installmentAmount}
                      onChange={(e) => setInstallmentAmount(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-green-500"
                      min="0"
                      max={reservationData?.pendingBalance || 0}
                    />
                  </div>
                  {amount > 0 && reservationData && amount > reservationData.pendingBalance && (
                    <p className="text-xs text-red-600 mt-1">El monto no puede ser mayor al saldo pendiente</p>
                  )}
                </div>

                <div>
                  <Label>Método de Pago *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="mt-2 border-gray-200 focus:border-green-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Número de Transacción</Label>
                  <Input
                    value={transactionNumber}
                    onChange={(e) => setTransactionNumber(e.target.value)}
                    placeholder="Referencia, transacción o consecutivo..."
                    className="mt-2 border-gray-200 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label>Observaciones</Label>
                  <Textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Notas internas del abono..."
                    className="mt-2 min-h-[90px] border-gray-200 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label>Comprobante de Pago</Label>
                  <div className="mt-2">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          {receiptFile ? receiptFile.name : 'Haz clic para subir un comprobante'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF (MAX. 5MB)</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border-green-100 shadow-sm sticky top-6">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Resumen del Abono</h2>

              <div className="space-y-4">
                {clientData && (
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Cliente</p>
                    <p className="font-medium text-gray-900">{clientData.name}</p>
                    <p className="text-sm text-gray-500">{clientData.document}</p>
                  </div>
                )}

                {reservationData && (
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Reserva</p>
                    <p className="font-medium text-gray-900">{reservationData.serviceName}</p>
                    <p className="text-sm text-gray-500">{reservationData.serviceType}</p>
                  </div>
                )}

                {amount > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monto Abonado</span>
                      <span className="font-medium text-green-700">{formatCurrency(amount)}</span>
                    </div>

                    {reservationData && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Saldo Anterior</span>
                          <span className="font-medium text-gray-900">{formatCurrency(reservationData.pendingBalance)}</span>
                        </div>

                        <div className="pt-3 border-t-2 border-green-200">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">Saldo Restante</span>
                            <span className={`font-semibold ${remainingBalance === 0 ? 'text-green-700' : 'text-orange-700'}`}>
                              {formatCurrency(Math.max(remainingBalance, 0))}
                            </span>
                          </div>
                        </div>

                        {remainingBalance === 0 && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-700 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              La venta quedará completamente cubierta cuando el pago sea aprobado
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                <div className="pt-4 space-y-3">
                  <div>
                    <Label className="text-sm text-gray-600">Estado Inicial</Label>
                    <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-700 w-full justify-center">
                      Pendiente
                    </Badge>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Método de Pago</Label>
                    <p className="mt-1 font-medium text-gray-900 capitalize">{paymentMethod}</p>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <Button
                    onClick={handleSubmit}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={submitting || !selectedClient || !selectedReservation || amount <= 0}
                  >
                    {submitting ? 'Registrando...' : 'Registrar Abono'}
                  </Button>
                  <Button onClick={onBack} variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-100">
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

interface InstallmentDetailViewProps {
  installment: PaymentInstallment;
  onBack: () => void;
  onCancel: () => void;
  onVerify: (installment: PaymentInstallment, decision: 'Aprobado' | 'Rechazado', notes?: string, reason?: string) => Promise<void>;
  canDeleteAbono: boolean;
  canEditAbono: boolean;
  loading: boolean;
  processing: boolean;
}

function InstallmentDetailView({
  installment,
  onBack,
  onCancel,
  onVerify,
  canDeleteAbono,
  canEditAbono,
  loading,
  processing,
}: InstallmentDetailViewProps) {
  const [observations, setObservations] = useState(installment.observations || '');
  const [rejectionReason, setRejectionReason] = useState(installment.rejectionReason || '');

  useEffect(() => {
    setObservations(installment.observations || '');
    setRejectionReason(installment.rejectionReason || '');
  }, [installment]);

  const clientHistoryLabel =
    installment.status === 'Pendiente'
      ? 'Pendiente de revisión'
      : installment.status === 'Aprobado'
        ? 'Comprobante aprobado'
        : installment.status === 'Rechazado'
          ? 'Comprobante rechazado'
          : 'Comprobante verificado';

  const handlePrintPDF = () => {
    alert(`Generando PDF del abono ${installment.id}...`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="text-green-700 hover:bg-green-50">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-green-800">Detalle del Abono</h1>
            <p className="text-gray-600 mt-1">ID: {installment.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrintPDF} className="bg-green-600 hover:bg-green-700 text-white">
            <Printer className="w-4 h-4 mr-2" />
            Generar PDF
          </Button>
          {canDeleteAbono && (
            <Button onClick={onCancel} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
              <X className="w-4 h-4 mr-2" />
              Anular Abono
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Información del Cliente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre Completo</p>
                  <p className="font-medium text-gray-900 mt-1">{installment.client.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Documento</p>
                  <p className="font-medium text-gray-900 mt-1">{installment.client.document}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium text-gray-900 mt-1">{installment.client.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900 mt-1">{installment.client.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Información del Abono</h2>
              {loading ? (
                <p className="text-gray-500">Cargando detalle...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">ID del Abono</p>
                    <p className="font-medium text-gray-900 mt-1">{installment.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha</p>
                    <p className="font-medium text-gray-900 mt-1">{formatDate(installment.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monto Abonado</p>
                    <p className="font-medium text-green-700 mt-1">{formatCurrency(installment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Método de Pago</p>
                    <p className="font-medium text-gray-900 mt-1 capitalize">{installment.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado</p>
                    <Badge variant="secondary" className={`mt-1 ${getStatusBadge(installment.status)}`}>
                      {installment.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Número de Transacción</p>
                    <p className="font-medium text-gray-900 mt-1">{installment.transactionNumber || '—'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Comprobante</p>
                    {installment.receiptUrl ? (
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          onClick={() => openReceipt(installment.receiptUrl)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver comprobante
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          onClick={() => openReceipt(installment.receiptUrl)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    ) : (
                      <p className="font-medium text-gray-900 mt-1">No adjuntado</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Observaciones</p>
                    <p className="font-medium text-gray-900 mt-1">{installment.observations || 'Sin observaciones'}</p>
                  </div>
                  {installment.rejectionReason && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Motivo de rechazo</p>
                      <p className="font-medium text-red-700 mt-1">{installment.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Servicio Asociado</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ID Reserva</p>
                  <p className="font-medium text-gray-900 mt-1">{installment.reservation.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Servicio</p>
                  <p className="font-medium text-gray-900 mt-1">{installment.reservation.serviceType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nombre del Servicio</p>
                  <p className="font-medium text-gray-900 mt-1">{installment.reservation.serviceName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha del Servicio</p>
                  <p className="font-medium text-gray-900 mt-1">{formatDate(installment.reservation.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="font-medium text-gray-900 mt-1">{formatCurrency(installment.reservation.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Saldo Pendiente</p>
                  <p className="font-medium text-red-700 mt-1">{formatCurrency(installment.reservation.pendingBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {canEditAbono && (
            <Card className="border-green-100 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-green-800 mb-4">Verificación del Comprobante</h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{clientHistoryLabel}</p>
                    {installment.verificationDate && (
                      <p className="text-xs text-gray-500 mt-1">Fecha de verificación: {formatDate(installment.verificationDate)}</p>
                    )}
                    {installment.verifiedBy && (
                      <p className="text-xs text-gray-500 mt-1">Verificado por: {installment.verifiedBy}</p>
                    )}
                  </div>

                  <div>
                    <Label>Observaciones internas</Label>
                    <Textarea
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="Notas de validación, hallazgos o comentarios del asesor..."
                      className="mt-2 min-h-[90px] border-gray-200 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <Label>Motivo de rechazo</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Solo si vas a rechazar el comprobante..."
                      className="mt-2 min-h-[90px] border-gray-200 focus:border-red-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => onVerify(installment, 'Aprobado', observations)}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Aprobar comprobante
                    </Button>
                    <Button
                      onClick={() => onVerify(installment, 'Rechazado', observations, rejectionReason)}
                      disabled={processing || !rejectionReason.trim()}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Rechazar comprobante
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="border-green-100 shadow-sm sticky top-6">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Acciones Disponibles</h2>
              <div className="space-y-3">
                <Button onClick={handlePrintPDF} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <Printer className="w-4 h-4 mr-2" />
                  Generar PDF
                </Button>

                {installment.receiptUrl && (
                  <Button
                    onClick={() => openReceipt(installment.receiptUrl)}
                    variant="outline"
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Ver comprobante
                  </Button>
                )}

                {canDeleteAbono && (
                  <Button onClick={onCancel} variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-50">
                    <X className="w-4 h-4 mr-2" />
                    Anular Abono
                  </Button>
                )}

                <Button onClick={onBack} variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-100">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Volver al Listado
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <h3 className="font-medium text-gray-900">Resumen Rápido</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium text-gray-900">{installment.client.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <Badge variant="secondary" className={getStatusBadge(installment.status)}>
                      {installment.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Servicio:</span>
                    <span className="font-medium text-gray-900">{installment.reservation.serviceType}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-900">Monto:</span>
                    <span className="font-medium text-green-700">{formatCurrency(installment.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">Saldo Pendiente:</span>
                    <span className="font-medium text-red-700">{formatCurrency(installment.reservation.pendingBalance)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
