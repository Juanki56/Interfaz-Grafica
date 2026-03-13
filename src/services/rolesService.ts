/**
 * =====================================================
 * ROLES SERVICE - BACKEND NODE.JS
 * =====================================================
 * Servicio para gestión de roles desde el backend
 */

import { buildApiUrl, getAuthHeaders } from '../config/api.config';

// =====================================================
// TIPOS
// =====================================================

export interface Rol {
  id_roles: number;
  nombre: string;
  descripcion?: string | null;
  estado?: boolean | null;
  fecha_creacion?: string | null;
}

export interface Permiso {
  id_permisos: number;
  nombre: string;
  descripcion?: string | null;
  estado?: boolean | null;
  fecha_creacion?: string | null;
}

export interface RolPermiso {
  id_roles: number;
  id_permisos: number;
  fecha_asignacion?: string | null;
}

export interface RolConPermisos extends Rol {
  permisos?: Permiso[];
}

// =====================================================
// SERVICIO DE ROLES
// =====================================================

export const rolesService = {
  /**
   * Obtener todos los roles
   */
  async obtenerTodos(): Promise<Rol[]> {
    try {
      const response = await fetch(buildApiUrl('/api/roles'), {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      console.error('Error al obtener roles:', error);
      throw error;
    }
  },

  /**
   * Obtener un rol por ID
   */
  async obtenerPorId(id: number): Promise<RolConPermisos | null> {
    try {
      const response = await fetch(buildApiUrl(`/api/roles/${id}`), {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      console.error('Error al obtener rol:', error);
      throw error;
    }
  },

  /**
   * Crear un nuevo rol
   */
  async crear(rolData: { nombre: string; descripcion?: string }): Promise<Rol> {
    try {
      const response = await fetch(buildApiUrl('/api/roles'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nombre: rolData.nombre,
          descripcion: rolData.descripcion || null,
          estado: true
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return json.data;
    } catch (error: any) {
      console.error('Error al crear rol:', error);
      throw error;
    }
  },

  /**
   * Actualizar un rol
   */
  async actualizar(
    id: number,
    rolData: { nombre?: string; descripcion?: string; estado?: boolean }
  ): Promise<Rol> {
    try {
      const updateData: any = {};
      
      if (rolData.nombre !== undefined) updateData.nombre = rolData.nombre;
      if (rolData.descripcion !== undefined) updateData.descripcion = rolData.descripcion;
      if (rolData.estado !== undefined) updateData.estado = rolData.estado;

      const response = await fetch(buildApiUrl(`/api/roles/${id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return json.data;
    } catch (error: any) {
      console.error('Error al actualizar rol:', error);
      throw error;
    }
  },

  /**
   * Eliminar un rol
   */
  async eliminar(id: number): Promise<boolean> {
    try {
      const response = await fetch(buildApiUrl(`/api/roles/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error: any) {
      console.error('Error al eliminar rol:', error);
      throw error;
    }
  },

  /**
   * Obtener permisos de un rol
   */
  async obtenerPermisos(idRol: number): Promise<Permiso[]> {
    try {
      const response = await fetch(buildApiUrl(`/api/roles/${idRol}/permisos`), {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error: any) {
      console.error('Error al obtener permisos del rol:', error);
      throw error;
    }
  }
};
