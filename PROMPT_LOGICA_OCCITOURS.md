# PROMPT MAESTRO — Lógica OCCITOURS (Frontend + Permisos/Roles + Auth)

Copia y pega este prompt en otro chat/IA para continuar el trabajo **respetando exactamente la lógica ya implementada**.

---

## Rol
Actúa como un **ingeniero senior full‑stack** (React + TypeScript + Node/Express + PostgreSQL) y continúa el desarrollo del proyecto **OCCITOURS** sin romper lo existente.

## Contexto del proyecto
- Proyecto: **Occitours - interfaz gráfica** (SPA).
- Frontend: **Vite + React + TypeScript + Tailwind**.
- Backend: Node.js (puerto **3000**) con JWT y PostgreSQL.
- Frontend dev server: puerto **5173**.
- URL base backend configurable por env: `VITE_API_URL` (default `http://localhost:3000`).
- El frontend ya está conectado a backend (login, register, profile, recuperación).

## Archivos y piezas clave (ya existen)
- Auth + routing principal: [src/App.tsx](src/App.tsx)
- Config endpoints + headers: [src/config/api.config.ts](src/config/api.config.ts)
- Servicio API central (wrappers `fetchAPI` + recursos): [src/services/api.ts](src/services/api.ts)
- Permisos (hook): [src/hooks/usePermissions.tsx](src/hooks/usePermissions.tsx)
- Helpers de permisos (módulo/acción): [src/utils/permissionHelper.ts](src/utils/permissionHelper.ts)
- Gestión de roles/permisos UI: [src/components/RoleManagement.tsx](src/components/RoleManagement.tsx)
- Servicios precargados (protegido): [src/hooks/useServices.tsx](src/hooks/useServices.tsx)
- Decoder JWT: [src/utils/jwtDecoder.ts](src/utils/jwtDecoder.ts)
- Documentación de integración: [GUIA_INTEGRACION.md](GUIA_INTEGRACION.md), [src/INTEGRACION_PERMISOS.md](src/INTEGRACION_PERMISOS.md), [RESUMEN_PERMISOS.md](RESUMEN_PERMISOS.md)

## Objetivo funcional (lo ya logrado)
1) Autenticación real contra backend con JWT, manejo de sesión y restauración.
2) Mapeo robusto de roles backend (ES) → roles frontend (EN): `admin | advisor | guide | client`.
3) Sistema **dinámico** de roles y permisos consumiendo la BD (no hardcodeado) para:
   - Permitir/denegar acciones en UI (crear/editar/eliminar/ver/aprobar/cancelar).
   - Mostrar/ocultar botones según permisos.
   - Administrar roles + asignación de permisos desde el panel (RoleManagement).
4) Evitar llamadas a endpoints protegidos cuando no hay token o rol permitido (ej. servicios).

---

# 1) Autenticación (Frontend ↔ Backend)

