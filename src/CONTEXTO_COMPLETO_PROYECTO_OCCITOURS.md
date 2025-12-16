# 📘 CONTEXTO COMPLETO DEL PROYECTO OCCITOURS
## Documentación Exhaustiva - Estado Actual del Sistema

---

## 🎯 VISIÓN GENERAL DEL PROYECTO

### Información General
**Nombre:** Plataforma Web Occitours  
**Tipo:** Sistema de gestión turística integral  
**Tecnologías:** React + TypeScript + Tailwind CSS v4 + Motion/React  
**Arquitectura:** SPA (Single Page Application) con enrutamiento por estados  
**Estado:** En desarrollo activo con módulos principales implementados

### Paleta de Colores Oficial
- **Verde Primario:** `green-600`, `green-700`, `green-50`, `green-100`
- **Blanco:** Base de fondo y elementos
- **Colores de apoyo:** Azul, Gris para estados y badges

### Filosofía de Diseño
- **Minimalista:** Interfaz limpia sin elementos innecesarios
- **Naturaleza:** Inspiración en paisajes colombianos
- **Accesibilidad:** Componentes WCAG compatibles
- **Responsive:** Mobile-first con adaptación a todas las pantallas

---

## 👥 SISTEMA DE ROLES Y USUARIOS

### 4 Roles Principales

#### 1. **Administrador (admin)**
**Acceso completo al sistema**

**Credenciales de prueba:**
- Email: `admin@occitours.com`
- Password: `password123`

**Funcionalidades:**
- ✅ Dashboard completo con métricas y gráficos
- ✅ Gestión de usuarios (CRUD completo)
- ✅ Gestión de empleados (asesores y guías)
- ✅ Gestión de paquetes turísticos
- ✅ Gestión de rutas
- ✅ Gestión de fincas
- ✅ Gestión de servicios
- ✅ Gestión de transporte
- ✅ Control de ventas y abonos
- ✅ Gestión de pagos a proveedores
- ✅ Gestión de restaurantes
- ✅ Gestión de personal médico
- ✅ Administración de roles y permisos
- ✅ Agendamiento y calendario
- ✅ Reportes y estadísticas avanzadas

**Dashboard Actual:** `AdminDashboardWithDropdown.tsx`

#### 2. **Asesor (advisor)**
**Gestión de ventas y atención al cliente**

**Credenciales de prueba:**
- Email: `asesor@occitours.com`
- Password: `password123`

**Funcionalidades:**
- ✅ Dashboard con métricas personales
- ✅ Visualización de clientes asignados
- ✅ Gestión de reservas (crear, ver, modificar)
- ✅ Registro de ventas
- ✅ Control de abonos y pagos
- ✅ Chat con guías
- ✅ Calendario de actividades
- ✅ Historial de transacciones
- ✅ Comisiones personales
- ❌ No puede eliminar usuarios
- ❌ No puede modificar configuraciones globales

**Dashboard Actual:** `AdvisorDashboardImproved.tsx`

#### 3. **Guía Turístico (guide)**
**Ejecución de rutas y atención de grupos**

**Credenciales de prueba:**
- Email: `guia@occitours.com`
- Password: `password123`

**Funcionalidades:**
- ✅ Dashboard con rutas asignadas
- ✅ Calendario de tours
- ✅ Visualización de grupos
- ✅ Información de clientes del tour
- ✅ Chat con asesores
- ✅ Actualización de estado de rutas
- ✅ Reportes post-tour
- ✅ Gestión de emergencias
- ❌ No accede a información financiera
- ❌ No puede crear/eliminar rutas

**Dashboard Actual:** `GuideDashboardImproved.tsx`

#### 4. **Cliente (client)**
**Usuario final que reserva tours**

**Credenciales de prueba:**
- Email: `cliente@occitours.com`
- Password: `password123`

**Funcionalidades:**
- ✅ Dashboard personal
- ✅ Exploración de rutas disponibles
- ✅ Exploración de fincas
- ✅ Exploración de paquetes
- ✅ Sistema de reservas
- ✅ Historial de tours realizados
- ✅ Tours activos
- ✅ Favoritos
- ✅ Perfil personal
- ✅ Encuestas de satisfacción
- ✅ Chat con soporte
- ❌ No accede a backend administrativo

**Dashboard Actual:** `ClientDashboardImproved.tsx`

---

## 🗂️ ESTRUCTURA DEL PROYECTO

### Árbol de Archivos Principal

```
/
├── App.tsx                          # ⭐ Componente raíz - Enrutamiento y contexto
├── /components/                     # 📁 Todos los componentes React
│   ├── AdminDashboard.tsx           # Dashboard de administrador (v1)
│   ├── AdminDashboardWithDropdown.tsx  # ⭐ Dashboard admin ACTIVO
│   ├── AdvisorDashboardImproved.tsx # ⭐ Dashboard asesor ACTIVO
│   ├── GuideDashboardImproved.tsx   # ⭐ Dashboard guía ACTIVO
│   ├── ClientDashboardImproved.tsx  # ⭐ Dashboard cliente ACTIVO
│   ├── HomePage.tsx                 # ⭐ Página principal pública
│   ├── LoginForm.tsx                # ⭐ Formulario de inicio de sesión
│   ├── RegisterForm.tsx             # ⭐ Formulario de registro
│   ├── Navigation.tsx               # Navegación lateral para usuarios autenticados
│   ├── HeaderNavigation.tsx         # Navegación superior para vista pública
│   ├── PublicNavigation.tsx         # Navegación para usuarios no autenticados
│   ├── RoutesPage.tsx               # ⭐ Catálogo de rutas turísticas
│   ├── RouteDetailPage.tsx          # Detalle individual de ruta
│   ├── FarmsPage.tsx                # ⭐ Catálogo de fincas
│   ├── FarmDetailPage.tsx           # Detalle individual de finca
│   ├── PackagesPage.tsx             # ⭐ Catálogo de paquetes turísticos
│   ├── PackageDetailPage.tsx        # Detalle individual de paquete
│   ├── EmployeeManagement.tsx       # ⭐ Gestión completa de empleados
│   ├── PaymentManagement.tsx        # Gestión de pagos de clientes
│   ├── ProviderPaymentManagement.tsx # ⭐ Gestión de pagos a proveedores
│   ├── RestaurantManagement.tsx     # Gestión de restaurantes
│   ├── RoleManagement.tsx           # Gestión de roles y permisos
│   ├── ServiceManagement.tsx        # Gestión de servicios adicionales
│   ├── UserProfile.tsx              # Perfil de usuario
│   ├── SchedulingPage.tsx           # Agendamiento y calendario
│   ├── SalesDashboard.tsx           # Dashboard de ventas
│   ├── AgendaPage.tsx               # Página de agenda
│   ├── SatisfactionSurvey.tsx       # Encuestas de satisfacción
│   ├── StatusManager.tsx            # Gestor de estados de reservas
│   ├── NotificationPanel.tsx        # Panel de notificaciones
│   ├── ChatSimulator.tsx            # Simulador de chat
│   ├── TourBookingModal.tsx         # Modal de reserva de tours
│   ├── GuideInfoModal.tsx           # Modal de información de guía
│   ├── FavoritesModal.tsx           # Modal de favoritos
│   ├── CreateBookingForm.tsx        # Formulario de creación de reservas
│   ├── CreateUserForm.tsx           # Formulario de creación de usuarios
│   ├── CreateRouteForm.tsx          # Formulario de creación de rutas
│   ├── CreateRouteFormWithServices.tsx # Formulario avanzado de rutas
│   ├── CreateFarmForm.tsx           # Formulario de creación de fincas
│   ├── CreateFarmFormWithServices.tsx # Formulario avanzado de fincas
│   ├── CreateTourForm.tsx           # Formulario de creación de tours
│   ├── CreateTourFormWithServices.tsx # Formulario avanzado de tours
│   ├── CreateModal.tsx              # Modal genérico de creación
│   ├── DeleteConfirmModal.tsx       # Modal de confirmación de eliminación
│   ├── ViewDetailsModal.tsx         # Modal de visualización de detalles
│   ├── ServiceSelector.tsx          # Selector de servicios
│   ├── DashboardLayout.tsx          # Layout base para dashboards
│   └── /ui/                         # 🎨 Componentes de UI reutilizables (Shadcn)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── table.tsx
│       ├── badge.tsx
│       ├── alert.tsx
│       ├── toast.tsx
│       └── ... (40+ componentes)
├── /hooks/                          # 🎣 Custom Hooks
│   ├── useBookings.tsx              # Hook para gestión de reservas
│   ├── useServices.tsx              # ⭐ Hook para gestión de servicios
│   └── useTours.tsx                 # Hook para gestión de tours
├── /utils/                          # 🛠️ Utilidades y helpers
│   ├── mockData.tsx                 # ⭐ Datos mock de rutas, fincas, paquetes
│   ├── adminMockData.tsx            # ⭐ Datos mock para admin (reservas, ventas)
│   └── /supabase/
│       ├── client.tsx               # Cliente de Supabase
│       └── info.tsx                 # Info de conexión
├── /styles/
│   └── globals.css                  # ⭐ Estilos globales y tokens CSS
├── /supabase/functions/             # ☁️ Edge Functions
│   └── server/
│       ├── index.tsx
│       ├── init-demo-users.tsx
│       └── kv_store.tsx
├── database_schema_occitours.sql    # ⭐ Schema completo de base de datos
├── EMPLOYEE_MANAGEMENT_README.md    # 📖 Documentación de empleados
├── ACCIONES_EMPLEADOS.md            # 📖 Matriz de acciones de empleados
└── guidelines/Guidelines.md         # 📖 Guías del proyecto
```

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### Arquitectura Actual
**Tipo:** Mock Authentication (localStorage)  
**Estado:** Funcional para desarrollo  
**Archivo:** `App.tsx` (líneas 23-157)

### Funcionalidades Implementadas

#### 1. **Login (Inicio de Sesión)**
**Archivo:** `LoginForm.tsx`

**Campos:**
- Email (validación de formato)
- Contraseña (mínimo 6 caracteres)

**Flujo:**
1. Usuario ingresa credenciales
2. Sistema valida contra `mockAuth.users`
3. Si es válido: crea sesión en localStorage
4. Redirige al dashboard según rol
5. Si es inválido: muestra error

**Usuarios predefinidos:**
```javascript
{
  'admin@occitours.com': 'password123',
  'asesor@occitours.com': 'password123',
  'guia@occitours.com': 'password123',
  'cliente@occitours.com': 'password123'
}
```

#### 2. **Registro (Sign Up)**
**Archivo:** `RegisterForm.tsx`

**Campos obligatorios:**
- Nombre completo
- Email único
- Contraseña (mínimo 6 caracteres)
- Confirmación de contraseña
- Rol (selección)

**Validaciones:**
- Email no puede estar duplicado
- Contraseñas deben coincidir
- Todos los campos son obligatorios

**Flujo:**
1. Usuario completa formulario
2. Sistema valida datos
3. Crea nuevo usuario en `mockAuth.users`
4. Guarda en localStorage
5. Muestra mensaje de éxito
6. Redirige a login

#### 3. **Logout (Cerrar Sesión)**
**Ubicación:** Botón en Navigation / HeaderNavigation

**Flujo:**
1. Usuario hace clic en "Cerrar sesión"
2. Se elimina `occitours_session` de localStorage
3. Estado de usuario se limpia
4. Redirige a HomePage

#### 4. **Persistencia de Sesión**
**Mecanismo:** localStorage

**Clave:** `occitours_session`  
**Contenido:**
```javascript
{
  access_token: 'mock_token_[userId]',
  user: {
    id: string,
    name: string,
    email: string,
    role: 'admin' | 'advisor' | 'guide' | 'client',
    phone?: string,
    status?: string
  }
}
```

**Recuperación automática:**
- Al cargar la app, verifica sesión existente
- Si existe y es válida, restaura usuario
- Si no existe o es inválida, muestra vista pública

