import { motion } from 'motion/react';
import {
  Search,
  Plus,
  Eye,
  EyeOff,
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
  Briefcase,
  Clock,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  User,
  ChevronLeft,
  ChevronRight,
  MapPin,
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
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useState, useEffect, useMemo } from 'react';

import { GuideAvailabilityCalendar } from './GuideAvailabilityCalendar';
import { Switch } from './ui/switch';
import { cn } from './ui/utils';

import { empleadosAPI, type Programacion } from '../services/api';
import { formatDateDisplay } from '../utils/dateTimeDisplay';
import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';
import {
  validateEmployeeFormFields,
  validateEmployeeFormForSubmit,
  validateEmployeeSingleField,
  sanitizeDocumentInput,
  sanitizeEmployeeNameInput,
  sanitizeEmployeePhoneInput,
  normalizeClientEmail,
  cargoToRol,
  getEmployeePasswordRequirementChecks,
  normalizeEmployeeDocType,
  EMPLOYEE_DOC_TYPES,
  type EmployeeFormInput,
} from '../utils/employeeFormValidation';
import {
  getEmployeeDeactivationBlockReason,
  willDeactivateEmployeeEstado,
  type EmployeeAccountSnapshot,
} from '../utils/criticalAccountGuard';
import { rolesAPI } from '../services/api';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-red-600 flex items-start gap-1 mt-1">
      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>{message}</span>
    </p>
  );
}

function inputClass(hasError?: boolean) {
  return cn('border-green-200 focus:border-green-500', hasError && 'border-red-400 focus:border-red-500');
}


// 1. Actualiza la interfaz local Employee para reflejar el backend
interface Employee {
  id: string;              // viene de id_empleado (convertido a string)
  id_usuarios?: number;
  id_roles?: number;
  rol_nombre?: string;
  nombre: string;
  apellido: string;
  email: string;           // viene de correo
  documento: string;       // viene de numero_documento
  tipo_documento?: string;
  cargo: string;           // el backend usa "cargo", no "rol"
  rol: 'advisor' | 'guide'; // se mapea desde rol_nombre o cargo
  telefono: string;
  estado: 'Activo' | 'Inactivo' | 'Suspendido';
  fecha_registro: string;
  asignaciones_activas?: number;
  ultima_asignacion?: string;
}

// 2. Función para mapear empleado del backend al tipo local
function mapEmpleado(e: any): Employee {
  return {
    id: String(e.id_empleado),
    id_usuarios: e.id_usuarios != null ? Number(e.id_usuarios) : undefined,
    id_roles: e.id_roles != null ? Number(e.id_roles) : undefined,
    rol_nombre: e.rol_nombre || '',
    nombre: e.nombre || '',
    apellido: e.apellido || '',
    email: e.correo || '',
    documento: e.numero_documento || '',
    tipo_documento: normalizeEmployeeDocType(e.tipo_documento),
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
    fecha_registro: e.fecha_registro || new Date().toISOString(),
  };
}

function isGuideEmployee(employee: Pick<Employee, 'rol' | 'cargo'>): boolean {
  if (employee.rol === 'guide') return true;
  const cargo = String(employee.cargo || '').toLowerCase();
  return cargo.includes('guía') || cargo.includes('guia');
}

function programacionEstadoLabel(estado?: string | null): string {
  const raw = String(estado || 'Programado').trim();
  if (!raw) return 'Programado';
  return raw;
}

