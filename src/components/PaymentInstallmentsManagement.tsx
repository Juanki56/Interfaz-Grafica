import React, { useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { 
  Plus,
  Search,
  Eye,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  Printer,
  AlertTriangle,
  Upload,
  Download,
  DollarSign,
  Clock,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

// ===========================
// INTERFACES Y TIPOS
// ===========================

interface Client {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
}

interface Reservation {
  id: string;
  client: Client;
  serviceType: 'Ruta' | 'Finca' | 'Servicio';
  serviceName: string;
  totalAmount: number;
  paidAmount: number;
  pendingBalance: number;
  date: string;
  serviceDetails?: any;
}

interface PaymentInstallment {
  id: string;
  client: Client;
  reservation: Reservation;
  amount: number;
  date: string;
  status: 'Pagado parcial' | 'Pendiente';
  paymentMethod: string;
  receiptUrl?: string;
  cancellationDate?: string;
  cancellationReason?: string;
}

interface CancelledInstallment extends PaymentInstallment {
  cancellationDate: string;
  cancellationReason: string;
}

type ViewMode = 'list' | 'create' | 'detail';

// ===========================
// DATOS MOCK
// ===========================

const mockClients: Client[] = [
  { id: '1', name: 'Carlos Méndez', document: '1234567890', phone: '3001234567', email: 'carlos@email.com' },
  { id: '2', name: 'Ana López', document: '0987654321', phone: '3009876543', email: 'ana@email.com' },
  { id: '3', name: 'Miguel Torres', document: '1122334455', phone: '3001122334', email: 'miguel@email.com' },
  { id: '4', name: 'Laura Gómez', document: '9988776655', phone: '3009988776', email: 'laura@email.com' },
];

const mockReservations: Reservation[] = [
  {
    id: 'R-001',
    client: mockClients[0],
    serviceType: 'Ruta',
    serviceName: 'Cascada El Paraíso',
    totalAmount: 850000,
    paidAmount: 300000,
    pendingBalance: 550000,
    date: '2024-12-15',
    serviceDetails: { distance: '12 km', difficulty: 'Moderada' }
  },
  {
    id: 'R-002',
    client: mockClients[1],
    serviceType: 'Finca',
    serviceName: 'Finca Villa María',
    totalAmount: 1200000,
    paidAmount: 500000,
    pendingBalance: 700000,
    date: '2024-12-20',
    serviceDetails: { capacity: 50, location: 'Quindío' }
  },
  {
    id: 'R-003',
    client: mockClients[2],
    serviceType: 'Servicio',
    serviceName: 'Paquete Completo',
    totalAmount: 450000,
    paidAmount: 150000,
    pendingBalance: 300000,
    date: '2024-12-25',
    serviceDetails: { services: ['Transporte', 'Alimentación'] }
  },
  {
    id: 'R-004',
    client: mockClients[0],
    serviceType: 'Finca',
    serviceName: 'Finca El Descanso',
    totalAmount: 600000,
    paidAmount: 200000,
    pendingBalance: 400000,
    date: '2024-12-28',
    serviceDetails: { capacity: 30, location: 'Risaralda' }
  },
];

const mockInstallments: PaymentInstallment[] = [
  {
    id: 'A-001',
    client: mockClients[0],
    reservation: mockReservations[0],
    amount: 300000,
    date: '2024-11-20',
    status: 'Pagado parcial',
    paymentMethod: 'Transferencia',
    receiptUrl: 'https://example.com/receipt1.pdf'
  },
  {
    id: 'A-002',
    client: mockClients[1],
    reservation: mockReservations[1],
    amount: 500000,
    date: '2024-11-22',
    status: 'Pagado parcial',
    paymentMethod: 'Efectivo'
  },
  {
    id: 'A-003',
    client: mockClients[2],
    reservation: mockReservations[2],
    amount: 150000,
    date: '2024-11-23',
    status: 'Pendiente',
    paymentMethod: 'Tarjeta',
    receiptUrl: 'https://example.com/receipt3.pdf'
  },
  {
    id: 'A-004',
    client: mockClients[3],
    reservation: mockReservations[0],
    amount: 250000,
    date: '2024-11-24',
    status: 'Pagado parcial',
    paymentMethod: 'Transferencia',
    receiptUrl: 'https://example.com/receipt4.pdf'
  },
  {
    id: 'A-005',
    client: mockClients[0],
    reservation: mockReservations[1],
    amount: 400000,
    date: '2024-11-25',
    status: 'Pagado completo',
    paymentMethod: 'Efectivo'
  },
  {
    id: 'A-006',
    client: mockClients[1],
    reservation: mockReservations[2],
    amount: 180000,
    date: '2024-11-26',
    status: 'Pendiente',
    paymentMethod: 'Tarjeta'
  },
  {
    id: 'A-007',
    client: mockClients[2],
    reservation: mockReservations[0],
    amount: 320000,
    date: '2024-11-27',
    status: 'Pagado parcial',
    paymentMethod: 'Transferencia',
    receiptUrl: 'https://example.com/receipt7.pdf'
  },
  {
    id: 'A-008',
    client: mockClients[3],
    reservation: mockReservations[1],
    amount: 450000,
    date: '2024-11-28',
    status: 'Pagado completo',
    paymentMethod: 'Efectivo'
  },
  {
    id: 'A-009',
    client: mockClients[0],
    reservation: mockReservations[2],
    amount: 220000,
    date: '2024-11-29',
    status: 'Pagado parcial',
    paymentMethod: 'Tarjeta',
    receiptUrl: 'https://example.com/receipt9.pdf'
  },
  {
    id: 'A-010',
    client: mockClients[1],
    reservation: mockReservations[0],
    amount: 350000,
    date: '2024-11-30',
    status: 'Pendiente',
    paymentMethod: 'Transferencia'
  },
  {
    id: 'A-011',
    client: mockClients[2],
    reservation: mockReservations[1],
    amount: 280000,
    date: '2024-12-01',
    status: 'Pagado parcial',
    paymentMethod: 'Efectivo'
  },
  {
    id: 'A-012',
    client: mockClients[3],
    reservation: mockReservations[2],
    amount: 420000,
    date: '2024-12-02',
    status: 'Pagado completo',
    paymentMethod: 'Tarjeta',
    receiptUrl: 'https://example.com/receipt12.pdf'
  },
  {
    id: 'A-013',
    client: mockClients[0],
    reservation: mockReservations[0],
    amount: 190000,
    date: '2024-12-03',
    status: 'Pendiente',
    paymentMethod: 'Transferencia'
  },
  {
    id: 'A-014',
    client: mockClients[1],
    reservation: mockReservations[1],
    amount: 380000,
    date: '2024-12-04',
    status: 'Pagado parcial',
    paymentMethod: 'Efectivo',
    receiptUrl: 'https://example.com/receipt14.pdf'
  },
  {
    id: 'A-015',
    client: mockClients[2],
    reservation: mockReservations[2],
    amount: 260000,
    date: '2024-12-05',
    status: 'Pagado completo',
    paymentMethod: 'Tarjeta'
  },
  {
    id: 'A-016',
    client: mockClients[3],
    reservation: mockReservations[0],
    amount: 340000,
    date: '2024-12-06',
    status: 'Pagado parcial',
    paymentMethod: 'Transferencia',
    receiptUrl: 'https://example.com/receipt16.pdf'
  },
  {
    id: 'A-017',
    client: mockClients[0],
    reservation: mockReservations[1],
    amount: 210000,
    date: '2024-12-07',
    status: 'Pendiente',
    paymentMethod: 'Efectivo'
  },
  {
    id: 'A-018',
    client: mockClients[1],
    reservation: mockReservations[2],
    amount: 470000,
    date: '2024-12-08',
    status: 'Pagado completo',
    paymentMethod: 'Tarjeta',
    receiptUrl: 'https://example.com/receipt18.pdf'
  },
  {
    id: 'A-019',
    client: mockClients[2],
    reservation: mockReservations[0],
    amount: 295000,
    date: '2024-12-09',
    status: 'Pagado parcial',
    paymentMethod: 'Transferencia'
  },
  {
    id: 'A-020',
    client: mockClients[3],
    reservation: mockReservations[1],
    amount: 385000,
    date: '2024-12-10',
    status: 'Pendiente',
    paymentMethod: 'Efectivo'
  },
  {
    id: 'A-021',
    client: mockClients[0],
    reservation: mockReservations[2],
    amount: 230000,
    date: '2024-12-11',
    status: 'Pagado completo',
    paymentMethod: 'Tarjeta',
    receiptUrl: 'https://example.com/receipt21.pdf'
  },
  {
    id: 'A-022',
    client: mockClients[1],
    reservation: mockReservations[0],
    amount: 360000,
    date: '2024-12-12',
    status: 'Pagado parcial',
    paymentMethod: 'Transferencia'
  }
];

// ===========================
// COMPONENTE PRINCIPAL
// ===========================

interface PaymentInstallmentsManagementProps {
  userRole?: 'admin' | 'advisor';
}

export function PaymentInstallmentsManagement({ userRole = 'admin' }: PaymentInstallmentsManagementProps) {
  // Permisos
  const { hasPermission } = usePermissions();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null);
  const [installments, setInstallments] = useState<PaymentInstallment[]>(mockInstallments);
  const [cancelledInstallments, setCancelledInstallments] = useState<CancelledInstallment[]>([]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Control del diálogo de anulación
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [installmentToCancel, setInstallmentToCancel] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  const handleCreateInstallment = (newInstallment: PaymentInstallment) => {
    setInstallments([newInstallment, ...installments]);
    setViewMode('list');
  };

  const handleViewDetail = (installment: PaymentInstallment) => {
    setSelectedInstallment(installment);
    setViewMode('detail');
  };

  const handleInitiateCancellation = (installmentId: string) => {
    setInstallmentToCancel(installmentId);
    setShowCancelDialog(true);
  };

  const handleConfirmCancellation = () => {
    if (installmentToCancel) {
      const installmentToUpdate = installments.find(i => i.id === installmentToCancel);
      if (installmentToUpdate) {
        const cancelledInstallment: CancelledInstallment = {
          ...installmentToUpdate,
          status: 'Pendiente',
          cancellationDate: new Date().toISOString().split('T')[0],
          cancellationReason: cancellationReason || 'Sin motivo especificado'
        };

        setInstallments(installments.filter(i => i.id !== installmentToCancel));
        setCancelledInstallments([cancelledInstallment, ...cancelledInstallments]);

        if (selectedInstallment?.id === installmentToCancel) {
          setViewMode('list');
        }

        console.log('Abono anulado:', cancelledInstallment);
      }

      setShowCancelDialog(false);
      setInstallmentToCancel(null);
      setCancellationReason('');
    }
  };

  const handleCancelDialogClose = () => {
    setShowCancelDialog(false);
    setInstallmentToCancel(null);
    setCancellationReason('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AnimatePresence mode="wait">
        {viewMode === 'list' && (
          <InstallmentsListView
            key="list"
            installments={installments}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onCreateNew={() => setViewMode('create')}
            onViewDetail={handleViewDetail}
            onCancelInstallment={handleInitiateCancellation}
            userRole={userRole}
            hasPermission={hasPermission}
          />
        )}
        
        {viewMode === 'create' && (
          <CreateInstallmentView
            key="create"
            onBack={() => setViewMode('list')}
            onCreate={handleCreateInstallment}
            clients={mockClients}
            reservations={mockReservations}
          />
        )}
        
        {viewMode === 'detail' && selectedInstallment && (
          <InstallmentDetailView
            key="detail"
            installment={selectedInstallment}
            onBack={() => setViewMode('list')}
            onCancel={handleInitiateCancellation}
            userRole={userRole}
            hasPermission={hasPermission}
          />
        )}
      </AnimatePresence>

      {/* Diálogo de Confirmación de Anulación */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-white border-2 border-red-200">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-red-900">
                Advertencia: Anular Abono
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p className="text-gray-700">
                  Estás a punto de <span className="font-semibold">anular permanentemente</span> el abono{' '}
                  <span className="font-semibold text-red-700">{installmentToCancel}</span>.
                </p>
                <p className="text-gray-700">
                  Esta acción eliminará el registro del abono y el monto será devuelto al saldo pendiente 
                  de la reserva asociada.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Importante:</strong> Esta acción no se puede deshacer. El abono será 
                    eliminado del sistema y se guardará un registro de la anulación.
                  </p>
                </div>
                
                <div className="mt-4 space-y-2">
                  <Label htmlFor="cancellation-reason" className="text-gray-900">
                    Motivo de la anulación (opcional)
                  </Label>
                  <Textarea
                    id="cancellation-reason"
                    placeholder="Ej: Error en el monto, pago duplicado, cliente canceló..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="min-h-[80px] border-gray-300 focus:border-red-500"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={handleCancelDialogClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancellation}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sí, Anular Abono
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ===========================
// PANTALLA 1: LISTA DE ABONOS
// ===========================

interface InstallmentsListViewProps {
  installments: PaymentInstallment[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  onCreateNew: () => void;
  onViewDetail: (installment: PaymentInstallment) => void;
  onCancelInstallment: (installmentId: string) => void;
  userRole?: 'admin' | 'advisor';
  hasPermission?: (perm: string) => boolean;
}

function InstallmentsListView({
  installments,
  searchTerm,
  setSearchTerm,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  onCreateNew,
  onViewDetail,
  onCancelInstallment,
  userRole = 'admin',
  hasPermission
}: InstallmentsListViewProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: PaymentInstallment['status']) => {
    const styles = {
      'Pagado parcial': 'bg-green-100 text-green-700 border-green-200',
      'Pendiente': 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return styles[status];
  };

  const filteredInstallments = installments.filter(installment => {
    const matchesSearch = 
      installment.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      installment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      installment.date.includes(searchTerm);
    
    const matchesDateFrom = !dateFrom || installment.date >= dateFrom;
    const matchesDateTo = !dateTo || installment.date <= dateTo;
    
    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const totalPages = Math.ceil(filteredInstallments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInstallments = filteredInstallments.slice(startIndex, startIndex + itemsPerPage);

  const handleGeneratePDF = (installment: PaymentInstallment) => {
    alert(`Generando PDF para el abono ${installment.id}...`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-green-800">Gestión de Abonos</h1>
          <p className="text-gray-600 mt-1">Administra todos los abonos y pagos parciales</p>
        </div>
        {(hasPermission?.('abonos.crear') || userRole === 'admin') && (
          <Button 
            onClick={onCreateNew}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Registrar Abono
          </Button>
        )}
      </div>

      {/* Barra de búsqueda y filtros */}
      <Card className="border-green-100 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Barra de búsqueda */}
            <div className="lg:col-span-2">
              <Label>Buscar</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por cliente o fecha..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-green-500"
                />
              </div>
            </div>

            {/* Fecha desde */}
            <div>
              <Label>Desde</Label>
              <div className="relative mt-2">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-green-500"
                />
              </div>
            </div>

            {/* Fecha hasta */}
            <div>
              <Label>Hasta</Label>
              <div className="relative mt-2">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-green-500"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Abonos */}
      <Card className="border-green-100 shadow-sm">
        <CardContent className="p-6">
          <Table>
              <TableHeader>
                <TableRow className="border-green-100 bg-green-50">
                  <TableHead className="text-green-800">ID Abono</TableHead>
                  <TableHead className="text-green-800">Cliente</TableHead>
                  <TableHead className="text-green-800">Servicio Asociado</TableHead>
                  <TableHead className="text-green-800">Monto Abonado</TableHead>
                  <TableHead className="text-green-800">Fecha</TableHead>
                  <TableHead className="text-green-800">Estado</TableHead>
                  <TableHead className="text-green-800 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInstallments.map((installment, index) => (
                  <TableRow 
                    key={`${installment.id}-${index}`} 
                    className={`border-green-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <TableCell className="font-medium text-green-700">{installment.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{installment.client.name}</p>
                        <p className="text-sm text-gray-500">{installment.client.document}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{installment.reservation.serviceName}</p>
                        <p className="text-sm text-gray-500">{installment.reservation.serviceType}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {formatCurrency(installment.amount)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(installment.date).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusBadge(installment.status)}>
                        {installment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Ver Detalle */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetail(installment)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Ver Detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {/* Generar PDF */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGeneratePDF(installment)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Generar PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>

                        {/* Anular Abono (según permiso) */}
                        {(hasPermission?.('abonos.eliminar') || userRole === 'admin') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCancelInstallment(installment.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Anular Abono"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredInstallments.length)} de {filteredInstallments.length} abonos
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ===========================
// PANTALLA 2: REGISTRAR ABONO
// ===========================

interface CreateInstallmentViewProps {
  onBack: () => void;
  onCreate: (installment: PaymentInstallment) => void;
  clients: Client[];
  reservations: Reservation[];
}

function CreateInstallmentView({ onBack, onCreate, clients, reservations }: CreateInstallmentViewProps) {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedReservation, setSelectedReservation] = useState<string>('');
  const [installmentAmount, setInstallmentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('transferencia');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Obtener cliente seleccionado
  const clientData = clients.find(c => c.id === selectedClient);
  
  // Filtrar reservas del cliente seleccionado
  const clientReservations = selectedClient 
    ? reservations.filter(r => r.client.id === selectedClient && r.pendingBalance > 0)
    : [];

  // Obtener reserva seleccionada
  const reservationData = reservations.find(r => r.id === selectedReservation);

  // Calcular saldo restante después del abono
  const amount = parseFloat(installmentAmount) || 0;
  const remainingBalance = reservationData 
    ? reservationData.pendingBalance - amount
    : 0;

  // Historial de abonos del cliente (mock)
  const clientInstallmentHistory = selectedClient 
    ? mockInstallments.filter(i => i.client.id === selectedClient).slice(0, 3)
    : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!selectedClient) {
      alert('Debes seleccionar un cliente');
      return;
    }

    if (!selectedReservation) {
      alert('Debes seleccionar una reserva asociada');
      return;
    }

    if (!installmentAmount || amount <= 0) {
      alert('Debes ingresar un monto válido');
      return;
    }

    if (reservationData && amount > reservationData.pendingBalance) {
      alert('El monto abonado no puede ser mayor al saldo pendiente');
      return;
    }

    const client = clients.find(c => c.id === selectedClient)!;
    const reservation = reservations.find(r => r.id === selectedReservation)!;

    const newInstallment: PaymentInstallment = {
      id: `A-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      client,
      reservation,
      amount,
      date: new Date().toISOString().split('T')[0],
      status: remainingBalance > 0 ? 'Pagado parcial' : 'Pagado parcial',
      paymentMethod,
      receiptUrl: receiptFile ? URL.createObjectURL(receiptFile) : undefined
    };

    onCreate(newInstallment);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-green-700 hover:bg-green-50">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-green-800">Registrar Nuevo Abono</h1>
          <p className="text-gray-600 mt-1">Completa la información del abono</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal - Formulario */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECCIÓN 1: DATOS DEL CLIENTE */}
          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Sección 1: Datos del Cliente</h2>
              <div className="space-y-4">
                <div>
                  <Label>Cliente *</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="mt-2 border-gray-200 focus:border-green-500">
                      <SelectValue placeholder="Selecciona un cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} — {client.document}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mostrar datos del cliente seleccionado */}
                {clientData && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Documento</p>
                        <p className="font-medium text-gray-900">{clientData.document}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Teléfono</p>
                        <p className="font-medium text-gray-900">{clientData.phone}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Historial rápido de abonos del cliente */}
                {clientInstallmentHistory.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Historial de Abonos:</p>
                    <div className="space-y-2">
                      {clientInstallmentHistory.map(inst => (
                        <div key={inst.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                          <span className="text-gray-600">{new Date(inst.date).toLocaleDateString('es-CO')}</span>
                          <span className="font-medium text-gray-900">{formatCurrency(inst.amount)}</span>
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            {inst.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SECCIÓN 2: INFORMACIÓN DEL SERVICIO ASOCIADO */}
          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Sección 2: Información del Servicio Asociado</h2>
              <div className="space-y-4">
                <div>
                  <Label>Reserva Asociada *</Label>
                  <Select 
                    value={selectedReservation} 
                    onValueChange={setSelectedReservation}
                    disabled={!selectedClient}
                  >
                    <SelectTrigger className="mt-2 border-gray-200 focus:border-green-500">
                      <SelectValue placeholder={selectedClient ? "Selecciona una reserva..." : "Primero selecciona un cliente"} />
                    </SelectTrigger>
                    <SelectContent>
                      {clientReservations.length > 0 ? (
                        clientReservations.map(reservation => (
                          <SelectItem key={reservation.id} value={reservation.id}>
                            {reservation.id} — {reservation.serviceName} — Pendiente: {formatCurrency(reservation.pendingBalance)}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No hay reservas con saldo pendiente
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mostrar detalles de la reserva seleccionada */}
                {reservationData && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Tipo de Servicio</p>
                        <p className="font-medium text-gray-900">{reservationData.serviceType}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Fecha</p>
                        <p className="font-medium text-gray-900">
                          {new Date(reservationData.date).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Precio Total</p>
                        <p className="font-medium text-gray-900">{formatCurrency(reservationData.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Saldo Pendiente</p>
                        <p className="font-medium text-red-700">{formatCurrency(reservationData.pendingBalance)}</p>
                      </div>
                    </div>
                    
                    {/* Monto sugerido */}
                    <div className="pt-3 border-t border-blue-300">
                      <p className="text-xs text-gray-600 mb-1">Monto Sugerido:</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInstallmentAmount(String(reservationData.pendingBalance / 2))}
                          className="text-xs border-green-300 text-green-700 hover:bg-green-50"
                        >
                          50% — {formatCurrency(reservationData.pendingBalance / 2)}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInstallmentAmount(String(reservationData.pendingBalance))}
                          className="text-xs border-green-300 text-green-700 hover:bg-green-50"
                        >
                          100% — {formatCurrency(reservationData.pendingBalance)}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SECCIÓN 3: MONTO DEL ABONO */}
          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Sección 3: Monto del Abono</h2>
              <div className="space-y-4">
                <div>
                  <Label>Monto Abonado *</Label>
                  <div className="relative mt-2">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="Ingresa el monto abonado..."
                      value={installmentAmount}
                      onChange={(e) => setInstallmentAmount(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-green-500"
                      min="0"
                      max={reservationData?.pendingBalance || 0}
                    />
                  </div>
                  {amount > 0 && reservationData && amount > reservationData.pendingBalance && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ El monto no puede ser mayor al saldo pendiente
                    </p>
                  )}
                </div>

                <div>
                  <Label>Método de Pago *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="mt-2 border-gray-200 focus:border-green-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Upload de comprobante */}
                <div>
                  <Label>Comprobante de Pago (Opcional)</Label>
                  <div className="mt-2">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          {receiptFile ? receiptFile.name : 'Haz clic para subir un comprobante'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF (MAX. 5MB)</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral derecho: Resumen */}
        <div className="lg:col-span-1">
          <Card className="border-green-100 shadow-sm sticky top-6">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Resumen del Abono</h2>
              
              <div className="space-y-4">
                {clientData && (
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Cliente</p>
                    <p className="font-medium text-gray-900">{clientData.name}</p>
                    <p className="text-sm text-gray-500">{clientData.document}</p>
                  </div>
                )}

                {reservationData && (
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Reserva</p>
                    <p className="font-medium text-gray-900">{reservationData.serviceName}</p>
                    <p className="text-sm text-gray-500">{reservationData.serviceType}</p>
                  </div>
                )}

                {amount > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monto Abonado</span>
                      <span className="font-medium text-green-700">
                        {formatCurrency(amount)}
                      </span>
                    </div>

                    {reservationData && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Saldo Anterior</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(reservationData.pendingBalance)}
                          </span>
                        </div>

                        <div className="pt-3 border-t-2 border-green-200">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">Saldo Restante</span>
                            <span className={`font-semibold ${remainingBalance === 0 ? 'text-green-700' : 'text-orange-700'}`}>
                              {formatCurrency(remainingBalance)}
                            </span>
                          </div>
                        </div>

                        {remainingBalance === 0 && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-700 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              Reserva completamente pagada
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                <div className="pt-4 space-y-3">
                  <div>
                    <Label className="text-sm text-gray-600">Estado</Label>
                    <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-700 w-full justify-center">
                      Pendiente
                    </Badge>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Método de Pago</Label>
                    <p className="mt-1 font-medium text-gray-900 capitalize">{paymentMethod}</p>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <Button 
                    onClick={handleSubmit}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={!selectedClient || !selectedReservation || !installmentAmount || amount <= 0}
                  >
                    Registrar Abono
                  </Button>
                  <Button 
                    onClick={onBack}
                    variant="outline" 
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

// ===========================
// PANTALLA 3: VER DETALLE DEL ABONO
// ===========================

interface InstallmentDetailViewProps {
  installment: PaymentInstallment;
  onBack: () => void;
  onCancel: (installmentId: string) => void;
  userRole?: 'admin' | 'advisor';
  hasPermission?: (perm: string) => boolean;
}

function InstallmentDetailView({ installment, onBack, onCancel, userRole = 'admin', hasPermission }: InstallmentDetailViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: PaymentInstallment['status']) => {
    const styles = {
      'Pagado parcial': 'bg-green-100 text-green-700 border-green-200',
      'Pendiente': 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return styles[status];
  };

  const handlePrintPDF = () => {
    alert(`Generando PDF del abono ${installment.id}...`);
  };

  // Mock historial de abonos del cliente
  const clientHistory = mockInstallments.filter(i => i.client.id === installment.client.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="text-green-700 hover:bg-green-50">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-green-800">Detalle del Abono</h1>
            <p className="text-gray-600 mt-1">ID: {installment.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handlePrintPDF}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Printer className="w-4 h-4 mr-2" />
            Generar PDF
          </Button>
          {(hasPermission?.('abonos.eliminar') || userRole === 'admin') && (
            <Button 
              onClick={() => onCancel(installment.id)}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              Anular Abono
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* BLOQUE 1: INFORMACIÓN DEL CLIENTE */}
          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Información del Cliente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre Completo</p>
                  <p className="font-medium text-gray-900 mt-1">{installment.client.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Documento</p>
                  <p className="font-medium text-gray-900 mt-1">{installment.client.document}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium text-gray-900 mt-1">{installment.client.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900 mt-1">{installment.client.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BLOQUE 2: INFORMACIÓN DEL ABONO */}
          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Información del Abono</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ID del Abono</p>
                  <p className="font-medium text-gray-900 mt-1">{installment.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {new Date(installment.date).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monto Abonado</p>
                  <p className="font-medium text-green-700 mt-1">{formatCurrency(installment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Método de Pago</p>
                  <p className="font-medium text-gray-900 mt-1 capitalize">{installment.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <Badge variant="secondary" className={`mt-1 ${getStatusBadge(installment.status)}`}>
                    {installment.status}
                  </Badge>
                </div>
                {installment.receiptUrl && (
                  <div>
                    <p className="text-sm text-gray-600">Comprobante</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* BLOQUE 3: SERVICIO ASOCIADO */}
          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Servicio Asociado</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ID Reserva</p>
                  <p className="font-medium text-gray-900 mt-1">{installment.reservation.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Servicio</p>
                  <p className="font-medium text-gray-900 mt-1">{installment.reservation.serviceType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nombre del Servicio</p>
                  <p className="font-medium text-gray-900 mt-1">{installment.reservation.serviceName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha del Servicio</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {new Date(installment.reservation.date).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {formatCurrency(installment.reservation.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Saldo Pendiente</p>
                  <p className="font-medium text-red-700 mt-1">
                    {formatCurrency(installment.reservation.pendingBalance)}
                  </p>
                </div>
              </div>

              {/* Detalles específicos según el tipo de servicio */}
              {installment.reservation.serviceType === 'Ruta' && installment.reservation.serviceDetails && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Detalles de la Ruta:</p>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>📍 Distancia: {installment.reservation.serviceDetails.distance}</span>
                    <span>🏔️ Dificultad: {installment.reservation.serviceDetails.difficulty}</span>
                  </div>
                </div>
              )}

              {installment.reservation.serviceType === 'Finca' && installment.reservation.serviceDetails && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Detalles de la Finca:</p>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>👥 Capacidad: {installment.reservation.serviceDetails.capacity} personas</span>
                    <span>📍 Ubicación: {installment.reservation.serviceDetails.location}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* BLOQUE 4: HISTORIAL DEL CLIENTE */}
          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Historial del Cliente</h2>
              <p className="text-sm text-gray-600 mb-3">Abonos anteriores realizados por este cliente</p>
              <Table>
                  <TableHeader>
                    <TableRow className="border-green-100 bg-green-50">
                      <TableHead className="text-green-800">Fecha</TableHead>
                      <TableHead className="text-green-800">Monto</TableHead>
                      <TableHead className="text-green-800">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientHistory.map((hist, index) => (
                      <TableRow 
                        key={hist.id}
                        className={`border-green-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <TableCell className="text-gray-900">
                          {new Date(hist.date).toLocaleDateString('es-CO')}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {formatCurrency(hist.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusBadge(hist.status)}>
                            {hist.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </CardContent>
          </Card>
        </div>

        {/* Columna Lateral - Acciones */}
        <div className="lg:col-span-1">
          <Card className="border-green-100 shadow-sm sticky top-6">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Acciones Disponibles</h2>
              <div className="space-y-3">
                
                <Button 
                  onClick={handlePrintPDF}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Generar PDF
                </Button>
                
                {(hasPermission?.('abonos.eliminar') || userRole === 'admin') && (
                  <Button 
                    onClick={() => onCancel(installment.id)}
                    variant="outline"
                    className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Anular Abono
                  </Button>
                )}

                <Button 
                  onClick={onBack}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Volver al Listado
                </Button>
              </div>

              {/* Resumen rápido */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <h3 className="font-medium text-gray-900">Resumen Rápido</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium text-gray-900">{installment.client.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <Badge variant="secondary" className={getStatusBadge(installment.status)}>
                      {installment.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Servicio:</span>
                    <span className="font-medium text-gray-900">{installment.reservation.serviceType}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-900">Monto:</span>
                    <span className="font-medium text-green-700">
                      {formatCurrency(installment.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">Saldo Pendiente:</span>
                    <span className="font-medium text-red-700">
                      {formatCurrency(installment.reservation.pendingBalance)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}