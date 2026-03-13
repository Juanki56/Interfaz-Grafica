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
  UserCheck,
  Settings,
  Menu,
  TreePine,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  ChevronDown,
  MoreVertical,
  Phone,
  Mail,
  MapPin as LocationIcon,
  Info,
  Building2,
  Tag,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Power
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
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
  TableRow,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { DashboardLayout, DashboardSection, DashboardGrid } from './DashboardLayout';
import { toast } from 'sonner@2.0.3';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import {
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
import { PaymentManagement } from './PaymentManagement';
import { ProviderPaymentManagement } from './ProviderPaymentManagement';
import { FarmsManagement } from './FarmsManagement';
import { EmployeeManagement } from './EmployeeManagement';
import { SalesManagement } from './SalesManagementNew';
import { PaymentInstallmentsManagement } from './PaymentInstallmentsManagement';
import { BookingsManagement } from './BookingsManagement';
import { ClientsManagement } from './ClientsManagement';
import { OwnersManagement } from './OwnersManagement';
import { DashboardAnalytics } from './DashboardAnalytics';
import { ProgrammingManagement } from './ProgrammingManagement';
import { ProviderManagement } from './ProviderManagement';
import { ProviderTypeManagement } from './ProviderTypeManagement';
import { RoutesManagement } from './RoutesManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { rolesAPI, usersAPI } from '../services/api';

export function AdminDashboardWithDropdown() {
  const { adminActiveTab, setAdminActiveTab } = useAuth();
  const [activeTab, setActiveTab] = useState(adminActiveTab);
  const [salesSubTab, setSalesSubTab] = useState('historial');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Estado local para usuarios para manejar actualizaciones reactivas
  const [localUsers, setLocalUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Estado local para roles para manejar actualizaciones reactivas
  const [localRoles, setLocalRoles] = useState(mockRoles);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Estado local para rutas para manejar actualizaciones reactivas
  const [localRoutes, setLocalRoutes] = useState(mockRoutes);

  // Sync activeTab with context
  useEffect(() => {
    setActiveTab(adminActiveTab);
  }, [adminActiveTab]);

  // Update context when local activeTab changes
  useEffect(() => {
    setAdminActiveTab(activeTab);
  }, [activeTab, setAdminActiveTab]);

  // Management menu items
  const managementMenuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard Avanzado', 
      icon: TrendingUp, 
      description: 'Métricas y estadísticas',
      badge: 'Nuevo'
    },
    { 
      id: 'users', 
      label: 'Usuarios', 
      icon: Users, 
      description: 'Gestión de usuarios',
      badge: loadingUsers ? '...' : localUsers.length.toString()
    },
    { 
      id: 'clients', 
      label: 'Clientes', 
      icon: User, 
      description: 'Base de datos de clientes',
      badge: 'Nuevo'
    },
    { 
      id: 'owners', 
      label: 'Propietarios', 
      icon: UserCheck, 
      description: 'Gestión de propietarios',
      badge: '12'
    },
    { 
      id: 'employees', 
      label: 'Gestión de empleados', 
      icon: UserCheck, 
      description: 'Administra asesores y guías',
      badge: '6'
    },
    { 
      id: 'bookings', 
      label: 'Reservas', 
      icon: Calendar, 
      description: 'Gestión de reservas',
      badge: mockBookings.length.toString()
    },
    { 
      id: 'farms', 
      label: 'Fincas', 
      icon: TreePine, 
      description: 'Propiedades rurales',
      badge: mockFarms.length.toString()
    },
    { 
      id: 'routes', 
      label: 'Rutas', 
      icon: Route, 
      description: 'Rutas turísticas',
      badge: mockRoutes.length.toString()
    },
    { 
      id: 'services', 
      label: 'Servicios', 
      icon: Settings, 
      description: 'Gestión de servicios',
      badge: mockServices.length.toString()
    },
    { 
      id: 'sales', 
      label: 'Ventas', 
      icon: CreditCard, 
      description: 'Gestión de ventas',
      badge: mockSales.length.toString()
    },
    { 
      id: 'installments', 
      label: 'Abonos', 
      icon: DollarSign, 
      description: 'Pagos parciales',
      badge: '3'
    },
    { 
      id: 'payments', 
      label: 'Pagos', 
      icon: DollarSign, 
      description: 'Pagos a proveedores',
      badge: '8'
    },
    { 
      id: 'providers', 
      label: 'Proveedores', 
      icon: Building2, 
      description: 'Gestión de proveedores',
      badge: '5'
    },
    { 
      id: 'provider-types', 
      label: 'Tipos de Proveedor', 
      icon: Tag, 
      description: 'Categorías de proveedores',
      badge: '6'
    },
    { 
      id: 'roles', 
      label: 'Roles', 
      icon: UserCheck, 
      description: 'Permisos y roles',
      badge: mockRoles.length.toString()
    }
  ];

  // Get current menu item for display
  const getCurrentMenuItem = () => {
    return managementMenuItems.find(item => item.id === activeTab) || managementMenuItems[0];
  };

  const currentMenuItem = getCurrentMenuItem();
  const CurrentIcon = currentMenuItem.icon;

  const normalizarRolUsuario = (rol?: string | null) => {
    const rolNormalizado = (rol || '').toLowerCase().trim();
    const mapaRoles: Record<string, string> = {
      admin: 'Administrador',
      administrador: 'Administrador',
      advisor: 'Asesor',
      asesor: 'Asesor',
      guide: 'Guía',
      guia: 'Guía',
      'guía': 'Guía',
      client: 'Cliente',
      cliente: 'Cliente',
    };

    return mapaRoles[rolNormalizado] || rol || 'Cliente';
  };

  const rolFrontendABackend = (rol?: string | null) => {
    const rolNormalizado = (rol || '').toLowerCase().trim();
    const mapaRoles: Record<string, string> = {
      admin: 'Administrador',
      administrador: 'Administrador',
      advisor: 'Asesor',
      asesor: 'Asesor',
      guide: 'Guía',
      guia: 'Guía',
      'guía': 'Guía',
      'guía turístico': 'Guía',
      'guia turístico': 'Guía',
      client: 'Cliente',
      cliente: 'Cliente',
    };

    return mapaRoles[rolNormalizado] || rol || 'Cliente';
  };

  const formatearFechaUsuario = (fecha?: string | null) => {
    if (!fecha) return '−';

    const fechaObj = new Date(fecha);
    if (Number.isNaN(fechaObj.getTime())) return fecha;

    return fechaObj.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const mapearUsuarioBackend = (usuario: any) => {
    const nombreCompleto = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim();

    const rolRaw = (usuario?.rol_nombre || usuario?.rol || usuario?.role || usuario?.tipo_usuario || '').toString();
    const rolNormalizado = rolRaw.toLowerCase().trim();
    const mapaRolVista: Record<string, string> = {
      administrador: 'admin',
      admin: 'admin',
      asesor: 'advisor',
      advisor: 'advisor',
      guía: 'guide',
      guia: 'guide',
      guide: 'guide',
      cliente: 'client',
      client: 'client'
    };

    const estadoRaw = usuario?.estado;
    const estado = typeof estadoRaw === 'boolean'
      ? (estadoRaw ? 'Activo' : 'Inactivo')
      : ((estadoRaw || 'Activo').toString());

    return {
      id: String(usuario?.id_usuarios ?? usuario?.id_usuario ?? usuario?.id ?? usuario?.correo ?? Date.now()),
      id_usuarios: usuario?.id_usuarios ?? usuario?.id_usuario ?? usuario?.id,
      name: nombreCompleto || usuario?.correo || usuario?.email || 'Sin nombre',
      email: usuario?.correo || usuario?.email || '−',
      role: mapaRolVista[rolNormalizado] || rolNormalizado || 'client',
      status: estado,
      phone: usuario?.telefono || usuario?.phone || '−',
      joinDate: formatearFechaUsuario(
        usuario?.fecha_ingreso ||
        usuario?.fecha_contratacion ||
        usuario?.fecha_registro ||
        usuario?.fecha_creacion ||
        usuario?.created_at
      ),
      fecha_creacion: usuario?.fecha_creacion || usuario?.fecha_registro || usuario?.created_at || null,
    };
  };

  const cargarUsuarios = async () => {
    setLoadingUsers(true);
    try {
      const usuariosData = await usersAPI.getAll();
      setLocalUsers(usuariosData.map(mapearUsuarioBackend));
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast.error('Error al cargar usuarios desde la base de datos');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Get data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'users': return localUsers;
      case 'packages': return mockPackages;
      case 'bookings': return mockBookings;
      case 'farms': return mockFarms;
      case 'routes': return localRoutes;
      case 'services': return mockServices;
      case 'sales': return mockSales;
      case 'roles': return localRoles;
      default: return [];
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

  // Cargar roles desde la BD
  useEffect(() => {
    const cargarDatosTab = async () => {
      if (activeTab === 'users') {
        await cargarUsuarios();
      }

      if (activeTab === 'roles') {
        setLoadingRoles(true);
        try {
          const rolesData = await rolesAPI.getAll();
          const rolesAdaptados = rolesData.map(rol => ({
            id: rol.id_roles?.toString() || '',
            id_roles: rol.id_roles,
            nombre: rol.nombre || '',
            name: rol.nombre || '',
            descripcion: rol.descripcion || '',
            description: rol.descripcion || '',
            estado: rol.estado,
            status: rol.estado ? 'Activo' : 'Inactivo',
            fecha_creacion: rol.fecha_creacion
          }));
          setLocalRoles(rolesAdaptados as any);
        } catch (error) {
          console.error('Error al cargar roles:', error);
          toast.error('Error al cargar roles desde la base de datos');
        } finally {
          setLoadingRoles(false);
        }
      }
    };
    cargarDatosTab();
  }, [activeTab]);

  // Reset pagination when changing tabs or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // Handle CRUD operations
  const handleCreate = () => {
    if (activeTab === 'users') {
      toast.error('La creación de usuarios desde esta vista aún no está alineada con el backend actual.');
      return;
    }

    setFormData({});
    setIsCreateModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setFormData(item);
    setIsEditModalOpen(true);
  };

  const handleView = (item: any) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  const handleDelete = (item: any) => {
    if (activeTab === 'users') {
      toast.error('La eliminación de usuarios aún no está disponible desde el backend.');
      return;
    }

    toast.success(`${getItemName(item)} eliminado correctamente`);
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'users') {
        if (!selectedItem) {
          toast.error('La creación de usuarios desde esta vista aún no está alineada con el backend actual.');
          return;
        }

        const idUsuario = selectedItem.id_usuarios || selectedItem.id;
        if (!idUsuario) {
          throw new Error('No se encontró el ID del usuario a editar');
        }

        const estadoString = formData.status || selectedItem.status || 'Activo';
        const payload = {
          nombre: formData.name ?? selectedItem.name ?? null,
          correo: formData.email ?? selectedItem.email ?? null,
          telefono: formData.phone ?? selectedItem.phone ?? null,
          rol: rolFrontendABackend(formData.role ?? selectedItem.role ?? 'client'),
          estado: estadoString === 'Activo'
        };

        const usuarioActualizadoLocal = mapearUsuarioBackend({
          ...selectedItem,
          id_usuarios: idUsuario,
          nombre: payload.nombre,
          correo: payload.correo,
          telefono: payload.telefono,
          rol_nombre: payload.rol,
          estado: payload.estado,
          fecha_ingreso: selectedItem.joinDate,
          fecha_creacion: selectedItem.fecha_creacion,
        });

        const usuariosPrevios = localUsers;
        setLocalUsers(prev => prev.map((user: any) => 
          user.id === selectedItem.id ? usuarioActualizadoLocal : user
        ));

        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setFormData({});
        setSelectedItem(null);

        void (async () => {
          try {
            await usersAPI.update(idUsuario, payload);
            toast.success('Usuario actualizado correctamente');
            void cargarUsuarios();
          } catch (error: any) {
            setLocalUsers(usuariosPrevios);
            console.error('Error al guardar usuario:', error);
            toast.error(error?.message || 'Error al guardar el usuario');
          }
        })();

        return;
      } else if (activeTab === 'roles') {
        // Guardar rol en BD
        const rolData = {
          nombre: formData.name,
          descripcion: formData.description || null,
          estado: formData.status === 'Activo' ? true : false
        };

        if (selectedItem) {
          // Actualizar rol existente
          await rolesAPI.update(selectedItem.id_roles, rolData);
          toast.success('Rol actualizado correctamente');
        } else {
          // Crear nuevo rol
          await rolesAPI.create(rolData);
          toast.success('Rol creado correctamente');
        }
        
        // Recargar roles desde BD
        const rolesData = await rolesAPI.getAll();
        const rolesAdaptados = rolesData.map(rol => ({
          id: rol.id_roles?.toString() || '',
          id_roles: rol.id_roles,
          nombre: rol.nombre || '',
          name: rol.nombre || '',
          descripcion: rol.descripcion || '',
          description: rol.descripcion || '',
          estado: rol.estado,
          status: rol.estado ? 'Activo' : 'Inactivo',
          fecha_creacion: rol.fecha_creacion
        }));
        setLocalRoles(rolesAdaptados as any);
      } else {
        // Otros tabs (comportamiento mock actual)
        const action = selectedItem ? 'actualizado' : 'creado';
        toast.success(`Registro ${action} correctamente`);
      }
      
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      setFormData({});
      setSelectedItem(null);
    } catch (error: any) {
      console.error('Error al guardar:', error);
      toast.error(error?.message || 'Error al guardar el registro');
    }
  };

  const getItemName = (item: any) => {
    return item?.name || item?.email || item?.nombre || item?.packageName || item?.clientName || item?.vehicleType || 'Elemento';
  };

  // Render overview dashboard
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-md hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-white" />
                <div>
                  <p className="text-sm text-green-100">Total Usuarios</p>
                  <p className="text-2xl text-white">{overviewStats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white border-green-200 shadow-md hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Package className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Paquetes Activos</p>
                  <p className="text-2xl text-green-700">{overviewStats.totalPackages}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-green-600 to-emerald-700 border-0 shadow-md hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-8 h-8 text-white" />
                <div>
                  <p className="text-sm text-green-100">Reservas</p>
                  <p className="text-2xl text-white">{overviewStats.totalBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white border-green-200 shadow-md hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl text-green-700">${overviewStats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Access */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="shadow-md border-green-100">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-green-800">Acceso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {managementMenuItems.slice(1, 7).map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <Button
                      variant="outline"
                      className="flex items-center justify-start space-x-3 h-auto p-4 w-full border-green-200 hover:bg-green-50 hover:border-green-400 transition-all duration-300"
                      onClick={() => setActiveTab(item.id)}
                    >
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Icon className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <div className="text-gray-900">{item.label}</div>
                        <div className="text-sm text-gray-500">{item.badge} registros</div>
                      </div>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  // Render table columns based on active tab
  const getTableColumns = () => {
    switch (activeTab) {
      case 'users':
        return ['Nombre', 'Email', 'Rol', 'Estado', 'Teléfono', 'Fecha Ingreso', 'Acciones'];
      case 'packages':
        return ['Paquete', 'Precio', 'Duración', 'Capacidad', 'Guía', 'Rating', 'Rutas/Servicios', 'Acciones'];
      case 'bookings':
        return ['Cliente', 'Paquete', 'Fecha', 'Participantes', 'Total', 'Estado', 'Pago', 'Acciones'];
      case 'farms':
        return ['Finca', 'Ubicación', 'Área', 'Capacidad', 'Propietario', 'Rating', 'Estado', 'Acciones'];
      case 'routes':
        return ['Ruta', 'Distancia', 'Duración', 'Dificultad', 'Puntos', 'Guía', 'Estado', 'Acciones'];
      case 'services':
        return ['Servicio', 'Precio', 'Duración', 'Estado', 'Acciones'];
      case 'sales':
        return ['Cliente', 'Servicio', 'Total', 'Pagado', 'Pendiente', 'Estado', 'Fecha', 'Acciones'];
      case 'roles':
        return ['ID', 'Nombre', 'Descripción', 'Estado', 'Fecha Creación', 'Acciones'];
      default:
        return [];
    }
  };

  // Render table row based on active tab
  const renderTableRow = (item: any, index: number) => {
    const getStatusBadge = (status: string) => {
      const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
        'Activo': 'default',
        'Activa': 'default',
        'Confirmada': 'default',
        'Pagado': 'default',
        'Disponible': 'default',
        'Inactivo': 'secondary',
        'Inactiva': 'secondary',
        'Pendiente': 'outline',
        'Abono': 'outline',
        'Cotización': 'outline',
        'Mantenimiento': 'destructive',
        'En servicio': 'outline'
      };
      return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
    };

    switch (activeTab) {
      case 'users':
        return (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.email}</TableCell>
            <TableCell>
              <Badge variant="outline">{item.role}</Badge>
            </TableCell>
            <TableCell>
              <Badge className={item.status === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                {item.status}
              </Badge>
            </TableCell>
            <TableCell>{item.phone}</TableCell>
            <TableCell className="text-sm text-gray-600">{item.joinDate}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleView(item)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    const newStatus = item.status === 'Activo' ? 'Inactivo' : 'Activo';
                    setLocalUsers(prev => prev.map((u: any) => 
                      u.id === item.id ? { ...u, status: newStatus } : u
                    ));
                    toast.success(`Usuario ${newStatus === 'Activo' ? 'activado' : 'desactivado'} exitosamente`);
                  }}
                  className={item.status === 'Activo' ? 'hover:bg-yellow-50 hover:text-yellow-600' : 'hover:bg-green-50 hover:text-green-600'}
                >
                  {item.status === 'Activo' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el usuario.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(item)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        );

      case 'packages':
        return (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>${item.price.toLocaleString()}</TableCell>
            <TableCell>{item.duration}</TableCell>
            <TableCell>{item.capacity} personas</TableCell>
            <TableCell>{item.guide}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>{item.rating}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="text-xs text-gray-600">
                  {item.routes?.length || 0} rutas
                </div>
                <div className="text-xs text-gray-600">
                  {item.services?.length || 0} servicios
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleView(item)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el paquete.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(item)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        );

      case 'bookings':
        return (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.clientName}</TableCell>
            <TableCell>{item.packageName}</TableCell>
            <TableCell>{item.date}</TableCell>
            <TableCell>
              <div className="space-y-1">
                <div>{item.participants} total</div>
                <div className="text-xs text-gray-600">{item.adults}A / {item.children}N</div>
              </div>
            </TableCell>
            <TableCell>${item.total.toLocaleString()}</TableCell>
            <TableCell>
              <span className="cursor-default pointer-events-none">
                {getStatusBadge(item.status)}
              </span>
            </TableCell>
            <TableCell>
              <span className="cursor-default pointer-events-none">
                {getStatusBadge(item.paymentStatus)}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleView(item)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente la reserva.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(item)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        );

      case 'farms':
        return (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.location}</TableCell>
            <TableCell>{item.area}</TableCell>
            <TableCell>{item.capacity} personas</TableCell>
            <TableCell>{item.owner}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>{item.rating}</span>
              </div>
            </TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleView(item)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente la finca.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(item)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        );

      case 'routes':
        return (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.distance}</TableCell>
            <TableCell>{item.duration}</TableCell>
            <TableCell>
              <Badge variant={item.difficulty === 'Fácil' ? 'default' : item.difficulty === 'Moderada' ? 'outline' : 'destructive'}>
                {item.difficulty}
              </Badge>
            </TableCell>
            <TableCell className="text-sm">{item.points?.length || 0} puntos</TableCell>
            <TableCell>{item.guide}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.status === 'Activa'}
                  onCheckedChange={(checked) => {
                    const newStatus = checked ? 'Activa' : 'Inactiva';
                    setLocalRoutes(prev => prev.map(r => 
                      r.id === item.id ? { ...r, status: newStatus } : r
                    ));
                    toast.success(`Ruta ${newStatus === 'Activa' ? 'activada' : 'desactivada'} exitosamente`);
                  }}
                  className="data-[state=checked]:bg-green-600"
                />
                <span className="text-sm text-gray-700">
                  {item.status === 'Activa' ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleView(item)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente la ruta.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(item)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        );

      case 'services':
        return (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>${item.price.toLocaleString()}</TableCell>
            <TableCell>{item.duration}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.status === 'Activo'}
                  onCheckedChange={(checked) => {
                    const newStatus = checked ? 'Activo' : 'Inactivo';
                    toast.success(`Estado cambiado a ${newStatus}`);
                  }}
                  className="data-[state=checked]:bg-green-600"
                />
                <span className="text-sm text-gray-700">
                  {item.status === 'Activo' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleView(item)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el servicio.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(item)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
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
            <TableCell className="text-green-600">${item.paidAmount.toLocaleString()}</TableCell>
            <TableCell className="text-orange-600">${item.pendingAmount.toLocaleString()}</TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell className="text-sm text-gray-600">{item.saleDate}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleView(item)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente la venta.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(item)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        );

      case 'roles':
        return (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.id_roles}</TableCell>
            <TableCell className="font-medium">{item.nombre}</TableCell>
            <TableCell className="max-w-xs truncate">{item.descripcion || '−'}</TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell className="text-sm text-gray-600">
              {item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleDateString('es-CO', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '−'}
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleView(item)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={async () => {
                    const newEstado = !item.estado;
                    try {
                      await rolesAPI.update(item.id_roles, { estado: newEstado });
                      setLocalRoles(prev => prev.map(r => 
                        r.id === item.id ? { ...r, estado: newEstado, status: newEstado ? 'Activo' : 'Inactivo' } : r
                      ));
                      toast.success(`Rol ${newEstado ? 'activado' : 'desactivado'} exitosamente`);
                    } catch (error) {
                      toast.error('Error al actualizar el estado del rol');
                    }
                  }}
                  className={item.estado ? 'hover:bg-yellow-50 hover:text-yellow-600' : 'hover:bg-green-50 hover:text-green-600'}
                >
                  {item.estado ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el rol.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(item)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        );

      default:
        return (
          <TableRow key={index}>
            <TableCell colSpan={6} className="text-center text-gray-500">
              Implementación de tabla para {activeTab} en desarrollo
            </TableCell>
          </TableRow>
        );
    }
  };

  // Render create/edit form
  const renderForm = (isEdit: boolean = false) => {
    const title = isEdit ? `Editar ${currentMenuItem.label}` : `Crear ${currentMenuItem.label}`;
    
    return (
      <div className="space-y-6 max-h-96 overflow-y-auto">
        {/* Basic Info Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Información Básica</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input 
                id="name" 
                value={formData.name || ''} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ingrese el nombre"
              />
            </div>
            
            {/* Users Form Fields */}
            {activeTab === 'users' && (
              <>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email || ''} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone || ''} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+57 300 000 0000"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Rol</Label>
                  <Select value={formData.role || ''} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrador">Administrador</SelectItem>
                      <SelectItem value="Asesor">Asesor</SelectItem>
                      <SelectItem value="Guía Turístico">Guía Turístico</SelectItem>
                      <SelectItem value="Cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="documentType">Tipo de Documento</Label>
                  <Select value={formData.documentType || ''} onValueChange={(value) => setFormData({...formData, documentType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C.C.">Cédula de Ciudadanía (C.C.)</SelectItem>
                      <SelectItem value="C.E.">Cédula de Extranjería (C.E.)</SelectItem>
                      <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                      <SelectItem value="T.I.">Tarjeta de Identidad (T.I.)</SelectItem>
                      <SelectItem value="NIT">NIT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="documentNumber">Número de Documento</Label>
                  <Input 
                    id="documentNumber" 
                    type="text"
                    value={formData.documentNumber || ''} 
                    onChange={(e) => setFormData({...formData, documentNumber: e.target.value})}
                    placeholder="Ingrese el número de documento"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input 
                    id="address" 
                    value={formData.address || ''} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Dirección de residencia o contacto"
                  />
                </div>
              </>
            )}

            {/* Packages Form Fields */}
            {activeTab === 'packages' && (
              <>
                <div>
                  <Label htmlFor="price">Precio</Label>
                  <Input 
                    id="price" 
                    type="number"
                    value={formData.price || ''} 
                    onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})}
                    placeholder="150000"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duración</Label>
                  <Input 
                    id="duration" 
                    value={formData.duration || ''} 
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="8 horas"
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacidad</Label>
                  <Input 
                    id="capacity" 
                    type="number"
                    value={formData.capacity || ''} 
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    placeholder="15"
                  />
                </div>
                <div>
                  <Label htmlFor="guide">Guía Asignado</Label>
                  <Select value={formData.guide || ''} onValueChange={(value) => setFormData({...formData, guide: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar guía" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Carlos Ruiz">Carlos Ruiz</SelectItem>
                      <SelectItem value="Pedro Martínez">Pedro Martínez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="difficulty">Dificultad</Label>
                  <Select value={formData.difficulty || ''} onValueChange={(value) => setFormData({...formData, difficulty: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar dificultad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fácil">Fácil</SelectItem>
                      <SelectItem value="Moderada">Moderada</SelectItem>
                      <SelectItem value="Difícil">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={formData.category || ''} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cultural">Cultural</SelectItem>
                      <SelectItem value="Aventura">Aventura</SelectItem>
                      <SelectItem value="Rural">Rural</SelectItem>
                      <SelectItem value="Naturaleza">Naturaleza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Routes Form Fields */}
            {activeTab === 'routes' && (
              <>
                <div>
                  <Label htmlFor="distance">Distancia</Label>
                  <Input 
                    id="distance" 
                    value={formData.distance || ''} 
                    onChange={(e) => setFormData({...formData, distance: e.target.value})}
                    placeholder="5.2 km"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duración</Label>
                  <Input 
                    id="duration" 
                    value={formData.duration || ''} 
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="4 horas"
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Dificultad</Label>
                  <Select value={formData.difficulty || ''} onValueChange={(value) => setFormData({...formData, difficulty: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar dificultad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fácil">Fácil</SelectItem>
                      <SelectItem value="Moderada">Moderada</SelectItem>
                      <SelectItem value="Difícil">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startPoint">Punto de Inicio</Label>
                  <Input 
                    id="startPoint" 
                    value={formData.startPoint || ''} 
                    onChange={(e) => setFormData({...formData, startPoint: e.target.value})}
                    placeholder="Valle del Cocora"
                  />
                </div>
                <div>
                  <Label htmlFor="endPoint">Punto Final</Label>
                  <Input 
                    id="endPoint" 
                    value={formData.endPoint || ''} 
                    onChange={(e) => setFormData({...formData, endPoint: e.target.value})}
                    placeholder="Bosque de Niebla"
                  />
                </div>
                <div>
                  <Label htmlFor="altitude">Altitud</Label>
                  <Input 
                    id="altitude" 
                    value={formData.altitude || ''} 
                    onChange={(e) => setFormData({...formData, altitude: e.target.value})}
                    placeholder="2400-2800 metros"
                  />
                </div>
                <div>
                  <Label htmlFor="terrain">Terreno</Label>
                  <Select value={formData.terrain || ''} onValueChange={(value) => setFormData({...formData, terrain: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de terreno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Montañoso">Montañoso</SelectItem>
                      <SelectItem value="Colinas suaves">Colinas suaves</SelectItem>
                      <SelectItem value="Rocoso empinado">Rocoso empinado</SelectItem>
                      <SelectItem value="Sendero natural">Sendero natural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maxGroup">Grupo Máximo</Label>
                  <Input 
                    id="maxGroup" 
                    type="number"
                    value={formData.maxGroup || ''} 
                    onChange={(e) => setFormData({...formData, maxGroup: parseInt(e.target.value)})}
                    placeholder="15"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Precio</Label>
                  <Input 
                    id="price" 
                    type="number"
                    value={formData.price || ''} 
                    onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})}
                    placeholder="45000"
                  />
                </div>
                <div>
                  <Label htmlFor="guide">Guía Asignado</Label>
                  <Select value={formData.guide || ''} onValueChange={(value) => setFormData({...formData, guide: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar guía" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Carlos Ruiz">Carlos Ruiz</SelectItem>
                      <SelectItem value="Pedro Martínez">Pedro Martínez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Services Form Fields */}
            {activeTab === 'services' && (
              <>
                <div>
                  <Label htmlFor="price">Precio</Label>
                  <Input 
                    id="price" 
                    type="number"
                    value={formData.price || ''} 
                    onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duración</Label>
                  <Input 
                    id="duration" 
                    value={formData.duration || ''} 
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="Por trayecto"
                  />
                </div>
              </>
            )}

            {/* Bookings Form Fields */}
            {activeTab === 'bookings' && (
              <>
                <div>
                  <Label htmlFor="clientName">Cliente</Label>
                  <Input 
                    id="clientName" 
                    value={formData.clientName || ''} 
                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">Email Cliente</Label>
                  <Input 
                    id="clientEmail" 
                    type="email"
                    value={formData.clientEmail || ''} 
                    onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                    placeholder="cliente@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="clientPhone">Teléfono Cliente</Label>
                  <Input 
                    id="clientPhone" 
                    value={formData.clientPhone || ''} 
                    onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                    placeholder="+57 300 000 0000"
                  />
                </div>
                <div>
                  <Label htmlFor="packageName">Paquete</Label>
                  <Select value={formData.packageName || ''} onValueChange={(value) => setFormData({...formData, packageName: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar paquete" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockPackages.map(pkg => (
                        <SelectItem key={pkg.id} value={pkg.name}>{pkg.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Fecha del Servicio</Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={formData.date || ''} 
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="checkIn">Hora Check-in</Label>
                  <Input 
                    id="checkIn" 
                    type="time"
                    value={formData.checkIn || ''} 
                    onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="adults">Adultos</Label>
                  <Input 
                    id="adults" 
                    type="number"
                    value={formData.adults || ''} 
                    onChange={(e) => setFormData({...formData, adults: parseInt(e.target.value)})}
                    placeholder="2"
                  />
                </div>
                <div>
                  <Label htmlFor="children">Niños</Label>
                  <Input 
                    id="children" 
                    type="number"
                    value={formData.children || ''} 
                    onChange={(e) => setFormData({...formData, children: parseInt(e.target.value)})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Método de Pago</Label>
                  <Select value={formData.paymentMethod || ''} onValueChange={(value) => setFormData({...formData, paymentMethod: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tarjeta de Crédito">Tarjeta de Crédito</SelectItem>
                      <SelectItem value="Tarjeta de Débito">Tarjeta de Débito</SelectItem>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="emergency">Contacto de Emergencia</Label>
                  <Input 
                    id="emergency" 
                    value={formData.emergency || ''} 
                    onChange={(e) => setFormData({...formData, emergency: e.target.value})}
                    placeholder="Nombre - Teléfono"
                  />
                </div>
              </>
            )}

            {/* Farms Form Fields */}
            {activeTab === 'farms' && (
              <>
                <div>
                  <Label htmlFor="location">Ubicación</Label>
                  <Input 
                    id="location" 
                    value={formData.location || ''} 
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Ciudad, Departamento"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input 
                    id="address" 
                    value={formData.address || ''} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Dirección completa"
                  />
                </div>
                <div>
                  <Label htmlFor="area">Área</Label>
                  <Input 
                    id="area" 
                    value={formData.area || ''} 
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    placeholder="15 hectáreas"
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacidad</Label>
                  <Input 
                    id="capacity" 
                    type="number"
                    value={formData.capacity || ''} 
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    placeholder="25"
                  />
                </div>
                <div>
                  <Label htmlFor="rooms">Habitaciones</Label>
                  <Input 
                    id="rooms" 
                    type="number"
                    value={formData.rooms || ''} 
                    onChange={(e) => setFormData({...formData, rooms: parseInt(e.target.value)})}
                    placeholder="8"
                  />
                </div>
                <div>
                  <Label htmlFor="owner">Propietario</Label>
                  <Input 
                    id="owner" 
                    value={formData.owner || ''} 
                    onChange={(e) => setFormData({...formData, owner: e.target.value})}
                    placeholder="Nombre del propietario"
                  />
                </div>
                <div>
                  <Label htmlFor="ownerEmail">Email Propietario</Label>
                  <Input 
                    id="ownerEmail" 
                    type="email"
                    value={formData.ownerEmail || ''} 
                    onChange={(e) => setFormData({...formData, ownerEmail: e.target.value})}
                    placeholder="propietario@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone || ''} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+57 300 000 0000"
                  />
                </div>
                <div>
                  <Label htmlFor="pricePerNight">Precio por Noche</Label>
                  <Input 
                    id="pricePerNight" 
                    type="number"
                    value={formData.pricePerNight || ''} 
                    onChange={(e) => setFormData({...formData, pricePerNight: parseInt(e.target.value)})}
                    placeholder="120000"
                  />
                </div>
                <div>
                  <Label htmlFor="climate">Clima</Label>
                  <Input 
                    id="climate" 
                    value={formData.climate || ''} 
                    onChange={(e) => setFormData({...formData, climate: e.target.value})}
                    placeholder="Templado húmedo"
                  />
                </div>
              </>
            )}

            {/* Sales Form Fields */}
            {activeTab === 'sales' && (
              <>
                <div>
                  <Label htmlFor="clientName">Cliente</Label>
                  <Input 
                    id="clientName" 
                    value={formData.clientName || ''} 
                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">Email Cliente</Label>
                  <Input 
                    id="clientEmail" 
                    type="email"
                    value={formData.clientEmail || ''} 
                    onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                    placeholder="cliente@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="serviceType">Tipo de Servicio</Label>
                  <Select value={formData.serviceType || ''} onValueChange={(value) => setFormData({...formData, serviceType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paquete">Paquete</SelectItem>
                      <SelectItem value="Finca">Finca</SelectItem>
                      <SelectItem value="Ruta">Ruta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="serviceName">Servicio</Label>
                  <Input 
                    id="serviceName" 
                    value={formData.serviceName || ''} 
                    onChange={(e) => setFormData({...formData, serviceName: e.target.value})}
                    placeholder="Nombre del servicio"
                  />
                </div>
                <div>
                  <Label htmlFor="totalAmount">Monto Total</Label>
                  <Input 
                    id="totalAmount" 
                    type="number"
                    value={formData.totalAmount || ''} 
                    onChange={(e) => setFormData({...formData, totalAmount: parseInt(e.target.value)})}
                    placeholder="600000"
                  />
                </div>
                <div>
                  <Label htmlFor="discount">Descuento</Label>
                  <Input 
                    id="discount" 
                    type="number"
                    value={formData.discount || ''} 
                    onChange={(e) => setFormData({...formData, discount: parseInt(e.target.value)})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Método de Pago</Label>
                  <Select value={formData.paymentMethod || ''} onValueChange={(value) => setFormData({...formData, paymentMethod: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tarjeta de Crédito">Tarjeta de Crédito</SelectItem>
                      <SelectItem value="Tarjeta de Débito">Tarjeta de Débito</SelectItem>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="saleDate">Fecha de Venta</Label>
                  <Input 
                    id="saleDate" 
                    type="date"
                    value={formData.saleDate || ''} 
                    onChange={(e) => setFormData({...formData, saleDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="serviceDate">Fecha del Servicio</Label>
                  <Input 
                    id="serviceDate" 
                    type="date"
                    value={formData.serviceDate || ''} 
                    onChange={(e) => setFormData({...formData, serviceDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="advisor">Asesor</Label>
                  <Select value={formData.advisor || ''} onValueChange={(value) => setFormData({...formData, advisor: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar asesor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ana García">Ana García</SelectItem>
                      <SelectItem value="Sofia Herrera">Sofia Herrera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Roles Form Fields */}
            {activeTab === 'roles' && (
              <>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Descripción del Rol</Label>
                  <Textarea 
                    id="description" 
                    value={formData.description || ''} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe las responsabilidades del rol..."
                    className="min-h-[80px]"
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={formData.status || ''} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {activeTab === 'roles' ? (
                    <>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Activa">Activa</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                      <SelectItem value="Inactiva">Inactiva</SelectItem>
                      <SelectItem value="Confirmada">Confirmada</SelectItem>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Disponible">Disponible</SelectItem>
                      <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {(activeTab === 'packages' || activeTab === 'farms' || activeTab === 'routes' || activeTab === 'bookings') && (
          <div>
            <Label htmlFor="description">
              {activeTab === 'bookings' ? 'Solicitudes Especiales' : 'Descripción'}
            </Label>
            <Textarea 
              id="description" 
              value={formData.description || formData.specialRequests || ''} 
              onChange={(e) => setFormData({
                ...formData, 
                [activeTab === 'bookings' ? 'specialRequests' : 'description']: e.target.value
              })}
              placeholder={
                activeTab === 'bookings' 
                  ? "Solicitudes especiales del cliente..." 
                  : "Describe detalladamente..."
              }
              className="min-h-[100px]"
            />
          </div>
        )}

        {/* Package Inheritance Section */}
        {activeTab === 'packages' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Rutas y Servicios Incluidos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Rutas Incluidas</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                  {mockRoutes.map(route => (
                    <div key={route.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`route-${route.id}`}
                        checked={formData.routes?.includes(route.id) || false}
                        onChange={(e) => {
                          const routes = formData.routes || [];
                          if (e.target.checked) {
                            setFormData({...formData, routes: [...routes, route.id]});
                          } else {
                            setFormData({...formData, routes: routes.filter((id: string) => id !== route.id)});
                          }
                        }}
                      />
                      <label htmlFor={`route-${route.id}`} className="text-sm">{route.name}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Servicios Incluidos</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                  {mockServices.map(service => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`service-${service.id}`}
                        checked={formData.services?.includes(service.id) || false}
                        onChange={(e) => {
                          const services = formData.services || [];
                          if (e.target.checked) {
                            setFormData({...formData, services: [...services, service.id]});
                          } else {
                            setFormData({...formData, services: services.filter((id: string) => id !== service.id)});
                          }
                        }}
                      />
                      <label htmlFor={`service-${service.id}`} className="text-sm">{service.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Roles Permissions Section */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Permisos y Accesos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Módulos de Acceso</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                  {['Dashboard', 'Usuarios', 'Paquetes', 'Reservas', 'Fincas', 'Rutas', 'Servicios', 'Ventas', 'Roles', 'Reportes'].map(module => (
                    <div key={module} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`module-${module}`}
                        checked={formData.modules?.includes(module) || false}
                        onChange={(e) => {
                          const modules = formData.modules || [];
                          if (e.target.checked) {
                            setFormData({...formData, modules: [...modules, module]});
                          } else {
                            setFormData({...formData, modules: modules.filter((m: string) => m !== module)});
                          }
                        }}
                      />
                      <label htmlFor={`module-${module}`} className="text-sm">{module}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Permisos</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                  {['crear', 'leer', 'editar', 'eliminar', 'gestionar', 'reportes'].map(permission => (
                    <div key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`permission-${permission}`}
                        checked={formData.permissions?.some((p: string) => p.includes(permission)) || false}
                        onChange={(e) => {
                          const permissions = formData.permissions || [];
                          const basePermissions = ['usuarios', 'paquetes', 'reservas', 'fincas', 'rutas', 'servicios', 'ventas', 'personal', 'roles'];
                          if (e.target.checked) {
                            const newPermissions = basePermissions.map(bp => `${bp}.${permission}`);
                            setFormData({...formData, permissions: [...permissions, ...newPermissions]});
                          } else {
                            setFormData({...formData, permissions: permissions.filter((p: string) => !p.includes(permission))});
                          }
                        }}
                      />
                      <label htmlFor={`permission-${permission}`} className="text-sm capitalize">{permission}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label>Vistas Disponibles</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded p-2">
                {['Lista completa', 'Formularios', 'Detalles', 'Reportes', 'Estadísticas', 'Calendario'].map(view => (
                  <div key={view} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`view-${view}`}
                      checked={formData.views?.includes(view) || false}
                      onChange={(e) => {
                        const views = formData.views || [];
                        if (e.target.checked) {
                          setFormData({...formData, views: [...views, view]});
                        } else {
                          setFormData({...formData, views: views.filter((v: string) => v !== view)});
                        }
                      }}
                    />
                    <label htmlFor={`view-${view}`} className="text-xs">{view}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Credentials Section - Only for Users */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Credenciales de Acceso</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={formData.password || ''} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Ingrese la contraseña"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input 
                  id="confirmPassword" 
                  type="password"
                  value={formData.confirmPassword || ''} 
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="Confirme la contraseña"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendCredentials"
                checked={formData.sendCredentials || false}
                onChange={(e) => setFormData({...formData, sendCredentials: e.target.checked})}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <Label htmlFor="sendCredentials" className="cursor-pointer text-sm text-gray-700">
                Enviar credenciales por correo electrónico
              </Label>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setFormData({});
          }}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>
    );
  };

  // Render sales analytics
  const renderSalesAnalytics = () => {
    return (
      <div className="space-y-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900">Análisis de Ventas</h3>
        
        {/* Sales Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-100">Ventas Totales</p>
                  <p className="text-2xl font-bold">${salesAnalytics.salesTrends.totalSales.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-white/80" />
              </div>
              <p className="text-xs text-green-100 mt-2">+{salesAnalytics.salesTrends.growth}% vs mes anterior</p>
            </CardContent>
          </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-white border-green-200 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ticket Promedio</p>
                  <p className="text-2xl font-bold text-green-700">${salesAnalytics.salesTrends.averageTicket.toLocaleString()}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-green-600 to-emerald-700 text-white border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-100">Tasa Conversión</p>
                  <p className="text-2xl font-bold">{salesAnalytics.salesTrends.conversionRate}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-white/80" />
              </div>
            </CardContent>
          </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-white border-green-200 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Clientes Recurrentes</p>
                  <p className="text-2xl font-bold text-green-700">{salesAnalytics.salesTrends.repeatCustomers}%</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Ingresos Mensuales por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesAnalytics.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`${value.toLocaleString()}`, '']} />
                  <Area type="monotone" dataKey="paquetes" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" />
                  <Area type="monotone" dataKey="fincas" stackId="1" stroke="#10B981" fill="#10B981" />
                  <Area type="monotone" dataKey="rutas" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sales by Type Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Ventas por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={salesAnalytics.salesByType}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ type, value }) => `${type}: ${value}%`}
                  >
                    {salesAnalytics.salesByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesAnalytics.paymentMethods}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="method" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`${value}%`, 'Porcentaje']} />
                  <Bar dataKey="percentage" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Advisors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Asesores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesAnalytics.topAdvisors.map((advisor, index) => (
                  <div key={advisor.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{advisor.name}</p>
                        <p className="text-sm text-gray-600">{advisor.sales} ventas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${advisor.revenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Comisión: ${advisor.commission.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Render packages grid view
  const renderPackagesGrid = () => {
    const filteredData = getFilteredData();

    return (
      <div className="space-y-6">
        {/* Header Actions */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
        >
          <div className="flex items-center space-x-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-700 w-4 h-4" />
              <Input
                placeholder="Buscar paquetes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 border-green-300 focus:border-green-500"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button variant="outline" size="sm" className="border-green-300 hover:bg-green-50 hover:border-green-500">
                <Filter className="w-4 h-4 mr-2 text-green-700" />
                <span className="text-green-800">Filtros</span>
              </Button>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center space-x-2"
          >
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreate} className="bg-green-700 hover:bg-green-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Paquete
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Paquete</DialogTitle>
                  <DialogDescription>
                    Complete los campos para crear un nuevo paquete turístico.
                  </DialogDescription>
                </DialogHeader>
                {renderForm(false)}
              </DialogContent>
            </Dialog>
          </motion.div>
        </motion.div>

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
                <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border-green-200 hover:border-green-400 h-full flex flex-col">
                  <CardHeader className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{pkg.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-2">
                          <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                          <span className="text-sm text-green-50">{pkg.rating}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl">${pkg.price.toLocaleString()}</div>
                        <div className="text-xs text-green-50">por persona</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 flex-1 flex flex-col">
                    {/* Package Info */}
                    <div className="space-y-3 mb-4 flex-1">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-green-700" />
                        <span className="text-gray-700">{pkg.duration}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm">
                        <Users className="w-4 h-4 text-green-700" />
                        <span className="text-gray-700">{pkg.capacity} personas max.</span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm">
                        <User className="w-4 h-4 text-green-700" />
                        <span className="text-gray-700">Guía: {pkg.guide}</span>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-green-50 rounded px-2 py-1 text-center">
                            <div className="text-green-800">{pkg.routes?.length || 0}</div>
                            <div className="text-gray-600">Rutas</div>
                          </div>
                          <div className="bg-green-50 rounded px-2 py-1 text-center">
                            <div className="text-green-800">{pkg.services?.length || 0}</div>
                            <div className="text-gray-600">Servicios</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-3 gap-2 mt-auto">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleView(pkg)}
                        className="border-green-700 text-green-700 hover:bg-green-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(pkg)}
                        className="border-green-700 text-green-700 hover:bg-green-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente el paquete.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(pkg)} className="bg-red-600 hover:bg-red-700">
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Paquete</DialogTitle>
              <DialogDescription>
                Modifique los campos que desea actualizar.
              </DialogDescription>
            </DialogHeader>
            {renderForm(true)}
          </DialogContent>
        </Dialog>

        {/* View Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles de {getItemName(selectedItem)}</DialogTitle>
              <DialogDescription>
                Información completa del paquete seleccionado.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedItem && Object.entries(selectedItem).map(([key, value]) => {
                if (key === 'id') return null;
                return (
                  <div key={key} className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium capitalize text-gray-700">{key}:</span>
                    <span className="text-gray-900">{String(value)}</span>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // Render data list view
  const renderDataView = () => {
    const filteredData = getFilteredData();
    const columns = getTableColumns();
    
    // Paginación para todos los tabs (excepto tabs especiales con componentes dedicados)
    const tabsWithPagination = ['users', 'bookings', 'routes', 'services', 'sales', 'roles'];
    const shouldPaginate = tabsWithPagination.includes(activeTab);
    const paginatedData = shouldPaginate 
      ? filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      : filteredData;
    const totalPages = shouldPaginate ? Math.ceil(filteredData.length / itemsPerPage) : 1;

    // If packages tab, render grid view
    if (activeTab === 'packages') {
      return renderPackagesGrid();
    }

    // If farms tab, render FarmsManagement component
    if (activeTab === 'farms') {
      return <FarmsManagement canDelete={true} />;
    }

    // If payments tab, render ProviderPaymentManagement component
    if (activeTab === 'payments') {
      return <ProviderPaymentManagement />;
    }

    // If employees tab, render EmployeeManagement component
    if (activeTab === 'employees') {
      return <EmployeeManagement />;
    }

    // If sales tab, render SalesManagement component
    if (activeTab === 'sales') {
      return <SalesManagement />;
    }

    // If installments tab, render PaymentInstallmentsManagement component
    if (activeTab === 'installments') {
      return <PaymentInstallmentsManagement />;
    }

    // If bookings tab, render BookingsManagement component
    if (activeTab === 'bookings') {
      return <BookingsManagement />;
    }

    // If clients tab, render ClientsManagement component
    if (activeTab === 'clients') {
      return <ClientsManagement />;
    }

    // If owners tab, render OwnersManagement component
    if (activeTab === 'owners') {
      return <OwnersManagement />;
    }

    // If dashboard tab, render DashboardAnalytics component
    if (activeTab === 'dashboard') {
      return <DashboardAnalytics />;
    }

    // If providers tab, render ProviderManagement component
    if (activeTab === 'providers') {
      return <ProviderManagement userRole="admin" />;
    }

    // If provider-types tab, render ProviderTypeManagement component
    if (activeTab === 'provider-types') {
      return <ProviderTypeManagement userRole="admin" />;
    }

    // If routes tab, render RoutesManagement component
    if (activeTab === 'routes') {
      return <RoutesManagement userRole="admin" />;
    }

    return (
      <div className="space-y-6">
        {/* Header Actions */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
        >
          <div className="flex items-center space-x-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 w-4 h-4" />
              <Input
                placeholder={`Buscar ${currentMenuItem.label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 border-green-200 focus:border-green-400"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button variant="outline" size="sm" className="border-green-200 hover:bg-green-50 hover:border-green-400">
                <Filter className="w-4 h-4 mr-2 text-green-600" />
                <span className="text-green-700">Filtros</span>
              </Button>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center space-x-2"
          >
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear {currentMenuItem.label}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear {currentMenuItem.label}</DialogTitle>
                  <DialogDescription>
                    Complete los campos para crear un nuevo registro.
                  </DialogDescription>
                </DialogHeader>
                {renderForm(false)}
              </DialogContent>
            </Dialog>
          </motion.div>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-md border-green-100">
            <CardContent className="p-0">
              <div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-50 hover:bg-green-50">
                      {columns.map((column, index) => (
                        <TableHead key={index} className="text-green-800">{column}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item, index) => renderTableRow(item, index))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                          No hay datos disponibles
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          {/* Paginación Mejorada */}
          {shouldPaginate && totalPages > 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between mt-6 px-4"
            >
              <div className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} registros
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-green-300 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={currentPage === pageNumber 
                          ? "bg-green-600 hover:bg-green-700 text-white min-w-[36px]" 
                          : "border-green-200 hover:bg-green-50 min-w-[36px]"
                        }
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="text-gray-400 px-1">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="border-green-200 hover:bg-green-50 min-w-[36px]"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="border-green-300 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar {currentMenuItem.label}</DialogTitle>
              <DialogDescription>
                Modifique los campos que desea actualizar.
              </DialogDescription>
            </DialogHeader>
            {renderForm(true)}
          </DialogContent>
        </Dialog>

        {/* View Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles de {getItemName(selectedItem)}</DialogTitle>
              <DialogDescription>
                Información completa del registro seleccionado.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedItem && Object.entries(selectedItem).map(([key, value]) => {
                // Manejo especial para permisos
                if (key.toLowerCase() === 'permissions') {
                  let permissions = [];
                  
                  // Si es array, usar directamente
                  if (Array.isArray(value)) {
                    permissions = value;
                  } 
                  // Si es string, dividir por comas
                  else if (typeof value === 'string') {
                    permissions = value.split(',').map(p => p.trim()).filter(p => p);
                  }
                  
                  if (permissions.length > 0) {
                    return (
                      <Collapsible key={key} className="border-b pb-2">
                        <div className="flex items-center justify-between py-2">
                          <span className="font-medium capitalize">{key}:</span>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <Badge variant="secondary">{permissions.length} permisos</Badge>
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent className="pt-2">
                          <div className="flex flex-wrap gap-2">
                            {permissions.map((permission, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  }
                }
                
                // Manejo especial para otros arrays (modules, views, etc.)
                if (Array.isArray(value) && value.length > 0 && (key.toLowerCase() === 'modules' || key.toLowerCase() === 'views')) {
                  return (
                    <Collapsible key={key} className="border-b pb-2">
                      <div className="flex items-center justify-between py-2">
                        <span className="font-medium capitalize">{key}:</span>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Badge variant="secondary">{value.length} items</Badge>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="pt-2">
                        <div className="flex flex-wrap gap-2">
                          {value.map((item, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {String(item)}
                            </Badge>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                }
                
                // Renderizado normal para otros campos con word-wrap
                return (
                  <div key={key} className="flex justify-between gap-4 py-2 border-b">
                    <span className="font-medium capitalize shrink-0">{key}:</span>
                    <span className="text-gray-600 text-right break-words max-w-md">{String(value)}</span>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <DashboardSection>
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl text-gray-900">Panel de Administración</h1>
        </motion.div>

        {/* Contenido Principal */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6 border border-green-100"
        >
          {renderDataView()}
        </motion.div>
      </DashboardSection>
    </DashboardLayout>
  );
}