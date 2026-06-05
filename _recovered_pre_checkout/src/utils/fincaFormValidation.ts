export const FINCA_LIMITS = {
  nombre: { min: 1, max: 150 },
  ubicacion: { max: 200 },
  direccion: { max: 500 },
  descripcion: { max: 4000 },
  capacidad: { min: 1, max: 500 },
  precio: { min: 0, max: 1_000_000_000 },
  maxGalleryFiles: 5,
  maxCoverFiles: 1,
  maxImageBytes: 5 * 1024 * 1024,
} as const;

export type FincaFormInput = {
  nombre: string;
  ubicacion?: string;
  direccion?: string;
  descripcion?: string;
  capacidad_personas?: string | number;
  precio_por_noche?: string | number;
  id_propietario?: string | number;
};

export const FINCA_PORTADA_URL_RE = /\/principal\.(png|jpe?g|webp|gif|bmp)$/i;

export const isFincaPortadaUrl = (url: string) => FINCA_PORTADA_URL_RE.test(String(url || ''));

export function hasNegativeNumericPattern(value: string): boolean {
  const s = String(value ?? '').trim();
  if (!s) return false;
  return /^-/.test(s) || /-\d/.test(s);
}

export function sanitizeFincaText(value: string, max: number): string {
  return String(value ?? '').slice(0, max);
}

/** Solo dígitos enteros positivos (sin signo negativo). */
export function sanitizeCapacityInput(value: string): string {
  return String(value ?? '')
    .replace(/\D/g, '')
    .replace(/^0+(\d)/, '$1')
    .slice(0, 3);
}

/** Precio: dígitos y un punto decimal; sin negativos. */
export function sanitizePriceInput(value: string): string {
  let s = String(value ?? '').replace(/,/g, '.').replace(/[^\d.]/g, '');
  if (s.startsWith('.')) s = `0${s}`;
  const parts = s.split('.');
  if (parts.length > 2) {
    s = `${parts[0]}.${parts.slice(1).join('')}`;
  }
  const [entero = '', dec = ''] = s.split('.');
  const enteroLim = entero.slice(0, 12);
  const decLim = dec.slice(0, 2);
  return decLim.length > 0 || s.includes('.') ? `${enteroLim}.${decLim}` : enteroLim;
}

export function validateFincaForm(
  data: FincaFormInput,
  opts?: { requireNombre?: boolean },
): { valid: true; payload: Record<string, unknown> } | { valid: false; error: string } {
  const requireNombre = opts?.requireNombre !== false;

  const nombre = String(data.nombre ?? '').trim().replace(/\s+/g, ' ');
  if (requireNombre && nombre.length < FINCA_LIMITS.nombre.min) {
    return { valid: false, error: 'El nombre de la finca es obligatorio.' };
  }
  if (nombre.length > FINCA_LIMITS.nombre.max) {
    return {
      valid: false,
      error: `El nombre no puede superar ${FINCA_LIMITS.nombre.max} caracteres.`,
    };
  }

  const ubicacion = String(data.ubicacion ?? '').trim();
  if (ubicacion.length > FINCA_LIMITS.ubicacion.max) {
    return {
      valid: false,
      error: `La ubicación no puede superar ${FINCA_LIMITS.ubicacion.max} caracteres.`,
    };
  }

  const direccion = String(data.direccion ?? '').trim();
  if (direccion.length > FINCA_LIMITS.direccion.max) {
    return {
      valid: false,
      error: `La dirección no puede superar ${FINCA_LIMITS.direccion.max} caracteres.`,
    };
  }

  const descripcion = String(data.descripcion ?? '').trim();
  if (descripcion.length > FINCA_LIMITS.descripcion.max) {
    return {
      valid: false,
      error: `La descripción no puede superar ${FINCA_LIMITS.descripcion.max} caracteres.`,
    };
  }

  let capacidad: number | undefined;
  const capRaw = String(data.capacidad_personas ?? '').trim();
  if (capRaw) {
    if (hasNegativeNumericPattern(capRaw)) {
      return { valid: false, error: 'La capacidad no puede ser negativa.' };
    }
    capacidad = parseInt(capRaw, 10);
    if (!Number.isFinite(capacidad) || capacidad < FINCA_LIMITS.capacidad.min) {
      return {
        valid: false,
        error: `La capacidad debe ser al menos ${FINCA_LIMITS.capacidad.min} persona.`,
      };
    }
    if (capacidad > FINCA_LIMITS.capacidad.max) {
      return {
        valid: false,
        error: `La capacidad no puede superar ${FINCA_LIMITS.capacidad.max} personas.`,
      };
    }
  }

  let precio: number | undefined;
  const precioRaw = String(data.precio_por_noche ?? '').trim();
  if (precioRaw) {
    if (hasNegativeNumericPattern(precioRaw)) {
      return { valid: false, error: 'El precio por noche no puede ser negativo.' };
    }
    precio = parseFloat(precioRaw);
    if (!Number.isFinite(precio) || precio < FINCA_LIMITS.precio.min) {
      return { valid: false, error: 'El precio por noche debe ser mayor o igual a 0.' };
    }
    if (precio > FINCA_LIMITS.precio.max) {
      return { valid: false, error: 'El precio por noche es demasiado alto.' };
    }
  }

  let id_propietario: number | undefined;
  const ownerRaw = String(data.id_propietario ?? '').trim();
  if (ownerRaw) {
    if (hasNegativeNumericPattern(ownerRaw)) {
      return { valid: false, error: 'El propietario seleccionado no es válido.' };
    }
    const id = parseInt(ownerRaw, 10);
    if (!Number.isFinite(id) || id < 1) {
      return { valid: false, error: 'Selecciona un propietario válido de la lista.' };
    }
    id_propietario = id;
  }

  return {
    valid: true,
    payload: {
      nombre,
      ubicacion: ubicacion || undefined,
      direccion: direccion || undefined,
      descripcion: descripcion || undefined,
      capacidad_personas: capacidad,
      precio_por_noche: precio,
      id_propietario,
    },
  };
}
