import React, { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Users, Calendar, ChevronLeft, ChevronRight, Wifi, Coffee, TreePine, Music, UtensilsCrossed, UserCheck, Sparkles, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { FarmBookingModal } from './FarmBookingModal';
import { useAuth } from '../App';
import { fincasAPI, type Finca as BackendFinca } from '../services/api';
import { CATALOG_IMAGE_PLACEHOLDER } from '../utils/catalogPlaceholders';

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

const PRINCIPAL_STORAGE_IMAGE_RE = /\/principal\.(png|jpe?g|webp|gif|bmp)$/i;

function uniqueImageUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    const s = String(u || '').trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/** Misma prioridad que el API: `principal.*` primero si existe. */
function orderGalleryPrincipalFirst(urls: string[]): string[] {
  if (!urls.length) return urls;
  const i = urls.findIndex((u) => PRINCIPAL_STORAGE_IMAGE_RE.test(u));
  if (i <= 0) return urls;
  const principal = urls[i];
  return [principal, ...urls.slice(0, i), ...urls.slice(i + 1)];
}

type FarmDetailModel = {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  location: string;
  image: string;
  gallery: string[];
  services: string[];
  activities: string[];
  pricePerNight: number;
  maxGuests: number;
  amenities: string[];
};

function buildFarmDetail(finca: BackendFinca, galleryUrls: string[]): FarmDetailModel {
  const orderedGallery =
    galleryUrls.length > 0 ? galleryUrls : [finca.imagen_principal?.trim() || CATALOG_IMAGE_PLACEHOLDER];
  const image = orderedGallery[0] || CATALOG_IMAGE_PLACEHOLDER;
  const description =
    String(finca.descripcion || '').trim() ||
    'Los detalles de la estadía los confirma OCCITOUR junto al propietario al procesar tu reserva.';

  return {
    id: String(finca.id_finca),
    name: String(finca.nombre || `Finca #${finca.id_finca}`),
    description,
    shortDescription: description.slice(0, 160),
    location: String(finca.ubicacion || finca.direccion || '').trim() || 'Ubicación por confirmar',
    image,
    gallery: orderedGallery,
    services: [],
    activities: [],
    pricePerNight: Number(finca.precio_por_noche) || 0,
    maxGuests: Math.max(1, Number(finca.capacidad_personas) || 1),
    amenities: [],
  };
}

export function FarmDetailPage({ farmId, onViewChange }: FarmDetailPageProps) {
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [farm, setFarm] = useState<FarmDetailModel | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setFarm(null);
    setCurrentImageIndex(0);
    setLoadState('loading');

    const numericFarmId = Number(farmId);
    if (!Number.isFinite(numericFarmId) || numericFarmId <= 0) {
      setLoadState('error');
      return;
    }

    const loadFarm = async () => {
      try {
        const backendFarm = await fincasAPI.getById(numericFarmId);
        if (cancelled) return;
        if (!backendFarm) {
          setLoadState('error');
          return;
        }

        let imagenes: string[] = [];
        try {
          imagenes = await fincasAPI.getImagenes(numericFarmId);
        } catch {
          imagenes = [];
        }

        const orderedStorage = orderGalleryPrincipalFirst(uniqueImageUrls(imagenes));
        const principalFromStorage = orderedStorage.find((u) => PRINCIPAL_STORAGE_IMAGE_RE.test(u));
        const thumb = principalFromStorage || orderedStorage[0];

        const enriched = {
          ...backendFarm,
          imagen_principal: thumb || backendFarm.imagen_principal || undefined,
        };

        const gallery =
          orderedStorage.length > 0
            ? orderedStorage
            : orderGalleryPrincipalFirst(
                uniqueImageUrls(
                  enriched.imagen_principal ? [enriched.imagen_principal] : [CATALOG_IMAGE_PLACEHOLDER]
                )
              );

        const model = buildFarmDetail(enriched, gallery);
        setFarm(model);
        setLoadState('ready');
      } catch {
        if (!cancelled) {
          setFarm(null);
          setLoadState('error');
        }
      }
    };

    void loadFarm();

    return () => {
      cancelled = true;
    };
  }, [farmId]);

  const handleBookingClick = () => {
    if (!user) {
      onViewChange('home');
      setTimeout(() => {
        const loginButton = document.querySelector('[data-login-trigger]') as HTMLElement;
        if (loginButton) loginButton.click();
      }, 100);
      return;
    }
    setIsBookingModalOpen(true);
  };

  if (loadState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-sky-50/40 to-emerald-50 pt-20">
        <div className="text-center text-gray-600">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          Cargando finca…
        </div>
      </div>
    );
  }

  if (!farm || loadState === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-sky-50/40 to-emerald-50 pt-20">
        <div className="text-center">
          <h2 className="mb-4 text-2xl text-gray-800">Finca no encontrada</h2>
          <Button onClick={() => onViewChange('farms')}>Volver a fincas</Button>
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
            <div className="relative h-96 overflow-hidden rounded-lg">
              <ImageWithFallback
                src={farm.gallery[currentImageIndex]}
                alt={`${farm.name} - Imagen ${currentImageIndex + 1}`}
                loading={currentImageIndex === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="h-full w-full object-cover"
              />
              
              {farm.gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Foto anterior"
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    aria-label="Foto siguiente"
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {farm.gallery.map((_, index) => (
                      <button
                        type="button"
                        key={index}
                        aria-label={`Ir a la foto ${index + 1}`}
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

            {farm.gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {farm.gallery.map((src, index) => (
                  <button
                    type="button"
                    key={`${src}-${index}`}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-lg ring-2 transition-all ${
                      index === currentImageIndex ? 'ring-emerald-600 opacity-100' : 'ring-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <ImageWithFallback
                      src={src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
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
                    <span className="text-3xl font-semibold text-emerald-700">
                      {farm.pricePerNight > 0
                        ? `$${farm.pricePerNight.toLocaleString('es-CO')}`
                        : 'Consultar'}
                    </span>
                    {farm.pricePerNight > 0 && <span className="ml-2 text-gray-600">por noche</span>}
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    En catálogo
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
                  {farm.pricePerNight > 0
                    ? `Referencia por noche para hasta ${farm.maxGuests} personas.`
                    : 'El precio por noche lo cotiza OCCITOUR según fechas y ocupación.'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="mb-12 grid gap-8 lg:grid-cols-2">
          {farm.amenities.length > 0 && (
            <Card className="border-emerald-100/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">Comodidades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {farm.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-2 rounded-lg bg-gray-50 p-2">
                      {getAmenityIcon(amenity)}
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card
            className={`border-emerald-100/80 bg-emerald-50/40 shadow-sm ${farm.amenities.length === 0 ? 'lg:col-span-2' : ''}`}
          >
            <CardHeader>
              <CardTitle className="text-2xl text-gray-800">Antes de reservar</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-emerald-900/90">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">•</span>
                  <span>Horarios de llegada y salida los confirma el propietario u OCCITOUR al aprobar tu reserva.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">•</span>
                  <span>
                    El precio mostrado es referencial; pueden aplicar temporadas altas, fines de semana o festivos.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">•</span>
                  <span>Servicios opcionales del formulario son ejemplos; la cotización final puede variar.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl mb-2 text-gray-800">Todas las fotos</h2>
          <p className="text-sm text-gray-600 mb-6">
            {farm.gallery.length === 1
              ? 'Hay una foto en el álbum.'
              : `${farm.gallery.length} fotos en el álbum. Toca una miniatura para verla arriba.`}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {farm.gallery.map((img, index) => (
              <button
                type="button"
                key={`${img}-${index}`}
                onClick={() => {
                  setCurrentImageIndex(index);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`relative aspect-[4/3] overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  index === currentImageIndex ? 'border-emerald-600 ring-2 ring-emerald-200' : 'border-transparent'
                }`}
              >
                <ImageWithFallback
                  src={img}
                  alt={`${farm.name} — foto ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </button>
            ))}
          </div>
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
                      <span className="text-gray-600">Precio de la finca</span>
                      <span className="font-medium text-gray-800">
                        {farm.pricePerNight > 0
                          ? `$${farm.pricePerNight.toLocaleString('es-CO')}`
                          : 'Por cotizar'}
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
                        $
                        {(
                          (farm.pricePerNight > 0 ? farm.pricePerNight : 0) +
                          selectedServices.reduce((total, serviceId) => {
                            const service = additionalServices.find((s) => s.id === serviceId);
                            return total + (service?.price || 0);
                          }, 0)
                        ).toLocaleString('es-CO')}
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