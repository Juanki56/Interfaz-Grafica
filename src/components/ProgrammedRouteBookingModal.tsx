import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  MapPin,
  MessageCircle,
  QrCode,
  Sparkles,
  UserCircle,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import {
  authAPI,
  reservasAPI,
  rutasAPI,
  extractRutaServiciosPredefinidos,
  extractRecomendacionesParticipantes,
  type PagoReservaProgramada,
  type Programacion,
  type Ruta,
  type RutaServicioPredefinido,
  type VentaReserva,
} from '../services/api';
import { estadoSalidaParaCliente } from '../utils/programacionEstadoCliente';
import {
  documentoTitularCompletoValidoParaReserva,
  extraerDocumentoTitularDesdePerfil,
  MENSAJE_ACTUALIZAR_DOCUMENTO_PERFIL,
} from '../utils/documentIdentityValidation';
import { montoPagoUnicoSalidaProgramada } from '../utils/clientPaymentFlow';
import { CATALOG_IMAGE_PLACEHOLDER } from '../utils/catalogPlaceholders';
import { formatRutaDuracionHoras } from '../utils/routeDateCalendar';
import { formatDateDisplay, formatDateTimeDisplay, formatTimeDisplay } from '../utils/dateTimeDisplay';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { OccitoursPaymentBankDetails } from './OccitoursPaymentBankDetails';
import { OCCITOURS_PAYMENT_INFO } from '../utils/occitoursPaymentBankInfo';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

interface CompanionFormState {
  nombre: string;
  apellido: string;
  tipo_documento: string;
  numero_documento: string;
  telefono: string;
  fecha_nacimiento: string;
}

interface ProgrammedRouteBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Redirige a Mi Perfil cuando falta documento del titular. */
  onGoToProfile?: () => void;
  programacion: Programacion | null;
  ruta?: Ruta | null;
  onSuccess?: () => Promise<void> | void;
  /** Vista de página completa (p. ej. flujo desde el home) en lugar de diálogo. */
  layout?: 'dialog' | 'page';
}

interface CreatedCheckoutState {
  id_reserva: number;
  monto_total: number;
  venta: VentaReserva | null;
}

const MAX_PROOF_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_PROOF_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const MAX_PROOF_FILE_NAME = 180;
const MAX_METODO_PAGO = 40;
const MAX_NUMERO_TRANSACCION = 80;

function normalizeMultilineText(value?: string | null): string {
  const t = String(value || '').trim();
  return t || '';
}

const EMPTY_COMPANION: CompanionFormState = {
  nombre: '',
  apellido: '',
  tipo_documento: 'CC',
  numero_documento: '',
  telefono: '',
  fecha_nacimiento: '',
};

