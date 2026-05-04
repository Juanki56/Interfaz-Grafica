import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Clock, Users, MapPin, Filter, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { rutasAPI, type Ruta } from '../services/api';
import { CATALOG_IMAGE_PLACEHOLDER } from '../utils/catalogPlaceholders';

interface RoutesPageProps {
  onViewChange: (view: string, itemId?: string) => void;
}

function normalizeString(value: unknown): string {
  return String(value ?? '').trim();
}

function formatDurationDays(duracion_dias?: number | null): string {
  if (duracion_dias == null || Number.isNaN(Number(duracion_dias))) return '—';
  const days = Number(duracion_dias);
  return days === 1 ? '1 día' : `${days} días`;
}

export function RoutesPage({ onViewChange }: RoutesPageProps) {
  const [routes, setRoutes] = useState<Ruta[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  const loadRoutes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await rutasAPI.getActivas();
      setRoutes(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'No se pudieron cargar las rutas');
      setRoutes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableLocations = useMemo(() => {
    const locations = routes
      .map((r) => normalizeString(r.ubicacion))
      .filter((v) => v.length > 0);
    return Array.from(new Set(locations)).sort((a, b) => a.localeCompare(b));
  }, [routes]);

  const availableDifficulties = useMemo(() => {
    const diffs = routes
      .map((r) => normalizeString(r.dificultad))
      .filter((v) => v.length > 0);
    return Array.from(new Set(diffs)).sort((a, b) => a.localeCompare(b));
  }, [routes]);

  const filteredRoutes = useMemo(() => {
    let filtered = [...routes];

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter((route) => normalizeString(route.dificultad) === difficultyFilter);
    }

    if (priceFilter !== 'all') {
      filtered = filtered.filter((route) => route.precio_base != null);

      if (priceFilter === 'low') {
        filtered = filtered.filter((route) => Number(route.precio_base) < 100000);
      } else if (priceFilter === 'medium') {
        filtered = filtered.filter(
          (route) => Number(route.precio_base) >= 100000 && Number(route.precio_base) < 150000
        );
      } else if (priceFilter === 'high') {
        filtered = filtered.filter((route) => Number(route.precio_base) >= 150000);
      }
    }

    if (locationFilter !== 'all') {
      filtered = filtered.filter((route) =>
        normalizeString(route.ubicacion).toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    return filtered;
  }, [routes, difficultyFilter, priceFilter, locationFilter]);

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

  const clearFilters = () => {
    setDifficultyFilter('all');
    setPriceFilter('all');
    setLocationFilter('all');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-green-50 via-sky-50/50 to-emerald-50 pt-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(167,243,208,0.35),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(186,230,253,0.35),transparent_45%)]"
        aria-hidden
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
              <label className="block text-sm text-gray-600 mb-2">Ubicación</label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {availableLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">Dificultad</label>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar dificultad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {availableDifficulties.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">Rango de Precio</label>
              <Select value={priceFilter} onValueChange={setPriceFilter}>
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

        {isLoading && (
          <div className="text-center py-16">
            <p className="text-gray-600">Cargando rutas…</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center py-16">
            <h3 className="text-xl text-gray-800 mb-2">No se pudieron cargar las rutas</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadRoutes} className="bg-green-600 hover:bg-green-700">
              Reintentar
            </Button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Routes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRoutes.map((route) => {
                const price = route.precio_base != null ? Number(route.precio_base) : null;
                const location = normalizeString(route.ubicacion) || '—';
                const difficulty = normalizeString(route.dificultad) || '—';
                const capacity = route.capacidad_maxima != null ? Number(route.capacidad_maxima) : null;

                return (
                  <Card
                    key={route.id_ruta}
                    className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative h-48">
                      <ImageWithFallback
                        src={normalizeString(route.imagen_url) || CATALOG_IMAGE_PLACEHOLDER}
                        alt={route.nombre}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute top-4 left-4 flex flex-col space-y-2">
                        {route.destacado && <Badge className="bg-green-600 text-white">Destacado</Badge>}
                        <Badge className={getDifficultyColor(difficulty)}>{difficulty}</Badge>
                      </div>
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                          <span className="text-lg text-green-600">
                            {price == null ? 'Consultar' : `$${price.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <h3 className="text-xl mb-2 text-gray-800">{route.nombre}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {normalizeString(route.descripcion) || 'Sin descripción'}
                      </p>

                      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                        <div className="flex items-center space-x-1 text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{formatDurationDays(route.duracion_dias)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-500">
                          <Users className="w-4 h-4" />
                          <span>{capacity == null ? 'Capacidad —' : `Máx. ${capacity}`}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-500 col-span-2">
                          <MapPin className="w-4 h-4" />
                          <span>{location}</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => onViewChange('route-detail', String(route.id_ruta))}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Ver Detalles
                        <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* No Results */}
            {filteredRoutes.length === 0 && (
              <div className="text-center py-16">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl text-gray-600 mb-2">No se encontraron rutas</h3>
                <p className="text-gray-500 mb-4">Intenta ajustar los filtros para encontrar la ruta perfecta</p>
                <Button variant="outline" onClick={clearFilters}>
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
              <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                Contactar Asesor
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}