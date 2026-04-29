/**
 * =====================================================
 * API SERVICE - OCCITOURS FRONTEND
 * =====================================================
 * Servicio para conectar con el backend
 */

import { buildApiUrl, getAuthHeaders } from '../config/api.config';

// =====================================================
// TIPOS
// =====================================================

export interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  status?: string;
  tipo_usuario?: string;
}

export interface UsuarioBackend {
  id?: number | string;
  id_usuario?: number;
  id_usuarios?: number;
  nombre?: string;
  apellido?: string | null;
  correo?: string;
  email?: string;
  telefono?: string | null;
  rol?: string;
  rol_nombre?: string;
  role?: string;
  tipo_usuario?: string;
  estado?: boolean | string | null;
  fecha_registro?: string | null;
  fecha_creacion?: string | null;
  created_at?: string | null;
}

export interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  tipo_documento: string;
  numero_documento: string;
  direccion: string;
  fecha_nacimiento: string;
  estado: boolean;
}

export interface Empleado {
  id_empleado: number;
  id_usuarios?: number;
  id_roles?: number;
  nombre: string;
  apellido: string;
  correo?: string;           // viene del JOIN con usuarios
  telefono?: string | null;
  cargo: string;
  tipo_documento?: string | null;
  numero_documento?: string | null;
  fecha_contratacion?: string | null;
  estado?: boolean | null;
  rol_nombre?: string | null;
  ultimo_acceso?: string | null;
  fecha_registro?: string | null;
}

export interface Reserva {
  id_reserva?: number;
  id?: number;
  id_venta?: number | null;

  id_cliente: number;
  fecha_reserva: string;
  estado: string;

  // Totales (según implementación backend puede venir como total o monto_total)
  total?: number | string | null;
  monto_total?: number | string | null;

  numero_participantes?: number | null;
  tipo_servicio?: string | null;
  notas?: string | null;
  estado_pago?: string | null;
  monto_pagado?: number | string | null;
  saldo_pendiente?: number | string | null;
  metodo_pago?: string | null;

  // Campos de JOIN (si el backend devuelve vista enriquecida)
  cliente_nombre?: string | null;
  cliente_apellido?: string | null;
  cliente_email?: string | null;
  cliente_telefono?: string | null;

  // Detalles opcionales (según implementación backend)
  id_programacion?: number | null;
  id_ruta?: number | null;
  programacion?: any;
  programaciones?: any[];
  servicios?: any[];
}

export interface AcompananteReservaPayload {
  id_cliente?: number | null;
  nombre: string;
  apellido: string;
  tipo_documento?: string | null;
  numero_documento?: string | null;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
}

export interface Ruta {
  id_ruta: number;
  nombre: string;
  descripcion?: string | null;        // text NULL en BD
  ubicacion?: string | null;          // text/varchar NULL (según BD)
  capacidad_maxima?: number | null;   // int4 NULL (según BD)
  destacado?: boolean | null;         // bool NULL (según BD)
  duracion_dias?: number | null;      // int4 NULL en BD
  precio_base?: number | null;        // numeric NULL en BD
  dificultad?: string | null;         // varchar NULL en BD
  imagen_url?: string | null;         // text NULL en BD
  estado?: boolean | null;            // bool NULL en BD
  fecha_creacion?: string | null;     // timestamp NULL en BD
  servicios_predefinidos?: RutaServicioPredefinido[] | null;
  servicios_opcionales?: RutaServicioOpcional[] | null;
}

export interface RutaServicioPredefinido {
  id_ruta_servicio_predefinido?: number;
  id_ruta?: number;
  id_servicio: number;
  cantidad_default: number;
  requerido: boolean;
  fecha_creacion?: string;
  servicio?: {
    id_servicio: number;
    nombre: string;
    descripcion?: string | null;
    precio?: number | null;
    imagen_url?: string | null;
    estado?: boolean | null;
    fecha_creacion?: string | null;
  };
}

export interface RutaServicioOpcional {
  id_ruta_servicio_opcional?: number;
  id_ruta?: number;
  id_servicio: number;
  cantidad_default: number;
  fecha_creacion?: string;
  servicio?: {
    id_servicio: number;
    nombre: string;
    descripcion?: string | null;
    precio?: number | null;
    imagen_url?: string | null;
    estado?: boolean | null;
    fecha_creacion?: string | null;
  };
}

export interface Programacion {
  id_programacion: number;
  id_ruta: number;
  id_empleado?: number | null;

  fecha_salida: string;
  hora_salida?: string | null;
  fecha_regreso: string;
  hora_regreso?: string | null;
  lugar_encuentro?: string | null;

  cupos_totales?: number | null;
  cupos_disponibles?: number | null;
  precio_programacion?: number | string | null;
  estado?: string | null;
  es_personalizada?: boolean | null;

  ruta_nombre?: string | null;
  empleado_nombre?: string | null;
  empleado_apellido?: string | null;
}

export interface Propietario {
  id_propietario: number;
  nombre: string;
  apellido?: string;
  tipo_documento?: string;
  numero_documento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  estado?: boolean;
  fecha_registro?: string;
}

