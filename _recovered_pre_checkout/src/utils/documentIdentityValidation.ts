/**
 * Identidad obligatoria en reservas: la BD o formularios a veces guardan "-" o texto marcador en lugar de NULL.
 */

const PLACEHOLDER_EXACT_NUMERO = new Set([
  '-',
  '--',
  '—',
  '–',
  '/',
  '\\',
  '.',
  '..',
  'na',
  'n/a',
  's/n',
  'sn',
  'sin documento',
  'sin doc',
  'sin doc.',
  'ninguno',
  'ninguna',
  'pendiente',
  'por definir',
  'xxx',
  'xxxx',
  'null',
  'undefined',
  'tbd',
  'n/d',
]);

const PLACEHOLDER_EXACT_TIPO = new Set(['-', '--', '—', '–', '.', '..', 'na', 'n/a', 's/n', 'sn', '?', '/']);

/** Dígitos + letras (incluye tildes) tras quitar símbolos típicos de formato (CC ##.###.###). */
export function contarCaracteresAlfanumericosDoc(value: string): number {
  return String(value || '')
    .replace(/[^0-9A-Za-zÀ-ÿ\u00f1\u00d1]/g, '')
    .length;
}

/**
 * ¿Número de documento “real”? Rechaza guiones sueltos, n/a y cadenas muy cortas solo símbolos.
 * Colombia: típico CC/CE ≥ ~6 dígitos; otros documentos pueden mezclar letras/números.
 */
export function numeroDocumentoIdentidadValido(
  raw: unknown,
  opts?: { minAlfanumericos?: number },
): boolean {
  const min = opts?.minAlfanumericos ?? 6;
  const s = String(raw ?? '').trim();
  if (!s) return false;
  const compactSpace = s.toLowerCase().replace(/\s+/g, ' ');
  if (PLACEHOLDER_EXACT_NUMERO.has(compactSpace)) return false;
  if (PLACEHOLDER_EXACT_NUMERO.has(s)) return false;
  const digits = contarCaracteresAlfanumericosDoc(s);
  if (digits < min) return false;
  return true;
}

export function tipoDocumentoIdentidadValido(raw: unknown): boolean {
  const s = String(raw ?? '').trim();
  if (!s) return false;
  const lc = s.toLowerCase();
  if (PLACEHOLDER_EXACT_TIPO.has(lc)) return false;
  if (PLACEHOLDER_EXACT_TIPO.has(s.trim())) return false;
  /** Debe tener al menos una letra o ser un código conocido (CC, CE, TI, PA, PEP, ...) */
  if (s.length < 2) return false;
  return true;
}

export function documentoTitularCompletoValidoParaReserva(tipo: unknown, numero: unknown): boolean {
  return tipoDocumentoIdentidadValido(tipo) && numeroDocumentoIdentidadValido(numero);
}
