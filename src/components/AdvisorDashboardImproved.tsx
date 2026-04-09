import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { motion } from 'motion/react';
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
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Download,
  Shield,
  Award,
  Home,
  Route,
  User,
  Star,
  FileText,
  AlertTriangle,
  Save,
  MoreVertical,
  Phone,
  Mail,
  MapPin as LocationIcon,
  Info,
  DollarSign,
  Building2,
  Tag,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
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
  DialogTrigger,
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
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { DashboardLayout, DashboardSection, DashboardGrid } from './DashboardLayout';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions, type Module } from '../utils/permissionHelper';
import {
  mockUsers,
  mockPackages,
  mockBookings,
  mockFarms,
  mockRoutes,
  mockServices,
  mockSales,
  mockRoles,
  overviewStats,
  salesAnalytics
} from '../utils/adminMockData';
import { FarmsManagement } from './FarmsManagement';
import { ProgrammingManagement } from './ProgrammingManagement';
import { ProviderManagement } from './ProviderManagement';
import { ProviderTypeManagement } from './ProviderTypeManagement';
import { RoutesManagement } from './RoutesManagement';
import { OwnersManagement } from './OwnersManagement';
import { SalesManagement } from './SalesManagementNew';
import { PaymentInstallmentsManagement } from './PaymentInstallmentsManagement';
import { UsersManagement } from './UsersManagement';
import { EmployeeManagement } from './EmployeeManagement';
import { RolesManagement } from './RolesManagement';
import { DashboardAnalytics } from './DashboardAnalytics';

