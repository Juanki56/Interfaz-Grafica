import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Clock, Users, MapPin, Filter, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { rutasAPI, type Ruta } from '../services/api';
import { CATALOG_IMAGE_PLACEHOLDER } from '../utils/catalogPlaceholders';
import { formatRutaDuracionHoras } from '../utils/routeDateCalendar';

interface RoutesPageProps {
  onViewChange: (view: string, itemId?: string) => void;
}

function normalizeString(value: unknown): string {
  return String(value ?? '').trim();
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
    setCurrentPage(1);
  };

  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [difficultyFilter, priceFilter, locationFilter]);

  const paginatedRoutes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRoutes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRoutes, currentPage]);

  const totalPages = Math.ceil(filteredRoutes.length / ITEMS_PER_PAGE);

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
        <div className="bg-white/80 backdrop-blur-md border border-green-100 rounded-2xl shadow-sm p-6 mb-10">
          <div className="flex items-center space-x-4 mb-6 border-b border-gray-100 pb-4">
            <Filter className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-800">Encuentra tu ruta ideal</h3>
          </div>

          <div className="space-y-6">
            {/* Ubicación Chips */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Ubicación</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setLocationFilter('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    locationFilter === 'all'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  Todas
                </button>
                {availableLocations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setLocationFilter(loc)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      locationFilter === loc
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-50">
              {/* Dificultad Chips */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Dificultad</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setDifficultyFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      difficultyFilter === 'all'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    Todas
                  </button>
                  {availableDifficulties.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficultyFilter(d)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        difficultyFilter === d
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Precio Chips */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Rango de Precio</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'Todos' },
                    { value: 'low', label: '< $100k' },
                    { value: 'medium', label: '$100k - $150k' },
                    { value: 'high', label: '> $150k' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPriceFilter(option.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        priceFilter === option.value
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
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
              {paginatedRoutes.map((route) => {
                const price = route.precio_base != null ? Number(route.precio_base) : null;
                const location = normalizeString(route.ubicacion) || '—';
                const difficulty = normalizeString(route.dificultad) || '—';
                const capacity = route.capacidad_maxima != null ? Number(route.capacidad_maxima) : null;

                return (
                  <Card
                    key={route.id_ruta}
                    className="group overflow-hidden rounded-2xl border-green-100 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col h-full"
                  >
                    <div className="relative w-full h-48 sm:h-56 shrink-0 overflow-hidden bg-gray-100">
                      <ImageWithFallback
                        src={normalizeString(route.imagen_url) || CATALOG_IMAGE_PLACEHOLDER}
                        alt={route.nombre}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                      
                      <div className="absolute top-4 left-4 flex flex-col space-y-2">
                        {route.destacado && (
                          <Badge className="bg-yellow-400 text-yellow-900 border-none shadow-sm backdrop-blur-md">
                            ⭐ Destacado
                          </Badge>
                        )}
                        <Badge className={`${getDifficultyColor(difficulty)} border-none shadow-sm backdrop-blur-md bg-opacity-90`}>
                          {difficulty}
                        </Badge>
                      </div>
                      
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div className="text-white">
                          <p className="text-xs font-medium text-green-300 uppercase tracking-wider mb-1">Precio por persona</p>
                          <span className="text-2xl font-bold">
                            {price == null ? 'Consultar' : `$${price.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold mb-2 text-gray-800 line-clamp-1 group-hover:text-green-700 transition-colors">{route.nombre}</h3>
                      <p className="text-gray-600 mb-6 line-clamp-2 text-sm flex-grow">
                        {normalizeString(route.descripcion) || 'Explora esta maravillosa ruta y conéctate con la naturaleza...'}
                      </p>

                      <div className="flex flex-col gap-3 mb-6 bg-green-50/50 rounded-xl p-4 border border-green-50">
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Clock className="w-4 h-4 text-green-600 shrink-0" />
                          <span className="text-sm font-medium">{formatRutaDuracionHoras(route.duracion_dias)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                          <span className="text-sm font-medium truncate">{location}</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => onViewChange('route-detail', String(route.id_ruta))}
                        className="w-full bg-green-600 hover:bg-green-700 rounded-xl py-6 font-semibold shadow-md hover:shadow-green-600/30 transition-all"
                      >
                        Ver Detalles de la Ruta
                        <ChevronRight className="ml-2 w-5 h-5" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-12 space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-2 rounded-full border-green-200 text-green-700 hover:bg-green-50"
                >
                  Anterior
                </Button>
                <span className="text-gray-600 font-medium">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-2 rounded-full border-green-200 text-green-700 hover:bg-green-50"
                >
                  Siguiente
                </Button>
              </div>
            )}

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