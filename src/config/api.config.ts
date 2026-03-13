// Configuración de la API del backend
const getApiBaseUrl = (): string => {
  // @ts-ignore - Vite env typing
  return import.meta.env?.VITE_API_URL || 'http://localhost:3000';
};

export const API_CONFIG = {
  // URL base del backend
  BASE_URL: getApiBaseUrl(),
  
  // Endpoints de autenticación
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY: '/api/auth/profile', // Usar profile en lugar de verify
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile'
  },
  
  // Endpoints de usuarios
  USERS: {
    BASE: '/api/users',
    UPDATE_ROLE: '/api/users/role',
    GET_ALL: '/api/users'
  },
  
  // Endpoints de roles
  ROLES: {
    BASE: '/api/roles',
    GET_ALL: '/api/roles',
    GET_BY_ID: '/api/roles/:id',
    CREATE: '/api/roles',
    UPDATE: '/api/roles/:id',
    DELETE: '/api/roles/:id',
    PERMISOS: '/api/roles/:id/permisos'
  },
  
  // Timeout para las peticiones (en milisegundos)
  TIMEOUT: 10000
};

// Helper para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper para obtener headers con autenticación
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};
