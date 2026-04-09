import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  TrendingUp,
  Filter,
  Download,
  Calendar,
  Users,
  Eye,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Package,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Plus,
  Edit,
  Power,
  Trash2,
  Settings,
  Target,
  TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
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
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import { mockBookings } from '../utils/adminMockData';

export function DashboardAnalytics() {
  const [viewMode, setViewMode] = useState<'table' | 'charts'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [bookings, setBookings] = useState(mockBookings);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<any>(null);
  const [bookingToEdit, setBookingToEdit] = useState<any>(null);
  const itemsPerPage = 10;

  // Estado para el formulario de creación de métrica
  const [newMetric, setNewMetric] = useState({
    // Configuración básica
    metricName: '',
    serviceType: '', // 'rutas' o 'fincas'
    selectedServices: [] as string[],
    reservationFilter: 'all', // 'Confirmadas', 'Canceladas', 'Pendientes', 'all'
    dateRange: 'month', // 'week', 'fortnight', 'month', 'custom'
    customDateStart: '',
    customDateEnd: '',
    clientType: 'all', // 'all', 'recurring', 'new'
    // Variables a metricar
    metrics: {
      numberOfReservations: false,
      generatedIncome: false,
      averageOccupancy: false, // para fincas
      averageAttendance: false, // para rutas
      cancellationsVsConfirmations: false,
    },
    // Configuración de visualización
    chartType: 'bars', // 'bars', 'lines', 'pie', 'table'
    temporalGrouping: 'month', // 'week', 'fortnight', 'month'
    comparison: 'none', // 'none', 'previous', 'yearAgo'
  });

  // Datos de servicios disponibles (mock - en producción vendrían de la BD)
  const availableServices = {
    rutas: ['Ruta del Café', 'Valle de Cocora', 'Salento Tour', 'Filandia Histórica'],
    fincas: ['Finca El Paraíso', 'Finca La Esperanza', 'Hacienda El Ocaso', 'Villa Turística']
  };

  // Filtrar reservas (ahora usa bookings del estado local)
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.packageName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesDate = !dateFilter || booking.date === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Paginación
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  // Calcular métricas
  const metrics = {
    total: filteredBookings.length,
    confirmadas: filteredBookings.filter(b => b.status === 'Confirmada').length,
    pendientes: filteredBookings.filter(b => b.status === 'Pendiente').length,
    canceladas: filteredBookings.filter(b => b.status === 'Cancelada').length,
    completadas: filteredBookings.filter(b => b.status === 'Completada').length,
    ingresos: filteredBookings.reduce((sum, b) => sum + (b.total || 0), 0),
  };

  // Datos para gráficas
  const statusData = [
    { name: 'Confirmada', value: metrics.confirmadas, color: '#22c55e' },
    { name: 'Pendiente', value: metrics.pendientes, color: '#eab308' },
    { name: 'Cancelada', value: metrics.canceladas, color: '#ef4444' },
    { name: 'Completada', value: metrics.completadas, color: '#3b82f6' },
  ];

  const monthlyData = [
    { month: 'Ene', reservas: 42, ingresos: 8400000 },
    { month: 'Feb', reservas: 38, ingresos: 7600000 },
    { month: 'Mar', reservas: 51, ingresos: 10200000 },
    { month: 'Abr', reservas: 45, ingresos: 9000000 },
    { month: 'May', reservas: 58, ingresos: 11600000 },
    { month: 'Jun', reservas: 62, ingresos: 12400000 },
  ];

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

  // Cambiar estado de reserva
  const handleChangeStatus = (bookingId: string, newStatus: string) => {
    setBookings(bookings.map(b => 
      b.id === bookingId ? { ...b, status: newStatus } : b
    ));
    toast.success(`Estado actualizado a ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-green-800">Dashboard Avanzado</h2>
          <p className="text-gray-600">Métricas y estadísticas del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => toast.success('Reporte descargado correctamente')}
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </motion.div>

      {/* Gráficas de Métricas */}
      {true && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Distribución por Estado */}
          <Card className="border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-green-800">Distribución por Estado</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Reservas Mensuales */}
          <Card className="border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-green-800">Reservas Mensuales</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="reservas" fill="#22c55e" name="Reservas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Ingresos Mensuales */}
          <Card className="border-green-200 lg:col-span-2">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-green-800">Tendencia de Ingresos</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ingresos"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Ingresos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Diálogo de Detalles */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Detalles de Reserva</DialogTitle>
            <DialogDescription>
              Información detallada de la reserva seleccionada.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              {/* Información del Cliente */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-green-800 mb-3">Información del Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="text-green-800">{selectedBooking.clientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ID Reserva</p>
                    <p className="text-green-800">{selectedBooking.id}</p>
                  </div>
                </div>
              </div>

              {/* Detalles de la Reserva */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-green-800 mb-3">Detalles de la Reserva</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Servicio/Paquete</p>
                    <p className="text-green-800">{selectedBooking.packageName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha</p>
                    <p className="text-green-800">{selectedBooking.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Participantes Totales</p>
                    <p className="text-green-800">{selectedBooking.participants}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Desglose</p>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-white">
                        {selectedBooking.adults} Adultos
                      </Badge>
                      <Badge variant="outline" className="bg-white">
                        {selectedBooking.children} Niños
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estado y Pago */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-green-800 mb-3">Estado y Pago</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Estado de Reserva</p>
                    <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado de Pago</p>
                    <div className="mt-1">
                      <Badge variant={selectedBooking.paymentStatus === 'Pagado' ? 'default' : 'outline'} className={selectedBooking.paymentStatus === 'Pagado' ? 'bg-green-500' : ''}>
                        {selectedBooking.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total a Pagar</p>
                    <p className="text-green-800">${selectedBooking.total.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-2 pt-4 border-t border-green-200">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailDialogOpen(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.info('Función de edición en desarrollo');
                  }}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Reserva</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar esta reserva? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setBookings(bookings.filter(b => b.id !== bookingToDelete.id));
                toast.success('Reserva eliminada correctamente');
                setIsDeleteDialogOpen(false);
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Editar reserva</DialogTitle>
            <DialogDescription>
              Modifica la información de la reserva seleccionada.
            </DialogDescription>
          </DialogHeader>
          {bookingToEdit && (
            <div className="space-y-4 py-4">
              {/* Fila 1: Nombre del cliente y Servicio/Paquete */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-clientName">Nombre del cliente *</Label>
                  <Input
                    id="edit-clientName"
                    defaultValue={bookingToEdit.clientName}
                    onChange={(e) => setBookingToEdit({ ...bookingToEdit, clientName: e.target.value })}
                    className="bg-gray-50 border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-packageName">Servicio/Paquete *</Label>
                  <Input
                    id="edit-packageName"
                    defaultValue={bookingToEdit.packageName}
                    onChange={(e) => setBookingToEdit({ ...bookingToEdit, packageName: e.target.value })}
                    className="bg-gray-50 border-gray-300"
                  />
                </div>
              </div>

              {/* Fila 2: Fecha y Total */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Fecha *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    defaultValue={bookingToEdit.date}
                    onChange={(e) => setBookingToEdit({ ...bookingToEdit, date: e.target.value })}
                    className="bg-gray-50 border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-total">Total *</Label>
                  <Input
                    id="edit-total"
                    type="number"
                    defaultValue={bookingToEdit.total}
                    onChange={(e) => setBookingToEdit({ ...bookingToEdit, total: parseInt(e.target.value) })}
                    className="bg-gray-50 border-gray-300"
                  />
                </div>
              </div>

              {/* Fila 3: Adultos y Niños */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-adults">Adultos</Label>
                  <Input
                    id="edit-adults"
                    type="number"
                    defaultValue={bookingToEdit.adults}
                    onChange={(e) => {
                      const adults = parseInt(e.target.value) || 0;
                      setBookingToEdit({ 
                        ...bookingToEdit, 
                        adults,
                        participants: adults + (bookingToEdit.children || 0)
                      });
                    }}
                    className="bg-gray-50 border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-children">Niños</Label>
                  <Input
                    id="edit-children"
                    type="number"
                    defaultValue={bookingToEdit.children}
                    onChange={(e) => {
                      const children = parseInt(e.target.value) || 0;
                      setBookingToEdit({ 
                        ...bookingToEdit, 
                        children,
                        participants: (bookingToEdit.adults || 0) + children
                      });
                    }}
                    className="bg-gray-50 border-gray-300"
                  />
                </div>
              </div>

              {/* Fila 4: Estado de Reserva y Estado de Pago */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Estado de reserva</Label>
                  <Select
                    value={bookingToEdit.status}
                    onValueChange={(value) => setBookingToEdit({ ...bookingToEdit, status: value })}
                  >
                    <SelectTrigger id="edit-status" className="bg-gray-50 border-gray-300">
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
                <div className="space-y-2">
                  <Label htmlFor="edit-paymentStatus">Estado de pago</Label>
                  <Select
                    value={bookingToEdit.paymentStatus}
                    onValueChange={(value) => setBookingToEdit({ ...bookingToEdit, paymentStatus: value })}
                  >
                    <SelectTrigger id="edit-paymentStatus" className="bg-gray-50 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pagado">Pagado</SelectItem>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Parcial">Parcial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ID Reserva (solo lectura) */}
              <div className="space-y-2">
                <Label htmlFor="edit-id">ID Reserva</Label>
                <Input
                  id="edit-id"
                  defaultValue={bookingToEdit.id}
                  disabled
                  className="bg-gray-100 border-gray-300"
                />
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    // Actualizar la reserva en el estado
                    const updatedBookings = bookings.map(booking => 
                      booking.id === bookingToEdit.id ? bookingToEdit : booking
                    );
                    setBookings(updatedBookings);
                    toast.success('Reserva actualizada correctamente');
                    setIsEditDialogOpen(false);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Guardar cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Creación de Métrica */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-800 flex items-center gap-2">
              <Target className="w-6 h-6" />
              Crear Métrica Personalizada
            </DialogTitle>
            <DialogDescription>
              Configure una métrica personalizada para analizar el rendimiento de sus servicios turísticos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Paso 1: Configuración Básica */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-green-800 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Paso 1: Configuración Básica
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metricName">Nombre de la métrica *</Label>
                  <Input
                    id="metricName"
                    placeholder="Ej: Ingresos Mensuales Fincas"
                    value={newMetric.metricName}
                    onChange={(e) => setNewMetric({ ...newMetric, metricName: e.target.value })}
                    className="border-green-300 focus:border-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Tipo de reserva *</Label>
                  <Select
                    value={newMetric.serviceType}
                    onValueChange={(value) => setNewMetric({ ...newMetric, serviceType: value, selectedServices: [] })}
                  >
                    <SelectTrigger id="serviceType" className="border-green-300">
                      <SelectValue placeholder="Seleccione el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rutas">Rutas turísticas</SelectItem>
                      <SelectItem value="fincas">Fincas en alquiler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newMetric.serviceType && (
                <div className="mt-4 space-y-2">
                  <Label>Servicios incluidos en el análisis *</Label>
                  <div className="bg-white p-4 rounded border border-green-300 max-h-40 overflow-y-auto">
                    {availableServices[newMetric.serviceType as 'rutas' | 'fincas']?.map((service) => (
                      <div key={service} className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id={`service-${service}`}
                          checked={newMetric.selectedServices.includes(service)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewMetric({
                                ...newMetric,
                                selectedServices: [...newMetric.selectedServices, service]
                              });
                            } else {
                              setNewMetric({
                                ...newMetric,
                                selectedServices: newMetric.selectedServices.filter(s => s !== service)
                              });
                            }
                          }}
                        />
                        <label
                          htmlFor={`service-${service}`}
                          className="text-sm cursor-pointer text-gray-700"
                        >
                          {service}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Paso 2: Filtros de Análisis */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-green-800 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Paso 2: Filtros de Análisis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reservationFilter">Filtro de reservas *</Label>
                  <Select
                    value={newMetric.reservationFilter}
                    onValueChange={(value) => setNewMetric({ ...newMetric, reservationFilter: value })}
                  >
                    <SelectTrigger id="reservationFilter" className="border-green-300">
                      <SelectValue placeholder="Todas las reservas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las reservas</SelectItem>
                      <SelectItem value="Confirmada">Solo confirmadas</SelectItem>
                      <SelectItem value="Cancelada">Solo canceladas</SelectItem>
                      <SelectItem value="Pendiente">Solo pendientes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateRange">Rango de fechas *</Label>
                  <Select
                    value={newMetric.dateRange}
                    onValueChange={(value) => setNewMetric({ ...newMetric, dateRange: value })}
                  >
                    <SelectTrigger id="dateRange" className="border-green-300">
                      <SelectValue placeholder="Seleccione el rango" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Semana</SelectItem>
                      <SelectItem value="fortnight">Quincena</SelectItem>
                      <SelectItem value="month">Mes</SelectItem>
                      <SelectItem value="custom">Rango personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientType">Clientes incluidos *</Label>
                  <Select
                    value={newMetric.clientType}
                    onValueChange={(value) => setNewMetric({ ...newMetric, clientType: value })}
                  >
                    <SelectTrigger id="clientType" className="border-green-300">
                      <SelectValue placeholder="Todos los clientes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="recurring">Solo recurrentes</SelectItem>
                      <SelectItem value="new">Solo nuevos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newMetric.dateRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="customDateStart">Fecha inicial</Label>
                    <Input
                      id="customDateStart"
                      type="date"
                      value={newMetric.customDateStart}
                      onChange={(e) => setNewMetric({ ...newMetric, customDateStart: e.target.value })}
                      className="border-green-300 focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customDateEnd">Fecha final</Label>
                    <Input
                      id="customDateEnd"
                      type="date"
                      value={newMetric.customDateEnd}
                      onChange={(e) => setNewMetric({ ...newMetric, customDateEnd: e.target.value })}
                      className="border-green-300 focus:border-green-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Paso 3: Variables a Metricar */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-green-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Paso 3: Variables a Metricar
              </h3>
              <p className="text-sm text-gray-600 mb-4">Seleccione las métricas que desea incluir en el análisis</p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                  <Checkbox
                    id="numberOfReservations"
                    checked={newMetric.metrics.numberOfReservations}
                    onCheckedChange={(checked) => setNewMetric({
                      ...newMetric,
                      metrics: { ...newMetric.metrics, numberOfReservations: checked as boolean }
                    })}
                  />
                  <label htmlFor="numberOfReservations" className="cursor-pointer flex-1">
                    <span className="text-gray-900">Número de reservas</span>
                    <p className="text-xs text-gray-500">Total de reservas en el período seleccionado</p>
                  </label>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                  <Checkbox
                    id="generatedIncome"
                    checked={newMetric.metrics.generatedIncome}
                    onCheckedChange={(checked) => setNewMetric({
                      ...newMetric,
                      metrics: { ...newMetric.metrics, generatedIncome: checked as boolean }
                    })}
                  />
                  <label htmlFor="generatedIncome" className="cursor-pointer flex-1">
                    <span className="text-gray-900">Ingresos generados</span>
                    <p className="text-xs text-gray-500">Suma total de ingresos del período</p>
                  </label>
                </div>

                {newMetric.serviceType === 'fincas' && (
                  <div className="flex items-center space-x-3 p-3 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                    <Checkbox
                      id="averageOccupancy"
                      checked={newMetric.metrics.averageOccupancy}
                      onCheckedChange={(checked) => setNewMetric({
                        ...newMetric,
                        metrics: { ...newMetric.metrics, averageOccupancy: checked as boolean }
                      })}
                    />
                    <label htmlFor="averageOccupancy" className="cursor-pointer flex-1">
                      <span className="text-gray-900">Ocupación promedio</span>
                      <p className="text-xs text-gray-500">Porcentaje de ocupación de las fincas</p>
                    </label>
                  </div>
                )}

                {newMetric.serviceType === 'rutas' && (
                  <div className="flex items-center space-x-3 p-3 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                    <Checkbox
                      id="averageAttendance"
                      checked={newMetric.metrics.averageAttendance}
                      onCheckedChange={(checked) => setNewMetric({
                        ...newMetric,
                        metrics: { ...newMetric.metrics, averageAttendance: checked as boolean }
                      })}
                    />
                    <label htmlFor="averageAttendance" className="cursor-pointer flex-1">
                      <span className="text-gray-900">Asistencia promedio</span>
                      <p className="text-xs text-gray-500">Promedio de asistentes por ruta</p>
                    </label>
                  </div>
                )}

                <div className="flex items-center space-x-3 p-3 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                  <Checkbox
                    id="cancellationsVsConfirmations"
                    checked={newMetric.metrics.cancellationsVsConfirmations}
                    onCheckedChange={(checked) => setNewMetric({
                      ...newMetric,
                      metrics: { ...newMetric.metrics, cancellationsVsConfirmations: checked as boolean }
                    })}
                  />
                  <label htmlFor="cancellationsVsConfirmations" className="cursor-pointer flex-1">
                    <span className="text-gray-900">Cancelaciones vs Confirmaciones</span>
                    <p className="text-xs text-gray-500">Ratio de reservas canceladas vs confirmadas</p>
                  </label>
                </div>
              </div>
            </div>

            {/* Paso 4: Configuración de Visualización */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-green-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Paso 4: Configuración de Visualización
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chartType">Tipo de gráfico *</Label>
                  <Select
                    value={newMetric.chartType}
                    onValueChange={(value) => setNewMetric({ ...newMetric, chartType: value })}
                  >
                    <SelectTrigger id="chartType" className="border-green-300">
                      <SelectValue placeholder="Seleccione el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bars">Barras</SelectItem>
                      <SelectItem value="lines">Líneas</SelectItem>
                      <SelectItem value="pie">Torta</SelectItem>
                      <SelectItem value="table">Tabla dinámica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temporalGrouping">Agrupación temporal *</Label>
                  <Select
                    value={newMetric.temporalGrouping}
                    onValueChange={(value) => setNewMetric({ ...newMetric, temporalGrouping: value })}
                  >
                    <SelectTrigger id="temporalGrouping" className="border-green-300">
                      <SelectValue placeholder="Seleccione la agrupación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Semana</SelectItem>
                      <SelectItem value="fortnight">Quincena</SelectItem>
                      <SelectItem value="month">Mes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comparison">Comparación</Label>
                  <Select
                    value={newMetric.comparison}
                    onValueChange={(value) => setNewMetric({ ...newMetric, comparison: value })}
                  >
                    <SelectTrigger id="comparison" className="border-green-300">
                      <SelectValue placeholder="Sin comparación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin comparación</SelectItem>
                      <SelectItem value="previous">Contra período anterior</SelectItem>
                      <SelectItem value="yearAgo">Contra mismo período año pasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Resumen y Control */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-blue-900 mb-2">Resumen de la métrica</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
                    <div>
                      <span className="font-medium">Nombre:</span> {newMetric.metricName || 'Sin nombre'}
                    </div>
                    <div>
                      <span className="font-medium">Tipo:</span> {newMetric.serviceType === 'rutas' ? 'Rutas turísticas' : newMetric.serviceType === 'fincas' ? 'Fincas en alquiler' : 'No seleccionado'}
                    </div>
                    <div>
                      <span className="font-medium">Servicios incluidos:</span> {newMetric.selectedServices.length || 0}
                    </div>
                    <div>
                      <span className="font-medium">Gráfico:</span> {newMetric.chartType === 'bars' ? 'Barras' : newMetric.chartType === 'lines' ? 'Líneas' : newMetric.chartType === 'pie' ? 'Torta' : newMetric.chartType === 'table' ? 'Tabla' : 'No seleccionado'}
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-3">
                    <span className="font-medium">Usuario:</span> Administrador • 
                    <span className="font-medium"> Fecha de creación:</span> {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-4 border-t border-green-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                // Limpiar formulario
                setNewMetric({
                  metricName: '',
                  serviceType: '',
                  selectedServices: [],
                  reservationFilter: 'all',
                  dateRange: 'month',
                  customDateStart: '',
                  customDateEnd: '',
                  clientType: 'all',
                  metrics: {
                    numberOfReservations: false,
                    generatedIncome: false,
                    averageOccupancy: false,
                    averageAttendance: false,
                    cancellationsVsConfirmations: false,
                  },
                  chartType: 'bars',
                  temporalGrouping: 'month',
                  comparison: 'none',
                });
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                // Validar campos requeridos
                if (!newMetric.metricName) {
                  toast.error('Por favor ingrese un nombre para la métrica');
                  return;
                }
                if (!newMetric.serviceType) {
                  toast.error('Por favor seleccione el tipo de servicio');
                  return;
                }
                if (newMetric.selectedServices.length === 0) {
                  toast.error('Por favor seleccione al menos un servicio');
                  return;
                }
                
                const hasMetrics = Object.values(newMetric.metrics).some(v => v);
                if (!hasMetrics) {
                  toast.error('Por favor seleccione al menos una variable para metricar');
                  return;
                }

                // Aquí se guardaría la métrica - por ahora solo mostramos confirmación
                toast.success(`✅ Métrica "${newMetric.metricName}" creada exitosamente`);
                toast.info(`Se generó un widget de ${newMetric.chartType === 'bars' ? 'barras' : newMetric.chartType === 'lines' ? 'líneas' : newMetric.chartType === 'pie' ? 'torta' : 'tabla'} en el dashboard`);
                
                setIsCreateDialogOpen(false);
                
                // Limpiar formulario
                setNewMetric({
                  metricName: '',
                  serviceType: '',
                  selectedServices: [],
                  reservationFilter: 'all',
                  dateRange: 'month',
                  customDateStart: '',
                  customDateEnd: '',
                  clientType: 'all',
                  metrics: {
                    numberOfReservations: false,
                    generatedIncome: false,
                    averageOccupancy: false,
                    averageAttendance: false,
                    cancellationsVsConfirmations: false,
                  },
                  chartType: 'bars',
                  temporalGrouping: 'month',
                  comparison: 'none',
                });
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Target className="w-4 h-4 mr-2" />
              Generar Métrica
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}