### AuthContext
**Ubicación:** `App.tsx` (líneas 164-192)

**Propiedades:**
- `user`: Usuario actual o null
- `login`: Función de inicio de sesión
- `register`: Función de registro
- `logout`: Función de cierre de sesión
- `currentView`: Vista actual del sistema
- `setCurrentView`: Cambiar vista
- `loading`: Estado de carga
- `getAllUsers`: Obtener todos los usuarios (admin)
- `updateUserRole`: Actualizar rol de usuario (admin)

**Uso en componentes:**
```typescript
const { user, login, logout } = useAuth();
```

---

## 📊 MÓDULO: GESTIÓN DE RUTAS TURÍSTICAS

### Archivos Involucrados
- `components/RoutesPage.tsx` - Catálogo público
- `components/RouteDetailPage.tsx` - Detalle de ruta
- `components/CreateRouteForm.tsx` - Formulario básico
- `components/CreateRouteFormWithServices.tsx` - Formulario avanzado
- `utils/mockData.tsx` - Datos de rutas

### Estructura de Datos: Route

```typescript
interface Route {
  id: string;                    // Identificador único
  name: string;                  // Nombre de la ruta
  description: string;           // Descripción completa
  shortDescription: string;      // Descripción breve
  duration: string;              // Duración (ej: "8 horas")
  difficulty: 'Fácil' | 'Moderado' | 'Difícil';
  price: number;                 // Precio en COP
  image: string;                 // URL de imagen principal
  gallery: string[];             // Array de imágenes
  includes: string[];            // Qué incluye la ruta
  itinerary: {                   // Itinerario detallado
    time: string;
    activity: string;
    description: string;
  }[];
  location: string;              // Ubicación geográfica
  maxGroupSize: number;          // Tamaño máximo del grupo
  featured: boolean;             // Si es destacada
}
```

### Rutas Predefinidas (mockData)

#### 1. **Sendero del Cóndor**
- **ID:** `1`
- **Duración:** 8 horas
- **Dificultad:** Moderado
- **Precio:** $120,000 COP
- **Ubicación:** Parque Nacional Natural
- **Grupo máximo:** 12 personas
- **Estado:** ⭐ Destacada
- **Incluye:**
  - Guía especializado
  - Equipo de seguridad
  - Refrigerio
  - Transporte ida y vuelta
  - Seguro de accidentes
- **Itinerario:** 6 paradas desde 6:00 AM hasta 4:00 PM

#### 2. **Valle de los Frailejones**
- **ID:** `2`
- **Duración:** 6 horas
- **Dificultad:** Fácil
- **Precio:** $85,000 COP
- **Ubicación:** Páramo de Sumapaz
- **Grupo máximo:** 15 personas
- **Incluye:**
  - Guía naturalista
  - Transporte
  - Refrigerio
  - Equipo básico
- **Itinerario:** 6 paradas desde 8:00 AM hasta 4:00 PM

#### 3. **Cascadas Escondidas**
- **ID:** `3`
- **Duración:** 10 horas
- **Dificultad:** Difícil
- **Precio:** $180,000 COP
- **Ubicación:** Selva Húmeda Tropical
- **Grupo máximo:** 8 personas
- **Estado:** ⭐ Destacada
- **Incluye:**
  - Guía experto
  - Equipo completo de seguridad
  - Almuerzo
  - Transporte 4x4
  - Seguro premium
- **Itinerario:** 7 paradas desde 5:00 AM hasta 6:00 PM

### Funcionalidades - RoutesPage

#### Visualización
- ✅ Grid responsivo de cards de rutas
- ✅ Imagen destacada por ruta
- ✅ Información básica: nombre, duración, precio, dificultad
- ✅ Badge de dificultad con colores
- ✅ Ubicación con icono
- ✅ Tamaño máximo de grupo

#### Filtros Implementados
1. **Por dificultad:**
   - Todas
   - Fácil
   - Moderado
   - Difícil

2. **Por rango de precio:**
   - Slider de 0 a 200,000 COP
   - Actualización en tiempo real

3. **Por búsqueda:**
   - Campo de texto
   - Busca en: nombre, descripción, ubicación

#### Ordenamiento
- ✅ Por precio (menor a mayor / mayor a menor)
- ✅ Por nombre (A-Z / Z-A)
- ✅ Por popularidad (rutas destacadas primero)

### Funcionalidades - RouteDetailPage

#### Secciones
1. **Header:**
   - Galería de imágenes (con navegación)
   - Nombre de la ruta
   - Ubicación
   - Precio destacado

2. **Información General:**
   - Descripción completa
   - Duración
   - Dificultad
   - Grupo máximo
   - ⭐ Si es destacada

3. **Qué Incluye:**
   - Lista con iconos
   - Cada elemento del array `includes`

4. **Itinerario Detallado:**
   - Timeline visual
   - Hora, actividad y descripción de cada parada
   - Iconos por tipo de actividad

5. **Call to Action:**
   - Botón "Reservar Ahora"
   - Abre `TourBookingModal`

### Formularios de Creación/Edición

#### CreateRouteForm (Básico)
**Campos:**
- Nombre *
- Descripción *
- Descripción corta *
- Duración *
- Dificultad * (Select)
- Precio *
- Ubicación *
- Tamaño máximo del grupo *
- URL de imagen
- Destacada (checkbox)

#### CreateRouteFormWithServices (Avanzado)
**Campos adicionales:**
- Selector de servicios incluidos
- Constructor de itinerario dinámico
- Múltiples imágenes para galería
- Integración con servicios existentes

**Validaciones:**
- Todos los campos obligatorios deben estar completos
- Precio debe ser mayor a 0
- Tamaño de grupo debe ser mayor a 0
- Duración debe tener formato válido

### Acciones CRUD

| Rol | Ver | Crear | Editar | Eliminar |
|-----|-----|-------|--------|----------|
| **Admin** | ✅ | ✅ | ✅ | ✅ |
| **Asesor** | ✅ | ❌ | ❌ | ❌ |
| **Guía** | ✅ | ❌ | ❌ | ❌ |
| **Cliente** | ✅ | ❌ | ❌ | ❌ |
| **Público** | ✅ | ❌ | ❌ | ❌ |

---

## 🏡 MÓDULO: GESTIÓN DE FINCAS ALIADAS

### Archivos Involucrados
- `components/FarmsPage.tsx` - Catálogo público
- `components/FarmDetailPage.tsx` - Detalle de finca
- `components/CreateFarmForm.tsx` - Formulario básico
- `components/CreateFarmFormWithServices.tsx` - Formulario avanzado
- `utils/mockData.tsx` - Datos de fincas

### Estructura de Datos: Farm

```typescript
interface Farm {
  id: string;                    // Identificador único
  name: string;                  // Nombre de la finca
  description: string;           // Descripción completa
  shortDescription: string;      // Descripción breve
  location: string;              // Ubicación geográfica
  image: string;                 // URL de imagen principal
  gallery: string[];             // Array de imágenes
  services: string[];            // Servicios ofrecidos
  activities: string[];          // Actividades disponibles
  pricePerNight: number;         // Precio por noche en COP
  maxGuests: number;             // Huéspedes máximos
  amenities: string[];           // Comodidades disponibles
}
```

### Fincas Predefinidas (mockData)

#### 1. **Finca El Paraíso**
- **ID:** `1`
- **Ubicación:** Zona Cafetera
- **Precio/noche:** $150,000 COP
- **Huéspedes máximos:** 8
- **Servicios:**
  - Alojamiento rural
  - Comidas típicas
  - Tour del café
  - Senderismo
- **Actividades:**
  - Recolección de café
  - Observación de aves
  - Caminatas ecológicas
  - Talleres artesanales
- **Comodidades:**
  - WiFi
  - Agua caliente
  - Cocina equipada
  - Zona de fogata
  - Piscina natural

#### 2. **Villa Verde Ecológica**
- **ID:** `2`
- **Ubicación:** Reserva Natural
- **Precio/noche:** $200,000 COP
- **Huéspedes máximos:** 10
- **Servicios:**
  - Alojamiento eco-friendly
  - Alimentación orgánica
  - Spa natural
  - Yoga y meditación
- **Actividades:**
  - Senderismo guiado
  - Avistamiento de fauna
  - Talleres de conservación
  - Jardinería orgánica
- **Comodidades:**
  - Energía solar
  - Baños ecológicos
  - Huerta orgánica
  - Mirador natural
  - Área de camping

#### 3. **Hacienda Los Arrayanes**
- **ID:** `3`
- **Ubicación:** Valle del Cocora
- **Precio/noche:** $180,000 COP
- **Huéspedes máximos:** 12
- **Servicios:**
  - Hospedaje tradicional
  - Gastronomía local
  - Cabalgatas
  - Tours culturales
- **Actividades:**
  - Recorridos a caballo
  - Visita a palmas de cera
  - Pesca deportiva
  - Fogatas nocturnas
- **Comodidades:**
  - Establo de caballos
  - Salón de juegos
  - BBQ área
  - Río privado
  - Parqueadero

### Funcionalidades - FarmsPage

#### Visualización
- ✅ Grid responsivo de cards de fincas
- ✅ Imagen destacada por finca
- ✅ Información: nombre, ubicación, precio/noche, huéspedes
- ✅ Lista de servicios principales
- ✅ Badge de capacidad

#### Filtros Implementados
1. **Por ubicación:**
   - Todas
   - Zona Cafetera
   - Reserva Natural
   - Valle del Cocora
   - Otras ubicaciones

2. **Por rango de precio/noche:**
   - Slider de 0 a 300,000 COP
   - Actualización en tiempo real

3. **Por capacidad:**
   - Slider de 1 a 20 huéspedes

4. **Por búsqueda:**
   - Campo de texto
   - Busca en: nombre, descripción, ubicación, servicios

#### Ordenamiento
- ✅ Por precio (menor a mayor / mayor a menor)
- ✅ Por nombre (A-Z / Z-A)
- ✅ Por capacidad (menor a mayor / mayor a menor)

### Funcionalidades - FarmDetailPage

#### Secciones
1. **Header:**
   - Galería de imágenes (con navegación)
   - Nombre de la finca
   - Ubicación con mapa (placeholder)
   - Precio por noche destacado

2. **Descripción:**
   - Texto completo
   - Características principales

3. **Servicios Incluidos:**
   - Grid de iconos con nombres
   - Categorización visual

4. **Actividades Disponibles:**
   - Lista con descripciones
   - Iconos representativos

5. **Comodidades:**
   - Lista detallada
   - Badges por categoría

6. **Información Práctica:**
   - Capacidad máxima
   - Check-in / Check-out
   - Políticas de cancelación

7. **Call to Action:**
   - Botón "Reservar Finca"
   - Selector de fechas
   - Cálculo de precio total

### Formularios de Creación/Edición

#### CreateFarmForm (Básico)
**Campos:**
- Nombre *
- Descripción *
- Descripción corta *
- Ubicación *
- Precio por noche *
- Huéspedes máximos *
- URL de imagen
- Servicios (múltiple selección)
- Actividades (múltiple selección)
- Comodidades (múltiple selección)

#### CreateFarmFormWithServices (Avanzado)
**Campos adicionales:**
- Integración con sistema de servicios
- Calendario de disponibilidad
- Múltiples imágenes para galería
- Tarifas especiales por temporada
- Requisitos de depósito

**Validaciones:**
- Nombre único
- Precio mayor a 0
- Capacidad mayor a 0
- Al menos 3 comodidades
- Al menos 2 actividades
- Ubicación válida

### Acciones CRUD

| Rol | Ver | Crear | Editar | Eliminar |
|-----|-----|-------|--------|----------|
| **Admin** | ✅ | ✅ | ✅ | ✅ |
| **Asesor** | ✅ | ❌ | ❌ | ❌ |
| **Guía** | ✅ | ❌ | ❌ | ❌ |
| **Cliente** | ✅ | ❌ | ❌ | ❌ |
| **Público** | ✅ | ❌ | ❌ | ❌ |

