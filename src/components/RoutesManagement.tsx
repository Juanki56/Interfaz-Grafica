import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Route as RouteIcon,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Clock,
  TrendingUp,
  Users,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  FileText,
  DollarSign
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
import { toast } from 'sonner@2.0.3';
import { mockRoutes } from '../utils/adminMockData';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Route {
  id: string;
  name: string;
  location: string;
  duration: string;
  difficulty: string;
  price?: number; // Made optional to handle undefined values
  description: string;
  image?: string;
  capacity?: number;
  guide?: string;
  status?: string; // Added for active/inactive state
}

interface RoutesManagementProps {
  userRole?: 'admin' | 'advisor';
}

export function RoutesManagement({ userRole = 'admin' }: RoutesManagementProps) {
  // Initialize routes with default status
  const [routes, setRoutes] = useState<Route[]>(
    mockRoutes.map(route => ({
      ...route,
      status: route.status || 'Activa'
    })) as Route[]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    duration: '',
    difficulty: 'Moderado',
    price: '',
    description: '',
    capacity: '',
    guide: '',
    image: ''
  });

  // Filter routes
  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.difficulty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);
  const currentRoutes = filteredRoutes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      'Fácil': 'bg-green-100 text-green-700 border-green-200',
      'Moderado': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Difícil': 'bg-red-100 text-red-700 border-red-200'
    };
    return <Badge className={colors[difficulty] || 'bg-gray-100 text-gray-700'}>{difficulty}</Badge>;
  };

  const formatCurrency = (amount: number) => {
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
    setSelectedRoute(route);
    setFormData({
      name: route.name || '',
      location: route.location || '',
      duration: route.duration || '',
      difficulty: route.difficulty || 'Moderado',
      price: route.price ? route.price.toString() : '',
      description: route.description || '',
      capacity: route.capacity?.toString() || '',
      guide: route.guide || '',
      image: route.image || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (route: Route) => {
    setSelectedRoute(route);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedRoute) {
      setRoutes(routes.filter(r => r.id !== selectedRoute.id));
      toast.success('Ruta eliminada correctamente');
      setIsDeleteDialogOpen(false);
      setSelectedRoute(null);
    }
  };

  const handleCreateRoute = () => {
    if (!formData.name.trim() || !formData.location.trim() || !formData.price) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error('El precio debe ser un número válido mayor a 0');
      return;
    }

    const newRoute: Route = {
      id: (Math.max(...routes.map(r => parseInt(r.id)), 0) + 1).toString(),
      name: formData.name,
      location: formData.location,
      duration: formData.duration,
      difficulty: formData.difficulty,
      price: price,
      description: formData.description,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      guide: formData.guide || undefined,
      image: formData.image || undefined
    };

    setRoutes([newRoute, ...routes]);
    toast.success('Ruta creada correctamente');
    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleUpdateRoute = () => {
    if (!selectedRoute) return;

    if (!formData.name.trim() || !formData.location.trim() || !formData.price) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error('El precio debe ser un número válido mayor a 0');
      return;
    }

    const updatedRoutes = routes.map(r =>
      r.id === selectedRoute.id
        ? {
            ...r,
            name: formData.name,
            location: formData.location,
            duration: formData.duration,
            difficulty: formData.difficulty,
            price: price,
            description: formData.description,
            capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
            guide: formData.guide || undefined,
            image: formData.image || undefined
          }
        : r
    );

    setRoutes(updatedRoutes);
    toast.success('Ruta actualizada correctamente');
    setIsEditModalOpen(false);
    setSelectedRoute(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      duration: '',
      difficulty: 'Moderado',
      price: '',
      description: '',
      capacity: '',
      guide: '',
      image: ''
    });
  };

  // Toggle route status (Admin only)
  const handleToggleStatus = (route: Route) => {
    const newStatus = route.status === 'Activa' ? 'Inactiva' : 'Activa';
    const updatedRoutes = routes.map(r =>
      r.id === route.id ? { ...r, status: newStatus } : r
    );
    setRoutes(updatedRoutes);
    toast.success(`Estado cambiado a ${newStatus}`);
  };

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
          {userRole === 'admin' && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
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
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Ubicación</TableHead>
                    <TableHead className="font-semibold">Duración</TableHead>
                    <TableHead className="font-semibold">Dificultad</TableHead>
                    <TableHead className="font-semibold">Precio</TableHead>
                    {userRole === 'admin' && (
                      <TableHead className="text-center font-semibold">Estado</TableHead>
                    )}
                    <TableHead className="text-right font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRoutes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={userRole === 'admin' ? 6 : 6} className="text-center py-12">
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
                        key={route.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className="hover:bg-green-50/50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {route.image && (
                              <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                <ImageWithFallback
                                  src={route.image}
                                  alt={route.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{route.name}</p>
                              <p className="text-xs text-gray-500">ID: {route.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 text-gray-700">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span>{route.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 text-gray-700">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span>{route.duration}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getDifficultyBadge(route.difficulty)}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          {formatCurrency(route.price || 0)}
                        </TableCell>
                        {userRole === 'admin' && (
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Switch
                                checked={route.status === 'Activa'}
                                onCheckedChange={() => handleToggleStatus(route)}
                                className="data-[state=checked]:bg-green-600"
                              />
                              <span className="text-sm text-gray-700">
                                {route.status === 'Activa' ? 'Activa' : 'Inactiva'}
                              </span>
                            </div>
                          </TableCell>
                        )}
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
                            {userRole === 'admin' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(route)}
                                  title="Editar ruta"
                                >
                                  <Edit className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(route)}
                                  title="Eliminar ruta"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
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

      {/* Create Route Modal - Solo para Admin */}
      {userRole === 'admin' && (
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre de la Ruta *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Valle del Cocora"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Ubicación *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ej: Salento, Quindío"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration">Duración</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="Ej: 4 horas"
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Dificultad *</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
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
                <div>
                  <Label htmlFor="price">Precio *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Capacidad (personas)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="Ej: 15"
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="guide">Guía Asignado</Label>
                  <Input
                    id="guide"
                    value={formData.guide}
                    onChange={(e) => setFormData({ ...formData, guide: e.target.value })}
                    placeholder="Nombre del guía"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="image">URL de Imagen</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción detallada de la ruta..."
                  rows={4}
                />
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

      {/* Edit Route Modal - Solo para Admin */}
      {userRole === 'admin' && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Nombre de la Ruta *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Valle del Cocora"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-location">Ubicación *</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ej: Salento, Quindío"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-duration">Duración</Label>
                  <Input
                    id="edit-duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="Ej: 4 horas"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-difficulty">Dificultad *</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
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
                <div>
                  <Label htmlFor="edit-price">Precio *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-capacity">Capacidad (personas)</Label>
                  <Input
                    id="edit-capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="Ej: 15"
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-guide">Guía Asignado</Label>
                  <Input
                    id="edit-guide"
                    value={formData.guide}
                    onChange={(e) => setFormData({ ...formData, guide: e.target.value })}
                    placeholder="Nombre del guía"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-image">URL de Imagen</Label>
                <Input
                  id="edit-image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción detallada de la ruta..."
                  rows={4}
                />
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
              {selectedRoute.image && (
                <div className="w-full h-64 rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={selectedRoute.image}
                    alt={selectedRoute.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl text-gray-900 mb-1">{selectedRoute.name}</h3>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span>{selectedRoute.location}</span>
                  </div>
                </div>
                {getDifficultyBadge(selectedRoute.difficulty)}
              </div>

              <Separator />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <Label className="text-gray-600">Duración</Label>
                  </div>
                  <p className="text-lg text-gray-900">{selectedRoute.duration}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <Label className="text-gray-600">Precio</Label>
                  </div>
                  <p className="text-xl text-green-600">{formatCurrency(selectedRoute.price || 0)}</p>
                </div>

                {selectedRoute.capacity && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <Label className="text-gray-600">Capacidad</Label>
                    </div>
                    <p className="text-lg text-gray-900">{selectedRoute.capacity} personas</p>
                  </div>
                )}

                {selectedRoute.guide && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="w-5 h-5 text-orange-600" />
                      <Label className="text-gray-600">Guía Asignado</Label>
                    </div>
                    <p className="text-lg text-gray-900">{selectedRoute.guide}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedRoute.description && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-gray-600 mb-2 block">Descripción</Label>
                    <p className="text-gray-900 bg-gray-50 p-4 rounded-lg leading-relaxed">
                      {selectedRoute.description}
                    </p>
                  </div>
                </>
              )}

              {/* Meta Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">ID de Ruta:</span>
                    <span className="ml-2 font-mono font-semibold text-gray-900">{selectedRoute.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Nivel:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedRoute.difficulty}</span>
                  </div>
                </div>
              </div>
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
            {userRole === 'admin' && selectedRoute && (
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

      {/* Delete Confirmation Dialog - Solo para Admin */}
      {userRole === 'admin' && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-2 text-red-700">
                <Trash2 className="w-5 h-5" />
                <span>¿Eliminar esta ruta?</span>
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Está a punto de eliminar la ruta <span className="font-semibold">{selectedRoute?.name}</span>.
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