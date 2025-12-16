import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  TrendingUp,
  Award,
  Gift,
  Heart,
  FileText,
  Download,
  Sparkles,
  ChevronLeft,
  ChevronRight
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

// Mock data de clientes
const mockClients = [
  {
    id: '1',
    name: 'María López',
    documentNumber: '52123456',
    email: 'maria.lopez@email.com',
    phone: '+57 310 123 4567',
    address: 'Calle 45 #12-30, Bogotá',
    preferences: 'Rural, Gastronómica',
    experienceType: 'rural',
    frequencyLevel: 'Alta',
    satisfactionLevel: 'Excelente',
    totalBookings: 12,
    totalSpent: 2400000,
    lastVisit: '2024-11-15',
    joinDate: '2023-05-10',
    location: 'Bogotá',
    favoriteRoutes: ['Aventura Cafetera', 'Turismo Rural'],
    notes: 'Cliente preferente, siempre solicita alimentación vegetariana',
    isActive: true
  },
  {
    id: '2',
    name: 'Carlos Mendoza',
    documentNumber: '1098765432',
    email: 'carlos.mendoza@email.com',
    phone: '+57 320 789 1234',
    address: 'Carrera 80 #50-20, Medellín',
    preferences: 'Aventura, Naturaleza',
    experienceType: 'pedagógica',
    frequencyLevel: 'Media',
    satisfactionLevel: 'Buena',
    totalBookings: 5,
    totalSpent: 800000,
    lastVisit: '2024-10-20',
    joinDate: '2024-02-15',
    location: 'Medellín',
    favoriteRoutes: ['Senderismo Natural'],
    notes: 'Interesado en rutas de dificultad moderada',
    isActive: true
  },
  {
    id: '3',
    name: 'Ana García',
    documentNumber: '39876543',
    email: 'ana.garcia@email.com',
    phone: '+57 315 456 7890',
    address: 'Avenida 5N #25-40, Cali',
    preferences: 'Gastronómica, Cultural',
    experienceType: 'gastronómica',
    frequencyLevel: 'Alta',
    satisfactionLevel: 'Excelente',
    totalBookings: 8,
    totalSpent: 1600000,
    lastVisit: '2024-11-20',
    joinDate: '2023-08-22',
    location: 'Cali',
    favoriteRoutes: ['Aventura Cafetera', 'Tour Gastronómico'],
    notes: 'Le gusta probar experiencias culinarias nuevas',
    isActive: true
  },
  {
    id: '4',
    name: 'Pedro Ramírez',
    documentNumber: '1234567890',
    email: 'pedro.ramirez@email.com',
    phone: '+57 300 111 2222',
    address: 'Calle 36 #15-28, Bucaramanga',
    preferences: 'Rural, Pedagógica',
    experienceType: 'rural',
    frequencyLevel: 'Baja',
    satisfactionLevel: 'Buena',
    totalBookings: 2,
    totalSpent: 320000,
    lastVisit: '2024-09-05',
    joinDate: '2024-06-10',
    location: 'Bucaramanga',
    favoriteRoutes: ['Turismo Rural'],
    notes: 'Cliente nuevo, potencial para programas familiares',
    isActive: false
  },
  {
    id: '5',
    name: 'Laura Martínez',
    documentNumber: '31456789',
    email: 'laura.martinez@email.com',
    phone: '+57 311 222 3333',
    address: 'Carrera 3 #8-50, Cartagena',
    preferences: 'Gastronómica, Rural',
    experienceType: 'gastronómica',
    frequencyLevel: 'Alta',
    satisfactionLevel: 'Excelente',
    totalBookings: 15,
    totalSpent: 3200000,
    lastVisit: '2024-11-22',
    joinDate: '2023-01-15',
    location: 'Cartagena',
    favoriteRoutes: ['Tour Gastronómico', 'Aventura Cafetera'],
    notes: 'Cliente VIP, siempre reserva tours premium',
    isActive: true
  },
  {
    id: '6',
    name: 'Diego Fernández',
    documentNumber: '1087654321',
    email: 'diego.fernandez@email.com',
    phone: '+57 312 333 4444',
    address: 'Calle 25 #10-15, Pereira',
    preferences: 'Aventura, Naturaleza',
    experienceType: 'pedagógica',
    frequencyLevel: 'Media',
    satisfactionLevel: 'Buena',
    totalBookings: 6,
    totalSpent: 950000,
    lastVisit: '2024-10-18',
    joinDate: '2024-03-20',
    location: 'Pereira',
    favoriteRoutes: ['Senderismo Natural', 'Aventura Extrema'],
    notes: 'Prefiere actividades al aire libre',
    isActive: true
  },
  {
    id: '7',
    name: 'Sofía Rojas',
    documentNumber: '52345678',
    email: 'sofia.rojas@email.com',
    phone: '+57 313 444 5555',
    address: 'Carrera 51B #80-100, Barranquilla',
    preferences: 'Cultural, Gastronómica',
    experienceType: 'gastronómica',
    frequencyLevel: 'Baja',
    satisfactionLevel: 'Regular',
    totalBookings: 3,
    totalSpent: 450000,
    lastVisit: '2024-08-15',
    joinDate: '2024-05-10',
    location: 'Barranquilla',
    favoriteRoutes: ['Tour Gastronómico'],
    notes: 'Interesada en cultura local',
    isActive: false
  },
  {
    id: '8',
    name: 'Javier Morales',
    documentNumber: '79123456',
    email: 'javier.morales@email.com',
    phone: '+57 314 555 6666',
    address: 'Avenida Santander #20-30, Manizales',
    preferences: 'Rural, Pedagógica',
    experienceType: 'rural',
    frequencyLevel: 'Alta',
    satisfactionLevel: 'Excelente',
    totalBookings: 10,
    totalSpent: 1850000,
    lastVisit: '2024-11-18',
    joinDate: '2023-07-08',
    location: 'Manizales',
    favoriteRoutes: ['Turismo Rural', 'Aventura Cafetera'],
    notes: 'Visita frecuente con grupos familiares',
    isActive: true
  },
  {
    id: '9',
    name: 'Valentina Castro',
    documentNumber: '1012345678',
    email: 'valentina.castro@email.com',
    phone: '+57 315 666 7777',
    address: 'Calle 22 #5-60, Santa Marta',
    preferences: 'Aventura, Gastronómica',
    experienceType: 'pedagógica',
    frequencyLevel: 'Media',
    satisfactionLevel: 'Buena',
    totalBookings: 7,
    totalSpent: 1100000,
    lastVisit: '2024-11-10',
    joinDate: '2023-11-05',
    location: 'Santa Marta',
    favoriteRoutes: ['Senderismo Natural', 'Tour Gastronómico'],
    notes: 'Le gusta combinar aventura con gastronomía',
    isActive: true
  },
  {
    id: '10',
    name: 'Andrés Silva',
    documentNumber: '5432167890',
    email: 'andres.silva@email.com',
    phone: '+57 316 777 8888',
    address: 'Carrera 26 #18-45, Pasto',
    preferences: 'Rural, Naturaleza',
    experienceType: 'rural',
    frequencyLevel: 'Baja',
    satisfactionLevel: 'Buena',
    totalBookings: 4,
    totalSpent: 620000,
    lastVisit: '2024-09-25',
    joinDate: '2024-04-12',
    location: 'Pasto',
    favoriteRoutes: ['Turismo Rural'],
    notes: 'Busca experiencias tranquilas',
    isActive: false
  },
  {
    id: '11',
    name: 'Camila Vargas',
    documentNumber: '39123789',
    email: 'camila.vargas@email.com',
    phone: '+57 317 888 9999',
    address: 'Calle 72 #10-20, Bogotá',
    preferences: 'Gastronómica, Cultural',
    experienceType: 'gastronómica',
    frequencyLevel: 'Alta',
    satisfactionLevel: 'Excelente',
    totalBookings: 13,
    totalSpent: 2750000,
    lastVisit: '2024-11-24',
    joinDate: '2023-03-18',
    location: 'Bogotá',
    favoriteRoutes: ['Tour Gastronómico', 'Aventura Cafetera'],
    notes: 'Experta en gastronomía, comparte en redes sociales',
    isActive: true
  },
  {
    id: '12',
    name: 'Ricardo Herrera',
    documentNumber: '1023456789',
    email: 'ricardo.herrera@email.com',
    phone: '+57 318 999 0000',
    address: 'Avenida Bolívar #15-30, Armenia',
    preferences: 'Aventura, Pedagógica',
    experienceType: 'pedagógica',
    frequencyLevel: 'Media',
    satisfactionLevel: 'Buena',
    totalBookings: 5,
    totalSpent: 780000,
    lastVisit: '2024-10-30',
    joinDate: '2024-02-28',
    location: 'Armenia',
    favoriteRoutes: ['Senderismo Natural', 'Aventura Extrema'],
    notes: 'Prefiere tours educativos',
    isActive: true
  },
  {
    id: '13',
    name: 'Isabella Gómez',
    documentNumber: '52987654',
    email: 'isabella.gomez@email.com',
    phone: '+57 319 000 1111',
    address: 'Calle 10 #20-35, Ibagué',
    preferences: 'Rural, Gastronómica',
    experienceType: 'rural',
    frequencyLevel: 'Baja',
    satisfactionLevel: 'Regular',
    totalBookings: 2,
    totalSpent: 380000,
    lastVisit: '2024-07-20',
    joinDate: '2024-06-05',
    location: 'Ibagué',
    favoriteRoutes: ['Turismo Rural'],
    notes: 'Primera experiencia en turismo rural',
    isActive: false
  },
  {
    id: '14',
    name: 'Miguel Ángel Torres',
    documentNumber: '16789456',
    email: 'miguel.torres@email.com',
    phone: '+57 320 111 2222',
    address: 'Carrera 100 #15-25, Cali',
    preferences: 'Aventura, Naturaleza',
    experienceType: 'pedagógica',
    frequencyLevel: 'Alta',
    satisfactionLevel: 'Excelente',
    totalBookings: 11,
    totalSpent: 2100000,
    lastVisit: '2024-11-19',
    joinDate: '2023-04-22',
    location: 'Cali',
    favoriteRoutes: ['Senderismo Natural', 'Aventura Extrema'],
    notes: 'Deportista extremo, siempre busca nuevos retos',
    isActive: true
  },
  {
    id: '15',
    name: 'Daniela Ruiz',
    documentNumber: '1045678912',
    email: 'daniela.ruiz@email.com',
    phone: '+57 321 222 3333',
    address: 'Calle 50 #70-120, Medellín',
    preferences: 'Gastronómica, Cultural',
    experienceType: 'gastronómica',
    frequencyLevel: 'Media',
    satisfactionLevel: 'Buena',
    totalBookings: 6,
    totalSpent: 980000,
    lastVisit: '2024-11-05',
    joinDate: '2023-09-14',
    location: 'Medellín',
    favoriteRoutes: ['Tour Gastronómico'],
    notes: 'Fotógrafa profesional de alimentos',
    isActive: true
  },
  {
    id: '16',
    name: 'Felipe Navarro',
    documentNumber: '3216549870',
    email: 'felipe.navarro@email.com',
    phone: '+57 322 333 4444',
    address: 'Calle 40 #28-15, Villavicencio',
    preferences: 'Rural, Pedagógica',
    experienceType: 'rural',
    frequencyLevel: 'Baja',
    satisfactionLevel: 'Buena',
    totalBookings: 3,
    totalSpent: 510000,
    lastVisit: '2024-08-28',
    joinDate: '2024-05-18',
    location: 'Villavicencio',
    favoriteRoutes: ['Turismo Rural', 'Aventura Cafetera'],
    notes: 'Viaja con su familia',
    isActive: false
  },
  {
    id: '17',
    name: 'Carolina Mendez',
    documentNumber: '52654321',
    email: 'carolina.mendez@email.com',
    phone: '+57 323 444 5555',
    address: 'Avenida González Valencia #20-10, Bucaramanga',
    preferences: 'Aventura, Gastronómica',
    experienceType: 'pedagógica',
    frequencyLevel: 'Alta',
    satisfactionLevel: 'Excelente',
    totalBookings: 14,
    totalSpent: 2900000,
    lastVisit: '2024-11-23',
    joinDate: '2023-02-10',
    location: 'Bucaramanga',
    favoriteRoutes: ['Senderismo Natural', 'Tour Gastronómico', 'Aventura Extrema'],
    notes: 'Influencer de viajes, excelente promotora',
    isActive: true
  },
  {
    id: '18',
    name: 'Sebastián Parra',
    documentNumber: '1078945612',
    email: 'sebastian.parra@email.com',
    phone: '+57 324 555 6666',
    address: 'Carrera 6 #5-30, Popayán',
    preferences: 'Rural, Naturaleza',
    experienceType: 'rural',
    frequencyLevel: 'Media',
    satisfactionLevel: 'Buena',
    totalBookings: 7,
    totalSpent: 1250000,
    lastVisit: '2024-10-15',
    joinDate: '2023-12-03',
    location: 'Popayán',
    favoriteRoutes: ['Turismo Rural'],
    notes: 'Busca desconexión y naturaleza',
    isActive: true
  }
];

