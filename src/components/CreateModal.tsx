import React, { useState } from 'react';
import { X, Plus, MapPin, Calendar, DollarSign, Users, Camera, Mountain, Leaf } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'tour' | 'finca' | 'ruta' | 'usuario' | 'reserva' | 'paquete';
  userRole: 'admin' | 'advisor' | 'guide' | 'client';
  onBookingCreated?: (booking: any) => void;
}

export function CreateModal({ isOpen, onClose, type, userRole, onBookingCreated }: CreateModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const activities = [
    'Senderismo', 'Avistamiento de Aves', 'Fotografía', 'Meditación',
    'Degustación de Café', 'Tour Gastronómico', 'Ciclismo', 'Kayaking',
    'Camping', 'Observación Nocturna', 'Talleres Artesanales', 'Cabalgata'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleActivityToggle = (activity: string) => {
    setSelectedActivities(prev => 
      prev.includes(activity) 
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo no debe superar los 5MB');
        return;
      }

      setPaymentReceipt(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      toast.success('Comprobante cargado correctamente');
    }
  };

  const handleRemoveReceipt = () => {
    setPaymentReceipt(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validación específica para reservas
    if (type === 'reserva') {
      if (!formData.clientName || !formData.tourId || !formData.date) {
        toast.error('Por favor completa todos los campos obligatorios');
        setIsSubmitting(false);
        return;
      }
      
      if (!paymentReceipt || !previewUrl) {
        toast.error('Por favor sube el comprobante de pago');
        setIsSubmitting(false);
        return;
      }
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const itemNames = {
      tour: 'tour',
      finca: 'finca',
      ruta: 'ruta',
      usuario: 'usuario',
      reserva: 'reserva',
      paquete: 'paquete'
    };

    // Si es una reserva, crear el objeto completo con el comprobante
    if (type === 'reserva' && onBookingCreated) {
      // Calcular montos según el tipo de servicio
      const basePrice = parseFloat(formData.estimatedPrice || '0');
      const participants = parseInt(formData.participants || '1');
      const totalAmount = basePrice * participants;
      const paidAmount = formData.hasAccommodation ? totalAmount * 0.5 : totalAmount;
      const remainingAmount = totalAmount - paidAmount;

      const newBooking = {
        id: Date.now(),
        name: formData.serviceName || 'Servicio',
        type: formData.serviceType || 'tour',
        date: formData.date || new Date().toISOString().split('T')[0],
        participants: participants,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
        status: 'confirmed',
        paymentStatus: formData.hasAccommodation ? 'partial' : 'completed',
        hasAccommodation: formData.hasAccommodation || false,
        paymentReceipt: previewUrl, // Guardar la URL del preview
        remainingPaymentReceipt: null,
        specialRequests: formData.observations || formData.specialRequests || 'Ninguna',
        cancellationDeadline: formData.date || new Date().toISOString().split('T')[0],
        location: formData.location || 'Ubicación del servicio',
        clientName: formData.clientName || 'Cliente',
        clientEmail: formData.clientEmail || 'No especificado',
        clientPhone: formData.clientPhone || 'No especificado',
        createdBy: userRole === 'advisor' ? 'Asesor' : 'Administrador',
        createdAt: new Date().toISOString()
      };

      onBookingCreated(newBooking);
    }

    toast.success(`${itemNames[type].charAt(0).toUpperCase() + itemNames[type].slice(1)} creado/a exitosamente`, {
      description: type === 'reserva' && formData.hasAccommodation 
        ? 'Comprobante del 50% registrado. Pendiente 50% restante.' 
        : `El nuevo ${itemNames[type]} ha sido registrado en el sistema.`
    });

    setIsSubmitting(false);
    setFormData({});
    setSelectedActivities([]);
    setPaymentReceipt(null);
    setPreviewUrl(null);
    onClose();
  };

  const getModalTitle = () => {
    const titles = {
      tour: 'Crear Nuevo Tour',
      finca: 'Registrar Nueva Finca',
      ruta: 'Crear Nueva Ruta',
      usuario: 'Registrar Nuevo Usuario',
      reserva: 'Crear Nueva Reserva',
      paquete: 'Crear Nuevo Paquete'
    };
    return titles[type];
  };

  const getModalIcon = () => {
    const icons = {
      tour: <Mountain className="w-5 h-5 text-green-600" />,
      finca: <Leaf className="w-5 h-5 text-green-600" />,
      ruta: <MapPin className="w-5 h-5 text-green-600" />,
      usuario: <Users className="w-5 h-5 text-green-600" />,
      reserva: <Calendar className="w-5 h-5 text-green-600" />,
      paquete: <Plus className="w-5 h-5 text-green-600" />
    };
    return icons[type];
  };

  const renderFormFields = () => {
    switch (type) {
      case 'tour':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Tour</Label>
                <Input
                  id="name"
                  placeholder="Ej: Caminata Sierra Nevada"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duración</Label>
                <Select onValueChange={(value) => handleInputChange('duration', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="halfday">Medio día (4 horas)</SelectItem>
                    <SelectItem value="fullday">Día completo (8 horas)</SelectItem>
                    <SelectItem value="multiday">Varios días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe la experiencia que ofrecerás..."
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio por persona</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="150000"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Máximo participantes</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  placeholder="15"
                  value={formData.maxParticipants || ''}
                  onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Actividades incluidas</Label>
              <div className="grid grid-cols-3 gap-2">
                {activities.slice(0, 12).map(activity => (
                  <div key={activity} className="flex items-center space-x-2">
                    <Checkbox
                      id={activity}
                      checked={selectedActivities.includes(activity)}
                      onCheckedChange={() => handleActivityToggle(activity)}
                    />
                    <Label htmlFor={activity} className="text-sm">{activity}</Label>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'finca':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Finca</Label>
                <Input
                  id="name"
                  placeholder="Ej: Finca El Paraíso"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Finca</Label>
                <Select onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coffee">Cafetera</SelectItem>
                    <SelectItem value="eco">Ecoturística</SelectItem>
                    <SelectItem value="adventure">Aventura</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                placeholder="Municipio, Departamento"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe la finca y sus características..."
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidad máxima</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="50"
                  value={formData.capacity || ''}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricePerPerson">Precio por persona</Label>
                <Input
                  id="pricePerPerson"
                  type="number"
                  placeholder="80000"
                  value={formData.pricePerPerson || ''}
                  onChange={(e) => handleInputChange('pricePerPerson', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Calificación inicial</Label>
                <Select onValueChange={(value) => handleInputChange('rating', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="⭐" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">⭐⭐⭐⭐⭐</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐</SelectItem>
                    <SelectItem value="3">⭐⭐⭐</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Servicios disponibles</Label>
              <div className="grid grid-cols-2 gap-2">
                {['Alojamiento', 'Restaurante', 'Guías especializados', 'Transporte', 'Actividades nocturnas', 'Wifi', 'Piscina', 'Senderos'].map(service => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox id={service} />
                    <Label htmlFor={service} className="text-sm">{service}</Label>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'usuario':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@email.com"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="+57 300 123 4567"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="guide">Guía Turístico</SelectItem>
                    <SelectItem value="advisor">Asesor</SelectItem>
                    {userRole === 'admin' && <SelectItem value="admin">Administrador</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña temporal</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password || ''}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                El usuario deberá cambiar esta contraseña en su primer inicio de sesión
              </p>
            </div>
          </>
        );

      case 'reserva':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nombre del Cliente *</Label>
                <Input
                  id="clientName"
                  placeholder="Ej: María González"
                  value={formData.clientName || ''}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Teléfono del Cliente</Label>
                <Input
                  id="clientPhone"
                  type="tel"
                  placeholder="+57 300 123 4567"
                  value={formData.clientPhone || ''}
                  onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email del Cliente</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="maria@email.com"
                value={formData.clientEmail || ''}
                onChange={(e) => handleInputChange('clientEmail', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tourId">Tour Seleccionado *</Label>
              <Select onValueChange={(value) => {
                handleInputChange('tourId', value);
                // Guardar también el nombre del servicio y precio
                const tourData = {
                  '1': { name: 'Caminata Sierra Nevada', price: 150000 },
                  '2': { name: 'Tour Cafetero Auténtico', price: 120000 },
                  '3': { name: 'Avistamiento de Aves', price: 95000 }
                };
                const selected = tourData[value];
                if (selected) {
                  handleInputChange('serviceName', selected.name);
                  handleInputChange('estimatedPrice', selected.price.toString());
                  handleInputChange('serviceType', 'tour');
                  handleInputChange('location', 'Sierra Nevada');
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tour" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Caminata Sierra Nevada - $150,000</SelectItem>
                  <SelectItem value="2">Tour Cafetero Auténtico - $120,000</SelectItem>
                  <SelectItem value="3">Avistamiento de Aves - $95,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha del Tour *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="participants">Número de Participantes</Label>
                <Input
                  id="participants"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={formData.participants || '1'}
                  onChange={(e) => handleInputChange('participants', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                placeholder="Notas especiales, requerimientos alimentarios, etc."
                value={formData.observations || ''}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                rows={3}
              />
            </div>

            {/* Alojamiento Section */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="has-accommodation"
                  checked={formData.hasAccommodation || false}
                  onCheckedChange={(checked) => {
                    handleInputChange('hasAccommodation', checked);
                    handleInputChange('paymentPercentage', checked ? '50' : '100');
                  }}
                />
                <div className="flex-1">
                  <Label htmlFor="has-accommodation" className="cursor-pointer font-medium">
                    ¿El servicio incluye alojamiento?
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.hasAccommodation 
                      ? 'Se requiere abono del 50% al crear la reserva' 
                      : 'Se requiere pago completo del 100%'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-green-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Información de Pago
              </h4>

              <div className="bg-white border border-green-300 rounded p-3">
                <p className="text-sm font-medium text-green-900">
                  {formData.hasAccommodation 
                    ? '💰 Monto a pagar: 50% (Abono inicial)' 
                    : '💰 Monto a pagar: 100% (Pago completo)'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.hasAccommodation 
                    ? 'El 50% restante se pagará posteriormente' 
                    : 'El servicio no incluye alojamiento, pago total requerido'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-receipt">
                  Comprobante de Pago {formData.hasAccommodation ? '(50%)' : '(100%)'} *
                </Label>
                <Input
                  id="payment-receipt"
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Formatos aceptados: JPG, PNG. Tamaño máximo: 5MB
                </p>
              </div>

              {previewUrl && (
                <div className="bg-white rounded-lg p-3 border-2 border-green-300">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-green-900">Vista Previa del Comprobante:</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveReceipt}
                      className="text-red-600 hover:text-red-700"
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-contain rounded-lg border"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Archivo:</strong> {paymentReceipt?.name}
                  </p>
                </div>
              )}
            </div>
          </>
        );

      default:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Formulario para crear {type} en desarrollo...
            </p>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] bg-white shadow-xl border-2 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center space-x-2">
            {getModalIcon()}
            <CardTitle>{getModalTitle()}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-red-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="space-y-6">
              {renderFormFields()}
            </div>
          </CardContent>

          <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Creando...' : 'Crear'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}