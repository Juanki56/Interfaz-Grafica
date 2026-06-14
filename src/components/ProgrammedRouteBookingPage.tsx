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
  const [timeLimitExceeded, setTimeLimitExceeded] = useState(false);

  useEffect(() => {
    if (programacion?.fecha_salida) {
      const fechaSalidaDate = new Date(`${String(programacion.fecha_salida).split('T')[0]}T${programacion.hora_salida || '00:00:00'}-05:00`);
      // Subtract 1 hour for the limit
      const limitDate = new Date(fechaSalidaDate.getTime() - 60 * 60 * 1000);
      if (new Date() > limitDate) {
        setTimeLimitExceeded(true);
      } else {
        setTimeLimitExceeded(false);
      }
    }
  }, [programacion]);

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

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeReserva = reservas.find((r: any) => {
          const status = String(r.estado || '').toLowerCase();
          if (status === 'cancelada' || status === 'completada') return false;

          let hasProg = false;
          if (Number(r.id_programacion_resumen) === id) hasProg = true;
          if (r.programaciones && Array.isArray(r.programaciones)) {
            hasProg = hasProg || r.programaciones.some((p: any) => Number(p.id_programacion) === id);
          }
          if (!hasProg) return false;

          // Usar el campo real del backend: fecha_regreso_programacion o fecha_salida_programacion
          const fechaFinRaw =
            r.fecha_regreso_programacion ??
            r.fecha_salida_programacion ??
            null;

          if (fechaFinRaw) {
            const fechaFin = new Date(`${String(fechaFinRaw).split('T')[0]}T00:00:00`);
            if (fechaFin < today) return false; // La ruta ya ocurrió
          }
          return true;
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

  if (timeLimitExceeded) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl shadow-sm">
          <div className="flex justify-center mb-4">
            <span className="text-4xl">⏳</span>
          </div>
          <h3 className="text-lg font-bold text-orange-800 mb-2">Tiempo agotado</h3>
          <p className="text-orange-700">
            El tiempo límite para reservar esta salida ha finalizado. Las reservas se cierran 1 hora antes de la hora de inicio de la ruta.
          </p>
        </div>
        <Button onClick={() => onViewChange('home')} className="bg-green-600 hover:bg-green-700 mt-4">
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
        <Card className="bg-white border-2 border-emerald-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-700 to-green-600 px-6 py-5 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-3">
              <span className="text-3xl">🌿</span>
            </div>
            <CardTitle className="text-2xl text-white font-bold">Salida reservada</CardTitle>
            <CardDescription className="text-white/90 text-sm sm:text-base mt-2 font-medium tracking-wide">
              Tienes un cupo activo para esta salida con fecha vigente.
            </CardDescription>
          </div>
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-col gap-4 bg-white p-5 rounded-xl border border-emerald-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-gray-100 pb-3">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Estado de reserva</span>
                <Badge variant="default" className="bg-emerald-600 text-white px-3 py-1 w-fit shadow-sm text-sm font-bold border-none" style={{ backgroundColor: '#059669', color: 'white' }}>
                  {existingBooking.status}
                </Badge>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Detalle</span>
                <span className="font-bold text-gray-800 text-base">{existingBooking.summary}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Si la salida ya ocurrió y aún ves este mensaje, recarga la página o contacta a OCCITOUR.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Button
                variant="outline"
                onClick={() => onViewChange('home')}
                className="flex-1"
                style={{ borderColor: '#6ee7b7', color: '#047857', borderWidth: '2px' }}
              >
                Volver al inicio
              </Button>
              <Button
                onClick={() => onViewChange('dashboard', `reserva-${existingBooking.id}`)}
                className="flex-1"
                style={{ backgroundColor: '#059669', color: 'white' }}
              >
                Ver mi reserva
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