---

## 📦 MÓDULO: GESTIÓN DE PAQUETES TURÍSTICOS

### Archivos Involucrados
- `components/PackagesPage.tsx` - Catálogo público
- `components/PackageDetailPage.tsx` - Detalle de paquete
- `utils/mockData.tsx` - Datos de paquetes

### Estructura de Datos: TourPackage

```typescript
interface TourPackage {
  id: string;                    // Identificador único
  name: string;                  // Nombre del paquete
  description: string;           // Descripción completa
  shortDescription: string;      // Descripción breve
  duration: string;              // Duración (ej: "3 días / 2 noches")
  price: number;                 // Precio en COP
  image: string;                 // URL de imagen principal
  includes: string[];            // Qué incluye el paquete
  routes: string[];              // IDs de rutas incluidas
  farms: string[];               // IDs de fincas incluidas
  featured: boolean;             // Si es destacado
}
```

### Paquetes Predefinidos (mockData)

#### 1. **Aventura Completa Andina**
- **ID:** `1`
- **Duración:** 3 días / 2 noches
- **Precio:** $450,000 COP por persona
- **Estado:** ⭐ Destacado
- **Rutas incluidas:** Sendero del Cóndor, Valle de los Frailejones
- **Finca incluida:** Finca El Paraíso
- **Incluye:**
  - 2 noches en Finca El Paraíso
  - 2 rutas guiadas completas
  - Todas las comidas
  - Transporte ida y vuelta
  - Guías especializados
  - Equipo completo
  - Seguro de viaje

#### 2. **Escapada de Naturaleza**
- **ID:** `2`
- **Duración:** 2 días / 1 noche
- **Precio:** $280,000 COP por persona
- **Ruta incluida:** Valle de los Frailejones
- **Finca incluida:** Villa Verde Ecológica
- **Incluye:**
  - 1 noche en Villa Verde
  - 1 ruta ecológica guiada
  - Desayuno y cena orgánica
  - Transporte desde la ciudad
  - Taller de conservación
  - Yoga matutino

#### 3. **Expedición Extrema**
- **ID:** `3`
- **Duración:** 5 días / 4 noches
- **Precio:** $850,000 COP por persona
- **Estado:** ⭐ Destacado
- **Rutas incluidas:** Cascadas Escondidas, Valle de los Frailejones
- **Finca incluida:** Villa Verde Ecológica
- **Incluye:**
  - 3 noches en Villa Verde + 1 noche camping
  - 3 rutas de aventura extrema
  - Todas las comidas orgánicas
  - Guías naturalistas certificados
  - Transporte 4x4
  - Equipo profesional completo
  - Talleres de conservación
  - Seguro premium

### Funcionalidades - PackagesPage

#### Visualización
- ✅ Grid responsivo de cards de paquetes
- ✅ Imagen destacada
- ✅ Información: nombre, duración, precio
- ✅ Lista resumen de lo incluido (primeros 3 items)
- ✅ Badge "Destacado" para featured
- ✅ Indicador de rutas y fincas incluidas

#### Filtros Implementados
1. **Por duración:**
   - Todos
   - 1-2 días
   - 3-4 días
   - 5+ días

2. **Por rango de precio:**
   - Slider de 0 a 1,000,000 COP
   - Actualización en tiempo real

3. **Por búsqueda:**
   - Campo de texto
   - Busca en: nombre, descripción, incluidos

4. **Destacados:**
   - Checkbox para filtrar solo destacados

#### Ordenamiento
- ✅ Por precio (menor a mayor / mayor a menor)
- ✅ Por duración (menor a mayor / mayor a menor)
- ✅ Por popularidad (destacados primero)

### Funcionalidades - PackageDetailPage

#### Secciones
1. **Header:**
   - Imagen principal grande
   - Nombre del paquete
   - Duración destacada
   - Precio destacado
   - Badge "Destacado" si aplica

2. **Descripción Completa:**
   - Texto detallado del paquete
   - Highlights principales

3. **Qué Incluye:**
   - Lista completa con iconos
   - Categorización por tipo:
     - Alojamiento
     - Alimentación
     - Transporte
     - Actividades
     - Seguros
     - Extras

4. **Rutas Incluidas:**
   - Cards de cada ruta con mini-preview
   - Nombre, duración, dificultad
   - Botón "Ver detalle de ruta"

5. **Fincas Incluidas:**
   - Cards de cada finca con mini-preview
   - Nombre, ubicación, capacidad
   - Botón "Ver detalle de finca"

6. **Itinerario Día a Día:**
   - Timeline de actividades por día
   - Descripción de qué se hace cada día
   - Horarios aproximados

7. **Condiciones:**
   - Requisitos mínimos
   - Qué llevar
   - Políticas de cancelación
   - Forma de pago

8. **Call to Action:**
   - Botón "Reservar Paquete"
   - Selector de fecha de inicio
   - Número de personas
   - Cálculo de precio total

### Lógica de Construcción de Paquetes

Los paquetes combinan:
- 1 o más **Rutas** existentes
- 1 o más **Fincas** existentes
- Servicios adicionales agregados

**Ventajas:**
- ✅ Precio más económico que comprar todo separado
- ✅ Todo coordinado y organizado
- ✅ Garantía de disponibilidad
- ✅ Experiencia completa curada

### Acciones CRUD

| Rol | Ver | Crear | Editar | Eliminar |
|-----|-----|-------|--------|----------|
| **Admin** | ✅ | ✅ | ✅ | ✅ |
| **Asesor** | ✅ | ✅ | ✅ | ❌ |
| **Guía** | ✅ | ❌ | ❌ | ❌ |
| **Cliente** | ✅ | ❌ | ❌ | ❌ |
| **Público** | ✅ | ❌ | ❌ | ❌ |

---

## 📝 MÓDULO: PROCESO DE RESERVA

### Archivos Involucrados
- `components/TourBookingModal.tsx` - Modal de reserva
- `components/CreateBookingForm.tsx` - Formulario de creación
- `hooks/useBookings.tsx` - Hook de gestión de reservas
- `utils/adminMockData.tsx` - Datos de reservas

### Estructura de Datos: Booking

```typescript
interface Booking {
  id: string;                    // ID único
  cliente_id: string;            // ID del cliente
  cliente_nombre: string;        // Nombre del cliente
  cliente_email: string;         // Email del cliente
  asesor_id: string;             // ID del asesor asignado
  asesor_nombre: string;         // Nombre del asesor
  guia_id?: string;              // ID del guía asignado
  guia_nombre?: string;          // Nombre del guía
  tipo: 'ruta' | 'finca' | 'paquete';  // Tipo de reserva
  servicio_id: string;           // ID del servicio reservado
  servicio_nombre: string;       // Nombre del servicio
  fecha_reserva: string;         // Fecha de la reserva (YYYY-MM-DD)
  fecha_tour: string;            // Fecha del tour (YYYY-MM-DD)
  numero_participantes: number;  // Número de personas
  monto_total: number;           // Precio total en COP
  monto_pagado: number;          // Cantidad pagada
  monto_pendiente: number;       // Saldo pendiente
  estado: 'Pendiente' | 'Confirmada' | 'En Proceso' | 'Completada' | 'Cancelada';
  estado_pago: 'Pendiente' | 'Pagado Parcial' | 'Pagado Total';
  metodo_pago: string;           // Método de pago usado
  notas?: string;                // Notas adicionales
  createdAt: string;             // Timestamp de creación
}
```

### Flujo Completo de Reserva

#### **Paso 1: Selección de Servicio**
**Ubicación:** RoutesPage, FarmsPage, PackagesPage, RouteDetailPage, etc.

**Acción:** Usuario hace clic en "Reservar" / "Reservar Ahora"

**Resultado:** Se abre `TourBookingModal`

#### **Paso 2: Formulario de Reserva**
**Componente:** `TourBookingModal`

**Campos - Información del Cliente:**
- Nombre completo *
- Email *
- Teléfono *
- Documento de identidad *

**Campos - Detalles de la Reserva:**
- Fecha del tour * (Date Picker)
  - Validación: fecha futura
  - Validación: disponibilidad
- Número de participantes * (Number Input)
  - Mínimo: 1
  - Máximo: según capacidad del servicio
- Notas/Comentarios especiales (Textarea opcional)

**Campos - Información de Pago:**
- Método de pago * (Select)
  - Efectivo
  - Transferencia bancaria
  - Tarjeta de crédito
  - Tarjeta de débito
  - PSE
- ¿Pago completo o abono? (Radio)
  - Pago completo
  - Abono (mínimo 30%)
- Monto a pagar * (Number Input)
  - Si es abono: mínimo 30% del total
  - Si es completo: 100% del total

**Validaciones:**
- Todos los campos obligatorios completos
- Email con formato válido
- Teléfono con formato válido
- Fecha válida y disponible
- Número de participantes dentro del rango
- Monto de pago correcto según tipo elegido

#### **Paso 3: Cálculo Automático**
**Lógica:**
```javascript
precio_base = servicio.price
numero_personas = form.numero_participantes
monto_total = precio_base * numero_personas
monto_pagado = form.monto_a_pagar
monto_pendiente = monto_total - monto_pagado

estado_pago = 
  monto_pagado === 0 ? 'Pendiente' :
  monto_pagado < monto_total ? 'Pagado Parcial' :
  'Pagado Total'
```

**Visualización en Modal:**
- 💰 Precio por persona: $XXX
- 👥 Número de personas: N
- 📊 Total: $XXX
- ✅ Pagado: $XXX
- ⏳ Pendiente: $XXX

#### **Paso 4: Confirmación**
**Acción:** Usuario hace clic en "Confirmar Reserva"

**Proceso:**
1. Validar todos los campos
2. Crear objeto de reserva
3. Asignar asesor automáticamente (round-robin o por carga)
4. Guardar en sistema (mock: array en memoria/localStorage)
5. Generar ID único
6. Establecer estado inicial: "Pendiente"
7. Enviar notificación al cliente (simulada)
8. Enviar notificación al asesor asignado
9. Mostrar toast de éxito
10. Cerrar modal
11. Redirigir a vista de confirmación (opcional)

#### **Paso 5: Confirmación Visual**
**Componente:** Toast / Alert / Página de confirmación

**Información mostrada:**
- ✅ Reserva creada exitosamente
- 📧 Email de confirmación enviado
- 🎫 Número de reserva: #XXXXX
- 📅 Fecha del tour
- 👤 Asesor asignado
- 💰 Información de pago

### Estados de Reserva

| Estado | Color | Descripción | Acciones Disponibles |
|--------|-------|-------------|----------------------|
| **Pendiente** | 🟡 Amarillo | Reserva creada, esperando confirmación | Confirmar, Cancelar, Editar |
| **Confirmada** | 🟢 Verde | Reserva confirmada, todo listo | Ver, Asignar guía, Cancelar |
| **En Proceso** | 🔵 Azul | Tour en ejecución | Ver, Completar |
| **Completada** | ✅ Verde Oscuro | Tour finalizado exitosamente | Ver, Encuesta |
| **Cancelada** | 🔴 Rojo | Reserva cancelada | Ver, Archivar |

### Estados de Pago

| Estado | Color | Condición | Acción Requerida |
|--------|-------|-----------|------------------|
| **Pendiente** | 🔴 Rojo | monto_pagado = 0 | Realizar pago |
| **Pagado Parcial** | 🟡 Amarillo | 0 < monto_pagado < monto_total | Completar pago |
| **Pagado Total** | 🟢 Verde | monto_pagado = monto_total | Ninguna |

### Gestión de Reservas por Rol

#### **Admin**
**Panel:** AdminDashboard → Tab "Reservas"

