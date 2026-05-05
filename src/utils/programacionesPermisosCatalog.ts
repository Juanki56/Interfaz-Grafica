import { permisosAPI, type Permiso } from '../services/api';

/** Namespace del módulo en el catálogo (primer segmento de programaciones.leer, etc.) */
export const PROGRAMACIONES_MODULE_KEY = 'programaciones';

/**
 * Definiciones que deben existir en `permisos` para que Roles / usePermissions funcionen
 * con createModulePermissions(..., 'Programaciones').
 */
export const PROGRAMACIONES_PERMISO_DEFINICIONES: ReadonlyArray<{ nombre: string; descripcion: string }> = [
  { nombre: 'programaciones.leer', descripcion: 'Consultar programaciones operativas y personalizadas' },
  { nombre: 'programaciones.crear', descripcion: 'Crear nuevas programaciones' },
  { nombre: 'programaciones.editar', descripcion: 'Editar programaciones existentes' },
  { nombre: 'programaciones.eliminar', descripcion: 'Eliminar programaciones' },
];

/**
 * Intenta crear en el backend los permisos faltantes y devuelve el catálogo actualizado.
 * Si el API no implementa POST /api/permisos, no hace nada útil y habrá que cargar el SQL manualmente.
 */
export async function ensureProgramacionesPermisosInCatalog(catalog: Permiso[]): Promise<Permiso[]> {
  const byName = new Set((catalog || []).map((p) => p.nombre));
  let createdAny = false;

  for (const def of PROGRAMACIONES_PERMISO_DEFINICIONES) {
    if (byName.has(def.nombre)) continue;
    try {
      await permisosAPI.create(def);
      createdAny = true;
      byName.add(def.nombre);
    } catch {
      /* sin POST o sin permiso: se usa script SQL */
    }
  }

  if (!createdAny) {
    return catalog;
  }

  try {
    return await permisosAPI.getAll();
  } catch {
    return catalog;
  }
}
