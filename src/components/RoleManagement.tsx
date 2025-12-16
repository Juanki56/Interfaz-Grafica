import React, { useState } from 'react';
import { Shield, Users, Plus, Edit, Trash2, Eye, UserCheck, Search, Filter, MoreVertical, Settings, Key } from 'lucide-react';
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
import { Avatar, AvatarContent, AvatarFallback } from './ui/avatar';
import { toast } from 'sonner';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
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
  const [activeTab, setActiveTab] = useState('roles');
  
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: 'Administrador',
      description: 'Acceso completo al sistema',
      permissions: ['all'],
      userCount: 2,
      isSystem: true,
      color: 'bg-red-100 text-red-800'
    },
    {
      id: '2',
      name: 'Asesor',
      description: 'Gestión de clientes y reservas',
      permissions: ['read_users', 'read_tours', 'create_bookings', 'read_bookings'],
      userCount: 5,
      isSystem: true,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: '3',
      name: 'Guía Turístico',
      description: 'Gestión de rutas y grupos',
      permissions: ['read_tours', 'read_routes', 'manage_groups'],
      userCount: 8,
      isSystem: true,
      color: 'bg-green-100 text-green-800'
    },
    {
      id: '4',
      name: 'Cliente',
      description: 'Acceso básico de usuario',
      permissions: ['read_tours', 'create_bookings'],
      userCount: 23,
      isSystem: true,
      color: 'bg-gray-100 text-gray-800'
    }
  ]);

  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Administrador Principal', email: 'admin@occitours.com', role: 'Administrador', status: 'Activo', joinDate: '2024-01-15', lastActive: '2024-03-15' },
    { id: '2', name: 'Ana García Asesor', email: 'asesor@occitours.com', role: 'Asesor', status: 'Activo', joinDate: '2024-01-20', lastActive: '2024-03-15' },
    { id: '3', name: 'Carlos Ruiz Guía', email: 'guia@occitours.com', role: 'Guía Turístico', status: 'Activo', joinDate: '2024-02-01', lastActive: '2024-03-14' },
    { id: '4', name: 'María López Cliente', email: 'cliente@occitours.com', role: 'Cliente', status: 'Activo', joinDate: '2024-02-15', lastActive: '2024-03-15' },
    { id: '5', name: 'Jorge Martínez', email: 'jorge@email.com', role: 'Asesor', status: 'Activo', joinDate: '2024-02-20', lastActive: '2024-03-13' },
    { id: '6', name: 'Laura Rodríguez', email: 'laura@email.com', role: 'Guía Turístico', status: 'Inactivo', joinDate: '2024-03-01', lastActive: '2024-03-10' },
    { id: '7', name: 'Pedro González', email: 'pedro@email.com', role: 'Cliente', status: 'Activo', joinDate: '2024-03-05', lastActive: '2024-03-15' }
  ]);

  const [permissions] = useState<Permission[]>([
    { id: 'read_users', name: 'Ver Usuarios', description: 'Puede ver la lista de usuarios', category: 'Usuarios' },
    { id: 'create_users', name: 'Crear Usuarios', description: 'Puede crear nuevos usuarios', category: 'Usuarios' },
    { id: 'edit_users', name: 'Editar Usuarios', description: 'Puede modificar usuarios existentes', category: 'Usuarios' },
    { id: 'delete_users', name: 'Eliminar Usuarios', description: 'Puede eliminar usuarios', category: 'Usuarios' },
    { id: 'read_tours', name: 'Ver Tours', description: 'Puede ver tours y paquetes', category: 'Tours' },
    { id: 'create_tours', name: 'Crear Tours', description: 'Puede crear nuevos tours', category: 'Tours' },
    { id: 'edit_tours', name: 'Editar Tours', description: 'Puede modificar tours existentes', category: 'Tours' },
    { id: 'delete_tours', name: 'Eliminar Tours', description: 'Puede eliminar tours', category: 'Tours' },
    { id: 'read_bookings', name: 'Ver Reservas', description: 'Puede ver reservas', category: 'Reservas' },
    { id: 'create_bookings', name: 'Crear Reservas', description: 'Puede crear reservas', category: 'Reservas' },
    { id: 'edit_bookings', name: 'Editar Reservas', description: 'Puede modificar reservas', category: 'Reservas' },
    { id: 'read_routes', name: 'Ver Rutas', description: 'Puede ver rutas turísticas', category: 'Rutas' },
    { id: 'manage_groups', name: 'Gestionar Grupos', description: 'Puede gestionar grupos de turistas', category: 'Rutas' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      toast.error('El nombre del rol es obligatorio');
      return;
    }

    const role: Role = {
      id: Date.now().toString(),
      name: newRole.name,
      description: newRole.description,
      permissions: newRole.permissions,
      userCount: 0,
      isSystem: false,
      color: 'bg-purple-100 text-purple-800'
    };

    setRoles(prev => [...prev, role]);
    setNewRole({ name: '', description: '', permissions: [] });
    setShowCreateModal(false);
    toast.success('Rol creado exitosamente');
  };

  const handleEditRole = async () => {
    if (!selectedRole || !newRole.name.trim()) {
      toast.error('Datos del rol incompletos');
      return;
    }

    setRoles(prev => prev.map(role => 
      role.id === selectedRole.id 
        ? { ...role, name: newRole.name, description: newRole.description, permissions: newRole.permissions }
        : role
    ));

    setShowEditModal(false);
    setSelectedRole(null);
    setNewRole({ name: '', description: '', permissions: [] });
    toast.success('Rol actualizado exitosamente');
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) {
      toast.error('No se pueden eliminar roles del sistema');
      return;
    }

    if (role?.userCount > 0) {
      toast.error('No se puede eliminar un rol que tiene usuarios asignados');
      return;
    }

    setRoles(prev => prev.filter(r => r.id !== roleId));
    toast.success('Rol eliminado exitosamente');
  };

  const handleAssignRole = (newRoleId: string) => {
    if (!selectedUser) return;

    const newRoleName = roles.find(r => r.id === newRoleId)?.name || '';
    
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
    if (role.isSystem) {
      toast.error('Los roles del sistema no se pueden editar');
      return;
    }
    
    setSelectedRole(role);
    setNewRole({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions]
    });
    setShowEditModal(true);
  };

  const openAssignRoleModal = (user: User) => {
    setSelectedUser(user);
    setShowAssignRoleModal(true);
  };

  const togglePermission = (permissionId: string) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Gestión de Roles y Usuarios</h2>
          <p className="text-gray-600">Administra roles, permisos y asignaciones de usuarios</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Rol
          </Button>
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
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Shield className="w-4 h-4 text-gray-500" />
                          <div>
                            <span className="font-medium">{role.name}</span>
                            <Badge className={`ml-2 ${role.color}`}>
                              {role.isSystem ? 'Sistema' : 'Personalizado'}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 max-w-xs">
                        <span className="truncate">{role.description}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{role.userCount} usuarios</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {role.permissions.includes('all') ? 'Todos los permisos' : `${role.permissions.length} permisos`}
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
                            <DropdownMenuItem 
                              onClick={() => openEditModal(role)}
                              disabled={role.isSystem}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteRole(role.id)}
                              disabled={role.isSystem || role.userCount > 0}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
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
                        <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
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
                    const userRole = roles.find(r => r.name === user.role);
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
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="space-y-3">
                  <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {perms.map((permission) => (
                      <div key={permission.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{permission.name}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{permission.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
                value={newRole.name}
                onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleDescription">Descripción</Label>
              <Input
                id="roleDescription"
                placeholder="Describe las responsabilidades del rol"
                value={newRole.description}
                onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label>Permisos</Label>
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">{category}</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {perms.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.id}
                          checked={newRole.permissions.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                        />
                        <Label htmlFor={permission.id} className="flex-1 cursor-pointer">
                          <span className="font-medium">{permission.name}</span>
                          <span className="text-sm text-gray-500 block">{permission.description}</span>
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
                value={newRole.name}
                onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editRoleDescription">Descripción</Label>
              <Input
                id="editRoleDescription"
                placeholder="Describe las responsabilidades del rol"
                value={newRole.description}
                onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label>Permisos</Label>
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">{category}</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {perms.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-${permission.id}`}
                          checked={newRole.permissions.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                        />
                        <Label htmlFor={`edit-${permission.id}`} className="flex-1 cursor-pointer">
                          <span className="font-medium">{permission.name}</span>
                          <span className="text-sm text-gray-500 block">{permission.description}</span>
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
                    <SelectItem key={role.id} value={role.id} disabled={role.name === selectedUser?.role}>
                      <div className="flex items-center space-x-2">
                        <Badge className={role.color}>{role.name}</Badge>
                        <span className="text-sm text-gray-500">- {role.description}</span>
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
    </div>
  );
}