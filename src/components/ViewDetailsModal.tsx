import React from 'react';
import { X, User, Mail, Phone, Calendar, MapPin, Package, TreePine, Route } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';

interface ViewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  type: 'user' | 'tour' | 'farm' | 'booking' | 'route';
}

export function ViewDetailsModal({ isOpen, onClose, data, type }: ViewDetailsModalProps) {
  if (!data) return null;

  const getIcon = () => {
    switch (type) {
      case 'user': return <User className="w-5 h-5" />;
      case 'tour': return <Package className="w-5 h-5" />;
      case 'farm': return <TreePine className="w-5 h-5" />;
      case 'booking': return <Calendar className="w-5 h-5" />;
      case 'route': return <Route className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'user': return 'Detalles del Usuario';
      case 'tour': return 'Detalles del Tour';
      case 'farm': return 'Detalles de la Finca';
      case 'booking': return 'Detalles de la Reserva';
      case 'route': return 'Detalles de la Ruta';
      default: return 'Detalles';
    }
  };

  const renderUserDetails = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{data.name}</h3>
          <Badge variant="secondary">{data.role}</Badge>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Mail className="w-4 h-4 text-gray-500" />
          <span>{data.email}</span>
        </div>
        {data.phone && (
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gray-500" />
            <span>{data.phone}</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>Registrado: {data.joinDate}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${data.status === 'Activo' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span>Estado: {data.status}</span>
        </div>
      </div>
    </div>
  );

  const renderTourDetails = () => (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg">{data.name}</h3>
        <Badge variant="secondary">{data.type === 'route' ? 'Ruta' : 'Paquete'}</Badge>
      </div>
      
      <Separator />
      
      <div className="space-y-3">
        {data.description && (
          <div>
            <label className="text-sm font-medium text-gray-700">Descripción:</label>
            <p className="text-gray-600">{data.description}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Precio:</label>
            <p className="font-semibold">${parseInt(data.price).toLocaleString()} COP</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Capacidad:</label>
            <p>{data.booked || 0}/{data.capacity} personas</p>
          </div>
        </div>
        {data.duration && (
          <div>
            <label className="text-sm font-medium text-gray-700">Duración:</label>
            <p>{data.duration}</p>
          </div>
        )}
        {data.difficulty && (
          <div>
            <label className="text-sm font-medium text-gray-700">Dificultad:</label>
            <Badge variant="outline">{data.difficulty}</Badge>
          </div>
        )}
        {data.location && (
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span>{data.location}</span>
          </div>
        )}
        {data.includes && data.includes.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700">Incluye:</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.includes.map((item: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">{item}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderFarmDetails = () => (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg">{data.name}</h3>
        <p className="text-gray-600">Propietario: {data.owner}</p>
      </div>
      
      <Separator />
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span>{data.location}</span>
        </div>
        {data.phone && (
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gray-500" />
            <span>{data.phone}</span>
          </div>
        )}
        {data.email && (
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-gray-500" />
            <span>{data.email}</span>
          </div>
        )}
        {data.area && (
          <div>
            <label className="text-sm font-medium text-gray-700">Área:</label>
            <p>{data.area} hectáreas</p>
          </div>
        )}
        {data.capacity && (
          <div>
            <label className="text-sm font-medium text-gray-700">Capacidad:</label>
            <p>{data.capacity} personas</p>
          </div>
        )}
        {data.pricePerNight && (
          <div>
            <label className="text-sm font-medium text-gray-700">Precio por noche:</label>
            <p>${parseInt(data.pricePerNight).toLocaleString()} COP</p>
          </div>
        )}
        {data.farmType && (
          <div>
            <label className="text-sm font-medium text-gray-700">Tipo:</label>
            <Badge variant="secondary">{data.farmType}</Badge>
          </div>
        )}
        {data.amenities && data.amenities.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700">Amenidades:</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.amenities.map((amenity: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">{amenity}</Badge>
              ))}
            </div>
          </div>
        )}
        {data.description && (
          <div>
            <label className="text-sm font-medium text-gray-700">Descripción:</label>
            <p className="text-gray-600">{data.description}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case 'user': return renderUserDetails();
      case 'tour': return renderTourDetails();
      case 'farm': return renderFarmDetails();
      default: return <p>Información no disponible</p>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getIcon()}
            <span>{getTitle()}</span>
          </DialogTitle>
        </DialogHeader>

        {renderContent()}

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}