**Funcionalidades:**
- ✅ Ver todas las reservas del sistema
- ✅ Filtrar por estado, fecha, cliente, asesor, guía
- ✅ Buscar reservas
- ✅ Ver detalles completos
- ✅ Editar reservas
- ✅ Cambiar estado
- ✅ Asignar/reasignar guía
- ✅ Asignar/reasignar asesor
- ✅ Cancelar reservas
- ✅ Procesar reembolsos
- ✅ Ver historial de cambios
- ✅ Exportar reportes

**Vista:** Tabla completa con todas las columnas

#### **Asesor**
**Panel:** AdvisorDashboard → Tab "Reservas"

**Funcionalidades:**
- ✅ Ver reservas asignadas a él
- ✅ Crear nuevas reservas (para sus clientes)
- ✅ Ver detalles de sus reservas
- ✅ Editar reservas asignadas
- ✅ Cambiar estado (limitado)
- ✅ Solicitar asignación de guía
- ✅ Procesar pagos y abonos
- ✅ Comunicarse con clientes
- ✅ Ver comisiones generadas
- ❌ No puede ver reservas de otros asesores
- ❌ No puede cancelar sin aprobación
- ❌ No puede modificar precios

**Vista:** Tabla con sus reservas únicamente

#### **Guía**
**Panel:** GuideDashboard → Tab "Mis Tours"

**Funcionalidades:**
- ✅ Ver tours asignados a él
- ✅ Ver calendario de tours
- ✅ Ver información de clientes del tour
- ✅ Actualizar estado del tour
- ✅ Marcar como completado
- ✅ Agregar notas post-tour
- ✅ Reportar incidencias
- ✅ Chat con asesor
- ❌ No puede crear reservas
- ❌ No puede ver información de pagos
- ❌ No puede cancelar tours

**Vista:** Cards por tour con info esencial

#### **Cliente**
**Panel:** ClientDashboard → Tab "Mis Reservas"

**Funcionalidades:**
- ✅ Ver sus propias reservas
- ✅ Crear nuevas reservas
- ✅ Ver detalles de sus tours
- ✅ Ver estado de pago
- ✅ Realizar abonos adicionales
- ✅ Solicitar cancelación
- ✅ Contactar asesor
- ✅ Ver guía asignado
- ✅ Descargar comprobantes
- ✅ Completar encuestas post-tour
- ❌ No puede editar reservas confirmadas
- ❌ No puede ver reservas de otros

**Vista:** Cards visuales de sus tours

### Reservas Predefinidas (Mock Data)

El sistema incluye 15 reservas de ejemplo en `utils/adminMockData.tsx` con diferentes:
- Estados (Pendiente, Confirmada, En Proceso, Completada, Cancelada)
- Tipos (rutas, fincas, paquetes)
- Clientes diversos
- Asesores asignados
- Guías asignados
- Montos de pago variados

---

## 👥 MÓDULO: GESTIÓN DE EMPLEADOS

### 📄 Archivos Involucrados
- `components/EmployeeManagement.tsx` - Componente principal
- `EMPLOYEE_MANAGEMENT_README.md` - Documentación completa
- `ACCIONES_EMPLEADOS.md` - Matriz de acciones

### Estructura de Datos: Employee

```typescript
interface Employee {
  id: string;                    // ID único
  nombre: string;                // Nombre completo
  documento: string;             // Documento de identidad
  email: string;                 // Email
  telefono: string;              // Teléfono
  rol: 'advisor' | 'guide';      // Rol del empleado
  estado: 'Activo' | 'Inactivo' | 'Suspendido';
  disponibilidad: string;        // Disponibilidad general
  direccion?: string;            // Dirección
  especialidad?: string;         // Especialidad (solo guías)
  experiencia?: string;          // Años de experiencia (solo guías)
  asignaciones_activas?: number; // Número de asignaciones
  ultima_asignacion?: string;    // Fecha última asignación
  fecha_registro: string;        // Fecha de registro
}
```

### Empleados Predefinidos (Mock Data)

1. **Ana García** - Asesor
   - Estado: Activo
   - Asignaciones: 8
   - Disponibilidad: Lunes a Viernes

2. **Carlos Ruiz** - Guía Turístico
   - Estado: Activo
   - Especialidad: Senderismo de montaña
   - Experiencia: 8 años
   - Asignaciones: 12

3. **Sofia Herrera** - Asesor
   - Estado: Activo
   - Asignaciones: 5

4. **Pedro Martínez** - Guía Turístico
   - Estado: Inactivo
   - Especialidad: Observación de aves
   - Experiencia: 5 años

5. **Laura Gómez** - Guía Turístico
   - Estado: Activo
   - Especialidad: Ecoturismo
   - Experiencia: 10 años
   - Asignaciones: 15

6. **Miguel Torres** - Asesor
   - Estado: Suspendido

### Funcionalidades Principales

#### 1. **Vista Principal**
**Componente:** `EmployeeManagement`

**Estadísticas en Tiempo Real (6 Cards):**
- 📊 Total de empleados
- 💼 Total de asesores
- 👤 Total de guías
- ✅ Empleados activos
- ❌ Empleados inactivos
- ⚠️ Empleados suspendidos

**Diseño:**
- Grid responsivo (1-2-6 columnas según pantalla)
- Animaciones con Motion/React
- Iconos de Lucide-react
- Colores según branding Occitours

#### 2. **Búsqueda y Filtros**

**Búsqueda:**
- 🔍 Campo de texto en tiempo real
- Busca en: nombre, email, documento
- Case-insensitive
- Actualización instantánea

**Filtro por Rol:**
- Todos
- Asesores
- Guías Turísticos

**Filtro por Estado:**
- Todos
- Activo (verde)
- Inactivo (gris)
- Suspendido (rojo)

**Combinación:**
- Los filtros se pueden combinar
- Búsqueda + Filtro de rol + Filtro de estado

#### 3. **Tabla de Empleados**

**Columnas:**
| Columna | Contenido | Tipo |
|---------|-----------|------|
| Nombre | Nombre completo + Avatar | Text + Icon |
| Correo | Email con icono | Text + Icon |
| Documento | Número de documento | Text |
| Rol | Badge con color | Badge |
| Estado | Badge con color | Badge |
| Disponibilidad | Texto de disponibilidad | Text |
| Acciones | 4 botones | Buttons |

**Acciones por Fila:**
- 👁️ **Ver detalle** (azul hover)
- ✏️ **Editar** (verde hover)
- 🔄 **Cambiar estado** (amarillo hover)
- 🗑️ **Eliminar** (rojo hover)

**Estados Vacíos:**
- Mensaje cuando no hay empleados
- Mensaje cuando búsqueda no tiene resultados
- Botón para limpiar filtros

#### 4. **CRUD Completo**

##### ✅ **Crear Empleado**
**Modal:** Dialog de creación

**Campos Obligatorios (*):**
- Nombre completo
- Documento de identidad
- Correo electrónico
- Teléfono
- Rol (Asesor / Guía)
- Estado inicial (Activo / Inactivo)

**Campos Opcionales:**
- Disponibilidad
- Dirección
- Especialidad (solo para guías)
- Experiencia en años (solo para guías)

**Validaciones:**
- Campos obligatorios no vacíos
- Email con formato válido
- Teléfono con formato válido
- Documento único (no duplicado)

**Flujo:**
1. Usuario hace clic en "Registrar empleado"
2. Se abre modal
3. Usuario completa formulario
4. Validación en tiempo real
5. Click en "Registrar empleado"
6. Empleado se agrega al array
7. Toast de éxito
8. Modal se cierra
9. Tabla se actualiza

##### 👁️ **Ver Detalle**
**Modal:** Dialog de visualización

**Secciones:**

1. **Header:**
   - Avatar con iniciales
   - Nombre completo
   - Badge de rol (azul/morado)
   - Badge de estado (verde/gris/rojo)

2. **Información de Contacto:**
   - 📧 Correo electrónico
   - 📱 Teléfono
   - 👤 Documento
   - 📍 Dirección

3. **Información Laboral:**
   - 🕐 Disponibilidad
   - 📅 Fecha de registro
   - 💼 Especialidad (si es guía)
   - ⏱️ Experiencia (si es guía)

4. **Estadísticas:**
   - 📊 Asignaciones activas
   - 📅 Última asignación

**Botones:**
- ✏️ Editar (abre modal de edición directamente)
- ✖️ Cerrar

##### ✏️ **Editar Empleado**
**Modal:** Dialog de edición

**Campos Editables:**
- ✅ Nombre completo
- ✅ Correo electrónico
- ✅ Teléfono
- ✅ Rol
- ✅ Estado
- ✅ Disponibilidad
- ✅ Dirección
- ✅ Especialidad
- ✅ Experiencia

**Campos Bloqueados:**
- 🔒 Documento (solo lectura)

**Precarga:**
- Todos los campos vienen pre-llenados con datos actuales

**Validaciones:**
- Igual que en crear
- Email único (excepto el actual)

**Flujo:**
1. Usuario hace clic en botón "Editar"
2. Modal se abre con datos pre-cargados
3. Usuario modifica campos
4. Validación en tiempo real
5. Click en "Guardar cambios"
6. Datos se actualizan
7. Toast de éxito
8. Modal se cierra
9. Tabla se actualiza

##### 🔄 **Cambiar Estado Rápido**
**Tipo:** Toggle directo desde tabla

**Funcionamiento:**
- Botón en la columna de acciones
- Toggle entre: Activo ↔ Inactivo
- No abre modal
- Cambio instantáneo
- Toast de confirmación

**Icono:**
- `ToggleRight` cuando está activo
- `ToggleLeft` cuando está inactivo

**Casos de uso:**
- Activar empleado temporalmente inactivo
- Desactivar empleado sin eliminarlo

**Nota:** No incluye estado "Suspendido" (ese se cambia desde edición)

##### 🗑️ **Eliminar Empleado**
**Tipo:** AlertDialog de confirmación

**Mensaje:**
```
¿Deseas eliminar esta cuenta?

Esta acción desactivará el acceso del empleado [Nombre] al sistema.
Los registros históricos se mantendrán pero el empleado no podrá iniciar sesión.
```

**Botones:**
- ❌ Cancelar (gris, cierra dialog)
- ✅ Confirmar eliminación (rojo destructivo)

**Flujo:**
1. Usuario hace clic en botón eliminar
2. AlertDialog aparece
3. Usuario lee advertencia
4. Si cancela: nada pasa, dialog se cierra
5. Si confirma:
   - Empleado se elimina del array
   - Toast de confirmación
   - Dialog se cierra
   - Tabla se actualiza

**Consideración:**
- En producción: eliminar lógicamente (cambiar estado)
- En mock: eliminar del array completamente

#### 5. **Diseño y Estilos**

**Paleta de Colores:**

**Estados:**
- 🟢 Activo: `bg-green-100 text-green-700`
- ⚪ Inactivo: `bg-gray-100 text-gray-700`
- 🔴 Suspendido: `bg-red-100 text-red-700`

**Roles:**
- 🔵 Asesor: `bg-blue-100 text-blue-700`
- 🟣 Guía: `bg-purple-100 text-purple-700`

**Acciones Hover:**
- 👁️ Ver: `hover:bg-blue-50 hover:text-blue-600`
- ✏️ Editar: `hover:bg-green-50 hover:text-green-600`
- 🔄 Toggle: `hover:bg-yellow-50 hover:text-yellow-600`
- 🗑️ Eliminar: `hover:bg-red-50 hover:text-red-600`

**Animaciones (Motion/React):**
- Fade in del header (0.2s)
- Staggered cards de estadísticas (0.1s delay)
- Slide in de filtros (0.3s)
- Staggered table rows (0.05s delay)
- Smooth modal open/close (0.2s)

#### 6. **Responsive Design**

**Mobile (< 640px):**
- Cards de estadísticas: 1 columna
- Filtros: stacked verticalmente
- Tabla: scroll horizontal
- Botones: iconos únicamente

**Tablet (640px - 1024px):**
- Cards de estadísticas: 2-3 columnas
- Filtros: 2 filas
- Tabla: scroll horizontal con columnas principales

