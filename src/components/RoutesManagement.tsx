import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Route as RouteIcon,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X,
  DollarSign,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { rutasAPI, Ruta, RutaServicioPredefinido, RutaServicioOpcional } from '../services/api';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';
import { useServices } from '../hooks/useServices';

interface Route {
  id_ruta: number;
  nombre: string;
  descripcion?: string | null;
  duracion_dias?: number | null;
  precio_base?: number | null;
  dificultad?: string | null;
  imagen_url?: string | null;
  estado?: boolean | null;
  fecha_creacion?: string | null;
  servicios_predefinidos?: RutaServicioPredefinido[] | null;
  servicios_opcionales?: RutaServicioOpcional[] | null;
}

type PredefinedServiceFormItem = {
  id_servicio: string;
  cantidad_default: number;
  requerido: boolean;
};

type OptionalServiceFormItem = {
  id_servicio: string;
  cantidad_default: number;
};

interface RoutesManagementProps {
  userRole?: 'admin' | 'advisor';
}

export function RoutesManagement({ userRole = 'admin' }: RoutesManagementProps) {
  const permisos = usePermissions();
  const routePerms = createModulePermissions(permisos, 'Rutas');
  const canViewRoutes = routePerms.canView();
  const canCreateRoute = routePerms.canCreate();
  const canEditRoute = routePerms.canEdit();
  const canDeleteRoute = routePerms.canDelete();

  const { services } = useServices();

  const requiredServiceIds = useMemo(() => {
    const normalize = (value: string) =>
      String(value || '')
        .toLowerCase()
        .normalize('NFD')
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0300-\u036f]/g, '');

    const poliza = services.find((s) => normalize(s.name).includes('poliza'));
    const medico = services.find((s) => normalize(s.name).includes('personal medico'));

    const ids = [poliza?.id, medico?.id].filter(Boolean) as string[];
    return {
      ids,
      polizaId: poliza?.id || null,
      medicoId: medico?.id || null,
    };
  }, [services]);

  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    duracion_dias: '',
    precio_base: '',
    dificultad: 'Moderado',
    imagen_url: ''
  });

  const [predefinedServices, setPredefinedServices] = useState<PredefinedServiceFormItem[]>([]);
  const [serviceToAdd, setServiceToAdd] = useState<string>('');

  const [optionalServices, setOptionalServices] = useState<OptionalServiceFormItem[]>([]);
  const [optionalServiceToAdd, setOptionalServiceToAdd] = useState<string>('');

  // Asegura que Póliza + Personal médico estén SIEMPRE como predefinidos requeridos.
  // (Backend también lo forza, pero lo bloqueamos en UI para evitar confusión.)
  useEffect(() => {
    if (!requiredServiceIds.ids.length) return;
    if (!isCreateModalOpen && !isEditModalOpen) return;

    setPredefinedServices((prev) => {
      const byId = new Map(prev.map((s) => [s.id_servicio, s] as const));
      for (const id of requiredServiceIds.ids) {
        byId.set(id, { id_servicio: id, cantidad_default: 1, requerido: true });
      }

      return Array.from(byId.values()).map((s) =>
        requiredServiceIds.ids.includes(s.id_servicio)
          ? { ...s, cantidad_default: 1, requerido: true }
          : s
      );
    });

    // Nunca permitir que un obligatorio esté como opcional
    setOptionalServices((prev) => prev.filter((s) => !requiredServiceIds.ids.includes(s.id_servicio)));
  }, [requiredServiceIds, isCreateModalOpen, isEditModalOpen]);

  // Cargar rutas desde la API al montar el componente
  useEffect(() => {
    console.log('🎬 RoutesManagement montado, iniciando carga de rutas...');
    if (permisos.loadingRoles) return;
    if (!canViewRoutes) {
      setRoutes([]);
      setIsLoading(false);
      return;
    }
    loadRoutes();
  }, [permisos.loadingRoles, canViewRoutes]);

  const loadRoutes = async () => {
    try {
      setIsLoading(true);
      setRoutes([]); // Limpiar estado anterior
      
      console.log('🔄 Cargando rutas desde BD...');
      console.log('🔑 Token disponible:', !!localStorage.getItem('token'));
      
      const rutasFromDB = await rutasAPI.getAll();
      console.log('📥 Rutas recibidas de BD (raw):', rutasFromDB);
      console.log('📊 Tipo de dato recibido:', typeof rutasFromDB, Array.isArray(rutasFromDB));
      console.log('📏 Cantidad de rutas:', rutasFromDB?.length || 0);
      
      // Mapear rutas del backend (mantener estructura exacta de la BD)
      const mappedRoutes: Route[] = rutasFromDB.map(ruta => {
        console.log('🔄 Mapeando ruta:', ruta);
        return {
          id_ruta: ruta.id_ruta,
          nombre: ruta.nombre,
          descripcion: ruta.descripcion,
          duracion_dias: ruta.duracion_dias,
          precio_base: ruta.precio_base,
          dificultad: ruta.dificultad,
          imagen_url: ruta.imagen_url,
          estado: ruta.estado,
          fecha_creacion: ruta.fecha_creacion,
          servicios_predefinidos: ruta.servicios_predefinidos ?? [],
          servicios_opcionales: (ruta as any).servicios_opcionales ?? [],
        };
      });
      
      console.log('✅ Rutas mapeadas:', mappedRoutes);
      setRoutes([...mappedRoutes]); // Crear nuevo array para forzar re-render
      console.log('✅ Estado actualizado con', mappedRoutes.length, 'rutas');
    } catch (error) {
      console.error('❌ Error cargando rutas:', error);
      console.error('❌ Tipo de error:', error instanceof Error ? error.message : error);
      toast.error(`Error al cargar las rutas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setRoutes([]); // Asegurar que el array esté vacío en caso de error
    } finally {
      setIsLoading(false);
      console.log('🏁 Carga de rutas finalizada');
    }
  };

  // Filter routes
  const filteredRoutes = routes.filter(route =>
    route.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.dificultad?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);
  const currentRoutes = filteredRoutes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getDifficultyBadge = (difficulty: string | null | undefined) => {
    if (!difficulty) return null;
    const colors: Record<string, string> = {
      'Fácil': 'bg-green-100 text-green-700 border-green-200',
      'Moderado': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Difícil': 'bg-red-100 text-red-700 border-red-200'
    };
    return <Badge className={colors[difficulty] || 'bg-gray-100 text-gray-700'}>{difficulty}</Badge>;
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewDetails = (route: Route) => {
    setSelectedRoute(route);
    setIsViewModalOpen(true);
  };

  const handleEdit = (route: Route) => {
    if (!canEditRoute) {
      toast.error('No tienes permiso para editar rutas');
      return;
    }

    console.log('📝 Editando ruta:', route);
    setSelectedRoute(route);
    
    setFormData({
      nombre: route.nombre || '',
      descripcion: route.descripcion || '',
      duracion_dias: route.duracion_dias?.toString() || '',
      precio_base: route.precio_base?.toString() || '',
      dificultad: route.dificultad || 'Moderado',
      imagen_url: route.imagen_url || ''
    });

    const servicios = Array.isArray(route.servicios_predefinidos) ? route.servicios_predefinidos : [];
    setPredefinedServices(
      servicios.map((s) => ({
        id_servicio: String(s.id_servicio),
        cantidad_default: Number(s.cantidad_default ?? 1),
        requerido: s.requerido ?? true,
      }))
    );

    const opc = Array.isArray(route.servicios_opcionales) ? route.servicios_opcionales : [];
    setOptionalServices(
      opc.map((s) => ({
        id_servicio: String(s.id_servicio),
        cantidad_default: Number(s.cantidad_default ?? 1),
      }))
    );
    setServiceToAdd('');
    setOptionalServiceToAdd('');
    
    console.log('📝 FormData preparado:', formData);
    
    setIsEditModalOpen(true);
  };

  const addPredefinedService = () => {
    if (!serviceToAdd) return;
    if (requiredServiceIds.ids.includes(serviceToAdd)) {
      setServiceToAdd('');
      return;
    }
    if (predefinedServices.some((s) => s.id_servicio === serviceToAdd)) {
      setServiceToAdd('');
      return;
    }

    // Evita que el mismo servicio exista como opcional
    setOptionalServices((prev) => prev.filter((s) => s.id_servicio !== serviceToAdd));

    setPredefinedServices((prev) => [
      ...prev,
      { id_servicio: serviceToAdd, cantidad_default: 1, requerido: true },
    ]);
    setServiceToAdd('');
  };

  const removePredefinedService = (idServicio: string) => {
    if (requiredServiceIds.ids.includes(idServicio)) return;
    setPredefinedServices((prev) => prev.filter((s) => s.id_servicio !== idServicio));
  };

  const updatePredefinedService = (
    idServicio: string,
    patch: Partial<PredefinedServiceFormItem>
  ) => {
    if (requiredServiceIds.ids.includes(idServicio)) {
      // Mantener obligatorios en 1 y requerido=true
      setPredefinedServices((prev) =>
        prev.map((s) =>
          s.id_servicio === idServicio
            ? { ...s, cantidad_default: 1, requerido: true }
            : s
        )
      );
      return;
    }
    setPredefinedServices((prev) =>
      prev.map((s) => (s.id_servicio === idServicio ? { ...s, ...patch } : s))
    );
  };

  const addOptionalService = () => {
    if (!optionalServiceToAdd) return;
    if (requiredServiceIds.ids.includes(optionalServiceToAdd)) {
      setOptionalServiceToAdd('');
      return;
    }
    if (predefinedServices.some((s) => s.id_servicio === optionalServiceToAdd)) {
      setOptionalServiceToAdd('');
      return;
    }
    if (optionalServices.some((s) => s.id_servicio === optionalServiceToAdd)) {
      setOptionalServiceToAdd('');
      return;
    }
    setOptionalServices((prev) => [...prev, { id_servicio: optionalServiceToAdd, cantidad_default: 1 }]);
    setOptionalServiceToAdd('');
  };

  const removeOptionalService = (idServicio: string) => {
    setOptionalServices((prev) => prev.filter((s) => s.id_servicio !== idServicio));
  };

  const updateOptionalService = (idServicio: string, patch: Partial<OptionalServiceFormItem>) => {
    setOptionalServices((prev) =>
      prev.map((s) => (s.id_servicio === idServicio ? { ...s, ...patch } : s))
    );
  };

  const handleDelete = (route: Route) => {
    if (!canDeleteRoute) {
      toast.error('No tienes permiso para eliminar rutas');
      return;
    }

    setSelectedRoute(route);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!canDeleteRoute) {
      toast.error('No tienes permiso para eliminar rutas');
      return;
    }

    if (selectedRoute) {
      try {
        const routeId = selectedRoute.id_ruta;
        await rutasAPI.delete(routeId);
        
        toast.success('Ruta eliminada correctamente de la base de datos');
        setIsDeleteDialogOpen(false);
        setSelectedRoute(null);

        // Forzar recarga inmediata de rutas
        console.log('🔄 Recargando lista de rutas...');
        setIsLoading(true);
        await loadRoutes();
      } catch (error) {
        console.error('❌ Error eliminando ruta:', error);
        toast.error('Error al eliminar la ruta');
      }
    }
  };

  const handleCreateRoute = async () => {
    if (!canCreateRoute) {
      toast.error('No tienes permiso para crear rutas');
      return;
    }

    // Validar solo el campo obligatorio (nombre es NOT NULL en BD)
    if (!formData.nombre.trim()) {
      toast.error('El nombre de la ruta es obligatorio');
      return;
    }

    // Validar precio si se proporciona
    let precio: number | null = null;
    if (formData.precio_base && formData.precio_base.trim() !== '') {
      precio = parseFloat(formData.precio_base);
      if (isNaN(precio) || precio <= 0) {
        toast.error('El precio debe ser un número válido mayor a 0');
        return;
      }
    }

    // Validar duración si se proporciona
    let duracion: number | null = null;
    if (formData.duracion_dias && formData.duracion_dias.trim() !== '') {
      duracion = parseInt(formData.duracion_dias);
      if (isNaN(duracion) || duracion <= 0) {
        toast.error('La duración debe ser un número válido mayor a 0');
        return;
      }
    }

    try {
      // Preparar datos para el backend (solo nombre es obligatorio)
      const rutaData: Partial<Ruta> = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || null,
        duracion_dias: duracion,
        precio_base: precio,
        dificultad: formData.dificultad || null,
        imagen_url: formData.imagen_url?.trim() || null,
        estado: true,
        servicios_predefinidos: predefinedServices
          .map((s) => ({
            id_servicio: Number(s.id_servicio),
            cantidad_default: Math.max(1, Number(s.cantidad_default) || 1),
            requerido: Boolean(s.requerido),
          }))
          .filter((s) => Number.isFinite(s.id_servicio) && s.id_servicio > 0),

        servicios_opcionales: optionalServices
          .map((s) => ({
            id_servicio: Number(s.id_servicio),
            cantidad_default: Math.max(1, Number(s.cantidad_default) || 1),
          }))
          .filter((s) => Number.isFinite(s.id_servicio) && s.id_servicio > 0),
      };

      console.log('📤 Enviando ruta a BD:', rutaData);

      // Enviar a la base de datos
      const response = await rutasAPI.create(rutaData);
      console.log('✅ Ruta creada en BD, respuesta:', response);

      toast.success('Ruta creada correctamente en la base de datos');
      
      // Cerrar modal y resetear formulario ANTES de recargar
      setIsCreateModalOpen(false);
      resetForm();

      // Forzar recarga inmediata de rutas
      console.log('🔄 Recargando lista de rutas...');
      setIsLoading(true);
      await loadRoutes();
    } catch (error: any) {
      console.error('❌ Error creando ruta:', error);
      console.error('❌ Detalle del error:', error.message);
      console.error('❌ Error completo:', JSON.stringify(error, null, 2));
      
      // Mostrar mensaje más específico
      const errorMessage = error.message || 'Error desconocido al crear la ruta';
      toast.error(`Error al crear la ruta: ${errorMessage}`);
    }
  };

  const handleUpdateRoute = async () => {
    if (!canEditRoute) {
      toast.error('No tienes permiso para editar rutas');
      return;
    }

    if (!selectedRoute) return;

    // Validar solo el campo obligatorio (nombre es NOT NULL en BD)
    if (!formData.nombre.trim()) {
      toast.error('El nombre de la ruta es obligatorio');
      return;
    }

    // Validar precio si se proporciona
    let precio: number | null = null;
    if (formData.precio_base && formData.precio_base.trim() !== '') {
      precio = parseFloat(formData.precio_base);
      if (isNaN(precio) || precio <= 0) {
        toast.error('El precio debe ser un número válido mayor a 0');
        return;
      }
    }

    // Validar duración si se proporciona
    let duracion: number | null = null;
    if (formData.duracion_dias && formData.duracion_dias.trim() !== '') {
      duracion = parseInt(formData.duracion_dias);
      if (isNaN(duracion) || duracion <= 0) {
        toast.error('La duración debe ser un número válido mayor a 0');
        return;
      }
    }

    try {
      const routeId = selectedRoute.id_ruta;
      
      // Preparar datos para el backend (solo nombre es obligatorio)
      const rutaData: Partial<Ruta> = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || null,
        duracion_dias: duracion,
        precio_base: precio,
        dificultad: formData.dificultad || null,
        imagen_url: formData.imagen_url?.trim() || null,
        estado: selectedRoute.estado,
        servicios_predefinidos: predefinedServices
          .map((s) => ({
            id_servicio: Number(s.id_servicio),
            cantidad_default: Math.max(1, Number(s.cantidad_default) || 1),
            requerido: Boolean(s.requerido),
          }))
          .filter((s) => Number.isFinite(s.id_servicio) && s.id_servicio > 0),

        servicios_opcionales: optionalServices
          .map((s) => ({
            id_servicio: Number(s.id_servicio),
            cantidad_default: Math.max(1, Number(s.cantidad_default) || 1),
          }))
          .filter((s) => Number.isFinite(s.id_servicio) && s.id_servicio > 0),
      };

      console.log('📤 Actualizando ruta en BD:', routeId, rutaData);

      // Actualizar en la base de datos
      await rutasAPI.update(routeId, rutaData);
      console.log('✅ Ruta actualizada en BD');

      toast.success('Ruta actualizada correctamente en la base de datos');
      
      // Cerrar modal y resetear ANTES de recargar
      setIsEditModalOpen(false);
      setSelectedRoute(null);
      resetForm();

      // Forzar recarga inmediata de rutas
      console.log('🔄 Recargando lista de rutas...');
      setIsLoading(true);
      await loadRoutes();
    } catch (error) {
      console.error('❌ Error actualizando ruta:', error);
      toast.error('Error al actualizar la ruta en la base de datos');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      duracion_dias: '',
      precio_base: '',
      dificultad: 'Moderado',
      imagen_url: ''
    });
    setPredefinedServices([]);
    setServiceToAdd('');
    setOptionalServices([]);
    setOptionalServiceToAdd('');
  };

  // Toggle route status (Admin only)
  const handleToggleStatus = async (route: Route) => {
    if (!canEditRoute) {
      toast.error('No tienes permiso para editar rutas');
      return;
    }

    try {
      const routeId = route.id_ruta;
      const newStatus = route.estado;
      
      // Actualizar estado en BD
      await rutasAPI.update(routeId, { estado: !newStatus });
      
      toast.success(`Estado cambiado a ${newStatus ? 'Inactiva' : 'Activa'}`);
      
      // Forzar recarga inmediata de rutas
      console.log('🔄 Recargando lista de rutas...');
      setIsLoading(true);
      await loadRoutes();
    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      toast.error('Error al cambiar el estado');
    }
  };

  if (!permisos.loadingRoles && !canViewRoutes) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Acceso denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">No tienes permiso para ver rutas.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl text-gray-900 mb-2">Gestión de Rutas Turísticas</h1>
            <p className="text-gray-600">
              {userRole === 'admin' 
                ? 'Administración completa de rutas y circuitos turísticos'
                : 'Consulta de rutas turísticas disponibles'
              }
            </p>
          </div>
          {canCreateRoute && (
            <Button
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Nueva Ruta
            </Button>
          )}
        </div>

        {/* Search and Download */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar rutas por nombre, ubicación o dificultad..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="pl-10 border-green-200 focus:border-green-500"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card className="border-green-100">
          <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100">
            <CardTitle className="flex items-center space-x-2 text-gray-900">
              <RouteIcon className="w-5 h-5 text-green-600" />
              <span>Listado de Rutas</span>
              <Badge variant="secondary" className="ml-2">
                {filteredRoutes.length} rutas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Descripción</TableHead>
                    <TableHead className="font-semibold">Duración (días)</TableHead>
                    <TableHead className="font-semibold">Precio Base</TableHead>
                    <TableHead className="font-semibold">Dificultad</TableHead>
                    {canEditRoute && (
                      <TableHead className="text-center font-semibold">Estado</TableHead>
                    )}
                    <TableHead className="font-semibold">Fecha Creación</TableHead>
                    <TableHead className="text-right font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={canEditRoute ? 9 : 8} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                          <p className="text-gray-500">Cargando rutas desde la base de datos...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : currentRoutes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canEditRoute ? 9 : 8} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-2">
                          <RouteIcon className="w-12 h-12 text-gray-400" />
                          <p className="text-gray-500">
                            {searchTerm 
                              ? `No se encontraron rutas con "${searchTerm}"`
                              : 'No hay rutas disponibles'
                            }
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentRoutes.map((route, index) => (
                      <motion.tr
                        key={route.id_ruta}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className="hover:bg-green-50/50 transition-colors"
                      >
                        <TableCell className="font-medium text-gray-700">
                          {route.id_ruta}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {route.imagen_url && (
                              <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                <ImageWithFallback
                                  src={route.imagen_url}
                                  alt={route.nombre}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <p className="font-medium text-gray-900">{route.nombre}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-gray-600 truncate">
                            {route.descripcion || 'Sin descripción'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 text-gray-700">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span>{route.duracion_dias || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          {formatCurrency(route.precio_base)}
                        </TableCell>
                        <TableCell>
                          {route.dificultad ? getDifficultyBadge(route.dificultad) : 'N/A'}
                        </TableCell>
                        {canEditRoute && (
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Switch
                                checked={route.estado === true}
                                onCheckedChange={() => handleToggleStatus(route)}
                                disabled={!canEditRoute}
                                className="data-[state=checked]:bg-green-600"
                              />
                              <span className="text-sm text-gray-700">
                                {route.estado ? 'Activa' : 'Inactiva'}
                              </span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {route.fecha_creacion 
                              ? new Date(route.fecha_creacion).toLocaleDateString('es-CO')
                              : 'N/A'
                            }
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(route)}
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                            {canEditRoute && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(route)}
                                title="Editar ruta"
                              >
                                <Edit className="w-4 h-4 text-green-600" />
                              </Button>
                            )}
                            {canDeleteRoute && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(route)}
                                title="Eliminar ruta"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination - Always visible */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="flex justify-between items-center border-t border-green-100 pt-4"
      >
        <Button
          variant="outline"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="border-green-200 hover:bg-green-50"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-gray-600">
            Página <span className="font-semibold text-gray-900">{currentPage}</span> de <span className="font-semibold text-gray-900">{totalPages || 1}</span>
          </span>
          <Separator orientation="vertical" className="h-6" />
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            {filteredRoutes.length} {filteredRoutes.length === 1 ? 'ruta' : 'rutas'}
          </Badge>
        </div>
        <Button
          variant="outline"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="border-green-200 hover:bg-green-50"
        >
          Siguiente
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </motion.div>

      {/* Create Route Modal */}
      {canCreateRoute && (
        <Dialog
          open={isCreateModalOpen}
          onOpenChange={(open: boolean) => {
            setIsCreateModalOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-green-700">
                <Plus className="w-5 h-5" />
                <span>Crear Nueva Ruta Turística</span>
              </DialogTitle>
              <DialogDescription>
                Complete la información para registrar una nueva ruta en el sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="nombre">Nombre de la Ruta *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Valle del Cocora"
                />
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción detallada de la ruta..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duracion_dias">Duración (días)</Label>
                  <Input
                    id="duracion_dias"
                    type="number"
                    value={formData.duracion_dias}
                    onChange={(e) => setFormData({ ...formData, duracion_dias: e.target.value })}
                    placeholder="Ej: 5"
                    min="1"
                    step="1"
                  />
                </div>
                <div>
                  <Label htmlFor="precio_base">Precio Base (COP)</Label>
                  <Input
                    id="precio_base"
                    type="number"
                    value={formData.precio_base}
                    onChange={(e) => setFormData({ ...formData, precio_base: e.target.value })}
                    placeholder="Ej: 250000"
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="dificultad">Dificultad</Label>
                  <Select
                    value={formData.dificultad}
                    onValueChange={(value: string) => setFormData({ ...formData, dificultad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fácil">Fácil</SelectItem>
                      <SelectItem value="Moderado">Moderado</SelectItem>
                      <SelectItem value="Difícil">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="imagen_url">URL de Imagen</Label>
                <Input
                  id="imagen_url"
                  value={formData.imagen_url}
                  onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <Label>Servicios predefinidos (opcional)</Label>
                  <p className="text-sm text-gray-500">Se incluirán por defecto cuando se use la ruta.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <Select value={serviceToAdd} onValueChange={setServiceToAdd}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {services
                          .filter(
                            (s) =>
                              !predefinedServices.some((ps) => ps.id_servicio === s.id) &&
                              !optionalServices.some((os) => os.id_servicio === s.id)
                          )
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPredefinedService}
                    disabled={!serviceToAdd}
                  >
                    Agregar
                  </Button>
                </div>

                {predefinedServices.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay servicios predefinidos.</p>
                ) : (
                  <div className="space-y-2">
                    {predefinedServices.map((ps) => {
                      const svc = services.find((s) => s.id === ps.id_servicio);
                      const isRequired = requiredServiceIds.ids.includes(ps.id_servicio);
                      return (
                        <div
                          key={ps.id_servicio}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg bg-gray-50"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{svc?.name || `Servicio #${ps.id_servicio}`}</p>
                            <p className="text-xs text-gray-500">ID: {ps.id_servicio}</p>
                            {isRequired && (
                              <p className="text-xs text-green-700 mt-1">Obligatorio (siempre incluido)</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-gray-600">Cantidad</Label>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={ps.cantidad_default}
                              disabled={isRequired}
                              onChange={(e) =>
                                updatePredefinedService(ps.id_servicio, {
                                  cantidad_default: Math.max(1, parseInt(e.target.value || '1', 10) || 1),
                                })
                              }
                              className="w-24"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={ps.requerido}
                              disabled={isRequired}
                              onCheckedChange={(checked: boolean | 'indeterminate') =>
                                updatePredefinedService(ps.id_servicio, {
                                  requerido: checked === true,
                                })
                              }
                            />
                            <span className="text-sm text-gray-700">Requerido</span>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePredefinedService(ps.id_servicio)}
                            disabled={isRequired}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Quitar servicio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <Label>Servicios opcionales por ruta (opcional)</Label>
                  <p className="text-sm text-gray-500">Se ofrecerán para seleccionar al reservar esta ruta.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <Select value={optionalServiceToAdd} onValueChange={setOptionalServiceToAdd}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {services
                          .filter(
                            (s) =>
                              !predefinedServices.some((ps) => ps.id_servicio === s.id) &&
                              !optionalServices.some((os) => os.id_servicio === s.id) &&
                              !requiredServiceIds.ids.includes(s.id)
                          )
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOptionalService}
                    disabled={!optionalServiceToAdd}
                  >
                    Agregar
                  </Button>
                </div>

                {optionalServices.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay servicios opcionales.</p>
                ) : (
                  <div className="space-y-2">
                    {optionalServices.map((os) => {
                      const svc = services.find((s) => s.id === os.id_servicio);
                      return (
                        <div
                          key={os.id_servicio}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg bg-gray-50"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{svc?.name || `Servicio #${os.id_servicio}`}</p>
                            <p className="text-xs text-gray-500">ID: {os.id_servicio}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-gray-600">Cantidad sugerida</Label>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={os.cantidad_default}
                              onChange={(e) =>
                                updateOptionalService(os.id_servicio, {
                                  cantidad_default: Math.max(1, parseInt(e.target.value || '1', 10) || 1),
                                })
                              }
                              className="w-28"
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOptionalService(os.id_servicio)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Quitar servicio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateRoute}
                className="bg-green-600 hover:bg-green-700"
              >
                Crear Ruta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Route Modal */}
      {canEditRoute && (
        <Dialog
          open={isEditModalOpen}
          onOpenChange={(open: boolean) => {
            setIsEditModalOpen(open);
            if (!open) {
              setSelectedRoute(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-blue-700">
                <Edit className="w-5 h-5" />
                <span>Editar Ruta</span>
              </DialogTitle>
              <DialogDescription>
                Modifique la información de la ruta seleccionada.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-nombre">Nombre de la Ruta *</Label>
                <Input
                  id="edit-nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Valle del Cocora"
                />
              </div>

              <div>
                <Label htmlFor="edit-descripcion">Descripción</Label>
                <Textarea
                  id="edit-descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción detallada de la ruta..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-duracion_dias">Duración (días)</Label>
                  <Input
                    id="edit-duracion_dias"
                    type="number"
                    value={formData.duracion_dias}
                    onChange={(e) => setFormData({ ...formData, duracion_dias: e.target.value })}
                    placeholder="Ej: 5"
                    min="1"
                    step="1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-precio_base">Precio Base (COP)</Label>
                  <Input
                    id="edit-precio_base"
                    type="number"
                    value={formData.precio_base}
                    onChange={(e) => setFormData({ ...formData, precio_base: e.target.value })}
                    placeholder="Ej: 250000"
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-dificultad">Dificultad</Label>
                  <Select
                    value={formData.dificultad}
                    onValueChange={(value: string) => setFormData({ ...formData, dificultad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fácil">Fácil</SelectItem>
                      <SelectItem value="Moderado">Moderado</SelectItem>
                      <SelectItem value="Difícil">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-imagen_url">URL de Imagen</Label>
                <Input
                  id="edit-imagen_url"
                  value={formData.imagen_url}
                  onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <Label>Servicios predefinidos (opcional)</Label>
                  <p className="text-sm text-gray-500">Edita los servicios que quedarán por defecto en esta ruta.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <Select value={serviceToAdd} onValueChange={setServiceToAdd}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {services
                          .filter(
                            (s) =>
                              !predefinedServices.some((ps) => ps.id_servicio === s.id) &&
                              !optionalServices.some((os) => os.id_servicio === s.id)
                          )
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPredefinedService}
                    disabled={!serviceToAdd}
                  >
                    Agregar
                  </Button>
                </div>

                {predefinedServices.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay servicios predefinidos.</p>
                ) : (
                  <div className="space-y-2">
                    {predefinedServices.map((ps) => {
                      const svc = services.find((s) => s.id === ps.id_servicio);
                      const isRequired = requiredServiceIds.ids.includes(ps.id_servicio);
                      return (
                        <div
                          key={ps.id_servicio}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg bg-gray-50"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{svc?.name || `Servicio #${ps.id_servicio}`}</p>
                            <p className="text-xs text-gray-500">ID: {ps.id_servicio}</p>
                            {isRequired && (
                              <p className="text-xs text-green-700 mt-1">Obligatorio (siempre incluido)</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-gray-600">Cantidad</Label>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={ps.cantidad_default}
                              disabled={isRequired}
                              onChange={(e) =>
                                updatePredefinedService(ps.id_servicio, {
                                  cantidad_default: Math.max(1, parseInt(e.target.value || '1', 10) || 1),
                                })
                              }
                              className="w-24"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={ps.requerido}
                              disabled={isRequired}
                              onCheckedChange={(checked: boolean | 'indeterminate') =>
                                updatePredefinedService(ps.id_servicio, {
                                  requerido: checked === true,
                                })
                              }
                            />
                            <span className="text-sm text-gray-700">Requerido</span>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePredefinedService(ps.id_servicio)}
                            disabled={isRequired}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Quitar servicio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <Label>Servicios opcionales por ruta (opcional)</Label>
                  <p className="text-sm text-gray-500">Se ofrecerán para seleccionar al reservar esta ruta.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <Select value={optionalServiceToAdd} onValueChange={setOptionalServiceToAdd}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {services
                          .filter(
                            (s) =>
                              !predefinedServices.some((ps) => ps.id_servicio === s.id) &&
                              !optionalServices.some((os) => os.id_servicio === s.id) &&
                              !requiredServiceIds.ids.includes(s.id)
                          )
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOptionalService}
                    disabled={!optionalServiceToAdd}
                  >
                    Agregar
                  </Button>
                </div>

                {optionalServices.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay servicios opcionales.</p>
                ) : (
                  <div className="space-y-2">
                    {optionalServices.map((os) => {
                      const svc = services.find((s) => s.id === os.id_servicio);
                      return (
                        <div
                          key={os.id_servicio}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg bg-gray-50"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{svc?.name || `Servicio #${os.id_servicio}`}</p>
                            <p className="text-xs text-gray-500">ID: {os.id_servicio}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-gray-600">Cantidad sugerida</Label>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={os.cantidad_default}
                              onChange={(e) =>
                                updateOptionalService(os.id_servicio, {
                                  cantidad_default: Math.max(1, parseInt(e.target.value || '1', 10) || 1),
                                })
                              }
                              className="w-28"
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOptionalService(os.id_servicio)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Quitar servicio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedRoute(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateRoute}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-green-600" />
              <span>Detalles de la Ruta</span>
            </DialogTitle>
            <DialogDescription>
              Información completa de la ruta turística seleccionada.
            </DialogDescription>
          </DialogHeader>
          {selectedRoute && (
            <div className="space-y-6 py-4">
              {/* Image */}
              {selectedRoute.imagen_url && (
                <div className="w-full h-64 rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={selectedRoute.imagen_url}
                    alt={selectedRoute.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedRoute.nombre}</h3>
                  <p className="text-sm text-gray-500">ID: {selectedRoute.id_ruta}</p>
                </div>
                {selectedRoute.dificultad && getDifficultyBadge(selectedRoute.dificultad)}
              </div>

              <Separator />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {selectedRoute.duracion_dias && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <Label className="text-gray-600">Duración</Label>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedRoute.duracion_dias} {selectedRoute.duracion_dias === 1 ? 'día' : 'días'}
                    </p>
                  </div>
                )}

                {selectedRoute.precio_base && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <Label className="text-gray-600">Precio Base</Label>
                    </div>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(selectedRoute.precio_base)}</p>
                  </div>
                )}

                {selectedRoute.dificultad && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <Label className="text-gray-600">Dificultad</Label>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{selectedRoute.dificultad}</p>
                  </div>
                )}

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-orange-600" />
                    <Label className="text-gray-600">Estado</Label>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedRoute.estado ? 'Activa' : 'Inactiva'}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedRoute.descripcion && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-gray-600 mb-2 block font-semibold">Descripción</Label>
                    <p className="text-gray-900 bg-gray-50 p-4 rounded-lg leading-relaxed">
                      {selectedRoute.descripcion}
                    </p>
                  </div>
                </>
              )}

              {Array.isArray(selectedRoute.servicios_predefinidos) && selectedRoute.servicios_predefinidos.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-gray-600 mb-2 block font-semibold">Servicios predefinidos</Label>
                    <div className="space-y-2">
                      {selectedRoute.servicios_predefinidos.map((sp) => (
                        <div
                          key={String(sp.id_ruta_servicio_predefinido ?? sp.id_servicio)}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-50 p-3 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{sp.servicio?.nombre ?? `Servicio #${sp.id_servicio}`}</p>
                            <p className="text-xs text-gray-500">ID servicio: {sp.id_servicio}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              Cantidad: {sp.cantidad_default}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={sp.requerido ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                            >
                              {sp.requerido ? 'Requerido' : 'Opcional'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {Array.isArray(selectedRoute.servicios_opcionales) && selectedRoute.servicios_opcionales.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-gray-600 mb-2 block font-semibold">Servicios opcionales</Label>
                    <div className="space-y-2">
                      {selectedRoute.servicios_opcionales.map((so) => (
                        <div
                          key={String(so.id_ruta_servicio_opcional ?? so.id_servicio)}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-50 p-3 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{so.servicio?.nombre ?? `Servicio #${so.id_servicio}`}</p>
                            <p className="text-xs text-gray-500">ID servicio: {so.id_servicio}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              Cantidad sugerida: {so.cantidad_default}
                            </Badge>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                              Opcional
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Meta Info */}
              {selectedRoute.fecha_creacion && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <span>Fecha de creación:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {new Date(selectedRoute.fecha_creacion).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewModalOpen(false);
                setSelectedRoute(null);
              }}
            >
              Cerrar
            </Button>
            {canEditRoute && selectedRoute && (
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEdit(selectedRoute);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Ruta
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {canDeleteRoute && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-2 text-red-700">
                <Trash2 className="w-5 h-5" />
                <span>¿Eliminar esta ruta?</span>
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Está a punto de eliminar la ruta <span className="font-semibold">{selectedRoute?.nombre}</span>.
                </p>
                <p className="text-red-600">
                  Esta acción es <strong>permanente</strong> y no se puede deshacer.
                </p>
                <p>
                  Todos los datos asociados a esta ruta serán eliminados del sistema.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Sí, Eliminar Ruta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}