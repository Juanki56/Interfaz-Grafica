-- =============================================
-- SCRIPT DE INICIALIZACIÓN DE ROLES Y PERMISOS
-- OCCITOURS - Supabase
-- =============================================

-- =============================================
-- 1. CREAR TABLAS (si no existen)
-- =============================================

-- Tabla de Roles
CREATE TABLE IF NOT EXISTS roles (
    id_roles SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Permisos
CREATE TABLE IF NOT EXISTS permisos (
    id_permisos SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación Roles-Permisos
CREATE TABLE IF NOT EXISTS rol_permiso (
    id_roles INTEGER REFERENCES roles(id_roles) ON DELETE CASCADE,
    id_permisos INTEGER REFERENCES permisos(id_permisos) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_roles, id_permisos)
);

-- =============================================
-- 2. INSERTAR ROLES DEL SISTEMA
-- =============================================

INSERT INTO roles (nombre, descripcion, estado) VALUES
    ('Administrador', 'Acceso completo al sistema con todos los permisos', true),
    ('Asesor', 'Gestión de clientes, reservas y ventas', true),
    ('Guía', 'Gestión de rutas turísticas y grupos de turistas', true),
    ('Cliente', 'Acceso básico para realizar reservas y consultas', true)
ON CONFLICT (nombre) DO NOTHING;

-- =============================================
-- 3. INSERTAR PERMISOS DEL SISTEMA
-- =============================================

-- Permisos de Usuarios
INSERT INTO permisos (nombre, descripcion) VALUES
    ('Ver Usuarios', 'Puede ver la lista de usuarios del sistema'),
    ('Crear Usuarios', 'Puede crear nuevos usuarios en el sistema'),
    ('Editar Usuarios', 'Puede modificar información de usuarios existentes'),
    ('Eliminar Usuarios', 'Puede eliminar usuarios del sistema'),
    ('Gestionar Roles', 'Puede asignar y modificar roles de usuarios')
ON CONFLICT (nombre) DO NOTHING;

-- Permisos de Tours
INSERT INTO permisos (nombre, descripcion) VALUES
    ('Ver Tours', 'Puede ver el catálogo de tours disponibles'),
    ('Crear Tours', 'Puede crear nuevos paquetes turísticos'),
    ('Editar Tours', 'Puede modificar tours existentes'),
    ('Eliminar Tours', 'Puede eliminar tours del sistema'),
    ('Gestionar Precios Tours', 'Puede modificar precios de tours')
ON CONFLICT (nombre) DO NOTHING;

-- Permisos de Reservas
INSERT INTO permisos (nombre, descripcion) VALUES
    ('Ver Reservas', 'Puede ver las reservas del sistema'),
    ('Crear Reservas', 'Puede crear nuevas reservas para clientes'),
    ('Editar Reservas', 'Puede modificar reservas existentes'),
    ('Cancelar Reservas', 'Puede cancelar reservas de clientes'),
    ('Aprobar Reservas', 'Puede aprobar o rechazar reservas pendientes')
ON CONFLICT (nombre) DO NOTHING;

-- Permisos de Rutas
INSERT INTO permisos (nombre, descripcion) VALUES
    ('Ver Rutas', 'Puede ver las rutas turísticas disponibles'),
    ('Crear Rutas', 'Puede crear nuevas rutas turísticas'),
    ('Editar Rutas', 'Puede modificar rutas existentes'),
    ('Eliminar Rutas', 'Puede eliminar rutas del sistema'),
    ('Gestionar Itinerarios', 'Puede gestionar itinerarios de las rutas')
ON CONFLICT (nombre) DO NOTHING;

-- Permisos de Pagos
INSERT INTO permisos (nombre, descripcion) VALUES
    ('Ver Pagos', 'Puede ver el historial de pagos'),
    ('Registrar Pagos', 'Puede registrar nuevos pagos en el sistema'),
    ('Aprobar Pagos', 'Puede aprobar pagos pendientes'),
    ('Gestionar Cuotas', 'Puede gestionar cuotas de pago'),
    ('Generar Facturas', 'Puede generar facturas de pago')
ON CONFLICT (nombre) DO NOTHING;

-- Permisos de Reportes
INSERT INTO permisos (nombre, descripcion) VALUES
    ('Ver Reportes', 'Puede visualizar reportes del sistema'),
    ('Generar Reportes', 'Puede generar nuevos reportes'),
    ('Exportar Datos', 'Puede exportar datos a Excel/PDF'),
    ('Ver Dashboard', 'Puede acceder al dashboard analítico')
ON CONFLICT (nombre) DO NOTHING;

-- Permisos de Fincas
INSERT INTO permisos (nombre, descripcion) VALUES
    ('Ver Fincas', 'Puede ver el listado de fincas disponibles'),
    ('Crear Fincas', 'Puede registrar nuevas fincas en el sistema'),
    ('Editar Fincas', 'Puede modificar información de fincas'),
    ('Eliminar Fincas', 'Puede eliminar fincas del sistema')
ON CONFLICT (nombre) DO NOTHING;

-- Permisos de Restaurantes
INSERT INTO permisos (nombre, descripcion) VALUES
    ('Ver Restaurantes', 'Puede ver el listado de restaurantes'),
    ('Crear Restaurantes', 'Puede registrar nuevos restaurantes'),
    ('Editar Restaurantes', 'Puede modificar información de restaurantes'),
    ('Eliminar Restaurantes', 'Puede eliminar restaurantes del sistema')
ON CONFLICT (nombre) DO NOTHING;

-- =============================================
-- 4. ASIGNAR PERMISOS A ROLES
-- =============================================

-- ADMINISTRADOR: Todos los permisos
INSERT INTO rol_permiso (id_roles, id_permisos)
SELECT 
    (SELECT id_roles FROM roles WHERE nombre = 'Administrador'),
    id_permisos
FROM permisos
ON CONFLICT DO NOTHING;

-- ASESOR: Permisos relacionados con ventas y clientes
INSERT INTO rol_permiso (id_roles, id_permisos)
SELECT 
    (SELECT id_roles FROM roles WHERE nombre = 'Asesor'),
    id_permisos
FROM permisos
WHERE nombre IN (
    'Ver Usuarios',
    'Ver Tours',
    'Ver Reservas',
    'Crear Reservas',
    'Editar Reservas',
    'Cancelar Reservas',
    'Ver Pagos',
    'Registrar Pagos',
    'Gestionar Cuotas',
    'Generar Facturas',
    'Ver Dashboard',
    'Ver Rutas',
    'Ver Fincas',
    'Ver Restaurantes'
)
ON CONFLICT DO NOTHING;

-- GUÍA: Permisos relacionados con rutas y grupos
INSERT INTO rol_permiso (id_roles, id_permisos)
SELECT 
    (SELECT id_roles FROM roles WHERE nombre = 'Guía'),
    id_permisos
FROM permisos
WHERE nombre IN (
    'Ver Tours',
    'Ver Rutas',
    'Editar Rutas',
    'Gestionar Itinerarios',
    'Ver Reservas',
    'Ver Fincas',
    'Ver Restaurantes'
)
ON CONFLICT DO NOTHING;

-- CLIENTE: Permisos básicos
INSERT INTO rol_permiso (id_roles, id_permisos)
SELECT 
    (SELECT id_roles FROM roles WHERE nombre = 'Cliente'),
    id_permisos
FROM permisos
WHERE nombre IN (
    'Ver Tours',
    'Ver Rutas',
    'Crear Reservas',
    'Ver Fincas',
    'Ver Restaurantes'
)
ON CONFLICT DO NOTHING;

-- =============================================
-- 5. VERIFICAR INSTALACIÓN
-- =============================================

-- Ver roles creados
SELECT 
    r.id_roles,
    r.nombre,
    r.descripcion,
    COUNT(rp.id_permisos) as total_permisos
FROM roles r
LEFT JOIN rol_permiso rp ON r.id_roles = rp.id_roles
GROUP BY r.id_roles, r.nombre, r.descripcion
ORDER BY r.nombre;

-- Ver permisos por rol
SELECT 
    r.nombre as rol,
    p.nombre as permiso,
    p.descripcion
FROM roles r
JOIN rol_permiso rp ON r.id_roles = rp.id_roles
JOIN permisos p ON rp.id_permisos = p.id_permisos
ORDER BY r.nombre, p.nombre;

-- =============================================
-- 6. POLÍTICAS RLS (Row Level Security)
-- =============================================

-- Habilitar RLS en las tablas
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rol_permiso ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios autenticados
CREATE POLICY "Permitir lectura de roles" ON roles
    FOR SELECT
    USING (true);

CREATE POLICY "Permitir lectura de permisos" ON permisos
    FOR SELECT
    USING (true);

CREATE POLICY "Permitir lectura de rol_permiso" ON rol_permiso
    FOR SELECT
    USING (true);

-- Política para permitir operaciones solo a administradores
-- NOTA: Ajusta estas políticas según tu implementación de autenticación
CREATE POLICY "Permitir escritura de roles a admins" ON roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.id = auth.uid()
            AND usuarios.id_roles = (SELECT id_roles FROM roles WHERE nombre = 'Administrador')
        )
    );

CREATE POLICY "Permitir escritura de permisos a admins" ON permisos
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.id = auth.uid()
            AND usuarios.id_roles = (SELECT id_roles FROM roles WHERE nombre = 'Administrador')
        )
    );

CREATE POLICY "Permitir escritura de rol_permiso a admins" ON rol_permiso
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.id = auth.uid()
            AND usuarios.id_roles = (SELECT id_roles FROM roles WHERE nombre = 'Administrador')
        )
    );

-- =============================================
-- FIN DEL SCRIPT
-- =============================================

-- Resumen de la instalación
SELECT 
    'Roles creados:' as tipo,
    COUNT(*) as cantidad
FROM roles
UNION ALL
SELECT 
    'Permisos creados:' as tipo,
    COUNT(*) as cantidad
FROM permisos
UNION ALL
SELECT 
    'Asignaciones creadas:' as tipo,
    COUNT(*) as cantidad
FROM rol_permiso;
