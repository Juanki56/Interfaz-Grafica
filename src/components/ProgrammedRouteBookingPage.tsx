import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import {
  programacionAPI,
  rutasAPI,
  extractRutaServiciosPredefinidos,
  type Programacion,
  type Ruta,
} from '../services/api';
import { ProgrammedRouteBookingModal } from './ProgrammedRouteBookingModal';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { reservasAPI } from '../services/api';

interface ProgrammedRouteBookingPageProps {
  programacionId: string;
  onViewChange: (view: string, itemId?: string) => void;
}

export function ProgrammedRouteBookingPage({ programacionId, onViewChange }: ProgrammedRouteBookingPageProps) {
  const { user, refreshProfile } = useAuth();
  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;
  const [programacion, setProgramacion] = useState<Programacion | null>(null);
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingBooking, setExistingBooking] = useState<{ id: number, status: string, summary: string } | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    const id = Number(programacionId);
    if (!Number.isFinite(id) || id <= 0) {
      setError('Identificador de salida no valido.');
      if (!options?.silent) setLoading(false);
      return;
    }

    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const prog = await programacionAPI.getById(id);
      setProgramacion(prog);
      const idRuta = Number(prog?.id_ruta);
      if (Number.isFinite(idRuta) && idRuta > 0) {
        try {
          let rById: Ruta | null = null;
          let rActiva: Ruta | null = null;
          try {
            rById = await rutasAPI.getById(idRuta);
          } catch {
            rById = null;
          }
          try {
            rActiva = await rutasAPI.getActivaById(idRuta);
          } catch {
            rActiva = null;
          }

          const base = rById || rActiva;
          if (!base) {
            setRuta(null);
          } else {
            let rawImagenes: string[] = [];
            try {
              rawImagenes = await rutasAPI.getImagenes(idRuta);
            } catch {
              rawImagenes = [];
            }
            const firstGallery = String(rawImagenes[0] || '').trim();
            const mergedImagenUrl = String(
              (rById?.imagen_url || rActiva?.imagen_url || base.imagen_url || firstGallery || '') as string
            ).trim();

            const sFromId = extractRutaServiciosPredefinidos(rById);
            const sFromActiva = extractRutaServiciosPredefinidos(rActiva);
            const servicios =
              sFromId.length >= sFromActiva.length
                ? sFromId
                : sFromActiva.length > 0
                  ? sFromActiva
                  : extractRutaServiciosPredefinidos({ ...rActiva, ...rById });

            setRuta({
              ...rActiva,
              ...rById,
              id_ruta: idRuta,
              nombre: String(rById?.nombre || rActiva?.nombre || prog.ruta_nombre || 'Ruta'),
              imagen_url: mergedImagenUrl || null,
              servicios_predefinidos: servicios,
            });
          }
        } catch {
          setRuta(null);
        }
      } else {
        setRuta(null);
      }
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar la salida programada.');
      setProgramacion(null);
      setRuta(null);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [programacionId]);

  useEffect(() => {
    if (!user?.id) {
      toast.error('Debes iniciar sesion como cliente para reservar un cupo.');
      onViewChangeRef.current('home');
      setTimeout(() => {
        const loginButton = document.querySelector('[data-login-trigger]') as HTMLElement | null;
        if (loginButton) loginButton.click();
      }, 100);
      return;
    }

    if (user?.role !== 'client') {
      toast.error('Solo los clientes pueden reservar cupos desde el inicio.');
      onViewChangeRef.current('home');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await refreshProfile();
      } catch {
        /* perfil opcional; load sigue */
      }
      if (!cancelled) {
        await load();
      }
    })();

    return () => {
      cancelled = true;
    };
    // `refreshProfile` se omite a propósito: en App no está memoizado y al incluirlo este efecto se dispara en bucle
    // (loading infinito / pantalla en blanco en reserva programada).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, load]);

  useEffect(() => {
    if (!user || user.role !== 'client' || !programacionId) {
      setExistingBooking(null);
      return;
    }
    
    let cancelled = false;
    const id = Number(programacionId);

    const checkExistingBooking = async () => {
      setIsLoadingExisting(true);
      try {
        const reservas = await reservasAPI.getMine();
        if (cancelled) return;
        const activeReserva = reservas.find((r: any) => {
          const status = String(r.estado || '').toLowerCase();
          
          let hasProg = false;
          if (r.id_programacion_resumen === id) hasProg = true;
          if (r.programaciones && Array.isArray(r.programaciones)) {
            hasProg = hasProg || r.programaciones.some((p: any) => p.id_programacion === id);
          }
          
          return hasProg && status !== 'cancelada' && status !== 'completada';
        });

        if (activeReserva) {
          setExistingBooking({
            id: activeReserva.id_reserva || activeReserva.id,
            status: activeReserva.estado,
            summary: `Cupo reservado en salida`
          });
        } else {
          setExistingBooking(null);
        }
      } catch (e) {
        console.error("Error al buscar reserva existente", e);
      } finally {
        if (!cancelled) setIsLoadingExisting(false);
      }
    };

    void checkExistingBooking();

    return () => {
      cancelled = true;
    };
  }, [programacionId, user]);

  const handleSuccess = async () => {
    // Sin pantalla de carga: si no, se desmonta el modal y se pierde el estado del pago/comprobante.
    await load({ silent: true });
  };

  if (!user?.id || user?.role !== 'client') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-gray-600 px-4">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <p className="text-sm">Preparando tu experiencia...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-600 px-4">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
        <p>Cargando detalles de la salida...</p>
      </div>
    );
  }

  if (error || !programacion) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-gray-800">{error || 'Salida no encontrada.'}</p>
        <Button onClick={() => onViewChange('home')} className="bg-green-600 hover:bg-green-700">
          Volver al inicio
        </Button>
      </div>
    );
  }

  if (isLoadingExisting) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-600 px-4">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
        <p>Verificando tus reservas...</p>
      </div>
    );
  }

  if (existingBooking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card className="bg-blue-50 border-blue-200 shadow-md">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-2xl text-blue-900">Ya reservaste esta salida</CardTitle>
            <CardDescription className="text-blue-800/90 text-base mt-2">
              Actualmente tienes una reserva activa para esta fecha y ruta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 mt-4">
            <div className="flex flex-col gap-3 bg-white p-4 rounded border border-blue-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Estado:</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 px-3 py-1 text-sm">{existingBooking.status}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Detalle:</span>
                <span className="font-medium text-gray-800">{existingBooking.summary}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onViewChange('home')}
                className="flex-1 text-blue-700 border-blue-200 hover:bg-blue-100"
              >
                Volver al inicio
              </Button>
              <Button
                onClick={() => onViewChange('dashboard', `reserva-${existingBooking.id}`)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Ver mi reserva o Pagar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ProgrammedRouteBookingModal
      layout="page"
      isOpen
      onClose={() => onViewChange('home')}
      onGoToProfile={() => onViewChange('profile')}
      programacion={programacion}
      ruta={ruta}
      onSuccess={handleSuccess}
    />
  );
}
