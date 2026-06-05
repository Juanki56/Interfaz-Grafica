import { useMemo, useState } from 'react';
import { CalendarDays, Loader2 } from 'lucide-react';

import type { Programacion } from '../services/api';
import { formatDateDisplay } from '../utils/dateTimeDisplay';
import {
  buildGuideOccupiedDatesMap,
  countGuideMonthAvailability,
  getGuideDayStatus,
  programacionesOnDay,
  startOfTodayLocal,
} from '../utils/guideAvailabilityCalendar';
import { toYMD } from '../utils/routeDateCalendar';
import { Calendar } from './ui/calendar';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { cn } from './ui/utils';

type GuideAvailabilityCalendarProps = {
  programaciones: Programacion[];
  loading?: boolean;
  compact?: boolean;
  title?: string;
  description?: string;
  occupiedLegend?: string;
  freeDayMessage?: string;
};

export function GuideAvailabilityCalendar({
  programaciones,
  loading = false,
  compact = false,
  title = 'Disponibilidad del guía',
  description = 'Según rutas asignadas en Programación. Los días en rojo coinciden con salidas activas (salida → regreso).',
  occupiedLegend = 'Ocupado (ruta asignada)',
  freeDayMessage = 'Día libre: no hay rutas asignadas en esta fecha.',
}: GuideAvailabilityCalendarProps) {
  const [calendarMonth, setCalendarMonth] = useState(() => startOfTodayLocal());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();

  const occupiedMap = useMemo(
    () => buildGuideOccupiedDatesMap(programaciones),
    [programaciones],
  );

  const monthStats = useMemo(
    () => countGuideMonthAvailability(calendarMonth, occupiedMap),
    [calendarMonth, occupiedMap],
  );

  const selectedDayProgramaciones = useMemo(() => {
    if (!selectedDay) return [];
    return programacionesOnDay(selectedDay, occupiedMap);
  }, [selectedDay, occupiedMap]);

  const calendarModifiers = useMemo(
    () => ({
      occupied: (date: Date) => getGuideDayStatus(date, occupiedMap) === 'occupied',
      free: (date: Date) => getGuideDayStatus(date, occupiedMap) === 'free',
      past: (date: Date) => getGuideDayStatus(date, occupiedMap) === 'past',
    }),
    [occupiedMap],
  );

  const calendarModifiersClassNames = useMemo(
    () => ({
      occupied:
        'bg-red-100 text-red-900 font-semibold ring-1 ring-red-200 hover:bg-red-100 hover:text-red-900',
      free: 'bg-green-50 text-green-900 ring-1 ring-green-100 hover:bg-green-100 hover:text-green-900',
      past: 'bg-slate-100 text-slate-400 opacity-80',
    }),
    [],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Cargando disponibilidad...</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4
          className={cn(
            'text-gray-700 flex items-center gap-2',
            compact ? 'text-sm font-medium' : '',
          )}
        >
          <CalendarDays className={cn('text-green-600', compact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
          {title}
        </h4>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
            {monthStats.free} libres
          </Badge>
          <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
            {monthStats.occupied} ocupados
          </Badge>
        </div>
      </div>

      {!compact ? <p className="text-xs text-gray-500">{description}</p> : null}

      <Card className="border-green-100">
        <CardContent className={cn('pt-4 pb-2', compact && 'pt-2 px-2 pb-1')}>
          <Calendar
            mode="single"
            selected={selectedDay}
            onSelect={setSelectedDay}
            month={calendarMonth}
            onMonthChange={(m) => {
              setCalendarMonth(m);
              setSelectedDay(undefined);
            }}
            modifiers={calendarModifiers}
            modifiersClassNames={calendarModifiersClassNames}
            className={cn('mx-auto', compact && 'p-1 [&_.rdp-caption_label]:text-xs [&_.rdp-head_cell]:text-[0.65rem] [&_.rdp-head_cell]:h-8 [&_.rdp-cell]:h-8 [&_.rdp-cell]:w-8 [&_.rdp-day]:h-8 [&_.rdp-day]:w-8 [&_.rdp-day]:text-xs')}
          />

          <div
            className={cn(
              'flex flex-wrap justify-center gap-4 pt-2 pb-2 text-xs text-gray-600',
              compact && 'gap-2 pt-1 pb-1 text-[0.65rem]',
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-green-50 ring-1 ring-green-200" />
              Libre
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-100 ring-1 ring-red-200" />
              {occupiedLegend}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-100" />
              Pasado
            </span>
          </div>
        </CardContent>
      </Card>

      {selectedDay && (
        <Card className={cn('border-green-100 bg-green-50/30', compact && 'shadow-none')}>
          <CardContent className={cn('pt-4 pb-4 space-y-2', compact && 'pt-2 pb-2 px-3 space-y-1.5')}>
            <p className="text-sm font-medium text-green-900">
              {formatDateDisplay(toYMD(selectedDay), { style: 'long' })}
            </p>
            {selectedDayProgramaciones.length === 0 ? (
              <p className="text-sm text-gray-600">{freeDayMessage}</p>
            ) : (
              <ul className="space-y-2">
                {selectedDayProgramaciones.map((prog) => (
                  <li
                    key={prog.id_programacion}
                    className={cn(
                      'text-sm rounded-md border px-3 py-2 bg-white',
                      'border-red-100 text-gray-800',
                    )}
                  >
                    <span className="font-medium">
                      {prog.ruta_nombre || `Ruta #${prog.id_ruta}`}
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      {formatDateDisplay(prog.fecha_salida)} → {formatDateDisplay(prog.fecha_regreso)}
                      {prog.estado ? ` · ${prog.estado}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
