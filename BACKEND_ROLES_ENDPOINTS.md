# 🔌 Endpoints Necesarios en el Backend Node.js para Roles

El frontend ahora está configurado para usar tu backend Node.js en `http://localhost:3000`.

## 📋 Endpoints que Debes Implementar

### 1. **GET /api/roles** - Obtener todos los roles
```javascript
// Respuesta esperada:
[
  {
    "id_roles": 1,
    "nombre": "Administrador",
    "descripcion": "Acceso total al sistema",
    "estado": true,
    "fecha_creacion": "2026-03-02T20:41:01.451039"
  },
  {
    "id_roles": 2,
    "nombre": "Cliente",
    "descripcion": "Usuario que realiza reservas y compras de tours",
    "estado": true,
    "fecha_creacion": "2026-03-09T20:01:06.631678"
  }
  // ... más roles
]
```

### 2. **GET /api/roles/:id** - Obtener un rol por ID
```javascript
// Ejemplo: GET /api/roles/1
// Respuesta esperada:
{
  "id_roles": 1,
  "nombre": "Administrador",
  "descripcion": "Acceso total al sistema",
  "estado": true,
  "fecha_creacion": "2026-03-02T20:41:01.451039",
  "permisos": [] // opcional
}
```

### 3. **POST /api/roles** - Crear un nuevo rol
```javascript
// Body esperado:
{
  "nombre": "Coordinador",
  "descripcion": "Gestiona equipos y proyectos",
  "estado": true
}

// Respuesta esperada:
{
  "id_roles": 5,
  "nombre": "Coordinador",
  "descripcion": "Gestiona equipos y proyectos",
  "estado": true,
  "fecha_creacion": "2026-03-10T15:30:00.000Z"
}
```

### 4. **PUT /api/roles/:id** - Actualizar un rol
```javascript
// Ejemplo: PUT /api/roles/5
// Body esperado:
{
  "nombre": "Coordinador Regional",
  "descripcion": "Gestiona equipos en una región específica",
  "estado": true
}

// Respuesta esperada:
{
  "id_roles": 5,
  "nombre": "Coordinador Regional",
  "descripcion": "Gestiona equipos en una región específica",
  "estado": true,
  "fecha_creacion": "2026-03-10T15:30:00.000Z"
}
```

### 5. **DELETE /api/roles/:id** - Eliminar un rol
```javascript
// Ejemplo: DELETE /api/roles/5
// Respuesta esperada:
{
  "success": true,
  "message": "Rol eliminado exitosamente"
}

// O simplemente status 204 No Content
```

### 6. **GET /api/roles/:id/permisos** - Obtener permisos de un rol (opcional)
```javascript
// Ejemplo: GET /api/roles/1/permisos
// Respuesta esperada:
[
  {
    "id_permisos": 1,
    "nombre": "usuarios.crear",
    "descripcion": "Puede crear nuevos usuarios",
    "estado": true
  },
  {
    "id_permisos": 2,
    "nombre": "usuarios.editar",
    "descripcion": "Puede editar usuarios existentes",
    "estado": true
  }
  // ... más permisos
]
```

## 🗄️ Estructura de la Tabla en PostgreSQL

```sql
-- Tabla de roles (ya la tienes como _roles)
CREATE TABLE _roles (
    id_roles SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔒 Validaciones Recomendadas

### En POST /api/roles:
- ✅ `nombre` es obligatorio
- ✅ `nombre` no debe estar duplicado
- ✅ `nombre` debe tener mínimo 3 caracteres
- ✅ `descripcion` es opcional

### En PUT /api/roles/:id:
- ✅ El rol debe existir
- ✅ No permitir editar roles del sistema: "Administrador", "Cliente", "Asesor", "Guía"
- ✅ Si se cambia el nombre, verificar que no esté duplicado

### En DELETE /api/roles/:id:
- ✅ El rol debe existir
- ✅ No permitir eliminar roles del sistema
- ✅ No permitir eliminar si hay usuarios asignados
- ✅ Verificar en tabla `usuarios` o la que uses para asignación

## 📝 Ejemplo de Implementación en Express.js

```javascript
// routes/roles.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database'); // Tu conexión a PostgreSQL

// GET /api/roles - Obtener todos
router.get('/roles', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM _roles ORDER BY nombre ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
});

// GET /api/roles/:id - Obtener por ID
router.get('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM _roles WHERE id_roles = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener rol:', error);
    res.status(500).json({ error: 'Error al obtener rol' });
  }
});

