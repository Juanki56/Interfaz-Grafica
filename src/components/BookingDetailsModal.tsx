import React, { useState } from 'react';
import { X, Calendar, Users, MapPin, CreditCard, Upload, CheckCircle2, Clock, AlertCircle, Download, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { toast } from 'sonner';

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

export function BookingDetailsModal({ isOpen, onClose, booking }: BookingDetailsModalProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo no debe superar los 5MB');
        return;
      }

      setUploadedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadReceipt = async () => {
    if (!uploadedFile) {
      toast.error('Por favor selecciona un comprobante de pago');
      return;
    }

    setIsUploading(true);

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast.success('¡Comprobante subido exitosamente!', {
      description: 'Tu pago será verificado en las próximas horas.'
    });

    setIsUploading(false);
    setUploadedFile(null);
    setPreviewUrl(null);

    // Close modal after successful upload
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleCancelUpload = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusLabel = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'completed':
        return 'Pago Completo';
      case 'partial':
        return 'Pago Parcial';
      case 'pending':
        return 'Pago Pendiente';
      default:
        return 'Desconocido';
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-amber-100 text-amber-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !booking) return null;

  const needsRemainingPayment = booking.paymentStatus === 'partial' && booking.remainingAmount > 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] bg-white shadow-xl border-2 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b bg-green-50">
          <div>
            <CardTitle className="text-xl">Detalles de la Reserva</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">ID: {booking.id}</p>
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

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Información General */}
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">{booking.name}</h3>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                </Badge>
                <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                  {getPaymentStatusLabel(booking.paymentStatus)}
                </Badge>
              </div>
              {booking.location && (
                <p className="text-sm text-muted-foreground flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {booking.location}
                </p>
              )}
            </div>

            <Separator />

            {/* Detalles de la Reserva */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="font-medium">{booking.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hora</p>
                  <p className="font-medium">{booking.type === 'finca' ? 'Check-in 2:00 PM' : '07:00 AM'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Participantes</p>
                  <p className="font-medium">{booking.participants} persona{booking.participants > 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monto Total</p>
                  <p className="font-medium text-green-600">${booking.totalAmount?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {booking.duration && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm"><strong>Duración:</strong> {booking.duration}</p>
              </div>
            )}

            {booking.includes && booking.includes.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-2">Incluye:</p>
                <ul className="text-sm space-y-1">
                  {booking.includes.map((item: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle2 className="w-3 h-3 text-green-600 mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {booking.specialRequests && booking.specialRequests !== 'Ninguna' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900 mb-1">Solicitudes Especiales:</p>
                <p className="text-sm text-blue-800">{booking.specialRequests}</p>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Información de Pago */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Información de Pago</h4>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Monto Total</p>
                  <p className="font-bold text-lg">${booking.totalAmount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Monto Pagado</p>
                  <p className="font-bold text-lg text-green-600">${booking.paidAmount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Monto Restante</p>
                  <p className={`font-bold text-lg ${booking.remainingAmount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    ${booking.remainingAmount?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Comprobante de Pago Inicial */}
            {booking.paymentReceipt && (
              <div className="bg-white border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <h5 className="font-medium">
                      Comprobante de Pago {booking.hasAccommodation ? 'Inicial (50%)' : 'Completo (100%)'}
                    </h5>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Verificado</Badge>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Comprobante subido el {booking.date}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(booking.paymentReceipt, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Ver Comprobante
                  </Button>
                </div>
              </div>
            )}

            {/* Sección para Subir Comprobante del Abono Faltante */}
            {needsRemainingPayment && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="mt-1">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-amber-900 mb-1">Abono Faltante</h5>
                    <p className="text-sm text-amber-800 mb-2">
                      Para confirmar tu reserva, debes pagar el 50% restante antes de la fecha del tour.
                    </p>
                    <p className="text-sm font-medium text-amber-900">
                      Monto por pagar: <span className="text-lg">${booking.remainingAmount?.toLocaleString()}</span>
                    </p>
                  </div>
                </div>

                <Separator className="my-4 bg-amber-200" />

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="receipt-upload" className="text-sm font-medium mb-2 block">
                      Subir Comprobante de Pago
                    </Label>
                    <Input
                      id="receipt-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos aceptados: JPG, PNG, PDF. Tamaño máximo: 5MB
                    </p>
                  </div>

                  {previewUrl && (
                    <div className="bg-white rounded-lg p-3 border-2 border-amber-300">
                      <p className="text-sm font-medium mb-2">Vista Previa:</p>
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-48 object-contain rounded-lg border"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelUpload}
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                          disabled={isUploading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        <strong>Archivo:</strong> {uploadedFile?.name}
                      </p>
                    </div>
                  )}

                  {uploadedFile && (
                    <Button
                      onClick={handleUploadReceipt}
                      disabled={isUploading}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      {isUploading ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Confirmar y Subir Comprobante
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Nota:</strong> Una vez subido el comprobante, nuestro equipo lo verificará en un plazo de 24 horas. Recibirás una confirmación por correo electrónico.
                  </p>
                </div>
              </div>
            )}

            {/* Comprobante del Abono ya Subido */}
            {booking.paymentStatus === 'partial' && booking.remainingPaymentReceipt && (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h5 className="font-medium text-green-900">Comprobante del Abono Faltante</h5>
                  <Badge className="bg-yellow-100 text-yellow-800 ml-auto">En Revisión</Badge>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-green-800 mb-2">
                    Tu comprobante ha sido recibido y está en proceso de verificación.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(booking.remainingPaymentReceipt, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Ver Comprobante Subido
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Información Adicional */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium mb-2">Información Adicional</h5>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>• Fecha límite de cancelación: <strong>{booking.cancellationDeadline}</strong></p>
              {booking.canCancel && (
                <p className="text-green-600">• Cancelación gratuita disponible</p>
              )}
              <p>• Contacto de emergencia: +57 300 123 4567</p>
            </div>
          </div>
        </CardContent>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {needsRemainingPayment && !uploadedFile && (
            <Button className="bg-green-600 hover:bg-green-700" disabled>
              <Upload className="w-4 h-4 mr-2" />
              Subir Comprobante
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
