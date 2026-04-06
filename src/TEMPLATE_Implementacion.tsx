/**
 * =====================================================
 * TEMPLATE DE IMPLEMENTACIÓN RÁPIDA
 * =====================================================
 * 
 * Copia este contenido a tu componente y reemplaza:
 * 1. "Propietarios" → Tu módulo (ej: "Usuarios", "Clientes")
 * 2. "propietariosAPI" → Tu API (ej: "clientesAPI")
 * 3. Los nombres de funciones según sea necesario
 */

import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';
import { Plus, Edit, Trash2, Eye, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { toast } from 'sonner';

// ============ REPLACE: "Propietarios" con tu módulo ============
const MODULE_NAME = 'Propietarios' as const;

export function YourComponentName() {
  // ============ PERMISOS ============
  const permissions = usePermissions();
  const modulePerms = createModulePermissions(permissions, MODULE_NAME);

  // Si no puede ver, mostrar acceso denegado
  if (!modulePerms.canView()) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Acceso Denegado</h3>
              <p className="text-sm text-red-700">
                No tienes permiso para acceder a {MODULE_NAME.toLowerCase()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============ HANDLERS PROTEGIDOS ============
  const handleCreate = async (data: any) => {
    if (!modulePerms.canCreate()) {
      toast.error(modulePerms.getErrorMessage('crear'));
      return;
    }
    // TODO: Implementar lógica de creación
    // await yourAPI.create(data);
  };

  const handleEdit = async (id: any, data: any) => {
    if (!modulePerms.canEdit()) {
      toast.error(modulePerms.getErrorMessage('editar'));
      return;
    }
    // TODO: Implementar lógica de edición
    // await yourAPI.update(id, data);
  };

  const handleDelete = async (id: any) => {
    if (!modulePerms.canDelete()) {
      toast.error(modulePerms.getErrorMessage('eliminar'));
      return;
    }
    // TODO: Implementar lógica de eliminación
    // await yourAPI.delete(id);
  };

  // ============ RENDER ============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Gestión de {MODULE_NAME}</h2>
        
        {/* Botón Crear - Protegido */}
        {modulePerms.canCreate() ? (
          <Button 
            onClick={() => handleCreate({})}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear {MODULE_NAME}
          </Button>
        ) : (
          <Button disabled className="opacity-50">
            <Plus className="w-4 h-4 mr-2" />
            Crear {MODULE_NAME}
          </Button>
        )}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-4">
          <table className="w-full">
            <tbody>
              {/* TODO: Mapear datos aquí */}
              {/* {items.map(item => ( */}
              <tr className="border-b">
                <td className="py-3 px-4">Ejemplo</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    {/* Ver */}
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>

                    {/* Editar - Protegido */}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      disabled={!modulePerms.canEdit()}
                      className={!modulePerms.canEdit() ? 'opacity-50' : ''}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    {/* Eliminar - Protegido */}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      disabled={!modulePerms.canDelete()}
                      className={!modulePerms.canDelete() ? 'opacity-50' : 'text-red-600'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
              {/* ))} */}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * =====================================================
 * CHECKLIST RÁPIDO
 * =====================================================
 * 
 * Para implementar:
 * 
 * [ ] Importar usePermissions
 * [ ] Importar createModulePermissions
 * [ ] Agregar const MODULE_NAME = 'Tu Módulo'
 * [ ] Definir: const modulePerms = createModulePermissions(permissions, MODULE_NAME)
 * [ ] Agregar verificación canView() en el render
 * [ ] Proteger botón Crear con canCreate()
 * [ ] Proteger botón Editar con canEdit()
 * [ ] Proteger botón Eliminar con canDelete()
 * [ ] Proteger handlers (handleCreate, handleEdit, handleDelete)
 * [ ] Reemplazar TODO: comentarios con implementación real
 * 
 * ¡Listo! El módulo tendrá restricción de permisos.
 */
