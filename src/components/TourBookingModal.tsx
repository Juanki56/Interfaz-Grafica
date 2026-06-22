import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Calendar, Users, Clock, MapPin, DollarSign, CreditCard, User, Phone, Mail, UtensilsCrossed, Coffee, Soup, Pizza, Check, Bus, Home, Utensils, QrCode, CheckCircle2, Clock3, AlertCircle, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { OccitoursPaymentBankDetails } from './OccitoursPaymentBankDetails';
import { Checkbox } from './ui/checkbox';
import { Calendar as BookingCalendar } from './ui/calendar';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import {
  programacionAPI,
  reservasAPI,
  rutasAPI,
  solicitudesPersonalizadasAPI,
  extractRutaServiciosPredefinidos,
  extractRutaServiciosOpcionales,
  extractRecomendacionesParticipantes,
  type Ruta,
  type SolicitudPersonalizada,
} from '../services/api';
import { clientDisplayEstadoPagoVenta, montoPagoUnicoSolicitudPersonalizada } from '../utils/clientPaymentFlow';
import { durationCalendarDaysFromRutaHoras, formatRutaDuracionHoras } from '../utils/routeDateCalendar';
import {
  documentoTitularCompletoValidoParaReserva,
  MENSAJE_ACTUALIZAR_DOCUMENTO_PERFIL,
} from '../utils/documentIdentityValidation';
import { titularDocumentoValidoParaReservar } from '../utils/titularDocumentoReserva';
import { OCCITOURS_PAYMENT_INFO } from '../utils/occitoursPaymentBankInfo';

