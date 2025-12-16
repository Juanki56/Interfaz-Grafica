import React, { useState, useEffect } from 'react';
import { Package, MapPin, Users, DollarSign, Clock, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';

interface CreateTourFormProps {
  isOpen: boolean;
  onClose: () => void;
  onTourCreated: (tour: any) => void;
  editingTour?: any;
  onTourUpdated?: (tour: any) => void;
}

export function CreateTourForm({ isOpen, onClose, onTourCreated, editingTour, onTourUpdated }: CreateTourFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: '', // 'route' or 'package'
    description: '',
    price: '',
    capacity: '',
    duration: '',
    difficulty: '',
    location: '',
    includes: '',
    requirements: ''
  });
  const [loading, setLoading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingTour) {
      setFormData({
        name: editingTour.name || '',
        type: editingTour.type || '',
        description: editingTour.description || '',
        price: editingTour.price || '',
        capacity: editingTour.capacity?.toString() || '',
        duration: editingTour.duration || '',
        difficulty: editingTour.difficulty || '',
        location: editingTour.location || '',
        includes: Array.isArray(editingTour.includes) 
          ? editingTour.includes.join(', ') 
          : editingTour.includes || '',
        requirements: editingTour.requirements || ''
      });
    } else {
      // Reset form for creating new tour
      setFormData({
        name: '',
        type: '',
        description: '',
        price: '',
        capacity: '',
        duration: '',
        difficulty: '',
        location: '',
        includes: '',
        requirements: ''
      });
    }
  }, [editingTour, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type || !formData.price || !formData.capacity) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const tourData = {
        id: editingTour?.id || Date.now().toString(),
        name: formData.name,
        type: formData.type,
        description: formData.description,
        price: formData.price,
        capacity: parseInt(formData.capacity),
        booked: editingTour?.booked || 0,
        duration: formData.duration,
        difficulty: formData.difficulty,
        location: formData.location,
        includes: formData.includes.split(',').map(item => item.trim()),
        requirements: formData.requirements,
        status: editingTour?.status || 'Activo',
        createdAt: editingTour?.createdAt || new Date().toISOString(),
        updatedAt: editingTour ? new Date().toISOString() : undefined
      };

      if (editingTour && onTourUpdated) {
        onTourUpdated(tourData);
        toast.success('Tour actualizado exitosamente');
      } else {
        onTourCreated(tourData);
        toast.success(`${formData.type === 'route' ? 'Ruta' : 'Paquete'} creado exitosamente`);
      }
      
      // Reset form
      setFormData({
        name: '',
        type: '',
        description: '',
        price: '',
        capacity: '',
        duration: '',
        difficulty: '',
        location: '',
        includes: '',
        requirements: ''
      });
      
      onClose();
    } catch (error) {
      toast.error(editingTour ? 'Error al actualizar el tour' : 'Error al crear el tour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>{editingTour ? 'Editar Tour' : 'Crear Nuevo Tour'}</span>
          </DialogTitle>
          <DialogDescription>
            {editingTour 
              ? 'Modifica la información del tour seleccionado'
              : 'Completa la información para crear un nuevo tour turístico en el sistema'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Tour *</Label>
              <Input
                id="name"
                placeholder="Ej: Caminata Sierra Nevada"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Tour *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="route">Ruta Turística</SelectItem>
                  <SelectItem value="package">Paquete Turístico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe la experiencia del tour..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Precio (COP) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="150000"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidad *</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="12"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duración</Label>
              <Input
                id="duration"
                placeholder="1 día"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificultad</Label>
              <Select value={formData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nivel de dificultad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fácil">Fácil</SelectItem>
                  <SelectItem value="Moderado">Moderado</SelectItem>
                  <SelectItem value="Difícil">Difícil</SelectItem>
                  <SelectItem value="Extremo">Extremo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                placeholder="Ej: Sierra Nevada, Colombia"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="includes">Qué Incluye</Label>
            <Textarea
              id="includes"
              placeholder="Separar con comas: Guía, Transporte, Almuerzo, Equipo"
              value={formData.includes}
              onChange={(e) => handleInputChange('includes', e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requisitos</Label>
            <Textarea
              id="requirements"
              placeholder="Requisitos especiales para el tour..."
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              rows={2}
            />
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
                ? (editingTour ? 'Actualizando...' : 'Creando...') 
                : (editingTour ? 'Actualizar Tour' : 'Crear Tour')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}