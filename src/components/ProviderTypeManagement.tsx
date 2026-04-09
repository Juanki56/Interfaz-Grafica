import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Tag,
  FileText,
  AlertTriangle,
  Power
} from 'lucide-react';
import { tiposProveedorAPI, TipoProveedor } from '../services/api';
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
import { usePermissions } from '../hooks/usePermissions';

// ===========================
// INTERFACES Y TIPOS
// ===========================

export interface ProviderType extends TipoProveedor {
  providersCount?: number;
}

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

const PROVIDER_TYPES_CACHE_TTL_MS = 30_000;
let providerTypesListCache: ProviderType[] | null = null;
let providerTypesListCacheAt = 0;
const isProviderTypesCacheFresh = (cacheAt: number) => Date.now() - cacheAt < PROVIDER_TYPES_CACHE_TTL_MS;

// ===========================
// COMPONENTE PRINCIPAL
// ===========================

interface ProviderTypeManagementProps {
  userRole?: 'admin' | 'advisor';
}

export function ProviderTypeManagement({ userRole = 'admin' }: ProviderTypeManagementProps) {
  const { hasPermission, loadingRoles } = usePermissions();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedType, setSelectedType] = useState<ProviderType | null>(null);
  const [providerTypes, setProviderTypes] = useState<ProviderType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<number | null>(null);

  const isAdmin = userRole === 'admin';
  const canRead = isAdmin || hasPermission('tipos_proveedor.leer');

  if (!loadingRoles && !canRead) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 font-medium">Acceso denegado</p>
          <p className="text-gray-600 mt-1">No tienes permisos para ver tipos de proveedor.</p>
        </div>
      </div>
    );
  }

  // Cargar datos del backend
  useEffect(() => {
    if (providerTypesListCache && isProviderTypesCacheFresh(providerTypesListCacheAt)) {
      setProviderTypes(providerTypesListCache);
      void loadProviderTypes(true);
      return;
    }

    void loadProviderTypes();
  }, []);

  const loadProviderTypes = async (silent: boolean = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await tiposProveedorAPI.getAll();
      console.log('✅ Tipos de proveedor cargados:', data);
      setProviderTypes(data);
      providerTypesListCache = data;
      providerTypesListCacheAt = Date.now();
    } catch (error) {
      console.error('❌ Error cargando tipos de proveedor:', error);
      if (!silent) {
        toast.error('Error al cargar tipos de proveedor');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleCreateType = async (newType: Partial<ProviderType>) => {
    try {
      setIsLoading(true);
      await tiposProveedorAPI.create({
        nombre: newType.nombre!,
        descripcion: newType.descripcion,
        estado: true
      });
      
      toast.success('Tipo de proveedor creado exitosamente');
      setViewMode('list');
      await loadProviderTypes();
    } catch (error: any) {
      console.error('❌ Error creando tipo de proveedor:', error);
      toast.error(error.message || 'Error al crear el tipo de proveedor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateType = async (updatedType: Partial<ProviderType>) => {
    try {
      setIsLoading(true);
      await tiposProveedorAPI.update(selectedType!.id_tipo, {
        nombre: updatedType.nombre,
        descripcion: updatedType.descripcion
      });
      
      toast.success('Tipo de proveedor actualizado exitosamente');
      setViewMode('list');
      setSelectedType(null);
      await loadProviderTypes();
    } catch (error: any) {
      console.error('❌ Error actualizando tipo de proveedor:', error);
      toast.error(error.message || 'Error al actualizar el tipo de proveedor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = (type: ProviderType) => {
    setSelectedType(type);
    setViewMode('detail');
  };

  const handleEdit = (type: ProviderType) => {
    setSelectedType(type);
    setViewMode('edit');
  };

  const handleInitiateDelete = (typeId: number) => {
    setTypeToDelete(typeId);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (typeToDelete) {
      try {
        setIsLoading(true);
        await tiposProveedorAPI.delete(typeToDelete);
        toast.success('Tipo de proveedor eliminado exitosamente');
        await loadProviderTypes();
      } catch (error: any) {
        console.error('❌ Error eliminando tipo de proveedor:', error);
        toast.error(error.message || 'Error al eliminar el tipo de proveedor');
      } finally {
        setIsLoading(false);
        setShowDeleteDialog(false);
        setTypeToDelete(null);
      }
    }
  };

  const handleToggleStatus = async (typeId: number) => {
    try {
      const type = providerTypes.find(t => t.id_tipo === typeId);
      if (!type) return;
      
      await tiposProveedorAPI.update(typeId, {
        estado: !type.estado
      });
      
      toast.success('Estado del tipo de proveedor actualizado');
      await loadProviderTypes();
    } catch (error: any) {
      console.error('❌ Error actualizando estado:', error);
      toast.error(error.message || 'Error al actualizar el estado');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AnimatePresence mode="wait">
        {viewMode === 'list' && (
          <ProviderTypeListView
            key="list"
            providerTypes={providerTypes}
            isLoading={isLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
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
            isAdmin={isAdmin}
            hasPermission={hasPermission}
          />
        )}
        
        {(viewMode === 'create' || viewMode === 'edit') && (
          <ProviderTypeFormView
            key={viewMode}
            mode={viewMode}
            providerType={selectedType}
            onBack={() => {
              setViewMode('list');
              setSelectedType(null);
            }}
            onCreate={handleCreateType}
            onUpdate={handleUpdateType}
          />
        )}
        
        {viewMode === 'detail' && selectedType && (
          <ProviderTypeDetailView
            key="detail"
            providerType={selectedType}
            onBack={() => {
              setViewMode('list');
              setSelectedType(null);
            }}
            onEdit={handleEdit}
            onDelete={handleInitiateDelete}
            onToggleStatus={handleToggleStatus}
            isAdmin={isAdmin}
            hasPermission={hasPermission}
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
                Eliminar Tipo de Proveedor
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-gray-700">
                ¿Estás seguro de que deseas eliminar este tipo de proveedor?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Advertencia:</strong> Esta acción no se puede deshacer. 
                  Si hay proveedores asociados a este tipo, deberás reasignarlos antes de eliminarlo.
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

interface ProviderTypeListViewProps {
  providerTypes: ProviderType[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  onCreateNew: () => void;
  onViewDetail: (type: ProviderType) => void;
  onEdit: (type: ProviderType) => void;
  onDelete: (typeId: number) => void;
  onToggleStatus: (typeId: number) => void;
  isAdmin: boolean;
  hasPermission?: (perm: string) => boolean;
}

function ProviderTypeListView({
  providerTypes,
  isLoading,
  searchTerm,
  setSearchTerm,
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
  isAdmin,
  hasPermission
}: ProviderTypeListViewProps) {
  
  const getStatusBadge = (estado: boolean) => {
    return estado
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Filtrar tipos
  const filteredTypes = providerTypes.filter(type => {
    const matchesSearch = 
      type.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (type.descripcion && type.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      type.id_tipo.toString().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'Activo' && type.estado) ||
      (filterStatus === 'Inactivo' && !type.estado);
    
    return matchesSearch && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredTypes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTypes = filteredTypes.slice(startIndex, startIndex + itemsPerPage);

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
          <h1 className="text-green-800">Gestión de Tipo de Proveedores</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Administra los tipos de proveedores del sistema' : 'Visualiza los tipos de proveedores'}
          </p>
        </div>
        {(isAdmin || hasPermission?.('tipos_proveedor.crear')) && (
          <Button 
            onClick={onCreateNew}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Tipo de Proveedor
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card className="border-green-100">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-green-200 focus:border-green-500"
              />
            </div>

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
            <span className="text-green-800">Listado de Tipos de Proveedores</span>
            <div className="flex items-center gap-2">
              {isLoading && <span className="text-xs text-gray-500">Actualizando...</span>}
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {filteredTypes.length} {filteredTypes.length === 1 ? 'tipo' : 'tipos'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Table>
              <TableHeader>
                <TableRow className="bg-green-50">
                  <TableHead className="text-green-800">ID</TableHead>
                  <TableHead className="text-green-800">Nombre del Tipo</TableHead>
                  <TableHead className="text-green-800">Descripción</TableHead>
                  <TableHead className="text-green-800">Proveedores</TableHead>
                  <TableHead className="text-green-800">Estado</TableHead>
                  <TableHead className="text-green-800 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No se encontraron tipos de proveedores
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTypes.map((type) => (
                    <TableRow key={type.id_tipo} className="hover:bg-green-50/50">
                      <TableCell className="font-medium text-green-700">{type.id_tipo}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{type.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-gray-600 truncate">{type.descripcion || '-'}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-blue-200 text-blue-700">
                          {type.providersCount || 0} proveedores
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(isAdmin || hasPermission?.('tipos_proveedor.editar')) && (
                          <Switch
                            checked={!!type.estado}
                            onCheckedChange={() => onToggleStatus(type.id_tipo)}
                            className="data-[state=checked]:bg-green-600"
                          />
                        )}
                        {!(isAdmin || hasPermission?.('tipos_proveedor.editar')) && (
                          <Badge className={getStatusBadge(!!type.estado)}>
                            {type.estado ? 'Activo' : 'Inactivo'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetail(type)}
                            className="hover:bg-green-100 hover:text-green-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(isAdmin || hasPermission?.('tipos_proveedor.editar')) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(type)}
                              className="hover:bg-blue-100 hover:text-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {(isAdmin || hasPermission?.('tipos_proveedor.eliminar')) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(type.id_tipo)}
                              className="hover:bg-red-100 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredTypes.length)} de {filteredTypes.length} tipos
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

interface ProviderTypeFormViewProps {
  mode: 'create' | 'edit';
  providerType: ProviderType | null;
  onBack: () => void;
  onCreate: (type: Partial<ProviderType>) => void;
  onUpdate: (type: Partial<ProviderType>) => void;
}

function ProviderTypeFormView({
  mode,
  providerType,
  onBack,
  onCreate,
  onUpdate
}: ProviderTypeFormViewProps) {
  const [formData, setFormData] = useState({
    nombre: providerType?.nombre || '',
    descripcion: providerType?.descripcion || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es obligatoria';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const typeData: Partial<ProviderType> = {
      nombre: formData.nombre,
      descripcion: formData.descripcion
    };

    if (mode === 'create') {
      onCreate(typeData);
    } else {
      onUpdate(typeData);
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
                {mode === 'create' ? 'Crear Nuevo Tipo de Proveedor' : 'Editar Tipo de Proveedor'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {mode === 'create' 
                  ? 'Define un nuevo tipo de proveedor para el sistema' 
                  : `Editando: ${providerType?.nombre}`
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
            {/* Nombre del tipo */}
            <div>
              <Label htmlFor="nombre" className="text-gray-700">
                Nombre del Tipo de Proveedor <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Transporte, Alimentación, Alojamiento..."
                className={`mt-1 border-green-200 focus:border-green-500 ${errors.nombre ? 'border-red-500' : ''}`}
              />
              {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
            </div>

            {/* Descripción */}
            <div>
              <Label htmlFor="descripcion" className="text-gray-700">
                Descripción <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Describe el tipo de proveedores que agrupa esta categoría..."
                className={`mt-1 border-green-200 focus:border-green-500 min-h-[120px] ${errors.descripcion ? 'border-red-500' : ''}`}
              />
              {errors.descripcion && <p className="text-sm text-red-500 mt-1">{errors.descripcion}</p>}
            </div>

            {/* Ejemplo informativo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">
                    💡 Consejos para crear un tipo de proveedor
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Usa nombres descriptivos y concisos</li>
                    <li>La descripción debe explicar claramente qué tipo de servicios agrupa</li>
                    <li>Piensa en los proveedores que usarán esta categoría</li>
                  </ul>
                </div>
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
                {mode === 'create' ? 'Crear Tipo' : 'Guardar Cambios'}
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

interface ProviderTypeDetailViewProps {
  providerType: ProviderType;
  onBack: () => void;
  onEdit: (type: ProviderType) => void;
  onDelete: (typeId: number) => void;
  onToggleStatus: (typeId: number) => void;
  isAdmin: boolean;
  hasPermission?: (perm: string) => boolean;
}

function ProviderTypeDetailView({
  providerType,
  onBack,
  onEdit,
  onDelete,
  onToggleStatus,
  isAdmin,
  hasPermission
}: ProviderTypeDetailViewProps) {
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
              <CardTitle className="text-green-800">Detalle del Tipo de Proveedor</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Información completa del tipo de proveedor</p>
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
                <h2 className="text-2xl font-semibold text-gray-900">{providerType.nombre}</h2>
                <p className="text-gray-600 mt-1">ID: {providerType.id_tipo}</p>
              </div>
              <Badge className={providerType.estado ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                {providerType.estado ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>

            {/* Información del tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label className="text-gray-600">Descripción</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900">{providerType.descripcion || '-'}</p>
                </div>
              </div>

              <div>
                <Label className="text-gray-600">Fecha de Creación</Label>
                <p className="mt-1 text-gray-900">
                  {providerType.fecha_creacion 
                    ? new Date(providerType.fecha_creacion).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : '-'
                  }
                </p>
              </div>

              <div>
                <Label className="text-gray-600">Proveedores Asociados</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className="border-blue-200 text-blue-700 text-base py-1 px-3">
                    {providerType.providersCount || 0} proveedores
                  </Badge>
                </div>
              </div>
            </div>

            {/* Estadística visual */}
            <div className="bg-green-50 border border-green-100 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-green-100 rounded-full">
                  <Tag className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de proveedores en esta categoría</p>
                  <p className="text-3xl font-semibold text-green-800">{providerType.providersCount || 0}</p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            {(isAdmin || hasPermission?.('tipos_proveedor.editar') || hasPermission?.('tipos_proveedor.eliminar')) && (
              <div className="flex flex-wrap gap-3 pt-6 border-t border-green-100">
                {(isAdmin || hasPermission?.('tipos_proveedor.editar')) && (
                  <Button
                    onClick={() => onEdit(providerType)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                )}
                {(isAdmin || hasPermission?.('tipos_proveedor.editar')) && (
                  <Button
                    onClick={() => onToggleStatus(providerType.id_tipo)}
                    variant="outline"
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  >
                    <Power className="w-4 h-4 mr-2" />
                    {providerType.estado ? 'Desactivar' : 'Activar'}
                  </Button>
                )}
                {(isAdmin || hasPermission?.('tipos_proveedor.eliminar')) && (
                  <Button
                    onClick={()=> onDelete(providerType.id_tipo)}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}