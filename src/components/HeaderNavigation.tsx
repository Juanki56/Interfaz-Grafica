import React, { useState } from 'react';
import { Mountain, Menu, X, User, Users, MapPin, Package, Home, Building, LogOut, Settings } from 'lucide-react';
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

interface HeaderNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogin: () => void;
}

export function HeaderNavigation({ currentView, onViewChange, onLogin }: HeaderNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-green-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer group h-full py-2"
            onClick={() => onViewChange('home')}
          >
            <div className="w-auto h-full shrink-0 flex items-center justify-center">
              <img 
                src="/logo_sin_fondo-removebg-preview.png" 
                alt="Occitours Logo" 
                className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
                style={{ border: 'none', outline: 'none' }}
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    currentView === item.id
                      ? 'bg-green-100 text-green-800'
                      : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Menu or Login & Mobile Menu Toggle */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Dashboard Button */}
                <Button
                  onClick={() => onViewChange('dashboard')}
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex items-center space-x-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Settings className="w-4 h-4" />
                  <span>Panel</span>
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 hover:bg-green-50">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <p className="text-sm text-gray-900">{user.name.split(' ')[0]}</p>
                        <Badge variant="secondary" className={`text-xs ${getRoleColor(user.role)}`}>
                          {getRoleName(user.role)}
                        </Badge>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="p-2">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => onViewChange('dashboard')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Panel de Control
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => onViewChange('profile')}>
                      <User className="w-4 h-4 mr-2" />
                      Mi Perfil
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={logout}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  onClick={onLogin}
                  data-login-trigger
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex items-center space-x-2 border-green-200 text-green-700 hover:bg-green-50"
                >
                  <User className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </Button>

                {/* Mobile Login Button */}
                <Button
                  onClick={onLogin}
                  variant="outline"
                  data-login-trigger
                  size="sm"
                  className="sm:hidden"
                >
                  <User className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-green-700 hover:bg-green-50"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-green-100">
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      currentView === item.id
                        ? 'bg-green-100 text-green-800'
                        : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              
              {/* Mobile User Actions */}
              {user ? (
                <>
                  <button
                    onClick={() => {
                      onViewChange('dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-blue-700 hover:bg-blue-50 rounded-lg"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Panel de Control</span>
                  </button>
                  <button
                    onClick={() => {
                      onViewChange('profile');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <User className="w-5 h-5" />
                    <span>Mi Perfil</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-red-700 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onLogin();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-green-700 hover:bg-green-50 rounded-lg"
                >
                  <User className="w-5 h-5" />
                  <span>Iniciar Sesión</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}