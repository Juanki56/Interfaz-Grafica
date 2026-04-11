import React, { useState } from 'react';
import { Mountain, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion } from 'motion/react';
import { useAuth } from '../App';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const { requestPasswordRecovery } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const trimmedEmail = email.trim().toLowerCase();

    // Lógica segura: el backend responde success aunque el correo no exista.
    const result = await requestPasswordRecovery(trimmedEmail);
    if (result.success) {
      setIsSuccess(true);
    } else {
      setError(result.error || 'No se pudo enviar el correo de recuperación. Intenta nuevamente.');
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

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          <Card className="w-full bg-white/95 backdrop-blur-sm shadow-2xl">
            <CardHeader className="space-y-2 text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-800">¡Correo Enviado!</CardTitle>
              <p className="text-muted-foreground">
                Revisa tu bandeja de entrada
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <p className="text-sm text-green-800">
                  Hemos enviado las instrucciones de recuperación de contraseña a:
                </p>
                <p className="font-medium text-green-900">{email}</p>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>• Revisa tu bandeja de entrada y carpeta de spam</p>
                <p>• El enlace de recuperación expira en 24 horas</p>
                <p>• Si no recibes el correo, intenta de nuevo</p>
              </div>

              <Button
                onClick={onBackToLogin}
                className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
              >
                Volver al inicio de sesión
              </Button>
            </CardContent>
          </Card>
        </motion.div>
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
      >
        {/* Info Section */}
        <div className="text-white space-y-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <Mountain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl">Occitours</h1>
              <p className="text-green-100">Explora la naturaleza</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl">Recupera tu contraseña</h2>
            <p className="text-green-100 text-lg leading-relaxed">
              No te preocupes, te ayudaremos a recuperar el acceso a tu cuenta. 
              Ingresa tu correo electrónico y te enviaremos las instrucciones.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-6">
              <h3 className="font-semibold mb-2">🔒 Seguridad</h3>
              <p className="text-sm text-green-100">
                Tu información está protegida. Solo tú tendrás acceso al enlace de recuperación.
              </p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl text-green-800">Olvidé mi contraseña</CardTitle>
            <p className="text-muted-foreground">
              Ingresa tu correo electrónico registrado
            </p>
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

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar instrucciones'}
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
      </motion.div>
    </div>
  );
}
