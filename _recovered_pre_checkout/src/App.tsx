import { Suspense, lazy, useState, createContext, useContext, useEffect } from 'react';
import { Mountain } from 'lucide-react';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { VerifyEmailForm } from './components/VerifyEmailForm';
import { ResetPasswordForm } from './components/ResetPasswordForm';
import { PublicNavigation } from './components/PublicNavigation';
import { HeaderNavigation } from './components/HeaderNavigation';
import { HomePage } from './components/HomePage';
import { WhatsAppButton } from './components/WhatsAppButton';
import { ServicesProvider } from './hooks/ServicesProvider';
import { buildApiUrl, getAuthHeaders, API_CONFIG } from './config/api.config';
import { decodeJWT, debugToken } from './utils/jwtDecoder';

const Navigation = lazy(() => import('./components/Navigation').then((m) => ({ default: m.Navigation })));

const AdminDashboard = lazy(() =>
  import('./components/AdminDashboardWithDropdown').then((m) => ({ default: m.AdminDashboardWithDropdown }))
);
const AdvisorDashboard = lazy(() =>
  import('./components/AdvisorDashboardImproved').then((m) => ({ default: m.AdvisorDashboardImproved }))
);
const GuideDashboard = lazy(() =>
  import('./components/GuideDashboardImproved').then((m) => ({ default: m.GuideDashboardImproved }))
);
const ClientDashboard = lazy(() =>
  import('./components/ClientDashboardImproved').then((m) => ({ default: m.ClientDashboardImproved }))
);

const RoutesPage = lazy(() => import('./components/RoutesPage').then((m) => ({ default: m.RoutesPage })));
const RouteDetailPage = lazy(() =>
  import('./components/RouteDetailPage').then((m) => ({ default: m.RouteDetailPage }))
);
const FarmsPage = lazy(() => import('./components/FarmsPage').then((m) => ({ default: m.FarmsPage })));
const FarmDetailPage = lazy(() =>
  import('./components/FarmDetailPage').then((m) => ({ default: m.FarmDetailPage }))
);
const ProgrammedRouteBookingPage = lazy(() =>
  import('./components/ProgrammedRouteBookingPage').then((m) => ({ default: m.ProgrammedRouteBookingPage }))
);

const ProgrammingManagement = lazy(() =>
  import('./components/ProgrammingManagement').then((m) => ({ default: m.ProgrammingManagement }))
);
const UserProfile = lazy(() => import('./components/UserProfile').then((m) => ({ default: m.UserProfile })));

const ROLE_MAPPING: Record<string, 'admin' | 'advisor' | 'guide' | 'client'> = {
  administrador: 'admin',
  admin: 'admin',
  asesor: 'advisor',
  advisor: 'advisor',
  'guía turístico': 'guide',
  'guia turistico': 'guide',
  'guía turistico': 'guide',
  'guía turística': 'guide',
  'guia turistica': 'guide',
  'guía': 'guide',
  guia: 'guide',
  guide: 'guide',
  cliente: 'client',
  client: 'client'
};

const FORCED_ADMIN_EMAIL = String(import.meta.env.VITE_FORCED_ADMIN_EMAIL || 'admin@occitours.com')
  .toLowerCase()
  .trim();

// Duración de sesión en minutos (timeout local en el cliente).
// Se puede sobrescribir con VITE_SESSION_TIMEOUT_MINUTES.
// Default: 7 días.
const DEFAULT_SESSION_TIMEOUT_MINUTES = 60 * 24 * 7;
const SESSION_TIMEOUT_MINUTES = (() => {
  const raw = Number(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES || DEFAULT_SESSION_TIMEOUT_MINUTES);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_SESSION_TIMEOUT_MINUTES;
})();

const setSessionExpiry = (minutes: number) => {
  const expiry = Date.now() + minutes * 60 * 1000;
  localStorage.setItem('session_expiry', expiry.toString());
};

const getSessionExpiry = () => {
  const expiryValue = Number(localStorage.getItem('session_expiry'));
  return Number.isFinite(expiryValue) && expiryValue > 0 ? expiryValue : null;
};

const isSessionExpired = () => {
  const expiry = getSessionExpiry();
  if (!expiry) return true;
  return Date.now() > expiry;
};

const enforceForcedAdminRole = (
  emailValue: unknown,
  currentRole: 'admin' | 'advisor' | 'guide' | 'client'
): 'admin' | 'advisor' | 'guide' | 'client' => {
  const email = String(emailValue || '').toLowerCase().trim();
  return email === FORCED_ADMIN_EMAIL ? 'admin' : currentRole;
};

const normalizeRole = (roleValue?: unknown): 'admin' | 'advisor' | 'guide' | 'client' => {
  const normalized = String(roleValue || '').toLowerCase().trim();
  const mapped = ROLE_MAPPING[normalized];
  if (mapped) return mapped;

  // Fallback tolerante: el backend a veces retorna nombres extendidos.
  if (normalized.includes('admin') || normalized.includes('administrador')) return 'admin';
  if (normalized.includes('asesor') || normalized.includes('advisor')) return 'advisor';
  if (normalized.includes('guia') || normalized.includes('guía') || normalized.includes('guide')) return 'guide';
  if (normalized.includes('cliente') || normalized.includes('client')) return 'client';

  return 'client';
};

