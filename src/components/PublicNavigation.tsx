import React, { useState } from 'react';
import { Mountain, Menu, X, User, Users, MapPin, Home, Building, LogOut, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { useAuth } from '../context/AuthContext';

interface PublicNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogin: () => void;
}

export function PublicNavigation({ currentView, onViewChange, onLogin }: PublicNavigationProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const navigationItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'about', label: 'Quiénes Somos', icon: Users },
    { id: 'routes', label: 'Rutas', icon: MapPin },
    { id: 'farms', label: 'Fincas', icon: Building },
  ];

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
        return 'Admin';
      case 'advisor':
        return 'Asesor';
      case 'guide':
        return 'Guía';
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
        <div className="flex items-center justify-between h-20 px-4">
          <div 
            className="flex items-center cursor-pointer group"
            onClick={() => onViewChange('home')}
          >
            <div className="w-[60px] h-[60px] shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Occitours Logo" className="w-full h-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105" style={{ maxWidth: '60px', maxHeight: '60px' }} />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {user ? (
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Button
                onClick={onLogin}
                variant="outline"
                size="sm"
              >
                <User className="w-4 h-4" />
              </Button>
            )}
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
          className="flex flex-col items-center p-5 cursor-pointer border-b border-green-100 group"
          onClick={() => onViewChange('home')}
        >
          <div className="overflow-hidden" style={{ width: '120px', height: '120px' }}>
            <img src="/logo.png" alt="Occitours Logo" className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" style={{ maxWidth: '120px', maxHeight: '120px' }} />
          </div>
        </div>

        {/* User Profile Section (if logged in) */}
        {user && (
          <div className="p-6 border-b border-green-100">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-green-100 text-green-700 text-lg">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <Badge variant="secondary" className={`text-xs mt-1 ${getRoleColor(user.role)}`}>
                  {getRoleName(user.role)}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 p-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start space-x-3 h-12 text-left ${
                  currentView === item.id
                    ? 'bg-green-100 text-green-800 hover:bg-green-100'
                    : 'hover:bg-green-50'
                }`}
                onClick={() => onViewChange(item.id)}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </div>

        {/* User Actions / Login Section */}
        <div className="p-6 border-t border-green-100">
          {user ? (
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start space-x-3 h-12 text-left text-blue-700 hover:bg-blue-50"
                onClick={() => onViewChange('dashboard')}
              >
                <Settings className="w-5 h-5" />
                <span>Panel de Control</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start space-x-3 h-12 text-left"
                onClick={() => onViewChange('profile')}
              >
                <User className="w-5 h-5" />
                <span>Mi Perfil</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start space-x-3 h-12 text-left text-red-600 hover:text-red-600 hover:bg-red-50"
                onClick={logout}
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </Button>
            </div>
          ) : (
            <Button
              onClick={onLogin}
              variant="outline"
              className="w-full justify-start space-x-3 h-12 text-left border-green-200 text-green-700 hover:bg-green-50"
            >
              <User className="w-5 h-5" />
              <span>Iniciar Sesión</span>
            </Button>
          )}
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
                className="flex items-center cursor-pointer group"
                onClick={() => {
                  onViewChange('home');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className="w-[60px] h-[60px] shrink-0 overflow-hidden">
                  <img src="/logo.png" alt="Occitours Logo" className="w-full h-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105" style={{ maxWidth: '60px', maxHeight: '60px' }} />
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

            {/* Mobile User Profile (if logged in) */}
            {user && (
              <div className="p-4 border-b border-green-100">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-green-100 text-green-700 text-lg">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <Badge variant="secondary" className={`text-xs mt-1 ${getRoleColor(user.role)}`}>
                      {getRoleName(user.role)}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Navigation */}
            <div className="flex-1 p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`w-full justify-start space-x-3 h-12 text-left ${
                      currentView === item.id
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : 'hover:bg-green-50'
                    }`}
                    onClick={() => {
                      onViewChange(item.id);
                      setIsMobileSidebarOpen(false);
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
              
              {/* Mobile User Actions */}
              <div className="pt-4 border-t border-green-100 space-y-2">
                {user ? (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-start space-x-3 h-12 text-left text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        onViewChange('dashboard');
                        setIsMobileSidebarOpen(false);
                      }}
                    >
                      <Settings className="w-5 h-5" />
                      <span>Panel de Control</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start space-x-3 h-12 text-left"
                      onClick={() => {
                        onViewChange('profile');
                        setIsMobileSidebarOpen(false);
                      }}
                    >
                      <User className="w-5 h-5" />
                      <span>Mi Perfil</span>
                    </Button>
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
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      onLogin();
                      setIsMobileSidebarOpen(false);
                    }}
                    variant="outline"
                    className="w-full justify-start space-x-3 h-12 text-left border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <User className="w-5 h-5" />
                    <span>Iniciar Sesión</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}