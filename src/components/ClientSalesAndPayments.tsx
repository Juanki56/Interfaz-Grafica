import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  MapPin,
  Route as RouteIcon,
  Search,
  ShoppingCart,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../App';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { pagosAPI, reservasAPI } from '../services/api';
import {
  clientPaymentFlowLabel,
  resolveClientPaymentFlowKind,
  type ClientPaymentFlowKind,
} from '../utils/clientPaymentFlow';

type ClientSaleItem = {
  id: string;
  saleId: number;
  reservationId: number;
  service: string;
  type: string;
  date: string;
  amount: number;
  paid: number;
  pending: number;
  status: string;
  paymentMethod: string;
};

type ClientPaymentItem = {
  id: string;
  paymentId: number;
  saleId: number;
  reservationId: number;
  sale: string;
  amount: number;
  date: string;
  paymentMethod: string;
  totalSale: number;
  remaining: number;
  status: string;
  notes: string;
  comprobanteUrl?: string | null;
  transactionNumber?: string | null;
  rejectionReason?: string | null;
  paymentFlowKind: ClientPaymentFlowKind;
};

type ClientProgrammingItem = {
  id: string;
  programacionId: number;
  reservationId: number;
  routeName: string;
  date: string;
  time: string;
  people: number;
  meetingPoint: string;
  subtotal: number;
};

const formatCurrency = (value?: number | string | null) =>
  `$${Number(value || 0).toLocaleString('es-CO')}`;

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return String(value).split('T')[0] || '—';
};

const resolveServiceType = (value?: string | null) => {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('finca')) return 'Finca';
  if (normalized.includes('servicio')) return 'Servicio';
  if (normalized.includes('ruta')) return 'Ruta';
  return 'Reserva';
};

const getSaleStatusBadge = (status?: string | null) => {
  const normalized = String(status || 'Pendiente').trim();
  const classes: Record<string, string> = {
    Pagado: 'bg-green-100 text-green-800 border-green-200',
    Parcial: 'bg-blue-100 text-blue-800 border-blue-200',
    Pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Cancelado: 'bg-red-100 text-red-800 border-red-200',
  };
  return <Badge className={classes[normalized] || 'bg-gray-100 text-gray-800'}>{normalized}</Badge>;
};

const normalizeClientAbonoStatus = (status?: string | null) => {
  const k = String(status || 'Pendiente').trim().toLowerCase();
  if (k === 'aprobado') return 'Aprobado';
  if (k === 'verificado') return 'Verificado';
  if (k === 'rechazado') return 'Rechazado';
  if (k === 'pendiente') return 'Pendiente';
  return 'Pendiente';
};

const getInstallmentStatusBadge = (status?: string | null) => {
  const normalized = normalizeClientAbonoStatus(status);
  const classes: Record<string, string> = {
    Aprobado: 'bg-green-100 text-green-800 border-green-200',
    Verificado: 'bg-blue-100 text-blue-800 border-blue-200',
    Pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Rechazado: 'bg-red-100 text-red-800 border-red-200',
  };
  return <Badge className={classes[normalized] || 'bg-gray-100 text-gray-800'}>{normalized}</Badge>;
};

