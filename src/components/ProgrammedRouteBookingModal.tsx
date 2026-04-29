import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, CreditCard, MapPin, QrCode, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../App';
import { reservasAPI, type PagoReservaProgramada, type Programacion, type Ruta, type VentaReserva } from '../services/api';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
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

export function ProgrammedRouteBookingModal({
  isOpen,
  onClose,
  programacion,
  ruta,
  onSuccess,
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
  const pendingAmount = Math.max(
    0,
    Number(createdCheckout?.venta?.saldo_pendiente ?? createdCheckout?.monto_total ?? 0)
  );

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

      const ventaCreada = (programacionResponse as any)?.venta ?? (programacionResponse as any)?.data?.venta ?? null;
      const montoTotalCreado = Number((programacionResponse as any)?.monto_total ?? ventaCreada?.monto_total ?? 0);

      setCreatedCheckout({
        id_reserva: reservaId,
        monto_total: Number.isFinite(montoTotalCreado) ? montoTotalCreado : 0,
        venta: ventaCreada,
      });

      await onSuccess?.();
      toast.success(
        companions.length > 0
          ? `Reserva creada para ti y ${companions.length} acompanante${companions.length > 1 ? 's' : ''}.`
          : 'Tu cupo fue reservado correctamente.'
      );
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo completar la reserva de la salida programada.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterPayment = async () => {
    if (!createdCheckout) return;

    if (pendingAmount <= 0) {
      toast.error('Esta reserva no tiene saldo pendiente para registrar.');
      return;
    }

    if (!String(paymentData.comprobante_url || '').trim()) {
      toast.error('Debes pegar la URL del comprobante.');
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {createdCheckout ? 'Reserva creada: registrar pago' : 'Reservar cupo en salida programada'}
          </DialogTitle>
          <DialogDescription>
            {createdCheckout
              ? 'Para rutas programadas se registra el pago completo. Los abonos siguen reservados para fincas.'
              : 'Esta reserva toma la fecha, horario y ruta ya definidos por OCCITOUR. Solo debes confirmar cuantas personas viajan y registrar los acompanantes.'}
          </DialogDescription>
        </DialogHeader>

        {programacion ? (
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-6">
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-5 grid gap-4 md:grid-cols-[1.4fr,0.9fr]">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-green-600 text-white">Salida confirmada</Badge>
                    <Badge variant="outline" className="border-green-300 text-green-700">
                      {cuposDisponibles} cupos disponibles
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-xl text-gray-900">{routeName}</h3>
                    <p className="text-sm text-gray-600">
                      {ruta?.ubicacion || 'Ubicacion por confirmar'}
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-green-100 bg-white px-3 py-3">
                      <p className="text-gray-500 mb-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-600" />
                        Fecha de salida
                      </p>
                      <p className="text-gray-800">{formatDate(programacion.fecha_salida)}</p>
                    </div>
                    <div className="rounded-lg border border-green-100 bg-white px-3 py-3">
                      <p className="text-gray-500 mb-1">Horario</p>
                      <p className="text-gray-800">
                        {programacion.hora_salida || 'Por definir'}
                        {programacion.hora_regreso ? ` - ${programacion.hora_regreso}` : ''}
                      </p>
                    </div>
                    <div className="rounded-lg border border-green-100 bg-white px-3 py-3">
                      <p className="text-gray-500 mb-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        Punto de encuentro
                      </p>
                      <p className="text-gray-800">{programacion.lugar_encuentro || 'Se confirma al cliente'}</p>
                    </div>
                    <div className="rounded-lg border border-green-100 bg-white px-3 py-3">
                      <p className="text-gray-500 mb-1 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-green-600" />
                        Tarifa estimada
                      </p>
                      <p className="text-gray-800">
                        {unitPrice == null ? 'Por confirmar' : `$${unitPrice.toLocaleString('es-CO')} por persona`}
                      </p>
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

            {createdCheckout && !registeredPayment && pendingAmount > 0 ? (
              <Card>
                <CardContent className="p-5 space-y-5">
                  <div>
                    <h4 className="text-base text-gray-900">Registrar pago completo</h4>
                    <p className="text-sm text-gray-600">
                      Para rutas programadas no se manejan abonos. Primero realiza el pago y luego adjunta el comprobante.
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Monto a pagar ahora: <strong>{formatCurrency(pendingAmount)}</strong>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Monto</Label>
                      <Input value={formatCurrency(pendingAmount)} disabled />
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
                          <p className="font-semibold text-gray-900">{formatCurrency(pendingAmount)}</p>
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
            ) : null}

            {createdCheckout && pendingAmount <= 0 && !registeredPayment ? (
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
        ) : null}

        <DialogFooter className="shrink-0">
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
          ) : pendingAmount > 0 ? (
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
