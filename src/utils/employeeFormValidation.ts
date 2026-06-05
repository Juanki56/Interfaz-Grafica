import {
  documentoTitularCompletoValidoParaReserva,
  numeroDocumentoIdentidadValido,
  tipoDocumentoIdentidadValido,
} from './documentIdentityValidation';
import {
  digitsOnly,
  hasNegativeOrInvalidNumericPattern,
  isValidClientEmail,
  isValidClientPhone,
  normalizeClientEmail,
  sanitizeDocumentInput,
  sanitizePhoneInput,
} from './clientFormValidation';

export const EMPLOYEE_CARGOS = ['Asesor', 'Guía Turístico'] as const;
export const EMPLOYEE_DOC_TYPES = ['CC', 'CE', 'TI', 'PAS', 'PPT', 'NIT'] as const;
export const EMPLOYEE_ESTADOS_CREATE = ['Activo', 'Inactivo'] as const;
export const EMPLOYEE_ESTADOS_EDIT = ['Activo', 'Inactivo', 'Suspendido'] as const;

export const EMPLOYEE_LIMITS = {
  nombre: { min: 2, max: 80 },
  apellido: { min: 2, max: 80 },
  email: { min: 5, max: 254 },
  telefono: { minDigits: 7, maxDigits: 15, maxChars: 20 },
  documento: { minAlfanum: 6, max: 20 },
  contrasena: { min: 8, max: 128 },
} as const;

/** Normaliza tipos de documento del backend (p. ej. "C.C." → "CC"). */
export function normalizeEmployeeDocType(raw?: string | null): string {
  const compact = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/\s+/g, '');
  if ((EMPLOYEE_DOC_TYPES as readonly string[]).includes(compact)) return compact;
  return 'CC';
}

export function parseEmployeeDocType(raw?: string | null): string {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/\s+/g, '');
}

export function sanitizeEmployeeNameInput(value: string): string {
  return String(value || '')
    .replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, EMPLOYEE_LIMITS.nombre.max);
}

export function sanitizeEmployeePhoneInput(value: string): string {
  const cleaned = sanitizePhoneInput(value);
  let digitCount = 0;
  let result = '';

  for (const ch of cleaned) {
    if (/\d/.test(ch)) {
      if (digitCount >= EMPLOYEE_LIMITS.telefono.maxDigits) continue;
      digitCount += 1;
    }
    result += ch;
    if (result.length >= EMPLOYEE_LIMITS.telefono.maxChars) break;
  }

  return result;
}

export type EmployeeFormInput = {
  nombre: string;
  apellido: string;
  email: string;
  documento: string;
  tipo_documento: string;
  telefono: string;
  cargo: string;
  estado?: string;
  contrasena?: string;
  confirmarContrasena?: string;
};

export type EmployeeValidationContext = {
  existingEmails?: string[];
  existingDocuments?: string[];
  currentEmployeeId?: string;
  currentEmployeeDocument?: string;
  currentEmployeeEmail?: string;
};

export function cargoToRol(cargo: string): 'advisor' | 'guide' {
  const c = String(cargo || '').toLowerCase();
  return c.includes('guía') || c.includes('guia') ? 'guide' : 'advisor';
}

export function isValidEmployeeNamePart(value: string): boolean {
  return getEmployeeNamePartError(value, 'nombre') === null;
}

export function getEmployeeNamePartError(
  value: string,
  fieldLabel: 'nombre' | 'apellido',
): string | null {
  const t = String(value || '').trim();
  const label = fieldLabel === 'nombre' ? 'nombre' : 'apellido';

  if (!t) return `El ${label} es obligatorio.`;
  if (t.length < EMPLOYEE_LIMITS.nombre.min) {
    return `El ${label} debe tener al menos ${EMPLOYEE_LIMITS.nombre.min} caracteres.`;
  }
  if (t.length > EMPLOYEE_LIMITS.nombre.max) {
    return `El ${label} no puede superar ${EMPLOYEE_LIMITS.nombre.max} caracteres.`;
  }
  if (!/[a-zA-ZÀ-ÿ\u00f1\u00d1]/.test(t)) {
    return `El ${label} solo puede contener letras.`;
  }
  if (/^\d+$/.test(t)) {
    return `El ${label} no puede ser solo números.`;
  }
  return null;
}

export function isValidEmployeeCargo(value: string): boolean {
  const t = String(value || '').trim();
  return (EMPLOYEE_CARGOS as readonly string[]).includes(t);
}

export function isValidEmployeeEstado(value: string, mode: 'create' | 'edit'): boolean {
  const allowed = mode === 'create' ? EMPLOYEE_ESTADOS_CREATE : EMPLOYEE_ESTADOS_EDIT;
  return (allowed as readonly string[]).includes(String(value || '').trim());
}

export function isValidEmployeeDocumentType(value: string): boolean {
  const tipo = parseEmployeeDocType(value);
  return (EMPLOYEE_DOC_TYPES as readonly string[]).includes(tipo) && tipoDocumentoIdentidadValido(tipo);
}

