import React, { useState } from 'react';
import { 
  CreditCard, 
  Users, 
  Package, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  Eye,
  Phone,
  Mail,
  FileCheck,
  MessageCircle,
  TreePine,
  Route,
  Settings,
  Plus,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { StatusManager } from './StatusManager';
import { ChatSimulator } from './ChatSimulator';
import { CreateModal } from './CreateModal';
import { BookingDetailsModal } from './BookingDetailsModal';

export function AdvisorDashboard() {
  const [activeTab, setActiveTab] = useState('reservations');
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatConfig, setChatConfig] = useState({ type: 'individual' as 'group' | 'individual', title: '', participants: [] });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalType, setCreateModalType] = useState<'tour' | 'finca' | 'ruta' | 'usuario' | 'reserva' | 'paquete'>('tour');
  
  // Estado para almacenar reservas creadas por el asesor
  const [createdBookings, setCreatedBookings] = useState<any[]>([]);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<any>(null);

  // Mock data for advisor - Actualizado con más diversidad incluyendo fincas
  const mockReservations = [
    {
      id: 'R001',
      client: 'Pedro Hernández',
      email: 'pedro@email.com',
      phone: '+57 300 123 4567',
      service: 'Caminata Sierra Nevada',
      type: 'tour',
      date: '2024-09-15',
      amount: '$150.000',
      status: 'Pendiente',
      paymentStatus: 'Esperando pago',
      location: 'Sierra Nevada'
    },
    {
      id: 'R002',
      client: 'Laura Jiménez',
      email: 'laura@email.com',
      phone: '+57 310 987 6543',
      service: 'Finca El Paraíso - Experiencia Completa',
      type: 'finca',
      date: '2024-09-18',
      amount: '$180.000',
      status: 'Confirmada',
      paymentStatus: 'Pagado',
      location: 'Quindío'
    },
    {
      id: 'R003',
      client: 'Miguel Ángel',
      email: 'miguel@email.com',
      phone: '+57 320 456 7890',
      service: 'Avistamiento de Aves',
      type: 'tour',
      date: '2024-09-20',
      amount: '$95.000',
      status: 'Pendiente',
      paymentStatus: 'Abono 50%',
      location: 'Reserva Natural'
    },
    {
      id: 'R004',
      client: 'Ana García',
      email: 'ana@email.com',
      phone: '+57 315 678 9012',
      service: 'Finca Bella Vista - Retiro Fin de Semana',
      type: 'finca',
      date: '2024-09-22',
      amount: '$220.000',
      status: 'Comprobante Recibido',
      paymentStatus: 'Verificando pago',
      location: 'Cundinamarca'
    },
    {
      id: 'R005',
      client: 'Carlos Mendoza',
      email: 'carlos@email.com',
      phone: '+57 301 789 0123',
      service: 'Paquete Aventura Completa',
      type: 'paquete',
      date: '2024-09-25',
      amount: '$680.000',
      status: 'Confirmada',
      paymentStatus: 'Pagado',
      location: 'Multi-destino'
    }
  ];

  // Mock data for advisor - Actualizado para incluir contadores específicos de clientes
  const clientsPendingCount = mockReservations.filter(r => r.status === 'Pendiente').length;
  const clientsConfirmedCount = mockReservations.filter(r => r.status === 'Confirmada').length;

  const mockClients = [
    {
      id: 1,
      name: 'Ana Sofía García',
      email: 'ana.sofia@email.com',
      phone: '+57 301 234 5678',
      totalReservations: 5,
      totalSpent: '$675.000',
      lastBooking: '2024-08-30',
      status: 'VIP'
    },
    {
      id: 2,
      name: 'Carlos Eduardo López',
      email: 'carlos.lopez@email.com',
      phone: '+57 312 345 6789',
      totalReservations: 2,
      totalSpent: '$270.000',
      lastBooking: '2024-09-05',
      status: 'Regular'
    },
    {
      id: 3,
      name: 'María Isabel Ruiz',
      email: 'maria.ruiz@email.com',
      phone: '+57 315 456 7890',
      totalReservations: 8,
      totalSpent: '$1.120.000',
      lastBooking: '2024-09-10',
      status: 'VIP'
    }
  ];

  const stats = [
    { title: 'Clientes Pendientes', value: clientsPendingCount.toString(), change: 'Requieren atención', icon: Clock, color: 'text-orange-600' },
    { title: 'Clientes Confirmados', value: clientsConfirmedCount.toString(), change: 'Tours asegurados', icon: CheckCircle, color: 'text-green-600' },
    { title: 'Total Clientes', value: mockClients.length.toString(), change: '+15 este mes', icon: Users, color: 'text-blue-600' },
    { title: 'Comisión Mes', value: '$2.8M', change: '+12%', icon: CreditCard, color: 'text-purple-600' }
  ];

  // Funciones para manejar acciones
  const handleManageStatus = (reservation: any) => {
    setSelectedItem({
      type: reservation.type || 'reserva',
      id: reservation.id,
      currentStatus: reservation.status,
      details: reservation
    });
    setShowStatusManager(true);
  };

  const handleContactClient = (client: any) => {
    setChatConfig({
      type: 'individual',
      title: client.client || client.name,
      participants: []
    });
    setShowChat(true);
  };

  const handleCreateNew = (type: 'tour' | 'finca' | 'ruta' | 'usuario' | 'reserva' | 'paquete') => {
    setCreateModalType(type);
    setShowCreateModal(true);
  };

  const handleBookingCreated = (booking: any) => {
    setCreatedBookings(prev => [booking, ...prev]);
  };

  const handleProcessPayment = (reservation: any) => {
    handleManageStatus(reservation);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmada':
      case 'Pagado':
        return 'bg-green-100 text-green-800';
      case 'Pendiente':
      case 'Esperando pago':
        return 'bg-orange-100 text-orange-800';
      case 'Comprobante Recibido':
      case 'Verificando pago':
        return 'bg-blue-100 text-blue-800';
      case 'Abono 50%':
        return 'bg-yellow-100 text-yellow-800';
      case 'VIP':
        return 'bg-purple-100 text-purple-800';
      case 'Regular':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'finca':
        return <TreePine className="w-4 h-4 text-green-600" />;
      case 'paquete':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'tour':
      default:
        return <Route className="w-4 h-4 text-orange-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Asesor</h1>
          <p className="text-muted-foreground">Gestiona reservas, pagos y atiende a tus clientes</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => handleContactClient({ name: 'Cliente Seleccionado' })}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat con Cliente
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleCreateNew('reserva')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change} esta semana</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsContent value="reservations" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Buscar reservas..." className="pl-10 w-64" />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gestión de Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Mostrar primero las reservas creadas dinámicamente */}
                  {createdBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {booking.clientName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{booking.clientName}</p>
                            <p className="text-sm text-muted-foreground">{booking.clientPhone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getServiceTypeIcon(booking.type)}
                          <div>
                            <p className="font-medium">{booking.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {booking.location}
                            </p>
                            {booking.hasAccommodation && (
                              <Badge variant="outline" className="text-xs mt-1">
                                Con alojamiento
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{booking.date}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold text-green-600">
                            ${booking.totalAmount.toLocaleString()}
                          </div>
                          {booking.hasAccommodation && (
                            <div className="text-xs text-muted-foreground">
                              Pagado: ${booking.paidAmount.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className="bg-green-100 text-green-800"
                        >
                          Confirmada
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={
                            booking.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                            booking.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }
                        >
                          {booking.paymentStatus === 'completed' ? 'Pagado 100%' :
                           booking.paymentStatus === 'partial' ? 'Pagado 50%' :
                           'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedBookingForDetails(booking);
                              setShowBookingDetails(true);
                            }}
                            className="hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleContactClient(booking)}
                            className="hover:bg-green-50"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleContactClient(booking)}
                            className="hover:bg-gray-50"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Reservas de ejemplo existentes */}
                  {mockReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {reservation.client.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{reservation.client}</p>
                            <p className="text-sm text-muted-foreground">{reservation.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getServiceTypeIcon(reservation.type)}
                          <div>
                            <p className="font-medium">{reservation.service}</p>
                            <p className="text-xs text-muted-foreground flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {reservation.location}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{reservation.date}</TableCell>
                      <TableCell className="font-semibold text-green-600">{reservation.amount}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={getStatusColor(reservation.status)}
                        >
                          {reservation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={getStatusColor(reservation.paymentStatus)}
                        >
                          {reservation.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleManageStatus(reservation)}
                            className="hover:bg-blue-50"
                          >
                            <FileCheck className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleContactClient(reservation)}
                            className="hover:bg-green-50"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleContactClient(reservation)}
                            className="hover:bg-gray-50"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          {/* Resumen de Clientes por Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800">Clientes Pendientes</p>
                    <p className="text-2xl font-bold text-orange-900">{clientsPendingCount}</p>
                    <p className="text-xs text-orange-700">Requieren seguimiento</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Clientes Confirmados</p>
                    <p className="text-2xl font-bold text-green-900">{clientsConfirmedCount}</p>
                    <p className="text-xs text-green-700">Tours asegurados</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Total Clientes</p>
                    <p className="text-2xl font-bold text-blue-900">{mockClients.length}</p>
                    <p className="text-xs text-blue-700">Base de clientes</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Buscar clientes..." className="pl-10 w-64" />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockClients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-green-100 text-green-700">
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{client.name}</h3>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getStatusColor(client.status)}`}
                      >
                        {client.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reservas:</span>
                      <span className="font-medium">{client.totalReservations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total gastado:</span>
                      <span className="font-medium text-green-600">{client.totalSpent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última reserva:</span>
                      <span className="font-medium">{client.lastBooking}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleContactClient(client)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleContactClient(client)}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <h2 className="text-xl font-semibold">Gestión de Estados y Comprobantes</h2>
            <div className="flex space-x-2">
              <Button 
                onClick={() => handleCreateNew('finca')}
                className="bg-green-600 hover:bg-green-700"
              >
                <TreePine className="w-4 h-4 mr-2" />
                Nueva Finca
              </Button>
              <Button 
                onClick={() => handleCreateNew('tour')}
                variant="outline"
              >
                <Route className="w-4 h-4 mr-2" />
                Nuevo Tour
              </Button>
            </div>
          </div>

          {/* Resumen de estados */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800">Pendientes Verificación</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {mockReservations.filter(r => r.status === 'Comprobante Recibido').length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Confirmadas</p>
                    <p className="text-2xl font-bold text-green-900">
                      {mockReservations.filter(r => r.status === 'Confirmada').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Experiencias Fincas</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {mockReservations.filter(r => r.type === 'finca').length}
                    </p>
                  </div>
                  <TreePine className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-800">Paquetes Completos</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {mockReservations.filter(r => r.type === 'paquete').length}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de elementos que requieren gestión */}
          <Card>
            <CardHeader>
              <CardTitle>Elementos que Requieren Atención</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReservations
                  .filter(r => r.status === 'Pendiente' || r.status === 'Comprobante Recibido')
                  .map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        {getServiceTypeIcon(item.type)}
                        <div>
                          <h4 className="font-semibold">{item.service}</h4>
                          <p className="text-sm text-muted-foreground">
                            Cliente: {item.client} | Fecha: {item.date}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                            <Badge className={getStatusColor(item.paymentStatus)}>
                              {item.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContactClient(item)}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Contactar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleManageStatus(item)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <FileCheck className="w-4 h-4 mr-1" />
                          Gestionar
                        </Button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Manager Modal */}
      <StatusManager
        isOpen={showStatusManager}
        onClose={() => setShowStatusManager(false)}
        itemType={selectedItem?.type || 'reserva'}
        itemId={selectedItem?.id || ''}
        currentStatus={selectedItem?.currentStatus || ''}
        itemDetails={selectedItem?.details || {}}
      />

      {/* Chat Simulator */}
      <ChatSimulator
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        chatType={chatConfig.type}
        chatTitle={chatConfig.title}
        userRole="advisor"
        participants={chatConfig.participants}
      />

      {/* Create Modal */}
      <CreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        type={createModalType}
        userRole="advisor"
        onBookingCreated={handleBookingCreated}
      />

      {/* Booking Details Modal */}
      <BookingDetailsModal
        isOpen={showBookingDetails}
        onClose={() => setShowBookingDetails(false)}
        booking={selectedBookingForDetails}
      />
    </div>
  );
}