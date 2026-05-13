import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  Settings, 
  Tag, 
  DollarSign, 
  Clock, 
  Users,
  Check
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { useServices } from '../hooks/useServices';

const serviceCategories = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'guia', label: 'Guía' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'experiencia', label: 'Experiencia' },
  { value: 'alojamiento', label: 'Alojamiento' },
  { value: 'equipo', label: 'Equipo' },
  { value: 'alimentacion', label: 'Alimentación' }
];

interface ServiceSelectorProps {
  selectedServices: string[];
  onServicesChange: (services: string[]) => void;
  label?: string;
  className?: string;
}

export function ServiceSelector({ 
  selectedServices, 
  onServicesChange, 
  label = "Servicios",
  className = "" 
}: ServiceSelectorProps) {
  const { services, getServicesByIds } = useServices();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelectedServices, setTempSelectedServices] = useState<string[]>(selectedServices);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const selectedServiceObjects = getServicesByIds(selectedServices);

  const handleServiceToggle = (serviceId: string) => {
    setTempSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleSaveServices = () => {
    onServicesChange(tempSelectedServices);
    setIsDialogOpen(false);
  };

  const handleCancelSelection = () => {
    setTempSelectedServices(selectedServices);
    setIsDialogOpen(false);
  };

  const removeService = (serviceId: string) => {
    const updatedServices = selectedServices.filter(id => id !== serviceId);
    onServicesChange(updatedServices);
  };

  const getCategoryLabel = (category: string) => {
    const cat = serviceCategories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      guia: 'bg-blue-100 text-blue-800',
      transporte: 'bg-green-100 text-green-800',
      experiencia: 'bg-purple-100 text-purple-800',
      alojamiento: 'bg-orange-100 text-orange-800',
      equipo: 'bg-gray-100 text-gray-800',
      alimentacion: 'bg-yellow-100 text-yellow-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      
      {/* Selected Services Display */}
      <div className="min-h-[100px] p-3 border border-gray-200 rounded-lg bg-gray-50">
        {selectedServiceObjects.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-2">
              Servicios seleccionados ({selectedServiceObjects.length}):
            </p>
            <div className="space-y-2">
              {selectedServiceObjects.map((service) => (
                <div 
                  key={service.id} 
                  className="flex items-center justify-between bg-white p-2 rounded border"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{service.name}</span>
                      <Badge className={getCategoryColor(service.category)} variant="secondary">
                        {getCategoryLabel(service.category)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-3 h-3" />
                        <span>${service.price.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{service.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{service.capacity}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeService(service.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-gray-500">
            <Settings className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No hay servicios seleccionados</p>
            <p className="text-xs">Haz clic en "Agregar Servicios" para seleccionar</p>
          </div>
        )}
      </div>

      {/* Add Services Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={() => setTempSelectedServices(selectedServices)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Servicios
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Seleccionar Servicios</span>
            </DialogTitle>
          </DialogHeader>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                {serviceCategories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Services List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <div 
                  key={service.id} 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    tempSelectedServices.includes(service.id) 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleServiceToggle(service.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={tempSelectedServices.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{service.name}</span>
                          <Badge className={getCategoryColor(service.category)} variant="secondary">
                            {getCategoryLabel(service.category)}
                          </Badge>
                          {tempSelectedServices.includes(service.id) && (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>${service.price.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{service.duration}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{service.capacity}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No se encontraron servicios</p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {tempSelectedServices.length} servicio{tempSelectedServices.length !== 1 ? 's' : ''} seleccionado{tempSelectedServices.length !== 1 ? 's' : ''}
              </span>
              <span className="font-medium">
                Total estimado: ${services
                  .filter(service => tempSelectedServices.includes(service.id))
                  .reduce((total, service) => total + service.price, 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelSelection}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveServices}
              className="flex-1"
            >
              Guardar Servicios ({tempSelectedServices.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}