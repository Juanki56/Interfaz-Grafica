# 📘 Guía de Integración - Sistema de Roles y Permisos

## 🎯 Resumen

Se ha implementado un sistema completo de roles y permisos que permite:
- Crear y editar roles con permisos dinámicos
- Gestionar permisos desde una panel administrativo
- Restringir acciones en los módulos basado en permisos del usuario
- Cambios en tiempo real sin recargar la página

---

## 🔧 Cómo Usar en tus Componentes

### Paso 1: Importar el Hook

```tsx
import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';
```

### Paso 2: Usar el Hook en tu Componente

```tsx
export function OwnersManagement() {
  const permissions = usePermissions();
  const ownerPermissions = createModulePermissions(permissions, 'Propietarios');

  // Ahora tienes:
  // ownerPermissions.canCreate() → boolean
  // ownerPermissions.canEdit() → boolean
  // ownerPermissions.canDelete() → boolean
  // ownerPermissions.canView() → boolean
  // ownerPermissions.isAdmin() → boolean
}
```

### Paso 3: Controlar Visibilidad de Botones

```tsx
// Mostrar botón crear solo si tiene permiso
{ownerPermissions.canCreate() && (
  <Button 
    onClick={() => setShowCreateModal(true)}
    className="bg-green-600 hover:bg-green-700"
  >
    <Plus className="w-4 h-4 mr-2" />
    Crear Propietario
  </Button>
)}
```

### Paso 4: Proteger Acciones

```tsx
const handleCreateOwner = async () => {
  // Verificar permiso antes de ejecutar
  if (!ownerPermissions.canCreate()) {
    toast.error(ownerPermissions.getErrorMessage('crear'));
    return;
  }

  // Ejecutar acción
  try {
    await propietariosAPI.create(formData);
    toast.success('Propietario creado exitosamente');
  } catch (error) {
    toast.error('Error al crear propietario');
  }
};
```

---

## 📊 Ejemplo Completo: OwnersManagement

```tsx
import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';

export function OwnersManagement() {
  const permissions = usePermissions();
  const ownerPermissions = createModulePermissions(permissions, 'Propietarios');
  
  // Si no tiene permiso para ver, mostrar mensaje de acceso denegado
  if (!ownerPermissions.canView()) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <Shield className="w-8 h-8 text-red-600 mb-2" />
          <h3 className="font-semibold text-red-800">Acceso Denegado</h3>
          <p className="text-sm text-red-700">
            No tienes permiso para ver la gestión de propietarios
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Gestión de Propietarios</h2>
        
        {/* Solo mostrar si tiene permiso */}
        {ownerPermissions.canCreate() && (
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Propietario
          </Button>
        )}
      </div>

      {/* Tabla */}
      <Table>
        <TableBody>
          {owners.map((owner) => (
            <TableRow key={owner.id_propietario}>
              <TableCell>{owner.nombre}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {/* Botón ver */}
                  {ownerPermissions.canView() && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDetail(owner)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Botón editar */}
                  {ownerPermissions.canEdit() && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit(owner)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Botón eliminar */}
                  {ownerPermissions.canDelete() && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(owner)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

## 🎨 Patrones Comunes

### Patrón 1: Deshabilitar Botón Sin Permiso

```tsx
<Button 
  onClick={handleCreate}
  disabled={!ownerPermissions.canCreate()}
  title={!ownerPermissions.canCreate() ? ownerPermissions.getErrorMessage('crear') : ''}
>
  Crear
</Button>
```

### Patrón 2: Mostrar Icono de Cerrojo si No Tiene Permiso

```tsx
<div className="flex items-center gap-2">
  <Edit className="w-4 h-4" />
  <span>Editar</span>
  {!ownerPermissions.canEdit() && (
    <Lock className="w-4 h-4 text-red-500" />
  )}
</div>
```

### Patrón 3: Sección Completa Protegida

```tsx
{ownerPermissions.canEdit() && (
  <div className="border rounded-lg p-4 space-y-4">
    <h3 className="font-semibold">Información Editable</h3>
    {/* Contenido editable aquí */}
  </div>
)}
```

### Patrón 4: Toast de Error con Permiso

```tsx
const handleUpdate = async (owner) => {
  if (!ownerPermissions.canEdit()) {
    toast.error(ownerPermissions.getErrorMessage('editar'));
    return;
  }
  // Actualizar...
};
```

---

## 🗂️ Módulos Disponibles

Ten en cuenta estos nombres al usar `createModulePermissions`:

```
'Usuarios'
'Clientes'
'Propietarios'
'Empleados'
'Reservas'
'Fincas'
'Rutas'
'Servicios'
'Ventas'
'Abonos'
'Pagos'
'Proveedores'
'Restaurantes'
'Tours'
'Roles'
```

---

## 🔄 Recargar Permisos

Si necesitas actualizar los permisos después de cambios (por ejemplo, después de actualizar roles):

```tsx
// Recargar permisos del usuario actual
await permissions.refreshPermissions();

// O solo recargar todos los roles
await permissions.loadAllRoles();
```

---

## 🐛 Debugging

```tsx
// En consola del navegador puedes verificar:
const permissions = usePermissions();
console.log(permissions.currentUserRole);      // Rol actual
console.log(permissions.userPermissions);      // Permisos del usuario
console.log(permissions.allRoles);             // Todos los roles del sistema
console.log(permissions.hasPermission('Ver Propietarios')); // Verificar permiso
```

---

## 📝 Lista de Módulos a Actualizaci

Los siguientes módulos necesitan ser actualizados para usar este sistema:

- [ ] OwnersManagement
- [ ] ClientsManagement
- [ ] EmployeeManagement
- [ ] BookingsManagement
- [ ] FarmsManagement
- [ ] RoutesManagement
- [ ] ServiceManagement
- [ ] PaymentManagement
- [ ] ProviderManagement
- [ ] RestaurantManagement
- [ ] UserManagement

---

## ✅ Checklist de Implementación

Para cada módulo, verifica:

- [ ] Hook `usePermissions` importado
- [ ] `createModulePermissions` configurado para el módulo
- [ ] Botón "Crear" protegido con `canCreate()`
- [ ] Botón "Editar" protegido con `canEdit()`
- [ ] Botón "Eliminar" protegido con `canDelete()`
- [ ] Modal de crear/editar protegido
- [ ] Toast de error si no tiene permiso
- [ ] Toda acción CRUD protegida

---

## 🚀 Próximos Pasos

1. Actualiza los módulos principales uno por uno
2. Prueba con usuarios que tienen roles diferentes
3. Asigna permisos a los roles en el panel administrativo
4. Verifica que las acciones se restriccionan correctamente
