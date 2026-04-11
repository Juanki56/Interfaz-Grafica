import React, { useState } from 'react';
import { Mountain, Mail, KeyRound, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../App';

interface VerifyEmailFormProps {
  initialEmail?: string;
  onBackToLogin: () => void;
}

export function VerifyEmailForm({ initialEmail = '', onBackToLogin }: VerifyEmailFormProps) {
  const { verifyEmail, resendVerification } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    if (!trimmedEmail || !trimmedCode) {
      setError('Debes ingresar tu correo y el código.');
      setIsLoading(false);
      return;
    }

    const result = await verifyEmail({ email: trimmedEmail, code: trimmedCode });
    if (result.success) {
      setSuccess('Correo verificado exitosamente. Ya puedes iniciar sesión.');
      setTimeout(() => onBackToLogin(), 1500);
    } else {
      setError(result.error || 'No se pudo verificar el correo.');
    }

    setIsLoading(false);
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    setSuccess('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Ingresa tu correo para reenviar el código.');
      setIsResending(false);
      return;
    }

    const result = await resendVerification(trimmedEmail);
    if (result.success) {
      setSuccess('Código reenviado. Revisa tu correo.');
    } else {
      setError(result.error || 'No se pudo reenviar el código.');
    }

    setIsResending(false);
  };

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
              <p className="text-green-100">Verificación de correo</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl">Confirma tu cuenta</h2>
            <p className="text-green-100 text-lg leading-relaxed">
              Ingresa el código de 6 dígitos que enviamos a tu correo electrónico para activar tu cuenta.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-6">
              <h3 className="font-semibold mb-2">📩 Consejo</h3>
              <p className="text-sm text-green-100">Revisa también la carpeta de spam o no deseados.</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl text-green-800">Verificar correo</CardTitle>
            <p className="text-muted-foreground">Ingresa tu correo y el código</p>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleVerify} className="space-y-4">
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
                <label className="text-sm text-green-800">Código</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
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

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-600">{success}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Verificando...' : 'Verificar'}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full border-green-200 text-green-700 hover:bg-green-50"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? 'Reenviando...' : 'Reenviar código'}
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
