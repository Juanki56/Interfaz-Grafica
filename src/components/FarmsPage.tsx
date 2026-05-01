import React, { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Users, Wifi, Coffee, TreePine, ChevronRight, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { mockFarms, Farm } from '../utils/mockData';
import { useAuth } from '../App';
import { fincasAPI, type Finca as BackendFinca } from '../services/api';

interface FarmsPageProps {
  onViewChange: (view: string, itemId?: string) => void;
}

const DEFAULT_FARM_IMAGE = 'https://images.unsplash.com/photo-1556235123-9538e0766731?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';
const DEFAULT_AMENITIES = ['Wifi', 'Zona verde', 'Cocina', 'Parqueadero'];

function mapBackendFarmToCard(finca: BackendFinca, fallback?: Farm): Farm {
  const image = finca.imagen_principal || fallback?.image || DEFAULT_FARM_IMAGE;
  const description = String(finca.descripcion || fallback?.description || 'Hospedaje rural disponible para reserva en OCCITOUR.');
  return {
    id: String(finca.id_finca),
    name: String(finca.nombre || fallback?.name || `Finca #${finca.id_finca}`),
    description,
    shortDescription: fallback?.shortDescription || description.slice(0, 140),
    location: String(finca.ubicacion || finca.direccion || fallback?.location || 'Ubicación por confirmar'),
    image,
    gallery: fallback?.gallery?.length ? fallback.gallery : [image],
    services: fallback?.services || [],
    activities: fallback?.activities || [],
    pricePerNight: Number(finca.precio_por_noche || fallback?.pricePerNight || 0),
    maxGuests: Number(finca.capacidad_personas || fallback?.maxGuests || 1),
    amenities: fallback?.amenities?.length ? fallback.amenities : DEFAULT_AMENITIES,
  };
}

export function FarmsPage({ onViewChange }: FarmsPageProps) {
  const { user } = useAuth();
  const [allFarms, setAllFarms] = useState<Farm[]>(mockFarms);
  const [filteredFarms, setFilteredFarms] = useState<Farm[]>(mockFarms);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  const handleNameFilter = (name: string) => {
    setNameFilter(name);
    applyFilters(name, priceFilter, locationFilter);
  };

  const handlePriceFilter = (price: string) => {
    setPriceFilter(price);
    applyFilters(nameFilter, price, locationFilter);
  };

  const handleLocationFilter = (location: string) => {
    setLocationFilter(location);
    applyFilters(nameFilter, priceFilter, location);
  };

  const applyFilters = (name: string, price: string, location: string, sourceFarms: Farm[] = allFarms) => {
    let filtered = [...sourceFarms];

    if (name) {
      filtered = filtered.filter(farm => 
        farm.name.toLowerCase().includes(name.toLowerCase()) ||
        farm.description.toLowerCase().includes(name.toLowerCase())
      );
    }

    if (price !== 'all') {
      if (price === 'low') {
        filtered = filtered.filter(farm => farm.pricePerNight < 130000);
      } else if (price === 'medium') {
        filtered = filtered.filter(farm => farm.pricePerNight >= 130000 && farm.pricePerNight < 160000);
      } else if (price === 'high') {
        filtered = filtered.filter(farm => farm.pricePerNight >= 160000);
      }
    }

    if (location !== 'all') {
      filtered = filtered.filter(farm => 
        farm.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    setFilteredFarms(filtered);
  };

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setAllFarms(mockFarms);
      applyFilters(nameFilter, priceFilter, locationFilter, mockFarms);
      return;
    }

    const loadFarms = async () => {
      try {
        const backendFarms = await fincasAPI.getAll();
        if (cancelled || !Array.isArray(backendFarms) || backendFarms.length === 0) return;

        const mapped = backendFarms.map((finca) => {
          const fallback = mockFarms.find((item) => String(item.id) === String(finca.id_finca));
          return mapBackendFarmToCard(finca, fallback);
        });

        setAllFarms(mapped);
        applyFilters(nameFilter, priceFilter, locationFilter, mapped);
      } catch {
        if (cancelled) return;
        setAllFarms(mockFarms);
        applyFilters(nameFilter, priceFilter, locationFilter, mockFarms);
      }
    };

    void loadFarms();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const getAmenityIcon = (amenity: string) => {
    if (amenity.toLowerCase().includes('wifi')) return <Wifi className="w-4 h-4" />;
    if (amenity.toLowerCase().includes('cocina') || amenity.toLowerCase().includes('comida')) return <Coffee className="w-4 h-4" />;
    return <TreePine className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 pt-20 relative">
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1556235123-9538e0766731?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjBmb3Jlc3QlMjBtb3VudGFpbnMlMjBibHVyfGVufDF8fHx8MTc2NTIxOTc4M3ww&ixlib=rb-4.1.0&q=80&w=1080)',
          filter: 'blur(4px)',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => onViewChange('home')}
              className="text-gray-600 hover:text-green-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Button>
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl mb-4 text-gray-800">Fincas y Hospedajes</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experimenta la auténtica vida rural en fincas cuidadosamente seleccionadas para tu comodidad y descanso
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg text-gray-800">Filtrar Fincas</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Buscar por nombre</label>
              <Input
                placeholder="Nombre de la finca..."
                value={nameFilter}
                onChange={(e) => handleNameFilter(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-2">Rango de Precio</label>
              <Select value={priceFilter} onValueChange={handlePriceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar precio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los precios</SelectItem>
                  <SelectItem value="low">Menos de $130,000</SelectItem>
                  <SelectItem value="medium">$130,000 - $160,000</SelectItem>
                  <SelectItem value="high">Más de $160,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">Zona o Lugar</label>
              <Select value={locationFilter} onValueChange={handleLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ubicaciones</SelectItem>
                  <SelectItem value="Zona Cafetera">Zona Cafetera</SelectItem>
                  <SelectItem value="Llanos Orientales">Llanos Orientales</SelectItem>
                  <SelectItem value="Bosque Andino">Bosque Andino</SelectItem>
                  <SelectItem value="Sabanas del Meta">Sabanas del Meta</SelectItem>
                  <SelectItem value="Valle del Cauca">Valle del Cauca</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Farms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredFarms.map((farm) => (
            <Card key={farm.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image */}
                <div className="relative h-64 md:h-full">
                  <ImageWithFallback
                    src={farm.image}
                    alt={farm.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-green-600 text-white">
                      Finca
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                      <span className="text-lg text-green-600">
                        ${farm.pricePerNight.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-600">/noche</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl mb-2 text-gray-800">{farm.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {farm.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{farm.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>Hasta {farm.maxGuests} huéspedes</span>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="mb-6">
                      <h4 className="text-sm text-gray-700 mb-2">Comodidades:</h4>
                      <div className="flex flex-wrap gap-2">
                        {farm.amenities.slice(0, 4).map((amenity, index) => (
                          <div key={index} className="flex items-center space-x-1 text-xs text-gray-600">
                            {getAmenityIcon(amenity)}
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => onViewChange('farm-detail', farm.id)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Ver Detalles
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl mb-6 text-gray-800 text-center">¿Por qué elegir nuestras fincas?</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TreePine className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg mb-2 text-gray-800">Experiencia Auténtica</h3>
              <p className="text-gray-600 text-sm">
                Vive como un local y participa en actividades tradicionales de la vida rural
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Coffee className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg mb-2 text-gray-800">Comida Casera</h3>
              <p className="text-gray-600 text-sm">
                Disfruta de deliciosas comidas típicas preparadas con ingredientes frescos locales
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Wifi className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg mb-2 text-gray-800">Comodidades Modernas</h3>
              <p className="text-gray-600 text-sm">
                Todas las fincas cuentan con servicios básicos y comodidades para tu confort
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg p-8 text-white text-center">
          <h2 className="text-2xl mb-4">¿Necesitas una experiencia personalizada?</h2>
          <p className="text-green-100 mb-6">
            Contáctanos para ayudarte a encontrar la finca perfecta para tu grupo y fechas específicas
          </p>
          <Button 
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-green-600"
          >
            Contactar Asesor
          </Button>
        </div>
      </div>
    </div>
  );
}