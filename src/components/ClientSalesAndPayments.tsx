import React, { useState } from 'react';
import { Search, Eye, FileText, Calendar, DollarSign, CreditCard, X, ShoppingCart, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';

// Mock Sales Data
const mockSalesData = [
  {
    id: 'VEN-001',
    service: 'Tour Valle del Cocora',
    type: 'Ruta',
    date: '2024-11-15',
    amount: 450000,
    status: 'Pagado',
    paymentMethod: 'Tarjeta de Crédito',
    description: 'Tour completo al Valle del Cocora con guía profesional'
  },
  {
    id: 'VEN-002',
    service: 'Finca El Descanso - Hospedaje',
    type: 'Finca',
    date: '2024-10-20',
    amount: 800000,
    status: 'Pagado',
    paymentMethod: 'Transferencia',
    description: 'Hospedaje en finca por 2 noches, incluye desayuno'
  },
  {
    id: 'VEN-003',
    service: 'Aventura Extrema - Rafting',
    type: 'Ruta',
    date: '2024-09-05',
    amount: 350000,
    status: 'Pendiente',
    paymentMethod: 'Efectivo',
    description: 'Rafting en el río La Vieja, nivel intermedio'
  }
];

// Mock Payments Data
const mockPaymentsData = [
  {
    id: 'ABO-001',
    sale: 'VEN-003 - Aventura Extrema',
    saleId: 'VEN-003',
    amount: 150000,
    date: '2024-11-18',
    paymentMethod: 'Efectivo',
    totalSale: 350000,
    remaining: 200000,
    status: 'Confirmado',
    notes: 'Primer abono del paquete de aventura'
  },
  {
    id: 'ABO-002',
    sale: 'VEN-002 - Finca El Descanso',
    saleId: 'VEN-002',
    amount: 400000,
    date: '2024-10-15',
    paymentMethod: 'Transferencia',
    totalSale: 800000,
    remaining: 400000,
    status: 'Confirmado',
    notes: 'Abono del 50% para reserva'
  },
  {
    id: 'ABO-003',
    sale: 'VEN-002 - Finca El Descanso',
    saleId: 'VEN-002',
    amount: 400000,
    date: '2024-10-22',
    paymentMethod: 'Transferencia',
    totalSale: 800000,
    remaining: 0,
    status: 'Confirmado',
    notes: 'Pago final completando el hospedaje'
  },
  {
    id: 'ABO-004',
    sale: 'VEN-001 - Tour Valle del Cocora',
    saleId: 'VEN-001',
    amount: 450000,
    date: '2024-11-10',
    paymentMethod: 'Tarjeta de Crédito',
    totalSale: 450000,
    remaining: 0,
    status: 'Confirmado',
    notes: 'Pago completo en una sola transacción'
  }
];

export function ClientSalesTab() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = mockSalesData.filter(sale =>
    sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-gray-800 flex items-center space-x-2">
          <ShoppingCart className="w-6 h-6 text-green-600" />
          <span>Mis Ventas</span>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Historial completo de tus compras y servicios adquiridos
        </p>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por ID, servicio o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-green-200 focus:border-green-500"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setSearchTerm('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {filteredSales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron ventas con "{searchTerm}"
            </div>
          ) : (
            filteredSales.map((sale) => (
              <Card key={sale.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{sale.service}</h3>
                          <p className="text-sm text-gray-600">ID: {sale.id}</p>
                        </div>
                        <Badge className={
                          sale.status === 'Pagado' ? 'bg-green-100 text-green-800' :
                          sale.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {sale.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-3">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{sale.type}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <span>{new Date(sale.date).toLocaleDateString('es-ES')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-700">${sale.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4 text-green-600" />
                          <span>{sale.paymentMethod}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Detalle
                      </Button>
                      <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                        <FileText className="w-4 h-4 mr-1" />
                        Factura
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientPaymentsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const filteredPayments = mockPaymentsData.filter(payment =>
    payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.sale.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.saleId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetail = (payment: any) => {
    setSelectedPayment(payment);
    setShowDetailDialog(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-gray-800 flex items-center space-x-2">
            <Wallet className="w-6 h-6 text-green-600" />
            <span>Mis Abonos</span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Historial de pagos y abonos realizados a tus servicios
          </p>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por ID de abono o venta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-500"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron abonos con "{searchTerm}"
              </div>
            ) : (
              filteredPayments.map((payment) => (
                <Card key={payment.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between space-y-4 md:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{payment.sale}</h3>
                            <p className="text-sm text-gray-600">ID Abono: {payment.id}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            {payment.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mt-3">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-500">Monto Abonado</p>
                              <p className="font-semibold text-blue-700">${payment.amount.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-500">Fecha</p>
                              <p className="font-medium">{new Date(payment.date).toLocaleDateString('es-ES')}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-500">Método de Pago</p>
                              <p className="font-medium">{payment.paymentMethod}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <span className="text-gray-600">Total de la venta:</span>
                              <span className="ml-2 font-semibold text-gray-800">${payment.totalSale.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Saldo restante:</span>
                              <span className={`ml-2 font-semibold ${payment.remaining === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                ${payment.remaining.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          {payment.remaining === 0 && (
                            <p className="text-xs text-green-600 mt-1 font-medium">✓ Venta completamente pagada</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          onClick={() => handleViewDetail(payment)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalle
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-green-800 flex items-center gap-2">
              <Wallet className="w-6 h-6" />
              Detalle del Abono
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6 mt-4">
              {/* Header Info */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">ID del Abono</p>
                    <p className="text-xl font-semibold text-gray-800">{selectedPayment.id}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-lg px-4 py-2">
                    {selectedPayment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Venta Asociada</p>
                  <p className="text-lg font-medium text-gray-800">{selectedPayment.sale}</p>
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Información del Pago</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <p className="text-sm text-gray-600">Monto Abonado</p>
                    </div>
                    <p className="text-2xl font-semibold text-blue-700">
                      ${selectedPayment.amount.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <p className="text-sm text-gray-600">Fecha del Abono</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      {new Date(selectedPayment.date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <p className="text-sm text-gray-600">Método de Pago</p>
                    </div>
                    <p className="text-lg font-medium text-gray-800">
                      {selectedPayment.paymentMethod}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <p className="text-sm text-gray-600">ID de la Venta</p>
                    </div>
                    <p className="text-lg font-medium text-gray-800">
                      {selectedPayment.saleId}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Sale Summary */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Resumen de la Venta</h3>
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total de la Venta:</span>
                    <span className="font-semibold text-gray-800 text-lg">
                      ${selectedPayment.totalSale.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Monto de este Abono:</span>
                    <span className="font-semibold text-blue-700 text-lg">
                      -${selectedPayment.amount.toLocaleString()}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Saldo Restante:</span>
                    <span className={`font-bold text-xl ${selectedPayment.remaining === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      ${selectedPayment.remaining.toLocaleString()}
                    </span>
                  </div>
                  {selectedPayment.remaining === 0 && (
                    <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium text-center">
                        ✓ ¡Venta completamente pagada!
                      </p>
                    </div>
                  )}
                  {selectedPayment.remaining > 0 && (
                    <div className="mt-3 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                      <p className="text-orange-800 font-medium text-center">
                        Pendiente: ${selectedPayment.remaining.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedPayment.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Observaciones</h3>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-gray-700">{selectedPayment.notes}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Descargar Comprobante
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetailDialog(false)}
                  className="border-gray-300"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
