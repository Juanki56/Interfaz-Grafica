export const CRITICAL_ACCOUNT_DEACTIVATION_MESSAGE =
  'No se puede desactivar esta cuenta crítica porque no hay otro usuario activo con permisos equivalentes.';

const CRITICAL_PERMISSION_PREFIXES = ['usuarios.', 'roles.', 'permisos.'];
const CRITICAL_PERMISSION_NAMES = new Set(['empleados.editar', 'empleados.eliminar']);

export type EmployeeAccountSnapshot = {
  id: string;
  id_roles?: number | null;
  rol_nombre?: string | null;
  estado: string;
};

export function normalizePermissionFingerprint(permissionNames: string[]): string {
  return [...new Set(permissionNames.map((name) => String(name || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'es'))
    .join('|');
}

export function isCriticalEmployeeAccount(
  rolNombre?: string | null,
  permissionNames: string[] = [],
): boolean {
  const role = String(rolNombre || '')
    .trim()
    .toLowerCase();
  if (role.includes('administrador')) {
    return true;
  }

  return permissionNames.some((permission) => {
    const normalized = String(permission || '').trim().toLowerCase();
    if (!normalized) return false;
    if (CRITICAL_PERMISSION_NAMES.has(normalized)) return true;
    return CRITICAL_PERMISSION_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  });
}

export function hasActiveEmployeeWithEquivalentPermissions(
  employees: EmployeeAccountSnapshot[],
  target: EmployeeAccountSnapshot,
  rolePermissionMap: Map<number, string[]>,
): boolean {
  const targetRoleId = target.id_roles != null ? Number(target.id_roles) : null;
  if (!targetRoleId || !rolePermissionMap.has(targetRoleId)) {
    return true;
  }

  const targetFingerprint = normalizePermissionFingerprint(rolePermissionMap.get(targetRoleId) || []);
  if (!targetFingerprint) {
    return true;
  }

  return employees.some((employee) => {
    if (employee.id === target.id) return false;
    if (employee.estado !== 'Activo') return false;
    const roleId = employee.id_roles != null ? Number(employee.id_roles) : null;
    if (!roleId || !rolePermissionMap.has(roleId)) return false;
    const fingerprint = normalizePermissionFingerprint(rolePermissionMap.get(roleId) || []);
    return fingerprint === targetFingerprint;
  });
}

export function getEmployeeDeactivationBlockReason(
  target: EmployeeAccountSnapshot,
  employees: EmployeeAccountSnapshot[],
  rolePermissionMap: Map<number, string[]>,
): string | null {
  const roleId = target.id_roles != null ? Number(target.id_roles) : null;
  const permissions = roleId != null ? rolePermissionMap.get(roleId) || [] : [];

  if (!isCriticalEmployeeAccount(target.rol_nombre, permissions)) {
    return null;
  }

  if (hasActiveEmployeeWithEquivalentPermissions(employees, target, rolePermissionMap)) {
    return null;
  }

  return CRITICAL_ACCOUNT_DEACTIVATION_MESSAGE;
}

export function willDeactivateEmployeeEstado(estado: string | undefined | null): boolean {
  const normalized = String(estado || '').trim();
  return normalized === 'Inactivo' || normalized === 'Suspendido';
}
