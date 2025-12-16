import React, { useState } from 'react';
import { ArrowLeft, MapPin, Users, Calendar, ChevronLeft, ChevronRight, Wifi, Coffee, TreePine, Music, UtensilsCrossed, UserCheck, Sparkles, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getFarmById } from '../utils/mockData';
import { Checkbox } from './ui/checkbox';
import { FarmBookingModal } from './FarmBookingModal';
import { useAuth } from '../App';

interface FarmDetailPageProps {
  farmId: string;
  onViewChange: (view: string, itemId?: string) => void;
}

// Servicios adicionales disponibles
const additionalServices = [
  { id: 'dj', name: 'DJ', price: 500000, icon: Music },
  { id: 'banquete', name: 'Banquete', price: 800000, icon: UtensilsCrossed },
  { id: 'meseros', name: 'Meseros', price: 300000, icon: UserCheck },
  { id: 'decoracion', name: 'Decoración', price: 600000, icon: Sparkles },
];

export function FarmDetailPage({ farmId, onViewChange }: FarmDetailPageProps) {
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [activeGalleryTab, setActiveGalleryTab] = useState('principal');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const farm = getFarmById(farmId);

  const handleBookingClick = () => {
    if (!user) {
      // Redirect to login if user is not logged in
      onViewChange('home');
      // Show login modal after redirect
      setTimeout(() => {
        const loginButton = document.querySelector('[data-login-trigger]') as HTMLElement;
        if (loginButton) loginButton.click();
      }, 100);
      return;
    }
    setIsBookingModalOpen(true);
  };

  if (!farm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-gray-800 mb-4">Finca no encontrada</h2>
          <Button onClick={() => onViewChange('farms')}>
            Volver a Fincas
          </Button>
        </div>
      </div>
    );
  }

  const getAmenityIcon = (amenity: string) => {
    if (amenity.toLowerCase().includes('wifi')) return <Wifi className="w-5 h-5 text-green-600" />;
    if (amenity.toLowerCase().includes('cocina') || amenity.toLowerCase().includes('comida')) return <Coffee className="w-5 h-5 text-green-600" />;
    return <TreePine className="w-5 h-5 text-green-600" />;
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === farm.gallery.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? farm.gallery.length - 1 : prev - 1
    );
  };

  const handleServiceChange = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => onViewChange('farms')}
            className="text-gray-600 hover:text-green-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Fincas
          </Button>
        </div>

        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative h-96 rounded-lg overflow-hidden">
              <ImageWithFallback
                src={farm.gallery[currentImageIndex]}
                alt={`${farm.name} - Imagen ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {farm.gallery.length > 1 && (
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
                    {farm.gallery.map((_, index) => (
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
              
              <div className="absolute top-4 left-4">
                <Badge className="bg-green-600 text-white">
                  Finca
                </Badge>
              </div>
            </div>
          </div>

          {/* Farm Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl mb-4 text-gray-800">{farm.name}</h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                {farm.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Ubicación</p>
                  <p className="text-gray-800">{farm.location}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Capacidad</p>
                  <p className="text-gray-800">Hasta {farm.maxGuests} huéspedes</p>
                </div>
              </div>
            </div>

            {/* Price and Booking */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-3xl text-green-600">
                      ${farm.pricePerNight.toLocaleString()}
                    </span>
                    <span className="text-gray-600 ml-2">por noche</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Disponible
                  </Badge>
                </div>
                
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
                  onClick={handleBookingClick}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Reservar Estadía
                </Button>
                
                <p className="text-sm text-gray-600 mt-3 text-center">
                  Precio por noche para hasta {farm.maxGuests} personas
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Comodidades */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-800">Comodidades y Servicios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {farm.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                    {getAmenityIcon(amenity)}
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Información Importante */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-800">Información Importante</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-green-700 space-y-2">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Check-in: 3:00 PM - Check-out: 11:00 AM</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Todas las comidas pueden ser preparadas con ingredientes locales</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Se permite la participación en actividades de la finca</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Ideal para familias y grupos que buscan tranquilidad</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Gallery Section - Different Areas */}
        <div className="mb-12">
          <h2 className="text-2xl mb-6 text-gray-800">Galería de la Finca</h2>
          <Tabs defaultValue="principal" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-white border border-green-200">
              <TabsTrigger value="principal" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Principal
              </TabsTrigger>
              <TabsTrigger value="piscina" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Piscina
              </TabsTrigger>
              <TabsTrigger value="sala" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Sala
              </TabsTrigger>
              <TabsTrigger value="terraza" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Terraza
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="principal">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {farm.gallery.slice(0, 3).map((img, index) => (
                  <div key={index} className="relative h-48 rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={img}
                      alt={`Vista principal ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="piscina">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {farm.gallery.slice(0, 3).map((img, index) => (
                  <div key={index} className="relative h-48 rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={img}
                      alt={`Piscina ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="sala">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {farm.gallery.slice(0, 3).map((img, index) => (
                  <div key={index} className="relative h-48 rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={img}
                      alt={`Sala ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="terraza">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {farm.gallery.slice(0, 3).map((img, index) => (
                  <div key={index} className="relative h-48 rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={img}
                      alt={`Terraza ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Additional Services Section */}
        <div className="mb-12">
          <h2 className="text-2xl mb-6 text-gray-800">Servicios Adicionales</h2>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Services Selection */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Selecciona los servicios que necesites</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {additionalServices.map(service => {
                    const ServiceIcon = service.icon;
                    const isSelected = selectedServices.includes(service.id);
                    
                    return (
                      <div 
                        key={service.id} 
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 bg-white hover:border-green-300'
                        }`}
                        onClick={() => handleServiceChange(service.id)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-lg ${
                            isSelected ? 'bg-green-600' : 'bg-gray-100'
                          }`}>
                            <ServiceIcon className={`w-6 h-6 ${
                              isSelected ? 'text-white' : 'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{service.name}</p>
                            <p className="text-sm text-gray-500">
                              ${service.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'border-green-600 bg-green-600' 
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Price Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4 border-2 border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-xl text-gray-800">Resumen de Costos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-gray-600">Precio de la Finca</span>
                      <span className="font-medium text-gray-800">
                        ${farm.pricePerNight.toLocaleString()}
                      </span>
                    </div>
                    
                    {selectedServices.length > 0 && (
                      <>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500 uppercase tracking-wide">
                            Servicios Adicionales:
                          </p>
                          {selectedServices.map(serviceId => {
                            const service = additionalServices.find(s => s.id === serviceId);
                            return service ? (
                              <div key={serviceId} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">{service.name}</span>
                                <span className="text-gray-700">
                                  ${service.price.toLocaleString()}
                                </span>
                              </div>
                            ) : null;
                          })}
                        </div>
                        <div className="border-t pt-3"></div>
                      </>
                    )}
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg text-gray-800">Total</span>
                      <span className="text-2xl text-green-600">
                        ${(
                          farm.pricePerNight + 
                          selectedServices.reduce((total, serviceId) => {
                            const service = additionalServices.find(s => s.id === serviceId);
                            return total + (service?.price || 0);
                          }, 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-lg py-6 mt-6"
                    onClick={handleBookingClick}
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Reservar Ahora
                  </Button>
                  
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Los precios pueden variar según la temporada
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Related Farms */}
        <div className="mt-16">
          <h2 className="text-2xl mb-6 text-gray-800">Otras Fincas Que Te Pueden Interesar</h2>
          <div className="text-center">
            <Button 
              variant="outline"
              onClick={() => onViewChange('farms')}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              Ver Todas las Fincas
            </Button>
          </div>
        </div>
      </div>
      {isBookingModalOpen && (
        <FarmBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          farm={farm}
          availableServices={additionalServices}
          selectedServices={selectedServices}
        />
      )}
    </div>
  );
}