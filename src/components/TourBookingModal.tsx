import React, { useEffect, useMemo, useState } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as BookingCalendar } from './ui/calendar';
import { toast } from 'sonner';
import { programacionAPI, solicitudesPersonalizadasAPI, type SolicitudPersonalizada } from '../services/api';

function parseDurationDays(durationLabel: string): number {
  const match = String(durationLabel || '').match(/(\d+)/);
  const value = match ? Number.parseInt(match[1], 10) : NaN;
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function toYMD(date: Date): string {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

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
    time: '',
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

  const [createdSolicitud, setCreatedSolicitud] = useState<SolicitudPersonalizada | null>(null);

  const [paymentData, setPaymentData] = useState({
    monto: '',
    metodo_pago: 'Transferencia',
    numero_transaccion: '',
    comprobante_url: '',
    observaciones: '',
  });

  const [occupiedDates, setOccupiedDates] = useState<Set<string>>(new Set());
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const durationDays = useMemo(() => parseDurationDays(tour.duration), [tour.duration]);

  useEffect(() => {
    if (!isOpen) return;
    if (type !== 'ruta') return;

    const idRuta = Number(tour.id);
    if (!Number.isFinite(idRuta) || idRuta <= 0) return;

    let cancelled = false;
    setIsLoadingAvailability(true);
    programacionAPI
      .getFechasOcupadasRuta(idRuta)
      .then((dates) => {
        if (cancelled) return;
        setOccupiedDates(new Set((dates || []).map((d) => String(d).trim()).filter(Boolean)));
      })
      .catch(() => {
        if (cancelled) return;
        setOccupiedDates(new Set());
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingAvailability(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, tour.id, type]);

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
    setCreatedSolicitud(null);
    setPaymentAmount('50'); // Resetear el monto de pago
    setBookingData({
      date: '',
      time: '',
      participants: 1,
      companions: 0,
      includeTransport: false,
      includeAccommodation: false,
      accommodationDays: 1,
      includeFood: false,
      meetingPoint: '',
      specialRequests: '',
      contactName: '',
      contactPhone: '',
      contactEmail: ''
    });
    onClose();
  };

  const formatSolicitudEstado = (estado?: string | null) => {
    const value = String(estado ?? '').trim();
    if (!value) return '—';
    const lowered = value.toLowerCase();
    if (lowered.includes('pend')) return 'Pendiente de cotización';
    if (lowered.includes('coti')) return 'Cotizada';
    if (lowered.includes('rech')) return 'Rechazada';
    if (lowered.includes('conv') || lowered.includes('program')) return 'Programada';
    return value;
  };

  const submitRutaSolicitud = async () => {
    const idRuta = Number(tour.id);
    if (Number.isNaN(idRuta)) {
      toast.error('No se pudo enviar la solicitud', { description: 'ID de ruta inválido.' });
      return;
    }

    if (!bookingData.date || !bookingData.time) {
      toast.error('Completa la fecha y la hora');
      return;
    }

    const cantidadPersonas = 1 + Number(bookingData.companions || 0);
    if (cantidadPersonas <= 0) {
      toast.error('Cantidad de personas inválida');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await solicitudesPersonalizadasAPI.create({
        id_ruta: idRuta,
        fecha_deseada: bookingData.date,
        hora_deseada: bookingData.time,
        cantidad_personas: cantidadPersonas,
        observaciones: bookingData.specialRequests?.trim() || undefined,
      });

      const createdId: number | undefined =
        (created as any)?.data?.solicitud?.id_solicitud_personalizada ??
        (created as any)?.data?.solicitud?.id ??
        (created as any)?.data?.id_solicitud_personalizada;

      if (createdId != null) {
        const full = await solicitudesPersonalizadasAPI.getById(Number(createdId));
        setCreatedSolicitud(full);
      } else {
        const fallbackSolicitud = (created as any)?.data?.solicitud as SolicitudPersonalizada | undefined;
        if (fallbackSolicitud) setCreatedSolicitud(fallbackSolicitud);
      }

      toast.success('Solicitud enviada', {
        description: 'Si ya aparece ID de venta, puedes pagar de inmediato (con comprobante).',
      });
    } catch (e: any) {
      toast.error('No se pudo enviar la solicitud', {
        description: e?.message || 'Intenta nuevamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshRutaSolicitud = async () => {
    if (!createdSolicitud?.id_solicitud_personalizada) return;
    setIsSubmitting(true);
    try {
      const full = await solicitudesPersonalizadasAPI.getById(createdSolicitud.id_solicitud_personalizada);
      setCreatedSolicitud(full);
      toast.success('Estado actualizado');
    } catch (e: any) {
      toast.error('No se pudo actualizar', {
        description: e?.message || 'Intenta nuevamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Flujo real para rutas (solicitud personalizada)
  if (type === 'ruta') {
    const capacity = Number.isFinite(tour.capacity) ? Number(tour.capacity) : 0;
    const maxCompanions = Math.max(0, Math.min((capacity > 0 ? capacity - 1 : 10), 10));
    const totalPeople = 1 + Number(bookingData.companions || 0);

    const selectedDate = bookingData.date ? new Date(`${bookingData.date}T00:00:00`) : undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isStartDateDisabled = (date: Date) => {
      const base = new Date(date);
      base.setHours(0, 0, 0, 0);
      if (base < today) return true;

      // Bloqueo por rango: si la ruta dura N días, se deshabilita el inicio si algún día del rango está ocupado.
      for (let i = 0; i < durationDays; i += 1) {
        const d = addDays(base, i);
        if (occupiedDates.has(toYMD(d))) return true;
      }
      return false;
    };

    const formatSelectedDate = (date: Date | undefined) => {
      if (!date) return 'Selecciona una fecha';
      return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' });
    };

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] bg-white shadow-xl border-2 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <div>
              <CardTitle className="text-xl">
                {createdSolicitud ? 'Solicitud enviada' : 'Solicitar ruta personalizada'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {createdSolicitud
                  ? 'Puedes actualizar el estado aquí mismo.'
                  : 'Elige fecha y hora; el equipo confirmará disponibilidad.'}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetAndClose} className="hover:bg-red-100">
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Tour Summary */}
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <div className="flex items-center space-x-4">
                <img src={tour.image} alt={tour.name} className="w-16 h-16 rounded-lg object-cover" />
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
                    <Badge className={getDifficultyColor(tour.difficulty)}>{tour.difficulty}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">${tour.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">por persona</p>
                </div>
              </div>
            </div>

            {!createdSolicitud ? (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-4">Detalles de la solicitud</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Fecha *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            disabled={isLoadingAvailability}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {isLoadingAvailability ? 'Cargando disponibilidad…' : formatSelectedDate(selectedDate)}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <BookingCalendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              if (!date) return;
                              handleInputChange('date', toYMD(date));
                            }}
                            disabled={isStartDateDisabled}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {durationDays > 1 ? (
                        <p className="text-xs text-gray-500">
                          La ruta dura {durationDays} días: se bloqueará el rango completo.
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time">Hora *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={bookingData.time}
                        onChange={(e) => handleInputChange('time', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companions">Número de acompañantes</Label>
                      <Select
                        value={String(bookingData.companions)}
                        onValueChange={(value) => handleInputChange('companions', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: maxCompanions + 1 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i} acompañante{i !== 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Total de personas: {totalPeople}</p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                        El punto de encuentro lo define el asesor cuando revise tu solicitud y asigne la salida.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialRequests">Observaciones (opcional)</Label>
                  <Textarea
                    id="specialRequests"
                    placeholder="Indica detalles adicionales (accesibilidad, preferencias, etc.)"
                    value={bookingData.specialRequests}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    className="min-h-[90px]"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Una vez el staff cotice y asigne guía, aparecerá el <strong>ID de venta</strong> para pagar.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-6 rounded-lg">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">ID solicitud</span>
                      <span className="font-semibold text-green-800">#{createdSolicitud.id_solicitud_personalizada}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Estado</span>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        {formatSolicitudEstado(createdSolicitud.estado)}
                      </Badge>
                    </div>
                    {createdSolicitud.id_reserva != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Reserva</span>
                        <span className="font-medium">#{createdSolicitud.id_reserva}</span>
                      </div>
                    )}
                    {createdSolicitud.reserva_codigo_qr && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Código QR</span>
                        <span className="font-mono text-xs">{createdSolicitud.reserva_codigo_qr}</span>
                      </div>
                    )}

                    <Separator className="bg-green-200" />

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">ID venta</span>
                      <span className="font-semibold">
                        {createdSolicitud.id_venta != null ? `#${createdSolicitud.id_venta}` : 'Aún no disponible'}
                      </span>
                    </div>
                    {createdSolicitud.reserva_monto_total != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total</span>
                        <span className="font-medium">
                          ${Number(createdSolicitud.reserva_monto_total || 0).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {createdSolicitud.id_venta != null && createdSolicitud.venta_estado_pago && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Estado pago</span>
                        <span className="font-medium">{createdSolicitud.venta_estado_pago}</span>
                      </div>
                    )}
                  </div>
                </div>

                {createdSolicitud.id_solicitud_personalizada && createdSolicitud.id_venta != null && String(createdSolicitud.venta_estado_pago || '') !== 'Pagado' ? (
                  <div className="border border-green-200 rounded-lg p-4 bg-white">
                    <h4 className="font-semibold text-green-800 mb-3">Registrar pago (con comprobante)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Monto *</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={paymentData.monto}
                          onChange={(e) => setPaymentData((p) => ({ ...p, monto: e.target.value }))}
                          placeholder={
                            createdSolicitud.venta_saldo_pendiente != null
                              ? String(createdSolicitud.venta_saldo_pendiente)
                              : 'Ej: 120000'
                          }
                        />
                        {createdSolicitud.venta_saldo_pendiente != null ? (
                          <p className="text-xs text-gray-500">
                            Saldo pendiente: ${Number(createdSolicitud.venta_saldo_pendiente || 0).toLocaleString()}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label>Método de pago</Label>
                        <Select
                          value={paymentData.metodo_pago}
                          onValueChange={(value) => setPaymentData((p) => ({ ...p, metodo_pago: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Transferencia">Transferencia</SelectItem>
                            <SelectItem value="QR">QR</SelectItem>
                            <SelectItem value="PSE">PSE</SelectItem>
                            <SelectItem value="Efectivo">Efectivo</SelectItem>
                            <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Número de transacción (opcional)</Label>
                        <Input
                          value={paymentData.numero_transaccion}
                          onChange={(e) => setPaymentData((p) => ({ ...p, numero_transaccion: e.target.value }))}
                          placeholder="Ej: 123ABC"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>URL del comprobante *</Label>
                        <Input
                          value={paymentData.comprobante_url}
                          onChange={(e) => setPaymentData((p) => ({ ...p, comprobante_url: e.target.value }))}
                          placeholder="Pega el link (Drive, Dropbox, etc.)"
                        />
                        <p className="text-xs text-gray-500">
                          El staff verificará el comprobante y luego programará la ruta.
                        </p>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label>Observaciones (opcional)</Label>
                        <Textarea
                          value={paymentData.observaciones}
                          onChange={(e) => setPaymentData((p) => ({ ...p, observaciones: e.target.value }))}
                          placeholder="Ej: Pago realizado desde Nequi"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button
                        className="bg-green-700 hover:bg-green-800"
                        disabled={isSubmitting}
                        onClick={async () => {
                          try {
                            const monto = Number(paymentData.monto || createdSolicitud.venta_saldo_pendiente || createdSolicitud.reserva_monto_total || 0);
                            if (!Number.isFinite(monto) || monto <= 0) {
                              toast.error('Monto inválido');
                              return;
                            }
                            if (!String(paymentData.comprobante_url || '').trim()) {
                              toast.error('Debes pegar la URL del comprobante');
                              return;
                            }

                            setIsSubmitting(true);
                            await solicitudesPersonalizadasAPI.crearPago(createdSolicitud.id_solicitud_personalizada, {
                              monto,
                              metodo_pago: paymentData.metodo_pago || null,
                              numero_transaccion: paymentData.numero_transaccion?.trim() || null,
                              comprobante_url: paymentData.comprobante_url.trim(),
                              observaciones: paymentData.observaciones?.trim() || null,
                            });

                            toast.success('Pago registrado', {
                              description: 'Quedó pendiente de verificación.'
                            });
                            await refreshRutaSolicitud();
                          } catch (e: any) {
                            toast.error('No se pudo registrar el pago', {
                              description: e?.message || 'Intenta nuevamente.'
                            });
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                      >
                        {isSubmitting ? 'Enviando…' : 'Registrar pago'}
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={refreshRutaSolicitud} disabled={isSubmitting}>
                    {isSubmitting ? 'Actualizando…' : 'Actualizar estado'}
                  </Button>
                  <Button onClick={resetAndClose} className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

          {!createdSolicitud && (
            <div className="p-6 border-t bg-gray-50 flex justify-between">
              <Button variant="outline" onClick={resetAndClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={submitRutaSolicitud} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                {isSubmitting ? 'Enviando…' : 'Enviar solicitud'}
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

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