import React, { useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronsUpDown, Home, Route, User, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import { cn } from '../ui/utils';
import { formatDateDisplay, formatDateTimeDisplay, formatTimeDisplay } from '../../utils/dateTimeDisplay';

type BasePickerProps = {
  label: string;
  disabled?: boolean;
  className?: string;
};

const formatCop = (value?: number) =>
  `$${Number(value || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;

function SearchablePicker({
  label,
  disabled,
  className,
  open,
  onOpenChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  value,
  onChange,
  triggerIcon,
  triggerPrimary,
  triggerSecondary,
  clearable,
  onClear,
  children,
}: BasePickerProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  value: string;
  onChange: (value: string) => void;
  triggerIcon: React.ReactNode;
  triggerPrimary: string;
  triggerSecondary?: string | null;
  clearable?: boolean;
  onClear?: () => void;
  children: React.ReactNode;
}) {
  const hasValue = Boolean(String(value || '').trim());

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between h-auto min-h-11 py-2.5 font-normal border-green-200 bg-gray-50/80 hover:bg-green-50/60',
              !hasValue && 'text-muted-foreground',
            )}
          >
            <span className="flex items-start gap-2.5 text-left flex-1 min-w-0">
              <span className="shrink-0 mt-0.5">{triggerIcon}</span>
              <span className="flex flex-col min-w-0 gap-0.5">
                <span className={cn('truncate text-sm', hasValue ? 'font-medium text-gray-900' : '')}>
                  {hasValue ? triggerPrimary : placeholder}
                </span>
                {hasValue && triggerSecondary ? (
                  <span className="truncate text-xs text-muted-foreground">{triggerSecondary}</span>
                ) : null}
              </span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} className="h-10" />
            <CommandList className="max-h-[280px]">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              {children}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {clearable && hasValue && !disabled && onClear ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-green-700 hover:text-green-800 hover:bg-green-50"
          onClick={onClear}
        >
          <X className="w-3 h-3 mr-1" />
          Quitar selección
        </Button>
      ) : null}
    </div>
  );
}

export type BookingClientPickerOption = {
  id: string;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
};

export function BookingClientPicker({
  clients,
  value,
  onChange,
  disabled,
  label = 'Cliente *',
}: {
  clients: BookingClientPickerOption[];
  value: string;
  onChange: (clientId: string, client?: BookingClientPickerOption) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => clients.find((c) => c.id === value), [clients, value]);

  const clientLabel = (c: BookingClientPickerOption) => c.name || `Cliente #${c.id}`;
  const clientSublabel = (c: BookingClientPickerOption) => {
    const parts = [c.document, c.email || c.phone].filter(Boolean);
    return parts.join(' · ') || 'Sin documento ni contacto';
  };
  const clientSearch = (c: BookingClientPickerOption) =>
    [c.id, c.name, c.document, c.email, c.phone].filter(Boolean).join(' ').toLowerCase();

  return (
    <SearchablePicker
      label={label}
      disabled={disabled}
      open={open}
      onOpenChange={setOpen}
      placeholder="Buscar o seleccionar cliente…"
      searchPlaceholder="Nombre, documento, correo o teléfono…"
      emptyMessage="No hay clientes que coincidan con la búsqueda."
      value={value}
      onChange={(id) => {
        const client = clients.find((c) => c.id === id);
        onChange(id, client);
        setOpen(false);
      }}
      triggerIcon={<User className="w-4 h-4 text-green-600" />}
      triggerPrimary={selected ? clientLabel(selected) : ''}
      triggerSecondary={selected ? clientSublabel(selected) : null}
      clearable
      onClear={() => onChange('', undefined)}
    >
      <CommandGroup>
        {clients.map((client) => (
          <CommandItem
            key={client.id}
            value={clientSearch(client)}
            onSelect={() => {
              onChange(client.id, client);
              setOpen(false);
            }}
          >
            <Check
              className={cn('mr-2 h-4 w-4 shrink-0', value === client.id ? 'opacity-100' : 'opacity-0')}
            />
            <div className="flex flex-col min-w-0 py-0.5">
              <span className="font-medium truncate">{clientLabel(client)}</span>
              <span className="text-xs text-muted-foreground truncate">{clientSublabel(client)}</span>
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    </SearchablePicker>
  );
}

export type BookingRoutePickerOption = {
  id: string;
  name: string;
  price?: number;
};

export function BookingRoutePicker({
  routes,
  value,
  onChange,
  disabled,
  placeholder,
  hint,
  label = 'Ruta *',
}: {
  routes: BookingRoutePickerOption[];
  value: string;
  onChange: (routeId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  hint?: React.ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => routes.find((r) => r.id === value), [routes, value]);

  const routeSearch = (r: BookingRoutePickerOption) =>
    [r.id, r.name, r.price != null ? String(r.price) : ''].filter(Boolean).join(' ').toLowerCase();

  return (
    <div className="space-y-1">
      <SearchablePicker
        label={label}
        disabled={disabled}
        open={open}
        onOpenChange={setOpen}
        placeholder={placeholder || 'Buscar o seleccionar ruta…'}
        searchPlaceholder="Nombre de la ruta…"
        emptyMessage="No hay rutas que coincidan."
        value={value}
        onChange={onChange}
        triggerIcon={<Route className="w-4 h-4 text-green-600" />}
        triggerPrimary={selected?.name || ''}
        triggerSecondary={
          selected?.price != null && selected.price > 0
            ? `Desde ${formatCop(selected.price)}`
            : selected
              ? `ID #${selected.id}`
              : null
        }
        clearable
        onClear={() => onChange('')}
      >
        <CommandGroup>
          {routes.map((route) => (
            <CommandItem
              key={route.id}
              value={routeSearch(route)}
              onSelect={() => {
                onChange(route.id);
                setOpen(false);
              }}
            >
              <Check
                className={cn('mr-2 h-4 w-4 shrink-0', value === route.id ? 'opacity-100' : 'opacity-0')}
              />
              <div className="flex flex-col min-w-0 py-0.5">
                <span className="font-medium truncate">{route.name}</span>
                {route.price != null && route.price > 0 ? (
                  <span className="text-xs text-muted-foreground">Tarifa base {formatCop(route.price)}</span>
                ) : null}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </SearchablePicker>
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export type BookingProgramacionPickerOption = {
  id: string;
  routeName: string;
  date: string;
  startTime?: string;
  endTime?: string;
  meetingPoint?: string;
  availableSeats: number;
  totalSeats: number;
  price?: number;
  insufficientCupo?: boolean;
};

export function BookingProgramacionPicker({
  programaciones,
  value,
  onChange,
  disabled,
  participantTotal = 1,
  loading,
  label = 'Salida programada *',
}: {
  programaciones: BookingProgramacionPickerOption[];
  value: string;
  onChange: (programacionId: string) => void;
  disabled?: boolean;
  participantTotal?: number;
  loading?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => programaciones.find((p) => p.id === value), [programaciones, value]);

  const progLabel = (p: BookingProgramacionPickerOption) => {
    const datePart = formatDateDisplay(p.date, { style: 'numeric' });
    const timePart = p.startTime ? ` · ${formatTimeDisplay(p.startTime)}` : '';
    return `${p.routeName} — ${datePart}${timePart}`;
  };

  const progSublabel = (p: BookingProgramacionPickerOption) => {
    const cupos = `${p.availableSeats}/${p.totalSeats} cupos`;
    const lugar = p.meetingPoint ? ` · ${p.meetingPoint}` : '';
    const precio = p.price && p.price > 0 ? ` · ${formatCop(p.price)}` : '';
    return `${cupos}${lugar}${precio}`;
  };

  const progSearch = (p: BookingProgramacionPickerOption) =>
    [
      p.id,
      p.routeName,
      p.date,
      p.startTime,
      p.meetingPoint,
      p.availableSeats,
      p.totalSeats,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

  const items = programaciones.map((p) => ({
    ...p,
    insufficientCupo: p.availableSeats < participantTotal,
  }));

  return (
    <div className="space-y-1">
      <SearchablePicker
        label={label}
        disabled={disabled || loading}
        open={open}
        onOpenChange={setOpen}
        placeholder={
          loading
            ? 'Cargando salidas del calendario…'
            : programaciones.length === 0
              ? 'No hay salidas para esta ruta'
              : 'Buscar salida programada…'
        }
        searchPlaceholder="Ruta, fecha, hora o punto de encuentro…"
        emptyMessage="No hay salidas que coincidan."
        value={value}
        onChange={onChange}
        triggerIcon={<CalendarDays className="w-4 h-4 text-green-600" />}
        triggerPrimary={selected ? progLabel(selected) : ''}
        triggerSecondary={selected ? progSublabel(selected) : null}
        clearable
        onClear={() => onChange('')}
      >
        <CommandGroup>
          {items.map((prog) => (
            <CommandItem
              key={prog.id}
              value={progSearch(prog)}
              disabled={prog.insufficientCupo}
              onSelect={() => {
                if (prog.insufficientCupo) return;
                onChange(prog.id);
                setOpen(false);
              }}
              className={cn(prog.insufficientCupo && 'opacity-60')}
            >
              <Check
                className={cn('mr-2 h-4 w-4 shrink-0', value === prog.id ? 'opacity-100' : 'opacity-0')}
              />
              <div className="flex flex-1 flex-col min-w-0 gap-1 py-0.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm truncate">{progLabel(prog)}</span>
                  {prog.insufficientCupo ? (
                    <Badge variant="outline" className="shrink-0 text-[10px] border-red-200 text-red-700">
                      Cupo insuficiente
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 text-[10px] border-green-200 text-green-800">
                      Disponible
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground truncate">{progSublabel(prog)}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </SearchablePicker>
      <p className="text-xs text-gray-500">
        {loading
          ? 'Cargando salidas operativas…'
          : programaciones.length > 0
            ? `Necesitas ${participantTotal} cupo(s) para esta reserva.`
            : 'No hay salidas operativas para esta ruta en el calendario.'}
      </p>
    </div>
  );
}

export function BookingFincaPicker({
  fincas,
  value,
  onChange,
  disabled,
  label = 'Finca *',
}: {
  fincas: BookingRoutePickerOption[];
  value: string;
  onChange: (fincaId: string, finca?: BookingRoutePickerOption) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => fincas.find((f) => f.id === value), [fincas, value]);

  const fincaSearch = (f: BookingRoutePickerOption) =>
    [f.id, f.name, f.price != null ? String(f.price) : ''].filter(Boolean).join(' ').toLowerCase();

  return (
    <SearchablePicker
      label={label}
      disabled={disabled}
      open={open}
      onOpenChange={setOpen}
      placeholder="Buscar o seleccionar finca…"
      searchPlaceholder="Nombre de la finca…"
      emptyMessage="No hay fincas que coincidan."
      value={value}
      onChange={(id) => {
        const finca = fincas.find((f) => f.id === id);
        onChange(id, finca);
        setOpen(false);
      }}
      triggerIcon={<Home className="w-4 h-4 text-green-600" />}
      triggerPrimary={selected?.name || ''}
      triggerSecondary={
        selected?.price != null && selected.price > 0
          ? `${formatCop(selected.price)} / noche`
          : selected
            ? `ID #${selected.id}`
            : null
      }
      clearable
      onClear={() => onChange('', undefined)}
    >
      <CommandGroup>
        {fincas.map((finca) => (
          <CommandItem
            key={finca.id}
            value={fincaSearch(finca)}
            onSelect={() => {
              onChange(finca.id, finca);
              setOpen(false);
            }}
          >
            <Check
              className={cn('mr-2 h-4 w-4 shrink-0', value === finca.id ? 'opacity-100' : 'opacity-0')}
            />
            <div className="flex flex-col min-w-0 py-0.5">
              <span className="font-medium truncate">{finca.name}</span>
              {finca.price != null && finca.price > 0 ? (
                <span className="text-xs text-muted-foreground">{formatCop(finca.price)} por noche</span>
              ) : null}
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    </SearchablePicker>
  );
}
