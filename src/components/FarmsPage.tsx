import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPin, Users, Wifi, Coffee, TreePine, ChevronRight, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { fincasAPI, type Finca as BackendFinca } from '../services/api';
import { CATALOG_IMAGE_PLACEHOLDER } from '../utils/catalogPlaceholders';

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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadError(null);
      setIsLoading(true);
      try {
        const backendFarms = await fincasAPI.getAll();
        if (cancelled) return;
        const list = Array.isArray(backendFarms) ? backendFarms : [];
        const active = list.filter((f) => f.estado !== false);
        setAllFarms(active.map(mapBackendFarmToCard));
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
        filtered = filtered.filter((farm) => farm.pricePerNight >= 130000 && farm.pricePerNight < 160000);
      } else if (priceFilter === 'high') {
        filtered = filtered.filter((farm) => farm.pricePerNight >= 160000);
      }
    }

    if (locationFilter !== 'all') {
      filtered = filtered.filter((farm) => farm.location.toLowerCase().includes(locationFilter.toLowerCase()));
    }

    setFilteredFarms(filtered);
  }, [allFarms, nameFilter, priceFilter, locationFilter]);

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-sky-50/50 to-emerald-50 pt-20 relative">
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

        <div className="mb-8 rounded-2xl border border-emerald-100/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-800">Filtrar</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm text-gray-600">Buscar</label>
              <Input
                placeholder="Nombre o descripción…"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">Precio por noche</label>
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rango" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="low">Menos de $130.000</SelectItem>
                  <SelectItem value="medium">$130.000 – $160.000</SelectItem>
                  <SelectItem value="high">Más de $160.000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">Ubicación</label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Zona" />
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
          </div>
        </div>

        {isLoading && (
          <div className="py-20 text-center text-gray-600">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
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
            {filteredFarms.map((farm) => (
              <Card
                key={farm.id}
                className="overflow-hidden border-emerald-100/60 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="grid gap-0 md:grid-cols-2 md:items-stretch">
                  <div className="relative h-64 md:min-h-[16rem] md:h-full">
                    <ImageWithFallback
                      src={farm.image}
                      alt={farm.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute left-4 top-4">
                      <Badge className="farms-catalog-badge shadow-sm">Finca</Badge>
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <div className="rounded-lg bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-sm">
                        <span className="text-lg font-semibold text-emerald-700">
                          {farm.pricePerNight > 0
                            ? `$${farm.pricePerNight.toLocaleString('es-CO')}`
                            : 'Consultar'}
                        </span>
                        {farm.pricePerNight > 0 && (
                          <span className="ml-1 text-sm text-gray-600">/ noche</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <CardContent className="flex flex-col p-6">
                    <h3 className="mb-2 text-xl font-semibold text-gray-900">{farm.name}</h3>
                    <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600">{farm.description}</p>

                    <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                        <span>{farm.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-emerald-600" />
                        <span>Hasta {farm.maxGuests} huéspedes</span>
                      </div>
                    </div>

                    {farm.amenities.length > 0 && (
                      <div className="mb-4">
                        <h4 className="mb-2 text-sm font-medium text-gray-700">Comodidades</h4>
                        <div className="flex flex-wrap gap-2">
                          {farm.amenities.slice(0, 4).map((amenity, index) => (
                            <div key={index} className="flex items-center gap-1 text-xs text-gray-600">
                              {getAmenityIcon(amenity)}
                              <span>{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => onViewChange('farm-detail', farm.id)}
                      className="farms-catalog-cta mt-6 w-full shrink-0 border-0 shadow-sm"
                    >
                      Ver la finca
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && !loadError && filteredFarms.length === 0 && (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-white/60 py-16 text-center">
            <p className="text-gray-700">No hay fincas que coincidan con los filtros.</p>
            <Button
              variant="outline"
              className="mt-4 border-emerald-300"
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

        <div className="mt-16 rounded-2xl border border-emerald-100/80 bg-white/80 p-8 shadow-sm">
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
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Wifi className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="mb-2 text-lg text-gray-800">Soporte</h3>
              <p className="text-sm text-gray-600">Asesoría para elegir finca y fechas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
