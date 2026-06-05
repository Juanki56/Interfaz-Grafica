export const ROLE_NAME_LIMITS = { min: 3, max: 50 } as const;

export const ROLE_NAME_LENGTH_ERROR =
  'El nombre del rol debe tener entre 3 y 50 caracteres.';

export function sanitizeRoleNameInput(value: string): string {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .slice(0, ROLE_NAME_LIMITS.max);
}

export function validateRoleName(value?: string | null): { valid: boolean; message?: string } {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return { valid: false, message: 'El nombre del rol es obligatorio.' };
  }
  if (trimmed.length < ROLE_NAME_LIMITS.min || trimmed.length > ROLE_NAME_LIMITS.max) {
    return { valid: false, message: ROLE_NAME_LENGTH_ERROR };
  }
  return { valid: true };
}
