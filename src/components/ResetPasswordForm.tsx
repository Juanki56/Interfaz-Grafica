import React, { useMemo, useState } from 'react';
import { Mountain, Mail, KeyRound, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../App';

interface ResetPasswordFormProps {
  initialEmail?: string;
  initialToken?: string;
  onBackToLogin: () => void;
}

const isStrongPassword = (password: string) => {
  if (!password || password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*]/.test(password)) return false;
  return true;
};

export function ResetPasswordForm({ initialEmail = '', initialToken = '', onBackToLogin }: ResetPasswordFormProps) {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => {
    return Boolean(email.trim() && token.trim() && newPassword && confirmPassword);
  }, [email, token, newPassword, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedToken = token.trim();

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (!isStrongPassword(newPassword)) {
      setError('Contraseña débil: mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial (!@#$%^&*)');
      setIsLoading(false);
      return;
    }

    const result = await resetPassword({ email: trimmedEmail, token: trimmedToken, newPassword });
    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => onBackToLogin(), 1500);
    } else {
      setError(result.error || 'No se pudo restablecer la contraseña');
    }

    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1635148040718-acf281233b8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMG5hdHVyZXxlbnwxfHx8fDE3NTY5NDQxMTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Paisaje montañoso"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/70 via-blue-900/70 to-emerald-900/70"></div>
        </div>

        <Card className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-800">Contraseña actualizada</CardTitle>
            <p className="text-muted-foreground">Ya puedes iniciar sesión con tu nueva contraseña</p>
          </CardHeader>

          <CardContent>
            <Button onClick={onBackToLogin} className="w-full bg-green-600 hover:bg-green-700 text-white">
              Ir a iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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
        {/* Info Section */}
        <div className="text-white space-y-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <Mountain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Occitours</h1>
              <p className="text-green-100">Restablecer contraseña</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl">Crea una nueva contraseña</h2>
            <p className="text-green-100 text-lg leading-relaxed">
              Ingresa el token que recibiste en el correo y define una nueva contraseña para tu cuenta.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-6">
              <h3 className="font-semibold mb-2">🔒 Requisitos</h3>
              <p className="text-sm text-green-100">
                Mínimo 8 caracteres, incluye mayúscula, minúscula, número y carácter especial (!@#$%^&*).
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl text-green-800">Restablecer contraseña</CardTitle>
            <p className="text-muted-foreground">Completa los datos para continuar</p>
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
                <label className="text-sm text-green-800">Token</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Pega aquí el token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="pl-10 bg-white border-green-200 focus:border-green-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-green-800">Nueva contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <div className="space-y-2">
                <label className="text-sm text-green-800">Confirmar contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-white border-green-200 focus:border-green-500"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading || !canSubmit}
              >
                {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </form>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={onBackToLogin}
                className="flex items-center justify-center w-full text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio de sesión
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
