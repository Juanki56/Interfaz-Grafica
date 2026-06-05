import { authAPI, clientesAPI } from '../services/api';
import { decodeJWT } from './jwtDecoder';
import { titularTieneDocumentoValidoParaReserva } from './documentIdentityValidation';

type UserDocSource = {
  tipo_documento?: string;
  numero_documento?: string;
  clientId?: string;
  id?: string;
} | null;

/** Resuelve si el titular tiene documento válido (sesión, perfil API o tabla clientes). */
export async function titularDocumentoValidoParaReservar(
  user?: UserDocSource,
  options?: { idReserva?: number },
): Promise<boolean> {
  if (titularTieneDocumentoValidoParaReserva(null, user)) {
    return true;
  }

  const profileRes = await authAPI.getProfile().catch(() => null);
  if (titularTieneDocumentoValidoParaReserva(profileRes?.perfil, user)) {
    return true;
  }

  const clienteIds = new Set<number>();
  const pushId = (raw: unknown) => {
    const id = Number(raw);
    if (Number.isFinite(id) && id > 0) clienteIds.add(id);
  };

  pushId(user?.clientId);
  pushId(user?.id);

  try {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = decodeJWT(token);
      pushId(payload?.id_cliente);
    }
  } catch {
    /* ignore */
  }

  for (const idCliente of clienteIds) {
    try {
      const cliente = await clientesAPI.getById(idCliente);
      if (titularTieneDocumentoValidoParaReserva(cliente, null)) {
        return true;
      }
    } catch {
      /* siguiente fuente */
    }
  }

  const idReserva = Number(options?.idReserva);
  if (Number.isFinite(idReserva) && idReserva > 0) {
    try {
      const { reservasAPI } = await import('../services/api');
      const reservaRaw = await reservasAPI.getById(idReserva);
      const idClienteReserva = Number((reservaRaw as { id_cliente?: number })?.id_cliente);
      if (Number.isFinite(idClienteReserva) && idClienteReserva > 0) {
        const cliente = await clientesAPI.getById(idClienteReserva);
        if (titularTieneDocumentoValidoParaReserva(cliente, null)) {
          return true;
        }
      }
    } catch {
      /* ignore */
    }
  }

  return false;
}