**Desktop (> 1024px):**
- Cards de estadísticas: 6 columnas
- Filtros: 1 fila horizontal
- Tabla: todas las columnas visibles
- Sin scroll horizontal

#### 7. **Notificaciones (Toast)**

Todas las acciones muestran toasts con Sonner:

| Acción | Tipo | Mensaje |
|--------|------|---------|
| Crear | Success | "Empleado registrado exitosamente" |
| Editar | Success | "Empleado actualizado exitosamente" |
| Cambiar estado | Success | "Estado actualizado a [Activo/Inactivo]" |
| Eliminar | Success | "Empleado eliminado del sistema" |
| Validación | Error | "Por favor completa todos los campos obligatorios" |
| Email duplicado | Error | "Ya existe un empleado con este correo" |

#### 8. **Integración en Dashboard Admin**

**Ubicación:** `AdminDashboardWithDropdown` → Tab "Gestión de empleados"

**Menú Lateral:**
```
1. Resumen
2. Usuarios
3. ✨ Gestión de empleados  ← ESTE MÓDULO
4. Paquetes
5. Reservas
6. Fincas
7. Rutas
8. Servicios
9. Transporte
10. Ventas
11. Pagos
12. Personal Médico
13. Roles
```

**Activación:**
```typescript
activeTab === 'employees' ? <EmployeeManagement /> : null
```

### Permisos por Rol

| Rol | Ver | Buscar | Filtrar | Crear | Editar | Cambiar Estado | Eliminar |
|-----|-----|--------|---------|-------|--------|----------------|----------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Asesor** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Guía** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Cliente** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 💰 MÓDULO: GESTIÓN DE PAGOS A PROVEEDORES

### 📄 Archivo Principal
- `components/ProviderPaymentManagement.tsx`

### Descripción General
Módulo completo para gestionar pagos a proveedores externos (restaurantes, transporte, fincas, servicios). Permite crear, visualizar, editar y eliminar registros de pagos con seguimiento de estados.

### Estructura de Datos: ProviderPayment

```typescript
interface ProviderPayment {
  id: string;                    // ID único
  proveedor_nombre: string;      // Nombre del proveedor
  proveedor_tipo: string;        // Tipo: Restaurante, Transporte, Finca, Servicio
  concepto: string;              // Concepto del pago
  fecha_servicio: string;        // Fecha del servicio (YYYY-MM-DD)
  fecha_pago: string;            // Fecha del pago (YYYY-MM-DD)
  monto_total: number;           // Monto total en COP
  monto_pagado: number;          // Monto ya pagado
  monto_pendiente: number;       // Saldo pendiente
  estado: 'Pendiente' | 'Pagado Parcial' | 'Pagado' | 'Vencido';
  metodo_pago: string;           // Método: Transferencia, Efectivo, Cheque
  referencia?: string;           // Número de referencia/factura
  observaciones?: string;        // Notas adicionales
  fecha_vencimiento?: string;    // Fecha límite de pago
}
```

### Funcionalidades Principales

#### 1. **Vista Principal**

**Estadísticas (4 Cards):**
- 💰 Total de pagos (suma de todos)
- ✅ Pagos completados (estado "Pagado")
- ⏳ Pagos pendientes (total - pagados)
- ⚠️ Pagos vencidos (fecha_vencimiento pasada)

**Diseño:**
- Grid de 4 columnas (responsive)
- Colores: verde, azul, amarillo, rojo
- Animaciones con Motion/React

#### 2. **Búsqueda y Filtros**

**Búsqueda:**
- Campo de texto
- Busca en: proveedor, concepto, referencia
- Tiempo real

**Filtros:**
1. **Por tipo de proveedor:**
   - Todos
   - Restaurante
   - Transporte
   - Finca
   - Servicio

2. **Por estado:**
   - Todos
   - Pendiente
   - Pagado Parcial
   - Pagado
   - Vencido

3. **Por método de pago:**
   - Todos
   - Transferencia Bancaria
   - Efectivo
   - Cheque

#### 3. **Tabla de Pagos**

**Columnas:**
| Columna | Contenido | Visual |
|---------|-----------|--------|
| Proveedor | Nombre + tipo (badge) | Text + Badge |
| Concepto | Descripción breve | Text |
| Fecha Servicio | YYYY-MM-DD | Date |
| Monto Total | $XXX,XXX COP | Currency |
| Monto Pagado | $XXX,XXX COP | Currency |
| Pendiente | $XXX,XXX COP | Currency |
| Estado | Badge con color | Badge |
| Acciones | Ver, Editar, Eliminar | Buttons |

**Badges de Estado:**
- 🔴 Pendiente: `bg-yellow-100 text-yellow-700`
- 🟡 Pagado Parcial: `bg-blue-100 text-blue-700`
- 🟢 Pagado: `bg-green-100 text-green-700`
- ⚠️ Vencido: `bg-red-100 text-red-700`

#### 4. **CRUD de Pagos**

##### ✅ **Registrar Nuevo Pago**
**Modal:** Dialog de creación

**Campos:**
- Nombre del proveedor *
- Tipo de proveedor * (Select)
- Concepto del pago *
- Fecha del servicio *
- Fecha del pago *
- Monto total *
- Monto pagado *
- Método de pago * (Select)
- Referencia/Factura
- Observaciones
- Fecha de vencimiento

**Cálculo automático:**
```javascript
monto_pendiente = monto_total - monto_pagado

estado =
  monto_pagado === 0 ? 'Pendiente' :
  monto_pagado < monto_total ? 'Pagado Parcial' :
  'Pagado'

// Si fecha_vencimiento < hoy && estado !== 'Pagado':
//   estado = 'Vencido'
```

**Validaciones:**
- Monto pagado ≤ monto total
- Fechas válidas
- Campos obligatorios completos

##### 👁️ **Ver Detalle**
**Modal:** Dialog de visualización

**Secciones:**
1. Información del proveedor
2. Detalles del pago
3. Estados y fechas
4. Observaciones

##### ✏️ **Editar Pago**
**Modal:** Dialog de edición

**Permitido editar:**
- Monto pagado (para registrar abonos)
- Fecha de pago
- Método de pago
- Referencia
- Observaciones

**No editable:**
- Proveedor
- Concepto
- Monto total (requiere aprobación admin)

##### 🗑️ **Eliminar Pago**
**AlertDialog de confirmación**

Mensaje de advertencia + confirmación

#### 5. **Funcionalidades Especiales**

**Registro de Abonos:**
- Editar pago existente
- Actualizar monto_pagado
- Sistema recalcula monto_pendiente
- Actualiza estado automáticamente

**Alertas de Vencimiento:**
- Badge rojo para pagos vencidos
- Filtro rápido para ver solo vencidos
- Notificación en estadísticas

**Historial:**
- Cada pago guarda fecha de creación
- Puede agregarse log de modificaciones

### Pagos Predefinidos (Mock Data)

El sistema incluye 8 pagos de ejemplo con:
- Diferentes proveedores (restaurantes, transporte, fincas)
- Estados variados (pendiente, pagado, parcial, vencido)
- Métodos de pago diversos
- Fechas distribuidas

### Integración en Dashboard Admin

**Ubicación:** `AdminDashboardWithDropdown` → Tab "Pagos"

**Subtabs:**
- "Pagos de Clientes" → `PaymentManagement`
- "Pagos a Proveedores" → `ProviderPaymentManagement` ⭐

---

## 📊 MÓDULO: DASHBOARD DE ADMINISTRADOR

### 📄 Archivo Principal
- `components/AdminDashboardWithDropdown.tsx` ⭐ (VERSIÓN ACTIVA)

### Vista General

#### Navegación Lateral (Sidebar)

**Estructura de Menú:**

1. **🏠 Resumen** → Vista principal con métricas
2. **👥 Usuarios** → Gestión de todos los usuarios del sistema
3. **👔 Gestión de empleados** → Asesores y guías
4. **📦 Paquetes** → Paquetes turísticos
5. **📅 Reservas** → Todas las reservas del sistema
6. **🏡 Fincas** → Fincas aliadas
7. **🗺️ Rutas** → Rutas turísticas
8. **🔧 Servicios** → Servicios adicionales
9. **🚗 Transporte** → Gestión de vehículos
10. **💰 Ventas** → Dashboard de ventas
11. **💳 Pagos** → Gestión de pagos (clientes y proveedores)
12. **🏥 Personal Médico** → Personal médico de emergencia
13. **🔐 Roles** → Gestión de roles y permisos
14. **📆 Agendar** → Calendario y agendamiento

#### Tab: Resumen (Overview)

**Métricas Principales (4 Cards Grandes):**

1. **💰 Ingresos Totales**
   - Monto: $45,850,000 COP
   - Cambio: +12.5% vs mes anterior
   - Color: Verde
   - Icono: DollarSign

2. **📅 Reservas Activas**
   - Cantidad: 28
   - Cambio: +8 nuevas esta semana
   - Color: Azul
   - Icono: Calendar

3. **👥 Usuarios Registrados**
   - Cantidad: 156
   - Cambio: +24 este mes
   - Color: Púrpura
   - Icono: Users

4. **⭐ Satisfacción**
   - Promedio: 4.8/5.0
   - Cambio: +0.3 vs mes anterior
   - Color: Amarillo
   - Icono: Star

**Gráficos:**

1. **📊 Gráfico de Ventas Mensuales**
   - Tipo: LineChart (Recharts)
   - Datos: últimos 6 meses
   - Ejes: Mes vs Ingresos (COP)
   - Colores: Verde primario
   - Tooltip: hover con detalles

2. **📊 Distribución de Reservas por Tipo**
   - Tipo: BarChart (Recharts)
   - Categorías: Rutas, Fincas, Paquetes
   - Colores: Verde, Azul, Púrpura
   - Horizontal bars

3. **📊 Estado de Reservas**
   - Tipo: PieChart (Recharts)
   - Segmentos:
     - Pendiente (amarillo)
     - Confirmada (verde)
     - En Proceso (azul)
     - Completada (verde oscuro)
     - Cancelada (rojo)
   - Porcentajes visibles

**Tablas Resumen:**

1. **Últimas Reservas**
   - 5 reservas más recientes
   - Columnas: Cliente, Servicio, Fecha, Estado, Monto
   - Link a vista completa

2. **Top Servicios**
   - 5 servicios más vendidos
   - Columnas: Nombre, Tipo, Reservas, Ingresos
   - Ordenado por ingresos

#### Tab: Usuarios

**Funcionalidades:**
- ✅ Ver todos los usuarios (tabla completa)
- ✅ Filtrar por rol (Admin, Asesor, Guía, Cliente)
- ✅ Buscar por nombre/email
- ✅ Ver detalles de cada usuario
- ✅ Editar información de usuario
- ✅ Cambiar rol de usuario
- ✅ Cambiar estado (Activo/Inactivo/Suspendido)
- ✅ Eliminar usuario
- ✅ Crear nuevo usuario

**Columnas de Tabla:**
- Nombre
- Email
- Rol (badge)
- Estado (badge)
- Fecha de registro
- Acciones

**Modal de Edición:**
- Formulario con todos los campos
- Dropdown para cambiar rol
- Toggle para cambiar estado

#### Tab: Gestión de empleados

**Componente:** `<EmployeeManagement />`

*Ver sección completa de Módulo: Gestión de Empleados arriba*

#### Tab: Paquetes

**Funcionalidades:**
- ✅ Ver todos los paquetes turísticos
- ✅ Crear nuevo paquete
- ✅ Editar paquete existente
- ✅ Eliminar paquete
- ✅ Cambiar estado destacado
- ✅ Ver estadísticas de ventas por paquete

**Vista:**
- Grid de cards con imagen
- Información: nombre, duración, precio, rutas incluidas
- Botones de acción

**Formulario:**
- Nombre, descripción, duración
- Precio
- Selector de rutas (múltiple)
- Selector de fincas (múltiple)
- Lista de incluidos
- Checkbox destacado

