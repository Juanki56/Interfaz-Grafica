import React, { useState } from 'react';
import { useAuth } from '../App';
import { motion } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Star, 
  Clock, 
  Users,
  Package,
  CreditCard,
  Heart,
  Eye,
  TreePine,
  Route,
  Building,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Award,
  Camera,
  MessageCircle,
  Download,
  TrendingUp,
  DollarSign,
  Phone,
  Mail,
  User,
  X,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { DashboardLayout, DashboardSection, DashboardGrid } from './DashboardLayout';
import { 
  mockPackages,
  mockFarms,
  mockRoutes,
  mockBookings,
  mockSales
} from '../utils/adminMockData';

export function ClientDashboardImproved() {
  const { user, adminActiveTab } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Sync activeTab with adminActiveTab from context
  React.useEffect(() => {
    if (adminActiveTab) {
      setActiveTab(adminActiveTab);
    }
  }, [adminActiveTab]);

  // Client's specific bookings - Mezcla de rutas y fincas
  const myBookings = [
    { 
      id: 'BK001', 
      clientName: 'María López', 
      clientEmail: 'maria@occitours.com', 
      serviceType: 'Ruta',
      serviceName: 'Ruta del Café', 
      date: '2024-12-15', 
      time: '08:00 AM',
      status: 'Confirmada', 
      participants: 4, 
      adults: 3, 
      children: 1, 
      total: 2400000, 
      totalAmount: 2400000, 
      guide: 'Carlos Ruiz', 
      route: 'Ruta del Café', 
      createdDate: '2024-12-01', 
      paymentStatus: 'Pagado', 
      paymentReceipt: 'https://images.unsplash.com/photo-1603940516962-4976f0d44a19?w=800',
      specialRequests: '',
      companions: [
        { name: 'Juan López', age: 35, documentType: 'C.C.', documentNumber: '1234567890' },
        { name: 'Ana López', age: 8, documentType: 'T.I.', documentNumber: '9876543210' },
        { name: 'Carlos Martínez', age: 40, documentType: 'C.C.', documentNumber: '5555555555' }
      ],
      notes: 'Recogida en Hotel Campestre'
    },
    { 
      id: 'BK016', 
      clientName: 'María López', 
      clientEmail: 'maria@occitours.com', 
      serviceType: 'Finca',
      serviceName: 'Finca El Paraíso',
      date: '2025-01-10', 
      time: '09:00 AM',
      status: 'Confirmada', 
      participants: 2, 
      adults: 2, 
      children: 0, 
      total: 1800000, 
      totalAmount: 1800000, 
      guide: 'Pedro Martínez', 
      route: 'N/A', 
      createdDate: '2024-12-05', 
      paymentStatus: 'Pagado', 
      paymentReceipt: 'https://images.unsplash.com/photo-1603940516962-4976f0d44a19?w=800',
      specialRequests: 'Alimentación vegetariana',
      companions: [
        { name: 'Roberto Gómez', age: 45, documentType: 'C.C.', documentNumber: '1111111111' }
      ],
      notes: 'Incluye almuerzo campestre'
    },
    { 
      id: 'BK017', 
      clientName: 'María López', 
      clientEmail: 'maria@occitours.com', 
      serviceType: 'Ruta',
      serviceName: 'Patrimonio Colonial',
      date: '2025-02-14', 
      time: '10:00 AM',
      status: 'Pendiente', 
      participants: 3, 
      adults: 2, 
      children: 1, 
      total: 1500000, 
      totalAmount: 1500000, 
      guide: 'Carlos Ruiz', 
      route: 'Patrimonio Colonial', 
      createdDate: '2024-12-08', 
      paymentStatus: 'Abono', 
      paymentReceipt: 'https://images.unsplash.com/photo-1603940516962-4976f0d44a19?w=800',
      specialRequests: '',
      companions: [
        { name: 'Laura Pérez', age: 30, documentType: 'C.C.', documentNumber: '2222222222' },
        { name: 'Sofía Pérez', age: 6, documentType: 'T.I.', documentNumber: '3333333333' }
      ],
      notes: 'Tour histórico con guía especializado'
    },
    { 
      id: 'BK018', 
      clientName: 'María López', 
      clientEmail: 'maria@occitours.com', 
      serviceType: 'Finca',
      serviceName: 'Finca Los Naranjos',
      date: '2025-03-20', 
      time: '07:30 AM',
      status: 'Confirmada', 
      participants: 5, 
      adults: 3, 
      children: 2, 
      total: 3200000, 
      totalAmount: 3200000, 
      guide: 'Pedro Martínez', 
      route: 'N/A', 
      createdDate: '2024-11-25', 
      paymentStatus: 'Pagado', 
      specialRequests: 'Transporte desde hotel',
      companions: [
        { name: 'Diego López', age: 38, documentType: 'C.C.', documentNumber: '4444444444' },
        { name: 'Valentina López', age: 10, documentType: 'T.I.', documentNumber: '5555555555' },
        { name: 'Camila López', age: 7, documentType: 'T.I.', documentNumber: '6666666666' },
        { name: 'Andrea Ruiz', age: 35, documentType: 'C.C.', documentNumber: '7777777777' }
      ],
      notes: 'Experiencia completa con actividades ecológicas'
    },
    { 
      id: 'BK019', 
      clientName: 'María López', 
      clientEmail: 'maria@occitours.com', 
      serviceType: 'Ruta',
      serviceName: 'Sabores del Eje Cafetero',
      date: '2025-04-05', 
      time: '08:30 AM',
      status: 'Confirmada', 
      participants: 4, 
      adults: 4, 
      children: 0, 
      total: 2600000, 
      totalAmount: 2600000, 
      guide: 'Carlos Ruiz', 
      route: 'Sabores del Eje Cafetero', 
      createdDate: '2024-12-10', 
      paymentStatus: 'Pagado', 
      specialRequests: 'Cata de café especial',
      companions: [
        { name: 'Fernando Torres', age: 42, documentType: 'C.C.', documentNumber: '8888888888' },
        { name: 'Patricia Morales', age: 39, documentType: 'C.C.', documentNumber: '9999999999' },
        { name: 'Ricardo Sánchez', age: 44, documentType: 'C.C.', documentNumber: '1010101010' }
      ],
      notes: 'Incluye cata de café premium y chocolate artesanal'
    }
  ];
  
  // Mock sales data for the client
  const mySales = [
    {
      id: 'VEN-001',
      saleDate: '2024-12-01',
      serviceName: 'Ruta del Café',
      totalAmount: 2400000,
      status: 'Completada',
      paymentMethod: 'Tarjeta de Crédito'
    },
    {
      id: 'VEN-002',
      saleDate: '2024-12-05',
      serviceName: 'Finca El Paraíso',
      totalAmount: 1800000,
      status: 'Completada',
      paymentMethod: 'Transferencia Bancaria'
    },
    {
      id: 'VEN-003',
      saleDate: '2024-12-08',
      serviceName: 'Patrimonio Colonial',
      totalAmount: 1500000,
      status: 'Pendiente',
      paymentMethod: 'Efectivo'
    },
    {
      id: 'VEN-004',
      saleDate: '2024-11-25',
      serviceName: 'Finca Los Naranjos',
      totalAmount: 3200000,
      status: 'Completada',
      paymentMethod: 'Tarjeta de Débito'
    },
    {
      id: 'VEN-005',
      saleDate: '2024-12-10',
      serviceName: 'Sabores del Eje Cafetero',
      totalAmount: 2600000,
      status: 'Completada',
      paymentMethod: 'Tarjeta de Crédito'
    }
  ];

  // Mock payment installments data for the client
  const myPayments = [
    {
      id: 'ABN-001',
      saleId: 'VEN-003',
      serviceName: 'Patrimonio Colonial',
      paymentDate: '2024-12-08',
      amount: 750000,
      paymentMethod: 'Efectivo',
      status: 'Aplicado',
      notes: 'Primer abono - 50%'
    },
    {
      id: 'ABN-002',
      saleId: 'VEN-001',
      serviceName: 'Ruta del Café',
      paymentDate: '2024-11-28',
      amount: 1200000,
      paymentMethod: 'Transferencia Bancaria',
      status: 'Aplicado',
      notes: 'Abono inicial - 50%'
    },
    {
      id: 'ABN-003',
      saleId: 'VEN-004',
      serviceName: 'Finca Los Naranjos',
      paymentDate: '2024-11-20',
      amount: 1600000,
      paymentMethod: 'Tarjeta de Crédito',
      status: 'Aplicado',
      notes: 'Abono del 50%'
    },
    {
      id: 'ABN-004',
      saleId: 'VEN-005',
      serviceName: 'Sabores del Eje Cafetero',
      paymentDate: '2024-12-05',
      amount: 1300000,
      paymentMethod: 'Tarjeta de Débito',
      status: 'Aplicado',
      notes: 'Primer pago - 50%'
    },
    {
      id: 'ABN-005',
      saleId: 'VEN-002',
      serviceName: 'Finca El Paraíso',
      paymentDate: '2024-12-01',
      amount: 900000,
      paymentMethod: 'Efectivo',
      status: 'Aplicado',
      notes: 'Anticipo del 50%'
    }
  ];

  // Mock favorites (would come from user preferences)
  const myFavorites = [
    { ...mockPackages[0], type: 'paquete' },
    { ...mockFarms[0], type: 'finca' },
    { ...mockRoutes[0], type: 'ruta' }
  ];

  // Client statistics
  const clientStats = {
    totalBookings: myBookings.length,
    completedBookings: myBookings.filter(b => b.status === 'Confirmada').length,
    totalSpent: myBookings.reduce((sum, booking) => sum + booking.totalAmount, 0),
    favoriteServices: myFavorites.length,
    loyaltyPoints: 245,
    memberSince: '2023',
    favoriteDestination: 'Eje Cafetero'
  };

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Mis Reservas</h3>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acompañantes</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {booking.serviceType === 'Ruta' ? (
                        <Route className="w-4 h-4 text-blue-600" />
                      ) : (
                        <TreePine className="w-4 h-4 text-green-600" />
                      )}
                      <span className="font-medium">{booking.serviceType}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.serviceName}</p>
                    </div>
                  </TableCell>
                  <TableCell>{booking.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>{booking.companions.length}</span>
                    </div>
                  </TableCell>
                  <TableCell>${booking.total.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={booking.paymentStatus === 'Pagado' ? 'default' : 'outline'}
                      className={booking.paymentStatus === 'Pagado' ? 'bg-green-600' : 'bg-yellow-500'}
                    >
                      {booking.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={booking.status === 'Confirmada' ? 'default' : 'outline'}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewDetails(booking)}
                    >
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Reserva</DialogTitle>
            <DialogDescription>
              Información completa de la reserva #{selectedBooking?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Service Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Tipo de Servicio</label>
                  <div className="flex items-center space-x-2 mt-1">
                    {selectedBooking.serviceType === 'Ruta' ? (
                      <Route className="w-5 h-5 text-blue-600" />
                    ) : (
                      <TreePine className="w-5 h-5 text-green-600" />
                    )}
                    <span className="font-medium">{selectedBooking.serviceType}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Servicio</label>
                  <p className="mt-1">{selectedBooking.serviceName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fecha</label>
                  <p className="mt-1">{selectedBooking.date}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Hora</label>
                  <p className="mt-1">{selectedBooking.time}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Guía Asignado</label>
                  <p className="mt-1">{selectedBooking.guide}</p>
                </div>
                {selectedBooking.serviceType === 'Ruta' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ruta</label>
                    <p className="mt-1">{selectedBooking.route}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Total</label>
                  <p className="mt-1 font-semibold text-green-600">${selectedBooking.total.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Estado de Pago</label>
                  <div className="mt-1">
                    <Badge 
                      variant={selectedBooking.paymentStatus === 'Pagado' ? 'default' : 'outline'}
                      className={selectedBooking.paymentStatus === 'Pagado' ? 'bg-green-600' : 'bg-yellow-500'}
                    >
                      {selectedBooking.paymentStatus}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Estado de Reserva</label>
                  <div className="mt-1">
                    <Badge variant={selectedBooking.status === 'Confirmada' ? 'default' : 'outline'}>
                      {selectedBooking.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fecha de Creación</label>
                  <p className="mt-1">{selectedBooking.createdDate}</p>
                </div>
              </div>

              {/* Companions Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Acompañantes ({selectedBooking.companions.length})</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Edad</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Número</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBooking.companions.map((companion: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{companion.name}</TableCell>
                          <TableCell>{companion.age}</TableCell>
                          <TableCell>{companion.documentType}</TableCell>
                          <TableCell>{companion.documentNumber}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Notas</label>
                  <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Solicitudes Especiales</label>
                  <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedBooking.specialRequests}</p>
                </div>
              )}

              {/* Payment Receipt */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Mi Perfil</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-green-100 text-green-600">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">{user?.name}</h4>
                <p className="text-sm text-gray-600">{user?.email}</p>
                <Badge variant="outline" className="mt-1">Cliente desde {clientStats.memberSince}</Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{user?.phone || 'No registrado'}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{clientStats.loyaltyPoints}</div>
              <div className="text-sm text-gray-600">Puntos de Lealtad</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">{clientStats.totalBookings}</div>
                <div className="text-xs text-gray-600">Reservas</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{myFavorites.length}</div>
                <div className="text-xs text-gray-600">Favoritos</div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-semibold">${clientStats.totalSpent.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Gastado</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSales = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Mis Ventas</h3>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Venta</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Método Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mySales.length > 0 ? (
                mySales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.id}</TableCell>
                    <TableCell>{sale.saleDate}</TableCell>
                    <TableCell>{sale.serviceName}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ${sale.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={sale.status === 'Completada' ? 'default' : 'outline'}
                        className={sale.status === 'Completada' ? 'bg-green-600' : 'bg-yellow-500'}
                      >
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{sale.paymentMethod}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No tienes ventas registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Mis Abonos</h3>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Abono</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myPayments.length > 0 ? (
                myPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.id}</TableCell>
                    <TableCell>{payment.paymentDate}</TableCell>
                    <TableCell>{payment.serviceName}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ${payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="default"
                        className="bg-green-600"
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{payment.notes}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No tienes abonos registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <DashboardLayout>
      <DashboardSection>
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-green-100 text-green-600">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold text-green-800">¡Bienvenido, {user?.name}!</h2>
              <p className="text-sm text-gray-600">Panel del Cliente - Occitours</p>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {activeTab === 'bookings' && renderBookings()}
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'sales' && renderSales()}
          {activeTab === 'payments' && renderPayments()}
        </motion.div>
      </DashboardSection>
    </DashboardLayout>
  );
}