function useClientSalesData() {
  const { user } = useAuth();
  const [sales, setSales] = useState<ClientSaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSales = async () => {
      if (!user?.id || user.role !== 'client') {
        setSales([]);
        return;
      }

      try {
        setIsLoading(true);
        const reservas = await reservasAPI.getByCliente(Number(user.id));
        const mapped = reservas
          .filter((booking: any) => Number(booking.id_venta ?? 0) > 0)
          .map((booking: any) => {
            const reservationId = Number(booking.id_reserva ?? booking.id ?? 0);
            const saleId = Number(booking.id_venta ?? 0);
            return {
              id: `VEN-${saleId}`,
              saleId,
              reservationId,
              service: String(booking.tipo_servicio || `Reserva #${reservationId}`),
              type: resolveServiceType(booking.tipo_servicio),
              date: formatDate(booking.fecha_reserva),
              amount: Number(booking.total ?? booking.monto_total ?? 0),
              paid: Number(booking.monto_pagado ?? 0),
              pending: Number(booking.saldo_pendiente ?? booking.total ?? booking.monto_total ?? 0),
              status: String(booking.estado_pago || 'Pendiente'),
              paymentMethod: booking.metodo_pago || 'Por definir',
            };
          });
        setSales(mapped);
      } catch (error) {
        console.error('Error cargando ventas del cliente en perfil:', error);
        setSales([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSales();
  }, [user?.id, user?.role]);

  return { sales, isLoading };
}

function useClientPaymentsData() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<ClientPaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadPayments = async () => {
      if (!user?.id || user.role !== 'client') {
        setPayments([]);
        return;
      }

      try {
        setIsLoading(true);
        const reservas = await reservasAPI.getByCliente(Number(user.id));
        const pagosPorReserva = await Promise.all(
          reservas.map(async (booking: any) => {
            const reservationId = Number(booking.id_reserva ?? booking.id ?? 0);
            if (!reservationId) return [];
            try {
              const pagos = await pagosAPI.getByReserva(reservationId);
              return pagos.map((payment) => ({ payment, booking }));
            } catch (error) {
              console.error(`Error cargando pagos de reserva ${reservationId}:`, error);
              return [];
            }
          })
        );

        const mapped = pagosPorReserva.flat().map(({ payment, booking }: any) => ({
          id: `ABO-${payment.id_pago}`,
          paymentId: Number(payment.id_pago),
          saleId: Number(payment.id_venta ?? booking.id_venta ?? 0),
          reservationId: Number(payment.id_reserva ?? booking.id_reserva ?? booking.id ?? 0),
          sale: `${booking.tipo_servicio || 'Reserva'} · Venta #${payment.id_venta ?? booking.id_venta ?? '—'}`,
          amount: Number(payment.monto ?? 0),
          date: formatDate(payment.fecha_pago),
          paymentMethod: payment.metodo_pago || 'Por definir',
          totalSale: Number(booking.total ?? booking.monto_total ?? 0),
          remaining: Number(booking.saldo_pendiente ?? booking.total ?? booking.monto_total ?? 0),
          status: normalizeClientAbonoStatus(payment.estado),
          notes: payment.observaciones || '',
          comprobanteUrl: payment.comprobante_url || null,
          transactionNumber: payment.numero_transaccion || null,
          rejectionReason: payment.motivo_rechazo || null,
          paymentFlowKind: resolveClientPaymentFlowKind(booking),
        }));

        setPayments(mapped);
      } catch (error) {
        console.error('Error cargando abonos del cliente en perfil:', error);
        setPayments([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPayments();
  }, [user?.id, user?.role]);

  return { payments, isLoading };
}

function useClientProgrammingsData() {
  const { user } = useAuth();
  const [programmings, setProgrammings] = useState<ClientProgrammingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadProgrammings = async () => {
      if (!user?.id || user.role !== 'client') {
        setProgrammings([]);
        return;
      }

      try {
        setIsLoading(true);
        const reservas = await reservasAPI.getByCliente(Number(user.id));
        const details = await Promise.all(
          reservas.map(async (booking: any) => {
            const reservationId = Number(booking.id_reserva ?? booking.id ?? 0);
            if (!reservationId) return null;
            try {
              return await reservasAPI.getById(reservationId);
            } catch (error) {
              console.error(`Error cargando programación de reserva ${reservationId}:`, error);
              return null;
            }
          })
        );

        const items: ClientProgrammingItem[] = [];
        details.forEach((detail: any) => {
          if (!detail || !Array.isArray(detail.programaciones)) return;
          detail.programaciones.forEach((item: any) => {
            const programacionId = Number(item.id_programacion ?? 0);
            if (!programacionId) return;
            items.push({
              id: `PRO-${programacionId}-${detail.id_reserva}`,
              programacionId,
              reservationId: Number(detail.id_reserva),
              routeName: item.ruta_nombre || `Programación #${programacionId}`,
              date: formatDate(item.fecha_salida),
              time: String(item.hora_salida || '').slice(0, 5) || '—',
              people: Number(item.cantidad_personas ?? detail.numero_participantes ?? 1),
              meetingPoint: item.lugar_encuentro || 'Por confirmar',
              subtotal: Number(item.subtotal ?? item.precio_unitario ?? 0),
            });
          });
        });

        setProgrammings(items);
      } catch (error) {
        console.error('Error cargando programaciones del cliente en perfil:', error);
        setProgrammings([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProgrammings();
  }, [user?.id, user?.role]);

  return { programmings, isLoading };
}

export function ClientSalesTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<ClientSaleItem | null>(null);
  const { sales, isLoading } = useClientSalesData();

  const filteredSales = useMemo(
    () =>
      sales.filter((sale) => {
        const query = searchTerm.toLowerCase();
        return (
          sale.id.toLowerCase().includes(query) ||
          sale.service.toLowerCase().includes(query) ||
          sale.type.toLowerCase().includes(query)
        );
      }),
    [sales, searchTerm]
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-gray-800 flex items-center space-x-2">
            <ShoppingCart className="w-6 h-6 text-green-600" />
            <span>Mis Ventas</span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Ventas reales asociadas a tus reservas y solicitudes.
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por ID, servicio o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-green-200 focus:border-green-500"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {filteredSales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {isLoading ? 'Cargando ventas...' : 'No tienes ventas registradas aún.'}
              </div>
            ) : (
              filteredSales.map((sale) => (
                <Card key={sale.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{sale.service}</h3>
                            <p className="text-sm text-gray-600">ID: {sale.id}</p>
                          </div>
                          {getSaleStatusBadge(sale.status)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-3">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{sale.type}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span>{sale.date}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-green-700">{formatCurrency(sale.amount)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-green-600" />
                            <span>{sale.paymentMethod}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Detalle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-green-800">Detalle de la venta</DialogTitle>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Venta</p>
                  <p className="text-xl font-semibold">{selectedSale.id}</p>
                </div>
                {getSaleStatusBadge(selectedSale.status)}
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Servicio:</span> <span className="font-medium">{selectedSale.service}</span></div>
                <div><span className="text-gray-500">Reserva:</span> <span className="font-medium">#{selectedSale.reservationId}</span></div>
                <div><span className="text-gray-500">Fecha:</span> <span className="font-medium">{selectedSale.date}</span></div>
                <div><span className="text-gray-500">Método:</span> <span className="font-medium">{selectedSale.paymentMethod}</span></div>
                <div><span className="text-gray-500">Total:</span> <span className="font-medium">{formatCurrency(selectedSale.amount)}</span></div>
                <div><span className="text-gray-500">Pagado:</span> <span className="font-medium">{formatCurrency(selectedSale.paid)}</span></div>
                <div><span className="text-gray-500">Saldo:</span> <span className="font-medium">{formatCurrency(selectedSale.pending)}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ClientPaymentsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<ClientPaymentItem | null>(null);
  const { payments, isLoading } = useClientPaymentsData();

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const query = searchTerm.toLowerCase();
        return (
          payment.id.toLowerCase().includes(query) ||
          payment.sale.toLowerCase().includes(query) ||
          String(payment.saleId).includes(query)
        );
      }),
    [payments, searchTerm]
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-gray-800 flex items-center space-x-2">
            <Wallet className="w-6 h-6 text-blue-600" />
            <span>Mis Abonos</span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Abonos reales registrados para tus reservas y ventas.{' '}
            <span className="text-gray-700">
              En <strong>salidas programadas</strong> pagas al reservar el cupo; en <strong>solicitudes personalizadas</strong>{' '}
              el asesor habilita el pago antes de subir el comprobante.
            </span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por ID de abono o venta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-500"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {isLoading ? 'Cargando abonos...' : 'No tienes abonos registrados aún.'}
              </div>
            ) : (
              filteredPayments.map((payment) => (
                <Card key={payment.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{payment.sale}</h3>
                            <p className="text-sm text-gray-600">ID Abono: {payment.id}</p>
                          </div>
                          {getInstallmentStatusBadge(payment.status)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mt-3">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-500">Monto abonado</p>
                              <p className="font-semibold text-blue-700">{formatCurrency(payment.amount)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-500">Fecha</p>
                              <p className="font-medium">{payment.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-500">Método</p>
                              <p className="font-medium">{payment.paymentMethod}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Detalle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-green-800">Detalle del abono</DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Abono</p>
                  <p className="text-xl font-semibold">{selectedPayment.id}</p>
                </div>
                {getInstallmentStatusBadge(selectedPayment.status)}
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Contexto:</span> <span className="font-medium">{clientPaymentFlowLabel(selectedPayment.paymentFlowKind)}</span></div>
                <div><span className="text-gray-500">Venta:</span> <span className="font-medium">#{selectedPayment.saleId || '—'}</span></div>
                <div><span className="text-gray-500">Reserva:</span> <span className="font-medium">#{selectedPayment.reservationId}</span></div>
                <div><span className="text-gray-500">Monto:</span> <span className="font-medium">{formatCurrency(selectedPayment.amount)}</span></div>
                <div><span className="text-gray-500">Saldo restante:</span> <span className="font-medium">{formatCurrency(selectedPayment.remaining)}</span></div>
                <div><span className="text-gray-500">Método:</span> <span className="font-medium">{selectedPayment.paymentMethod}</span></div>
                <div><span className="text-gray-500">Transacción:</span> <span className="font-medium">{selectedPayment.transactionNumber || 'No registrada'}</span></div>
              </div>
              {selectedPayment.notes ? (
                <div className="rounded-lg bg-blue-50 p-4 text-sm text-gray-700">
                  <strong>Observaciones:</strong> {selectedPayment.notes}
                </div>
              ) : null}
              {selectedPayment.status === 'Rechazado' ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-950 space-y-2">
                  <p className="font-semibold text-red-900">Comprobante no aceptado</p>
                  <p className="text-xs font-medium text-red-800">{clientPaymentFlowLabel(selectedPayment.paymentFlowKind)}</p>
                  {selectedPayment.paymentFlowKind === 'programmed_route' ? (
                    <p>
                      En <strong>salida programada</strong> pagaste al apartar cupo; corrige el comprobante y vuelve a registrar el
                      pago si el saldo o el equipo lo requieren.
                    </p>
                  ) : selectedPayment.paymentFlowKind === 'custom_request' ? (
                    <p>
                      En <strong>solicitud personalizada</strong> el pago solo procede cuando el asesor lo habilita; revisa el
                      motivo y reenvía el comprobante desde tu solicitud cuando siga abierta al pago.
                    </p>
                  ) : selectedPayment.paymentFlowKind === 'finca' ? (
                    <p>Abono de finca: prepara un comprobante corregido y un nuevo abono si aplica saldo pendiente.</p>
                  ) : (
                    <p>Revisa el motivo del rechazo y sigue las indicaciones de tu asesor para volver a enviar el pago.</p>
                  )}
                  {selectedPayment.rejectionReason ? (
                    <p>
                      <span className="text-red-800">Motivo: </span>
                      {selectedPayment.rejectionReason}
                    </p>
                  ) : (
                    <p className="text-red-800">Contacta a OCCITOUR para saber qué corregir y cómo volver a enviar el pago.</p>
                  )}
                  <p className="text-red-900/90">
                    Con saldo pendiente en la venta, podrás registrar un nuevo abono cuando el equipo lo habilite (salvo en flujo
                    personalizado, donde depende de la solicitud).
                  </p>
                </div>
              ) : null}
              {selectedPayment.comprobanteUrl ? (
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                  <a href={selectedPayment.comprobanteUrl} target="_blank" rel="noreferrer">
                    <FileText className="w-4 h-4 mr-2" />
                    Ver comprobante
                  </a>
                </Button>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ClientProgrammingsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgramming, setSelectedProgramming] = useState<ClientProgrammingItem | null>(null);
  const { programmings, isLoading } = useClientProgrammingsData();

  const filteredProgrammings = useMemo(
    () =>
      programmings.filter((item) => {
        const query = searchTerm.toLowerCase();
        return (
          item.id.toLowerCase().includes(query) ||
          item.routeName.toLowerCase().includes(query) ||
          String(item.programacionId).includes(query)
        );
      }),
    [programmings, searchTerm]
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-gray-800 flex items-center space-x-2">
            <RouteIcon className="w-6 h-6 text-emerald-600" />
            <span>Mis Programaciones</span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Salidas programadas que sí quedaron asociadas a tus reservas.
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por ID o ruta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-emerald-200 focus:border-emerald-500"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {filteredProgrammings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {isLoading ? 'Cargando programaciones...' : 'No tienes programaciones registradas aún.'}
              </div>
            ) : (
              filteredProgrammings.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-emerald-500">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{item.routeName}</h3>
                          <p className="text-sm text-gray-600">Programación #{item.programacionId}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            <span>{item.date}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-emerald-600" />
                            <span>{item.people} personas</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            <span>{item.meetingPoint}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            <span className="font-semibold text-emerald-700">{formatCurrency(item.subtotal)}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => setSelectedProgramming(item)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Detalle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedProgramming} onOpenChange={(open) => !open && setSelectedProgramming(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-green-800">Detalle de la programación</DialogTitle>
          </DialogHeader>

          {selectedProgramming && (
            <div className="space-y-4 mt-4">
              <div className="rounded-lg bg-emerald-50 p-4">
                <p className="text-sm text-gray-600">Ruta</p>
                <p className="text-xl font-semibold text-gray-800">{selectedProgramming.routeName}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Programación:</span> <span className="font-medium">#{selectedProgramming.programacionId}</span></div>
                <div><span className="text-gray-500">Reserva:</span> <span className="font-medium">#{selectedProgramming.reservationId}</span></div>
                <div><span className="text-gray-500">Fecha:</span> <span className="font-medium">{selectedProgramming.date}</span></div>
                <div><span className="text-gray-500">Hora:</span> <span className="font-medium">{selectedProgramming.time}</span></div>
                <div><span className="text-gray-500">Personas:</span> <span className="font-medium">{selectedProgramming.people}</span></div>
                <div><span className="text-gray-500">Punto de encuentro:</span> <span className="font-medium">{selectedProgramming.meetingPoint}</span></div>
                <div><span className="text-gray-500">Subtotal:</span> <span className="font-medium">{formatCurrency(selectedProgramming.subtotal)}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