function programacionEstadoBadgeClass(estado?: string | null): string {
  const st = String(estado || '').toLowerCase();
  if (st.includes('cancel')) return 'bg-red-100 text-red-800';
  if (st.includes('complet')) return 'bg-green-100 text-green-800';
  if (st.includes('progreso') || st.includes('activ')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-blue-100 text-blue-800';
}

function isProgramacionActiva(p: Programacion): boolean {
  const st = String(p.estado || '').toLowerCase();
  if (st.includes('cancel')) return false;
  if (st.includes('complet')) return false;
  const regreso = new Date(`${String(p.fecha_regreso || '').slice(0, 10)}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !Number.isNaN(regreso.getTime()) && regreso >= today;
}

export function EmployeeManagement() {
  const permisos = usePermissions();
  const employeePerms = createModulePermissions(permisos, 'Empleados');
  const canViewEmployees = employeePerms.canView();
  const canCreateEmployee = employeePerms.canCreate();
  const canEditEmployee = employeePerms.canEdit();
  const canDeleteEmployee = employeePerms.canDelete();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rolePermissionMap, setRolePermissionMap] = useState<Map<number, string[]>>(new Map());
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
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [guideProgramaciones, setGuideProgramaciones] = useState<Programacion[]>([]);
  const [loadingGuideProgramaciones, setLoadingGuideProgramaciones] = useState(false);
  const [guideAssignmentsPage, setGuideAssignmentsPage] = useState(1);
  const guideAssignmentsPerPage = 5;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusConfirmDialog, setShowStatusConfirmDialog] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    employeeName: string;
    estadoAnterior: string;
    estadoNuevo: string;
    applyChange: () => Promise<void>;
  } | null>(null);
  const [applyingStatusChange, setApplyingStatusChange] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<
    Partial<Employee> & {
      apellido?: string;
      contrasena?: string;
      confirmarContrasena?: string;
      cargo?: string;
      tipo_documento?: string;
    }
  >({
    nombre: '',
    apellido: '',
    email: '',
    documento: '',
    tipo_documento: 'CC',
    cargo: '',
    rol: 'advisor',
    telefono: '',
    estado: 'Activo',
    contrasena: '',
    confirmarContrasena: '',
  });

  const validationContext = useMemo(
    () => ({
      existingEmails: employees.map((e) => e.email),
      existingDocuments: employees.map((e) => e.documento),
    }),
    [employees],
  );

  const buildFormInput = (fd: typeof formData): EmployeeFormInput => ({
    nombre: fd.nombre || '',
    apellido: fd.apellido || '',
    email: fd.email || '',
    documento: fd.documento || '',
    tipo_documento: fd.tipo_documento || 'CC',
    telefono: fd.telefono || '',
    cargo: fd.cargo || '',
    estado: fd.estado || 'Activo',
    contrasena: fd.contrasena,
    confirmarContrasena: fd.confirmarContrasena,
  });

  const toEmployeeAccountSnapshot = (employee: Employee): EmployeeAccountSnapshot => ({
    id: employee.id,
    id_roles: employee.id_roles,
    rol_nombre: employee.rol_nombre,
    estado: employee.estado,
  });

  const employeeAccountSnapshots = useMemo(
    () => employees.map(toEmployeeAccountSnapshot),
    [employees],
  );

  const getDeactivationBlockReason = (employee: Employee | null | undefined): string | null => {
    if (!employee) return null;
    return getEmployeeDeactivationBlockReason(
      toEmployeeAccountSnapshot(employee),
      employeeAccountSnapshots,
      rolePermissionMap,
    );
  };

  const clearFieldError = (field: string) => {
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const touchField = (field: string, mode: 'create' | 'edit' = showEditModal ? 'edit' : 'create') => {
    const ctx =
      mode === 'edit'
        ? {
            ...validationContext,
            currentEmployeeId: selectedEmployee?.id,
            currentEmployeeDocument: selectedEmployee?.documento,
            currentEmployeeEmail: selectedEmployee?.email,
          }
        : validationContext;
    const msg = validateEmployeeSingleField(field, buildFormInput(formData), mode, ctx);
    if (!msg && field === 'estado' && mode === 'edit' && willDeactivateEmployeeEstado(formData.estado)) {
      const blockReason = getDeactivationBlockReason(selectedEmployee);
      if (blockReason) {
        setFormErrors((prev) => ({ ...prev, estado: blockReason }));
        return;
      }
    }
    setFormErrors((prev) => {
      const next = { ...prev };
      if (msg) next[field] = msg;
      else delete next[field];
      return next;
    });
  };

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
    if (permisos.loadingRoles) return;
    if (!canViewEmployees) {
      setEmployees([]);
      setLoading(false);
      return;
    }
    cargarEmpleados();
  }, [permisos.loadingRoles, canViewEmployees]);

  const cargarEmpleados = async () => {
    setLoading(true);
    try {
      const data = await empleadosAPI.getAll();
      const mapped = (data as any[]).map(mapEmpleado);
      setEmployees(mapped);

      const roleIds = [
        ...new Set(
          mapped
            .map((employee) => employee.id_roles)
            .filter((roleId): roleId is number => roleId != null && Number(roleId) > 0),
        ),
      ];

      if (roleIds.length === 0) {
        setRolePermissionMap(new Map());
        return;
      }

      const permissionEntries = await Promise.all(
        roleIds.map(async (roleId) => {
          try {
            const permisos = await rolesAPI.getPermisosDeRol(roleId);
            return [roleId, permisos.map((permiso) => String(permiso.nombre || ''))] as const;
          } catch {
            return [roleId, []] as const;
          }
        }),
      );
      setRolePermissionMap(new Map(permissionEntries));
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
    if (!canCreateEmployee) {
      toast.error('No tienes permiso para crear empleados');
      return;
    }

    setFormErrors({});
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      documento: '',
      tipo_documento: 'CC',
      cargo: '',
      rol: 'advisor',
      telefono: '',
      estado: 'Activo',
      contrasena: '',
      confirmarContrasena: '',
    });
    setShowCreateModal(true);
  };

  const handleEdit = (employee: Employee) => {
    if (!canEditEmployee) {
      toast.error('No tienes permiso para editar empleados');
      return;
    }

    setFormErrors({});
    setSelectedEmployee(employee);
    setShowEditPassword(false);
    setShowEditConfirmPassword(false);
    setFormData({
      ...employee,
      tipo_documento: normalizeEmployeeDocType(employee.tipo_documento),
      contrasena: '',
      confirmarContrasena: '',
    });
    setShowEditModal(true);
  };

  const editValidationContext = useMemo(
    () => ({
      ...validationContext,
      currentEmployeeId: selectedEmployee?.id,
      currentEmployeeDocument: selectedEmployee?.documento,
      currentEmployeeEmail: selectedEmployee?.email,
    }),
    [validationContext, selectedEmployee],
  );

  const handleView = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setGuideProgramaciones([]);
    setGuideAssignmentsPage(1);
    setShowViewModal(true);

    if (!isGuideEmployee(employee)) return;

    setLoadingGuideProgramaciones(true);
    try {
      const rows = await empleadosAPI.getProgramaciones(Number(employee.id));
      setGuideProgramaciones(rows);
    } catch (error: any) {
      toast.error(error.message || 'No se pudieron cargar las rutas asignadas');
    } finally {
      setLoadingGuideProgramaciones(false);
    }
  };

  const guideAsignacionesActivas = useMemo(
    () => guideProgramaciones.filter(isProgramacionActiva).length,
    [guideProgramaciones],
  );

  const guideUltimaAsignacion = useMemo(() => {
    if (guideProgramaciones.length === 0) return null;
    const sorted = [...guideProgramaciones].sort(
      (a, b) =>
        new Date(String(b.fecha_salida || '')).getTime() -
        new Date(String(a.fecha_salida || '')).getTime(),
    );
    return sorted[0]?.fecha_salida || null;
  }, [guideProgramaciones]);

  const paginatedGuideProgramaciones = useMemo(
    () =>
      guideProgramaciones.slice(
        (guideAssignmentsPage - 1) * guideAssignmentsPerPage,
        guideAssignmentsPage * guideAssignmentsPerPage,
      ),
    [guideProgramaciones, guideAssignmentsPage],
  );

  const totalGuideAssignmentPages = Math.ceil(
    guideProgramaciones.length / guideAssignmentsPerPage,
  );
  const guideAssignmentsStartIndex = (guideAssignmentsPage - 1) * guideAssignmentsPerPage;

  useEffect(() => {
    if (guideAssignmentsPage > totalGuideAssignmentPages && totalGuideAssignmentPages > 0) {
      setGuideAssignmentsPage(totalGuideAssignmentPages);
    }
  }, [guideAssignmentsPage, totalGuideAssignmentPages]);

  const handleDelete = (employee: Employee) => {
    if (!canDeleteEmployee) {
      toast.error('No tienes permiso para eliminar empleados');
      return;
    }

    setSelectedEmployee(employee);
    setShowDeleteDialog(true);
  };

 const handleToggleStatusRequest = (employee: Employee) => {
    if (!canEditEmployee) {
      toast.error('No tienes permiso para editar empleados');
      return;
    }

    const activando = employee.estado !== 'Activo';
    const nuevoEstadoBackend = activando;
    if (!nuevoEstadoBackend) {
      const blockReason = getDeactivationBlockReason(employee);
      if (blockReason) {
        toast.error(blockReason);
        return;
      }
    }

    const estadoNuevo = activando ? 'Activo' : 'Inactivo';
    const employeeName = `${employee.nombre} ${employee.apellido}`.trim();

    setPendingStatusChange({
      employeeName,
      estadoAnterior: employee.estado,
      estadoNuevo,
      applyChange: async () => {
        await empleadosAPI.update(Number(employee.id), { estado: nuevoEstadoBackend } as any);
        toast.success(`Estado actualizado a ${estadoNuevo}`);
        await cargarEmpleados();
      },
    });
    setShowStatusConfirmDialog(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange || applyingStatusChange) return;

    setApplyingStatusChange(true);
    try {
      await pendingStatusChange.applyChange();
      setShowStatusConfirmDialog(false);
      setPendingStatusChange(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar estado');
    } finally {
      setApplyingStatusChange(false);
    }
  };

  const confirmCreate = async () => {
    if (!canCreateEmployee) {
      toast.error('No tienes permiso para crear empleados');
      return;
    }

    const input = buildFormInput(formData);
    const errors = validateEmployeeFormFields(input, 'create', validationContext);
    setFormErrors(errors);
    const summary = validateEmployeeFormForSubmit(input, 'create', validationContext);
    if (summary) {
      toast.error(summary);
      return;
    }

    const fd = formData as any;
    try {
      await empleadosAPI.create({
        nombre: sanitizeEmployeeNameInput(fd.nombre).trim(),
        apellido: sanitizeEmployeeNameInput(fd.apellido).trim(),
        correo: normalizeClientEmail(fd.email),
        contrasena: fd.contrasena,
        telefono: sanitizeEmployeePhoneInput(fd.telefono),
        cargo: fd.cargo,
        tipo_documento: (fd.tipo_documento || 'CC').toUpperCase(),
        numero_documento: sanitizeDocumentInput(fd.documento),
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
    if (!canEditEmployee) {
      toast.error('No tienes permiso para editar empleados');
      return;
    }

    const input = buildFormInput(formData);
    const errors = validateEmployeeFormFields(input, 'edit', editValidationContext);
    setFormErrors(errors);
    const summary = validateEmployeeFormForSubmit(input, 'edit', editValidationContext);
    if (summary) {
      toast.error(summary);
      return;
    }

    const fd = formData as any;

    if (willDeactivateEmployeeEstado(fd.estado) && selectedEmployee) {
      const blockReason = getDeactivationBlockReason(selectedEmployee);
      if (blockReason) {
        toast.error(blockReason);
        setFormErrors((prev) => ({ ...prev, estado: blockReason }));
        return;
      }
    }

    const updatePayload: Record<string, unknown> = {
      nombre: sanitizeEmployeeNameInput(fd.nombre).trim(),
      apellido: sanitizeEmployeeNameInput(fd.apellido).trim(),
      correo: normalizeClientEmail(fd.email),
      telefono: sanitizeEmployeePhoneInput(fd.telefono),
      cargo: fd.cargo,
      estado: fd.estado === 'Activo',
      tipo_documento: fd.tipo_documento || 'CC',
      numero_documento: sanitizeDocumentInput(fd.documento),
    };
    const nuevaContrasena = String(fd.contrasena || '').trim();
    if (nuevaContrasena) {
      updatePayload.contrasena = nuevaContrasena;
    }

    const estadoCambio =
      selectedEmployee != null && String(fd.estado || '') !== String(selectedEmployee.estado || '');

    const ejecutarActualizacion = async () => {
      await empleadosAPI.update(Number(selectedEmployee?.id), updatePayload as any);
      toast.success(
        nuevaContrasena
          ? 'Empleado actualizado. La contraseña de acceso fue cambiada.'
          : 'Empleado actualizado exitosamente',
      );
      setShowEditModal(false);
      await cargarEmpleados();
    };

    if (estadoCambio && selectedEmployee) {
      const employeeName = `${selectedEmployee.nombre} ${selectedEmployee.apellido}`.trim();
      setPendingStatusChange({
        employeeName,
        estadoAnterior: selectedEmployee.estado,
        estadoNuevo: String(fd.estado || ''),
        applyChange: ejecutarActualizacion,
      });
      setShowStatusConfirmDialog(true);
      return;
    }

    try {
      await ejecutarActualizacion();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar empleado');
    }
  };

 const confirmDelete = async () => {
    if (!canDeleteEmployee) {
      toast.error('No tienes permiso para eliminar empleados');
      return;
    }

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

  if (!permisos.loadingRoles && !canViewEmployees) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Acceso denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">No tienes permiso para ver empleados.</p>
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
              {canCreateEmployee && (
                <Button 
                  onClick={handleCreate}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar empleado
                </Button>
              )}
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
                        onCheckedChange={() => handleToggleStatusRequest(employee)}
                        disabled={!canEditEmployee}
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
                        {canEditEmployee && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                            className="hover:bg-green-50 hover:text-green-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDeleteEmployee && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(employee)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
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
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) setFormErrors({});
        }}
      >
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
                <Label>Nombre *</Label>
                <Input
                  placeholder="Ej: Juan"
                  value={formData.nombre}
                  onChange={(e) => {
                    clearFieldError('nombre');
                    setFormData({ ...formData, nombre: sanitizeEmployeeNameInput(e.target.value) });
                  }}
                  onBlur={() => touchField('nombre', 'create')}
                  className={inputClass(!!formErrors.nombre)}
                  maxLength={80}
                />
                <FieldError message={formErrors.nombre} />
              </div>

              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input
                  placeholder="Ej: Pérez"
                  value={(formData as any).apellido || ''}
                  onChange={(e) => {
                    clearFieldError('apellido');
                    setFormData({ ...formData, apellido: sanitizeEmployeeNameInput(e.target.value) } as any);
                  }}
                  onBlur={() => touchField('apellido', 'create')}
                  className={inputClass(!!formErrors.apellido)}
                  maxLength={80}
                />
                <FieldError message={formErrors.apellido} />
              </div>

              <div className="space-y-2">
                <Label>Tipo de documento *</Label>
                <Select
                  value={formData.tipo_documento || 'CC'}
                  onValueChange={(value) => {
                    clearFieldError('tipo_documento');
                    clearFieldError('documento');
                    setFormData({ ...formData, tipo_documento: value });
                    setTimeout(() => touchField('tipo_documento', 'create'), 0);
                  }}
                >
                  <SelectTrigger className={inputClass(!!formErrors.tipo_documento || !!formErrors.documento)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_DOC_TYPES.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={formErrors.tipo_documento} />
              </div>

              <div className="space-y-2">
                <Label>Número de documento *</Label>
                <Input
                  placeholder="Ej: 1023456789"
                  value={formData.documento}
                  onChange={(e) => {
                    clearFieldError('documento');
                    setFormData({
                      ...formData,
                      documento: sanitizeDocumentInput(e.target.value),
                    });
                  }}
                  onBlur={() => touchField('documento', 'create')}
                  className={inputClass(!!formErrors.documento)}
                  maxLength={20}
                />
                <FieldError message={formErrors.documento} />
              </div>

              <div className="space-y-2">
                <Label>Correo electrónico *</Label>
                <Input
                  type="email"
                  placeholder="empleado@occitours.com"
                  value={formData.email}
                  onChange={(e) => {
                    clearFieldError('email');
                    setFormData({ ...formData, email: e.target.value });
                  }}
                  onBlur={() => {
                    setFormData((prev) => ({
                      ...prev,
                      email: normalizeClientEmail(prev.email || ''),
                    }));
                    touchField('email', 'create');
                  }}
                  className={inputClass(!!formErrors.email)}
                  maxLength={254}
                />
                <FieldError message={formErrors.email} />
              </div>

              <div className="space-y-2">
                <Label>Teléfono *</Label>
                <Input
                  placeholder="+57 300 123 4567"
                  value={formData.telefono}
                  onChange={(e) => {
                    clearFieldError('telefono');
                    setFormData({
                      ...formData,
                      telefono: sanitizeEmployeePhoneInput(e.target.value),
                    });
                  }}
                  onBlur={() => touchField('telefono', 'create')}
                  className={inputClass(!!formErrors.telefono)}
                  maxLength={20}
                />
                <FieldError message={formErrors.telefono} />
              </div>

              <div className="space-y-2">
                <Label>Cargo *</Label>
                <Select
                  value={(formData as any).cargo || ''}
                  onValueChange={(value: string) => {
                    clearFieldError('cargo');
                    setFormData({
                      ...formData,
                      cargo: value,
                      rol: cargoToRol(value),
                    } as any);
                    setTimeout(() => touchField('cargo', 'create'), 0);
                  }}
                >
                  <SelectTrigger className={inputClass(!!formErrors.cargo)}>
                    <SelectValue placeholder="Selecciona un cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asesor">Asesor</SelectItem>
                    <SelectItem value="Guía Turístico">Guía Turístico</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError message={formErrors.cargo} />
              </div>

              <div className="space-y-2">
                <Label>Contraseña inicial *</Label>
                <Input
                  type="password"
                  placeholder="Mín. 8 caracteres"
                  value={(formData as any).contrasena || ''}
                  onChange={(e) => {
                    clearFieldError('contrasena');
                    setFormData({ ...formData, contrasena: e.target.value } as any);
                  }}
                  onBlur={() => touchField('contrasena', 'create')}
                  className={inputClass(!!formErrors.contrasena)}
                  maxLength={128}
                  autoComplete="new-password"
                />
                <FieldError message={formErrors.contrasena} />
                <ul className="text-xs text-gray-500 space-y-0.5 mt-1">
                  {getEmployeePasswordRequirementChecks((formData as any).contrasena || '').map((req) => (
                    <li key={req.id} className={req.met ? 'text-green-700' : ''}>
                      {req.met ? '✓' : '○'} {req.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <Label>Confirmar contraseña *</Label>
                <Input
                  type="password"
                  placeholder="Repite la contraseña"
                  value={(formData as any).confirmarContrasena || ''}
                  onChange={(e) => {
                    clearFieldError('confirmarContrasena');
                    setFormData({ ...formData, confirmarContrasena: e.target.value } as any);
                  }}
                  onBlur={() => touchField('confirmarContrasena', 'create')}
                  className={inputClass(!!formErrors.confirmarContrasena)}
                  maxLength={128}
                  autoComplete="new-password"
                />
                <FieldError message={formErrors.confirmarContrasena} />
              </div>


              <div className="space-y-2">
                <Label>Estado inicial *</Label>
                <Select 
                  value={formData.estado} 
                  onValueChange={(value: any) => {
                    clearFieldError('estado');
                    setFormData({ ...formData, estado: value });
                    setTimeout(() => touchField('estado', 'create'), 0);
                  }}
                >
                  <SelectTrigger className={inputClass(!!formErrors.estado)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError message={formErrors.estado} />
              </div>
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
      <Dialog
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) setFormErrors({});
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-800">Editar empleado</DialogTitle>
            <DialogDescription>
              Modifica la información del empleado. Puedes actualizar documento y contraseña de acceso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => {
                    clearFieldError('nombre');
                    setFormData({ ...formData, nombre: sanitizeEmployeeNameInput(e.target.value) });
                  }}
                  onBlur={() => touchField('nombre', 'edit')}
                  className={inputClass(!!formErrors.nombre)}
                  maxLength={80}
                />
                <FieldError message={formErrors.nombre} />
              </div>

              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input
                  value={(formData as any).apellido || ''}
                  onChange={(e) => {
                    clearFieldError('apellido');
                    setFormData({ ...formData, apellido: sanitizeEmployeeNameInput(e.target.value) } as any);
                  }}
                  onBlur={() => touchField('apellido', 'edit')}
                  className={inputClass(!!formErrors.apellido)}
                  maxLength={80}
                />
                <FieldError message={formErrors.apellido} />
              </div>

              <div className="space-y-2">
                <Label>Tipo de documento *</Label>
                <Select
                  value={normalizeEmployeeDocType(formData.tipo_documento)}
                  onValueChange={(value) => {
                    clearFieldError('tipo_documento');
                    clearFieldError('documento');
                    setFormData({ ...formData, tipo_documento: value });
                    setTimeout(() => touchField('tipo_documento', 'edit'), 0);
                  }}
                >
                  <SelectTrigger className={inputClass(!!formErrors.tipo_documento || !!formErrors.documento)}>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_DOC_TYPES.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={formErrors.tipo_documento} />
              </div>

              <div className="space-y-2">
                <Label>Número de documento *</Label>
                <Input
                  placeholder="Ej: 1023456789"
                  value={formData.documento}
                  onChange={(e) => {
                    clearFieldError('documento');
                    setFormData({
                      ...formData,
                      documento: sanitizeDocumentInput(e.target.value),
                    });
                  }}
                  onBlur={() => touchField('documento', 'edit')}
                  className={inputClass(!!formErrors.documento)}
                  maxLength={20}
                />
                <FieldError message={formErrors.documento} />
              </div>

              <div className="md:col-span-2 rounded-lg border border-green-100 bg-green-50/40 p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-green-800">Acceso al sistema</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Correo y contraseña de inicio de sesión del empleado.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Correo electrónico *</Label>
                    <Input
                      type="email"
                      placeholder="empleado@occitours.com"
                      value={formData.email}
                      onChange={(e) => {
                        clearFieldError('email');
                        setFormData({ ...formData, email: e.target.value });
                      }}
                      onBlur={() => {
                        setFormData((prev) => ({
                          ...prev,
                          email: normalizeClientEmail(prev.email || ''),
                        }));
                        touchField('email', 'edit');
                      }}
                      className={inputClass(!!formErrors.email)}
                      maxLength={254}
                    />
                    <FieldError message={formErrors.email} />
                  </div>

                  <div className="space-y-2">
                    <Label>Contraseña</Label>
                    <div className="relative">
                      <Input
                        type={showEditPassword ? 'text' : 'password'}
                        placeholder="Nueva contraseña (opcional)"
                        value={(formData as any).contrasena || ''}
                        onChange={(e) => {
                          clearFieldError('contrasena');
                          setFormData({ ...formData, contrasena: e.target.value } as any);
                        }}
                        onBlur={() => touchField('contrasena', 'edit')}
                        className={cn(inputClass(!!formErrors.contrasena), 'pr-10')}
                        maxLength={128}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowEditPassword((prev) => !prev)}
                        aria-label={showEditPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <FieldError message={formErrors.contrasena} />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Confirmar contraseña</Label>
                    <div className="relative md:max-w-[calc(50%-0.5rem)]">
                      <Input
                        type={showEditConfirmPassword ? 'text' : 'password'}
                        placeholder="Repite la nueva contraseña"
                        value={(formData as any).confirmarContrasena || ''}
                        onChange={(e) => {
                          clearFieldError('confirmarContrasena');
                          setFormData({ ...formData, confirmarContrasena: e.target.value } as any);
                        }}
                        onBlur={() => touchField('confirmarContrasena', 'edit')}
                        className={cn(inputClass(!!formErrors.confirmarContrasena), 'pr-10')}
                        maxLength={128}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowEditConfirmPassword((prev) => !prev)}
                        aria-label={showEditConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                      >
                        {showEditConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <FieldError message={formErrors.confirmarContrasena} />
                    <ul className="text-xs text-gray-500 space-y-0.5 mt-1">
                      {getEmployeePasswordRequirementChecks((formData as any).contrasena || '').map((req) => (
                        <li key={req.id} className={req.met ? 'text-green-700' : ''}>
                          {req.met ? '✓' : '○'} {req.label}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-500">Déjala en blanco si no deseas cambiarla.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Teléfono *</Label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => {
                    clearFieldError('telefono');
                    setFormData({
                      ...formData,
                      telefono: sanitizeEmployeePhoneInput(e.target.value),
                    });
                  }}
                  onBlur={() => touchField('telefono', 'edit')}
                  className={inputClass(!!formErrors.telefono)}
                  maxLength={20}
                />
                <FieldError message={formErrors.telefono} />
              </div>

             <div className="space-y-2">
                <Label>Cargo *</Label>
                <Select 
                  value={(formData as any).cargo || ''}
                  onValueChange={(value: string) => {
                    clearFieldError('cargo');
                    setFormData({
                      ...formData,
                      cargo: value,
                      rol: cargoToRol(value),
                    } as any);
                    setTimeout(() => touchField('cargo', 'edit'), 0);
                  }}
                >
                  <SelectTrigger className={inputClass(!!formErrors.cargo)}>
                    <SelectValue placeholder="Selecciona un cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asesor">Asesor</SelectItem>
                    <SelectItem value="Guía Turístico">Guía Turístico</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError message={formErrors.cargo} />
              </div>

              <div className="space-y-2">
                <Label>Estado *</Label>
                <Select 
                  value={formData.estado} 
                  onValueChange={(value: any) => {
                    clearFieldError('estado');
                    setFormData({ ...formData, estado: value });
                    setTimeout(() => touchField('estado', 'edit'), 0);
                  }}
                >
                  <SelectTrigger className={inputClass(!!formErrors.estado)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                    <SelectItem value="Suspendido">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError message={formErrors.estado} />
              </div>
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
      <Dialog
        open={showViewModal}
        onOpenChange={(open) => {
          setShowViewModal(open);
          if (!open) {
            setGuideProgramaciones([]);
            setLoadingGuideProgramaciones(false);
            setGuideAssignmentsPage(1);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

                </div>
              </div>

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

              {isGuideEmployee(selectedEmployee) && (
                <div className="space-y-6">
                  <GuideAvailabilityCalendar
                    programaciones={guideProgramaciones}
                    loading={loadingGuideProgramaciones}
                  />

                  <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      Rutas asignadas
                    </h4>
                    {!loadingGuideProgramaciones && guideProgramaciones.length > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {guideProgramaciones.length} en total
                      </Badge>
                    )}
                  </div>

                  {loadingGuideProgramaciones ? null : guideProgramaciones.length === 0 ? (
                    <Card className="border-dashed border-green-200">
                      <CardContent className="py-6 text-center text-sm text-gray-500">
                        Este guía no tiene rutas asignadas por el momento.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="rounded-lg border border-green-100 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-green-50/60">
                            <TableHead>Ruta</TableHead>
                            <TableHead>Salida</TableHead>
                            <TableHead>Regreso</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Cupos</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedGuideProgramaciones.map((prog) => (
                            <TableRow key={prog.id_programacion}>
                              <TableCell className="font-medium text-gray-900">
                                {prog.ruta_nombre || `Ruta #${prog.id_ruta}`}
                              </TableCell>
                              <TableCell className="text-sm text-gray-700">
                                {formatDateDisplay(prog.fecha_salida)}
                                {prog.hora_salida ? (
                                  <span className="block text-xs text-gray-500">{prog.hora_salida}</span>
                                ) : null}
                              </TableCell>
                              <TableCell className="text-sm text-gray-700">
                                {formatDateDisplay(prog.fecha_regreso)}
                                {prog.hora_regreso ? (
                                  <span className="block text-xs text-gray-500">{prog.hora_regreso}</span>
                                ) : null}
                              </TableCell>
                              <TableCell>
                                <Badge className={programacionEstadoBadgeClass(prog.estado)}>
                                  {programacionEstadoLabel(prog.estado)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-sm text-gray-700">
                                {prog.cupos_disponibles ?? '—'} / {prog.cupos_totales ?? '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {totalGuideAssignmentPages > 1 && (
                        <div className="flex items-center justify-between px-3 py-3 border-t border-green-100 bg-green-50/30">
                          <p className="text-xs text-gray-600">
                            Mostrando {guideAssignmentsStartIndex + 1} a{' '}
                            {Math.min(
                              guideAssignmentsStartIndex + guideAssignmentsPerPage,
                              guideProgramaciones.length,
                            )}{' '}
                            de {guideProgramaciones.length} rutas
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setGuideAssignmentsPage((p) => Math.max(1, p - 1))}
                              disabled={guideAssignmentsPage === 1}
                              className="border-green-200 text-green-700 hover:bg-green-50 h-8"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-xs text-gray-600">
                              Página {guideAssignmentsPage} de {totalGuideAssignmentPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setGuideAssignmentsPage((p) =>
                                  Math.min(totalGuideAssignmentPages, p + 1),
                                )
                              }
                              disabled={guideAssignmentsPage === totalGuideAssignmentPages}
                              className="border-green-200 text-green-700 hover:bg-green-50 h-8"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                </div>
              )}

              {/* Estadísticas */}
              <div className="space-y-3">
                <h4 className="text-gray-700">Estadísticas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-green-200">
                    <CardContent className="pt-6">
                      <p className="text-sm text-gray-600">Asignaciones activas</p>
                      <p className="text-2xl text-green-800">
                        {isGuideEmployee(selectedEmployee)
                          ? guideAsignacionesActivas
                          : selectedEmployee.asignaciones_activas || 0}
                      </p>
                    </CardContent>
                  </Card>

                  {(isGuideEmployee(selectedEmployee)
                    ? guideUltimaAsignacion
                    : selectedEmployee.ultima_asignacion) && (
                    <Card className="border-blue-200">
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-600">Última asignación</p>
                        <p className="text-sm text-gray-800">
                          {formatDateDisplay(
                            isGuideEmployee(selectedEmployee)
                              ? guideUltimaAsignacion
                              : selectedEmployee.ultima_asignacion,
                          )}
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

      {/* Dialog: Confirmar cambio de estado */}
      <AlertDialog
        open={showStatusConfirmDialog}
        onOpenChange={(open) => {
          if (!open && !applyingStatusChange) {
            setShowStatusConfirmDialog(false);
            setPendingStatusChange(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar cambio de estado?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Vas a cambiar el estado de{' '}
                  <span className="font-semibold text-gray-900">{pendingStatusChange?.employeeName}</span>
                  {' '}de{' '}
                  <span className="font-semibold text-gray-900">{pendingStatusChange?.estadoAnterior}</span>
                  {' '}a{' '}
                  <span className="font-semibold text-gray-900">{pendingStatusChange?.estadoNuevo}</span>.
                </p>
                {pendingStatusChange?.estadoNuevo === 'Activo' ? (
                  <p>El empleado recuperará el acceso al sistema.</p>
                ) : (
                  <p>El empleado no podrá iniciar sesión mientras permanezca inactivo o suspendido.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applyingStatusChange}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmStatusChange();
              }}
              disabled={applyingStatusChange}
              className="bg-green-600 hover:bg-green-700"
            >
              {applyingStatusChange ? 'Aplicando...' : 'Confirmar cambio'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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