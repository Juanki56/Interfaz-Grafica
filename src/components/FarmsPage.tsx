import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPin, Users, Wifi, Coffee, TreePine, ChevronRight, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { fincasAPI, type Finca as BackendFinca } from '../services/api';
import { filterFincasActivas } from '../utils/fincaActiva';
import { CATALOG_IMAGE_PLACEHOLDER } from '../utils/catalogPlaceholders';
import { Footer } from './Footer';

interface FarmsPageProps {
  onViewChange: (view: string, itemId?: string) => void;
}

/** Vista de catálogo — solo datos de API, sin mocks. */
interface CatalogFarm {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  location: string;
  image: string;
  gallery: string[];
  pricePerNight: number;
  maxGuests: number;
  amenities: string[];
}

function mapBackendFarmToCard(finca: BackendFinca): CatalogFarm {
  const img = finca.imagen_principal?.trim();
  const image = img && img.length ? img : CATALOG_IMAGE_PLACEHOLDER;
  const description =
    String(finca.descripcion || '').trim() ||
    'Los detalles de servicios y la ubicación exacta los confirma OCCITOUR al gestionar tu reserva.';

  return {
    id: String(finca.id_finca),
    name: String(finca.nombre || `Finca #${finca.id_finca}`),
    description,
    shortDescription: description.slice(0, 160),
    location: String(finca.ubicacion || finca.direccion || '').trim() || 'Ubicación por confirmar',
    image,
    gallery: [image],
    pricePerNight: Number(finca.precio_por_noche) || 0,
    maxGuests: Math.max(1, Number(finca.capacidad_personas) || 1),
    amenities: [],
  };
}

