import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  MapPin,
  QrCode,
  Sparkles,
  UserCircle,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../App';
import {
  reservasAPI,
  extractRutaServiciosPredefinidos,
  type PagoReservaProgramada,
  type Programacion,
  type Ruta,
  type RutaServicioPredefinido,
  type VentaReserva,
} from '../services/api';
import { estadoSalidaParaCliente } from '../utils/programacionEstadoCliente';
import { ImageWithFallback } from './figma/ImageWithFallback';
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
const ALLOWED_PROOF_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const OCCITOURS_PAYMENT_INFO = {
  titular: 'Occitours S.A.S',
  nequiNumero: '3001234567',
  bancolombiaTipoCuenta: 'Ahorros',
  bancolombiaNumeroCuenta: '12345678901',
};

const FALLBACK_ROUTE_IMAGE =
  'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1400&q=80';

function formatDurationDays(duracionDias?: number | null): string {
  if (duracionDias == null || Number.isNaN(Number(duracionDias))) return '—';
  const days = Number(duracionDias);
  if (days <= 0) return '—';
  return days === 1 ? '1 día' : `${days} días`;
}

function normalizeMultilineText(value?: string | null): string {
  const t = String(value || '').trim();
  return t || '';
}

const EMPTY_COMPANION: CompanionFormState = {
  nombre: '',
  apellido: '',
  tipo_documento: '',
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
  const parsed = parseApiDate(value);
  if (!parsed) return 'Por definir';
  return parsed.toLocaleDateString('es-CO', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
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

/** Monto a cobrar al cliente: prioriza saldo de venta; si el backend manda 0, usa monto de venta o estimado de la pantalla. */
function resolveAmountDue(checkout: CreatedCheckoutState | null, estimate: number | null): number {
  if (!checkout) return 0;
  const v = checkout.venta;
  if (v) {
    const estado = String(v.estado_pago || '').trim().toLowerCase();
    if (estado === 'pagado' || estado === 'paid') return 0;
  }

  const saldo = Number(v?.saldo_pendiente);
  if (Number.isFinite(saldo) && saldo > 0) return saldo;

  const montoVenta = Number(v?.monto_total);
  if (Number.isFinite(montoVenta) && montoVenta > 0) return montoVenta;

  const montoCheckout = Number(checkout.monto_total);
  if (Number.isFinite(montoCheckout) && montoCheckout > 0) return montoCheckout;

  const est = estimate != null ? Number(estimate) : NaN;
  if (Number.isFinite(est) && est > 0) return est;

  return 0;
}

export function ProgrammedRouteBookingModal({
  isOpen,
  onClose,
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

    const companionMissingData = companions.some(
      (companion) => !String(companion.nombre).trim() || !String(companion.apellido).trim()
    );

    if (companionMissingData) {
      toast.error('Completa al menos nombre y apellido de cada acompanante.');
      return;
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

    if (amountDue <= 0) {
      toast.error('Esta reserva no tiene saldo pendiente para registrar.');
      return;
    }

    if (!String(paymentData.comprobante_url || '').trim()) {
      toast.error('Debes adjuntar el comprobante (archivo requerido).');
      return;
    }

    try {
      setIsPaying(true);
      const response = await reservasAPI.pagarCompleto(createdCheckout.id_reserva, {
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
      toast.error('Solo se permiten archivos PDF, JPG o PNG.');
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
        <>
          <Button
            variant="outline"
            onClick={() => {
              toast.info('Reserva creada. Podrás pagarla más tarde cuando habilitemos ese acceso desde tu panel.');
              onClose();
            }}
            disabled={isPaying}
          >
            Pagar despues
          </Button>
          <Button onClick={handleRegisterPayment} disabled={isPaying} className="bg-green-600 hover:bg-green-700">
            {isPaying ? 'Enviando pago...' : 'Registrar pago completo'}
          </Button>
        </>
      ) : (
        <Button onClick={onClose}>Cerrar</Button>
      )}
    </>
  );

  const renderBookingBody = () => {
    if (!programacion) return null;

    const heroImage = String(ruta?.imagen_url || '').trim() || FALLBACK_ROUTE_IMAGE;
    const descripcionRuta = normalizeMultilineText(ruta?.descripcion);
    const serviciosIncluidos: RutaServicioPredefinido[] = extractRutaServiciosPredefinidos(ruta);
    const guiaNombre = [programacion.empleado_nombre, programacion.empleado_apellido]
      .map((x) => String(x || '').trim())
      .filter(Boolean)
      .join(' ');
    const cuposTotales = Number(programacion.cupos_totales ?? 0);
    const lugarEncuentroText = String(programacion.lugar_encuentro || '').trim() || 'Se confirma al cliente';
    const horaSalida = String(programacion.hora_salida || '').trim() || null;
    const horaRegreso = String(programacion.hora_regreso || '').trim() || null;
    const horarioViaje =
      horaSalida && horaRegreso
        ? `Desde ${horaSalida} hasta ${horaRegreso}`
        : horaSalida
          ? `Salida: ${horaSalida}`
          : horaRegreso
            ? `Regreso: ${horaRegreso}`
            : 'Horario por confirmar';
    const estadoSalida = estadoSalidaParaCliente(programacion.estado);
    const heroMinHeight = layout === 'page' ? 'min-h-[220px] sm:min-h-[260px] md:min-h-[300px]' : 'min-h-[160px]';

    return (
      <div className={scrollAreaClassName}>
            <div
              className={`relative w-full overflow-hidden rounded-2xl border border-green-100 shadow-xl ${heroMinHeight}`}
            >
              <ImageWithFallback
                src={heroImage}
                alt={routeName}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
              <div className="relative flex h-full min-h-[inherit] flex-col justify-end p-5 sm:p-7 md:p-8">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="outline" translate="no" className={estadoSalida.badgeClassName}>
                    {estadoSalida.label}
                  </Badge>
                  <Badge
                    translate="no"
                    variant="secondary"
                    className="border border-green-200/90 bg-white/95 text-green-900 shadow-sm backdrop-blur-sm"
                  >
                    {cuposDisponibles} cupos disponibles
                    {cuposTotales > 0 ? ` · ${cuposTotales} totales` : ''}
                  </Badge>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-sm leading-tight">
                  {routeName}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/90">
                  {ruta?.ubicacion ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 opacity-90" />
                      {ruta.ubicacion}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5 max-w-full">
                    <MapPin className="w-4 h-4 shrink-0 opacity-90" />
                    <span className="line-clamp-2">
                      <span className="text-white/80">Encuentro: </span>
                      {lugarEncuentroText}
                    </span>
                  </span>
                  {ruta?.dificultad ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Compass className="w-4 h-4 opacity-90" />
                      {ruta.dificultad}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4 opacity-90" />
                    {formatDurationDays(ruta?.duracion_dias)}
                  </span>
                </div>
              </div>
            </div>

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
                      Precio por persona
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      La salida usa la programación vigente de OCCITOUR. Revisa arriba fechas, horarios y servicios
                      antes de confirmar tus cupos.
                    </p>
                    <div className="mt-4 rounded-xl border border-green-100 bg-white px-4 py-3 font-semibold text-green-800 text-lg">
                      {unitPrice == null
                        ? 'Tarifa por confirmar con tu asesor'
                        : `${unitPrice.toLocaleString('es-CO')} COP / persona`}
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
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{createdCheckout ? 'Valor total' : 'Valor estimado'}</span>
                    <span className="text-lg text-green-700">
                      {createdCheckout ? formatCurrency(createdCheckout.monto_total) : formatCurrency(estimatedTotal)}
                    </span>
                  </div>
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
                    {maxCompanions === 1 ? '' : 's'} segun la disponibilidad actual.
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
                        Nombre y apellido son obligatorios. Documento, telefono y fecha de nacimiento son opcionales.
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
                            <Label htmlFor={`companion-doc-type-${index}`}>Tipo de documento (opcional)</Label>
                            <Input
                              id={`companion-doc-type-${index}`}
                              value={companion.tipo_documento}
                              onChange={(event) => updateCompanion(index, 'tipo_documento', event.target.value)}
                              placeholder="CC, TI, Pasaporte..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`companion-doc-number-${index}`}>Numero de documento (opcional)</Label>
                            <Input
                              id={`companion-doc-number-${index}`}
                              value={companion.numero_documento}
                              onChange={(event) => updateCompanion(index, 'numero_documento', event.target.value)}
                              placeholder="Documento"
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
                              <p className="font-medium">Bancolombia</p>
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
                          </div>
                        )}
                      </div>

                      <Separator
                        className={paymentData.metodo_pago === 'QR' ? 'bg-purple-200' : 'bg-red-200'}
                      />

                      <div className="grid gap-3 md:grid-cols-3 text-left">
                        <div className="bg-white rounded-lg p-3 border border-white/70">
                          <p className="text-xs text-gray-500">Valor a pagar</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(amountDue)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-white/70">
                          <p className="text-xs text-gray-500">Referencia</p>
                          <p className="font-semibold text-gray-900">Reserva #{createdCheckout.id_reserva}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-white/70">
                          <p className="text-xs text-gray-500">
                            {paymentData.metodo_pago === 'QR' ? 'Numero de pago' : 'Titular'}
                          </p>
                          <p className="font-semibold text-gray-900">
                            {paymentData.metodo_pago === 'QR'
                              ? OCCITOURS_PAYMENT_INFO.nequiNumero
                              : OCCITOURS_PAYMENT_INFO.titular}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`mt-2 rounded-lg border p-3 text-left text-xs ${
                          paymentData.metodo_pago === 'QR'
                            ? 'bg-purple-100 border-purple-200 text-purple-900'
                            : 'bg-red-100 border-red-200 text-red-900'
                        }`}
                      >
                        Usa la referencia <strong>Reserva #{createdCheckout.id_reserva}</strong> en el soporte o
                        descripción de la transferencia para que el staff identifique el pago más rápido.
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
      </div>
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

        <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-32">
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
