import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Filter,
  Plus,
  Search,
  Shield,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '../App';
import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';
import { permisosAPI, rolesAPI, usersAPI } from '../services/api';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';

const itemsPerPage = 10;

const rolePermissionActions = [
  { key: 'leer', label: 'Leer' },
  { key: 'crear', label: 'Crear' },
  { key: 'editar', label: 'Editar' },
  { key: 'eliminar', label: 'Eliminar' },
] as const;

const moduleLabelMap: Record<string, string> = {
  dashboard: 'Dashboard',
  usuarios: 'Usuarios',
  clientes: 'Clientes',
  propietarios: 'Propietarios',
  reservas: 'Reservas',
  fincas: 'Fincas',
  rutas: 'Rutas',
  servicios: 'Servicios',
  ventas: 'Ventas',
  abonos: 'Abonos',
  pagos: 'Pagos',
  proveedores: 'Proveedores',
  tipos_proveedor: 'Tipos de Proveedor',
  empleados: 'Empleados',
  roles: 'Roles',
  reportes: 'Reportes',
};

export function RolesManagement() {
  const { user } = useAuth();

  const permisos = usePermissions();
  const rolePerms = createModulePermissions(permisos, 'Roles');
  const canViewRoles = rolePerms.canView();
  const canCreateRole = rolePerms.canCreate();
  const canEditRole = rolePerms.canEdit();
  const canDeleteRole = rolePerms.canDelete();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [loadingRoles, setLoadingRoles] = useState(false);
  const [localRoles, setLocalRoles] = useState<any[]>([]);
  const [localUsers, setLocalUsers] = useState<any[]>([]);

  const [availablePermisos, setAvailablePermisos] = useState<any[]>([]);
  const [selectedPermissionModule, setSelectedPermissionModule] = useState<string>('');

  const [isPermisosDialogOpen, setIsPermisosDialogOpen] = useState(false);
  const [permisoDialogRole, setPermisoDialogRole] = useState<any>(null);
  const [permissionsSearchTerm, setPermissionsSearchTerm] = useState('');

  const [isDeleteRoleDialogOpen, setIsDeleteRoleDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<any>(null);
  const [selectedReassignRole, setSelectedReassignRole] = useState<string>('');

  const [formData, setFormData] = useState<any>({});

  const normalizarRolUsuario = (rol?: string | null) => {
    const rolNormalizado = (rol || '').toLowerCase().trim();
    const mapaRoles: Record<string, string> = {
      admin: 'Administrador',
      administrador: 'Administrador',
      advisor: 'Asesor',
      asesor: 'Asesor',
      guide: 'Guía',
      guia: 'Guía',
      'guía': 'Guía',
      client: 'Cliente',
      cliente: 'Cliente',
    };

    return mapaRoles[rolNormalizado] || rol || 'Cliente';
  };

  const formatearFechaUsuario = (fecha?: string | null) => {
    if (!fecha) return '−';

    const fechaObj = new Date(fecha);
    if (Number.isNaN(fechaObj.getTime())) return fecha;

    return fechaObj.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const mapearUsuarioBackend = (usuario: any) => {
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
    const estado = typeof estadoRaw === 'boolean' ? (estadoRaw ? 'Activo' : 'Inactivo') : (estadoRaw || 'Activo').toString();

    return {
      id: String(usuario?.id_usuarios ?? usuario?.id_usuario ?? usuario?.id ?? usuario?.correo ?? Date.now()),
      id_usuarios: usuario?.id_usuarios ?? usuario?.id_usuario ?? usuario?.id,
      name: nombreCompleto || usuario?.correo || usuario?.email || 'Sin nombre',
      email: usuario?.correo || usuario?.email || '−',
      role: mapaRolVista[rolNormalizado] || rolNormalizado || 'client',
      status: estado,
      fecha_creacion: usuario?.fecha_creacion || usuario?.fecha_registro || usuario?.created_at || null,
      joinDate: formatearFechaUsuario(
        usuario?.fecha_ingreso || usuario?.fecha_contratacion || usuario?.fecha_registro || usuario?.fecha_creacion || usuario?.created_at,
      ),
    };
  };

  const getPermissionModules = () => {
    const modules = Array.from(
      new Set(
        (availablePermisos || [])
          .map((perm: any) => String(perm?.nombre || '').split('.')[0])
          .filter((mod: string) => !!mod),
      ),
    ) as string[];

    return modules.sort((a, b) => a.localeCompare(b));
  };

  const getPermissionRecord = (moduleName: string, actionKey: string) => {
    const actionCandidates = actionKey === 'editar' ? ['editar', 'actualizar'] : [actionKey];
    return (availablePermisos || []).find((perm: any) => {
      const permName = String(perm?.nombre || '');
      return actionCandidates.some((candidate) => permName === `${moduleName}.${candidate}`);
    });
  };

  const isPermissionChecked = (moduleName: string, actionKey: string) => {
    const permissions = formData.permissions || [];
    const actionCandidates = actionKey === 'editar' ? ['editar', 'actualizar'] : [actionKey];
    return actionCandidates.some((candidate) => permissions.includes(`${moduleName}.${candidate}`));
  };

  const togglePermissionAction = (moduleName: string, actionKey: string, checked: boolean) => {
    const permissionRecord = getPermissionRecord(moduleName, actionKey);
    const permissions = formData.permissions || [];
    const permissionIds = formData.permissionIds || [];
    const actionCandidates = actionKey === 'editar' ? ['editar', 'actualizar'] : [actionKey];

    if (checked) {
      if (!permissionRecord) {
        toast.error(`No existe el permiso ${moduleName}.${actionKey} en la tabla permisos`);
        return;
      }

      const permissionName = permissionRecord.nombre;
      const permissionId = permissionRecord.id_permisos;
      setFormData({
        ...formData,
        permissions: Array.from(new Set([...permissions, permissionName])),
        permissionIds: Array.from(new Set([...permissionIds, permissionId])),
      });
      return;
    }

    const namesToRemove = actionCandidates.map((candidate) => `${moduleName}.${candidate}`);
    const idsToRemove = (availablePermisos || [])
      .filter((perm: any) => namesToRemove.includes(String(perm?.nombre || '')))
      .map((perm: any) => perm.id_permisos);

    setFormData({
      ...formData,
      permissions: permissions.filter((name: string) => !namesToRemove.includes(name)),
      permissionIds: permissionIds.filter((id: number) => !idsToRemove.includes(id)),
    });
  };

  const selectAllRolePermissions = () => {
    const allPermissions = (availablePermisos || []).filter((perm: any) => !!perm?.nombre);
    setFormData({
      ...formData,
      permissions: Array.from(new Set(allPermissions.map((perm: any) => String(perm.nombre)))),
      permissionIds: Array.from(
        new Set(allPermissions.map((perm: any) => Number(perm?.id_permisos)).filter((id: number) => Number.isFinite(id))),
      ),
    });
  };

  const clearAllRolePermissions = () => {
    setFormData({
      ...formData,
      permissions: [],
      permissionIds: [],
    });
  };

  const getRoleDescriptionText = (item: any) => {
    const description = item?.descripcion ?? item?.description ?? '';
    return typeof description === 'string' && description.trim() ? description : 'Este rol no tiene descripción';
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      Activo: 'default',
      Inactivo: 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const cargarRolesConDetalle = async () => {
    setLoadingRoles(true);
    try {
      const rolesData = await rolesAPI.getAll();

      let usuariosData: any[] = [];
      let catalogoPermisos: any[] = [];

      const results = await Promise.allSettled([usersAPI.getAll(), permisosAPI.getAll()]);
      const usersResult = results[0];
      const permisosResult = results[1];

      if (usersResult.status === 'fulfilled') {
        usuariosData = usersResult.value || [];
        setLocalUsers((usuariosData || []).map(mapearUsuarioBackend));
      } else {
        console.warn('No se pudieron cargar usuarios para conteo por rol:', usersResult.reason);
        setLocalUsers([]);
      }

      if (permisosResult.status === 'fulfilled') {
        catalogoPermisos = permisosResult.value || [];
        setAvailablePermisos(catalogoPermisos || []);
      } else {
        console.warn('No se pudo cargar catálogo de permisos:', permisosResult.reason);
        setAvailablePermisos([]);
      }

      const usuarioPorRol = (usuariosData || []).reduce((acc: Record<string, number>, usuario: any) => {
        const rolUsuario = normalizarRolUsuario(usuario?.rol_nombre || usuario?.rol || usuario?.role || usuario?.tipo_usuario);
        acc[rolUsuario] = (acc[rolUsuario] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const adaptarRoles = (rolesFuente: any[], detallesPermisosPorRol: Record<number, any[]> = {}) => {
        return (rolesFuente || []).map((rol: any) => {
          const permisosRaw = detallesPermisosPorRol[rol.id_roles] || rol.permisos || [];

          const permisosNormalizados = (permisosRaw || []).map((permiso: any) => {
            if (typeof permiso === 'string') {
              const permisoCatalogo = (catalogoPermisos || []).find((p: any) => p.nombre === permiso);
              return {
                id_permisos: permisoCatalogo?.id_permisos,
                nombre: permiso,
              };
            }

            return {
              id_permisos: permiso?.id_permisos,
              nombre: permiso?.nombre || permiso?.codigo || permiso?.permiso || `${permiso?.modulo || 'permiso'}.${permiso?.accion || 'ver'}`,
            };
          });

          const permisosFormateados = permisosNormalizados.map((perm: any) => perm.nombre);
          const permissionIds = permisosNormalizados
            .map((perm: any) => Number(perm.id_permisos))
            .filter((id: number) => !Number.isNaN(id));

          const totalUsuariosRol = usuarioPorRol[rol.nombre] || 0;

          return {
            id: rol.id_roles?.toString() || '',
            id_roles: rol.id_roles,
            nombre: rol.nombre || '',
            name: rol.nombre || '',
            descripcion: rol.descripcion || '',
            description: rol.descripcion || '',
            permissions: permisosFormateados,
            permissionIds,
            userCount: totalUsuariosRol,
            estado: rol.estado,
            status: rol.estado ? 'Activo' : 'Inactivo',
            fecha_creacion: rol.fecha_creacion || rol.created_at,
            fecha_modificacion: rol.fecha_modificacion || rol.updated_at || '',
            usuario_modifico: rol.usuario_modifico || '—',
          };
        });
      };

      const rolesRapidos = adaptarRoles(rolesData);
      setLocalRoles(rolesRapidos as any);
      setLoadingRoles(false);

      const rolConPermisosEnLista = (rolesData || []).every((rol: any) => Array.isArray(rol.permisos));
      if (rolConPermisosEnLista) {
        return;
      }

      void (async () => {
        try {
          const detalles = await Promise.all(
            (rolesData || []).map(async (rol: any) => {
              try {
                const detalleRol: any = await rolesAPI.getByIdWithPermisos(rol.id_roles);
                const permisosDetalle = detalleRol?.permisos || detalleRol?.data?.permisos || [];
                return { idRol: rol.id_roles, permisos: permisosDetalle };
              } catch {
                return { idRol: rol.id_roles, permisos: [] };
              }
            }),
          );

          const detallesPermisosPorRol = detalles.reduce((acc: Record<number, any[]>, item: any) => {
            acc[item.idRol] = item.permisos;
            return acc;
          }, {});

          const rolesConDetalle = adaptarRoles(rolesData, detallesPermisosPorRol);
          setLocalRoles(rolesConDetalle as any);
        } catch (error) {
          console.error('Error al hidratar permisos de roles:', error);
        }
      })();
    } catch (error) {
      console.error('Error al cargar roles:', error);
      toast.error((error as any)?.message || 'Error al cargar roles desde la base de datos');
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    if (permisos.loadingRoles) return;

    if (!canViewRoles) {
      setLocalRoles([]);
      setLocalUsers([]);
      setLoadingRoles(false);
      return;
    }

    void cargarRolesConDetalle();
  }, [permisos.loadingRoles, canViewRoles]);

  useEffect(() => {
    const modules = getPermissionModules();
    if (!selectedPermissionModule && modules.length > 0) {
      setSelectedPermissionModule(modules[0]);
    }
  }, [availablePermisos, selectedPermissionModule]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (isPermisosDialogOpen) {
      setPermissionsSearchTerm('');
    }
  }, [isPermisosDialogOpen]);

  const getRoleUserCount = (roleName: string): number => {
    const normalizedRoleName = normalizarRolUsuario(roleName);
    return localUsers.filter((u: any) => normalizarRolUsuario(u.role) === normalizedRoleName).length;
  };

  const handleCreate = () => {
    if (!canCreateRole) {
      toast.error('No tienes permiso para crear roles');
      return;
    }

    const modules = getPermissionModules();
    if (modules.length > 0) {
      setSelectedPermissionModule(modules[0]);
    }

    setSelectedItem(null);
    setFormData({
      name: '',
      description: '',
      status: 'Activo',
      permissions: [],
      permissionIds: [],
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (item: any) => {
    if (!canEditRole) {
      toast.error('No tienes permiso para editar roles');
      return;
    }

    setSelectedItem(item);
    const modules = getPermissionModules();
    const firstPermissionModule = (item.permissions || [])[0]?.split('.')?.[0];
    setSelectedPermissionModule(firstPermissionModule || modules[0] || '');

    setFormData({
      ...item,
      name: item.name || item.nombre || '',
      description: item.description || item.descripcion || '',
      status: item.status || (item.estado ? 'Activo' : 'Inactivo'),
      permissions: item.permissions || [],
      permissionIds: item.permissionIds || [],
    });
    setIsEditModalOpen(true);
  };

  const handleView = (item: any) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  const handleDelete = (item: any) => {
    if (!canDeleteRole) {
      toast.error('No tienes permiso para eliminar roles');
      return;
    }

    const actualUserCount = getRoleUserCount(item.nombre || item.name);
    setRoleToDelete({ ...item, userCount: actualUserCount });
    setSelectedReassignRole('');
    setIsDeleteRoleDialogOpen(true);
  };

  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      const roleId = Number(roleToDelete.id_roles ?? roleToDelete.id);
      if (!Number.isFinite(roleId) || roleId <= 0) {
        throw new Error('ID de rol inválido');
      }

      const currentRoleName = normalizarRolUsuario(roleToDelete.nombre || roleToDelete.name || '');
      const hasUsers = (roleToDelete?.userCount || 0) > 0;

      if (hasUsers && !selectedReassignRole) {
        toast.error('Debe seleccionar un rol para reasignar los usuarios');
        return;
      }

      if (hasUsers && selectedReassignRole) {
        const newRoleId = Number(selectedReassignRole);
        if (!Number.isFinite(newRoleId) || newRoleId <= 0) {
          throw new Error('Rol de reasignación inválido');
        }

        const roleToKeep = localRoles.find((role: any) => Number(role.id_roles ?? role.id) === newRoleId);
        if (!roleToKeep) {
          throw new Error('No se encontró el rol para reasignar');
        }

        const roleToKeepName = roleToKeep.nombre || roleToKeep.name || '';

        const usuariosAReasignar = localUsers.filter((u: any) => normalizarRolUsuario(u.role) === currentRoleName);

        setLocalUsers((prev) =>
          prev.map((u: any) => (normalizarRolUsuario(u.role) === currentRoleName ? { ...u, role: roleToKeepName } : u)),
        );

        if (usuariosAReasignar.length > 0) {
          await Promise.all(
            usuariosAReasignar.map((u: any) =>
              usersAPI.updateRole(u.email, roleToKeepName).catch((err: any) => {
                console.error('Error reasignando usuario:', u, err);
                return Promise.resolve();
              }),
            ),
          );
        }

        toast.success(`${usuariosAReasignar.length} usuario(s) reasignado(s) a '${roleToKeepName}'`);
      }

      await rolesAPI.delete(roleId);
      setLocalRoles((prev) => prev.filter((role: any) => Number(role.id_roles ?? role.id) !== roleId));
      toast.success('Rol eliminado correctamente');
      void cargarRolesConDetalle();

      setIsDeleteRoleDialogOpen(false);
      setRoleToDelete(null);
      setSelectedReassignRole('');
    } catch (error: any) {
      toast.error(error?.message || 'Error al eliminar el rol');
    }
  };

  const handleSave = async () => {
    try {
      const ahora = new Date().toISOString();

      if (!formData.name || !String(formData.name).trim()) {
        toast.error('El nombre del rol es obligatorio');
        return;
      }

      const permisosSeleccionadosIds = (formData.permissionIds || [])
        .map((id: any) => Number(id))
        .filter((id: number) => !Number.isNaN(id));

      const permisosFormateados: string[] = formData.permissions || [];

      if (permisosSeleccionadosIds.length === 0) {
        toast.error('Debe asignar al menos un permiso al rol');
        return;
      }

      const rolDataBase = {
        nombre: formData.name,
        descripcion: formData.description || null,
        estado: formData.status === 'Activo',
        fecha_creacion: ahora,
      };

      const isEdit = Boolean(selectedItem);
      if (!isEdit && !canCreateRole) {
        toast.error('No tienes permiso para crear roles');
        return;
      }
      if (isEdit && !canEditRole) {
        toast.error('No tienes permiso para editar roles');
        return;
      }

      if (selectedItem) {
        const rolData = {
          nombre: formData.name,
          descripcion: formData.description || null,
          estado: formData.status === 'Activo',
          fecha_modificacion: ahora,
          usuario_modifico: user?.name || user?.email || 'Sistema',
        };

        const rolOptimista = {
          ...selectedItem,
          nombre: formData.name,
          name: formData.name,
          descripcion: formData.description || '',
          description: formData.description || '',
          permissions: permisosFormateados,
          permissionIds: permisosSeleccionadosIds,
          estado: formData.status === 'Activo',
          status: formData.status,
          fecha_creacion: selectedItem.fecha_creacion || selectedItem.created_at || selectedItem.fecha_creacion || null,
          fecha_modificacion: ahora,
          usuario_modifico: user?.name || user?.email || 'Sistema',
        };

        const rolesPrevios = localRoles;
        setLocalRoles((prev) => prev.map((r: any) => (r.id === selectedItem.id ? rolOptimista : r)));
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setFormData({});
        setSelectedItem(null);

        void (async () => {
          try {
            await rolesAPI.update(selectedItem.id_roles, rolData);
            const idRolObjetivo = selectedItem.id_roles;
            const detalleActualizado: any = await rolesAPI.getByIdWithPermisos(Number(idRolObjetivo));
            const permisosActualesRaw = detalleActualizado?.permisos || detalleActualizado?.data?.permisos || [];
            const permisosActualesIds = permisosActualesRaw
              .map((perm: any) => Number(perm?.id_permisos))
              .filter((id: number) => !Number.isNaN(id));
            const idsParaAgregar = permisosSeleccionadosIds.filter((id: number) => !permisosActualesIds.includes(id));
            const idsParaQuitar = permisosActualesIds.filter((id: number) => !permisosSeleccionadosIds.includes(id));

            try {
              await Promise.all(
                idsParaAgregar.map((id: number) =>
                  rolesAPI.asignarPermiso(Number(idRolObjetivo), id).catch((err: any) => {
                    console.error(`Error asignando permiso ${id}:`, err);
                    return Promise.resolve();
                  }),
                ),
              );
            } catch (err: any) {
              console.error('Error al agregar permisos:', err);
            }

            try {
              await Promise.all(
                idsParaQuitar.map((id: number) =>
                  rolesAPI.removerPermiso(Number(idRolObjetivo), id).catch((err: any) => {
                    console.error(`Error removiendo permiso ${id}:`, err);
                    return Promise.resolve();
                  }),
                ),
              );
            } catch (err: any) {
              console.error('Error al remover permisos:', err);
            }

            toast.success('Rol actualizado correctamente');
            void cargarRolesConDetalle();
          } catch (error: any) {
            console.error('Error al actualizar rol:', error);
            setLocalRoles(rolesPrevios);
            toast.error(error?.message || 'Error al actualizar el rol');
          }
        })();

        return;
      }

      const idTemporal = `temp-${Date.now()}`;
      const rolNuevo: any = {
        id: idTemporal,
        id_roles: null,
        nombre: formData.name,
        name: formData.name,
        descripcion: formData.description || '',
        description: formData.description || '',
        permissions: permisosFormateados,
        permissionIds: permisosSeleccionadosIds,
        userCount: 0,
        estado: true,
        status: 'Activo',
        fecha_creacion: ahora,
        fecha_modificacion: '',
        usuario_modifico: '',
      };

      const rolesPrevios = localRoles;
      setLocalRoles((prev) => [...prev, rolNuevo]);
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      setFormData({});
      setSelectedItem(null);

      void (async () => {
        try {
          const respuestaCrear: any = await rolesAPI.create(rolDataBase);
          const idRolObjetivo =
            respuestaCrear?.data?.id_roles || respuestaCrear?.id_roles || respuestaCrear?.data?.[0]?.id_roles;

          if (idRolObjetivo) {
            try {
              await Promise.all(
                permisosSeleccionadosIds.map((id: number) =>
                  rolesAPI.asignarPermiso(Number(idRolObjetivo), id).catch((err: any) => {
                    console.error(`Error asignando permiso ${id}:`, err);
                    return Promise.resolve();
                  }),
                ),
              );
            } catch (err: any) {
              console.error('Error al asignar permisos:', err);
            }
          }

          toast.success('Rol creado correctamente');
          void cargarRolesConDetalle();
        } catch (error: any) {
          console.error('Error al crear el rol:', error);
          setLocalRoles(rolesPrevios);
          toast.error(error?.message || 'Error al crear el rol');
        }
      })();
    } catch (error: any) {
      console.error('Error al guardar rol:', error);
      toast.error(error?.message || 'Error al guardar el rol');
    }
  };

  const filteredRoles = useMemo(() => {
    if (!searchTerm) return localRoles;
    return (localRoles || []).filter((item: any) => {
      const searchableFields = Object.values(item).join(' ').toLowerCase();
      return searchableFields.includes(searchTerm.toLowerCase());
    });
  }, [localRoles, searchTerm]);

  const paginatedRoles = useMemo(() => {
    return filteredRoles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredRoles, currentPage]);

  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage) || 1;

  const renderForm = (isEdit: boolean) => {
    const modules = getPermissionModules();

    return (
      <div className="space-y-6 max-h-96 overflow-y-auto">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Información Básica</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ingrese el nombre"
              />
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={formData.status || 'Activo'} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Descripción del Rol</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe las responsabilidades del rol..."
                className="min-h-[80px]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Permisos por Módulo</h4>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={selectAllRolePermissions}>
              Seleccionar todos
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={clearAllRolePermissions}>
              Deseleccionar todos
            </Button>
          </div>

          {modules.length === 0 ? (
            <div className="border rounded p-3 text-sm text-gray-500">No hay permisos cargados desde la base de datos.</div>
          ) : (
            <>
              <div>
                <Label>Módulo</Label>
                <div className="flex flex-wrap gap-2 border rounded p-2">
                  {modules.map((moduleName) => (
                    <button
                      key={moduleName}
                      type="button"
                      onClick={() => setSelectedPermissionModule(moduleName)}
                      className={`px-3 py-1 rounded text-sm border transition-colors ${
                        selectedPermissionModule === moduleName
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {moduleLabelMap[moduleName] || moduleName}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>
                  Acciones del módulo {moduleLabelMap[selectedPermissionModule] || selectedPermissionModule}
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border rounded p-3">
                  {rolePermissionActions.map((action) => {
                    const actionId = `perm-action-${selectedPermissionModule}-${action.key}`;
                    return (
                      <div key={action.key} className="flex items-center space-x-2">
                        <input
                          id={actionId}
                          type="checkbox"
                          checked={isPermissionChecked(selectedPermissionModule, action.key)}
                          onChange={(e) => togglePermissionAction(selectedPermissionModule, action.key, e.target.checked)}
                          disabled={!selectedPermissionModule}
                        />
                        <label htmlFor={actionId} className="text-sm">
                          {action.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Resumen de permisos seleccionados</Label>
                <div className="border rounded p-3 min-h-[56px]">
                  {(formData.permissions || []).length === 0 ? (
                    <p className="text-xs text-gray-500">Aún no has seleccionado permisos para este rol.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(formData.permissions || []).map((perm: string) => (
                        <span key={perm} className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 border">
                          {perm}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              setIsCreateModalOpen(false);
              setIsEditModalOpen(false);
              setFormData({});
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </div>
      </div>
    );
  };

  const roleDetailsForView = useMemo(() => {
    if (!selectedItem) return [];

    const permissionList = Array.isArray(selectedItem?.permissions)
      ? selectedItem.permissions
      : typeof selectedItem?.permissions === 'string'
        ? selectedItem.permissions.split(',').map((perm: string) => perm.trim()).filter(Boolean)
        : [];

    const estadoRol = selectedItem?.status || (selectedItem?.estado === true ? 'Activo' : selectedItem?.estado === false ? 'Inactivo' : '—');

    return [
      { key: 'id_roles', label: 'ID Rol', value: selectedItem?.id_roles ?? '—' },
      { key: 'nombre', label: 'Nombre', value: selectedItem?.nombre || selectedItem?.name || '—' },
      { key: 'descripcion', label: 'Descripción', value: getRoleDescriptionText(selectedItem) },
      { key: 'userCount', label: 'Usuarios asignados', value: selectedItem?.userCount ?? 0 },
      { key: 'estado', label: 'Estado', value: estadoRol },
      {
        key: 'fecha_creacion',
        label: 'Fecha de creación',
        value: selectedItem?.fecha_creacion ? formatearFechaUsuario(selectedItem.fecha_creacion) : '—',
      },
      {
        key: 'fecha_modificacion',
        label: 'Última modificación',
        value: selectedItem?.fecha_modificacion ? formatearFechaUsuario(selectedItem.fecha_modificacion) : 'No modificado aún',
      },
      {
        key: 'usuario_modifico',
        label: 'Modificado por',
        value: selectedItem?.usuario_modifico && selectedItem?.usuario_modifico !== '—' ? selectedItem.usuario_modifico : 'No modificado aún',
      },
      { key: 'permissions', label: 'Permisos', value: permissionList, isPermissions: true },
    ];
  }, [selectedItem]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 w-4 h-4" />
            <Input
              placeholder="Buscar roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 border-green-200 focus:border-green-400"
            />
          </div>
          <Button variant="outline" size="sm" className="border-green-200 hover:bg-green-50 hover:border-green-400">
            <Filter className="w-4 h-4 mr-2 text-green-600" />
            <span className="text-green-700">Filtros</span>
          </Button>
        </div>

        {canCreateRole && (
          <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Crear Roles
          </Button>
        )}
      </div>

      <Card className="shadow-md border-green-100">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-green-50 hover:bg-green-50">
                {['Rol', 'Descripción', 'Usuarios', 'Permisos', 'Estado', 'Acciones'].map((column) => (
                  <TableHead key={column} className="text-green-800">
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRoles.length > 0 ? (
                paginatedRoles.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nombre}</TableCell>
                    <TableCell className="max-w-xs truncate">{getRoleDescriptionText(item)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.userCount || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(item.permissions || []).slice(0, 3).map((perm: string) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                        {(item.permissions || []).length > 3 && (
                          <button
                            type="button"
                            className="text-xs focus:outline-none"
                            onClick={() => {
                              setPermisoDialogRole(item);
                              setPermissionsSearchTerm('');
                              setIsPermisosDialogOpen(true);
                            }}
                          >
                            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-gray-100">
                              +{item.permissions.length - 3}
                            </Badge>
                          </button>
                        )}
                        {(item.permissions || []).length === 0 && (
                          <Badge variant="outline" className="text-xs">
                            Sin permisos
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleView(item)}>
                          <Eye className="w-4 h-4" />
                        </Button>

                        {canEditRole && (
                          <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}

                        {canEditRole && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const newEstado = !item.estado;
                              try {
                                await rolesAPI.update(item.id_roles, { estado: newEstado });
                                setLocalRoles((prev) =>
                                  prev.map((r: any) =>
                                    r.id === item.id ? { ...r, estado: newEstado, status: newEstado ? 'Activo' : 'Inactivo' } : r,
                                  ),
                                );
                                toast.success(`Rol ${newEstado ? 'activado' : 'desactivado'} exitosamente`);
                              } catch (error) {
                                toast.error('Error al actualizar el estado del rol');
                              }
                            }}
                            className={
                              item.estado ? 'hover:bg-yellow-50 hover:text-yellow-600' : 'hover:bg-green-50 hover:text-green-600'
                            }
                          >
                            {item.estado ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </Button>
                        )}

                        {canDeleteRole && (
                          <Button size="sm" variant="outline" onClick={() => handleDelete(item)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {loadingRoles ? 'Cargando roles...' : 'No hay datos disponibles'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4">
          <div className="text-sm text-gray-600">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredRoles.length)} de {filteredRoles.length}{' '}
            registros
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
                    variant={currentPage === pageNumber ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={
                      currentPage === pageNumber
                        ? 'bg-green-600 hover:bg-green-700 text-white min-w-[36px]'
                        : 'border-green-200 hover:bg-green-50 min-w-[36px]'
                    }
                  >
                    {pageNumber}
                  </Button>
                );
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="text-gray-400 px-1">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className="border-green-200 hover:bg-green-50 min-w-[36px]"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
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
        </div>
      )}

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Roles</DialogTitle>
            <DialogDescription>Complete los campos para crear un nuevo registro.</DialogDescription>
          </DialogHeader>
          {renderForm(false)}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Roles</DialogTitle>
            <DialogDescription>Modifique los campos que desea actualizar.</DialogDescription>
          </DialogHeader>
          {renderForm(true)}
        </DialogContent>
      </Dialog>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Detalles del Rol</DialogTitle>
            <DialogDescription>Información completa del rol seleccionado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {roleDetailsForView.map((detail: any) => {
              if (detail.isPermissions) {
                const permissions = detail.value as any[];
                return (
                  <div key={detail.key} className="py-2 border-b border-green-100">
                    <div className="flex justify-between gap-4">
                      <span className="font-medium shrink-0 text-green-800">{detail.label}:</span>
                      <span className="text-gray-600 text-right">{permissions.length} permisos</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {permissions.length > 0 ? (
                        permissions.map((permission: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {String(permission)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">Sin permisos asignados</span>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div key={detail.key} className="flex justify-between gap-4 py-2 border-b border-green-100">
                  <span className="font-medium shrink-0 text-green-800">{detail.label}:</span>
                  <span className="text-gray-600 text-right break-words max-w-md bg-green-50 px-2 py-1 rounded">{String(detail.value)}</span>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPermisosDialogOpen} onOpenChange={setIsPermisosDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Permisos de rol: {permisoDialogRole?.nombre || permisoDialogRole?.name || 'Rol'}</DialogTitle>
            <DialogDescription>Lista completa de permisos asignados a este rol.</DialogDescription>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar permisos por nombre..."
              value={permissionsSearchTerm}
              onChange={(e) => setPermissionsSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="overflow-y-auto max-h-96">
            {permisoDialogRole && Array.isArray(permisoDialogRole.permissions) && permisoDialogRole.permissions.length > 0 ? (
              (() => {
                const filteredPermissions = permisoDialogRole.permissions
                  .filter((perm: string) => perm.toLowerCase().includes(permissionsSearchTerm.toLowerCase()))
                  .sort((a: string, b: string) => a.localeCompare(b));

                return filteredPermissions.length > 0 ? (
                  <div className="space-y-2">
                    {filteredPermissions.map((perm: string, index: number) => (
                      <div key={perm} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-600 w-8">{index + 1}.</span>
                          <span className="text-sm text-gray-900">{perm}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {perm.split('.')[0]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Este permiso no ha sido encontrado</p>
                    <p className="text-sm text-gray-400 mt-1">Intenta con otro término de búsqueda</p>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Este rol no tiene permisos asignados</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteRoleDialogOpen} onOpenChange={setIsDeleteRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>
                {(roleToDelete?.userCount || 0) > 0 ? 'Eliminar Rol con Usuarios Asignados' : 'Confirmar Eliminación de Rol'}
              </span>
            </DialogTitle>
            <DialogDescription>
              {(roleToDelete?.userCount || 0) > 0 ? (
                <>
                  El rol "{roleToDelete?.nombre || roleToDelete?.name}" tiene {roleToDelete?.userCount || 0} usuario(s) asignado(s). Debe reasignar estos usuarios a otro rol antes de eliminarlo.
                </>
              ) : (
                <>
                  ¿Estás seguro de que deseas eliminar el rol "{roleToDelete?.nombre || roleToDelete?.name}"? Esta acción no se puede deshacer.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {(roleToDelete?.userCount || 0) > 0 && (
              <div className="space-y-2">
                <Label htmlFor="reassignRole">Seleccionar rol para reasignar usuarios</Label>
                <Select value={selectedReassignRole} onValueChange={setSelectedReassignRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un rol..." />
                  </SelectTrigger>
                  <SelectContent>
                    {localRoles
                      .filter((role: any) => role.id_roles !== roleToDelete?.id_roles)
                      .map((role: any) => (
                        <SelectItem key={role.id_roles} value={role.id_roles.toString()}>
                          {role.nombre || role.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteRoleDialogOpen(false);
                  setRoleToDelete(null);
                  setSelectedReassignRole('');
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDeleteRole}
                disabled={(roleToDelete?.userCount || 0) > 0 && !selectedReassignRole}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {(roleToDelete?.userCount || 0) > 0 ? 'Eliminar y Reasignar' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
