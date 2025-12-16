import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Package, 
  Calendar, 
  Home, 
  Route, 
  Truck, 
  CreditCard, 
  Shield, 
  X,
  ChevronRight,
  BarChart3,
  TreePine,
  UserCheck,
  Settings,
  Receipt,
  UtensilsCrossed,
  Building2,
  Tag
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface AdminRightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AdminRightSidebar({ isOpen, onClose, activeTab, onTabChange }: AdminRightSidebarProps) {
  const menuItems = [
    { 
      id: 'users', 
      label: 'Usuarios', 
      icon: Users, 
      description: 'Gestión de usuarios',
      badge: '38'
    },
    { 
      id: 'tours', 
      label: 'Tours', 
      icon: Package, 
      description: 'Paquetes turísticos',
      badge: '156'
    },
    { 
      id: 'bookings', 
      label: 'Reservas', 
      icon: Calendar, 
      description: 'Gestión de reservas',
      badge: '423'
    },
    { 
      id: 'farms', 
      label: 'Fincas', 
      icon: TreePine, 
      description: 'Propiedades rurales',
      badge: '12'
    },
    { 
      id: 'routes', 
      label: 'Rutas', 
      icon: Route, 
      description: 'Rutas turísticas',
      badge: '28'
    },
    { 
      id: 'restaurants', 
      label: 'Restaurantes', 
      icon: UtensilsCrossed, 
      description: 'Gestión de restaurantes',
      badge: '6'
    },
    { 
      id: 'services', 
      label: 'Servicios', 
      icon: Settings, 
      description: 'Gestión de servicios',
      badge: '24'
    },
    { 
      id: 'transport', 
      label: 'Transporte', 
      icon: Truck, 
      description: 'Vehículos y logística',
      badge: '15'
    },
    { 
      id: 'sales', 
      label: 'Ventas', 
      icon: CreditCard, 
      description: 'Cotizaciones y abonos',
      badge: '67'
    },
    { 
      id: 'payments', 
      label: 'Pagos', 
      icon: Receipt, 
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
      id: 'employees', 
      label: 'Empleados', 
      icon: Shield, 
      description: 'Gestión de empleados',
      badge: '4'
    },
    { 
      id: 'roles', 
      label: 'Roles', 
      icon: UserCheck, 
      description: 'Permisos y roles',
      badge: null
    }
  ];

  const handleItemClick = (itemId: string) => {
    onTabChange(itemId);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 border-l border-gray-200 flex flex-col ${ 
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Panel de Control</h2>
            <p className="text-sm text-gray-600">Navegación administrativa</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-2 admin-sidebar-scroll"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f3f4f6'
          }}
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onClick={() => handleItemClick(item.id)}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-green-50 border border-green-200 shadow-sm' 
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isActive ? 'bg-green-100' : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      isActive ? 'text-green-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${
                        isActive ? 'text-green-900' : 'text-gray-900'
                      }`}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${
                      isActive ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${
                    isActive ? 'text-green-600 rotate-90' : 'text-gray-400 group-hover:translate-x-1'
                  }`} />
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-700 font-medium">Sistema Activo</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Todas las funciones operativas
            </p>
          </div>
        </div>
      </div>
    </>
  );
}