function toYMD(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Normaliza 'YYYY-MM-DD' del API (puede venir con hora o ISO). */
function normalizeOccupiedYmd(value: string): string {
  const s = String(value).trim();
  if (!s) return '';
  const ymd = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return toYMD(parsed);
  return '';
}

const SOLICITUD_PAGO_PROOF_MAX = 5 * 1024 * 1024;
const SOLICITUD_PAGO_PROOF_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

/** Normaliza 'YYYY-MM-DD' del API (puede venir con hora o ISO). */


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

interface CompanionDraft {
  nombre: string;
  apellido: string;
  tipo_documento: string;
  numero_documento: string;
  telefono: string;
  fecha_nacimiento: string;
}

export function TourBookingModal({ isOpen, onClose, tour, type = 'ruta', availableRestaurants = [] }: TourBookingModalProps) {
  const { user } = useAuth();
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
  const [routeDetail, setRouteDetail] = useState<Ruta | null>(null);
  const [isLoadingRouteDetail, setIsLoadingRouteDetail] = useState(false);
  const [selectedOptionalServices, setSelectedOptionalServices] = useState<Array<{ id_servicio: number; cantidad: number }>>([]);
  const [companionDetails, setCompanionDetails] = useState<CompanionDraft[]>([]);

  const [paymentData, setPaymentData] = useState({
    monto: '',
    metodo_pago: 'Transferencia',
    numero_transaccion: '',
    comprobante_url: '',
    comprobante_nombre: '',
    comprobante_tipo: '',
    observaciones: '',
  });
  const solicitudPagoProofRef = useRef<HTMLInputElement>(null);

  const montoPagoUnicoRutaPersonalizada = useMemo(
    () => montoPagoUnicoSolicitudPersonalizada(createdSolicitud),
    [createdSolicitud],
  );

  const [occupiedDates, setOccupiedDates] = useState<Set<string>>(new Set());
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityWarning, setAvailabilityWarning] = useState(false);

  /** Días naturales en calendario bloqueados según horas de la ruta (mín. 1). */
  const calendarSpanDays = useMemo(() => {
    const h = routeDetail?.duracion_dias;
    if (h != null && Number.isFinite(Number(h)) && Number(h) > 0) {
      return durationCalendarDaysFromRutaHoras(h);
    }
    return 1;
  }, [routeDetail?.duracion_dias]);

  const bookingCalendarModifiers = useMemo(() => {
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

  const bookingCalendarModifiersClassNames = useMemo(
    () => ({
      past: 'rdp-day-past bg-slate-100 text-slate-400 line-through decoration-slate-400/90 opacity-65',
      reserved:
        'rdp-day-reserved bg-gray-200 text-gray-600 line-through decoration-gray-500 shadow-inner opacity-95 border border-gray-400/50',
    }),
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    if (type !== 'ruta') return;

    const idRuta = Number(tour.id);
    if (!Number.isFinite(idRuta) || idRuta <= 0) return;

    let cancelled = false;
    setIsLoadingAvailability(true);
    setAvailabilityWarning(false);
    programacionAPI
      .getFechasOcupadasRuta(idRuta)
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
          description: 'Reintenta o confirma disponibilidad con OCCITOUR antes de enviar la solicitud.',
        });
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingAvailability(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, tour.id, type]);

  useEffect(() => {
    const companionsCount = Math.max(0, Number(bookingData.companions || 0));
    setCompanionDetails((prev) => {
      const next = Array.from({ length: companionsCount }, (_, index) => (
        prev[index] || {
          nombre: '',
          apellido: '',
          tipo_documento: 'CC',
          numero_documento: '',
          telefono: '',
          fecha_nacimiento: '',
        }
      ));
      return next;
    });
  }, [bookingData.companions]);

  useEffect(() => {
    if (!isOpen || type !== 'ruta') return;

    const idRuta = Number(tour.id);
    if (!Number.isFinite(idRuta) || idRuta <= 0) return;

    let cancelled = false;
    setIsLoadingRouteDetail(true);
    Promise.all([rutasAPI.getById(idRuta).catch(() => null), rutasAPI.getActivaById(idRuta).catch(() => null)])
      .then(([rById, rActiva]) => {
        if (cancelled) return;
        const merged =
          rById || rActiva
            ? ({
                ...(rActiva as object),
                ...(rById as object),
                id_ruta: idRuta,
              } as Ruta)
            : null;
        setRouteDetail(merged);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingRouteDetail(false);
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
    setSelectedOptionalServices([]);
    setCompanionDetails([]);
    setPaymentAmount('50'); // Resetear el monto de pago
    setPaymentData({
      monto: '',
      metodo_pago: 'Transferencia',
      numero_transaccion: '',
      comprobante_url: '',
      comprobante_nombre: '',
      comprobante_tipo: '',
      observaciones: '',
    });
    if (solicitudPagoProofRef.current) solicitudPagoProofRef.current.value = '';
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

  const handleSolicitudPagoProofChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > SOLICITUD_PAGO_PROOF_MAX) {
      toast.error('El archivo no debe exceder 5 MB.');
      event.target.value = '';
      return;
    }
    if (!SOLICITUD_PAGO_PROOF_TYPES.includes(file.type)) {
      toast.error('Solo se permiten archivos PDF, JPG, PNG o WEBP.');
      event.target.value = '';
      return;
    }

    if (String(file.name || '').trim().length > SOLICITUD_PAGO_PROOF_NAME_MAX) {
      toast.error(`El nombre del comprobante no puede superar ${SOLICITUD_PAGO_PROOF_NAME_MAX} caracteres.`);
      event.target.value = '';
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (!String(dataUrl || '').trim()) throw new Error('No se pudo procesar el archivo.');
      setPaymentData((p) => ({
        ...p,
        comprobante_url: dataUrl,
        comprobante_nombre: file.name,
        comprobante_tipo: file.type || 'application/octet-stream',
      }));
      toast.success('Comprobante cargado.');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo cargar el comprobante.');
      event.target.value = '';
    }
  };

  const clearSolicitudPagoProof = () => {
    setPaymentData((p) => ({ ...p, comprobante_url: '', comprobante_nombre: '', comprobante_tipo: '' }));
    if (solicitudPagoProofRef.current) solicitudPagoProofRef.current.value = '';
  };

  const formatSolicitudEstado = (estado?: string | null) => {
    const value = String(estado ?? '').trim();
    if (!value) return '—';
    const lowered = value.toLowerCase();
    if (lowered.includes('aprobadaparapago') || lowered.includes('aprobada')) return 'Aprobada para pago';
    if (lowered.includes('pend')) return 'Pendiente de revisión';
    if (lowered.includes('coti')) return 'Cotizada';
    if (lowered.includes('rech')) return 'Rechazada';
    if (lowered.includes('conv') || lowered.includes('program')) return 'Programada';
    return value;
  };

  const solicitudHabilitadaParaPago = (estado?: string | null) => {
    const normalized = String(estado ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');
    return normalized.includes('aprobadaparapago') || normalized === 'cotizada';
  };

  const formatCurrency = (value?: number | string | null) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '$0';
    return `$${numeric.toLocaleString()}`;
  };

  const toggleOptionalService = (id_servicio: number, cantidad: number) => {
    setSelectedOptionalServices((prev) => {
      const exists = prev.some((item) => item.id_servicio === id_servicio);
      if (exists) return prev.filter((item) => item.id_servicio !== id_servicio);
      return [...prev, { id_servicio, cantidad: Math.max(1, cantidad || 1) }];
    });
  };

  const updateCompanionField = (index: number, field: keyof CompanionDraft, value: string) => {
    setCompanionDetails((prev) =>
      prev.map((companion, companionIndex) =>
        companionIndex === index ? { ...companion, [field]: value } : companion
      )
    );
  };

  const submitRutaSolicitud = async () => {
    const idRuta = Number(tour.id);
    if (Number.isNaN(idRuta)) {
      toast.error('No se pudo enviar la solicitud', { description: 'ID de ruta inválido.' });
      return;
    }

    if (user?.role === 'client') {
      const documentoOk = await titularDocumentoValidoParaReservar(user);
      if (!documentoOk) {
        toast.error(MENSAJE_ACTUALIZAR_DOCUMENTO_PERFIL);
        return;
      }
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

    for (let index = 0; index < companionDetails.length; index += 1) {
      const companion = companionDetails[index];
      if (!companion?.nombre.trim() || !companion?.apellido.trim()) {
        toast.error(`Completa nombre y apellido del acompañante ${index + 1}`);
        return;
      }
      if (
        !documentoTitularCompletoValidoParaReserva(
          companion?.tipo_documento,
          companion?.numero_documento,
        )
      ) {
        toast.error(
          `El documento del acompañante ${index + 1} no es válido (tipo y número reales, sin solo “-”).`,
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const created = await solicitudesPersonalizadasAPI.create({
        id_ruta: idRuta,
        fecha_deseada: bookingData.date,
        hora_deseada: bookingData.time,
        cantidad_personas: cantidadPersonas,
        observaciones: bookingData.specialRequests?.trim() || undefined,
        servicios_opcionales: selectedOptionalServices,
      });

      const createdId: number | undefined =
        (created as any)?.data?.solicitud?.id_solicitud_personalizada ??
        (created as any)?.data?.solicitud?.id ??
        (created as any)?.data?.id_solicitud_personalizada;

      if (createdId != null) {
        const full = await solicitudesPersonalizadasAPI.getById(Number(createdId));
        if (full?.id_reserva && companionDetails.length > 0) {
          const idReserva = Number(full.id_reserva);
          const documentoAntesAcompanantes = await titularDocumentoValidoParaReservar(user, {
            idReserva,
          });
          if (!documentoAntesAcompanantes) {
            toast.error(MENSAJE_ACTUALIZAR_DOCUMENTO_PERFIL);
            return;
          }
          await Promise.all(
            companionDetails.map((companion) =>
              reservasAPI.agregarAcompanante(idReserva, {
                nombre: companion.nombre.trim(),
                apellido: companion.apellido.trim(),
                tipo_documento: companion.tipo_documento || null,
                numero_documento: companion.numero_documento.trim() || null,
                telefono: companion.telefono.trim() || null,
                fecha_nacimiento: companion.fecha_nacimiento || null,
              })
            )
          );
        }
        setCreatedSolicitud(full);
      } else {
        const fallbackSolicitud = (created as any)?.data?.solicitud as SolicitudPersonalizada | undefined;
        if (fallbackSolicitud) setCreatedSolicitud(fallbackSolicitud);
      }

      toast.success('Solicitud enviada', {
        description:
          companionDetails.length > 0
            ? 'Quedó pendiente de revisión y se registraron los acompañantes en la reserva.'
            : 'Quedó pendiente de revisión. El asesor debe aprobarla antes de habilitar el pago.',
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
    const predefinidos = extractRutaServiciosPredefinidos(routeDetail);
    const opcionales = extractRutaServiciosOpcionales(routeDetail);
    const totalBaseEstimado = Math.max(0, Number(routeDetail?.precio_base ?? tour.price ?? 0)) * totalPeople;
    const totalPredefinidos = predefinidos.reduce((acc, item) => {
      const cantidad = Math.max(1, Number(item?.cantidad_default || 1));
      const precio = Math.max(0, Number(item?.servicio?.precio || 0));
      return acc + cantidad * precio;
    }, 0);
    const totalOpcionales = opcionales.reduce((acc, item) => {
      const selected = selectedOptionalServices.find((service) => service.id_servicio === item.id_servicio);
      if (!selected) return acc;
      const cantidad = Math.max(1, Number(selected.cantidad || item.cantidad_default || 1));
      const precio = Math.max(0, Number(item?.servicio?.precio || 0));
      return acc + cantidad * precio;
    }, 0);
    const totalEstimado = totalBaseEstimado + totalPredefinidos + totalOpcionales;

    const selectedDate = bookingData.date ? new Date(`${bookingData.date}T00:00:00`) : undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isStartDateDisabled = (date: Date) => {
      const base = new Date(date);
      base.setHours(0, 0, 0, 0);
      if (base < today) return true;

      // Bloqueo por rango: según horas de la ruta puede abarcar varios días naturales; bloquear si el rango cruza ocupados.
      for (let i = 0; i < calendarSpanDays; i += 1) {
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
                      {routeDetail?.duracion_dias != null &&
                      Number.isFinite(Number(routeDetail.duracion_dias)) &&
                      Number(routeDetail.duracion_dias) > 0
                        ? formatRutaDuracionHoras(routeDetail.duracion_dias)
                        : tour.duration}
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

            {type === 'ruta' ? (
              <div className="mb-6 rounded-lg border border-teal-200 bg-teal-50/90 px-4 py-4">
                <h4 className="font-semibold text-teal-900 mb-2">Recomendaciones para tu salida</h4>
                {isLoadingRouteDetail ? (
                  <p className="text-sm text-gray-500">Cargando recomendaciones de la ruta…</p>
                ) : extractRecomendacionesParticipantes(routeDetail) ? (
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {extractRecomendacionesParticipantes(routeDetail)}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Aún no hay recomendaciones publicadas para esta ruta en el sistema, o el servidor no las está
                    enviando. Pide detalles a OCCITOUR o revisa la ficha completa en <strong>Rutas</strong> del menú.
                  </p>
                )}
              </div>
            ) : null}

            {!createdSolicitud ? (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-4">Detalles de la solicitud</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3 md:col-span-2">
                      <Label htmlFor="date">Fecha de salida *</Label>
                      {availabilityWarning ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                          No pudimos cargar las fechas ya reservadas. Las mostradas pueden estar incompletas:{' '}
                          <strong>confirma con OCCITOUR</strong> o reabre el formulario para reintentar.
                        </div>
                      ) : null}
                      <p className="text-sm text-gray-600">
                        Fecha elegida:{' '}
                        <span className="font-medium text-gray-900">
                          {formatSelectedDate(selectedDate)}
                        </span>
                      </p>
                      <div className="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
                        {isLoadingAvailability ? (
                          <p className="text-sm text-gray-500 py-10 text-center">Cargando calendario de disponibilidad…</p>
                        ) : (
                          <>
                            <div className="flex justify-center overflow-x-auto">
                              <BookingCalendar
                                mode="single"
                                weekStartsOn={1}
                                selected={selectedDate}
                                onSelect={(date) => {
                                  if (!date) return;
                                  handleInputChange('date', toYMD(date));
                                }}
                                disabled={isStartDateDisabled}
                                modifiers={bookingCalendarModifiers}
                                modifiersClassNames={bookingCalendarModifiersClassNames}
                                defaultMonth={selectedDate || new Date()}
                                className="rounded-md"
                              />
                            </div>
                            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-green-100 pt-3 text-xs text-gray-600">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="h-3.5 w-3.5 rounded border border-green-300 bg-white shadow-sm" />
                                Disponible
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <span className="h-3.5 w-3.5 rounded bg-slate-100 border border-slate-200 line-through opacity-75 text-[0px]">
                                  —
                                </span>
                                Pasado
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <span className="h-3.5 w-3.5 rounded bg-gray-200 border border-dashed border-gray-400 shadow-inner" />
                                Día reservado u ocupado
                              </span>
                              <span className="inline-flex items-center gap-1.5 w-full sm:w-auto justify-center text-gray-500">
                                Otros días en gris: tu viaje chocaría con reservas existentes según la duración.
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      {calendarSpanDays > 1 ? (
                        <p className="text-xs text-gray-500">
                          Según la duración en horas de la ruta, la salida puede ocupar {calendarSpanDays} día
                          {calendarSpanDays === 1 ? '' : 's'} natural
                          {calendarSpanDays === 1 ? '' : 'es'} en calendario: si cualquier fecha de ese rango ya está
                          ocupada, no podrás iniciar la salida en una fecha que lo cruce.
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Cada día marcado como ocupado corresponde a salidas ya programadas o solicitudes que usan esa
                          fecha para esta misma ruta.
                        </p>
                      )}
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
                        <SelectContent disablePortal>
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

                {companionDetails.length > 0 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Datos de acompañantes</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Nombre, apellido y número de documento son obligatorios por cada acompañante.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {companionDetails.map((companion, index) => (
                        <div key={`companion-${index}`} className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <h5 className="font-medium text-gray-900">Acompañante {index + 1}</h5>
                            <Badge variant="outline">Teléfono opcional</Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Nombre *</Label>
                              <Input
                                value={companion.nombre}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[0-9]/g, '').slice(0, 50);
                                  updateCompanionField(index, 'nombre', val);
                                }}
                                placeholder="Ej: Laura"
                                maxLength={50}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Apellido *</Label>
                              <Input
                                value={companion.apellido}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[0-9]/g, '').slice(0, 50);
                                  updateCompanionField(index, 'apellido', val);
                                }}
                                placeholder="Ej: Gómez"
                                maxLength={50}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Tipo de documento</Label>
                              <Select
                                value={companion.tipo_documento}
                                onValueChange={(value) => updateCompanionField(index, 'tipo_documento', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona" />
                                </SelectTrigger>
                                <SelectContent disablePortal>
                                  <SelectItem value="CC">CC</SelectItem>
                                  <SelectItem value="TI">TI</SelectItem>
                                  <SelectItem value="CE">CE</SelectItem>
                                  <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Número de documento *</Label>
                              <Input
                                value={companion.numero_documento}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 15);
                                  updateCompanionField(index, 'numero_documento', val);
                                }}
                                placeholder="Ej: 123456789"
                                maxLength={15}
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Teléfono</Label>
                              <Input
                                value={companion.telefono}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 15);
                                  updateCompanionField(index, 'telefono', val);
                                }}
                                placeholder="Ej: 3001234567"
                                maxLength={15}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Fecha de nacimiento</Label>
                              <Input
                                type="date"
                                value={companion.fecha_nacimiento}
                                onChange={(e) => updateCompanionField(index, 'fecha_nacimiento', e.target.value)}
                                max={new Date().toISOString().split("T")[0]}
                                min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split("T")[0]}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                <div className="space-y-4">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <h5 className="font-semibold text-green-900">Servicios incluidos en la ruta</h5>
                    <p className="text-sm text-green-800 mt-1">
                      Se toman directamente desde la configuración de la ruta para que la solicitud salga coherente desde el inicio.
                    </p>
                  </div>

                  {isLoadingRouteDetail ? (
                    <div className="text-sm text-gray-500">Cargando servicios de la ruta…</div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h6 className="font-medium text-gray-900">Incluidos con la ruta</h6>
                        {predefinidos.length > 0 ? (
                          predefinidos.map((servicio) => (
                            <div
                              key={servicio.id_ruta_servicio_predefinido ?? `${servicio.id_servicio}-pre`}
                              className="rounded-lg border border-green-100 bg-white p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-medium text-gray-900">{servicio.servicio?.nombre || `Servicio #${servicio.id_servicio}`}</p>
                                  <p className="text-xs text-gray-500">
                                    Cantidad por defecto: {servicio.cantidad_default}
                                  </p>
                                </div>
                                <Badge className="bg-green-100 text-green-800">Incluido</Badge>
                              </div>
                              {servicio.servicio?.precio != null && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Referencia: {formatCurrency(servicio.servicio.precio)}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                            Esta ruta no muestra servicios incluidos en el detalle.
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <h6 className="font-medium text-gray-900">Opcionales</h6>
                        {opcionales.length > 0 ? (
                          opcionales.map((servicio) => {
                            const checked = selectedOptionalServices.some((item) => item.id_servicio === servicio.id_servicio);
                            return (
                              <label
                                key={servicio.id_ruta_servicio_opcional ?? `${servicio.id_servicio}-opc`}
                                className="flex items-start gap-3 rounded-lg border border-amber-100 bg-white p-3 cursor-pointer"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => toggleOptionalService(servicio.id_servicio, servicio.cantidad_default)}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="font-medium text-gray-900">{servicio.servicio?.nombre || `Servicio #${servicio.id_servicio}`}</p>
                                    <Badge className="bg-amber-100 text-amber-800">Opcional</Badge>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Cantidad sugerida: {servicio.cantidad_default} · {formatCurrency(servicio.servicio?.precio)}
                                  </p>
                                </div>
                              </label>
                            );
                          })
                        ) : (
                          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                            Esta ruta no tiene servicios opcionales registrados.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h5 className="font-semibold text-blue-900">Resumen estimado</h5>
                  <div className="mt-3 space-y-2 text-sm text-blue-900">
                    <div className="flex items-center justify-between">
                      <span>Base de la ruta</span>
                      <span>{formatCurrency(totalBaseEstimado)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Servicios predefinidos</span>
                      <span>{formatCurrency(totalPredefinidos)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Servicios opcionales seleccionados</span>
                      <span>{formatCurrency(totalOpcionales)}</span>
                    </div>
                    <Separator className="bg-blue-200" />
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total estimado</span>
                      <span>{formatCurrency(totalEstimado)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Primero el asesor revisa y aprueba la solicitud. Solo después de eso se habilita el pago con comprobante.
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
                        <span className="font-medium">
                          {clientDisplayEstadoPagoVenta('Ruta', createdSolicitud.venta_estado_pago)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {createdSolicitud.id_solicitud_personalizada &&
                createdSolicitud.id_venta != null &&
                solicitudHabilitadaParaPago(createdSolicitud.estado) &&
                String(createdSolicitud.venta_estado_pago || '') !== 'Pagado' ? (
                  <div className="border border-green-200 rounded-lg p-4 bg-white">
                    <h4 className="font-semibold text-green-800 mb-3">Registrar pago (con comprobante)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Monto a pagar (total de la venta)</Label>
                        <p className="text-lg font-semibold text-green-900">
                          ${Number(montoPagoUnicoRutaPersonalizada || 0).toLocaleString('es-CO')}
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          El comprobante debe corresponder al <strong>pago único</strong> por el total pendiente. En rutas
                          personalizadas <strong>no hay abonos parciales</strong> (solo en reservas de finca).
                        </p>
                      </div>

                      <OccitoursPaymentBankDetails className="md:col-span-2" />

                      <div className="space-y-2">
                        <Label>Método de pago</Label>
                        <Select
                          value={paymentData.metodo_pago}
                          onValueChange={(value) => setPaymentData((p) => ({ ...p, metodo_pago: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                          <SelectContent disablePortal>
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

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="tour-solicitud-comprobante">Comprobante (imagen o PDF) *</Label>
                        <Input
                          id="tour-solicitud-comprobante"
                          ref={solicitudPagoProofRef}
                          type="file"
                          accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                          className="cursor-pointer"
                          onChange={handleSolicitudPagoProofChange}
                        />
                        <p className="text-xs text-gray-500">
                          Máx. 5 MB. PDF, JPG o PNG. El asesor verificará el comprobante cuando lo envíes.
                        </p>
                        {paymentData.comprobante_nombre ? (
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                            <span className="truncate font-medium" title={paymentData.comprobante_nombre}>
                              {paymentData.comprobante_nombre}
                            </span>
                            <Button type="button" variant="outline" size="sm" onClick={clearSolicitudPagoProof}>
                              Quitar archivo
                            </Button>
                          </div>
                        ) : null}
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

                    {/* Devoluciones Warning */}
                    <div className="bg-emerald-50 border-2 border-emerald-500 rounded-lg p-5 mt-6 mb-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-3">
                          <h4 className="font-bold text-emerald-800 text-lg">Política de Devoluciones y Cancelaciones</h4>
                          <div className="text-emerald-700 text-sm leading-relaxed space-y-2">
                            <p>Al confirmar tu reserva, aseguras tu cupo en la experiencia.</p>
                            <p>
                              Para garantizar la organización del viaje, los pagos <strong>no aplican para reembolso</strong> en caso de cancelación o no asistencia. En situaciones de fuerza mayor, podremos reprogramar tu experiencia.
                            </p>
                            <p>Si tienes dudas, estamos para ayudarte.</p>
                          </div>
                          <div className="pt-2">
                            <a 
                              href="https://api.whatsapp.com/send/?phone=573043898018&text&type=phone_number&app_absent=0" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-4 py-2.5 rounded-md font-medium transition-colors border border-emerald-300 shadow-sm"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Contactar por WhatsApp (+57 304 389 8018)
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button
                        className="bg-green-700 hover:bg-green-800"
                        disabled={isSubmitting}
                        onClick={async () => {
                          try {
                            if (!String(paymentData.comprobante_url || '').trim()) {
                              toast.error('Debes adjuntar el comprobante (PDF o imagen).');
                              return;
                            }

                            if (String(paymentData.metodo_pago || '').trim().length > SOLICITUD_PAGO_METODO_MAX) {
                              toast.error(`El método de pago no puede exceder ${SOLICITUD_PAGO_METODO_MAX} caracteres.`);
                              return;
                            }

                            if (String(paymentData.numero_transaccion || '').trim().length > SOLICITUD_PAGO_TRANSACCION_MAX) {
                              toast.error(`El número de transacción no puede exceder ${SOLICITUD_PAGO_TRANSACCION_MAX} caracteres.`);
                              return;
                            }

                            if (String(paymentData.comprobante_nombre || '').trim().length > SOLICITUD_PAGO_PROOF_NAME_MAX) {
                              toast.error(`El nombre del comprobante no puede superar ${SOLICITUD_PAGO_PROOF_NAME_MAX} caracteres.`);
                              return;
                            }

                            setIsSubmitting(true);
                            await solicitudesPersonalizadasAPI.crearPago(createdSolicitud.id_solicitud_personalizada, {
                              metodo_pago: paymentData.metodo_pago || null,
                              numero_transaccion: paymentData.numero_transaccion?.trim() || null,
                              comprobante_url: paymentData.comprobante_url.trim(),
                              comprobante_nombre: paymentData.comprobante_nombre?.trim() || null,
                              comprobante_tipo: paymentData.comprobante_tipo?.trim() || null,
                              observaciones: paymentData.observaciones?.trim() || null,
                            });

                            toast.success('Pago registrado', {
                              description: 'Quedó pendiente de verificación.',
                            });
                            setPaymentData({
                              monto: '',
                              metodo_pago: 'Transferencia',
                              numero_transaccion: '',
                              comprobante_url: '',
                              comprobante_nombre: '',
                              comprobante_tipo: '',
                              observaciones: '',
                            });
                            if (solicitudPagoProofRef.current) solicitudPagoProofRef.current.value = '';
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

                {createdSolicitud.id_solicitud_personalizada && !solicitudHabilitadaParaPago(createdSolicitud.estado) ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <h4 className="font-semibold text-amber-900">Pago aún no habilitado</h4>
                    <p className="text-sm text-amber-800 mt-1">
                      Tu solicitud está en revisión. Cuando el asesor la apruebe y ajuste la cotización, aquí mismo se habilitará el registro del pago.
                    </p>
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
                      {routeDetail?.duracion_dias != null &&
                      Number.isFinite(Number(routeDetail.duracion_dias)) &&
                      Number(routeDetail.duracion_dias) > 0
                        ? formatRutaDuracionHoras(routeDetail.duracion_dias)
                        : tour.duration}
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
                      <SelectContent disablePortal>
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
                            <SelectContent disablePortal>
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
                  <h5 className="font-medium">Información de pago</h5>

                  <OccitoursPaymentBankDetails />

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 p-6 rounded-lg">
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-2">
                        <QrCode className="w-8 h-8 text-white" />
                      </div>
                      
                      <div>
                        <h6 className="font-semibold text-purple-900 mb-2">Nequi / QR</h6>
                        <p className="text-sm text-purple-700 mb-4">
                          Si pagas por Nequi puedes usar el código QR cuando esté disponible, o transfieres al mismo titular/Cuenta
                          Bancolombia indicados arriba.
                        </p>
                      </div>
                      
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
                        <p className="text-sm text-purple-800 font-medium">Número de referencia Nequi:</p>
                        <div className="bg-white p-3 rounded-lg border-2 border-purple-300">
                          <p className="text-lg font-mono font-bold text-purple-900">{OCCITOURS_PAYMENT_INFO.nequiNumero}</p>
                        </div>
                        <p className="text-xs text-purple-600">Beneficiario: {OCCITOURS_PAYMENT_INFO.titular}</p>
                      </div>
                      
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">
                          <strong>Importante:</strong> Después de realizar el pago, tu reserva quedará en estado &quot;Pendiente&quot; hasta que confirmemos la transacción. Recibirás un correo de confirmación.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Devoluciones Warning */}
                <div className="bg-emerald-50 border-2 border-emerald-500 rounded-lg p-5 mt-6 mb-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-3">
                      <h4 className="font-bold text-emerald-800 text-lg">Política de Devoluciones y Cancelaciones</h4>
                      <div className="text-emerald-700 text-sm leading-relaxed space-y-2">
                        <p>Al confirmar tu reserva, aseguras tu cupo en la experiencia.</p>
                        <p>
                          Para garantizar la organización del viaje, los pagos <strong>no aplican para reembolso</strong> en caso de cancelación o no asistencia. En situaciones de fuerza mayor, podremos reprogramar tu experiencia.
                        </p>
                        <p>Si tienes dudas, estamos para ayudarte.</p>
                      </div>
                      <div className="pt-2">
                        <a 
                          href="https://api.whatsapp.com/send/?phone=573043898018&text&type=phone_number&app_absent=0" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-4 py-2.5 rounded-md font-medium transition-colors border border-emerald-300 shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Contactar por WhatsApp (+57 304 389 8018)
                        </a>
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