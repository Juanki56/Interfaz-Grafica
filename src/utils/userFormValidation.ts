import {
  documentoTitularCompletoValidoParaReserva,
  numeroDocumentoIdentidadValido,
} from './documentIdentityValidation';
import {
  digitsOnly,
  getClientPasswordRequirementChecks,
  hasNegativeOrInvalidNumericPattern,
  isStrongClientPassword,
  isValidClientEmail,
  isValidClientPhone,
  normalizeClientEmail,
  sanitizeDocumentInput,
  sanitizePhoneInput,
} from './clientFormValidation';

export const USER_DOC_TYPES = ['C.C.', 'C.E.', 'Pasaporte', 'T.I.', 'NIT'] as const;

export type UserFormInput = {
  nombre: string;
  apellido: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  documentType: string;
  documentNumber: string;
  password?: string;
  confirmPassword?: string;
};

export type UserValidationContext = {
  existingEmails?: string[];
  existingDocuments?: string[];
  currentUserId?: string;
};

export const USER_NAME_LIMITS = { min: 2, max: 80 } as const;

export function sanitizeUserNameInput(value: string): string {
  return String(value || '')
    .replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, USER_NAME_LIMITS.max);
}

export function isValidUserNamePart(value: string): boolean {
  const t = String(value || '').trim();
  if (t.length < 2 || t.length > 80) return false;
  if (!/[a-zA-ZÀ-ÿ\u00f1\u00d1]/.test(t)) return false;
  if (/^\d+$/.test(t)) return false;
  return true;
}

export function isValidUserDocumentPair(tipo: string, numero: string): boolean {
  if (hasNegativeOrInvalidNumericPattern(numero)) return false;
  if (/^0+$/.test(digitsOnly(numero))) return false;
  if (!documentoTitularCompletoValidoParaReserva(tipo, numero)) return false;
  return numeroDocumentoIdentidadValido(numero);
}

export function normalizeUserDocumentTypeForApi(value: string): string {
  const t = String(value || '').trim();
  if (!t || t === '−' || t === '-') return '';
  return t;
}

function isDuplicateInList(
  value: string,
  list: string[] | undefined,
  normalizer: (v: string) => string,
): boolean {
  if (!list?.length) return false;
  const key = normalizer(value);
  if (!key) return false;
  return list.some((item) => {
    const itemKey = normalizer(item);
    return Boolean(itemKey) && itemKey === key;
  });
}

export function validateUserFormFields(
  data: UserFormInput,
  mode: 'create' | 'edit',
  context: UserValidationContext = {},
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!isValidUserNamePart(data.nombre)) {
    errors.nombre = 'El nombre debe tener entre 2 y 80 letras (sin solo números).';
  }

  if (!isValidUserNamePart(data.apellido)) {
    errors.apellido = 'El apellido debe tener entre 2 y 80 letras (sin solo números).';
  }

  const email = normalizeClientEmail(data.email);
  if (!email) {
    errors.email = 'El correo electrónico es obligatorio.';
  } else if (!isValidClientEmail(email)) {
    errors.email = 'Ingresa un correo válido (usuario@dominio.com).';
  } else if (isDuplicateInList(email, context.existingEmails, normalizeClientEmail)) {
    errors.email = 'Este correo ya está registrado en otro usuario.';
  }

  const phone = sanitizePhoneInput(data.phone);
  if (!phone.trim() || phone === '−') {
    errors.phone = 'El teléfono es obligatorio.';
  } else if (!isValidClientPhone(phone)) {
    errors.phone = 'El teléfono debe tener entre 7 y 15 dígitos.';
  }

  const role = String(data.role || '').trim();
  if (!role) {
    errors.role = 'Selecciona un rol.';
  }

  const tipoDoc = normalizeUserDocumentTypeForApi(data.documentType);
  const numeroDoc = sanitizeDocumentInput(data.documentNumber);

  if (!tipoDoc) {
    errors.documentType = 'Selecciona el tipo de documento.';
  }

  if (!numeroDoc) {
    errors.documentNumber = 'El número de documento es obligatorio.';
  } else if (!isValidUserDocumentPair(tipoDoc, numeroDoc)) {
    errors.documentNumber =
      'Documento inválido: mínimo 6 caracteres alfanuméricos y tipo válido.';
  } else if (
    isDuplicateInList(numeroDoc, context.existingDocuments, (v) =>
      digitsOnly(sanitizeDocumentInput(v)).toLowerCase(),
    )
  ) {
    errors.documentNumber = 'Este número de documento ya está registrado.';
  }

  const status = String(data.status || '').trim();
  if (status !== 'Activo' && status !== 'Inactivo') {
    errors.status = 'Selecciona un estado válido.';
  }

  if (mode === 'create') {
    const pass = String(data.password || '');
    const confirm = String(data.confirmPassword || '');
    if (!pass) {
      errors.password = 'La contraseña es obligatoria para usuarios nuevos.';
    } else if (!isStrongClientPassword(pass)) {
      errors.password =
        'La contraseña debe tener 8–64 caracteres, con mayúscula, minúscula, número y símbolo.';
    }
    if (!confirm) {
      errors.confirmPassword = 'Confirma la contraseña.';
    } else if (pass !== confirm) {
      errors.confirmPassword = 'Las contraseñas no coinciden.';
    }
  } else if (data.password?.trim()) {
    if (!isStrongClientPassword(data.password)) {
      errors.password =
        'La nueva contraseña debe tener 8–64 caracteres, con mayúscula, minúscula, número y símbolo.';
    }
    if (data.confirmPassword && data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden.';
    }
  }

  return errors;
}

export function validateUserSingleField(
  field: string,
  data: UserFormInput,
  mode: 'create' | 'edit',
  context: UserValidationContext = {},
): string | null {
  const errors = validateUserFormFields(data, mode, context);
  return errors[field] ?? null;
}

export function validateUserFormForSubmit(
  data: UserFormInput,
  mode: 'create' | 'edit',
  context?: UserValidationContext,
): string | null {
  const errors = validateUserFormFields(data, mode, context);
  const first = Object.values(errors)[0];
  return first ?? null;
}

export function buildUserValidationContext(
  users: Array<{ id: string; email: string; numero_documento?: string }>,
  currentUserId?: string,
): UserValidationContext {
  return {
    existingEmails: users
      .filter((u) => u.id !== currentUserId)
      .map((u) => u.email)
      .filter((e) => e && e !== '−'),
    existingDocuments: users
      .filter((u) => u.id !== currentUserId)
      .map((u) => u.numero_documento || '')
      .filter((d) => d && d !== '−'),
    currentUserId,
  };
}

export { getClientPasswordRequirementChecks, sanitizeDocumentInput, sanitizePhoneInput, normalizeClientEmail };
