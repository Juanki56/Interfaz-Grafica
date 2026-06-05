import { authAPI } from '../services/api';
import { decodeJWT } from './jwtDecoder';

let cachedClientId: number | null = null;
let cacheKey = '';

function idFromPerfil(perfil: Record<string, unknown> | null | undefined): number | null {
  if (!perfil || typeof perfil !== 'object') return null;
  const raw =
    perfil.id_cliente ??
    perfil.idCliente ??
    (perfil.cliente as Record<string, unknown> | undefined)?.id_cliente ??
    (perfil.cliente as Record<string, unknown> | undefined)?.id;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Obtiene el `id_cliente` real del usuario autenticado (solo desde perfil/JWT).
 * No usa listados de clientes: el rol Cliente no tiene permiso `clientes.leer`.
 */
export async function resolveClientIdForSession(params: {
  userId?: string | number | null;
  email?: string | null;
}): Promise<number | null> {
  const email = String(params.email || '').trim().toLowerCase();
  const userId = Number(params.userId);
  const key = `${email}|${userId}`;
  if (cachedClientId && cacheKey === key) {
    return cachedClientId;
  }

  const trySet = (id: number | null) => {
    if (id == null || !Number.isFinite(id) || id <= 0) return null;
    cachedClientId = id;
    cacheKey = key;
    return id;
  };

  try {
    const profileRes = await authAPI.getProfile();
    const perfil =
      (profileRes?.perfil as Record<string, unknown> | undefined) ??
      (profileRes?.data as { perfil?: Record<string, unknown> } | undefined)?.perfil ??
      (profileRes?.data as Record<string, unknown> | undefined);
    const idFromProfile = idFromPerfil(perfil);
    if (profileRes?.success !== false && idFromProfile) {
      return trySet(idFromProfile);
    }
    if (idFromProfile) {
      return trySet(idFromProfile);
    }
  } catch {
    // ignore
  }

  try {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = decodeJWT(token);
      const idFromJwt = Number(payload?.id_cliente ?? payload?.idCliente);
      if (Number.isFinite(idFromJwt) && idFromJwt > 0) {
        return trySet(idFromJwt);
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export function clearResolvedClientIdCache(): void {
  cachedClientId = null;
  cacheKey = '';
}
