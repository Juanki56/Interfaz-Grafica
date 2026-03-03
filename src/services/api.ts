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
  descripcion: string;
  duracion_dias: number;
  precio_base: number;
  dificultad?: string;
  imagen_url?: string;
  estado: boolean;
}

export interface Finca {
  id_finca: number;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  capacidad: number;
  precio_noche: number;
  estado: boolean;
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
  getAll: async () => {
    return fetchAPI('/api/roles');
  },

  getById: async (id: number) => {
    return fetchAPI(`/api/roles/${id}`);
  },

  create: async (rolData: { nombre: string; descripcion?: string }) => {
    return fetchAPI('/api/roles', {
      method: 'POST',
      body: JSON.stringify(rolData),
    });
  },

  update: async (id: number, rolData: { nombre?: string; descripcion?: string; estado?: boolean }) => {
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
