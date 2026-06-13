/**
 * usePermissions — hook de compatibilidad hacia atrás.
 *
 * La lógica real vive en PermissionsContext (se carga UNA sola vez para toda la app
 * gracias al <PermissionsProvider> en App.tsx).
 *
 * Todos los componentes que importen `usePermissions` de aquí siguen funcionando
 * exactamente igual — sin necesidad de cambiar ningún componente individual.
 */
export {
  usePermissionsContext as usePermissions,
  type PermissionsContextValue as UsePermissionsReturn,
} from '../context/PermissionsContext';
