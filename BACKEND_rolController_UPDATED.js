/**
 * =============================================
 * ROL CONTROLLER
 * =============================================
 */

const Rol = require('../models/Rol');
const { validarCamposRequeridos, formatearError } = require('../utils/validators');
const db = require('../config/database');

// ============ FUNCIONES ORIGINALES ============

exports.obtenerTodos = async (req, res) => {
  try {
    const roles = await Rol.obtenerTodos();
    res.json({ success: true, data: roles, total: roles.length });
  } catch (error) {
    res.status(500).json(formatearError(error, 'Error al obtener roles'));
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const rol = await Rol.obtenerPorId(id);
    
    if (!rol) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }
    
    // Obtener permisos del rol
    const permisos = await Rol.obtenerPermisos(id);
    rol.permisos = permisos;
    
    res.json({ success: true, data: rol });
  } catch (error) {
    res.status(500).json(formatearError(error, 'Error al obtener rol'));
  }
};

exports.crear = async (req, res) => {
  try {
    const validacion = validarCamposRequeridos(req.body, ['nombre']);
    if (!validacion.valido) {
      return res.status(400).json({ error: 'Campos incompletos', campos: validacion.camposFaltantes });
    }
    
    const nuevoRol = await Rol.crear(req.body);
    res.status(201).json({ success: true, message: 'Rol creado', data: nuevoRol });
  } catch (error) {
    res.status(500).json(formatearError(error, 'Error al crear rol'));
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const rolActualizado = await Rol.actualizar(id, req.body);
    
    if (!rolActualizado) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }
    
    res.json({ success: true, message: 'Rol actualizado', data: rolActualizado });
  } catch (error) {
    res.status(500).json(formatearError(error, 'Error al actualizar rol'));
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const rolEliminado = await Rol.eliminar(id);
    
    if (!rolEliminado) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }
    
    res.json({ success: true, message: 'Rol eliminado' });
  } catch (error) {
    res.status(500).json(formatearError(error, 'Error al eliminar rol'));
  }
};

exports.asignarPermiso = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_permiso } = req.body;
    
    const resultado = await Rol.asignarPermiso(id, id_permiso);
    res.json({ success: true, message: 'Permiso asignado', data: resultado });
  } catch (error) {
    res.status(500).json(formatearError(error, 'Error al asignar permiso'));
  }
};

exports.removerPermiso = async (req, res) => {
  try {
    const { id, idPermiso } = req.params;
    await Rol.removerPermiso(id, idPermiso);
    res.json({ success: true, message: 'Permiso removido' });
  } catch (error) {
    res.status(500).json(formatearError(error, 'Error al remover permiso'));
  }
};

// ============ NUEVAS FUNCIONES PARA PERMISOS ============

/**
 * Obtener TODOS los permisos disponibles
 */
exports.obtenerTodosPermisos = async (req, res) => {
  try {
    const query = `
      SELECT id_permisos, nombre, descripcion, estado, fecha_creacion
      FROM permisos
      WHERE estado = true
      ORDER BY nombre ASC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(formatearError(error, 'Error al obtener permisos'));
  }
};

/**
 * Obtener permisos de UN rol específico
 */
exports.obtenerPermisosPorRol = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT p.id_permisos, p.nombre, p.descripcion, p.fecha_creacion
      FROM permisos p
      INNER JOIN rol_permiso rp ON p.id_permisos = rp.id_permisos
      WHERE rp.id_roles = $1
      ORDER BY p.nombre ASC
    `;
    const result = await db.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(formatearError(error, 'Error al obtener permisos del rol'));
  }
};

/**
 * Actualizar TODOS los permisos de un rol de una vez
 */
exports.actualizarPermisosPorRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_permisos } = req.body;

    if (!Array.isArray(id_permisos)) {
      return res.status(400).json({ error: 'id_permisos debe ser un array' });
    }

    // 1. Eliminar permisos anteriores
    const deleteQuery = `DELETE FROM rol_permiso WHERE id_roles = $1`;
    await db.query(deleteQuery, [id]);

    // 2. Insertar nuevos permisos
    for (const idPermiso of id_permisos) {
      const insertQuery = `
        INSERT INTO rol_permiso (id_roles, id_permisos)
        VALUES ($1, $2)
        ON CONFLICT (id_roles, id_permisos) DO NOTHING
      `;
      await db.query(insertQuery, [id, idPermiso]);
    }

    res.json({ 
      success: true, 
      message: 'Permisos actualizados correctamente',
      total_permisos_asignados: id_permisos.length
    });
  } catch (error) {
    res.status(500).json(formatearError(error, 'Error al actualizar permisos'));
  }
};

/**
 * Obtener permisos del rol del usuario actual (sin requerir Admin)
 * Ruta: GET /api/mi-rol/permisos
 * Autenticación: requerida (cualquier rol)
 */
exports.obtenerMisPermisos = async (req, res) => {
  try {
    // Obtener el rol del usuario desde el middleware de autenticación
    const rolName = req.user?.rol || req.body.rol;
    
    if (!rolName) {
      console.warn('⚠️ No se encontró rol en req.user o req.body');
      return res.status(400).json({ error: 'No se encontró el rol del usuario' });
    }

    console.log(`🔍 Buscando permisos para rol: ${rolName}`);

    // Buscar el rol en la BD
    const resultRol = await db.query(
      `SELECT id_roles, nombre FROM roles WHERE nombre = $1`,
      [rolName]
    );
    
    if (resultRol.rows.length === 0) {
      console.log(`❌ Rol no encontrado: ${rolName}`);
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    const rol = resultRol.rows[0];
    console.log(`✅ Rol encontrado: ${rol.nombre} (ID: ${rol.id_roles})`);

    // Obtener permisos del rol
    const permisosResult = await db.query(
      `SELECT p.id_permisos, p.nombre, p.descripcion, p.estado
       FROM permisos p
       INNER JOIN rol_permiso rp ON p.id_permisos = rp.id_permisos
       WHERE rp.id_roles = $1 AND p.estado = true
       ORDER BY p.nombre ASC`,
      [rol.id_roles]
    );

    const permisos = permisosResult.rows;
    console.log(`🎯 Permisos cargados para ${rolName}:`, permisos);

    res.json(permisos || []);
  } catch (error) {
    console.error('❌ Error al obtener permisos del usuario:', error);
    res.status(500).json({ error: 'Error al cargar permisos' });
  }
};
