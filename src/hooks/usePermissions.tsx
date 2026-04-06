import { useState, useEffect, useCallback } from 'react';
import { decodeJWT } from '../utils/jwtDecoder';
import { rolesAPI, permisosAPI, type Rol, type Permiso } from '../services/api';

/**
 * Hook personalizado para gestionar y verificar permisos del usuario actual
 * Proporciona funcionalidad para:
 * - Obtener role actual del usuario
 * - Verificar si el usuario tiene un permiso específico
 * - Obtener todos los permisos del usuario
 * - Obtener todos los roles del sistema con sus permisos
 */

interface PermissionCheckResult {
  hasPermission: boolean;
  loading: boolean;
  error: string | null;
}

interface RoleWithPermissions extends Rol {
  permisos?: Permiso[];
}

export function usePermissions() {
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permiso[]>([]);
  const [allRoles, setAllRoles] = useState<RoleWithPermissions[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cargar el rol del usuario actual desde el token JWT
   */
  const loadCurrentUserRole = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No hay token en localStorage');
        setCurrentUserRole(null);
        return;
      }

      const decoded = decodeJWT(token);
      const roleFromToken = decoded?.rol || decoded?.rol_nombre || decoded?.role || null;
      console.log('👤 Rol cargado del JWT:', roleFromToken);
      setCurrentUserRole(roleFromToken);
    } catch (err) {
      console.error('❌ Error decodificando token:', err);
      setCurrentUserRole(null);
    }
  }, []);

  /**
   * Cargar todos los roles y sus permisos desde el backend
   */
  const loadAllRoles = useCallback(async () => {
    try {
      setLoadingRoles(true);
      setError(null);

      const isAdmin = currentUserRole?.toLowerCase() === 'administrador' || 
                      currentUserRole?.toLowerCase() === 'admin';

      // Si es Admin, cargar todos los roles
      if (isAdmin) {
        const roles = await rolesAPI.getAll();
        console.log('📋 Roles cargados del backend:', roles);
        
        // Para cada rol, intentar cargar sus permisos
        const rolesWithPermisos = await Promise.all(
          roles.map(async (rol) => {
            try {
              console.log(`🔄 Cargando permisos para rol ${rol.nombre} (ID: ${rol.id_roles})`);
              const permisos = await rolesAPI.getPermisosDeRol(rol.id_roles);
              console.log(`✅ Permisos para ${rol.nombre}:`, permisos);
              return {
                ...rol,
                permisos: permisos || []
              };
            } catch (err) {
              console.error(`❌ Error cargando permisos para ${rol.nombre}:`, err);
              return {
                ...rol,
                permisos: []
              };
            }
          })
        );

        console.log('📌 Todos los roles con permisos:', rolesWithPermisos);
        setAllRoles(rolesWithPermisos);
        
        // Admin ve sus propios permisos (todos)
        const adminRoleData = rolesWithPermisos.find(
          r => r.nombre?.toLowerCase() === 'administrador' || r.nombre?.toLowerCase() === 'admin'
        );
        console.log(`👥 Permisos de Admin:`, adminRoleData?.permisos || []);
        setUserPermissions(adminRoleData?.permisos || []);
      } else {
        // Para no-Admin: cargar solo los permisos del usuario actual
        console.log(`👤 Usuario no-Admin (${currentUserRole}): cargando permisos desde /api/mi-rol/permisos`);
        const userPermisos = await rolesAPI.getPermisosDelUsuarioActual();
        console.log(`🎯 Permisos del usuario ${currentUserRole}:`, userPermisos);
        setUserPermissions(userPermisos || []);
        
        // No cargar todos los roles para no-Admin (no los necesita)
        setAllRoles([]);
      }
    } catch (err) {
      console.error('❌ Error cargando roles/permisos:', err);
      setError(`Error al cargar roles y permisos: ${(err as Error).message}`);
    } finally {
      setLoadingRoles(false);
    }
  }, [currentUserRole]);

  /**
   * Efecto para cargar el rol actual cuando el componente monta
   */
  useEffect(() => {
    loadCurrentUserRole();
  }, [loadCurrentUserRole]);

  /**
   * Efecto para cargar todos los roles cuando cambia el rol del usuario
   */
  useEffect(() => {
    if (currentUserRole) {
      loadAllRoles();
    }
  }, [currentUserRole, loadAllRoles]);

  /**
   * Verificar si el usuario tiene un permiso específico
   * @param permissionName - Nombre del permiso a verificar (ej: "propietarios_leer")
   * @returns boolean indicando si el usuario tiene el permiso
   */
  const hasPermission = useCallback(
    (permissionName: string): boolean => {
      if (!currentUserRole) return false;
      
      // Admin tiene todos los permisos
      if (currentUserRole.toLowerCase() === 'administrador' || 
          currentUserRole.toLowerCase() === 'admin') {
        return true;
      }

      // Verificar si el permiso existe en los permisos del usuario
      // Los permisos pueden ser strings directos o objetos con propiedad 'nombre'
      if (userPermissions.length > 0 && typeof userPermissions[0] !== 'string') {
        console.log(`[DEBUG] Estructura de primer permiso:`, userPermissions[0]);
        console.log(`[DEBUG] Claves del objeto:`, Object.keys(userPermissions[0]));
      }
      
      const result = userPermissions.some(p => {
        const pName = typeof p === 'string' ? p : p.nombre;
        const pNameLower = pName?.toLowerCase().trim();
        const permLower = permissionName.toLowerCase().trim();
        return pNameLower === permLower;
      });
      
      console.log(`✅ hasPermission("${permissionName}") = ${result}`);
      return result;
    },
    [currentUserRole, userPermissions]
  );

  /**
   * Verificar si el usuario puede realizar una acción en un módulo
   * Ejemplos: "usuarios.ver", "tours.crear", "reservas.editar"
   * @param actionName - Formato "modulo.accion"
   * @returns boolean indicando si puede realizar la acción
   */
  const canPerformAction = useCallback(
    (actionName: string): boolean => {
      if (!currentUserRole) return false;

      // Admin puede hacer cualquier acción
      if (currentUserRole.toLowerCase() === 'administrador' || 
          currentUserRole.toLowerCase() === 'admin') {
        return true;
      }

      // Convertir actionName a formato de permiso
      // "usuarios.ver" -> "Ver Usuarios"
      const [module, action] = actionName.split('.');
      if (!module || !action) return false;

      // Capitalizar primera letra de cada palabra
      const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
      const permissionName = `${capitalize(action)} ${capitalize(module)}`;

      return hasPermission(permissionName);
    },
    [currentUserRole, hasPermission]
  );

  /**
   * Obtener rol completo con permisos
   */
  const getRoleWithPermissions = useCallback(
    (roleName: string): RoleWithPermissions | null => {
      return allRoles.find(r => r.nombre?.toLowerCase() === roleName.toLowerCase()) || null;
    },
    [allRoles]
  );

  /**
   * Obtener todos los permisos agrupados por módulo
   */
  const getPermissionsByModule = useCallback((): Record<string, Permiso[]> => {
    const grouped: Record<string, Permiso[]> = {};

    userPermissions.forEach(permiso => {
      // Extraer módulo del nombre del permiso
      // "Ver Usuarios" -> "Usuarios"
      const parts = permiso.nombre?.split(' ') || [];
      const module = parts[parts.length - 1] || 'Otros';

      if (!grouped[module]) {
        grouped[module] = [];
      }
      grouped[module].push(permiso);
    });

    return grouped;
  }, [userPermissions]);

  /**
   * Recargar permisos (útil después de actualizar roles)
   */
  const refreshPermissions = useCallback(async () => {
    loadCurrentUserRole();
    await loadAllRoles();
  }, [loadCurrentUserRole, loadAllRoles]);

  return {
    // Estados
    currentUserRole,
    userPermissions,
    allRoles,
    loadingRoles,
    error,
    
    // Métodos de verificación
    hasPermission,
    canPerformAction,
    
    // Getters
    getRoleWithPermissions,
    getPermissionsByModule,
    
    // Acciones
    refreshPermissions,
    loadAllRoles,
    loadCurrentUserRole
  };
}

export type UsePermissionsReturn = ReturnType<typeof usePermissions>;
