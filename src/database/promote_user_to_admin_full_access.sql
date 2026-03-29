-- =====================================================
-- PROMOVER USUARIO A ADMIN CON ACCESO TOTAL
-- =====================================================
-- Uso:
-- 1) Cambia el correo en la variable v_email_objetivo
-- 2) Ejecuta este script en tu SQL Editor (Supabase/PostgreSQL)
--
-- Nota: este script NO crea el usuario desde cero.
--       Promueve un usuario ya existente a admin y le asigna todos los permisos.

DO $$
DECLARE
  v_email_objetivo TEXT := 'admin@occitours.com';
  v_admin_role_id INTEGER;
  v_has_correo BOOLEAN;
  v_has_email BOOLEAN;
  v_has_id_roles BOOLEAN;
  v_has_id_rol BOOLEAN;
  v_has_rol_id BOOLEAN;
  v_has_rol BOOLEAN;
  v_has_tipo_usuario BOOLEAN;
  v_set_parts TEXT[] := ARRAY[]::TEXT[];
  v_where_expr TEXT;
  v_sql_update TEXT;
BEGIN
  -- 1) Asegurar rol Administrador
  INSERT INTO roles (nombre, descripcion, estado)
  VALUES ('Administrador', 'Acceso completo al sistema', TRUE)
  ON CONFLICT (nombre) DO UPDATE
    SET estado = TRUE;

  SELECT id_roles
  INTO v_admin_role_id
  FROM roles
  WHERE nombre = 'Administrador'
  LIMIT 1;

  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo obtener el id del rol Administrador';
  END IF;

  -- 2) Asignar TODOS los permisos al rol Administrador
  INSERT INTO rol_permiso (id_roles, id_permisos)
  SELECT v_admin_role_id, p.id_permisos
  FROM permisos p
  ON CONFLICT DO NOTHING;

  -- 3) Detectar columnas existentes en usuarios
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'correo'
  ) INTO v_has_correo;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'email'
  ) INTO v_has_email;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'id_roles'
  ) INTO v_has_id_roles;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'id_rol'
  ) INTO v_has_id_rol;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'rol_id'
  ) INTO v_has_rol_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'rol'
  ) INTO v_has_rol;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'tipo_usuario'
  ) INTO v_has_tipo_usuario;

  IF v_has_id_roles THEN
    v_set_parts := array_append(v_set_parts, format('id_roles = %s', v_admin_role_id));
  END IF;

  IF v_has_id_rol THEN
    v_set_parts := array_append(v_set_parts, format('id_rol = %s', v_admin_role_id));
  END IF;

  IF v_has_rol_id THEN
    v_set_parts := array_append(v_set_parts, format('rol_id = %s', v_admin_role_id));
  END IF;

  IF v_has_rol THEN
    v_set_parts := array_append(v_set_parts, 'rol = ''Administrador''');
  END IF;

  IF v_has_tipo_usuario THEN
    v_set_parts := array_append(v_set_parts, 'tipo_usuario = ''empleado''');
  END IF;

  IF array_length(v_set_parts, 1) IS NULL THEN
    RAISE EXCEPTION 'No se encontraron columnas para asignar admin (id_roles/id_rol/rol_id/rol/tipo_usuario) en usuarios';
  END IF;

  IF v_has_correo THEN
    v_where_expr := format('correo = %L', v_email_objetivo);
  ELSIF v_has_email THEN
    v_where_expr := format('email = %L', v_email_objetivo);
  ELSE
    RAISE EXCEPTION 'La tabla usuarios no tiene columna correo ni email';
  END IF;

  -- 4) Promover usuario objetivo
  v_sql_update :=
    'UPDATE usuarios SET ' || array_to_string(v_set_parts, ', ') ||
    ' WHERE ' || v_where_expr;

  EXECUTE v_sql_update;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró usuario con correo/email %', v_email_objetivo;
  END IF;

  RAISE NOTICE 'Usuario % promovido a Administrador con acceso total', v_email_objetivo;
END
$$;

-- 5) Verificación
SELECT
  COALESCE(
    to_jsonb(u)->>'id_roles',
    to_jsonb(u)->>'id_rol',
    to_jsonb(u)->>'rol_id'
  ) AS id_rol_usuario,
  r.nombre AS rol_nombre,
  u.*
FROM usuarios u
LEFT JOIN roles r
  ON r.id_roles::TEXT = COALESCE(
    to_jsonb(u)->>'id_roles',
    to_jsonb(u)->>'id_rol',
    to_jsonb(u)->>'rol_id'
  )
WHERE (u.correo = 'admin@occitours.com' OR u.email = 'admin@occitours.com');

SELECT
  r.nombre AS rol,
  COUNT(rp.id_permisos) AS total_permisos
FROM roles r
LEFT JOIN rol_permiso rp ON rp.id_roles = r.id_roles
WHERE r.nombre = 'Administrador'
GROUP BY r.nombre;
