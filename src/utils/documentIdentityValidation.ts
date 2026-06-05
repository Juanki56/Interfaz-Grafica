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

/** Mensaje unificado al bloquear reservas por documento incompleto en Mi Perfil. */
export const MENSAJE_ACTUALIZAR_DOCUMENTO_PERFIL =
  'Actualiza tu tipo y número de documento en Mi Perfil antes de reservar (no uses guiones “-” ni valores vacíos).';

export const PROFILE_DOCUMENT_REMINDER_KEY = 'occitours_profile_document_reminder';

export function marcarRecordatorioDocumentoPerfil() {
  try {
    sessionStorage.setItem(PROFILE_DOCUMENT_REMINDER_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function extraerDocumentoTitularDesdePerfil(
  perfil?: Record<string, unknown> | null,
  user?: { tipo_documento?: string; numero_documento?: string } | null,
): { tipo: string; numero: string } {
  const tipo = String(
    perfil?.tipo_documento ?? perfil?.tipoDocumento ?? user?.tipo_documento ?? '',
  ).trim();
  const numero = String(
    perfil?.numero_documento ?? perfil?.numeroDocumento ?? user?.numero_documento ?? '',
  ).trim();
  return { tipo, numero };
}

export function titularTieneDocumentoValidoParaReserva(
  perfil?: Record<string, unknown> | null,
  user?: { tipo_documento?: string; numero_documento?: string } | null,
): boolean {
  const { tipo, numero } = extraerDocumentoTitularDesdePerfil(perfil, user);
  return documentoTitularCompletoValidoParaReserva(tipo, numero);
}

export function limpiarValorDocumentoDisplay(value: unknown): string {
  const s = String(value ?? '').trim();
  if (!s || s === '−' || s === '-' || s.toLowerCase() === 'documento no disponible') return '';
  return s;
}

/** Texto para tablas (ventas, abonos): tipo + número o solo número. */
export function formatDocumentoClienteDisplay(sources: {
  tipo?: unknown;
  numero?: unknown;
  cliente?: Record<string, unknown> | null;
}): string {
  const nested =
    sources.cliente && typeof sources.cliente === 'object' ? sources.cliente : null;
  const tipo = limpiarValorDocumentoDisplay(
    sources.tipo ?? nested?.tipo_documento ?? nested?.tipoDocumento,
  );
  const numero = limpiarValorDocumentoDisplay(
    sources.numero ??
      nested?.numero_documento ??
      nested?.numeroDocumento ??
      nested?.documento ??
      nested?.document_number,
  );
  if (tipo && numero) return `${tipo} ${numero}`;
  if (numero) return numero;
  if (tipo) return tipo;
  return 'Documento no disponible';
}
