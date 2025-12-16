import React, { useState } from 'react';
import { 
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertTriangle,
  Check,
  Power
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
import { toast } from 'sonner';
import { Switch } from './ui/switch';

// ===========================
// INTERFACES Y TIPOS
// ===========================

export interface ProviderType {
  id: string;
  name: string;
  description: string;
  status: 'Activo' | 'Inactivo';
}

export interface Provider {
  id: string;
  name: string;
  providerType: ProviderType;
  phone: string;
  email: string;
  address: string;
  observations?: string;
  status: 'Activo' | 'Inactivo';
  createdAt: string;
}

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

// ===========================
// DATOS MOCK
// ===========================

const mockProviderTypes: ProviderType[] = [
  { id: '1', name: 'Transporte', description: 'Proveedores de servicios de transporte', status: 'Activo' },
  { id: '2', name: 'Alimentación', description: 'Proveedores de alimentos y bebidas', status: 'Activo' },
  { id: '3', name: 'Alojamiento', description: 'Proveedores de hospedaje y alojamiento', status: 'Activo' },
  { id: '4', name: 'Entretenimiento', description: 'Proveedores de entretenimiento y actividades', status: 'Activo' },
  { id: '5', name: 'Equipamiento', description: 'Proveedores de equipos y materiales', status: 'Activo' },
];

const mockProviders: Provider[] = [
  {
    id: 'PROV-001',
    name: 'Transportes Occidente S.A.S',
    providerType: mockProviderTypes[0],
    phone: '3001234567',
    email: 'contacto@transportesoccidente.com',
    address: 'Calle 15 #20-30, Armenia, Quindío',
    observations: 'Proveedor principal de transporte turístico',
    status: 'Activo',
    createdAt: '2024-01-15'
  },
  {
    id: 'PROV-002',
    name: 'Restaurante La Montaña',
    providerType: mockProviderTypes[1],
    phone: '3109876543',
    email: 'info@restaurantelamontana.com',
    address: 'Vereda El Paraíso, Salento, Quindío',
    observations: 'Especialidad en comida típica regional',
    status: 'Activo',
    createdAt: '2024-02-01'
  },
  {
    id: 'PROV-003',
    name: 'Finca Hotel El Descanso',
    providerType: mockProviderTypes[2],
    phone: '3201122334',
    email: 'reservas@fincaeldescanso.com',
    address: 'Km 5 Vía Pereira-Cartago, Pereira, Risaralda',
    observations: 'Capacidad para 80 personas',
    status: 'Activo',
    createdAt: '2024-01-20'
  },
  {
    id: 'PROV-004',
    name: 'Eventos y Mariachis del Eje',
    providerType: mockProviderTypes[3],
    phone: '3152233445',
    email: 'eventos@mariachisdeleje.com',
    address: 'Avenida Bolívar #45-12, Manizales, Caldas',
    status: 'Activo',
    createdAt: '2024-03-10'
  },
  {
    id: 'PROV-005',
    name: 'Equipos Aventura Total',
    providerType: mockProviderTypes[4],
    phone: '3003344556',
    email: 'ventas@aventuratotal.com',
    address: 'Centro Comercial Plaza Mayor, Local 102',
    observations: 'Alquiler de equipos de camping y montañismo',
    status: 'Inactivo',
    createdAt: '2024-02-15'
  },
  {
    id: 'PROV-006',
    name: 'Buses del Café Express',
    providerType: mockProviderTypes[0],
    phone: '3102223344',
    email: 'info@busesdelcafe.com',
    address: 'Terminal de Transportes, Armenia',
    observations: 'Servicio de transporte intermunicipal',
    status: 'Activo',
    createdAt: '2024-03-15'
  },
  {
    id: 'PROV-007',
    name: 'Cocina Regional del Valle',
    providerType: mockProviderTypes[1],
    phone: '3205556677',
    email: 'contacto@cocinaregional.com',
    address: 'Carrera 8 #12-45, Calarcá',
    observations: 'Catering para grupos grandes',
    status: 'Activo',
    createdAt: '2024-04-01'
  },
  {
    id: 'PROV-008',
    name: 'Glamping Paraíso Verde',
    providerType: mockProviderTypes[2],
    phone: '3157778899',
    email: 'reservas@glampingparaiso.com',
    address: 'Vereda La Bella, Circasia',
    observations: 'Alojamiento ecológico premium',
    status: 'Activo',
    createdAt: '2024-02-20'
  },
  {
    id: 'PROV-009',
    name: 'Shows y Eventos Culturales',
    providerType: mockProviderTypes[3],
    phone: '3009990088',
    email: 'shows@eventosculturales.com',
    address: 'Centro Cultural, Pereira',
    status: 'Activo',
    createdAt: '2024-05-10'
  },
  {
    id: 'PROV-010',
    name: 'Deportes Extremos Quindío',
    providerType: mockProviderTypes[4],
    phone: '3181112233',
    email: 'info@deportesextremos.com',
    address: 'Parque del Café, Montenegro',
    observations: 'Equipos de seguridad para actividades extremas',
    status: 'Activo',
    createdAt: '2024-01-30'
  },
  {
    id: 'PROV-011',
    name: 'Van Tours del Eje',
    providerType: mockProviderTypes[0],
    phone: '3123334455',
    email: 'reservas@vantours.com',
    address: 'Avenida Centenario, Manizales',
    observations: 'Transporte ejecutivo para grupos pequeños',
    status: 'Activo',
    createdAt: '2024-03-25'
  },
  {
    id: 'PROV-012',
    name: 'Sabores del Campo',
    providerType: mockProviderTypes[1],
    phone: '3194445566',
    email: 'pedidos@saborescampo.com',
    address: 'Finca La Esperanza, Filandia',
    observations: 'Almuerzos campestres y eventos',
    status: 'Inactivo',
    createdAt: '2024-04-15'
  },
  {
    id: 'PROV-013',
    name: 'Cabañas del Bosque',
    providerType: mockProviderTypes[2],
    phone: '3166667788',
    email: 'info@cabanasbosque.com',
    address: 'Vereda Alto del Rey, Salento',
    observations: 'Cabañas rústicas en la montaña',
    status: 'Activo',
    createdAt: '2024-02-28'
  },
  {
    id: 'PROV-014',
    name: 'Grupo Folclórico Café y Cultura',
    providerType: mockProviderTypes[3],
    phone: '3177778899',
    email: 'contacto@folcloricocafe.com',
    address: 'Casa de la Cultura, Armenia',
    status: 'Activo',
    createdAt: '2024-05-20'
  },
  {
    id: 'PROV-015',
    name: 'Outdoor Adventure Gear',
    providerType: mockProviderTypes[4],
    phone: '3088889900',
    email: 'ventas@outdooradventure.com',
    address: 'Centro Comercial Unicentro, Pereira',
    observations: 'Venta y alquiler de equipo de campamento',
    status: 'Activo',
    createdAt: '2024-06-01'
  },
  {
    id: 'PROV-016',
    name: 'Transporte Eco-Turístico',
    providerType: mockProviderTypes[0],
    phone: '3199991122',
    email: 'reservas@ecotransporte.com',
    address: 'Km 2 Vía Armenia-Calarcá',
    observations: 'Vehículos híbridos y eléctricos',
    status: 'Activo',
    createdAt: '2024-06-10'
  },
  {
    id: 'PROV-017',
    name: 'Parrilla y Asados El Campestre',
    providerType: mockProviderTypes[1],
    phone: '3161112233',
    email: 'pedidos@parrillaelcampestre.com',
    address: 'Vereda La Cascada, Circasia',
    observations: 'Especialidad en parrilladas y asados',
    status: 'Activo',
    createdAt: '2024-07-01'
  },
  {
    id: 'PROV-018',
    name: 'Posada Turística Los Arrayanes',
    providerType: mockProviderTypes[2],
    phone: '3172223344',
    email: 'contacto@posadalosarrayanes.com',
    address: 'Centro Histórico, Salento',
    observations: 'Posada colonial en el centro del pueblo',
    status: 'Activo',
    createdAt: '2024-03-30'
  },
  {
    id: 'PROV-019',
    name: 'DJ y Sonido Profesional',
    providerType: mockProviderTypes[3],
    phone: '3183334455',
    email: 'eventos@djsonidopro.com',
    address: 'Barrio Modelo, Armenia',
    status: 'Inactivo',
    createdAt: '2024-08-05'
  },
  {
    id: 'PROV-020',
    name: 'Bicicletas de Montaña Rent',
    providerType: mockProviderTypes[4],
    phone: '3094445566',
    email: 'alquiler@bicicletasrent.com',
    address: 'Parque Principal, Filandia',
    observations: 'Alquiler de bicicletas todo terreno',
    status: 'Activo',
    createdAt: '2024-07-15'
  },
  {
    id: 'PROV-021',
    name: 'Chivas Turísticas del Quindío',
    providerType: mockProviderTypes[0],
    phone: '3155556677',
    email: 'info@chivasturisticas.com',
    address: 'Parque del Café, Montenegro',
    observations: 'Tours en chivas tradicionales',
    status: 'Activo',
    createdAt: '2024-08-20'
  },
  {
    id: 'PROV-022',
    name: 'Café y Postres La Tradición',
    providerType: mockProviderTypes[1],
    phone: '3106667788',
    email: 'ventas@cafelatradicion.com',
    address: 'Calle Real, Salento',
    observations: 'Servicio de coffee break y refrigerios',
    status: 'Activo',
    createdAt: '2024-09-01'
  }
];

// ===========================
// COMPONENTE PRINCIPAL
// ===========================

interface ProviderManagementProps {
  userRole?: 'admin' | 'advisor';
}

export function ProviderManagement({ userRole = 'admin' }: ProviderManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [providers, setProviders] = useState<Provider[]>(mockProviders);
  const [providerTypes] = useState<ProviderType[]>(mockProviderTypes);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';

  const handleCreateProvider = (newProvider: Provider) => {
    setProviders([newProvider, ...providers]);
    setViewMode('list');
    toast.success('Proveedor creado exitosamente');
  };

  const handleUpdateProvider = (updatedProvider: Provider) => {
    setProviders(providers.map(p => p.id === updatedProvider.id ? updatedProvider : p));
    setViewMode('list');
    setSelectedProvider(null);
    toast.success('Proveedor actualizado exitosamente');
  };

  const handleViewDetail = (provider: Provider) => {
    setSelectedProvider(provider);
    setViewMode('detail');
  };

  const handleEdit = (provider: Provider) => {
    setSelectedProvider(provider);
    setViewMode('edit');
  };

  const handleInitiateDelete = (providerId: string) => {
    setProviderToDelete(providerId);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (providerToDelete) {
      setProviders(providers.filter(p => p.id !== providerToDelete));
      setShowDeleteDialog(false);
      setProviderToDelete(null);
      toast.success('Proveedor eliminado exitosamente');
    }
  };

  const handleToggleStatus = (providerId: string) => {
    setProviders(providers.map(p => 
      p.id === providerId 
        ? { ...p, status: p.status === 'Activo' ? 'Inactivo' : 'Activo' } 
        : p
    ));
    toast.success('Estado del proveedor actualizado');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AnimatePresence mode="wait">
        {viewMode === 'list' && (
          <ProviderListView
            key="list"
            providers={providers}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onCreateNew={() => setViewMode('create')}
            onViewDetail={handleViewDetail}
            onEdit={handleEdit}
            onDelete={handleInitiateDelete}
            onToggleStatus={handleToggleStatus}
            providerTypes={providerTypes}
            isAdmin={isAdmin}
          />
        )}
        
        {(viewMode === 'create' || viewMode === 'edit') && (
          <ProviderFormView
            key={viewMode}
            mode={viewMode}
            provider={selectedProvider}
            onBack={() => {
              setViewMode('list');
              setSelectedProvider(null);
            }}
            onCreate={handleCreateProvider}
            onUpdate={handleUpdateProvider}
            providerTypes={providerTypes}
          />
        )}
        
        {viewMode === 'detail' && selectedProvider && (
          <ProviderDetailView
            key="detail"
            provider={selectedProvider}
            onBack={() => {
              setViewMode('list');
              setSelectedProvider(null);
            }}
            onEdit={handleEdit}
            onDelete={handleInitiateDelete}
            onToggleStatus={handleToggleStatus}
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white border-2 border-red-200">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-red-900">
                Eliminar Proveedor
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-gray-700">
                ¿Estás seguro de que deseas eliminar este proveedor?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Advertencia:</strong> Esta acción no se puede deshacer. 
                  El proveedor será eliminado permanentemente del sistema.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-100">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ===========================
// VISTA DE LISTA
// ===========================

interface ProviderListViewProps {
  providers: Provider[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterType: string;
  setFilterType: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  onCreateNew: () => void;
  onViewDetail: (provider: Provider) => void;
  onEdit: (provider: Provider) => void;
  onDelete: (providerId: string) => void;
  onToggleStatus: (providerId: string) => void;
  providerTypes: ProviderType[];
  isAdmin: boolean;
}

function ProviderListView({
  providers,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  onCreateNew,
  onViewDetail,
  onEdit,
  onDelete,
  onToggleStatus,
  providerTypes,
  isAdmin
}: ProviderListViewProps) {
  
  const getStatusBadge = (status: Provider['status']) => {
    const styles = {
      Activo: 'bg-green-100 text-green-700 border-green-200',
      Inactivo: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return styles[status];
  };

  // Filtrar proveedores
  const filteredProviders = providers.filter(provider => {
    const matchesSearch = 
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || provider.providerType.id === filterType;
    const matchesStatus = filterStatus === 'all' || provider.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredProviders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProviders = filteredProviders.slice(startIndex, startIndex + itemsPerPage);

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
          <h1 className="text-green-800">Gestión de Proveedores</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Administra los proveedores del sistema' : 'Visualiza la información de los proveedores'}
          </p>
        </div>
        {isAdmin && (
          <Button 
            onClick={onCreateNew}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Proveedor
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card className="border-green-100">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Buscador */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, ID o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-green-200 focus:border-green-500"
              />
            </div>

            {/* Filtro por tipo */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="border-green-200 focus:border-green-500">
                <SelectValue placeholder="Tipo de proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {providerTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por estado */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="border-green-200 focus:border-green-500">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-green-800">Listado de Proveedores</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {filteredProviders.length} {filteredProviders.length === 1 ? 'proveedor' : 'proveedores'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Table>
              <TableHeader>
                <TableRow className="bg-green-50">
                  <TableHead className="text-green-800">ID</TableHead>
                  <TableHead className="text-green-800">Nombre del Proveedor</TableHead>
                  <TableHead className="text-green-800">Tipo de Proveedor</TableHead>
                  <TableHead className="text-green-800">Teléfono</TableHead>
                  <TableHead className="text-green-800">Correo</TableHead>
                  <TableHead className="text-green-800">Estado</TableHead>
                  <TableHead className="text-green-800 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProviders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No se encontraron proveedores
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProviders.map((provider) => (
                    <TableRow key={provider.id} className="hover:bg-green-50/50">
                      <TableCell className="font-medium text-green-700">{provider.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{provider.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-green-200 text-green-700">
                          {provider.providerType.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-3 h-3" />
                          {provider.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-3 h-3" />
                          {provider.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isAdmin && (
                          <Switch
                            checked={provider.status === 'Activo'}
                            onCheckedChange={() => onToggleStatus(provider.id)}
                            className="data-[state=checked]:bg-green-600"
                          />
                        )}
                        {!isAdmin && (
                          <Badge className={getStatusBadge(provider.status)}>
                            {provider.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetail(provider)}
                            className="hover:bg-green-100 hover:text-green-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(provider)}
                                className="hover:bg-blue-100 hover:text-blue-700"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(provider.id)}
                                className="hover:bg-red-100 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-green-100">
              <p className="text-sm text-gray-600">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredProviders.length)} de {filteredProviders.length} proveedores
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  <ChevronRight className="w-4 h-4" />
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
// VISTA DE FORMULARIO
// ===========================

interface ProviderFormViewProps {
  mode: 'create' | 'edit';
  provider: Provider | null;
  onBack: () => void;
  onCreate: (provider: Provider) => void;
  onUpdate: (provider: Provider) => void;
  providerTypes: ProviderType[];
}

function ProviderFormView({
  mode,
  provider,
  onBack,
  onCreate,
  onUpdate,
  providerTypes
}: ProviderFormViewProps) {
  const [formData, setFormData] = useState({
    name: provider?.name || '',
    providerTypeId: provider?.providerType.id || '',
    phone: provider?.phone || '',
    email: provider?.email || '',
    address: provider?.address || '',
    observations: provider?.observations || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!formData.providerTypeId) newErrors.providerTypeId = 'El tipo de proveedor es obligatorio';
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
    if (!formData.email.trim()) {
      newErrors.email = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El correo no es válido';
    }
    if (!formData.address.trim()) newErrors.address = 'La dirección es obligatoria';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const selectedType = providerTypes.find(t => t.id === formData.providerTypeId);
    if (!selectedType) return;

    const providerData: Provider = {
      id: provider?.id || `PROV-${String(Date.now()).slice(-3).padStart(3, '0')}`,
      name: formData.name,
      providerType: selectedType,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      observations: formData.observations,
      status: provider?.status || 'Activo',
      createdAt: provider?.createdAt || new Date().toISOString().split('T')[0]
    };

    if (mode === 'create') {
      onCreate(providerData);
    } else {
      onUpdate(providerData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-green-100">
        <CardHeader className="border-b border-green-100 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-green-800">
                {mode === 'create' ? 'Crear Nuevo Proveedor' : 'Editar Proveedor'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {mode === 'create' 
                  ? 'Completa los datos del nuevo proveedor' 
                  : `Editando: ${provider?.name}`
                }
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="hover:bg-green-100"
            >
              <X className="w-4 h-4 mr-2" />
              Cerrar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre del proveedor */}
              <div className="md:col-span-2">
                <Label htmlFor="name" className="text-gray-700">
                  Nombre del Proveedor <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Transportes Occidente S.A.S"
                  className={`mt-1 border-green-200 focus:border-green-500 ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Tipo de proveedor */}
              <div>
                <Label htmlFor="providerType" className="text-gray-700">
                  Tipo de Proveedor <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.providerTypeId} 
                  onValueChange={(value) => setFormData({ ...formData, providerTypeId: value })}
                >
                  <SelectTrigger className={`mt-1 border-green-200 focus:border-green-500 ${errors.providerTypeId ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {providerTypes.filter(t => t.status === 'Activo').map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.providerTypeId && <p className="text-sm text-red-500 mt-1">{errors.providerTypeId}</p>}
              </div>

              {/* Teléfono */}
              <div>
                <Label htmlFor="phone" className="text-gray-700">
                  Teléfono <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ej: 3001234567"
                  className={`mt-1 border-green-200 focus:border-green-500 ${errors.phone ? 'border-red-500' : ''}`}
                />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>

              {/* Correo */}
              <div className="md:col-span-2">
                <Label htmlFor="email" className="text-gray-700">
                  Correo Electrónico <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ej: contacto@proveedor.com"
                  className={`mt-1 border-green-200 focus:border-green-500 ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Dirección */}
              <div className="md:col-span-2">
                <Label htmlFor="address" className="text-gray-700">
                  Dirección <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ej: Calle 15 #20-30, Armenia, Quindío"
                  className={`mt-1 border-green-200 focus:border-green-500 ${errors.address ? 'border-red-500' : ''}`}
                />
                {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
              </div>

              {/* Observaciones */}
              <div className="md:col-span-2">
                <Label htmlFor="observations" className="text-gray-700">
                  Observaciones (opcional)
                </Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Información adicional sobre el proveedor..."
                  className="mt-1 border-green-200 focus:border-green-500 min-h-[100px]"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-6 border-t border-green-100">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {mode === 'create' ? 'Crear Proveedor' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ===========================
// VISTA DE DETALLE
// ===========================

interface ProviderDetailViewProps {
  provider: Provider;
  onBack: () => void;
  onEdit: (provider: Provider) => void;
  onDelete: (providerId: string) => void;
  onToggleStatus: (providerId: string) => void;
  isAdmin: boolean;
}

function ProviderDetailView({
  provider,
  onBack,
  onEdit,
  onDelete,
  onToggleStatus,
  isAdmin
}: ProviderDetailViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-green-100">
        <CardHeader className="border-b border-green-100 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-green-800">Detalle del Proveedor</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Información completa del proveedor</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="hover:bg-green-100"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Encabezado con estado */}
            <div className="flex items-start justify-between pb-6 border-b border-green-100">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{provider.name}</h2>
                <p className="text-gray-600 mt-1">ID: {provider.id}</p>
              </div>
              <Badge className={provider.status === 'Activo' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                {provider.status}
              </Badge>
            </div>

            {/* Información del proveedor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-600">Tipo de Proveedor</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className="border-green-200 text-green-700">
                      {provider.providerType.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{provider.providerType.description}</p>
                </div>

                <div>
                  <Label className="text-gray-600">Teléfono</Label>
                  <div className="mt-1 flex items-center gap-2 text-gray-900">
                    <Phone className="w-4 h-4 text-green-600" />
                    {provider.phone}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600">Correo Electrónico</Label>
                  <div className="mt-1 flex items-center gap-2 text-gray-900">
                    <Mail className="w-4 h-4 text-green-600" />
                    {provider.email}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-600">Dirección</Label>
                  <div className="mt-1 flex items-start gap-2 text-gray-900">
                    <MapPin className="w-4 h-4 text-green-600 mt-1" />
                    <span>{provider.address}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600">Fecha de Registro</Label>
                  <p className="mt-1 text-gray-900">{new Date(provider.createdAt).toLocaleDateString('es-ES')}</p>
                </div>

                {provider.observations && (
                  <div>
                    <Label className="text-gray-600">Observaciones</Label>
                    <div className="mt-1 flex items-start gap-2">
                      <FileText className="w-4 h-4 text-green-600 mt-1" />
                      <p className="text-gray-900">{provider.observations}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones */}
            {isAdmin && (
              <div className="flex flex-wrap gap-3 pt-6 border-t border-green-100">
                <Button
                  onClick={() => onEdit(provider)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  onClick={() => onToggleStatus(provider.id)}
                  variant="outline"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                >
                  <Power className="w-4 h-4 mr-2" />
                  {provider.status === 'Activo' ? 'Desactivar' : 'Activar'}
                </Button>
                <Button
                  onClick={() => onDelete(provider.id)}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}