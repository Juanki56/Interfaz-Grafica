import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { motion } from 'motion/react';
import {
  DollarSign, Search, Plus, Eye, Ban, Calendar, FileText, Download, X, Upload,
  AlertCircle, CheckCircle, Building2, ChevronLeft, ChevronRight
} from 'lucide-react';

// UI components
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from './ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from './ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from './ui/select';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from './ui/alert-dialog';

// IMPORTA TU API REAL:
import { pagosProveedoresAPI, proveedoresAPI } from '../services/api';

// INTERFACE DATA SEGÚN TU TABLA
interface PagoProveedor {
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

// INTERFACE PARA PROVEEDOR SELECT
interface Proveedor {
  id_proveedores: number;
  nombre: string;
  // otros campos si necesitas
}

export function ProviderPaymentManagement() {
  // DATA
  const [payments, setPayments] = useState<PagoProveedor[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAnnulDialogOpen, setIsAnnulDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PagoProveedor | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [formData, setFormData] = useState({
    id_proveedores: '',
    observaciones: '',
    monto: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: 'transferencia',
    numero_transaccion: '',
    comprobante_pago: '',
    estado: 'activo'
  });

  // CARGAR PAGOS Y PROVEEDORES DESDE EL BACKEND

  useEffect(() => {
    async function fetchAll() {
      try {
        const [pagos, provs] = await Promise.all([
          pagosProveedoresAPI.getAll(),
          proveedoresAPI.getAll()
        ]);
        setPayments(pagos);
        setProveedores(provs);
      } catch (err) {
        toast.error('Error cargando pagos o proveedores');
      }
    }
    fetchAll();
  }, []);

  // FILTRAR DATOS (búsqueda/proveedor/estado)
  const filteredPayments = payments.filter(payment => {
    const proveedor = proveedores.find(p => p.id_proveedores === payment.id_proveedores)?.nombre || '';
    const matchesSearch =
      proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.observaciones ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.numero_transaccion ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'todos' ||
      (payment.estado ?? 'activo').toLowerCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // PAGINACIÓN
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const currentPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // FORMATTERS
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(amount);
  const getStatusBadge = (estado?: string | null) => {
    if ((estado ?? '').toLowerCase() === 'anulado')
      return <Badge className="bg-red-100 text-red-700 border-red-200"><Ban className="w-3 h-3 mr-1" /> Anulado</Badge>;
    return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Activo</Badge>;
  };
  const getMethodBadge = (metodo?: string | null) => {
    const label = (metodo ?? '').toLowerCase();
    const color = label === 'transferencia'
      ? 'bg-blue-100 text-blue-700'
      : label === 'efectivo'
        ? 'bg-green-100 text-green-700'
        : label === 'cheque'
          ? 'bg-purple-100 text-purple-700'
          : label === 'tarjeta'
            ? 'bg-orange-100 text-orange-700'
            : 'bg-gray-100 text-gray-700';
    return <Badge className={color}>{metodo}</Badge>;
  };

  // ACCIONES
  const handleViewDetails = (payment: PagoProveedor) => {
    setSelectedPayment(payment);
    setIsViewModalOpen(true);
  };

  const handleAnnul = (payment: PagoProveedor) => {
    if ((payment.estado ?? '').toLowerCase() === 'anulado') {
      toast.error('Este pago ya está anulado');
      return;
    }
    setSelectedPayment(payment);
    setIsAnnulDialogOpen(true);
  };

  const handleDownloadPDF = (payment: PagoProveedor) => {
    try {
      const proveedorNombre =
        proveedores.find((p) => p.id_proveedores === payment.id_proveedores)?.nombre ??
        String(payment.id_proveedores);
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 14;
      const maxW = pageW - margin * 2;
      let y = 18;

      doc.setFontSize(16);
      doc.text('Comprobante de pago a proveedor', margin, y);
      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, margin, y);
      y += 12;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);

      const fechaPago = new Date(payment.fecha_pago).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const bloques: string[] = [
        `ID de pago: #${payment.id_pago_proveedor.toString().padStart(4, '0')}`,
        `Proveedor: ${proveedorNombre}`,
        `Monto: ${formatCurrency(payment.monto)}`,
        `Fecha de pago: ${fechaPago}`,
        `Método de pago: ${payment.metodo_pago ?? '—'}`,
        `Nº transacción / factura: ${payment.numero_transaccion ?? '—'}`,
        `Estado: ${(payment.estado ?? 'activo').toString()}`,
      ];
      if (payment.comprobante_pago) {
        bloques.push(`Comprobante: ${payment.comprobante_pago}`);
      }
      bloques.push('Concepto / observaciones:');
      bloques.push(payment.observaciones || '—');

      for (const block of bloques) {
        const lines = doc.splitTextToSize(block, maxW);
        for (const line of lines) {
          if (y > 280) {
            doc.addPage();
            y = 18;
          }
          doc.text(line, margin, y);
          y += 6;
        }
        y += 2;
      }

      doc.save(`pago-proveedor-${payment.id_pago_proveedor}.pdf`);
      toast.success('PDF descargado');
    } catch {
      toast.error('No se pudo generar el PDF');
    }
  };

  const confirmAnnul = async () => {
    if (selectedPayment) {
      try {
        await pagosProveedoresAPI.update(selectedPayment.id_pago_proveedor, { estado: 'anulado' });
        toast.success('Pago anulado correctamente.');
        // recargar
        const pagos = await pagosProveedoresAPI.getAll();
        setPayments(pagos);
        setIsAnnulDialogOpen(false);
        setSelectedPayment(null);
      } catch (err) {
        toast.error('Error al anular el pago. Intenta de nuevo.');
      }
    }
  };

  const handleRegisterPayment = async () => {
    try {
      if (!formData.id_proveedores || !formData.observaciones.trim() || !formData.monto) {
        toast.error('Completa todos los campos obligatorios (*)');
        return;
      }
      const pago = {
        id_proveedores: Number(formData.id_proveedores),
        observaciones: formData.observaciones,
        monto: Number(formData.monto),
        fecha_pago: formData.fecha_pago,
        metodo_pago: formData.metodo_pago,
        numero_transaccion: formData.numero_transaccion,
        comprobante_pago: formData.comprobante_pago,
        estado: 'activo'
      };
      await pagosProveedoresAPI.create(pago);
      toast.success('Pago registrado exitosamente.');
      setIsRegisterModalOpen(false);
      resetForm();
      const pagos = await pagosProveedoresAPI.getAll();
      setPayments(pagos);
    } catch (err) {
      toast.error('Hubo un error al registrar el pago.');
    }
  };

  const resetForm = () => {
    setFormData({
      id_proveedores: '',
      observaciones: '',
      monto: '',
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo_pago: 'transferencia',
      numero_transaccion: '',
      comprobante_pago: '',
      estado: 'activo'
    });
  };

  // --------------------------------- UI ---------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl text-gray-900 mb-2">Gestión de Pagos a Proveedores</h1>
            <p className="text-gray-600">
              Administra y registra todos los pagos realizados a proveedores de servicios turísticos
            </p>
          </div>
          <Button
            onClick={() => setIsRegisterModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Nuevo Pago
          </Button>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por proveedor, observación o número de transacción..."
              className="pl-9 border-green-200 focus:border-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchTerm('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Payments Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="border-green-100">
          <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100">
            <CardTitle className="flex items-center space-x-2 text-gray-900">
              <FileText className="w-5 h-5 text-green-600" />
              <span>Historial de Pagos a Proveedores</span>
              <Badge variant="secondary" className="ml-2">
                {filteredPayments.length} registros
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[70px] font-semibold">ID</TableHead>
                  <TableHead className="w-[180px] font-semibold">Proveedor</TableHead>
                  <TableHead className="w-[200px] font-semibold">Observaciones</TableHead>
                  <TableHead className="w-[130px] font-semibold">Monto</TableHead>
                  <TableHead className="w-[130px] font-semibold">Fecha Pago</TableHead>
                  <TableHead className="w-[150px] font-semibold">Método de Pago</TableHead>
                  <TableHead className="w-[120px] text-right font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-2">
                        <AlertCircle className="w-12 h-12 text-gray-400" />
                        <p className="text-gray-500">No se encontraron pagos con los criterios especificados</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPayments.map((payment, idx) => (
                    <motion.tr
                      key={payment.id_pago_proveedor}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      className={`hover:bg-green-50/50 transition-colors ${
                        (payment.estado ?? '').toLowerCase() === 'anulado' ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <TableCell className="font-mono text-sm text-gray-600">
                        #{payment.id_pago_proveedor.toString().padStart(4, '0')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {proveedores.find(p => p.id_proveedores === payment.id_proveedores)?.nombre ?? payment.id_proveedores}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-gray-900 truncate">{payment.observaciones}</p>
                          {payment.numero_transaccion ? (
                            <p className="text-xs text-gray-500 mt-1">
                              <FileText className="w-3 h-3 inline mr-1" />
                              {payment.numero_transaccion}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {formatCurrency(payment.monto)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(payment.fecha_pago).toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="cursor-default pointer-events-none">
                            {getMethodBadge(payment.metodo_pago)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(payment)}
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPDF(payment)}
                            title="Descargar PDF"
                          >
                            <Download className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAnnul(payment)}
                            disabled={(payment.estado ?? '').toLowerCase() === 'anulado'}
                            title="Anular pago"
                          >
                            <Ban className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>
        <div className="text-gray-500">
          Página {currentPage} de {totalPages}
        </div>
        <Button
          variant="outline"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Modal Registrar */}
      <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-green-700">
              <Plus className="w-5 h-5" /><span>Registrar Nuevo Pago a Proveedor</span>
            </DialogTitle>
            <DialogDescription>
              Complete los campos. Los campos con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="proveedor">Proveedor *</Label>
              <Select
                value={formData.id_proveedores.toString()}
                onValueChange={v => setFormData({ ...formData, id_proveedores: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((prov) => (
                    <SelectItem key={prov.id_proveedores} value={prov.id_proveedores.toString()}>
                      {prov.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="observaciones">Concepto/Observaciones *</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Ej: Pago transporte septiembre"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monto">Monto *</Label>
                <Input
                  id="monto"
                  type="number"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>
              <div>
                <Label htmlFor="fecha_pago">Fecha del Pago *</Label>
                <Input
                  id="fecha_pago"
                  type="date"
                  value={formData.fecha_pago}
                  onChange={(e) => setFormData({ ...formData, fecha_pago: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metodo_pago">Método de Pago *</Label>
                <Select
                  value={formData.metodo_pago}
                  onValueChange={(v) => setFormData({ ...formData, metodo_pago: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="numero_transaccion">Número de Transacción/Factura</Label>
                <Input
                  id="numero_transaccion"
                  value={formData.numero_transaccion}
                  onChange={(e) => setFormData({ ...formData, numero_transaccion: e.target.value })}
                  placeholder="Ej: FAC-2025-001"
                />
              </div>
            </div>
            {/* <div>
              <Label htmlFor="comprobante_pago">Comprobante de Pago</Label>
              <Input
                id="comprobante_pago"
                value={formData.comprobante_pago}
                onChange={(e) => setFormData({ ...formData, comprobante_pago: e.target.value })}
                placeholder="URL o info del comprobante"
              />
            </div> */}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRegisterModalOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRegisterPayment}
              className="bg-green-600 hover:bg-green-700"
            >
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalles */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-green-600" />
              <span>Detalles del Pago</span>
            </DialogTitle>
            <DialogDescription>
              Información completa del pago realizado al proveedor.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">ID de Pago</Label>
                  <p className="font-mono font-semibold text-gray-900">
                    #{selectedPayment.id_pago_proveedor.toString().padStart(4, '0')}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Estado</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedPayment.estado)}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-gray-600">Proveedor</Label>
                <p className="font-semibold text-gray-900">
                  {proveedores.find(prov => prov.id_proveedores === selectedPayment.id_proveedores)?.nombre ?? selectedPayment.id_proveedores}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Concepto/Observaciones</Label>
                <p className="text-gray-900">{selectedPayment.observaciones}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Monto</Label>
                  <p className="text-2xl text-green-600">{formatCurrency(selectedPayment.monto)}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Método de Pago</Label>
                  <div className="mt-1">
                    {getMethodBadge(selectedPayment.metodo_pago)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Fecha de Pago</Label>
                  <p className="text-gray-900">
                    {new Date(selectedPayment.fecha_pago).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Factura / Transacción</Label>
                  <p className="text-gray-900">{selectedPayment.numero_transaccion || 'No registrada'}</p>
                </div>
              </div>
              {selectedPayment.comprobante_pago && (
                <div>
                  <Label className="text-gray-600">Comprobante de Pago</Label>
                  <p className="text-gray-900">{selectedPayment.comprobante_pago}</p>
                </div>
              )}
              {(selectedPayment.estado ?? '').toLowerCase() === 'anulado' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-red-900">Este pago ha sido anulado</p>
                      <p className="text-sm text-red-700 mt-1">
                        El registro permanece en el historial pero no se contabiliza en los totales.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewModalOpen(false);
                setSelectedPayment(null);
              }}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar Anulación */}
      <AlertDialog open={isAnnulDialogOpen} onOpenChange={setIsAnnulDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-red-700">
              <Ban className="w-5 h-5" /><span>¿Anular este pago?</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPayment &&
                <>Está a punto de anular el pago a <strong>
                  {proveedores.find(p => p.id_proveedores === selectedPayment.id_proveedores)?.nombre ?? selectedPayment.id_proveedores}
                </strong>. Esta acción es <strong>permanente</strong> y cambiará el estado a <b>Anulado</b>. El registro no será eliminado y permanecerá para trazabilidad.</>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAnnul}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, Anular Pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}