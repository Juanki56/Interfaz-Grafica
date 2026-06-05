import {
  documentoTitularCompletoValidoParaReserva,
  numeroDocumentoIdentidadValido,
} from './documentIdentityValidation';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ClientFormValidationInput = {
  name: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  address?: string;
  birthDate?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  gender?: string;
  nationality?: string;
  preferences?: string;
  notes?: string;
  password?: string;
  confirmPassword?: string;
};

export function digitsOnly(value: string): string {
  return String(value || '').replace(/\D/g, '');
}

export function hasNegativeOrInvalidNumericPattern(value: string): boolean {
  const s = String(value || '').trim();
  if (!s) return false;
  if (/^-/.test(s)) return true;
  return false;
}

export function sanitizePhoneInput(value: string): string {
  return String(value || '')
    .replace(/[^\d+\s().-]/g, '')
    .replace(/^-+/, '')
    .slice(0, 20);
}

export function sanitizeDocumentInput(value: string): string {
  return String(value || '')
    .replace(/[^\dA-Za-zÀ-ÿ.-]/g, '')
    .replace(/^-+/, '')
    .slice(0, 20);
}

export function sanitizePostalCodeInput(value: string): string {
  return digitsOnly(value).slice(0, 10);
}

export function normalizeClientEmail(value: string): string {
  return String(value || '').trim().toLowerCase();
}

export function isValidClientEmail(value: string): boolean {
  const email = normalizeClientEmail(value);
  if (!email) return false;
  if (email.length > 254) return false;
  return EMAIL_REGEX.test(email);
}

export function isValidClientFullName(value: string): boolean {
  const trimmed = String(value || '').trim();
  if (trimmed.length < 5 || trimmed.length > 120) return false;
  if (!/[a-zA-ZÀ-ÿ\u00f1\u00d1]/.test(trimmed)) return false;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false;
  if (parts.some((part) => part.length < 2)) return false;
  return true;
}

export function isValidClientPhone(value: string): boolean {
  if (hasNegativeOrInvalidNumericPattern(value)) return false;
  const digits = digitsOnly(value);
  return digits.length >= 7 && digits.length <= 15;
}

export function isValidClientDocumentPair(tipo: string, numero: string): boolean {
  if (hasNegativeOrInvalidNumericPattern(numero)) return false;
  if (/^0+$/.test(digitsOnly(numero))) return false;
  if (!documentoTitularCompletoValidoParaReserva(tipo, numero)) return false;
  return numeroDocumentoIdentidadValido(numero);
}

export function isValidOptionalPostalCode(value: string): boolean {
  const trimmed = String(value || '').trim();
  if (!trimmed) return true;
  if (hasNegativeOrInvalidNumericPattern(trimmed)) return false;
  const digits = digitsOnly(trimmed);
  return digits.length >= 4 && digits.length <= 10;
}

export function isValidOptionalBirthDate(value: string): boolean {
  const raw = String(value || '').trim();
  if (!raw) return true;

  const date = new Date(`${raw.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date > today) return false;

  const minDate = new Date('1900-01-01T12:00:00');
  if (date < minDate) return false;

  const maxAge = new Date();
  maxAge.setFullYear(maxAge.getFullYear() - 120);
  if (date < maxAge) return false;

  return true;
}

export function isValidOptionalText(value: string, maxLength: number): boolean {
  return String(value || '').trim().length <= maxLength;
}

export function isStrongClientPassword(value: string): boolean {
  if (!value || value.length < 8 || value.length > 64) return false;
  if (!/[A-Z]/.test(value)) return false;
  if (!/[a-z]/.test(value)) return false;
  if (!/[0-9]/.test(value)) return false;
  if (!/[!@#$%^&*()[\]{}\-_=+;:,.?/\\|~`]/.test(value)) return false;
  return true;
}

export type PasswordRequirementCheck = {
  id: string;
  label: string;
  met: boolean;
};