#### Tab: Reservas

**Componente:** Vista completa de todas las reservas

**Funcionalidades:**
- ✅ Ver todas las reservas del sistema
- ✅ Filtrar por:
  - Estado (Pendiente, Confirmada, En Proceso, Completada, Cancelada)
  - Fecha (rango)
  - Cliente (búsqueda)
  - Asesor asignado
  - Guía asignado
  - Tipo (ruta, finca, paquete)
- ✅ Buscar reserva por ID o nombre
- ✅ Ver detalles completos
- ✅ Editar reserva
- ✅ Cambiar estado
- ✅ Asignar/reasignar guía
- ✅ Asignar/reasignar asesor
- ✅ Procesar pagos/abonos
- ✅ Cancelar reserva
- ✅ Ver historial de cambios
- ✅ Exportar a Excel/PDF

**Tabla Completa:**
- ID
- Cliente
- Servicio
- Tipo
- Fecha Tour
- Participantes
- Monto Total
- Pagado
- Pendiente
- Estado Reserva
- Estado Pago
- Asesor
- Guía
- Acciones

**Acciones Rápidas:**
- Confirmar
- Asignar guía
- Ver detalles
- Editar
- Cancelar

#### Tab: Fincas

**Funcionalidades:**
- ✅ Ver todas las fincas aliadas
- ✅ Crear nueva finca
- ✅ Editar finca existente
- ✅ Eliminar finca
- ✅ Ver estadísticas de reservas por finca
- ✅ Gestionar disponibilidad

**Vista:**
- Grid de cards con imagen
- Información: nombre, ubicación, precio/noche, capacidad
- Indicador de disponibilidad

**Formulario:**
- Nombre, descripción
- Ubicación
- Precio por noche
- Capacidad máxima
- Servicios (múltiple selección)
- Actividades (múltiple selección)
- Comodidades (múltiple selección)
- Galería de imágenes

#### Tab: Rutas

**Funcionalidades:**
- ✅ Ver todas las rutas turísticas
- ✅ Crear nueva ruta
- ✅ Editar ruta existente
- ✅ Eliminar ruta
- ✅ Cambiar estado destacado
- ✅ Ver estadísticas de reservas por ruta

**Vista:**
- Grid de cards con imagen
- Información: nombre, duración, dificultad, precio
- Badge de dificultad con color

**Formulario:**
- Nombre, descripción
- Duración, dificultad
- Precio
- Ubicación
- Tamaño máximo de grupo
- Constructor de itinerario
- Lista de incluidos
- Galería de imágenes
- Checkbox destacado

#### Tab: Servicios

**Componente:** `<ServiceManagement />`

**Funcionalidades:**
- ✅ Ver todos los servicios adicionales
- ✅ Categorías: Transporte, Guía, Alimentación, Equipo, Otros
- ✅ Crear nuevo servicio
- ✅ Editar servicio
- ✅ Eliminar servicio
- ✅ Cambiar estado (Activo/Inactivo)

**Estructura de Servicio:**
```typescript
interface Service {
  id: string;
  nombre: string;
  categoria: 'transporte' | 'guia' | 'alimentacion' | 'equipo' | 'otros';
  descripcion: string;
  precio: number;
  duracion: string;
  capacidad: number;
  estado: 'Activo' | 'Inactivo';
  proveedor: string;
  telefono: string;
}
```

#### Tab: Transporte

**Funcionalidades:**
- ✅ Ver todos los vehículos
- ✅ Agregar nuevo vehículo
- ✅ Editar vehículo
- ✅ Eliminar vehículo
- ✅ Ver historial de mantenimiento
- ✅ Programar mantenimiento
- ✅ Gestionar disponibilidad

**Estructura de Transporte:**
```typescript
interface Transport {
  id: string;
  tipo_vehiculo: string;
  placa: string;
  capacidad: number;
  conductor: string;
  telefono_conductor: string;
  estado: 'Disponible' | 'En Servicio' | 'Mantenimiento';
  ultimo_mantenimiento: string;
  proximo_mantenimiento: string;
  kilometraje: number;
}
```

**Vista:**
- Cards con información del vehículo
- Estado con color (verde/azul/rojo)
- Indicador de próximo mantenimiento
- Alertas si está vencido

#### Tab: Ventas

**Componente:** `<SalesDashboard />`

**Métricas:**
- Total de ventas del mes
- Comisiones generadas
- Promedio por venta
- Comparación con mes anterior

**Gráficos:**
- Ventas diarias (últimos 30 días)
- Ventas por asesor
- Ventas por tipo de servicio
- Métodos de pago más usados

**Tabla de Ventas:**
- ID de venta
- Fecha
- Cliente
- Asesor
- Servicio
- Monto total
- Monto pagado
- Pendiente
- Estado
- Método de pago
- Comisión

**Filtros:**
- Por fecha
- Por asesor
- Por estado
- Por método de pago

#### Tab: Pagos

**Subtabs:**
1. **Pagos de Clientes** → `<PaymentManagement />`
2. **Pagos a Proveedores** → `<ProviderPaymentManagement />` ⭐

**Funcionalidades Pagos de Clientes:**
- Ver todos los pagos recibidos
- Registrar nuevo pago
- Registrar abono
- Ver estado de pago por reserva
- Generar recibos
- Ver métodos de pago utilizados

**Funcionalidades Pagos a Proveedores:**
*Ver sección completa arriba*

#### Tab: Personal Médico

**Componente:** Gestión de personal médico

**Funcionalidades:**
- ✅ Ver todo el personal médico
- ✅ Agregar nuevo médico
- ✅ Editar información
- ✅ Ver especialidades
- ✅ Gestionar disponibilidad
- ✅ Ver certificaciones
- ✅ Marcar disponibilidad para emergencias

**Estructura:**
```typescript
interface MedicalStaff {
  id: string;
  nombre: string;
  documento: string;
  especialidad: string;
  licencia: string;
  universidad: string;
  año_graduacion: number;
  experiencia: string;
  telefono: string;
  email: string;
  direccion: string;
  fecha_nacimiento: string;
  tipo_sangre: string;
  estado: 'Activo' | 'Inactivo';
  disponibilidad: string;
  horario_trabajo: string;
  disponible_emergencias: boolean;
  idiomas: string[];
  certificaciones: string[];
  salario: number;
  tipo_contrato: string;
  fecha_inicio: string;
}
```

#### Tab: Roles

**Componente:** `<RoleManagement />`

**Funcionalidades:**
- ✅ Ver matriz de permisos por rol
- ✅ Editar permisos de rol (admin only)
- ✅ Ver usuarios por rol
- ✅ Asignar/cambiar rol de usuario

**Roles del Sistema:**
1. **Administrador**
   - Acceso completo
   - Todos los permisos

2. **Asesor**
   - Crear/editar reservas
   - Ver clientes
   - Procesar pagos
   - Ver comisiones
   - Sin acceso a configuración

3. **Guía**
   - Ver tours asignados
   - Actualizar estado de tours
   - Ver información de clientes del tour
   - Sin acceso a información financiera

4. **Cliente**
   - Ver servicios
   - Crear reservas propias
   - Ver historial
   - Gestionar perfil

**Matriz de Permisos:**
Tabla visual mostrando qué puede hacer cada rol en cada módulo

#### Tab: Agendar

**Componente:** `<SchedulingPage />`

**Vista:** Calendario mensual

**Funcionalidades:**
- ✅ Ver todos los eventos del mes
- ✅ Filtrar por tipo (reserva, mantenimiento, reunión)
- ✅ Crear nuevo evento
- ✅ Editar evento
- ✅ Ver detalles de evento
- ✅ Notificaciones de próximos eventos

**Tipos de Eventos:**
- 📅 Reservas confirmadas
- 🔧 Mantenimiento de vehículos
- 👥 Reuniones de equipo
- 🎓 Capacitaciones
- 🏥 Personal médico asignado

**Vista de Evento:**
- Título
- Fecha y hora
- Tipo
- Participantes
- Ubicación
- Notas
- Estado

### Acceso y Seguridad

**Solo accesible para rol:** `admin`

**Verificación:**
```typescript
if (user?.role !== 'admin') {
  return <div>Acceso denegado</div>;
}
```

**Persistencia:**
- Datos en mock: `utils/adminMockData.tsx`
- En producción: API de Supabase

---

## 🎨 SISTEMA DE DISEÑO Y COMPONENTES UI

### Librería de Componentes: Shadcn/UI

**Ubicación:** `/components/ui/`

**Total de componentes:** 40+

### Componentes Principales Utilizados

#### 1. **Button** (`button.tsx`)
**Variantes:**
- `default` - Fondo verde, texto blanco
- `destructive` - Fondo rojo (para eliminaciones)
- `outline` - Borde verde, fondo transparente
- `secondary` - Gris secundario
- `ghost` - Sin fondo, solo hover
- `link` - Como enlace de texto

**Tamaños:**
- `default` - Tamaño estándar
- `sm` - Pequeño
- `lg` - Grande
- `icon` - Cuadrado para iconos

**Uso:**
```tsx
<Button variant="default" size="lg">
  Reservar Ahora
</Button>
```

#### 2. **Card** (`card.tsx`)
**Componentes:**
- `Card` - Contenedor principal
- `CardHeader` - Encabezado
- `CardTitle` - Título
- `CardDescription` - Descripción
- `CardContent` - Contenido principal
- `CardFooter` - Pie de card

**Uso:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>
    Contenido aquí
  </CardContent>
</Card>
```

#### 3. **Dialog** (`dialog.tsx`)
**Para modales y popups**

**Componentes:**
- `Dialog` - Wrapper principal
- `DialogTrigger` - Botón que abre
- `DialogContent` - Contenido del modal
- `DialogHeader` - Encabezado
- `DialogTitle` - Título
- `DialogDescription` - Descripción
- `DialogFooter` - Pie con botones

**Uso:**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título del Modal</DialogTitle>
    </DialogHeader>
    <div>Contenido</div>
    <DialogFooter>
      <Button>Aceptar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 4. **Table** (`table.tsx`)
**Para tablas de datos**

**Componentes:**
- `Table` - Tabla contenedora
- `TableHeader` - Encabezado
- `TableBody` - Cuerpo
- `TableFooter` - Pie
- `TableRow` - Fila
- `TableHead` - Celda de encabezado
- `TableCell` - Celda normal
- `TableCaption` - Título de tabla

#### 5. **Badge** (`badge.tsx`)
**Para etiquetas de estado**

**Variantes:**
- `default` - Verde
- `secondary` - Gris
- `destructive` - Rojo
- `outline` - Borde sin fondo

**Uso:**
```tsx
<Badge variant="default">Activo</Badge>
<Badge variant="destructive">Cancelado</Badge>
```

#### 6. **Input** (`input.tsx`)
**Campos de texto**

**Tipos soportados:**
- `text`, `email`, `password`, `number`, `date`, `tel`, etc.

**Uso:**
```tsx
<Input
  type="email"
  placeholder="correo@ejemplo.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

#### 7. **Select** (`select.tsx`)
**Dropdowns de selección**

**Componentes:**
- `Select`
- `SelectTrigger`
- `SelectValue`
- `SelectContent`
- `SelectItem`

**Uso:**
```tsx
<Select value={rol} onValueChange={setRol}>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona rol" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="admin">Administrador</SelectItem>
    <SelectItem value="advisor">Asesor</SelectItem>
  </SelectContent>
</Select>
```

#### 8. **Textarea** (`textarea.tsx`)
**Campos de texto multilínea**

#### 9. **Checkbox** (`checkbox.tsx`)
**Casillas de verificación**

#### 10. **Label** (`label.tsx`)
**Etiquetas para formularios**

#### 11. **Alert** & **AlertDialog** 
**Para notificaciones y confirmaciones**

**AlertDialog** para confirmaciones destructivas (eliminar)

