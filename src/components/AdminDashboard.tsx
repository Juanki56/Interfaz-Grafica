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
  Shield,
  Save,
  UserCheck,
  Settings,
  X
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
import { Progress } from './ui/progress';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { BookingDetailsModal } from './BookingDetailsModal';

export function AdminDashboard() {
  const { getAllUsers, updateUserRole } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showAssignRoleDialog, setShowAssignRoleDialog] = useState(false);
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [rolesFilter, setRolesFilter] = useState('');
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: {}
  });
  const [selectedAssignUser, setSelectedAssignUser] = useState('');
  const [selectedAssignRole, setSelectedAssignRole] = useState('');
  const [changeRoleUser, setChangeRoleUser] = useState(null);
  const [newUserRole, setNewUserRole] = useState('');

  // States for different creation modals
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [showCreateTourDialog, setShowCreateTourDialog] = useState(false);
  const [showCreateBookingDialog, setShowCreateBookingDialog] = useState(false);
  const [showCreateFarmDialog, setShowCreateFarmDialog] = useState(false);
  const [showCreateRouteDialog, setShowCreateRouteDialog] = useState(false);
  const [showCreateQuoteDialog, setShowCreateQuoteDialog] = useState(false);
  const [showCreatePaymentDialog, setShowCreatePaymentDialog] = useState(false);

  // Sales section states
  const [salesSubSection, setSalesSubSection] = useState('cotizaciones');
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<any>(null);
  
  // Estado para almacenar reservas creadas
  const [createdBookings, setCreatedBookings] = useState<any[]>([]);

  // Form states for different creation types
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'client'
  });

  const [newTour, setNewTour] = useState({
    name: '',
    description: '',
    price: '',
    capacity: '',
    duration: '',
    difficulty: 'Fácil',
    image: ''
  });

  const [newBooking, setNewBooking] = useState({
    clientName: '',
    clientEmail: '',
    tourId: '',
    date: '',
    participants: '1',
    observations: '',
    hasAccommodation: false,
    paymentPercentage: '100',
    paymentReceipt: null as File | null,
    previewUrl: null as string | null
  });

  const [newFarm, setNewFarm] = useState({
    name: '',
    location: '',
    capacity: '',
    services: [],
    description: '',
    owner: '',
    image: ''
  });

  const [newRoute, setNewRoute] = useState({
    name: '',
    description: '',
    difficulty: 'Fácil',
    duration: '',
    points: '',
    assignedGuide: ''
  });

  const [newQuote, setNewQuote] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    serviceType: 'tour',
    serviceDetails: '',
    participants: '1',
    requestedDate: '',
    estimatedPrice: '',
    notes: '',
    priority: 'Media'
  });

  const [newPayment, setNewPayment] = useState({
    clientName: '',
    quoteId: '',
    amount: '',
    paymentMethod: 'efectivo',
    concept: '',
    dueDate: '',
    status: 'pendiente'
  });

  // Enhanced stats with month-over-month comparisons - Mejorado según historia de usuario
  const currentMonth = {
    users: users.length,
    tours: 156,
    reservations: 423,
    revenue: 89.2
  };
  
  const previousMonth = {
    users: Math.floor(users.length * 0.88), // -12%
    tours: Math.floor(156 * 0.92), // -8%
    reservations: Math.floor(423 * 0.77), // -23%
    revenue: Math.floor(89.2 * 0.85) // -15%
  };

  const stats = [
    { 
      title: 'Total Usuarios', 
      value: currentMonth.users.toString(), 
      change: `+${currentMonth.users - previousMonth.users}`,
      changePercent: '+12%',
      previousValue: previousMonth.users.toString(),
      icon: Users, 
      color: 'text-blue-600',
      trend: 'up'
    },
    { 
      title: 'Tours Activos', 
      value: currentMonth.tours.toString(), 
      change: `+${currentMonth.tours - previousMonth.tours}`,
      changePercent: '+8%',
      previousValue: previousMonth.tours.toString(),
      icon: Package, 
      color: 'text-green-600',
      trend: 'up'
    },
    { 
      title: 'Reservas Mes', 
      value: currentMonth.reservations.toString(), 
      change: `+${currentMonth.reservations - previousMonth.reservations}`,
      changePercent: '+23%',
      previousValue: previousMonth.reservations.toString(),
      icon: TrendingUp, 
      color: 'text-purple-600',
      trend: 'up'
    },
    { 
      title: 'Ingresos Mes', 
      value: `${currentMonth.revenue}M`, 
      change: `+${(currentMonth.revenue - previousMonth.revenue).toFixed(1)}M`,
      changePercent: '+15%',
      previousValue: `${previousMonth.revenue}M`,
      icon: CreditCard, 
      color: 'text-orange-600',
      trend: 'up'
    }
  ];

  const mockUsers = [
    { id: 1, name: 'Ana García', email: 'ana@email.com', role: 'Asesor', status: 'Activo', joinDate: '2024-01-15' },
    { id: 2, name: 'Carlos Ruiz', email: 'carlos@email.com', role: 'Guía', status: 'Activo', joinDate: '2024-02-03' },
    { id: 3, name: 'María López', email: 'maria@email.com', role: 'Asesor', status: 'Inactivo', joinDate: '2024-01-28' },
    { id: 4, name: 'José Martín', email: 'jose@email.com', role: 'Guía', status: 'Activo', joinDate: '2024-03-10' }
  ];

  const mockTours = [
    { 
      id: 1, 
      name: 'Caminata Sierra Nevada', 
      price: '150000', 
      capacity: 12, 
      booked: 8, 
      status: 'Activo',
      image: 'https://images.unsplash.com/photo-1538422314488-83e8e11d298c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWtpbmclMjB0cmFpbCUyMGZvcmVzdHxlbnwxfHx8fDE3NTY5NjQ4NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    { 
      id: 2, 
      name: 'Tour Cafetero', 
      price: '120000', 
      capacity: 15, 
      booked: 15, 
      status: 'Completo',
      image: 'https://images.unsplash.com/photo-1750967613671-297f1b63038d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBwbGFudGF0aW9uJTIwY29sb21iaWF8ZW58MXx8fHwxNzU2OTQ5OTA4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    { 
      id: 3, 
      name: 'Avistamiento de Aves', 
      price: '95000', 
      capacity: 8, 
      booked: 3, 
      status: 'Disponible',
      image: 'https://images.unsplash.com/photo-1635148040718-acf281233b8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMG5hdHVyZXxlbnwxfHx8fDE3NTY5NDQxMTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    }
  ];

  // Mock data for roles and permissions
  const mockRoles = [
    { 
      id: 1, 
      name: 'Administrador', 
      description: 'Acceso total al sistema', 
      usersCount: 2,
      permissions: {
        users: { view: true, create: true, edit: true, delete: true },
        tours: { view: true, create: true, edit: true, delete: true },
        bookings: { view: true, create: true, edit: true, delete: true },
        analytics: { view: true, create: false, edit: false, delete: false },
        farms: { view: true, create: true, edit: true, delete: true },
        routes: { view: true, create: true, edit: true, delete: true },
        transport: { view: true, create: true, edit: true, delete: true },
        sales: { view: true, create: true, edit: true, delete: true },
        employees: { view: true, create: true, edit: true, delete: true },
        roles: { view: true, create: true, edit: true, delete: true }
      }
    },
    { 
      id: 2, 
      name: 'Asesor', 
      description: 'Gestión de clientes y reservas', 
      usersCount: 3,
      permissions: {
        users: { view: true, create: false, edit: false, delete: false },
        tours: { view: true, create: false, edit: false, delete: false },
        bookings: { view: true, create: true, edit: true, delete: false },
        analytics: { view: true, create: false, edit: false, delete: false },
        farms: { view: true, create: false, edit: false, delete: false },
        routes: { view: true, create: false, edit: false, delete: false },
        transport: { view: true, create: false, edit: false, delete: false },
        sales: { view: true, create: true, edit: true, delete: false },
        roles: { view: false, create: false, edit: false, delete: false }
      }
    },
    { 
      id: 3, 
      name: 'Guía Turístico', 
      description: 'Gestión de tours y rutas asignadas', 
      usersCount: 5,
      permissions: {
        users: { view: false, create: false, edit: false, delete: false },
        tours: { view: true, create: false, edit: true, delete: false },
        bookings: { view: true, create: false, edit: true, delete: false },
        analytics: { view: false, create: false, edit: false, delete: false },
        farms: { view: true, create: false, edit: false, delete: false },
        routes: { view: true, create: false, edit: true, delete: false },
        transport: { view: true, create: false, edit: false, delete: false },
        sales: { view: false, create: false, edit: false, delete: false },
        roles: { view: false, create: false, edit: false, delete: false }
      }
    },
    { 
      id: 4, 
      name: 'Cliente', 
      description: 'Acceso a tours y reservas propias', 
      usersCount: 28,
      permissions: {
        users: { view: false, create: false, edit: false, delete: false },
        tours: { view: true, create: false, edit: false, delete: false },
        bookings: { view: true, create: true, edit: false, delete: false },
        analytics: { view: false, create: false, edit: false, delete: false },
        farms: { view: true, create: false, edit: false, delete: false },
        routes: { view: true, create: false, edit: false, delete: false },
        transport: { view: false, create: false, edit: false, delete: false },
        sales: { view: true, create: false, edit: false, delete: false },
        roles: { view: false, create: false, edit: false, delete: false }
      }
    }
  ];

  const availablePermissions = [
    { key: 'users', label: 'Usuarios', description: 'Gestión de usuarios del sistema' },
    { key: 'tours', label: 'Tours', description: 'Gestión de tours y paquetes' },
    { key: 'bookings', label: 'Reservas', description: 'Gestión de reservas y ventas' },
    { key: 'analytics', label: 'Medición', description: 'Acceso a reportes y estadísticas' },
    { key: 'farms', label: 'Fincas', description: 'Gestión de fincas y propiedades' },
    { key: 'routes', label: 'Rutas', description: 'Gestión de rutas turísticas' },
    { key: 'sales', label: 'Ventas', description: 'Gestión de cotizaciones y abonos' },
    { key: 'roles', label: 'Roles', description: 'Gestión de roles y permisos' }
  ];

  // Mock data for sales
  const mockQuotes = [
    { 
      id: 1, 
      clientName: 'Patricia Mendoza', 
      clientEmail: 'patricia@email.com',
      clientPhone: '+57 300 123 4567',
      serviceType: 'tour', 
      serviceDetails: 'Caminata Sierra Nevada - Grupo familiar',
      participants: 4, 
      requestedDate: '2024-09-20',
      estimatedPrice: 600000,
      status: 'Pendiente',
      priority: 'Alta',
      createdDate: '2024-09-12',
      notes: 'Cliente prefiere horarios matutinos'
    },
    { 
      id: 2, 
      clientName: 'Roberto Silva', 
      clientEmail: 'roberto@email.com',
      clientPhone: '+57 301 234 5678',
      serviceType: 'finca', 
      serviceDetails: 'Estadía en Finca La Esperanza - Fin de semana',
      participants: 6, 
      requestedDate: '2024-09-25',
      estimatedPrice: 950000,
      status: 'Aprobada',
      priority: 'Media',
      createdDate: '2024-09-10',
      notes: 'Requiere transporte desde Medellín'
    },
    { 
      id: 3, 
      clientName: 'Sandra Vargas', 
      clientEmail: 'sandra@email.com',
      clientPhone: '+57 302 345 6789',
      serviceType: 'paquete', 
      serviceDetails: 'Paquete completo 3 días - Tours múltiples',
      participants: 2, 
      requestedDate: '2024-10-05',
      estimatedPrice: 1200000,
      status: 'En Revisión',
      priority: 'Alta',
      createdDate: '2024-09-11',
      notes: 'Celebración de aniversario'
    }
  ];

  const mockPayments = [
    {
      id: 1,
      clientName: 'Roberto Silva',
      quoteId: 2,
      amount: 475000,
      paymentMethod: 'transferencia',
      concept: 'Abono 50% - Estadía Finca La Esperanza',
      dueDate: '2024-09-18',
      status: 'pagado',
      paymentDate: '2024-09-17',
      reference: 'TRF-001234'
    },
    {
      id: 2,
      clientName: 'Patricia Mendoza',
      quoteId: 1,
      amount: 200000,
      paymentMethod: 'efectivo',
      concept: 'Abono inicial - Caminata Sierra Nevada',
      dueDate: '2024-09-15',
      status: 'pendiente',
      paymentDate: null,
      reference: null
    },
    {
      id: 3,
      clientName: 'Sandra Vargas',
      quoteId: 3,
      amount: 400000,
      paymentMethod: 'tarjeta',
      concept: 'Abono 33% - Paquete 3 días',
      dueDate: '2024-09-20',
      status: 'vencido',
      paymentDate: null,
      reference: null
    }
  ];

  const mockSales = [
    {
      id: 1,
      clientName: 'Roberto Silva',
      clientEmail: 'roberto@email.com',
      serviceAcquired: 'Estadía en Finca La Esperanza - 2 días',
      saleDate: '2024-09-17',
      totalAmount: 950000,
      paidAmount: 475000,
      pendingAmount: 475000,
      status: 'Pagando',
      paymentHistory: [
        { date: '2024-09-17', amount: 475000, method: 'transferencia', reference: 'TRF-001234' }
      ]
    },
    {
      id: 2,
      clientName: 'Laura Hernández',
      clientEmail: 'laura@email.com',
      serviceAcquired: 'Tour Completo Sierra Nevada - 3 días',
      saleDate: '2024-09-10',
      totalAmount: 1350000,
      paidAmount: 1350000,
      pendingAmount: 0,
      status: 'Pagado',
      paymentHistory: [
        { date: '2024-09-10', amount: 675000, method: 'tarjeta', reference: 'TDC-005678' },
        { date: '2024-09-12', amount: 675000, method: 'transferencia', reference: 'TRF-005679' }
      ]
    },
    {
      id: 3,
      clientName: 'Carlos Mejía',
      clientEmail: 'carlos@email.com',
      serviceAcquired: 'Caminata Ecológica + Hospedaje',
      saleDate: '2024-09-05',
      totalAmount: 800000,
      paidAmount: 320000,
      pendingAmount: 480000,
      status: 'Vencido',
      paymentHistory: [
        { date: '2024-09-05', amount: 320000, method: 'efectivo', reference: 'EFE-001' }
      ]
    },
    {
      id: 4,
      clientName: 'Ana Torres',
      clientEmail: 'ana@email.com',
      serviceAcquired: 'Tour Cafetero Premium - Grupo familiar',
      saleDate: '2024-09-15',
      totalAmount: 1200000,
      paidAmount: 600000,
      pendingAmount: 600000,
      status: 'Pagando',
      paymentHistory: [
        { date: '2024-09-15', amount: 300000, method: 'tarjeta', reference: 'TDC-007890' },
        { date: '2024-09-16', amount: 300000, method: 'efectivo', reference: 'EFE-002' }
      ]
    }
  ];

  // Initialize roles and users state
  useEffect(() => {
    // Load roles from localStorage, fallback to mock data
    const savedRoles = localStorage.getItem('occitours_roles');
    
    if (savedRoles) {
      try {
        setRoles(JSON.parse(savedRoles));
      } catch {
        setRoles(mockRoles);
      }
    } else {
      setRoles(mockRoles);
    }
  }, []);
  
  // Load users from auth system whenever the tab becomes active or component loads
  useEffect(() => {
    const loadUsers = () => {
      const authUsers = getAllUsers().map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role === 'admin' ? 'Administrador' : 
              user.role === 'advisor' ? 'Asesor' : 
              user.role === 'guide' ? 'Guía Turístico' : 'Cliente',
        status: user.status || 'Activo',
        joinDate: user.joinDate || new Date().toISOString().split('T')[0]
      }));
      
      setUsers(authUsers);
    };
    
    loadUsers();
    
    // Also load users when the roles tab becomes active
    if (activeTab === 'roles' || activeTab === 'users') {
      loadUsers();
    }
  }, [getAllUsers, activeTab]);
  
  // Update role user counts when users change
  useEffect(() => {
    if (users.length > 0 && roles.length > 0) {
      const updatedRoles = roles.map(role => {
        const userCount = users.filter(user => user.role === role.name).length;
        return { ...role, usersCount: userCount };
      });
      setRoles(updatedRoles);
    }
  }, [users]); // Solo depende de users para evitar loops infinitos

  // Save to localStorage whenever roles or users change
  useEffect(() => {
    if (roles.length > 0) {
      localStorage.setItem('occitours_roles', JSON.stringify(roles));
    }
  }, [roles]);

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('occitours_users', JSON.stringify(users));
    }
  }, [users]);

  // Functions for role management
  const handleCreateRole = () => {
    if (!newRole.name.trim()) return;
    
    const roleId = Date.now();
    const roleToAdd = {
      id: roleId,
      name: newRole.name,
      description: newRole.description,
      usersCount: 0,
      permissions: newRole.permissions
    };
    
    setRoles(prevRoles => [...prevRoles, roleToAdd]);
    setNewRole({ name: '', description: '', permissions: {} });
    setShowRoleDialog(false);
    toast.success(`Rol "${roleToAdd.name}" creado exitosamente`);
  };

  const handleEditRole = (role) => {
    setEditingRole({
      ...role,
      permissions: { ...role.permissions }
    });
    setShowEditRoleDialog(true);
  };

  const handleUpdateRole = () => {
    if (!editingRole?.name.trim()) return;
    
    setRoles(prevRoles => 
      prevRoles.map(role => 
        role.id === editingRole.id ? editingRole : role
      )
    );
    toast.success(`Rol "${editingRole.name}" actualizado exitosamente`);
    setEditingRole(null);
    setShowEditRoleDialog(false);
  };

  const handleDeleteRole = (role) => {
    setRoleToDelete(role);
    setShowDeleteConfirmDialog(true);
  };

  const confirmDeleteRole = () => {
    if (roleToDelete) {
      setRoles(prevRoles => prevRoles.filter(role => role.id !== roleToDelete.id));
      toast.success(`Rol "${roleToDelete.name}" eliminado exitosamente`);
      setRoleToDelete(null);
      setShowDeleteConfirmDialog(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedAssignUser || !selectedAssignRole) return;
    
    const selectedUserData = users.find(u => u.id.toString() === selectedAssignUser);
    const selectedRoleData = roles.find(r => r.id.toString() === selectedAssignRole);
    
    // Map display role names to auth system role keys
    const roleMapping = {
      'Administrador': 'admin',
      'Asesor': 'advisor',
      'Guía Turístico': 'guide',
      'Cliente': 'client'
    };
    
    const newAuthRole = roleMapping[selectedRoleData?.name];
    
    if (!newAuthRole || !selectedUserData) {
      toast.error('Error: Datos de usuario o rol no válidos');
      return;
    }
    
    try {
      // Update user role in the authentication system
      const authResult = await updateUserRole(selectedUserData.email, newAuthRole);
      
      if (!authResult.success) {
        toast.error(authResult.error || 'Error al asignar el rol en el sistema');
        return;
      }
      
      // Update local state only if auth update was successful
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id.toString() === selectedAssignUser 
            ? { ...user, role: selectedRoleData?.name || user.role }
            : user
        )
      );
      
      // Update role user count
      setRoles(prevRoles => 
        prevRoles.map(role => {
          if (role.id.toString() === selectedAssignRole) {
            return { ...role, usersCount: role.usersCount + 1 };
          }
          // Decrease count from previous role if needed
          if (role.name === selectedUserData?.role) {
            return { ...role, usersCount: Math.max(0, role.usersCount - 1) };
          }
          return role;
        })
      );
      
      toast.success(`Rol "${selectedRoleData?.name}" asignado a ${selectedUserData?.name} exitosamente`);
      
    } catch (error) {
      console.error('Error assigning user role:', error);
      toast.error('Error del servidor al asignar el rol');
    }
    
    setSelectedAssignUser('');
    setSelectedAssignRole('');
    setShowAssignRoleDialog(false);
  };

  const handleChangeUserRole = (user) => {
    setChangeRoleUser(user);
    setNewUserRole('');
    setShowChangeRoleDialog(true);
  };

  const handleConfirmRoleChange = async () => {
    if (!changeRoleUser || !newUserRole) return;
    
    const newRoleData = roles.find(r => r.id.toString() === newUserRole);
    const oldRoleName = changeRoleUser.role;
    
    // Map display role names to auth system role keys
    const roleMapping = {
      'Administrador': 'admin',
      'Asesor': 'advisor',
      'Guía Turístico': 'guide',
      'Cliente': 'client'
    };
    
    const newAuthRole = roleMapping[newRoleData?.name];
    
    if (!newAuthRole) {
      toast.error('Error: Rol no válido');
      return;
    }
    
    try {
      // Update user role in the authentication system
      const authResult = await updateUserRole(changeRoleUser.email, newAuthRole);
      
      if (!authResult.success) {
        toast.error(authResult.error || 'Error al actualizar el rol en el sistema');
        return;
      }
      
      // Update local state only if auth update was successful
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === changeRoleUser.id 
            ? { ...user, role: newRoleData?.name || user.role }
            : user
        )
      );
      
      // Update role user counts
      setRoles(prevRoles => 
        prevRoles.map(role => {
          if (role.id.toString() === newUserRole) {
            return { ...role, usersCount: role.usersCount + 1 };
          }
          if (role.name === oldRoleName) {
            return { ...role, usersCount: Math.max(0, role.usersCount - 1) };
          }
          return role;
        })
      );
      
      toast.success(`Rol de ${changeRoleUser.name} cambiado a "${newRoleData?.name}" exitosamente`);
      
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Error del servidor al actualizar el rol');
    }
    
    setChangeRoleUser(null);
    setNewUserRole('');
    setShowChangeRoleDialog(false);
  };

  const handleShowPermissions = (role) => {
    setSelectedRole(role);
    setShowPermissionsDialog(true);
  };

  // Create functions for different content types
  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      // Here you would integrate with your actual user creation system
      const response = await register(newUser.name, newUser.email, newUser.password, newUser.role);
      
      if (!response.success) {
        toast.error(response.error || 'Error al crear el usuario');
        return;
      }
      toast.success(`Usuario "${newUser.name}" creado exitosamente`);
      setNewUser({ name: '', email: '', phone: '', password: '', role: 'client' });
      setShowCreateUserDialog(false);
    } catch (error) {
      toast.error('Error al crear el usuario');
    }
  };

  const handleCreateTour = () => {
    if (!newTour.name.trim() || !newTour.price.trim()) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    console.log('Creating tour:', newTour);
    toast.success(`Tour "${newTour.name}" creado exitosamente`);
    setNewTour({
      name: '',
      description: '',
      price: '',
      capacity: '',
      duration: '',
      difficulty: 'Fácil',
      image: ''
    });
    setShowCreateTourDialog(false);
  };

  const handleCreateBooking = () => {
    if (!newBooking.clientName.trim() || !newBooking.tourId || !newBooking.date) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    if (!newBooking.paymentReceipt) {
      toast.error('Por favor sube el comprobante de pago');
      return;
    }

    // Obtener el nombre del tour seleccionado
    const selectedTour = mockTours.find(t => t.id === parseInt(newBooking.tourId));
    const tourName = selectedTour ? selectedTour.name : 'Tour desconocido';
    const tourPrice = selectedTour ? parseFloat(selectedTour.price) : 0;
    
    // Calcular montos según el tipo de servicio
    const totalAmount = tourPrice * parseInt(newBooking.participants);
    const paidAmount = newBooking.hasAccommodation ? totalAmount * 0.5 : totalAmount;
    const remainingAmount = totalAmount - paidAmount;

    // Crear nueva reserva
    const newBookingData = {
      id: Date.now(),
      name: tourName,
      type: 'tour',
      date: newBooking.date,
      participants: parseInt(newBooking.participants),
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      remainingAmount: remainingAmount,
      status: 'confirmed',
      paymentStatus: newBooking.hasAccommodation ? 'partial' : 'completed',
      hasAccommodation: newBooking.hasAccommodation,
      paymentReceipt: newBooking.previewUrl, // Guardar la URL del preview
      remainingPaymentReceipt: null,
      specialRequests: newBooking.observations || 'Ninguna',
      cancellationDeadline: newBooking.date,
      location: 'Ubicación del servicio',
      clientName: newBooking.clientName,
      clientEmail: newBooking.clientEmail || 'No especificado',
      clientPhone: 'No especificado',
      createdBy: 'Administrador',
      createdAt: new Date().toISOString()
    };

    // Agregar a la lista de reservas creadas
    setCreatedBookings(prev => [newBookingData, ...prev]);

    console.log('Creating booking:', newBookingData);
    toast.success(`Reserva para "${newBooking.clientName}" creada exitosamente`, {
      description: newBooking.hasAccommodation 
        ? 'Comprobante del 50% registrado. Pendiente 50% restante.' 
        : 'Pago completo del 100% registrado.'
    });
    
    setNewBooking({
      clientName: '',
      clientEmail: '',
      tourId: '',
      date: '',
      participants: '1',
      observations: '',
      hasAccommodation: false,
      paymentPercentage: '100',
      paymentReceipt: null,
      previewUrl: null
    });
    setShowCreateBookingDialog(false);
  };

  const handleBookingReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo no debe superar los 5MB');
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewBooking(prev => ({
          ...prev,
          paymentReceipt: file,
          previewUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
      
      toast.success('Comprobante cargado correctamente');
    }
  };

  const handleRemoveBookingReceipt = () => {
    setNewBooking(prev => ({
      ...prev,
      paymentReceipt: null,
      previewUrl: null
    }));
  };

  const handleViewSaleDetails = (saleId: string) => {
    const sale = mockSales.find(s => s.id === saleId);
    if (sale) {
      // Convert sale data to booking format
      const bookingData = {
        id: sale.id,
        name: sale.serviceAcquired,
        type: 'tour',
        date: sale.saleDate,
        participants: 1,
        totalAmount: sale.totalAmount,
        paidAmount: sale.paidAmount,
        remainingAmount: sale.pendingAmount,
        status: sale.status === 'Pagado' ? 'confirmed' : 'pending',
        paymentStatus: sale.status === 'Pagado' ? 'completed' : sale.status === 'Pagando' ? 'partial' : 'pending',
        hasAccommodation: false,
        paymentReceipt: 'https://example.com/receipt.jpg',
        remainingPaymentReceipt: null,
        specialRequests: 'Ninguna',
        cancellationDeadline: sale.saleDate,
        location: 'Ubicación del servicio',
        clientName: sale.clientName,
        clientEmail: sale.clientEmail
      };
      setSelectedBookingForDetails(bookingData);
      setShowBookingDetails(true);
    }
  };

  const handleCreateFarm = () => {
    if (!newFarm.name.trim() || !newFarm.location.trim()) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    console.log('Creating farm:', newFarm);
    toast.success(`Finca "${newFarm.name}" creada exitosamente`);
    setNewFarm({
      name: '',
      location: '',
      capacity: '',
      services: [],
      description: '',
      owner: '',
      image: ''
    });
    setShowCreateFarmDialog(false);
  };

  const handleCreateRoute = () => {
    if (!newRoute.name.trim() || !newRoute.duration.trim()) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    console.log('Creating route:', newRoute);
    toast.success(`Ruta "${newRoute.name}" creada exitosamente`);
    setNewRoute({
      name: '',
      description: '',
      difficulty: 'Fácil',
      duration: '',
      points: '',
      assignedGuide: ''
    });
    setShowCreateRouteDialog(false);
  };

  const handleCreateQuote = () => {
    if (!newQuote.clientName.trim() || !newQuote.serviceDetails.trim()) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    console.log('Creating quote:', newQuote);
    toast.success(`Cotizaci��n para "${newQuote.clientName}" creada exitosamente`);
    setNewQuote({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      serviceType: 'tour',
      serviceDetails: '',
      participants: '1',
      requestedDate: '',
      estimatedPrice: '',
      notes: '',
      priority: 'Media'
    });
    setShowCreateQuoteDialog(false);
  };

  const handleCreatePayment = () => {
    if (!newPayment.clientName.trim() || !newPayment.amount.trim()) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    console.log('Creating payment:', newPayment);
    toast.success(`Abono de "${newPayment.clientName}" registrado exitosamente`);
    setNewPayment({
      clientName: '',
      quoteId: '',
      amount: '',
      paymentMethod: 'efectivo',
      concept: '',
      dueDate: '',
      status: 'pendiente'
    });
    setShowCreatePaymentDialog(false);
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case 'Aprobada':
        return 'bg-green-100 text-green-800';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'En Revisión':
        return 'bg-blue-100 text-blue-800';
      case 'Rechazada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pagado':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'vencido':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return 'bg-red-100 text-red-800';
      case 'Media':
        return 'bg-yellow-100 text-yellow-800';
      case 'Baja':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePermissionChange = (permissionKey, action, checked, isEditing = false) => {
    const targetRole = isEditing ? editingRole : newRole;
    const setter = isEditing ? setEditingRole : setNewRole;
    
    setter(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionKey]: {
          ...prev.permissions[permissionKey],
          [action]: checked
        }
      }
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activo':
        return 'bg-green-100 text-green-800';
      case 'Inactivo':
        return 'bg-red-100 text-red-800';
      case 'Completo':
        return 'bg-blue-100 text-blue-800';
      case 'Disponible':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter roles based on search
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(rolesFilter.toLowerCase()) ||
    role.description.toLowerCase().includes(rolesFilter.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel Administrativo</h1>
          <p className="text-muted-foreground">Gestiona usuarios, tours y visualiza métricas de la plataforma</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Crear Nuevo
        </Button>
      </div>

      {/* Enhanced Stats Cards with Month-over-Month Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center">
                      {stat.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                      ) : (
                        <TrendingUp className="w-3 h-3 text-red-600 mr-1 rotate-180" />
                      )}
                      <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.changePercent}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">vs mes anterior</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Anterior: {stat.previousValue} ({stat.change} unidades)
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Access to Main Sections - Mejorado según historia de usuario */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Button 
          variant="outline" 
          className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-blue-50 hover:border-blue-200"
          onClick={() => setActiveTab('users')}
        >
          <Users className="w-8 h-8 text-blue-600" />
          <span className="text-sm font-medium">Usuarios</span>
          <span className="text-xs text-muted-foreground">{users.length} registrados</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-green-50 hover:border-green-200"
          onClick={() => setActiveTab('tours')}
        >
          <Package className="w-8 h-8 text-green-600" />
          <span className="text-sm font-medium">Tours</span>
          <span className="text-xs text-muted-foreground">156 activos</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-purple-50 hover:border-purple-200"
          onClick={() => setActiveTab('bookings')}
        >
          <Calendar className="w-8 h-8 text-purple-600" />
          <span className="text-sm font-medium">Reservas</span>
          <span className="text-xs text-muted-foreground">423 este mes</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-orange-50 hover:border-orange-200"
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 className="w-8 h-8 text-orange-600" />
          <span className="text-sm font-medium">Ingresos</span>
          <span className="text-xs text-muted-foreground">$89.2M este mes</span>
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Buscar usuarios..." className="pl-10 w-64" />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowCreateUserDialog(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Agregar Usuario
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.joinDate}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
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

        <TabsContent value="tours" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Buscar tours..." className="pl-10 w-64" />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowCreateTourDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Tour
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTours.map((tour) => (
              <Card key={tour.id} className="hover:shadow-lg transition-shadow">
                <div className="relative">
                  <ImageWithFallback
                    src={tour.image}
                    alt={tour.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Badge 
                    variant="secondary" 
                    className={`absolute top-3 right-3 ${getStatusColor(tour.status)}`}
                  >
                    {tour.status}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{tour.name}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Precio:</span>
                      <span className="font-semibold text-green-600">
                        ${parseInt(tour.price).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Reservas:</span>
                        <span>{tour.booked}/{tour.capacity}</span>
                      </div>
                      <Progress value={(tour.booked / tour.capacity) * 100} className="h-2" />
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
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
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowCreateBookingDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Reserva
            </Button>
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
                    <TableHead>Tour</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Participantes</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado Pago</TableHead>
                    <TableHead>Estado</TableHead>
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
                            <AvatarFallback>{booking.clientName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div>{booking.clientName}</div>
                            <div className="text-xs text-muted-foreground">{booking.clientEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{booking.name}</div>
                          {booking.hasAccommodation && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Con alojamiento
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{booking.date}</TableCell>
                      <TableCell>{booking.participants}</TableCell>
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
                        <Badge variant="secondary" className={
                          booking.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                          booking.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {booking.paymentStatus === 'completed' ? 'Pagado 100%' :
                           booking.paymentStatus === 'partial' ? 'Pagado 50%' :
                           'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Confirmada
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
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Reservas de ejemplo existentes */}
                  {[
                    { id: 1, client: 'Ana Martínez', tour: 'Caminata Sierra Nevada', date: '2024-09-16', participants: 2, total: '$300,000', status: 'Confirmada', paymentStatus: 'completed' },
                    { id: 2, client: 'Carlos López', tour: 'Tour Cafetero', date: '2024-09-18', participants: 4, total: '$480,000', status: 'Pendiente', paymentStatus: 'pending' },
                    { id: 3, client: 'María García', tour: 'Avistamiento de Aves', date: '2024-09-20', participants: 1, total: '$95,000', status: 'Cancelada', paymentStatus: 'completed' }
                  ].map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>{booking.client.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <span>{booking.client}</span>
                        </div>
                      </TableCell>
                      <TableCell>{booking.tour}</TableCell>
                      <TableCell>{booking.date}</TableCell>
                      <TableCell>{booking.participants}</TableCell>
                      <TableCell className="font-semibold text-green-600">{booking.total}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          booking.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {booking.paymentStatus === 'completed' ? 'Pagado 100%' : 'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          booking.status === 'Confirmada' ? 'bg-green-100 text-green-800' :
                          booking.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <XCircle className="w-4 h-4" />
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

        <TabsContent value="analytics" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Dashboard de Medición</h2>
            <Button className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Exportar Reporte
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Satisfacción Promedio', value: '4.7', change: '⭐⭐⭐⭐⭐', icon: Star, color: 'text-yellow-600' },
              { title: 'Tours Completados', value: '89', change: 'Este mes', icon: CheckCircle, color: 'text-green-600' },
              { title: 'Tasa de Ocupación', value: '78%', change: '+5% vs mes anterior', icon: TrendingUp, color: 'text-blue-600' },
              { title: 'Ingresos Totales', value: '$45.2M', change: '+12% vs mes anterior', icon: CreditCard, color: 'text-purple-600' }
            ].map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                    </div>
                    <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Satisfacción</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { tour: 'Caminata Sierra Nevada', rating: 4.9, reviews: 124 },
                    { tour: 'Tour Cafetero', rating: 4.8, reviews: 89 },
                    { tour: 'Avistamiento de Aves', rating: 4.6, reviews: 67 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.tour}</p>
                        <p className="text-sm text-muted-foreground">{item.reviews} reseñas</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < Math.floor(item.rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="font-semibold">{item.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reportes Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { title: 'Reporte Mensual Septiembre', date: '2024-09-01', type: 'Mensual' },
                    { title: 'Análisis de Satisfacción Q3', date: '2024-08-30', type: 'Trimestral' },
                    { title: 'Reporte de Ocupación Agosto', date: '2024-08-31', type: 'Mensual' }
                  ].map((report, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{report.title}</p>
                          <p className="text-sm text-muted-foreground">{report.date} - {report.type}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="farms" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Buscar fincas..." className="pl-10 w-64" />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowCreateFarmDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Finca
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                id: 1, 
                name: 'Finca La Esperanza', 
                location: 'Santa Fe de Antioquia', 
                capacity: 50, 
                services: ['Alojamiento', 'Restaurante', 'Actividades'],
                status: 'Activa',
                image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydXJhbCUyMGZhcm0lMjBjb2xvbWJpYXxlbnwxfHx8fDE3NTY5NDQxMTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
              },
              { 
                id: 2, 
                name: 'Hacienda El Refugio', 
                location: 'Sopetrán', 
                capacity: 30, 
                services: ['Camping', 'Senderismo', 'Observación'],
                status: 'Activa',
                image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VudHJ5c2lkZSUyMGhvdXNlfGVufDF8fHx8MTc1Njk0NDExMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
              },
              { 
                id: 3, 
                name: 'Finca Verde Valle', 
                location: 'San Jerónimo', 
                capacity: 25, 
                services: ['Ecoturismo', 'Agricultura', 'Talleres'],
                status: 'Mantenimiento',
                image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMGZhcm18ZW58MXx8fHwxNzU2OTQ0MTEwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
              }
            ].map((farm) => (
              <Card key={farm.id} className="hover:shadow-lg transition-shadow">
                <div className="relative">
                  <ImageWithFallback
                    src={farm.image}
                    alt={farm.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Badge 
                    variant="secondary" 
                    className={`absolute top-3 right-3 ${
                      farm.status === 'Activa' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {farm.status}
                  </Badge>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{farm.name}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>{farm.location}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>Capacidad: {farm.capacity} personas</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {farm.services.map((service, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="routes" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Buscar rutas..." className="pl-10 w-64" />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowCreateRouteDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Ruta
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gestión de Rutas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ruta</TableHead>
                    <TableHead>Dificultad</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Guía Asignado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { id: 1, name: 'Sendero Sierra Nevada', difficulty: 'Moderado', duration: '8 horas', guide: 'Carlos Ruiz', status: 'Activa' },
                    { id: 2, name: 'Camino del Café', difficulty: 'Fácil', duration: '6 horas', guide: 'Ana García', status: 'Activa' },
                    { id: 3, name: 'Ruta de las Aves', difficulty: 'Fácil', duration: '5 horas', guide: 'Miguel Ángel', status: 'Mantenimiento' }
                  ].map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">{route.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          route.difficulty === 'Fácil' ? 'bg-green-100 text-green-800' :
                          route.difficulty === 'Moderado' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {route.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>{route.duration}</TableCell>
                      <TableCell>{route.guide}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          route.status === 'Activa' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }>
                          {route.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
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

        <TabsContent value="sales" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gestión de Ventas</h2>
            <div className="flex space-x-2">
              <Button 
                variant={salesSubSection === 'cotizaciones' ? 'default' : 'outline'}
                onClick={() => setSalesSubSection('cotizaciones')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Cotizaciones
              </Button>
              <Button 
                variant={salesSubSection === 'ventas' ? 'default' : 'outline'}
                onClick={() => setSalesSubSection('ventas')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Ventas
              </Button>
              <Button 
                variant={salesSubSection === 'abonos' ? 'default' : 'outline'}
                onClick={() => setSalesSubSection('abonos')}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Abonos
              </Button>
            </div>
          </div>

          {/* Sales Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cotizaciones Activas</p>
                    <p className="text-2xl font-bold mt-1">{mockQuotes.filter(q => q.status !== 'Rechazada').length}</p>
                    <p className="text-sm text-green-600 mt-1">+2 esta semana</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ventas Cerradas</p>
                    <p className="text-2xl font-bold mt-1">
                      ${mockSales.reduce((sum, sale) => sum + sale.totalAmount, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600 mt-1">Este mes</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Abonos Pendientes</p>
                    <p className="text-2xl font-bold mt-1">
                      ${mockSales.reduce((sum, sale) => sum + sale.pendingAmount, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-yellow-600 mt-1">{mockSales.filter(s => s.pendingAmount > 0).length} clientes</p>
                  </div>
                  <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tasa de Conversión</p>
                    <p className="text-2xl font-bold mt-1">
                      {Math.round((mockSales.length / mockQuotes.length) * 100)}%
                    </p>
                    <p className="text-sm text-green-600 mt-1">+5% vs mes anterior</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {salesSubSection === 'cotizaciones' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Buscar cotizaciones..." className="pl-10 w-64" />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrar
                  </Button>
                </div>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setShowCreateQuoteDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Cotización
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Cotizaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Fecha Solicitada</TableHead>
                        <TableHead>Participantes</TableHead>
                        <TableHead>Valor Estimado</TableHead>
                        <TableHead>Prioridad</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockQuotes.map((quote) => (
                        <TableRow key={quote.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{quote.clientName}</p>
                              <p className="text-sm text-muted-foreground">{quote.clientEmail}</p>
                              <p className="text-xs text-muted-foreground">{quote.clientPhone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{quote.serviceDetails}</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {quote.serviceType}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{quote.requestedDate}</TableCell>
                          <TableCell>{quote.participants}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ${quote.estimatedPrice.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getPriorityColor(quote.priority)}>
                              {quote.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getQuoteStatusColor(quote.status)}>
                              {quote.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {salesSubSection === 'ventas' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Buscar ventas..." className="pl-10 w-64" />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrar
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Ventas Confirmadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Servicio Adquirido</TableHead>
                        <TableHead>Fecha de Venta</TableHead>
                        <TableHead>Monto Total</TableHead>
                        <TableHead>Abonos Realizados</TableHead>
                        <TableHead>Saldo Pendiente</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sale.clientName}</p>
                              <p className="text-sm text-muted-foreground">{sale.clientEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sale.serviceAcquired}</p>
                            </div>
                          </TableCell>
                          <TableCell>{sale.saleDate}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ${sale.totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-blue-600">
                                ${sale.paidAmount.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {sale.paymentHistory.length} pagos
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`font-semibold ${sale.pendingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                              ${sale.pendingAmount.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={
                                sale.status === 'Pagado' ? 'bg-green-100 text-green-800' :
                                sale.status === 'Pagando' ? 'bg-blue-100 text-blue-800' :
                                sale.status === 'Vencido' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {sale.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewSaleDetails(sale.id.toString())}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {salesSubSection === 'abonos' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Buscar abonos..." className="pl-10 w-64" />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrar
                  </Button>
                </div>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setShowCreatePaymentDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Abono
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Abonos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha de Abono</TableHead>
                        <TableHead>Monto Abonado</TableHead>
                        <TableHead>Saldo Restante</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockSales.flatMap(sale => 
                        sale.paymentHistory.map((payment, index) => ({
                          id: `${sale.id}-${index}`,
                          clientName: sale.clientName,
                          paymentDate: payment.date,
                          amountPaid: payment.amount,
                          remainingBalance: sale.pendingAmount,
                          status: sale.status,
                          paymentMethod: payment.method,
                          saleId: sale.id
                        }))
                      ).concat(
                        mockSales.filter(sale => sale.pendingAmount > 0).map(sale => ({
                          id: `pending-${sale.id}`,
                          clientName: sale.clientName,
                          paymentDate: 'Pendiente',
                          amountPaid: 0,
                          remainingBalance: sale.pendingAmount,
                          status: sale.status,
                          paymentMethod: '',
                          saleId: sale.id
                        }))
                      ).map((abono) => (
                        <TableRow key={abono.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{abono.clientName}</p>
                              <p className="text-xs text-muted-foreground">Venta #{abono.saleId}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={abono.paymentDate === 'Pendiente' ? 'text-orange-600 font-medium' : ''}>
                              {abono.paymentDate}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`font-semibold ${abono.amountPaid > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                              {abono.amountPaid > 0 ? `${abono.amountPaid.toLocaleString()}` : 'Sin abono'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`font-semibold ${abono.remainingBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                              ${abono.remainingBalance.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={
                                abono.status === 'Pagado' ? 'bg-green-100 text-green-800' :
                                abono.status === 'Pagando' ? 'bg-blue-100 text-blue-800' :
                                abono.status === 'Vencido' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {abono.paymentDate === 'Pendiente' ? 'Pendiente' : abono.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              {abono.paymentDate === 'Pendiente' ? (
                                <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                                  <Plus className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="sm">
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Buscar roles..." 
                  className="pl-10 w-64" 
                  value={rolesFilter}
                  onChange={(e) => setRolesFilter(e.target.value)}
                />
              </div>
              <Button 
                variant="outline"
                onClick={() => setRolesFilter('')}
                disabled={!rolesFilter}
              >
                <Filter className="w-4 h-4 mr-2" />
                {rolesFilter ? 'Limpiar' : 'Filtrar'}
              </Button>
            </div>
            <div className="flex space-x-2">
              <Dialog open={showAssignRoleDialog} onOpenChange={setShowAssignRoleDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Asignar Rol
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Asignar Rol a Usuario</DialogTitle>
                    <DialogDescription>
                      Selecciona un usuario y asígnale un rol específico del sistema.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="select-user">Seleccionar Usuario</Label>
                      <Select value={selectedAssignUser} onValueChange={setSelectedAssignUser}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un usuario" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name} - {user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="select-role">Seleccionar Rol</Label>
                      <Select value={selectedAssignRole} onValueChange={setSelectedAssignRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowAssignRoleDialog(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handleAssignRole}
                        disabled={!selectedAssignUser || !selectedAssignRole}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Asignar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Rol
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Rol</DialogTitle>
                    <DialogDescription>
                      Define un nuevo rol del sistema y configura sus permisos de acceso a los diferentes módulos.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="role-name">Nombre del Rol</Label>
                        <Input 
                          id="role-name" 
                          placeholder="Ej: Supervisor de Tours" 
                          className="mt-1"
                          value={newRole.name}
                          onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="role-description">Descripción</Label>
                        <Input 
                          id="role-description" 
                          placeholder="Descripción breve del rol" 
                          className="mt-1"
                          value={newRole.description}
                          onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-4">Permisos del Rol</h4>
                      <div className="space-y-4">
                        {availablePermissions.map((permission) => (
                          <div key={permission.key} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h5 className="font-medium">{permission.label}</h5>
                                <p className="text-sm text-muted-foreground">{permission.description}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                              {['view', 'create', 'edit', 'delete'].map((action) => (
                                <div key={action} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`${permission.key}-${action}`}
                                    checked={newRole.permissions[permission.key]?.[action] || false}
                                    onCheckedChange={(checked) => handlePermissionChange(permission.key, action, checked)}
                                  />
                                  <Label 
                                    htmlFor={`${permission.key}-${action}`}
                                    className="text-sm capitalize"
                                  >
                                    {action === 'view' ? 'Ver' : 
                                     action === 'create' ? 'Crear' :
                                     action === 'edit' ? 'Editar' : 'Eliminar'}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handleCreateRole}
                        disabled={!newRole.name.trim()}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Crear Rol
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Role Dialog */}
              <Dialog open={showEditRoleDialog} onOpenChange={setShowEditRoleDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Editar Rol</DialogTitle>
                    <DialogDescription>
                      Modifica la información del rol y actualiza sus permisos de acceso.
                    </DialogDescription>
                  </DialogHeader>
                  {editingRole && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit-role-name">Nombre del Rol</Label>
                          <Input 
                            id="edit-role-name" 
                            placeholder="Ej: Supervisor de Tours" 
                            className="mt-1"
                            value={editingRole.name}
                            onChange={(e) => setEditingRole(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-role-description">Descripción</Label>
                          <Input 
                            id="edit-role-description" 
                            placeholder="Descripción breve del rol" 
                            className="mt-1"
                            value={editingRole.description}
                            onChange={(e) => setEditingRole(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-4">Permisos del Rol</h4>
                        <div className="space-y-4">
                          {availablePermissions.map((permission) => (
                            <div key={permission.key} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h5 className="font-medium">{permission.label}</h5>
                                  <p className="text-sm text-muted-foreground">{permission.description}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-4">
                                {['view', 'create', 'edit', 'delete'].map((action) => (
                                  <div key={action} className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={`edit-${permission.key}-${action}`}
                                      checked={editingRole.permissions[permission.key]?.[action] || false}
                                      onCheckedChange={(checked) => handlePermissionChange(permission.key, action, checked, true)}
                                    />
                                    <Label 
                                      htmlFor={`edit-${permission.key}-${action}`}
                                      className="text-sm capitalize"
                                    >
                                      {action === 'view' ? 'Ver' : 
                                       action === 'create' ? 'Crear' :
                                       action === 'edit' ? 'Editar' : 'Eliminar'}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowEditRoleDialog(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={handleUpdateRole}
                          disabled={!editingRole.name.trim()}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Actualizar Rol
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Permissions View Dialog */}
              <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Permisos del Rol: {selectedRole?.name}</DialogTitle>
                    <DialogDescription>
                      Vista detallada de todos los permisos asignados a este rol.
                    </DialogDescription>
                  </DialogHeader>
                  {selectedRole && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Nombre del Rol</Label>
                          <p className="text-sm bg-gray-50 p-2 rounded">{selectedRole.name}</p>
                        </div>
                        <div>
                          <Label>Descripción</Label>
                          <p className="text-sm bg-gray-50 p-2 rounded">{selectedRole.description}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-4">Permisos Detallados</h4>
                        <div className="space-y-4">
                          {availablePermissions.map((permission) => (
                            <div key={permission.key} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h5 className="font-medium">{permission.label}</h5>
                                  <p className="text-sm text-muted-foreground">{permission.description}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-4">
                                {['view', 'create', 'edit', 'delete'].map((action) => (
                                  <div key={action} className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                      selectedRole.permissions[permission.key]?.[action] 
                                        ? 'bg-green-500' 
                                        : 'bg-gray-300'
                                    }`} />
                                    <span className={`text-sm ${
                                      selectedRole.permissions[permission.key]?.[action] 
                                        ? 'text-green-700 font-medium' 
                                        : 'text-gray-500'
                                    }`}>
                                      {action === 'view' ? 'Ver' : 
                                       action === 'create' ? 'Crear' :
                                       action === 'edit' ? 'Editar' : 'Eliminar'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
                          Cerrar
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Change User Role Dialog */}
              <Dialog open={showChangeRoleDialog} onOpenChange={setShowChangeRoleDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
                    <DialogDescription>
                      Selecciona el nuevo rol para {changeRoleUser?.name}.
                    </DialogDescription>
                  </DialogHeader>
                  {changeRoleUser && (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3 mb-2">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>{changeRoleUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{changeRoleUser.name}</p>
                            <p className="text-sm text-muted-foreground">{changeRoleUser.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">Rol actual:</span>
                          <Badge variant="secondary" className={
                            changeRoleUser.role === 'Asesor' ? 'bg-blue-100 text-blue-800' :
                            changeRoleUser.role === 'Guía Turístico' ? 'bg-green-100 text-green-800' :
                            changeRoleUser.role === 'Cliente' ? 'bg-purple-100 text-purple-800' :
                            changeRoleUser.role === 'Administrador' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {changeRoleUser.role}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="new-role">Nuevo Rol</Label>
                        <Select value={newUserRole} onValueChange={setNewUserRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un nuevo rol" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.filter(role => role.name !== changeRoleUser.role).map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                <div className="flex flex-col">
                                  <span>{role.name}</span>
                                  <span className="text-xs text-muted-foreground">{role.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowChangeRoleDialog(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={handleConfirmRoleChange}
                          disabled={!newUserRole}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Cambiar Rol
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Roles List */}
            <Card>
              <CardHeader>
                <CardTitle>Roles del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRoles.length === 0 ? (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg text-gray-600 mb-2">No se encontraron roles</h3>
                      <p className="text-gray-500">
                        {rolesFilter 
                          ? `No hay roles que coincidan con "${rolesFilter}"`
                          : 'No hay roles configurados en el sistema'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredRoles.map((role) => (
                      <div key={role.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <Shield className="w-5 h-5 text-blue-600" />
                            <div>
                              <h4 className="font-medium">{role.name}</h4>
                              <p className="text-sm text-muted-foreground">{role.description}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{role.usersCount} usuarios</Badge>
                        </div>
                        
                        <div className="flex justify-end space-x-2 mt-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleShowPermissions(role)}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Permisos
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditRole(role)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente el rol "{role.name}" 
                                  y se removerán todos los permisos asociados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDeleteRole(role)}
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Users and Roles Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Usuarios y Roles Asignados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol Actual</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={
                            user.role === 'Asesor' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'Guía Turístico' ? 'bg-green-100 text-green-800' :
                            user.role === 'Cliente' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'Administrador' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleChangeUserRole(user)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Cambiar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Permissions Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Permisos por Rol</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Módulo</TableHead>
                      {filteredRoles.map((role) => (
                        <TableHead key={role.id} className="text-center">{role.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availablePermissions.map((permission) => (
                      <TableRow key={permission.key}>
                        <TableCell className="font-medium">{permission.label}</TableCell>
                        {filteredRoles.map((role) => (
                          <TableCell key={role.id} className="text-center">
                            <div className="flex justify-center space-x-1 flex-wrap">
                              {role.permissions[permission.key]?.view && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Ver</Badge>
                              )}
                              {role.permissions[permission.key]?.create && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">Crear</Badge>
                              )}
                              {role.permissions[permission.key]?.edit && (
                                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">Editar</Badge>
                              )}
                              {role.permissions[permission.key]?.delete && (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700">Eliminar</Badge>
                              )}
                              {!Object.values(role.permissions[permission.key] || {}).some(v => v) && (
                                <span className="text-muted-foreground text-xs">Sin acceso</span>
                              )}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Agrega un nuevo usuario al sistema con la información básica.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-name">Nombre Completo *</Label>
              <Input
                id="user-name"
                placeholder="Ej: Juan Pérez"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="user-email">Correo Electrónico *</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="Ej: juan@email.com"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="user-phone">Teléfono</Label>
              <Input
                id="user-phone"
                placeholder="Ej: +57 300 123 4567"
                value={newUser.phone}
                onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="user-password">Contraseña *</Label>
              <Input
                id="user-password"
                type="password"
                placeholder="Ingresa la contraseña"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="user-role">Rol Inicial</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="guide">Guía Turístico</SelectItem>
                  <SelectItem value="advisor">Asesor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateUserDialog(false)}>
                Cancelar
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleCreateUser}>
                <Save className="w-4 h-4 mr-2" />
                Crear Usuario
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Tour Dialog */}
      <Dialog open={showCreateTourDialog} onOpenChange={setShowCreateTourDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Tour</DialogTitle>
            <DialogDescription>
              Crea un nuevo tour o paquete turístico con toda la información necesaria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tour-name">Nombre del Tour *</Label>
                <Input
                  id="tour-name"
                  placeholder="Ej: Caminata Sierra Nevada"
                  value={newTour.name}
                  onChange={(e) => setNewTour(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="tour-price">Precio (COP) *</Label>
                <Input
                  id="tour-price"
                  type="number"
                  placeholder="150000"
                  value={newTour.price}
                  onChange={(e) => setNewTour(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="tour-capacity">Capacidad Máxima</Label>
                <Input
                  id="tour-capacity"
                  type="number"
                  placeholder="12"
                  value={newTour.capacity}
                  onChange={(e) => setNewTour(prev => ({ ...prev, capacity: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="tour-duration">Duración</Label>
                <Input
                  id="tour-duration"
                  placeholder="8 horas"
                  value={newTour.duration}
                  onChange={(e) => setNewTour(prev => ({ ...prev, duration: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tour-difficulty">Dificultad</Label>
              <Select value={newTour.difficulty} onValueChange={(value) => setNewTour(prev => ({ ...prev, difficulty: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fácil">Fácil</SelectItem>
                  <SelectItem value="Moderado">Moderado</SelectItem>
                  <SelectItem value="Difícil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tour-description">Descripción</Label>
              <Textarea
                id="tour-description"
                placeholder="Describe el tour, actividades incluidas, puntos de interés..."
                value={newTour.description}
                onChange={(e) => setNewTour(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="tour-image">URL de Imagen</Label>
              <Input
                id="tour-image"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={newTour.image}
                onChange={(e) => setNewTour(prev => ({ ...prev, image: e.target.value }))}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateTourDialog(false)}>
                Cancelar
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleCreateTour}>
                <Save className="w-4 h-4 mr-2" />
                Crear Tour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Booking Dialog */}
      <Dialog open={showCreateBookingDialog} onOpenChange={setShowCreateBookingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nueva Reserva</DialogTitle>
            <DialogDescription>
              Registra una nueva reserva para un cliente en el sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="booking-client-name">Nombre del Cliente *</Label>
                <Input
                  id="booking-client-name"
                  placeholder="Ej: María González"
                  value={newBooking.clientName}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, clientName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="booking-client-email">Email del Cliente</Label>
                <Input
                  id="booking-client-email"
                  type="email"
                  placeholder="maria@email.com"
                  value={newBooking.clientEmail}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, clientEmail: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="booking-tour">Tour Seleccionado *</Label>
              <Select value={newBooking.tourId} onValueChange={(value) => setNewBooking(prev => ({ ...prev, tourId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tour" />
                </SelectTrigger>
                <SelectContent>
                  {mockTours.map((tour) => (
                    <SelectItem key={tour.id} value={tour.id.toString()}>
                      {tour.name} - ${parseInt(tour.price).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="booking-date">Fecha del Tour *</Label>
                <Input
                  id="booking-date"
                  type="date"
                  value={newBooking.date}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="booking-participants">Número de Participantes</Label>
                <Input
                  id="booking-participants"
                  type="number"
                  min="1"
                  value={newBooking.participants}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, participants: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="booking-observations">Observaciones</Label>
              <Textarea
                id="booking-observations"
                placeholder="Notas especiales, requerimientos alimentarios, etc."
                value={newBooking.observations}
                onChange={(e) => setNewBooking(prev => ({ ...prev, observations: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Alojamiento Section */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <Checkbox
                  id="has-accommodation"
                  checked={newBooking.hasAccommodation}
                  onCheckedChange={(checked) => {
                    setNewBooking(prev => ({
                      ...prev,
                      hasAccommodation: checked as boolean,
                      paymentPercentage: checked ? '50' : '100'
                    }));
                  }}
                />
                <div className="flex-1">
                  <Label htmlFor="has-accommodation" className="cursor-pointer font-medium">
                    ¿El servicio incluye alojamiento?
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {newBooking.hasAccommodation 
                      ? 'Se requiere abono del 50% al crear la reserva' 
                      : 'Se requiere pago completo del 100%'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-green-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Información de Pago
              </h4>

              <div className="bg-white border border-green-300 rounded p-3">
                <p className="text-sm font-medium text-green-900">
                  {newBooking.hasAccommodation 
                    ? '💰 Monto a pagar: 50% (Abono inicial)' 
                    : '💰 Monto a pagar: 100% (Pago completo)'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {newBooking.hasAccommodation 
                    ? 'El 50% restante se pagará posteriormente' 
                    : 'El servicio no incluye alojamiento, pago total requerido'}
                </p>
              </div>

              <div>
                <Label htmlFor="payment-receipt">
                  Comprobante de Pago {newBooking.hasAccommodation ? '(50%)' : '(100%)'} *
                </Label>
                <Input
                  id="payment-receipt"
                  type="file"
                  accept="image/*"
                  onChange={handleBookingReceiptChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos aceptados: JPG, PNG. Tamaño máximo: 5MB
                </p>
              </div>

              {newBooking.previewUrl && (
                <div className="bg-white rounded-lg p-3 border-2 border-green-300">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-green-900">Vista Previa del Comprobante:</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveBookingReceipt}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <img
                    src={newBooking.previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-contain rounded-lg border"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Archivo:</strong> {newBooking.paymentReceipt?.name}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateBookingDialog(false)}>
                Cancelar
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleCreateBooking}>
                <Save className="w-4 h-4 mr-2" />
                Crear Reserva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Farm Dialog */}
      <Dialog open={showCreateFarmDialog} onOpenChange={setShowCreateFarmDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nueva Finca</DialogTitle>
            <DialogDescription>
              Registra una nueva finca o propiedad rural para actividades turísticas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="farm-name">Nombre de la Finca *</Label>
                <Input
                  id="farm-name"
                  placeholder="Ej: Finca La Esperanza"
                  value={newFarm.name}
                  onChange={(e) => setNewFarm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="farm-location">Ubicación *</Label>
                <Input
                  id="farm-location"
                  placeholder="Ej: Santa Fe de Antioquia"
                  value={newFarm.location}
                  onChange={(e) => setNewFarm(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="farm-capacity">Capacidad (personas)</Label>
                <Input
                  id="farm-capacity"
                  type="number"
                  placeholder="50"
                  value={newFarm.capacity}
                  onChange={(e) => setNewFarm(prev => ({ ...prev, capacity: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="farm-owner">Propietario</Label>
                <Input
                  id="farm-owner"
                  placeholder="Nombre del propietario"
                  value={newFarm.owner}
                  onChange={(e) => setNewFarm(prev => ({ ...prev, owner: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Servicios Disponibles</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {['Alojamiento', 'Restaurante', 'Actividades', 'Camping', 'Senderismo', 'Observación', 'Ecoturismo', 'Agricultura', 'Talleres'].map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={`farm-service-${service}`}
                      checked={newFarm.services.includes(service)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewFarm(prev => ({ ...prev, services: [...prev.services, service] }));
                        } else {
                          setNewFarm(prev => ({ ...prev, services: prev.services.filter(s => s !== service) }));
                        }
                      }}
                    />
                    <Label htmlFor={`farm-service-${service}`} className="text-sm">{service}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="farm-description">Descripción</Label>
              <Textarea
                id="farm-description"
                placeholder="Describe la finca, sus características, instalaciones disponibles..."
                value={newFarm.description}
                onChange={(e) => setNewFarm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="farm-image">URL de Imagen</Label>
              <Input
                id="farm-image"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={newFarm.image}
                onChange={(e) => setNewFarm(prev => ({ ...prev, image: e.target.value }))}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateFarmDialog(false)}>
                Cancelar
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleCreateFarm}>
                <Save className="w-4 h-4 mr-2" />
                Crear Finca
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Route Dialog */}
      <Dialog open={showCreateRouteDialog} onOpenChange={setShowCreateRouteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nueva Ruta</DialogTitle>
            <DialogDescription>
              Define una nueva ruta turística con sus características y puntos de interés.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="route-name">Nombre de la Ruta *</Label>
              <Input
                id="route-name"
                placeholder="Ej: Sendero Sierra Nevada"
                value={newRoute.name}
                onChange={(e) => setNewRoute(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="route-difficulty">Dificultad</Label>
                <Select value={newRoute.difficulty} onValueChange={(value) => setNewRoute(prev => ({ ...prev, difficulty: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fácil">Fácil</SelectItem>
                    <SelectItem value="Moderado">Moderado</SelectItem>
                    <SelectItem value="Difícil">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="route-duration">Duración *</Label>
                <Input
                  id="route-duration"
                  placeholder="8 horas"
                  value={newRoute.duration}
                  onChange={(e) => setNewRoute(prev => ({ ...prev, duration: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="route-guide">Guía Asignado</Label>
              <Select value={newRoute.assignedGuide} onValueChange={(value) => setNewRoute(prev => ({ ...prev, assignedGuide: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un guía" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(user => user.role === 'Guía Turístico').map((guide) => (
                    <SelectItem key={guide.id} value={guide.name}>
                      {guide.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="route-description">Descripción</Label>
              <Textarea
                id="route-description"
                placeholder="Describe la ruta, tipo de terreno, paisajes..."
                value={newRoute.description}
                onChange={(e) => setNewRoute(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="route-points">Puntos de Interés</Label>
              <Textarea
                id="route-points"
                placeholder="Lista los principales puntos de interés de la ruta..."
                value={newRoute.points}
                onChange={(e) => setNewRoute(prev => ({ ...prev, points: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateRouteDialog(false)}>
                Cancelar
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleCreateRoute}>
                <Save className="w-4 h-4 mr-2" />
                Crear Ruta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Quote Dialog */}
      <Dialog open={showCreateQuoteDialog} onOpenChange={setShowCreateQuoteDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nueva Cotización</DialogTitle>
            <DialogDescription>
              Registra una nueva solicitud de cotización para un cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quote-client-name">Nombre del Cliente *</Label>
                <Input
                  id="quote-client-name"
                  placeholder="Ej: Patricia Mendoza"
                  value={newQuote.clientName}
                  onChange={(e) => setNewQuote(prev => ({ ...prev, clientName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="quote-client-email">Email del Cliente</Label>
                <Input
                  id="quote-client-email"
                  type="email"
                  placeholder="patricia@email.com"
                  value={newQuote.clientEmail}
                  onChange={(e) => setNewQuote(prev => ({ ...prev, clientEmail: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quote-client-phone">Teléfono</Label>
                <Input
                  id="quote-client-phone"
                  placeholder="+57 300 123 4567"
                  value={newQuote.clientPhone}
                  onChange={(e) => setNewQuote(prev => ({ ...prev, clientPhone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="quote-service-type">Tipo de Servicio</Label>
                <Select value={newQuote.serviceType} onValueChange={(value) => setNewQuote(prev => ({ ...prev, serviceType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tour">Tour</SelectItem>
                    <SelectItem value="finca">Finca</SelectItem>
                    <SelectItem value="servicio">Servicio Turístico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="quote-service-details">Detalles del Servicio *</Label>
              <Textarea
                id="quote-service-details"
                placeholder="Describe el servicio solicitado, actividades específicas, duración..."
                value={newQuote.serviceDetails}
                onChange={(e) => setNewQuote(prev => ({ ...prev, serviceDetails: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quote-participants">Participantes</Label>
                <Input
                  id="quote-participants"
                  type="number"
                  min="1"
                  value={newQuote.participants}
                  onChange={(e) => setNewQuote(prev => ({ ...prev, participants: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="quote-requested-date">Fecha Solicitada</Label>
                <Input
                  id="quote-requested-date"
                  type="date"
                  value={newQuote.requestedDate}
                  onChange={(e) => setNewQuote(prev => ({ ...prev, requestedDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="quote-priority">Prioridad</Label>
                <Select value={newQuote.priority} onValueChange={(value) => setNewQuote(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baja">Baja</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="quote-estimated-price">Precio Estimado (COP)</Label>
              <Input
                id="quote-estimated-price"
                type="number"
                placeholder="600000"
                value={newQuote.estimatedPrice}
                onChange={(e) => setNewQuote(prev => ({ ...prev, estimatedPrice: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="quote-notes">Notas Adicionales</Label>
              <Textarea
                id="quote-notes"
                placeholder="Observaciones especiales, preferencias del cliente, etc."
                value={newQuote.notes}
                onChange={(e) => setNewQuote(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateQuoteDialog(false)}>
                Cancelar
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleCreateQuote}>
                <Save className="w-4 h-4 mr-2" />
                Crear Cotización
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Payment Dialog */}
      <Dialog open={showCreatePaymentDialog} onOpenChange={setShowCreatePaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Abono</DialogTitle>
            <DialogDescription>
              Registra un abono o pago parcial de un cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment-client-name">Nombre del Cliente *</Label>
                <Input
                  id="payment-client-name"
                  placeholder="Ej: Roberto Silva"
                  value={newPayment.clientName}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, clientName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="payment-quote">Cotización Relacionada</Label>
                <Select value={newPayment.quoteId} onValueChange={(value) => setNewPayment(prev => ({ ...prev, quoteId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una cotización" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockQuotes.map((quote) => (
                      <SelectItem key={quote.id} value={quote.id.toString()}>
                        {quote.clientName} - {quote.serviceDetails.substring(0, 30)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment-amount">Monto (COP) *</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  placeholder="200000"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="payment-method">Método de Pago</Label>
                <Select value={newPayment.paymentMethod} onValueChange={(value) => setNewPayment(prev => ({ ...prev, paymentMethod: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="payment-concept">Concepto del Pago</Label>
              <Input
                id="payment-concept"
                placeholder="Ej: Abono 50% - Estadía Finca La Esperanza"
                value={newPayment.concept}
                onChange={(e) => setNewPayment(prev => ({ ...prev, concept: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment-due-date">Fecha de Vencimiento</Label>
                <Input
                  id="payment-due-date"
                  type="date"
                  value={newPayment.dueDate}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="payment-status">Estado</Label>
                <Select value={newPayment.status} onValueChange={(value) => setNewPayment(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="pagado">Pagado</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreatePaymentDialog(false)}>
                Cancelar
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleCreatePayment}>
                <Save className="w-4 h-4 mr-2" />
                Registrar Abono
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBookingForDetails && (
        <BookingDetailsModal
          isOpen={showBookingDetails}
          onClose={() => {
            setShowBookingDetails(false);
            setSelectedBookingForDetails(null);
          }}
          booking={selectedBookingForDetails}
        />
      )}
    </div>
  );
}