const resolveRoleFromSources = (...sources: unknown[]): 'admin' | 'advisor' | 'guide' | 'client' => {
  for (const source of sources) {
    if (!source) continue;
    const normalized = normalizeRole(source);
    if (normalized !== 'client' || ['cliente', 'client'].includes(String(source).toLowerCase().trim())) {
      return normalized;
    }
  }
  return 'client';
};

const getRoleNameFromRoleId = async (roleId: unknown): Promise<string | null> => {
  const roleIdNumber = Number(roleId);
  if (!Number.isFinite(roleIdNumber) || roleIdNumber <= 0) return null;

  try {
    const response = await fetch(buildApiUrl(API_CONFIG.ROLES.GET_ALL), {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) return null;
    const rolesData = await response.json();
    const roles = Array.isArray(rolesData) ? rolesData : (rolesData?.data || []);
    const roleFound = roles.find((role: any) => Number(role?.id_roles) === roleIdNumber);
    return roleFound?.nombre || null;
  } catch {
    return null;
  }
};

const resolveRoleFromBackend = async (
  roleSources: unknown[],
  roleIdSources: unknown[]
): Promise<'admin' | 'advisor' | 'guide' | 'client'> => {
  const resolvedByName = resolveRoleFromSources(...roleSources);
  const explicitClient = roleSources.some((source) => {
    const value = String(source || '').toLowerCase().trim();
    return value === 'cliente' || value === 'client';
  });

  if (resolvedByName !== 'client' || explicitClient) {
    return resolvedByName;
  }

  for (const roleId of roleIdSources) {
    const roleName = await getRoleNameFromRoleId(roleId);
    if (!roleName) continue;
    const resolvedById = normalizeRole(roleName);
    if (resolvedById !== 'client') {
      return resolvedById;
    }
  }

  return resolvedByName;
};

// Mock authentication system (deprecated - now using real backend)
type MockUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  password: string;
};

const DEFAULT_MOCK_USERS: Record<string, MockUser> = {
  'admin@occitours.com': { id: '1', name: 'Administrador Principal', email: 'admin@occitours.com', role: 'admin', password: 'password123' },
  'asesor@occitours.com': { id: '2', name: 'Ana García Asesor', email: 'asesor@occitours.com', role: 'advisor', password: 'password123' },
  'guia@occitours.com': { id: '3', name: 'Carlos Ruiz Guía', email: 'guia@occitours.com', role: 'guide', password: 'password123' },
  'cliente@occitours.com': { id: '4', name: 'María López Cliente', email: 'cliente@occitours.com', role: 'client', password: 'password123' }
};

const mockAuth = {
  users: { ...DEFAULT_MOCK_USERS } as Record<string, MockUser>,

  // Load users from localStorage on init
  init() {
    const savedUsers = localStorage.getItem('occitours_users_auth');
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        // Only merge users that have a password field
        Object.keys(parsedUsers).forEach(email => {
          const user = parsedUsers[email];
          if (user && user.password) {
            this.users[email] = user;
          }
        });
      } catch (error) {
        console.error('Error loading saved users:', error);
        // Clear corrupted data
        localStorage.removeItem('occitours_users_auth');
      }
    }
    // Always save current users to ensure defaults are persisted
    this.saveUsers();
  },

  // Save users to localStorage
  saveUsers() {
    try {
      localStorage.setItem('occitours_users_auth', JSON.stringify(this.users));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  },

  // Debug function to check and fix user data
  debugUsers() {
    console.log('Current users:', this.users);
    const savedUsers = localStorage.getItem('occitours_users_auth');
    console.log('Saved users:', savedUsers ? JSON.parse(savedUsers) : 'None');
  },

  // Clean corrupted data and reset
  resetAuth() {
    localStorage.removeItem('occitours_users_auth');
    this.users = { ...DEFAULT_MOCK_USERS };
    this.saveUsers();
    console.log('Auth system reset successfully');
  },
  
  async login(email: string, password: string) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    const user = this.users[email as keyof typeof this.users];
    
    // Debug logging
    console.log('Login attempt:', { email, password, userExists: !!user, userPassword: user?.password });
    
    if (user && user.password === password) {
      const session = { access_token: `mock_token_${user.id}`, user };
      localStorage.setItem('occitours_session', JSON.stringify(session));
      return { user, session, error: null };
    }
    return { user: null, session: null, error: { message: 'Credenciales inválidas' } };
  },

  async register(name: string, email: string, password: string, role: string) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    // Check if user already exists
    if (this.users[email as keyof typeof this.users]) {
      return { user: null, error: { message: 'Ya existe una cuenta con este correo electrónico' } };
    }

    // Create new user with additional fields
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      role: role as 'admin' | 'advisor' | 'guide' | 'client',
      status: 'Activo',
      joinDate: new Date().toISOString().split('T')[0],
      phone: '',
      createdAt: new Date().toISOString()
    };

    // Add to users object
    this.users[email as keyof typeof this.users] = newUser;
    
    // Save to localStorage
    this.saveUsers();

    return { user: newUser, error: null };
  },

  // Get all users as array
  getAllUsers() {
    return Object.values(this.users);
  },

  // Update user role
  async updateUserRole(email: string, newRole: string) {
    const user = this.users[email as keyof typeof this.users];
    if (user) {
      user.role = newRole as 'admin' | 'advisor' | 'guide' | 'client';
      this.saveUsers();
      return { success: true };
    }
    return { success: false, error: 'Usuario no encontrado' };
  },
  
  async getSession() {
    const sessionStr = localStorage.getItem('occitours_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      return { session, error: null };
    }
    return { session: null, error: null };
  },
  
  async signOut() {
    localStorage.removeItem('occitours_session');
    return { error: null };
  }
};

