import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Star, MapPin, Clock, Users, Shield, ChevronRight, Sparkles, TrendingUp, Facebook, Instagram, Twitter, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselDots } from './ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { authAPI, fincasAPI, programacionAPI, rutasAPI, type Finca, type Programacion, type Ruta } from '../services/api';
import { filterFincasActivas } from '../utils/fincaActiva';
import { estadoSalidaParaCliente } from '../utils/programacionEstadoCliente';
import {
  marcarRecordatorioDocumentoPerfil,
  MENSAJE_ACTUALIZAR_DOCUMENTO_PERFIL,
  titularTieneDocumentoValidoParaReserva,
} from '../utils/documentIdentityValidation';
import { CATALOG_IMAGE_PLACEHOLDER } from '../utils/catalogPlaceholders';
import { formatRutaDuracionHoras } from '../utils/routeDateCalendar';
import { formatTimeDisplay } from '../utils/dateTimeDisplay';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

interface HomePageProps {
  onViewChange: (view: string, itemId?: string) => void;
}

function parseApiDate(value?: string | null): Date | null {
  if (!value) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  const direct = new Date(normalized);
  if (!Number.isNaN(direct.getTime())) return direct;

  const ymdOnly = normalized.slice(0, 10);
  const fallback = new Date(`${ymdOnly}T00:00:00`);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function HomePage({ onViewChange }: HomePageProps) {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<Ruta[]>([]);
  const [programaciones, setProgramaciones] = useState<Programacion[]>([]);
  const [homeFincas, setHomeFincas] = useState<Finca[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingProgramaciones, setLoadingProgramaciones] = useState(true);
  const [loadingFincas, setLoadingFincas] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoadingRoutes(true);
    setLoadingProgramaciones(true);
    setLoadingFincas(true);

    // Importante: NO esperar a que terminen los 3 endpoints para pintar.
    // Si uno se demora (p.ej. rutas), no debe bloquear rutas programadas/fincas.
    rutasAPI
      .getActivas({ limit: 24, cacheTtlMs: 2 * 60_000 })
      .then((routesData) => {
        if (cancelled) return;
        setRoutes(Array.isArray(routesData) ? routesData : []);
      })
      .catch(() => {
        if (cancelled) return;
        setRoutes([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingRoutes(false);
      });

    programacionAPI
      // cacheTtlMs: 0 → siempre fresco para que las nuevas programaciones
      // aparezcan de inmediato sin esperar expiración de caché
      .getPublicas({ limit: 40, cacheTtlMs: 0 })
      .then((progData) => {
        if (cancelled) return;
        setProgramaciones(Array.isArray(progData) ? progData : []);
      })
      .catch(() => {
        if (cancelled) return;
        setProgramaciones([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingProgramaciones(false);
      });

    fincasAPI
      .getPublicas({ limit: 4, cacheTtlMs: 5 * 60_000 })
      .then((fincasData) => {
        if (cancelled) return;
        const activas = filterFincasActivas(Array.isArray(fincasData) ? fincasData : []);
        setHomeFincas(activas.slice(0, 4));
      })
      .catch(() => {
        if (cancelled) return;
        setHomeFincas([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingFincas(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);
  const routeById = useMemo(() => {
    const map = new Map<number, Ruta>();
    for (const r of routes) {
      if (Number.isFinite(Number(r.id_ruta))) map.set(Number(r.id_ruta), r);
    }
    return map;
  }, [routes]);

  const upcomingProgramaciones = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (programaciones || [])
      .filter((p) => {
        if (!p) return false;
        const estado = String(p.estado || '').toLowerCase().trim();
        // Misma idea que /api/programaciones/publicas: aún reservable / en ejecución con cupos.
        if (!['programado', 'programada', 'activa', 'activo', 'en progreso'].includes(estado)) return false;
        if (p.es_personalizada) return false;
        if (Number(p.cupos_disponibles ?? 0) <= 0) return false;
        const fin = parseApiDate(String(p.fecha_regreso || p.fecha_salida || ''));
        return fin ? fin >= today : false;
      })
      .sort((a, b) => String(a.fecha_salida).localeCompare(String(b.fecha_salida)))
      .slice(0, 12);
  }, [programaciones]);

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const d = parseApiDate(value);
    if (!d) return String(value);
    return d.toLocaleDateString('es-CO', { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' });
  };
  const handleProgrammedBookingClick = async (programacion: Programacion) => {
    if (!user) {
      onViewChange('home');
      setTimeout(() => {
        const loginButton = document.querySelector('[data-login-trigger]') as HTMLElement | null;
        if (loginButton) loginButton.click();
      }, 100);
      return;
    }

    if (user.role !== 'client') {
      toast.error('Solo los clientes pueden reservar cupos desde el home.');
      return;
    }

    const profileRes = await authAPI.getProfile().catch(() => null);
    if (!titularTieneDocumentoValidoParaReserva(profileRes?.perfil, user)) {
      marcarRecordatorioDocumentoPerfil();
      toast.error(MENSAJE_ACTUALIZAR_DOCUMENTO_PERFIL);
      onViewChange('profile');
      return;
    }

    onViewChange('programmed-booking', String(programacion.id_programacion));
  };

  const renderScheduledRoutesSection = () => (
    <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-green-600 text-white">Salidas confirmadas</Badge>
              <Badge variant="outline" className="border-green-300 text-green-700">
                {upcomingProgramaciones.length} disponibles
              </Badge>
            </div>
            <h2 className="text-4xl mb-2 text-gray-800">Carrusel de rutas programadas</h2>
            <p className="text-lg text-gray-600">
              Salidas públicas con cupos disponibles. Sobre la imagen solo verás el estado de la salida (activa o en progreso); el
              resto de datos están abajo.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => onViewChange('routes')}
            className="border-green-300 hover:bg-green-50"
          >
            Ver catálogo
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>

        {loadingProgramaciones ? (
          /* Skeleton cards mientras carga */
          <div className="relative px-12">
            <div className="flex gap-6 overflow-hidden">
              {[0, 1, 2].map((i) => (
                <div key={i} className="min-w-[calc(33.333%-12px)] flex-shrink-0">
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-green-100 animate-pulse">
                    <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-green-100 rounded-full w-3/4" />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-10 bg-green-50 rounded-lg border border-green-100" />
                        <div className="h-10 bg-green-50 rounded-lg border border-green-100" />
                        <div className="h-10 bg-green-50 rounded-lg border border-green-100" />
                        <div className="h-10 bg-green-50 rounded-lg border border-green-100" />
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <div className="h-6 bg-green-100 rounded-full w-24" />
                        <div className="h-9 bg-green-100 rounded-lg w-28" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : upcomingProgramaciones.length > 0 ? (
          <div className="relative px-12">
            <Carousel 
              opts={{ align: 'start', loop: true }} 
              plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
              className="w-full"
            >
              <CarouselContent>
                {upcomingProgramaciones.map((p, idx) => {
                  const ruta = routeById.get(Number(p.id_ruta));
                  // Usar ubicacion directamente del backend (ahora incluida en obtenerActivas)
                  const nombre = (p as any).ruta_nombre || ruta?.nombre || `Ruta ${p.id_ruta}`;
                  const imagen = (p as any).imagen_url || ruta?.imagen_url || CATALOG_IMAGE_PLACEHOLDER;
                  const ubicacion = (p as any).ubicacion || ruta?.ubicacion || '—';
                  const dificultad = (p as any).dificultad || ruta?.dificultad || '—';
                  const cuposDisponibles = Number(p.cupos_disponibles ?? 0);
                  const cuposTotales = Number(p.cupos_totales ?? 0);
                  const precio =
                    p.precio_programacion != null
                      ? Number(p.precio_programacion)
                      : (p as any).precio_base != null
                        ? Number((p as any).precio_base)
                        : ruta?.precio_base != null
                          ? Number(ruta.precio_base)
                          : null;
                  const estadoSalida = estadoSalidaParaCliente(p.estado);

                  return (
                    <CarouselItem key={p.id_programacion} className="md:basis-1/2 lg:basis-1/3">
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: Math.min(idx * 0.08, 0.4) }}
                        className="h-full"
                      >
                        <Card className="overflow-hidden bg-white shadow-xl h-full border-green-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                          <div className="relative h-48">
                          <ImageWithFallback
                            src={imagen}
                            alt={nombre}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                            <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2">
                              <Badge variant="outline" translate="no" className={estadoSalida.badgeClassName}>
                                {estadoSalida.compactLabel}
                              </Badge>
                            </div>
                            <Badge
                              translate="no"
                              variant="outline"
                              className="shrink-0 !border-green-200/90 !bg-white/95 !text-green-900 shadow-sm backdrop-blur-sm"
                            >
                              {cuposDisponibles} cupos
                            </Badge>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <p className="text-white/85 text-xs uppercase tracking-wide">Ruta programada</p>
                            <h3 className="text-xl text-white leading-snug">{nombre}</h3>
                          </div>
                        </div>
                        <CardContent className="p-5 flex flex-col gap-3">
                          <div>
                            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-green-600" />
                              {ubicacion}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2 flex items-center gap-2 text-gray-700">
                              <Clock className="w-4 h-4 text-green-600" />
                              {formatDate(p.fecha_salida)}
                            </div>
                            <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2 flex items-center gap-2 text-gray-700">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              {dificultad}
                            </div>
                            <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2 text-gray-700">
                              <span className="text-xs text-gray-500 block">Horario</span>
                              <span className="font-medium">{formatTimeDisplay(p.hora_salida, 'Por definir')}</span>
                            </div>
                            <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2 text-gray-700">
                              <span className="text-xs text-gray-500 block">Capacidad</span>
                              <span className="font-medium">{cuposDisponibles}/{cuposTotales || '—'} libres</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
                            <div className="text-green-700">
                              <span className="text-lg">
                                {precio == null || Number.isNaN(precio) ? 'Consultar' : `$${precio.toLocaleString()}`}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">por persona</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                onClick={() => onViewChange('route-detail', String(p.id_ruta))}
                                className="border-green-300 text-green-700 hover:bg-green-50"
                              >
                                Ver ruta
                                <ChevronRight className="ml-2 w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleProgrammedBookingClick(p)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Reservar cupo
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      </motion.div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="z-10 border-green-300 bg-white/90 hover:bg-green-50 text-green-700 shadow-md h-12 w-12 left-2 md:left-4" />
              <CarouselNext className="z-10 border-green-300 bg-white/90 hover:bg-green-50 text-green-700 shadow-md h-12 w-12 right-2 md:right-4" />
              <CarouselDots />
            </Carousel>
          </div>
        ) : (
          <Card className="border-dashed border-green-200 bg-white/80">
            <CardContent className="py-10 text-center text-gray-600">
              Aún no hay rutas programadas disponibles. ¡Próximamente nuevas salidas!
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="/hero-bg.png"
            alt="Paisaje montañoso colombiano con senderista contemplando la naturaleza"
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
            fetchpriority="high"
            style={{ filter: 'saturate(0.8) opacity(0.9)' }}
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4 mt-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Badge className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md px-4 py-1.5 rounded-full mb-6 text-sm font-medium tracking-wide shadow-lg">
              <Sparkles className="w-4 h-4 mr-2 text-green-300" />
              Tu próxima aventura comienza aquí
            </Badge>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-white tracking-tight leading-tight drop-shadow-lg"
          >
            Descubre la
            <span className="text-green-400 block mt-2 drop-shadow-md">
              Naturaleza Colombiana
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="text-xl md:text-2xl mb-10 text-gray-100 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md"
          >
            Aventuras únicas en paisajes espectaculares con guías expertos y experiencias auténticas
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-8"
          >
            <Button 
              size="lg" 
              onClick={() => onViewChange('routes')}
              className="bg-green-600/90 hover:bg-green-500 text-white border border-green-500/50 backdrop-blur-sm px-8 py-6 text-lg rounded-full shadow-lg transition-all hover:scale-105 hover:shadow-green-500/25"
            >
              Explorar Rutas
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => onViewChange('farms')}
              className="border-white/40 bg-white/10 text-white hover:bg-white hover:text-green-800 backdrop-blur-md px-8 py-6 text-lg rounded-full transition-all hover:scale-105"
            >
              Ver Fincas
            </Button>
          </motion.div>
        </div>
      </section>

      {renderScheduledRoutesSection()}

      {/* How it works section replacing featured route */}
      <section className="py-20 px-4 bg-white relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-green-600 font-semibold tracking-wide uppercase text-sm mb-3">Sencillo y Seguro</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">Tu aventura en 3 pasos</h3>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-green-100 via-blue-200 to-green-100 -translate-y-12 z-0" />

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="w-24 h-24 rounded-full bg-white border-4 border-gray-50 shadow-xl flex items-center justify-center mb-6 group-hover:border-green-100 group-hover:scale-110 transition-all duration-300">
                <MapPin className="w-10 h-10 text-green-500" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">1. Explora el Catálogo</h4>
              <p className="text-gray-600 leading-relaxed px-4">Encuentra la ruta o finca perfecta según tus preferencias, nivel de experiencia y fechas disponibles.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="w-24 h-24 rounded-full bg-white border-4 border-gray-50 shadow-xl flex items-center justify-center mb-6 group-hover:border-blue-100 group-hover:scale-110 transition-all duration-300">
                <Clock className="w-10 h-10 text-blue-500" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">2. Reserva tu Cupo</h4>
              <p className="text-gray-600 leading-relaxed px-4">Selecciona tu fecha, añade acompañantes y realiza tu pago de forma segura a través de nuestra plataforma.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="w-24 h-24 rounded-full bg-white border-4 border-gray-50 shadow-xl flex items-center justify-center mb-6 group-hover:border-emerald-100 group-hover:scale-110 transition-all duration-300">
                <Shield className="w-10 h-10 text-emerald-500" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">3. Vive la Experiencia</h4>
              <p className="text-gray-600 leading-relaxed px-4">Prepárate para desconectar. Nosotros nos encargamos de la logística, guías y seguridad para que solo disfrutes.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl mb-4 text-gray-800">¿Por qué elegirnos?</h2>
            <p className="text-xl text-gray-600">Experiencias únicas con los más altos estándares de calidad</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="text-center p-8 border border-green-50 shadow-lg hover:shadow-xl hover:border-green-100 transition-all duration-300 hover:-translate-y-2 h-full">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Seguridad Garantizada</h3>
                <p className="text-gray-600">
                  Guías certificados y equipos de seguridad de primera calidad para todas nuestras actividades.
                </p>
              </Card>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="text-center p-8 border border-blue-50 shadow-lg hover:shadow-xl hover:border-blue-100 transition-all duration-300 hover:-translate-y-2 h-full">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Grupos Pequeños</h3>
                <p className="text-gray-600">
                  Experiencias personalizadas con grupos reducidos para una mejor conexión con la naturaleza.
                </p>
              </Card>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="text-center p-8 border border-emerald-50 shadow-lg hover:shadow-xl hover:border-emerald-100 transition-all duration-300 hover:-translate-y-2 h-full">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Destinos Únicos</h3>
                <p className="text-gray-600">
                  Acceso exclusivo a lugares vírgenes y paisajes espectaculares fuera del turismo tradicional.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Inspirational CTA Section with Background Image */}
      <motion.section
        className="relative py-32 px-4 overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Background Image (lazy) */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src="/finca-perfecta.jpg"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/50 to-emerald-900/40"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div
            className="bg-white/10 backdrop-blur-md border border-white/20 p-8 md:p-14 rounded-3xl text-center text-white shadow-2xl mx-4 md:mx-0"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-block mb-6"
            >
              <Sparkles className="w-16 h-16 text-green-300 mx-auto" />
            </motion.div>

            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight drop-shadow-lg">
              Vive la Experiencia de la Finca Perfecta
            </h2>
            <p className="text-lg md:text-xl mb-10 text-green-50 max-w-3xl mx-auto font-light drop-shadow-md">
              Escápate de la ciudad y relájate en nuestras fincas rurales cuidadosamente seleccionadas.
              Comodidades excepcionales en perfecta armonía con el entorno natural.
            </p>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Button
                size="lg"
                onClick={() => onViewChange('farms')}
                className="bg-green-500 hover:bg-green-400 text-white border border-green-400/50 shadow-[0_0_30px_-5px_rgba(34,197,94,0.6)] px-10 py-7 rounded-full text-lg transition-all"
              >
                Explorar Catálogo de Fincas
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl mb-6">¿Listo para tu próxima aventura?</h2>
          <p className="text-xl mb-8 text-green-100">
            Descubre paisajes únicos y vive experiencias inolvidables en la naturaleza colombiana
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => onViewChange('routes')}
              className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3"
            >
              Explorar Rutas
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onViewChange('farms')}
              className="border-white text-white hover:bg-white hover:text-green-600 px-8 py-3"
            >
              Ver Fincas
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-white text-lg mb-4">Occitours</h3>
              <p className="text-sm mb-4">
                Tu mejor aliado para descubrir la magia de la naturaleza colombiana.
              </p>
              <div className="flex space-x-3">
                <div className="relative group flex items-center justify-center">
                  <a
                    href="https://www.facebook.com/people/Occitours/61577264948801/?ref=PROFILE_EDIT_xav_ig_profile_page_web#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  {/* Tooltip Facebook */}
                  <span className="absolute bottom-full mb-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    ¡Únete a nuestra comunidad en Facebook! 👍
                  </span>
                </div>
                <div className="relative group flex items-center justify-center">
                  <a
                    href="https://www.instagram.com/occitours/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  {/* Tooltip Instagram */}
                  <span className="absolute bottom-full mb-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    ¡Síguenos en Instagram para ver más de nuestros viajes! 📸
                  </span>
                </div>
                <div className="relative group flex items-center justify-center">
                  <a
                    href="https://www.tiktok.com/@occitours"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z" />
                    </svg>
                  </a>
                  {/* Tooltip TikTok */}
                  <span className="absolute bottom-full mb-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    ¡Descubre nuestros videos en TikTok! 🎵
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => onViewChange('home')} className="hover:text-green-400 transition-colors">
                    Inicio
                  </button>
                </li>
                <li>
                  <button onClick={() => onViewChange('about')} className="hover:text-green-400 transition-colors">
                    Quiénes Somos
                  </button>
                </li>
                <li>
                  <button onClick={() => onViewChange('routes')} className="hover:text-green-400 transition-colors">
                    Rutas
                  </button>
                </li>
                <li>
                  <button onClick={() => onViewChange('farms')} className="hover:text-green-400 transition-colors">
                    Fincas
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    Términos y Condiciones
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    Política de Privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    Políticas de Cancelación
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white mb-4">Ayuda y Contacto</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-green-400" />
                  <a href="mailto:Gerenciaoccitours@gmail.com" className="hover:text-green-400 transition-colors">
                    Gerenciaoccitours@gmail.com
                  </a>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-green-400" />
                  <a href="tel:+573043898018" className="hover:text-green-400 transition-colors">
                    +57 304 3898018
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    Preguntas Frecuentes
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    Centro de Ayuda
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>Occitours &copy; 2025</p>
            <p className="mt-1">RNT: 250112</p>
            <p className="mt-1 text-gray-400">Agencia operadora registrada</p>
          </div>
        </div>
      </footer>
    </div>
  );
}