export function FarmsPage({ onViewChange }: FarmsPageProps) {
  const [allFarms, setAllFarms] = useState<CatalogFarm[]>([]);
  const [filteredFarms, setFilteredFarms] = useState<CatalogFarm[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadError(null);
      setIsLoading(true);
      try {
        const backendFarms = await fincasAPI.getPublicas();
        if (cancelled) return;
        const list = Array.isArray(backendFarms) ? backendFarms : [];
        setAllFarms(filterFincasActivas(list).map(mapBackendFarmToCard));
      } catch {
        if (!cancelled) {
          setAllFarms([]);
          setLoadError('No se pudieron cargar las fincas. Revisa la conexión o inténtalo más tarde.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let filtered = [...allFarms];

    if (nameFilter.trim()) {
      const q = nameFilter.toLowerCase();
      filtered = filtered.filter(
        (farm) => farm.name.toLowerCase().includes(q) || farm.description.toLowerCase().includes(q)
      );
    }

    if (priceFilter !== 'all') {
      if (priceFilter === 'low') {
        filtered = filtered.filter((farm) => farm.pricePerNight > 0 && farm.pricePerNight < 130000);
      } else if (priceFilter === 'medium') {
        filtered = filtered.filter(
          (farm) => farm.pricePerNight >= 130000 && farm.pricePerNight <= 160000
        );
      } else if (priceFilter === 'high') {
        filtered = filtered.filter((farm) => farm.pricePerNight > 160000);
      }
    }

    if (locationFilter !== 'all') {
      const q = locationFilter.toLowerCase();
      filtered = filtered.filter((farm) => farm.location.toLowerCase().includes(q));
    }

    setFilteredFarms(filtered);
    setCurrentPage(1); // Reset page on filter change
  }, [allFarms, nameFilter, priceFilter, locationFilter]);

  const paginatedFarms = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFarms.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredFarms, currentPage]);

  const totalPages = Math.ceil(filteredFarms.length / ITEMS_PER_PAGE);

  const availableLocations = useMemo(() => {
    const locs = allFarms
      .map((f) => f.location)
      .filter((v) => v && v !== 'Ubicación por confirmar');
    return Array.from(new Set(locs)).sort((a, b) => a.localeCompare(b, 'es'));
  }, [allFarms]);

  const getAmenityIcon = (amenity: string) => {
    if (amenity.toLowerCase().includes('wifi')) return <Wifi className="w-4 h-4" />;
    if (amenity.toLowerCase().includes('cocina') || amenity.toLowerCase().includes('comida'))
      return <Coffee className="w-4 h-4" />;
    return <TreePine className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-sky-50/50 to-green-50 pt-20 relative">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(167,243,208,0.35),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(186,230,253,0.35),transparent_45%)]" aria-hidden />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => onViewChange('home')}
            className="text-gray-600 hover:text-green-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Inicio
          </Button>
        </div>

        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-semibold tracking-tight text-gray-800 md:text-5xl">
            Fincas y hospedajes
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Catálogo en vivo desde OCCITOUR: precios y cupos según la base de datos.
          </p>
        </div>

        <div className="mb-10 rounded-2xl border border-green-100/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            <Filter className="h-5 w-5 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-800">Encuentra tu finca ideal</h3>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Buscar */}
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">Buscar</label>
                <Input
                  placeholder="Nombre o descripción…"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="rounded-full bg-white border-green-100 shadow-sm focus-visible:ring-green-500"
                />
              </div>

              {/* Ubicación Chips */}
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">Ubicación</label>
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
            </div>

            <div className="pt-4 border-t border-gray-50">
              {/* Precio Chips */}
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">Precio por noche</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'Todos' },
                    { value: 'low', label: '< $130.000' },
                    { value: 'medium', label: '$130k - $160k' },
                    { value: 'high', label: '> $160.000' },
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
          <div className="py-20 text-center text-gray-600">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
            Cargando fincas…
          </div>
        )}

        {!isLoading && loadError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-8 text-center">
            <p className="text-gray-800">{loadError}</p>
            <Button className="mt-4 bg-green-600 hover:bg-green-700" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        )}

        {!isLoading && !loadError && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {paginatedFarms.map((farm) => (
              <Card
                key={farm.id}
                className="group overflow-hidden border-green-100 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl rounded-2xl flex flex-col h-full"
              >
                <div className="relative w-full h-48 sm:h-56 shrink-0 overflow-hidden bg-gray-100">
                  <ImageWithFallback
                    src={farm.image}
                    alt={farm.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                  
                  <div className="absolute left-4 top-4">
                    <Badge className="bg-green-600/90 backdrop-blur-md border-none text-white shadow-sm px-3 py-1 text-sm font-medium">Finca Rural</Badge>
                  </div>
                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-white">
                      <p className="text-xs font-medium text-green-300 uppercase tracking-wider mb-1">Desde</p>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-white shadow-sm">
                          {farm.pricePerNight > 0
                            ? `$${farm.pricePerNight.toLocaleString('es-CO')}`
                            : 'Consultar'}
                        </span>
                        {farm.pricePerNight > 0 && (
                          <span className="ml-1 text-sm font-medium text-green-100">/ noche</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="flex flex-col p-6 flex-grow bg-white relative">
                  <h3 className="mb-3 text-2xl font-bold text-gray-800 line-clamp-1 group-hover:text-green-700 transition-colors">{farm.name}</h3>
                  <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-600 flex-grow">{farm.description}</p>

                  <div className="mb-6 grid grid-cols-2 gap-3 bg-green-50/50 rounded-xl p-4 border border-green-50">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="truncate">{farm.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Users className="h-4 w-4 text-blue-500 shrink-0" />
                      <span>Hasta {farm.maxGuests} pers.</span>
                    </div>
                  </div>

                  {farm.amenities.length > 0 && (
                    <div className="mb-6">
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Servicios Incluidos</h4>
                      <div className="flex flex-wrap gap-2">
                        {farm.amenities.slice(0, 4).map((amenity, index) => (
                          <div key={index} className="flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600 border border-gray-100">
                            {getAmenityIcon(amenity)}
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => onViewChange('farm-detail', farm.id)}
                    className="mt-auto w-full bg-green-600 hover:bg-green-700 py-6 text-base rounded-xl font-semibold shadow-md hover:shadow-green-600/30 transition-all border-0"
                  >
                    Explorar Finca
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && !loadError && totalPages > 1 && (
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

        {!isLoading && !loadError && filteredFarms.length === 0 && (
          <div className="rounded-xl border border-dashed border-green-200 bg-white/60 py-16 text-center">
            <p className="text-gray-700">No hay fincas que coincidan con los filtros.</p>
            <Button
              variant="outline"
              className="mt-4 border-green-300"
              onClick={() => {
                setNameFilter('');
                setPriceFilter('all');
                setLocationFilter('all');
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        )}

        <div className="mt-16 rounded-2xl border border-green-100/80 bg-white/80 p-8 shadow-sm">
          <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800">¿Por qué OCCITOUR?</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <TreePine className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg text-gray-800">Turismo responsable</h3>
              <p className="text-sm text-gray-600">Experiencias rurales con acompañamiento del equipo.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
                <Coffee className="h-6 w-6 text-sky-600" />
              </div>
              <h3 className="mb-2 text-lg text-gray-800">Información clara</h3>
              <p className="text-sm text-gray-600">Precios y condiciones alineados con tu reserva.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Wifi className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg text-gray-800">Soporte</h3>
              <p className="text-sm text-gray-600">Asesoría para elegir finca y fechas.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer onViewChange={onViewChange} />
    </div>
  );
}
