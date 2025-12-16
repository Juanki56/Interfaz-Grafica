import React, { useState } from 'react';
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
  Mountain,
  Home,
  TrendingUp,
  DollarSign
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
import { Checkbox } from './ui/checkbox';
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

interface Route {
  id: string;
  name: string;
  distance: string;
  difficulty: string;
  price: number;
}

interface Farm {
  id: string;
  name: string;
  capacity: number;
  location: string;
  price: number;
}

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface Sale {
  id: string;
  client: Client;
  saleType: string;
  amount: number;
  date: string;
  status: 'Pagado' | 'Pendiente' | 'Anulado';
  mainService?: Route | Farm;
  additionalServices: Service[];
  paymentMethod: string;
  cancellationDate?: string;
  cancellationReason?: string;
}

interface CancelledSale extends Sale {
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
];

const mockRoutes: Route[] = [
  { id: '1', name: 'Cascada El Paraíso', distance: '12 km', difficulty: 'Moderada', price: 85000 },
  { id: '2', name: 'Montaña Verde', distance: '8 km', difficulty: 'Fácil', price: 65000 },
  { id: '3', name: 'Sendero del Cóndor', distance: '15 km', difficulty: 'Difícil', price: 120000 },
];

const mockFarms: Farm[] = [
  { id: '1', name: 'Finca Villa María', capacity: 50, location: 'Quindío', price: 450000 },
  { id: '2', name: 'Finca El Descanso', capacity: 30, location: 'Risaralda', price: 350000 },
  { id: '3', name: 'Finca Bella Vista', capacity: 80, location: 'Caldas', price: 600000 },
];

const mockServices: Service[] = [
  { id: '1', name: 'Mariachi', price: 250000, category: 'Entretenimiento' },
  { id: '2', name: 'Decoración con flores', price: 180000, category: 'Decoración' },
  { id: '3', name: 'Fotografía profesional', price: 320000, category: 'Fotografía' },
  { id: '4', name: 'Lunch gourmet', price: 45000, category: 'Alimentación' },
  { id: '5', name: 'Transporte adicional', price: 120000, category: 'Transporte' },
];

const mockSales: Sale[] = [
  {
    id: 'V-001',
    client: mockClients[0],
    saleType: 'Ruta',
    amount: 85000,
    date: '2024-11-15',
    status: 'Pagado',
    mainService: mockRoutes[0],
    additionalServices: [],
    paymentMethod: 'Transferencia'
  },
  {
    id: 'V-002',
    client: mockClients[1],
    saleType: 'Finca + Servicios',
    amount: 1180000,
    date: '2024-11-18',
    status: 'Pendiente',
    mainService: mockFarms[1],
    additionalServices: [mockServices[0], mockServices[1]],
    paymentMethod: 'Efectivo'
  },
  {
    id: 'V-003',
    client: mockClients[2],
    saleType: 'Ruta + Servicios',
    amount: 485000,
    date: '2024-11-20',
    status: 'Pagado',
    mainService: mockRoutes[2],
    additionalServices: [mockServices[3]],
    paymentMethod: 'Tarjeta'
  },
];

// ===========================
// COMPONENTE PRINCIPAL
// ===========================