function parseApiDate(value?: string | null): Date | null {
  if (!value) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  const direct = new Date(normalized);
  if (!Number.isNaN(direct.getTime())) return direct;

  const fallback = new Date(`${normalized.slice(0, 10)}T00:00:00`);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function formatDate(value?: string | null): string {
  return formatDateDisplay(value, { fallback: 'Por definir' });
}

function formatCurrency(value?: number | string | null): string {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return 'Por confirmar';
  return `$${amount.toLocaleString('es-CO')}`;
}

function getReservationId(payload: any): number | null {
  const candidate =
    payload?.data?.id_reserva ??
    payload?.id_reserva ??
    payload?.data?.data?.id_reserva ??
    payload?.data?.id;

  const parsed = Number(candidate);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Monto a cobrar: total del servicio (no “abono” / saldo a medias que a veces manda el API). */
function resolveAmountDue(checkout: CreatedCheckoutState | null, estimate: number | null): number {
  if (!checkout) return 0;
  const v = checkout.venta;
  if (v) {
    const estado = String(v.estado_pago || '').trim().toLowerCase();
    if (estado === 'pagado' || estado === 'paid') return 0;
  }

  return montoPagoUnicoSalidaProgramada({
    checkoutMontoTotal: checkout.monto_total,
    venta: v,
    estimate,
  });
}

export function ProgrammedRouteBookingModal({
  isOpen,
  onClose,
  onGoToProfile,
  programacion,
  ruta,
  onSuccess,
  layout = 'dialog',
}: ProgrammedRouteBookingModalProps) {
  const { user } = useAuth();
  const [companions, setCompanions] = useState<CompanionFormState[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [createdCheckout, setCreatedCheckout] = useState<CreatedCheckoutState | null>(null);
  const [registeredPayment, setRegisteredPayment] = useState<PagoReservaProgramada | null>(null);
  const [proofFileName, setProofFileName] = useState('');
  const [routeImages, setRouteImages] = useState<string[]>([]);
  const [selectedRouteImageIndex, setSelectedRouteImageIndex] = useState(0);
  const [isRouteImageLightboxOpen, setIsRouteImageLightboxOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    metodo_pago: 'Transferencia',
    numero_transaccion: '',
    comprobante_url: '',
    comprobante_nombre: '',
    comprobante_tipo: '',
    observaciones: '',
  });

  const cuposDisponibles = Math.max(0, Number(programacion?.cupos_disponibles ?? 0));
  const maxCompanions = Math.max(0, cuposDisponibles - 1);
  const totalPeople = 1 + companions.length;

  const unitPrice = useMemo(() => {
    if (!programacion) return null;

    const rawPrice =
      programacion.precio_programacion != null
        ? Number(programacion.precio_programacion)
        : ruta?.precio_base != null
          ? Number(ruta.precio_base)
          : null;

    return rawPrice != null && Number.isFinite(rawPrice) ? rawPrice : null;
  }, [programacion, ruta]);

  const estimatedTotal = unitPrice != null ? unitPrice * totalPeople : null;
  const routeName = ruta?.nombre || programacion?.ruta_nombre || 'Ruta programada';
  const amountDue = useMemo(
    () => resolveAmountDue(createdCheckout, estimatedTotal),
    [createdCheckout, estimatedTotal]
  );

  const paymentSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCompanions([]);
    setNotes('');
    setIsSubmitting(false);
    setIsPaying(false);
    setCreatedCheckout(null);
    setRegisteredPayment(null);
    setRouteImages([]);
    setSelectedRouteImageIndex(0);
    setIsRouteImageLightboxOpen(false);
    setPaymentData({
      metodo_pago: 'Transferencia',
      numero_transaccion: '',
      comprobante_url: '',
      comprobante_nombre: '',
      comprobante_tipo: '',
      observaciones: '',
    });
    setProofFileName('');
  }, [isOpen, programacion?.id_programacion]);

  const primaryRouteImageUrl = useMemo(
    () => String(ruta?.imagen_url || programacion?.ruta_imagen_url || '').trim(),
    [ruta?.imagen_url, programacion?.ruta_imagen_url]
  );

  const resolvedDefaultRouteImage = useMemo(
    () => primaryRouteImageUrl || CATALOG_IMAGE_PLACEHOLDER,
    [primaryRouteImageUrl]
  );

  const resolvedRouteImages = useMemo(() => {
    return routeImages.length > 0 ? routeImages : [resolvedDefaultRouteImage];
  }, [routeImages, resolvedDefaultRouteImage]);

  useEffect(() => {
    if (!isRouteImageLightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsRouteImageLightboxOpen(false);
        return;
      }

      if (resolvedRouteImages.length <= 1) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setSelectedRouteImageIndex((idx) => (idx - 1 + resolvedRouteImages.length) % resolvedRouteImages.length);
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setSelectedRouteImageIndex((idx) => (idx + 1) % resolvedRouteImages.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRouteImageLightboxOpen, resolvedRouteImages.length]);

  useEffect(() => {
    if (!isRouteImageLightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isRouteImageLightboxOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const idRuta = Number(ruta?.id_ruta ?? programacion?.id_ruta);

    if (!Number.isFinite(idRuta) || idRuta <= 0) {
      setRouteImages(primaryRouteImageUrl ? [primaryRouteImageUrl] : []);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const list = await rutasAPI.getImagenes(idRuta);
        if (cancelled) return;
        const all = [primaryRouteImageUrl, ...(Array.isArray(list) ? list : [])]
          .map((x) => String(x || '').trim())
          .filter(Boolean);
        const unique: string[] = [];
        const seen = new Set<string>();
        for (const src of all) {
          if (seen.has(src)) continue;
          seen.add(src);
          unique.push(src);
        }
        setRouteImages(unique);
      } catch {
        if (cancelled) return;
        setRouteImages(primaryRouteImageUrl ? [primaryRouteImageUrl] : []);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, ruta?.id_ruta, programacion?.id_ruta, primaryRouteImageUrl]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedRouteImageIndex((current) => {
      if (routeImages.length <= 0) return 0;
      if (current < 0) return 0;
      if (current >= routeImages.length) return 0;
      return current;
    });
  }, [isOpen, routeImages]);

  useEffect(() => {
    if (!createdCheckout || registeredPayment || !isOpen) return;
    const id = window.setTimeout(() => {
      paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
    return () => window.clearTimeout(id);
  }, [createdCheckout, registeredPayment, isOpen]);

  const handleCompanionCountChange = (count: number) => {
    const safeCount = Math.max(0, Math.min(maxCompanions, count));

    setCompanions((current) => {
      if (safeCount === current.length) return current;
      if (safeCount < current.length) return current.slice(0, safeCount);
      return [...current, ...Array.from({ length: safeCount - current.length }, () => ({ ...EMPTY_COMPANION }))];
    });
  };

  const updateCompanion = (index: number, field: keyof CompanionFormState, value: string) => {
    setCompanions((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const handleSubmit = async () => {
    if (!programacion) return;

    if (!user || user.role !== 'client') {
      toast.error('Debes iniciar sesion como cliente para reservar un cupo.');
      return;
    }

    const clientId = Number(user.id);
    if (!Number.isFinite(clientId) || clientId <= 0) {
      toast.error('No se pudo identificar el cliente autenticado.');
      return;
    }

    if (cuposDisponibles <= 0) {
      toast.error('Esta salida ya no tiene cupos disponibles.');
      return;
    }

    if (totalPeople > cuposDisponibles) {
      toast.error('La cantidad de personas excede los cupos disponibles.');
      return;
    }

    for (let i = 0; i < companions.length; i += 1) {
      const companion = companions[i];
      if (!String(companion.nombre).trim() || !String(companion.apellido).trim()) {
        toast.error(`Completa nombre y apellido del acompañante ${i + 1}.`);
        return;
      }
      if (
        !documentoTitularCompletoValidoParaReserva(
          companion.tipo_documento,
          companion.numero_documento,
        )
      ) {
        toast.error(
          `El documento del acompañante ${i + 1} no es válido (tipo y número reales, sin solo “-”).`,
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const createdReserva = await reservasAPI.create({
        id_cliente: clientId,
        notas: notes.trim() || `Reserva web para programacion #${programacion.id_programacion}`,
      });

      const reservaId = getReservationId(createdReserva);
      if (!reservaId) {
        throw new Error('Se creo la reserva, pero no fue posible obtener su identificador.');
      }

      const programacionResponse = await reservasAPI.agregarProgramacion(reservaId, {
        id_programacion: programacion.id_programacion,
        cantidad_personas: totalPeople,
        precio_unitario: unitPrice ?? 0,
        ...(estimatedTotal != null && Number.isFinite(estimatedTotal) && estimatedTotal > 0
          ? { monto_total: estimatedTotal }
          : {}),
      });

      const rawProg: any = programacionResponse;
      const dataProg = rawProg?.data ?? rawProg;
      const ventaCreada = (dataProg?.venta ?? rawProg?.venta ?? null) as VentaReserva | null;
      const montoTotalCreado = Number(
        dataProg?.monto_total ?? rawProg?.monto_total ?? ventaCreada?.monto_total ?? 0
      );

      for (const companion of companions) {
        await reservasAPI.agregarAcompanante(reservaId, {
          id_cliente: null,
          nombre: companion.nombre.trim(),
          apellido: companion.apellido.trim(),
          tipo_documento: companion.tipo_documento.trim() || null,
          numero_documento: companion.numero_documento.trim() || null,
          telefono: companion.telefono.trim() || null,
          fecha_nacimiento: companion.fecha_nacimiento || null,
        });
      }

      setCreatedCheckout({
        id_reserva: reservaId,
        monto_total: Number.isFinite(montoTotalCreado) ? montoTotalCreado : 0,
        venta: ventaCreada,
      });

      await onSuccess?.();
      toast.success(
        companions.length > 0
          ? `Solicitud registrada (tu grupo: ${1 + companions.length} personas).`
          : 'Solicitud registrada.',
        {
          description:
            'Baja al formulario de pago en esta misma pantalla, paga y adjunta el comprobante. Tu cupo en la salida queda confirmado cuando OCCITOUR verifique el pago.',
          duration: 7000,
        }
      );
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo completar la reserva de la salida programada.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterPayment = async () => {
    if (!createdCheckout) return;

    if (!user || user.role !== 'client') {
      toast.error('No se puede registrar el pago desde esta cuenta.');
      return;
    }

    const profilePago = await authAPI.getProfile().catch(() => null);
    const { tipo: tipoPago, numero: docPagoNumero } = extraerDocumentoTitularDesdePerfil(
      profilePago?.perfil,
      user,
    );
    if (!documentoTitularCompletoValidoParaReserva(tipoPago, docPagoNumero)) {
      toast.error(MENSAJE_ACTUALIZAR_DOCUMENTO_PERFIL);
      return;
    }

    if (amountDue <= 0) {
      toast.error('Esta reserva no tiene saldo pendiente para registrar.');
      return;
    }

    if (!String(paymentData.comprobante_url || '').trim()) {
      toast.error('Debes adjuntar el comprobante (archivo requerido).');
      return;
    }

    if (String(paymentData.metodo_pago || '').trim().length > MAX_METODO_PAGO) {
      toast.error(`El método de pago no puede exceder ${MAX_METODO_PAGO} caracteres.`);
      return;
    }

    if (String(paymentData.numero_transaccion || '').trim().length > MAX_NUMERO_TRANSACCION) {
      toast.error(`El número de transacción no puede exceder ${MAX_NUMERO_TRANSACCION} caracteres.`);
      return;
    }

    if (String(paymentData.comprobante_nombre || '').trim().length > MAX_PROOF_FILE_NAME) {
      toast.error(`El nombre del comprobante no puede superar ${MAX_PROOF_FILE_NAME} caracteres.`);
      return;
    }

    try {
      setIsPaying(true);
      const response = await reservasAPI.pagarCompleto(createdCheckout.id_reserva, {
        monto: amountDue,
        metodo_pago: paymentData.metodo_pago || null,
        numero_transaccion: paymentData.numero_transaccion.trim() || null,
        comprobante_url: paymentData.comprobante_url.trim(),
        comprobante_nombre: paymentData.comprobante_nombre || null,
        comprobante_tipo: paymentData.comprobante_tipo || null,
        observaciones: paymentData.observaciones.trim() || null,
      });

      setRegisteredPayment(response.data.pago);
      setCreatedCheckout((current) =>
        current
          ? {
              ...current,
              venta: response.data.venta ?? current.venta,
              monto_total: Number(response.data.reserva?.monto_total ?? current.monto_total),
            }
          : current
      );

      toast.success('Pago registrado', {
        description: 'Quedó pendiente de verificación por parte del staff.',
      });
    } catch (error: any) {
      toast.error('No se pudo registrar el pago', {
        description: error?.message || 'Intenta nuevamente.',
      });
    } finally {
      setIsPaying(false);
    }
  };

  const handleProofFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_PROOF_FILE_SIZE) {
      toast.error('El archivo no debe exceder 5MB.');
      event.target.value = '';
      return;
    }

    if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
      toast.error('Solo se permiten archivos PDF, JPG, PNG o WEBP.');
      event.target.value = '';
      return;
    }

    if (String(file.name || '').trim().length > MAX_PROOF_FILE_NAME) {
      toast.error(`El nombre del comprobante no puede superar ${MAX_PROOF_FILE_NAME} caracteres.`);
      event.target.value = '';
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('No se pudo leer el comprobante seleccionado.'));
        reader.readAsDataURL(file);
      });

      if (!dataUrl) {
        throw new Error('No se pudo procesar el archivo seleccionado.');
      }

      setPaymentData((current) => ({
        ...current,
        comprobante_url: dataUrl,
        comprobante_nombre: file.name,
        comprobante_tipo: file.type || 'application/octet-stream',
      }));
      setProofFileName(file.name);
      toast.success('Comprobante cargado correctamente.');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cargar el comprobante.');
      event.target.value = '';
    }
  };

  const removeProofFile = () => {
    setPaymentData((current) => ({
      ...current,
      comprobante_url: '',
      comprobante_nombre: '',
      comprobante_tipo: '',
    }));
    setProofFileName('');
  };

  const scrollAreaClassName =
    layout === 'page' ? 'space-y-6 pb-4' : 'flex-1 min-h-0 overflow-y-auto pr-2 space-y-6';

  const titleText = createdCheckout ? 'Siguiente paso: pago y comprobante' : 'Reservar cupo en salida programada';
  const descriptionText = createdCheckout
    ? 'Realiza el pago total de esta salida y sube el comprobante aquí. El staff validará el pago; hasta entonces la plaza puede seguir mostrándose como pendiente de confirmación.'
    : 'Salida fijada por OCCITOUR: confirmas personas y acompañantes y, al continuar, pagas en el acto para tu cupo. No es una solicitud personalizada (ahí el asesor habilita el pago después de revisar).';

  const footerActions = (
    <>
      {!createdCheckout ? (
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!programacion || isSubmitting || cuposDisponibles <= 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? 'Reservando...' : 'Confirmar reserva'}
          </Button>
        </>
      ) : registeredPayment ? (
        <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
          Cerrar
        </Button>
      ) : amountDue > 0 ? (
        <Button onClick={handleRegisterPayment} disabled={isPaying} className="bg-green-600 hover:bg-green-700">
          {isPaying ? 'Enviando pago...' : 'Registrar pago completo'}
        </Button>
      ) : (
        <Button onClick={onClose}>Cerrar</Button>
      )}
    </>
  );

  const renderBookingBody = () => {
    if (!programacion) return null;

    const defaultHeroImage = resolvedDefaultRouteImage;
    const images = resolvedRouteImages;
    const safeIndex = Math.max(0, Math.min(selectedRouteImageIndex, images.length - 1));
    const heroImage = images[safeIndex] || defaultHeroImage;
    const descripcionRuta = normalizeMultilineText(ruta?.descripcion);
    const recomendacionesTxt = extractRecomendacionesParticipantes(ruta);
    const serviciosIncluidos: RutaServicioPredefinido[] = extractRutaServiciosPredefinidos(ruta);
    const guiaNombre = [programacion.empleado_nombre, programacion.empleado_apellido]
      .map((x) => String(x || '').trim())
      .filter(Boolean)
      .join(' ');
    const cuposTotales = Number(programacion.cupos_totales ?? 0);
      const lugarEncuentroText = String(programacion.lugar_encuentro || '').trim() || 'Se confirma al cliente';
    const horaSalidaRaw = String(programacion.hora_salida || '').trim() || null;
    const horaRegresoRaw = String(programacion.hora_regreso || '').trim() || null;
    const horaSalida = horaSalidaRaw ? formatTimeDisplay(horaSalidaRaw) : null;
    const horaRegreso = horaRegresoRaw ? formatTimeDisplay(horaRegresoRaw) : null;
    const horarioViaje =
      horaSalida && horaRegreso
        ? `Desde ${horaSalida} hasta ${horaRegreso}`
        : horaSalida
          ? `Salida: ${horaSalida}`
          : horaRegreso
            ? `Regreso: ${horaRegreso}`
            : 'Horario por confirmar';
    const estadoSalida = estadoSalidaParaCliente(programacion.estado);
    const heroImageMaxHClass =
      layout === 'page'
        ? 'max-h-[200px] sm:max-h-[240px] md:max-h-[260px]'
        : 'max-h-[160px] sm:max-h-[200px]';
    const canNavigateImages = images.length > 1;
    const photosLabel = canNavigateImages ? `${images.length} fotos` : '1 foto';

    return (
      <>
        <div className={scrollAreaClassName}>
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedRouteImageIndex(0);
                setIsRouteImageLightboxOpen(true);
              }
            }}
            onClick={() => {
              setSelectedRouteImageIndex(0);
              setIsRouteImageLightboxOpen(true);
            }}
            className="flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-green-100 bg-white shadow-xl isolate"
          >
            {/* Franja horizontal a todo el ancho: imagen completa (sin recorte) */}
            <div className="relative w-full bg-gradient-to-b from-emerald-950/[0.06] to-emerald-900/10">
              <div className="absolute top-3 right-3 z-10 flex max-w-[min(100%,14rem)] flex-wrap items-center justify-end gap-2 sm:top-4 sm:right-4 sm:max-w-none">
                <Badge
                  variant="secondary"
                  className="border border-green-200/90 bg-white/95 text-green-900 shadow-sm backdrop-blur-sm"
                >
                  {photosLabel}
                </Badge>
                {canNavigateImages ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRouteImageIndex(0);
                      setIsRouteImageLightboxOpen(true);
                    }}
                    className="border border-green-200/90 bg-white/95 text-green-900 shadow-sm backdrop-blur-sm hover:bg-white"
                  >
                    Ver galería
                  </Button>
                ) : null}
              </div>
              <div className="flex w-full items-center justify-center px-3 pb-4 pt-14 sm:px-4 sm:pb-5 sm:pt-12 md:pt-11">
                <ImageWithFallback
                  src={heroImage}
                  alt={routeName}
                  loading={layout === 'page' ? 'eager' : 'lazy'}
                  decoding="async"
                  className={`pointer-events-none h-auto w-full object-contain object-center ${heroImageMaxHClass}`}
                />
              </div>
            </div>

            {/* Texto e información: flujo normal bajo la foto (nada superpuesto) */}
            <div className="border-t border-green-100/90 bg-white px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" translate="no" className={estadoSalida.badgeClassName}>
                  {estadoSalida.label}
                </Badge>
                <Badge
                  translate="no"
                  variant="secondary"
                  className="border border-green-200/90 bg-green-50 text-green-900 shadow-sm"
                >
                  {cuposDisponibles} cupos disponibles
                  {cuposTotales > 0 ? ` · ${cuposTotales} totales` : ''}
                </Badge>
              </div>

              <h2 className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl md:text-3xl">{routeName}</h2>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                {ruta?.ubicacion ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0 text-green-600" />
                    {ruta.ubicacion}
                  </span>
                ) : null}
                <span className="inline-flex max-w-full items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0 text-green-600" />
                  <span className="line-clamp-2">
                    <span className="text-gray-500">Encuentro: </span>
                    {lugarEncuentroText}
                  </span>
                </span>
                {ruta?.dificultad ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Compass className="h-4 w-4 shrink-0 text-green-600" />
                    {ruta.dificultad}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 shrink-0 text-green-600" />
                  {formatRutaDuracionHoras(ruta?.duracion_dias)}
                </span>
              </div>
            </div>
          </div>

          {canNavigateImages ? (
            <p className="mt-2 text-sm text-green-800">
              Haz click en la foto principal para ver todas las imágenes.
            </p>
          ) : null}

            <Card className="overflow-hidden border-teal-200 shadow-md bg-teal-50/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-teal-900">Recomendaciones para tu salida</CardTitle>
                <CardDescription className="text-teal-900/80">
                  Léelas antes del día del tour. Si hay cambios de última hora, OCCITOUR te avisará.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recomendacionesTxt ? (
                  <p className="text-gray-800 leading-relaxed text-[15px] whitespace-pre-wrap">{recomendacionesTxt}</p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Aún no hay recomendaciones publicadas para esta ruta, o el servidor no las devuelve en la API.
                    Revisa la ficha en <strong>Rutas</strong> o contacta a OCCITOUR.
                  </p>
                )}
              </CardContent>
            </Card>

            {descripcionRuta ? (
              <Card className="overflow-hidden border-green-100/80 shadow-md bg-white/95">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-green-900">Sobre esta experiencia</CardTitle>
                  <CardDescription className="text-gray-600">
                    Todo lo que incluye la ruta para esta salida programada.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-line">{descripcionRuta}</p>
                </CardContent>
              </Card>
            ) : null}

            {normalizeMultilineText(ruta?.recomendaciones_participantes) ? (
              <Card className="overflow-hidden border-teal-200 shadow-md bg-teal-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-teal-900">Recomendaciones para tu salida</CardTitle>
                  <CardDescription className="text-teal-900/80">
                    Léelas antes del día del tour. Si hay cambios de última hora, OCCITOUR te avisará por los canales de contacto.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-800 leading-relaxed text-[15px] whitespace-pre-wrap">
                    {ruta?.recomendaciones_participantes}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-green-200/90 bg-gradient-to-br from-white to-emerald-50/40 shadow-md overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-green-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Fechas y horarios
                </CardTitle>
                <CardDescription>Planifica tu llegada según la salida y el regreso de este grupo.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-green-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-green-700 mb-1">Fecha de salida</p>
                    <p className="text-base font-semibold text-gray-900">{formatDate(programacion.fecha_salida)}</p>
                  </div>
                  <div className="rounded-xl border border-green-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-green-700 mb-1">Fecha de regreso</p>
                    <p className="text-base font-semibold text-gray-900">{formatDate(programacion.fecha_regreso)}</p>
                  </div>
                  <div className="rounded-xl border border-green-100 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-green-700 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Horario del viaje
                    </p>
                    <p className="text-base font-semibold text-gray-900">{horarioViaje}</p>
                    {(horaSalida || horaRegreso) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {horaSalida ? `Hora salida: ${horaSalida}` : ''}
                        {horaSalida && horaRegreso ? ' · ' : ''}
                        {horaRegreso ? `Hora regreso: ${horaRegreso}` : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-green-200/80 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-green-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Punto de encuentro
                  </p>
                  <p className="text-base font-medium text-gray-900 leading-snug">{lugarEncuentroText}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200/90 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-900">Cupo y guía</CardTitle>
                <CardDescription className="text-gray-600">
                  La capacidad que ves aquí es la de <strong>esta salida programada</strong> (cupos de la operación), no el catálogo genérico.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex gap-3 rounded-xl border border-green-100 bg-green-50/60 p-4 sm:col-span-2">
                    <Users className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-green-800 uppercase tracking-wide font-medium">Cupos de esta salida</p>
                      <p className="text-gray-900 font-semibold text-lg">
                        {cuposDisponibles} disponibles
                        {cuposTotales > 0 ? (
                          <span className="text-base font-normal text-gray-600">
                            {' '}
                            · {cuposTotales} cupos totales de la programación
                          </span>
                        ) : null}
                      </p>
                      {ruta?.capacidad_maxima != null && Number(ruta.capacidad_maxima) > 0 ? (
                        <p className="text-xs text-gray-500 mt-2">
                          Referencia catálogo de la ruta: hasta {ruta.capacidad_maxima} personas por definición del producto.
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {guiaNombre ? (
                    <div className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4 sm:col-span-2">
                      <UserCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Guía asignado</p>
                        <p className="text-gray-900 font-medium">{guiaNombre}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-100 shadow-md overflow-hidden bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-green-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Servicios
                </CardTitle>
                <CardDescription>
                  Lo que incluye esta ruta en cada salida (según lo configurado en OCCITOUR).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {serviciosIncluidos.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {serviciosIncluidos.map((item, idx) => {
                      const s = item.servicio;
                      const nombre = String(s?.nombre || `Servicio ${item.id_servicio}`).trim();
                      const desc = normalizeMultilineText(s?.descripcion);
                      const cantidad = Math.max(1, Number(item.cantidad_default) || 1);
                      const img = String(s?.imagen_url || '').trim();
                      const key = `${item.id_servicio}-${idx}`;
                      return (
                        <div
                          key={key}
                          className="group flex gap-4 rounded-xl border border-green-100/90 bg-gradient-to-br from-white to-green-50/30 p-4 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-green-100 bg-green-50">
                            {img ? (
                              <ImageWithFallback src={img} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Sparkles className="w-8 h-8 text-green-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 gap-y-1">
                              <p className="font-semibold text-gray-900 leading-snug">{nombre}</p>
                              {cantidad > 1 ? (
                                <Badge variant="secondary" className="text-xs">
                                  x{cantidad}
                                </Badge>
                              ) : null}
                              {item.requerido ? (
                                <Badge className="bg-green-600 text-white text-xs">Incluido</Badge>
                              ) : null}
                            </div>
                            {desc ? (
                              <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-4">{desc}</p>
                            ) : (
                              <p className="mt-2 text-sm text-gray-400 italic">Sin descripción breve.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-green-200 bg-green-50/50 px-4 py-8 text-center">
                    <p className="text-gray-700 font-medium">Aún no aparecen servicios para esta ruta.</p>
                    <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto leading-relaxed">
                      En el panel de OCCITOUR deberían estar cargados en la ruta. Si ya existen y no los ves aquí,
                      el detalle público o autenticado puede no estar enviándolos: pide a soporte revisar el endpoint
                      de la ruta. Tu asesor puede confirmarte igualmente lo que incluye la salida.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-5 grid gap-4 md:grid-cols-[1.4fr,0.9fr]">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-emerald-700 text-white">Tarifas</Badge>
                    <Badge variant="outline" className="border-green-300 text-green-800">
                      Un solo pago — grupo completo
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      El valor a pagar incluye a <strong>todas las personas</strong> de la reserva: tú como titular más
                      cada acompañante registrado. No es un abono por persona aparte: es el total de la salida para tu
                      grupo.
                    </p>
                    <div className="mt-4 rounded-xl border border-green-100 bg-white px-4 py-3 space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-green-800/80">
                        Total del grupo (estimado)
                      </p>
                      <p className="font-semibold text-green-900 text-2xl tabular-nums">
                        {unitPrice == null || estimatedTotal == null
                          ? 'Por confirmar'
                          : `${estimatedTotal.toLocaleString('es-CO')} COP`}
                      </p>
                      {unitPrice != null && estimatedTotal != null ? (
                        <p className="text-sm text-gray-600 pt-1">
                          <span className="tabular-nums">{unitPrice.toLocaleString('es-CO')} COP</span> por persona ×{' '}
                          <span className="font-medium text-gray-800">{totalPeople}</span> persona
                          {totalPeople === 1 ? '' : 's'} (1 titular
                          {companions.length > 0 ? ` + ${companions.length} acomp.` : ''})
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-green-200 bg-white p-4 space-y-3">
                  <p className="text-sm text-gray-500">
                    {createdCheckout ? 'Resumen de la reserva creada' : 'Resumen de tu reserva'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Titular</span>
                    <span className="text-gray-900">1 persona</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Acompanantes</span>
                    <span className="text-gray-900">{companions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total viajeros</span>
                    <span className="text-gray-900">{totalPeople}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600 shrink-0">
                      {createdCheckout ? 'Total a pagar' : 'Total grupo (estimado)'}
                    </span>
                    <span className="text-lg text-green-700 font-semibold tabular-nums text-right">
                      {createdCheckout ? formatCurrency(createdCheckout.monto_total) : formatCurrency(estimatedTotal)}
                    </span>
                  </div>
                  {createdCheckout ? null : (
                    <p className="text-xs text-green-800/90 bg-green-50 border border-green-100 rounded-lg px-2 py-1.5">
                      Al confirmar, enviamos al sistema <strong>{totalPeople}</strong> persona
                      {totalPeople === 1 ? '' : 's'} y el total calculado para que el cobro sea por el grupo completo.
                    </p>
                  )}
                  {createdCheckout?.venta?.id_venta ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">ID venta</span>
                        <span className="text-gray-900">#{createdCheckout.venta.id_venta}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Estado de pago</span>
                        <span className="text-gray-900">{createdCheckout.venta.estado_pago || 'Pendiente'}</span>
                      </div>
                    </>
                  ) : null}
                  <p className="text-xs text-gray-500">
                    {createdCheckout
                      ? 'El pago queda pendiente de verificación por parte del staff una vez envíes el comprobante.'
                      : 'Si la tarifa de esta salida aun no esta publicada, la confirmacion final de pago la valida el asesor.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {!createdCheckout && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div>
                  <h4 className="text-base text-gray-900">Personas que viajan</h4>
                  <p className="text-sm text-gray-600">
                    El cliente titular ya ocupa 1 cupo. Puedes agregar hasta {maxCompanions} acompanante
                    {maxCompanions === 1 ? '' : 's'} segun la disponibilidad actual. El{' '}
                    <strong>total a pagar</strong> se actualiza automáticamente e incluye a todas las personas del grupo
                    (un solo valor por la salida).
                  </p>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  Los acompanantes se guardan como viajeros asociados a esta reserva en
                  `detalle_reserva_acompanante`. No se les crea una cuenta ni un perfil de cliente automaticamente.
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companionsCount">Numero de acompanantes</Label>
                    <Input
                      id="companionsCount"
                      type="number"
                      min={0}
                      max={maxCompanions}
                      value={companions.length}
                      onChange={(event) => handleCompanionCountChange(Number(event.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bookingNotes">Notas para el asesor</Label>
                    <Textarea
                      id="bookingNotes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Ej. observaciones medicas, dudas del grupo o requerimientos especiales."
                      rows={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {!createdCheckout && companions.length > 0 && (
              <Card>
                <CardContent className="p-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="text-base text-gray-900">Datos de acompanantes</h4>
                      <p className="text-sm text-gray-600">
                        Nombre, apellido y número de documento son obligatorios. Teléfono y fecha de nacimiento son
                        opcionales.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {companions.map((companion, index) => (
                      <div key={`companion-${index}`} className="rounded-xl border border-gray-200 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">Acompanante {index + 1}</p>
                          <Badge variant="outline">Cupo adicional</Badge>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`companion-name-${index}`}>Nombre *</Label>
                            <Input
                              id={`companion-name-${index}`}
                              value={companion.nombre}
                              onChange={(event) => updateCompanion(index, 'nombre', event.target.value)}
                              placeholder="Nombre"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`companion-lastname-${index}`}>Apellido *</Label>
                            <Input
                              id={`companion-lastname-${index}`}
                              value={companion.apellido}
                              onChange={(event) => updateCompanion(index, 'apellido', event.target.value)}
                              placeholder="Apellido"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`companion-doc-type-${index}`}>Tipo de documento</Label>
                            <Input
                              id={`companion-doc-type-${index}`}
                              value={companion.tipo_documento}
                              onChange={(event) => updateCompanion(index, 'tipo_documento', event.target.value)}
                              placeholder="CC, TI, Pasaporte..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`companion-doc-number-${index}`}>Número de documento *</Label>
                            <Input
                              id={`companion-doc-number-${index}`}
                              value={companion.numero_documento}
                              onChange={(event) => updateCompanion(index, 'numero_documento', event.target.value)}
                              placeholder="Documento"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`companion-phone-${index}`}>Telefono (opcional)</Label>
                            <Input
                              id={`companion-phone-${index}`}
                              value={companion.telefono}
                              onChange={(event) => updateCompanion(index, 'telefono', event.target.value)}
                              placeholder="Telefono"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`companion-birthdate-${index}`}>Fecha de nacimiento (opcional)</Label>
                            <Input
                              id={`companion-birthdate-${index}`}
                              type="date"
                              value={companion.fecha_nacimiento}
                              onChange={(event) => updateCompanion(index, 'fecha_nacimiento', event.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {createdCheckout && !registeredPayment && amountDue > 0 ? (
              <div ref={paymentSectionRef}>
              <Card>
                <CardContent className="p-5 space-y-5">
                  <div>
                    <h4 className="text-base text-gray-900">Registrar pago completo</h4>
                    <p className="text-sm text-gray-600">
                      Para rutas programadas no se manejan abonos. Primero realiza el pago y luego adjunta el comprobante.
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Monto a pagar ahora: <strong>{formatCurrency(amountDue)}</strong>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Monto</Label>
                      <Input value={formatCurrency(amountDue)} disabled />
                    </div>

                    <div className="space-y-2">
                      <Label>Metodo de pago</Label>
                      <Select
                        value={paymentData.metodo_pago}
                        onValueChange={(value) => setPaymentData((current) => ({ ...current, metodo_pago: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="QR">QR</SelectItem>
                          <SelectItem value="Transferencia">Bancolombia</SelectItem>
                          <SelectItem value="PSE">PSE</SelectItem>
                          <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                          <SelectItem value="Efectivo">Efectivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>


                  <div
                    className={`border-2 rounded-xl p-6 ${
                      paymentData.metodo_pago === 'QR'
                        ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                        : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
                    }`}
                  >
                    <div className="text-center space-y-4">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                          paymentData.metodo_pago === 'QR' ? 'bg-purple-600' : 'bg-red-600'
                        }`}
                      >
                        <QrCode className="w-8 h-8 text-white" />
                      </div>

                      <div>
                        <h5
                          className={`font-semibold ${
                            paymentData.metodo_pago === 'QR' ? 'text-purple-900' : 'text-red-900'
                          }`}
                        >
                          {paymentData.metodo_pago === 'QR' ? 'Paga por QR / Nequi' : 'Paga a Bancolombia'}
                        </h5>
                        <p
                          className={`text-sm ${
                            paymentData.metodo_pago === 'QR' ? 'text-purple-700' : 'text-red-700'
                          }`}
                        >
                          {paymentData.metodo_pago === 'QR'
                            ? 'Escanea el QR o transfiere al numero indicado y luego sube tu comprobante.'
                            : 'Realiza la transferencia a la cuenta indicada y luego sube tu comprobante.'}
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-lg inline-block">
                        {paymentData.metodo_pago === 'QR' ? (
                          <div className="w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <QrCode className="w-24 h-24 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">Código QR de pago</p>
                            </div>
                          </div>
                        ) : (
                          <div className="w-64 space-y-2 text-left">
                            <div>
                              <p className="text-xs text-gray-600">Banco</p>
                              <p className="font-medium">{OCCITOURS_PAYMENT_INFO.bancolombiaBankName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Tipo de cuenta</p>
                              <p className="font-medium">{OCCITOURS_PAYMENT_INFO.bancolombiaTipoCuenta}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Numero de cuenta</p>
                              <p className="font-medium font-mono">{OCCITOURS_PAYMENT_INFO.bancolombiaNumeroCuenta}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Titular</p>
                              <p className="font-medium">{OCCITOURS_PAYMENT_INFO.titular}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Documento del titular</p>
                              <p className="font-medium font-mono text-sm">
                                {OCCITOURS_PAYMENT_INFO.beneficiarioTipoDocumento}{' '}
                                {OCCITOURS_PAYMENT_INFO.beneficiarioNumeroDocumento}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <Separator
                        className={paymentData.metodo_pago === 'QR' ? 'bg-purple-200' : 'bg-red-200'}
                      />

                      <div className="grid gap-3 md:grid-cols-2 text-left">
                        <div className="bg-white rounded-xl p-3 border border-white/70 flex items-center justify-between shadow-sm">
                          <p className="text-sm text-gray-500 font-medium">Valor a pagar</p>
                          <p className="font-bold text-lg text-gray-900">{formatCurrency(amountDue)}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-white/70 flex items-center justify-between shadow-sm">
                          <p className="text-sm text-gray-500 font-medium">Referencia</p>
                          <p className="font-bold text-lg text-gray-900">Reserva #{createdCheckout.id_reserva}</p>
                        </div>
                      </div>

                      <div
                        className={`mt-3 rounded-xl border p-3.5 text-left text-sm flex items-start gap-2.5 ${
                          paymentData.metodo_pago === 'QR'
                            ? 'bg-purple-100/50 border-purple-200 text-purple-900'
                            : 'bg-red-100/50 border-red-200 text-red-900'
                        }`}
                      >
                        <span className="text-xl leading-none">💡</span>
                        <span className="leading-relaxed">
                          Recuerda usar la referencia <strong>Reserva #{createdCheckout.id_reserva}</strong> en el detalle o
                          descripción de la transferencia. Esto nos ayuda a verificar tu pago rápidamente.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Numero de transaccion (opcional)</Label>
                      <Input
                        value={paymentData.numero_transaccion}
                        onChange={(event) =>
                          setPaymentData((current) => ({ ...current, numero_transaccion: event.target.value }))
                        }
                        placeholder="Ej: 123ABC"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="proofFile">Comprobante *</Label>
                      <Input
                        id="proofFile"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        onChange={handleProofFileChange}
                      />
                      <p className="text-xs text-gray-500">
                        Sube un PDF, JPG o PNG de maximo 5MB.
                      </p>
                      {proofFileName ? (
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm">
                          <span className="truncate text-green-900">{proofFileName}</span>
                          <Button type="button" variant="ghost" className="h-auto p-0 text-green-700" onClick={removeProofFile}>
                            Quitar
                          </Button>
                        </div>
                      ) : null}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label>Observaciones (opcional)</Label>
                      <Textarea
                        value={paymentData.observaciones}
                        onChange={(event) =>
                          setPaymentData((current) => ({ ...current, observaciones: event.target.value }))
                        }
                        placeholder="Ej. pago realizado desde Nequi"
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            ) : null}

            {createdCheckout && amountDue <= 0 && !registeredPayment ? (
              <Card>
                <CardContent className="p-5 text-sm text-gray-600">
                  Esta reserva quedó creada, pero el valor aún no está listo para pago automático. Un asesor debe
                  confirmar el monto antes de que puedas pagar.
                </CardContent>
              </Card>
            ) : null}

            {registeredPayment ? (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-700" />
                    <div>
                      <h4 className="text-base text-green-900">Pago enviado correctamente</h4>
                      <p className="text-sm text-green-800">
                        El comprobante quedó en estado <strong>{registeredPayment.estado || 'Pendiente'}</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm text-green-900 md:grid-cols-2">
                    <div className="flex items-center justify-between gap-3">
                      <span>ID reserva</span>
                      <span className="font-medium">#{createdCheckout?.id_reserva}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>ID pago</span>
                      <span className="font-medium">#{registeredPayment.id_pago}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

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

      {isRouteImageLightboxOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 flex flex-col"
              style={{ zIndex: 100 }}
              role="dialog"
              aria-modal="true"
              aria-label="Galería de fotos"
              onClick={() => setIsRouteImageLightboxOpen(false)}
            >
              <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
              <div
                className="relative mx-auto flex h-full min-h-0 w-full flex-col px-3 pb-4 pt-3 sm:px-5 sm:pb-6 sm:pt-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex shrink-0 items-center justify-between gap-2 pb-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{routeName}</p>
                    <p className="text-xs text-white opacity-70">
                      Foto {safeIndex + 1} de {images.length}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsRouteImageLightboxOpen(false)}
                    className="shrink-0 bg-white/90 text-gray-900 hover:bg-white"
                  >
                    Cerrar
                  </Button>
                </div>

                <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-black/50 p-2">
                  {canNavigateImages ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedRouteImageIndex((idx) => (idx - 1 + images.length) % images.length)
                      }
                      className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-900 shadow-md hover:bg-white sm:left-3"
                      aria-label="Foto anterior"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                  ) : null}

                  <ImageWithFallback
                    src={heroImage}
                    alt={routeName}
                    loading="eager"
                    decoding="async"
                    className="max-h-full max-w-full object-contain"
                  />

                  {canNavigateImages ? (
                    <button
                      type="button"
                      onClick={() => setSelectedRouteImageIndex((idx) => (idx + 1) % images.length)}
                      className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-900 shadow-md hover:bg-white sm:right-3"
                      aria-label="Foto siguiente"
                    >
                      <ArrowLeft className="h-5 w-5 rotate-180" />
                    </button>
                  ) : null}
                </div>

                {canNavigateImages ? (
                  <div className="mt-3 shrink-0 overflow-x-auto pb-1">
                    <div className="flex gap-1.5 sm:gap-2">
                      {images.map((src, index) => {
                        const isActive = index === safeIndex;
                        return (
                          <button
                            key={`lightbox-${src}-${index}`}
                            type="button"
                            onClick={() => setSelectedRouteImageIndex(index)}
                            className={`relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-black/50 transition sm:h-12 sm:w-16 sm:rounded-xl ${
                              isActive ? 'ring-2 ring-green-300' : 'hover:opacity-90'
                            }`}
                            aria-label={`Ver foto ${index + 1}`}
                          >
                            <ImageWithFallback
                              src={src}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-contain"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <p className="mt-2 shrink-0 text-center text-xs text-white opacity-70">
                  Esc para cerrar · flechas para cambiar foto
                </p>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
    );
  };

  if (layout === 'page') {
    if (!isOpen) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/80 to-white flex flex-col">
        <header className="sticky top-0 z-20 border-b border-green-100/80 bg-white/90 backdrop-blur-md shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-green-200 text-green-800 hover:bg-green-50 w-fit"
              onClick={onClose}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight">{titleText}</h1>
              <p className="text-sm text-gray-600 mt-1">{descriptionText}</p>
            </div>
          </div>
        </header>

        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-32">
          {renderBookingBody()}
        </div>

        <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-green-100 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            {footerActions}
          </div>
        </footer>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{titleText}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>

        {renderBookingBody()}

        <DialogFooter className="shrink-0">{footerActions}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
