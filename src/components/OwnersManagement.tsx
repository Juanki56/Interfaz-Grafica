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
import { toast } from 'sonner@2.0.3';
import { Switch } from './ui/switch';

// Mock data de propietarios
const mockOwners = [
  {
    id: '1',
    fullName: 'Juan Carlos Pérez',
    documentType: 'CC',
    documentNumber: '1234567890',
    phone: '+57 310 123 4567',
    email: 'juan.perez@email.com',
    address: 'Calle 10 #20-30, Bogotá',
    isActive: true,
    registrationDate: '2023-01-15',
    observations: 'Propietario de Finca El Paraíso, excelente colaborador'
  },
  {
    id: '2',
    fullName: 'María Fernanda López',
    documentType: 'CC',
    documentNumber: '9876543210',
    phone: '+57 320 456 7890',
    email: 'maria.lopez@email.com',
    address: 'Carrera 15 #45-20, Medellín',
    isActive: true,
    registrationDate: '2023-03-22',
    observations: 'Propietaria de Hacienda Los Robles'
  },
  {
    id: '3',
    fullName: 'Carlos Eduardo Ramírez',
    documentType: 'CE',
    documentNumber: '7654321098',
    phone: '+57 315 789 1234',
    email: 'carlos.ramirez@email.com',
    address: 'Avenida 5 #12-45, Cali',
    isActive: false,
    registrationDate: '2023-05-10',
    observations: 'Temporalmente inactivo por remodelaciones'
  },
  {
    id: '4',
    fullName: 'Ana Isabel García',
    documentType: 'CC',
    documentNumber: '5432167890',
    phone: '+57 311 234 5678',
    email: 'ana.garcia@email.com',
    address: 'Calle 20 #30-40, Cartagena',
    isActive: true,
    registrationDate: '2023-02-18',
    observations: 'Propietaria de Villa Caribeña'
  },
  {
    id: '5',
    fullName: 'Diego Alejandro Torres',
    documentType: 'CC',
    documentNumber: '3216549870',
    phone: '+57 312 345 6789',
    email: 'diego.torres@email.com',
    address: 'Carrera 8 #15-25, Pereira',
    isActive: true,
    registrationDate: '2023-04-05',
    observations: 'Propietario de Finca Cafetera Los Andes'
  },
  {
    id: '6',
    fullName: 'Laura Valentina Morales',
    documentType: 'CC',
    documentNumber: '6549873210',
    phone: '+57 313 456 7890',
    email: 'laura.morales@email.com',
    address: 'Calle 30 #40-50, Bucaramanga',
    isActive: true,
    registrationDate: '2023-06-12',
    observations: 'Propietaria de Eco Lodge El Refugio'
  },
  {
    id: '7',
    fullName: 'Roberto Antonio Silva',
    documentType: 'CE',
    documentNumber: '8520147963',
    phone: '+57 314 567 8901',
    email: 'roberto.silva@email.com',
    address: 'Avenida 10 #25-35, Santa Marta',
    isActive: false,
    registrationDate: '2023-07-20',
    observations: 'En proceso de renovación de permisos'
  },
  {
    id: '8',
    fullName: 'Patricia Elena Vargas',
    documentType: 'CC',
    documentNumber: '7410258963',
    phone: '+57 315 678 9012',
    email: 'patricia.vargas@email.com',
    address: 'Carrera 12 #18-28, Manizales',
    isActive: true,
    registrationDate: '2023-08-15',
    observations: 'Propietaria de Posada Rural La Esperanza'
  },
  {
    id: '9',
    fullName: 'Fernando José Martínez',
    documentType: 'CC',
    documentNumber: '9630258741',
    phone: '+57 316 789 0123',
    email: 'fernando.martinez@email.com',
    address: 'Calle 5 #10-20, Armenia',
    isActive: true,
    registrationDate: '2023-09-08',
    observations: 'Propietario de Finca El Recuerdo'
  },
  {
    id: '10',
    fullName: 'Claudia Marcela Hernández',
    documentType: 'CC',
    documentNumber: '1472583690',
    phone: '+57 317 890 1234',
    email: 'claudia.hernandez@email.com',
    address: 'Avenida 3 #8-15, Pasto',
    isActive: false,
    registrationDate: '2023-10-22',
    observations: 'Propietaria de Hostería La Montaña, temporalmente cerrada'
  },
  {
    id: '11',
    fullName: 'Andrés Felipe Gómez',
    documentType: 'CC',
    documentNumber: '3691472580',
    phone: '+57 318 901 2345',
    email: 'andres.gomez@email.com',
    address: 'Carrera 20 #35-45, Ibagué',
    isActive: true,
    registrationDate: '2023-11-10',
    observations: 'Propietario de Granja Turística El Edén'
  },
  {
    id: '12',
    fullName: 'Sandra Milena Rojas',
    documentType: 'CE',
    documentNumber: '2583691470',
    phone: '+57 319 012 3456',
    email: 'sandra.rojas@email.com',
    address: 'Calle 15 #22-32, Villavicencio',
    isActive: true,
    registrationDate: '2023-12-05',
    observations: 'Propietaria de Finca Los Llanos'
  }
];

