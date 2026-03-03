# 🚀 Guía de Integración Frontend-Backend - OCCITOURS

## ✅ Estado Actual

### Backend (Puerto 3000)
- ✅ Endpoints de autenticación funcionando
- ✅ Base de datos PostgreSQL conectada
- ✅ JWT implementado
- ✅ Todos los controladores listos

### Frontend (Puerto 5173)
- ✅ Login conectado con backend
- ✅ Register conectado con backend
- ✅ Verificación de sesión implementada
- ✅ Servicio API completo creado

---

## 📁 Archivos Importantes

### Frontend
```
src/
├── config/
│   └── api.config.ts          # Configuración de endpoints
├── services/
│   └── api.ts                 # Funciones para llamar al backend
└── App.tsx                    # Lógica de autenticación
```

### Backend
```
controllers/authController.js  # Login devuelve: { token, usuario: {...} }
routes/authRoutes.js          # Rutas de autenticación
```

---

## 🔄 Flujo de Autenticación

### 1. Login
```typescript
// Lo que envías:
{ correo: "admin@occitours.com", contrasena: "password123" }

// Lo que recibes:
{
  success: true,
  token: "eyJhbGc...",
  usuario: {
    id: 1,
    correo: "admin@occitours.com",
    nombre: "Admin", 
    apellido: "Principal",
    rol: "Administrador",      // ← Nombre del rol en español
    tipo_usuario: "empleado"   // ← "cliente" o "empleado"
  }
}
```

### 2. Mapeo de Roles
El sistema automáticamente mapea:
- `"Administrador"` → `"admin"`
- `"Asesor"` → `"advisor"`
- `"Guía"` → `"guide"`
- `"Cliente"` → `"client"`

---

## 💻 Cómo Usar el Servicio API

### Ejemplo 1: Obtener Lista de Clientes

```typescript
import { clientesAPI } from '@/services/api';

// En tu componente
const MisClientes = () => {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const data = await clientesAPI.getAll();
        setClientes(data);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    cargarClientes();
  }, []);

  return (
    <div>
      {clientes.map(cliente => (
        <div key={cliente.id_cliente}>
          {cliente.nombre} {cliente.apellido}
        </div>
      ))}
    </div>
  );
};
```

### Ejemplo 2: Crear una Reserva

```typescript
import { reservasAPI } from '@/services/api';

const crearReserva = async () => {
  try {
    const nuevaReserva = {
      id_cliente: 5,
      fecha_reserva: '2026-03-15',
      estado: 'Pendiente',
      total: 500000
    };

    const resultado = await reservasAPI.create(nuevaReserva);
    console.log('Reserva creada:', resultado);
  } catch (error) {
    console.error('Error al crear reserva:', error);
  }
};
```

### Ejemplo 3: Buscar Clientes

```typescript
import { clientesAPI } from '@/services/api';

const buscarClientes = async (termino: string) => {
  try {
    const resultados = await clientesAPI.buscar(termino);
    console.log('Resultados:', resultados);
  } catch (error) {
    console.error('Error en búsqueda:', error);
  }
};
```

---

## 🎯 Próximos Pasos

### Opción A: Conectar Componentes Existentes
Reemplaza los datos "mock" en tus componentes por llamadas reales al backend usando `src/services/api.ts`.

**Componentes a actualizar:**
1. ✅ `LoginForm.tsx` - Ya está conectado
2. ✅ `RegisterForm.tsx` - Ya está conectado  
3. ⏳ `ClientsManagement.tsx` - Usa `clientesAPI.getAll()`
4. ⏳ `BookingsManagement.tsx` - Usa `reservasAPI.getAll()`
5. ⏳ `RoutesManagement.tsx` - Usa `rutasAPI.getAll()`
6. ⏳ `FarmsManagement.tsx` - Usa `fincasAPI.getAll()`
7. ⏳ `EmployeeManagement.tsx` - Usa `empleadosAPI.getAll()`
8. ⏳ `DashboardAnalytics.tsx` - Usa `dashboardAPI.getEstadisticas()`

### Opción B: Empezar con un Componente Específico
¿Cuál componente quieres conectar primero? Por ejemplo:
- Gestión de Clientes
- Dashboard con estadísticas reales
- Listado de Reservas
- etc.

---

## 🔍 Debugging

### Ver Logs de Autenticación
Abre la consola del navegador (F12) y busca:
- 🔐 Intentando login con...
- 📡 Respuesta del servidor...
- 👤 Usuario mapeado...
- 🎭 Rol del usuario...
- 🖥️ Renderizando vista...

### Verificar Token
```javascript
// En la consola del navegador:
localStorage.getItem('token')
```

### Ver Usuario Actual
```javascript
// Agregar en cualquier componente:
import { useAuth } from '@/App';

const { user } = useAuth();
console.log('Usuario actual:', user);
```

---

## 📝 Notas Importantes

1. **Token JWT expira en 5 minutos** - Está configurado en tu backend en `.env`
2. **CORS debe estar habilitado** en tu backend para que el frontend pueda conectarse
3. **Puerto 3000** - Asegúrate de que tu backend esté corriendo
4. **Puerto 5173** - Tu frontend con Vite

---

## 🆘 Errores Comunes

### Error: "Failed to fetch"
- ✅ Verifica que el backend esté corriendo en puerto 3000
- ✅ Revisa que CORS esté habilitado

### Error: "401 Unauthorized"
- ✅ Tu token expiró, vuelve a hacer login
- ✅ El token no se está enviando correctamente

### Error: "Rol no reconocido"
- ✅ El mapeo de roles está en `App.tsx` línea ~452
- ✅ Verifica que el backend retorne el rol correcto

---

## 🎉 ¡Todo Listo!

Ahora tu frontend está completamente conectado con tu backend. Solo necesitas:

1. **Arrancar el backend**: `cd occitours-backend-mvc && npm start`
2. **Arrancar el frontend**: `cd Interfaz-Grafica && npm run dev` 
3. **Abrir el navegador**: `http://localhost:5173`
4. **Hacer login** con un usuario de tu base de datos

¿Qué componente quieres conectar primero? 🚀
