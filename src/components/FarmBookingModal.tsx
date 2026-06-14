import React, { useEffect, useMemo, useState } from 'react';
import { X, Users, MapPin, QrCode, Clock3, Upload, FileCheck, Minus, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { toast } from 'sonner';
import { useAuth } from '../App';
import { pagosAPI, reservasAPI, fincasAPI } from '../services/api';
import { Calendar as BookingCalendar } from './ui/calendar';
import { addDays, normalizeOccupiedYmd, toYMD } from '../utils/routeDateCalendar';

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

const MAX_PROOF_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_PROOF_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const MAX_PROOF_FILE_NAME = 180;

const PAYMENT_METHOD_MAP = {
  nequi: 'QR',
  bancolombia: 'Transferencia',
} as const;

const OCCITOURS_PAYMENT_INFO = {
  titular: 'Occitours S.A.S',
  nequiNumero: '3001234567',
  bancolombiaTipoCuenta: 'Ahorros',
  bancolombiaNumeroCuenta: '12345678901',
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el comprobante seleccionado.'));
    reader.readAsDataURL(file);
  });
}

export function FarmBookingModal({ isOpen, onClose, farm, availableServices, selectedServices: initialSelectedServices }: FarmBookingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    nights: 1,
    selectedServices: initialSelectedServices,
    /** Personas que van además del titular (sin registrar datos uno a uno). */
    companionCount: 0,
    medicalIndications: '',
    specialRequests: '',
    paymentMethod: 'nequi' as 'nequi' | 'bancolombia',
    paymentProof: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string>('');
  const [paymentAmountMode, setPaymentAmountMode] = useState<'50' | '100'>('50');
  const [registeredPaymentId, setRegisteredPaymentId] = useState<number | null>(null);
  const [registeredPaymentAmount, setRegisteredPaymentAmount] = useState<number>(0);
  const [createdSaleId, setCreatedSaleId] = useState<number | null>(null);
  const [createdReservationTotal, setCreatedReservationTotal] = useState<number>(0);
  const [occupiedDates, setOccupiedDates] = useState<Set<string>>(new Set());
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityWarning, setAvailabilityWarning] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setBookingData((prev) => ({ ...prev, selectedServices: initialSelectedServices }));
  }, [isOpen, initialSelectedServices]);

  useEffect(() => {
    if (!isOpen) return;
    const idFinca = Number(farm.id);
    if (!Number.isFinite(idFinca) || idFinca <= 0) return;

    let cancelled = false;
    setIsLoadingAvailability(true);
    setAvailabilityWarning(false);

    fincasAPI
      .getFechasOcupadasPublicas(idFinca)
      .then((dates) => {
        if (cancelled) return;
        setOccupiedDates(
          new Set(
            (dates || [])
              .map((d) => normalizeOccupiedYmd(String(d)))
              .filter(Boolean)
          )
        );
      })
      .catch(() => {
        if (cancelled) return;
        setOccupiedDates(new Set());
        setAvailabilityWarning(true);
        toast.warning('No se pudieron cargar las fechas ya reservadas', {
          description: 'Confirma disponibilidad con OCCITOUR antes de pagar.',
        });
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAvailability(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, farm.id]);

  useEffect(() => {
    if (!bookingData.checkIn || !bookingData.checkOut) return;
    const cin = new Date(`${bookingData.checkIn}T12:00:00`);
    cin.setHours(0, 0, 0, 0);
    const cout = new Date(`${bookingData.checkOut}T12:00:00`);
    cout.setHours(0, 0, 0, 0);
    if (cout <= cin) {
      setBookingData((p) => ({ ...p, checkOut: '', nights: 1 }));
      return;
    }
    for (let d = new Date(cin); d < cout; d = addDays(d, 1)) {
      if (occupiedDates.has(toYMD(d))) {
        setBookingData((p) => ({ ...p, checkOut: '', nights: 1 }));
        toast.info('La salida ya no encaja: había noches ya reservadas en ese rango.');
        return;
      }
    }
  }, [occupiedDates, bookingData.checkIn, bookingData.checkOut]);

  /** Capacidad total de la finca (titular + acompañantes), mínimo 1. */
  const farmCapacity = useMemo(
    () => Math.max(1, Math.floor(Number(farm.maxGuests)) || 1),
    [farm.maxGuests]
  );
  /** Cuántas personas pueden ir además del titular. */
  const maxCompanionsAllowed = useMemo(() => Math.max(0, farmCapacity - 1), [farmCapacity]);

  useEffect(() => {
    if (!isOpen) return;
    setBookingData((prev) => {
      if (prev.companionCount <= maxCompanionsAllowed) return prev;
      return { ...prev, companionCount: maxCompanionsAllowed };
    });
  }, [isOpen, farm.id, maxCompanionsAllowed]);

  const totalSteps = 4; // Servicios y huéspedes, Info médica, Pago, Confirmación
  const totalGuests = 1 + Math.max(0, Math.min(bookingData.companionCount, maxCompanionsAllowed));
  const staySubtotal = farm.pricePerNight * bookingData.nights;
  const selectedServiceItems = useMemo(
    () => availableServices.filter((service) => bookingData.selectedServices.includes(service.id)),
    [availableServices, bookingData.selectedServices]
  );
  const requestedServicesSummary = selectedServiceItems.map((service) => service.name).join(', ');
  const amountToPayToday = useMemo(() => {
    const baseAmount = createdReservationTotal > 0 ? createdReservationTotal : staySubtotal;
    if (baseAmount <= 0) return 0;
    return paymentAmountMode === '50' ? Math.ceil(baseAmount / 2) : baseAmount;
  }, [createdReservationTotal, paymentAmountMode, staySubtotal]);

  const farmCheckInCalendarModifiers = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return {
      past: (date: Date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d < startOfToday;
      },
      reserved: (date: Date) => occupiedDates.has(toYMD(date)),
    };
  }, [occupiedDates]);

  /** Solo pasado: en salida no pintamos “ocupado” porque ese día no es noche tuya y confunde (p. ej. coincide con entrada de otro). */
  const farmCheckOutCalendarModifiers = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return {
      past: (date: Date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d < startOfToday;
      },
    };
  }, []);

  const farmCheckInCalendarModifiersClassNames = useMemo(
    () => ({
      past: 'rdp-day-past bg-slate-100 text-slate-400 line-through decoration-slate-400/90 opacity-65',
      reserved:
        'rdp-day-reserved bg-gray-200 text-gray-600 line-through decoration-gray-500 shadow-inner opacity-95 border border-gray-400/50',
    }),
    []
  );

  const farmCheckOutCalendarModifiersClassNames = useMemo(
    () => ({
      past: 'rdp-day-past bg-slate-100 text-slate-400 line-through decoration-slate-400/90 opacity-65',
    }),
    []
  );

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

  const checkInCalendarSelected = bookingData.checkIn
    ? new Date(`${bookingData.checkIn}T12:00:00`)
    : undefined;
  const checkOutCalendarSelected = bookingData.checkOut
    ? new Date(`${bookingData.checkOut}T12:00:00`)
    : undefined;

  const isFarmCheckInDisabled = (date: Date) => {
    const base = new Date(date);
    base.setHours(0, 0, 0, 0);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (base < startOfToday) return true;
    return occupiedDates.has(toYMD(base));
  };

  const isFarmCheckOutDisabled = (date: Date) => {
    const base = new Date(date);
    base.setHours(0, 0, 0, 0);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (base < startOfToday) return true;
    if (!bookingData.checkIn) return true;
    const cin = new Date(`${bookingData.checkIn}T12:00:00`);
    cin.setHours(0, 0, 0, 0);
    if (base <= cin) return true;
    for (let d = new Date(cin); d < base; d = addDays(d, 1)) {
      if (occupiedDates.has(toYMD(d))) return true;
    }
    return false;
  };

  const setCompanionCountFromInput = (raw: string) => {
    if (raw === '') {
      setBookingData((prev) => ({ ...prev, companionCount: 0 }));
      return;
    }
    const parsed = Number.parseInt(raw, 10);
    const n = Number.isFinite(parsed) ? parsed : 0;
    const clamped = Math.min(maxCompanionsAllowed, Math.max(0, n));
    setBookingData((prev) => ({ ...prev, companionCount: clamped }));
  };

  const bumpCompanionCount = (delta: number) => {
    setBookingData((prev) => {
      const cur = Math.max(0, Math.min(prev.companionCount, maxCompanionsAllowed));
      const next = Math.min(maxCompanionsAllowed, Math.max(0, cur + delta));
      if (delta > 0 && cur >= maxCompanionsAllowed && maxCompanionsAllowed >= 0) {
        toast.info(
          `Esta finca admite hasta ${farmCapacity} persona${farmCapacity !== 1 ? 's' : ''} en total (${maxCompanionsAllowed} acompañante${maxCompanionsAllowed !== 1 ? 's' : ''} además de ti).`
        );
      }
      return { ...prev, companionCount: next };
    });
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
      const file = e.target.files[0];
      if (file.size > MAX_PROOF_FILE_SIZE) {
        toast.error('El comprobante no puede superar los 5MB');
        e.target.value = '';
        return;
      }

      if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
        toast.error('Solo se permiten archivos PDF, JPG, PNG o WEBP');
        e.target.value = '';
        return;
      }

      if (String(file.name || '').trim().length > MAX_PROOF_FILE_NAME) {
        toast.error(`El nombre del comprobante no puede superar ${MAX_PROOF_FILE_NAME} caracteres`);
        e.target.value = '';
        return;
      }

      setBookingData(prev => ({
        ...prev,
        paymentProof: file
      }));
      toast.success('Comprobante cargado correctamente');
    }
  };

  const calculateTotal = () => {
    return staySubtotal;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!bookingData.checkIn || !bookingData.checkOut) {
        toast.error('Por favor selecciona las fechas de estadía');
        return;
      }
      const cinVal = new Date(`${bookingData.checkIn}T12:00:00`);
      cinVal.setHours(0, 0, 0, 0);
      const coutVal = new Date(`${bookingData.checkOut}T12:00:00`);
      coutVal.setHours(0, 0, 0, 0);
      for (let d = new Date(cinVal); d < coutVal; d = addDays(d, 1)) {
        if (occupiedDates.has(toYMD(d))) {
          toast.error('Hay noches ya reservadas en las fechas elegidas. Elige otro rango.');
          return;
        }
      }
      if (totalGuests > farmCapacity) {
        toast.error(`La finca permite máximo ${farmCapacity} persona${farmCapacity !== 1 ? 's' : ''} en esta reserva`);
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!user || user.role !== 'client') {
      toast.error('Debes iniciar sesión como cliente para registrar la reserva de finca');
      return;
    }

    if (!bookingData.paymentProof) {
      toast.error('Por favor adjunta el comprobante de pago');
      return;
    }

    const clientId = Number(user.id);
    if (!Number.isFinite(clientId) || clientId <= 0) {
      toast.error('No se pudo identificar el cliente autenticado');
      return;
    }

    setIsSubmitting(true);
    try {
      const comprobanteUrl = await fileToDataUrl(bookingData.paymentProof);
      const notes: string[] = [];
      if (bookingData.medicalIndications.trim()) {
        notes.push(`Indicaciones médicas: ${bookingData.medicalIndications.trim()}`);
      }
      if (bookingData.specialRequests.trim()) {
        notes.push(`Solicitudes especiales: ${bookingData.specialRequests.trim()}`);
      }
      if (requestedServicesSummary) {
        notes.push(`Servicios solicitados para coordinar: ${requestedServicesSummary}`);
      }
      const ac = Math.max(0, bookingData.companionCount);
      notes.push(
        `Huéspedes: ${1 + ac} persona${1 + ac > 1 ? 's' : ''} (${ac} acompañante${ac !== 1 ? 's' : ''} además del titular)`
      );

      const createdReserva = await reservasAPI.create({
        id_cliente: clientId,
        notas: notes.join(' | ') || `Reserva web de finca ${farm.name}`,
      });

      const reservaId = Number((createdReserva as any)?.data?.id_reserva ?? (createdReserva as any)?.id_reserva);
      if (!Number.isFinite(reservaId) || reservaId <= 0) {
        throw new Error('Se creó la reserva, pero no se pudo obtener su identificador.');
      }

      const fincaResponse = await reservasAPI.agregarFinca(reservaId, {
        id_finca: Number(farm.id),
        fecha_checkin: bookingData.checkIn,
        fecha_checkout: bookingData.checkOut,
        numero_noches: bookingData.nights,
        precio_por_noche: farm.pricePerNight,
      });

      const venta = (fincaResponse as any)?.venta ?? (fincaResponse as any)?.data?.venta ?? null;
      const montoTotalReserva = Number((fincaResponse as any)?.monto_total ?? venta?.monto_total ?? staySubtotal);
      const montoAbono = paymentAmountMode === '50' ? Math.ceil(montoTotalReserva / 2) : montoTotalReserva;

      if (!venta?.id_venta) {
        throw new Error('La reserva fue creada, pero no se pudo preparar la venta para el abono.');
      }

      const pagoResponse = await pagosAPI.create({
        id_venta: Number(venta.id_venta),
        id_reserva: reservaId,
        monto: montoAbono,
        metodo_pago: PAYMENT_METHOD_MAP[bookingData.paymentMethod],
        comprobante_url: comprobanteUrl,
        comprobante_nombre: bookingData.paymentProof.name,
        comprobante_tipo: bookingData.paymentProof.type || 'application/octet-stream',
        observaciones: requestedServicesSummary
          ? `Servicios solicitados por cliente: ${requestedServicesSummary}`
          : null,
      });

      const paymentId = Number((pagoResponse as any)?.data?.id_pago ?? (pagoResponse as any)?.id_pago);

      setCreatedReservationTotal(montoTotalReserva);
      setCreatedSaleId(Number(venta.id_venta));
      setRegisteredPaymentAmount(montoAbono);
      setRegisteredPaymentId(Number.isFinite(paymentId) ? paymentId : null);
      setBookingId(`#${reservaId}`);
      setStep(4);

      toast.success('¡Reserva registrada exitosamente!', {
        description: 'La reserva y el abono quedaron pendientes de revisión del comprobante.'
      });
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo completar la reserva de finca');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setBookingId('');
    setPaymentAmountMode('50');
    setRegisteredPaymentAmount(0);
    setRegisteredPaymentId(null);
    setCreatedSaleId(null);
    setCreatedReservationTotal(0);
    setBookingData({
      checkIn: '',
      checkOut: '',
      nights: 1,
      selectedServices: [],
      companionCount: 0,
      medicalIndications: '',
      specialRequests: '',
      paymentMethod: 'nequi',
      paymentProof: null
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/50">
      <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
        <Card className="my-4 flex w-full max-w-4xl min-h-0 flex-col bg-white shadow-xl border-2 sm:my-8 max-h-[min(100dvh-2rem,56rem)]">
        <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b bg-white pb-4">
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

        <CardContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
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

          {/* Paso 1: Fechas, servicios opcionales y número de acompañantes */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Fechas de Estadía</h4>

                {availabilityWarning ? (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    No pudimos cargar todas las reservas existentes. Las fechas en gris pueden estar incompletas:{' '}
                    <strong>confirma con OCCITOUR</strong> antes de pagar.
                  </div>
                ) : null}

                <p className="text-sm text-muted-foreground mb-4">
                  En <strong>entrada</strong>, el gris tachado incluye desde el check-in hasta el <strong>día de salida</strong>{' '}
                  de otra reserva (no permitimos nueva entrada ese mismo día). En <strong>salida</strong> no usamos ese
                  mismo gris: lo inválido con tu entrada sale{' '}
                  <span className="font-medium text-gray-600">deshabilitado</span>.
                </p>

                {isLoadingAvailability ? (
                  <p className="text-sm text-gray-500 py-6 text-center">Cargando disponibilidad de la finca…</p>
                ) : (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-4">
                    <div className="space-y-2">
                      <Label>Entrada *</Label>
                      <p className="text-sm text-gray-600">
                        {bookingData.checkIn
                          ? new Date(`${bookingData.checkIn}T12:00:00`).toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'short',
                              day: '2-digit',
                            })
                          : 'Selecciona en el calendario'}
                      </p>
                      <div className="rounded-xl border border-green-200 bg-white p-3 shadow-sm flex justify-center overflow-x-auto">
                        <BookingCalendar
                          mode="single"
                          weekStartsOn={1}
                          selected={checkInCalendarSelected}
                          onSelect={(date: Date | undefined) => {
                            if (!date) return;
                            handleDateChange('checkIn', toYMD(date));
                          }}
                          disabled={isFarmCheckInDisabled}
                          modifiers={farmCheckInCalendarModifiers}
                          modifiersClassNames={farmCheckInCalendarModifiersClassNames}
                          defaultMonth={checkInCalendarSelected || new Date()}
                          className="rounded-md"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Salida *</Label>
                      <p className="text-sm text-gray-600">
                        {!bookingData.checkIn ? (
                          'Primero elige la entrada'
                        ) : bookingData.checkOut ? (
                          new Date(`${bookingData.checkOut}T12:00:00`).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit',
                          })
                        ) : (
                          'Selecciona el día de salida'
                        )}
                      </p>
                      <div
                        className={`rounded-xl border border-green-200 bg-white p-3 shadow-sm flex justify-center overflow-x-auto ${
                          !bookingData.checkIn ? 'pointer-events-none opacity-50' : ''
                        }`}
                      >
                        <BookingCalendar
                          mode="single"
                          weekStartsOn={1}
                          selected={checkOutCalendarSelected}
                          onSelect={(date: Date | undefined) => {
                            if (!date) return;
                            if (!bookingData.checkIn) {
                              toast.error('Primero elige la fecha de entrada');
                              return;
                            }
                            handleDateChange('checkOut', toYMD(date));
                          }}
                          disabled={isFarmCheckOutDisabled}
                          modifiers={farmCheckOutCalendarModifiers}
                          modifiersClassNames={farmCheckOutCalendarModifiersClassNames}
                          defaultMonth={checkOutCalendarSelected || checkInCalendarSelected || new Date()}
                          className="rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {!isLoadingAvailability ? (
                  <div className="mb-6 flex flex-wrap justify-center gap-x-4 gap-y-2 border border-green-100 rounded-lg bg-green-50/50 px-3 py-2 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 rounded border border-green-300 bg-white shadow-sm" />
                      Disponible
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 rounded bg-slate-100 border border-slate-200 opacity-75" />
                      Pasado
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 rounded bg-gray-200 border border-gray-400/50 shadow-inner" />
                      Noche ocupada (entrada)
                    </span>
                    <span className="text-gray-500 max-w-[14rem] leading-snug">
                      En salida, bloqueos sin solape se ven como día deshabilitado (estilo atenuado).
                    </span>
                  </div>
                ) : null}

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

                <div className="space-y-3">
                  <h4 className="font-semibold">¿Cuántas personas van contigo?</h4>
                  <p className="text-sm text-muted-foreground">
                    Indica solo el <strong>número de acompañantes</strong> (no te cuentes a ti). No hace falta registrar nombre ni documento.
                  </p>
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companionCount">Número de acompañantes</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0 border-emerald-200"
                          disabled={bookingData.companionCount <= 0}
                          onClick={() => bumpCompanionCount(-1)}
                          aria-label="Quitar un acompañante"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          id="companionCount"
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={maxCompanionsAllowed}
                          className="w-24 text-center"
                          value={bookingData.companionCount}
                          onChange={(e) => setCompanionCountFromInput(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0 border-emerald-200"
                          disabled={bookingData.companionCount >= maxCompanionsAllowed}
                          onClick={() => bumpCompanionCount(1)}
                          aria-label="Añadir un acompañante"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
                      <Users className="mb-1 inline h-4 w-4 align-text-bottom" />
                      <span className="ml-1">
                        Total en la reserva: <strong>{totalGuests}</strong> persona
                        {totalGuests !== 1 ? 's' : ''}
                        {' '}(tú + {bookingData.companionCount} acompañante
                        {bookingData.companionCount !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    <strong>Límite según la finca:</strong> hasta <strong>{maxCompanionsAllowed}</strong> acompañante
                    {maxCompanionsAllowed !== 1 ? 's' : ''} · capacidad total{' '}
                    <strong>{farmCapacity}</strong> persona
                    {farmCapacity !== 1 ? 's' : ''} (tú + acompañantes).
                    {maxCompanionsAllowed === 0 ? (
                      <span className="block mt-1 text-amber-700">
                        Esta finca solo admite una persona por reserva (solo tú).
                      </span>
                    ) : null}
                  </p>
                </div>
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
                    <span className="font-medium">{totalGuests} persona{totalGuests !== 1 ? 's' : ''}</span>
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
                          {selectedServiceItems.map(service => {
                            if (!service) return null;
                            return (
                              <div key={service.id} className="flex justify-between text-amber-700">
                                <span>{service.name} (solicitud):</span>
                                <span>Se coordina luego</span>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                    
                    <Separator className="bg-blue-200" />
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Valor base de la estadía:</span>
                      <span className="text-xl font-bold text-green-600">
                        ${calculateTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h5 className="font-medium">Monto a consignar ahora</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentAmountMode('50')}
                      className={`rounded-lg border-2 p-4 text-left transition-all ${
                        paymentAmountMode === '50'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900">Abonar 50%</p>
                      <p className="text-sm text-gray-600 mt-1">
                        ${Math.ceil(calculateTotal() / 2).toLocaleString()}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentAmountMode('100')}
                      className={`rounded-lg border-2 p-4 text-left transition-all ${
                        paymentAmountMode === '100'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900">Pagar 100%</p>
                      <p className="text-sm text-gray-600 mt-1">
                        ${calculateTotal().toLocaleString()}
                      </p>
                    </button>
                  </div>

                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
                    Monto del comprobante que se registrará en abonos: <strong>${amountToPayToday.toLocaleString()}</strong>
                  </div>

                  {selectedServiceItems.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      Los servicios adicionales seleccionados se guardan como solicitud para coordinación posterior; el abono inicial se registra sobre la estadía de la finca.
                    </div>
                  )}
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
                              <p className="font-medium font-mono">{OCCITOURS_PAYMENT_INFO.bancolombiaNumeroCuenta}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Titular:</p>
                              <p className="font-medium">{OCCITOURS_PAYMENT_INFO.titular}</p>
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
                            {bookingData.paymentMethod === 'nequi'
                              ? OCCITOURS_PAYMENT_INFO.nequiNumero
                              : OCCITOURS_PAYMENT_INFO.bancolombiaNumeroCuenta}
                          </p>
                        </div>
                        <p className={`text-xs ${
                          bookingData.paymentMethod === 'nequi' ? 'text-purple-600' : 'text-red-600'
                        }`}>
                          A nombre de: {OCCITOURS_PAYMENT_INFO.titular}
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
                    <strong>Importante:</strong> Al confirmar se creará la reserva, la venta y el abono asociado con este comprobante. Todo quedará pendiente hasta que el staff revise y apruebe el pago.
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
                        <p>• {totalGuests} persona{totalGuests !== 1 ? 's' : ''}</p>
                        <p>• Venta creada: {createdSaleId ? `#${createdSaleId}` : 'Pendiente'}</p>
                        <p>• Valor reserva: ${createdReservationTotal.toLocaleString()}</p>
                        <p>• Abono enviado: ${registeredPaymentAmount.toLocaleString()}</p>
                        {registeredPaymentId ? <p>• Abono registrado: #{registeredPaymentId}</p> : null}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg max-w-md mx-auto mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Próximos pasos:</strong><br />
                    El staff revisará el comprobante en abonos. Cuando lo aprueben, la venta y la reserva se actualizarán automáticamente.
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
          <div className="flex shrink-0 justify-between border-t bg-gray-50 p-6">
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
    </div>
  );
}