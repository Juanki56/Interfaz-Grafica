import { motion } from 'motion/react';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Users,
  Filter,
  X,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Clock,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  User,
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
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useState, useEffect } from 'react';

import { Switch } from './ui/switch';

import { empleadosAPI } from '../services/api';


// 1. Actualiza la interfaz local Employee para reflejar el backend
interface Employee {
  id: string;              // viene de id_empleado (convertido a string)
  nombre: string;
  apellido: string;
  email: string;           // viene de correo
  documento: string;       // viene de numero_documento
  tipo_documento?: string;
  cargo: string;           // el backend usa "cargo", no "rol"
  rol: 'advisor' | 'guide'; // se mapea desde rol_nombre o cargo
  telefono: string;
  estado: 'Activo' | 'Inactivo' | 'Suspendido';
  disponibilidad: string;
  fecha_registro: string;
  direccion?: string;
  especialidad?: string;
  experiencia?: string;
  asignaciones_activas?: number;
  ultima_asignacion?: string;
}

// 2. Función para mapear empleado del backend al tipo local
function mapEmpleado(e: any): Employee {
  return {
    id: String(e.id_empleado),
    nombre: e.nombre || '',
    apellido: e.apellido || '',
    email: e.correo || '',
    documento: e.numero_documento || '',
    tipo_documento: e.tipo_documento || '',
    cargo: e.cargo || '',
    rol: e.cargo?.toLowerCase().includes('guía') || e.cargo?.toLowerCase().includes('guia')
      ? 'guide'
      : 'advisor',
    telefono: e.telefono || '',
    estado: e.estado === true || e.estado === 'activo'
      ? 'Activo'
      : e.estado === false || e.estado === 'inactivo'
      ? 'Inactivo'
      : 'Suspendido',
    disponibilidad: '',   // el backend no tiene este campo aún
    fecha_registro: e.fecha_registro || new Date().toISOString(),
  };
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'advisor' | 'guide'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Activo' | 'Inactivo' | 'Suspendido'>('all');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
 const [formData, setFormData] = useState<Partial<Employee> & { apellido?: string; contrasena?: string; cargo?: string }>({
    nombre: '',
    apellido: '',
    email: '',
    documento: '',
    cargo: '',
    rol: 'advisor',
    telefono: '',
    estado: 'Activo',
    disponibilidad: '',
    direccion: '',
    especialidad: '',
    experiencia: '',
    contrasena: ''
  });

  // Filtrar empleados
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.documento.includes(searchTerm);
    
    const matchesRole = roleFilter === 'all' || employee.rol === roleFilter;
    const matchesStatus = statusFilter === 'all' || employee.estado === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Paginación
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {
    setLoading(true);
    try {
      const data = await empleadosAPI.getAll();
      setEmployees((data as any[]).map(mapEmpleado));
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  // Handlers
  const handleCreate = () => {
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      documento: '',
      cargo: '',
      rol: 'advisor',
      telefono: '',
      estado: 'Activo',
      disponibilidad: '',
      direccion: '',
      especialidad: '',
      experiencia: '',
      contrasena: ''
    });
    setShowCreateModal(true);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData(employee);
    setShowEditModal(true);
  };

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  const handleDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDeleteDialog(true);
  };

 const handleToggleStatus = async (employee: Employee) => {
    const nuevoEstado = employee.estado === 'Activo' ? false : true;
    try {
      await empleadosAPI.update(Number(employee.id), { estado: nuevoEstado } as any);
      toast.success(`Estado actualizado a ${nuevoEstado ? 'Activo' : 'Inactivo'}`);
      await cargarEmpleados();
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar estado');
    }
  };

  const confirmCreate = async () => {
    const fd = formData as any;
    if (!fd.nombre || !fd.apellido || !fd.email || !fd.documento || !fd.telefono || !fd.cargo || !fd.contrasena) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }
    try {
      await empleadosAPI.create({
        nombre: fd.nombre,
        apellido: fd.apellido,
        correo: fd.email,
        contrasena: fd.contrasena,
        telefono: fd.telefono,
        cargo: fd.cargo,
        tipo_documento: fd.tipo_documento || 'CC',
        numero_documento: fd.documento,
        estado: fd.estado === 'Activo',
      } as any);
      toast.success('Empleado registrado exitosamente');
      setShowCreateModal(false);
      await cargarEmpleados();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear empleado');
    }
  };

  const confirmEdit = async () => {
    const fd = formData as any;
    if (!fd.nombre || !fd.email || !fd.telefono) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }
    try {
      await empleadosAPI.update(Number(selectedEmployee?.id), {
        nombre: fd.nombre,
        apellido: fd.apellido,
        telefono: fd.telefono,
        cargo: fd.cargo,
        estado: fd.estado === 'Activo',
      } as any);
      toast.success('Empleado actualizado exitosamente');
      setShowEditModal(false);
      await cargarEmpleados();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar empleado');
    }
  };

 const confirmDelete = async () => {
    try {
      await empleadosAPI.delete(Number(selectedEmployee?.id));
      toast.success('Empleado eliminado del sistema');
      setShowDeleteDialog(false);
      await cargarEmpleados();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar empleado');
    }
  };

  const getRoleBadgeColor = (rol: string) => {
    return rol === 'advisor' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';
  };

  const getStatusBadgeColor = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return 'bg-green-100 text-green-700';
      case 'Inactivo':
        return 'bg-gray-100 text-gray-700';
      case 'Suspendido':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-green-800">Gestión de empleados</h1>
        <p className="text-gray-600">
          Administra perfiles, estados y roles de asesores y guías turísticos
        </p>
      </motion.div>

      {/* Filtros y búsqueda */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre, correo o documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-green-200 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Filtro por rol */}
              <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                <SelectTrigger className="w-full lg:w-48 border-green-200">
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="advisor">Asesores</SelectItem>
                  <SelectItem value="guide">Guías</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro por estado */}
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full lg:w-48 border-green-200">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Activo">Activos</SelectItem>
                  <SelectItem value="Inactivo">Inactivos</SelectItem>
                  <SelectItem value="Suspendido">Suspendidos</SelectItem>
                </SelectContent>
              </Select>

              {/* Botón crear */}
              <Button 
                onClick={handleCreate}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar empleado
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de empleados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">
              Empleados registrados ({filteredEmployees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-green-200">
                  <TableHead className="w-[220px]">Nombre completo</TableHead>
                  <TableHead className="w-[220px]">Correo electrónico</TableHead>
                  <TableHead className="w-[140px]">Documento</TableHead>
                  <TableHead className="w-[140px]">Cargo</TableHead>
                  <TableHead className="w-[100px]">Estado</TableHead>
                  <TableHead className="w-[140px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                      Cargando empleados...
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEmployees.map((employee, index) => (
                  <motion.tr
                    key={employee.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-green-100 hover:bg-green-50"
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-green-700" />
                        </div>
                        <span>{employee.nombre} {employee.apellido}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {employee.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{employee.documento}</TableCell>
                    <TableCell className="text-gray-600">
                      {employee.cargo || '—'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={employee.estado === 'Activo'}
                        onCheckedChange={() => handleToggleStatus(employee)}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(employee)}
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(employee)}
                          className="hover:bg-green-50 hover:text-green-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(employee)}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                  ))
                )}

              </TableBody>
            </Table>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron empleados</p>
                <p className="text-sm text-gray-400">Intenta ajustar los filtros de búsqueda</p>
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-green-100">
                <p className="text-sm text-gray-600">
                  Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredEmployees.length)} de {filteredEmployees.length} empleados
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

      {/* Modal: Crear empleado */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-800">Registrar nuevo empleado</DialogTitle>
            <DialogDescription>
              Completa la información del nuevo empleado. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre completo *</Label>
                <Input
                  placeholder="Ej: Juan Pérez"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="border-green-200"
                />
              </div>

              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input
                  placeholder="Ej: Pérez"
                  value={(formData as any).apellido || ''}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value } as any)}
                  className="border-green-200"
                />
              </div>

              <div className="space-y-2">
                <Label>Documento de identidad *</Label>
                <Input
                  placeholder="Ej: 1023456789"
                  value={formData.documento}
                  onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                  className="border-green-200"
                />
              </div>

              <div className="space-y-2">
                <Label>Correo electrónico *</Label>
                <Input
                  type="email"
                  placeholder="empleado@occitours.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-green-200"
                />
              </div>

              <div className="space-y-2">
                <Label>Teléfono *</Label>
                <Input
                  placeholder="+57 300 123 4567"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="border-green-200"
                />
              </div>

              <div className="space-y-2">
                <Label>Cargo *</Label>
                <Select
                  value={(formData as any).cargo || ''}
                  onValueChange={(value: any) => setFormData({ ...formData, cargo: value } as any)}
                >
                  <SelectTrigger className="border-green-200">
                    <SelectValue placeholder="Selecciona un cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asesor">Asesor</SelectItem>
                    <SelectItem value="Guía Turístico">Guía Turístico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Contraseña inicial *</Label>
                <Input
                  type="password"
                  placeholder="Contraseña de acceso"
                  value={(formData as any).contrasena || ''}
                  onChange={(e) => setFormData({ ...formData, contrasena: e.target.value } as any)}
                  className="border-green-200"
                />
              </div>


              <div className="space-y-2">
                <Label>Estado inicial *</Label>
                <Select 
                  value={formData.estado} 
                  onValueChange={(value: any) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger className="border-green-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              <div className="space-y-2 md:col-span-2">
                <Label>Dirección</Label>
                <Input
                  placeholder="Dirección completa"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="border-green-200"
                />
              </div>

              {formData.rol === 'guide' && (
                <>
                  <div className="space-y-2">
                    <Label>Especialidad</Label>
                    <Input
                      placeholder="Ej: Senderismo, Observación de aves"
                      value={formData.especialidad}
                      onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                      className="border-green-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Experiencia</Label>
                    <Input
                      placeholder="Ej: 5 años"
                      value={formData.experiencia}
                      onChange={(e) => setFormData({ ...formData, experiencia: e.target.value })}
                      className="border-green-200"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmCreate}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Registrar empleado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar empleado */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-800">Editar empleado</DialogTitle>
            <DialogDescription>
              Modifica la información del empleado seleccionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre completo *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="border-green-200"
                />
              </div>

              <div className="space-y-2">
                <Label>Documento de identidad</Label>
                <Input
                  value={formData.documento}
                  disabled
                  className="border-green-200 bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Correo electrónico *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-green-200"
                />
              </div>

              <div className="space-y-2">
                <Label>Teléfono *</Label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="border-green-200"
                />
              </div>

             <div className="space-y-2">
                <Label>Cargo</Label>
                <Select 
                  value={(formData as any).cargo || ''}
                  onValueChange={(value: any) => setFormData({ ...formData, cargo: value } as any)}
                >
                  <SelectTrigger className="border-green-200">
                    <SelectValue placeholder="Selecciona un cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asesor">Asesor</SelectItem>
                    <SelectItem value="Guía Turístico">Guía Turístico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select 
                  value={formData.estado} 
                  onValueChange={(value: any) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger className="border-green-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                    <SelectItem value="Suspendido">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Disponibilidad</Label>
                <Input
                  value={formData.disponibilidad}
                  onChange={(e) => setFormData({ ...formData, disponibilidad: e.target.value })}
                  className="border-green-200"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Dirección</Label>
                <Input
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="border-green-200"
                />
              </div>

              {formData.rol === 'guide' && (
                <>
                  <div className="space-y-2">
                    <Label>Especialidad</Label>
                    <Input
                      value={formData.especialidad}
                      onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                      className="border-green-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Experiencia</Label>
                    <Input
                      value={formData.experiencia}
                      onChange={(e) => setFormData({ ...formData, experiencia: e.target.value })}
                      className="border-green-200"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmEdit}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Ver detalle */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Detalle del empleado</DialogTitle>
            <DialogDescription>
              Información completa del perfil
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6 py-4">
              {/* Header con avatar y nombre */}
              <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-green-800">{selectedEmployee.nombre} {selectedEmployee.apellido}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getRoleBadgeColor(selectedEmployee.rol)}>
                      {selectedEmployee.rol === 'advisor' ? 'Asesor' : 'Guía Turístico'}
                    </Badge>
                    <Badge className={getStatusBadgeColor(selectedEmployee.estado)}>
                      {selectedEmployee.estado}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="space-y-3">
                <h4 className="text-gray-700">Información de contacto</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Correo electrónico</p>
                      <p className="text-gray-800">{selectedEmployee.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="text-gray-800">{selectedEmployee.telefono}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <User className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Documento</p>
                      <p className="text-gray-800">{selectedEmployee.documento}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Dirección</p>
                      <p className="text-gray-800">{selectedEmployee.direccion || 'No especificada'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información laboral */}
              {/* Información laboral */}
              <div className="space-y-3">
                <h4 className="text-gray-700">Información laboral</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <Briefcase className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Cargo</p>
                      <p className="text-gray-800">{selectedEmployee.cargo || 'No especificado'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="text-gray-800">{selectedEmployee.telefono || 'No especificado'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Fecha de contratación</p>
                      <p className="text-gray-800">
                        {selectedEmployee.fecha_registro
                          ? new Date(selectedEmployee.fecha_registro).toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'No registrada'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Fecha de registro</p>
                      <p className="text-gray-800">
                        {selectedEmployee.fecha_registro
                          ? new Date(selectedEmployee.fecha_registro).toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'No registrada'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="space-y-3">
                <h4 className="text-gray-700">Estadísticas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-green-200">
                    <CardContent className="pt-6">
                      <p className="text-sm text-gray-600">Asignaciones activas</p>
                      <p className="text-2xl text-green-800">{selectedEmployee.asignaciones_activas || 0}</p>
                    </CardContent>
                  </Card>

                  {selectedEmployee.ultima_asignacion && (
                    <Card className="border-blue-200">
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-600">Última asignación</p>
                        <p className="text-sm text-gray-800">
                          {new Date(selectedEmployee.ultima_asignacion).toLocaleDateString('es-CO')}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Cerrar
            </Button>
            <Button 
              onClick={() => {
                setShowViewModal(false);
                if (selectedEmployee) handleEdit(selectedEmployee);
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              ¿Deseas eliminar esta cuenta?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará el acceso del empleado{' '}
              <span className="font-semibold">{selectedEmployee?.nombre}</span> al sistema.
              Los registros históricos se mantendrán pero el empleado no podrá iniciar sesión.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}