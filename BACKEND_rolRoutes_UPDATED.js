/**
 * =============================================
 * ROL ROUTES - Rutas de Roles
 * =============================================
 */

const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rolController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

/**
 * RUTA PÚBLICA (sin requerir Admin)
 * GET /api/mi-rol/permisos
 * Obtener permisos del rol del usuario actual - cualquier usuario autenticado puede usar esto
 */
router.get('/mi-rol/permisos', verificarToken, rolController.obtenerMisPermisos);

/**
 * RUTAS ADMIN
 * Todas las rutas siguientes requieren autenticación y rol Admin
 */
router.use(verificarToken, verificarRol('Administrador'));

/**
 * GET /api/roles
 * Obtener todos los roles
 */
router.get('/', rolController.obtenerTodos);

/**
 * GET /api/permisos
 * Obtener TODOS los permisos disponibles
 */
router.get('/permisos', rolController.obtenerTodosPermisos);

/**
 * GET /api/roles/:id
 * Obtener rol por ID
 * IMPORTANTE: Esta ruta va DESPUÉS de /permisos para evitar conflictos
 */
router.get('/:id', rolController.obtenerPorId);

/**
 * GET /api/roles/:id/permisos
 * Obtener permisos de UN rol específico
 */
router.get('/:id/permisos', rolController.obtenerPermisosPorRol);

/**
 * POST /api/roles
 * Crear nuevo rol
 */
router.post('/', rolController.crear);

/**
 * PUT /api/roles/:id
 * Actualizar rol
 */
router.put('/:id', rolController.actualizar);

/**
 * PUT /api/roles/:id/permisos
 * Actualizar TODOS los permisos de un rol
 */
router.put('/:id/permisos', rolController.actualizarPermisosPorRol);

/**
 * DELETE /api/roles/:id
 * Eliminar rol
 */
router.delete('/:id', rolController.eliminar);

/**
 * POST /api/roles/:id/permisos
 * Asignar permiso a rol
 */
router.post('/:id/permisos', rolController.asignarPermiso);

/**
 * DELETE /api/roles/:id/permisos/:idPermiso
 * Remover permiso de rol
 */
router.delete('/:id/permisos/:idPermiso', rolController.removerPermiso);

module.exports = router;