interface OwnersManagementProps {
  isReadOnly?: boolean;
}

export function OwnersManagement({ isReadOnly = false }: OwnersManagementProps) {
  const [owners, setOwners] = useState(mockOwners);
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
    fullName: '',
    documentType: 'CC',
    documentNumber: '',
    phone: '',
    email: '',
    address: '',
    observations: ''
  });

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
  const handleCreateOwner = () => {
    if (!formData.fullName || !formData.documentNumber || !formData.phone || !formData.email) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }
    
    const newOwner = {
      id: (owners.length + 1).toString(),
      fullName: formData.fullName,
      documentType: formData.documentType,
      documentNumber: formData.documentNumber,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      isActive: true,
      registrationDate: new Date().toISOString().split('T')[0],
      observations: formData.observations
    };
    
    setOwners([...owners, newOwner]);
    toast.success('Propietario registrado correctamente');
    setIsCreateModalOpen(false);
    resetForm();
  };

  // Editar propietario
  const handleEditOwner = (owner: any) => {
    setSelectedOwner(owner);
    setFormData({
      fullName: owner.fullName,
      documentType: owner.documentType,
      documentNumber: owner.documentNumber,
      phone: owner.phone,
      email: owner.email,
      address: owner.address,
      observations: owner.observations
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateOwner = () => {
    if (!formData.fullName || !formData.documentNumber || !formData.phone || !formData.email) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }
    
    setOwners(owners.map(o => 
      o.id === selectedOwner.id 
        ? { ...o, ...formData }
        : o
    ));
    
    toast.success('Propietario actualizado correctamente');
    setIsEditModalOpen(false);
    setSelectedOwner(null);
    resetForm();
  };

  // Eliminar propietario
  const handleDeleteOwner = (owner: any) => {
    setSelectedOwner(owner);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteOwner = () => {
    setOwners(owners.filter(o => o.id !== selectedOwner.id));
    toast.success('Propietario eliminado correctamente');
    setIsDeleteModalOpen(false);
    setSelectedOwner(null);
  };

  // Ver detalles
  const handleViewOwner = (owner: any) => {
    setSelectedOwner(owner);
    setIsViewModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      fullName: '',
      documentType: 'CC',
      documentNumber: '',
      phone: '',
      email: '',
      address: '',
      observations: ''
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
              <div className="md:col-span-2">
                <Label htmlFor="fullName">Nombre Completo *</Label>
                <Input
                  id="fullName"
                  placeholder="Juan Pérez García"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="documentType">Tipo de Documento *</Label>
                <Select 
                  value={formData.documentType} 
                  onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="PAS">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="documentNumber">Número de Documento *</Label>
                <Input
                  id="documentNumber"
                  placeholder="1234567890"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  placeholder="+57 300 000 0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  placeholder="Calle 10 #20-30, Ciudad"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="observations">Observaciones</Label>
                <Textarea
                  id="observations"
                  placeholder="Información adicional sobre el propietario..."
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  rows={3}
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
              <div className="md:col-span-2">
                <Label htmlFor="fullName">Nombre Completo *</Label>
                <Input
                  id="fullName"
                  placeholder="Juan Pérez García"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="documentType">Tipo de Documento *</Label>
                <Select 
                  value={formData.documentType} 
                  onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="PAS">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="documentNumber">Número de Documento *</Label>
                <Input
                  id="documentNumber"
                  placeholder="1234567890"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  placeholder="+57 300 000 0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  placeholder="Calle 10 #20-30, Ciudad"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="observations">Observaciones</Label>
                <Textarea
                  id="observations"
                  placeholder="Información adicional sobre el propietario..."
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  rows={3}
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