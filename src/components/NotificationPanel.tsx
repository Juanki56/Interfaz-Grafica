import React, { useState } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionRequired?: boolean;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'admin' | 'advisor' | 'guide' | 'client';
}

export function NotificationPanel({ isOpen, onClose, userRole }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Generate role-specific notifications
    const baseNotifications: Record<string, Notification[]> = {
      admin: [
        {
          id: '1',
          type: 'urgent',
          title: 'Sistema de Pagos',
          message: 'Se detectaron 3 transacciones fallidas que requieren revisión inmediata.',
          time: 'Hace 5 min',
          read: false,
          actionRequired: true
        },
        {
          id: '2',
          type: 'warning',
          title: 'Capacidad de Tours',
          message: 'El tour "Sierra Nevada" del 15 de septiembre está sobrecargado (25/20 personas).',
          time: 'Hace 15 min',
          read: false,
          actionRequired: true
        },
        {
          id: '3',
          type: 'info',
          title: 'Nuevo Usuario Registrado',
          message: 'Carlos Méndez se registró como cliente. Rol asignado automáticamente.',
          time: 'Hace 1 hora',
          read: true
        },
        {
          id: '4',
          type: 'success',
          title: 'Backup Completado',
          message: 'Respaldo de base de datos completado exitosamente.',
          time: 'Hace 2 horas',
          read: true
        }
      ],
      advisor: [
        {
          id: '1',
          type: 'urgent',
          title: 'Cliente Esperando Confirmación',
          message: 'María González está esperando confirmación del tour "Café y Tradición" desde hace 2 horas.',
          time: 'Hace 2 horas',
          read: false,
          actionRequired: true
        },
        {
          id: '2',
          type: 'warning',
          title: 'Comprobante Pendiente',
          message: 'Reserva #R456 tiene comprobante de pago sin verificar.',
          time: 'Hace 30 min',
          read: false,
          actionRequired: true
        },
        {
          id: '3',
          type: 'info',
          title: 'Nueva Consulta',
          message: 'Tienes una nueva consulta sobre disponibilidad en finca "El Paraíso".',
          time: 'Hace 45 min',
          read: true
        }
      ],
      guide: [
        {
          id: '1',
          type: 'urgent',
          title: 'Cambio de Itinerario',
          message: 'El tour de mañana tiene cambio de ruta por condiciones climáticas.',
          time: 'Hace 20 min',
          read: false,
          actionRequired: true
        },
        {
          id: '2',
          type: 'info',
          title: 'Nuevo Participante',
          message: 'Se agregó 1 persona más al tour "Avistamiento de Aves" de mañana.',
          time: 'Hace 1 hora',
          read: false
        },
        {
          id: '3',
          type: 'success',
          title: 'Evaluación Positiva',
          message: 'Recibiste una calificación de 5 estrellas en tu último tour.',
          time: 'Hace 3 horas',
          read: true
        }
      ],
      client: [
        {
          id: '1',
          type: 'success',
          title: 'Reserva Confirmada',
          message: 'Tu reserva para "Tour Cafetero" ha sido confirmada para el 18 de septiembre.',
          time: 'Hace 30 min',
          read: false
        },
        {
          id: '2',
          type: 'info',
          title: 'Recordatorio de Tour',
          message: 'No olvides tu tour "Sierra Nevada" mañana a las 7:00 AM.',
          time: 'Hace 2 horas',
          read: false
        },
        {
          id: '3',
          type: 'warning',
          title: 'Cambio Climatológico',
          message: 'Recomendamos llevar impermeable para tu tour del fin de semana.',
          time: 'Hace 4 horas',
          read: true
        }
      ]
    };

    return baseNotifications[userRole] || [];
  });

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end p-4">
      <Card className="w-96 max-h-[80vh] bg-white shadow-xl border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-green-600" />
            <CardTitle>Notificaciones</CardTitle>
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-800 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-green-600 hover:text-green-700"
              >
                Marcar todas
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-red-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="space-y-1 p-4">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No tienes notificaciones</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      notification.read 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-white border-green-200 shadow-sm'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm ${notification.read ? 'text-gray-700' : ''}`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            {notification.actionRequired && (
                              <Badge className="bg-orange-100 text-orange-800 text-xs">
                                Acción requerida
                              </Badge>
                            )}
                            {!notification.read && (
                              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className={`text-xs mb-2 ${notification.read ? 'text-gray-500' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{notification.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}