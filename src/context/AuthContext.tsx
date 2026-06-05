import { createContext, useContext } from 'react';

export type LoginResult =
  | { success: true }
  | {
      success: false;
      code?: 'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' | 'SERVER_ERROR';
      message?: string;
    };

export interface AuthContextType {
  user: {
    id: string;
    /** id_cliente en BD (cuando el rol es cliente). */
    clientId?: string;
    name: string;
    email: string;
    role: 'admin' | 'advisor' | 'guide' | 'client';
    phone?: string;
    status?: string;
    tipo_documento?: string;
    numero_documento?: string;
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
