import React, { useState } from 'react';
import { FileCheck, X, Eye, Check, AlertTriangle, Clock, Upload, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';  
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner@2.0.3';

interface StatusManagerProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'reserva' | 'finca' | 'paquete';
  itemId: string;
  currentStatus: string;
  itemDetails: any;
}

export function StatusManager({ 
  isOpen, 
  onClose, 
  itemType, 
  itemId, 
  currentStatus, 
  itemDetails 
}: StatusManagerProps) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);

  // Mock payment proof data
  const paymentProof = {
    id: 'COMP001',
    uploadDate: '2024-09-12 14:30',
    fileName: 'comprobante_pago_R456.jpg',
    amount: '$120.000',
    bank: 'Bancolombia',
    reference: 'TRX123456789',
    status: 'Pendiente Verificación'
  };

  const getStatusOptions = () => {
    switch (itemType) {
      case 'reserva':
        return [
          { value: 'Pendiente', label: 'Pendiente', color: 'bg-orange-100 text-orange-800' },
          { value: 'Comprobante Recibido', label: 'Comprobante Recibido', color: 'bg-blue-100 text-blue-800' },
          { value: 'Verificando Pago', label: 'Verificando Pago', color: 'bg-yellow-100 text-yellow-800' },
          { value: 'Confirmada', label: 'Confirmada', color: 'bg-green-100 text-green-800' },
          { value: 'Cancelada', label: 'Cancelada', color: 'bg-red-100 text-red-800' },
          { value: 'Reembolsada', label: 'Reembolsada', color: 'bg-purple-100 text-purple-800' }
        ];
      case 'finca':
        return [
          { value: 'Disponible', label: 'Disponible', color: 'bg-green-100 text-green-800' },
          { value: 'Mantenimiento', label: 'En Mantenimiento', color: 'bg-orange-100 text-orange-800' },
          { value: 'Reservada', label: 'Reservada', color: 'bg-blue-100 text-blue-800' },
          { value: 'No Disponible', label: 'No Disponible', color: 'bg-red-100 text-red-800' }
        ];
      case 'paquete':
        return [
          { value: 'Activo', label: 'Activo', color: 'bg-green-100 text-green-800' },
          { value: 'Pausado', label: 'Pausado', color: 'bg-orange-100 text-orange-800' },
          { value: 'Agotado', label: 'Agotado', color: 'bg-red-100 text-red-800' },
          { value: 'Promoción', label: 'En Promoción', color: 'bg-purple-100 text-purple-800' }
        ];
      default:
        return [];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmada':
      case 'Disponible':
      case 'Activo':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'Pendiente':
      case 'Verificando Pago':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'Cancelada':
      case 'No Disponible':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <FileCheck className="w-4 h-4 text-blue-600" />;
    }
  };

  const handleStatusUpdate = async () => {
    setIsUpdating(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast.success('Estado actualizado exitosamente', {
      description: `${itemType} ${itemId} cambió a "${newStatus}"`
    });

    setIsUpdating(false);
    onClose();
  };

  const handleViewProof = () => {
    setShowProofModal(true);
  };

  const handleApproveProof = async () => {
    setIsUpdating(true);
    
    // Simulate approval process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Comprobante aprobado', {
      description: 'La reserva ha sido confirmada automáticamente'
    });
    
    setNewStatus('Confirmada');
    setIsUpdating(false);
    setShowProofModal(false);
  };

  const handleRejectProof = async () => {
    setIsUpdating(true);
    
    // Simulate rejection process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.error('Comprobante rechazado', {
      description: 'Se notificó al cliente para reenviar el comprobante'
    });
    
    setNewStatus('Pendiente');
    setIsUpdating(false);
    setShowProofModal(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-white shadow-xl border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-green-600" />
              <CardTitle>Gestionar Estado</CardTitle>
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

          <CardContent className="space-y-6">
            {/* Current Item Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm">{itemType.toUpperCase()} #{itemId}</h4>
                <Badge className={getStatusOptions().find(s => s.value === currentStatus)?.color}>
                  {getStatusIcon(currentStatus)}
                  <span className="ml-1">{currentStatus}</span>
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Cliente: {itemDetails?.client || 'María López'} | 
                Fecha: {itemDetails?.date || '15 Sep 2024'} |
                Monto: {itemDetails?.amount || '$120.000'}
              </p>
            </div>

            {/* Payment Proof Section - Only for reservations */}
            {itemType === 'reserva' && (currentStatus === 'Comprobante Recibido' || currentStatus === 'Verificando Pago') && (
              <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm">Comprobante de Pago</h4>
                  <Badge className="bg-blue-100 text-blue-800">
                    Requiere Verificación
                  </Badge>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Archivo:</span>
                    <span>{paymentProof.fileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto:</span>
                    <span>{paymentProof.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Banco:</span>
                    <span>{paymentProof.bank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Referencia:</span>
                    <span>{paymentProof.reference}</span>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleViewProof}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Comprobante
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApproveProof}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={isUpdating}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRejectProof}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    disabled={isUpdating}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Rechazar
                  </Button>
                </div>
              </div>
            )}

            {/* Status Update */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm">Nuevo Estado:</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {getStatusOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(option.value)}
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm">Notas (opcional):</label>
                <Textarea
                  placeholder="Agregar comentarios sobre el cambio de estado..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={isUpdating || newStatus === currentStatus}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isUpdating ? 'Actualizando...' : 'Actualizar Estado'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Proof Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-xl border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Comprobante de Pago</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProofModal(false)}
                className="hover:bg-red-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Mock image placeholder */}
              <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Comprobante de Pago</p>
                  <p className="text-xs text-muted-foreground">Bancolombia - $120.000</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm" 
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Descargar
                </Button>
                <Button
                  onClick={handleApproveProof}
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isUpdating}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Aprobar
                </Button>
                <Button
                  onClick={handleRejectProof}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                  disabled={isUpdating}
                >
                  <X className="w-4 h-4 mr-1" />
                  Rechazar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}