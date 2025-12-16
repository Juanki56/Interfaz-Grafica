import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign,
  Search,
  Plus,
  Eye,
  Ban,
  Calendar,
  FileText,
  Download,
  Filter,
  X,
  Upload,
  AlertCircle,
  CheckCircle,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
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
import { toast } from 'sonner@2.0.3';
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

interface ProviderPayment {
  id: number;
  proveedor: string;
  concepto: string;
  monto: number;
  fechaRegistro: string;
  estado: 'activo' | 'anulado';
  metodoPago: string;
  factura?: string;
  observaciones?: string;
}

// Mock data
const mockPayments: ProviderPayment[] = [
  {
    id: 1,
    proveedor: 'Transportes Valle Verde S.A.S',
    concepto: 'Servicio de transporte turístico - Mes de Septiembre',
    monto: 3500000,
    fechaRegistro: '2025-10-01',
    estado: 'activo',
    metodoPago: 'Transferencia',
    factura: 'FAC-2025-001',
    observaciones: 'Pago correspondiente a rutas realizadas en septiembre'
  },
  {
    id: 2,
    proveedor: 'Hotel Montaña Azul',
    concepto: 'Hospedaje grupal - Tour Cafetero',
    monto: 2800000,
    fechaRegistro: '2025-10-05',
    estado: 'activo',
    metodoPago: 'Cheque',
    factura: 'FAC-2025-045',
    observaciones: 'Reserva grupo de 15 personas, 3 días'
  },
  {
    id: 3,
    proveedor: 'Restaurante El Mirador',
    concepto: 'Servicio de alimentación - Eventos corporativos',
    monto: 1500000,
    fechaRegistro: '2025-10-08',
    estado: 'activo',
    metodoPago: 'Efectivo',
    factura: 'FAC-2025-089',
    observaciones: 'Almuerzos y refrigerios para 40 personas'
  },
  {
    id: 4,
    proveedor: 'Guías Profesionales del Cauca',
    concepto: 'Honorarios guías especializados - Octubre',
    monto: 4200000,
    fechaRegistro: '2025-10-12',
    estado: 'activo',
    metodoPago: 'Transferencia',
    factura: 'FAC-2025-112',
    observaciones: 'Pago a 6 guías especializados'
  },
  {
    id: 5,
    proveedor: 'Equipos y Seguridad Outdoor',
    concepto: 'Compra de equipos de seguridad',
    monto: 5600000,
    fechaRegistro: '2025-09-28',
    estado: 'anulado',
    metodoPago: 'Transferencia',
    factura: 'FAC-2025-098',
    observaciones: 'Pago anulado por devolución de mercancía defectuosa'
  },
  {
    id: 6,
    proveedor: 'Finca Eco-Turística El Bosque',
    concepto: 'Arriendo instalaciones - Evento empresarial',
    monto: 3200000,
    fechaRegistro: '2025-10-15',
    estado: 'activo',
    metodoPago: 'Transferencia',
    factura: 'FAC-2025-134',
    observaciones: 'Alquiler de instalaciones para retiro corporativo'
  },
  {
    id: 7,
    proveedor: 'Seguros La Protectora',
    concepto: 'Póliza de seguro turístico - Trimestre Q4',
    monto: 2100000,
    fechaRegistro: '2025-10-18',
    estado: 'activo',
    metodoPago: 'Transferencia',
    factura: 'FAC-2025-156',
    observaciones: 'Cobertura para todos los tours del trimestre'
  },
  {
    id: 8,
    proveedor: 'Publicidad Digital 360',
    concepto: 'Campaña de marketing digital - Septiembre',
    monto: 1800000,
    fechaRegistro: '2025-09-25',
    estado: 'anulado',
    metodoPago: 'Efectivo',
    factura: 'FAC-2025-087',
    observaciones: 'Anulado por incumplimiento de métricas acordadas'
  }
];