export interface Finca {
  id_finca: number;
  id_propietario?: number;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  ubicacion?: string;
  capacidad_personas?: number;
  precio_por_noche?: number;
  imagen_principal?: string;
  estado?: boolean;
  fecha_registro?: string;
  // Datos del propietario (JOIN)
  propietario_nombre?: string;
  propietario_apellido?: string;
  propietario_telefono?: string;
  propietario_email?: string;
}

export interface Rol {
  id_roles: number;
  nombre: string;
  descripcion?: string;
  estado?: boolean;
  fecha_creacion?: string;
}

export interface Permiso {
  id_permisos: number;
  nombre: string;
  descripcion?: string | null;
  fecha_creacion?: string | null;
}

export interface PagoProveedor {
  id_pago_proveedor: number;
  id_proveedores: number;
  observaciones: string;
  monto: number;
  fecha_pago: string;
  metodo_pago?: string | null;
  numero_transaccion?: string | null;
  comprobante_pago?: string | null;
  estado?: string | null;
}

export interface VentaReserva {
  id_venta: number;
  id_reserva: number;
  monto_total: number | string;
  monto_pagado: number | string;
  saldo_pendiente: number | string;
  estado_pago: string;
  metodo_pago?: string | null;
  fecha_venta?: string | null;
}

export interface SolicitudPersonalizada {
  id_solicitud_personalizada: number;
  id_cliente: number;
  id_reserva?: number | null;
  id_ruta: number;
  cantidad_personas: number;
  fecha_deseada: string;
  hora_deseada?: string | null;
  fecha_regreso_deseada?: string | null;
  hora_regreso_deseada?: string | null;
  lugar_encuentro?: string | null;
  observaciones?: string | null;
  servicios_opcionales?: any | null;
  precio_cotizado?: number | null;
  estado: string;
  id_empleado_cotizador?: number | null;
  id_programacion?: number | null;

  // Campos enriquecidos (JOIN backend)
  reserva_codigo_qr?: string | null;
  reserva_estado?: string | null;
  reserva_monto_total?: number | string | null;
  ruta_nombre?: string | null;
  ruta_duracion_dias?: number | null;
  ruta_dificultad?: string | null;
  ruta_imagen_url?: string | null;

  // Venta (para mostrar id_venta cuando esté lista para pagar)
  id_venta?: number | null;
  venta_estado_pago?: string | null;
  venta_saldo_pendiente?: number | string | null;
}

export interface PagoSolicitud {
  id_pago: number;
  id_venta: number;
  id_reserva: number;
  monto: number;
  metodo_pago?: string | null;
  numero_transaccion?: string | null;
  comprobante_url?: string | null;
  comprobante_nombre?: string | null;
  comprobante_tipo?: string | null;
  estado?: string | null;
  fecha_pago?: string | null;
  observaciones?: string | null;
}

export interface PagoReservaProgramada extends PagoSolicitud {}

export interface PagoCliente {
  id_pago: number;
  id_venta: number;
  id_reserva: number;
  monto: number | string;
  metodo_pago?: string | null;
  numero_transaccion?: string | null;
  comprobante_url?: string | null;
  comprobante_nombre?: string | null;
  comprobante_tipo?: string | null;
  estado?: string | null;
  fecha_pago?: string | null;
  observaciones?: string | null;
  motivo_rechazo?: string | null;
  fecha_verificacion?: string | null;
  monto_total?: number | string | null;
  monto_pagado?: number | string | null;
  saldo_pendiente?: number | string | null;
  estado_pago?: string | null;
  cliente_nombre?: string | null;
  cliente_apellido?: string | null;
  cliente_telefono?: string | null;
  numero_documento?: string | null;
}

export interface Venta {
  id_venta: number;
  id_reserva: number;
  fecha_venta?: string | null;
  monto_total: number | string;
  monto_pagado: number | string;
  saldo_pendiente: number | string;
  estado_pago: string;
  metodo_pago?: string | null;
  fecha_creacion?: string | null;
  fecha_reserva?: string | null;
  reserva_estado?: string | null;
  notas?: string | null;
  id_cliente?: number | null;
  cliente_nombre?: string | null;
  cliente_apellido?: string | null;
  cliente_telefono?: string | null;
  numero_documento?: string | null;
  email?: string | null;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function fetchAPI<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const config: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(buildApiUrl(endpoint), config);
    const data = await response.json();

    // Si hay token y el backend responde 401 (token inválido/expirado), limpiar sesión.
    // Importante: si NO hay token (catálogo público), no debemos redirigir.
    const isAuthEndpoint = endpoint.startsWith('/api/auth/');
    const hasToken = !!localStorage.getItem('token');
    if (response.status === 401 && hasToken && !isAuthEndpoint) {
      localStorage.removeItem('token');
      window.location.href = '/';
      throw new Error('Sesión expirada');
    }

    if (!response.ok) {
      // Mejorar mensaje de error con detalles del backend
      const errorMessage = data.mensaje || data.message || data.error || `Error ${response.status}`;
      const errorDetails = data.detalles || data.details || '';
      const fullError = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
      
      console.error('❌ Error del backend:', { status: response.status, data });
      throw new Error(fullError);
    }

