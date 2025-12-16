import React, { useState } from 'react';
import {
  DollarSign,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  CreditCard,
  Package,
  TreePine,
  Route,
  FileText,
  ArrowUpRight,
  Download,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface Payment {
  id: number;
  cliente: string;
  ventaAsociada: {
    tipo: 'paquete' | 'finca' | 'ruta';
    nombre: string;
    montoTotal: number;
  };
  montoAbono: number;
  fechaAbono: string;
  estado: 'pendiente' | 'confirmado' | 'excedido';
  saldoRestante: number;
  medioPago: string;
  observacion?: string;
  abonosAnteriores: Array<{
    id: number;
    monto: number;
    fecha: string;
    medioPago: string;
  }>;
  totalAbonado: number;
}

// Mock data
const mockPayments: Payment[] = [
  {
    id: 1,
    cliente: 'María López',
    ventaAsociada: {
      tipo: 'paquete',
      nombre: 'Paquete Aventura Montaña',
      montoTotal: 2500000
    },
    montoAbono: 500000,
    fechaAbono: '2025-10-08',
    estado: 'confirmado',
    saldoRestante: 1500000,
    medioPago: 'Transferencia',
    totalAbonado: 1000000,
    abonosAnteriores: [
      { id: 1, monto: 500000, fecha: '2025-09-15', medioPago: 'Efectivo' },
      { id: 2, monto: 500000, fecha: '2025-10-08', medioPago: 'Transferencia' }
    ]
  },
  {
    id: 2,
    cliente: 'Carlos Ramírez',
    ventaAsociada: {
      tipo: 'finca',
      nombre: 'Finca El Paraíso',
      montoTotal: 1800000
    },
    montoAbono: 600000,
    fechaAbono: '2025-10-09',
    estado: 'confirmado',
    saldoRestante: 600000,
    medioPago: 'Tarjeta',
    totalAbonado: 1200000,
    abonosAnteriores: [
      { id: 1, monto: 600000, fecha: '2025-09-20', medioPago: 'Transferencia' },
      { id: 2, monto: 600000, fecha: '2025-10-09', medioPago: 'Tarjeta' }
    ]
  },
  {
    id: 3,
    cliente: 'Ana García',
    ventaAsociada: {
      tipo: 'ruta',
      nombre: 'Ruta Ecológica Valle Verde',
      montoTotal: 3200000
    },
    montoAbono: 800000,
    fechaAbono: '2025-10-10',
    estado: 'pendiente',
    saldoRestante: 2400000,
    medioPago: 'Transferencia',
    totalAbonado: 800000,
    abonosAnteriores: [
      { id: 1, monto: 800000, fecha: '2025-10-10', medioPago: 'Transferencia' }
    ]
  },
  {
    id: 4,
    cliente: 'Roberto Pérez',
    ventaAsociada: {
      tipo: 'paquete',
      nombre: 'Paquete Familia Completo',
      montoTotal: 4500000
    },
    montoAbono: 1500000,
    fechaAbono: '2025-10-05',
    estado: 'confirmado',
    saldoRestante: 1500000,
    medioPago: 'Efectivo',
    totalAbonado: 3000000,
    abonosAnteriores: [
      { id: 1, monto: 1000000, fecha: '2025-09-10', medioPago: 'Efectivo' },
      { id: 2, monto: 500000, fecha: '2025-09-25', medioPago: 'Transferencia' },
      { id: 3, monto: 1500000, fecha: '2025-10-05', medioPago: 'Efectivo' }
    ]
  },
  {
    id: 5,
    cliente: 'Laura Martínez',
    ventaAsociada: {
      tipo: 'finca',
      nombre: 'Finca Los Robles',
      montoTotal: 2200000
    },
    montoAbono: 700000,
    fechaAbono: '2025-10-07',
    estado: 'confirmado',
    saldoRestante: 800000,
    medioPago: 'Tarjeta',
    totalAbonado: 1400000,
    abonosAnteriores: [
      { id: 1, monto: 700000, fecha: '2025-09-18', medioPago: 'Tarjeta' },
      { id: 2, monto: 700000, fecha: '2025-10-07', medioPago: 'Tarjeta' }
    ]
  }
];

export function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    cliente: '',
    tipoServicio: 'paquete',
    nombreServicio: '',
    montoTotal: '',
    montoAbono: '',
    fechaAbono: new Date().toISOString().split('T')[0],
    medioPago: 'efectivo',
    observacion: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getServiceIcon = (tipo: string) => {
    switch (tipo) {
      case 'paquete':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'finca':
        return <TreePine className="w-4 h-4 text-orange-600" />;
      case 'ruta':
        return <Route className="w-4 h-4 text-green-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getServiceBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'paquete':
        return 'bg-blue-100 text-blue-700';
      case 'finca':
        return 'bg-orange-100 text-orange-700';
      case 'ruta':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'confirmado':
        return <Badge className="bg-green-100 text-green-700">Confirmado</Badge>;
      case 'pendiente':
        return <Badge className="bg-blue-100 text-blue-700">Pendiente</Badge>;
      case 'excedido':
        return <Badge className="bg-orange-100 text-orange-700">Excedido</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">Desconocido</Badge>;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.ventaAsociada.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'todos' || 
      payment.estado === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewModalOpen(true);
  };

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setFormData({
      cliente: payment.cliente,
      tipoServicio: payment.ventaAsociada.tipo,
      nombreServicio: payment.ventaAsociada.nombre,
      montoTotal: payment.ventaAsociada.montoTotal.toString(),
      montoAbono: payment.montoAbono.toString(),
      fechaAbono: payment.fechaAbono,
      medioPago: payment.medioPago.toLowerCase(),
      observacion: payment.observacion || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPayment) {
      setPayments(payments.filter(p => p.id !== selectedPayment.id));
      toast.success('Abono eliminado correctamente');
      setIsDeleteDialogOpen(false);
      setSelectedPayment(null);
    }
  };

  const handleAddPayment = () => {
    const montoTotal = parseFloat(formData.montoTotal);
    const montoAbono = parseFloat(formData.montoAbono);

    if (montoAbono > montoTotal) {
      toast.error('El monto del abono no puede superar el monto total');
      return;
    }

    const newPayment: Payment = {
      id: payments.length + 1,
      cliente: formData.cliente,
      ventaAsociada: {
        tipo: formData.tipoServicio as 'paquete' | 'finca' | 'ruta',
        nombre: formData.nombreServicio,
        montoTotal: montoTotal
      },
      montoAbono: montoAbono,
      fechaAbono: formData.fechaAbono,
      estado: 'pendiente',
      saldoRestante: montoTotal - montoAbono,
      medioPago: formData.medioPago.charAt(0).toUpperCase() + formData.medioPago.slice(1),
      observacion: formData.observacion,
      totalAbonado: montoAbono,
      abonosAnteriores: [
        {
          id: 1,
          monto: montoAbono,
          fecha: formData.fechaAbono,
          medioPago: formData.medioPago.charAt(0).toUpperCase() + formData.medioPago.slice(1)
        }
      ]
    };

    setPayments([...payments, newPayment]);
    toast.success('Abono agregado correctamente');
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleUpdatePayment = () => {
    if (selectedPayment) {
      const montoTotal = parseFloat(formData.montoTotal);
      const montoAbono = parseFloat(formData.montoAbono);

      if (montoAbono > montoTotal) {
        toast.error('El monto del abono no puede superar el monto total');
        return;
      }

      const updatedPayments = payments.map(p => 
        p.id === selectedPayment.id
          ? {
              ...p,
              cliente: formData.cliente,
              ventaAsociada: {
                tipo: formData.tipoServicio as 'paquete' | 'finca' | 'ruta',
                nombre: formData.nombreServicio,
                montoTotal: montoTotal
              },
              montoAbono: montoAbono,
              fechaAbono: formData.fechaAbono,
              medioPago: formData.medioPago.charAt(0).toUpperCase() + formData.medioPago.slice(1),
              observacion: formData.observacion,
              saldoRestante: montoTotal - p.totalAbonado
            }
          : p
      );

      setPayments(updatedPayments);
      toast.success('Abono actualizado correctamente');
      setIsEditModalOpen(false);
      setSelectedPayment(null);
      resetForm();
    }
  };

  const handleAddNewPaymentToSale = () => {
    if (selectedPayment) {
      const newPaymentAmount = parseFloat(prompt('Ingrese el monto del nuevo abono:') || '0');
      
      if (newPaymentAmount <= 0) {
        toast.error('El monto debe ser mayor a 0');
        return;
      }

      if (newPaymentAmount > selectedPayment.saldoRestante) {
        toast.error('El monto no puede superar el saldo restante');
        return;
      }

      const updatedPayments = payments.map(p => {
        if (p.id === selectedPayment.id) {
          const newTotalAbonado = p.totalAbonado + newPaymentAmount;
          const newSaldoRestante = p.ventaAsociada.montoTotal - newTotalAbonado;
          
          return {
            ...p,
            totalAbonado: newTotalAbonado,
            saldoRestante: newSaldoRestante,
            estado: newSaldoRestante === 0 ? 'confirmado' as const : p.estado,
            abonosAnteriores: [
              ...p.abonosAnteriores,
              {
                id: p.abonosAnteriores.length + 1,
                monto: newPaymentAmount,
                fecha: new Date().toISOString().split('T')[0],
                medioPago: 'Transferencia'
              }
            ]
          };
        }
        return p;
      });

      setPayments(updatedPayments);
      setSelectedPayment(updatedPayments.find(p => p.id === selectedPayment.id) || null);
      toast.success('Nuevo abono agregado correctamente');
    }
  };

  const resetForm = () => {
    setFormData({
      cliente: '',
      tipoServicio: 'paquete',
      nombreServicio: '',
      montoTotal: '',
      montoAbono: '',
      fechaAbono: new Date().toISOString().split('T')[0],
      medioPago: 'efectivo',
      observacion: ''
    });
  };

  const calculateProgress = (payment: Payment) => {
    return (payment.totalAbonado / payment.ventaAsociada.montoTotal) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Gestión de Abonos</h1>
            <p className="text-gray-600">Ventas / Abonos de clientes</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Abono
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar abono o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="excedido">Excedido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Cliente</TableHead>
                  <TableHead className="w-[150px]">Venta Asociada</TableHead>
                  <TableHead className="w-[130px]">Monto del Abono</TableHead>
                  <TableHead className="w-[130px]">Fecha del Abono</TableHead>
                  <TableHead className="w-[140px]">Estado del Abono</TableHead>
                  <TableHead className="w-[130px]">Saldo Restante</TableHead>
                  <TableHead className="w-[120px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No se encontraron abonos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{payment.cliente}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getServiceIcon(payment.ventaAsociada.tipo)}
                          <div>
                            <p className="font-medium">{payment.ventaAsociada.nombre}</p>
                            <Badge
                              variant="secondary"
                              className={`text-xs mt-1 ${getServiceBadgeColor(payment.ventaAsociada.tipo)}`}
                            >
                              {payment.ventaAsociada.tipo.charAt(0).toUpperCase() + payment.ventaAsociada.tipo.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.montoAbono)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {new Date(payment.fechaAbono).toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.estado)}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {formatCurrency(payment.saldoRestante)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(payment)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(payment)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(payment)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Payment Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Abono</DialogTitle>
            <DialogDescription>
              Complete los campos para registrar un nuevo abono de cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente</Label>
                <Input
                  value={formData.cliente}
                  onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <Label>Tipo de Servicio</Label>
                <Select
                  value={formData.tipoServicio}
                  onValueChange={(value) => setFormData({ ...formData, tipoServicio: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paquete">Paquete</SelectItem>
                    <SelectItem value="finca">Finca</SelectItem>
                    <SelectItem value="ruta">Ruta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Nombre del Servicio</Label>
              <Input
                value={formData.nombreServicio}
                onChange={(e) => setFormData({ ...formData, nombreServicio: e.target.value })}
                placeholder="Ej: Paquete Aventura Montaña"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monto Total de la Venta</Label>
                <Input
                  type="number"
                  value={formData.montoTotal}
                  onChange={(e) => setFormData({ ...formData, montoTotal: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Monto del Abono</Label>
                <Input
                  type="number"
                  value={formData.montoAbono}
                  onChange={(e) => setFormData({ ...formData, montoAbono: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha del Abono</Label>
                <Input
                  type="date"
                  value={formData.fechaAbono}
                  onChange={(e) => setFormData({ ...formData, fechaAbono: e.target.value })}
                />
              </div>
              <div>
                <Label>Medio de Pago</Label>
                <Select
                  value={formData.medioPago}
                  onValueChange={(value) => setFormData({ ...formData, medioPago: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Observación (Opcional)</Label>
              <Textarea
                value={formData.observacion}
                onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                placeholder="Notas adicionales sobre el abono..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddPayment}>
                Agregar Abono
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Abono</DialogTitle>
            <DialogDescription>
              Modifique los campos del abono seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente</Label>
                <Input
                  value={formData.cliente}
                  onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <Label>Tipo de Servicio</Label>
                <Select
                  value={formData.tipoServicio}
                  onValueChange={(value) => setFormData({ ...formData, tipoServicio: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paquete">Paquete</SelectItem>
                    <SelectItem value="finca">Finca</SelectItem>
                    <SelectItem value="ruta">Ruta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Nombre del Servicio</Label>
              <Input
                value={formData.nombreServicio}
                onChange={(e) => setFormData({ ...formData, nombreServicio: e.target.value })}
                placeholder="Ej: Paquete Aventura Montaña"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monto Total de la Venta</Label>
                <Input
                  type="number"
                  value={formData.montoTotal}
                  onChange={(e) => setFormData({ ...formData, montoTotal: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Monto del Abono</Label>
                <Input
                  type="number"
                  value={formData.montoAbono}
                  onChange={(e) => setFormData({ ...formData, montoAbono: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha del Abono</Label>
                <Input
                  type="date"
                  value={formData.fechaAbono}
                  onChange={(e) => setFormData({ ...formData, fechaAbono: e.target.value })}
                />
              </div>
              <div>
                <Label>Medio de Pago</Label>
                <Select
                  value={formData.medioPago}
                  onValueChange={(value) => setFormData({ ...formData, medioPago: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Observación (Opcional)</Label>
              <Textarea
                value={formData.observacion}
                onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                placeholder="Notas adicionales sobre el abono..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdatePayment}>
                Actualizar Abono
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Abono</DialogTitle>
            <DialogDescription>
              Información completa del abono y historial de pagos.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6">
              {/* Client and Service Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Cliente</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <p className="font-medium">{selectedPayment.cliente}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tipo de Servicio</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getServiceIcon(selectedPayment.ventaAsociada.tipo)}
                      <Badge
                        variant="secondary"
                        className={getServiceBadgeColor(selectedPayment.ventaAsociada.tipo)}
                      >
                        {selectedPayment.ventaAsociada.tipo.charAt(0).toUpperCase() + selectedPayment.ventaAsociada.tipo.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Nombre del Paquete</p>
                    <p className="font-medium mt-1">{selectedPayment.ventaAsociada.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <div className="mt-1">
                      {getStatusBadge(selectedPayment.estado)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Monto Total</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {formatCurrency(selectedPayment.ventaAsociada.montoTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Abonado</p>
                  <p className="text-lg font-semibold text-green-600 mt-1">
                    {formatCurrency(selectedPayment.totalAbonado)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Saldo Pendiente</p>
                  <p className="text-lg font-semibold text-orange-600 mt-1">
                    {formatCurrency(selectedPayment.saldoRestante)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-700">Progreso de Pago</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {calculateProgress(selectedPayment).toFixed(1)}%
                  </p>
                </div>
                <Progress value={calculateProgress(selectedPayment)} className="h-3" />
              </div>

              {/* Payment History */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Historial de Abonos</h3>
                  <Button
                    size="sm"
                    onClick={handleAddNewPaymentToSale}
                    disabled={selectedPayment.saldoRestante === 0}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Nuevo Abono
                  </Button>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Medio de Pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPayment.abonosAnteriores.map((abono) => (
                        <TableRow key={abono.id}>
                          <TableCell>
                            {new Date(abono.fecha).toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(abono.monto)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <CreditCard className="w-4 h-4 text-gray-400" />
                              <span>{abono.medioPago}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selectedPayment.observacion && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">Observación</p>
                  <p className="text-sm text-blue-800">{selectedPayment.observacion}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el abono de {selectedPayment?.cliente}. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}