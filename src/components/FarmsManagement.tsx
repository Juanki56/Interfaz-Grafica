import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Users,
  Home,
  DollarSign,
  User,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Star,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { fincasAPI, Finca } from '../services/api';
import { toast } from 'sonner@2.0.3';

interface FarmsManagementProps {
  canDelete?: boolean; // Admin puede eliminar, Asesor no
}

export function FarmsManagement({ canDelete = true }: FarmsManagementProps) {
  const [farms, setFarms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const itemsPerPage = 3;

  // Cargar fincas desde la API
  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      setIsLoading(true);
      const fincasFromDB = await fincasAPI.getAll();
      
      // Mapear fincas del backend al formato delFrontend
      const mappedFarms = fincasFromDB.map(finca => ({
        id: finca.id_finca.toString(),
        name: finca.nombre,
        location: finca.ubicacion,
        description: finca.descripcion,
        capacity: finca.capacidad,
        pricePerNight: finca.precio_noche,
        status: finca.estado ? 'active' : 'inactive'
      }));
      
      setFarms(mappedFarms);
      console.log('✅ Fincas cargadas desde BD:', mappedFarms);
    } catch (error) {
      console.error('❌ Error cargando fincas:', error);
      toast.error('Error al cargar las fincas');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar fincas
  const filteredFarms = farms.filter(farm => {
    const matchesSearch = farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         farm.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === 'all' || farm.location.includes(locationFilter);
    const matchesStatus = statusFilter === 'all' || farm.status === statusFilter;
    
    return matchesSearch && matchesLocation && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredFarms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFarms = filteredFarms.slice(startIndex, endIndex);

  // Cambiar página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Cambiar estado de finca
  const handleStatusChange = (farmId: string, newStatus: string) => {
    setFarms(farms.map(farm => 
      farm.id === farmId ? { ...farm, status: newStatus } : farm
    ));
  };

  // Acciones
  const handleView = (farm: any) => {
    setSelectedFarm(farm);
    setSelectedImageIndex(0);
    setIsViewModalOpen(true);
  };

  const handleEdit = (farm: any) => {
    setSelectedFarm(farm);
    setIsEditModalOpen(true);
  };

  const handleDelete = (farm: any) => {
    setFarms(farms.filter(f => f.id !== farm.id));
  };

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  // Obtener badge de estado
  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      active: { label: 'Activa', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      inactive: { label: 'Inactiva', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
      maintenance: { label: 'Mantenimiento', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
      available: { label: 'Disponible', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Formulario de crear/editar
  const FarmForm = ({ farm, onClose, isEdit }: { farm?: any; onClose: () => void; isEdit?: boolean }) => {
    const [formData, setFormData] = useState(farm || {
      name: '',
      location: '',
      area: '',
      capacity: '',
      pricePerNight: '',
      owner: '',
      description: '',
      images: [''],
      status: 'active'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Filtrar URLs de imágenes vacías
      const filteredImages = formData.images.filter((img: string) => img.trim() !== '');
      
      if (isEdit && farm) {
        setFarms(farms.map(f => f.id === farm.id ? { ...f, ...formData, images: filteredImages } : f));
      } else {
        const newFarm = {
          ...formData,
          id: `F${String(farms.length + 1).padStart(3, '0')}`,
          rating: 4.5,
          images: filteredImages.length > 0 ? filteredImages : ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800']
        };
        setFarms([...farms, newFarm]);
      }
      
      onClose();
    };

    const addImageField = () => {
      if (formData.images.length < 10) {
        setFormData({ ...formData, images: [...formData.images, ''] });
      }
    };

    const removeImageField = (index: number) => {
      const newImages = formData.images.filter((_: string, i: number) => i !== index);
      setFormData({ ...formData, images: newImages });
    };

    const updateImageField = (index: number, value: string) => {
      const newImages = [...formData.images];
      newImages[index] = value;
      setFormData({ ...formData, images: newImages });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="name">Nombre de la Finca *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Finca El Paraíso"
              required
            />
          </div>

          <div>
            <Label htmlFor="location">Ubicación *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ej: Quindío, Colombia"
              required
            />
          </div>

          <div>
            <Label htmlFor="area">Área</Label>
            <Input
              id="area"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              placeholder="Ej: 15 hectáreas"
            />
          </div>

          <div>
            <Label htmlFor="capacity">Capacidad (personas) *</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              placeholder="Ej: 20"
              required
            />
          </div>

          <div>
            <Label htmlFor="pricePerNight">Precio por Noche *</Label>
            <Input
              id="pricePerNight"
              type="number"
              value={formData.pricePerNight}
              onChange={(e) => setFormData({ ...formData, pricePerNight: parseInt(e.target.value) })}
              placeholder="Ej: 150000"
              required
            />
          </div>

          <div>
            <Label htmlFor="owner">Propietario</Label>
            <Input
              id="owner"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              placeholder="Nombre del propietario"
            />
          </div>

          <div>
            <Label htmlFor="status">Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="inactive">Inactiva</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                <SelectItem value="available">Disponible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción detallada de la finca..."
              rows={4}
              required
            />
          </div>

          <div className="col-span-2">
            <Label>Imágenes (Mínimo 5, Máximo 10)</Label>
            <div className="space-y-2 mt-2">
              {formData.images.map((image: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={image}
                    onChange={(e) => updateImageField(index, e.target.value)}
                    placeholder={`URL de imagen ${index + 1}`}
                  />
                  {formData.images.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeImageField(index)}
                      className="text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {formData.images.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addImageField}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Imagen
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total de imágenes: {formData.images.filter((img: string) => img.trim() !== '').length}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            {isEdit ? 'Guardar Cambios' : 'Crear Finca'}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header con filtros y búsqueda */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-green-200"
      >
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-700 w-4 h-4" />
            <Input
              placeholder="Buscar fincas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-green-300 focus:border-green-500"
            />
          </div>

          {/* Filtro de ubicación */}
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full sm:w-48 border-green-300">
              <SelectValue placeholder="Ubicación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ubicaciones</SelectItem>
              <SelectItem value="Quindío">Quindío</SelectItem>
              <SelectItem value="Valle del Cauca">Valle del Cauca</SelectItem>
              <SelectItem value="Risaralda">Risaralda</SelectItem>
              <SelectItem value="Caldas">Caldas</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro de estado */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 border-green-300">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activa</SelectItem>
              <SelectItem value="inactive">Inactiva</SelectItem>
              <SelectItem value="maintenance">Mantenimiento</SelectItem>
              <SelectItem value="available">Disponible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botón de crear */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="bg-green-700 hover:bg-green-800">
              <Plus className="w-4 h-4 mr-2" />
              Crear Finca
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Finca</DialogTitle>
              <DialogDescription>
                Complete los campos para registrar una nueva finca en el sistema.
              </DialogDescription>
            </DialogHeader>
            <FarmForm onClose={() => setIsCreateModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Lista de Fincas */}
      <div className="space-y-4">
        {currentFarms.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-green-200 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-50 border-b border-green-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Fotos</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Finca</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Ubicación</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Capacidad</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Área</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Precio/Noche</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Propietario</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Rating</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-center text-xs text-gray-700 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentFarms.map((farm, index) => (
                    <motion.tr
                      key={farm.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-green-50 transition-colors"
                    >
                      {/* Fotos */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-green-100">
                          <div className="text-center">
                            <p className="text-xl text-green-700">
                              {farm.images?.length || 0}
                            </p>
                            <p className="text-[10px] text-gray-600">
                              {farm.images?.length === 1 ? 'foto' : 'fotos'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Finca */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-900">{farm.name}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{farm.description}</p>
                          </div>
                        </div>
                      </td>

                      {/* Ubicación */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <MapPin className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span>{farm.location}</span>
                        </div>
                      </td>

                      {/* Capacidad */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <Users className="w-3 h-3 text-green-600" />
                          <span>{farm.capacity}</span>
                        </div>
                      </td>

                      {/* Área */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <Maximize className="w-3 h-3 text-green-600" />
                          <span>{farm.area}</span>
                        </div>
                      </td>

                      {/* Precio */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className="text-sm text-green-700">
                            ${farm.pricePerNight?.toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Propietario */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <User className="w-3 h-3 text-green-600" />
                          <span>{farm.owner || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span>{farm.rating}</span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={farm.status === 'active'}
                            onCheckedChange={(checked) => 
                              handleStatusChange(farm.id, checked ? 'active' : 'inactive')
                            }
                            className="data-[state=checked]:bg-green-600"
                          />
                          {getStatusBadge(farm.status)}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(farm)}
                            className="border-green-300 hover:bg-green-50"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(farm)}
                            className="border-blue-300 hover:bg-blue-50"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 border-red-300">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar finca?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se eliminará permanentemente la finca "{farm.name}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(farm)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-green-200">
            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron fincas</p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 mt-6"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="border-green-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page)}
              className={
                currentPage === page
                  ? "bg-green-600 hover:bg-green-700"
                  : "border-green-300 hover:bg-green-50"
              }
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="border-green-300"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {/* Modal de Ver Detalles */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Finca</DialogTitle>
            <DialogDescription>
              Información completa de la finca seleccionada.
            </DialogDescription>
          </DialogHeader>
          {selectedFarm && (
            <div className="space-y-4">
              {/* Galería de imágenes */}
              <div className="space-y-2">
                <div className="aspect-video rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={selectedFarm.images?.[selectedImageIndex] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'}
                    alt={selectedFarm.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {selectedFarm.images?.map((image: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`aspect-square rounded overflow-hidden border-2 ${
                        selectedImageIndex === idx ? 'border-green-600' : 'border-gray-200'
                      }`}
                    >
                      <ImageWithFallback
                        src={image}
                        alt={`${selectedFarm.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Nombre</Label>
                  <p>{selectedFarm.name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Ubicación</Label>
                  <p>{selectedFarm.location}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Área</Label>
                  <p>{selectedFarm.area || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Capacidad</Label>
                  <p>{selectedFarm.capacity} personas</p>
                </div>
                <div>
                  <Label className="text-gray-500">Precio por Noche</Label>
                  <p className="text-green-600">
                    ${selectedFarm.pricePerNight?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Propietario</Label>
                  <p>{selectedFarm.owner || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedFarm.status)}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Rating</Label>
                  <p>⭐ {selectedFarm.rating || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-500">Descripción</Label>
                  <p className="text-sm mt-1">{selectedFarm.description || 'Sin descripción'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Editar */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Finca</DialogTitle>
            <DialogDescription>
              Modifique los campos que desee actualizar.
            </DialogDescription>
          </DialogHeader>
          {selectedFarm && (
            <FarmForm
              farm={selectedFarm}
              onClose={() => setIsEditModalOpen(false)}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}