export function isValidEmployeeDocumentPair(tipo: string, numero: string): boolean {
  if (!isValidEmployeeDocumentType(tipo)) return false;
  if (hasNegativeOrInvalidNumericPattern(numero)) return false;
  if (/^0+$/.test(digitsOnly(numero))) return false;
  if (!documentoTitularCompletoValidoParaReserva(tipo, numero)) return false;
  return numeroDocumentoIdentidadValido(numero);
}

export function getEmployeeEmailError(
  value: string,
  mode: 'create' | 'edit',
  context: EmployeeValidationContext,
): string | null {
  const email = normalizeClientEmail(value);

  if (!email) return 'El correo electrónico es obligatorio.';
  if (email.length < EMPLOYEE_LIMITS.email.min) {
    return 'El correo es demasiado corto.';
  }
  if (email.length > EMPLOYEE_LIMITS.email.max) {
    return `El correo no puede superar ${EMPLOYEE_LIMITS.email.max} caracteres.`;
  }
  if (!isValidClientEmail(email)) {
    return 'Ingresa un correo válido (usuario@dominio.com).';
  }

  const emailsForDuplicate = (context.existingEmails ?? []).filter((item) => {
    if (mode !== 'edit' || !context.currentEmployeeEmail) return true;
    return normalizeClientEmail(item) !== normalizeClientEmail(context.currentEmployeeEmail);
  });
  if (isDuplicateInList(email, emailsForDuplicate, normalizeClientEmail)) {
    return 'Este correo ya está registrado en otro empleado.';
  }

  return null;
}

export function getEmployeePhoneError(value: string): string | null {
  const phone = sanitizeEmployeePhoneInput(value);

  if (!phone.trim()) return 'El teléfono es obligatorio.';
  if (hasNegativeOrInvalidNumericPattern(value)) {
    return 'El teléfono no puede ser negativo ni inválido.';
  }

  const digitCount = digitsOnly(phone).length;
  if (digitCount < EMPLOYEE_LIMITS.telefono.minDigits) {
    return `El teléfono debe tener al menos ${EMPLOYEE_LIMITS.telefono.minDigits} dígitos.`;
  }
  if (digitCount > EMPLOYEE_LIMITS.telefono.maxDigits) {
    return `El teléfono no puede superar ${EMPLOYEE_LIMITS.telefono.maxDigits} dígitos.`;
  }
  if (!isValidClientPhone(phone)) {
    return `El teléfono debe tener entre ${EMPLOYEE_LIMITS.telefono.minDigits} y ${EMPLOYEE_LIMITS.telefono.maxDigits} dígitos.`;
  }

  return null;
}

export function getEmployeeDocumentTypeError(value: string): string | null {
  const tipo = parseEmployeeDocType(value);
  if (!tipo) return 'Selecciona el tipo de documento.';
  if (!(EMPLOYEE_DOC_TYPES as readonly string[]).includes(tipo)) {
    return 'Selecciona un tipo válido (CC, CE, TI, PAS, PPT o NIT).';
  }
  if (!tipoDocumentoIdentidadValido(tipo)) {
    return 'El tipo de documento no es válido.';
  }
  return null;
}

export function getEmployeeDocumentNumberError(
  tipo: string,
  numero: string,
  mode: 'create' | 'edit',
  context: EmployeeValidationContext,
): string | null {
  const numeroDoc = sanitizeDocumentInput(numero);
  const tipoDoc = parseEmployeeDocType(tipo);

  if (!numeroDoc) return 'El número de documento es obligatorio.';
  if (numeroDoc.length > EMPLOYEE_LIMITS.documento.max) {
    return `El documento no puede superar ${EMPLOYEE_LIMITS.documento.max} caracteres.`;
  }
  if (hasNegativeOrInvalidNumericPattern(numeroDoc)) {
    return 'El número de documento no puede ser negativo.';
  }
  if (/^0+$/.test(digitsOnly(numeroDoc))) {
    return 'El número de documento no puede ser solo ceros.';
  }
  if (!isValidEmployeeDocumentType(tipoDoc)) {
    return 'Selecciona primero un tipo de documento válido.';
  }
  if (!isValidEmployeeDocumentPair(tipoDoc, numeroDoc)) {
    return `Documento inválido: mínimo ${EMPLOYEE_LIMITS.documento.minAlfanum} caracteres alfanuméricos para el tipo seleccionado.`;
  }

  const normDoc = (v: string) => digitsOnly(sanitizeDocumentInput(v)).toLowerCase();
  const docsForDuplicate = (context.existingDocuments ?? []).filter((doc) => {
    if (mode !== 'edit' || !context.currentEmployeeDocument) return true;
    return normDoc(doc) !== normDoc(context.currentEmployeeDocument);
  });
  if (isDuplicateInList(numeroDoc, docsForDuplicate, normDoc)) {
    return 'Este número de documento ya está registrado.';
  }

  return null;
}

/** Contraseña inicial: alineada con política reforzada del sistema (mín. 8 caracteres). */
export function isValidEmployeePassword(value: string): boolean {
  return getEmployeePasswordError(value) === null;
}

