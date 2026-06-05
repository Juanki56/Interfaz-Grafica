import React, { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, User, X } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { cn } from './ui/utils';
import type { Propietario } from '../services/api';
import { isPropietarioActivo } from '../utils/fincaActiva';

type FincaOwnerPickerProps = {
  propietarios: Propietario[];
  value: string;
  onChange: (idPropietario: string) => void;
  disabled?: boolean;
  label?: string;
};

const ownerLabel = (p: Propietario) => {
  const nombre = [p.nombre, p.apellido].filter(Boolean).join(' ').trim();
  const doc = p.numero_documento ? ` · ${p.numero_documento}` : '';
  const tel = p.telefono ? ` · ${p.telefono}` : '';
  return `${nombre || `Propietario #${p.id_propietario}`}${doc}${tel}`;
};

const ownerSearchText = (p: Propietario) =>
  [p.nombre, p.apellido, p.numero_documento, p.telefono, p.email, String(p.id_propietario)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

export function FincaOwnerPicker({
  propietarios,
  value,
  onChange,
  disabled = false,
  label = 'Propietario (opcional)',
}: FincaOwnerPickerProps) {
  const [open, setOpen] = useState(false);

  const activos = useMemo(
    () => propietarios.filter(isPropietarioActivo),
    [propietarios],
  );

  const selected = useMemo(
    () => activos.find((p) => String(p.id_propietario) === String(value)),
    [activos, value],
  );

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between h-auto min-h-10 py-2 font-normal border-green-200',
              !selected && 'text-muted-foreground',
            )}
          >
            <span className="flex items-start gap-2 text-left flex-1 min-w-0">
              <User className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span className="truncate">
                {selected ? ownerLabel(selected) : 'Buscar o seleccionar propietario…'}
              </span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar por nombre, documento o teléfono…" />
            <CommandList>
              <CommandEmpty>No hay propietarios que coincidan.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="sin propietario ninguno"
                  onSelect={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === '' ? 'opacity-100' : 'opacity-0')} />
                  Sin propietario asignado
                </CommandItem>
                {activos.map((p) => {
                  const id = String(p.id_propietario);
                  const search = ownerSearchText(p);
                  return (
                    <CommandItem
                      key={id}
                      value={search}
                      onSelect={() => {
                        onChange(id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn('mr-2 h-4 w-4 shrink-0', value === id ? 'opacity-100' : 'opacity-0')}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">
                          {[p.nombre, p.apellido].filter(Boolean).join(' ') || `Propietario #${id}`}
                        </span>
                        {(p.numero_documento || p.telefono) && (
                          <span className="text-xs text-muted-foreground truncate">
                            {[p.numero_documento, p.telefono].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-green-700 hover:text-green-800 hover:bg-green-50"
          onClick={() => onChange('')}
        >
          <X className="w-3 h-3 mr-1" />
          Quitar propietario
        </Button>
      )}

      {activos.length === 0 && (
        <p className="text-xs text-amber-700">
          No hay propietarios activos. Regístralos en el módulo Propietarios.
        </p>
      )}
    </div>
  );
}
