import type { Programacion } from '../services/api';
import { toCalendarYmd } from './dateTimeDisplay';
import { addDays, toYMD } from './routeDateCalendar';

export type GuideDayStatus = 'occupied' | 'free' | 'past';

function parseYmdLocal(ymd: string): Date {
  return new Date(`${ymd}T12:00:00`);
}

/** Programaciones que bloquean al guía (excluye canceladas). */
export function isGuideBlockingProgramacion(prog: Programacion): boolean {
  const st = String(prog.estado || '').toLowerCase();
  return !st.includes('cancel');
}

/** Días YYYY-MM-DD ocupados por una programación (salida → regreso inclusive). */
export function expandProgramacionToYmdRange(prog: Programacion): string[] {
  const startYmd = toCalendarYmd(prog.fecha_salida);
  const endYmd = toCalendarYmd(prog.fecha_regreso || prog.fecha_salida);
  if (!startYmd) return [];

  const end = endYmd || startYmd;
  const dates: string[] = [];
  let cur = parseYmdLocal(startYmd);
  const endDate = parseYmdLocal(end);

  while (cur.getTime() <= endDate.getTime()) {
    dates.push(toYMD(cur));
    cur = addDays(cur, 1);
  }

  return dates;
}

/** Mapa día → programaciones que ocupan ese día. */
export function buildGuideOccupiedDatesMap(
  programaciones: Programacion[],
): Map<string, Programacion[]> {
  const map = new Map<string, Programacion[]>();

  for (const prog of programaciones) {
    if (!isGuideBlockingProgramacion(prog)) continue;
    for (const ymd of expandProgramacionToYmdRange(prog)) {
      const list = map.get(ymd) ?? [];
      if (!list.some((p) => p.id_programacion === prog.id_programacion)) {
        list.push(prog);
      }
      map.set(ymd, list);
    }
  }

  return map;
}

export function startOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getGuideDayStatus(
  date: Date,
  occupiedMap: Map<string, Programacion[]>,
  today: Date = startOfTodayLocal(),
): GuideDayStatus {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  if (day.getTime() < today.getTime()) return 'past';

  const ymd = toYMD(day);
  return occupiedMap.has(ymd) ? 'occupied' : 'free';
}

export function countGuideMonthAvailability(
  month: Date,
  occupiedMap: Map<string, Programacion[]>,
): { occupied: number; free: number; past: number } {
  const year = month.getFullYear();
  const mo = month.getMonth();
  const daysInMonth = new Date(year, mo + 1, 0).getDate();
  const today = startOfTodayLocal();

  let occupied = 0;
  let free = 0;
  let past = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, mo, day);
    const status = getGuideDayStatus(date, occupiedMap, today);
    if (status === 'occupied') occupied += 1;
    else if (status === 'free') free += 1;
    else past += 1;
  }

  return { occupied, free, past };
}

export function programacionesOnDay(
  date: Date,
  occupiedMap: Map<string, Programacion[]>,
): Programacion[] {
  return occupiedMap.get(toYMD(date)) ?? [];
}
