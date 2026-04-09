import React, { useState, useEffect } from 'react';
import { Shield, Users, Plus, Edit, Trash2, Eye, UserCheck, Search, Filter, MoreVertical, Settings, Key, Loader2, AlertTriangle } from 'lucide-react';
import { rolesAPI, usersAPI, permisosAPI, type Rol, type Permiso } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { toast } from 'sonner';
import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';

interface Permission {
  id_permisos: number;
  nombre: string;
  descripcion?: string | null;
  fecha_creacion?: string | null;
}

interface Role {
  id_roles: number;
  nombre: string;
  descripcion?: string;
  estado?: boolean;
  fecha_creacion?: string;
  permisos?: Permission[];
  userCount?: number;
  isSystem?: boolean;
  color?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinDate: string;
  lastActive?: string;
}

export function RoleManagement() {
  const permisos = usePermissions();
  const rolePerms = createModulePermissions(permisos, 'Roles');
  const canViewRoles = rolePerms.canView();
  const canCreateRole = rolePerms.canCreate();
  const canEditRole = rolePerms.canEdit();
  const canDeleteRole = rolePerms.canDelete();

  const [activeTab, setActiveTab] = useState('roles');
  const [loading, setLoading] = useState(true);
  const [loadingPermisos, setLoadingPermisos] = useState(false);
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState({
    nombre: '',
    descripcion: '',
    permisos: [] as number[]
  });
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [rolePendingDelete, setRolePendingDelete] = useState<Role | null>(null);
  const [reassignRoleId, setReassignRoleId] = useState<number | null>(null);

  const getRoleDescriptionText = (descripcion?: string | null) => {
    return descripcion && descripcion.trim()
      ? descripcion
      : 'Este rol no tiene descripción';
  };

  // Cargar permisos desde la base de datos
  useEffect(() => {
    if (permisos.loadingRoles) return;
    if (!canViewRoles) {
      setRoles([]);
      setPermissions([]);
      setLoading(false);
      return;
    }
    cargarPermisos();
    cargarRoles();
  }, [permisos.loadingRoles, canViewRoles]);

  const cargarPermisos = async () => {
    try {
      setLoadingPermisos(true);
      const permisosData = await permisosAPI.getAll();
      setPermissions(permisosData || []);
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      toast.error('Error al cargar permisos del backend');
    } finally {
      setLoadingPermisos(false);
    }
  };

  // Cargar roles desde la base de datos
  const cargarRoles = async () => {
    try {
      setLoading(true);
      const rolesData = await rolesAPI.getAll();
      
      // Cargar permisos para cada rol
      const rolesAdaptados = await Promise.all(
        rolesData.map(async (rol) => {
          try {
            const permisos = await rolesAPI.getPermisosDeRol(rol.id_roles);
            return {
              ...rol,
              permisos: permisos || [],
              userCount: 0,
              isSystem: ['Administrador', 'Cliente', 'Asesor', 'Guía'].includes(rol.nombre),
              color: obtenerColorRol(rol.nombre)
            };
          } catch {
            return {
              ...rol,
              permisos: [],
              userCount: 0,
              isSystem: ['Administrador', 'Cliente', 'Asesor', 'Guía'].includes(rol.nombre),
              color: obtenerColorRol(rol.nombre)
            };
          }
        })
      );
      
      setRoles(rolesAdaptados as Role[]);
    } catch (error) {
      console.error('Error al cargar roles desde el backend:', error);
      toast.error('Error al conectar con el backend. Verifica que esté corriendo en http://localhost:3000');
    } finally {
      setLoading(false);
    }
  };

  const obtenerColorRol = (nombre: string) => {
    const colores: Record<string, string> = {
      'Administrador': 'bg-red-100 text-red-800',
      'Asesor': 'bg-blue-100 text-blue-800',
      'Guía': 'bg-green-100 text-green-800',
      'Guía Turístico': 'bg-green-100 text-green-800',
      'Cliente': 'bg-gray-100 text-gray-800'
    };
    return colores[nombre] || 'bg-purple-100 text-purple-800';
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateRole = async () => {
    if (!canCreateRole) {
      toast.error('No tienes permiso para crear roles');
      return;
    }

    if (!newRole.nombre.trim()) {
      toast.error('El nombre del rol es obligatorio');
      return;
    }

    if (newRole.permisos.length === 0) {
      toast.error('Debe asignar al menos un permiso al rol');
      return;
    }

    try {
      // Crear el rol en la BD
      await rolesAPI.create({
        nombre: newRole.nombre,
        descripcion: newRole.descripcion
      });

      // Los permisos se asignarán después (se necesita el ID del rol creado)
      // Por ahora mostrar éxito
      toast.success('Rol creado exitosamente. Asigna los permisos en la edición.');
      setShowCreateModal(false);
      setNewRole({ nombre: '', descripcion: '', permisos: [] });
      await cargarRoles();
    } catch (error: any) {
      console.error('Error al crear rol:', error);
      toast.error(error?.message || 'Error al crear el rol');
    }
  };

  const handleEditRole = async () => {
    if (!canEditRole) {
      toast.error('No tienes permiso para editar roles');
      return;
    }

    if (!selectedRole || !newRole.nombre.trim()) {
      toast.error('Datos del rol incompletos');
      return;
    }

    if (newRole.permisos.length === 0) {
      toast.error('Debe asignar al menos un permiso al rol');
      return;
    }

    try {
      // Actualizar datos básicos del rol
      await rolesAPI.update(selectedRole.id_roles, {
        nombre: newRole.nombre,
        descripcion: newRole.descripcion
      });

      // Actualizar permisos del rol
      await rolesAPI.actualizarPermisos(selectedRole.id_roles, newRole.permisos);

      toast.success('Rol actualizado exitosamente. Los permisos han sido asignados.');
      setShowEditModal(false);
      setSelectedRole(null);
      setNewRole({ nombre: '', descripcion: '', permisos: [] });
      await cargarRoles();
    } catch (error: any) {
      console.error('Error al actualizar rol:', error);
      toast.error(error?.message || 'Error al actualizar el rol');
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!canDeleteRole) {
      toast.error('No tienes permiso para eliminar roles');
      return;
    }

    const role = roles.find(r => r.id_roles === roleId);
    if (role?.isSystem) {
      toast.error('No se pueden eliminar roles del sistema');
      return;
    }

    if ((role?.userCount ?? 0) > 0) {
      setRolePendingDelete(role);
      setReassignRoleId(null);
      setIsReassignDialogOpen(true);
      return;
    }

    try {
      await rolesAPI.delete(roleId);
      toast.success('Rol eliminado exitosamente');
      await cargarRoles();
    } catch (error) {
      console.error('Error al eliminar rol:', error);
      toast.error('Error al eliminar el rol');
    }
  };

  const handleConfirmDeleteRole = async () => {
    if (!canDeleteRole) {
      toast.error('No tienes permiso para eliminar roles');
      return;
    }

    if (!rolePendingDelete) return;

    if (!reassignRoleId) {
      toast.error('Seleccione un rol para reasignar los usuarios antes de eliminar');
      return;
    }

    const roleToKeep = roles.find(r => r.id_roles === reassignRoleId);
    if (!roleToKeep) {
      toast.error('Rol de reasignación inválido');
      return;
    }

    try {
      // Reasignar localmente usuarios (si hubiera lista de usuarios cargada)
      setUsers(prev => prev.map(user =>
        user.role === (rolePendingDelete?.nombre || '')
          ? { ...user, role: roleToKeep.nombre }
          : user
      ));

      // Intentar backend reasignación por usuario (si endpoint disponible)
      const usersToReassign = users.filter(user => user.role === (rolePendingDelete?.nombre || ''));
      await Promise.all(usersToReassign.map(user =>
        // API real puede tener ruta específica para reasignar
        roleToKeep && user.email
          ? usersAPI.updateRole(user.email, roleToKeep.nombre)
          : Promise.resolve()
      ));

      await rolesAPI.delete(rolePendingDelete.id_roles);
      toast.success('Rol eliminado y usuarios reasignados correctamente');
      setIsReassignDialogOpen(false);
      setRolePendingDelete(null);
      setReassignRoleId(null);
      await cargarRoles();
    } catch (error: any) {
      console.error('Error al reasignar y eliminar rol:', error);
      toast.error(error?.message || 'Error al eliminar y reasignar el rol');
    }
  };

  const handleAssignRole = (newRoleId: string) => {
    if (!selectedUser) return;
    
    const roleIdNumber = parseInt(newRoleId, 10);
    const newRoleName = roles.find(r => r.id_roles === roleIdNumber)?.nombre || '';
    
    setUsers(prev => prev.map(user => 
      user.id === selectedUser.id 
        ? { ...user, role: newRoleName }
        : user
    ));

    setShowAssignRoleModal(false);
    setSelectedUser(null);
    toast.success('Rol asignado exitosamente');
  };

  const openEditModal = (role: Role) => {
    if (!canEditRole) {
      toast.error('No tienes permiso para editar roles');
      return;
    }

    if (role.isSystem) {
      toast.error('Los roles del sistema no se pueden editar');
      return;
    }
    
    setSelectedRole(role);
    setNewRole({
      nombre: role.nombre,
      descripcion: role.descripcion || '',
      permisos: role.permisos?.map(p => p.id_permisos) || []
    });
    setShowEditModal(true);
  };

  const openAssignRoleModal = (user: User) => {
    setSelectedUser(user);
    setShowAssignRoleModal(true);
  };

  const togglePermission = (permissionId: number) => {
    setNewRole(prev => ({
      ...prev,
      permisos: prev.permisos.includes(permissionId)
        ? prev.permisos.filter(p => p !== permissionId)
        : [...prev.permisos, permissionId]
    }));
  };

  const selectAllPermissions = () => {
    setNewRole(prev => ({
      ...prev,
      permisos: permissions.map(p => p.id_permisos)
    }));
  };

  const clearAllPermissions = () => {
    setNewRole(prev => ({
      ...prev,
      permisos: []
    }));
  };

  // Agrupar permisos por módulo (extraer el último word del nombre)
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const parts = permission.nombre?.split(' ') || [];
    const module = parts[parts.length - 1] || 'Otros';

    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getRoleStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'Activo').length;
    const totalRoles = roles.length;
    const customRoles = roles.filter(r => !r.isSystem).length;

    return { totalUsers, activeUsers, totalRoles, customRoles };
  };

  const stats = getRoleStats();

  if (!permisos.loadingRoles && !canViewRoles) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Acceso denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">No tienes permiso para ver roles.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Gestión de Roles y Usuarios</h2>
          <p className="text-gray-600">Administra roles, permisos y asignaciones de usuarios</p>
        </div>
        <div className="flex space-x-2">
          {canCreateRole && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Rol
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRoles}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Roles Personalizados</p>
                <p className="text-2xl font-bold text-orange-600">{stats.customRoles}</p>
              </div>
              <Settings className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roles">Gestión de Roles</TabsTrigger>
          <TabsTrigger value="users">Usuarios y Asignaciones</TabsTrigger>
          <TabsTrigger value="permissions">Permisos del Sistema</TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Roles del Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rol</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Usuarios</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                          <span className="text-gray-500">Cargando roles...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No hay roles disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role) => (
                      <TableRow key={role.id_roles}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Shield className="w-4 h-4 text-gray-500" />
                            <div>
                              <span className="font-medium">{role.nombre}</span>
                              <Badge className={`ml-2 ${role.color}`}>
                                {role.isSystem ? 'Sistema' : 'Personalizado'}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 max-w-xs">
                          <span className="truncate">{getRoleDescriptionText(role.descripcion)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{role.userCount || 0} usuarios</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {role.permisos?.length || 0} permisos
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                              {canEditRole && (
                                <DropdownMenuItem 
                                  onClick={() => openEditModal(role)}
                                  disabled={role.isSystem}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {canDeleteRole && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteRole(role.id_roles)}
                                  disabled={role.isSystem || (role.userCount ?? 0) > 0}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar usuarios por nombre o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      {roles.map(role => (
                        <SelectItem key={role.id_roles} value={role.nombre}>{role.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Activo">Activos</SelectItem>
                      <SelectItem value="Inactivo">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Usuarios del Sistema</span>
                <Badge variant="secondary">{filteredUsers.length} usuarios</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol Actual</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                    <TableHead>Última Actividad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const userRole = roles.find(r => r.nombre === user.role);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={userRole?.color || 'bg-gray-100 text-gray-800'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'Activo' ? 'default' : 'secondary'}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(user.joinDate).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {user.lastActive ? new Date(user.lastActive).toLocaleDateString('es-ES') : 'Nunca'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openAssignRoleModal(user)}>
                                <Key className="w-4 h-4 mr-2" />
                                Cambiar Rol
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar Usuario
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>Permisos del Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingPermisos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                  <span className="text-gray-500">Cargando permisos...</span>
                </div>
              ) : permissions.length === 0 ? (
                <p className="text-gray-500">No hay permisos disponibles</p>
              ) : (
                Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {perms.map((permission) => (
                        <div key={permission.id_permisos} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{permission.nombre}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{permission.descripcion || 'Sin descripción'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Role Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Crear Nuevo Rol</span>
            </DialogTitle>
            <DialogDescription>
              Define un nuevo rol personalizado con permisos específicos para el sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Nombre del Rol *</Label>
              <Input
                id="roleName"
                placeholder="Ej: Coordinador"
                value={newRole.nombre}
                onChange={(e) => setNewRole(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleDescription">Descripción</Label>
              <Input
                id="roleDescription"
                placeholder="Describe las responsabilidades del rol"
                value={newRole.descripcion}
                onChange={(e) => setNewRole(prev => ({ ...prev, descripcion: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label>Permisos</Label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllPermissions}>
                  Seleccionar todos
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearAllPermissions}>
                  Deseleccionar todos
                </Button>
              </div>
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">{category}</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {perms.map((permission) => (
                      <div key={permission.id_permisos} className="flex items-center space-x-2">
                        <Checkbox
                          id={`create-${permission.id_permisos}`}
                          checked={newRole.permisos.includes(permission.id_permisos)}
                          onCheckedChange={() => togglePermission(permission.id_permisos)}
                        />
                        <Label htmlFor={`create-${permission.id_permisos}`} className="flex-1 cursor-pointer">
                          <span className="font-medium">{permission.nombre}</span>
                          <span className="text-sm text-gray-500 block">{permission.descripcion}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateRole}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Crear Rol
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5" />
              <span>Editar Rol</span>
            </DialogTitle>
            <DialogDescription>
              Modifica los permisos y configuración del rol personalizado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editRoleName">Nombre del Rol *</Label>
              <Input
                id="editRoleName"
                placeholder="Ej: Coordinador"
                value={newRole.nombre}
                onChange={(e) => setNewRole(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editRoleDescription">Descripción</Label>
              <Input
                id="editRoleDescription"
                placeholder="Describe las responsabilidades del rol"
                value={newRole.descripcion}
                onChange={(e) => setNewRole(prev => ({ ...prev, descripcion: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label>Permisos</Label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllPermissions}>
                  Seleccionar todos
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearAllPermissions}>
                  Deseleccionar todos
                </Button>
              </div>
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">{category}</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {perms.map((permission) => (
                      <div key={permission.id_permisos} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-${permission.id_permisos}`}
                          checked={newRole.permisos.includes(permission.id_permisos)}
                          onCheckedChange={() => togglePermission(permission.id_permisos)}
                        />
                        <Label htmlFor={`edit-${permission.id_permisos}`} className="flex-1 cursor-pointer">
                          <span className="font-medium">{permission.nombre}</span>
                          <span className="text-sm text-gray-500 block">{permission.descripcion}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleEditRole}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Role Modal */}
      <Dialog open={showAssignRoleModal} onOpenChange={setShowAssignRoleModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Key className="w-5 h-5" />
              <span>Cambiar Rol de Usuario</span>
            </DialogTitle>
            <DialogDescription>
              Selecciona un nuevo rol para {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Usuario</Label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {selectedUser?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser?.name}</p>
                  <p className="text-sm text-gray-500">{selectedUser?.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rol Actual</Label>
              <Badge className="inline-block">{selectedUser?.role}</Badge>
            </div>

            <div className="space-y-2">
              <Label>Nuevo Rol</Label>
              <Select onValueChange={handleAssignRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem 
                      key={role.id_roles} 
                      value={role.id_roles.toString()} 
                      disabled={role.nombre === selectedUser?.role}
                    >
                      <div className="flex items-center space-x-2">
                        <Badge className={role.color}>{role.nombre}</Badge>
                        <span className="text-sm text-gray-500">- {getRoleDescriptionText(role.descripcion)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAssignRoleModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Role Reassign Modal */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Rol tiene usuarios asignados</span>
            </DialogTitle>
            <DialogDescription>
              El rol "{rolePendingDelete?.nombre}" tiene {rolePendingDelete?.userCount || 0} usuario(s). Selecciona un rol para reasignarlos antes de eliminar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reassignRole">Rol para reasignar usuarios</Label>
              <Select value={reassignRoleId ? reassignRoleId.toString() : ''} onValueChange={(value) => setReassignRoleId(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegir rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter(role => role.id_roles !== rolePendingDelete?.id_roles)
                    .map((role) => (
                      <SelectItem key={role.id_roles} value={role.id_roles.toString()}>
                        {role.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsReassignDialogOpen(false); setRolePendingDelete(null); setReassignRoleId(null); }} className="flex-1">
                Cancelar
              </Button>
              <Button type="button" className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleConfirmDeleteRole}>
                Reasignar y eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}