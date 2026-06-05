export const RUTA_LIMITS = {
  nombre: { min: 1, max: 150 },
  ubicacion: { max: 200 },
  descripcion: { max: 4000 },
  recomendaciones: { max: 4000 },
  briefing: { max: 4000 },
  precio: { min: 0, max: 1_000_000_000 },
  duracion_dias: { min: 1, max: 365 },
} as const;

export type RutaFormInput = {
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  duracion_dias?: string;
  precio_base?: string;
  dificultad?: string;
  recomendaciones_participantes?: string;
  briefing_operativo_equipo?: string;
};

export function sanitizeRutaText(value: string, max: number): string {
  return String(value ?? '').slice(0, max);
}

export function hasNegativeNumericPattern(value: string): boolean {
  const s = String(value ?? '').trim();
  if (!s) return false;
  return /^-/.test(s) || /-\d/.test(s);
}

export function validateRutaForm(
  data: RutaFormInput,
  opts?: { requireNombre?: boolean },
):
  | {
      valid: true;
      payload: {
        nombre: string;
        descripcion: string | null;
        ubicacion: string | null;
        duracion_dias: number | null;
        precio_base: number | null;
        dificultad: string | null;
        recomendaciones_participantes: string | null;
        briefing_operativo_equipo: string | null;
      };
    }
  | { valid: false; error: string } {
  const requireNombre = opts?.requireNombre !== false;

  const nombre = String(data.nombre ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  if (requireNombre && nombre.length < RUTA_LIMITS.nombre.min) {
    return { valid: false, error: 'El nombre de la ruta es obligatorio.' };
  }
  if (nombre.length > RUTA_LIMITS.nombre.max) {
    return {
      valid: false,
      error: `El nombre no puede superar ${RUTA_LIMITS.nombre.max} caracteres.`,
    };
  }

  const ubicacion = String(data.ubicacion ?? '').trim();
  if (ubicacion.length > RUTA_LIMITS.ubicacion.max) {
    return {
      valid: false,
      error: `La ubicación no puede superar ${RUTA_LIMITS.ubicacion.max} caracteres.`,
    };
  }

  const descripcion = String(data.descripcion ?? '').trim();
  if (descripcion.length > RUTA_LIMITS.descripcion.max) {
    return {
      valid: false,
      error: `La descripción no puede superar ${RUTA_LIMITS.descripcion.max} caracteres.`,
    };
  }

  const recomendaciones = String(data.recomendaciones_participantes ?? '').trim();
  if (recomendaciones.length > RUTA_LIMITS.recomendaciones.max) {
    return {
      valid: false,
      error: `Las recomendaciones no pueden superar ${RUTA_LIMITS.recomendaciones.max} caracteres.`,
    };
  }

  const briefing = String(data.briefing_operativo_equipo ?? '').trim();
  if (briefing.length > RUTA_LIMITS.briefing.max) {
    return {
      valid: false,
      error: `El briefing operativo no puede superar ${RUTA_LIMITS.briefing.max} caracteres.`,
    };
  }

  let duracion_dias: number | null = null;
  const durRaw = String(data.duracion_dias ?? '').trim();
  if (durRaw) {
    if (hasNegativeNumericPattern(durRaw)) {
      return { valid: false, error: 'La duración no puede ser negativa.' };
    }
    duracion_dias = parseInt(durRaw, 10);
    if (!Number.isFinite(duracion_dias) || duracion_dias < RUTA_LIMITS.duracion_dias.min) {
      return {
        valid: false,
        error: `La duración debe ser al menos ${RUTA_LIMITS.duracion_dias.min} día.`,
      };
    }
    if (duracion_dias > RUTA_LIMITS.duracion_dias.max) {
      return {
        valid: false,
        error: `La duración no puede superar ${RUTA_LIMITS.duracion_dias.max} días.`,
      };
    }
  }

  let precio_base: number | null = null;
  const precioRaw = String(data.precio_base ?? '').trim();
  if (precioRaw) {
    if (hasNegativeNumericPattern(precioRaw)) {
      return { valid: false, error: 'El precio no puede ser negativo.' };
    }
    precio_base = parseFloat(precioRaw.replace(/,/g, '.'));
    if (!Number.isFinite(precio_base) || precio_base <= 0) {
      return { valid: false, error: 'El precio debe ser un número mayor a 0.' };
    }
    if (precio_base > RUTA_LIMITS.precio.max) {
      return {
        valid: false,
        error: `El precio no puede superar ${RUTA_LIMITS.precio.max.toLocaleString('es-CO')}.`,
      };
    }
  }

  const dificultad = String(data.dificultad ?? '').trim() || null;

  return {
    valid: true,
    payload: {
      nombre,
      descripcion: descripcion || null,
      ubicacion: ubicacion || null,
      duracion_dias,
      precio_base,
      dificultad,
      recomendaciones_participantes: recomendaciones || null,
      briefing_operativo_equipo: briefing || null,
    },
  };
}

export function findRouteNameConflict(
  routes: Array<{ id_ruta: number; nombre?: string | null }>,
  opts: { nombre: string; excludeIdRuta?: number },
): boolean {
  const target = String(opts.nombre || '')
    .trim()
    .toLowerCase();
  if (!target) return false;

  return routes.some((route) => {
    if (opts.excludeIdRuta != null && route.id_ruta === opts.excludeIdRuta) {
      return false;
    }
    return String(route.nombre || '')
      .trim()
      .toLowerCase() === target;
  });
}
