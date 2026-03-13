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
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  cargo: string;
  estado: boolean;
}

export interface Reserva {
  id_reserva: number;
  id_cliente: number;
  fecha_reserva: string;
  estado: string;
  total: number;
}

export interface Ruta {
  id_ruta: number;
  nombre: string;
  descripcion?: string | null;        // text NULL en BD
  duracion_dias?: number | null;      // int4 NULL en BD
  precio_base?: number | null;        // numeric NULL en BD
  dificultad?: string | null;         // varchar NULL en BD
  imagen_url?: string | null;         // text NULL en BD
  estado?: boolean | null;            // bool NULL en BD
  fecha_creacion?: string | null;     // timestamp NULL en BD
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

    // Si el token expiró, limpiar sesión
    if (response.status === 401) {
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
    const response = await fetchAPI<{ data: Reserva[] }>('/api/reservas');
    return response.data || [];
  },

  getById: async (id: number): Promise<Reserva> => {
    const response = await fetchAPI<{ data: Reserva }>(`/api/reservas/${id}`);
    return response.data;
  },

  getByCliente: async (idCliente: number): Promise<Reserva[]> => {
    const response = await fetchAPI<{ data: Reserva[] }>(`/api/reservas/cliente/${idCliente}`);
    return response.data || [];
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
    const response = await fetchAPI<{ data: Reserva[] }>(`/api/reservas/buscar?q=${termino}`);
    return response.data || [];
  },
};

// =====================================================
// RUTAS
// =====================================================

export const rutasAPI = {
  getAll: async (): Promise<Ruta[]> => {
    const response = await fetchAPI<{ data: Ruta[] }>('/api/rutas');
    return response.data || [];
  },

  getById: async (id: number): Promise<Ruta> => {
    const response = await fetchAPI<{ data: Ruta }>(`/api/rutas/${id}`);
    return response.data;
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
    const response = await fetchAPI<{ data: Proveedor[] }>('/api/proveedores');
    return response.data || [];
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

export interface Servicio {
  id_servicio: number;
  nombre: string;
  descripcion?: string | null;
  precio?: number | null;
  imagen_url?: string | null;
  estado?: boolean | null;
  fecha_creacion?: string | null;
}

export const serviciosAPI = {
  getAll: async (): Promise<Servicio[]> => {
    const response = await fetchAPI<{ data: Servicio[] }>('/api/servicios');
    return response.data || [];
  },

  getById: async (id: number): Promise<Servicio> => {
    const response = await fetchAPI<{ data: Servicio }>(`/api/servicios/${id}`);
    return response.data;
  },

  getDisponibles: async (): Promise<Servicio[]> => {
    const response = await fetchAPI<{ data: Servicio[] }>('/api/servicios/disponibles');
    return response.data || [];
  },

  create: async (servicioData: Partial<Servicio>) => {
    return fetchAPI('/api/servicios', {
      method: 'POST',
      body: JSON.stringify(servicioData),
    });
  },

  update: async (id: number, servicioData: Partial<Servicio>) => {
    return fetchAPI(`/api/servicios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(servicioData),
    });
  },

  delete: async (id: number) => {
    return fetchAPI(`/api/servicios/${id}`, {
      method: 'DELETE',
    });
  },

  buscar: async (termino: string): Promise<Servicio[]> => {
    const response = await fetchAPI<{ data: Servicio[] }>(`/api/servicios/buscar?q=${termino}`);
    return response.data || [];
  },
};
