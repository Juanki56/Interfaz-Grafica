/**
 * Clasifica si un servicio del catálogo aplica a reservas de ruta o de finca.
 * El backend envía `aplica_a` ('finca' | 'ruta'); si falta, se usan pistas por categoría/nombre.
 */
export type ServicioAplicacion = 'ruta' | 'finca';

function norm(v: unknown): string {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Infiere a partir de la fila del API (Servicio u objeto genérico). */
export function inferirServicioAplicacion(raw: Record<string, unknown>): ServicioAplicacion {
  const explicit = norm(
    raw.aplica_a ?? raw.aplicaA ?? raw.tipo_aplicacion ?? raw.tipoAplicacion ?? raw.alcance ?? raw.ambito
  );
  if (explicit === 'ruta' || explicit === 'rutas') return 'ruta';
  if (explicit === 'finca' || explicit === 'fincas' || explicit === 'hospedaje') return 'finca';
  // Valores legacy: se tratan como ruta para no mezclar en flujos de finca sin clasificar.
  if (explicit === 'ambos' || explicit === 'todos' || explicit === 'mixto' || explicit === 'general') return 'ruta';

  const cat = norm(raw.categoria);
  if (cat === 'ruta' || cat === 'rutas' || cat.startsWith('ruta_')) return 'ruta';
  if (
    cat === 'finca' ||
    cat === 'fincas' ||
    cat === 'hospedaje' ||
    cat === 'evento' ||
    cat === 'eventos' ||
    cat.startsWith('finca_')
  ) {
    return 'finca';
  }

  const nombre = norm(raw.nombre);
  const blob = `${cat} ${nombre}`;
  if (/\b(solo|solamente)[\s_-]*rutas?\b/.test(blob)) return 'ruta';
  if (/\b(solo|solamente)[\s_-]*fincas?\b/.test(blob)) return 'finca';

  return 'ruta';
}

/** Para listados al reservar / asociar servicios: ¿mostrar este servicio en este contexto? */
export function servicioVisibleEnContexto(
  aplicacion: ServicioAplicacion,
  contexto: 'ruta' | 'finca'
): boolean {
  return aplicacion === contexto;
}
