import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  MapPin,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { TourBookingModal } from './TourBookingModal';
import {
  rutasAPI,
  extractRutaServiciosPredefinidos,
  extractRutaServiciosOpcionales,
  type Ruta,
} from '../services/api';
import { useAuth } from '../App';
import { CATALOG_IMAGE_PLACEHOLDER } from '../utils/catalogPlaceholders';

interface RouteDetailPageProps {
  routeId: string;
  onViewChange: (view: string, itemId?: string) => void;
}

const PRINCIPAL_STORAGE_IMAGE_RE = /\/principal\.(png|jpe?g|webp|gif|bmp)$/i;

function bestRutaImageFromStorageUrls(
  imagenes: string[] | null | undefined,
  fallback: string | null | undefined
): string | null {
  if (!imagenes?.length) return fallback?.trim() ? fallback : null;
  const principal = imagenes.find((u) => PRINCIPAL_STORAGE_IMAGE_RE.test(u));
  return principal || imagenes[0] || (fallback?.trim() ? fallback : null);
}

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

function orderGalleryPrincipalFirst(urls: string[]): string[] {
  if (!urls.length) return urls;
  const i = urls.findIndex((u) => PRINCIPAL_STORAGE_IMAGE_RE.test(u));
  if (i <= 0) return urls;
  const principal = urls[i];
  return [principal, ...urls.slice(0, i), ...urls.slice(i + 1)];
}

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
  const [imageGallery, setImageGallery] = useState<string[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);

  const id = useMemo(() => Number(routeId), [routeId]);

  useEffect(() => {
    let cancelled = false;
    setHeroIndex(0);
    setImageGallery([]);

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

        let rActiva: Ruta | null = null;
        let rById: Ruta | null = null;

        try {
          rActiva = await rutasAPI.getActivaById(id);
        } catch {
          rActiva = null;
        }
        try {
          rById = await rutasAPI.getById(id);
        } catch {
          rById = null;
        }

        const base = rActiva || rById;
        if (!base) {
          if (cancelled) return;
          setRoute(null);
          setError('No se pudo cargar la ruta');
          return;
        }

        let rawImagenes: string[] = [];
        try {
          rawImagenes = await rutasAPI.getImagenes(id);
        } catch {
          rawImagenes = [];
        }

        const orderedFromStorage = orderGalleryPrincipalFirst(uniqueImageUrls(rawImagenes));
        const storageImage = bestRutaImageFromStorageUrls(rawImagenes, base.imagen_url);

        let gallery: string[] = [];
        if (orderedFromStorage.length) {
          gallery = orderedFromStorage;
        } else if (storageImage) {
          gallery = [storageImage];
        } else if (base.imagen_url?.trim()) {
          gallery = [base.imagen_url.trim()];
        } else {
          gallery = [CATALOG_IMAGE_PLACEHOLDER];
        }

        const incA = extractRutaServiciosPredefinidos(rActiva);
        const incB = extractRutaServiciosPredefinidos(rById);
        const includedMerged = incA.length >= incB.length ? incA : incB;

        const opA = extractRutaServiciosOpcionales(rActiva);
        const opB = extractRutaServiciosOpcionales(rById);
        const optionalMerged = opA.length >= opB.length ? opA : opB;

        if (cancelled) return;

        setImageGallery(gallery);
        setHeroIndex(0);
        setRoute({
          ...rActiva,
          ...rById,
          id_ruta: id,
          nombre: String(rById?.nombre || rActiva?.nombre || 'Ruta'),
          imagen_url: storageImage ?? null,
          servicios_predefinidos: includedMerged,
          servicios_opcionales: optionalMerged,
        });
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

  const includedServices = extractRutaServiciosPredefinidos(route);
  const optionalServices = extractRutaServiciosOpcionales(route);

  const price = route.precio_base != null ? Number(route.precio_base) : null;
  const locationRaw = normalizeString(route.ubicacion);
  const location =
    locationRaw ||
    'Se precisa con tu asesor al aprobar la solicitud (reserva personalizada).';
  const difficulty = normalizeString(route.dificultad) || '—';
  const capacity = route.capacidad_maxima != null ? Number(route.capacidad_maxima) : null;

  const isAvailable = route.estado !== false;

  const galleryForUi =
    imageGallery.length > 0 ? imageGallery : [route.imagen_url || CATALOG_IMAGE_PLACEHOLDER];
  const heroSrc = galleryForUi[heroIndex] ?? galleryForUi[0];
  const slideCount = galleryForUi.length;

  const goPrevHero = () => {
    setHeroIndex((i) => {
      const g =
        imageGallery.length > 0 ? imageGallery : [route.imagen_url || CATALOG_IMAGE_PLACEHOLDER];
      const n = g.length;
      return i === 0 ? n - 1 : i - 1;
    });
  };

  const goNextHero = () => {
    setHeroIndex((i) => {
      const g =
        imageGallery.length > 0 ? imageGallery : [route.imagen_url || CATALOG_IMAGE_PLACEHOLDER];
      const n = g.length;
      return i >= n - 1 ? 0 : i + 1;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
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

        {/* Flujo reserva personalizada */}
        <Card className="mb-8 border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-white shadow-md overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <Info className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-amber-600 text-white">Reserva personalizada</Badge>
                  <span className="text-sm text-gray-600">
                    Aquí no compras un cupo de una salida fija: envías una <strong>solicitud</strong> y OCCITOUR la
                    revisa.
                  </span>
                </div>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1.5 max-w-3xl">
                  <li>
                    Indicas <strong>fecha de salida</strong>, <strong>hora</strong> y tamaño del grupo (respetando
                    cupos máximos de la ruta).
                  </li>
                  <li>
                    El sistema bloquea rangos que chocan con fechas ya ocupadas de esta misma ruta (otras salidas
                    operativas).
                  </li>
                  <li>
                    Un asesor <strong>cotiza</strong>, define el <strong>punto de encuentro</strong> y habilita el pago
                    cuando todo esté listo.
                  </li>
                  <li>
                    Tras el pago aprobado, la solicitud puede convertirse en una salida operativa (incluso marcada como
                    personalizada en programación).
                  </li>
                </ol>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-800 hover:bg-green-50"
                    onClick={() => onViewChange('home')}
                  >
                    Ver salidas ya programadas en inicio
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="space-y-4">
            <div className="relative h-96 overflow-hidden rounded-2xl border border-green-100/80 shadow-xl">
              <ImageWithFallback
                src={heroSrc}
                alt={route.nombre}
                loading="eager"
                decoding="async"
                className="h-full w-full object-cover"
              />

              {slideCount > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Foto anterior"
                    onClick={goPrevHero}
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow-md backdrop-blur-sm hover:bg-white"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-800" />
                  </button>
                  <button
                    type="button"
                    aria-label="Foto siguiente"
                    onClick={goNextHero}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow-md backdrop-blur-sm hover:bg-white"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-800" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                    {galleryForUi.map((_, index) => (
                      <button
                        type="button"
                        key={index}
                        aria-label={`Ir a la foto ${index + 1}`}
                        onClick={() => setHeroIndex(index)}
                        className={`h-2 w-2 rounded-full transition-colors ${
                          index === heroIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              <div className="absolute top-4 left-4 flex flex-col space-y-2">
                {route.destacado ? <Badge className="bg-green-600 text-white shadow">Destacado</Badge> : null}
                <Badge className={`${getDifficultyColor(difficulty)} shadow`}>{difficulty}</Badge>
              </div>
            </div>

            {slideCount > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryForUi.map((src, index) => (
                  <button
                    type="button"
                    key={`${src}-${index}`}
                    onClick={() => setHeroIndex(index)}
                    className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-lg ring-2 transition-all ${
                      index === heroIndex ? 'ring-green-600 opacity-100' : 'ring-transparent opacity-80 hover:opacity-100'
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

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl mb-3 text-gray-800">{route.nombre}</h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                {normalizeString(route.descripcion) || 'Sin descripción breve en catálogo.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Duración</p>
                  <p className="text-gray-800 font-medium">{formatDurationDays(route.duracion_dias)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Grupo máximo</p>
                  <p className="text-gray-800 font-medium">
                    {capacity == null || capacity <= 0 ? 'Consultar con OCCITOUR' : `Hasta ${capacity} personas`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Referencia para armar tu solicitud</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 col-span-2 sm:col-span-1">
                <MapPin className="w-5 h-5 text-green-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">Ubicación / zona</p>
                  <p className="text-gray-800 font-medium leading-snug">{location}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Fechas</p>
                  <p className="text-gray-800 font-medium">Las eliges al solicitar</p>
                  <p className="text-xs text-gray-500 mt-0.5">No es una salida cerrada</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 col-span-2">
                <MapPin className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Punto de encuentro</p>
                  <p className="text-gray-800 font-medium">
                    Lo define el asesor al aprobar tu solicitud y asignar la salida.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Dificultad</p>
                  <p className="text-gray-800 font-medium">{difficulty}</p>
                </div>
              </div>
            </div>

            <Card className="bg-green-50 border-green-200 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-green-900">Solicitar esta ruta</CardTitle>
                <CardDescription className="text-green-800/90">
                  Precio mostrado es <strong>referencial por persona</strong>. La cotización final puede incluir
                  servicios incluidos u opcionales que elijas en el formulario.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-3xl text-green-700">
                      {price == null ? 'Consultar' : `$${price.toLocaleString('es-CO')}`}
                    </span>
                    <span className="text-gray-600 ml-2">por persona (base)</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}
                  >
                    {isAvailable ? 'Disponible para solicitud' : 'No disponible'}
                  </Badge>
                </div>

                <Button
                  onClick={handleBookingClick}
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
                  disabled={!isAvailable}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Solicitar reserva personalizada
                </Button>

                <p className="text-xs text-gray-600 text-center leading-relaxed">
                  Tras enviar la solicitud, OCCITOUR valida disponibilidad y te habilita el pago cuando corresponda.
                  Cancelación sujeta a políticas que te confirma el asesor.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="mb-2 text-2xl text-gray-800">Todas las fotos</h2>
          <p className="mb-6 text-sm text-gray-600">
            {slideCount === 1
              ? 'Hay una foto en el álbum de esta ruta.'
              : `${slideCount} fotos en el álbum. Toca una miniatura para verla en la vista principal.`}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {galleryForUi.map((img, index) => (
              <button
                type="button"
                key={`${img}-${index}`}
                onClick={() => {
                  setHeroIndex(index);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`relative aspect-[4/3] overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  index === heroIndex ? 'border-green-600 ring-2 ring-green-200' : 'border-transparent'
                }`}
              >
                <ImageWithFallback
                  src={img}
                  alt={`${route.nombre} — foto ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="included" className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-2 h-11">
            <TabsTrigger value="included">Servicios incluidos</TabsTrigger>
            <TabsTrigger value="optional">Servicios opcionales</TabsTrigger>
          </TabsList>

          <TabsContent value="included">
            <Card className="border-green-100 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  Servicios incluidos
                </CardTitle>
                <CardDescription>
                  Forman parte de la propuesta de la ruta; se reflejan en tu solicitud igual que en el panel de
                  OCCITOUR.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {includedServices.length === 0 ? (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    No hay servicios incluidos visibles para esta ruta. Puede que el catálogo aún no los envíe en la
                    API o que debas consultarlos con un asesor al cotizar.
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {includedServices.map((item, index) => {
                      const nombre = item.servicio?.nombre || `Servicio #${item.id_servicio}`;
                      const desc = normalizeString(item.servicio?.descripcion);
                      const img = normalizeString(item.servicio?.imagen_url);
                      return (
                        <div
                          key={item.id_ruta_servicio_predefinido ?? `${item.id_servicio}-inc-${index}`}
                          className="flex gap-4 rounded-xl border border-green-100 bg-white p-4 shadow-sm"
                        >
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-green-50 border border-green-100">
                            {img ? (
                              <ImageWithFallback src={img} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-green-300">
                                <Sparkles className="w-7 h-7" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2 flex-wrap">
                              <Check className="w-4 h-4 text-green-600 shrink-0 mt-1" />
                              <div>
                                <p className="font-medium text-gray-900">{nombre}</p>
                                {item.requerido ? (
                                  <Badge variant="secondary" className="mt-1 text-xs">
                                    Requerido en ruta
                                  </Badge>
                                ) : null}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Cantidad referencia: {item.cantidad_default}</p>
                            {desc ? <p className="text-sm text-gray-600 mt-2 leading-relaxed">{desc}</p> : null}
                            {item.servicio?.precio != null ? (
                              <p className="text-xs text-gray-500 mt-2">
                                Ref. precio unitario: ${Number(item.servicio.precio).toLocaleString('es-CO')}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optional">
            <Card className="border-amber-100 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">Servicios opcionales</CardTitle>
                <CardDescription>
                  Podrás marcar los que quieras al completar la solicitud; se suman a la cotización si aplican.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {optionalServices.length === 0 ? (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Esta ruta no muestra opcionales enlazados. Si necesitas extras, descríbelos en observaciones al
                    enviar la solicitud.
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {optionalServices.map((item, index) => {
                      const nombre = item.servicio?.nombre || `Servicio #${item.id_servicio}`;
                      const desc = normalizeString(item.servicio?.descripcion);
                      const img = normalizeString(item.servicio?.imagen_url);
                      return (
                        <div
                          key={item.id_ruta_servicio_opcional ?? `${item.id_servicio}-opt-${index}`}
                          className="flex gap-4 rounded-xl border border-amber-100 bg-amber-50/40 p-4"
                        >
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white border border-amber-100">
                            {img ? (
                              <ImageWithFallback src={img} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-amber-300">
                                <Sparkles className="w-7 h-7" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900">{nombre}</p>
                            <Badge className="mt-1 bg-amber-100 text-amber-900 text-xs">Opcional</Badge>
                            <p className="text-sm text-gray-600 mt-2">
                              Cantidad sugerida: {item.cantidad_default}
                            </p>
                            {desc ? <p className="text-sm text-gray-600 mt-2 leading-relaxed">{desc}</p> : null}
                            {item.servicio?.precio != null ? (
                              <p className="text-xs text-gray-600 mt-2 font-medium">
                                Desde ${Number(item.servicio.precio).toLocaleString('es-CO')} (referencia)
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-16">
          <h2 className="text-2xl mb-6 text-gray-800">Otras rutas que te pueden interesar</h2>
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => onViewChange('routes')}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              Ver todas las rutas
            </Button>
          </div>
        </div>
      </div>

      <TourBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        tour={{
          id: String(route.id_ruta),
          name: route.nombre,
          description: normalizeString(route.descripcion) || '—',
          price: price ?? 0,
          image: route.imagen_url || CATALOG_IMAGE_PLACEHOLDER,
          duration: formatDurationDays(route.duracion_dias),
          difficulty,
          location: locationRaw || '—',
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
