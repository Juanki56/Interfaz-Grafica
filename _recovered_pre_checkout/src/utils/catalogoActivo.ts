/** Servicio del catálogo disponible para selección / reserva. */
export function isServicioCatalogoActivo(servicio: { estado?: boolean | null | string } | null | undefined): boolean {
  if (!servicio) return false;
  const e = servicio.estado;
  if (e === true) return true;
  if (e === false) return false;
  const t = String(e ?? '')
    .trim()
    .toLowerCase();
  if (t === 'true' || t === '1' || t === 'activo' || t === 'activa' || t === 'active') return true;
  if (t === 'false' || t === '0' || t === 'inactivo' || t === 'inactiva' || t === 'inactive') return false;
  return false;
}
