import React, { useState } from 'react';
import { TreePine, MapPin, Phone, User, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ServiceSelector } from './ServiceSelector';
import { toast } from 'sonner';

interface CreateFarmFormWithServicesProps {
  isOpen: boolean;
  onClose: () => void;
  onFarmCreated: (farm: any) => void;
  editingFarm?: any;
  onFarmUpdated?: (farm: any) => void;
}

export function CreateFarmFormWithServices({ 
  isOpen, 
  onClose, 
  onFarmCreated, 
  editingFarm,
  onFarmUpdated 
}: CreateFarmFormWithServicesProps) {
  const [formData, setFormData] = useState({
    name: editingFarm?.name || '',
    owner: editingFarm?.owner || '',
    location: editingFarm?.location || '',
    address: editingFarm?.address || '',
    phone: editingFarm?.phone || '',
    email: editingFarm?.email || '',
    area: editingFarm?.area || '',
    capacity: editingFarm?.capacity?.toString() || '',
    pricePerNight: editingFarm?.pricePerNight || '',
    amenities: editingFarm?.amenities?.join(', ') || '',
    description: editingFarm?.description || '',
    farmType: editingFarm?.farmType || '',
    status: editingFarm?.status || 'available'
  });
  const [selectedServices, setSelectedServices] = useState<string[]>(editingFarm?.services || []);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServicesChange = (services: string[]) => {
    setSelectedServices(services);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.owner || !formData.location) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const farmData = {
        id: editingFarm?.id || Date.now().toString(),
        name: formData.name,
        owner: formData.owner,
        location: formData.location,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        area: formData.area,
        capacity: parseInt(formData.capacity) || 0,
        pricePerNight: formData.pricePerNight,
        amenities: formData.amenities.split(',').map(item => item.trim()).filter(item => item),
        description: formData.description,
        farmType: formData.farmType,
        status: formData.status,
        services: selectedServices,
        createdAt: editingFarm?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        images: editingFarm?.images || []
      };

      if (editingFarm && onFarmUpdated) {
        onFarmUpdated(farmData);
        toast.success('Finca actualizada exitosamente');
      } else {
        onFarmCreated(farmData);
        toast.success('Finca creada exitosamente');
      }
      
      // Reset form
      setFormData({
        name: '',
        owner: '',
        location: '',
        address: '',
        phone: '',
        email: '',
        area: '',
        capacity: '',
        pricePerNight: '',
        amenities: '',
        description: '',
        farmType: '',
        status: 'available'
      });
      setSelectedServices([]);
      
      onClose();
    } catch (error) {
      toast.error(editingFarm ? 'Error al actualizar la finca' : 'Error al crear la finca');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TreePine className="w-5 h-5" />
            <span>{editingFarm ? 'Editar Finca' : 'Agregar Nueva Finca'}</span>
          </DialogTitle>
          <DialogDescription>
            {editingFarm 
              ? 'Modifica la información de la finca seleccionada'
              : 'Completa la información para registrar una nueva finca en el sistema'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Información Básica
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Finca *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Finca El Paraíso"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner">Propietario *</Label>
                <Input
                  id="owner"
                  placeholder="Nombre del propietario"
                  value={formData.owner}
                  onChange={(e) => handleInputChange('owner', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación *</Label>
                <Input
                  id="location"
                  placeholder="Ciudad, Departamento"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="farmType">Tipo de Finca</Label>
                <Select value={formData.farmType} onValueChange={(value) => handleInputChange('farmType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cafetera">Finca Cafetera</SelectItem>
                    <SelectItem value="ganadera">Finca Ganadera</SelectItem>
                    <SelectItem value="fruticola">Finca Frutícola</SelectItem>
                    <SelectItem value="ecoturismo">Ecoturismo</SelectItem>
                    <SelectItem value="recreativa">Recreativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección Completa</Label>
              <Input
                id="address"
                placeholder="Dirección detallada"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Información de Contacto
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="Número de contacto"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Detalles de la Propiedad */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Detalles de la Propiedad
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area">Área (hectáreas)</Label>
                <Input
                  id="area"
                  type="number"
                  placeholder="0"
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidad (personas)</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="0"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerNight">Precio por Noche</Label>
                <Input
                  id="pricePerNight"
                  type="number"
                  placeholder="50000"
                  value={formData.pricePerNight}
                  onChange={(e) => handleInputChange('pricePerNight', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amenities">Amenidades Básicas</Label>
              <Textarea
                id="amenities"
                placeholder="Separar con comas: Piscina, WiFi, Cocina, Parqueadero, etc."
                value={formData.amenities}
                onChange={(e) => handleInputChange('amenities', e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe la finca, sus características y atractivos..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Servicios Adicionales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Servicios Adicionales
            </h3>
            <ServiceSelector
              selectedServices={selectedServices}
              onServicesChange={handleServicesChange}
              label="Servicios incluidos en la finca"
            />
          </div>

          {/* Estado */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Estado
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="status">Estado de la Finca</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado de la finca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="occupied">Ocupada</SelectItem>
                  <SelectItem value="maintenance">En Mantenimiento</SelectItem>
                  <SelectItem value="inactive">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading 
                ? (editingFarm ? 'Actualizando...' : 'Creando...') 
                : (editingFarm ? 'Actualizar Finca' : 'Crear Finca')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}