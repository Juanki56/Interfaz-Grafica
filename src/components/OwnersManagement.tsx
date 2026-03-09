import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  IdCard,
  User
} from 'lucide-react';
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
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { toast } from 'sonner';
import { Switch } from './ui/switch';
import { propietariosAPI, Propietario } from '../services/api';

interface OwnersManagementProps {

  isReadOnly?: boolean;
}

export function OwnersManagement({ isReadOnly = false }: OwnersManagementProps) {
  const [owners, setOwners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    tipo_documento: 'CC',
    numero_documento: '',
    telefono: '',
    email: '',
    direccion: ''
  });

  // Cargar propietarios desde la BD
  useEffect(() => {
    loadPropietarios();
  }, []);

  const loadPropietarios = async () => {
    try {
      setIsLoading(true);
      const propietariosFromDB = await propietariosAPI.getAll();
      
      // Mapear propietarios de BD al formato del frontend
      const mappedOwners = propietariosFromDB.map(prop => ({
        id: prop.id_propietario.toString(),
        fullName: `${prop.nombre} ${prop.apellido || ''}`.trim(),
        documentType: prop.tipo_documento || 'CC',
        documentNumber: prop.numero_documento || '',
        phone: prop.telefono || '',
        email: prop.email || '',
        address: prop.direccion || '',
        isActive: prop.estado !== false,
        registrationDate: prop.fecha_registro ? new Date(prop.fecha_registro).toISOString().split('T')[0] : '',
        // Guardar datos originales para edición
        _original: prop
      }));
      
      setOwners(mappedOwners);
      console.log('✅ Propietarios cargados desde BD:', mappedOwners);
    } catch (error) {
      console.error('❌ Error cargando propietarios:', error);
      toast.error('Error al cargar propietarios');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar propietarios
  const filteredOwners = owners.filter(owner => {
    const searchLower = searchTerm.toLowerCase();
    return owner.fullName.toLowerCase().includes(searchLower) ||
           owner.documentNumber.includes(searchLower) ||
           owner.email.toLowerCase().includes(searchLower);
  });

  // Paginación
  const paginatedOwners = filteredOwners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredOwners.length / itemsPerPage);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Crear propietario
  const handleCreateOwner = async () => {
    if (!formData.nombre || !formData.telefono) {
      toast.error('Por favor complete los campos requeridos: Nombre y Teléfono');
      return;
    }
    
    try {
      const propietarioData = {
        nombre: formData.nombre,
        apellido: formData.apellido || undefined,
        tipo_documento: formData.tipo_documento || undefined,
        numero_documento: formData.numero_documento || undefined,
        telefono: formData.telefono,
        email: formData.email || undefined,
        direccion: formData.direccion || undefined
      };
      
      console.log('📤 Creando propietario:', propietarioData);
      await propietariosAPI.create(propietarioData);
      
      toast.success('Propietario registrado exitosamente');
      setIsCreateModalOpen(false);
      resetForm();
      await loadPropietarios();
    } catch (error: any) {
      console.error('❌ Error creando propietario:', error);
      toast.error(error.message || 'Error al crear propietario');
    }
  };

  // Editar propietario
  const handleEditOwner = (owner: any) => {
    setSelectedOwner(owner);
    const original = owner._original;
    setFormData({
      nombre: original.nombre,
      apellido: original.apellido || '',
      tipo_documento: original.tipo_documento || 'CC',
      numero_documento: original.numero_documento || '',
      telefono: original.telefono || '',
      email: original.email || '',
      direccion: original.direccion || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateOwner = async () => {
    if (!formData.nombre || !formData.telefono) {
      toast.error('Por favor complete los campos requeridos: Nombre y Teléfono');
      return;
    }
    
    try {
      const propietarioData = {
        nombre: formData.nombre,
        apellido: formData.apellido || undefined,
        tipo_documento: formData.tipo_documento || undefined,
        numero_documento: formData.numero_documento || undefined,
        telefono: formData.telefono,
        email: formData.email || undefined,
        direccion: formData.direccion || undefined
      };
      
      console.log('📤 Actualizando propietario:', propietarioData);
      await propietariosAPI.update(parseInt(selectedOwner.id), propietarioData);
      
      toast.success('Propietario actualizado exitosamente');
      setIsEditModalOpen(false);
      setSelectedOwner(null);
      resetForm();
      await loadPropietarios();
    } catch (error: any) {
      console.error('❌ Error actualizando propietario:', error);
      toast.error(error.message || 'Error al actualizar propietario');
    }
  };

  // Eliminar propietario
  const handleDeleteOwner = (owner: any) => {
    setSelectedOwner(owner);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteOwner = async () => {
    try {
      console.log('🗑️ Eliminando propietario:', selectedOwner.id);
      await propietariosAPI.delete(parseInt(selectedOwner.id));
      
      toast.success('Propietario eliminado exitosamente');
      setIsDeleteModalOpen(false);
      setSelectedOwner(null);
      await loadPropietarios();
    } catch (error: any) {
      console.error('❌ Error eliminando propietario:', error);
      toast.error(error.message || 'Error al eliminar propietario');
    }
  };

  // Ver detalles
  const handleViewOwner = (owner: any) => {
    setSelectedOwner(owner);
    setIsViewModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      tipo_documento: 'CC',
      numero_documento: '',
      telefono: '',
      email: '',
      direccion: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-green-800">Gestión de Propietarios</h2>
          <p className="text-gray-600">
            {isReadOnly 
              ? 'Consulta la información de los propietarios registrados'
              : 'Administra los propietarios de fincas y establecimientos turísticos'
            }
          </p>
        </div>
        {!isReadOnly && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Propietario
          </Button>
        )}
      </motion.div>

      {/* Búsqueda */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Buscar Propietario</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre, documento o correo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de Propietarios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-green-800">
              Propietarios ({filteredOwners.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">ID</TableHead>
                  <TableHead className="w-[200px]">Nombre Completo</TableHead>
                  <TableHead className="w-[150px]">Documento</TableHead>
                  <TableHead className="w-[140px]">Teléfono</TableHead>
                  <TableHead className="w-[200px]">Email</TableHead>
                  <TableHead className="w-[180px]">Dirección</TableHead>
                  <TableHead className="w-[100px]">Estado</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOwners.map((owner) => (
                  <TableRow key={owner.id}>
                    <TableCell className="font-medium">#{owner.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{owner.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Badge variant="outline" className="text-xs">
                          {owner.documentType}
                        </Badge>
                        <span className="text-sm">{owner.documentNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{owner.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span>{owner.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {owner.address}
                    </TableCell>
                    <TableCell>
                      {!isReadOnly && (
                        <Switch
                          checked={owner.isActive}
                          onCheckedChange={(checked) => {
                            setOwners(owners.map(o => 
                              o.id === owner.id ? { ...o, isActive: checked } : o
                            ));
                            toast.success(checked ? 'Propietario activado' : 'Propietario desactivado');
                          }}
                          className="data-[state=checked]:bg-green-600"
                        />
                      )}
                      {isReadOnly && (
                        <Badge 
                          variant={owner.isActive ? 'default' : 'secondary'}
                          className={owner.isActive ? 'bg-green-500' : 'bg-gray-400'}
                        >
                          {owner.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewOwner(owner)}
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!isReadOnly && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditOwner(owner)}
                              className="border-blue-600 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteOwner(owner)}
                              className="border-red-600 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginación */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-between mt-6 px-4"
              >
                <div className="text-sm text-gray-600">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredOwners.length)} de {filteredOwners.length} registros
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="border-green-300 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
                          className={currentPage === pageNumber 
                            ? "bg-green-600 hover:bg-green-700" 
                            : "border-green-300 hover:bg-green-50"
                          }
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="border-green-300 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal Crear Propietario */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Crear Propietario</DialogTitle>
            <DialogDescription>
              Complete el formulario para registrar un nuevo propietario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  placeholder="Juan"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  placeholder="Pérez García"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tipo_documento">Tipo de Documento</Label>
                <select
                  id="tipo_documento"
                  value={formData.tipo_documento}
                  onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="NIT">NIT</option>
                  <option value="PAS">Pasaporte</option>
                </select>
              </div>
              <div>
                <Label htmlFor="numero_documento">Número de Documento</Label>
                <Input
                  id="numero_documento"
                  placeholder="1234567890"
                  value={formData.numero_documento}
                  onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  placeholder="+57 300 000 0000"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  placeholder="Calle 10 #20-30, Ciudad"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
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
                onClick={handleCreateOwner}
                className="bg-green-600 hover:bg-green-700"
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Propietario */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Editar Propietario</DialogTitle>
            <DialogDescription>
              Actualice la información del propietario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  placeholder="Juan"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  placeholder="Pérez García"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tipo_documento">Tipo de Documento</Label>
                <select
                  id="tipo_documento"
                  value={formData.tipo_documento}
                  onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="NIT">NIT</option>
                  <option value="PAS">Pasaporte</option>
                </select>
              </div>
              <div>
                <Label htmlFor="numero_documento">Número de Documento</Label>
                <Input
                  id="numero_documento"
                  placeholder="1234567890"
                  value={formData.numero_documento}
                  onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  placeholder="+57 300 000 0000"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  placeholder="Calle 10 #20-30, Ciudad"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedOwner(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateOwner}
                className="bg-green-600 hover:bg-green-700"
              >
                Actualizar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar Propietario */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-800">Eliminar Propietario</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar este propietario?
            </DialogDescription>
          </DialogHeader>
          {selectedOwner && (
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900">{selectedOwner.fullName}</p>
                <p className="text-sm text-gray-600">{selectedOwner.documentType}: {selectedOwner.documentNumber}</p>
                <p className="text-sm text-gray-600">{selectedOwner.email}</p>
              </div>
              <p className="text-sm text-gray-600">
                Esta acción no se puede deshacer. Toda la información asociada a este propietario será eliminada.
              </p>
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedOwner(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmDeleteOwner}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Sí, eliminar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalles */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Detalles del Propietario</DialogTitle>
            <DialogDescription>
              Información completa del propietario (Solo lectura)
            </DialogDescription>
          </DialogHeader>
          {selectedOwner && (
            <div className="space-y-6">
              {/* Información Personal */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Información Personal
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre Completo</p>
                    <p className="font-medium">{selectedOwner.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tipo de Documento</p>
                    <Badge variant="outline">{selectedOwner.documentType}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Número de Documento</p>
                    <p className="font-medium">{selectedOwner.documentNumber}</p>
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Información de Contacto
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium">{selectedOwner.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Correo Electrónico</p>
                    <p className="font-medium">{selectedOwner.email}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Dirección</p>
                    <p className="font-medium">{selectedOwner.address}</p>
                  </div>
                </div>
              </div>

              {/* Estado y Registro */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-green-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Estado</p>
                      <Badge 
                        variant={selectedOwner.isActive ? 'default' : 'secondary'}
                        className={`text-lg py-1 px-4 ${selectedOwner.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                      >
                        {selectedOwner.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-blue-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Fecha de Registro</p>
                      <p className="font-medium text-lg">{selectedOwner.registrationDate}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Observaciones */}
              {selectedOwner.observations && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Observaciones</h4>
                  <p className="text-gray-600 bg-yellow-50 p-3 rounded-lg">{selectedOwner.observations}</p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  onClick={() => setIsViewModalOpen(false)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}