**Uso:**
```tsx
<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction>Confirmar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### 12. **Toast** / **Sonner** (`sonner.tsx`)
**Para notificaciones temporales**

**Librería:** `sonner@2.0.3`

**Uso:**
```tsx
import { toast } from 'sonner@2.0.3';

toast.success('Operación exitosa');
toast.error('Ocurrió un error');
toast.info('Información importante');
toast.warning('Advertencia');
```

**Configuración:**
```tsx
<Toaster position="top-right" />
```

#### 13. **Calendar** (`calendar.tsx`)
**Para selección de fechas**

#### 14. **Tabs** (`tabs.tsx`)
**Para navegación por pestañas**

**Componentes:**
- `Tabs`
- `TabsList`
- `TabsTrigger`
- `TabsContent`

**Uso:**
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="overview">Resumen</TabsTrigger>
    <TabsTrigger value="users">Usuarios</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    Contenido de resumen
  </TabsContent>
  <TabsContent value="users">
    Contenido de usuarios
  </TabsContent>
</Tabs>
```

#### 15. **Otros Componentes**
- `Accordion` - Secciones expandibles
- `Avatar` - Imágenes de perfil
- `Breadcrumb` - Navegación de ruta
- `Carousel` - Carrusel de imágenes
- `Collapsible` - Contenido colapsable
- `Command` - Paleta de comandos
- `ContextMenu` - Menú contextual
- `DropdownMenu` - Menú desplegable
- `HoverCard` - Card en hover
- `Pagination` - Paginación
- `Popover` - Popups posicionados
- `Progress` - Barra de progreso
- `RadioGroup` - Botones de radio
- `ScrollArea` - Área con scroll personalizado
- `Separator` - Línea divisoria
- `Sheet` - Panel lateral
- `Skeleton` - Placeholders de carga
- `Slider` - Control deslizante
- `Switch` - Interruptor on/off
- `Toggle` - Botón de alternancia
- `Tooltip` - Tooltips informativos

### Estilos Globales

**Archivo:** `/styles/globals.css`

**Configuración de Tailwind v4:**
- Custom tokens CSS
- Tipografía base por elemento HTML
- Colores del sistema
- Spacing y sizing personalizados
- Animations y transitions

**Importante:**
- ❌ No usar clases de Tailwind para `font-size`, `font-weight`, `line-height`
- ✅ Dejar que los estilos base del globals.css se apliquen
- ✅ Solo sobrescribir si el usuario lo pide específicamente

---

## 🌐 PÁGINAS PÚBLICAS

### HomePage (`/components/HomePage.tsx`)

**Vista:** Página de aterrizaje principal

**Secciones:**

#### 1. **Hero Section**
- Imagen de fondo full-screen
- Overlay oscuro (50%)
- Título principal: "Descubre la Naturaleza Colombiana"
- Subtítulo con descripción
- 2 CTAs:
  - "Explorar Rutas" (verde)
  - "Ver Fincas" (outline blanco)

#### 2. **Featured Route Section**
- Título: "Ruta Destacada"
- Card grande con:
  - Imagen de la ruta featured
  - Información completa
  - Detalles (duración, ubicación, precio, etc.)
  - Botón "Ver Detalles"

#### 3. **Features Section**
- Título: "¿Por qué elegirnos?"
- 3 Cards con iconos:
  - 🛡️ **Seguridad Garantizada**
    - Guías certificados
    - Equipo de primera calidad
  - 👥 **Grupos Pequeños**
    - Experiencias personalizadas
    - Mejor conexión con naturaleza
  - 📍 **Destinos Únicos**
    - Lugares vírgenes
    - Fuera del turismo tradicional

#### 4. **CTA Section**
- Fondo verde
- Título: "¿Listo para tu próxima aventura?"
- Descripción motivacional
- 2 botones:
  - "Explorar Rutas"
  - "Ver Fincas"

**Animaciones:**
- Hero: Fade in
- Featured: Slide from bottom
- Features: Staggered appearance
- CTA: Fade in

**Responsive:**
- Mobile: 1 columna
- Tablet: 2 columnas
- Desktop: 3-4 columnas

### RoutesPage

**Vista:** Catálogo completo de rutas turísticas

*Ver sección de Módulo: Gestión de Rutas arriba*

**Acceso:** Menú público → "Rutas"

### RouteDetailPage

**Vista:** Detalle individual de una ruta

*Ver sección de Módulo: Gestión de Rutas arriba*

**Acceso:** Click en card de ruta

### FarmsPage

**Vista:** Catálogo completo de fincas

*Ver sección de Módulo: Gestión de Fincas arriba*

**Acceso:** Menú público → "Fincas"

### FarmDetailPage

**Vista:** Detalle individual de una finca

*Ver sección de Módulo: Gestión de Fincas arriba*

**Acceso:** Click en card de finca

### PackagesPage

**Vista:** Catálogo completo de paquetes turísticos

*Ver sección de Módulo: Gestión de Paquetes arriba*

**Acceso:** Menú público → "Paquetes"

### PackageDetailPage

**Vista:** Detalle individual de un paquete

*Ver sección de Módulo: Gestión de Paquetes arriba*

**Acceso:** Click en card de paquete

---

## 🎬 ANIMACIONES Y TRANSICIONES

### Librería: Motion/React (Framer Motion)

**Importación:**
```tsx
import { motion } from 'motion/react';
```

**Nota:** Se usa "Motion" no "Framer Motion" (nombre actualizado)

### Patrones de Animación Comunes

#### 1. **Fade In**
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Contenido
</motion.div>
```

#### 2. **Slide In**
```tsx
<motion.div
  initial={{ x: -20, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.4 }}
>
  Contenido
</motion.div>
```

#### 3. **Stagger Children**
```tsx
<motion.div
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
  initial="hidden"
  animate="show"
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

#### 4. **Hover Effect**
```tsx
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Elemento con hover
</motion.div>
```

### Ubicaciones de Animaciones en el Proyecto

**HomePage:**
- Hero section: fade in
- Featured route: slide from bottom
- Feature cards: staggered fade in
- CTA: fade in

**EmployeeManagement:**
- Header: fade in
- Stats cards: staggered (0.1s delay each)
- Filters: slide in
- Table rows: staggered (0.05s delay each)

**Dashboards:**
- Métricas principales: staggered fade in
- Gráficos: fade in con delay
- Tablas: rows con stagger
- Modals: scale + fade

**Cards de Servicios:**
- Grid items: staggered
- Hover: scale 1.05
- Click: scale 0.95

### Configuración de Duración

| Elemento | Duración | Easing |
|----------|----------|--------|
| Fade in/out | 0.2-0.3s | ease-out |
| Slide | 0.3-0.4s | ease-out |
| Scale/Hover | 0.15s | ease-in-out |
| Stagger delay | 0.05-0.1s | ease-out |
| Modal open | 0.2s | ease-out |

---

## 📚 HOOKS PERSONALIZADOS

### 1. **useServices** (`/hooks/useServices.tsx`)

**Propósito:** Context provider para gestión de servicios

**Funcionalidades:**
- Proveer lista de servicios
- CRUD de servicios
- Filtrado y búsqueda
- Estado global compartido

**Uso:**
```tsx
import { useServices } from '../hooks/useServices';

const { services, addService, updateService, deleteService } = useServices();
```

**Métodos:**
- `addService(service)` - Agregar nuevo
- `updateService(id, data)` - Actualizar existente
- `deleteService(id)` - Eliminar
- `getServiceById(id)` - Obtener uno
- `getServicesByCategory(category)` - Filtrar

### 2. **useBookings** (`/hooks/useBookings.tsx`)

**Propósito:** Gestión de reservas

**Funcionalidades:**
- Crear nueva reserva
- Actualizar reserva
- Cancelar reserva
- Obtener reservas por usuario
- Filtrado por estado

**Uso:**
```tsx
import { useBookings } from '../hooks/useBookings';

const { bookings, createBooking, updateBooking } = useBookings();
```

### 3. **useTours** (`/hooks/useTours.tsx`)

**Propósito:** Gestión de tours

**Funcionalidades:**
- CRUD de tours
- Asignación de guías
- Actualización de estado
- Gestión de participantes

---

## 🗄️ BASE DE DATOS

### Schema SQL

**Archivo:** `/database_schema_occitours.sql`

### Tablas Principales

#### 1. **usuarios**
```sql
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'advisor', 'guide', 'client') NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_nacimiento DATE,
    tipo_sangre VARCHAR(5),
    contacto_emergencia TEXT,
    estado ENUM('Activo', 'Inactivo', 'Suspendido') DEFAULT 'Activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ...
);
```

#### 2. **rutas**
```sql
CREATE TABLE rutas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    duracion VARCHAR(50),
    dificultad ENUM('Fácil', 'Moderado', 'Difícil'),
    precio DECIMAL(10, 2) NOT NULL,
    ubicacion VARCHAR(255),
    capacidad_maxima INT,
    incluye JSON,
    itinerario JSON,
    estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
    destacado BOOLEAN DEFAULT FALSE,
    ...
);
```

#### 3. **fincas**
```sql
CREATE TABLE fincas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    ubicacion VARCHAR(255),
    precio_noche DECIMAL(10, 2) NOT NULL,
    capacidad_maxima INT,
    servicios JSON,
    actividades JSON,
    comodidades JSON,
    estado ENUM('Disponible', 'Reservada', 'Mantenimiento'),
    ...
);
```

#### 4. **paquetes**
```sql
CREATE TABLE paquetes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    duracion VARCHAR(50),
    precio DECIMAL(10, 2) NOT NULL,
    incluye JSON,
    rutas_incluidas JSON,
    fincas_incluidas JSON,
    destacado BOOLEAN DEFAULT FALSE,
    estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
    ...
);
```

#### 5. **reservas**
```sql
CREATE TABLE reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    asesor_id INT,
    guia_asignado_id INT,
    tipo ENUM('ruta', 'finca', 'paquete') NOT NULL,
    servicio_id INT NOT NULL,
    fecha_reserva DATE NOT NULL,
    fecha_tour DATE NOT NULL,
    numero_participantes INT NOT NULL,
    monto_total DECIMAL(10, 2) NOT NULL,
    monto_pagado DECIMAL(10, 2) DEFAULT 0,
    monto_pendiente DECIMAL(10, 2),
    estado ENUM('Pendiente', 'Confirmada', 'En Proceso', 'Completada', 'Cancelada'),
    estado_pago ENUM('Pendiente', 'Pagado Parcial', 'Pagado Total'),
    metodo_pago VARCHAR(50),
    notas TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
    FOREIGN KEY (asesor_id) REFERENCES usuarios(id),
    FOREIGN KEY (guia_asignado_id) REFERENCES usuarios(id)
);
```

#### 6. **servicios**
```sql
CREATE TABLE servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    categoria ENUM('transporte', 'guia', 'alimentacion', 'equipo', 'otros'),
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    duracion VARCHAR(50),
    capacidad INT,
    estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
    proveedor VARCHAR(255),
    telefono VARCHAR(20)
);
```

#### 7. **transporte**
```sql
CREATE TABLE transporte (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_vehiculo VARCHAR(100) NOT NULL,
    placa VARCHAR(20) UNIQUE NOT NULL,
    capacidad INT NOT NULL,
    conductor VARCHAR(255),
    telefono_conductor VARCHAR(20),
    estado ENUM('Disponible', 'En Servicio', 'Mantenimiento'),
    ultimo_mantenimiento DATE,
    proximo_mantenimiento DATE,
    kilometraje INT
);
```

#### 8. **ventas**
```sql
CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    asesor_id INT NOT NULL,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_venta ENUM('ruta', 'finca', 'paquete', 'servicio'),
    servicio_id INT,
    nombre_servicio VARCHAR(255),
    tipo_servicio VARCHAR(100),
    monto_total DECIMAL(10, 2) NOT NULL,
    monto_pagado DECIMAL(10, 2) DEFAULT 0,
    monto_pendiente DECIMAL(10, 2),
    estado ENUM('Pendiente', 'Pagado Parcial', 'Pagado', 'Cancelado'),
    metodo_pago VARCHAR(50),
    referencia VARCHAR(100),
    comision DECIMAL(10, 2),
    notas TEXT,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
    FOREIGN KEY (asesor_id) REFERENCES usuarios(id)
);
```

