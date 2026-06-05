import React, { useEffect, useMemo, useState } from 'react';
import { Mountain, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../App';
import { authAPI } from '../services/api';

interface ResetPasswordFormProps {
  initialEmail?: string;
  initialToken?: string;
  onBackToLogin: () => void;
  onRequestNewRecovery: () => void;
}

type TokenLinkStatus = 'checking' | 'valid' | 'expired' | 'used' | 'invalid' | 'missing';

const isStrongPassword = (password: string) => {
  if (!password || password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*]/.test(password)) return false;
  return true;
};

const mapCodeToLinkStatus = (code?: string): TokenLinkStatus => {
  if (code === 'TOKEN_EXPIRADO') return 'expired';
  if (code === 'TOKEN_USADO') return 'used';
  return 'invalid';
};

export function ResetPasswordForm({
  initialEmail = '',
  initialToken = '',
  onBackToLogin,
  onRequestNewRecovery,
}: ResetPasswordFormProps) {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const token = initialToken;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Contraseña actualizada correctamente.');
  const [error, setError] = useState('');
  const [tokenLinkStatus, setTokenLinkStatus] = useState<TokenLinkStatus>('checking');
  const [tokenLinkMessage, setTokenLinkMessage] = useState('');

  const missingLinkParams = useMemo(() => {
    return !String(email || '').trim() || !String(token || '').trim();
  }, [email, token]);

  const canSubmit = useMemo(() => {
    return Boolean(
      tokenLinkStatus === 'valid' &&
        !missingLinkParams &&
        email.trim() &&
        token.trim() &&
        newPassword &&
        confirmPassword
    );
  }, [email, token, newPassword, confirmPassword, missingLinkParams, tokenLinkStatus]);

  useEffect(() => {
    const trimmedEmail = String(email || '').trim().toLowerCase();
    const trimmedToken = String(token || '').trim();

    if (!trimmedEmail || !trimmedToken) {
      setTokenLinkStatus('missing');
      setTokenLinkMessage(
        'Enlace inválido o incompleto. Vuelve a solicitar la recuperación desde «¿Olvidaste tu contraseña?».'
      );
      return;
    }

    let cancelled = false;

    const validateLink = async () => {
      setTokenLinkStatus('checking');
      setTokenLinkMessage('');

      const result = await authAPI.validarTokenRecuperacion(trimmedEmail, trimmedToken);
      if (cancelled) return;

      if (result.valid) {
        setTokenLinkStatus('valid');
        setTokenLinkMessage('');
        return;
      }

      const status = mapCodeToLinkStatus(result.code);
      setTokenLinkStatus(status);
      setTokenLinkMessage(result.message);
    };

    validateLink().catch(() => {
      if (!cancelled) {
        setTokenLinkStatus('invalid');
        setTokenLinkMessage('No se pudo verificar el enlace. Intenta de nuevo o solicita uno nuevo.');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [email, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedToken = token.trim();

    if (!trimmedEmail || !trimmedToken) {
      setError('El enlace de recuperación no es válido. Solicita uno nuevo.');
      setIsLoading(false);
      return;
    }

    if (tokenLinkStatus !== 'valid') {
      setError(tokenLinkMessage || 'El enlace ya no está disponible. Solicita uno nuevo.');
      setIsLoading(false);
      return;
    }

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
      setSuccessMessage(result.message || 'Contraseña actualizada correctamente.');
      setIsSuccess(true);
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('email');
        window.history.replaceState({}, '', url.toString());
      } catch {
        // ignore
      }
    } else {
      const linkStatus = mapCodeToLinkStatus(result.code);
      if (linkStatus !== 'invalid' || result.code) {
        setTokenLinkStatus(linkStatus);
        setTokenLinkMessage(result.error || result.message || '');
      }
      setError(result.error || 'No se pudo restablecer la contraseña');
    }

    setIsLoading(false);
  };

  const renderTokenBlockedCard = (title: string, variant: 'amber' | 'red') => {
    const border = variant === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50';
    const text = variant === 'amber' ? 'text-amber-800' : 'text-red-700';

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1635148040718-acf281233b8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMG5hdHVyZXxlbnwxfHx8fDE3NTY5NDQxMTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Paisaje montañoso"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/70 via-blue-900/70 to-emerald-900/70"></div>
        </div>

        <Card className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-2 text-center pb-4">
            <div className="flex justify-center mb-2">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${variant === 'amber' ? 'bg-amber-100' : 'bg-red-100'}`}>
                <AlertCircle className={`w-8 h-8 ${variant === 'amber' ? 'text-amber-600' : 'text-red-600'}`} />
              </div>
            </div>
            <CardTitle className="text-xl text-green-800">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className={border}>
              <AlertDescription className={text}>{tokenLinkMessage}</AlertDescription>
            </Alert>
            <Button onClick={onRequestNewRecovery} className="w-full bg-green-600 hover:bg-green-700 text-white">
              Solicitar nuevo enlace
            </Button>
            <button
              onClick={onBackToLogin}
              className="flex items-center justify-center w-full text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio de sesión
            </button>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
            <p className="text-muted-foreground">{successMessage}</p>
            <p className="text-sm text-muted-foreground">Ya puedes iniciar sesión con tu nueva contraseña.</p>
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

  if (tokenLinkStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl p-8 text-center">
          <p className="text-green-800">Verificando enlace de recuperación...</p>
        </Card>
      </div>
    );
  }

  if (tokenLinkStatus === 'expired') {
    return renderTokenBlockedCard('Enlace expirado', 'amber');
  }

  if (tokenLinkStatus === 'used') {
    return renderTokenBlockedCard('Enlace ya utilizado', 'amber');
  }

  if (tokenLinkStatus === 'missing' || tokenLinkStatus === 'invalid') {
    return renderTokenBlockedCard('Enlace no válido', 'red');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1635148040718-acf281233b8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMG5hdHVyZXxlbnwxfHx8fDE3NTY5NDQxMTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Paisaje montañoso"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/70 via-blue-900/70 to-emerald-900/70"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
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
              Define una nueva contraseña para tu cuenta. Este enlace solo puede usarse una vez.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-6">
              <h3 className="font-semibold mb-2">🔒 Requisitos</h3>
              <p className="text-sm text-green-100">
                Mínimo 8 caracteres, incluye mayúscula, minúscula, número y carácter especial (!@#$%^&*).
              </p>
            </div>
          </div>
        </div>

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
                    readOnly={Boolean(initialEmail)}
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

            <div className="pt-4 border-t border-gray-200 space-y-2">
              <button
                type="button"
                onClick={onRequestNewRecovery}
                className="flex items-center justify-center w-full text-sm text-green-700 hover:text-green-800 font-medium transition-colors"
              >
                ¿Necesitas otro enlace?
              </button>
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
