import React, { useState } from 'react';
import { 
  Mountain, User, LogOut, Bell, Calendar, Menu, X, LayoutDashboard, MapPin,
  BarChart3, TrendingUp, Users, UserCheck, TreePine, Route, Settings,
  CreditCard, DollarSign, Building2, Tag, Shield
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
import { useAuth } from '../App';
import { NotificationPanel } from './NotificationPanel';

export function Navigation() {
  const { user, logout, setCurrentView, setAdminActiveTab } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Management modules for admin role
  const managementModules = [
    { id: 'dashboard', label: 'Dashboard Avanzado', icon: TrendingUp },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'clients', label: 'Clientes', icon: User },
    { id: 'owners', label: 'Propietarios', icon: UserCheck },
    { id: 'bookings', label: 'Reservas', icon: Calendar },
    { id: 'farms', label: 'Fincas', icon: TreePine },
    { id: 'routes', label: 'Rutas', icon: Route },
    { id: 'services', label: 'Servicios', icon: Settings },
    { id: 'sales', label: 'Ventas', icon: CreditCard },
    { id: 'installments', label: 'Abonos', icon: DollarSign },
    { id: 'payments', label: 'Pagos', icon: DollarSign },
    { id: 'providers', label: 'Proveedores', icon: Building2 },
    { id: 'provider-types', label: 'Tipos de Proveedor', icon: Tag },
    { id: 'employees', label: 'Empleados', icon: Shield },
    { id: 'roles', label: 'Roles', icon: UserCheck }
  ];

  // Management modules for advisor role
  const advisorManagementModules = [
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'bookings', label: 'Reservas', icon: Calendar },
    { id: 'farms', label: 'Fincas', icon: TreePine },
    { id: 'routes', label: 'Rutas', icon: Route },
    { id: 'services', label: 'Servicios', icon: Settings },
    { id: 'owners', label: 'Propietarios', icon: UserCheck },
    { id: 'sales', label: 'Ventas', icon: CreditCard },
    { id: 'installments', label: 'Abonos', icon: DollarSign },
    { id: 'providers', label: 'Proveedores', icon: Building2 },
    { id: 'provider-types', label: 'Tipos de Proveedor', icon: Tag },
    { id: 'employees', label: 'Empleados', icon: Shield }
  ];

  // Management modules for client role
  const clientManagementModules = [
    { id: 'bookings', label: 'Reservas', icon: Calendar },
    { id: 'sales', label: 'Ventas', icon: DollarSign },
    { id: 'payments', label: 'Abonos', icon: CreditCard }
  ];

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
        return 'Guía Turstico';
      case 'client':
        return 'Cliente';
      default:
        return role;
    }
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
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center">
              <Mountain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-green-800">Occitours</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative"
              onClick={() => setShowNotifications(true)}
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
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
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center">
            <Mountain className="w-6 h-6 text-white" />
          </div>
          <div>
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
            <span>Programación</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 h-10 text-left relative"
            onClick={() => setShowNotifications(true)}
          >
            <Bell className="w-5 h-5" />
            <span>Notificaciones</span>
            <span className="absolute right-3 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* Admin Management Modules */}
          {user?.role === 'admin' && (
            <>
              <div className="pt-3 pb-2 border-t border-green-100 mt-3">
                <p className="text-xs text-green-600 px-2 mb-1">MÓDULOS DE GESTIÓN</p>
              </div>
              <div className="space-y-1">
                {managementModules.map((module) => {
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
            </>
          )}

          {/* Advisor Management Modules */}
          {user?.role === 'advisor' && (
            <>
              <div className="pt-3 pb-2 border-t border-green-100 mt-3">
                <p className="text-xs text-green-600 px-2 mb-1">MÓDULOS DE GESTIÓN</p>
              </div>
              <div className="space-y-1">
                {advisorManagementModules.map((module) => {
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
            </>
          )}

          {/* Client Management Modules */}
          {user?.role === 'client' && (
            <>
              <div className="pt-3 pb-2 border-t border-green-100 mt-3">
                <p className="text-xs text-green-600 px-2 mb-1">MÓDULOS</p>
              </div>
              <div className="space-y-1">
                {clientManagementModules.map((module) => {
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
            </>
          )}
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
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                  <Mountain className="w-6 h-6 text-white" />
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
              {/* Remove Panel de Control button from mobile */}

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
                <span>Programación</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start space-x-3 h-12 text-left relative"
                onClick={() => {
                  setShowNotifications(true);
                  setIsMobileSidebarOpen(false);
                }}
              >
                <Bell className="w-5 h-5" />
                <span>Notificaciones</span>
                <span className="absolute right-3 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>

              {/* Admin Management Modules - Mobile */}
              {user?.role === 'admin' && (
                <>
                  <div className="pt-4 pb-2 border-t border-green-100 mt-4">
                    <p className="text-xs text-green-600 px-3 mb-2">MÓDULOS DE GESTIÓN</p>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2">
                    {managementModules.map((module) => {
                      const Icon = module.icon;
                      return (
                        <Button
                          key={module.id}
                          variant="ghost"
                          className="w-full justify-start space-x-3 h-10 text-left hover:bg-green-50 hover:text-green-700 transition-colors"
                          onClick={() => handleModuleClick(module.id)}
                        >
                          <Icon className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{module.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Advisor Management Modules - Mobile */}
              {user?.role === 'advisor' && (
                <>
                  <div className="pt-4 pb-2 border-t border-green-100 mt-4">
                    <p className="text-xs text-green-600 px-3 mb-2">MÓDULOS DE GESTIÓN</p>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2">
                    {advisorManagementModules.map((module) => {
                      const Icon = module.icon;
                      return (
                        <Button
                          key={module.id}
                          variant="ghost"
                          className="w-full justify-start space-x-3 h-10 text-left hover:bg-green-50 hover:text-green-700 transition-colors"
                          onClick={() => handleModuleClick(module.id)}
                        >
                          <Icon className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{module.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Client Management Modules - Mobile */}
              {user?.role === 'client' && (
                <>
                  <div className="pt-4 pb-2 border-t border-green-100 mt-4">
                    <p className="text-xs text-green-600 px-3 mb-2">MÓDULOS</p>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2">
                    {clientManagementModules.map((module) => {
                      const Icon = module.icon;
                      return (
                        <Button
                          key={module.id}
                          variant="ghost"
                          className="w-full justify-start space-x-3 h-10 text-left hover:bg-green-50 hover:text-green-700 transition-colors"
                          onClick={() => handleModuleClick(module.id)}
                        >
                          <Icon className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{module.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </>
              )}

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