## Endpoints usados (frontend)
Definidos en [src/config/api.config.ts](src/config/api.config.ts):
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/register-pending`
- `POST /api/auth/verificar-email`
- `POST /api/auth/reenviar-verificacion`
- `POST /api/auth/solicitar-recuperacion`
- `POST /api/auth/resetear-contrasena`
- `GET /api/auth/profile` (se usa como verify/restore de sesión)

## Token + sesión
- El token JWT se guarda en `localStorage` con clave: `token`.
- Se implementa expiración “del lado cliente” con `localStorage.session_expiry`.
  - `setSessionExpiry(minutes)` guarda un timestamp futuro.
  - `isSessionExpired()` retorna `true` si falta/expiró `session_expiry`.
- En [src/App.tsx](src/App.tsx) se hace:
  - `checkSession()` al cargar: si hay token → llama `GET /api/auth/profile`.
  - Si el perfil es válido y la sesión local no expiró → restablece `user`.
  - Un intervalo hace auto‑logout si expira `session_expiry`.

## Estructura del usuario en frontend
`user` en el AuthContext tiene:
- `id` (string)
- `name`
- `email`
- `role`: `admin | advisor | guide | client`
- `phone`, `status`

## Mapeo de roles (backend → frontend)
- El backend puede devolver rol desde múltiples fuentes (perfil/login/JWT):
  - `rol_nombre`, `rol`, `role`, `tipo_usuario`.
- Se normaliza a roles frontend (EN) con `ROLE_MAPPING` + heurísticas.
- Si el backend solo envía `id_roles` (o similar), el frontend puede resolver el nombre consultando `GET /api/roles` y luego normalizar.

## Forced admin (override por email)
- Existe `VITE_FORCED_ADMIN_EMAIL` (default `admin@occitours.com`).
- Si el email del usuario coincide, se fuerza `role = 'admin'`.

## Manejo de errores de login
- Si status 403 y el backend indica “no verificado” → devolver código `EMAIL_NOT_VERIFIED`.
- Si 401 → `INVALID_CREDENTIALS`.
- Otros → `SERVER_ERROR`.

---

# 2) Sistema dinámico de Roles y Permisos

## Principio
- El frontend **NO** hardcodea permisos por rol.
- Los permisos se leen de la BD vía endpoints.
- El frontend controla UX/visibilidad, pero el backend **debe** validar permisos en endpoints.

## Convención final de permisos (lo que usa el código)
- Los permisos se manejan como strings con formato:
  - `modulo.accion`
- Acciones soportadas en UI: `crear | editar | eliminar | ver | aprobar | cancelar`.
- Mapeo importante: en BD “ver” se representa como **`leer`**.
  - Ejemplo: `Clientes.ver` → `clientes.leer`.

Esta convención está implementada en:
- [src/utils/permissionHelper.ts](src/utils/permissionHelper.ts) (`buildPermissionName`)

## Módulos soportados (frontend)
Definidos como union type en [src/utils/permissionHelper.ts](src/utils/permissionHelper.ts):
- Usuarios, Clientes, Propietarios, Empleados, Reservas, Fincas, Rutas, Servicios, Ventas, Abonos, Pagos, Proveedores, Restaurantes, Tours, Roles.

## Hook principal: usePermissions
En [src/hooks/usePermissions.tsx](src/hooks/usePermissions.tsx):
- Lee el rol actual desde el JWT (`decodeJWT`) para saber si es admin.
- Estados:
  - `currentUserRole` (string del token)
  - `userPermissions` (Permiso[])
  - `allRoles` (solo se carga para admin)
- Carga:
  - Si **Admin**: `GET /api/roles` y para cada rol `GET /api/roles/:id/permisos`.
  - Si **No-Admin**: `GET /api/roles/mi-rol/permisos`.
- Verificación:
  - `hasPermission(permissionName: string)` → compara con `permiso.nombre`.
  - Admin retorna `true` a todo.

## Helpers para usar en módulos
En [src/utils/permissionHelper.ts](src/utils/permissionHelper.ts):
- `createModulePermissions(permissions, 'Clientes' | ...)` devuelve:
  - `canCreate()`, `canEdit()`, `canDelete()`, `canView()`, `canApprove()`, `canCancel()`
  - `getErrorMessage(action)` para toasts

## UI de Roles: RoleManagement
En [src/components/RoleManagement.tsx](src/components/RoleManagement.tsx):
- Se gatea el módulo usando `createModulePermissions(permisos, 'Roles')`.
- Carga catálogo de permisos con `permisosAPI.getAll()`.
- Carga roles con `rolesAPI.getAll()` y para cada rol carga permisos con `rolesAPI.getPermisosDeRol(id)`.
- Actualiza permisos:
  - `rolesAPI.actualizarPermisos(idRol, idPermisos)` (PUT).

---

# 3) Endpoints requeridos en backend (para que el frontend funcione)

## Roles
- `GET /api/roles` → lista de roles.
- `GET /api/roles/:id` → detalle de rol.
- `POST /api/roles` → crear rol.
- `PUT /api/roles/:id` → editar rol.
- `DELETE /api/roles/:id` → eliminar rol.

## Permisos
- `GET /api/permisos` → catálogo completo.
  - Fallback si no existe: `GET /api/roles/permisos`.
- `GET /api/roles/:id/permisos` → permisos asignados a rol.
- `PUT /api/roles/:id/permisos` con body `{ "id_permisos": number[] }` → reemplazar permisos.
- `GET /api/roles/mi-rol/permisos` → permisos del usuario actual (no requiere ser admin).

## Reglas de seguridad (backend)
- El backend debe responder 403 cuando falte permiso, devolviendo idealmente:
  - `permiso_requerido: ["roles.leer"]` o similar.

---

# 4) Regla crítica: no romper Home público (endpoints públicos vs protegidos)

- El Home/catálogo público debe consumir endpoints públicos (ej. `GET /api/rutas/activas`).
- El endpoint `GET /api/servicios` es protegido; si se llama sin token/permisos devuelve 403.
- Para eso existe el gate:
  - [src/App.tsx](src/App.tsx) monta [src/hooks/useServices.tsx](src/hooks/useServices.tsx) con `enabled={hasBackendToken && user && (user.role === 'admin' || user.role === 'advisor')}`.

---

# 5) Guía de implementación (cómo aplicar permisos en cualquier módulo)

Para cualquier módulo (ej. Propietarios, Clientes, Reservas):
1) Importar:
   - `usePermissions` y `createModulePermissions`.
2) Crear permisos del módulo:
   - `const perms = usePermissions();`
   - `const modulePerms = createModulePermissions(perms, 'Propietarios');`
3) Proteger vista:
   - Si `!modulePerms.canView()` → renderizar “Acceso denegado”.
4) Proteger botones:
   - Mostrar “Crear” solo si `modulePerms.canCreate()`.
5) Proteger handlers:
   - Antes de llamar API: si no hay permiso → toast con `modulePerms.getErrorMessage('crear'|'editar'...)`.

---

# 6) Validación rápida (pasos de verificación)

1) Backend corriendo en `http://localhost:3000`.
2) Frontend: `npm run dev`.
3) Login:
   - Verificar en `localStorage`:
     - `token`
     - `session_expiry`
4) Confirmar que `GET /api/auth/profile` responde `success: true`.
5) Confirmar permisos:
   - Si admin: `GET /api/roles` y `GET /api/roles/:id/permisos`.
   - Si no-admin: `GET /api/roles/mi-rol/permisos`.
6) RoleManagement:
   - Debe listar roles + sus permisos.
   - Editar permisos debe hacer `PUT /api/roles/:id/permisos`.

---

# 7) Restricciones de implementación (para no desalinear el proyecto)

- Mantener el stack actual (React + TS + Vite + Tailwind).
- Evitar reescribir componentes grandes sin necesidad.
- Respetar la convención de permisos `modulo.accion` y el mapeo `ver → leer`.
- No introducir llamadas a endpoints protegidos desde vistas públicas.

---

## Tu tarea cuando continúes
Cuando te pida “integrar permisos en X módulo” o “conectar X componente al backend”, debes:
- Usar el sistema de permisos ya existente (hook + helper),
- No hardcodear roles/permisos,
- Mantener la lógica de sesión + token y el gate de servicios,
- Y, si algo falla por backend, proponer el endpoint exacto que falta o el permiso requerido.