export function AdvisorDashboardImproved() {
  const { user, adminActiveTab, setAdminActiveTab } = useAuth();
  const permisos = usePermissions();
  const [activeTab, setActiveTab] = useState('routes');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const tabModuleMap: Partial<Record<string, Module>> = {
    users: 'Usuarios',
    bookings: 'Reservas',
    services: 'Servicios',
    packages: 'Tours',
    sales: 'Ventas',
    roles: 'Roles',
  };

  const activeModule = tabModuleMap[activeTab];
  const activeModulePerms = activeModule ? createModulePermissions(permisos, activeModule) : null;
  const canViewActiveTab = activeModulePerms?.canView() ?? true;
  const canCreateActiveTab = activeModulePerms?.canCreate() ?? true;
  const canEditActiveTab = activeModulePerms?.canEdit() ?? true;
  const canDeleteActiveTab = activeModulePerms?.canDelete() ?? true;

  // Sync activeTab with adminActiveTab from context
  useEffect(() => {
    if (adminActiveTab) {
      setActiveTab(adminActiveTab);
    }
  }, [adminActiveTab]);

  // Update context when local tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setAdminActiveTab(newTab);
  };

  // Management menu items with advisor permissions (CRUD without delete)
  const advisorMenuItems = [
    { 
      id: 'overview', 
      label: 'Panel General', 
      icon: BarChart3,
      description: 'Resumen y estadísticas',
      badge: null
    },
    { 
      id: 'users', 
      label: 'Usuarios', 
      icon: Users,
      description: 'Gestión de usuarios',
      badge: mockUsers.length
    },
    { 
      id: 'bookings', 
      label: 'Reservas', 
      icon: Calendar,
      description: 'Gestión de reservas',
      badge: mockBookings.length
    },
    { 
      id: 'farms', 
      label: 'Fincas', 
      icon: Home,
      description: 'Fincas disponibles',
      badge: mockFarms.length
    },
    { 
      id: 'routes', 
      label: 'Rutas', 
      icon: Route,
      description: 'Rutas turísticas',
      badge: mockRoutes.length
    },
    { 
      id: 'services', 
      label: 'Servicios', 
      icon: Star,
      description: 'Servicios adicionales',
      badge: mockServices.length
    },
    { 
      id: 'owners', 
      label: 'Propietarios', 
      icon: UserCheck,
      description: 'Ver propietarios',
      badge: 12
    },
    { 
      id: 'sales', 
      label: 'Ventas', 
      icon: CreditCard,
      description: 'Ventas y gráficas',
      badge: mockSales.length
    },
    { 
      id: 'installments', 
      label: 'Abonos', 
      icon: DollarSign,
      description: 'Gestión de abonos',
      badge: 12
    },
    { 
      id: 'providers', 
      label: 'Proveedores', 
      icon: Building2,
      description: 'Ver proveedores',
      badge: 5
    },
    { 
      id: 'provider-types', 
      label: 'Tipos de Proveedor', 
      icon: Tag,
      description: 'Ver tipos de proveedores',
      badge: 6
    }
  ];

  const currentMenuItem = advisorMenuItems.find(item => item.id === activeTab) || advisorMenuItems[0];
  const CurrentIcon = currentMenuItem.icon;

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'users':
        return mockUsers; // All users, not just clients
      case 'packages':
        return mockPackages;
      case 'bookings':
        return mockBookings;
      case 'farms':
        return mockFarms;
      case 'routes':
        return mockRoutes;
      case 'services':
        return mockServices;
      case 'sales':
        return mockSales; // All sales for advisor
      default:
        return [];
    }
  };

  // Filter data based on search term
  const getFilteredData = () => {
    const data = getCurrentData();
    if (!searchTerm) return data;

    return data.filter((item: any) => {
      const searchableFields = Object.values(item).join(' ').toLowerCase();
      return searchableFields.includes(searchTerm.toLowerCase());
    });
  };

  // Reset pagination when changing tabs or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // Handle CRUD operations
  const handleCreate = () => {
    if (activeModulePerms && !canCreateActiveTab) {
      toast.error(activeModulePerms.getErrorMessage('crear'));
      return;
    }

    setSelectedItem(null);
    setFormData({});
    setIsCreateModalOpen(true);
  };

  const handleEdit = (item: any) => {
    if (activeModulePerms && !canEditActiveTab) {
      toast.error(activeModulePerms.getErrorMessage('editar'));
      return;
    }

    setSelectedItem(item);
    setFormData(item);
    setIsEditModalOpen(true);
  };

  const handleView = (item: any) => {
    if (activeModulePerms && !canViewActiveTab) {
      toast.error(activeModulePerms.getErrorMessage('ver'));
      return;
    }

    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  const handleDelete = (item: any) => {
    if (activeModulePerms && !canDeleteActiveTab) {
      toast.error(activeModulePerms.getErrorMessage('eliminar'));
      return;
    }

    toast.success(`${currentMenuItem.label} eliminado correctamente`);
  };

  const handleSave = () => {
    if (activeModulePerms) {
      const isEditAction = Boolean(selectedItem);
      if (!isEditAction && !canCreateActiveTab) {
        toast.error(activeModulePerms.getErrorMessage('crear'));
        return;
      }
      if (isEditAction && !canEditActiveTab) {
        toast.error(activeModulePerms.getErrorMessage('editar'));
        return;
      }
    }

    const action = selectedItem ? 'actualizado' : 'creado';
    toast.success(`${currentMenuItem.label} ${action} correctamente`);
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setFormData({});
    setSelectedItem(null);
  };

  // Render overview dashboard
  const renderOverview = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-green-800">Panel del Asesor</h2>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-semibold">{mockUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Reservas Activas</p>
                <p className="text-2xl font-semibold">{mockBookings.filter(b => b.status === 'Confirmada').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-600">Total Ventas</p>
                <p className="text-2xl font-semibold">${mockSales.reduce((sum, sale) => sum + sale.totalAmount, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Ingresos del Mes</p>
                <p className="text-2xl font-semibold">${mockSales.reduce((sum, sale) => sum + sale.totalAmount, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle>Acceso Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {advisorMenuItems.slice(1, 7).map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="outline"
                  className="flex items-center justify-start space-x-3 h-auto p-4"
                  onClick={() => handleTabChange(item.id)}
                >
                  <Icon className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-gray-500">{item.badge} registros</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Get table columns based on active tab
  const getTableColumns = () => {
    switch (activeTab) {
      case 'users':
        return ['Usuario', 'Email', 'Teléfono', 'Estado', 'Fecha Registro', 'Acciones'];
      case 'packages':
        return ['Paquete', 'Precio', 'Duración', 'Capacidad', 'Guía', 'Rating', 'Acciones'];
      case 'bookings':
        return ['Cliente', 'Paquete', 'Fecha', 'Participantes', 'Total', 'Estado', 'Acciones'];
      case 'farms':
        return ['Finca', 'Ubicación', 'Precio', 'Capacidad', 'Estado', 'Acciones'];
      case 'routes':
        return ['Ruta', 'Distancia', 'Dificultad', 'Precio', 'Estado', 'Acciones'];
      case 'services':
        return ['Servicio', 'Precio', 'Duración', 'Estado', 'Acciones'];
      case 'sales':
        return ['Cliente', 'Servicio', 'Total', 'Comisión', 'Estado', 'Fecha', 'Acciones'];
      default:
        return [];
    }
  };

  // Render table row based on active tab (simplified for advisor permissions)
  const renderTableRow = (item: any, index: number) => {
    const getStatusBadge = (status: string) => {
      const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
        'Activo': 'default',
        'Activa': 'default',
        'Confirmada': 'default',
        'Pagado': 'default',
        'Disponible': 'default',
        'Inactivo': 'secondary',
        'Pendiente': 'outline',
        'Abono': 'outline',
        'Cotización': 'outline'
      };
      return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
    };

    const renderActions = (options?: { canView?: boolean; canEdit?: boolean }) => {
      const canView = options?.canView ?? true;
      const canEdit = options?.canEdit ?? true;

      return (
        <div className="flex space-x-2">
          {canView && (
            <Button size="sm" variant="outline" onClick={() => handleView(item)}>
              <Eye className="w-4 h-4" />
            </Button>
          )}
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {/* Advisors cannot delete - only view and edit */}
        </div>
      );
    };

    switch (activeTab) {
      case 'users':
        return (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.email}</TableCell>
            <TableCell>{item.phone || 'No registrado'}</TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell>{item.joinDate}</TableCell>
            <TableCell>{renderActions({ canView: canViewActiveTab, canEdit: canEditActiveTab })}</TableCell>
          </TableRow>
        );

      case 'packages':
        return (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>${item.price?.toLocaleString() || 'Consultar'}</TableCell>
            <TableCell>{item.duration || 'No especificado'}</TableCell>
            <TableCell>{item.maxParticipants || 'Sin límite'}</TableCell>
            <TableCell>{item.guide}</TableCell>
            <TableCell>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="ml-1 text-sm">{item.rating || '5.0'}</span>
              </div>
            </TableCell>
            <TableCell>{renderActions({ canView: canViewActiveTab, canEdit: canEditActiveTab })}</TableCell>
          </TableRow>
        );

      case 'bookings':
        return (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.clientName}</TableCell>
            <TableCell>{item.packageName}</TableCell>
            <TableCell>{item.date}</TableCell>
            <TableCell>{item.participants}</TableCell>
            <TableCell>${item.total?.toLocaleString() || '0'}</TableCell>
            <TableCell>
              <span className="cursor-default pointer-events-none">
                {getStatusBadge(item.status)}
              </span>
            </TableCell>
            <TableCell>{renderActions({ canView: canViewActiveTab, canEdit: canEditActiveTab })}</TableCell>
          </TableRow>
        );

      case 'farms':
        return (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.location}</TableCell>
            <TableCell>${item.price?.toLocaleString() || 'Consultar'}</TableCell>
            <TableCell>{item.capacity || 'Sin límite'} personas</TableCell>
            <TableCell>
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Switch
                  checked={item.status === 'Activo'}
                  disabled={!canEditActiveTab}
                  onCheckedChange={(checked) => {
                    if (!canEditActiveTab) {
                      toast.error(activeModulePerms?.getErrorMessage('editar') ?? 'No tienes permiso para editar');
                      return;
                    }
                    const newStatus = checked ? 'Activo' : 'Inactivo';
                    toast.success(`Estado cambiado a ${newStatus}`);
                  }}
                  className="data-[state=checked]:bg-green-600"
                />
                <span className="text-sm text-gray-700">
                  {item.status === 'Activo' ? 'Activo' : 'Inactivo'}
                </span>
              </motion.div>
            </TableCell>
            <TableCell>{renderActions({ canView: canViewActiveTab, canEdit: canEditActiveTab })}</TableCell>
          </TableRow>
        );

      case 'routes':
        return (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.distance}</TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs">{item.difficulty}</Badge>
            </TableCell>
            <TableCell>${item.price?.toLocaleString() || 'Consultar'}</TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell>{renderActions({ canView: canViewActiveTab, canEdit: canEditActiveTab })}</TableCell>
          </TableRow>
        );

      case 'services':
        return (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>${item.price?.toLocaleString() || 'Consultar'}</TableCell>
            <TableCell>{item.duration}</TableCell>
            <TableCell>
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Switch
                  checked={item.status === 'Activo'}
                  disabled={!canEditActiveTab}
                  onCheckedChange={(checked) => {
                    if (!canEditActiveTab) {
                      toast.error(activeModulePerms?.getErrorMessage('editar') ?? 'No tienes permiso para editar');
                      return;
                    }
                    const newStatus = checked ? 'Activo' : 'Inactivo';
                    toast.success(`Estado cambiado a ${newStatus}`);
                  }}
                  className="data-[state=checked]:bg-green-600"
                />
                <span className="text-sm text-gray-700">
                  {item.status === 'Activo' ? 'Activo' : 'Inactivo'}
                </span>
              </motion.div>
            </TableCell>
            <TableCell>{renderActions({ canView: canViewActiveTab, canEdit: canEditActiveTab })}</TableCell>
          </TableRow>
        );

      case 'sales':
        return (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.clientName}</TableCell>
            <TableCell>
              <div className="space-y-1">
                <div>{item.serviceName}</div>
                <Badge variant="outline" className="text-xs">
                  {item.serviceType}
                </Badge>
              </div>
            </TableCell>
            <TableCell>${item.totalAmount.toLocaleString()}</TableCell>
            <TableCell className="text-green-600">${item.commission?.toLocaleString() || '0'}</TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell className="text-sm text-gray-600">{item.saleDate}</TableCell>
            <TableCell>{renderActions({ canView: canViewActiveTab, canEdit: canEditActiveTab })}</TableCell>
          </TableRow>
        );

      default:
        return (
          <TableRow key={item.id}>
            <TableCell className="font-medium">-</TableCell>
            <TableCell>-</TableCell>
            <TableCell>-</TableCell>
            <TableCell>{renderActions({ canView: false, canEdit: false })}</TableCell>
          </TableRow>
        );
    }
  };

  // Render sales view with charts
  const renderSalesView = () => {
    const filteredData = getFilteredData();
    const columns = getTableColumns();

    return (
      <div className="space-y-6">
        {/* Sales Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Ventas por Tipo de Servicio</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={salesAnalytics.salesByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {salesAnalytics.salesByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10B981', '#059669', '#047857'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Ingresos Mensuales</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesAnalytics.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value.toLocaleString()}`, 'Ingresos']} />
                  <Area type="monotone" dataKey="revenue" stroke="#059669" fill="#d1fae5" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          </motion.div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar ventas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Venta
            </Button>
          </div>
        </div>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Historial de Ventas</span>
              <Badge variant="secondary">{filteredData.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => renderTableRow(item, index))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <AlertTriangle className="w-8 h-8 text-gray-400" />
                        <p className="text-gray-500">No se encontraron ventas</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render packages grid view
  const renderPackagesGrid = () => {
    if (!permisos.loadingRoles && !canViewActiveTab) {
      return (
        <div className="space-y-6">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Acceso denegado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">No tienes permiso para ver tours.</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    const filteredData = getFilteredData();

    return (
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar paquetes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            {canCreateActiveTab && (
              <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Crear Paquete
              </Button>
            )}
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.length > 0 ? (
            filteredData.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border-green-100 hover:border-green-300 h-full flex flex-col">
                  <CardHeader className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{pkg.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-2">
                          <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                          <span className="text-sm text-green-100">{pkg.rating || '5.0'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl">${pkg.price?.toLocaleString() || 'N/A'}</div>
                        <div className="text-xs text-green-100">por persona</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="space-y-3 mb-4 flex-1">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">{pkg.duration || 'No especificado'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">{pkg.maxParticipants || 'Sin límite'} personas max.</span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm">
                        <User className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">Guía: {pkg.guide}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleView(pkg)}
                        className="border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      {canEditActiveTab && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEdit(pkg)}
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay paquetes disponibles</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render data list view
  const renderDataView = () => {
    // Dashboard (same advanced dashboard as Admin)
    if (activeTab === 'dashboard') {
      return <DashboardAnalytics />;
    }

    // Use the same Users template as Admin
    if (activeTab === 'users') {
      return <UsersManagement />;
    }

    // Use the same Employees template as Admin
    if (activeTab === 'employees') {
      return <EmployeeManagement />;
    }

    // Roles management
    if (activeTab === 'roles') {
      return <RolesManagement />;
    }

    // Special case for packages with grid
    if (activeTab === 'packages') {
      return renderPackagesGrid();
    }

    // Special case for farms with FarmsManagement component
    if (activeTab === 'farms') {
      return <FarmsManagement canDelete={false} />;
    }

    // Special case for routes (read-only for advisors)
    if (activeTab === 'routes') {
      return <RoutesManagement userRole="advisor" />;
    }

    // Special case for sales - Use dedicated SalesManagement component for advisors (no annul option)
    if (activeTab === 'sales') {
      return <SalesManagement />;
    }

    // Special case for installments/abonos - Use dedicated PaymentInstallmentsManagement component for advisors (no annul option)
    if (activeTab === 'installments') {
      return <PaymentInstallmentsManagement userRole="advisor" />;
    }

    // Special case for providers (read-only for advisors)
    if (activeTab === 'providers') {
      return <ProviderManagement userRole="advisor" />;
    }

    // Special case for provider types (read-only for advisors)
    if (activeTab === 'provider-types') {
      return <ProviderTypeManagement userRole="advisor" />;
    }

    // Special case for owners (read-only for advisors)
    if (activeTab === 'owners') {
      return <OwnersManagement isReadOnly={true} />;
    }

    if (activeModule && !permisos.loadingRoles && !canViewActiveTab) {
      return (
        <div className="space-y-6">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Acceso denegado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">No tienes permiso para ver {currentMenuItem.label.toLowerCase()}.</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    const filteredData = getFilteredData();
    const columns = getTableColumns();
    
    // Paginación para servicios
    const isServicesTab = activeTab === 'services';
    const paginatedData = isServicesTab 
      ? filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      : filteredData;
    const totalPages = isServicesTab ? Math.ceil(filteredData.length / itemsPerPage) : 1;

    return (
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={`Buscar ${currentMenuItem.label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {(activeTab === 'users' || activeTab === 'packages' || activeTab === 'bookings' || activeTab === 'services' || activeTab === 'sales') && canCreateActiveTab && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Crear {currentMenuItem.label}
              </Button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CurrentIcon className="w-5 h-5" />
              <span>{currentMenuItem.label}</span>
              <Badge variant="secondary">{filteredData.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => renderTableRow(item, index))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <AlertTriangle className="w-8 h-8 text-gray-400" />
                        <p className="text-gray-500">No se encontraron registros</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Paginación para Servicios */}
        {isServicesTab && totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="border-green-200 hover:bg-green-50"
            >
              Anterior
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "border-green-200 hover:bg-green-50"
                  }
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="border-green-200 hover:bg-green-50"
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <DashboardSection>
        {/* Header with Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-2xl text-gray-900">Panel del Asesor</h2>
        </motion.div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderDataView()}
        </div>
      </DashboardSection>

      {/* Modal Crear Servicio */}
      <Dialog open={isCreateModalOpen && activeTab === 'services'} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Servicio</DialogTitle>
            <DialogDescription>
              Completa los campos para agregar un nuevo servicio
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Nombre del Servicio *</Label>
              <Input
                id="service-name"
                placeholder="Ej: Caballos Premium"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-price">Precio *</Label>
                <Input
                  id="service-price"
                  type="number"
                  placeholder="150000"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-duration">Duración *</Label>
                <Input
                  id="service-duration"
                  placeholder="Ej: 2 horas"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-contact">Número de Contacto *</Label>
              <Input
                id="service-contact"
                placeholder="Ej: +57 300 123 4567"
                value={formData.contactNumber || ''}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-status">Estado *</Label>
              <Select 
                value={formData.status || 'Activo'} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="service-status">
                  <SelectValue placeholder="Selecciona el estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Crear Servicio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}