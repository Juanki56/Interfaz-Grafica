import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, Check, Clock, MapPin, Star, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { TourBookingModal } from './TourBookingModal';
import { rutasAPI, type Ruta } from '../services/api';
import { useAuth } from '../App';

interface RouteDetailPageProps {
  routeId: string;
  onViewChange: (view: string, itemId?: string) => void;
}

const FALLBACK_ROUTE_IMAGE =
  'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1400&q=80';

function normalizeString(value: unknown): string {
  return String(value ?? '').trim();
}

function formatDurationDays(duracion_dias?: number | null): string {
  if (duracion_dias == null || Number.isNaN(Number(duracion_dias))) return '—';
  const days = Number(duracion_dias);
  return days === 1 ? '1 día' : `${days} días`;
}

export function RouteDetailPage({ routeId, onViewChange }: RouteDetailPageProps) {
  const { user } = useAuth();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const [route, setRoute] = useState<Ruta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const id = useMemo(() => Number(routeId), [routeId]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (Number.isNaN(id)) {
        setRoute(null);
        setIsLoading(false);
        setError('ID de ruta inválido');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await rutasAPI.getActivaById(id);
        if (cancelled) return;
        setRoute(data);
      } catch (e: any) {
        if (cancelled) return;
        setRoute(null);
        setError(e?.message || 'No se pudo cargar la ruta');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleBookingClick = () => {
    if (!user) {
      onViewChange('home');
      setTimeout(() => {
        const loginButton = document.querySelector('[data-login-trigger]') as HTMLElement;
        if (loginButton) loginButton.click();
      }, 100);
      return;
    }

    if (route?.estado === false) return;

    setIsBookingModalOpen(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Fácil':
        return 'bg-green-100 text-green-800';
      case 'Moderado':
        return 'bg-yellow-100 text-yellow-800';
      case 'Difícil':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 pt-20 flex items-center justify-center">
        <p className="text-gray-600">Cargando ruta…</p>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-gray-800 mb-2">Ruta no disponible</h2>
          {error && <p className="text-gray-600 mb-4">{error}</p>}
          <Button onClick={() => onViewChange('routes')}>Volver a Rutas</Button>
        </div>
      </div>
    );
  }

  const includedServices = route.servicios_predefinidos || [];
  const optionalServices = route.servicios_opcionales || [];

  const price = route.precio_base != null ? Number(route.precio_base) : null;
  const location = normalizeString(route.ubicacion) || '—';
  const difficulty = normalizeString(route.dificultad) || '—';
  const capacity = route.capacidad_maxima != null ? Number(route.capacidad_maxima) : null;

  const isAvailable = route.estado !== false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => onViewChange('routes')}
            className="text-gray-600 hover:text-green-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Rutas
          </Button>
        </div>

        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Image */}
          <div className="space-y-4">
            <div className="relative h-96 rounded-lg overflow-hidden">
              <ImageWithFallback
                src={route.imagen_url || FALLBACK_ROUTE_IMAGE}
                alt={route.nombre}
                className="w-full h-full object-cover"
              />

              <div className="absolute top-4 left-4 flex flex-col space-y-2">
                {route.destacado && <Badge className="bg-green-600 text-white">Destacado</Badge>}
                <Badge className={getDifficultyColor(difficulty)}>{difficulty}</Badge>
              </div>
            </div>
          </div>

          {/* Route Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl mb-4 text-gray-800">{route.nombre}</h1>
              <p className="text-xl text-gray-600 leading-relaxed">{normalizeString(route.descripcion) || '—'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Duración</p>
                  <p className="text-gray-800">{formatDurationDays(route.duracion_dias)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Grupo máximo</p>
                  <p className="text-gray-800">{capacity == null ? '—' : `${capacity} personas`}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Ubicación</p>
                  <p className="text-gray-800">{location}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Dificultad</p>
                  <p className="text-gray-800">{difficulty}</p>
                </div>
              </div>
            </div>

            {/* Price and Booking */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-3xl text-green-600">{price == null ? 'Consultar' : `$${price.toLocaleString()}`}</span>
                    <span className="text-gray-600 ml-2">por persona</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}
                  >
                    {isAvailable ? 'Disponible' : 'No disponible'}
                  </Badge>
                </div>

                <Button
                  onClick={handleBookingClick}
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
                  disabled={!isAvailable}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Reservar Ahora
                </Button>

                <p className="text-sm text-gray-600 mt-3 text-center">Cancelación gratuita hasta 24 horas antes</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Services */}
        <Tabs defaultValue="included" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="included">Servicios incluidos</TabsTrigger>
            <TabsTrigger value="optional">Servicios opcionales</TabsTrigger>
          </TabsList>

          <TabsContent value="included">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">Servicios predefinidos</CardTitle>
              </CardHeader>
              <CardContent>
                {includedServices.length === 0 ? (
                  <p className="text-gray-600">Esta ruta no tiene servicios predefinidos configurados.</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {includedServices.map((item, index) => (
                      <div key={item.id_ruta_servicio_predefinido ?? `${item.id_servicio}-${index}`} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-gray-800">
                            {item.servicio?.nombre || `Servicio #${item.id_servicio}`}
                            {item.requerido ? <span className="text-green-700"> (requerido)</span> : null}
                          </p>
                          <p className="text-sm text-gray-600">Cantidad: {item.cantidad_default}</p>
                          {item.servicio?.precio != null && (
                            <p className="text-sm text-gray-600">Precio: ${Number(item.servicio.precio).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optional">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">Servicios opcionales</CardTitle>
                <p className="text-gray-600 mt-2">Podrás agregarlos durante la reserva (si aplica).</p>
              </CardHeader>
              <CardContent>
                {optionalServices.length === 0 ? (
                  <p className="text-gray-600">Esta ruta no tiene servicios opcionales configurados.</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {optionalServices.map((item, index) => (
                      <div key={item.id_ruta_servicio_opcional ?? `${item.id_servicio}-${index}`} className="flex items-start space-x-3">
                        <div className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-gray-800">{item.servicio?.nombre || `Servicio #${item.id_servicio}`}</p>
                          <p className="text-sm text-gray-600">Cantidad sugerida: {item.cantidad_default}</p>
                          {item.servicio?.precio != null && (
                            <p className="text-sm text-gray-600">Precio: ${Number(item.servicio.precio).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Related Routes */}
        <div className="mt-16">
          <h2 className="text-2xl mb-6 text-gray-800">Otras Rutas Que Te Pueden Interesar</h2>
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => onViewChange('routes')}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              Ver Todas las Rutas
            </Button>
          </div>
        </div>
      </div>

      {/* Booking Modal (rutas: crea solicitud personalizada en backend) */}
      <TourBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        tour={{
          id: String(route.id_ruta),
          name: route.nombre,
          description: normalizeString(route.descripcion) || '—',
          price: price ?? 0,
          image: route.imagen_url || FALLBACK_ROUTE_IMAGE,
          duration: formatDurationDays(route.duracion_dias),
          difficulty,
          location,
          capacity: capacity ?? 0,
          rating: 4.8,
          reviews: 156,
        }}
        type="ruta"
        availableRestaurants={[]}
      />
    </div>
  );
}