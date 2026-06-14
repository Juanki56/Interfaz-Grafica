import React, { useState } from 'react';
import {
  Mountain, User, LogOut, Bell, Calendar, Menu, X, LayoutDashboard, MapPin,
  BarChart3, TrendingUp, Users, UserCheck, TreePine, Route, Settings,
  CreditCard, DollarSign, Building2, Tag, Shield, ChevronDown, ChevronRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { usePermissionsContext } from '../context/PermissionsContext';
import { NotificationPanel } from './NotificationPanel';

export function Navigation() {
  const { user, logout, setCurrentView, setAdminActiveTab } = useAuth();
  const { canPerformAction } = usePermissionsContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Management modules for admin role grouped by category
  type ModuleCategory = {
    id: string;
    label: string;
    modules: any[];
  };

  const adminCategories: ModuleCategory[] = [
    {
      id: 'principal',
      label: 'Principal',
      modules: [
        { id: 'dashboard', label: 'Dashboard Avanzado', icon: TrendingUp, permissionId: 'dashboard' },
      ]
    },
    {
      id: 'users',
      label: 'Usuarios y Roles',
      modules: [
        { id: 'users', label: 'Usuarios', icon: Users, permissionId: 'usuarios' },
        { id: 'clients', label: 'Clientes', icon: User, permissionId: 'clientes' },
        { id: 'owners', label: 'Propietarios', icon: UserCheck, permissionId: 'propietarios' },
        { id: 'employees', label: 'Empleados', icon: Shield, permissionId: 'empleados' },
        { id: 'roles', label: 'Roles', icon: UserCheck, permissionId: 'roles' }
      ]
    },
    {
      id: 'catalog',
      label: 'Catálogo y Operativa',
      modules: [
        { id: 'bookings', label: 'Reservas', icon: Calendar, permissionId: 'reservas' },
        { id: 'farms', label: 'Fincas', icon: TreePine, permissionId: 'fincas' },
        { id: 'routes', label: 'Rutas', icon: Route, permissionId: 'rutas' },
        { id: 'services', label: 'Servicios', icon: Settings, permissionId: 'servicios' },
      ]
    },
    {
      id: 'finance',
      label: 'Ventas y Finanzas',
      modules: [
        { id: 'sales', label: 'Ventas', icon: CreditCard, permissionId: 'ventas' },
        { id: 'installments', label: 'Abonos', icon: DollarSign, permissionId: 'abonos' },
        { id: 'payments', label: 'Pagos', icon: DollarSign, permissionId: 'pagos' },
        { id: 'providers', label: 'Proveedores', icon: Building2, permissionId: 'proveedores' },
        { id: 'provider-types', label: 'Tipos de Proveedor', icon: Tag, permissionId: 'tipos_proveedor' },
      ]
    }
  ];

  const advisorCategories: ModuleCategory[] = [
    {
      id: 'principal',
      label: 'Principal',
      modules: [
        { id: 'reservations', label: 'Gestión de Reservas', icon: Calendar },
        { id: 'clients', label: 'Clientes', icon: Users },
        { id: 'management', label: 'Gestión de Estados', icon: Settings },
      ]
    }
  ];

  const clientCategories: ModuleCategory[] = [
    {
      id: 'catalog',
      label: 'Operativa',
      modules: [
        { id: 'bookings', label: 'Reservas', icon: Calendar },
        { id: 'programming', label: 'Programaciones', icon: Route },
      ]
    },
    {
      id: 'finance',
      label: 'Finanzas',
      modules: [
        { id: 'sales', label: 'Ventas', icon: DollarSign },
        { id: 'payments', label: 'Abonos', icon: CreditCard }
      ]
    }
  ];

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    principal: true,
    users: false,
    catalog: false,
    finance: false
  });

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleModuleClick = (moduleId: string) => {
    setAdminActiveTab(moduleId);
    setCurrentView('dashboard');
    setIsMobileSidebarOpen(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'advisor':
        return 'bg-blue-100 text-blue-800';
      case 'guide':
        return 'bg-green-100 text-green-800';
      case 'client':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'advisor':
        return 'Asesor';
      case 'guide':
        return 'Guía turístico';
      case 'client':
        return 'Cliente';
      default:
        return role;
    }
  };

  const renderCategories = (categories: ModuleCategory[], isMobile: boolean = false) => {
    // Filter categories and modules based on permissions
    const filteredCategories = categories.map(category => {
      return {
        ...category,
        modules: category.modules.filter(module => {
          // If the user is client or guide, they don't use permissionId in this logic
          if (user?.role === 'client' || user?.role === 'guide') return true;
          // Check read permission for the module using its permissionId
          return module.permissionId ? canPerformAction(`${module.permissionId}.leer`) : true;
        })
      };
    }).filter(category => category.modules.length > 0);

    if (filteredCategories.length === 0) return null;

    return (
      <div className="mt-2 space-y-2 pb-2">
        <div className="pt-2 pb-1 border-t border-green-100">
          <p className="text-xs text-green-600 px-3 font-semibold uppercase tracking-wider">Módulos de Gestión</p>
        </div>
        {filteredCategories.map((category) => (
          <div key={category.id} className="space-y-1">
            <Button
              variant="ghost"
              onClick={() => toggleCategory(category.id)}
              className="w-full justify-between h-9 px-3 text-gray-600 hover:text-green-700 hover:bg-green-50/50"
            >
              <span className="text-xs font-semibold uppercase tracking-wider">{category.label}</span>
              {openCategories[category.id] ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </Button>
            {openCategories[category.id] && (
              <div className="space-y-1 pl-4 ml-1 border-l border-green-100">
                {category.modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <Button
                      key={module.id}
                      variant="ghost"
                      className="w-full justify-start space-x-3 h-9 text-left hover:bg-green-50 hover:text-green-700 transition-colors"
                      onClick={() => handleModuleClick(module.id)}
                    >
                      <Icon className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{module.label}</span>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-green-100 shadow-sm">
        <div className="flex items-center justify-between h-16 px-4">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setCurrentView('home')}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white shadow-sm border border-green-100">
              <img src="/logo.jpg" alt="Occitours Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-green-800">Occitours</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-64 lg:bg-white/95 lg:backdrop-blur-sm lg:border-r lg:border-green-100 lg:shadow-sm lg:z-40">
        {/* Logo Section */}
        <div
          className="flex items-center space-x-3 p-4 cursor-pointer border-b border-green-100 bg-green-50/20"
          onClick={() => setCurrentView('home')}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white shadow-sm border border-green-100 shrink-0">
            <img src="/logo.jpg" alt="Occitours Logo" className="w-full h-full object-cover" />
          </div>
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="text-xl font-bold text-green-800">Occitours</h1>
            <p className="text-xs text-green-600">Turismo de Naturaleza</p>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-green-100">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-green-100 text-green-700">
                {user?.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <Badge variant="secondary" className={`text-xs mt-1 ${getRoleColor(user?.role || '')}`}>
                {getRoleName(user?.role || '')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation Actions - with overflow */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 h-10 text-left"
            onClick={() => setCurrentView('profile')}
          >
            <User className="w-5 h-5" />
            <span>Mi Perfil</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 h-10 text-left"
            onClick={() => setCurrentView('programming')}
          >
            <Calendar className="w-5 h-5" />
            <span>{user?.role === 'guide' ? 'Mis programaciones' : 'Programación'}</span>
          </Button>



          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-transparent px-3">
            {user?.role === 'admin' && renderCategories(adminCategories)}
            {user?.role === 'advisor' && renderCategories(adminCategories)}
            {user?.role === 'client' && renderCategories(clientCategories)}
            {user?.role === 'guide' && renderCategories(clientCategories)}
          </div>
        </div>

        {/* Logout Section */}
        <div className="p-4 border-t border-green-100">
          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 h-10 text-left text-red-600 hover:text-red-600 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            {/* Mobile Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-green-100">
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => {
                  setCurrentView('home');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white shadow-sm border border-green-100">
                  <img src="/logo.jpg" alt="Occitours Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-green-800">Occitours</h1>
                  <p className="text-xs text-green-600">Turismo de Naturaleza</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Mobile User Profile */}
            <div className="p-4 border-b border-green-100">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-green-100 text-green-700 text-lg">
                    {user?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <Badge variant="secondary" className={`text-xs mt-1 ${getRoleColor(user?.role || '')}`}>
                    {getRoleName(user?.role || '')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 p-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start space-x-3 h-12 text-left"
                onClick={() => {
                  setCurrentView('profile');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <User className="w-5 h-5" />
                <span>Mi Perfil</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start space-x-3 h-12 text-left"
                onClick={() => {
                  setCurrentView('programming');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <Calendar className="w-5 h-5" />
                <span>{user?.role === 'guide' ? 'Mis programaciones' : 'Programación'}</span>
              </Button>



              <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-transparent mt-2 px-3">
                {user?.role === 'admin' && renderCategories(adminCategories, true)}
                {user?.role === 'advisor' && renderCategories(adminCategories, true)}
                {user?.role === 'client' && renderCategories(clientCategories, true)}
                {user?.role === 'guide' && renderCategories(clientCategories, true)}
              </div>

              <div className="pt-4 border-t border-green-100">
                <Button
                  variant="ghost"
                  className="w-full justify-start space-x-3 h-12 text-left text-red-600 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    logout();
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Cerrar Sesión</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        userRole={user?.role || 'client'}
      />
    </>
  );
}