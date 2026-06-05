import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(ROOT, 'src/components/ClientsManagement.tsx');
let content = fs.readFileSync(
  path.join(ROOT, '_recovered_pre_checkout/src/components/ClientsManagement.tsx'),
  'utf8',
);

const helpersBlock = fs.readFileSync(path.join(ROOT, 'scripts/_clients_patches.txt'), 'utf8');
const helpers = helpersBlock
  .replace(/\/\/ FROM LINE \d+\n/g, '')
  .replace(/\nexport function ClientsManagement\(\) \{\s*$/m, '')
  .trim();

const extraHelpers = `
import { authAPI, clientesAPI, reservasAPI, type Reserva } from '../services/api';
import {
  validateClientFormForCreate,
  validateClientFormForEdit,
  type ClientFormValidationInput,
} from '../utils/clientFormValidation';
import { formatCurrencyCOP as formatCurrency } from '../utils/currencyDisplay';
import { exportRowsToCsv, exportRowsToPdf, type ExportColumn } from '../utils/exportListData';

function formatSpentCompact(value: number): string {
  const amount = Number(value || 0);
  if (amount >= 1_000_000) return \`$\${(amount / 1_000_000).toFixed(1)}M\`;
  if (amount >= 1_000) return \`$\${Math.round(amount / 1_000)}K\`;
  return formatCurrency(amount);
}

function isCancelledReserva(estado?: string | null): boolean {
  return String(estado || '').trim().toLowerCase() === 'cancelada';
}

function isActiveReserva(reserva: Reserva): boolean {
  const st = String(reserva.estado || '').trim().toLowerCase();
  return st !== 'cancelada' && st !== 'cancelado';
}

function reservaMontoPagado(reserva: Reserva): number {
  const pagado = Number(reserva.monto_pagado ?? 0);
  return Number.isFinite(pagado) && pagado > 0 ? pagado : 0;
}

function reservaMontoTotal(reserva: Reserva): number {
  const total = Number(reserva.total ?? reserva.monto_total ?? 0);
  return Number.isFinite(total) && total > 0 ? total : 0;
}

function computeClientReservationStats(reservas: Reserva[]) {
  const activas = reservas.filter((r) => !isCancelledReserva(r.estado));
  const totalSpent = activas.reduce((sum, r) => sum + reservaMontoPagado(r), 0);
  const totalReservado = activas.reduce((sum, r) => sum + reservaMontoTotal(r), 0);
  let frequencyLevel = 'Baja';
  if (activas.length >= 3) frequencyLevel = 'Alta';
  else if (activas.length >= 1) frequencyLevel = 'Media';
  return {
    totalBookings: reservas.length,
    activeBookings: activas.length,
    cancelledBookings: reservas.length - activas.length,
    totalSpent,
    totalReservado,
    frequencyLevel,
  };
}

function getReservaId(reserva: Reserva): number {
  return Number(reserva.id_reserva ?? (reserva as { id?: number }).id ?? 0);
}

function getActiveReservas(reservas: Reserva[]): Reserva[] {
  return reservas.filter(isActiveReserva);
}

const CLIENT_HISTORY_ITEMS_PER_PAGE = 5;

function reservaMatchesHistorySearch(reserva: Reserva, term: string): boolean {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return true;
  const reservaId = getReservaId(reserva);
  const monto = reservaMontoTotal(reserva);
  const haystack = [
    String(reservaId),
    reserva.tipo_servicio,
    reserva.estado,
    reserva.estado_pago,
    reserva.fecha_reserva,
    reserva.fecha_creacion,
    String(monto),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(normalized);
}

function hasValidPhone(phone?: string | null): boolean {
  const digits = String(phone || '').replace(/\\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function formatDate(value?: string | null): string {
  const raw = String(value || '').trim();
  if (!raw) return '—';
  const d = raw.includes('T') ? raw : \`\${raw.slice(0, 10)}T12:00:00\`;
  const ms = Date.parse(d);
  if (!Number.isFinite(ms)) return raw.slice(0, 10);
  return new Date(ms).toLocaleDateString('es-CO');
}

function isRegisterEmailConflictError(err: unknown): boolean {
  const msg = String((err as Error)?.message || err || '').toLowerCase();
  return msg.includes('correo') && (msg.includes('existe') || msg.includes('duplic'));
}
`;

// Fix imports section
content = content.replace(
  "import { clientesAPI } from '../services/api';",
  "import { authAPI, clientesAPI, reservasAPI, type Reserva } from '../services/api';",
);
if (!content.includes('clientFormValidation')) {
  content = content.replace(
    "import { createModulePermissions } from '../utils/permissionHelper';",
    `import { createModulePermissions } from '../utils/permissionHelper';
import {
  validateClientFormForCreate,
  validateClientFormForEdit,
  type ClientFormValidationInput,
} from '../utils/clientFormValidation';
import { formatCurrencyCOP as formatCurrency } from '../utils/currencyDisplay';
import { exportRowsToCsv, exportRowsToPdf, type ExportColumn } from '../utils/exportListData';`,
  );
}

if (!content.includes('function compareClients')) {
  content = content.replace(
    'export function ClientsManagement() {',
    `${helpers}\n\n${extraHelpers}\n\nexport function ClientsManagement() {`,
  );
}

// Ensure sort state exists
if (!content.includes('sortField')) {
  console.warn('sortField missing - file may be partial');
}

fs.writeFileSync(file, content);
console.log('fixed ClientsManagement', content.split('\n').length, 'lines');
