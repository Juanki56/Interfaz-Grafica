import React, { useState } from 'react';
import { 
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertTriangle,
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
import { proveedoresAPI, tiposProveedorAPI, Proveedor, TipoProveedor } from '../services/api';
import { useEffect } from 'react';

// ===========================
// INTERFACES Y TIPOS  
// ===========================

// Usamos las interfaces de la BD
export interface Provider extends Proveedor {
  tipo_proveedor_nombre?: string;
}

export interface ProviderType extends TipoProveedor {}

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

const PROVIDERS_CACHE_TTL_MS = 30_000;
let providersCache: Provider[] | null = null;
let providersCacheAt = 0;
let providerTypesCache: ProviderType[] | null = null;
let providerTypesCacheAt = 0;

const isCacheFresh = (cacheAt: number) => Date.now() - cacheAt < PROVIDERS_CACHE_TTL_MS;

// ===========================
// COMPONENTE PRINCIPAL
// ===========================

interface ProviderManagementProps {
  userRole?: 'admin' | 'advisor';
}

export function ProviderManagement({ userRole = 'admin' }: ProviderManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerTypes, setProviderTypes] = useState<ProviderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<number | null>(null);

  const isAdmin = userRole === 'admin';

  // Cargar datos del backend
  useEffect(() => {
    const initData = async () => {
      if (providersCache && isCacheFresh(providersCacheAt)) {
        setProviders(providersCache);
        setIsLoading(false);
        void loadProviders(true);
      } else {
        await loadProviders();
      }

      if (providerTypesCache && isCacheFresh(providerTypesCacheAt)) {
        setProviderTypes(providerTypesCache);
        void loadProviderTypes(true);
      } else {
        void loadProviderTypes();
      }
    };

    void initData();
  }, []);

  const loadProviders = async (silent: boolean = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await proveedoresAPI.getAll();
      console.log('✅ Proveedores cargados:', data);
      setProviders(data);
      providersCache = data;
      providersCacheAt = Date.now();
    } catch (error) {
      console.error('❌ Error cargando proveedores:', error);
      toast.error('Error al cargar proveedores');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const loadProviderTypes = async (silent: boolean = false) => {
    try {
      const data = await tiposProveedorAPI.getAll();
      setProviderTypes(data);
      providerTypesCache = data;
      providerTypesCacheAt = Date.now();
    } catch (error) {
      console.error('❌ Error cargando tipos de proveedor:', error);
      if (!silent) {
        toast.error('Error al cargar tipos de proveedor');
      }
    }
  };

  const handleCreateProvider = async (newProvider: Partial<Provider>) => {
    try {
      setIsLoading(true);
      const dataToSend = {
        nombre: newProvider.nombre!,
        id_tipo: newProvider.id_tipo!,
        telefono: newProvider.telefono || '',
        email: newProvider.email || '',
        direccion: newProvider.direccion || '',
        observaciones: newProvider.observaciones || '',
        estado: true
      };
      console.log('📤 Datos que se enviarán al backend:', dataToSend);
      await proveedoresAPI.create(dataToSend);
      
      toast.success('Proveedor creado exitosamente');
      setViewMode('list');
      await loadProviders();
    } catch (error: any) {
      console.error('❌ Error creando proveedor:', error);
      toast.error(error.message || 'Error al crear el proveedor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProvider = async (updatedProvider: Partial<Provider>) => {
    try {
      setIsLoading(true);
      await proveedoresAPI.update(selectedProvider!.id_proveedores, {
        nombre: updatedProvider.nombre,
        id_tipo: updatedProvider.id_tipo,
        telefono: updatedProvider.telefono,
        email: updatedProvider.email,
        direccion: updatedProvider.direccion,
        observaciones: updatedProvider.observaciones
      });
      
      toast.success('Proveedor actualizado exitosamente');
      setViewMode('list');
      setSelectedProvider(null);
      await loadProviders();
    } catch (error: any) {
      console.error('❌ Error actualizando proveedor:', error);
      toast.error(error.message || 'Error al actualizar el proveedor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = (provider: Provider) => {
    setSelectedProvider(provider);
    setViewMode('detail');
  };

  const handleEdit = (provider: Provider) => {
    setSelectedProvider(provider);
    setViewMode('edit');
  };

  const handleInitiateDelete = (providerId: number) => {
    setProviderToDelete(providerId);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (providerToDelete) {
      try {
        setIsLoading(true);
        await proveedoresAPI.delete(providerToDelete);
        toast.success('Proveedor eliminado exitosamente');
        await loadProviders();
      } catch (error: any) {
        console.error('❌ Error eliminando proveedor:', error);
        toast.error(error.message || 'Error al eliminar el proveedor');
      } finally {
        setIsLoading(false);
        setShowDeleteDialog(false);
        setProviderToDelete(null);
      }
    }
  };

  const handleToggleStatus = async (providerId: number) => {
    try {
      const provider = providers.find(p => p.id_proveedores === providerId);
      if (!provider) return;
      
      await proveedoresAPI.update(providerId, {
        estado: !provider.estado
      });
      
      toast.success('Estado del proveedor actualizado');
      await loadProviders();
    } catch (error: any) {
      console.error('❌ Error actualizando estado:', error);
      toast.error(error.message || 'Error al actualizar el estado');
    }
  };

  // Mostrar pantalla de carga mientras se cargan los datos
  if (isLoading && providers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proveedores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AnimatePresence mode="wait">
        {viewMode === 'list' && (
          <ProviderListView
            key="list"
            providers={Array.isArray(providers) ? providers : []}
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
            providerTypes={Array.isArray(providerTypes) ? providerTypes : []}
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
            providerTypes={providerTypes}
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
  onDelete: (providerId: number) => void;
  onToggleStatus: (providerId: number) => void;
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
  
  // Validar que los arrays sean válidos - RETORNO TEMPRANO si hay problema
  if (!Array.isArray(providers) || !Array.isArray(providerTypes)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cargando proveedores...</p>
        </div>
      </div>
    );
  }
  
  const safeProviders = providers;
  const safeProviderTypes = providerTypes;
  
  const getStatusBadge = (estado: boolean) => {
    return estado
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Filtrar proveedores
  const filteredProviders = safeProviders.filter(provider => {
    if (!provider) return false;
    
    const matchesSearch = 
      (provider.nombre && provider.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (provider.id_proveedores && provider.id_proveedores.toString().includes(searchTerm.toLowerCase())) ||
      (provider.email && provider.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || 
      (provider.id_tipo && provider.id_tipo.toString() === filterType);
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'Activo' && provider.estado) ||
      (filterStatus === 'Inactivo' && !provider.estado);
    
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
                {safeProviderTypes
                  .filter(type => type && type.id_tipo && type.nombre)
                  .map(type => (
                    <SelectItem key={type.id_tipo} value={type.id_tipo.toString()}>
                      {type.nombre}
                    </SelectItem>
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
                  paginatedProviders.map((provider) => {
                    const tipoProveedor = safeProviderTypes.find(t => t.id_tipo === provider.id_tipo);
                    return (
                      <TableRow key={provider.id_proveedores} className="hover:bg-green-50/50">
                        <TableCell className="font-medium text-green-700">{provider.id_proveedores}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{provider.nombre}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-green-200 text-green-700">
                            {tipoProveedor?.nombre || 'Sin tipo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-3 h-3" />
                            {provider.telefono || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-3 h-3" />
                            {provider.email || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isAdmin && (
                            <Switch
                              checked={provider.estado}
                              onCheckedChange={() => onToggleStatus(provider.id_proveedores)}
                              className="data-[state=checked]:bg-green-600"
                            />
                          )}
                          {!isAdmin && (
                            <Badge className={getStatusBadge(provider.estado ?? false)}>
                              {provider.estado ? 'Activo' : 'Inactivo'}
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
                                  onClick={() => onDelete(provider.id_proveedores)}
                                  className="hover:bg-red-100 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
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
  onCreate: (provider: Partial<Provider>) => void;
  onUpdate: (provider: Partial<Provider>) => void;
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
  const safeProviderTypes = Array.isArray(providerTypes) ? providerTypes : [];
  
  const [formData, setFormData] = useState({
    nombre: mode === 'create' ? '' : (provider?.nombre || ''),
    id_tipo: mode === 'create' ? '' : (provider?.id_tipo?.toString() || ''),
    telefono: mode === 'create' ? '' : (provider?.telefono || ''),
    email: mode === 'create' ? '' : (provider?.email || ''),
    direccion: mode === 'create' ? '' : (provider?.direccion || ''),
    observaciones: mode === 'create' ? '' : (provider?.observaciones || '')
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.id_tipo) newErrors.id_tipo = 'El tipo de proveedor es obligatorio';
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es obligatorio';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El correo no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const providerData: Partial<Provider> = {
      nombre: formData.nombre,
      id_tipo: parseInt(formData.id_tipo),
      telefono: formData.telefono || '',
      email: formData.email || '',
      direccion: formData.direccion || '',
      observaciones: formData.observaciones || ''
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
                  : `Editando: ${provider?.nombre}`
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
                <Label htmlFor="nombre" className="text-gray-700">
                  Nombre del Proveedor <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Transportes Occidente S.A.S"
                  className={`mt-1 border-green-200 focus:border-green-500 ${errors.nombre ? 'border-red-500' : ''}`}
                />
                {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
              </div>

              {/* Tipo de proveedor */}
              <div>
                <Label htmlFor="id_tipo" className="text-gray-700">
                  Tipo de Proveedor <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.id_tipo}
                  onValueChange={(value: string) => setFormData({ ...formData, id_tipo: value })}
                >
                  <SelectTrigger className={`mt-1 border-green-200 focus:border-green-500 ${errors.id_tipo ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {safeProviderTypes.map(type => (
                      <SelectItem key={type.id_tipo} value={type.id_tipo.toString()}>
                        {type.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.id_tipo && <p className="text-sm text-red-500 mt-1">{errors.id_tipo}</p>}
              </div>

              {/* Teléfono */}
              <div>
                <Label htmlFor="telefono" className="text-gray-700">
                  Teléfono <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Ej: 3001234567"
                  className={`mt-1 border-green-200 focus:border-green-500 ${errors.telefono ? 'border-red-500' : ''}`}
                />
                {errors.telefono && <p className="text-sm text-red-500 mt-1">{errors.telefono}</p>}
              </div>

              {/* Correo */}
              <div className="md:col-span-2">
                <Label htmlFor="email" className="text-gray-700">
                  Correo Electrónico
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
                <Label htmlFor="direccion" className="text-gray-700">
                  Dirección
                </Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Ej: Calle 15 #20-30, Armenia, Quindío"
                  className={`mt-1 border-green-200 focus:border-green-500 ${errors.direccion ? 'border-red-500' : ''}`}
                />
                {errors.direccion && <p className="text-sm text-red-500 mt-1">{errors.direccion}</p>}
              </div>

              {/* Observaciones */}
              <div className="md:col-span-2">
                <Label htmlFor="observaciones" className="text-gray-700">
                  Observaciones (opcional)
                </Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
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
  providerTypes: ProviderType[];
  onBack: () => void;
  onEdit: (provider: Provider) => void;
  onDelete: (providerId: number) => void;
  onToggleStatus: (providerId: number) => void;
  isAdmin: boolean;
}

function ProviderDetailView({
  provider,
  providerTypes,
  onBack,
  onEdit,
  onDelete,
  onToggleStatus,
  isAdmin
}: ProviderDetailViewProps) {
  const safeProviderTypes = Array.isArray(providerTypes) ? providerTypes : [];
  const tipoProveedor = safeProviderTypes.find(t => t.id_tipo === provider.id_tipo);
  
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
                <h2 className="text-2xl font-semibold text-gray-900">{provider.nombre}</h2>
                <p className="text-gray-600 mt-1">ID: {provider.id_proveedores}</p>
              </div>
              <Badge className={provider.estado ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                {provider.estado ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>

            {/* Información del proveedor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-600">Tipo de Proveedor</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className="border-green-200 text-green-700">
                      {tipoProveedor?.nombre || 'Sin tipo'}
                    </Badge>
                  </div>
                  {tipoProveedor?.descripcion && (
                    <p className="text-sm text-gray-500 mt-1">{tipoProveedor.descripcion}</p>
                  )}
                </div>

                <div>
                  <Label className="text-gray-600">Teléfono</Label>
                  <div className="mt-1 flex items-center gap-2 text-gray-900">
                    <Phone className="w-4 h-4 text-green-600" />
                    {provider.telefono || '-'}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600">Correo Electrónico</Label>
                  <div className="mt-1 flex items-center gap-2 text-gray-900">
                    <Mail className="w-4 h-4 text-green-600" />
                    {provider.email || '-'}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-600">Dirección</Label>
                  <div className="mt-1 flex items-start gap-2 text-gray-900">
                    <MapPin className="w-4 h-4 text-green-600 mt-1" />
                    <span>{provider.direccion || '-'}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600">Fecha de Registro</Label>
                  <p className="mt-1 text-gray-900">
                    {provider.fecha_registro ? new Date(provider.fecha_registro).toLocaleDateString('es-ES') : '-'}
                  </p>
                </div>

                {provider.observaciones && (
                  <div>
                    <Label className="text-gray-600">Observaciones</Label>
                    <div className="mt-1 flex items-start gap-2">
                      <FileText className="w-4 h-4 text-green-600 mt-1" />
                      <p className="text-gray-900">{provider.observaciones}</p>
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
                  onClick={() => onToggleStatus(provider.id_proveedores)}
                  variant="outline"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                >
                  <Power className="w-4 h-4 mr-2" />
                  {provider.estado ? 'Desactivar' : 'Activar'}
                </Button>
                <Button
                  onClick={() => onDelete(provider.id_proveedores)}
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