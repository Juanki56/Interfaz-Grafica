-- =============================================
-- Permisos del módulo Programaciones (catálogo)
-- Formato esperado por el frontend: modulo.accion
-- Ej.: programaciones.leer → createModulePermissions(..., 'Programaciones')
-- =============================================
-- Ejecutar en PostgreSQL/Supabase cuando el backend expose permisos como "rutas.leer".
-- Idempotente: ON CONFLICT DO NOTHING.

INSERT INTO permisos (nombre, descripcion) VALUES
    ('programaciones.leer', 'Consultar programaciones operativas y personalizadas'),
    ('programaciones.crear', 'Crear nuevas programaciones'),
    ('programaciones.editar', 'Editar programaciones existentes'),
    ('programaciones.eliminar', 'Eliminar programaciones')
ON CONFLICT (nombre) DO NOTHING;

-- Administrador: asignar los cuatro permisos (solo si existe el rol)
INSERT INTO rol_permiso (id_roles, id_permisos)
SELECT r.id_roles, p.id_permisos
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.nombre IN (
    'programaciones.leer',
    'programaciones.crear',
    'programaciones.editar',
    'programaciones.eliminar'
  )
ON CONFLICT DO NOTHING;

-- Asesor: lectura y operación habitual (ajusta según tu negocio)
INSERT INTO rol_permiso (id_roles, id_permisos)
SELECT r.id_roles, p.id_permisos
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Asesor'
  AND p.nombre IN (
    'programaciones.leer',
    'programaciones.crear',
    'programaciones.editar'
  )
ON CONFLICT DO NOTHING;
