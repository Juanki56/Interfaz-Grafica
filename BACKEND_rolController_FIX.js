/**
 * Obtener permisos del rol del usuario actual (sin requerir Admin)
 * Ruta: GET /api/mi-rol/permisos
 * Autenticación: requerida (cualquier rol)
 */
exports.obtenerMisPermisos = async (req, res) => {
  try {
    // Obtener el rol del usuario desde el middleware de autenticación
    // El middleware guarda en req.usuario y el rol en rol_nombre
    const rolName = req.usuario?.rol_nombre;
    
    if (!rolName) {
      console.warn('⚠️ No se encontró rol en req.usuario');
      console.warn('req.usuario:', req.usuario);
      return res.status(400).json({ error: 'No se encontró el rol del usuario' });
    }

    console.log(`🔍 Buscando permisos para rol: ${rolName}`);

    // Buscar el rol en la BD
    const resultRol = await db.query(
      `SELECT id_roles, nombre FROM roles WHERE nombre = $1`,
      [rolName]
    );
    
    if (resultRol.rows.length === 0) {
      console.log(`❌ Rol no encontrado en BD: ${rolName}`);
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