// POST /api/roles - Crear
router.post('/roles', async (req, res) => {
  try {
    const { nombre, descripcion, estado = true } = req.body;
    
    if (!nombre || nombre.trim().length < 3) {
      return res.status(400).json({ 
        error: 'El nombre es obligatorio y debe tener mínimo 3 caracteres' 
      });
    }
    
    const result = await pool.query(
      'INSERT INTO _roles (nombre, descripcion, estado) VALUES ($1, $2, $3) RETURNING *',
      [nombre.trim(), descripcion || null, estado]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Duplicate key
      return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
    }
    console.error('Error al crear rol:', error);
    res.status(500).json({ error: 'Error al crear rol' });
  }
});

// PUT /api/roles/:id - Actualizar
router.put('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, estado } = req.body;
    
    // Verificar que el rol existe
    const checkResult = await pool.query(
      'SELECT nombre FROM _roles WHERE id_roles = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }
    
    // No permitir editar roles del sistema
    const rolesDelSistema = ['Administrador', 'Cliente', 'Asesor', 'Guía'];
    if (rolesDelSistema.includes(checkResult.rows[0].nombre)) {
      return res.status(403).json({ 
        error: 'No se pueden editar roles del sistema' 
      });
    }
    
    // Construir query dinámicamente
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (nombre !== undefined) {
      updates.push(`nombre = $${paramIndex++}`);
      values.push(nombre.trim());
    }
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramIndex++}`);
      values.push(descripcion);
    }
    if (estado !== undefined) {
      updates.push(`estado = $${paramIndex++}`);
      values.push(estado);
    }
    
    values.push(id); // ID para el WHERE
    
    const result = await pool.query(
      `UPDATE _roles SET ${updates.join(', ')} WHERE id_roles = $${paramIndex} RETURNING *`,
      values
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
    }
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
});

// DELETE /api/roles/:id - Eliminar
router.delete('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el rol existe
    const checkResult = await pool.query(
      'SELECT nombre FROM _roles WHERE id_roles = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }
    
    // No permitir eliminar roles del sistema
    const rolesDelSistema = ['Administrador', 'Cliente', 'Asesor', 'Guía'];
    if (rolesDelSistema.includes(checkResult.rows[0].nombre)) {
      return res.status(403).json({ 
        error: 'No se pueden eliminar roles del sistema' 
      });
    }
    
    // Verificar que no hay usuarios con este rol
    // NOTA: Ajusta el nombre de la tabla según tu BD
    const usersCheck = await pool.query(
      'SELECT COUNT(*) as count FROM usuarios WHERE id_roles = $1',
      [id]
    );
    
    if (parseInt(usersCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar un rol que tiene usuarios asignados' 
      });
    }
    
    await pool.query('DELETE FROM _roles WHERE id_roles = $1', [id]);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar rol:', error);
    res.status(500).json({ error: 'Error al eliminar rol' });
  }
});

module.exports = router;
```

## 🚀 Para Usar en tu App Express

```javascript
// app.js o index.js
const rolesRouter = require('./routes/roles');

app.use('/api', rolesRouter);
```

## ✅ Cómo Probar

1. **Asegúrate de que tu backend esté corriendo** en `http://localhost:3000`

2. **Verifica los endpoints con curl o Postman:**

```bash
# GET todos los roles
curl http://localhost:3000/api/roles

# POST crear rol
curl -X POST http://localhost:3000/api/roles \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Coordinador","descripcion":"Gestiona equipos"}'

# PUT actualizar rol
curl -X PUT http://localhost:3000/api/roles/5 \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Coordinador Regional"}'

# DELETE eliminar rol
curl -X DELETE http://localhost:3000/api/roles/5
```

3. **Desde el frontend**, abre el navegador y ve a la sección de Roles. Deberías ver los roles cargando automáticamente.

## 🐛 Solución de Problemas

### Error: "Failed to fetch"
- Verifica que el backend esté corriendo
- Verifica que la URL sea `http://localhost:3000`
- Revisa CORS en tu backend

### Error: "No se pueden obtener roles"
- Verifica que la tabla `_roles` existe en PostgreSQL
- Verifica la conexión a la base de datos
- Revisa los logs del backend

### Error 401/403
- Si implementaste autenticación, verifica que el token JWT se esté enviando
- Revisa los headers de autenticación en el frontend
