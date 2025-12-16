import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Settings,
  Tag,
  CheckCircle,
  DollarSign,
  Clock,
  Users,
  Star,
  Phone,
  ChevronLeft,
  ChevronRight
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
  TableRow 
} from './ui/table';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { ViewDetailsModal } from './ViewDetailsModal';
import { useServices } from '../hooks/useServices';
import { toast } from 'sonner';

import { Service } from '../hooks/useServices';

const serviceCategories = [
  { value: 'guia', label: 'Guía' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'experiencia', label: 'Experiencia' },
  { value: 'alojamiento', label: 'Alojamiento' },
  { value: 'equipo', label: 'Equipo' },
  { value: 'alimentacion', label: 'Alimentación' },
  { value: 'otros', label: 'Otros' }
];

export function ServiceManagement() {
  const { services, addService, updateService, deleteService } = useServices();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteData, setDeleteData] = useState<{item: any, type: string, onConfirm: () => void} | null>(null);

  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    duration: '',
    capacity: '',
    includes: '',
    requirements: '',
    contactNumber: ''
  });

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      price: '',
      duration: '',
      capacity: '',
      includes: '',
      requirements: '',
      contactNumber: ''
    });
  };

  const handleCreateService = () => {
    if (!formData.name || !formData.category || !formData.price) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    const serviceData = {
      name: formData.name,
      category: formData.category,
      description: formData.description,
      price: parseFloat(formData.price),
      duration: formData.duration,
      capacity: parseInt(formData.capacity) || 1,
      status: 'active' as const,
      includes: formData.includes.split(',').map(item => item.trim()).filter(item => item),
      requirements: formData.requirements,
      rating: 0,
      contactNumber: formData.contactNumber
    };

    addService(serviceData);
    setShowCreateDialog(false);
    resetForm();
    toast.success('Servicio creado exitosamente');
  };

  const handleEditService = () => {
    if (!editingService || !formData.name || !formData.category || !formData.price) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    const updatedServiceData = {
      name: formData.name,
      category: formData.category,
      description: formData.description,
      price: parseFloat(formData.price),
      duration: formData.duration,
      capacity: parseInt(formData.capacity) || 1,
      includes: formData.includes.split(',').map(item => item.trim()).filter(item => item),
      requirements: formData.requirements,
      contactNumber: formData.contactNumber
    };

    updateService(editingService.id, updatedServiceData);
    setShowEditDialog(false);
    setEditingService(null);
    resetForm();
    toast.success('Servicio actualizado exitosamente');
  };

  const handleDeleteService = (service: Service) => {
    setDeleteData({
      item: service,
      type: 'servicio',
      onConfirm: () => {
        deleteService(service.id);
        toast.success('Servicio eliminado exitosamente');
      }
    });
    setShowDeleteModal(true);
  };

  const handleViewService = (service: Service) => {
    setSelectedService(service);
    setShowViewModal(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration,
      capacity: service.capacity.toString(),
      includes: service.includes.join(', '),
      requirements: service.requirements,
      contactNumber: service.contactNumber
    });
    setShowEditDialog(true);
  };

  const getCategoryLabel = (category: string) => {
    const cat = serviceCategories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      guia: 'bg-blue-100 text-blue-800',
      transporte: 'bg-green-100 text-green-800',
      experiencia: 'bg-purple-100 text-purple-800',
      alojamiento: 'bg-orange-100 text-orange-800',
      equipo: 'bg-gray-100 text-gray-800',
      alimentacion: 'bg-yellow-100 text-yellow-800',
      otros: 'bg-pink-100 text-pink-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const ServiceDialog = ({ isEdit = false }) => (
    <Dialog open={isEdit ? showEditDialog : showCreateDialog} onOpenChange={isEdit ? setShowEditDialog : setShowCreateDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Modifica los datos del servicio' : 'Completa la información del nuevo servicio'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Servicio *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Guía especializado en aves"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {serviceCategories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price">Precio *</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Duración</Label>
            <Input
              id="duration"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              placeholder="Ej: 4 horas, Día completo"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacidad</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              placeholder="1"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Número de Contacto</Label>
            <Input
              id="contactNumber"
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
              placeholder="+57 300 123 4567"
            />
          </div>
          
          <div className="space-y-2 col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe el servicio..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2 col-span-2">
            <Label htmlFor="includes">Incluye (separado por comas)</Label>
            <Textarea
              id="includes"
              value={formData.includes}
              onChange={(e) => setFormData(prev => ({ ...prev, includes: e.target.value }))}
              placeholder="Ej: Guía certificado, Equipo, Material educativo"
              rows={2}
            />
          </div>
          
          <div className="space-y-2 col-span-2">
            <Label htmlFor="requirements">Requisitos</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
              placeholder="Especifica los requisitos para este servicio"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            if (isEdit) {
              setShowEditDialog(false);
              setEditingService(null);
            } else {
              setShowCreateDialog(false);
            }
            resetForm();
          }}>
            Cancelar
          </Button>
          <Button onClick={isEdit ? handleEditService : handleCreateService}>
            {isEdit ? 'Actualizar' : 'Crear'} Servicio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Gestión de Servicios</h2>
          <p className="text-gray-600">Administra los servicios disponibles para tours, rutas y paquetes</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Servicios</p>
                <p className="text-xl font-semibold">{services.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Activos</p>
                <p className="text-xl font-semibold">{services.filter(s => s.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Precio Promedio</p>
                <p className="text-xl font-semibold">
                  {services.length > 0 ? 
                    `$${Math.round(services.reduce((acc, s) => acc + s.price, 0) / services.length).toLocaleString()}` : 
                    '$0'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Rating Promedio</p>
                <p className="text-xl font-semibold">
                  {services.length > 0 ? 
                    (services.reduce((acc, s) => acc + s.rating, 0) / services.length).toFixed(1) : 
                    '0.0'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {serviceCategories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios ({filteredServices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {service.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(service.category)} variant="secondary">
                        {getCategoryLabel(service.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Phone className="w-3 h-3" />
                        <span>{service.contactNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${service.price.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-gray-600">{service.duration}</TableCell>
                    <TableCell className="text-gray-600">{service.capacity}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm">{service.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={service.status === 'active'}
                          onCheckedChange={(checked) => {
                            updateService(service.id, { status: checked ? 'active' : 'inactive' });
                            toast.success('Estado actualizado exitosamente');
                          }}
                          className="data-[state=checked]:bg-green-600"
                        />
                        <span className="text-sm text-gray-700">
                          {service.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewService(service)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(service)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteService(service)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredServices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-gray-500">
                        <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No se encontraron servicios</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>
        <div className="text-sm text-gray-500">
          Página {currentPage} de {Math.ceil(filteredServices.length / itemsPerPage)}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredServices.length / itemsPerPage)))}
          disabled={currentPage === Math.ceil(filteredServices.length / itemsPerPage)}
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Dialogs */}
      <ServiceDialog isEdit={false} />
      <ServiceDialog isEdit={true} />

      {/* View Service Modal */}
      {selectedService && (
        <ViewDetailsModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          data={selectedService}
          type="service"
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteData && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={deleteData.onConfirm}
          itemName={deleteData.item.name}
          itemType={deleteData.type}
        />
      )}
    </div>
  );
}