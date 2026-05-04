import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../App';
import { programacionAPI, rutasAPI, extractRutaServiciosPredefinidos, type Programacion, type Ruta } from '../services/api';
import { ProgrammedRouteBookingModal } from './ProgrammedRouteBookingModal';
import { Button } from './ui/button';

interface ProgrammedRouteBookingPageProps {
  programacionId: string;
  onViewChange: (view: string, itemId?: string) => void;
}

export function ProgrammedRouteBookingPage({ programacionId, onViewChange }: ProgrammedRouteBookingPageProps) {
  const { user } = useAuth();
  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;
  const [programacion, setProgramacion] = useState<Programacion | null>(null);
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    void load();
  }, [user?.id, user?.role, load]);

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

  return (
    <ProgrammedRouteBookingModal
      layout="page"
      isOpen
      onClose={() => onViewChange('home')}
      programacion={programacion}
      ruta={ruta}
      onSuccess={handleSuccess}
    />
  );
}
