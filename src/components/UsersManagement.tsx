import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Filter,
  Plus,
  Save,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';
import { rolesAPI, usersAPI } from '../services/api';
import {
  buildUserValidationContext,
  getClientPasswordRequirementChecks,
  normalizeClientEmail,
  sanitizeDocumentInput,
  sanitizePhoneInput,
  sanitizeUserNameInput,
  USER_NAME_LIMITS,
  validateUserFormFields,
  validateUserFormForSubmit,
  validateUserSingleField,
  type UserFormInput,
} from '../utils/userFormValidation';
import { cn } from './ui/utils';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

type RolOption = {
  id_roles: number;
  nombre: string;
  estado?: boolean;
};

type UserRow = {
  id: string;
  id_usuarios?: number | string;
  name: string;
  email: string;
  numero_documento: string;
  tipo_documento: string;
  role: string;
  status: 'Activo' | 'Inactivo' | string;
  phone: string;
  joinDate: string;
  fecha_creacion?: string | null;
};

type UserFormData = {
  nombre?: string;
  apellido?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: 'Activo' | 'Inactivo' | string;
  documentType?: string;
  documentNumber?: string;
  password?: string;
  confirmPassword?: string;
};

function limpiarValorFormulario(value?: string | null) {
  const t = String(value ?? '').trim();
  if (!t || t === '−' || t === '-') return '';
  return t;
}

function buildUserFormInput(data: UserFormData): UserFormInput {
  return {
    nombre: data.nombre || '',
    apellido: data.apellido || '',
    email: data.email || '',
    phone: data.phone || '',
    role: data.role || '',
    status: data.status || 'Activo',
    documentType: data.documentType || '',
    documentNumber: data.documentNumber || '',
    password: data.password || '',
    confirmPassword: data.confirmPassword || '',
  };
}

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

function formatearFechaUsuario(fecha?: string | null) {
  if (!fecha) return '−';

  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) return fecha;

  return fechaObj.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

const DOCUMENT_TYPE_VALUES = ['C.C.', 'C.E.', 'Pasaporte', 'T.I.', 'NIT'] as const;