export function getClientPasswordRequirementChecks(password: string): PasswordRequirementCheck[] {
  const value = String(password || '');
  return [
    {
      id: 'length',
      label: 'Entre 8 y 64 caracteres',
      met: value.length >= 8 && value.length <= 64,
    },
    { id: 'upper', label: 'Al menos una mayúscula (A-Z)', met: /[A-Z]/.test(value) },
    { id: 'lower', label: 'Al menos una minúscula (a-z)', met: /[a-z]/.test(value) },
    { id: 'digit', label: 'Al menos un número (0-9)', met: /[0-9]/.test(value) },
    {
      id: 'symbol',
      label: 'Al menos un símbolo (!@#$%^&*...)',
      met: /[!@#$%^&*()[\]{}\-_=+;:,.?/\\|~`]/.test(value),
    },
  ];
}

export function validateClientPasswordChange(params: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): string | null {
  const current = String(params.currentPassword || '');
  const next = String(params.newPassword || '');
  const confirm = String(params.confirmPassword || '');

  if (!current.trim() || !next.trim() || !confirm.trim()) {
    return 'Completa la contraseña actual, la nueva y la confirmación.';
  }

  if (next !== confirm) {
    return 'La nueva contraseña y la confirmación no coinciden.';
  }

  if (current === next) {
    return 'La nueva contraseña debe ser diferente a la actual.';
  }

  if (!isStrongClientPassword(next)) {
    return 'La nueva contraseña debe tener entre 8 y 64 caracteres, con mayúscula, minúscula, número y símbolo.';
  }

  return null;
}

function validateOptionalFields(data: ClientFormValidationInput): string | null {
  if (!isValidOptionalText(data.address || '', 200)) {
    return 'La dirección no puede superar 200 caracteres.';
  }
  if (!isValidOptionalText(data.city || '', 80)) {
    return 'La ciudad no puede superar 80 caracteres.';
  }
  if (!isValidOptionalText(data.country || '', 80)) {
    return 'El país no puede superar 80 caracteres.';
  }
  if (!isValidOptionalText(data.gender || '', 30)) {
    return 'El género no puede superar 30 caracteres.';
  }
  if (!isValidOptionalText(data.nationality || '', 80)) {
    return 'La nacionalidad no puede superar 80 caracteres.';
  }
  if (!isValidOptionalText(data.preferences || '', 500)) {
    return 'Las preferencias no pueden superar 500 caracteres.';
  }
  if (!isValidOptionalText(data.notes || '', 1000)) {
    return 'Las notas no pueden superar 1000 caracteres.';
  }
  if (!isValidOptionalPostalCode(data.postalCode || '')) {
    return 'El código postal debe tener entre 4 y 10 dígitos (sin signos negativos).';
  }
  if (!isValidOptionalBirthDate(data.birthDate || '')) {
    return 'La fecha de nacimiento no es válida (no puede ser futura ni anterior a 1900).';
  }
  return null;
}

export function validateClientFormForCreate(data: ClientFormValidationInput): string | null {
  if (!data.name?.trim() || !data.email?.trim() || !data.phone?.trim() || !data.password?.trim()) {
    return 'Por favor complete todos los campos requeridos.';
  }

  if (!isValidClientFullName(data.name)) {
    return 'Ingresa nombre y apellido completos (mínimo 2 palabras, sin solo números).';
  }

  if (!isValidClientEmail(data.email)) {
    return 'El correo no es válido. Debe tener formato usuario@dominio.com';
  }

  if (!isValidClientPhone(data.phone)) {
    return 'El teléfono debe tener entre 7 y 15 dígitos, sin signos negativos.';
  }

  if (!data.documentType?.trim() || !data.documentNumber?.trim()) {
    return 'El tipo y número de documento son obligatorios.';
  }

  if (!isValidClientDocumentPair(data.documentType, data.documentNumber)) {
    return 'El documento no es válido. Debe tener al menos 6 caracteres alfanuméricos y no puede ser negativo ni un marcador como "-".';
  }

  if (data.password !== data.confirmPassword) {
    return 'Las contraseñas no coinciden.';
  }

  if (!isStrongClientPassword(data.password || '')) {
    return 'La contraseña debe tener entre 8 y 64 caracteres, con mayúscula, minúscula, número y símbolo.';
  }

  return validateOptionalFields(data);
}

export function validateClientFormForEdit(data: ClientFormValidationInput): string | null {
  if (!data.name?.trim() || !data.email?.trim() || !data.phone?.trim()) {
    return 'Por favor complete todos los campos requeridos.';
  }

  if (!isValidClientFullName(data.name)) {
    return 'Ingresa nombre y apellido completos (mínimo 2 palabras, sin solo números).';
  }

  if (!isValidClientEmail(data.email)) {
    return 'El correo no es válido. Debe tener formato usuario@dominio.com';
  }

  if (!isValidClientPhone(data.phone)) {
    return 'El teléfono debe tener entre 7 y 15 dígitos, sin signos negativos.';
  }

  const hasDocType = Boolean(data.documentType?.trim());
  const hasDocNumber = Boolean(data.documentNumber?.trim());
  if (hasDocType !== hasDocNumber) {
    return 'Debes completar tipo y número de documento, o dejar ambos vacíos.';
  }

  if (hasDocType && hasDocNumber && !isValidClientDocumentPair(data.documentType, data.documentNumber)) {
    return 'El documento no es válido. Debe tener al menos 6 caracteres alfanuméricos y no puede ser negativo.';
  }

  return validateOptionalFields(data);
}
