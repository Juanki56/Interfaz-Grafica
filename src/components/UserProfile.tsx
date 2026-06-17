import { useState, useEffect, useMemo } from 'react';
import { User, Settings, Lock, Bell, Trash2, Shield, Mail, Phone, Eye, EyeOff, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { clientesAPI, empleadosAPI, usersAPI, authAPI } from '../services/api';
import { decodeJWT } from '../utils/jwtDecoder';
import {
  documentoTitularCompletoValidoParaReserva,
  MENSAJE_ACTUALIZAR_DOCUMENTO_PERFIL,
  PROFILE_DOCUMENT_REMINDER_KEY,
} from '../utils/documentIdentityValidation';
import { Alert, AlertDescription } from './ui/alert';
import {
  getClientPasswordRequirementChecks,
  isStrongClientPassword,
  sanitizeDocumentInput,
  validateClientPasswordChange,
} from '../utils/clientFormValidation';

interface UserProfileProps {
  onClose?: () => void;
}

/** Valores alineados con UsersManagement / AdminDashboard (misma API). */
const TIPO_DOCUMENTO_PERFIL_VALUES = ['C.C.', 'C.E.', 'Pasaporte', 'T.I.', 'NIT'] as const;

/** Normaliza texto viejo (CC, c.c, etc.) al valor del Select. */
function tipoDocumentoPerfilToSelectValue(raw: unknown): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  const direct = TIPO_DOCUMENTO_PERFIL_VALUES.find((v) => v === s);
  if (direct) return direct;
  const n = s.toLowerCase().replace(/\s+/g, '');
  if (n === 'cc' || n === 'c.c' || n === 'c.c.' || n.includes('ciudadania') || n.includes('ceduladeciudadania')) {
    return 'C.C.';
  }
  if (n === 'ce' || n === 'c.e' || n === 'c.e.' || n.includes('extranjeria')) {
    return 'C.E.';
  }
  if (n.includes('pasaporte') || n === 'pa' || n === 'pas' || n === 'passport') {
    return 'Pasaporte';
  }
  if (n === 'ti' || n === 't.i' || n === 't.i.' || n.includes('identidad') || n.includes('tarjetadeidentidad')) {
    return 'T.I.';
  }
  if (n === 'nit' || n.includes('nit')) {
    return 'NIT';
  }
  return '';
}