export function getEmployeePasswordError(value: string): string | null {
  const pass = String(value || '');
  if (!pass) return 'La contraseña es obligatoria.';
  if (pass.length < EMPLOYEE_LIMITS.contrasena.min || pass.length > EMPLOYEE_LIMITS.contrasena.max) {
    return `La contraseña debe tener entre ${EMPLOYEE_LIMITS.contrasena.min} y ${EMPLOYEE_LIMITS.contrasena.max} caracteres.`;
  }
  if (!/[A-Z]/.test(pass)) return 'La contraseña debe incluir al menos una mayúscula.';
  if (!/[a-z]/.test(pass)) return 'La contraseña debe incluir al menos una minúscula.';
  if (!/[0-9]/.test(pass)) return 'La contraseña debe incluir al menos un número.';
  return null;
}

export function getEmployeePasswordRequirementChecks(password: string) {
  const value = String(password || '');
  return [
    {
      id: 'length',
      label: `Entre ${EMPLOYEE_LIMITS.contrasena.min} y ${EMPLOYEE_LIMITS.contrasena.max} caracteres`,
      met: value.length >= EMPLOYEE_LIMITS.contrasena.min && value.length <= EMPLOYEE_LIMITS.contrasena.max,
    },
    { id: 'upper', label: 'Al menos una mayúscula', met: /[A-Z]/.test(value) },
    { id: 'lower', label: 'Al menos una minúscula', met: /[a-z]/.test(value) },
    { id: 'digit', label: 'Al menos un número', met: /[0-9]/.test(value) },
  ];
}

function isDuplicateInList(
  value: string,
  list: string[] | undefined,
  normalizer: (v: string) => string,
): boolean {
  if (!list?.length) return false;
  const key = normalizer(value);
  if (!key) return false;
  return list.some((item) => normalizer(item) === key);
}

export function validateEmployeeFormFields(
  data: EmployeeFormInput,
  mode: 'create' | 'edit',
  context: EmployeeValidationContext = {},
): Record<string, string> {
  const errors: Record<string, string> = {};

  const nombreError = getEmployeeNamePartError(data.nombre, 'nombre');
  if (nombreError) errors.nombre = nombreError;

  const apellidoError = getEmployeeNamePartError(data.apellido, 'apellido');
  if (apellidoError) errors.apellido = apellidoError;

  const emailError = getEmployeeEmailError(data.email, mode, context);
  if (emailError) errors.email = emailError;

  const phoneError = getEmployeePhoneError(data.telefono);
  if (phoneError) errors.telefono = phoneError;

  const cargo = String(data.cargo || '').trim();
  if (!cargo) {
    errors.cargo = 'Selecciona un cargo.';
  } else if (!isValidEmployeeCargo(cargo)) {
    errors.cargo = 'El cargo debe ser Asesor o Guía Turístico.';
  }

  const tipoDocError = getEmployeeDocumentTypeError(data.tipo_documento);
  if (tipoDocError) errors.tipo_documento = tipoDocError;

  const documentoError = getEmployeeDocumentNumberError(
    data.tipo_documento,
    data.documento,
    mode,
    context,
  );
  if (documentoError) errors.documento = documentoError;

  const estado = String(data.estado || '').trim();
  if (!estado) {
    errors.estado = 'Selecciona un estado.';
  } else if (!isValidEmployeeEstado(estado, mode)) {
    errors.estado = mode === 'create'
      ? 'El estado debe ser Activo o Inactivo.'
      : 'El estado debe ser Activo, Inactivo o Suspendido.';
  }

  const pass = String(data.contrasena || '');
  const confirm = String(data.confirmarContrasena || '');

  if (mode === 'create') {
    const passError = getEmployeePasswordError(pass);
    if (passError) errors.contrasena = passError;
    if (!confirm) {
      errors.confirmarContrasena = 'Confirma la contraseña.';
    } else if (pass !== confirm) {
      errors.confirmarContrasena = 'Las contraseñas no coinciden.';
    }
  }

  if (mode === 'edit' && (pass || confirm)) {
    if (!pass) {
      errors.contrasena = 'Ingresa la nueva contraseña.';
    } else {
      const passError = getEmployeePasswordError(pass);
      if (passError) errors.contrasena = passError;
    }
    if (!confirm) {
      errors.confirmarContrasena = 'Confirma la nueva contraseña.';
    } else if (pass !== confirm) {
      errors.confirmarContrasena = 'Las contraseñas no coinciden.';
    }
  }

  return errors;
}

export function validateEmployeeSingleField(
  field: string,
  data: EmployeeFormInput,
  mode: 'create' | 'edit',
  context: EmployeeValidationContext = {},
): string | null {
  const errors = validateEmployeeFormFields(data, mode, context);
  return errors[field] ?? null;
}

export function validateEmployeeFormForSubmit(
  data: EmployeeFormInput,
  mode: 'create' | 'edit',
  context?: EmployeeValidationContext,
): string | null {
  const errors = validateEmployeeFormFields(data, mode, context);
  const first = Object.values(errors)[0];
  return first ?? null;
}

export { sanitizeDocumentInput, sanitizePhoneInput, normalizeClientEmail };