// Initialize auth system and make available globally for debugging
mockAuth.init();
(window as any).mockAuth = mockAuth; // For debugging purposes
import { Toaster } from './components/ui/sonner';

// Context for authentication and user management
type LoginResult =
  | { success: true }
  | {
      success: false;
      code?: 'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' | 'SERVER_ERROR';
      message?: string;
    };

interface AuthContextType {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'advisor' | 'guide' | 'client';
    phone?: string;
    status?: string;
  } | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (
    nombre: string,
    apellido: string,
    email: string,
    password: string,
    role: string,
    telefono?: string,
    options?: { autoLogin?: boolean },
  ) => Promise<{ success: boolean; error?: string }>;
  registerPending: (payload: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    telefono?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (payload: { email: string; code: string }) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordRecovery: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (payload: { email: string; token: string; newPassword: string }) => Promise<{
    success: boolean;
    error?: string;
    code?: string;
    message?: string;
  }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateCurrentUser: (updates: Partial<NonNullable<AuthContextType['user']>>) => void;
  authFlags: {
    useEmailVerificationFlow: boolean;
  };
  currentView: string;
  setCurrentView: (view: string) => void;
  loading: boolean;
  getAllUsers: () => any[];
  updateUserRole: (email: string, newRole: string) => Promise<{ success: boolean; error?: string }>;
  adminActiveTab: string;
  setAdminActiveTab: (tab: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default function App() {
  const hasBackendToken = Boolean(localStorage.getItem('token'));
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [currentView, setCurrentView] = useState('home');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [authEmailDraft, setAuthEmailDraft] = useState('');
  const [pendingRegisterPassword, setPendingRegisterPassword] = useState('');
  const [resetTokenDraft, setResetTokenDraft] = useState('');
  const [adminActiveTab, setAdminActiveTab] = useState('dashboard');

  const useEmailVerificationFlow = String(import.meta.env.VITE_AUTH_USE_EMAIL_VERIFICATION || '').toLowerCase() === 'true';

  // Check for existing session on app load
  useEffect(() => {
    checkSession();
  }, []);

  // Si alguna llamada devuelve 401, validamos token con /api/auth/profile.
  // Solo hacemos logout si /profile también retorna 401.
  useEffect(() => {
    let isHandling = false;

    const handler = async () => {
      if (isHandling) return;
      isHandling = true;
      try {
        await refreshProfile();
        // Si refreshProfile limpió el token (401), terminamos sesión.
        if (!localStorage.getItem('token')) {
          logout();
        }
      } finally {
        isHandling = false;
      }
    };

    window.addEventListener('occitours:auth-401', handler as unknown as EventListener);
    return () => window.removeEventListener('occitours:auth-401', handler as unknown as EventListener);
  }, []);

  // Si llega un link de recuperación con token+email, mostrar reset password sin romper el resto del flujo.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('token');
      const email = url.searchParams.get('email');

      const pathWantsReset = url.pathname.toLowerCase().includes('reset-password');
      const hasResetParams = Boolean(token && email);

      if (pathWantsReset || hasResetParams) {
        setAuthEmailDraft(email || '');
        setResetTokenDraft(token || '');
        setShowResetPassword(true);
        setShowLogin(false);
        setShowRegister(false);
        setShowForgotPassword(false);
        setShowVerifyEmail(false);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    if (user.email.toLowerCase().trim() === FORCED_ADMIN_EMAIL && user.role !== 'admin') {
      setUser(prev => (prev ? { ...prev, role: 'admin' } : prev));
    }
  }, [user]);

  const checkSession = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Verificar token con el backend usando /api/auth/profile
        const response = await fetch(buildApiUrl(API_CONFIG.AUTH.PROFILE), {
          method: 'GET',
          headers: getAuthHeaders()
        });

        if (response.ok) {
          const data = await response.json();

          const tokenPayload = decodeJWT(token);
          // El backend retorna { success: true, perfil: {...} }
          if (data.success && data.perfil) {
            const nombreCompleto = data.perfil.apellido 
              ? `${data.perfil.nombre} ${data.perfil.apellido}`
              : data.perfil.nombre || '';

            const resolvedEmail =
              data.perfil.correo ||
              data.perfil.email ||
              tokenPayload?.correo ||
              tokenPayload?.email ||
              '';

            const backendRoleSource =
              data.perfil.rol_nombre ||
              data.perfil.rol ||
              data.perfil.role ||
              tokenPayload?.rol_nombre ||
              tokenPayload?.rol ||
              tokenPayload?.role ||
              data.perfil.tipo_usuario;

            const backendRoleIdSources = [
              data.perfil.id_roles,
              data.perfil.id_rol,
              data.perfil.rol_id,
              tokenPayload?.id_roles,
              tokenPayload?.id_rol,
              tokenPayload?.rol_id
            ];

            const frontendRoleResolved = await resolveRoleFromBackend([backendRoleSource], backendRoleIdSources);
            const frontendRole = enforceForcedAdminRole(resolvedEmail, frontendRoleResolved);

            const mappedUser = {
              id: data.perfil.id_cliente?.toString() || data.perfil.id_empleado?.toString() || data.perfil.id_usuarios?.toString() || '',
              name: nombreCompleto,
              email: resolvedEmail,
              role: frontendRole, // Rol mapeado a inglés para el frontend
              phone: data.perfil.telefono || '',
              status: data.perfil.estado ? 'Activo' : 'Inactivo'
            };

            // Extender el timeout de sesión con cada carga de perfil válida.
            // Nota: evitamos que una expiración local previa bloquee restaurar sesión
            // si el backend todavía acepta el JWT.
            setSessionExpiry(SESSION_TIMEOUT_MINUTES);

            console.log('🔄 Sesión restaurada - Rol fuente backend:', backendRoleSource, '→ Rol frontend:', frontendRole);
            setUser(mappedUser);
          }
        } else {
          // Token inválido, limpiar localStorage
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const establishSession = async (
    token: string,
    email: string,
    authPayload?: { usuario?: Record<string, unknown> },
  ): Promise<LoginResult> => {
    if (!token) {
      return {
        success: false,
        code: 'SERVER_ERROR',
        message: 'No se recibió token de sesión',
      };
    }

    localStorage.setItem('token', token);
    setSessionExpiry(SESSION_TIMEOUT_MINUTES);
    debugToken();

    const tokenPayload = decodeJWT(token);
    const usuario = authPayload?.usuario;

    let mappedUser: AuthContextType['user'] = null;
    let frontendRole: 'admin' | 'advisor' | 'guide' | 'client' = 'client';

    try {
      const profileResponse = await fetch(buildApiUrl(API_CONFIG.AUTH.PROFILE), {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.success && profileData.perfil) {
          const nombreCompletoPerfil = profileData.perfil.apellido
            ? `${profileData.perfil.nombre} ${profileData.perfil.apellido}`
            : profileData.perfil.nombre || '';

          const backendRoleSource =
            profileData.perfil.rol_nombre ||
            profileData.perfil.rol ||
            profileData.perfil.role ||
            tokenPayload?.rol_nombre ||
            tokenPayload?.rol ||
            tokenPayload?.role ||
            profileData.perfil.tipo_usuario;

          const backendRoleIdSources = [
            profileData.perfil.id_roles,
            profileData.perfil.id_rol,
            profileData.perfil.rol_id,
            tokenPayload?.id_roles,
            tokenPayload?.id_rol,
            tokenPayload?.rol_id,
          ];

          frontendRole = enforceForcedAdminRole(
            profileData.perfil.correo || tokenPayload?.correo || tokenPayload?.email || email,
            await resolveRoleFromBackend([backendRoleSource], backendRoleIdSources),
          );

          mappedUser = {
            id:
              profileData.perfil.id_cliente?.toString() ||
              profileData.perfil.id_empleado?.toString() ||
              profileData.perfil.id_usuarios?.toString() ||
              '',
            name: nombreCompletoPerfil,
            email: profileData.perfil.correo || email,
            role: frontendRole,
            phone: profileData.perfil.telefono || '',
            status: profileData.perfil.estado ? 'Activo' : 'Inactivo',
            tipo_documento:
              profileData.perfil.tipo_documento || profileData.perfil.tipoDocumento || '',
            numero_documento:
              profileData.perfil.numero_documento || profileData.perfil.numeroDocumento || '',
          };
        }
      }
    } catch (profileError) {
      console.warn('⚠️ No se pudo hidratar perfil desde /profile', profileError);
    }

    if (!mappedUser && usuario) {
      const u = usuario as Record<string, unknown>;
      const nombreCompleto = u.apellido
        ? `${u.nombre || ''} ${u.apellido}`.trim()
        : String(u.nombre || '');

      const backendRoleSource =
        u.rol_nombre || u.rol || u.role || tokenPayload?.rol_nombre || tokenPayload?.rol;

      frontendRole = enforceForcedAdminRole(
        String(u.correo || u.email || email),
        await resolveRoleFromBackend([backendRoleSource], [
          u.id_roles,
          u.id_rol,
          tokenPayload?.id_roles,
          tokenPayload?.id_rol,
        ]),
      );

      mappedUser = {
        id: String(u.id ?? u.id_usuarios ?? u.id_cliente ?? ''),
        name: nombreCompleto,
        email: String(u.correo || u.email || email),
        role: frontendRole,
        phone: String(u.telefono || ''),
        status: u.estado ? 'Activo' : 'Inactivo',
      };
    }

    if (!mappedUser) {
      localStorage.removeItem('token');
      localStorage.removeItem('session_expiry');
      return {
        success: false,
        code: 'SERVER_ERROR',
        message: 'No se pudo cargar el perfil del usuario',
      };
    }

    setUser(mappedUser);
    setShowLogin(false);
    setShowRegister(false);
    setShowVerifyEmail(false);
    setShowForgotPassword(false);
    setPendingRegisterPassword('');

    if (frontendRole === 'admin' || frontendRole === 'guide') {
      setCurrentView('dashboard');
    } else {
      setCurrentView('profile');
    }

    return { success: true };
  };

  // Backend authentication function
  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      console.log('🔐 Intentando login con:', { correo: email });
      
      const response = await fetch(buildApiUrl(API_CONFIG.AUTH.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correo: email,
          contrasena: password
        })
      });

      const data = await response.json();
      
      console.log('📡 Respuesta del servidor:', {
        status: response.status,
        ok: response.ok,
        data: data
      });

      if (!response.ok) {
        console.error('❌ Login failed:', data);
        localStorage.removeItem('token');
        localStorage.removeItem('session_expiry');
        setUser(null);

        if (response.status === 403 && String(data?.error || '').toLowerCase().includes('no verificado')) {
          return {
            success: false,
            code: 'EMAIL_NOT_VERIFIED',
            message: data?.message || 'Debes verificar tu correo electrónico para iniciar sesión'
          };
        }

        if (response.status === 401) {
          return {
            success: false,
            code: 'INVALID_CREDENTIALS',
            message: data?.message || 'Correo o contraseña incorrectos'
          };
        }

        return {
          success: false,
          code: 'SERVER_ERROR',
          message: data?.message || data?.error || 'Error al iniciar sesión'
        };
      }

      // Guardar token
      localStorage.setItem('token', data.token);
      setSessionExpiry(SESSION_TIMEOUT_MINUTES);

      // Debug: Mostrar contenido del token
      console.log('🔐 Token guardado, decodificando...');
      debugToken();

      const tokenPayload = decodeJWT(data.token);

      let mappedUser;
      let frontendRole: 'admin' | 'advisor' | 'guide' | 'client' = 'client';

      try {
        const profileResponse = await fetch(buildApiUrl(API_CONFIG.AUTH.PROFILE), {
          method: 'GET',
          headers: getAuthHeaders()
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.success && profileData.perfil) {
            const nombreCompletoPerfil = profileData.perfil.apellido
              ? `${profileData.perfil.nombre} ${profileData.perfil.apellido}`
              : profileData.perfil.nombre || '';

            const backendRoleSource =
              profileData.perfil.rol_nombre ||
              profileData.perfil.rol ||
              profileData.perfil.role ||
              tokenPayload?.rol_nombre ||
              tokenPayload?.rol ||
              tokenPayload?.role ||
              profileData.perfil.tipo_usuario;

            const backendRoleIdSources = [
              profileData.perfil.id_roles,
              profileData.perfil.id_rol,
              profileData.perfil.rol_id,
              tokenPayload?.id_roles,
              tokenPayload?.id_rol,
              tokenPayload?.rol_id
            ];

            frontendRole = enforceForcedAdminRole(
              profileData.perfil.correo || tokenPayload?.correo || tokenPayload?.email || email,
              await resolveRoleFromBackend([backendRoleSource], backendRoleIdSources)
            );

            mappedUser = {
              id: profileData.perfil.id_cliente?.toString() || profileData.perfil.id_empleado?.toString() || profileData.perfil.id_usuarios?.toString() || '',
              name: nombreCompletoPerfil,
              email: profileData.perfil.correo || email,
              role: frontendRole,
              phone: profileData.perfil.telefono || '',
              status: profileData.perfil.estado ? 'Activo' : 'Inactivo'
            };

            console.log('🔄 Rol desde /profile (BD):', backendRoleSource, '→', frontendRole);
          }
        }
      } catch (profileError) {
        console.warn('⚠️ No se pudo hidratar perfil desde /profile, usando fallback de /login', profileError);
      }

      if (!mappedUser) {
        const nombreCompleto = data.usuario?.apellido
          ? `${data.usuario.nombre} ${data.usuario.apellido}`
          : data.usuario?.nombre || '';

        const backendRoleSource =
          data.usuario?.rol_nombre ||
          data.usuario?.rol ||
          data.usuario?.role ||
          tokenPayload?.rol_nombre ||
          tokenPayload?.rol ||
          tokenPayload?.role ||
          data.usuario?.tipo_usuario;

        const backendRoleIdSources = [
          data.usuario?.id_roles,
          data.usuario?.id_rol,
          data.usuario?.rol_id,
          tokenPayload?.id_roles,
          tokenPayload?.id_rol,
          tokenPayload?.rol_id
        ];

        frontendRole = enforceForcedAdminRole(
          data.usuario?.correo || data.usuario?.email || tokenPayload?.correo || tokenPayload?.email || email,
          await resolveRoleFromBackend([backendRoleSource], backendRoleIdSources)
        );

        mappedUser = {
          id: data.usuario?.id?.toString() || '',
          name: nombreCompleto,
          email: data.usuario?.correo || data.usuario?.email || email,
          role: frontendRole,
          phone: data.usuario?.telefono || '',
          status: data.usuario?.estado || 'Activo'
        };

        console.log('🔄 Rol fallback desde /login:', backendRoleSource, '→', frontendRole);
      }

      console.log('👤 Usuario mapeado:', mappedUser);

      // Guardar usuario
      setUser(mappedUser);

      setShowLogin(false);
      setShowRegister(false);
      
      // Set default view based on role (ahora usando roles en inglés)
      if (frontendRole === 'admin' || frontendRole === 'guide') {
        setCurrentView('dashboard');
      } else {
        setCurrentView('profile');
      }

      return { success: true };

    } catch (error) {
      console.error('Error login:', error);
      localStorage.removeItem('token');
      setUser(null);
      return {
        success: false,
        code: 'SERVER_ERROR',
        message: 'Error del servidor. Intenta nuevamente.'
      };
    }
  };

  // Backend registration function
  const register = async (
    nombre: string,
    apellido: string,
    email: string,
    password: string,
    role: string,
    telefono?: string,
    options?: { autoLogin?: boolean },
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload: Record<string, string> = {
        nombre: String(nombre || '').trim(),
        apellido: String(apellido || '').trim(),
        correo: email,
        contrasena: password,
        rol: role,
      };
      const telefonoTrim = String(telefono || '').trim();
      if (telefonoTrim) payload.telefono = telefonoTrim;

      const response = await fetch(buildApiUrl(API_CONFIG.AUTH.REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        return { success: false, error: data.mensaje || data.message || data.error || 'Error al crear la cuenta' };
      }

      const shouldAutoLogin = options?.autoLogin !== false;
      if (!shouldAutoLogin) {
        return { success: true };
      }

      if (data?.token) {
        const sessionResult = await establishSession(data.token, email, { usuario: data.usuario });
        if (sessionResult.success) return { success: true };
        return {
          success: false,
          error: sessionResult.message || 'Cuenta creada, pero no se pudo iniciar sesión automáticamente',
        };
      }

      const loginResult = await login(email, password);
      if (loginResult.success) return { success: true };

      return {
        success: false,
        error:
          loginResult.message ||
          'Cuenta creada. Si no entras automáticamente, inicia sesión con tu correo y contraseña.',
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Error del servidor. Intenta nuevamente.' };
    }
  };

  const registerPending: AuthContextType['registerPending'] = async ({
    nombre,
    apellido,
    email,
    password,
    telefono,
  }) => {
    try {
      if (!String(nombre || '').trim() || !String(apellido || '').trim()) {
        return { success: false, error: 'Ingresa tu nombre y apellido' };
      }

      const payload: Record<string, string> = {
        nombre,
        apellido,
        correo: email,
        contrasena: password,
      };
      const telefonoTrim = String(telefono || '').trim();
      if (telefonoTrim) payload.telefono = telefonoTrim;

      const response = await fetch(buildApiUrl(API_CONFIG.AUTH.REGISTER_PENDING), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        return {
          success: false,
          error: data?.message || data?.error || 'No se pudo enviar el código de verificación'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('registerPending error:', error);
      return { success: false, error: 'Error del servidor. Intenta nuevamente.' };
    }
  };

  const verifyEmail: AuthContextType['verifyEmail'] = async ({ email, code }) => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.AUTH.VERIFY_EMAIL), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ correo: email, codigo: code })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          success: false,
          error: data?.message || data?.error || 'No se pudo verificar el correo'
        };
      }

      if (data?.token) {
        const sessionResult = await establishSession(data.token, email, { usuario: data.usuario });
        if (sessionResult.success) return { success: true };
        return {
          success: false,
          error: sessionResult.message || 'Correo verificado, pero no se pudo iniciar sesión',
        };
      }

      const passwordForLogin = pendingRegisterPassword;
      if (passwordForLogin) {
        setPendingRegisterPassword('');
        const loginResult = await login(email, passwordForLogin);
        if (loginResult.success) return { success: true };
        return {
          success: false,
          error:
            loginResult.message ||
            'Correo verificado. Inicia sesión con tu correo y contraseña.',
        };
      }

      return {
        success: false,
        error: 'Correo verificado. Inicia sesión con tu correo y contraseña.',
      };
    } catch (error) {
      console.error('verifyEmail error:', error);
      return { success: false, error: 'Error del servidor. Intenta nuevamente.' };
    }
  };

  const resendVerification: AuthContextType['resendVerification'] = async (email) => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.AUTH.RESEND_VERIFICATION), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ correo: email })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        return {
          success: false,
          error: data?.message || data?.error || 'No se pudo reenviar el código'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('resendVerification error:', error);
      return { success: false, error: 'Error del servidor. Intenta nuevamente.' };
    }
  };

  const requestPasswordRecovery: AuthContextType['requestPasswordRecovery'] = async (email) => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.AUTH.REQUEST_PASSWORD_RECOVERY), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ correo: email })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          success: false,
          error:
            data?.message ||
            data?.error ||
            (response.status === 404
              ? 'No encontramos una cuenta con ese correo. Revisa el texto o regístrate.'
              : 'No se pudo solicitar la recuperación. Intenta nuevamente.'),
        };
      }

      return { success: true, message: data?.message };
    } catch (error) {
      console.error('requestPasswordRecovery error:', error);
      return { success: false, error: 'Error del servidor. Intenta nuevamente.' };
    }
  };

  const resetPassword: AuthContextType['resetPassword'] = async ({ email, token, newPassword }) => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.AUTH.RESET_PASSWORD), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ correo: email, token, nuevaContrasena: newPassword })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        return {
          success: false,
          error: data?.message || data?.error || 'No se pudo restablecer la contraseña',
          code: data?.code,
          message: data?.message,
        };
      }

      return { success: true, message: data?.message };
    } catch (error) {
      console.error('resetPassword error:', error);
      return { success: false, error: 'Error del servidor. Intenta nuevamente.' };
    }
  };

  const logout = async () => {
    try {
      // Limpiar token y sesión
      localStorage.removeItem('token');
      localStorage.removeItem('session_expiry');
      setUser(null);
      setCurrentView('home');
      setShowLogin(false);
      setShowRegister(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(buildApiUrl(API_CONFIG.AUTH.PROFILE), {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('session_expiry');
        setUser(null);
        return;
      }

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (!data?.success || !data?.perfil) return;

      const tokenPayload = decodeJWT(token);
      const nombreCompleto = data.perfil.apellido
        ? `${data.perfil.nombre} ${data.perfil.apellido}`
        : data.perfil.nombre || '';

      const backendRoleSource =
        data.perfil.rol_nombre ||
        data.perfil.rol ||
        data.perfil.role ||
        tokenPayload?.rol_nombre ||
        tokenPayload?.rol ||
        tokenPayload?.role ||
        data.perfil.tipo_usuario;

      const backendRoleIdSources = [
        data.perfil.id_roles,
        data.perfil.id_rol,
        data.perfil.rol_id,
        tokenPayload?.id_roles,
        tokenPayload?.id_rol,
        tokenPayload?.rol_id
      ];

      const frontendRoleResolved = await resolveRoleFromBackend([backendRoleSource], backendRoleIdSources);
      const frontendRole = enforceForcedAdminRole(
        data.perfil.correo || tokenPayload?.correo || tokenPayload?.email,
        frontendRoleResolved
      );

      setSessionExpiry(SESSION_TIMEOUT_MINUTES);

      setUser({
        id: data.perfil.id_cliente?.toString() || data.perfil.id_empleado?.toString() || data.perfil.id_usuarios?.toString() || '',
        name: nombreCompleto,
        email: data.perfil.correo || '',
        role: frontendRole,
        phone: data.perfil.telefono || '',
        status: data.perfil.estado ? 'Activo' : 'Inactivo'
      });
    } catch (error) {
      console.error('refreshProfile error:', error);
    }
  };

  const updateCurrentUser = (updates: Partial<NonNullable<AuthContextType['user']>>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...updates };
      // Mantener enforcement admin por email
      const roleEnforced = enforceForcedAdminRole(merged.email, merged.role);
      return roleEnforced !== merged.role ? { ...merged, role: roleEnforced } : merged;
    });
  };

  // Auto logout si expira sesión local
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      if (!isSessionExpired()) return;

      // Si el expiry local se desincroniza, intentamos validar/rehidratar con el backend
      // antes de cerrar sesión (evita logout inesperado por session_expiry faltante/viejo).
      const token = localStorage.getItem('token');
      if (token) {
        refreshProfile()
          .then(() => {
            if (isSessionExpired()) {
              console.warn('Sesión expirada localmente. Cerrando sesión.');
              logout();
            }
          })
          .catch(() => {
            console.warn('No se pudo validar sesión con backend. Cerrando sesión.');
            logout();
          });
        return;
      }

      console.warn('Sesión expirada localmente. Cerrando sesión.');
      logout();
    }, 30 * 1000); // cada 30 segundos

    return () => clearInterval(intervalId);
  }, [user]);

  const handleViewChange = (view: string, itemId?: string) => {
    setCurrentView(view);
    if (itemId) {
      setSelectedItemId(itemId);
    }

    // Actividad del usuario: extender sesión local.
    if (user && localStorage.getItem('token')) {
      setSessionExpiry(SESSION_TIMEOUT_MINUTES);
    }
  };

  const handleShowLogin = () => {
    setShowLogin(true);
    setShowRegister(false);
  };

  // Helper functions for admin dashboard
  const getAllUsers = () => {
    // Esta función ahora debería ser asíncrona y hacer fetch al backend
    // Por ahora retorna un array vacío para evitar errores
    console.warn('getAllUsers debe migrar a usar el backend');
    return [];
  };

  const updateUserRole = async (email: string, newRole: string) => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.USERS.UPDATE_ROLE), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          correo: email,
          rol: newRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.mensaje || 'Error al actualizar el rol' };
      }

      return { success: true };
    } catch (error) {
      console.error('Update user role error:', error);
      return { success: false, error: 'Error del servidor' };
    }
  };

  const authValue: AuthContextType = {
    user,
    login,
    register,
    registerPending,
    verifyEmail,
    resendVerification,
    requestPasswordRecovery,
    resetPassword,
    logout,
    refreshProfile,
    updateCurrentUser,
    authFlags: {
      useEmailVerificationFlow
    },
    currentView,
    setCurrentView: handleViewChange,
    loading,
    getAllUsers,
    updateUserRole,
    adminActiveTab,
    setAdminActiveTab
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Mountain className="w-8 h-8 text-white" />
          </div>
          <p className="text-green-800">Cargando Occitours...</p>
        </div>
      </div>
    );
  }

  // Show auth forms when requested
  if (showLogin || showRegister || showForgotPassword || showVerifyEmail || showResetPassword) {
    return (
      <AuthContext.Provider value={authValue}>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
          {showResetPassword ? (
            <ResetPasswordForm
              initialEmail={authEmailDraft}
              initialToken={resetTokenDraft}
              onBackToLogin={() => {
                setShowResetPassword(false);
                setShowLogin(true);
                // Limpieza suave de token en la URL si venía por query
                try {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('token');
                  url.searchParams.delete('email');
                  window.history.replaceState({}, '', url.toString());
                } catch {
                  // ignore
                }
              }}
              onRequestNewRecovery={() => {
                setShowResetPassword(false);
                setShowForgotPassword(true);
                setResetTokenDraft('');
                try {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('token');
                  url.searchParams.delete('email');
                  window.history.replaceState({}, '', url.toString());
                } catch {
                  // ignore
                }
              }}
            />
          ) : showVerifyEmail ? (
            <VerifyEmailForm
              initialEmail={authEmailDraft}
              onBackToLogin={() => {
                setShowVerifyEmail(false);
                setShowLogin(true);
              }}
            />
          ) : showRegister ? (
            <RegisterForm
              onBackToLogin={() => {
                setShowRegister(false);
                setShowLogin(true);
              }}
              onShowVerifyEmail={(email, password) => {
                setAuthEmailDraft(email);
                setPendingRegisterPassword(password || '');
                setShowRegister(false);
                setShowVerifyEmail(true);
              }}
            />
          ) : showForgotPassword ? (
            <ForgotPasswordForm
              onBackToLogin={() => {
                setShowForgotPassword(false);
                setShowLogin(true);
              }}
            />
          ) : (
            <LoginForm
              onShowRegister={() => {
                setShowLogin(false);
                setShowRegister(true);
              }}
              onShowForgotPassword={() => {
                setShowLogin(false);
                setShowForgotPassword(true);
              }}
              onShowVerifyEmail={(email) => {
                setAuthEmailDraft(email);
                setPendingRegisterPassword('');
                setShowLogin(false);
                setShowVerifyEmail(true);
              }}
              onBackToHome={() => {
                setShowLogin(false);
                setShowRegister(false);
                setShowForgotPassword(false);
                setShowVerifyEmail(false);
                setShowResetPassword(false);
                setCurrentView('home');
              }}
            />
          )}
          <WhatsAppButton />
        </div>
      </AuthContext.Provider>
    );
  }

  const renderDashboard = () => {
    const normalizedRole = normalizeRole(user?.role || '');
    console.log('🎭 Rol del usuario:', { original: user?.role, normalizado: normalizedRole, usuario: user });

    switch (normalizedRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'advisor':
        return <AdvisorDashboard />;
      case 'guide':
        return <GuideDashboard />;
      case 'client':
        return <ClientDashboard />;
      default:
        console.error('❌ Rol no reconocido:', normalizedRole);
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Rol no reconocido</h2>
              <p>Rol actual: <strong>{user?.role}</strong></p>
              <p className="mt-2">Roles válidos: admin, advisor, guide, client</p>
              <button 
                onClick={logout}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        );
    }
  };

  const renderPublicView = () => {
    console.log('🖥️ Renderizando vista:', currentView, { user });
    switch (currentView) {
      case 'home':
        return <HomePage onViewChange={handleViewChange} />;
      case 'routes':
        return <RoutesPage onViewChange={handleViewChange} />;
      case 'route-detail':
        return <RouteDetailPage routeId={selectedItemId} onViewChange={handleViewChange} />;
      case 'farms':
        return <FarmsPage onViewChange={handleViewChange} />;
      case 'farm-detail':
        return <FarmDetailPage farmId={selectedItemId} onViewChange={handleViewChange} />;
      case 'programmed-booking':
        return <ProgrammedRouteBookingPage programacionId={selectedItemId} onViewChange={handleViewChange} />;
      case 'dashboard':
        return user ? renderDashboard() : <HomePage onViewChange={handleViewChange} />;
      default:
        return <HomePage onViewChange={handleViewChange} />;
    }
  };

  return (
    <AuthContext.Provider value={authValue}>
      <ServicesProvider
        enabled={hasBackendToken && !!user && (user.role === 'admin' || user.role === 'advisor' || user.role === 'guide')}
      >
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
        {user && (currentView === 'dashboard' || currentView === 'programming' || currentView === 'profile') ? (
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center text-gray-600">Cargando...</div>
            }
          >
            <Navigation />
            <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
              {currentView === 'dashboard' ? renderDashboard() : 
               currentView === 'programming' ? (
                 <div className="p-6">
                   <ProgrammingManagement 
                     role={user.role as 'admin' | 'advisor' | 'guide' | 'client'} 
                     userId={user.id}
                     userName={user.name}
                   />
                 </div>
               ) :
               currentView === 'profile' ? <UserProfile onClose={() => handleViewChange('dashboard')} /> : null}
            </main>
          </Suspense>
        ) : (currentView === 'home' || currentView === 'routes' || currentView === 'route-detail' || currentView === 'farms' || currentView === 'farm-detail' || currentView === 'programmed-booking') ? (
          <>
            <HeaderNavigation 
              currentView={currentView}
              onViewChange={handleViewChange}
              onLogin={handleShowLogin}
            />
            <main className="pt-16 min-h-screen">
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center text-gray-600">Cargando...</div>
                }
              >
                {renderPublicView()}
              </Suspense>
            </main>
            <WhatsAppButton />
          </>
        ) : (
          <>
            <PublicNavigation 
              currentView={currentView}
              onViewChange={handleViewChange}
              onLogin={handleShowLogin}
            />
            <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center text-gray-600">Cargando...</div>
                }
              >
                {renderPublicView()}
              </Suspense>
            </main>
          </>
        )}
        <Toaster />
        </div>
      </ServicesProvider>
    </AuthContext.Provider>
  );
}