export function UserProfile({ onClose }: UserProfileProps) {
  const { user, logout, setCurrentView, refreshProfile, updateCurrentUser } = useAuth();
  const [backendProfile, setBackendProfile] = useState<any>(null);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    tipo_documento: tipoDocumentoPerfilToSelectValue(user?.tipo_documento) || '',
    numero_documento: user?.numero_documento || '',
    preferences: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    bookingUpdates: true,
    promotionsOffers: true
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'private',
    shareBookingHistory: false,
    allowDataCollection: false
  });
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteMotivo, setDeleteMotivo] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDocumentReminder, setShowDocumentReminder] = useState(false);

  const ACCOUNT_DELETION_ESTIMATED_DAYS = 15;

  const splitFullName = (fullName: string) => {
    const cleaned = String(fullName || '').trim().replace(/\s+/g, ' ');
    if (!cleaned) return { nombre: '', apellido: '' };
    const parts = cleaned.split(' ');
    if (parts.length === 1) return { nombre: parts[0], apellido: '' };
    return { nombre: parts[0], apellido: parts.slice(1).join(' ') };
  };

  const resolveSelfBackendIds = async () => {
    const ids: { idUsuarios?: number; idEmpleado?: number; idCliente?: number } = {};

    // 1) Try JWT payload (best-effort)
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = decodeJWT(token);
        const idUsuarios = Number(payload?.id_usuarios ?? payload?.id_usuario ?? payload?.usuario_id ?? payload?.id);
        if (Number.isFinite(idUsuarios) && idUsuarios > 0) ids.idUsuarios = idUsuarios;

        const idEmpleado = Number(payload?.id_empleado);
        if (Number.isFinite(idEmpleado) && idEmpleado > 0) ids.idEmpleado = idEmpleado;

        const idCliente = Number(payload?.id_cliente);
        if (Number.isFinite(idCliente) && idCliente > 0) ids.idCliente = idCliente;
      }
    } catch {
      // ignore
    }

    const email = String(user?.email || '').trim().toLowerCase();

    // 2) Try profile state if available
    if (backendProfile) {
      const idU = Number(backendProfile?.id_usuarios);
      if (!ids.idUsuarios && Number.isFinite(idU) && idU > 0) ids.idUsuarios = idU;
      const idE = Number(backendProfile?.id_empleado);
      if (!ids.idEmpleado && Number.isFinite(idE) && idE > 0) ids.idEmpleado = idE;
      const idC = Number(backendProfile?.id_cliente);
      if (!ids.idCliente && Number.isFinite(idC) && idC > 0) ids.idCliente = idC;
    }

    // 3) Look up by email (requires permissions, but is the most reliable when /auth/profile doesn't exist)
    if (email && !ids.idUsuarios) {
      try {
        const allUsers = await usersAPI.getAll();
        const found = allUsers.find((u: any) => String(u?.correo || u?.email || '').trim().toLowerCase() === email);
        const idU = Number(found?.id_usuarios ?? found?.id_usuario ?? found?.id);
        if (Number.isFinite(idU) && idU > 0) ids.idUsuarios = idU;
      } catch {
        // ignore
      }
    }

    if (email && !ids.idEmpleado) {
      try {
        const allEmpleados = await empleadosAPI.getAll();
        const found = allEmpleados.find((e: any) => String(e?.correo || '').trim().toLowerCase() === email);
        const idE = Number((found as any)?.id_empleado);
        if (Number.isFinite(idE) && idE > 0) ids.idEmpleado = idE;
      } catch {
        // ignore
      }
    }

    if (email && !ids.idCliente) {
      try {
        const allClientes = await clientesAPI.getAll();
        const found = allClientes.find((c: any) => String(c?.correo || '').trim().toLowerCase() === email);
        const idC = Number((found as any)?.id_cliente);
        if (Number.isFinite(idC) && idC > 0) ids.idCliente = idC;
      } catch {
        // ignore
      }
    }

    // 4) Last-resort: current user.id (unknown table)
    const idFallback = Number(user?.id);
    if (Number.isFinite(idFallback) && idFallback > 0) {
      if (!ids.idUsuarios) ids.idUsuarios = idFallback;
      if (!ids.idEmpleado && (user?.role === 'advisor' || user?.role === 'guide' || user?.role === 'admin')) ids.idEmpleado = idFallback;
      if (!ids.idCliente && user?.role === 'client') ids.idCliente = idFallback;
    }

    return ids;
  };

  const loadBackendProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      if (!response?.success || !response?.perfil) return;

      const perfil = response.perfil;
      setBackendProfile(perfil);

      const nombreCompleto = perfil.apellido ? `${perfil.nombre} ${perfil.apellido}` : (perfil.nombre || '');
      const tipoDoc = tipoDocumentoPerfilToSelectValue(
        perfil.tipo_documento ?? perfil.tipoDocumento ?? user?.tipo_documento,
      );
      const numeroDoc = String(
        perfil.numero_documento ?? perfil.numeroDocumento ?? user?.numero_documento ?? '',
      ).trim();
      setProfileData(prev => ({
        ...prev,
        name: nombreCompleto || user?.name || prev.name,
        email: perfil.correo || user?.email || prev.email,
        phone: perfil.telefono || user?.phone || prev.phone,
        tipo_documento: tipoDoc || prev.tipo_documento,
        numero_documento: numeroDoc || prev.numero_documento,
      }));
    } catch (error: any) {
      console.error('Error cargando perfil:', error);
    }
  };

  useEffect(() => {
    try {
      if (sessionStorage.getItem(PROFILE_DOCUMENT_REMINDER_KEY) === '1') {
        sessionStorage.removeItem(PROFILE_DOCUMENT_REMINDER_KEY);
        setShowDocumentReminder(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    // Load ONLY preferences from localStorage (backend owns name/email/phone)
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        if (typeof parsedProfile?.preferences === 'string') {
          setProfileData(prev => ({ ...prev, preferences: parsedProfile.preferences }));
        }
      } catch {
        // ignore
      }
    }

    // Load settings from localStorage
    const savedNotifications = localStorage.getItem('notificationSettings');
    if (savedNotifications) {
      setNotificationSettings(JSON.parse(savedNotifications));
    }

    const savedPrivacy = localStorage.getItem('privacySettings');
    if (savedPrivacy) {
      setPrivacySettings(JSON.parse(savedPrivacy));
    }

    if (localStorage.getItem('token')) {
      loadBackendProfile();
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    // Validate required fields
    if (!profileData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    
    if (!profileData.email.trim()) {
      toast.error('El email es requerido');
      return;
    }

    if (!documentoTitularCompletoValidoParaReserva(profileData.tipo_documento, profileData.numero_documento)) {
      toast.error('Seleccione un tipo de documento válido e ingrese el número de documento');
      return;
    }

    const numeroDocumento = sanitizeDocumentInput(profileData.numero_documento);

    // Persistir preferencias localmente (no hay campo claro en backend actualmente)
    localStorage.setItem('userProfile', JSON.stringify({ preferences: profileData.preferences }));

    const { nombre, apellido } = splitFullName(profileData.name);

    try {
      // 1) Intento principal: endpoint dedicado del auth
      await authAPI.updateProfile({
        nombre,
        apellido: apellido || undefined,
        correo: profileData.email,
        telefono: profileData.phone,
        tipo_documento: profileData.tipo_documento,
        numero_documento: numeroDocumento,
        preferencias: profileData.preferences
      });

      updateCurrentUser({
        name: profileData.name,
        phone: profileData.phone,
        tipo_documento: profileData.tipo_documento,
        numero_documento: numeroDocumento,
      });

      await refreshProfile();
      await loadBackendProfile();
      setShowDocumentReminder(false);
      toast.success('Perfil actualizado exitosamente');
      return;
    } catch (error: any) {
      const message = String(error?.message || '');
      const looksLikeMissingEndpoint = /\b404\b|not found|cannot put|no existe|ruta\s+put/i.test(message.toLowerCase());

      // 2) Fallback: actualizar según tipo de usuario
      try {
        if (!looksLikeMissingEndpoint) {
          throw error;
        }

        const updatePayloadCommon = {
          nombre,
          apellido: apellido || undefined,
          correo: profileData.email,
          telefono: profileData.phone,
          tipo_documento: profileData.tipo_documento,
          numero_documento: numeroDocumento,
        };

        const ids = await resolveSelfBackendIds();
        let updatedAtLeastOne = false;

        // IMPORTANT: 'Usuarios' table reads telefono from /api/usuarios, so update that first if possible.
        if (ids.idUsuarios) {
          await usersAPI.update(ids.idUsuarios, updatePayloadCommon);
          updatedAtLeastOne = true;
        }

        // Optionally update role-specific tables when IDs are known
        if (user?.role === 'client' && ids.idCliente) {
          await clientesAPI.update(ids.idCliente, updatePayloadCommon);
          updatedAtLeastOne = true;
        }

        if ((user?.role === 'advisor' || user?.role === 'guide' || user?.role === 'admin') && ids.idEmpleado) {
          await empleadosAPI.update(ids.idEmpleado, {
            nombre,
            apellido: apellido || undefined,
            telefono: profileData.phone,
            tipo_documento: profileData.tipo_documento,
            numero_documento: numeroDocumento,
          });
          updatedAtLeastOne = true;
        }

        if (!updatedAtLeastOne) {
          throw error;
        }

        updateCurrentUser({
          name: profileData.name,
          phone: profileData.phone,
          tipo_documento: profileData.tipo_documento,
          numero_documento: numeroDocumento,
        });

        await refreshProfile();
        await loadBackendProfile();
        setShowDocumentReminder(false);
        toast.success('Perfil actualizado exitosamente');
      } catch (fallbackError: any) {
        console.error('Error al actualizar perfil:', fallbackError);
        toast.error(fallbackError?.message || error?.message || 'Error al actualizar el perfil');
      }
    }
  };

  const passwordRequirementChecks = useMemo(
    () => getClientPasswordRequirementChecks(passwordData.newPassword),
    [passwordData.newPassword],
  );

  const passwordsMatch =
    passwordData.newPassword.length > 0 &&
    passwordData.confirmPassword.length > 0 &&
    passwordData.newPassword === passwordData.confirmPassword;

  const canSubmitPasswordChange =
    Boolean(passwordData.currentPassword.trim()) &&
    isStrongClientPassword(passwordData.newPassword) &&
    passwordsMatch &&
    passwordData.currentPassword !== passwordData.newPassword;

  const handlePasswordChange = async () => {
    const validationError = validateClientPasswordChange(passwordData);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await authAPI.cambiarContrasena(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      toast.success('Contraseña cambiada exitosamente');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      toast.error(error.message || 'Error al cambiar la contraseña');
    }
  };

  const handleNotificationUpdate = () => {
    // Save to localStorage
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    
    // Mock notification settings update
    console.log('Notification settings updated:', notificationSettings);
    toast.success('Configuración de notificaciones actualizada');
  };

  const handlePrivacyUpdate = () => {
    // Save to localStorage
    localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
    
    // Mock privacy settings update
    console.log('Privacy settings updated:', privacySettings);
    toast.success('Configuración de privacidad actualizada');
  };

  const handleDeleteAccount = async () => {
    if (user?.role !== 'client') {
      toast.error('Solo los clientes pueden solicitar la eliminación de cuenta desde aquí.');
      return;
    }
    if (deleteConfirmText !== 'ELIMINAR') {
      toast.error('Por favor escribe "ELIMINAR" para confirmar');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const resp = await authAPI.solicitarEliminacionCuenta({
        confirmacion: 'ELIMINAR',
        motivo: deleteMotivo.trim() || undefined,
      });
      const ref = resp?.referencia ? ` Referencia: ${resp.referencia}.` : '';
      toast.success(
        (resp?.message ||
          'Recibimos tu solicitud. Revisa tu correo con los pasos y el plazo estimado.') + ref,
        { duration: 8000 },
      );
      setShowDeleteDialog(false);
      setDeleteConfirmText('');
      setDeleteMotivo('');
      logout();
      setCurrentView('home');
    } catch (error: any) {
      const msg =
        error?.message ||
        'No se pudo registrar la solicitud. Si tienes reservas activas, resuélvelas antes de solicitar la baja.';
      toast.error(msg, { duration: 9000 });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Get available tabs based on user role
  const getAvailableTabs = () => {
    const baseTabs = [
      { id: 'profile', label: 'Perfil', cols: 'grid-cols-3' },
      { id: 'security', label: 'Seguridad', cols: 'grid-cols-3' },
      { id: 'account', label: 'Cuenta', cols: 'grid-cols-3' }
    ];

    if (user?.role === 'client') {
      return [
        { id: 'profile', label: 'Perfil', cols: 'grid-cols-2' },
        { id: 'security', label: 'Seguridad', cols: 'grid-cols-2' },
      ];
    }

    return baseTabs;
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl text-gray-800">Mi Perfil</h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
          {onClose && (
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          )}
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className={`grid w-full ${availableTabs[0]?.cols || 'grid-cols-4'}`}>
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {showDocumentReminder ? (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertDescription className="text-amber-900">
                      {MENSAJE_ACTUALIZAR_DOCUMENTO_PERFIL}
                    </AlertDescription>
                  </Alert>
                ) : null}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                    <Input
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value.replace(/[0-9]/g, '') }))}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <Input
                      value={profileData.email}
                      placeholder="tu@email.com"
                      type="email"
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Teléfono</label>
                    <Input
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+57 300 123 4567"
                      type="tel"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Tipo de documento</label>
                    <Select
                      value={profileData.tipo_documento || undefined}
                      onValueChange={(value) =>
                        setProfileData((prev) => ({ ...prev, tipo_documento: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPO_DOCUMENTO_PERFIL_VALUES.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Número de documento</label>
                    <Input
                      value={profileData.numero_documento}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          numero_documento: e.target.value.replace(/[^0-9]/g, ''),
                        }))
                      }
                      placeholder="Ej. 1234567890"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Rol</label>
                    <Input
                      value={user?.role === 'client' ? 'Cliente' : user?.role || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                
                <Button onClick={handleProfileUpdate} className="bg-green-600 hover:bg-green-700">
                  Actualizar Perfil
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-800 flex items-center space-x-2">
                    <Lock className="w-6 h-6" />
                    <span>Seguridad</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-800 mb-4">Cambiar Contraseña</h3>
                    <p className="mb-4 text-sm text-gray-600">
                      La nueva contraseña debe cumplir los requisitos de seguridad indicados abajo.
                    </p>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Contraseña Actual</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder="Ingresa tu contraseña actual"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => togglePasswordVisibility('current')}
                          >
                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-password">Nueva Contraseña</Label>
                          <div className="relative">
                            <Input
                              id="new-password"
                              type={showPasswords.new ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                              placeholder="8+ caracteres, mayúscula, número y símbolo"
                              maxLength={64}
                              aria-invalid={
                                passwordData.newPassword.length > 0 &&
                                !isStrongClientPassword(passwordData.newPassword)
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => togglePasswordVisibility('new')}
                            >
                              {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                          <div className="relative">
                            <Input
                              id="confirm-password"
                              type={showPasswords.confirm ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              placeholder="Confirma tu nueva contraseña"
                              maxLength={64}
                              aria-invalid={
                                passwordData.confirmPassword.length > 0 && !passwordsMatch
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => togglePasswordVisibility('confirm')}
                            >
                              {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {passwordData.newPassword.length > 0 && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                          <p className="mb-2 text-xs font-medium text-gray-700">
                            Requisitos de la nueva contraseña
                          </p>
                          <ul className="space-y-1">
                            {passwordRequirementChecks.map((req) => (
                              <li
                                key={req.id}
                                className={`text-xs ${
                                  req.met ? 'text-green-700' : 'text-gray-600'
                                }`}
                              >
                                {req.met ? '✓' : '○'} {req.label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {passwordData.confirmPassword.length > 0 && (
                        <p
                          className={`text-xs ${
                            passwordsMatch ? 'text-green-700' : 'text-red-600'
                          }`}
                        >
                          {passwordsMatch
                            ? '✓ Las contraseñas coinciden'
                            : '○ La confirmación no coincide con la nueva contraseña'}
                        </p>
                      )}

                      {passwordData.currentPassword &&
                        passwordData.newPassword &&
                        passwordData.currentPassword === passwordData.newPassword && (
                          <p className="text-xs text-red-600">
                            La nueva contraseña debe ser diferente a la actual.
                          </p>
                        )}
                      
                      <Button
                        onClick={handlePasswordChange}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={!canSubmitPasswordChange}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Cambiar Contraseña
                      </Button>
                    </div>
                  </div>
                  

                </CardContent>
              </Card>

              {user?.role === 'client' ? (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600 flex items-center space-x-2">
                      <Trash2 className="w-6 h-6" />
                      <span>Eliminar mi cuenta</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-700">
                      Puedes solicitar la <strong>baja de tu cuenta</strong>. No es inmediata: OCCITOUR
                      confirmará por correo los pasos, el plazo estimado (hasta{' '}
                      <strong>{ACCOUNT_DELETION_ESTIMATED_DAYS} días hábiles</strong>) y las consecuencias.
                    </p>
                    <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                      <li>Recibirás un correo de confirmación de recepción con tu número de referencia.</li>
                      <li>Perderás el acceso a reservas, abonos y perfil al confirmar la solicitud.</li>
                      <li>No podrás crear nuevas reservas con esta cuenta.</li>
                      <li>Debes cancelar o completar reservas activas antes de solicitar la baja.</li>
                    </ul>

                    <AlertDialog
                      open={showDeleteDialog}
                      onOpenChange={(open) => {
                        setShowDeleteDialog(open);
                        if (!open) {
                          setDeleteConfirmText('');
                          setDeleteMotivo('');
                        }
                      }}
                    >
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Solicitar eliminación de cuenta
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Solicitar eliminación de tu cuenta?</AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div className="space-y-3 text-sm text-gray-700">
                              <p>
                                Al confirmar, registramos tu solicitud y te enviamos un{' '}
                                <strong>correo con el detalle del proceso</strong> (pasos, plazo y
                                consecuencias).
                              </p>
                              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                <p className="font-medium text-amber-950">Tiempo estimado</p>
                                <p className="text-amber-900/90">
                                  Hasta {ACCOUNT_DELETION_ESTIMATED_DAYS} días hábiles para completar la
                                  eliminación.
                                </p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Consecuencias</p>
                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                  <li>Cierre de acceso a la plataforma (no podrás iniciar sesión).</li>
                                  <li>Pérdida de acceso a historial, comprobantes y perfil en línea.</li>
                                  <li>Imposibilidad de nuevas reservas con esta cuenta.</li>
                                </ul>
                              </div>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm">Motivo (opcional)</Label>
                            <Textarea
                              className="mt-1 min-h-[72px]"
                              placeholder="Ej. ya no usaré el servicio"
                              value={deleteMotivo}
                              onChange={(e) => setDeleteMotivo(e.target.value)}
                              maxLength={2000}
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">
                              Escribe <strong>ELIMINAR</strong> para confirmar:
                            </Label>
                            <Input
                              className="mt-2"
                              placeholder="ELIMINAR"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              autoComplete="off"
                            />
                          </div>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeletingAccount}>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteConfirmText !== 'ELIMINAR' || isDeletingAccount}
                            onClick={(e) => {
                              e.preventDefault();
                              void handleDeleteAccount();
                            }}
                          >
                            {isDeletingAccount ? 'Enviando solicitud…' : 'Confirmar solicitud'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </TabsContent>



          {/* Account Tab */}
          <TabsContent value="account">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-800 flex items-center space-x-2">
                    <Settings className="w-6 h-6" />
                    <span>Configuración de Cuenta</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Estado de la Cuenta</h3>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        <span className="text-green-800">Cuenta Activa</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Tu cuenta está verificada y en buen estado
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium text-gray-800 mb-4">Información de la Cuenta</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-gray-600">Usuario desde</Label>
                        <p className="font-medium">Enero 2024</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Última actividad</Label>
                        <p className="font-medium">Hoy</p>
                      </div>

                      <div>
                        <Label className="text-gray-600">Tipo de cuenta</Label>
                        <p className="font-medium capitalize">{user?.role}</p>
                      </div>
                    </div>
                  </div>
                  

                </CardContent>
              </Card>
              
              {/* Delete Account Section */}
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center space-x-2">
                    <Trash2 className="w-6 h-6" />
                    <span>Zona de Peligro</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-800 mb-2">Eliminar Cuenta</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Esta acción eliminará permanentemente tu cuenta y todos los datos asociados. 
                        No podrás recuperar tu información una vez eliminada.
                      </p>
                    </div>
                    
                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar mi Cuenta
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente tu cuenta 
                            y se removerán todos tus datos de nuestros servidores.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="my-4">
                          <Label className="text-sm font-medium">
                            Para confirmar, escribe <strong>ELIMINAR</strong> en el campo de abajo:
                          </Label>
                          <Input
                            className="mt-2"
                            placeholder="ELIMINAR"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700"
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmText !== 'ELIMINAR'}
                          >
                            Eliminar Cuenta
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}