/**
 * =====================================================
 * EJEMPLO DE INTEGRACIÓN - SISTEMA DE ROLES Y PERMISOS
 * =====================================================
 * 
 * Este archivo muestra cómo integrar el sistema de roles y permisos
 * en un componente existente. Usa OwnersManagement como ejemplo.
 * 
 * INSTRUCCIONES:
 * 1. Copia este patrón a tu componente
 * 2. Reemplaza 'Propietarios' con el módulo correcto
 * 3. Reemplaza 'propietariosAPI' con tu API correspondiente
 * 4. Actualiza los nombres de funciones y variables
 */

import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

export function OwnersManagementWithPermissions() {
  // ============ PERMISOS ============
  const permissions = usePermissions();
  const ownerPermissions = createModulePermissions(permissions, 'Propietarios');

  // Mostrar acceso denegado si no puede ver
  if (!ownerPermissions.canView()) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-red-800 mb-1">Acceso Denegado</h3>
              <p className="text-sm text-red-700">
                No tienes permiso para acceder a la gestión de propietarios.
                {ownerPermissions.isAdmin() ? '' : ' Contacta a un administrador si crees que esto es un error.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============ HANDLERS PROTEGIDOS ============
  const handleCreateOwner = async (formData: any) => {
    // Verificar permiso antes de ejecutar
    if (!ownerPermissions.canCreate()) {
      toast.error(ownerPermissions.getErrorMessage('crear'));
      return;
    }

    try {
      // await propietariosAPI.create(formData);
      toast.success('Propietario creado exitosamente');
    } catch (error) {
      toast.error('Error al crear propietario');
    }
  };

  const handleEditOwner = async (owner: any, formData: any) => {
    if (!ownerPermissions.canEdit()) {
      toast.error(ownerPermissions.getErrorMessage('editar'));
      return;
    }

    try {
      // await propietariosAPI.update(owner.id_propietario, formData);
      toast.success('Propietario actualizado exitosamente');
    } catch (error) {
      toast.error('Error al actualizar propietario');
    }
  };

  const handleDeleteOwner = async (owner: any) => {
    if (!ownerPermissions.canDelete()) {
      toast.error(ownerPermissions.getErrorMessage('eliminar'));
      return;
    }

    try {
      // await propietariosAPI.delete(owner.id_propietario);
      toast.success('Propietario eliminado exitosamente');
    } catch (error) {
      toast.error('Error al eliminar propietario');
    }
  };

  // ============ RENDER ============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Gestión de Propietarios</h2>
          <p className="text-gray-600 text-sm">
            Administra la información de los propietarios de fincas
          </p>
        </div>

        {/* Botón Crear - Solo si tiene permiso */}
        {ownerPermissions.canCreate() ? (
          <Button 
            onClick={() => {/* Abrir modal crear */}}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Propietario
          </Button>
        ) : (
          <Button 
            disabled
            className="opacity-50 cursor-not-allowed"
            title={ownerPermissions.getErrorMessage('crear')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Propietario
          </Button>
        )}
      </div>

      {/* Tabla de Propietarios */}
      <Card>
        <CardContent className="p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Nombre</th>
                <th className="text-left py-2 px-4">Teléfono</th>
                <th className="text-left py-2 px-4">Email</th>
                <th className="text-right py-2 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {/* Mapear propietarios */}
              {/* {owners.map((owner) => ( */}
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">Juan Aguirre</td>
                <td className="py-3 px-4">+57 3001234567</td>
                <td className="py-3 px-4">juan@example.com</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2 justify-end">
                    {/* Ver - Ejemplo sin restricción visual (pero protegido en handler) */}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {/* Editar - Solo si tiene permiso */}
                    {ownerPermissions.canEdit() ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        title="Editar propietario"
                        onClick={() => {/* Abrir modal editar */}}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled
                        title={ownerPermissions.getErrorMessage('editar')}
                        className="opacity-50 cursor-not-allowed"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Eliminar - Solo si tiene permiso */}
                    {ownerPermissions.canDelete() ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        title="Eliminar propietario"
                        onClick={() => {/* Confirmar y eliminar */}}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled
                        className="opacity-50 cursor-not-allowed"
                        title={ownerPermissions.getErrorMessage('eliminar')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
              {/* ))} */}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Secciones Editables - Solo si tiene permiso */}
      {ownerPermissions.canEdit() && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Información Editable</h3>
            {/* Formulario de edición aquí */}
            <p className="text-gray-600">
              Esto solo se muestra si tienes permiso de edición
            </p>
          </CardContent>
        </Card>
      )}

      {/* Panel de Información de Permisos (opcional, para debugging) */}
      {ownerPermissions.isAdmin() && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-blue-900 mb-2">🔧 Info de Permisos (Admin)</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Tu Rol: {ownerPermissions.userRole}</p>
              <p>• Crear: {ownerPermissions.can('crear') ? '✅' : '❌'}</p>
              <p>• Editar: {ownerPermissions.can('editar') ? '✅' : '❌'}</p>
              <p>• Eliminar: {ownerPermissions.can('eliminar') ? '✅' : '❌'}</p>
              <p>• Ver: {ownerPermissions.can('ver') ? '✅' : '❌'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * =====================================================
 * RESUMEN DE CAMBIOS
 * =====================================================
 *
 * 1. Importar el hook:
 *    import { usePermissions } from '../hooks/usePermissions';
 *    import { createModulePermissions } from '../utils/permissionHelper';
 *
 * 2. Usar en el componente:
 *    const permissions = usePermissions();
 *    const ownerPermissions = createModulePermissions(permissions, 'Propietarios');
 *
 * 3. Controlar visibilidad:
 *    {ownerPermissions.canCreate() && <Button>Crear</Button>}
 *    {ownerPermissions.canEdit() && <Button>Editar</Button>}
 *
 * 4. Proteger handlers:
 *    if (!ownerPermissions.canEdit()) {
 *      toast.error(ownerPermissions.getErrorMessage('editar'));
 *      return;
 *    }
 */