export function ProviderPaymentManagement() {
  const [payments, setPayments] = useState<ProviderPayment[]>(mockPayments);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterMethod, setFilterMethod] = useState('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAnnulDialogOpen, setIsAnnulDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<ProviderPayment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [formData, setFormData] = useState({
    proveedor: '',
    concepto: '',
    monto: '',
    fechaRegistro: new Date().toISOString().split('T')[0],
    metodoPago: 'transferencia',
    factura: '',
    observaciones: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'activo':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Activo
          </Badge>
        );
      case 'anulado':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <Ban className="w-3 h-3 mr-1" />
            Anulado
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-700">Desconocido</Badge>;
    }
  };

  const getMethodBadge = (metodo: string) => {
    const colors = {
      'Transferencia': 'bg-blue-100 text-blue-700',
      'Efectivo': 'bg-green-100 text-green-700',
      'Cheque': 'bg-purple-100 text-purple-700',
      'Tarjeta': 'bg-orange-100 text-orange-700'
    };
    return <Badge className={colors[metodo] || 'bg-gray-100 text-gray-700'}>{metodo}</Badge>;
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.factura?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'todos' || 
      payment.estado === filterStatus;

    const matchesMethod = 
      filterMethod === 'todos' || 
      payment.metodoPago === filterMethod;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const handleViewDetails = (payment: ProviderPayment) => {
    setSelectedPayment(payment);
    setIsViewModalOpen(true);
  };

  const handleAnnul = (payment: ProviderPayment) => {
    if (payment.estado === 'anulado') {
      toast.error('Este pago ya está anulado');
      return;
    }
    
    setSelectedPayment(payment);
    setIsAnnulDialogOpen(true);
  };

  const confirmAnnul = () => {
    if (selectedPayment) {
      setPayments(payments.map(p => 
        p.id === selectedPayment.id 
          ? { ...p, estado: 'anulado' as const }
          : p
      ));
      toast.success('Pago anulado correctamente. El registro permanece en el historial.');
      setIsAnnulDialogOpen(false);
      setSelectedPayment(null);
    }
  };

  const handleRegisterPayment = () => {
    if (!formData.proveedor.trim() || !formData.concepto.trim() || !formData.monto) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    const monto = parseFloat(formData.monto);
    if (isNaN(monto) || monto <= 0) {
      toast.error('El monto debe ser un número válido mayor a 0');
      return;
    }

    const newPayment: ProviderPayment = {
      id: Math.max(...payments.map(p => p.id), 0) + 1,
      proveedor: formData.proveedor,
      concepto: formData.concepto,
      monto: monto,
      fechaRegistro: formData.fechaRegistro,
      estado: 'activo',
      metodoPago: formData.metodoPago.charAt(0).toUpperCase() + formData.metodoPago.slice(1),
      factura: formData.factura || undefined,
      observaciones: formData.observaciones || undefined
    };

    setPayments([newPayment, ...payments]);
    toast.success('Pago registrado correctamente');
    setIsRegisterModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      proveedor: '',
      concepto: '',
      monto: '',
      fechaRegistro: new Date().toISOString().split('T')[0],
      metodoPago: 'transferencia',
      factura: '',
      observaciones: ''
    });
  };

  const handleExport = () => {
    toast.success('Exportando historial de pagos...');
    // Aquí iría la lógica de exportación real
  };

  const handleDownloadPDF = () => {
    toast.success('Descargando PDF de pagos a proveedores...');
    // Aquí iría la lógica real de generación de PDF
  };

  const stats = {
    totalPagos: payments.filter(p => p.estado === 'activo').length,
    totalAnulados: payments.filter(p => p.estado === 'anulado').length,
    montoTotal: payments.filter(p => p.estado === 'activo').reduce((sum, p) => sum + p.monto, 0),
    mesActual: payments.filter(p => {
      const paymentDate = new Date(p.fechaRegistro);
      const currentDate = new Date();
      return paymentDate.getMonth() === currentDate.getMonth() && 
             paymentDate.getFullYear() === currentDate.getFullYear() &&
             p.estado === 'activo';
    }).length
  };

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const currentPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
            <Button
              onClick={() => setIsRegisterModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Nuevo Pago
            </Button>
          </div>
        </div>

        {/* Search and Download */}
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
              placeholder="Buscar por proveedor, concepto o factura..."
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

      {/* Table */}
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
                  <TableHead className="w-[200px] font-semibold">Concepto/Servicio</TableHead>
                  <TableHead className="w-[130px] font-semibold">Monto</TableHead>
                  <TableHead className="w-[130px] font-semibold">Fecha Registro</TableHead>
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
                  currentPayments.map((payment, index) => (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className={`hover:bg-green-50/50 transition-colors ${
                        payment.estado === 'anulado' ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <TableCell className="font-mono text-sm text-gray-600">
                        #{payment.id.toString().padStart(4, '0')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{payment.proveedor}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-gray-900 truncate">{payment.concepto}</p>
                          {payment.factura && (
                            <p className="text-xs text-gray-500 mt-1">
                              <FileText className="w-3 h-3 inline mr-1" />
                              {payment.factura}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {formatCurrency(payment.monto)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(payment.fechaRegistro).toLocaleDateString('es-CO', {
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
                            {getMethodBadge(payment.metodoPago)}
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
                            onClick={() => {
                              setSelectedPayment(payment);
                              handleDownloadPDF();
                            }}
                            title="Descargar PDF"
                          >
                            <Download className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAnnul(payment)}
                            disabled={payment.estado === 'anulado'}
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

      {/* Register Payment Modal */}
      <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-green-700">
              <Plus className="w-5 h-5" />
              <span>Registrar Nuevo Pago a Proveedor</span>
            </DialogTitle>
            <DialogDescription>
              Complete los campos para mantener un control financiero preciso. Los campos con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="proveedor">Proveedor *</Label>
              <Input
                id="proveedor"
                value={formData.proveedor}
                onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                placeholder="Nombre del proveedor o entidad"
              />
            </div>

            <div>
              <Label htmlFor="concepto">Concepto del Pago *</Label>
              <Textarea
                id="concepto"
                value={formData.concepto}
                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                placeholder="Descripción del servicio prestado o producto adquirido"
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
                <Label htmlFor="fechaRegistro">Fecha del Pago *</Label>
                <Input
                  id="fechaRegistro"
                  type="date"
                  value={formData.fechaRegistro}
                  onChange={(e) => setFormData({ ...formData, fechaRegistro: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metodoPago">Método de Pago *</Label>
                <Select
                  value={formData.metodoPago}
                  onValueChange={(value) => setFormData({ ...formData, metodoPago: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
                <Label htmlFor="factura">Número de Factura</Label>
                <Input
                  id="factura"
                  value={formData.factura}
                  onChange={(e) => setFormData({ ...formData, factura: e.target.value })}
                  placeholder="Ej: FAC-2025-001"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="archivo">Cargar Comprobante/Factura</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Haga clic para cargar o arrastre el archivo aquí
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, PNG, JPG (máx. 10MB)
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales sobre este pago..."
                rows={3}
              />
            </div>
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

      {/* View Details Modal */}
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
                    #{selectedPayment.id.toString().padStart(4, '0')}
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
                <p className="font-semibold text-gray-900">{selectedPayment.proveedor}</p>
              </div>

              <div>
                <Label className="text-gray-600">Concepto/Servicio Prestado</Label>
                <p className="text-gray-900">{selectedPayment.concepto}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Monto</Label>
                  <p className="text-2xl text-green-600">{formatCurrency(selectedPayment.monto)}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Método de Pago</Label>
                  <div className="mt-1">
                    {getMethodBadge(selectedPayment.metodoPago)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Fecha de Registro</Label>
                  <p className="text-gray-900">
                    {new Date(selectedPayment.fechaRegistro).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Factura</Label>
                  <p className="text-gray-900">{selectedPayment.factura || 'No registrada'}</p>
                </div>
              </div>

              {selectedPayment.observaciones && (
                <div>
                  <Label className="text-gray-600">Observaciones</Label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedPayment.observaciones}
                  </p>
                </div>
              )}

              {selectedPayment.estado === 'anulado' && (
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

      {/* Annul Confirmation Dialog */}
      <AlertDialog open={isAnnulDialogOpen} onOpenChange={setIsAnnulDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-red-700">
              <Ban className="w-5 h-5" />
              <span>¿Anular este pago?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Está a punto de anular el pago a <span className="font-semibold">{selectedPayment?.proveedor}</span>.
              </span>
              <span className="block text-red-600">
                Esta acción es <strong>permanente</strong> y cambiará el estado del pago a "Anulado".
              </span>
              <span className="block">
                El registro NO será eliminado y permanecerá en el historial para mantener la trazabilidad financiera.
              </span>
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