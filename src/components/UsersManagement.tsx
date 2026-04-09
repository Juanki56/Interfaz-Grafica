import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
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

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
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
};

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

function mapearUsuarioBackend(usuario: any): UserRow {
  const nombreCompleto = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim();

  const rolRaw = (usuario?.rol_nombre || usuario?.rol || usuario?.role || usuario?.tipo_usuario || '').toString();
  const rolNormalizado = rolRaw.toLowerCase().trim();
  const mapaRolVista: Record<string, string> = {
    administrador: 'Administrador',
    admin: 'Administrador',
    asesor: 'Asesor',
    advisor: 'Asesor',
    guía: 'Guía Turístico',
    guia: 'Guía Turístico',
    guide: 'Guía Turístico',
    cliente: 'Cliente',
    client: 'Cliente',
    sin_perfil: 'Sin perfil',
  };

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
    tipo_documento: usuario?.tipo_documento || '−',
    role: mapaRolVista[rolNormalizado] || rolRaw || 'Cliente',
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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UserRow | null>(null);
  const [formData, setFormData] = useState<UserFormData>({});

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
  }, [searchTerm]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();

    return users.filter((item) => {
      const searchable = Object.values(item).join(' ').toLowerCase();
      return searchable.includes(term);
    });
  }, [users, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedData = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openCreate = () => {
    if (!canCreateUser) {
      toast.error(usuariosPerms.getErrorMessage('crear'));
      return;
    }

    setSelectedItem(null);
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      phone: '',
      role: 'Cliente',
      status: 'Activo',
      documentType: '',
      documentNumber: '',
      password: '',
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
    setFormData({
      nombre,
      apellido,
      email: item.email,
      phone: item.phone,
      role: item.role,
      status: item.status,
      documentType: item.tipo_documento,
      documentNumber: item.numero_documento,
      password: '',
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

    const estadoString = formData.status || selectedItem?.status || 'Activo';

    const roleName = formData.role ?? selectedItem?.role ?? null;
    const roleId = roles.find((r) => r.nombre === roleName)?.id_roles ?? null;

    const payload: any = {
      nombre: formData.nombre ?? null,
      apellido: formData.apellido ?? null,
      correo: formData.email ?? null,
      telefono: formData.phone ?? null,
      numero_documento: formData.documentNumber ?? null,
      tipo_documento: formData.documentType ?? null,
      id_roles: roleId,
      rol_nombre: roleName,
      perfil: roleName === 'Cliente' ? 'cliente' : 'empleado',
      estado: estadoString === 'Activo',
    };

    if (!isEdit) {
      if (!formData.password) {
        toast.error('Debe ingresar una contraseña para el nuevo usuario');
        return;
      }
      payload.contrasena = formData.password;
    } else if (formData.password) {
      payload.contrasena = formData.password;
    }

    if (isEdit && selectedItem) {
      const idUsuario = selectedItem.id_usuarios || selectedItem.id;
      const previousUsers = users;

      const updatedLocal = mapearUsuarioBackend({
        ...selectedItem,
        id_usuarios: idUsuario,
        nombre: payload.nombre,
        apellido: payload.apellido,
        correo: payload.correo,
        telefono: payload.telefono,
        numero_documento: payload.numero_documento,
        tipo_documento: payload.tipo_documento,
        rol_nombre: payload.rol_nombre,
        estado: payload.estado,
        fecha_creacion: selectedItem.fecha_creacion,
      });

      setUsers((prev) => prev.map((u) => (u.id === selectedItem.id ? updatedLocal : u)));
      setIsEditModalOpen(false);
      setFormData({});
      setSelectedItem(null);

      try {
        await usersAPI.update(idUsuario, payload);
        toast.success('Usuario actualizado correctamente');
        void cargarUsuarios();
      } catch (err: any) {
        setUsers(previousUsers);
        toast.error(err?.message || 'Error al guardar el usuario');
      }

      return;
    }

    // CREATE
    setIsCreateModalOpen(false);
    setFormData({});

    try {
      await usersAPI.create(payload);
      toast.success('Usuario creado correctamente');
      void cargarUsuarios();
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear el usuario');
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

  const renderForm = (isEdit: boolean) => (
    <div className="space-y-6 max-h-96 overflow-y-auto">
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Información Básica</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={isEdit ? 'edit-nombre' : 'create-nombre'}>Nombre</Label>
            <Input
              id={isEdit ? 'edit-nombre' : 'create-nombre'}
              value={formData.nombre || ''}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ingrese el nombre"
            />
          </div>
          <div>
            <Label htmlFor={isEdit ? 'edit-apellido' : 'create-apellido'}>Apellido</Label>
            <Input
              id={isEdit ? 'edit-apellido' : 'create-apellido'}
              value={formData.apellido || ''}
              onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              placeholder="Ingrese el apellido"
            />
          </div>

          <div>
            <Label htmlFor={isEdit ? 'edit-email' : 'create-email'}>Email</Label>
            <Input
              id={isEdit ? 'edit-email' : 'create-email'}
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <Label htmlFor={isEdit ? 'edit-phone' : 'create-phone'}>Teléfono</Label>
            <Input
              id={isEdit ? 'edit-phone' : 'create-phone'}
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+57 300 000 0000"
            />
          </div>

          <div>
            <Label htmlFor={isEdit ? 'edit-role' : 'create-role'}>Rol</Label>
            <Select value={formData.role || ''} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {roles
                  .filter((rol) => rol.estado !== false)
                  .map((rol) => (
                    <SelectItem key={rol.id_roles} value={rol.nombre}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={isEdit ? 'edit-documentType' : 'create-documentType'}>Tipo de Documento</Label>
            <Select
              value={formData.documentType || ''}
              onValueChange={(value) => setFormData({ ...formData, documentType: value })}
            >
              <SelectTrigger>
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
          </div>

          <div>
            <Label htmlFor={isEdit ? 'edit-documentNumber' : 'create-documentNumber'}>Número de Documento</Label>
            <Input
              id={isEdit ? 'edit-documentNumber' : 'create-documentNumber'}
              type="text"
              value={formData.documentNumber || ''}
              onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
              placeholder="Ingrese el número de documento"
            />
          </div>

          <div>
            <Label htmlFor={isEdit ? 'edit-status' : 'create-status'}>Estado</Label>
            <Select
              value={formData.status || 'Activo'}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={isEdit ? 'edit-password' : 'create-password'}>Contraseña</Label>
            <Input
              id={isEdit ? 'edit-password' : 'create-password'}
              type="password"
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={isEdit ? 'Opcional (dejar vacío para no cambiar)' : 'Ingrese una contraseña'}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setFormData({});
            setSelectedItem(null);
          }}
        >
          Cancelar
        </Button>
        <Button onClick={() => void handleSave()} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          Guardar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
      >
        <div className="flex items-center space-x-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 w-4 h-4" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 border-green-200 focus:border-green-400"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button variant="outline" size="sm" className="border-green-200 hover:bg-green-50 hover:border-green-400">
              <Filter className="w-4 h-4 mr-2 text-green-600" />
              <span className="text-green-700">Filtros</span>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center space-x-2"
        >
          {canCreateUser && (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Usuarios
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Usuarios</DialogTitle>
                  <DialogDescription>Complete los campos para crear un nuevo usuario.</DialogDescription>
                </DialogHeader>
                {renderForm(false)}
              </DialogContent>
            </Dialog>
          )}
        </motion.div>
      </motion.div>

      {/* Data Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="shadow-md border-green-100">
          <CardContent className="p-0">
            <div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-green-50 hover:bg-green-50">
                    {columns.map((column) => (
                      <TableHead key={column} className="text-green-800">
                        {column}
                      </TableHead>
                    ))}
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
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{item.numero_documento}</TableCell>
                        <TableCell>{item.tipo_documento}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={item.status === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.phone}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
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
                                      Esta acción no se puede deshacer. Se eliminará permanentemente el usuario.
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
                        No hay datos disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {filteredUsers.length > 0 && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between mt-6 px-4"
          >
            <div className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} de {filteredUsers.length} registros
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
          </motion.div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuarios</DialogTitle>
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
