import React, { useState } from 'react';
import { Mountain, Mail, Lock, User, UserCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../App';

interface RegisterFormProps {
  onBackToLogin: () => void;
}

export function RegisterForm({ onBackToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('Todos los campos son obligatorios');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      // Siempre crear usuarios con rol 'client'
      const response = await register(formData.name, formData.email, formData.password, 'client');
      
      if (response.success) {
        setSuccess('¡Cuenta de cliente creada exitosamente! Ya puedes iniciar sesión.');
        setTimeout(() => {
          onBackToLogin();
        }, 2000);
      } else {
        setError(response.error || 'Error al crear la cuenta');
      }

    } catch (error) {
      console.error('Registration error:', error);
      setError('Error del servidor. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
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
        {/* Welcome Section */}
        <div className="text-white space-y-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <Mountain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Occitours</h1>
              <p className="text-green-100">Únete a nuestra comunidad</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl">Crea tu cuenta de cliente</h2>
            <p className="text-green-100 text-lg leading-relaxed">
              Únete a nuestra plataforma y comienza a explorar los paisajes más hermosos de Colombia.
              Crea tu cuenta de cliente para reservar tours increíbles.
            </p>
            
            <div className="grid grid-cols-1 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold mb-2">🌟 Como Cliente Podrás</h3>
                <ul className="text-sm text-green-100 space-y-1">
                  <li>• Explorar tours y rutas únicas</li>
                  <li>• Realizar reservas fácilmente</li>
                  <li>• Calificar experiencias</li>
                  <li>• Acceder a ofertas especiales</li>
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold mb-2">👨‍💼 ¿Eres Profesional del Turismo?</h3>
                <p className="text-sm text-green-100">Contacta al administrador para obtener permisos como guía o asesor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Register Form */}
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl text-green-800">Crear Cuenta de Cliente</CardTitle>
            <p className="text-muted-foreground">Completa el formulario para crear tu cuenta</p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-green-800">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Tu nombre completo"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-10 bg-white border-green-200 focus:border-green-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-green-800">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 bg-white border-green-200 focus:border-green-500"
                    required
                  />
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <UserCheck className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Tipo de Cuenta</span>
                </div>
                <p className="text-sm text-green-700">
                  Se creará una cuenta de <strong>Cliente</strong> que te permitirá reservar y disfrutar tours.
                </p>
                <p className="text-xs text-green-600 mt-2">
                  💡 El administrador puede cambiar tu rol más adelante si necesitas otros permisos.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-green-800">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 bg-white border-green-200 focus:border-green-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-green-800">Confirmar Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Repite tu contraseña"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
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
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>
            </form>

            <div className="pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={onBackToLogin}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Iniciar sesión
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}