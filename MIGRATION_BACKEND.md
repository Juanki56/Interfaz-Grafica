# Migración a Backend Real

## Cambios Realizados

Se ha migrado el sistema de autenticación mock (local) a un sistema que conecta con el backend real.

### Archivos Modificados

1. **src/App.tsx**
   - ✅ Función `login`: Ahora conecta con `POST /api/auth/login`
   - ✅ Función `register`: Ahora conecta con `POST /api/auth/register`
   - ✅ Función `checkSession`: Verifica el token con `GET /api/auth/verify`
   - ✅ Función `logout`: Limpia el token de localStorage
   - ✅ Función `updateUserRole`: Conecta con `PUT /api/users/role`

### Archivos Nuevos

1. **src/config/api.config.ts**
   - Configuración centralizada de la API
   - Funciones helper para construir URLs y headers
   - Facilita cambios de endpoints en el futuro

2. **.env.example**
   - Template para variables de entorno
   - Define `VITE_API_URL` para configurar la URL del backend

## Configuración

### 1. Crear archivo .env

Crea un archivo `.env` en la raíz del proyecto (copia de `.env.example`):

```bash
cp .env.example .env
```

### 2. Configurar la URL del backend

Edita el archivo `.env`:

```env
VITE_API_URL=http://localhost:3000
```

### 3. Reiniciar el servidor de desarrollo

Después de crear o modificar el archivo `.env`, reinicia Vite:

```bash
npm run dev
```

## Estructura de Respuestas Esperadas del Backend

### Login (POST /api/auth/login)

**Request:**
```json
{
  "correo": "usuario@ejemplo.com",
  "contrasena": "password123"
}
```

**Response (éxito):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "1",
    "name": "Usuario Ejemplo",
    "email": "usuario@ejemplo.com",
    "role": "admin"
  }
}
```

### Register (POST /api/auth/register)

**Request:**
```json
{
  "nombre": "Usuario Nuevo",
  "correo": "nuevo@ejemplo.com",
  "contrasena": "password123",
  "rol": "client"
}
```

**Response (éxito):**
```json
{
  "mensaje": "Usuario registrado exitosamente"
}
```

### Verify Token (GET /api/auth/verify)

**Headers:**
```
Authorization: Bearer {token}
```

**Response (éxito):**
```json
{
  "usuario": {
    "id": "1",
    "name": "Usuario Ejemplo",
    "email": "usuario@ejemplo.com",
    "role": "admin"
  }
}
```

### Update User Role (PUT /api/users/role)

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "correo": "usuario@ejemplo.com",
  "rol": "advisor"
}
```

**Response (éxito):**
```json
{
  "mensaje": "Rol actualizado exitosamente"
}
```

## Próximos Pasos

La función `getAllUsers()` todavía retorna un array vacío y muestra un warning en consola. Para completar la migración:

1. Implementa el endpoint `GET /api/users` en tu backend
2. Actualiza la función `getAllUsers()` en `App.tsx` para hacer fetch a ese endpoint

## Notas Importantes

- El sistema mock todavía existe en el código pero está marcado como deprecated
- El token se guarda en `localStorage` con la clave `token`
- Todas las URLs del backend se centralizan en `src/config/api.config.ts`
- Los headers de autenticación se manejan automáticamente con la función `getAuthHeaders()`
