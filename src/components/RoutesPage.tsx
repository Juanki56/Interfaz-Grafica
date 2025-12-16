import React, { useState } from 'react';
import { ArrowLeft, Clock, Users, MapPin, Star, Filter, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { mockRoutes, Route } from '../utils/mockData';

interface RoutesPageProps {
  onViewChange: (view: string, itemId?: string) => void;
}

export function RoutesPage({ onViewChange }: RoutesPageProps) {
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>(mockRoutes);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  const handleDifficultyFilter = (difficulty: string) => {
    setDifficultyFilter(difficulty);
    applyFilters(difficulty, priceFilter, locationFilter);
  };

  const handlePriceFilter = (price: string) => {
    setPriceFilter(price);
    applyFilters(difficultyFilter, price, locationFilter);
  };

  const handleLocationFilter = (location: string) => {
    setLocationFilter(location);
    applyFilters(difficultyFilter, priceFilter, location);
  };

  const applyFilters = (difficulty: string, price: string, location: string) => {
    let filtered = [...mockRoutes];

    if (difficulty !== 'all') {
      filtered = filtered.filter(route => route.difficulty === difficulty);
    }

    if (price !== 'all') {
      if (price === 'low') {
        filtered = filtered.filter(route => route.price < 100000);
      } else if (price === 'medium') {
        filtered = filtered.filter(route => route.price >= 100000 && route.price < 150000);
      } else if (price === 'high') {
        filtered = filtered.filter(route => route.price >= 150000);
      }
    }

    if (location !== 'all') {
      filtered = filtered.filter(route => 
        route.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    setFilteredRoutes(filtered);
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
          <h1 className="text-4xl md:text-5xl mb-4 text-gray-800">Nuestras Rutas</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubre paisajes únicos a través de senderos cuidadosamente seleccionados para todas las aventuras
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg text-gray-800">Filtrar Rutas</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Municipio</label>
              <Select value={locationFilter} onValueChange={handleLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar municipio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los municipios</SelectItem>
                  <SelectItem value="Sopetrán">Sopetrán</SelectItem>
                  <SelectItem value="Santa Fe de Antioquia">Santa Fe de Antioquia</SelectItem>
                  <SelectItem value="San Jerónimo">San Jerónimo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-2">Dificultad</label>
              <Select value={difficultyFilter} onValueChange={handleDifficultyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar dificultad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las dificultades</SelectItem>
                  <SelectItem value="Fácil">Fácil</SelectItem>
                  <SelectItem value="Moderado">Moderado</SelectItem>
                  <SelectItem value="Difícil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-2">Rango de Precio</label>
              <Select value={priceFilter} onValueChange={handlePriceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar precio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los precios</SelectItem>
                  <SelectItem value="low">Menos de $100,000</SelectItem>
                  <SelectItem value="medium">$100,000 - $150,000</SelectItem>
                  <SelectItem value="high">Más de $150,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Routes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRoutes.map((route) => (
            <Card key={route.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative h-48">
                <ImageWithFallback
                  src={route.image}
                  alt={route.name}
                  className="w-full h-full object-cover"
                />
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
                <div className="absolute bottom-4 right-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                    <span className="text-lg text-green-600">
                      ${route.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-6">
                <h3 className="text-xl mb-2 text-gray-800">{route.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {route.shortDescription}
                </p>
                
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{route.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>Máx. {route.maxGroupSize}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500 col-span-2">
                    <MapPin className="w-4 h-4" />
                    <span>{route.location}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => onViewChange('route-detail', route.id)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Ver Detalles
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredRoutes.length === 0 && (
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl text-gray-600 mb-2">No se encontraron rutas</h3>
            <p className="text-gray-500 mb-4">
              Intenta ajustar los filtros para encontrar la ruta perfecta
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setDifficultyFilter('all');
                setPriceFilter('all');
                setLocationFilter('all');
                setFilteredRoutes(mockRoutes);
              }}
            >
              Limpiar Filtros
            </Button>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-2xl mb-4 text-gray-800">¿No encuentras lo que buscas?</h2>
          <p className="text-gray-600 mb-6">
            Contáctanos para crear una experiencia personalizada adaptada a tus necesidades
          </p>
          <Button 
            variant="outline"
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            Contactar Asesor
          </Button>
        </div>
      </div>
    </div>
  );
}