function normalizeComparable(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function normalizeRoleLabel(raw: unknown): string {
  const normalized = normalizeComparable(raw);
  const roleMap: Record<string, string> = {
    administrador: 'Administrador',
    admin: 'Administrador',
    asesor: 'Asesor',
    advisor: 'Asesor',
    guia: 'Guía Turístico',
    guiaturistico: 'Guía Turístico',
    guide: 'Guía Turístico',
    cliente: 'Cliente',
    client: 'Cliente',
    sinperfil: 'Sin perfil',
  };
  return roleMap[normalized] || String(raw ?? '').trim() || 'Cliente';
}

function normalizeDocumentType(raw: unknown): string {
  const value = String(raw ?? '').trim();
  if (!value || value === '−' || value === '-') return '−';
  const normalized = normalizeComparable(value);
  if (normalized === 'cc' || normalized.includes('ceduladeciudadania')) return 'C.C.';
  if (normalized === 'ce' || normalized.includes('ceduladeextranjeria')) return 'C.E.';
  if (normalized === 'pasaporte' || normalized === 'passport') return 'Pasaporte';
  if (normalized === 'ti' || normalized.includes('tarjetadeidentidad')) return 'T.I.';
  if (normalized === 'nit') return 'NIT';
  const direct = DOCUMENT_TYPE_VALUES.find((item) => normalizeComparable(item) === normalized);
  return direct || value;
}

function mapearUsuarioBackend(usuario: any): UserRow {
  const nombreCompleto = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim();

  const rolRaw = (usuario?.rol_nombre || usuario?.rol || usuario?.role || usuario?.tipo_usuario || '').toString();

  const estadoRaw = usuario?.estado;
  const estado = typeof estadoRaw === 'boolean'
    ? (estadoRaw ? 'Activo' : 'Inactivo')
    : ((estadoRaw || 'Activo').toString());

  return {
    id: String(usuario?.id_usuarios ?? usuario?.id_usuario ?? usuario?.id ?? usuario?.correo ?? Date.now()),
    id_usuarios: usuario?.id_usuarios ?? usuario?.id_usuario ?? usuario?.id,
    name: nombreCompleto || usuario?.correo || usuario?.email || 'Sin nombre',
    email: usuario?.correo || usuario?.email || '−',
    numero_documento: usuario?.numero_documento || '−',
    tipo_documento: normalizeDocumentType(usuario?.tipo_documento),
    role: normalizeRoleLabel(rolRaw),
    status: estado,
    phone: usuario?.telefono || usuario?.phone || '−',
    joinDate: formatearFechaUsuario(
      usuario?.fecha_ingreso ||
      usuario?.fecha_contratacion ||
      usuario?.fecha_registro ||
      usuario?.fecha_creacion ||
      usuario?.created_at
    ),
    fecha_creacion: usuario?.fecha_creacion || usuario?.fecha_registro || usuario?.created_at || null,
  };
}

export function UsersManagement() {
  const permisos = usePermissions();
  const usuariosPerms = createModulePermissions(permisos, 'Usuarios');
  const canViewUsers = usuariosPerms.canView();
  const canCreateUser = usuariosPerms.canCreate();
  const canEditUser = usuariosPerms.canEdit();
  const canDeleteUser = usuariosPerms.canDelete();

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<RolOption[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('__all__');
  const [statusFilter, setStatusFilter] = useState<string>('__all__');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('__all__');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UserRow | null>(null);
  const [formData, setFormData] = useState<UserFormData>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const cargarRoles = async () => {
    try {
      const rolesData: any[] = await rolesAPI.getAll();
      const parsed: RolOption[] = (rolesData || [])
        .map((rol: any) => ({
          id_roles: Number(rol?.id_roles),
          nombre: String(rol?.nombre || ''),
          estado: rol?.estado,
        }))
        .filter((rol) => Number.isFinite(rol.id_roles) && rol.nombre);
      setRoles(parsed);
    } catch (err) {
      console.error('Error al cargar roles:', err);
    }
  };

  const cargarUsuarios = async () => {
    if (!canViewUsers) return;

    setLoading(true);
    try {
      const usuariosData = await usersAPI.getAll();
      setUsers((usuariosData || []).map(mapearUsuarioBackend));
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast.error('Error al cargar usuarios desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarRoles();
    void cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, documentTypeFilter]);

  const roleOptions = useMemo(() => {
    const fromApi = roles.map((r) => normalizeRoleLabel(r.nombre)).filter(Boolean);
    const fromUsers = users.map((u) => u.role).filter(Boolean);
    return [...new Set([...fromApi, ...fromUsers])].sort((a, b) => a.localeCompare(b, 'es'));
  }, [roles, users]);

  const documentTypeOptions = useMemo(() => {
    const tipos = users
      .map((u) => normalizeDocumentType(u.tipo_documento))
      .filter((t) => t && t !== '−');
    return [...new Set([...DOCUMENT_TYPE_VALUES, ...tipos])].sort((a, b) => a.localeCompare(b, 'es'));
  }, [users]);

  const hasActiveFilters =
    roleFilter !== '__all__' || statusFilter !== '__all__' || documentTypeFilter !== '__all__';

  const clearFilters = () => {
    setRoleFilter('__all__');
    setStatusFilter('__all__');
    setDocumentTypeFilter('__all__');
  };

  const filteredUsers = useMemo(() => {
    return users.filter((item) => {
      if (roleFilter !== '__all__' && item.role !== roleFilter) return false;
      if (statusFilter !== '__all__') {
        const st = String(item.status || '').toLowerCase();
        if (statusFilter === 'Activo' && st !== 'activo') return false;
        if (statusFilter === 'Inactivo' && st !== 'inactivo') return false;
      }
      if (documentTypeFilter !== '__all__' && item.tipo_documento !== documentTypeFilter) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const searchable = [
        item.name,
        item.email,
        item.numero_documento,
        item.tipo_documento,
        item.role,
        item.status,
        item.phone,
        item.joinDate,
      ]
        .join(' ')
        .toLowerCase();
      return searchable.includes(term);
    });
  }, [users, searchTerm, roleFilter, statusFilter, documentTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedData = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const validationContext = useMemo(
    () =>
      buildUserValidationContext(
        users.map((u) => ({
          id: u.id,
          email: u.email,
          numero_documento: u.numero_documento,
        })),
        selectedItem?.id,
      ),
    [users, selectedItem?.id],
  );

  const resetFormState = () => {
    setFormData({});
    setFormErrors({});
    setTouchedFields({});
    setSelectedItem(null);
  };

  const clearFieldError = (field: string) => {
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const touchField = (
    field: string,
    mode: 'create' | 'edit',
    data?: UserFormData,
  ) => {
    const msg = validateUserSingleField(
      field,
      buildUserFormInput(data ?? formData),
      mode,
      validationContext,
    );
    setFormErrors((prev) => {
      const next = { ...prev };
      if (msg) next[field] = msg;
      else delete next[field];
      return next;
    });
  };

  const touchFields = (
    fields: string[],
    mode: 'create' | 'edit',
    data?: UserFormData,
  ) => {
    const input = buildUserFormInput(data ?? formData);
    const allErrors = validateUserFormFields(input, mode, validationContext);
    setFormErrors((prev) => {
      const next = { ...prev };
      for (const field of fields) {
        if (allErrors[field]) next[field] = allErrors[field];
        else delete next[field];
      }
      return next;
    });
  };

  const markTouched = (field: string) => {
    setTouchedFields((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const updateFormField = (
    field: keyof UserFormData,
    value: string,
    mode: 'create' | 'edit',
    relatedFields: string[] = [],
  ) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      const fieldsToValidate = [field, ...relatedFields];

      setTouchedFields((prevTouched) => {
        const shouldValidate = fieldsToValidate.some((f) => prevTouched[f]);
        if (shouldValidate) {
          const allErrors = validateUserFormFields(
            buildUserFormInput(next),
            mode,
            validationContext,
          );
          setFormErrors((prevErrors) => {
            const updated = { ...prevErrors };
            for (const f of fieldsToValidate) {
              if (allErrors[f]) updated[f] = allErrors[f];
              else delete updated[f];
            }
            return updated;
          });
        } else {
          setFormErrors((prevErrors) => {
            const updated = { ...prevErrors };
            fieldsToValidate.forEach((f) => {
              delete updated[f];
            });
            return updated;
          });
        }
        return prevTouched;
      });

      return next;
    });
  };

  const blurField = (
    field: string,
    mode: 'create' | 'edit',
    relatedFields: string[] = [],
    transform?: (current: UserFormData) => UserFormData,
  ) => {
    const nextData = transform ? transform(formData) : formData;
    if (transform) setFormData(nextData);
    setTouchedFields((prev) => {
      const next = { ...prev, [field]: true };
      relatedFields.forEach((f) => {
        next[f] = true;
      });
      return next;
    });
    touchFields([field, ...relatedFields], mode, nextData);
  };

  const openCreate = () => {
    if (!canCreateUser) {
      toast.error(usuariosPerms.getErrorMessage('crear'));
      return;
    }

    setSelectedItem(null);
    setFormErrors({});
    setTouchedFields({});
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      phone: '',
      role:
        roleOptions.find((r) => normalizeComparable(r) === normalizeComparable('Cliente')) ||
        roleOptions[0] ||
        'Cliente',
      status: 'Activo',
      documentType: 'C.C.',
      documentNumber: '',
      password: '',
      confirmPassword: '',
    });
    setIsCreateModalOpen(true);
  };

  const openEdit = (item: UserRow) => {
    if (!canEditUser) {
      toast.error(usuariosPerms.getErrorMessage('editar'));
      return;
    }

    const partes = (item.name || '').trim().split(/\s+/);
    const nombre = partes[0] || '';
    const apellido = partes.slice(1).join(' ') || '';

    setSelectedItem(item);
    setFormErrors({});
    setTouchedFields({});
    setFormData({
      nombre,
      apellido,
      email: limpiarValorFormulario(item.email),
      phone: limpiarValorFormulario(item.phone),
      role: item.role,
      status: item.status,
      documentType: limpiarValorFormulario(item.tipo_documento) || 'C.C.',
      documentNumber: limpiarValorFormulario(item.numero_documento),
      password: '',
      confirmPassword: '',
    });
    setIsEditModalOpen(true);
  };

  const openView = (item: UserRow) => {
    if (!canViewUsers) {
      toast.error(usuariosPerms.getErrorMessage('ver'));
      return;
    }

    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  const onDelete = async (item: UserRow) => {
    if (!canDeleteUser) {
      toast.error(usuariosPerms.getErrorMessage('eliminar'));
      return;
    }

    try {
      const idUsuario = item.id_usuarios || item.id;
      await usersAPI.delete(idUsuario);
      setUsers((prev) => prev.filter((u) => u.id !== item.id));
      toast.success('Usuario eliminado correctamente');
    } catch (error: any) {
      toast.error(error?.message || 'Error al eliminar el usuario');
    }
  };

  const onToggleStatus = async (item: UserRow) => {
    if (!canEditUser) {
      toast.error(usuariosPerms.getErrorMessage('editar'));
      return;
    }

    const newStatus = item.status === 'Activo' ? 'Inactivo' : 'Activo';

    const optimistic = users;
    setUsers((prev) => prev.map((u) => (u.id === item.id ? { ...u, status: newStatus } : u)));

    try {
      const idUsuario = item.id_usuarios || item.id;
      await usersAPI.update(idUsuario, {
        estado: newStatus === 'Activo',
      });
      toast.success(`Usuario ${newStatus === 'Activo' ? 'activado' : 'desactivado'} exitosamente`);
    } catch (err: any) {
      setUsers(optimistic);
      toast.error(err?.message || 'Error al actualizar el estado del usuario');
    }
  };

  const handleSave = async () => {
    const isEdit = Boolean(selectedItem);
    if (!isEdit && !canCreateUser) {
      toast.error(usuariosPerms.getErrorMessage('crear'));
      return;
    }
    if (isEdit && !canEditUser) {
      toast.error(usuariosPerms.getErrorMessage('editar'));
      return;
    }

    const input = buildUserFormInput(formData);
    const errors = validateUserFormFields(input, isEdit ? 'edit' : 'create', validationContext);
    setFormErrors(errors);
    setTouchedFields({
      nombre: true,
      apellido: true,
      email: true,
      phone: true,
      role: true,
      documentType: true,
      documentNumber: true,
      status: true,
      password: true,
      confirmPassword: true,
    });
    const summary = validateUserFormForSubmit(input, isEdit ? 'edit' : 'create', validationContext);
    if (summary) {
      toast.error(summary);
      return;
    }

    const estadoString = input.status || 'Activo';
    const roleName = input.role;
    const matchedRole = roles.find(
      (r) => normalizeComparable(r.nombre) === normalizeComparable(roleName),
    );
    const roleId = matchedRole?.id_roles ?? null;
    const backendRoleName = matchedRole?.nombre || roleName;

    const payload: Record<string, unknown> = {
      nombre: input.nombre.trim(),
      apellido: input.apellido.trim(),
      correo: normalizeClientEmail(input.email),
      telefono: sanitizePhoneInput(input.phone),
      numero_documento: sanitizeDocumentInput(input.documentNumber),
      tipo_documento: normalizeDocumentType(input.documentType),
      id_roles: roleId,
      rol_nombre: backendRoleName,
      perfil: normalizeComparable(roleName).includes('cliente') ? 'cliente' : 'empleado',
      estado: estadoString === 'Activo',
    };

    if (!isEdit) {
      payload.contrasena = input.password;
    }

    setIsSaving(true);
    try {
      if (isEdit && selectedItem) {
        const idUsuario = selectedItem.id_usuarios || selectedItem.id;
        await usersAPI.update(idUsuario, payload);
        toast.success('Usuario actualizado correctamente');
        setIsEditModalOpen(false);
        resetFormState();
      } else {
        const resp: any = await usersAPI.create(payload);
        if (resp?.emailSent) {
          toast.success(
            resp?.message ||
              'Usuario creado. Las credenciales se enviaron al correo del usuario.',
          );
        } else {
          toast.warning(
            resp?.message ||
              'Usuario creado, pero no se pudo enviar el correo con la contraseña. Verifica SMTP en el servidor.',
          );
        }
        setIsCreateModalOpen(false);
        resetFormState();
      }
      await cargarUsuarios();
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar el usuario');
    } finally {
      setIsSaving(false);
    }
  };

  if (!permisos.loadingRoles && !canViewUsers) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <p className="text-red-700 font-semibold">Acceso denegado</p>
            <p className="text-gray-700">No tienes permiso para ver usuarios.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const columns = ['Nombre', 'Email', 'Documento', 'Tipo Documento', 'Rol', 'Estado', 'Teléfono', 'Acciones'];

  const passwordChecks = getClientPasswordRequirementChecks(formData.password || '');

  const renderForm = (isEdit: boolean) => {
    const formMode = isEdit ? 'edit' : 'create';

    return (
    <div className="space-y-6 max-h-[min(70vh,520px)] overflow-y-auto pr-1">
      <div className="space-y-4">
        <h4 className="font-medium text-green-900">Información básica</h4>
        <p className="text-xs text-gray-500">Los campos marcados con * son obligatorios.</p>
        {!isEdit ? (
          <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
            Al crear la cuenta, la contraseña se enviará al correo del usuario. En el mensaje se
            indicará que puede cambiarla cuando quiera desde <strong>Mi Perfil → Seguridad</strong>.
          </p>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={isEdit ? 'edit-nombre' : 'create-nombre'}>Nombre *</Label>
            <Input
              id={isEdit ? 'edit-nombre' : 'create-nombre'}
              value={formData.nombre || ''}
              maxLength={USER_NAME_LIMITS.max}
              onChange={(e) =>
                updateFormField('nombre', sanitizeUserNameInput(e.target.value), formMode)
              }
              onBlur={() => blurField('nombre', formMode)}
              placeholder="Ingrese el nombre"
              className={inputClass(!!formErrors.nombre)}
            />
            <FieldError message={formErrors.nombre} />
          </div>
          <div>
            <Label htmlFor={isEdit ? 'edit-apellido' : 'create-apellido'}>Apellido *</Label>
            <Input
              id={isEdit ? 'edit-apellido' : 'create-apellido'}
              value={formData.apellido || ''}
              maxLength={USER_NAME_LIMITS.max}
              onChange={(e) =>
                updateFormField('apellido', sanitizeUserNameInput(e.target.value), formMode)
              }
              onBlur={() => blurField('apellido', formMode)}
              placeholder="Ingrese el apellido"
              className={inputClass(!!formErrors.apellido)}
            />
            <FieldError message={formErrors.apellido} />
          </div>

          <div>
            <Label htmlFor={isEdit ? 'edit-email' : 'create-email'}>Correo electrónico *</Label>
            <Input
              id={isEdit ? 'edit-email' : 'create-email'}
              type="email"
              value={formData.email || ''}
              maxLength={254}
              onChange={(e) => updateFormField('email', e.target.value, formMode)}
              onBlur={() =>
                blurField('email', formMode, [], (current) => ({
                  ...current,
                  email: normalizeClientEmail(current.email || ''),
                }))
              }
              placeholder="correo@ejemplo.com"
              className={inputClass(!!formErrors.email)}
            />
            <FieldError message={formErrors.email} />
          </div>
          <div>
            <Label htmlFor={isEdit ? 'edit-phone' : 'create-phone'}>Teléfono *</Label>
            <Input
              id={isEdit ? 'edit-phone' : 'create-phone'}
              value={formData.phone || ''}
              maxLength={20}
              onChange={(e) =>
                updateFormField('phone', sanitizePhoneInput(e.target.value), formMode)
              }
              onBlur={() => blurField('phone', formMode)}
              placeholder="+57 300 000 0000"
              className={inputClass(!!formErrors.phone)}
            />
            <FieldError message={formErrors.phone} />
          </div>

          <div>
            <Label htmlFor={isEdit ? 'edit-role' : 'create-role'}>Rol *</Label>
            <Select
              value={formData.role || ''}
              onValueChange={(value) => {
                updateFormField('role', value, formMode);
                markTouched('role');
                touchField('role', formMode, { ...formData, role: value });
              }}
            >
              <SelectTrigger className={inputClass(!!formErrors.role)}>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {[...new Set(
                  roles
                  .filter((rol) => rol.estado !== false)
                  .map((rol) => normalizeRoleLabel(rol.nombre)),
                )]
                  .map((roleLabel) => (
                    <SelectItem key={roleLabel} value={roleLabel}>
                      {roleLabel}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <FieldError message={formErrors.role} />
          </div>

          <div>
            <Label htmlFor={isEdit ? 'edit-documentType' : 'create-documentType'}>Tipo de documento *</Label>
            <Select
              value={formData.documentType || ''}
              onValueChange={(value) => {
                updateFormField('documentType', value, formMode, ['documentNumber']);
                markTouched('documentType');
                touchFields(['documentType', 'documentNumber'], formMode, {
                  ...formData,
                  documentType: value,
                });
              }}
            >
              <SelectTrigger className={inputClass(!!formErrors.documentType || !!formErrors.documentNumber)}>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="C.C.">Cédula de Ciudadanía (C.C.)</SelectItem>
                <SelectItem value="C.E.">Cédula de Extranjería (C.E.)</SelectItem>
                <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                <SelectItem value="T.I.">Tarjeta de Identidad (T.I.)</SelectItem>
                <SelectItem value="NIT">NIT</SelectItem>
              </SelectContent>
            </Select>
            <FieldError message={formErrors.documentType} />
          </div>

          <div>
            <Label htmlFor={isEdit ? 'edit-documentNumber' : 'create-documentNumber'}>Número de documento *</Label>
            <Input
              id={isEdit ? 'edit-documentNumber' : 'create-documentNumber'}
              type="text"
              value={formData.documentNumber || ''}
              maxLength={20}
              onChange={(e) =>
                updateFormField(
                  'documentNumber',
                  sanitizeDocumentInput(e.target.value),
                  formMode,
                  ['documentType'],
                )
              }
              onBlur={() => blurField('documentNumber', formMode, ['documentType'])}
              placeholder="Ingrese el número de documento"
              className={inputClass(!!formErrors.documentNumber)}
            />
            <FieldError message={formErrors.documentNumber} />
          </div>

          <div>
            <Label htmlFor={isEdit ? 'edit-status' : 'create-status'}>Estado *</Label>
            <Select
              value={formData.status || 'Activo'}
              onValueChange={(value) => {
                updateFormField('status', value, formMode);
                markTouched('status');
                touchField('status', formMode, { ...formData, status: value });
              }}
            >
              <SelectTrigger className={inputClass(!!formErrors.status)}>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <FieldError message={formErrors.status} />
          </div>

          {!isEdit ? (
            <>
              <div className="md:col-span-2">
                <Label htmlFor="create-password">Contraseña *</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={formData.password || ''}
                  maxLength={64}
                  onChange={(e) =>
                    updateFormField('password', e.target.value, formMode, ['confirmPassword'])
                  }
                  onBlur={() => blurField('password', formMode, ['confirmPassword'])}
                  placeholder="Contraseña segura"
                  className={inputClass(!!formErrors.password)}
                />
                <FieldError message={formErrors.password} />
                <ul className="mt-2 space-y-1">
                  {passwordChecks.map((check) => (
                    <li
                      key={check.id}
                      className={`text-xs ${check.met ? 'text-green-700' : 'text-gray-500'}`}
                    >
                      {check.met ? '✓' : '○'} {check.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="create-confirm-password">Confirmar contraseña *</Label>
                <Input
                  id="create-confirm-password"
                  type="password"
                  value={formData.confirmPassword || ''}
                  maxLength={64}
                  onChange={(e) =>
                    updateFormField('confirmPassword', e.target.value, formMode, ['password'])
                  }
                  onBlur={() => blurField('confirmPassword', formMode, ['password'])}
                  placeholder="Repita la contraseña"
                  className={inputClass(!!formErrors.confirmPassword)}
                />
                <FieldError message={formErrors.confirmPassword} />
              </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                La contraseña <strong>no se puede modificar</strong> al editar el usuario. Si debe
                cambiarla, el propio usuario puede hacerlo cuando quiera en{' '}
                <strong>Mi Perfil → Seguridad</strong>.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button
          variant="outline"
          disabled={isSaving}
          onClick={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            resetFormState();
          }}
        >
          Cancelar
        </Button>
        <Button onClick={() => void handleSave()} disabled={loading || isSaving} className="bg-green-600 hover:bg-green-700">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </div>
    );
  };

  return (
    <div className="space-y-6 min-w-0 w-full max-w-full">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="text-2xl font-semibold text-green-800">Gestión de usuarios</h1>
        <p className="text-gray-600 text-sm">
          Administra cuentas del sistema, roles, documentos y estado de acceso.
        </p>
      </motion.div>

      {/* Header Actions */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between min-w-0"
      >
        <div className="flex flex-col gap-3 w-full min-w-0 lg:flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="relative flex-1 min-w-[200px] max-w-md"
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 w-4 h-4" />
            <Input
              placeholder="Buscar por nombre, correo, documento, teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-10 w-full border-green-200 focus:border-green-400"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-green-200 hover:bg-green-50 hover:border-green-400"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <Filter className="w-4 h-4 mr-2 text-green-600" />
              <span className="text-green-700">Filtros</span>
              {hasActiveFilters ? (
                <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-800">
                  Activos
                </Badge>
              ) : null}
            </Button>
          </motion.div>
          </div>

          {filtersOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-col sm:flex-row flex-wrap gap-3 rounded-lg border border-green-100 bg-green-50/50 p-4"
            >
              <div className="space-y-1.5 min-w-[160px] flex-1">
                <Label className="text-xs text-green-800">Rol</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="border-green-200 bg-white">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos los roles</SelectItem>
                    {roleOptions.map((nombre) => (
                      <SelectItem key={nombre} value={nombre}>
                        {nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 min-w-[160px] flex-1">
                <Label className="text-xs text-green-800">Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-green-200 bg-white">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 min-w-[160px] flex-1">
                <Label className="text-xs text-green-800">Tipo de documento</Label>
                <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                  <SelectTrigger className="border-green-200 bg-white">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    {documentTypeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-green-800 hover:bg-green-100"
                  disabled={!hasActiveFilters && !searchTerm.trim()}
                  onClick={() => {
                    clearFilters();
                    setSearchTerm('');
                  }}
                >
                  Limpiar búsqueda y filtros
                </Button>
              </div>
            </motion.div>
          ) : null}
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="flex shrink-0 items-center space-x-2 self-start"
        >
          {canCreateUser && (
            <>
              <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Crear usuario
              </Button>
              <Dialog
                open={isCreateModalOpen}
                onOpenChange={(open) => {
                  setIsCreateModalOpen(open);
                  if (!open) resetFormState();
                }}
              >
                <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-green-800">Crear usuario</DialogTitle>
                    <DialogDescription>
                      Complete los campos para registrar un nuevo usuario en el sistema.
                    </DialogDescription>
                  </DialogHeader>
                  {renderForm(false)}
                </DialogContent>
              </Dialog>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="min-w-0 w-full"
      >
        <Card className="shadow-md border-green-100 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[920px]">
                <TableHeader>
                  <TableRow className="bg-green-50 hover:bg-green-50">
                    <TableHead className="text-green-800 min-w-[120px] max-w-[160px]">Nombre</TableHead>
                    <TableHead className="text-green-800 min-w-[160px] max-w-[220px]">Email</TableHead>
                    <TableHead className="text-green-800 min-w-[100px]">Documento</TableHead>
                    <TableHead className="text-green-800 min-w-[90px]">Tipo Documento</TableHead>
                    <TableHead className="text-green-800 min-w-[100px]">Rol</TableHead>
                    <TableHead className="text-green-800 w-[90px]">Estado</TableHead>
                    <TableHead className="text-green-800 min-w-[110px] max-w-[140px]">Teléfono</TableHead>
                    <TableHead className="text-green-800 sticky right-0 z-10 bg-green-50 min-w-[168px]">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                        Cargando usuarios...
                      </TableCell>
                    </TableRow>
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((item) => (
                      <TableRow key={item.id} className="group">
                        <TableCell className="font-medium max-w-[160px] truncate" title={item.name}>
                          {item.name}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate" title={item.email}>
                          {item.email}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate" title={item.numero_documento}>
                          {item.numero_documento}
                        </TableCell>
                        <TableCell>{item.tipo_documento}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="whitespace-nowrap">
                            {item.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={item.status === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate" title={item.phone}>
                          {item.phone}
                        </TableCell>
                        <TableCell className="sticky right-0 z-10 bg-white group-hover:bg-muted/50">
                          <div className="flex flex-nowrap gap-1">
                            <Button size="sm" variant="outline" onClick={() => openView(item)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canEditUser && (
                              <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {canEditUser && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void onToggleStatus(item)}
                                className={
                                  item.status === 'Activo'
                                    ? 'hover:bg-yellow-50 hover:text-yellow-600'
                                    : 'hover:bg-green-50 hover:text-green-600'
                                }
                              >
                                {item.status === 'Activo' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              </Button>
                            )}
                            {canDeleteUser && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Se eliminará permanentemente al usuario{' '}
                                      <span className="font-semibold">{item.name}</span> ({item.email}).
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => void onDelete(item)}>Eliminar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                        {users.length === 0
                          ? 'No hay datos disponibles'
                          : 'No hay usuarios que coincidan con los filtros o la búsqueda'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 px-2 sm:px-4 min-w-0"
          >
            <div className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} de{' '}
              {filteredUsers.length} registro{filteredUsers.length === 1 ? '' : 's'}
              {users.length !== filteredUsers.length ? (
                <span className="text-gray-500"> (de {users.length} en total)</span>
              ) : null}
            </div>

            {totalPages > 1 ? (
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={
                      currentPage === pageNumber
                        ? 'bg-green-600 hover:bg-green-700 min-w-[36px]'
                        : 'border-green-200 hover:bg-green-50 min-w-[36px]'
                    }
                  >
                    {pageNumber}
                  </Button>
                ))}
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
            ) : null}
          </motion.div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) resetFormState();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-800">Editar usuario</DialogTitle>
            <DialogDescription>Modifique los campos que desea actualizar.</DialogDescription>
          </DialogHeader>
          {renderForm(true)}
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Detalles del Usuario</DialogTitle>
            <DialogDescription>Información completa del usuario seleccionado.</DialogDescription>
          </DialogHeader>
          {selectedItem ? (
            <div className="space-y-3">
              {[
                { label: 'Nombre', value: selectedItem.name },
                { label: 'Email', value: selectedItem.email },
                { label: 'Número de Documento', value: selectedItem.numero_documento },
                { label: 'Tipo de Documento', value: selectedItem.tipo_documento },
                { label: 'Rol', value: selectedItem.role },
                { label: 'Estado', value: selectedItem.status },
                { label: 'Teléfono', value: selectedItem.phone },
                { label: 'Fecha de Ingreso', value: selectedItem.joinDate },
              ].map((detail) => (
                <div key={detail.label} className="flex justify-between gap-4 py-2 border-b border-green-100">
                  <span className="font-medium shrink-0 text-green-800">{detail.label}:</span>
                  <span className="text-gray-600 text-right break-words max-w-md bg-green-50 px-2 py-1 rounded">{String(detail.value || '—')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No hay usuario seleccionado.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
