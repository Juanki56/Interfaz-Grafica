/**
 * Utilidades para trabajar con permisos en el frontend
 * Proporciona funciones helper para verificar acciones permitidas
 */

import { UsePermissionsReturn } from '../hooks/usePermissions';

/**
 * Tipo de acción que se puede verificar
 */
export type PermissionAction = 'crear' | 'editar' | 'eliminar' | 'ver' | 'aprobar' | 'cancelar';

/**
 * Módulos del sistema
 */
export type Module = 
  | 'Usuarios'
  | 'Clientes'
  | 'Propietarios'
  | 'Empleados'
  | 'Reservas'
  | 'Fincas'
  | 'Rutas'
  | 'Servicios'
  | 'Ventas'
  | 'Abonos'
  | 'Pagos'
  | 'Proveedores'
  | 'Restaurantes'
  | 'Tours'
  | 'Roles';

/**
 * Construir un nombre de permiso a partir de la acción y el módulo
 * Formato de BD: {modulo}.{accion} (minúsculas, separados por PUNTO)
 * Ejemplos:
 * - buildPermissionName('crear', 'Usuarios') → 'usuarios.crear'
 * - buildPermissionName('editar', 'Propietarios') → 'propietarios.editar'
 * - buildPermissionName('ver', 'Clientes') → 'clientes.leer'
 */
export function buildPermissionName(action: PermissionAction, module: Module): string {
  // Mapear acciones a nombres de la BD (ver = leer en la BD)
  const actionMap: Record<PermissionAction, string> = {
    'crear': 'crear',
    'editar': 'editar',
    'eliminar': 'eliminar',
    'ver': 'leer', // En la BD es "leer" no "ver"
    'aprobar': 'aprobar',
    'cancelar': 'cancelar'
  };

  // Convertir módulo a minúsculas
  const moduleFormatted = module.toLowerCase();
  const actionFormatted = actionMap[action];

  // Formato: modulo.accion (con PUNTO, no guion bajo)
  return `${moduleFormatted}.${actionFormatted}`;
}

/**
 * Verificar si el usuario puede realizar una acción en un módulo
 */
export function canPerformAction(
  permissions: UsePermissionsReturn,
  action: PermissionAction,
  module: Module
): boolean {
  const permissionName = buildPermissionName(action, module);
  const result = permissions.hasPermission(permissionName);
  return result;
}

/**
 * Obtener un objeto booleano con todas las acciones permitidas para un módulo
 * Ejemplo:
 * ```
 * const userActions = getModuleActions(permissions, 'Usuarios');
 * if (userActions.crear) {
 *   // mostrar botón crear
 * }
 * ```
 */
export function getModuleActions(
  permissions: UsePermissionsReturn,
  module: Module
): Record<PermissionAction, boolean> {
  return {
    crear: canPerformAction(permissions, 'crear', module),
    editar: canPerformAction(permissions, 'editar', module),
    eliminar: canPerformAction(permissions, 'eliminar', module),
    ver: canPerformAction(permissions, 'ver', module),
    aprobar: canPerformAction(permissions, 'aprobar', module),
    cancelar: canPerformAction(permissions, 'cancelar', module)
  };
}

/**
 * Verificar si el usuario tiene acceso de lectura a un módulo
 */
export function canViewModule(
  permissions: UsePermissionsReturn,
  module: Module
): boolean {
  return canPerformAction(permissions, 'ver', module) || 
         permissions.currentUserRole?.toLowerCase() === 'administrador';
}

/**
 * Obtener un mensaje de error de permiso denegado
 */
export function getPermissionDeniedMessage(action: PermissionAction, module: Module): string {
  const actionEs: Record<PermissionAction, string> = {
    'crear': 'crear',
    'editar': 'editar',
    'eliminar': 'eliminar',
    'ver': 'ver',
    'aprobar': 'aprobar',
    'cancelar': 'cancelar'
  };

  return `No tienes permiso para ${actionEs[action]} ${module.toLowerCase()}`;
}

/**
 * Hook-like function para obtener permisos de un módulo
 * Retorna objeto con información de permisos y métodos helper
 */
export function createModulePermissions(
  permissions: UsePermissionsReturn,
  module: Module
) {
  const actions = getModuleActions(permissions, module);
  
  return {
    // Acciones
    actions,
    
    // Métodos getter
    canCreate: () => actions.crear,
    canEdit: () => actions.editar,
    canDelete: () => actions.eliminar,
    canView: () => actions.ver,
    canApprove: () => actions.aprobar,
    canCancel: () => actions.cancelar,
    
    // Verificación generic
    can: (action: PermissionAction): boolean => actions[action],
    
    // Mensajes
    getErrorMessage: (action: PermissionAction): string => 
      getPermissionDeniedMessage(action, module),
    
    // Estado del usuario
    isAdmin: () => permissions.currentUserRole?.toLowerCase() === 'administrador',
    userRole: permissions.currentUserRole
  };
}

/**
 * Verificar si un componente debe mostrarse según permisos
 * Útil para renderizado condicional
 */
export function shouldShowElement(
  condition: boolean | undefined,
  defaultValue: boolean = true
): boolean {
  return condition === undefined ? defaultValue : condition;
}

/**
 * Restringir acceso a una función basado en permisos
 */
export function withPermissionCheck<T extends any[], R>(
  permissions: UsePermissionsReturn,
  action: PermissionAction,
  module: Module,
  fn: (...args: T) => R
): (...args: T) => R | string {
  return (...args: T) => {
    if (!canPerformAction(permissions, action, module)) {
      return getPermissionDeniedMessage(action, module);
    }
    return fn(...args);
  };
}
