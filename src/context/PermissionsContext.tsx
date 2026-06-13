/**
 * PermissionsContext — fuente única de verdad para roles y permisos.
 *
 * ANTES: cada componente que llamaba `usePermissions()` creaba su propia instancia
 *        y hacía sus propias requests al backend (20+ peticiones simultáneas).
 *
 * AHORA: este Provider hace UNA sola carga al montar y todos los componentes
 *        leen del mismo contexto compartido sin requests adicionales.
 *
 * Incluye caché en memoria con TTL de 5 minutos para evitar recargas innecesarias.
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { decodeJWT } from '../utils/jwtDecoder';
import { rolesAPI, type Rol, type Permiso } from '../services/api';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface RoleWithPermissions extends Rol {
  permisos?: Permiso[];
}

export interface PermissionsContextValue {
  currentUserRole: string | null;
  userPermissions: Permiso[];
  allRoles: RoleWithPermissions[];
  loadingRoles: boolean;
  error: string | null;
  hasPermission: (permissionName: string) => boolean;
  canPerformAction: (actionName: string) => boolean;
  getRoleWithPermissions: (roleName: string) => RoleWithPermissions | null;
  getPermissionsByModule: () => Record<string, Permiso[]>;
  refreshPermissions: () => Promise<void>;
  loadAllRoles: () => Promise<void>;
  loadCurrentUserRole: () => void;
}

// ─── Caché en memoria (persiste entre renders, se limpia al desmontar) ────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

interface MemCache {
  role: string;
  allRoles: RoleWithPermissions[];
  userPermisos: Permiso[];
  ts: number;
}

let _memCache: MemCache | null = null;

function getCache(role: string): MemCache | null {
  if (!_memCache || _memCache.role !== role) return null;
  if (Date.now() - _memCache.ts > CACHE_TTL_MS) {
    _memCache = null;
    return null;
  }
  return _memCache;
}

function setCache(role: string, allRoles: RoleWithPermissions[], userPermisos: Permiso[]) {
  _memCache = { role, allRoles, userPermisos, ts: Date.now() };
}

function clearCache() {
  _memCache = null;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permiso[]>([]);
  const [allRoles, setAllRoles] = useState<RoleWithPermissions[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Evita cargas concurrentes
  const isLoadingRef = useRef(false);

  // ── Leer el rol del token JWT ──────────────────────────────────────────────
  const loadCurrentUserRole = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCurrentUserRole(null);
        setUserPermissions([]);
        setAllRoles([]);
        setLoadingRoles(false);
        return;
      }
      const decoded = decodeJWT(token);
      const roleFromToken = decoded?.rol || decoded?.rol_nombre || decoded?.role || null;
      setCurrentUserRole(roleFromToken);
    } catch {
      setCurrentUserRole(null);
      setLoadingRoles(false);
    }
  }, []);

  // ── Cargar roles y permisos desde el backend (con caché) ──────────────────
  const loadAllRoles = useCallback(async () => {
    if (!currentUserRole) return;
    if (isLoadingRef.current) return; // evitar cargas paralelas
    isLoadingRef.current = true;

    try {
      setLoadingRoles(true);
      setError(null);

      const isAdmin =
        currentUserRole.toLowerCase() === 'administrador' ||
        currentUserRole.toLowerCase() === 'admin';

      // Verificar caché antes de ir al backend
      const cached = getCache(currentUserRole);
      if (cached) {
        setAllRoles(cached.allRoles);
        setUserPermissions(cached.userPermisos);
        setLoadingRoles(false);
        isLoadingRef.current = false;
        return;
      }

      if (isAdmin) {
        // Admin: cargar todos los roles con sus permisos (N+1 queries — solo 1 vez gracias al caché)
        const roles = await rolesAPI.getAll();
        const rolesWithPermisos = await Promise.all(
          roles.map(async (rol) => {
            try {
              const permisos = await rolesAPI.getPermisosDeRol(rol.id_roles);
              return { ...rol, permisos: permisos || [] };
            } catch {
              return { ...rol, permisos: [] as Permiso[] };
            }
          })
        );

        const adminRoleData = rolesWithPermisos.find(
          (r) =>
            r.nombre?.toLowerCase() === 'administrador' ||
            r.nombre?.toLowerCase() === 'admin'
        );
        const adminPermisos = adminRoleData?.permisos || [];

        setAllRoles(rolesWithPermisos);
        setUserPermissions(adminPermisos);
        setCache(currentUserRole, rolesWithPermisos, adminPermisos);
      } else {
        // No-admin: cargar solo los permisos del usuario actual
        const userPermisos = await rolesAPI.getPermisosDelUsuarioActual();
        const permisos = userPermisos || [];
        setUserPermissions(permisos);
        setAllRoles([]);
        setCache(currentUserRole, [], permisos);
      }
    } catch (err) {
      setError(`Error al cargar roles y permisos: ${(err as Error).message}`);
    } finally {
      setLoadingRoles(false);
      isLoadingRef.current = false;
    }
  }, [currentUserRole]);

  // ── Efectos ────────────────────────────────────────────────────────────────

  // Carga inicial: leer token
  useEffect(() => {
    loadCurrentUserRole();
  }, [loadCurrentUserRole]);

  // Cuando el rol está disponible, cargar permisos
  useEffect(() => {
    if (currentUserRole) {
      loadAllRoles();
    } else {
      setLoadingRoles(false);
    }
  }, [currentUserRole, loadAllRoles]);

  // Detectar logout desde otra pestaña (storage event cross-tab)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        clearCache();
        setCurrentUserRole(null);
        setUserPermissions([]);
        setAllRoles([]);
        setLoadingRoles(false);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ── Métodos de verificación ───────────────────────────────────────────────

  const hasPermission = useCallback(
    (permissionName: string): boolean => {
      if (!currentUserRole) return false;

      // Admin siempre tiene todos los permisos
      if (
        currentUserRole.toLowerCase() === 'administrador' ||
        currentUserRole.toLowerCase() === 'admin'
      ) {
        return true;
      }

      return userPermissions.some((p) => {
        const pName = typeof p === 'string' ? p : p.nombre;
        return pName?.toLowerCase().trim() === permissionName.toLowerCase().trim();
      });
    },
    [currentUserRole, userPermissions]
  );

  const canPerformAction = useCallback(
    (actionName: string): boolean => {
      if (!currentUserRole) return false;

      if (
        currentUserRole.toLowerCase() === 'administrador' ||
        currentUserRole.toLowerCase() === 'admin'
      ) {
        return true;
      }

      const [module, action] = actionName.split('.');
      if (!module || !action) return false;

      const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
      return hasPermission(`${capitalize(action)} ${capitalize(module)}`);
    },
    [currentUserRole, hasPermission]
  );

  const getRoleWithPermissions = useCallback(
    (roleName: string): RoleWithPermissions | null => {
      return (
        allRoles.find((r) => r.nombre?.toLowerCase() === roleName.toLowerCase()) || null
      );
    },
    [allRoles]
  );

  const getPermissionsByModule = useCallback((): Record<string, Permiso[]> => {
    const grouped: Record<string, Permiso[]> = {};
    userPermissions.forEach((permiso) => {
      const parts = permiso.nombre?.split(' ') || [];
      const module = parts[parts.length - 1] || 'Otros';
      if (!grouped[module]) grouped[module] = [];
      grouped[module].push(permiso);
    });
    return grouped;
  }, [userPermissions]);

  // Recarga manual (limpia caché)
  const refreshPermissions = useCallback(async () => {
    clearCache();
    loadCurrentUserRole();
    await loadAllRoles();
  }, [loadCurrentUserRole, loadAllRoles]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <PermissionsContext.Provider
      value={{
        currentUserRole,
        userPermissions,
        allRoles,
        loadingRoles,
        error,
        hasPermission,
        canPerformAction,
        getRoleWithPermissions,
        getPermissionsByModule,
        refreshPermissions,
        loadAllRoles,
        loadCurrentUserRole,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

// ─── Hook público ─────────────────────────────────────────────────────────────

export function usePermissionsContext(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error(
      'usePermissionsContext debe usarse dentro de <PermissionsProvider>. ' +
        'Asegúrate de que el componente esté dentro del árbol de AuthContext.'
    );
  }
  return ctx;
}
