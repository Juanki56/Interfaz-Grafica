import React, { useState } from 'react';
import { X, Calendar, Users, MapPin, DollarSign, User, Phone, Mail, Plus, Trash2, QrCode, CheckCircle2, Clock3, Upload, FileCheck, Music, UtensilsCrossed, UserCheck, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { toast } from 'sonner@2.0.3';

interface Companion {
  id: string;
  name: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  age: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  icon: any;
}

interface FarmBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  farm: {
    id: string;
    name: string;
    location: string;
    pricePerNight: number;
    maxGuests: number;
    image: string;
    gallery: string[];
  };
  availableServices: Service[];
  selectedServices: string[];
}

export function FarmBookingModal({ isOpen, onClose, farm, availableServices, selectedServices: initialSelectedServices }: FarmBookingModalProps) {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    nights: 1,
    selectedServices: initialSelectedServices,
    companions: [] as Companion[],
    medicalIndications: '',
    specialRequests: '',
    paymentMethod: 'nequi' as 'nequi' | 'bancolombia',
    paymentProof: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'pending' | 'confirmed' | null>(null);
  const [bookingId, setBookingId] = useState<string>('');

  const totalSteps = 4; // Servicios y acompañantes, Info médica, Pago, Confirmación

  const handleInputChange = (field: string, value: any) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (field: 'checkIn' | 'checkOut', value: string) => {
    const newData = { ...bookingData, [field]: value };
    
    if (newData.checkIn && newData.checkOut) {
      const checkInDate = new Date(newData.checkIn);
      const checkOutDate = new Date(newData.checkOut);
      const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      newData.nights = diffDays || 1;
    }
    
    setBookingData(newData);
  };

  const addCompanion = () => {
    const newCompanion: Companion = {
      id: Date.now().toString(),
      name: '',
      documentType: 'CC',
      documentNumber: '',
      phone: '',
      age: ''
    };
    setBookingData(prev => ({
      ...prev,
      companions: [...prev.companions, newCompanion]
    }));
  };

  const removeCompanion = (id: string) => {
    setBookingData(prev => ({
      ...prev,
      companions: prev.companions.filter(c => c.id !== id)
    }));
  };

  const updateCompanion = (id: string, field: keyof Companion, value: string) => {
    setBookingData(prev => ({
      ...prev,
      companions: prev.companions.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    }));
  };

  const toggleService = (serviceId: string) => {
    setBookingData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBookingData(prev => ({
        ...prev,
        paymentProof: e.target.files![0]
      }));
      toast.success('Comprobante cargado correctamente');
    }
  };

  const calculateTotal = () => {
    let total = farm.pricePerNight * bookingData.nights;
    
    bookingData.selectedServices.forEach(serviceId => {
      const service = availableServices.find(s => s.id === serviceId);
      if (service) {
        total += service.price;
      }
    });
    
    return total;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!bookingData.checkIn || !bookingData.checkOut) {
        toast.error('Por favor selecciona las fechas de estadía');
        return;
      }
      // Validar acompañantes si hay alguno agregado
      const incompleteCompanions = bookingData.companions.filter(c => 
        !c.name || !c.documentNumber || !c.phone || !c.age
      );
      if (incompleteCompanions.length > 0) {
        toast.error('Por favor completa la información de todos los acompañantes');
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!bookingData.paymentProof) {
      toast.error('Por favor adjunta el comprobante de pago');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate booking creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate booking ID
    const newBookingId = `FNC-${Date.now().toString().slice(-8)}`;
    setBookingId(newBookingId);
    setBookingStatus('pending');
    
    toast.success('¡Reserva registrada exitosamente!', {
      description: 'Tu reserva está pendiente de revisión del comprobante.'
    });
    
    setIsSubmitting(false);
    setStep(4);
  };

  const resetAndClose = () => {
    setStep(1);
    setBookingStatus(null);
    setBookingId('');
    setBookingData({
      checkIn: '',
      checkOut: '',
      nights: 1,
      selectedServices: [],
      companions: [],
      medicalIndications: '',
      specialRequests: '',
      paymentMethod: 'nequi',
      paymentProof: null
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8 bg-white shadow-xl border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b sticky top-0 bg-white z-10">
          <div>
            <CardTitle className="text-xl">
              {step === 4 ? 'Confirmación de Reserva' : 'Reservar Finca'}
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

        <CardContent className="p-6">
          {/* Farm Summary */}
          {step < 4 && (
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <div className="flex items-center space-x-4">
                <img
                  src={farm.image}
                  alt={farm.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-green-800">{farm.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {farm.location}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    ${farm.pricePerNight.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">por noche</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Servicios y Acompañantes */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Fechas de Estadía</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn">Fecha de Entrada *</Label>
                    <Input
                      id="checkIn"
                      type="date"
                      value={bookingData.checkIn}
                      onChange={(e) => handleDateChange('checkIn', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="checkOut">Fecha de Salida *</Label>
                    <Input
                      id="checkOut"
                      type="date"
                      value={bookingData.checkOut}
                      onChange={(e) => handleDateChange('checkOut', e.target.value)}
                      min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {bookingData.nights > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                    <p className="text-sm text-blue-800">
                      <strong>Total de noches:</strong> {bookingData.nights} noche{bookingData.nights > 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                <Separator className="my-6" />

                <h4 className="font-semibold mb-4">Servicios Adicionales (Opcionales)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {availableServices.map((service) => {
                    const ServiceIcon = service.icon;
                    const isSelected = bookingData.selectedServices.includes(service.id);
                    
                    return (
                      <div 
                        key={service.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-50' 
                            : 'border-gray-200 hover:border-emerald-300'
                        }`}
                        onClick={() => toggleService(service.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleService(service.id)}
                            className="mt-1"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <ServiceIcon className="w-4 h-4 text-emerald-600" />
                                <h5 className="font-medium text-sm">{service.name}</h5>
                              </div>
                              <p className="font-semibold text-emerald-600 text-sm">
                                ${service.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator className="my-6" />

                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Acompañantes</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCompanion}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Acompañante
                  </Button>
                </div>

                {bookingData.companions.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No has agregado acompañantes</p>
                    <p className="text-sm text-gray-500">Haz clic en "Agregar Acompañante" para registrar a las personas que te acompañarán</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookingData.companions.map((companion, index) => (
                      <Card key={companion.id} className="border-2 border-emerald-100">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-emerald-700">Acompañante #{index + 1}</h5>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCompanion(companion.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs">Nombre Completo *</Label>
                              <Input
                                placeholder="Ej: María García"
                                value={companion.name}
                                onChange={(e) => updateCompanion(companion.id, 'name', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs">Edad *</Label>
                              <Input
                                type="number"
                                placeholder="Ej: 25"
                                value={companion.age}
                                onChange={(e) => updateCompanion(companion.id, 'age', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs">Tipo de Documento *</Label>
                              <Select 
                                value={companion.documentType}
                                onValueChange={(value) => updateCompanion(companion.id, 'documentType', value)}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                                  <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                                  <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                                  <SelectItem value="PA">Pasaporte</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs">Número de Documento *</Label>
                              <Input
                                placeholder="Ej: 1234567890"
                                value={companion.documentNumber}
                                onChange={(e) => updateCompanion(companion.id, 'documentNumber', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                            
                            <div className="space-y-2 md:col-span-2">
                              <Label className="text-xs">Teléfono *</Label>
                              <Input
                                placeholder="Ej: +57 300 123 4567"
                                value={companion.phone}
                                onChange={(e) => updateCompanion(companion.id, 'phone', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-4">
                  <strong>Capacidad máxima:</strong> {farm.maxGuests} personas (incluyéndote a ti)
                  {bookingData.companions.length > 0 && (
                    <span className="ml-2">
                      | <strong>Total actual:</strong> {1 + bookingData.companions.length} persona{1 + bookingData.companions.length > 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Indicaciones Médicas y Especiales */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Información Importante</h4>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="medicalIndications">Indicaciones Médicas</Label>
                    <Textarea
                      id="medicalIndications"
                      placeholder="Alergias, condiciones médicas, medicamentos, restricciones dietéticas, etc."
                      value={bookingData.medicalIndications}
                      onChange={(e) => handleInputChange('medicalIndications', e.target.value)}
                      className="min-h-[120px]"
                    />
                    <p className="text-xs text-gray-500">
                      Esta información es confidencial y solo será usada para garantizar tu seguridad y bienestar durante la estadía
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specialRequests">Solicitudes Especiales</Label>
                    <Textarea
                      id="specialRequests"
                      placeholder="Preferencias de habitación, ocasión especial, necesidades de accesibilidad, etc."
                      value={bookingData.specialRequests}
                      onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Pago */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Resumen de la Reserva</h4>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span>Finca:</span>
                    <span className="font-medium">{farm.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entrada:</span>
                    <span className="font-medium">{bookingData.checkIn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Salida:</span>
                    <span className="font-medium">{bookingData.checkOut}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Noches:</span>
                    <span className="font-medium">{bookingData.nights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Huéspedes:</span>
                    <span className="font-medium">{1 + bookingData.companions.length} persona{1 + bookingData.companions.length > 0 ? 's' : ''}</span>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h5 className="font-medium">Desglose de Precios</h5>
                  
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Estadía ({bookingData.nights} noche{bookingData.nights > 1 ? 's' : ''}):</span>
                        <span>${(farm.pricePerNight * bookingData.nights).toLocaleString()}</span>
                      </div>
                      
                      {bookingData.selectedServices.length > 0 && (
                        <>
                          {bookingData.selectedServices.map(serviceId => {
                            const service = availableServices.find(s => s.id === serviceId);
                            if (!service) return null;
                            return (
                              <div key={serviceId} className="flex justify-between">
                                <span>{service.name}:</span>
                                <span>${service.price.toLocaleString()}</span>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                    
                    <Separator className="bg-blue-200" />
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total a pagar:</span>
                      <span className="text-xl font-bold text-green-600">
                        ${calculateTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h5 className="font-medium">Método de Pago</h5>
                  
                  <RadioGroup 
                    value={bookingData.paymentMethod} 
                    onValueChange={(value: 'nequi' | 'bancolombia') => handleInputChange('paymentMethod', value)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          bookingData.paymentMethod === 'nequi' 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => handleInputChange('paymentMethod', 'nequi')}
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="nequi" id="nequi" />
                          <Label htmlFor="nequi" className="flex-1 cursor-pointer">
                            <div className="font-medium">Nequi</div>
                            <div className="text-xs text-gray-600">Pago por QR o número</div>
                          </Label>
                        </div>
                      </div>
                      
                      <div 
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          bookingData.paymentMethod === 'bancolombia' 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-200 hover:border-red-300'
                        }`}
                        onClick={() => handleInputChange('paymentMethod', 'bancolombia')}
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="bancolombia" id="bancolombia" />
                          <Label htmlFor="bancolombia" className="flex-1 cursor-pointer">
                            <div className="font-medium">Bancolombia</div>
                            <div className="text-xs text-gray-600">Transferencia bancaria</div>
                          </Label>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>

                  {/* Payment Info */}
                  <div className={`bg-gradient-to-br ${
                    bookingData.paymentMethod === 'nequi' 
                      ? 'from-purple-50 to-pink-50 border-purple-200' 
                      : 'from-red-50 to-orange-50 border-red-200'
                  } border-2 p-6 rounded-lg`}>
                    <div className="text-center space-y-4">
                      <div className={`inline-flex items-center justify-center w-16 h-16 ${
                        bookingData.paymentMethod === 'nequi' ? 'bg-purple-600' : 'bg-red-600'
                      } rounded-full mb-2`}>
                        <QrCode className="w-8 h-8 text-white" />
                      </div>
                      
                      <div>
                        <h6 className={`font-semibold mb-2 ${
                          bookingData.paymentMethod === 'nequi' ? 'text-purple-900' : 'text-red-900'
                        }`}>
                          {bookingData.paymentMethod === 'nequi' ? 'Paga con Nequi' : 'Paga con Bancolombia'}
                        </h6>
                        <p className={`text-sm mb-4 ${
                          bookingData.paymentMethod === 'nequi' ? 'text-purple-700' : 'text-red-700'
                        }`}>
                          {bookingData.paymentMethod === 'nequi' 
                            ? 'Escanea el código QR con tu app Nequi' 
                            : 'Realiza la transferencia a la cuenta'}
                        </p>
                      </div>
                      
                      {/* QR Code or Account Info */}
                      <div className="bg-white p-4 rounded-lg inline-block">
                        {bookingData.paymentMethod === 'nequi' ? (
                          <div className="w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <QrCode className="w-24 h-24 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">Código QR de Nequi</p>
                            </div>
                          </div>
                        ) : (
                          <div className="w-64 space-y-2 text-left">
                            <div>
                              <p className="text-xs text-gray-600">Tipo de cuenta:</p>
                              <p className="font-medium">Ahorros</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Número de cuenta:</p>
                              <p className="font-medium font-mono">12345678901</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Titular:</p>
                              <p className="font-medium">Occitours S.A.S</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Separator className={
                        bookingData.paymentMethod === 'nequi' ? 'bg-purple-200' : 'bg-red-200'
                      } />
                      
                      <div className="space-y-2">
                        <p className={`text-sm font-medium ${
                          bookingData.paymentMethod === 'nequi' ? 'text-purple-800' : 'text-red-800'
                        }`}>
                          {bookingData.paymentMethod === 'nequi' 
                            ? 'Número de Nequi:' 
                            : 'Número de cuenta:'}
                        </p>
                        <div className={`bg-white p-3 rounded-lg border-2 ${
                          bookingData.paymentMethod === 'nequi' ? 'border-purple-300' : 'border-red-300'
                        }`}>
                          <p className={`text-lg font-mono font-bold ${
                            bookingData.paymentMethod === 'nequi' ? 'text-purple-900' : 'text-red-900'
                          }`}>
                            {bookingData.paymentMethod === 'nequi' ? '3001234567' : '12345678901'}
                          </p>
                        </div>
                        <p className={`text-xs ${
                          bookingData.paymentMethod === 'nequi' ? 'text-purple-600' : 'text-red-600'
                        }`}>
                          A nombre de: Occitours S.A.S
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Upload Payment Proof */}
                  <div className="space-y-3">
                    <Label htmlFor="paymentProof" className="text-base font-medium">
                      Adjuntar Comprobante de Pago *
                    </Label>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                      <input
                        type="file"
                        id="paymentProof"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="paymentProof" className="cursor-pointer">
                        {bookingData.paymentProof ? (
                          <div className="space-y-2">
                            <FileCheck className="w-12 h-12 text-green-600 mx-auto" />
                            <p className="font-medium text-green-700">{bookingData.paymentProof.name}</p>
                            <p className="text-xs text-gray-500">Haz clic para cambiar el archivo</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                            <p className="text-gray-700">Haz clic para seleccionar el comprobante</p>
                            <p className="text-xs text-gray-500">PNG, JPG o PDF (máx. 5MB)</p>
                          </div>
                        )}
                      </label>
                    </div>
                    
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        <strong>Importante:</strong> Tu reserva quedará en estado "Pendiente" hasta que un asesor o administrador revise y confirme tu comprobante de pago. Te notificaremos por correo cuando sea aprobada.
                      </p>
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
                <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
                  <Clock3 className="w-12 h-12 text-yellow-600" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Reserva Registrada!</h3>
                <p className="text-gray-600 mb-6">Tu reserva está pendiente de confirmación</p>
                
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 p-6 rounded-lg max-w-md mx-auto mb-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Número de Reserva</p>
                      <p className="text-2xl font-bold text-yellow-700">{bookingId}</p>
                    </div>
                    
                    <Separator className="bg-yellow-200" />
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Estado</p>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 px-4 py-1">
                        <Clock3 className="w-4 h-4 mr-1" />
                        Pendiente de Revisión
                      </Badge>
                    </div>
                    
                    <Separator className="bg-yellow-200" />
                    
                    <div className="text-left">
                      <p className="text-sm text-gray-600 mb-2">Detalles:</p>
                      <div className="space-y-1 text-sm text-gray-700">
                        <p>• {farm.name}</p>
                        <p>• Entrada: {bookingData.checkIn}</p>
                        <p>• Salida: {bookingData.checkOut}</p>
                        <p>• {bookingData.nights} noche{bookingData.nights > 1 ? 's' : ''}</p>
                        <p>• {1 + bookingData.companions.length} persona{1 + bookingData.companions.length > 0 ? 's' : ''}</p>
                        <p>• Total: ${calculateTotal().toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg max-w-md mx-auto mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>📧 Próximos pasos:</strong><br />
                    Un asesor o administrador revisará tu comprobante de pago. Recibirás un correo de confirmación cuando tu reserva sea aprobada.
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-green-800">
                    <strong>✓ Comprobante adjuntado:</strong><br />
                    {bookingData.paymentProof?.name}
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
                disabled={isSubmitting || !bookingData.paymentProof}
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