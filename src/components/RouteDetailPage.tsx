import React, { useState } from 'react';
import { ArrowLeft, Clock, Users, MapPin, Star, Check, Calendar, ChevronLeft, ChevronRight, UtensilsCrossed, Coffee, Soup, Pizza } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { TourBookingModal } from './TourBookingModal';
import { getRouteById, getRestaurantsByRoute } from '../utils/mockData';
import { useAuth } from '../App';

interface RouteDetailPageProps {
  routeId: string;
  onViewChange: (view: string, itemId?: string) => void;
}

export function RouteDetailPage({ routeId, onViewChange }: RouteDetailPageProps) {
  const { user } = useAuth();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const route = getRouteById(routeId);
  const availableRestaurants = route ? getRestaurantsByRoute(route.id) : [];
  
  const handleBookingClick = () => {
    if (!user) {
      // Redirect to login if user is not logged in
      onViewChange('home');
      // Show login modal after redirect - this will be handled by App.tsx
      setTimeout(() => {
        const loginButton = document.querySelector('[data-login-trigger]') as HTMLElement;
        if (loginButton) loginButton.click();
      }, 100);
      return;
    }
    setIsBookingModalOpen(true);
  };

  if (!route) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-gray-800 mb-4">Ruta no encontrada</h2>
          <Button onClick={() => onViewChange('routes')}>
            Volver a Rutas
          </Button>
        </div>
      </div>
    );
  }

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

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === route.gallery.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? route.gallery.length - 1 : prev - 1
    );
  };

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
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative h-96 rounded-lg overflow-hidden">
              <ImageWithFallback
                src={route.gallery[currentImageIndex]}
                alt={`${route.name} - Imagen ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {route.gallery.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {route.gallery.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              
              <div className="absolute top-4 left-4 flex flex-col space-y-2">
                {route.featured && (
                  <Badge className="bg-green-600 text-white">
                    Destacado
                  </Badge>
                )}
                <Badge className={getDifficultyColor(route.difficulty)}>
                  {route.difficulty}
                </Badge>
              </div>
            </div>
            
            {/* Thumbnail Gallery */}
            {route.gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {route.gallery.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-20 rounded-lg overflow-hidden ${
                      index === currentImageIndex ? 'ring-2 ring-green-500' : ''
                    }`}
                  >
                    <ImageWithFallback
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Route Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl mb-4 text-gray-800">{route.name}</h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                {route.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Duración</p>
                  <p className="text-gray-800">{route.duration}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Grupo máximo</p>
                  <p className="text-gray-800">{route.maxGroupSize} personas</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Ubicación</p>
                  <p className="text-gray-800">{route.location}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Dificultad</p>
                  <p className="text-gray-800">{route.difficulty}</p>
                </div>
              </div>
            </div>

            {/* Price and Booking */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-3xl text-green-600">
                      ${route.price.toLocaleString()}
                    </span>
                    <span className="text-gray-600 ml-2">por persona</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Disponible
                  </Badge>
                </div>
                
                <Button 
                  onClick={handleBookingClick}
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Reservar Ahora
                </Button>
                
                <p className="text-sm text-gray-600 mt-3 text-center">
                  Cancelación gratuita hasta 24 horas antes
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Information */}
        <Tabs defaultValue="itinerary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="itinerary">Itinerario</TabsTrigger>
            <TabsTrigger value="includes">Incluye</TabsTrigger>
          </TabsList>
          
          <TabsContent value="itinerary">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">Itinerario Detallado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {route.itinerary.map((item, index) => (
                    <div key={index} className="flex space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600">{item.time}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg text-gray-800 mb-1">{item.activity}</h4>
                        <p className="text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="includes">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">Qué Incluye</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {route.includes.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-lg text-blue-800 mb-2">Importante</h4>
                  <ul className="text-blue-700 space-y-1 text-sm">
                    <li>• Recomendamos traer ropa cómoda y calzado deportivo</li>
                    <li>• La actividad está sujeta a condiciones climáticas</li>
                    <li>• Se requiere un mínimo de 4 personas para confirmar la salida</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Optional Restaurants Section */}
        {availableRestaurants.length > 0 && (
          <Card className="mt-8 border-emerald-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 text-emerald-600" />
                <CardTitle className="text-2xl text-gray-800">Servicios de Alimentación Opcionales</CardTitle>
              </div>
              <p className="text-gray-600 mt-2">
                Puedes agregar estos servicios de alimentación a tu reserva por un costo adicional
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableRestaurants.map((restaurant) => {
                  const getMealTypeIcon = (type: string) => {
                    switch(type) {
                      case 'desayuno': return Coffee;
                      case 'almuerzo': return Soup;
                      case 'refrigerio': return Pizza;
                      default: return UtensilsCrossed;
                    }
                  };
                  
                  const getMealTypeColor = (type: string) => {
                    switch(type) {
                      case 'desayuno': return 'bg-orange-100 text-orange-700 border-orange-200';
                      case 'almuerzo': return 'bg-green-100 text-green-700 border-green-200';
                      case 'refrigerio': return 'bg-blue-100 text-blue-700 border-blue-200';
                      default: return 'bg-gray-100 text-gray-700 border-gray-200';
                    }
                  };
                  
                  const MealIcon = getMealTypeIcon(restaurant.mealType);
                  
                  return (
                    <Card key={restaurant.id} className="border-2 hover:border-emerald-300 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-2 rounded-lg ${getMealTypeColor(restaurant.mealType)}`}>
                            <MealIcon className="w-5 h-5" />
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-emerald-600">
                              ${restaurant.price.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">por persona</p>
                          </div>
                        </div>
                        
                        <h4 className="text-gray-900 mb-1">{restaurant.name}</h4>
                        <Badge variant="secondary" className={getMealTypeColor(restaurant.mealType) + " mb-2"}>
                          {restaurant.mealType.charAt(0).toUpperCase() + restaurant.mealType.slice(1)}
                        </Badge>
                        
                        <p className="text-sm text-gray-600 mb-3">{restaurant.description}</p>
                        
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.floor(restaurant.rating)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-600 ml-1">{restaurant.rating}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-800">
                  <strong>💡 Nota:</strong> Estos servicios son opcionales. Podrás seleccionarlos durante el proceso de reserva y se agregarán al costo total de tu experiencia.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

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

      {/* Booking Modal */}
      <TourBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        tour={{
          id: route.id,
          name: route.name,
          description: route.description,
          price: route.price,
          image: route.image,
          duration: route.duration,
          difficulty: route.difficulty,
          location: route.location,
          capacity: route.maxGroupSize,
          rating: 4.8,
          reviews: 156
        }}
        type="ruta"
        availableRestaurants={availableRestaurants}
      />
    </div>
  );
}