export function ClientsManagement() {
  const [clients, setClients] = useState(mockClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [satisfactionFilter, setSatisfactionFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferences: '',
    location: '',
    notes: '',
    password: '',
    confirmPassword: ''
  });

  // Filtrar clientes
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.documentNumber && client.documentNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (client.address && client.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (client.location && client.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesExperience = experienceFilter === 'all' || client.experienceType === experienceFilter;
    const matchesFrequency = frequencyFilter === 'all' || client.frequencyLevel === frequencyFilter;
    const matchesSatisfaction = satisfactionFilter === 'all' || client.satisfactionLevel === satisfactionFilter;
    return matchesSearch && matchesExperience && matchesFrequency && matchesSatisfaction;
  });

  // Paginación
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, experienceFilter, frequencyFilter, satisfactionFilter]);

  // Estadísticas
  const stats = {
    totalClients: clients.length,
    highFrequency: clients.filter(c => c.frequencyLevel === 'Alta').length,
    excellentSatisfaction: clients.filter(c => c.satisfactionLevel === 'Excelente').length,
    totalRevenue: clients.reduce((sum, c) => sum + c.totalSpent, 0)
  };

  // Crear cliente
  const handleCreateClient = () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }
    
    const newClient = {
      id: (clients.length + 1).toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      preferences: formData.preferences,
      experienceType: 'rural',
      frequencyLevel: 'Baja',
      satisfactionLevel: 'Buena',
      totalBookings: 0,
      totalSpent: 0,
      lastVisit: new Date().toISOString().split('T')[0],
      joinDate: new Date().toISOString().split('T')[0],
      location: formData.location,
      favoriteRoutes: [],
      notes: formData.notes,
      isActive: true
    };
    
    setClients([...clients, newClient]);
    toast.success('Cliente registrado correctamente');
    setIsCreateModalOpen(false);
    setFormData({ name: '', email: '', phone: '', preferences: '', location: '', notes: '', password: '', confirmPassword: '' });
  };

  // Editar cliente
  const handleEditClient = (client: any) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      preferences: client.preferences,
      location: client.location,
      notes: client.notes
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateClient = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }
    
    setClients(clients.map(c => 
      c.id === selectedClient.id 
        ? { ...c, ...formData }
        : c
    ));
    
    toast.success('Cliente actualizado correctamente');
    setIsEditModalOpen(false);
    setSelectedClient(null);
    setFormData({ name: '', email: '', phone: '', preferences: '', location: '', notes: '' });
  };

  // Eliminar cliente
  const handleDeleteClient = (client: any) => {
    setSelectedClient(client);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteClient = () => {
    setClients(clients.filter(c => c.id !== selectedClient.id));
    toast.success('Cliente eliminado correctamente');
    setIsDeleteModalOpen(false);
    setSelectedClient(null);
  };

  // Cambiar estado del cliente
  const handleToggleClientStatus = (clientId: string, currentStatus: boolean) => {
    // Aquí puedes implementar la lógica de estado activo/inactivo
    toast.success(currentStatus ? 'Cliente desactivado' : 'Cliente activado');
  };

  // Ver historial
  const handleViewHistory = (client: any) => {
    setSelectedClient(client);
    setIsHistoryModalOpen(true);
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
          <h2 className="text-green-800">Gestión de Clientes</h2>
          <p className="text-gray-600">Administra tu base de clientes</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </motion.div>

      {/* Filtros y Búsqueda */}
      <Card className="border-green-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Buscar Cliente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Nombre, email, teléfono, documento, dirección..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Clientes */}
      <Card className="border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-green-800">
                  Clientes ({filteredClients.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">#{client.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-xs text-gray-600">{client.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{client.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {client.documentNumber || 'N/A'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">
                          {client.address || client.location}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={client.isActive}
                            onCheckedChange={(checked) => {
                              setClients(clients.map(c => 
                                c.id === client.id ? { ...c, isActive: checked } : c
                              ));
                              toast.success(checked ? 'Cliente activado' : 'Cliente desactivado');
                            }}
                            className="data-[state=checked]:bg-green-600"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewHistory(client)}
                              className="border-green-600 text-green-600 hover:bg-green-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditClient(client)}
                              className="border-blue-600 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteClient(client)}
                              className="border-red-600 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Paginación Mejorada */}
                {totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-between mt-6 px-4"
                  >
                    <div className="text-sm text-gray-600">
                      Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredClients.length)} de {filteredClients.length} registros
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

      {/* Modal Crear Cliente */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Registrar Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Complete el formulario para agregar un nuevo cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Ciudad"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Contraseña segura"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite la contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="preferences">Preferencias</Label>
              <Input
                id="preferences"
                placeholder="Ej: Rural, Gastronómica, Aventura"
                value={formData.preferences}
                onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Información adicional sobre el cliente..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateClient}
                className="bg-green-600 hover:bg-green-700"
              >
                Registrar Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Cliente */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Editar Cliente</DialogTitle>
            <DialogDescription>
              Complete el formulario para actualizar la información del cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Ciudad"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="preferences">Preferencias</Label>
              <Input
                id="preferences"
                placeholder="Ej: Rural, Gastronómica, Aventura"
                value={formData.preferences}
                onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Información adicional sobre el cliente..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateClient}
                className="bg-green-600 hover:bg-green-700"
              >
                Actualizar Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar Cliente */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-800">Eliminar Cliente</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar este cliente?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez"
                  value={selectedClient?.name}
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@email.com"
                  value={selectedClient?.email}
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="+57 300 000 0000"
                  value={selectedClient?.phone}
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Ciudad"
                  value={selectedClient?.location}
                  readOnly
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmDeleteClient}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Historial de Cliente */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Historial Completo del Cliente</DialogTitle>
            <DialogDescription>
              Información detallada y registro de actividades
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              {/* Información del cliente */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3">Información Personal</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-medium">{selectedClient.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedClient.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium">{selectedClient.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Documento</p>
                    <p className="font-medium">{selectedClient.documentNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Dirección</p>
                    <p className="font-medium">{selectedClient.address || selectedClient.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ubicación</p>
                    <p className="font-medium">{selectedClient.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cliente desde</p>
                    <p className="font-medium">{selectedClient.joinDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Última visita</p>
                    <p className="font-medium">{selectedClient.lastVisit}</p>
                  </div>
                </div>
              </div>

              {/* Información de Comportamiento */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Información de Comportamiento</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tipo de Experiencia</p>
                    <Badge variant="outline" className="capitalize mt-1">
                      {selectedClient.experienceType}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Frecuencia de Visitas</p>
                    <Badge
                      variant={selectedClient.frequencyLevel === 'Alta' ? 'default' : 'secondary'}
                      className={`mt-1 ${
                        selectedClient.frequencyLevel === 'Alta'
                          ? 'bg-green-500'
                          : selectedClient.frequencyLevel === 'Media'
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                      }`}
                    >
                      {selectedClient.frequencyLevel}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Gastado</p>
                    <p className="font-medium text-green-600 text-lg">${selectedClient.totalSpent.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-green-200">
                  <CardContent className="pt-6 text-center">
                    <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">{selectedClient.totalBookings}</p>
                    <p className="text-sm text-gray-600">Reservas</p>
                  </CardContent>
                </Card>
                <Card className="border-green-200">
                  <CardContent className="pt-6 text-center">
                    <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">${(selectedClient.totalSpent / 1000).toFixed(0)}K</p>
                    <p className="text-sm text-gray-600">Total Gastado</p>
                  </CardContent>
                </Card>
                <Card className="border-green-200">
                  <CardContent className="pt-6 text-center">
                    <Heart className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">{selectedClient.satisfactionLevel}</p>
                    <p className="text-sm text-gray-600">Satisfacción</p>
                  </CardContent>
                </Card>
              </div>

              {/* Rutas favoritas */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Rutas Favoritas</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedClient.favoriteRoutes.map((route: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-green-50 border-green-300">
                      <MapPin className="w-3 h-3 mr-1" />
                      {route}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Preferencias */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Preferencias</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedClient.preferences}</p>
              </div>

              {/* Notas */}
              {selectedClient.notes && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Notas</h4>
                  <p className="text-gray-600 bg-yellow-50 p-3 rounded-lg">{selectedClient.notes}</p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button
                  onClick={() => setIsHistoryModalOpen(false)}
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