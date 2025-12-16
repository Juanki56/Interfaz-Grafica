import React, { useState } from 'react';
import { X, Calendar, Users, Clock, MapPin, DollarSign, CreditCard, User, Phone, Mail, UtensilsCrossed, Coffee, Soup, Pizza, Check, Bus, Home, Utensils, QrCode, CheckCircle2, Clock3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';

interface Restaurant {
  id: number;
  name: string;
  mealType: 'desayuno' | 'almuerzo' | 'refrigerio';
  price: number;
  description: string;
  rating: number;
}

interface TourBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: string;
    difficulty: string;
    location: string;
    capacity: number;
    rating: number;
    reviews: number;
    image: string;
  };
  type?: 'ruta' | 'paquete';
  availableRestaurants?: Restaurant[];
}

export function TourBookingModal({ isOpen, onClose, tour, type = 'ruta', availableRestaurants = [] }: TourBookingModalProps) {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    date: '',
    participants: 1,
    companions: 0,
    includeTransport: false,
    includeAccommodation: false,
    accommodationDays: 1,
    includeFood: false,
    specialRequests: '',
    contactName: '',
    contactPhone: '',
    contactEmail: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'pending' | 'confirmed' | null>(null);
  const [bookingId, setBookingId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<'50' | '100'>('50'); // Nuevo estado para el monto de pago

  const totalSteps = 4; // Participantes y servicios, Contacto, Pago, Confirmación

  // Precios de servicios adicionales
  const transportPrice = 50000;
  const accommodationPricePerNight = 120000;
  const foodPricePerPerson = 80000;

  const handleInputChange = (field: string, value: any) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Si se cambia el estado de alojamiento, resetear el monto de pago a 50%
    if (field === 'includeAccommodation') {
      setPaymentAmount('50');
    }
  };

  const calculateTotal = () => {
    const totalPeople = 1 + bookingData.companions; // Main participant + companions
    let total = tour.price * totalPeople;
    
    if (bookingData.includeTransport) {
      total += transportPrice * totalPeople;
    }
    
    if (bookingData.includeAccommodation) {
      total += accommodationPricePerNight * bookingData.accommodationDays * totalPeople;
    }
    
    if (bookingData.includeFood) {
      total += foodPricePerPerson * totalPeople;
    }
    
    return total;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!bookingData.date || bookingData.companions < 0) {
        toast.error('Por favor completa todos los campos obligatorios');
        return;
      }
    } else if (step === 2) {
      if (!bookingData.contactName || !bookingData.contactPhone || !bookingData.contactEmail) {
        toast.error('Por favor completa la información de contacto');
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate booking creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate booking ID
    const newBookingId = `OCC-${Date.now().toString().slice(-8)}`;
    setBookingId(newBookingId);
    setBookingStatus('pending');
    
    toast.success('¡Reserva creada exitosamente!', {
      description: 'Tu reserva está pendiente de confirmación de pago.'
    });
    
    setIsSubmitting(false);
    setStep(4);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Fácil':
        return 'bg-green-100 text-green-800';
      case 'Moderado':
        return 'bg-yellow-100 text-yellow-800';
      case 'Difícil':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setBookingStatus(null);
    setBookingId('');
    setPaymentAmount('50'); // Resetear el monto de pago
    setBookingData({
      date: '',
      participants: 1,
      companions: 0,
      includeTransport: false,
      includeAccommodation: false,
      accommodationDays: 1,
      includeFood: false,
      specialRequests: '',
      contactName: '',
      contactPhone: '',
      contactEmail: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] bg-white shadow-xl border-2 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div>
            <CardTitle className="text-xl">
              {step === 4 ? 'Confirmación de Reserva' : `Reservar ${type === 'ruta' ? 'Ruta' : 'Paquete'}`}
            </CardTitle>
            {step < 4 && <p className="text-sm text-muted-foreground">Paso {step} de {totalSteps - 1}</p>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAndClose}
            className="hover:bg-red-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Tour Summary */}
          {step < 4 && (
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <div className="flex items-center space-x-4">
                <img
                  src={tour.image}
                  alt={tour.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-green-800">{tour.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {tour.duration}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {tour.location}
                    </div>
                    <Badge className={getDifficultyColor(tour.difficulty)}>
                      {tour.difficulty}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    ${tour.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">por persona</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Participantes y Servicios Opcionales */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Detalles de la Reserva</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha del Tour *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={bookingData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companions">Número de Acompañantes</Label>
                    <Select 
                      value={bookingData.companions.toString()} 
                      onValueChange={(value) => handleInputChange('companions', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: Math.min(tour.capacity, 10) }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i} acompañante{i !== 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Total de personas: {1 + bookingData.companions}</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <h4 className="font-semibold mb-4">Servicios Opcionales</h4>
                
                {/* Transport */}
                <div className="border rounded-lg p-4 mb-3 hover:border-emerald-300 transition-colors">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={bookingData.includeTransport}
                      onCheckedChange={(checked) => handleInputChange('includeTransport', checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bus className="w-5 h-5 text-blue-600" />
                          <h5 className="font-medium text-gray-900">Transporte</h5>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-emerald-600">
                            ${transportPrice.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">por persona</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Transporte ida y vuelta desde el punto de encuentro</p>
                      {bookingData.includeTransport && (
                        <p className="text-sm text-emerald-700 mt-2">
                          Subtotal: ${(transportPrice * (1 + bookingData.companions)).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Accommodation */}
                <div className="border rounded-lg p-4 mb-3 hover:border-emerald-300 transition-colors">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={bookingData.includeAccommodation}
                      onCheckedChange={(checked) => handleInputChange('includeAccommodation', checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Home className="w-5 h-5 text-purple-600" />
                          <h5 className="font-medium text-gray-900">Alojamiento</h5>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-emerald-600">
                            ${accommodationPricePerNight.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">por noche/persona</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Hospedaje cómodo y seguro</p>
                      
                      {bookingData.includeAccommodation && (
                        <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                          <Label htmlFor="accommodationDays" className="text-sm">Número de noches</Label>
                          <Select 
                            value={bookingData.accommodationDays.toString()} 
                            onValueChange={(value) => handleInputChange('accommodationDays', parseInt(value))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar noches" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 7 }, (_, i) => (
                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                  {i + 1} noche{i + 1 > 1 ? 's' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-emerald-700">
                            Subtotal: ${(accommodationPricePerNight * bookingData.accommodationDays * (1 + bookingData.companions)).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Food */}
                <div className="border rounded-lg p-4 hover:border-emerald-300 transition-colors">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={bookingData.includeFood}
                      onCheckedChange={(checked) => handleInputChange('includeFood', checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Utensils className="w-5 h-5 text-orange-600" />
                          <h5 className="font-medium text-gray-900">Alimentación Completa</h5>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-emerald-600">
                            ${foodPricePerPerson.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">por persona/día</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Desayuno, almuerzo y cena incluidos</p>
                      {bookingData.includeFood && (
                        <p className="text-sm text-emerald-700 mt-2">
                          Subtotal: ${(foodPricePerPerson * (1 + bookingData.companions)).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-6">
                  <Label htmlFor="specialRequests">Solicitudes Especiales (opcional)</Label>
                  <Textarea
                    id="specialRequests"
                    placeholder="Dietas especiales, alergias, necesidades de accesibilidad, etc."
                    value={bookingData.specialRequests}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Información de Contacto */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Información de Contacto</h4>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Nombre Completo *</Label>
                    <Input
                      id="contactName"
                      placeholder="Juan Pérez"
                      value={bookingData.contactName}
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Teléfono *</Label>
                    <Input
                      id="contactPhone"
                      placeholder="+57 300 123 4567"
                      value={bookingData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Correo Electrónico *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="juan@email.com"
                      value={bookingData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Información de Pago */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Resumen de la Reserva</h4>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span>{type === 'ruta' ? 'Ruta:' : 'Paquete:'}</span>
                    <span className="font-medium">{tour.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha:</span>
                    <span className="font-medium">{bookingData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Participantes:</span>
                    <span className="font-medium">{1 + bookingData.companions} persona{1 + bookingData.companions > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contacto:</span>
                    <span className="font-medium">{bookingData.contactName}</span>
                  </div>
                  
                  {bookingData.specialRequests && (
                    <div className="pt-3 border-t border-gray-300">
                      <span className="block text-sm font-medium mb-1">Solicitudes especiales:</span>
                      <span className="text-sm text-muted-foreground">{bookingData.specialRequests}</span>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h5 className="font-medium">Desglose de Precios</h5>
                  
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>{type === 'ruta' ? 'Ruta' : 'Paquete'} ({1 + bookingData.companions} persona{1 + bookingData.companions > 1 ? 's' : ''}):</span>
                        <span>${(tour.price * (1 + bookingData.companions)).toLocaleString()}</span>
                      </div>
                      
                      {bookingData.includeTransport && (
                        <div className="flex justify-between">
                          <span>Transporte ({1 + bookingData.companions} persona{1 + bookingData.companions > 1 ? 's' : ''}):</span>
                          <span>${(transportPrice * (1 + bookingData.companions)).toLocaleString()}</span>
                        </div>
                      )}
                      
                      {bookingData.includeAccommodation && (
                        <div className="flex justify-between">
                          <span>Alojamiento ({bookingData.accommodationDays} noche{bookingData.accommodationDays > 1 ? 's' : ''}, {1 + bookingData.companions} persona{1 + bookingData.companions > 1 ? 's' : ''}):</span>
                          <span>${(accommodationPricePerNight * bookingData.accommodationDays * (1 + bookingData.companions)).toLocaleString()}</span>
                        </div>
                      )}
                      
                      {bookingData.includeFood && (
                        <div className="flex justify-between">
                          <span>Alimentación ({1 + bookingData.companions} persona{1 + bookingData.companions > 1 ? 's' : ''}):</span>
                          <span>${(foodPricePerPerson * (1 + bookingData.companions)).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <Separator className="bg-blue-200" />
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        ${calculateTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h5 className="font-medium">Monto a Pagar</h5>
                  
                  {/* Opciones de pago basadas en si hay alojamiento o no */}
                  {bookingData.includeAccommodation ? (
                    // CON ALOJAMIENTO: Solo 50% obligatorio
                    <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-lg">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="mt-1">
                          <Home className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-amber-900 mb-1">Reserva con Alojamiento</p>
                          <p className="text-sm text-amber-700">
                            Al incluir alojamiento, debes abonar el <strong>50% del total</strong> para confirmar tu reserva.
                          </p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border-2 border-amber-400">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Abono del 50%</p>
                              <p className="text-xs text-gray-600">Pago restante el día del tour</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-amber-600">
                              ${(calculateTotal() * 0.5).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">COP</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // SIN ALOJAMIENTO: Puede elegir 50% o 100%
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 mb-3">
                        Selecciona el monto que deseas pagar ahora:
                      </p>
                      
                      {/* Opción 50% */}
                      <div 
                        onClick={() => setPaymentAmount('50')}
                        className={`cursor-pointer border-2 p-4 rounded-lg transition-all ${
                          paymentAmount === '50' 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 bg-white hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentAmount === '50' 
                                ? 'border-green-500 bg-green-500' 
                                : 'border-gray-300'
                            }`}>
                              {paymentAmount === '50' && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Abono del 50%</p>
                              <p className="text-xs text-gray-600">Pago restante el día del tour</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${
                              paymentAmount === '50' ? 'text-green-600' : 'text-gray-700'
                            }`}>
                              ${(calculateTotal() * 0.5).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">COP</p>
                          </div>
                        </div>
                      </div>

                      {/* Opción 100% */}
                      <div 
                        onClick={() => setPaymentAmount('100')}
                        className={`cursor-pointer border-2 p-4 rounded-lg transition-all ${
                          paymentAmount === '100' 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 bg-white hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentAmount === '100' 
                                ? 'border-green-500 bg-green-500' 
                                : 'border-gray-300'
                            }`}>
                              {paymentAmount === '100' && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Pago Completo 100%</p>
                              <p className="text-xs text-gray-600">Pago total por adelantado</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${
                              paymentAmount === '100' ? 'text-green-600' : 'text-gray-700'
                            }`}>
                              ${calculateTotal().toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">COP</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h5 className="font-medium">Información de Pago</h5>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 p-6 rounded-lg">
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-2">
                        <QrCode className="w-8 h-8 text-white" />
                      </div>
                      
                      <div>
                        <h6 className="font-semibold text-purple-900 mb-2">Paga con Nequi</h6>
                        <p className="text-sm text-purple-700 mb-4">Escanea el código QR con tu app Nequi</p>
                      </div>
                      
                      {/* QR Code Placeholder */}
                      <div className="bg-white p-4 rounded-lg inline-block">
                        <div className="w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <QrCode className="w-24 h-24 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Código QR de Nequi</p>
                          </div>
                        </div>
                      </div>
                      
                      <Separator className="bg-purple-200" />
                      
                      <div className="space-y-2">
                        <p className="text-sm text-purple-800 font-medium">Número de consignación:</p>
                        <div className="bg-white p-3 rounded-lg border-2 border-purple-300">
                          <p className="text-lg font-mono font-bold text-purple-900">3001234567</p>
                        </div>
                        <p className="text-xs text-purple-600">A nombre de: Occitours S.A.S</p>
                      </div>
                      
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">
                          <strong>Importante:</strong> Después de realizar el pago, tu reserva quedará en estado "Pendiente" hasta que confirmemos la transacción. Recibirás un correo de confirmación.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmación */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Reserva Creada!</h3>
                <p className="text-gray-600 mb-6">Tu reserva ha sido registrada exitosamente</p>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-6 rounded-lg max-w-md mx-auto mb-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Número de Reserva</p>
                      <p className="text-2xl font-bold text-green-700">{bookingId}</p>
                    </div>
                    
                    <Separator className="bg-green-200" />
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Estado</p>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 px-4 py-1">
                        <Clock3 className="w-4 h-4 mr-1" />
                        Pendiente de Pago
                      </Badge>
                    </div>
                    
                    <Separator className="bg-green-200" />
                    
                    <div className="text-left">
                      <p className="text-sm text-gray-600 mb-2">Detalles:</p>
                      <div className="space-y-1 text-sm text-gray-700">
                        <p>• {tour.name}</p>
                        <p>• Fecha: {bookingData.date}</p>
                        <p>• {1 + bookingData.companions} persona{1 + bookingData.companions > 1 ? 's' : ''}</p>
                        <p>• Total: ${calculateTotal().toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-blue-800">
                    <strong>📧 Revisa tu correo</strong><br />
                    Hemos enviado la confirmación y los detalles de pago a <strong>{bookingData.contactEmail}</strong>
                  </p>
                </div>
                
                <div className="mt-6">
                  <Button
                    onClick={resetAndClose}
                    className="bg-green-600 hover:bg-green-700 px-8"
                  >
                    Entendido
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        {/* Navigation Buttons */}
        {step < 4 && (
          <div className="p-6 border-t bg-gray-50 flex justify-between">
            <Button
              variant="outline"
              onClick={step === 1 ? resetAndClose : handlePreviousStep}
              disabled={isSubmitting}
            >
              {step === 1 ? 'Cancelar' : 'Anterior'}
            </Button>
            
            {step < 3 ? (
              <Button
                onClick={handleNextStep}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                Siguiente
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Procesando...' : 'Confirmar Reserva'}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}