export function SalesManagement() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [cancelledSales, setCancelledSales] = useState<CancelledSale[]>([]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Control del diálogo de anulación
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  const handleCreateSale = (newSale: Sale) => {
    setSales([newSale, ...sales]);
    setViewMode('list');
  };

  const handleViewDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setViewMode('detail');
  };

  const handleInitiateCancellation = (saleId: string) => {
    setSaleToCancel(saleId);
    setShowCancelDialog(true);
  };

  const handleConfirmCancellation = () => {
    if (saleToCancel) {
      const saleToUpdate = sales.find(s => s.id === saleToCancel);
      if (saleToUpdate) {
        const cancelledSale: CancelledSale = {
          ...saleToUpdate,
          status: 'Anulado',
          cancellationDate: new Date().toISOString().split('T')[0],
          cancellationReason: cancellationReason || 'Sin motivo especificado'
        };

        // Actualizar la venta en el listado principal
        setSales(sales.map(s => 
          s.id === saleToCancel ? cancelledSale : s
        ));

        // Guardar en el registro de ventas anuladas
        setCancelledSales([cancelledSale, ...cancelledSales]);

        // Actualizar selectedSale si está viendo el detalle
        if (selectedSale?.id === saleToCancel) {
          setSelectedSale(cancelledSale);
        }

        console.log('Venta anulada guardada:', cancelledSale);
        console.log('Registro de ventas anuladas:', [cancelledSale, ...cancelledSales]);
      }

      // Resetear el estado del diálogo
      setShowCancelDialog(false);
      setSaleToCancel(null);
      setCancellationReason('');
    }
  };

  const handleCancelDialogClose = () => {
    setShowCancelDialog(false);
    setSaleToCancel(null);
    setCancellationReason('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AnimatePresence mode="wait">
        {viewMode === 'list' && (
          <SalesListView
            key="list"
            sales={sales}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            dateRange={dateRange}
            setDateRange={setDateRange}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onCreateNew={() => setViewMode('create')}
            onViewDetail={handleViewDetail}
            onCancelSale={handleInitiateCancellation}
          />
        )}
        
        {viewMode === 'create' && (
          <CreateSaleView
            key="create"
            onBack={() => setViewMode('list')}
            onCreate={handleCreateSale}
            clients={mockClients}
            routes={mockRoutes}
            farms={mockFarms}
            services={mockServices}
          />
        )}
        
        {viewMode === 'detail' && selectedSale && (
          <SaleDetailView
            key="detail"
            sale={selectedSale}
            onBack={() => setViewMode('list')}
            onCancel={handleInitiateCancellation}
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
                Advertencia: Anular Venta
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-gray-700">
                Estás a punto de <span className="font-semibold">anular permanentemente</span> la venta{' '}
                <span className="font-semibold text-red-700">{saleToCancel}</span>.
              </p>
              <p className="text-gray-700">
                Esta acción cambiará el estado de la venta a "Anulado" y se guardará un registro 
                completo de esta operación, incluyendo la fecha y el motivo de la anulación.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Importante:</strong> Esta acción no se puede deshacer. La venta permanecerá 
                  en el sistema pero será marcada como anulada.
                </p>
              </div>
              
              {/* Campo para el motivo de anulación */}
              <div className="mt-4 space-y-2">
                <Label htmlFor="cancellation-reason" className="text-gray-900">
                  Motivo de la anulación (opcional)
                </Label>
                <Textarea
                  id="cancellation-reason"
                  placeholder="Ej: Cliente canceló, error en el registro, duplicado..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="min-h-[80px] border-gray-300 focus:border-red-500"
                />
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
              Sí, Anular Venta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ===========================
// PANTALLA 1: LISTA DE VENTAS
// ===========================

interface SalesListViewProps {
  sales: Sale[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterType: string;
  setFilterType: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  dateRange: { from: string; to: string };
  setDateRange: (range: { from: string; to: string }) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  onCreateNew: () => void;
  onViewDetail: (sale: Sale) => void;
  onCancelSale: (saleId: string) => void;
}

function SalesListView({
  sales,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  dateRange,
  setDateRange,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  onCreateNew,
  onViewDetail,
  onCancelSale
}: SalesListViewProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: Sale['status']) => {
    const styles = {
      Pagado: 'bg-green-100 text-green-700 border-green-200',
      Pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      Anulado: 'bg-red-100 text-red-700 border-red-200'
    };
    return styles[status];
  };

  // Filtrar ventas
  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || sale.saleType.toLowerCase().includes(filterType.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sale.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = filteredSales.slice(startIndex, startIndex + itemsPerPage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-green-800">Gestión de Ventas</h1>
          <p className="text-gray-600 mt-1">Administra todas las ventas de rutas, fincas y servicios</p>
        </div>
        <Button 
          onClick={onCreateNew}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Registrar Venta
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-green-100">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div className="lg:col-span-2">
              <Label>Buscar</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por cliente, fecha o servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-green-500"
                />
              </div>
            </div>

            {/* Filtro por tipo */}
            <div>
              <Label>Tipo de Venta</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="mt-2 border-gray-200 focus:border-green-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ruta">Ruta</SelectItem>
                  <SelectItem value="finca">Finca</SelectItem>
                  <SelectItem value="ruta + servicios">Ruta + Servicios</SelectItem>
                  <SelectItem value="finca + servicios">Finca + Servicios</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por estado */}
            <div>
              <Label>Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="mt-2 border-gray-200 focus:border-green-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Pagado">Pagado</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Anulado">Anulado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botón Buscar */}
            <div className="flex items-end">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Ventas */}
      <Card className="border-green-100">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-green-100">
                  <TableHead className="text-green-800">ID Venta</TableHead>
                  <TableHead className="text-green-800">Cliente</TableHead>
                  <TableHead className="text-green-800">Tipo de Venta</TableHead>
                  <TableHead className="text-green-800">Monto Total</TableHead>
                  <TableHead className="text-green-800">Fecha</TableHead>
                  <TableHead className="text-green-800">Estado</TableHead>
                  <TableHead className="text-green-800 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.map((sale) => (
                  <TableRow key={sale.id} className="border-green-50">
                    <TableCell className="font-medium text-green-700">{sale.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{sale.client.name}</p>
                        <p className="text-sm text-gray-500">{sale.client.document}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700">{sale.saleType}</span>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {formatCurrency(sale.amount)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(sale.date).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusBadge(sale.status)}>
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetail(sale)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {sale.status !== 'Anulado' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCancelSale(sale.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredSales.length)} de {filteredSales.length} ventas
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="border-green-200 text-green-700 hover:bg-green-50"
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
// PANTALLA 2: CREAR VENTA
// ===========================

interface CreateSaleViewProps {
  onBack: () => void;
  onCreate: (sale: Sale) => void;
  clients: Client[];
  routes: Route[];
  farms: Farm[];
  services: Service[];
}

function CreateSaleView({ onBack, onCreate, clients, routes, farms, services }: CreateSaleViewProps) {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [saleType, setSaleType] = useState<'route' | 'farm' | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedFarm, setSelectedFarm] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('transferencia');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calcular totales
  const calculateTotal = () => {
    let mainServicePrice = 0;
    
    if (saleType === 'route' && selectedRoute) {
      const route = routes.find(r => r.id === selectedRoute);
      mainServicePrice = route?.price || 0;
    } else if (saleType === 'farm' && selectedFarm) {
      const farm = farms.find(f => f.id === selectedFarm);
      mainServicePrice = farm?.price || 0;
    }

    const servicesPrice = selectedServices.reduce((sum, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return sum + (service?.price || 0);
    }, 0);

    return {
      mainServicePrice,
      servicesPrice,
      total: mainServicePrice + servicesPrice
    };
  };

  const { mainServicePrice, servicesPrice, total } = calculateTotal();

  const handleSubmit = () => {
    if (!selectedClient) {
      alert('Debes seleccionar un cliente');
      return;
    }

    if (!saleType) {
      alert('Debes seleccionar un tipo de venta (Ruta o Finca)');
      return;
    }

    if (saleType === 'route' && !selectedRoute) {
      alert('Debes seleccionar una ruta');
      return;
    }

    if (saleType === 'farm' && !selectedFarm) {
      alert('Debes seleccionar una finca');
      return;
    }

    const client = clients.find(c => c.id === selectedClient)!;
    let mainService: Route | Farm | undefined;
    let saleTypeName = '';

    if (saleType === 'route') {
      mainService = routes.find(r => r.id === selectedRoute);
      saleTypeName = selectedServices.length > 0 ? 'Ruta + Servicios' : 'Ruta';
    } else {
      mainService = farms.find(f => f.id === selectedFarm);
      saleTypeName = selectedServices.length > 0 ? 'Finca + Servicios' : 'Finca';
    }

    const additionalServices = selectedServices.map(id => 
      services.find(s => s.id === id)!
    );

    const newSale: Sale = {
      id: `V-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      client,
      saleType: saleTypeName,
      amount: total,
      date: new Date().toISOString().split('T')[0],
      status: 'Pendiente',
      mainService,
      additionalServices,
      paymentMethod
    };

    onCreate(newSale);
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
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
          <h1 className="text-green-800">Registrar Nueva Venta</h1>
          <p className="text-gray-600 mt-1">Completa la información de la venta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal - Formulario */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sección 1: Datos del Cliente */}
          <Card className="border-green-100">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">1. Datos del Cliente</h2>
              <div className="space-y-4">
                <div>
                  <Label>Seleccionar Cliente *</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="mt-2 border-gray-200 focus:border-green-500">
                      <SelectValue placeholder="Elige un cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.document}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Nuevo Cliente
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sección 2: Tipo de Venta */}
          <Card className="border-green-100">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">2. Tipo de Venta *</h2>
              <p className="text-sm text-gray-600 mb-4">
                Selecciona solo una opción: Ruta O Finca (no ambas)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tarjeta Ruta */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSaleType('route')}
                  className={`
                    p-6 rounded-lg border-2 cursor-pointer transition-all
                    ${saleType === 'route' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-white hover:border-green-300'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5
                      ${saleType === 'route' ? 'border-green-500' : 'border-gray-300'}
                    `}>
                      {saleType === 'route' && (
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Venta de Ruta</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Selecciona una ruta turística. Puedes agregar servicios adicionales.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Tarjeta Finca */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSaleType('farm')}
                  className={`
                    p-6 rounded-lg border-2 cursor-pointer transition-all
                    ${saleType === 'farm' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-white hover:border-green-300'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5
                      ${saleType === 'farm' ? 'border-green-500' : 'border-gray-300'}
                    `}>
                      {saleType === 'farm' && (
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Venta de Finca</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Selecciona una finca aliada. Puedes agregar servicios adicionales.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>

          {/* Sección 3: Selección del Servicio Principal */}
          {saleType && (
            <Card className="border-green-100">
              <CardContent className="p-6">
                <h2 className="text-green-800 mb-4">
                  3. Seleccionar {saleType === 'route' ? 'Ruta' : 'Finca'} *
                </h2>
                
                {saleType === 'route' ? (
                  <div className="space-y-3">
                    {routes.map(route => (
                      <motion.div
                        key={route.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setSelectedRoute(route.id)}
                        className={`
                          p-4 rounded-lg border cursor-pointer transition-all
                          ${selectedRoute === route.id 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-green-300'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{route.name}</h3>
                            <div className="flex gap-4 mt-2 text-sm text-gray-600">
                              <span>📍 {route.distance}</span>
                              <span>🏔️ {route.difficulty}</span>
                            </div>
                          </div>
                          <p className="font-medium text-green-700">{formatCurrency(route.price)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {farms.map(farm => (
                      <motion.div
                        key={farm.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setSelectedFarm(farm.id)}
                        className={`
                          p-4 rounded-lg border cursor-pointer transition-all
                          ${selectedFarm === farm.id 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-green-300'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{farm.name}</h3>
                            <div className="flex gap-4 mt-2 text-sm text-gray-600">
                              <span>📍 {farm.location}</span>
                              <span>👥 Cap: {farm.capacity}</span>
                            </div>
                          </div>
                          <p className="font-medium text-green-700">{formatCurrency(farm.price)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sección 4: Servicios Adicionales */}
          <Card className="border-green-100">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">4. Servicios Adicionales (Opcional)</h2>
              <p className="text-sm text-gray-600 mb-4">
                Selecciona servicios adicionales que se incluirán en la venta
              </p>
              <div className="space-y-3">
                {services.map(service => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-green-300 transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        id={service.id}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={() => handleServiceToggle(service.id)}
                        className="border-green-500 data-[state=checked]:bg-green-600"
                      />
                      <Label 
                        htmlFor={service.id} 
                        className="flex-1 cursor-pointer"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{service.name}</p>
                          <p className="text-sm text-gray-500">{service.category}</p>
                        </div>
                      </Label>
                    </div>
                    <p className="font-medium text-green-700">{formatCurrency(service.price)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Lateral - Resumen */}
        <div className="lg:col-span-1">
          <Card className="border-green-100 sticky top-6">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Resumen de la Venta</h2>
              
              <div className="space-y-4">
                {/* Cliente */}
                {selectedClient && (
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Cliente</p>
                    <p className="font-medium text-gray-900">
                      {clients.find(c => c.id === selectedClient)?.name}
                    </p>
                  </div>
                )}

                {/* Tipo de venta */}
                {saleType && (
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Tipo de Venta</p>
                    <p className="font-medium text-gray-900">
                      {saleType === 'route' ? 'Ruta' : 'Finca'}
                      {selectedServices.length > 0 && ' + Servicios'}
                    </p>
                  </div>
                )}

                {/* Desglose de precios */}
                <div className="space-y-3">
                  {mainServicePrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Servicio Principal</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(mainServicePrice)}
                      </span>
                    </div>
                  )}
                  
                  {servicesPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Servicios Adicionales ({selectedServices.length})
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(servicesPrice)}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t-2 border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total</span>
                      <span className="text-green-700 font-semibold">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Estado y método de pago */}
                <div className="pt-4 space-y-3">
                  <div>
                    <Label className="text-sm text-gray-600">Estado Inicial</Label>
                    <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-700 w-full justify-center">
                      Pendiente
                    </Badge>
                  </div>

                  <div>
                    <Label>Método de Pago</Label>
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
                </div>

                {/* Botones */}
                <div className="pt-4 space-y-2">
                  <Button 
                    onClick={handleSubmit}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    Registrar Venta
                  </Button>
                  <Button 
                    onClick={onBack}
                    variant="outline" 
                    className="w-full border-gray-300 text-gray-700"
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
// PANTALLA 3: VER DETALLE
// ===========================

interface SaleDetailViewProps {
  sale: Sale;
  onBack: () => void;
  onCancel: (saleId: string) => void;
}

function SaleDetailView({ sale, onBack, onCancel }: SaleDetailViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: Sale['status']) => {
    const styles = {
      Pagado: 'bg-green-100 text-green-700 border-green-200',
      Pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      Anulado: 'bg-red-100 text-red-700 border-red-200'
    };
    return styles[status];
  };

  const handlePrintPDF = () => {
    alert('Generando PDF de la factura...');
  };

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
            <h1 className="text-green-800">Detalle de Venta</h1>
            <p className="text-gray-600 mt-1">ID: {sale.id}</p>
          </div>
        </div>
        <Button 
          onClick={handlePrintPDF}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimir PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bloque 1: Información del Cliente */}
          <Card className="border-green-100">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Información del Cliente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre Completo</p>
                  <p className="font-medium text-gray-900 mt-1">{sale.client.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Documento</p>
                  <p className="font-medium text-gray-900 mt-1">{sale.client.document}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium text-gray-900 mt-1">{sale.client.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900 mt-1">{sale.client.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bloque 2: Información de la Venta */}
          <Card className="border-green-100">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Información de la Venta</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ID Venta</p>
                  <p className="font-medium text-gray-900 mt-1">{sale.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {new Date(sale.date).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Venta</p>
                  <p className="font-medium text-gray-900 mt-1">{sale.saleType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <Badge variant="secondary" className={`mt-1 ${getStatusBadge(sale.status)}`}>
                    {sale.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Método de Pago</p>
                  <p className="font-medium text-gray-900 mt-1 capitalize">{sale.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monto Total</p>
                  <p className="font-medium text-green-700 mt-1">{formatCurrency(sale.amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bloque 3: Detalle del Servicio Principal */}
          {sale.mainService && (
            <Card className="border-green-100">
              <CardContent className="p-6">
                <h2 className="text-green-800 mb-4">Servicio Principal</h2>
                
                {'distance' in sale.mainService ? (
                  // Es una Ruta
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nombre de la Ruta</p>
                      <p className="font-medium text-gray-900 mt-1">{sale.mainService.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Distancia</p>
                      <p className="font-medium text-gray-900 mt-1">{sale.mainService.distance}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dificultad</p>
                      <p className="font-medium text-gray-900 mt-1">{sale.mainService.difficulty}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Precio</p>
                      <p className="font-medium text-green-700 mt-1">
                        {formatCurrency(sale.mainService.price)}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Es una Finca
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nombre de la Finca</p>
                      <p className="font-medium text-gray-900 mt-1">{sale.mainService.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ubicación</p>
                      <p className="font-medium text-gray-900 mt-1">{sale.mainService.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Capacidad</p>
                      <p className="font-medium text-gray-900 mt-1">{sale.mainService.capacity} personas</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Precio</p>
                      <p className="font-medium text-green-700 mt-1">
                        {formatCurrency(sale.mainService.price)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bloque 4: Servicios Adicionales */}
          {sale.additionalServices.length > 0 && (
            <Card className="border-green-100">
              <CardContent className="p-6">
                <h2 className="text-green-800 mb-4">Servicios Adicionales</h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-green-100">
                        <TableHead className="text-green-800">Servicio</TableHead>
                        <TableHead className="text-green-800">Categoría</TableHead>
                        <TableHead className="text-green-800 text-right">Precio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sale.additionalServices.map((service) => (
                        <TableRow key={service.id} className="border-green-50">
                          <TableCell className="font-medium text-gray-900">
                            {service.name}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {service.category}
                          </TableCell>
                          <TableCell className="text-right font-medium text-gray-900">
                            {formatCurrency(service.price)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 border-green-200">
                        <TableCell colSpan={2} className="font-medium text-gray-900">
                          Subtotal Servicios
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-700">
                          {formatCurrency(
                            sale.additionalServices.reduce((sum, s) => sum + s.price, 0)
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna Lateral - Acciones */}
        <div className="lg:col-span-1">
          <Card className="border-green-100 sticky top-6">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Acciones</h2>
              <div className="space-y-3">
                <Button 
                  onClick={handlePrintPDF}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generar PDF
                </Button>
                
                {sale.status !== 'Anulado' && (
                  <Button 
                    onClick={() => onCancel(sale.id)}
                    variant="outline"
                    className="w-full border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Anular Venta
                  </Button>
                )}

                <Button 
                  onClick={onBack}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700"
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
                    <span className="text-gray-600">Estado:</span>
                    <Badge variant="secondary" className={getStatusBadge(sale.status)}>
                      {sale.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium text-gray-900">{sale.saleType}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-900">Total:</span>
                    <span className="font-medium text-green-700">
                      {formatCurrency(sale.amount)}
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