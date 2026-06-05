/** Finca disponible para catálogo, reservas y asignación (estado explícitamente activo). */
export function isFincaActiva(finca: { estado?: boolean | null | string | number } | null | undefined): boolean {
  if (!finca) return false;
  const e = finca.estado;
  if (e === true) return true;
  if (e === false) return false;
  const t = String(e ?? '')
    .trim()
    .toLowerCase();
  if (t === 'true' || t === '1' || t === 'activa' || t === 'activo' || t === 'active') return true;
  if (t === 'false' || t === '0' || t === 'inactiva' || t === 'inactivo' || t === 'inactive') return false;
  return false;
}

export function filterFincasActivas<T extends { estado?: boolean | null | string | number }>(
  fincas: T[] | null | undefined,
): T[] {
  return (fincas || []).filter(isFincaActiva);
}

/** Propietario asignable a una finca (solo activos). */
export function isPropietarioActivo(propietario: { estado?: boolean | null } | null | undefined): boolean {
  if (!propietario) return false;
  return propietario.estado !== false;
}
