import React, { useState, createContext, useContext, useEffect } from 'react';
import { Mountain, Users, Package, MapPin, CreditCard, User } from 'lucide-react';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { AdminDashboardWithDropdown as AdminDashboard } from './components/AdminDashboardWithDropdown';
import { AdvisorDashboardImproved as AdvisorDashboard } from './components/AdvisorDashboardImproved';
import { GuideDashboardImproved as GuideDashboard } from './components/GuideDashboardImproved';
import { ClientDashboardImproved as ClientDashboard } from './components/ClientDashboardImproved';
import { Navigation } from './components/Navigation';
import { PublicNavigation } from './components/PublicNavigation';
import { HeaderNavigation } from './components/HeaderNavigation';
import { HomePage } from './components/HomePage';
import { RoutesPage } from './components/RoutesPage';
import { RouteDetailPage } from './components/RouteDetailPage';
import { FarmsPage } from './components/FarmsPage';
import { FarmDetailPage } from './components/FarmDetailPage';
import { PackagesPage } from './components/PackagesPage';
import { PackageDetailPage } from './components/PackageDetailPage';
import { UserProfile } from './components/UserProfile';
import { ProgrammingManagement } from './components/ProgrammingManagement';
import { WhatsAppButton } from './components/WhatsAppButton';
import { ServicesProvider } from './hooks/useServices';
// Mock authentication system
const mockAuth = {
  users: {
    'admin@occitours.com': { id: '1', name: 'Administrador Principal', email: 'admin@occitours.com', role: 'admin', password: 'password123' },
    'asesor@occitours.com': { id: '2', name: 'Ana García Asesor', email: 'asesor@occitours.com', role: 'advisor', password: 'password123' },
    'guia@occitours.com': { id: '3', name: 'Carlos Ruiz Guía', email: 'guia@occitours.com', role: 'guide', password: 'password123' },
    'cliente@occitours.com': { id: '4', name: 'María López Cliente', email: 'cliente@occitours.com', role: 'client', password: 'password123' }
  },

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
    this.users = {
      'admin@occitours.com': { id: '1', name: 'Administrador Principal', email: 'admin@occitours.com', role: 'admin', password: 'password123' },
      'asesor@occitours.com': { id: '2', name: 'Ana García Asesor', email: 'asesor@occitours.com', role: 'advisor', password: 'password123' },
      'guia@occitours.com': { id: '3', name: 'Carlos Ruiz Guía', email: 'guia@occitours.com', role: 'guide', password: 'password123' },
      'cliente@occitours.com': { id: '4', name: 'María López Cliente', email: 'cliente@occitours.com', role: 'client', password: 'password123' }
    };
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
interface AuthContextType {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'advisor' | 'guide' | 'client';
    phone?: string;
    status?: string;
  } | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
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
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [currentView, setCurrentView] = useState('home');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState('dashboard');

  // Check for existing session on app load
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { session } = await mockAuth.getSession();
      if (session?.access_token && session.user) {
        setUser(session.user);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock authentication function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await mockAuth.login(email, password);
      
      if (response.user && !response.error) {
        setUser(response.user);
        setShowLogin(false);
        setShowRegister(false);
        // Set default view based on role
        if (response.user.role === 'advisor' || response.user.role === 'guide' || response.user.role === 'client') {
          setCurrentView('profile');
        } else {
          setCurrentView('dashboard');
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Mock registration function
  const register = async (name: string, email: string, password: string, role: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await mockAuth.register(name, email, password, role);
      
      if (response.user && !response.error) {
        return { success: true };
      }
      return { success: false, error: response.error?.message || 'Error al crear la cuenta' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Error del servidor. Intenta nuevamente.' };
    }
  };

  const logout = async () => {
    try {
      await mockAuth.signOut();
      setUser(null);
      setCurrentView('home');
      setShowLogin(false);
      setShowRegister(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleViewChange = (view: string, itemId?: string) => {
    setCurrentView(view);
    if (itemId) {
      setSelectedItemId(itemId);
    }
  };

  const handleShowLogin = () => {
    setShowLogin(true);
    setShowRegister(false);
  };

  // Helper functions for admin dashboard
  const getAllUsers = () => {
    return mockAuth.getAllUsers();
  };

  const updateUserRole = async (email: string, newRole: string) => {
    try {
      const response = await mockAuth.updateUserRole(email, newRole);
      return response;
    } catch (error) {
      console.error('Update user role error:', error);
      return { success: false, error: 'Error del servidor' };
    }
  };

  const authValue: AuthContextType = {
    user,
    login,
    register,
    logout,
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

  // Show login/register forms when requested
  if (showLogin || showRegister || showForgotPassword) {
    return (
      <AuthContext.Provider value={authValue}>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
          {showRegister ? (
            <RegisterForm onBackToLogin={() => {
              setShowRegister(false);
              setShowLogin(true);
            }} />
          ) : showForgotPassword ? (
            <ForgotPasswordForm onBackToLogin={() => {
              setShowForgotPassword(false);
              setShowLogin(true);
            }} />
          ) : (
            <LoginForm onShowRegister={() => {
              setShowLogin(false);
              setShowRegister(true);
            }} onShowForgotPassword={() => {
              setShowLogin(false);
              setShowForgotPassword(true);
            }} onBackToHome={() => {
              setShowLogin(false);
              setShowRegister(false);
              setCurrentView('home');
            }} />
          )}
          <WhatsAppButton />
        </div>
      </AuthContext.Provider>
    );
  }

  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'advisor':
        return <AdvisorDashboard />;
      case 'guide':
        return <GuideDashboard />;
      case 'client':
        return <ClientDashboard />;
      default:
        return <div>Role no reconocido</div>;
    }
  };

  const renderPublicView = () => {
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
      case 'dashboard':
        return user ? renderDashboard() : <HomePage onViewChange={handleViewChange} />;
      default:
        return <HomePage onViewChange={handleViewChange} />;
    }
  };

  return (
    <AuthContext.Provider value={authValue}>
      <ServicesProvider>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
        {user && (currentView === 'dashboard' || currentView === 'programming' || currentView === 'profile') ? (
          <>
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
          </>
        ) : (currentView === 'home' || currentView === 'routes' || currentView === 'route-detail' || currentView === 'farms' || currentView === 'farm-detail') ? (
          <>
            <HeaderNavigation 
              currentView={currentView}
              onViewChange={handleViewChange}
              onLogin={handleShowLogin}
            />
            <main className="pt-16 min-h-screen">
              {renderPublicView()}
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
              {renderPublicView()}
            </main>
          </>
        )}
        <Toaster />
        </div>
      </ServicesProvider>
    </AuthContext.Provider>
  );
}