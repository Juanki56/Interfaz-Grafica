import React, { useState } from 'react';
import { Calendar, User, Package, Users, DollarSign, Phone, Mail, Upload, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';

interface CreateBookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated: (booking: any) => void;
  availableTours?: any[];
}

export function CreateBookingForm({ 
  isOpen, 
  onClose, 
  onBookingCreated, 
  availableTours = []
}: CreateBookingFormProps) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientDocument: '',
    tourId: '',
    tourName: '',
    date: '',
    persons: '',
    specialRequests: '',
    emergencyContact: '',
    emergencyPhone: '',
    proofFile: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const [proofFileName, setProofFileName] = useState('');

  // Mock tours if none provided
  const tours = availableTours.length > 0 ? availableTours : [
    { id: '1', name: 'Caminata Sierra Nevada', price: 150000, capacity: 12 },
    { id: '2', name: 'Tour Cafetero', price: 120000, capacity: 15 },
    { id: '3', name: 'Avistamiento de Aves', price: 95000, capacity: 8 },
    { id: '4', name: 'Finca El Paraíso', price: 80000, capacity: 20 },
    { id: '5', name: 'Ruta del Café', price: 110000, capacity: 10 }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // If tour changes, update tour name
      if (field === 'tourId') {
        const selectedTour = tours.find(tour => tour.id === value);
        updated.tourName = selectedTour ? selectedTour.name : '';
      }
      
      return updated;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo no debe exceder 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Solo se permiten PDF, JPG o PNG');
        return;
      }

      setFormData(prev => ({ ...prev, proofFile: file }));
      setProofFileName(file.name);
    }
  };

  const removeProofFile = () => {
    setFormData(prev => ({ ...prev, proofFile: null }));
    setProofFileName('');
  };

  const calculateTotal = () => {
    const selectedTour = tours.find(tour => tour.id === formData.tourId);
    const persons = parseInt(formData.persons) || 0;
    if (selectedTour && persons > 0) {
      return selectedTour.price * persons;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.clientEmail || !formData.tourId || 
        !formData.date || !formData.persons) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const selectedTour = tours.find(tour => tour.id === formData.tourId);
    const persons = parseInt(formData.persons);
    
    if (!selectedTour) {
      toast.error('Tour seleccionado no válido');
      return;
    }

    if (persons > selectedTour.capacity) {
      toast.error(`El tour seleccionado tiene capacidad máxima de ${selectedTour.capacity} personas`);
      return;
    }

    // Validate date is in the future
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error('La fecha de la reserva debe ser futura');
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newBooking = {
        id: Date.now().toString(),
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        clientDocument: formData.clientDocument,
        tourName: formData.tourName,
        tourId: formData.tourId,
        date: formData.date,
        persons: persons,
        totalAmount: calculateTotal(),
        status: 'pending',
        paymentStatus: 'pending',
        specialRequests: formData.specialRequests,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        proofFileName: proofFileName,
        proofFile: formData.proofFile ? {
          name: formData.proofFile.name,
          size: formData.proofFile.size,
          type: formData.proofFile.type
        } : null,
        createdAt: new Date().toISOString(),
        bookingDate: new Date().toISOString().split('T')[0]
      };

      onBookingCreated(newBooking);
      toast.success('Reserva creada exitosamente');
      
      // Reset form
      setFormData({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        clientDocument: '',
        tourId: '',
        tourName: '',
        date: '',
        persons: '',
        specialRequests: '',
        emergencyContact: '',
        emergencyPhone: '',
        proofFile: null
      });
      setProofFileName('');
      
      onClose();
    } catch (error) {
      toast.error('Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Crear Nueva Reserva</span>
          </DialogTitle>
          <DialogDescription>
            Completa la información para crear una nueva reserva turística
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Información del Cliente
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nombre Completo *</Label>
                <Input
                  id="clientName"
                  placeholder="Nombre del cliente"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientDocument">Documento</Label>
                <Input
                  id="clientDocument"
                  placeholder="Número de identificación"
                  value={formData.clientDocument}
                  onChange={(e) => handleInputChange('clientDocument', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Correo Electrónico *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.clientEmail}
                  onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientPhone">Teléfono</Label>
                <Input
                  id="clientPhone"
                  placeholder="Número de teléfono"
                  value={formData.clientPhone}
                  onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Tour Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Información del Tour
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tourId">Seleccionar Tour *</Label>
                <Select value={formData.tourId} onValueChange={(value) => handleInputChange('tourId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige un tour" />
                  </SelectTrigger>
                  <SelectContent>
                    {tours.map((tour) => (
                      <SelectItem key={tour.id} value={tour.id}>
                        {tour.name} - ${tour.price.toLocaleString()} COP
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="persons">Número de Personas *</Label>
                <Input
                  id="persons"
                  type="number"
                  min="1"
                  max="50"
                  placeholder="0"
                  value={formData.persons}
                  onChange={(e) => handleInputChange('persons', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha del Tour *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Contacto de Emergencia
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Nombre del Contacto</Label>
                <Input
                  id="emergencyContact"
                  placeholder="Nombre completo"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Teléfono de Emergencia</Label>
                <Input
                  id="emergencyPhone"
                  placeholder="Número de teléfono"
                  value={formData.emergencyPhone}
                  onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label htmlFor="specialRequests">Solicitudes Especiales</Label>
            <Textarea
              id="specialRequests"
              placeholder="Requisitos dietarios, necesidades especiales, etc."
              value={formData.specialRequests}
              onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              rows={3}
            />
          </div>

          {/* Proof of Payment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Comprobante de Pago
            </h3>

            <div className="space-y-2">
              <Label htmlFor="proofFile">Adjuntar Comprobante (PDF, JPG, PNG)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                <input
                  id="proofFile"
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                <label htmlFor="proofFile" className="cursor-pointer flex flex-col items-center space-y-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Haz clic para seleccionar o arrastra un archivo
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Máximo 5MB - PDF, JPG o PNG
                    </p>
                  </div>
                </label>
              </div>

              {proofFileName && (
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{proofFileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeProofFile}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          {total > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-green-900">Total a Pagar:</span>
                <span className="text-xl font-bold text-green-900">
                  ${total.toLocaleString()} COP
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {formData.persons} persona(s) × ${tours.find(t => t.id === formData.tourId)?.price.toLocaleString() || 0} COP
              </p>
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Creando...' : 'Crear Reserva'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}