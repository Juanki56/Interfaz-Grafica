import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';
import { reservasAPI, ventasAPI, type Reserva, type Venta } from '../services/api';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
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
import { Textarea } from './ui/textarea';

type ViewMode = 'list' | 'detail';

function formatCurrency(value?: number | string | null) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('es-CO');
}

function getSaleType(reserva: Reserva | null) {
  if (!reserva) return 'Reserva';
  const hasProgramacion = Array.isArray(reserva.programaciones) && reserva.programaciones.length > 0;
  const hasFinca = Array.isArray((reserva as any).fincas) && (reserva as any).fincas.length > 0;
  if (hasProgramacion && hasFinca) return 'Ruta + Finca';
  if (hasProgramacion) return 'Ruta programada';
  if (hasFinca) return 'Finca';
  return 'Reserva';
}

function getStatusBadgeClass(status?: string | null) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'pagado') return 'bg-green-100 text-green-700 border-green-200';
  if (normalized === 'parcial') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (normalized === 'cancelado') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-yellow-100 text-yellow-700 border-yellow-200';
}

export function SalesManagement() {
  const permisos = usePermissions();
  const ventasPerms = createModulePermissions(permisos, 'Ventas');
  const canViewVentas = ventasPerms.canView();
  const canEditVenta = ventasPerms.canEdit();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sales, setSales] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pendiente' | 'Parcial' | 'Pagado' | 'Cancelado'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<Venta | null>(null);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState<Venta | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const itemsPerPage = 10;

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await ventasAPI.getAll();
      setSales(data || []);
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron cargar las ventas.');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canViewVentas) return;
    void loadSales();
  }, [canViewVentas]);

  const filteredSales = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return sales.filter((sale) => {
      const matchesStatus = statusFilter === 'all' || String(sale.estado_pago || '') === statusFilter;
      const searchable = [
        sale.id_venta,
        sale.id_reserva,
        sale.cliente_nombre,
        sale.cliente_apellido,
        sale.cliente_telefono,
        sale.metodo_pago,
        sale.estado_pago,
      ]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');
      const matchesSearch = !term || searchable.includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [sales, searchTerm, statusFilter]);

  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSales, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleViewDetail = async (sale: Venta) => {
    try {
      setDetailLoading(true);
      setSelectedSale(null);
      setSelectedReserva(null);
      const [ventaDetalle, reservaDetalle] = await Promise.all([
        ventasAPI.getById(sale.id_venta),
        reservasAPI.getById(sale.id_reserva),
      ]);
      setSelectedSale(ventaDetalle);
      setSelectedReserva(reservaDetalle);
      setViewMode('detail');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cargar el detalle de la venta.');
    } finally {
      setDetailLoading(false);
    }
  };

  const initiateCancel = (sale: Venta) => {
    if (!canEditVenta) {
      toast.error('No tienes permiso para anular ventas.');
      return;
    }
    setSaleToCancel(sale);
    setCancellationReason('');
    setShowCancelDialog(true);
  };

  const handleConfirmCancellation = async () => {
    if (!saleToCancel) return;
    try {
      await ventasAPI.cancelar(saleToCancel.id_venta);
      toast.success('Venta anulada correctamente.');
      setShowCancelDialog(false);
      setSaleToCancel(null);
      if (selectedSale?.id_venta === saleToCancel.id_venta) {
        setViewMode('list');
        setSelectedSale(null);
        setSelectedReserva(null);
      }
      await loadSales();
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo anular la venta.');
    }
  };

  if (!permisos.loadingRoles && !canViewVentas) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-red-700">Acceso denegado</h2>
            <p className="text-gray-700 mt-2">No tienes permiso para ver ventas.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewMode === 'detail' && selectedSale) {
    const saleType = getSaleType(selectedReserva);
    const programacion = selectedReserva?.programaciones?.[0];
    const finca = (selectedReserva as any)?.fincas?.[0];
    const servicios = selectedReserva?.servicios || [];
    const acompanantes = (selectedReserva as any)?.acompanantes || [];

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setViewMode('list')} className="text-green-700 hover:bg-green-50">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-green-800">Detalle de venta #{selectedSale.id_venta}</h1>
            <p className="text-gray-600 mt-1">Información real cargada desde la base de datos.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-green-100 shadow-sm">
            <CardHeader>
              <CardTitle>Resumen comercial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="text-gray-900">{selectedSale.cliente_nombre} {selectedSale.cliente_apellido}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <p className="text-gray-900">{saleType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monto total</p>
                  <p className="text-gray-900">{formatCurrency(selectedSale.monto_total)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pagado</p>
                  <p className="text-gray-900">{formatCurrency(selectedSale.monto_pagado)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Saldo pendiente</p>
                  <p className="text-gray-900">{formatCurrency(selectedSale.saldo_pendiente)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Metodo de pago</p>
                  <p className="text-gray-900">{selectedSale.metodo_pago || 'Por definir'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <Badge variant="outline" className={getStatusBadgeClass(selectedSale.estado_pago)}>
                    {selectedSale.estado_pago}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="text-gray-900">{formatDate(selectedSale.fecha_venta || selectedSale.fecha_creacion)}</p>
                </div>
              </div>

              {selectedSale.notas ? (
                <div>
                  <p className="text-sm text-gray-500">Notas de la reserva</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedSale.notas}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-green-100 shadow-sm">
            <CardHeader>
              <CardTitle>Reserva asociada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">ID reserva</span>
                <span className="text-gray-900">#{selectedSale.id_reserva}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Estado reserva</span>
                <span className="text-gray-900">{selectedSale.reserva_estado || 'Pendiente'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Acompanantes</span>
                <span className="text-gray-900">{acompanantes.length}</span>
              </div>
              {canEditVenta && selectedSale.estado_pago !== 'Cancelado' ? (
                <Button className="w-full bg-red-600 hover:bg-red-700" onClick={() => initiateCancel(selectedSale)}>
                  <X className="w-4 h-4 mr-2" />
                  Anular venta
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {programacion ? (
          <Card className="border-green-100 shadow-sm">
            <CardHeader>
              <CardTitle>Ruta programada</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Ruta</p>
                <p className="text-gray-900">{programacion.ruta_nombre || `Programación #${programacion.id_programacion}`}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha salida</p>
                <p className="text-gray-900">{formatDate(programacion.fecha_salida)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Horario</p>
                <p className="text-gray-900">{programacion.hora_salida || '—'}{programacion.hora_regreso ? ` - ${programacion.hora_regreso}` : ''}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cantidad personas</p>
                <p className="text-gray-900">{programacion.cantidad_personas || 1}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {finca ? (
          <Card className="border-green-100 shadow-sm">
            <CardHeader>
              <CardTitle>Finca asociada</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Finca</p>
                <p className="text-gray-900">{finca.finca_nombre || `Finca #${finca.id_finca}`}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ubicación</p>
                <p className="text-gray-900">{finca.ubicacion || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Check-in</p>
                <p className="text-gray-900">{formatDate(finca.fecha_checkin)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Check-out</p>
                <p className="text-gray-900">{formatDate(finca.fecha_checkout)}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-green-100 shadow-sm">
            <CardHeader>
              <CardTitle>Servicios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {servicios.length === 0 ? (
                <p className="text-gray-500">No hay servicios asociados a esta venta.</p>
              ) : (
                servicios.map((servicio: any) => (
                  <div key={`${servicio.id_detalle_reserva_servicio}-${servicio.id_servicio}`} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-gray-900">{servicio.servicio_nombre}</p>
                    <p className="text-sm text-gray-500">
                      Cantidad: {servicio.cantidad} | Subtotal: {formatCurrency(servicio.subtotal)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-green-100 shadow-sm">
            <CardHeader>
              <CardTitle>Acompanantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {acompanantes.length === 0 ? (
                <p className="text-gray-500">La reserva no tiene acompanantes.</p>
              ) : (
                acompanantes.map((acompanante: any) => (
                  <div key={acompanante.id_detalle_reserva_acompanante} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-gray-900">{acompanante.nombre} {acompanante.apellido}</p>
                    <p className="text-sm text-gray-500">
                      {acompanante.tipo_documento || 'Documento'}: {acompanante.numero_documento || '—'}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-green-800">Gestión de Ventas</h1>
          <p className="text-gray-600 mt-1">Ventas reales conectadas a la base de datos.</p>
        </div>
      </div>

      <Card className="border-green-100 shadow-sm">
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Buscar</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Cliente, reserva, venta, telefono..."
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Estado de pago</Label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as any)}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Parcial">Parcial</option>
                <option value="Pagado">Pagado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-100 shadow-sm">
        <CardContent className="p-6">
          {loading ? (
            <div className="py-16 flex items-center justify-center text-gray-500">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Cargando ventas...
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="py-16 text-center text-gray-500">No se encontraron ventas registradas.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-green-100 bg-green-50">
                      <TableHead className="text-green-800">Venta</TableHead>
                      <TableHead className="text-green-800">Cliente</TableHead>
                      <TableHead className="text-green-800">Monto total</TableHead>
                      <TableHead className="text-green-800">Pagado</TableHead>
                      <TableHead className="text-green-800">Saldo</TableHead>
                      <TableHead className="text-green-800">Estado</TableHead>
                      <TableHead className="text-green-800">Fecha</TableHead>
                      <TableHead className="text-green-800 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSales.map((sale, index) => (
                      <TableRow key={sale.id_venta} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <TableCell className="font-medium text-green-700">#{sale.id_venta}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">
                              {sale.cliente_nombre} {sale.cliente_apellido}
                            </p>
                            <p className="text-sm text-gray-500">Reserva #{sale.id_reserva}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(sale.monto_total)}</TableCell>
                        <TableCell>{formatCurrency(sale.monto_pagado)}</TableCell>
                        <TableCell>{formatCurrency(sale.saldo_pendiente)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusBadgeClass(sale.estado_pago)}>
                            {sale.estado_pago}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(sale.fecha_venta || sale.fecha_creacion)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleViewDetail(sale)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              {detailLoading && selectedSale?.id_venta === sale.id_venta ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            {sale.estado_pago !== 'Cancelado' && canEditVenta ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => initiateCancel(sale)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 ? (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredSales.length)} de {filteredSales.length} ventas
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-white border-2 border-red-200">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-red-900">
                Advertencia: anular venta
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p className="text-gray-700">
                  Vas a anular la venta <span className="font-semibold text-red-700">#{saleToCancel?.id_venta}</span>.
                </p>
                <p className="text-gray-700">
                  La venta seguirá existiendo en la base de datos, pero quedará con estado de pago <strong>Cancelado</strong>.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="sales-cancel-reason">Motivo (referencial)</Label>
                  <Textarea
                    id="sales-cancel-reason"
                    value={cancellationReason}
                    onChange={(event) => setCancellationReason(event.target.value)}
                    placeholder="Ej. error operativo, duplicado, ajuste administrativo..."
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCancelDialog(false)}>Cerrar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirmCancellation()} className="bg-red-600 hover:bg-red-700">
              Sí, anular venta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
