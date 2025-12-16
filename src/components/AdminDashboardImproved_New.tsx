import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  Users, 
  Package, 
  TrendingUp, 
  MapPin, 
  CreditCard, 
  Plus, 
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Download,
  Shield,
  Award,
  Home,
  Route,
  Truck,
  User,
  Star,
  FileText,
  AlertTriangle,
  Save,
  UserCheck,
  Settings,
  Menu,
  TreePine,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Percent
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
  TableRow 
} from './ui/table';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { DashboardLayout, DashboardSection, DashboardGrid } from './DashboardLayout';
import { AdminRightSidebar } from './AdminRightSidebar';
import { CreateUserForm } from './CreateUserForm';
import { CreateTourForm } from './CreateTourForm';
import { CreateFarmForm } from './CreateFarmForm';
import { CreateBookingForm } from './CreateBookingForm';
import { CreateRouteForm } from './CreateRouteForm';
import { ViewDetailsModal } from './ViewDetailsModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { RoleManagement } from './RoleManagement';
import { SalesDashboard } from './SalesDashboard';
import { toast } from 'sonner';

export function AdminDashboardImproved() {
  const { getAllUsers, updateUserRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [tours, setTours] = useState([]);
  const [farms, setFarms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Modal states
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateTour, setShowCreateTour] = useState(false);
  const [showCreateFarm, setShowCreateFarm] = useState(false);
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [showCreateRoute, setShowCreateRoute] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Modal data
  const [viewData, setViewData] = useState(null);
  const [viewType, setViewType] = useState<'user' | 'tour' | 'farm' | 'booking' | 'route'>('user');
  const [deleteData, setDeleteData] = useState<{item: any, type: string, onConfirm: () => void} | null>(null);
  
  // Edit state for tours
  const [editingTour, setEditingTour] = useState<any>(null);
  
  // Edit state for routes
  const [editingRoute, setEditingRoute] = useState<any>(null);

  // Sales mock data
  const salesData = {
    monthlyStats: [
      { month: 'Ene', rutas: 650000, paquetes: 890000, fincas: 320000, total: 1860000 },
      { month: 'Feb', rutas: 720000, paquetes: 950000, fincas: 280000, total: 1950000 },
      { month: 'Mar', rutas: 850000, paquetes: 1200000, fincas: 450000, total: 2500000 },
      { month: 'Abr', rutas: 920000, paquetes: 1100000, fincas: 380000, total: 2400000 },
      { month: 'May', rutas: 980000, paquetes: 1350000, fincas: 520000, total: 2850000 },
      { month: 'Jun', rutas: 1100000, paquetes: 1450000, fincas: 600000, total: 3150000 }
    ],
    productDistribution: [
      { name: 'Rutas Turísticas', value: 5420000, color: '#22c55e', percentage: 42 },
      { name: 'Paquetes', value: 6940000, color: '#3b82f6', percentage: 54 },
      { name: 'Fincas', value: 2550000, color: '#f59e0b', percentage: 4 }
    ],
    topSales: [
      { id: 1, item: 'Sendero del Café', type: 'ruta', sales: 1250000, units: 47, growth: 15 },
      { id: 2, item: 'Tour Cafetero Premium', type: 'paquete', sales: 2100000, units: 35, growth: 23 },
      { id: 3, item: 'Finca El Paraíso', type: 'finca', sales: 980000, units: 28, growth: 8 },
      { id: 4, item: 'Ruta de los Colibríes', type: 'ruta', sales: 845000, units: 39, growth: 12 },
      { id: 5, item: 'Experiencia Nocturna', type: 'paquete', sales: 1680000, units: 52, growth: 28 }
    ],
    kpis: {
      totalRevenue: 12910000,
      monthlyGrowth: 18.5,
      averageTicket: 385000,
      conversionRate: 23.8,
      totalBookings: 342,
      pendingPayments: 15
    }
  };

  // Stats data with proper spacing
  const stats = [
    { 
      title: 'Total Usuarios', 
      value: users.length.toString(), 
      change: '+12%',
      icon: Users, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: 'up'
    },
    { 
      title: 'Tours Activos', 
      value: tours.length.toString(), 
      change: '+8%',
      icon: Package, 
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: 'up'
    },
    { 
      title: 'Reservas Mes', 
      value: bookings.length.toString(), 
      change: '+23%',
      icon: TrendingUp, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: 'up'
    },
    { 
      title: 'Ingresos Mes', 
      value: '$89.2M', 
      change: '+15%',
      icon: CreditCard, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: 'up'
    }
  ];

  // Initialize mock data
  useEffect(() => {
    // Load users
    const loadUsers = () => {
      const authUsers = getAllUsers().map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role === 'admin' ? 'Administrador' : 
              user.role === 'advisor' ? 'Asesor' : 
              user.role === 'guide' ? 'Guía Turístico' : 'Cliente',
        status: user.status || 'Activo',
        joinDate: user.joinDate || new Date().toISOString().split('T')[0]
      }));
      setUsers(authUsers);
    };

    // Initialize mock tours
    const mockTours = [
      { 
        id: '1', 
        name: 'Caminata Sierra Nevada', 
        type: 'route',
        price: '150000', 
        capacity: 12, 
        booked: 8, 
        status: 'Activo',
        duration: '1 día',
        difficulty: 'Moderado',
        location: 'Sierra Nevada, Colombia',
        description: 'Experiencia única de caminata en la Sierra Nevada',
        includes: ['Guía', 'Transporte', 'Almuerzo']
      },
      { 
        id: '2', 
        name: 'Tour Cafetero', 
        type: 'package',
        price: '120000', 
        capacity: 15, 
        booked: 15, 
        status: 'Completo',
        duration: '2 días',
        difficulty: 'Fácil',
        location: 'Eje Cafetero, Colombia',
        description: 'Conoce el proceso del café',
        includes: ['Guía', 'Hospedaje', 'Comidas', 'Degustación']
      },
      { 
        id: '3', 
        name: 'Avistamiento de Aves', 
        type: 'route',
        price: '95000', 
        capacity: 8, 
        booked: 3, 
        status: 'Disponible',
        duration: '4 horas',
        difficulty: 'Fácil',
        location: 'Cocora, Quindío',
        description: 'Observación de aves endémicas',
        includes: ['Guía especializado', 'Equipo de observación']
      }
    ];

    // Initialize mock farms
    const mockFarms = [
      {
        id: '1',
        name: 'Finca El Paraíso',
        owner: 'Carlos Mendoza',
        location: 'Quindío, Colombia',
        address: 'Vereda La Esperanza, Km 5',
        phone: '+57 320 555 0123',
        email: 'carlos@fincaparaiso.com',
        area: '15',
        capacity: 20,
        pricePerNight: '80000',
        farmType: 'cafetera',
        amenities: ['Piscina', 'WiFi', 'Cocina', 'Parqueadero'],
        description: 'Hermosa finca cafetera con vista panorámica',
        status: 'available'
      },
      {
        id: '2',
        name: 'Hacienda Los Pinos',
        owner: 'María Rodríguez',
        location: 'Cundinamarca, Colombia',
        address: 'Vereda San José, Km 12',
        phone: '+57 310 555 0456',
        area: '25',
        capacity: 35,
        pricePerNight: '120000',
        farmType: 'ecoturismo',
        amenities: ['Senderos', 'Observatorio', 'Restaurant'],
        description: 'Perfecto para ecoturismo y relajación',
        status: 'available'
      }
    ];

    // Initialize mock bookings
    const mockBookings = [
      {
        id: '1',
        clientName: 'Juan Pérez',
        clientEmail: 'juan@email.com',
        tourName: 'Caminata Sierra Nevada',
        tourId: '1',
        date: '2024-12-25',
        persons: 4,
        totalAmount: 600000,
        status: 'confirmed',
        paymentStatus: 'paid',
        createdAt: '2024-12-15'
      },
      {
        id: '2',
        clientName: 'Ana García',
        clientEmail: 'ana@email.com',
        tourName: 'Tour Cafetero',
        tourId: '2',
        date: '2024-12-30',
        persons: 2,
        totalAmount: 240000,
        status: 'pending',
        paymentStatus: 'partial',
        createdAt: '2024-12-16'
      }
    ];

    // Initialize mock routes
    const mockRoutes = [
      {
        id: '1',
        name: 'Sendero del Café y las Mariposas',
        description: 'Una experiencia única que combina la cultura cafetera con la observación de mariposas endémicas de la región.',
        location: 'Cocora, Quindío',
        duration: '6 horas',
        difficulty: 'Moderado',
        price: 85000,
        capacity: 12,
        booked: 7,
        startTime: '08:00',
        endTime: '14:00',
        distance: 8.5,
        includes: ['Guía especializado', 'Transporte ida y vuelta', 'Almuerzo incluido', 'Equipo de seguridad'],
        requirements: 'Ropa cómoda, zapatos de senderismo, protector solar',
        meetingPoint: 'Plaza Principal de Salento',
        coordinator: 'Carlos Ruiz',
        coordinatorPhone: '+57 320 555 0789',
        highlights: ['Vista panorámica del valle', 'Avistamiento de mariposas', 'Degustación de café'],
        recommendations: 'Llevar cámara fotográfica y binoculares',
        cancellationPolicy: 'Cancelación gratuita hasta 24 horas antes',
        status: 'active',
        rating: 4.8,
        reviews: 24,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-12-15T10:00:00.000Z'
      },
      {
        id: '2',
        name: 'Ruta de los Colibríes',
        description: 'Aventura de avistamiento de colibríes en los bosques nubosos de la cordillera central.',
        location: 'Manizales, Caldas',
        duration: '4 horas',
        difficulty: 'Fácil',
        price: 65000,
        capacity: 8,
        booked: 3,
        startTime: '06:00',
        endTime: '10:00',
        distance: 3.2,
        includes: ['Guía ornitólogo', 'Equipo de observación', 'Hidratación', 'Seguro de accidentes'],
        requirements: 'Ropa de colores neutros, silencio durante la observación',
        meetingPoint: 'Centro de Visitantes Recinto del Pensamiento',
        coordinator: 'Ana Gómez',
        coordinatorPhone: '+57 310 555 0456',
        highlights: ['Más de 15 especies de colibríes', 'Bosque nuboso', 'Fotografía de naturaleza'],
        recommendations: 'Madrugar para mejor avistamiento, llevar ropa abrigada',
        cancellationPolicy: 'Cancelación gratuita hasta 12 horas antes',
        status: 'active',
        rating: 4.9,
        reviews: 18,
        createdAt: '2024-02-20T10:00:00.000Z',
        updatedAt: '2024-12-10T10:00:00.000Z'
      },
      {
        id: '3',
        name: 'Travesía Nocturna de las Luciérnagas',
        description: 'Experiencia mágica observando luciérnagas en los bosques tropicales durante la noche.',
        location: 'Norcasia, Caldas',
        duration: '3 horas',
        difficulty: 'Fácil',
        price: 55000,
        capacity: 10,
        booked: 10,
        startTime: '18:00',
        endTime: '21:00',
        distance: 2.1,
        includes: ['Guía nocturno', 'Linternas especiales', 'Kit de primeros auxilios', 'Refrigerio ligero'],
        requirements: 'Ropa oscura, zapatos cerrados, no usar flash ni linternas propias',
        meetingPoint: 'Entrada del Santuario de Fauna y Flora',
        coordinator: 'Miguel Torres',
        coordinatorPhone: '+57 315 555 0321',
        highlights: ['Espectáculo natural de luciérnagas', 'Sonidos nocturnos del bosque', 'Experiencia única'],
        recommendations: 'Actividad solo disponible en temporada seca (junio-agosto)',
        cancellationPolicy: 'No reembolsable por condiciones climáticas',
        status: 'active',
        rating: 4.7,
        reviews: 32,
        createdAt: '2024-03-10T10:00:00.000Z',
        updatedAt: '2024-12-05T10:00:00.000Z'
      }
    ];

    setTours(mockTours);
    setFarms(mockFarms);
    setBookings(mockBookings);
    setRoutes(mockRoutes);
    loadUsers();
  }, [getAllUsers]);

  // Handle actions
  const handleViewItem = (item: any, type: 'user' | 'tour' | 'farm' | 'booking' | 'route') => {
    setViewData(item);
    setViewType(type);
    setShowViewModal(true);
  };

  const handleDeleteItem = (item: any, type: string, onConfirm: () => void) => {
    setDeleteData({ item, type, onConfirm });
    setShowDeleteModal(true);
  };

  const handleUserCreated = (newUser: any) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleTourCreated = (newTour: any) => {
    setTours(prev => [...prev, newTour]);
  };

  const handleTourUpdated = (updatedTour: any) => {
    setTours(prev => prev.map(tour => 
      tour.id === updatedTour.id ? updatedTour : tour
    ));
    setEditingTour(null);
  };

  const handleEditTour = (tour: any) => {
    setEditingTour(tour);
    setShowCreateTour(true);
  };

  const handleCloseTourForm = () => {
    setShowCreateTour(false);
    setEditingTour(null);
  };

  const handleFarmCreated = (newFarm: any) => {
    setFarms(prev => [...prev, newFarm]);
  };

  const handleBookingCreated = (newBooking: any) => {
    setBookings(prev => [...prev, newBooking]);
  };

  const handleRouteCreated = (newRoute: any) => {
    setRoutes(prev => [...prev, newRoute]);
  };

  const handleRouteUpdated = (updatedRoute: any) => {
    setRoutes(prev => prev.map(route => 
      route.id === updatedRoute.id ? updatedRoute : route
    ));
    setEditingRoute(null);
  };

  const handleEditRoute = (route: any) => {
    setEditingRoute(route);
    setShowCreateRoute(true);
  };

  const handleCloseRouteForm = () => {
    setShowCreateRoute(false);
    setEditingRoute(null);
  };

  const handleDeleteRoute = (routeId: string) => {
    setRoutes(prev => prev.filter(route => route.id !== routeId));
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  const handleDeleteTour = (tourId: string) => {
    setTours(prev => prev.filter(tour => tour.id !== tourId));
  };

  const handleDeleteFarm = (farmId: string) => {
    setFarms(prev => prev.filter(farm => farm.id !== farmId));
  };

  const handleDeleteBooking = (bookingId: string) => {
    setBookings(prev => prev.filter(booking => booking.id !== bookingId));
  };

  const StatCard = ({ stat }) => {
    const Icon = stat.icon;
    return (
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{stat.title}</p>
              <p className="text-2xl lg:text-3xl font-semibold text-gray-900">{stat.value}</p>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-green-600">{stat.change}</span>
                <span className="text-xs text-gray-500">vs mes anterior</span>
              </div>
            </div>
            <div className={`p-3 rounded-full ${stat.bgColor}`}>
              <Icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <DashboardGrid columns={2}>
            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Actividad Reciente</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Nueva reserva confirmada</p>
                    <p className="text-xs text-gray-500">Hace 5 minutos</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Nuevo usuario registrado</p>
                    <p className="text-xs text-gray-500">Hace 15 minutos</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Package className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Tour actualizado</p>
                    <p className="text-xs text-gray-500">Hace 30 minutos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Acciones Rápidas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => setShowCreateUser(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Crear Usuario
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => setShowCreateTour(true)}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Nuevo Tour
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => setShowCreateFarm(true)}
                >
                  <TreePine className="w-4 h-4 mr-2" />
                  Agregar Finca
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => setShowCreateBooking(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Reserva
                </Button>
              </CardContent>
            </Card>
          </DashboardGrid>
        );

      case 'sales':
        return <SalesDashboard salesData={salesData} />;

      case 'roles':
        return <RoleManagement />;

      default:
        return <div>Pestaña no encontrada</div>;
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Left Main Content */}
      <div className="flex-1 lg:mr-80">
        <DashboardLayout>
          {/* Mobile Header */}
          <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Panel Administrativo</h1>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          {/* Stats Cards - Only show on overview */}
          {activeTab === 'overview' && (
            <DashboardSection>
              <DashboardGrid columns={4}>
                {stats.map((stat, index) => (
                  <StatCard key={index} stat={stat} />
                ))}
              </DashboardGrid>
            </DashboardSection>
          )}

          {/* Main Content */}
          <DashboardSection>
            {renderMainContent()}
          </DashboardSection>
        </DashboardLayout>
      </div>

      {/* Right Sidebar */}
      <AdminRightSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Modals */}
      {showCreateUser && (
        <CreateUserForm 
          onClose={() => setShowCreateUser(false)}
          onUserCreated={handleUserCreated}
        />
      )}

      {showCreateTour && (
        <CreateTourForm 
          onClose={handleCloseTourForm}
          onTourCreated={handleTourCreated}
          onTourUpdated={handleTourUpdated}
          editingTour={editingTour}
        />
      )}

      {showCreateFarm && (
        <CreateFarmForm 
          onClose={() => setShowCreateFarm(false)}
          onFarmCreated={handleFarmCreated}
        />
      )}

      {showCreateBooking && (
        <CreateBookingForm 
          onClose={() => setShowCreateBooking(false)}
          onBookingCreated={handleBookingCreated}
          tours={tours}
        />
      )}

      {showCreateRoute && (
        <CreateRouteForm 
          onClose={handleCloseRouteForm}
          onRouteCreated={handleRouteCreated}
          onRouteUpdated={handleRouteUpdated}
          editingRoute={editingRoute}
        />
      )}

      {showViewModal && viewData && (
        <ViewDetailsModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          data={viewData}
          type={viewType}
        />
      )}

      {showDeleteModal && deleteData && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={deleteData.onConfirm}
          itemName={deleteData.item.name || deleteData.item.clientName || deleteData.item.email || 'este elemento'}
          itemType={deleteData.type}
        />
      )}
    </div>
  );
}