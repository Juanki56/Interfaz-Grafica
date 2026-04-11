import React, { useState } from 'react';
import { Mountain, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LoginFormProps {
  onShowRegister: () => void;
  onShowForgotPassword: () => void;
  onShowVerifyEmail: (emailDraft: string) => void;
  onBackToHome?: () => void;
}

export function LoginForm({ onShowRegister, onShowForgotPassword, onShowVerifyEmail, onBackToHome }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loginCode, setLoginCode] = useState<'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' | 'SERVER_ERROR' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setLoginCode('');

    const result = await login(email, password);
    if (!result.success) {
      setLoginCode(result.code || 'SERVER_ERROR');
      setError(result.message || 'No se pudo iniciar sesión. Intenta nuevamente.');
    }
    setIsLoading(false);
  };

  const demoAccounts = [
    { email: 'admin@occitours.com', role: 'Administrador' },
    { email: 'asesor@occitours.com', role: 'Asesor' },
    { email: 'guia@occitours.com', role: 'Guía Turístico' },
    { email: 'cliente@occitours.com', role: 'Cliente' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Back to Home Button */}
      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="fixed top-6 left-6 z-20 flex items-center space-x-2 bg-white/90 hover:bg-white text-green-700 px-4 py-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al Inicio</span>
        </button>
      )}

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1635148040718-acf281233b8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMG5hdHVyZXxlbnwxfHx8fDE3NTY5NDQxMTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Paisaje montañoso"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/70 via-blue-900/70 to-emerald-900/70"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Welcome Section */}
        <div className="text-white space-y-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <Mountain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Occitours</h1>
              <p className="text-green-100">Explora la naturaleza</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl">Bienvenido a tu plataforma de turismo</h2>
            <p className="text-green-100 text-lg leading-relaxed">
              Descubre experiencias únicas en los paisajes más hermosos de Colombia. 
              Conectamos viajeros con aventuras auténticas en la naturaleza.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold mb-2">Tours Naturales</h3>
                <p className="text-sm text-green-100">Senderismo, avistamiento de aves y más</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold mb-2">Fincas Auténticas</h3>
                <p className="text-sm text-green-100">Experiencias rurales genuinas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl text-green-800">Iniciar Sesión</CardTitle>
            <p className="text-muted-foreground">Accede a tu cuenta de Occitours</p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-green-800">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white border-green-200 focus:border-green-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-green-800">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white border-green-200 focus:border-green-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
              )}

              {loginCode === 'EMAIL_NOT_VERIFIED' && (
                <button
                  type="button"
                  onClick={() => onShowVerifyEmail(email)}
                  className="text-xs text-center text-green-700 hover:text-green-800 hover:underline transition-all w-full"
                >
                  Verificar mi correo
                </button>
              )}

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-center text-gray-600 mb-1">
                ¿No tienes cuenta?{' '}
                <button
                  onClick={onShowRegister}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Regístrate aquí
                </button>
              </p>
              <p className="text-xs text-center text-green-700 mb-3">
                ✨ Crea tu cuenta como Cliente, Guía o Asesor
              </p>
              <button
                onClick={onShowForgotPassword}
                className="text-xs text-center text-green-600 hover:text-green-700 hover:underline transition-all w-full mb-3"
              >
                ¿Olvidaste tu contraseña?
              </button>

              <button
                type="button"
                onClick={() => onShowVerifyEmail(email)}
                className="text-xs text-center text-green-600 hover:text-green-700 hover:underline transition-all w-full mb-3"
              >
                ¿Ya tienes código? Verificar correo
              </button>
              
              <div className="pt-2">
                <p className="text-xs text-center text-gray-500 mb-3">Cuentas de demostración (contraseña: password123):</p>
                <div className="grid grid-cols-2 gap-2">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.email}
                      onClick={() => {
                        setEmail(account.email);
                        setPassword('password123');
                      }}
                      className="text-xs bg-gray-100 hover:bg-gray-200 p-2 rounded text-center transition-colors"
                    >
                      {account.role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}