#### 9. **restaurantes**
```sql
CREATE TABLE restaurantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo_comida ENUM('desayuno', 'almuerzo', 'cena', 'refrigerio'),
    precio DECIMAL(10, 2) NOT NULL,
    descripcion TEXT,
    calificacion DECIMAL(2, 1),
    rutas_asociadas JSON,
    ubicacion VARCHAR(255),
    telefono VARCHAR(20),
    capacidad INT
);
```

#### 10. **personal_medico**
```sql
CREATE TABLE personal_medico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    documento VARCHAR(50) UNIQUE NOT NULL,
    especialidad VARCHAR(100),
    licencia VARCHAR(100),
    universidad VARCHAR(255),
    año_graduacion INT,
    experiencia VARCHAR(50),
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    fecha_nacimiento DATE,
    tipo_sangre VARCHAR(5),
    estado ENUM('Activo', 'Inactivo', 'Suspendido') DEFAULT 'Activo',
    disponibilidad VARCHAR(100),
    horario_trabajo VARCHAR(100),
    disponible_emergencias BOOLEAN DEFAULT FALSE,
    idiomas JSON,
    certificaciones JSON,
    salario DECIMAL(10, 2),
    tipo_contrato VARCHAR(50),
    fecha_inicio DATE
);
```

### Vistas Útiles

#### v_reservas_completas
```sql
CREATE VIEW v_reservas_completas AS
SELECT 
    r.id,
    r.fecha_reserva,
    r.estado,
    r.estado_pago,
    r.monto_total,
    r.numero_participantes,
    c.nombre AS cliente_nombre,
    c.email AS cliente_email,
    g.nombre AS guia_nombre,
    a.nombre AS asesor_nombre,
    p.nombre AS paquete_nombre,
    rt.nombre AS ruta_nombre,
    f.nombre AS finca_nombre
FROM reservas r
LEFT JOIN usuarios c ON r.cliente_id = c.id
LEFT JOIN usuarios g ON r.guia_asignado_id = g.id
LEFT JOIN usuarios a ON r.asesor_id = a.id
LEFT JOIN paquetes p ON r.paquete_id = p.id
LEFT JOIN rutas rt ON r.ruta_id = rt.id
LEFT JOIN fincas f ON r.finca_id = f.id;
```

#### v_estadisticas_asesores
```sql
CREATE VIEW v_estadisticas_asesores AS
SELECT 
    a.id AS asesor_id,
    a.nombre AS asesor_nombre,
    COUNT(DISTINCT v.id) AS total_ventas,
    SUM(v.monto_total) AS monto_total_ventas,
    SUM(v.comision) AS comisiones_totales,
    COUNT(DISTINCT r.id) AS total_reservas
FROM usuarios a
LEFT JOIN ventas v ON a.id = v.asesor_id
LEFT JOIN reservas r ON a.id = r.asesor_id
WHERE a.rol = 'advisor'
GROUP BY a.id, a.nombre;
```

---

## 🚀 ESTADO ACTUAL Y PRÓXIMOS PASOS

### ✅ Módulos Completados

1. ✅ **Sistema de Autenticación**
   - Login funcional
   - Registro funcional
   - Persistencia de sesión
   - 4 roles implementados

2. ✅ **Gestión de Rutas Turísticas**
   - CRUD completo
   - Vista pública y detalle
   - Filtros y búsqueda
   - Sistema de reservas

3. ✅ **Gestión de Fincas Aliadas**
   - CRUD completo
   - Vista pública y detalle
   - Filtros y búsqueda
   - Sistema de reservas

4. ✅ **Gestión de Paquetes Turísticos**
   - CRUD básico
   - Vista pública y detalle
   - Combinación de rutas + fincas

5. ✅ **Proceso de Reserva**
   - Modal funcional
   - Validaciones completas
   - Cálculo de montos
   - Estados de reserva y pago
   - Gestión por cada rol

6. ✅ **Gestión de Empleados**
   - CRUD completo
   - Estadísticas en tiempo real
   - Búsqueda y filtros
   - Animaciones Motion/React
   - Documentación exhaustiva

7. ✅ **Dashboard de Administrador**
   - 14 tabs funcionales
   - Métricas y gráficos
   - Gestión completa del sistema
   - Integración de todos los módulos

8. ✅ **Dashboards de Roles**
   - Dashboard de Asesor
   - Dashboard de Guía
   - Dashboard de Cliente
   - Funcionalidades específicas por rol

9. ✅ **Gestión de Pagos a Proveedores**
   - CRUD completo
   - Estadísticas
   - Filtros y búsqueda
   - Estados de pago

10. ✅ **Páginas Públicas**
    - HomePage con secciones
    - Catálogos de servicios
    - Páginas de detalle

### ⚠️ Problemas Actuales

1. ⚠️ **Error 403 de Supabase**
   - Conexión expirada o no configurada
   - Impide despliegue
   - **Solución necesaria:** Reconectar o desconectar temporalmente

2. ⚠️ **Datos Mock**
   - Todo funciona con datos en memoria/localStorage
   - No hay persistencia real en base de datos
   - **Solución futura:** Conectar a Supabase real

### 🔄 En Desarrollo / Pendiente

1. 🔄 **Integración con Supabase**
   - Conectar autenticación real
   - Conectar base de datos
   - Migrar de mock a API real

2. 🔄 **Sistema de Pagos Real**
   - Integración con pasarelas (PSE, tarjetas)
   - Webhooks de confirmación
   - Recibos y facturación

3. 🔄 **Sistema de Notificaciones**
   - Notificaciones en tiempo real
   - Email notifications
   - SMS para confirmaciones

4. 🔄 **Módulo de Reportes**
   - Exportar a PDF/Excel
   - Reportes personalizados
   - Dashboard de analíticas avanzado

5. 🔄 **Chat en Tiempo Real**
   - Entre cliente y asesor
   - Entre asesor y guía
   - Sistema de mensajería completo

6. 🔄 **Sistema de Calificaciones**
   - Reseñas de clientes
   - Calificación de guías
   - Comentarios en rutas/fincas

7. 🔄 **Gestión de Disponibilidad**
   - Calendario de disponibilidad real
   - Bloqueo de fechas
   - Gestión de cupos

8. 🔄 **Optimizaciones**
   - Lazy loading de componentes
   - Optimización de imágenes
   - Caché de datos
   - PWA (Progressive Web App)

### 📝 Documentación Pendiente

- Guía de deployment
- Manual de usuario final
- Manual de administrador
- API documentation (cuando se integre backend)

---

## 📦 DEPENDENCIAS Y LIBRERÍAS

### Principales

```json
{
  "react": "^18.x",
  "typescript": "^5.x",
  "tailwindcss": "^4.x",
  "motion/react": "latest (framer-motion)",
  "lucide-react": "latest",
  "recharts": "latest",
  "sonner@2.0.3": "^2.0.3",
  "react-hook-form@7.55.0": "^7.55.0"
}
```

### Componentes UI (Shadcn)

Todos los componentes de `/components/ui/` son de Shadcn/UI adaptados

### Utilidades

- `clsx` / `class-variance-authority` para manejo de clases CSS
- `date-fns` para manejo de fechas
- Unsplash para imágenes de placeholder

---

## 🎯 CONVENCIONES DE CÓDIGO

### Nomenclatura

**Componentes:**
- PascalCase: `AdminDashboard.tsx`
- Export por defecto o named export

**Hooks:**
- camelCase con prefijo `use`: `useServices.tsx`

**Utilidades:**
- camelCase: `mockData.tsx`

**Constantes:**
- UPPER_SNAKE_CASE para constantes globales
- camelCase para constantes locales

### Estructura de Componente

```tsx
// 1. Imports
import React, { useState } from 'react';
import { Button } from './ui/button';
import { motion } from 'motion/react';

// 2. Interfaces/Types
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

// 3. Component
export function Component({ prop1, prop2 }: ComponentProps) {
  // 3.1 Hooks
  const [state, setState] = useState();
  
  // 3.2 Handlers
  const handleClick = () => {
    // ...
  };
  
  // 3.3 Effects (if any)
  useEffect(() => {
    // ...
  }, []);
  
  // 3.4 Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Tailwind CSS

**Orden de clases:**
1. Layout (flex, grid, etc.)
2. Sizing (w-, h-, etc.)
3. Spacing (p-, m-, etc.)
4. Typography (text-, font-, etc.)
5. Colors (bg-, text-, border-, etc.)
6. Effects (shadow-, opacity-, etc.)
7. Responsive (sm:, md:, lg:, etc.)
8. States (hover:, focus:, etc.)

**Ejemplo:**
```tsx
className="flex items-center justify-between w-full p-4 text-lg bg-green-600 hover:bg-green-700 rounded-lg shadow-md"
```

### TypeScript

- Siempre tipar props de componentes
- Usar interfaces para objetos complejos
- Usar types para uniones y alias
- Evitar `any`, preferir `unknown` si es necesario

---

## 🔧 CONFIGURACIÓN DEL PROYECTO

### Tailwind v4

**Archivo:** `/styles/globals.css`

- Usa `@import` en lugar de `@tailwind`
- Tokens personalizados con CSS variables
- No requiere `tailwind.config.js`

### TypeScript

**tsconfig.json:**
- `"strict": true`
- `"jsx": "react-jsx"`
- Path aliases configurados

### Vite / Build Tool

- Hot Module Replacement (HMR)
- Fast Refresh para React
- Optimización de producción automática

---

## 📞 SOPORTE Y RECURSOS

### Archivos de Documentación

- `/EMPLOYEE_MANAGEMENT_README.md` - Gestión de empleados
- `/ACCIONES_EMPLEADOS.md` - Matriz de acciones
- `/guidelines/Guidelines.md` - Guías del proyecto
- `/database_schema_occitours.sql` - Schema SQL

### Debugging

**Console helpers disponibles:**
```javascript
// Disponibles en consola del navegador:
window.mockAuth // Sistema de autenticación
window.mockAuth.debugUsers() // Ver usuarios
window.mockAuth.resetAuth() // Resetear auth
```

**LocalStorage keys:**
- `occitours_session` - Sesión actual
- `occitours_users_auth` - Base de usuarios
- `occitours_bookings` - Reservas guardadas
- `occitours_services` - Servicios guardados

---

## 🎉 RESUMEN EJECUTIVO

**Occitours** es una plataforma web completa de gestión turística desarrollada con React + TypeScript + Tailwind CSS v4.

**Cuenta con:**
- ✅ 4 roles de usuario (Admin, Asesor, Guía, Cliente)
- ✅ Autenticación funcional con persistencia
- ✅ 14 módulos administrativos completamente funcionales
- ✅ Sistema completo de reservas con múltiples estados
- ✅ Gestión de rutas, fincas y paquetes turísticos
- ✅ Dashboards personalizados por rol
- ✅ Gestión de empleados con CRUD completo
- ✅ Gestión de pagos (clientes y proveedores)
- ✅ Más de 40 componentes UI reutilizables
- ✅ Animaciones suaves con Motion/React
- ✅ Diseño responsive mobile-first
- ✅ Paleta de colores verde y blanco (naturaleza)
- ✅ Base de datos SQL completa diseñada
- ✅ Sistema de datos mock funcional para desarrollo

**Estado:** Listo para integración con backend real (Supabase)

**Problema actual:** Error 403 de Supabase que requiere resolución

---

**📅 Última actualización:** Diciembre 2024  
**🏗️ Versión:** 1.0 (Desarrollo)  
**👨‍💻 Desarrollado para:** Occitours - Plataforma de Turismo de Naturaleza

---