    return data;
  } catch (error: any) {
    // Si es un error de red o parsing
    if (error.message.includes('Failed to fetch') || error.message.includes('JSON')) {
      console.error('❌ Error de conexión:', error);
      throw new Error('Error de conexión con el servidor. Verifica que el backend esté corriendo.');
    }
    throw error;
  }
}

// Normaliza respuestas del backend para que funciones como `getAll()` devuelvan siempre un array.
// Soporta: [...], { data: [...] }, { data: { data: [...] } }, { servicios: [...] }, etc.
function unwrapApiArray<T>(payload: any): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];

  const data = payload?.data;
  if (Array.isArray(data)) return data as T[];

  const nestedData = payload?.data?.data;
  if (Array.isArray(nestedData)) return nestedData as T[];

  const servicios = payload?.servicios;
  if (Array.isArray(servicios)) return servicios as T[];

  const proveedores = payload?.proveedores;
  if (Array.isArray(proveedores)) return proveedores as T[];

  const items = payload?.items;
  if (Array.isArray(items)) return items as T[];

  return [];
}

// =====================================================
// AUTENTICACIÓN
// =====================================================

export const authAPI = {
  login: async (correo: string, contrasena: string) => {
    return fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, contrasena }),
    });
  },

  registerPending: async (userData: {
    correo: string;
    contrasena: string;
    nombre: string;
    apellido: string;
    tipo_documento?: string;
    numero_documento?: string;
    telefono?: string;
    direccion?: string;
    fecha_nacimiento?: string;
  }) => {
    return fetchAPI('/api/auth/register-pending', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  verificarEmail: async (correo: string, codigo: string) => {
    return fetchAPI('/api/auth/verificar-email', {
      method: 'POST',
      body: JSON.stringify({ correo, codigo }),
    });
  },

  reenviarVerificacion: async (correo: string) => {
    return fetchAPI('/api/auth/reenviar-verificacion', {
      method: 'POST',
      body: JSON.stringify({ correo }),
    });
  },

  solicitarRecuperacion: async (correo: string) => {
    return fetchAPI('/api/auth/solicitar-recuperacion', {
      method: 'POST',
      body: JSON.stringify({ correo }),
    });
  },

  resetearContrasena: async (payload: { correo: string; token: string; nuevaContrasena: string }) => {
    return fetchAPI('/api/auth/resetear-contrasena', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  register: async (userData: {
    correo: string;
    contrasena: string;
    nombre: string;
    apellido: string;
    tipo_documento?: string;
    numero_documento?: string;
    telefono?: string;
  }) => {
    return fetchAPI('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getProfile: async () => {
    return fetchAPI('/api/auth/profile');
  },

  updateProfile: async (profileUpdates: Record<string, any>) => {
    return fetchAPI('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileUpdates),
    });
  },

  cambiarContrasena: async (contrasenaActual: string, contrasenaNueva: string) => {
    return fetchAPI('/api/auth/cambiar-contrasena', {
      method: 'PUT',
      body: JSON.stringify({ contrasenaActual, contrasenaNueva }),
    });
  },
};

// =====================================================
// CLIENTES
// =====================================================

export const usersAPI = {
  getAll: async (): Promise<UsuarioBackend[]> => {
    const response = await fetchAPI<{ data: UsuarioBackend[] }>('/api/usuarios');
    return response.data || [];
  },

  create: async (userData: Record<string, any>) => {
    return fetchAPI('/api/usuarios', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  update: async (id: number | string, userData: Record<string, any>) => {
    return fetchAPI(`/api/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  updateRole: async (correo: string, rol: string) => {
    return fetchAPI('/api/usuarios/role', {
      method: 'PUT',
      body: JSON.stringify({ correo, rol }),
    });
  },

  delete: async (id: number | string) => {
  return fetchAPI(`/api/usuarios/${id}`, {
    method: 'DELETE',
  });
},
};
  



export const clientesAPI = {
  getAll: async (): Promise<Cliente[]> => {
    const response = await fetchAPI<{ data: Cliente[] }>('/api/clientes');
    return response.data || [];
  },

  getById: async (id: number): Promise<Cliente> => {
    const response = await fetchAPI<{ data: Cliente }>(`/api/clientes/${id}`);
    return response.data;
  },

  create: async (clienteData: Partial<Cliente>) => {
    return fetchAPI('/api/clientes', {
      method: 'POST',
      body: JSON.stringify(clienteData),
    });
  },

  update: async (id: number, clienteData: Partial<Cliente>) => {
    return fetchAPI(`/api/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clienteData),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/clientes/${id}`, {
      method: 'DELETE',
    });
  },

  buscar: async (termino: string): Promise<Cliente[]> => {
    const response = await fetchAPI<{ data: Cliente[] }>(`/api/clientes/buscar?q=${termino}`);
    return response.data || [];
  },
};

// =====================================================
// EMPLEADOS
// =====================================================

export const empleadosAPI = {
  getAll: async (): Promise<Empleado[]> => {
    const response = await fetchAPI<{ data: Empleado[] }>('/api/empleados');
    return response.data || [];
  },

  getById: async (id: number): Promise<Empleado> => {
    const response = await fetchAPI<{ data: Empleado }>(`/api/empleados/${id}`);
    return response.data;
  },

  create: async (empleadoData: Partial<Empleado>) => {
    return fetchAPI('/api/empleados', {
      method: 'POST',
      body: JSON.stringify(empleadoData),
    });
  },

  update: async (id: number, empleadoData: Partial<Empleado>) => {
    return fetchAPI(`/api/empleados/${id}`, {
      method: 'PUT',
      body: JSON.stringify(empleadoData),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/empleados/${id}`, {
      method: 'DELETE',
    });
  },
};

// =====================================================
// RESERVAS
// =====================================================

export const reservasAPI = {
  getAll: async (): Promise<Reserva[]> => {
    const response = await fetchAPI<any>('/api/reservas');
    return unwrapApiArray<Reserva>(response);
  },

  getById: async (id: number): Promise<Reserva> => {
    const response = await fetchAPI<{ data: Reserva }>(`/api/reservas/${id}`);
    return response.data;
  },

  getByCliente: async (idCliente: number): Promise<Reserva[]> => {
    const response = await fetchAPI<any>(`/api/reservas/cliente/${idCliente}`);
    return unwrapApiArray<Reserva>(response);
  },

  create: async (reservaData: Partial<Reserva>) => {
    return fetchAPI('/api/reservas', {
      method: 'POST',
      body: JSON.stringify(reservaData),
    });
  },

  update: async (id: number, reservaData: Partial<Reserva>) => {
    return fetchAPI(`/api/reservas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reservaData),
    });
  },

  cancelar: async (id: number, motivo: string) => {
    return fetchAPI(`/api/reservas/${id}/cancelar`, {
      method: 'POST',
      body: JSON.stringify({
        motivo_cancelacion: motivo,
        cancelado_por: 'Usuario'
      }),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/reservas/${id}`, {
      method: 'DELETE',
    });
  },

  buscar: async (termino: string): Promise<Reserva[]> => {
    const response = await fetchAPI<any>(`/api/reservas/buscar?q=${termino}`);
    return unwrapApiArray<Reserva>(response);
  },

  // Asigna una programación a la reserva. El backend deduce la ruta desde la programación.
  agregarProgramacion: async (
    idReserva: number,
    payloadOrIdProgramacion:
      | number
      | {
          id_programacion: number;
          cantidad_personas?: number;
          precio_unitario?: number | string | null;
        }
  ) => {
    const payload =
      typeof payloadOrIdProgramacion === 'number'
        ? { id_programacion: payloadOrIdProgramacion }
        : payloadOrIdProgramacion;

    return fetchAPI(`/api/reservas/${idReserva}/programacion`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Agrega un servicio adicional a la reserva (por ejemplo, uno opcional de la ruta)
  agregarServicio: async (
    idReserva: number,
    payload: { id_servicio: number; cantidad: number }
  ) => {
    return fetchAPI(`/api/reservas/${idReserva}/servicios`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  agregarAcompanante: async (idReserva: number, payload: AcompananteReservaPayload) => {
    return fetchAPI(`/api/reservas/${idReserva}/acompanante`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  pagarCompleto: async (
    idReserva: number,
    payload: {
      metodo_pago?: string | null;
      numero_transaccion?: string | null;
      comprobante_url: string;
      comprobante_nombre?: string | null;
      comprobante_tipo?: string | null;
      observaciones?: string | null;
    }
  ) => {
    return fetchAPI<{
      success: boolean;
      message: string;
      data: {
        pago: PagoReservaProgramada;
        venta: VentaReserva;
        reserva: {
          id_reserva: number;
          monto_total: number | string;
        };
      };
    }>(`/api/reservas/${idReserva}/pago-completo`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// =====================================================
// VENTAS
// =====================================================

export const ventasAPI = {
  getAll: async (): Promise<Venta[]> => {
    const response = await fetchAPI<any>('/api/ventas');
    return unwrapApiArray<Venta>(response);
  },

  getById: async (id: number): Promise<Venta> => {
    const response = await fetchAPI<{ data: Venta }>(`/api/ventas/${id}`);
    return response.data;
  },

  cancelar: async (id: number) => {
    return fetchAPI(`/api/ventas/${id}/cancelar`, {
      method: 'POST',
    });
  },

  buscar: async (termino: string): Promise<Venta[]> => {
    const response = await fetchAPI<any>(`/api/ventas/buscar?q=${encodeURIComponent(termino)}`);
    return unwrapApiArray<Venta>(response);
  },
};

// =====================================================
// PAGOS / ABONOS DE CLIENTES
// =====================================================

export const pagosAPI = {
  getAll: async (): Promise<PagoCliente[]> => {
    const response = await fetchAPI<any>('/api/pagos');
    return unwrapApiArray<PagoCliente>(response);
  },

  getById: async (id: number): Promise<PagoCliente> => {
    const response = await fetchAPI<{ data: PagoCliente }>(`/api/pagos/${id}`);
    return response.data;
  },

  getByReserva: async (idReserva: number): Promise<PagoCliente[]> => {
    const response = await fetchAPI<{ data: PagoCliente[] }>(`/api/pagos/reserva/${idReserva}`);
    return response.data || [];
  },

  getByVenta: async (idVenta: number): Promise<PagoCliente[]> => {
    const response = await fetchAPI<{ data: PagoCliente[] }>(`/api/pagos/venta/${idVenta}`);
    return response.data || [];
  },

  create: async (payload: {
    id_venta: number;
    id_reserva: number;
    monto: number;
    metodo_pago?: string | null;
    numero_transaccion?: string | null;
    comprobante_url?: string | null;
    comprobante_nombre?: string | null;
    comprobante_tipo?: string | null;
    observaciones?: string | null;
  }) => {
    return fetchAPI('/api/pagos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  verificar: async (
    id: number,
    payload: {
      estado: 'Verificado' | 'Aprobado' | 'Rechazado';
      observaciones?: string | null;
      motivo_rechazo?: string | null;
    }
  ) => {
    return fetchAPI(`/api/pagos/${id}/verificar`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/pagos/${id}`, {
      method: 'DELETE',
    });
  },
};

// =====================================================
// RUTAS
// =====================================================

export const rutasAPI = {
  getAll: async (): Promise<Ruta[]> => {
    const response = await fetchAPI<any>('/api/rutas');
    return unwrapApiArray<Ruta>(response);
  },

  // Catálogo público (clientes / no autenticado)
  getActivas: async (): Promise<Ruta[]> => {
    const response = await fetchAPI<any>('/api/rutas/activas');
    return unwrapApiArray<Ruta>(response);
  },

  getById: async (id: number): Promise<Ruta> => {
    const response = await fetchAPI<any>(`/api/rutas/${id}`);
    return (response?.data ?? response) as Ruta;
  },

  // Detalle público (solo si está activa)
  getActivaById: async (id: number): Promise<Ruta> => {
    const response = await fetchAPI<any>(`/api/rutas/activas/${id}`);
    return (response?.data ?? response) as Ruta;
  },

  create: async (rutaData: Partial<Ruta>) => {
    return fetchAPI('/api/rutas', {
      method: 'POST',
      body: JSON.stringify(rutaData),
    });
  },

  update: async (id: number, rutaData: Partial<Ruta>) => {
    return fetchAPI(`/api/rutas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rutaData),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/rutas/${id}`, {
      method: 'DELETE',
    });
  },
};

// =====================================================
// FINCAS
// =====================================================

export const fincasAPI = {
  getAll: async (): Promise<Finca[]> => {
    const response = await fetchAPI<{ data: Finca[] }>('/api/fincas');
    return response.data || [];
  },

  getById: async (id: number): Promise<Finca> => {
    const response = await fetchAPI<{ data: Finca }>(`/api/fincas/${id}`);
    return response.data;
  },

  create: async (fincaData: Partial<Finca>) => {
    return fetchAPI('/api/fincas', {
      method: 'POST',
      body: JSON.stringify(fincaData),
    });
  },

  update: async (id: number, fincaData: Partial<Finca>) => {
    return fetchAPI(`/api/fincas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fincaData),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/fincas/${id}`, {
      method: 'DELETE',
    });
  },
};

// =====================================================
// PROPIETARIOS
// =====================================================

export const propietariosAPI = {
  getAll: async (): Promise<Propietario[]> => {
    const response = await fetchAPI<{ data: Propietario[] }>('/api/propietarios');
    return response.data || [];
  },

  getById: async (id: number): Promise<Propietario> => {
    const response = await fetchAPI<{ data: Propietario }>(`/api/propietarios/${id}`);
    return response.data;
  },

  create: async (propietarioData: Partial<Propietario>) => {
    return fetchAPI('/api/propietarios', {
      method: 'POST',
      body: JSON.stringify(propietarioData),
    });
  },

  update: async (id: number, propietarioData: Partial<Propietario>) => {
    return fetchAPI(`/api/propietarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propietarioData),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/propietarios/${id}`, {
      method: 'DELETE',
    });
  },

  getFincas: async (id: number) => {
    const response = await fetchAPI<{ data: Finca[] }>(`/api/propietarios/${id}/fincas`);
    return response.data || [];
  },
};

// =====================================================
// DASHBOARD
// =====================================================

export const dashboardAPI = {
  getEstadisticas: async () => {
    return fetchAPI('/api/dashboard/estadisticas');
  },

  getReservasRecientes: async () => {
    return fetchAPI('/api/dashboard/reservas-recientes');
  },

  getVentasPorMes: async () => {
    return fetchAPI('/api/dashboard/ventas-por-mes');
  },
};

// =====================================================
// ROLES Y PERMISOS
// =====================================================

export const rolesAPI = {
  getAll: async (): Promise<Rol[]> => {
    const response = await fetchAPI<{ data: Rol[] }>('/api/roles');
    return response.data || [];
  },

  getById: async (id: number): Promise<Rol> => {
    const response = await fetchAPI<{ data: Rol }>(`/api/roles/${id}`);
    return response.data;
  },

  getByIdWithPermisos: async (id: number) => {
    return fetchAPI<any>(`/api/roles/${id}`);
  },

  /**
   * Obtener todos los permisos asignados a un rol específico
   */
  getPermisosDeRol: async (idRol: number): Promise<Permiso[]> => {
    try {
      const response = await fetchAPI<{ data: Permiso[] } | Permiso[]>(`/api/roles/${idRol}/permisos`);
      // Soportar tanto { data: [...] } como [...]
      if (Array.isArray(response)) {
        return response;
      }
      return (response as any).data || [];
    } catch (error) {
      console.warn(`No se pudieron cargar permisos para el rol ${idRol}:`, error);
      return [];
    }
  },

  create: async (rolData: Partial<Rol>) => {
    return fetchAPI('/api/roles', {
      method: 'POST',
      body: JSON.stringify(rolData),
    });
  },

  update: async (id: number, rolData: Partial<Rol>) => {
    return fetchAPI(`/api/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rolData),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/roles/${id}`, {
      method: 'DELETE',
    });
  },

  asignarPermiso: async (idRol: number, idPermiso: number) => {
    return fetchAPI(`/api/roles/${idRol}/permisos`, {
      method: 'POST',
      body: JSON.stringify({ id_permiso: idPermiso }),
    });
  },

  removerPermiso: async (idRol: number, idPermiso: number) => {
    return fetchAPI(`/api/roles/${idRol}/permisos/${idPermiso}`, {
      method: 'DELETE',
    });
  },

  /**
   * Actualizar todos los permisos de un rol de una vez
   */
  actualizarPermisos: async (idRol: number, idPermisos: number[]) => {
    return fetchAPI(`/api/roles/${idRol}/permisos`, {
      method: 'PUT',
      body: JSON.stringify({ id_permisos: idPermisos }),
    });
  },

  /**
   * Obtener permisos del rol del usuario actual (sin requerir Admin)
   */
  getPermisosDelUsuarioActual: async (): Promise<Permiso[]> => {
    try {
      const response = await fetchAPI<Permiso[] | { data: Permiso[] }>('/api/roles/mi-rol/permisos');
      if (Array.isArray(response)) {
        return response;
      }
      return (response as any).data || [];
    } catch (error) {
      console.warn('No se pudieron cargar permisos del usuario actual:', error);
      return [];
    }
  },
};

export const permisosAPI = {
  getAll: async (): Promise<Permiso[]> => {
    try {
      const response = await fetchAPI<{ data: Permiso[] }>('/api/permisos');
      return response.data || [];
    } catch (error) {
      // Fallback: el backend expone el catálogo también bajo /api/roles/permisos
      // protegido por permiso `roles.leer` (útil para roles no-admin con permisos).
      const response = await fetchAPI<Permiso[] | { data: Permiso[] }>('/api/roles/permisos');
      if (Array.isArray(response)) {
        return response;
      }
      return (response as any).data || [];
    }
  },
};

// =====================================================
// TIPOS DE PROVEEDORES
// =====================================================

export interface TipoProveedor {
  id_tipo: number;
  nombre: string;
  descripcion?: string | null;
  estado?: boolean | null;
  fecha_creacion?: string | null;
}

export const tiposProveedorAPI = {
  getAll: async (): Promise<TipoProveedor[]> => {
    const response = await fetchAPI<{ data: TipoProveedor[] }>('/api/tipo-proveedores');
    return response.data || [];
  },

  getById: async (id: number): Promise<TipoProveedor> => {
    const response = await fetchAPI<{ data: TipoProveedor }>(`/api/tipo-proveedores/${id}`);
    return response.data;
  },

  create: async (tipoData: Partial<TipoProveedor>) => {
    return fetchAPI('/api/tipo-proveedores', {
      method: 'POST',
      body: JSON.stringify(tipoData),
    });
  },

  update: async (id: number, tipoData: Partial<TipoProveedor>) => {
    return fetchAPI(`/api/tipo-proveedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tipoData),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/tipo-proveedores/${id}`, {
      method: 'DELETE',
    });
  },
};

// =====================================================
// PROVEEDORES
// =====================================================

export interface Proveedor {
  id_proveedores: number;  // Cambiado de id_proveedor
  nombre: string;
  id_tipo: number;  // Cambiado de id_tipo_proveedor
  telefono?: string | null;
  email?: string | null;  // Cambiado de correo
  direccion?: string | null;
  observaciones?: string | null;
  estado?: boolean | null;
  fecha_registro?: string | null;  // Cambiado de fecha_creacion
  // Campos relacionados (join)
  tipo_proveedor_nombre?: string;
}

export const proveedoresAPI = {
  getAll: async (): Promise<Proveedor[]> => {
    const response = await fetchAPI<any>('/api/proveedores');
    return unwrapApiArray<Proveedor>(response);
  },

  getById: async (id: number): Promise<Proveedor> => {
    const response = await fetchAPI<{ data: Proveedor }>(`/api/proveedores/${id}`);
    return response.data;
  },

  getByTipo: async (idTipo: number): Promise<Proveedor[]> => {
    const response = await fetchAPI<{ data: Proveedor[] }>(`/api/proveedores/tipo/${idTipo}`);
    return response.data || [];
  },

  create: async (proveedorData: Partial<Proveedor>) => {
    return fetchAPI('/api/proveedores', {
      method: 'POST',
      body: JSON.stringify(proveedorData),
    });
  },

  update: async (id: number, proveedorData: Partial<Proveedor>) => {
    return fetchAPI(`/api/proveedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(proveedorData),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/proveedores/${id}`, {
      method: 'DELETE',
    });
  },

  buscar: async (termino: string): Promise<Proveedor[]> => {
    const response = await fetchAPI<{ data: Proveedor[] }>(`/api/proveedores/buscar?q=${termino}`);
    return response.data || [];
  },
};

// =====================================================
// SERVICIOS
// =====================================================

// export interface Servicio {
//   id_servicio: number;
//   nombre: string;
//   descripcion?: string | null;
//   precio?: number | null;
//   imagen_url?: string | null;
//   estado?: boolean | null;
//   fecha_creacion?: string | null;
// }

// export const serviciosAPI = {
//   getAll: async (): Promise<Servicio[]> => {
//     const response = await fetchAPI<{ data: Servicio[] }>('/api/servicios');
//     return response.data || [];
//   },

//   getById: async (id: number): Promise<Servicio> => {
//     const response = await fetchAPI<{ data: Servicio }>(`/api/servicios/${id}`);
//     return response.data;
//   },

//   getDisponibles: async (): Promise<Servicio[]> => {
//     const response = await fetchAPI<{ data: Servicio[] }>('/api/servicios/disponibles');
//     return response.data || [];
//   },

//   create: async (servicioData: Partial<Servicio>) => {
//     return fetchAPI('/api/servicios', {
//       method: 'POST',
//       body: JSON.stringify(servicioData),
//     });
//   },

//   update: async (id: number, servicioData: Partial<Servicio>) => {
//     return fetchAPI(`/api/servicios/${id}`, {
//       method: 'PUT',
//       body: JSON.stringify(servicioData),
//     });
//   },

//   delete: async (id: number) => {
//     return fetchAPI(`/api/servicios/${id}`, {
//       method: 'DELETE',
//     });
//   },

//   buscar: async (termino: string): Promise<Servicio[]> => {
//     const response = await fetchAPI<{ data: Servicio[] }>(`/api/servicios/buscar?q=${termino}`);
//     return response.data || [];
//   },
// };


export const pagosProveedoresAPI = {
  getAll: async (): Promise<PagoProveedor[]> => {
    const response = await fetchAPI<{ data: PagoProveedor[] }>('/api/pago-proveedores');
    return response.data || [];
  },
  getById: async (id: number): Promise<PagoProveedor> => {
    const response = await fetchAPI<{ data: PagoProveedor }>(`/api/pago-proveedores/${id}`);
    return response.data;
  },
  create: async (pago: Omit<PagoProveedor, 'id_pago_proveedor'>) => {
    return fetchAPI('/api/pago-proveedores', {
      method: 'POST',
      body: JSON.stringify(pago),
    });
  },
  update: async (id: number, pago: Partial<PagoProveedor>) => {
    return fetchAPI(`/api/pago-proveedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pago),
    });
  },
  delete: async (id: number) => {
    return fetchAPI(`/api/pago-proveedores/${id}`, {
      method: 'DELETE',
    });
  }
};


// =====================================================
// SERVICIOS API - Incluye servicios con proveedor
// =====================================================

export interface Servicio {
  id_servicio: number;
  nombre: string;
  descripcion?: string | null;
  precio?: number | null;
  categoria?: string | null;
  imagen_url?: string | null;
  // Backend puede devolver estado como boolean o string ('Activo'/'Inactivo')
  estado?: boolean | string | null;
  // Campos usados en el front para mostrar/crear (aunque tu backend actual no los persista en la tabla `servicio`)
  duracion?: string | null;
  capacidad?: number | null;
  // Relación proveedor
  id_proveedores?: number | null;
  proveedor?: string | null;
  proveedor_nombre?: string | null;
  // Teléfono / contacto (algunos componentes lo llaman "contacto" y otros "telefono")
  telefono?: string | null;
  contacto?: string | null;
  fecha_creacion?: string | null;
}

// EXTENSIÓN para incluir proveedor en las filas:
export interface ServicioConProveedor extends Servicio {
  id_proveedores?: number | null;
  proveedor_nombre?: string | null;
}

export const serviciosAPI = {
  // Listado normal (sin proveedor)
  getAll: async (): Promise<Servicio[]> => {
    const response = await fetchAPI<any>('/api/servicios');
    return unwrapApiArray<Servicio>(response);
  },

  // Listar servicios DISPONIBLES solamente
  getDisponibles: async (): Promise<Servicio[]> => {
    const response = await fetchAPI<any>('/api/servicios/disponibles');
    return unwrapApiArray<Servicio>(response);
  },

  // Buscar servicios
  buscar: async (termino: string): Promise<Servicio[]> => {
    const response = await fetchAPI<any>(`/api/servicios/buscar?q=${termino}`);
    return unwrapApiArray<Servicio>(response);
  },

  // Traer servicio por id
  getById: async (id: number): Promise<Servicio> => {
    const response = await fetchAPI<{ data?: Servicio } | Servicio>(`/api/servicios/${id}`);
    if ('id_servicio' in (response as any)) {
      return response as Servicio;
    }
    return (response as any).data;
  },

  // Crear servicio
  create: async (servicioData: Partial<Servicio>) => {
    return fetchAPI('/api/servicios', {
      method: 'POST',
      body: JSON.stringify(servicioData),
    });
  },

  // Actualizar servicio
  update: async (id: number, servicioData: Partial<Servicio>) => {
    return fetchAPI(`/api/servicios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(servicioData),
    });
  },

  // Eliminar servicio
  delete: async (id: number) => {
    return fetchAPI(`/api/servicios/${id}`, {
      method: 'DELETE',
    });
  },

  // ===========================
  // 🚩 NUEVO 🚩 obtener servicios + proveedor
  // ===========================
  getAllConProveedor: async (): Promise<ServicioConProveedor[]> => {
    const response = await fetchAPI<any>('/api/servicios/con-proveedor');
    return unwrapApiArray<ServicioConProveedor>(response);
  },

  // 🚩 Traer proveedores de un servicio específico (opcional extra)
  getProveedores: async (id: number) => {
    const response = await fetchAPI<any>(`/api/servicios/${id}/proveedores`);
    return unwrapApiArray<any>(response);
  },
};

// =====================================================
// SOLICITUDES PERSONALIZADAS (CLIENTE + STAFF)
// =====================================================

export const solicitudesPersonalizadasAPI = {
  create: async (payload: {
    id_ruta: number;
    fecha_deseada: string;
    hora_deseada?: string;
    cantidad_personas: number;
    observaciones?: string;
    servicios_opcionales?: any;
  }) => {
    return fetchAPI('/api/solicitudes-personalizadas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMine: async (): Promise<SolicitudPersonalizada[]> => {
    const response = await fetchAPI<{ data: SolicitudPersonalizada[] }>('/api/solicitudes-personalizadas/mias');
    return response.data || [];
  },

  getById: async (id: number): Promise<SolicitudPersonalizada> => {
    const response = await fetchAPI<{ data: SolicitudPersonalizada }>(`/api/solicitudes-personalizadas/${id}`);
    return response.data;
  },

  listPagos: async (id: number): Promise<PagoSolicitud[]> => {
    const response = await fetchAPI<{ data: PagoSolicitud[] }>(`/api/solicitudes-personalizadas/${id}/pagos`);
    return response.data || [];
  },

  crearPago: async (
    id: number,
    payload: {
      monto: number;
      metodo_pago?: string | null;
      numero_transaccion?: string | null;
      comprobante_url: string;
      comprobante_nombre?: string | null;
      comprobante_tipo?: string | null;
      observaciones?: string | null;
    }
  ) => {
    return fetchAPI(`/api/solicitudes-personalizadas/${id}/pagos`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // STAFF: listar todas (opcionalmente por estado)
  listAll: async (params?: { estado?: string | null }): Promise<SolicitudPersonalizada[]> => {
    const estado = params?.estado ? String(params.estado) : '';
    const qs = estado ? `?estado=${encodeURIComponent(estado)}` : '';
    const response = await fetchAPI<{ data: SolicitudPersonalizada[] }>(`/api/solicitudes-personalizadas${qs}`);
    return response.data || [];
  },

  // STAFF: cotizar/actualizar estado
  cotizar: async (
    id: number,
    payload: {
      precio_cotizado?: number | null;
      estado?: string | null;
    }
  ) => {
    return fetchAPI(`/api/solicitudes-personalizadas/${id}/cotizar`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // STAFF: convertir solicitud a programación + reserva + venta
  convertirAProgramacion: async (
    id: number,
    payload: {
      fecha_salida: string;
      fecha_regreso: string;
      precio_programacion: number;
      hora_salida?: string | null;
      hora_regreso?: string | null;
      cupos_totales?: number | null;
      id_empleado?: number | null;
      lugar_encuentro?: string | null;
      precio_cotizado?: number | null;
    }
  ) => {
    return fetchAPI(`/api/solicitudes-personalizadas/${id}/convertir-a-programacion`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// =====================================================
// PROGRAMACION
// =====================================================

export const programacionAPI = {
  getAll: async (): Promise<Programacion[]> => {
    const response = await fetchAPI<any>('/api/programaciones');
    return unwrapApiArray<Programacion>(response);
  },

  // Público: programaciones activas/futuras para Home (sin token)
  getPublicas: async (): Promise<Programacion[]> => {
    const response = await fetchAPI<any>('/api/programaciones/publicas');
    return unwrapApiArray<Programacion>(response);
  },

  getFechasOcupadasRuta: async (idRuta: number): Promise<string[]> => {
    const response = await fetchAPI<any>(`/api/programaciones/ruta/${idRuta}/fechas-ocupadas`);
    return unwrapApiArray<string>(response);
  },

  getById: async (id: number): Promise<Programacion> => {
    const response = await fetchAPI<any>(`/api/programaciones/${id}`);
    return (response?.data ?? response) as Programacion;
  },

  create: async (data: Partial<Programacion>) => {
    return fetchAPI('/api/programaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<Programacion>) => {
    return fetchAPI(`/api/programaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/programaciones/${id}`, {
      method: 'DELETE',
    });
  },
};