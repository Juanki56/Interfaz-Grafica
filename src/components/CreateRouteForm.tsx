import React, { useState, useEffect } from 'react';
import { Route, MapPin, Clock, Star, Users, DollarSign, Camera, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface CreateRouteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onRouteCreated: (route: any) => void;
  editingRoute?: any;
  onRouteUpdated?: (route: any) => void;
}

export function CreateRouteForm({ 
  isOpen, 
  onClose, 
  onRouteCreated,
  editingRoute,
  onRouteUpdated
}: CreateRouteFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    duration: '',
    difficulty: '',
    price: '',
    capacity: '',
    startTime: '',
    endTime: '',
    distance: '',
    includes: [] as string[],
    requirements: '',
    meetingPoint: '',
    highlights: [] as string[],
    recommendations: '',
    cancellationPolicy: ''
  });
  const [loading, setLoading] = useState(false);
  const [currentInclude, setCurrentInclude] = useState('');
  const [currentHighlight, setCurrentHighlight] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (editingRoute) {
      setFormData({
        name: editingRoute.name || '',
        description: editingRoute.description || '',
        location: editingRoute.location || '',
        duration: editingRoute.duration || '',
        difficulty: editingRoute.difficulty || '',
        price: editingRoute.price?.toString() || '',
        capacity: editingRoute.capacity?.toString() || '',
        startTime: editingRoute.startTime || '',
        endTime: editingRoute.endTime || '',
        distance: editingRoute.distance?.toString() || '',
        includes: Array.isArray(editingRoute.includes) ? editingRoute.includes : [],
        requirements: editingRoute.requirements || '',
        meetingPoint: editingRoute.meetingPoint || '',
        highlights: Array.isArray(editingRoute.highlights) ? editingRoute.highlights : [],
        recommendations: editingRoute.recommendations || '',
        cancellationPolicy: editingRoute.cancellationPolicy || ''
      });
    } else {
      // Reset form for creating new route
      setFormData({
        name: '',
        description: '',
        location: '',
        duration: '',
        difficulty: '',
        price: '',
        capacity: '',
        startTime: '',
        endTime: '',
        distance: '',
        includes: [],
        requirements: '',
        meetingPoint: '',
        highlights: [],
        recommendations: '',
        cancellationPolicy: ''
      });
    }
  }, [editingRoute, isOpen]);

  const difficultyOptions = [
    { value: 'Fácil', label: 'Fácil' },
    { value: 'Moderado', label: 'Moderado' },
    { value: 'Difícil', label: 'Difícil' },
    { value: 'Experto', label: 'Experto' }
  ];

  const commonIncludes = [
    'Guía especializado',
    'Transporte ida y vuelta',
    'Almuerzo incluido',
    'Equipo de seguridad',
    'Seguro de accidentes',
    'Hidratación',
    'Kit de primeros auxilios',
    'Fotografías del recorrido'
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addInclude = (include: string) => {
    if (include.trim() && !formData.includes.includes(include.trim())) {
      setFormData(prev => ({
        ...prev,
        includes: [...prev.includes, include.trim()]
      }));
      setCurrentInclude('');
    }
  };

  const removeInclude = (index: number) => {
    setFormData(prev => ({
      ...prev,
      includes: prev.includes.filter((_, i) => i !== index)
    }));
  };

  const addHighlight = (highlight: string) => {
    if (highlight.trim() && !formData.highlights.includes(highlight.trim())) {
      setFormData(prev => ({
        ...prev,
        highlights: [...prev.highlights, highlight.trim()]
      }));
      setCurrentHighlight('');
    }
  };

  const removeHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || !formData.duration || 
        !formData.difficulty || !formData.price || !formData.capacity) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const price = parseFloat(formData.price);
    const capacity = parseInt(formData.capacity);
    const distance = parseFloat(formData.distance);

    if (isNaN(price) || price <= 0) {
      toast.error('El precio debe ser un número válido mayor a 0');
      return;
    }

    if (isNaN(capacity) || capacity <= 0) {
      toast.error('La capacidad debe ser un número válido mayor a 0');
      return;
    }

    if (formData.distance && (isNaN(distance) || distance <= 0)) {
      toast.error('La distancia debe ser un número válido mayor a 0');
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newRoute = {
        id: editingRoute?.id || Date.now().toString(),
        name: formData.name,
        description: formData.description,
        location: formData.location,
        duration: formData.duration,
        difficulty: formData.difficulty,
        price: price,
        capacity: capacity,
        startTime: formData.startTime,
        endTime: formData.endTime,
        distance: distance || null,
        includes: formData.includes,
        requirements: formData.requirements,
        meetingPoint: formData.meetingPoint,
        highlights: formData.highlights,
        recommendations: formData.recommendations,
        cancellationPolicy: formData.cancellationPolicy,
        status: editingRoute?.status || 'active',
        rating: editingRoute?.rating || 0,
        reviews: editingRoute?.reviews || 0,
        booked: editingRoute?.booked || 0,
        createdAt: editingRoute?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingRoute && onRouteUpdated) {
        onRouteUpdated(newRoute);
        toast.success('Ruta actualizada exitosamente');
      } else {
        onRouteCreated(newRoute);
        toast.success('Ruta creada exitosamente');
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        location: '',
        duration: '',
        difficulty: '',
        price: '',
        capacity: '',
        startTime: '',
        endTime: '',
        distance: '',
        includes: [],
        requirements: '',
        meetingPoint: '',
        highlights: [],
        recommendations: '',
        cancellationPolicy: ''
      });
      
      onClose();
    } catch (error) {
      toast.error(editingRoute ? 'Error al actualizar la ruta' : 'Error al crear la ruta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Route className="w-5 h-5" />
            <span>{editingRoute ? 'Editar Ruta Turística' : 'Crear Nueva Ruta Turística'}</span>
          </DialogTitle>
          <DialogDescription>
            {editingRoute 
              ? 'Modifica la información de la ruta seleccionada'
              : 'Completa la información para crear una nueva ruta turística en el sistema'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Información Básica
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nombre de la Ruta *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Sendero del Café y las Mariposas"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ubicación *</Label>
                <Input
                  id="location"
                  placeholder="Ej: Cocora, Quindío"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duración *</Label>
                <Input
                  id="duration"
                  placeholder="Ej: 4 horas, 1 día completo"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Dificultad *</Label>
                <Select value={formData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la dificultad" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="distance">Distancia (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  step="0.1"
                  placeholder="Ej: 8.5"
                  value={formData.distance}
                  onChange={(e) => handleInputChange('distance', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe la experiencia, paisajes y actividades que incluye esta ruta..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
              />
            </div>
          </div>

          {/* Pricing and Capacity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Precios y Capacidad
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio por Persona (COP) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="1000"
                  placeholder="Ej: 95000"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidad Máxima *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="50"
                  placeholder="Ej: 12"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetingPoint">Punto de Encuentro</Label>
                <Input
                  id="meetingPoint"
                  placeholder="Ej: Plaza Principal de Salento"
                  value={formData.meetingPoint}
                  onChange={(e) => handleInputChange('meetingPoint', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Horarios
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Hora de Inicio</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">Hora de Finalización</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Qué Incluye
            </h3>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {commonIncludes.map((include) => (
                  <Button
                    key={include}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addInclude(include)}
                    disabled={formData.includes.includes(include)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {include}
                  </Button>
                ))}
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="Agregar elemento personalizado..."
                  value={currentInclude}
                  onChange={(e) => setCurrentInclude(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addInclude(currentInclude);
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => addInclude(currentInclude)}
                  disabled={!currentInclude.trim()}
                >
                  Agregar
                </Button>
              </div>

              {formData.includes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.includes.map((include, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>{include}</span>
                      <button
                        type="button"
                        onClick={() => removeInclude(index)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Highlights */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Puntos Destacados
            </h3>

            <div className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  placeholder="Ej: Vista panorámica del valle, Avistamiento de aves..."
                  value={currentHighlight}
                  onChange={(e) => setCurrentHighlight(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addHighlight(currentHighlight);
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => addHighlight(currentHighlight)}
                  disabled={!currentHighlight.trim()}
                >
                  Agregar
                </Button>
              </div>

              {formData.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.highlights.map((highlight, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="flex items-center space-x-1"
                    >
                      <Star className="w-3 h-3" />
                      <span>{highlight}</span>
                      <button
                        type="button"
                        onClick={() => removeHighlight(index)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Información Adicional
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="requirements">Requisitos y Recomendaciones</Label>
                <Textarea
                  id="requirements"
                  placeholder="Ej: Ropa cómoda, zapatos de senderismo, protector solar..."
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommendations">Recomendaciones Especiales</Label>
                <Textarea
                  id="recommendations"
                  placeholder="Consejos adicionales para los participantes..."
                  value={formData.recommendations}
                  onChange={(e) => handleInputChange('recommendations', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancellationPolicy">Política de Cancelación</Label>
                <Textarea
                  id="cancellationPolicy"
                  placeholder="Términos y condiciones para cancelaciones..."
                  value={formData.cancellationPolicy}
                  onChange={(e) => handleInputChange('cancellationPolicy', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading 
                ? (editingRoute ? 'Actualizando...' : 'Creando...') 
                : (editingRoute ? 'Actualizar Ruta' : 'Crear Ruta')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}