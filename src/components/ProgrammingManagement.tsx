import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Users,
  User,
  Phone,
  Mail,
  X,
  ChevronLeft,
  ChevronRight,
  Save,
  AlertTriangle,
  Route,
  Home as HomeIcon,
  Utensils,
  Bed,
  Bus,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  CheckCircle2,
  Ban,
  Download,
} from 'lucide-react';
import { ProgrammingFormImproved } from './ProgrammingFormImproved';
import { GuideAvailabilityCalendar } from './GuideAvailabilityCalendar';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { cn } from './ui/utils';
import {
  formatDateDisplay,
  formatDateTimeDisplay,
  formatTimeDisplay,
} from '../utils/dateTimeDisplay';
import { toast } from 'sonner';
import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';
import {
  empleadosAPI,
  programacionAPI,
  reservasAPI,
  rutasAPI,
  serviciosAPI,
  solicitudesPersonalizadasAPI,
  type Ruta,
  type Empleado as EmpleadoBackend,
  type Programacion as ProgramacionBackend,
  type Reserva,
  type Servicio,
  type SolicitudPersonalizada,
} from '../services/api';
import { formatRutaDuracionHoras } from '../utils/routeDateCalendar';

/** Borrador de revisión de solicitud personalizada (staff). Sobrevive cambiar de módulo en la misma pestaña. */
type SolicitudRevisionEditRow = {
  fecha_salida: string;
  fecha_regreso: string;
  hora_salida: string;
  hora_regreso: string;
  precio_programacion: string;
  lugar_encuentro: string;
  id_empleado: string;
  id_empleado_apoyo: string;
};

const SOLICITUD_REVISION_SESSION_KEY = 'occitour:staff:solicitud-revision-draft:v2';
const SOLICITUD_RECHAZO_MOTIVO_MIN = 10;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function parseSolicitudRevisionSessionDrafts(): Record<number, SolicitudRevisionEditRow> {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(SOLICITUD_REVISION_SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!isPlainObject(parsed)) return {};
    const out: Record<number, SolicitudRevisionEditRow> = {};
    for (const [k, val] of Object.entries(parsed)) {
      const id = Number(k);
      if (!Number.isFinite(id) || id <= 0 || !isPlainObject(val)) continue;
      const row = val;
      out[id] = {
        fecha_salida: typeof row.fecha_salida === 'string' ? row.fecha_salida : '',
        fecha_regreso: typeof row.fecha_regreso === 'string' ? row.fecha_regreso : '',
        hora_salida: typeof row.hora_salida === 'string' ? row.hora_salida : '',
        hora_regreso: typeof row.hora_regreso === 'string' ? row.hora_regreso : '',
        precio_programacion: typeof row.precio_programacion === 'string' ? row.precio_programacion : '',
        lugar_encuentro: typeof row.lugar_encuentro === 'string' ? row.lugar_encuentro : '',
        id_empleado: typeof row.id_empleado === 'string' ? row.id_empleado : '__none__',
        id_empleado_apoyo: typeof row.id_empleado_apoyo === 'string' ? row.id_empleado_apoyo : '__none__',
      };
    }
    return out;
  } catch {
    return {};
  }
}

function persistSolicitudRevisionSessionDrafts(drafts: Record<number, SolicitudRevisionEditRow>) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(SOLICITUD_REVISION_SESSION_KEY, JSON.stringify(drafts));
  } catch {
    /* Quota / modo privado */
  }
}

/** Superpone borradores guardados en sesión sobre lo que viene del API (por si el backend aún no persiste PATCH /cotizar). */
function mergeBaseSolicitudEditsWithSessionDrafts(
  base: Record<number, SolicitudRevisionEditRow>
): Record<number, SolicitudRevisionEditRow> {
  const stored = parseSolicitudRevisionSessionDrafts();
  const next = { ...base };
  for (const [rawId, draft] of Object.entries(stored)) {
    const id = Number(rawId);
    if (!next[id]) continue;
    next[id] = { ...next[id], ...draft };
  }
  return next;
}

function removeSolicitudRevisionSessionDraft(id: number) {
  const stored = parseSolicitudRevisionSessionDrafts();
  if (!(id in stored)) return;
  delete stored[id];
  persistSolicitudRevisionSessionDrafts(stored);
}

// Interfaces
interface Companion {
  id: string;
  name: string;
  document: string;
  phone: string;
  email?: string;
  age?: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  companions: Companion[];
}

interface RouteItem {
  id: string;
  name: string;
  description: string;
  duration: string;
  difficulty: string;
  maxCapacity: number;
}

interface Guide {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
}

interface AdditionalService {
  id: string;
  name: string;
  type: 'accommodation' | 'food' | 'transport' | 'other';
  price: number;
  description?: string;
}

interface ProgrammingRoute {
  routeId: string;
  routeName: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface Programming {
  id: string;
  programId: string;
  routes: ProgrammingRoute[];
  clients: Client[];
  guideId: string;
  guideName: string;
  guidePhone?: string;
  guideEmail?: string;
  guideRoleLabel?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  additionalServices: AdditionalService[];
  notes?: string;
  createdAt: string;
  /** Milisegundos para ordenar por “última creada” (API o id como respaldo). */
  createdAtMs?: number;
  createdBy: string;
  totalSeats?: number;
  availableSeats?: number;
  occupiedSeats?: number;
  isPersonalizada?: boolean;
}

interface ProgrammingManagementProps {
  role: 'admin' | 'advisor' | 'guide' | 'client';
  userId?: string;
  userName?: string;
}

type ProgrammingsSortFilter =
  | 'created-desc'
  | 'created-asc'
  | 'date-asc'
  | 'date-desc'
  | 'time-asc'
  | 'time-desc';

const parseProgramacionCreatedMs = (
  raw?: string | null,
  fallbackId?: number | string | null,
): number => {
  const s = String(raw || '').trim();
  if (s) {
    const hasClock = /[T ]\d{1,2}:\d/.test(s);
    const candidate = hasClock ? s : `${s.slice(0, 10)}T12:00:00`;
    const ms = Date.parse(candidate);
    if (!Number.isNaN(ms)) return ms;
  }
  const id = Number(fallbackId);
  return Number.isFinite(id) && id > 0 ? id : 0;
};

/** Coerción segura desde API/BD (evita `"false"` → truthy). */
function normalizeEsPersonalizada(raw: unknown): boolean {
  if (raw === true || raw === 1) return true;
  if (raw === false || raw === 0 || raw === null || raw === undefined) return false;
  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase();
    if (!s || s === 'false' || s === 'f' || s === 'no' || s === '0') return false;
    if (s === 'true' || s === 't' || s === '1' || s === 'yes' || s === 'si' || s === 'sí') return true;
  }
  return false;
}

/** Flag efectivo si el backend no envía `es_personalizada` pero sí hay solicitud vinculada. */
function esPersonalizadaPorProgramacion(
  row?: Pick<ProgramacionBackend, 'es_personalizada' | 'id_solicitud_personalizada'> | null,
): boolean {
  if (!row) return false;
  const solicitudId = Number(row.id_solicitud_personalizada);
  if (Number.isFinite(solicitudId) && solicitudId > 0) return true;
  return normalizeEsPersonalizada(row.es_personalizada);
}

/** Etiqueta por fila: evita Badge base con overflow-hidden; usa tonos violeta incluidos en el CSS compilado (indigo-* no está en el bundle). */
function SalidaTipoProgramacionBadge({ esPersonalizada }: { esPersonalizada: boolean }) {
  if (esPersonalizada) {
    return (
      <span
        title="Ruta personalizada / cotizada o convertida desde solicitud"
        className={cn(
          'mx-auto inline-flex min-w-max shrink-0 max-w-none select-none rounded-md px-2.5 py-1 text-[11px] font-semibold leading-tight whitespace-nowrap shadow-sm',
          'border border-purple-500 bg-purple-100 text-purple-900',
        )}
      >
        Personalizada
      </span>
    );
  }
  return (
    <span
      title="Salida del calendario de rutas (catálogo)"
      className={cn(
        'mx-auto inline-flex min-w-max shrink-0 max-w-none select-none rounded-md px-2.5 py-1 text-[11px] font-semibold leading-tight whitespace-nowrap',
        'border border-emerald-600 bg-emerald-50 text-emerald-900',
      )}
    >
      Programada
    </span>
  );
}

interface BackendProgrammingFormState {
  id_ruta: string;
  fecha_salida: string;
  fecha_regreso: string;
  hora_salida: string;
  hora_regreso: string;
  cupos_totales: string;
  precio_programacion: string;
  id_empleado: string;
  lugar_encuentro: string;
}

interface BackendProgrammingEditFormState extends BackendProgrammingFormState {
  cupos_disponibles: string;
  estado: string;
}

export function ProgrammingManagement({ role, userId, userName }: ProgrammingManagementProps) {
  const permissions = usePermissions();
  const programmingPerms = createModulePermissions(permissions, 'Programaciones');

  const isStaffRole = role === 'admin' || role === 'advisor';

  // Compatibilidad: algunas BD/backends pudieron usar el módulo en singular o la acción "actualizar".
  const canViewProgramming = programmingPerms.canView() || permissions.hasPermission('programacion.leer');
  const canCreateProgramming = programmingPerms.canCreate() || permissions.hasPermission('programacion.crear');
  const canEditProgramming =
    programmingPerms.canEdit() ||
    permissions.hasPermission('programaciones.actualizar') ||
    permissions.hasPermission('programacion.editar') ||
    permissions.hasPermission('programacion.actualizar');
  const canDeleteProgramming = programmingPerms.canDelete() || permissions.hasPermission('programacion.eliminar');

  const canUseBackendStaff = isStaffRole && !permissions.loadingRoles && canViewProgramming;
  const canUseBackendGuide = role === 'guide';
  const canUseBackend = canUseBackendStaff || canUseBackendGuide;

  const isGuideEmployee = (employee: EmpleadoBackend) => {
    const cargo = String(employee.cargo || '').toLowerCase();
    const rolNombre = String(employee.rol_nombre || '').toLowerCase();
    return cargo.includes('guia') || cargo.includes('guide') || rolNombre.includes('guia') || rolNombre.includes('guide');
  };

  const formatCurrency = (value?: number | string | null) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '—';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(numeric);
  };

  const normalizeContratoFecha = (value?: string | null) => {
    if (value == null) return '';
    const s = String(value).trim();
    return s ? s.slice(0, 10) : '';
  };

  // Mock data - Rutas disponibles
  const availableRoutes: RouteItem[] = [
    {
      id: 'r1',
      name: 'Sendero del Café',
      description: 'Caminata guiada por plantaciones de café',
      duration: '4 horas',
      difficulty: 'Moderado',
      maxCapacity: 15
    },
    {
      id: 'r2',
      name: 'Ruta de los Colibríes',
      description: 'Avistamiento de aves en reserva natural',
      duration: '6 horas',
      difficulty: 'Fácil',
      maxCapacity: 12
    },
    {
      id: 'r3',
      name: 'Sendero Mariposas',
      description: 'Ruta ecológica con mariposario',
      duration: '5 horas',
      difficulty: 'Moderado',
      maxCapacity: 18
    },
    {
      id: 'r4',
      name: 'Cascadas del Bosque',
      description: 'Caminata de alta montaña hacia cascadas',
      duration: '8 horas',
      difficulty: 'Avanzado',
      maxCapacity: 10
    },
    {
      id: 'r5',
      name: 'Valle del Cocora',
      description: 'Recorrido por el valle con palmas de cera',
      duration: '7 horas',
      difficulty: 'Moderado',
      maxCapacity: 20
    }
  ];

  // Mock data - Clientes registrados ampliados
  const availableClients: Client[] = [
    {
      id: 'c1',
      name: 'María López Cliente', // Cliente del sistema
      email: 'cliente@occitours.com',
      phone: '+57 310 123 4567',
      document: '1234567890',
      companions: [
        { id: 'comp1', name: 'Juan López Esposo', document: '9876543210', phone: '+57 310 123 4568', age: 35 },
        { id: 'comp2', name: 'Ana López Hija', document: '5555555555', phone: '+57 310 123 4569', age: 8 },
        { id: 'comp3', name: 'Pedro López Hijo', document: '4444444444', phone: '+57 310 123 4570', age: 12 }
      ]
    },
    {
      id: 'c2',
      name: 'Carlos Mendoza Ruiz',
      email: 'carlos@example.com',
      phone: '+57 320 456 7890',
      document: '2345678901',
      companions: [
        { id: 'comp3', name: 'Laura Mendoza', document: '7777777777', phone: '+57 320 456 7891', age: 32 }
      ]
    },
    {
      id: 'c3',
      name: 'Laura Vásquez Castro',
      email: 'laura@example.com',
      phone: '+57 315 789 0123',
      document: '3456789012',
      companions: []
    },
    {
      id: 'c4',
      name: 'Roberto Silva Vargas',
      email: 'roberto@example.com',
      phone: '+57 300 111 2222',
      document: '4567890123',
      companions: [
        { id: 'comp4', name: 'Patricia Silva', document: '8888888888', phone: '+57 300 111 2223', age: 28 },
        { id: 'comp5', name: 'Camila Silva', document: '9999999999', phone: '+57 300 111 2224', age: 12 },
        { id: 'comp6', name: 'Diego Silva', document: '1111111111', phone: '+57 300 111 2225', age: 10 }
      ]
    },
    {
      id: 'c5',
      name: 'Andrea Martínez Pérez',
      email: 'andrea.m@example.com',
      phone: '+57 318 222 3333',
      document: '5678901234',
      companions: [
        { id: 'comp7', name: 'Sofía Martínez', document: '2222222222', phone: '+57 318 222 3334', age: 6 }
      ]
    },
    {
      id: 'c6',
      name: 'Fernando Rojas Díaz',
      email: 'fernando.r@example.com',
      phone: '+57 301 333 4444',
      document: '6789012345',
      companions: [
        { id: 'comp8', name: 'Carolina Rojas', document: '3333333333', phone: '+57 301 333 4445', age: 30 },
        { id: 'comp9', name: 'Mateo Rojas', document: '4444444444', phone: '+57 301 333 4446', age: 14 }
      ]
    },
    {
      id: 'c7',
      name: 'Valentina Herrera Torres',
      email: 'valentina.h@example.com',
      phone: '+57 312 444 5555',
      document: '7890123456',
      companions: []
    },
    {
      id: 'c8',
      name: 'Diego Castro Morales',
      email: 'diego.c@example.com',
      phone: '+57 305 555 6666',
      document: '8901234567',
      companions: [
        { id: 'comp10', name: 'Juliana Castro', document: '5555666677', phone: '+57 305 555 6667', age: 25 }
      ]
    },
    {
      id: 'c9',
      name: 'Camila Sánchez Ortiz',
      email: 'camila.s@example.com',
      phone: '+57 319 666 7777',
      document: '9012345678',
      companions: [
        { id: 'comp11', name: 'Luis Sánchez', document: '6666777788', phone: '+57 319 666 7778', age: 45 },
        { id: 'comp12', name: 'María Sánchez', document: '7777888899', phone: '+57 319 666 7779', age: 42 }
      ]
    },
    {
      id: 'c10',
      name: 'Santiago Gómez Ríos',
      email: 'santiago.g@example.com',
      phone: '+57 302 777 8888',
      document: '0123456789',
      companions: []
    },
    {
      id: 'c11',
      name: 'Isabella Ramírez Luna',
      email: 'isabella.r@example.com',
      phone: '+57 316 888 9999',
      document: '1122334455',
      companions: [
        { id: 'comp13', name: 'Andrés Ramírez', document: '8888999900', phone: '+57 316 888 9990', age: 50 }
      ]
    },
    {
      id: 'c12',
      name: 'Mateo Torres Vargas',
      email: 'mateo.t@example.com',
      phone: '+57 313 999 0000',
      document: '2233445566',
      companions: [
        { id: 'comp14', name: 'Elena Torres', document: '9999000011', phone: '+57 313 999 0001', age: 38 },
        { id: 'comp15', name: 'Lucas Torres', document: '0000111122', phone: '+57 313 999 0002', age: 16 }
      ]
    }
  ];

  // Mock data - Guías registrados
  const availableGuides: Guide[] = [
    {
      id: 'g1',
      name: 'Carlos Ruiz Guía', // Guía del sistema
      email: 'guia@occitours.com',
      phone: '+57 301 234 5678',
      specialization: 'Ecoturismo'
    },
    {
      id: 'g2',
      name: 'Pedro Martínez',
      email: 'pedro.martinez@occitours.com',
      phone: '+57 302 345 6789',
      specialization: 'Montañismo'
    },
    {
      id: 'g3',
      name: 'Ana García',
      email: 'ana.garcia@occitours.com',
      phone: '+57 303 456 7890',
      specialization: 'Aviturismo'
    },
    {
      id: 'g4',
      name: 'Sofia Herrera',
      email: 'sofia.herrera@occitours.com',
      phone: '+57 304 567 8901',
      specialization: 'Cultura y Naturaleza'
    }
  ];

  // Mock data - Servicios adicionales
  const serviceOptions: AdditionalService[] = [
    { id: 's1', name: 'Alojamiento Hotel 3★', type: 'accommodation', price: 150000, description: 'Habitación doble con desayuno' },
    { id: 's2', name: 'Alojamiento Hotel 5★', type: 'accommodation', price: 350000, description: 'Suite con todas las comodidades' },
    { id: 's3', name: 'Camping', type: 'accommodation', price: 50000, description: 'Carpa para 2 personas' },
    { id: 's4', name: 'Almuerzo Típico', type: 'food', price: 35000, description: 'Comida tradicional de la región' },
    { id: 's5', name: 'Cena Gourmet', type: 'food', price: 65000, description: 'Cena de 3 tiempos' },
    { id: 's6', name: 'Snacks y Bebidas', type: 'food', price: 20000, description: 'Refrigerios para el camino' },
    { id: 's7', name: 'Transporte Privado', type: 'transport', price: 80000, description: 'Van con aire acondicionado' },
    { id: 's8', name: 'Transporte Compartido', type: 'transport', price: 30000, description: 'Bus turístico' },
    { id: 's9', name: 'Seguro de Viaje', type: 'other', price: 25000, description: 'Cobertura completa' },
    { id: 's10', name: 'Fotografía Profesional', type: 'other', price: 100000, description: 'Sesión fotográfica del tour' }
  ];

  // Estado - 12 programaciones mock
  const [programmings, setProgrammings] = useState<Programming[]>([
    {
      id: '1',
      programId: 'PRG-001',
      routes: [
        { routeId: 'r1', routeName: 'Sendero del Café', date: '2024-12-20', startTime: '08:00', endTime: '12:00' }
      ],
      clients: [availableClients[0], availableClients[1], availableClients[2]], // María López Cliente + otros
      guideId: 'g1',
      guideName: 'Carlos Ruiz Guía', // Guía del sistema
      status: 'scheduled',
      additionalServices: [serviceOptions[3], serviceOptions[6]],
      notes: 'Grupo familiar con niños, llevar material educativo sobre café y snacks adicionales',
      createdAt: '2024-12-01',
      createdBy: 'Ana García Asesor'
    },
    {
      id: '2',
      programId: 'PRG-002',
      routes: [
        { routeId: 'r2', routeName: 'Ruta de los Colibríes', date: '2024-12-21', startTime: '06:00', endTime: '12:00' }
      ],
      clients: [availableClients[3], availableClients[4], availableClients[5], availableClients[6]],
      guideId: 'g3',
      guideName: 'Ana García',
      status: 'scheduled',
      additionalServices: [serviceOptions[5], serviceOptions[7]],
      notes: 'Incluir binoculares para todos los participantes',
      createdAt: '2024-12-02',
      createdBy: 'Sofia Herrera'
    },
    {
      id: '3',
      programId: 'PRG-003',
      routes: [
        { routeId: 'r5', routeName: 'Valle del Cocora', date: '2024-12-22', startTime: '07:00', endTime: '14:00' },
        { routeId: 'r3', routeName: 'Sendero Mariposas', date: '2024-12-23', startTime: '09:00', endTime: '14:00' }
      ],
      clients: [availableClients[7], availableClients[8], availableClients[9], availableClients[10], availableClients[11]],
      guideId: 'g2',
      guideName: 'Pedro Martínez',
      status: 'in-progress',
      additionalServices: [serviceOptions[1], serviceOptions[3], serviceOptions[4], serviceOptions[6], serviceOptions[8]],
      notes: 'Tour premium de 2 días, revisar alojamiento',
      createdAt: '2024-11-28',
      createdBy: 'Ana García'
    },
    {
      id: '4',
      programId: 'PRG-004',
      routes: [
        { routeId: 'r4', routeName: 'Cascadas del Bosque', date: '2024-12-24', startTime: '06:00', endTime: '14:00' }
      ],
      clients: [availableClients[0], availableClients[2], availableClients[4]],
      guideId: 'g2',
      guideName: 'Pedro Martínez',
      status: 'scheduled',
      additionalServices: [serviceOptions[3], serviceOptions[8], serviceOptions[9]],
      notes: 'Ruta avanzada, verificar estado físico de participantes',
      createdAt: '2024-12-03',
      createdBy: 'Carlos Ruiz'
    },
    {
      id: '5',
      programId: 'PRG-005',
      routes: [
        { routeId: 'r1', routeName: 'Sendero del Café', date: '2024-12-25', startTime: '09:00', endTime: '13:00' }
      ],
      clients: [availableClients[5], availableClients[6], availableClients[7], availableClients[8]],
      guideId: 'g1',
      guideName: 'Carlos Ruiz Guía', // Guía del sistema
      status: 'scheduled',
      additionalServices: [serviceOptions[3], serviceOptions[5]],
      notes: 'Grupo familiar, incluir actividades para niños',
      createdAt: '2024-12-04',
      createdBy: 'Ana García Asesor'
    },
    {
      id: '6',
      programId: 'PRG-006',
      routes: [
        { routeId: 'r3', routeName: 'Sendero Mariposas', date: '2024-12-26', startTime: '08:30', endTime: '13:30' }
      ],
      clients: [availableClients[1], availableClients[3], availableClients[9], availableClients[11]],
      guideId: 'g4',
      guideName: 'Sofia Herrera',
      status: 'completed',
      additionalServices: [serviceOptions[3], serviceOptions[6], serviceOptions[9]],
      notes: 'Tour completado exitosamente, excelentes comentarios',
      createdAt: '2024-11-25',
      createdBy: 'Ana García'
    },
    {
      id: '7',
      programId: 'PRG-007',
      routes: [
        { routeId: 'r2', routeName: 'Ruta de los Colibríes', date: '2024-12-27', startTime: '06:30', endTime: '12:30' }
      ],
      clients: [availableClients[0], availableClients[4], availableClients[6], availableClients[10]], // María López Cliente + otros
      guideId: 'g1',
      guideName: 'Carlos Ruiz Guía', // Guía del sistema
      status: 'scheduled',
      additionalServices: [serviceOptions[5], serviceOptions[7]],
      notes: 'Temporada alta de avistamiento, llevar binoculares',
      createdAt: '2024-12-05',
      createdBy: 'Ana García Asesor'
    },
    {
      id: '7b',
      programId: 'PRG-007B',
      routes: [
        { routeId: 'r3', routeName: 'Sendero Mariposas', date: '2024-12-28', startTime: '09:00', endTime: '14:00' }
      ],
      clients: [availableClients[0], availableClients[3], availableClients[7]], // María López Cliente + otros
      guideId: 'g1',
      guideName: 'Carlos Ruiz Guía', // Guía del sistema
      status: 'in-progress',
      additionalServices: [serviceOptions[3], serviceOptions[6], serviceOptions[9]],
      notes: 'Tour en progreso, clima favorable',
      createdAt: '2024-12-06',
      createdBy: 'Ana García Asesor'
    },
    {
      id: '7c',
      programId: 'PRG-013',
      routes: [
        { routeId: 'r5', routeName: 'Valle del Cocora', date: '2025-01-05', startTime: '07:00', endTime: '15:00' }
      ],
      clients: [availableClients[0], availableClients[2], availableClients[5], availableClients[9]], // María López Cliente + otros
      guideId: 'g1',
      guideName: 'Carlos Ruiz Guía', // Guía del sistema
      status: 'scheduled',
      additionalServices: [serviceOptions[3], serviceOptions[6], serviceOptions[8], serviceOptions[9]],
      notes: 'Grupo grande, coordinar transporte con anticipación',
      createdAt: '2024-12-10',
      createdBy: 'Ana García Asesor'
    },
    {
      id: '7d',
      programId: 'PRG-014',
      routes: [
        { routeId: 'r4', routeName: 'Cascadas del Bosque', date: '2025-01-10', startTime: '06:00', endTime: '14:00' }
      ],
      clients: [availableClients[1], availableClients[4], availableClients[8]],
      guideId: 'g3',
      guideName: 'Ana García',
      status: 'scheduled',
      additionalServices: [serviceOptions[5], serviceOptions[7]],
      notes: 'Temporada alta de avistamiento',
      createdAt: '2024-12-05',
      createdBy: 'Carlos Ruiz'
    },
    {
      id: '8',
      programId: 'PRG-008',
      routes: [
        { routeId: 'r5', routeName: 'Valle del Cocora', date: '2024-12-28', startTime: '07:30', endTime: '15:00' }
      ],
      clients: [availableClients[2], availableClients[5], availableClients[8], availableClients[11]],
      guideId: 'g2',
      guideName: 'Pedro Martínez',
      status: 'in-progress',
      additionalServices: [serviceOptions[3], serviceOptions[6], serviceOptions[8]],
      notes: 'Clima favorable, continuar según plan',
      createdAt: '2024-12-06',
      createdBy: 'Sofia Herrera'
    },
    {
      id: '9',
      programId: 'PRG-009',
      routes: [
        { routeId: 'r1', routeName: 'Sendero del Café', date: '2024-12-29', startTime: '08:00', endTime: '12:00' }
      ],
      clients: [availableClients[1], availableClients[7], availableClients[9]],
      guideId: 'g1',
      guideName: 'Carlos Ruiz Guía', // Guía del sistema
      status: 'completed',
      additionalServices: [serviceOptions[3], serviceOptions[5]],
      notes: 'Tour exitoso completado, clientes muy satisfechos solicitan repetir experiencia',
      createdAt: '2024-11-20',
      createdBy: 'Ana García'
    },
    {
      id: '10',
      programId: 'PRG-010',
      routes: [
        { routeId: 'r4', routeName: 'Cascadas del Bosque', date: '2024-12-30', startTime: '05:30', endTime: '13:30' }
      ],
      clients: [availableClients[3], availableClients[6], availableClients[10]],
      guideId: 'g2',
      guideName: 'Pedro Martínez',
      status: 'cancelled',
      additionalServices: [serviceOptions[3], serviceOptions[8]],
      notes: 'Cancelado por mal clima, reprogramar',
      createdAt: '2024-12-07',
      createdBy: 'Carlos Ruiz'
    },
    {
      id: '11',
      programId: 'PRG-011',
      routes: [
        { routeId: 'r3', routeName: 'Sendero Mariposas', date: '2024-12-31', startTime: '09:00', endTime: '14:00' }
      ],
      clients: [availableClients[0], availableClients[2], availableClients[4], availableClients[8], availableClients[11]], // María López Cliente + otros
      guideId: 'g1',
      guideName: 'Carlos Ruiz Guía', // Guía del sistema
      status: 'scheduled',
      additionalServices: [serviceOptions[3], serviceOptions[6], serviceOptions[9]],
      notes: 'Reserva especial fin de año, grupo grande con varias familias',
      createdAt: '2024-12-08',
      createdBy: 'Ana García Asesor'
    },
    {
      id: '12',
      programId: 'PRG-012',
      routes: [
        { routeId: 'r2', routeName: 'Ruta de los Colibríes', date: '2025-01-01', startTime: '06:00', endTime: '12:00' }
      ],
      clients: [availableClients[1], availableClients[5], availableClients[7], availableClients[9], availableClients[10]],
      guideId: 'g3',
      guideName: 'Ana García',
      status: 'scheduled',
      additionalServices: [serviceOptions[5], serviceOptions[7], serviceOptions[9]],
      notes: 'Inicio de año, grupo especial',
      createdAt: '2024-12-09',
      createdBy: 'Ana García'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState<'all' | 'programada' | 'personalizada'>('all');
  const [guideFilter, setGuideFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState<ProgrammingsSortFilter>('created-desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [staffActiveTab, setStaffActiveTab] = useState<'programaciones' | 'solicitudes'>('programaciones');
  const [expandedSolicitudId, setExpandedSolicitudId] = useState<number | null>(null);
  const [solicitudesSearchTerm, setSolicitudesSearchTerm] = useState('');
  const [solicitudesEstadoFilter, setSolicitudesEstadoFilter] = useState<
    'todas' | 'por_revisar' | 'pago_habilitado' | 'listas_convertir'
  >('todas');
  const [solicitudesPage, setSolicitudesPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [staffProgrammingCreatePage, setStaffProgrammingCreatePage] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProgramming, setSelectedProgramming] = useState<Programming | null>(null);

  // =====================================================
  // BACKEND PROGRAMACION (solo staff): editar guía + lugar
  // =====================================================

  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendEmpleados, setBackendEmpleados] = useState<EmpleadoBackend[]>([]);
  const [backendProgramaciones, setBackendProgramaciones] = useState<ProgramacionBackend[]>([]);
  const [backendRutas, setBackendRutas] = useState<Ruta[]>([]);
  const [backendServiciosById, setBackendServiciosById] = useState<Record<number, Pick<Servicio, 'nombre' | 'precio'>>>({});

  const [backendCreateSaving, setBackendCreateSaving] = useState(false);
  const [backendCreateStep, setBackendCreateStep] = useState<1 | 2>(1);
  const backendCreateScrollRef = useRef<HTMLDivElement | null>(null);
  const [backendCreateForm, setBackendCreateForm] = useState<BackendProgrammingFormState>({
    id_ruta: '',
    fecha_salida: '',
    fecha_regreso: '',
    hora_salida: '',
    hora_regreso: '',
    cupos_totales: '',
    precio_programacion: '',
    id_empleado: '__none__',
    lugar_encuentro: '',
  });
  const [backendCreateRouteQuery, setBackendCreateRouteQuery] = useState('');
  const [backendCreateGuideQuery, setBackendCreateGuideQuery] = useState('');

  const [backendEditSaving, setBackendEditSaving] = useState(false);
  const [backendEditTargetId, setBackendEditTargetId] = useState<number | null>(null);
  const [backendEditForm, setBackendEditForm] = useState<BackendProgrammingEditFormState>({
    id_ruta: '',
    fecha_salida: '',
    fecha_regreso: '',
    hora_salida: '',
    hora_regreso: '',
    cupos_totales: '',
    cupos_disponibles: '',
    precio_programacion: '',
    estado: 'Programado',
    id_empleado: '__none__',
    lugar_encuentro: '',
  });
  const [backendEditRouteQuery, setBackendEditRouteQuery] = useState('');
  const [backendEditGuideQuery, setBackendEditGuideQuery] = useState('');
  const [backendEditCommittedSeats, setBackendEditCommittedSeats] = useState(0);
  /** Fechas de salida/regreso pactadas con el cliente (personalizadas); no deben cambiar al editar. */
  const [backendEditContratoFechas, setBackendEditContratoFechas] = useState<{
    fecha_salida: string;
    fecha_regreso: string;
  } | null>(null);
  /** Ids de empleados guía de apoyo (además del guía principal). Requiere que el backend persista `guias_apoyo`. */
  const [backendEditGuiaApoyoIds, setBackendEditGuiaApoyoIds] = useState<string[]>([]);

  const [backendSolicitudes, setBackendSolicitudes] = useState<SolicitudPersonalizada[]>([]);
  const [backendSolicitudEdits, setBackendSolicitudEdits] = useState<Record<number, SolicitudRevisionEditRow>>({});
  const [solicitudRevMainGuideQuery, setSolicitudRevMainGuideQuery] = useState('');
  const [solicitudRevApoyoGuideQuery, setSolicitudRevApoyoGuideQuery] = useState('');
  const [backendConvertingId, setBackendConvertingId] = useState<number | null>(null);
  const [backendSolicitudSavingId, setBackendSolicitudSavingId] = useState<number | null>(null);
  const [solicitudRejectDialogOpen, setSolicitudRejectDialogOpen] = useState(false);
  const [solicitudRejectTarget, setSolicitudRejectTarget] = useState<SolicitudPersonalizada | null>(null);
  const [solicitudRejectMotivo, setSolicitudRejectMotivo] = useState('');
  const [backendViewDetail, setBackendViewDetail] = useState<ProgramacionBackend | null>(null);
  const [backendViewLoading, setBackendViewLoading] = useState(false);
  const [backendViewError, setBackendViewError] = useState<string | null>(null);
  const [backendViewReservas, setBackendViewReservas] = useState<Reserva[]>([]);
  const [backendViewReservasLoading, setBackendViewReservasLoading] = useState(false);
  const [backendViewReservasError, setBackendViewReservasError] = useState<string | null>(null);
  /** Detalle de ruta al abrir "Ver detalle" (todos los roles): textos largos de recomendaciones / briefing */
  const [viewModalRuta, setViewModalRuta] = useState<Ruta | null>(null);
  const [viewModalRutaLoading, setViewModalRutaLoading] = useState(false);
  const [reservaPreviewOpen, setReservaPreviewOpen] = useState(false);
  const [reservaPreview, setReservaPreview] = useState<Reserva | null>(null);
  const [reservaPreviewLoading, setReservaPreviewLoading] = useState(false);

  const backendGuides = backendEmpleados.filter(isGuideEmployee);

  const programmingGuideOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of backendGuides) {
      const id = String(g.id_empleado);
      const name = [g.nombre, g.apellido].filter(Boolean).join(' ').trim();
      if (id && name) map.set(id, name);
    }
    for (const p of backendProgramaciones || []) {
      const id = p.id_empleado ? String(p.id_empleado) : '';
      const name = [p.empleado_nombre, p.empleado_apellido].filter(Boolean).join(' ').trim();
      if (id && name && !map.has(id)) map.set(id, name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [backendGuides, backendProgramaciones]);

  const programmingRouteOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of backendRutas) {
      const id = String(r.id_ruta);
      const name = String(r.nombre || '').trim();
      if (id && name) map.set(id, name);
    }
    for (const p of backendProgramaciones || []) {
      const id = p.id_ruta ? String(p.id_ruta) : '';
      const name = String(p.ruta_nombre || '').trim();
      if (id && name && !map.has(id)) map.set(id, name || `Ruta ${id}`);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [backendRutas, backendProgramaciones]);

  const hasActiveProgrammingFilters =
    statusFilter !== 'all' ||
    tipoFilter !== 'all' ||
    guideFilter !== 'all' ||
    routeFilter !== 'all' ||
    sortFilter !== 'created-desc' ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const clearProgrammingFilters = () => {
    setStatusFilter('all');
    setTipoFilter('all');
    setGuideFilter('all');
    setRouteFilter('all');
    setSortFilter('created-desc');
    setDateFrom('');
    setDateTo('');
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, tipoFilter, guideFilter, routeFilter, sortFilter, dateFrom, dateTo]);

  const getReservaRowId = (r: Reserva): number | null => {
    const n = Number(r.id_reserva ?? r.id);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const getReservaClienteLabel = (r: Reserva) =>
    `${r.cliente_nombre || ''} ${r.cliente_apellido || ''}`.trim() || 'Cliente';

  const getReservaDocumentoLabel = (r: Reserva) => {
    const label = [r.tipo_documento, r.numero_documento]
      .filter(Boolean)
      .map((v) => String(v).trim())
      .join(' ')
      .trim();
    return label || '—';
  };

  const renderProgramacionSalidaHorario = (
    route: { date: string; startTime?: string; endTime?: string } | undefined,
  ) => {
    if (!route?.date) return null;
    return (
      <div className="text-sm space-y-0.5 min-w-[7.5rem]">
        <div>{formatDateDisplay(route.date)}</div>
        {route.startTime ? (
          <div className="text-xs text-gray-600 whitespace-nowrap">
            Salida: {formatTimeDisplay(route.startTime)}
          </div>
        ) : null}
        {route.endTime ? (
          <div className="text-xs text-gray-600 whitespace-nowrap">
            Regreso: {formatTimeDisplay(route.endTime)}
          </div>
        ) : null}
      </div>
    );
  };

  const getReservaNotasResumen = (r: Reserva) => {
    const raw = (r as Record<string, unknown>).observaciones;
    const fromObs = typeof raw === 'string' ? raw : '';
    const fromNotas = typeof r.notas === 'string' ? r.notas : '';
    const t = (fromNotas || fromObs || '').trim();
    return t;
  };

  const truncateResumenNotas = (text: string, max: number) => {
    const t = text.trim();
    if (!t) return '—';
    if (t.length <= max) return t;
    return `${t.slice(0, max)}…`;
  };

  const getReservaAcompanantes = (r: Reserva) =>
    Array.isArray(r.acompanantes) ? r.acompanantes : [];

  /**
   * Exporta la lista de participantes (titulares + acompañantes) a un CSV
   * que abre directamente en Excel con los datos de la salida seleccionada.
   */
  const exportParticipantesCSV = () => {
    if (backendViewReservas.length === 0) return;

    const rutaNombre = backendViewDetail?.ruta_nombre || selectedProgramming?.routes[0]?.name || 'salida';
    const fechaSalida = backendViewDetail?.fecha_salida || selectedProgramming?.routes[0]?.date || '';
    const nombreArchivo = [
      'participantes',
      rutaNombre.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '').replace(/\s+/g, '_'),
      fechaSalida,
    ]
      .filter(Boolean)
      .join('_');

    const escapeCsv = (val: unknown): string => {
      const s = String(val ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };

    const headers = [
      'Reserva',
      'Tipo participante',
      'Nombre',
      'Apellido',
      'Tipo documento',
      'Número documento',
      'Teléfono',
      'Email',
      'Estado reserva',
      'Estado pago',
      'Notas (resumen)',
    ];

    const rows: string[][] = [];

    backendViewReservas.forEach((reserva) => {
      const rid = getReservaRowId(reserva);
      const idLabel = rid != null ? `#${rid}` : '—';
      const estadoReserva = reserva.estado ?? '—';
      const estadoPago = reserva.estado_pago ?? '—';
      const notas = getReservaNotasResumen(reserva);
      const email = reserva.cliente_email ?? '';
      const telefono = reserva.cliente_telefono ?? '';

      // Fila del titular
      rows.push([
        idLabel,
        'Titular',
        reserva.cliente_nombre ?? '',
        reserva.cliente_apellido ?? '',
        reserva.tipo_documento ?? '',
        reserva.numero_documento ?? '',
        telefono,
        email,
        estadoReserva,
        estadoPago,
        notas,
      ]);

      // Filas de acompañantes
      const acomps = getReservaAcompanantes(reserva);
      acomps.forEach((ac: any) => {
        rows.push([
          idLabel,
          'Acompañante',
          ac.nombre ?? '',
          ac.apellido ?? '',
          ac.tipo_documento ?? '',
          ac.numero_documento ?? '',
          ac.telefono ?? '',
          ac.correo ?? ac.email ?? '',
          estadoReserva,
          estadoPago,
          '',
        ]);
      });
    });

    const csvContent =
      '\uFEFF' + // BOM para que Excel reconozca UTF-8 con tildes y eñes
      [headers, ...rows]
        .map((row) => row.map(escapeCsv).join(';'))
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nombreArchivo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openReservaPreview = async (id: number, cached?: Reserva | null) => {
    setReservaPreviewOpen(true);
    setReservaPreview(cached ?? null);
    if (cached) {
      setReservaPreviewLoading(false);
      return;
    }
    setReservaPreviewLoading(true);
    try {
      const full = await reservasAPI.getById(id);
      setReservaPreview(full);
    } catch (e: any) {
      toast.error('No se pudo cargar la reserva', {
        description: e?.message || 'Intenta de nuevo.',
      });
      setReservaPreviewOpen(false);
    } finally {
      setReservaPreviewLoading(false);
    }
  };

  const filteredCreateRoutes = backendRutas.filter((route) => {
    const query = backendCreateRouteQuery.trim().toLowerCase();
    if (!query) return true;
    return [route.nombre, route.descripcion, route.dificultad]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const filteredCreateGuides = backendGuides.filter((guide) => {
    const query = backendCreateGuideQuery.trim().toLowerCase();
    if (!query) return true;
    return [guide.nombre, guide.apellido, guide.cargo, guide.rol_nombre, guide.correo]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const filteredEditRoutes = backendRutas.filter((route) => {
    const query = backendEditRouteQuery.trim().toLowerCase();
    if (!query) return true;
    return [route.nombre, route.descripcion, route.dificultad]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const filteredEditGuides = backendGuides.filter((guide) => {
    const query = backendEditGuideQuery.trim().toLowerCase();
    if (!query) return true;
    return [guide.nombre, guide.apellido, guide.cargo, guide.rol_nombre, guide.correo]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const selectedCreateRoute = backendRutas.find((route) => String(route.id_ruta) === backendCreateForm.id_ruta);
  const selectedEditRoute = backendRutas.find((route) => String(route.id_ruta) === backendEditForm.id_ruta);
  const selectedCreateGuide = backendGuides.find((guide) => String(guide.id_empleado) === backendCreateForm.id_empleado);
  const selectedEditGuide = backendGuides.find((guide) => String(guide.id_empleado) === backendEditForm.id_empleado);

  const findBackendProgramacionById = (idProgramacion: number) =>
    backendProgramaciones.find((row) => Number(row.id_programacion) === Number(idProgramacion));

  const backendEditContext = useMemo(() => {
    if (!backendEditTargetId) return null;
    const row = findBackendProgramacionById(backendEditTargetId);
    if (!row) return null;
    const sid = row.id_solicitud_personalizada;
    return {
      isPersonalizada: esPersonalizadaPorProgramacion(row),
      idSolicitud:
        sid != null && String(sid).trim() !== '' && Number.isFinite(Number(sid)) ? Number(sid) : null,
      rutaNombre: row.ruta_nombre ?? null,
    };
  }, [backendEditTargetId, backendProgramaciones]);

  const isBackendEditPersonalizada = Boolean(backendEditContext?.isPersonalizada);

  const personalizadaSalidaVigenteCliente = useMemo(() => {
    if (!isBackendEditPersonalizada) return false;
    const k = backendEditForm.estado.toLowerCase();
    if (k.includes('cancel')) return false;
    return k.includes('program') || k.includes('progres');
  }, [isBackendEditPersonalizada, backendEditForm.estado]);

  const selectedViewRoute = backendViewDetail
    ? backendRutas.find((route) => route.id_ruta === backendViewDetail.id_ruta)
    : undefined;
  /** Con guías no cargamos el listado global de empleados: sintetizamos desde el backend de la programación. */
  const selectedViewGuide = backendViewDetail?.id_empleado
    ? backendEmpleados.find((guide) => guide.id_empleado === backendViewDetail.id_empleado)
    : undefined;
  const displayViewGuide: EmpleadoBackend | undefined = useMemo(() => {
    if (selectedViewGuide) return selectedViewGuide;
    const d = backendViewDetail;
    if (!d?.id_empleado) return undefined;
    const nom = String((d as any).empleado_nombre ?? '').trim();
    const ape = String((d as any).empleado_apellido ?? '').trim();
    const tel = String((d as any).empleado_telefono ?? '').trim();
    const mail = String((d as any).empleado_correo ?? '').trim();
    if (!nom && !ape) return undefined;
    return {
      id_empleado: d.id_empleado as number,
      nombre: nom || '—',
      apellido: ape,
      cargo: (d as any).empleado_cargo,
      rol_nombre: (d as any).empleado_rol_nombre,
      correo: mail || undefined,
      telefono: tel || undefined,
    } as unknown as EmpleadoBackend;
  }, [selectedViewGuide, backendViewDetail]);

  const pickSolicitudFechaSalidaRevision = (s: SolicitudPersonalizada) =>
    normalizeDateInputValue(s.fecha_salida_operativa) ||
    normalizeDateInputValue((s as Record<string, unknown>)['fecha_operativa_salida'] as string) ||
    normalizeDateInputValue(s.fecha_deseada);

  const pickSolicitudFechaRegresoRevision = (s: SolicitudPersonalizada) =>
    normalizeDateInputValue(s.fecha_regreso_operativa) ||
    normalizeDateInputValue((s as Record<string, unknown>)['fecha_operativa_regreso'] as string) ||
    normalizeDateInputValue(s.fecha_regreso_deseada || s.fecha_deseada || '');

  const pickSolicitudHoraSalidaRevision = (s: SolicitudPersonalizada) =>
    normalizeTimeInputValue(s.hora_salida_operativa) ||
    normalizeTimeInputValue((s as Record<string, unknown>)['hora_operativa_salida'] as string) ||
    normalizeTimeInputValue(s.hora_deseada);

  const pickSolicitudHoraRegresoRevision = (s: SolicitudPersonalizada) =>
    normalizeTimeInputValue(s.hora_regreso_operativa) ||
    normalizeTimeInputValue((s as Record<string, unknown>)['hora_operativa_regreso'] as string) ||
    normalizeTimeInputValue(s.hora_regreso_deseada);

  const buildSolicitudEditState = (solicitudes: SolicitudPersonalizada[]) => {
    const nextState: Record<number, SolicitudRevisionEditRow> = {};

     for (const s of solicitudes) {
      const id = Number(s?.id_solicitud_personalizada);
      if (!Number.isFinite(id) || id <= 0) continue;

      const mainGuia = s.id_empleado_guia ?? (s as Record<string, unknown>)['id_empleado_preasignado'];
      const mainStr =
        mainGuia != null && Number.isFinite(Number(mainGuia)) && Number(mainGuia) > 0
          ? String(mainGuia)
          : '__none__';

      const apoyoRaw = s.guias_apoyo_preasignados ?? (s as Record<string, unknown>)['guias_apoyo_solicitud'];
      const apoyoArr = Array.isArray(apoyoRaw) ? apoyoRaw : [];
      const firstApoyo = apoyoArr.map((v) => Number(v)).find((n) => Number.isFinite(n) && n > 0);
      const apoyoStr =
        firstApoyo != null && firstApoyo !== Number(mainGuia) ? String(firstApoyo) : '__none__';

      nextState[id] = {
        fecha_salida: pickSolicitudFechaSalidaRevision(s),
        fecha_regreso: pickSolicitudFechaRegresoRevision(s),
        hora_salida: pickSolicitudHoraSalidaRevision(s),
        hora_regreso: pickSolicitudHoraRegresoRevision(s),
        precio_programacion:
          s.precio_cotizado !== null && s.precio_cotizado !== undefined ? String(s.precio_cotizado) : '',
        lugar_encuentro: s.lugar_encuentro != null ? String(s.lugar_encuentro) : '',
        id_empleado: mainStr,
        id_empleado_apoyo: apoyoStr,
      };
    }

    return nextState;
  };

  const refreshBackendSolicitudes = async (justSavedId?: number | null) => {
    const refreshed = await solicitudesPersonalizadasAPI.listAll();
    setBackendSolicitudes(refreshed);
    setBackendSolicitudEdits((prev) => {
      const base = buildSolicitudEditState(refreshed);
      const withSession = mergeBaseSolicitudEditsWithSessionDrafts(base);
      const saved = justSavedId != null ? Number(justSavedId) : null;
      const next = { ...withSession };
      for (const [rawId, currentEdit] of Object.entries(prev)) {
        const id = Number(rawId);
        if (!next[id]) continue;
        if (saved != null && Number.isFinite(saved) && id === saved) continue;
        next[id] = {
          ...next[id],
          ...currentEdit,
        };
      }
      return next;
    });
    return refreshed;
  };

  const syncBackendProgramaciones = (programaciones: ProgramacionBackend[]) => {
    setBackendProgramaciones(programaciones);
  };

  useEffect(() => {
    backendCreateScrollRef.current?.scrollTo({ top: 0 });
  }, [backendCreateStep]);

  useEffect(() => {
    if (!canUseBackend) {
      setBackendLoading(false);
      return;
    }
    let cancelled = false;

    const cargar = async () => {
      try {
        setBackendLoading(true);
        setBackendError(null);

        if (role === 'guide') {
          const programaciones = await programacionAPI.getMisAsignaciones();
          if (cancelled) return;
          syncBackendProgramaciones(programaciones);
          setBackendEmpleados([]);
          setBackendSolicitudes([]);
          setBackendRutas([]);
          setBackendServiciosById({});
          setBackendSolicitudEdits({});
        } else {
          const [empleados, programaciones, solicitudes, rutas, servicios] = await Promise.all([
            empleadosAPI.getAll(),
            programacionAPI.getAll(),
            solicitudesPersonalizadasAPI.listAll(),
            rutasAPI.getActivas(),
            serviciosAPI.getAll().catch(() => [] as Servicio[]),
          ]);

          if (cancelled) return;

          setBackendEmpleados(empleados);
          syncBackendProgramaciones(programaciones);
          setBackendSolicitudes(solicitudes);
          setBackendRutas(rutas);

          const serviciosIndex: Record<number, Pick<Servicio, 'nombre' | 'precio'>> = {};
          for (const s of servicios || []) {
            const id = Number((s as any)?.id_servicio);
            if (!Number.isFinite(id) || id <= 0) continue;
            serviciosIndex[id] = {
              nombre: String((s as any)?.nombre || ''),
              precio: (s as any)?.precio,
            };
          }
          setBackendServiciosById(serviciosIndex);

          setBackendSolicitudEdits(
            mergeBaseSolicitudEditsWithSessionDrafts(buildSolicitudEditState(solicitudes))
          );
        }
      } catch (e: any) {
        if (cancelled) return;
        setBackendError(e?.message || 'No se pudo cargar programación desde el backend');
      } finally {
        if (!cancelled) setBackendLoading(false);
      }
    };

    cargar();
    return () => {
      cancelled = true;
    };
  }, [canUseBackend, role]);

  useEffect(() => {
    if (!canUseBackend || backendLoading) return;
    if (Object.keys(backendSolicitudEdits).length === 0) return;
    persistSolicitudRevisionSessionDrafts(backendSolicitudEdits);
  }, [canUseBackend, backendLoading, backendSolicitudEdits]);

  useEffect(() => {
    if (!canUseBackend || backendLoading) return;
    if (isStaffRole && staffActiveTab !== 'programaciones') return;

    const intervalId = window.setInterval(async () => {
      // No hacer fetch si la pestaña no está visible (reduce EGRESS en segundo plano)
      if (document.visibilityState !== 'visible') return;
      try {
        if (role === 'guide') {
          const programaciones = await programacionAPI.getMisAsignaciones();
          syncBackendProgramaciones(programaciones);
        } else {
          const programaciones = await programacionAPI.getAll();
          syncBackendProgramaciones(programaciones);
        }
      } catch {
        // Ignore silent refresh errors; the manual state/error already covers initial load.
      }
    }, 30_000); // Refresco cada 30s para que las nuevas programaciones aparezcan rápido

    return () => window.clearInterval(intervalId);
  }, [canUseBackend, staffActiveTab, backendLoading, isStaffRole, role]);

  useEffect(() => {
    if (!isEditModalOpen || !backendEditTargetId) return;
    let cancelled = false;

    (async () => {
      try {
        const full = await programacionAPI.getById(backendEditTargetId);
        if (cancelled) return;
        const apoyo = (full as ProgramacionBackend).guias_apoyo;
        if (Array.isArray(apoyo)) {
          setBackendEditGuiaApoyoIds(apoyo.map((x) => String(x)).filter((x) => Number(x) > 0));
        }
      } catch {
        //
      }
    })();

    (async () => {
      const p = findBackendProgramacionById(backendEditTargetId);
      if (!p?.es_personalizada || !p.id_solicitud_personalizada) return;
      try {
        const s = await solicitudesPersonalizadasAPI.getById(Number(p.id_solicitud_personalizada));
        if (cancelled) return;
        const contratoSalida = normalizeContratoFecha(s.fecha_deseada) || normalizeContratoFecha(p.fecha_salida);
        const contratoRegreso =
          normalizeContratoFecha(s.fecha_regreso_deseada) || normalizeContratoFecha(p.fecha_regreso);
        setBackendEditContratoFechas({ fecha_salida: contratoSalida, fecha_regreso: contratoRegreso });
        setBackendEditForm((prev) => ({
          ...prev,
          fecha_salida: contratoSalida,
          fecha_regreso: contratoRegreso,
        }));
      } catch {
        //
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditModalOpen, backendEditTargetId, backendProgramaciones]);
  
  const itemsPerPage = 10;

  // Permisos (staff) por sistema dinámico de roles/permisos
  const canCreate = isStaffRole ? canCreateProgramming : false;
  const canEdit = isStaffRole ? canEditProgramming : false;
  const canDelete = isStaffRole ? canDeleteProgramming : false;
  const canChangeStatus = isStaffRole ? canEditProgramming : role === 'guide';
  const canViewDetails = true; // Todos los roles pueden ver detalles completos

  if (isStaffRole && permissions.loadingRoles) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 font-medium">Cargando permisos...</p>
          <p className="text-gray-600 mt-1">Estamos validando tu acceso a Programaciones.</p>
        </div>
      </div>
    );
  }

  if (isStaffRole && !permissions.loadingRoles && !canViewProgramming) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 font-medium">Acceso denegado</p>
          <p className="text-gray-600 mt-1">No tienes permisos para ver programaciones.</p>
        </div>
      </div>
    );
  }

  // Filtrar programaciones
  const getFilteredProgrammings = () => {
    const mapEstadoToStatus = (estado?: string | null): Programming['status'] => {
      const raw = String(estado || '').toLowerCase().trim();
      if (!raw) return 'scheduled';
      if (raw.includes('cancel')) return 'cancelled';
      if (raw.includes('complet')) return 'completed';
      if (raw.includes('progreso') || raw.includes('curso') || raw.includes('ejec')) return 'in-progress';
      return 'scheduled';
    };

    const backendAsProgrammings: Programming[] = (backendProgramaciones || [])
      .map((p) => {
        const id = String(p.id_programacion);
        const prettyId = String(p.id_programacion).padStart(3, '0');

        const guideName = [p.empleado_nombre, p.empleado_apellido].filter(Boolean).join(' ').trim() || '—';
        const guidePhone = String((p as any).empleado_telefono ?? '').trim() || undefined;
        const guideEmail = String((p as any).empleado_correo ?? '').trim() || undefined;
        const guideRoleLabel =
          [(p as any).empleado_cargo, (p as any).empleado_rol_nombre].filter(Boolean).join(' · ').trim() ||
          undefined;
        const routeName = p.ruta_nombre || `Ruta ${p.id_ruta}`;
        const totalSeats = Math.max(0, Number(p.cupos_totales ?? 0));
        const availableSeats = Math.max(0, Number(p.cupos_disponibles ?? 0));
        const occupiedSeats = Math.max(0, totalSeats - availableSeats);
        const fechaCreacionRaw =
          (p as any).fecha_creacion ?? (p as any).created_at ?? (p as any).fecha_registro ?? null;

        return {
          id,
          programId: `PRG-${prettyId}`,
          routes: [
            {
              routeId: String(p.id_ruta),
              routeName,
              date: String(p.fecha_salida || ''),
              startTime: String(p.hora_salida || ''),
              endTime: String(p.hora_regreso || ''),
            },
          ],
          clients: [],
          guideId: p.id_empleado ? String(p.id_empleado) : '',
          guideName,
          guidePhone,
          guideEmail,
          guideRoleLabel,
          status: mapEstadoToStatus(p.estado),
          additionalServices: [],
          notes: p.lugar_encuentro ? `Punto de encuentro: ${p.lugar_encuentro}` : undefined,
          createdAt: fechaCreacionRaw ? String(fechaCreacionRaw) : String(p.fecha_salida || ''),
          createdAtMs: parseProgramacionCreatedMs(fechaCreacionRaw, p.id_programacion),
          createdBy: 'Backend',
          totalSeats,
          availableSeats,
          occupiedSeats,
          isPersonalizada: esPersonalizadaPorProgramacion(p),
        };
      });

    let filtered = canUseBackend ? backendAsProgrammings : programmings;

    // Si es cliente, solo ver sus propias programaciones
    if (role === 'client') {
      filtered = filtered.filter(p => 
        p.clients.some(c => c.name === userName)
      );
    }

    // Si es guía, solo las programaciones donde es id_empleado principal (fallback por compatibilidad)
    if (role === 'guide') {
      const gid = Number(userId);
      if (Number.isFinite(gid) && gid > 0) {
        filtered = filtered.filter((p) => Number(p.guideId) === gid);
      }
    }

    const q = searchTerm.trim().toLowerCase();

    // Aplicar filtros
    filtered = filtered.filter((prog) => {
      const matchesSearch =
        !q ||
        prog.programId.toLowerCase().includes(q) ||
        prog.guideName.toLowerCase().includes(q) ||
        (prog.guideEmail || '').toLowerCase().includes(q) ||
        (prog.guidePhone || '').toLowerCase().includes(q) ||
        prog.routes.some((r) => r.routeName.toLowerCase().includes(q)) ||
        prog.clients.some((c) => c.name.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || prog.status === statusFilter;

      const isPers = normalizeEsPersonalizada(prog.isPersonalizada);
      const matchesTipo =
        tipoFilter === 'all' ||
        (tipoFilter === 'personalizada' && isPers) ||
        (tipoFilter === 'programada' && !isPers);

      const matchesGuide = guideFilter === 'all' || String(prog.guideId) === guideFilter;

      const matchesRoute =
        routeFilter === 'all' || prog.routes.some((r) => String(r.routeId) === routeFilter);

      const salidaDate = String(prog.routes[0]?.date || '').slice(0, 10);
      const matchesDateFrom = !dateFrom || (salidaDate && salidaDate >= dateFrom);
      const matchesDateTo = !dateTo || (salidaDate && salidaDate <= dateTo);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesTipo &&
        matchesGuide &&
        matchesRoute &&
        matchesDateFrom &&
        matchesDateTo
      );
    });

    const sortByCreatedMs = (a: Programming, b: Programming) => {
      const ma = a.createdAtMs ?? parseProgramacionCreatedMs(a.createdAt, a.id);
      const mb = b.createdAtMs ?? parseProgramacionCreatedMs(b.createdAt, b.id);
      return mb - ma;
    };

    const sorted = [...filtered].sort((a, b) => {
      switch (sortFilter) {
        case 'created-desc':
          return sortByCreatedMs(a, b);
        case 'created-asc': {
          const ma = a.createdAtMs ?? parseProgramacionCreatedMs(a.createdAt, a.id);
          const mb = b.createdAtMs ?? parseProgramacionCreatedMs(b.createdAt, b.id);
          return ma - mb;
        }
        case 'date-desc': {
          const da = a.routes[0]?.date || '';
          const db = b.routes[0]?.date || '';
          return db.localeCompare(da);
        }
        case 'date-asc': {
          const da = a.routes[0]?.date || '';
          const db = b.routes[0]?.date || '';
          return da.localeCompare(db);
        }
        case 'time-desc': {
          const ta = a.routes[0]?.startTime || '';
          const tb = b.routes[0]?.startTime || '';
          return tb.localeCompare(ta);
        }
        case 'time-asc': {
          const ta = a.routes[0]?.startTime || '';
          const tb = b.routes[0]?.startTime || '';
          return ta.localeCompare(tb);
        }
        default:
          return 0;
      }
    });

    return sorted;
  };

  const filteredProgrammings = getFilteredProgrammings();

  // Paginación
  const totalPages = Math.ceil(filteredProgrammings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProgrammings = filteredProgrammings.slice(startIndex, endIndex);

  // Handlers
  const closeCreateProgrammingPage = () => {
    setIsCreateModalOpen(false);
    setStaffProgrammingCreatePage(false);
    setBackendCreateStep(1);
  };

  const closeEditProgrammingPage = () => {
    setIsEditModalOpen(false);
    setBackendEditTargetId(null);
    setBackendEditContratoFechas(null);
    setBackendEditGuiaApoyoIds([]);
  };

  const resetViewModalState = () => {
    setBackendViewDetail(null);
    setBackendViewError(null);
    setBackendViewLoading(false);
    setBackendViewReservas([]);
    setBackendViewReservasLoading(false);
    setBackendViewReservasError(null);
    setViewModalRuta(null);
    setViewModalRutaLoading(false);
  };

  const handleView = async (programming: Programming) => {
    setSelectedProgramming(programming);
    setStaffProgrammingCreatePage(false);
    setBackendEditTargetId(null);
    setIsViewModalOpen(true);

    const routeId = Number(programming.routes[0]?.routeId);
    if (Number.isFinite(routeId) && routeId > 0) {
      setViewModalRutaLoading(true);
      setViewModalRuta(null);
      try {
        let rutaDetalle: Ruta | null = null;
        try {
          rutaDetalle = await rutasAPI.getById(routeId);
        } catch {
          try {
            rutaDetalle = await rutasAPI.getActivaById(routeId);
          } catch {
            rutaDetalle = null;
          }
        }
        setViewModalRuta(rutaDetalle);
      } catch {
        setViewModalRuta(null);
      } finally {
        setViewModalRutaLoading(false);
      }
    } else {
      setViewModalRuta(null);
      setViewModalRutaLoading(false);
    }

    if (!canUseBackend && role !== 'client') {
      setBackendViewDetail(null);
      setBackendViewError(null);
      setBackendViewLoading(false);
      setBackendViewReservas([]);
      setBackendViewReservasLoading(false);
      setBackendViewReservasError(null);
      return;
    }

    const id = Number(programming.id);
    if (!Number.isFinite(id) || id <= 0) {
      setBackendViewDetail(null);
      setBackendViewError('No se pudo identificar la programación seleccionada.');
      setBackendViewLoading(false);
      setBackendViewReservas([]);
      setBackendViewReservasLoading(false);
      setBackendViewReservasError(null);
      return;
    }

    try {
      setBackendViewLoading(true);
      setBackendViewError(null);
      const detail = await programacionAPI.getById(id);
      setBackendViewDetail(detail);
      setBackendViewLoading(false);

      if (!canUseBackend) {
        setBackendViewReservas([]);
        setBackendViewReservasLoading(false);
        setBackendViewReservasError(null);
        return;
      }

      setBackendViewReservasLoading(true);
      setBackendViewReservasError(null);
      setBackendViewReservas([]);
      try {
        const reservas = await programacionAPI.getReservasForProgramacion(id, {
          idRuta: detail?.id_ruta ?? null,
        });
        setBackendViewReservas(reservas);
      } catch (e: any) {
        setBackendViewReservas([]);
        setBackendViewReservasError(e?.message || 'No se pudieron cargar las reservas de esta programación.');
      } finally {
        setBackendViewReservasLoading(false);
      }
    } catch (e: any) {
      setBackendViewDetail(null);
      setBackendViewError(e?.message || 'No se pudo cargar el detalle operativo.');
      setBackendViewReservas([]);
      setBackendViewReservasLoading(false);
      setBackendViewLoading(false);
    }
  };

  const handleEdit = (programming: Programming) => {
    setSelectedProgramming(programming);
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedProgramming) return;

    if (isStaffRole && !canDelete) {
      toast.error(programmingPerms.getErrorMessage('eliminar'));
      return;
    }

    if (!canUseBackend) {
      setProgrammings(programmings.filter(p => p.id !== selectedProgramming.id));
      toast.success('Programación eliminada exitosamente');
      setIsDeleteDialogOpen(false);
      setSelectedProgramming(null);
      return;
    }

    try {
      const id = Number(selectedProgramming.id);
      if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
      await programacionAPI.delete(id);
      setBackendProgramaciones((prev) => prev.filter((p) => p.id_programacion !== id));
      toast.success('Programación eliminada');
      setIsDeleteDialogOpen(false);
      setSelectedProgramming(null);
    } catch (e: any) {
      toast.error('No se pudo eliminar la programación', {
        description: e?.message || 'Error desconocido',
      });
    }
  };

  const handleStatusChange = async (programmingId: string, newStatus: Programming['status']) => {
    if (isStaffRole && !canChangeStatus) {
      toast.error(programmingPerms.getErrorMessage('editar'));
      return;
    }

    if (!canUseBackend) {
      setProgrammings(programmings.map(p => 
        p.id === programmingId ? { ...p, status: newStatus } : p
      ));
      toast.success('Estado actualizado exitosamente');
      return;
    }

    const statusToEstado: Record<Programming['status'], string> = {
      scheduled: 'Programado',
      'in-progress': 'En Progreso',
      completed: 'Completado',
      cancelled: 'Cancelado',
    };

    try {
      const id = Number(programmingId);
      if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
      const estado = statusToEstado[newStatus];
      await programacionAPI.update(id, { estado } as any);
      setBackendProgramaciones((prev) =>
        prev.map((p) => (p.id_programacion === id ? { ...p, estado } : p))
      );
      toast.success('Estado actualizado');
    } catch (e: any) {
      toast.error('No se pudo actualizar el estado', {
        description: e?.message || 'Error desconocido',
      });
    }
  };

  const openBackendCreate = () => {
    if (!canCreate) {
      toast.error(programmingPerms.getErrorMessage('crear'));
      return;
    }

    setBackendCreateForm({
      id_ruta: '',
      fecha_salida: '',
      fecha_regreso: '',
      hora_salida: '',
      hora_regreso: '',
      cupos_totales: '',
      precio_programacion: '',
      id_empleado: '__none__',
      lugar_encuentro: '',
    });
    setBackendCreateRouteQuery('');
    setBackendCreateGuideQuery('');
    setBackendCreateStep(1);
    setStaffProgrammingCreatePage(false);
    setIsViewModalOpen(false);
    setIsCreateModalOpen(true);
  };

  const openBackendEdit = (idProgramacion: number, tableRow?: Programming) => {
    if (!canEdit) {
      toast.error(programmingPerms.getErrorMessage('editar'));
      return;
    }

    const id = Number(idProgramacion);
    if (!Number.isFinite(id) || id <= 0) {
      toast.error('ID de programación inválido');
      return;
    }

    setIsViewModalOpen(false);
    setStaffProgrammingCreatePage(false);

    const p =
      findBackendProgramacionById(id) ??
      (tableRow
        ? ({
            id_programacion: id,
            id_ruta: Number(tableRow.routes[0]?.routeId) || 0,
            id_empleado: tableRow.guideId ? Number(tableRow.guideId) : null,
            fecha_salida: tableRow.routes[0]?.date || '',
            fecha_regreso: tableRow.routes[0]?.date || '',
            hora_salida: tableRow.routes[0]?.startTime || '',
            hora_regreso: tableRow.routes[0]?.endTime || '',
            cupos_totales: tableRow.totalSeats ?? null,
            cupos_disponibles: tableRow.availableSeats ?? null,
            precio_programacion: null,
            estado:
              tableRow.status === 'cancelled'
                ? 'Cancelado'
                : tableRow.status === 'completed'
                  ? 'Completado'
                  : tableRow.status === 'in-progress'
                    ? 'En Progreso'
                    : 'Programado',
            es_personalizada: tableRow.isPersonalizada ?? false,
            lugar_encuentro: tableRow.notes?.replace(/^Punto de encuentro:\s*/i, '') || '',
            ruta_nombre: tableRow.routes[0]?.routeName || null,
          } as ProgramacionBackend)
        : null);

    if (!p) {
      toast.error('No se encontró la programación', {
        description: 'Actualiza el listado o verifica que la salida siga activa en el sistema.',
      });
      return;
    }

    if (tableRow) {
      setSelectedProgramming(tableRow);
    }

    setBackendEditTargetId(id);
    setBackendEditCommittedSeats(Math.max(0, Number(p.cupos_totales ?? 0) - Number(p.cupos_disponibles ?? 0)));

    const apoyoDelBackend = (p as ProgramacionBackend).guias_apoyo;
    const apoyoInicial = Array.isArray(apoyoDelBackend)
      ? apoyoDelBackend.map((x) => String(x)).filter((x) => Number(x) > 0)
      : [];
    setBackendEditGuiaApoyoIds(apoyoInicial);

    let fechaSalidaEdicion = String(p.fecha_salida ?? '');
    let fechaRegresoEdicion = String(p.fecha_regreso ?? '');

    if (p.es_personalizada) {
      const solicitudVinculada =
        backendSolicitudes.find(
          (s) =>
            Number(s.id_programacion) === id ||
            (p.id_solicitud_personalizada != null &&
              Number(s.id_solicitud_personalizada) === Number(p.id_solicitud_personalizada)),
        ) ?? null;

      const desdeSolicitudSalida = normalizeContratoFecha(solicitudVinculada?.fecha_deseada);
      const desdeSolicitudRegreso = normalizeContratoFecha(
        solicitudVinculada?.fecha_regreso_deseada != null
          ? solicitudVinculada.fecha_regreso_deseada
          : null,
      );

      const contratoSalida = desdeSolicitudSalida || normalizeContratoFecha(p.fecha_salida);
      const contratoRegreso = desdeSolicitudRegreso || normalizeContratoFecha(p.fecha_regreso);

      setBackendEditContratoFechas({
        fecha_salida: contratoSalida,
        fecha_regreso: contratoRegreso,
      });
      fechaSalidaEdicion = contratoSalida;
      fechaRegresoEdicion = contratoRegreso;
    } else {
      setBackendEditContratoFechas(null);
    }

    setBackendEditForm({
      id_ruta: String(p.id_ruta ?? ''),
      fecha_salida: fechaSalidaEdicion,
      fecha_regreso: fechaRegresoEdicion,
      hora_salida: String(p.hora_salida ?? ''),
      hora_regreso: String(p.hora_regreso ?? ''),
      cupos_totales: p.cupos_totales != null ? String(p.cupos_totales) : '',
      cupos_disponibles: p.cupos_disponibles != null ? String(p.cupos_disponibles) : '',
      precio_programacion: p.precio_programacion != null ? String(p.precio_programacion) : '',
      estado: String(p.estado ?? 'Programado'),
      id_empleado: p.id_empleado ? String(p.id_empleado) : '__none__',
      lugar_encuentro: String(p.lugar_encuentro ?? ''),
    });
    setBackendEditRouteQuery('');
    setBackendEditGuideQuery('');

    setIsEditModalOpen(true);
  };

  const handleBackendEditCuposTotalesChange = (value: string) => {
    setBackendEditForm((prev) => {
      if (value.trim() === '') {
        return { ...prev, cupos_totales: value, cupos_disponibles: '' };
      }

      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) {
        return { ...prev, cupos_totales: value };
      }

      const nextDisponibles = Math.max(0, numericValue - backendEditCommittedSeats);
      return {
        ...prev,
        cupos_totales: value,
        cupos_disponibles: String(nextDisponibles),
      };
    });
  };

  const handleBackendEditCuposDisponiblesChange = (value: string) => {
    setBackendEditForm((prev) => {
      if (value.trim() === '') {
        return { ...prev, cupos_disponibles: value };
      }

      const numericDisponibles = Number(value);
      const numericTotales = Number(prev.cupos_totales || 0);

      if (!Number.isFinite(numericDisponibles)) {
        return { ...prev, cupos_disponibles: value };
      }

      const maximoPermitido = Math.max(0, numericTotales - backendEditCommittedSeats);
      const valorAjustado = Math.min(Math.max(0, numericDisponibles), maximoPermitido);

      return {
        ...prev,
        cupos_disponibles: String(valorAjustado),
      };
    });
  };

  const renderRoutePreview = (route?: Ruta) => {
    if (!route) return null;

    const serviciosPredefinidos = Array.isArray(route.servicios_predefinidos) ? route.servicios_predefinidos : [];
    const serviciosOpcionales = Array.isArray(route.servicios_opcionales) ? route.servicios_opcionales : [];

    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-green-700 font-semibold">Ruta seleccionada</p>
              <h3 className="text-lg font-semibold text-gray-900">{route.nombre}</h3>
              <p className="text-sm text-gray-600 mt-1">{route.descripcion || 'Sin descripción'}</p>
            </div>
            <Badge variant="outline" className="border-green-300 text-green-700">
              {route.estado ? 'Activa' : 'Inactiva'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-white p-3 border border-green-100">
              <p className="text-gray-500 text-xs">Duración</p>
              <p className="font-medium text-gray-900">{formatRutaDuracionHoras(route.duracion_dias)}</p>
            </div>
            <div className="rounded-lg bg-white p-3 border border-green-100">
              <p className="text-gray-500 text-xs">Precio base</p>
              <p className="font-medium text-gray-900">{formatCurrency(route.precio_base)}</p>
            </div>
            <div className="rounded-lg bg-white p-3 border border-green-100">
              <p className="text-gray-500 text-xs">Capacidad</p>
              <p className="font-medium text-gray-900">{route.capacidad_maxima ?? '—'} personas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Servicios predefinidos</p>
              {serviciosPredefinidos.length > 0 ? (
                <div className="space-y-2">
                  {serviciosPredefinidos.map((servicio) => (
                    <div key={servicio.id_ruta_servicio_predefinido ?? `${servicio.id_servicio}-pre`} className="rounded-lg border border-green-100 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{servicio.servicio?.nombre || `Servicio #${servicio.id_servicio}`}</p>
                          <p className="text-xs text-gray-500">Cantidad por defecto: {servicio.cantidad_default}</p>
                        </div>
                        <Badge variant="secondary" className={servicio.requerido ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {servicio.requerido ? 'Requerido' : 'Opcional'}
                        </Badge>
                      </div>
                      {servicio.servicio?.precio != null && (
                        <p className="text-xs text-gray-500 mt-2">Valor referencial: {formatCurrency(servicio.servicio.precio)}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Esta ruta no tiene servicios predefinidos registrados.</p>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Servicios opcionales</p>
              {serviciosOpcionales.length > 0 ? (
                <div className="space-y-2">
                  {serviciosOpcionales.map((servicio) => (
                    <div key={servicio.id_ruta_servicio_opcional ?? `${servicio.id_servicio}-opc`} className="rounded-lg border border-amber-100 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{servicio.servicio?.nombre || `Servicio #${servicio.id_servicio}`}</p>
                          <p className="text-xs text-gray-500">Cantidad sugerida: {servicio.cantidad_default}</p>
                        </div>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">Opcional</Badge>
                      </div>
                      {servicio.servicio?.precio != null && (
                        <p className="text-xs text-gray-500 mt-2">Valor referencial: {formatCurrency(servicio.servicio.precio)}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Esta ruta no tiene servicios opcionales registrados.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCompactRouteList = (
    routes: Ruta[],
    value: string,
    onSelect: (routeId: string) => void,
    emptyLabel: string,
    containerClassName?: string
  ) => (
    <div
      className={`space-y-2 rounded-xl border border-gray-200 bg-white p-3 overflow-y-auto ${
        containerClassName?.trim() ? containerClassName : 'max-h-72'
      }`}
    >
      {routes.length > 0 ? (
        routes.map((route) => {
          const isSelected = value === String(route.id_ruta);
          return (
            <button
              key={route.id_ruta}
              type="button"
              onClick={() => onSelect(String(route.id_ruta))}
              className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                isSelected
                  ? 'border-green-500 bg-green-50 ring-1 ring-green-200'
                  : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-gray-900 truncate">{route.nombre}</p>
                <Badge variant="secondary" className={route.estado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                  {route.estado ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <span>{formatRutaDuracionHoras(route.duracion_dias)}</span>
                <span>•</span>
                <span>{formatCurrency(route.precio_base)}</span>
                <span>•</span>
                <span>{route.dificultad || '—'}</span>
              </div>
            </button>
          );
        })
      ) : (
        <p className="text-sm text-gray-500">{emptyLabel}</p>
      )}
    </div>
  );

  const renderCompactGuideList = (
    guides: EmpleadoBackend[],
    value: string,
    onSelect: (guideId: string) => void,
    emptyLabel: string,
    containerClassName?: string
  ) => (
    <div
      className={`space-y-2 rounded-xl border border-gray-200 bg-white p-3 overflow-y-auto ${
        containerClassName?.trim() ? containerClassName : 'max-h-72'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect('__none__')}
        className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
          value === '__none__'
            ? 'border-green-500 bg-green-50 ring-1 ring-green-200'
            : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/40'
        }`}
      >
        <p className="font-medium text-gray-900">Sin asignar</p>
        <p className="text-xs text-gray-500 mt-1">Puedes elegir guía después.</p>
      </button>
      {guides.length > 0 ? (
        guides.map((guide) => {
          const isSelected = value === String(guide.id_empleado);
          return (
            <button
              key={guide.id_empleado}
              type="button"
              onClick={() => onSelect(String(guide.id_empleado))}
              className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                isSelected
                  ? 'border-green-500 bg-green-50 ring-1 ring-green-200'
                  : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-gray-900 truncate">{`${guide.nombre} ${guide.apellido}`.trim()}</p>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">Guía</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">{guide.rol_nombre || guide.cargo} • {guide.correo || 'Sin correo'}</p>
            </button>
          );
        })
      ) : (
        <p className="text-sm text-gray-500">{emptyLabel}</p>
      )}
    </div>
  );

  const getGuideDisplayName = (guide?: Pick<EmpleadoBackend, 'nombre' | 'apellido'> | null) =>
    [guide?.nombre, guide?.apellido].filter(Boolean).join(' ').trim() || 'Sin asignar';

  const renderProgrammingGuideCell = (prog: Programming) => {
    if (!prog.guideName || prog.guideName === '—') {
      return <span className="text-sm text-gray-400">Sin asignar</span>;
    }
    return (
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{prog.guideName}</p>
        {prog.guideRoleLabel ? (
          <p className="text-xs text-gray-500 truncate">{prog.guideRoleLabel}</p>
        ) : null}
        {prog.guidePhone ? <p className="text-xs text-gray-500 truncate">{prog.guidePhone}</p> : null}
        {prog.guideEmail ? <p className="text-xs text-gray-500 truncate">{prog.guideEmail}</p> : null}
      </div>
    );
  };

  const renderGuideContactFields = (opts: {
    name: string;
    roleLabel?: string;
    email?: string;
    phone?: string;
    highlightSelf?: boolean;
  }) => (
    <>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center">
          <User className="w-6 h-6 text-orange-700" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{opts.name}</p>
          {opts.highlightSelf ? (
            <Badge className="bg-orange-600 text-white mt-1">TÚ</Badge>
          ) : null}
          {opts.roleLabel ? <p className="text-sm text-gray-600">{opts.roleLabel}</p> : null}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-orange-100 bg-orange-50/40 p-3">
          <p className="text-xs text-gray-500">Correo</p>
          <p className="font-medium text-gray-900 break-all">{opts.email || 'Sin correo registrado'}</p>
        </div>
        <div className="rounded-lg border border-orange-100 bg-orange-50/40 p-3">
          <p className="text-xs text-gray-500">Teléfono</p>
          <p className="font-medium text-gray-900">{opts.phone || 'Sin teléfono registrado'}</p>
        </div>
      </div>
    </>
  );

  const normalizeDateInputValue = (value?: string | null) => {
    if (!value) return '';
    const normalized = String(value).trim();
    const match = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().slice(0, 10);
  };

  const normalizeTimeInputValue = (value?: string | null) => {
    if (!value) return '';
    const normalized = String(value).trim();
    const match = normalized.match(/^(\d{2}:\d{2})/);
    if (match) return match[1];
    return '';
  };

  const formatDisplayDate = (value?: string | null) =>
    formatDateDisplay(value, { fallback: 'Sin definir' });

  const formatDisplayDateTime = (date?: string | null, time?: string | null) =>
    formatDateTimeDisplay(date, time, { dateFallback: 'Sin definir' });

  const renderGuideAssignmentCard = (
    guide: EmpleadoBackend | undefined,
    selectedGuideValue: string,
    helperText?: string
  ) => (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 via-white to-sky-50">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-700 font-semibold">Guía turístico</p>
            <h3 className="text-base font-semibold text-gray-900">
              {selectedGuideValue === '__none__' ? 'Asignación pendiente' : getGuideDisplayName(guide)}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedGuideValue === '__none__'
                ? helperText || 'Puedes crear la programación sin guía y asignarlo después.'
                : guide?.cargo || guide?.rol_nombre || 'Guía turístico'}
            </p>
          </div>
          <Badge variant="outline" className={selectedGuideValue === '__none__' ? 'border-amber-300 text-amber-700' : 'border-blue-300 text-blue-700'}>
            {selectedGuideValue === '__none__' ? 'Sin guía' : 'Asignado'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-blue-100 bg-white p-3">
            <p className="text-gray-500 text-xs">Correo</p>
            <p className="font-medium text-gray-900 break-all">{guide?.correo || 'Sin correo registrado'}</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-white p-3">
            <p className="text-gray-500 text-xs">Teléfono</p>
            <p className="font-medium text-gray-900">{guide?.telefono || 'Sin teléfono registrado'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderOperationalSummaryCard = ({
    title,
    subtitle,
    route,
    guide,
    form,
    includeAvailability = false,
    status,
  }: {
    title: string;
    subtitle: string;
    route?: Ruta;
    guide?: EmpleadoBackend;
    form: BackendProgrammingFormState | BackendProgrammingEditFormState;
    includeAvailability?: boolean;
    status?: string;
  }) => {
    const hasEditFields = 'cupos_disponibles' in form;
    const servicesCount = route
      ? `${Array.isArray(route.servicios_predefinidos) ? route.servicios_predefinidos.length : 0} predefinidos · ${Array.isArray(route.servicios_opcionales) ? route.servicios_opcionales.length : 0} opcionales`
      : '—';

    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 shadow-sm">
        <CardContent className="p-5 space-y-5">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-green-700 font-semibold">{title}</p>
            <h3 className="text-lg font-semibold text-gray-900">{route?.nombre || 'Ruta por definir'}</h3>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-green-100 bg-white p-3">
              <p className="text-xs text-gray-500">Salida</p>
              <p className="font-medium text-gray-900">{formatDateTimeDisplay(form.fecha_salida, form.hora_salida)}</p>
            </div>
            <div className="rounded-xl border border-green-100 bg-white p-3">
              <p className="text-xs text-gray-500">Regreso</p>
              <p className="font-medium text-gray-900">{formatDisplayDateTime(form.fecha_regreso, form.hora_regreso)}</p>
            </div>
            <div className="rounded-xl border border-green-100 bg-white p-3">
              <p className="text-xs text-gray-500">Capacidad</p>
              <p className="font-medium text-gray-900">{form.cupos_totales || route?.capacidad_maxima || '—'} cupos</p>
            </div>
            <div className="rounded-xl border border-green-100 bg-white p-3">
              <p className="text-xs text-gray-500">Precio</p>
              <p className="font-medium text-gray-900">
                {form.precio_programacion ? formatCurrency(form.precio_programacion) : formatCurrency(route?.precio_base)}
              </p>
            </div>
            {includeAvailability && hasEditFields && (
              <div className="rounded-xl border border-green-100 bg-white p-3">
                <p className="text-xs text-gray-500">Disponibles</p>
                <p className="font-medium text-gray-900">{form.cupos_disponibles || '—'} cupos</p>
              </div>
            )}
            {status && (
              <div className="rounded-xl border border-green-100 bg-white p-3">
                <p className="text-xs text-gray-500">Estado</p>
                <p className="font-medium text-gray-900">{status}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-dashed border-green-200 bg-white/80 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">Asignación operativa</p>
              <Badge variant="outline" className="border-green-300 text-green-700">
                {guide ? 'Guía confirmado' : 'Pendiente'}
              </Badge>
            </div>
            <p className="text-sm text-gray-700">{guide ? getGuideDisplayName(guide) : 'Sin guía asignado todavía'}</p>
            <p className="text-xs text-gray-500">{guide?.correo || guide?.telefono || 'Asigna un guía para mejorar el control operativo de la salida.'}</p>
            <div className="pt-2 border-t border-green-100 text-xs text-gray-600 space-y-1">
              <p>Encuentro: {form.lugar_encuentro?.trim() || 'Sin definir todavía'}</p>
              <p>
                Duración estimada:{' '}
                {route?.duracion_dias != null && Number(route.duracion_dias) > 0
                  ? formatRutaDuracionHoras(route.duracion_dias)
                  : 'No definida'}
              </p>
              <p>Servicios de la ruta: {servicesCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Badge de estado
  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      scheduled: { label: 'Programado', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
      'in-progress': { label: 'En Progreso', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
      completed: { label: 'Completado', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
    };
    
    const config = statusConfig[status] || statusConfig.scheduled;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const normalizeSolicitudStatus = (status?: string | null) => {
    const raw = String(status || '').trim().toLowerCase();
    if (!raw) return 'Pendiente de revisión';
    if (raw.includes('aprobadaparapago') || raw.includes('aprobada')) return 'Aprobada para pago';
    if (raw.includes('convert')) return 'Convertida';
    if (raw.includes('coti')) return 'Cotizada';
    if (raw.includes('rech')) return 'Rechazada';
    if (raw.includes('cancel')) return 'Cancelada';
    if (raw.includes('pend')) return 'Pendiente de revisión';
    return String(status);
  };

  const getSolicitudStatusBadge = (status?: string | null) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized.includes('aprobadaparapago') || normalized.includes('aprobada')) {
      return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Aprobada para pago</Badge>;
    }
    if (normalized.includes('convert')) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Convertida</Badge>;
    }
    if (normalized.includes('coti')) {
      return <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">Cotizada</Badge>;
    }
    if (normalized.includes('rech')) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rechazada</Badge>;
    }
    if (normalized.includes('cancel')) {
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Cancelada</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pendiente de revisión</Badge>;
  };

  const solicitudHabilitadaParaPago = (status?: string | null) => {
    const normalized = String(status || '').trim().toLowerCase().replace(/\s+/g, '');
    return normalized.includes('aprobadaparapago') || normalized === 'cotizada';
  };

  const solicitudPuedeRechazarse = (s: SolicitudPersonalizada) => {
    if (s.id_programacion) return false;
    const normalized = String(s.estado || '').trim().toLowerCase().replace(/\s+/g, '');
    if (
      normalized.includes('rechaz') ||
      normalized.includes('cancel') ||
      normalized.includes('convert') ||
      normalized.includes('programad')
    ) {
      return false;
    }
    return true;
  };

  const confirmarRechazoSolicitud = async () => {
    const s = solicitudRejectTarget;
    if (!s) return;
    const motivo = solicitudRejectMotivo.trim();
    if (motivo.length < SOLICITUD_RECHAZO_MOTIVO_MIN) {
      toast.error(`Indica el motivo del rechazo (mínimo ${SOLICITUD_RECHAZO_MOTIVO_MIN} caracteres).`);
      return;
    }
    const id = Number(s.id_solicitud_personalizada);
    if (!Number.isFinite(id) || id <= 0) return;
    try {
      setBackendSolicitudSavingId(id);
      await solicitudesPersonalizadasAPI.cotizar(id, {
        estado: 'Rechazada',
        motivo_rechazo: motivo,
      });
      await refreshBackendSolicitudes(id);
      removeSolicitudRevisionSessionDraft(id);
      setBackendSolicitudEdits((prev) => {
        const next = { ...prev };
        delete next[id];
        persistSolicitudRevisionSessionDrafts(next);
        return next;
      });
      toast.success('Solicitud rechazada', {
        description: s.id_reserva
          ? `La reserva #${s.id_reserva} quedó cancelada y ya no bloquea eliminar la ruta.`
          : 'La solicitud quedó cerrada.',
      });
      setSolicitudRejectDialogOpen(false);
      setSolicitudRejectTarget(null);
      setSolicitudRejectMotivo('');
    } catch (e: any) {
      toast.error('No se pudo rechazar la solicitud', {
        description: e?.message || 'Error desconocido',
      });
    } finally {
      setBackendSolicitudSavingId(null);
    }
  };

  const formatRequestedOptionalServices = (value: unknown) => {
    if (!Array.isArray(value) || value.length === 0) return 'Sin servicios opcionales seleccionados.';
    const items = value
      .map((item: any) => {
        const idServicio = Number(item?.id_servicio ?? item?.idServicio ?? item?.id);
        const cantidad = Math.max(1, Number(item?.cantidad ?? item?.cantidad_default ?? item?.cantidadDefault ?? 1));
        if (!Number.isFinite(idServicio) || idServicio <= 0) return null;
        const info = backendServiciosById[idServicio];
        const label = info?.nombre?.trim() ? info.nombre.trim() : `Servicio #${idServicio}`;
        return `${label} x${cantidad}`;
      })
      .filter(Boolean);
    return items.length > 0 ? items.join(', ') : 'Sin servicios opcionales seleccionados.';
  };

  // Componente de formulario (simplificado para los props)
  const ProgrammingForm = ({ 
    programming, 
    onClose, 
    isEdit 
  }: { 
    programming?: Programming; 
    onClose: () => void; 
    isEdit?: boolean;
  }) => {
    const [formData, setFormData] = useState<{
      programId: string;
      routes: ProgrammingRoute[];
      clientIds: string[];
      guideId: string;
      status: Programming['status'];
      serviceIds: string[];
      notes: string;
    }>(programming ? {
      programId: programming.programId,
      routes: programming.routes,
      clientIds: programming.clients.map(c => c.id),
      guideId: programming.guideId,
      status: programming.status,
      serviceIds: programming.additionalServices.map(s => s.id),
      notes: programming.notes || ''
    } : {
      programId: '',
      routes: [],
      clientIds: [],
      guideId: '',
      status: 'scheduled',
      serviceIds: [],
      notes: ''
    });

    const [newRoute, setNewRoute] = useState({
      routeId: '',
      date: '',
      startTime: '',
      endTime: ''
    });

    const handleAddRoute = () => {
      if (newRoute.routeId && newRoute.date && newRoute.startTime && newRoute.endTime) {
        const route = availableRoutes.find(r => r.id === newRoute.routeId);
        if (route) {
          // Validar que no haya conflictos de fechas
          const conflict = formData.routes.some(r => 
            r.date === newRoute.date && (
              (newRoute.startTime >= r.startTime && newRoute.startTime < r.endTime) ||
              (newRoute.endTime > r.startTime && newRoute.endTime <= r.endTime)
            )
          );

          if (conflict) {
            toast.error('Conflicto de horarios: Ya existe una ruta programada en ese horario');
            return;
          }

          setFormData({
            ...formData,
            routes: [...formData.routes, {
              routeId: newRoute.routeId,
              routeName: route.name,
              date: newRoute.date,
              startTime: newRoute.startTime,
              endTime: newRoute.endTime
            }]
          });

          setNewRoute({ routeId: '', date: '', startTime: '', endTime: '' });
          toast.success('Ruta agregada');
        }
      } else {
        toast.error('Complete todos los campos de la ruta');
      }
    };

    const handleRemoveRoute = (index: number) => {
      setFormData({
        ...formData,
        routes: formData.routes.filter((_, i) => i !== index)
      });
      toast.success('Ruta eliminada');
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (formData.routes.length === 0 || formData.clientIds.length === 0 || !formData.guideId) {
        toast.error('Complete todos los campos obligatorios');
        return;
      }

      const selectedClients = availableClients.filter(c => formData.clientIds.includes(c.id));
      const selectedGuide = availableGuides.find(g => g.id === formData.guideId);
      const selectedServices = serviceOptions.filter(s => formData.serviceIds.includes(s.id));

      if (isEdit && programming) {
        setProgrammings(programmings.map(p => 
          p.id === programming.id ? {
            ...p,
            programId: formData.programId,
            routes: formData.routes,
            clients: selectedClients,
            guideId: formData.guideId,
            guideName: selectedGuide?.name || '',
            status: formData.status,
            additionalServices: selectedServices,
            notes: formData.notes
          } : p
        ));
        toast.success('Programación actualizada exitosamente');
      } else {
        const newProgramming: Programming = {
          id: `prog-${Date.now()}`,
          programId: `PRG-${(programmings.length + 1).toString().padStart(3, '0')}`,
          routes: formData.routes,
          clients: selectedClients,
          guideId: formData.guideId,
          guideName: selectedGuide?.name || '',
          status: formData.status,
          additionalServices: selectedServices,
          notes: formData.notes,
          createdAt: new Date().toISOString().split('T')[0],
          createdAtMs: Date.now(),
          createdBy: userName || 'Sistema'
        };
        setProgrammings([newProgramming, ...programmings]);
        toast.success('Programación creada exitosamente');
      }

      onClose();
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Rutas */}
            <div className="space-y-3">
              <Label>Rutas *</Label>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor="routeSelect">Seleccionar Ruta</Label>
                      <Select value={newRoute.routeId} onValueChange={(value) => setNewRoute({ ...newRoute, routeId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una ruta" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoutes.map(route => (
                            <SelectItem key={route.id} value={route.id}>
                              {route.name} - {route.duration}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="routeDate">Fecha</Label>
                      <Input
                        id="routeDate"
                        type="date"
                        value={newRoute.date}
                        onChange={(e) => setNewRoute({ ...newRoute, date: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="routeStartTime">Hora Inicio</Label>
                        <Input
                          id="routeStartTime"
                          type="time"
                          value={newRoute.startTime}
                          onChange={(e) => setNewRoute({ ...newRoute, startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="routeEndTime">Hora Fin</Label>
                        <Input
                          id="routeEndTime"
                          type="time"
                          value={newRoute.endTime}
                          onChange={(e) => setNewRoute({ ...newRoute, endTime: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="button" onClick={handleAddRoute} variant="outline" className="w-full border-green-600 text-green-700 hover:bg-green-100">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Ruta
                  </Button>

                  {formData.routes.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <Label>Rutas Agregadas:</Label>
                      {formData.routes.map((route, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-300">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{route.routeName}</p>
                            <p className="text-xs text-gray-600">
                              {formatDateDisplay(route.date, { style: 'numeric' })} · {formatTimeDisplay(route.startTime)} – {formatTimeDisplay(route.endTime)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveRoute(index)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Clientes */}
            <div>
              <Label>Clientes con Reserva *</Label>
              <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                {availableClients.map(client => (
                  <div key={client.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={`client-${client.id}`}
                      checked={formData.clientIds.includes(client.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, clientIds: [...formData.clientIds, client.id] });
                        } else {
                          setFormData({ ...formData, clientIds: formData.clientIds.filter(id => id !== client.id) });
                        }
                      }}
                    />
                    <div className="flex-1">
                      <label htmlFor={`client-${client.id}`} className="cursor-pointer">
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-gray-600">{client.email} • {client.phone}</p>
                        {client.companions.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            <Users className="w-3 h-3 inline mr-1" />
                            {client.companions.length} acompañante{client.companions.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guía */}
            <div>
              <Label htmlFor="guide">Guía Asignado *</Label>
              <Select value={formData.guideId} onValueChange={(value) => setFormData({ ...formData, guideId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un guía" />
                </SelectTrigger>
                <SelectContent>
                  {availableGuides.map(guide => (
                    <SelectItem key={guide.id} value={guide.id}>
                      {guide.name} - {guide.specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Servicios Adicionales */}
            <div>
              <Label>Servicios Adicionales</Label>
              <div className="grid grid-cols-1 gap-2 mt-2 max-h-60 overflow-y-auto">
                {serviceOptions.map(service => (
                  <div key={service.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={`service-${service.id}`}
                      checked={formData.serviceIds.includes(service.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, serviceIds: [...formData.serviceIds, service.id] });
                        } else {
                          setFormData({ ...formData, serviceIds: formData.serviceIds.filter(id => id !== service.id) });
                        }
                      }}
                    />
                    <div className="flex-1">
                      <label htmlFor={`service-${service.id}`} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          {service.type === 'accommodation' && <Bed className="w-4 h-4 text-blue-600" />}
                          {service.type === 'food' && <Utensils className="w-4 h-4 text-orange-600" />}
                          {service.type === 'transport' && <Bus className="w-4 h-4 text-green-600" />}
                          {service.type === 'other' && <HomeIcon className="w-4 h-4 text-purple-600" />}
                          <p className="font-medium text-sm">{service.name}</p>
                        </div>
                        <p className="text-sm text-green-600 font-medium mt-1">
                          ${service.price.toLocaleString('es-CO')}
                        </p>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estado */}
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Programado</SelectItem>
                  <SelectItem value="in-progress">En Progreso</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notas */}
            <div>
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observaciones, requerimientos especiales, etc."
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            {isEdit ? 'Guardar Cambios' : 'Crear Programación'}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  // Calcular total de participantes
  const getTotalParticipants = (clients: Client[]) => {
    return clients.reduce((total, client) => {
      return total + 1 + client.companions.length;
    }, 0);
  };


  const renderStaffOperativeDetailBody = () => {
    const routeDetail = viewModalRuta ?? selectedViewRoute ?? undefined;
    const routeTexts = routeDetail;
    const txtParticipantes = String(routeTexts?.recomendaciones_participantes ?? '').trim();
    const txtBriefing = String(routeTexts?.briefing_operativo_equipo ?? '').trim();
    const horaSalidaDetalle =
      backendViewDetail?.hora_salida ?? selectedProgramming?.routes[0]?.startTime ?? null;
    const horaRegresoDetalle =
      backendViewDetail?.hora_regreso ?? selectedProgramming?.routes[0]?.endTime ?? null;

    return (
    <div className="space-y-6 min-w-0 w-full max-w-full overflow-x-hidden">
      {backendViewLoading ? (
                  <Card className="border-green-200">
                      <CardContent className="p-8 text-center text-gray-600">
                        Cargando detalle operativo de la programación...
                      </CardContent>
                    </Card>
                  ) : backendViewError ? (
                    <Card className="border-red-200">
                      <CardContent className="p-8 text-center text-red-600">
                        {backendViewError}
                      </CardContent>
                    </Card>
                  ) : backendViewDetail ? (
                    <>
                      <Card className="border-green-300 bg-gradient-to-r from-green-50 via-white to-emerald-50 shadow-sm">
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] lg:gap-8">
                            <div className="min-w-0 space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className="bg-green-700 text-white hover:bg-green-700">{selectedProgramming.programId}</Badge>
                                {getStatusBadge(selectedProgramming.status)}
                                <SalidaTipoProgramacionBadge esPersonalizada={esPersonalizadaPorProgramacion(backendViewDetail)} />
                              </div>
                              <h3 className="text-2xl font-semibold leading-snug text-gray-900">
                                {backendViewDetail.ruta_nombre || routeDetail?.nombre || 'Programación'}
                              </h3>
                              <p className="text-sm leading-relaxed text-gray-600">
                                {routeDetail?.descripcion ||
                                  (backendViewDetail as any).ruta_descripcion ||
                                  'Sin descripción registrada para esta ruta.'}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              <div className="rounded-xl border border-green-100 bg-white p-3">
                                <p className="text-xs text-gray-500">Fecha de salida</p>
                                <p className="font-medium text-gray-900 break-words">
                                  {formatDateDisplay(backendViewDetail.fecha_salida)}
                                </p>
                              </div>
                              <div className="rounded-xl border border-green-100 bg-white p-3">
                                <p className="text-xs text-gray-500">Hora de salida</p>
                                <p className="font-medium text-gray-900 break-words">
                                  {formatTimeDisplay(horaSalidaDetalle, 'Por definir')}
                                </p>
                              </div>
                              <div className="rounded-xl border border-green-100 bg-white p-3">
                                <p className="text-xs text-gray-500">Fecha de regreso</p>
                                <p className="font-medium text-gray-900 break-words">
                                  {formatDateDisplay(backendViewDetail.fecha_regreso)}
                                </p>
                              </div>
                              <div className="rounded-xl border border-green-100 bg-white p-3">
                                <p className="text-xs text-gray-500">Hora de regreso</p>
                                <p className="font-medium text-gray-900 break-words">
                                  {formatTimeDisplay(horaRegresoDetalle, 'Por definir')}
                                </p>
                              </div>
                              <div className="rounded-xl border border-green-100 bg-white p-3">
                                <p className="text-xs text-gray-500">Cupos</p>
                                <p className="font-medium text-gray-900 break-words">
                                  {backendViewDetail.cupos_disponibles ?? '—'} / {backendViewDetail.cupos_totales ?? '—'}
                                </p>
                              </div>
                              <div className="rounded-xl border border-green-100 bg-white p-3">
                                <p className="text-xs text-gray-500">Precio</p>
                                <p className="font-medium text-gray-900 break-words">
                                  {formatCurrency(backendViewDetail.precio_programacion)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,1fr)]">
                        <Card className="border-blue-200">
                          <CardHeader className="bg-blue-50">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Route className="w-5 h-5" />
                              Ruta y logística
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label className="text-gray-500">Duración</Label>
                                <p className="font-medium text-gray-900">
                                  {(() => {
                                    const h =
                                      routeDetail?.duracion_dias ?? (backendViewDetail as any).duracion_dias;
                                    return h != null && Number(h) > 0 ? formatRutaDuracionHoras(h) : 'Sin definir';
                                  })()}
                                </p>
                              </div>
                              <div>
                                <Label className="text-gray-500">Dificultad</Label>
                                <p className="font-medium text-gray-900">
                                  {routeDetail?.dificultad || (backendViewDetail as any).dificultad || 'Sin definir'}
                                </p>
                              </div>
                              <div>
                                <Label className="text-gray-500">Hora de salida</Label>
                                <p className="font-medium text-gray-900">
                                  {formatTimeDisplay(horaSalidaDetalle, 'Sin definir')}
                                </p>
                              </div>
                              <div>
                                <Label className="text-gray-500">Hora de regreso</Label>
                                <p className="font-medium text-gray-900">
                                  {formatTimeDisplay(horaRegresoDetalle, 'Sin definir')}
                                </p>
                              </div>
                              <div>
                                <Label className="text-gray-500">Punto de encuentro</Label>
                                <p className="font-medium text-gray-900">{backendViewDetail.lugar_encuentro || 'Sin definir'}</p>
                              </div>
                              <div>
                                <Label className="text-gray-500">Creación</Label>
                                <p className="font-medium text-gray-900">
                                  {formatDateDisplay((backendViewDetail as any).fecha_creacion || selectedProgramming.createdAt)}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2">
                              <p className="font-semibold text-gray-900">Servicios vinculados a la ruta</p>
                              <p className="text-sm text-gray-600">
                                {(Array.isArray(routeDetail?.servicios_predefinidos) ? routeDetail?.servicios_predefinidos.length : 0) || 0} predefinidos
                                {' · '}
                                {(Array.isArray(routeDetail?.servicios_opcionales) ? routeDetail?.servicios_opcionales.length : 0) || 0} opcionales
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(routeDetail?.servicios_predefinidos || []).slice(0, 4).map((servicio) => (
                                  <Badge
                                    key={servicio.id_ruta_servicio_predefinido ?? `pre-${servicio.id_servicio}`}
                                    variant="outline"
                                    className="border-green-200 text-green-700"
                                  >
                                    {servicio.servicio?.nombre || `Servicio #${servicio.id_servicio}`}
                                  </Badge>
                                ))}
                                {(routeDetail?.servicios_opcionales || []).slice(0, 4).map((servicio) => (
                                  <Badge
                                    key={servicio.id_ruta_servicio_opcional ?? `opc-${servicio.id_servicio}`}
                                    variant="outline"
                                    className="border-amber-200 text-amber-700"
                                  >
                                    {servicio.servicio?.nombre || `Servicio #${servicio.id_servicio}`}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="space-y-5 min-w-0">
                          <Card className="border-orange-200">
                            <CardHeader className="bg-orange-50">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Guía asignado
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                              {renderGuideContactFields({
                                name: getGuideDisplayName(displayViewGuide),
                                roleLabel:
                                  displayViewGuide?.cargo ||
                                  displayViewGuide?.rol_nombre ||
                                  selectedProgramming?.guideRoleLabel ||
                                  'Guía turístico',
                                email: displayViewGuide?.correo || selectedProgramming?.guideEmail,
                                phone:
                                  displayViewGuide?.telefono ||
                                  (backendViewDetail as any).empleado_telefono ||
                                  selectedProgramming?.guidePhone,
                              })}
                            </CardContent>
                          </Card>

                          <Card className="border-purple-200">
                            <CardHeader className="bg-purple-50">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Capacidad comercial
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-purple-100 bg-purple-50/40 p-3">
                                  <p className="text-xs text-gray-500">Cupos totales</p>
                                  <p className="font-semibold text-gray-900">{backendViewDetail.cupos_totales ?? '—'}</p>
                                </div>
                                <div className="rounded-lg border border-purple-100 bg-purple-50/40 p-3">
                                  <p className="text-xs text-gray-500">Cupos disponibles</p>
                                  <p className="font-semibold text-gray-900">{backendViewDetail.cupos_disponibles ?? '—'}</p>
                                </div>
                                <div className="rounded-lg border border-purple-100 bg-purple-50/40 p-3 col-span-2">
                                  <p className="text-xs text-gray-500">Precio programado</p>
                                  <p className="font-semibold text-gray-900">{formatCurrency(backendViewDetail.precio_programacion)}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {viewModalRutaLoading ? (
                        <p className="text-sm text-gray-500 px-1">Cargando textos de la ruta…</p>
                      ) : null}
                      {!viewModalRutaLoading && txtParticipantes ? (
                        <Card className="border-emerald-200">
                          <CardHeader className="bg-emerald-50">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Users className="w-5 h-5" />
                              {role === 'guide'
                                ? 'Indicaciones para participantes'
                                : 'Recomendaciones para participantes'}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                              {txtParticipantes}
                            </p>
                          </CardContent>
                        </Card>
                      ) : null}
                      {!viewModalRutaLoading && txtBriefing ? (
                        <Card className="border-amber-200">
                          <CardHeader className="bg-amber-50">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <ClipboardList className="w-5 h-5" />
                              {role === 'guide' ? 'Recomendaciones para el guía (briefing operativo)' : 'Briefing operativo (equipo)'}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <p className="text-xs text-amber-900/80 mb-3">
                              {role === 'guide'
                                ? 'Información práctica para la guianza (logística, puntos críticos, coordinación OCCITOUR). Si hay dudas, confirma con operaciones.'
                                : 'Uso interno OCCITOUR; comparte con el grupo operativo antes de la salida.'}
                            </p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                              {txtBriefing}
                            </p>
                          </CardContent>
                        </Card>
                      ) : null}

                      <Card className="border-teal-200">
                        <CardHeader className="bg-teal-50">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Users className="w-5 h-5" />
                              Reservas de esta salida
                            </CardTitle>
                            {backendViewReservas.length > 0 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="border-teal-400 text-teal-800 hover:bg-teal-50 gap-1.5"
                                onClick={exportParticipantesCSV}
                              >
                                <Download className="w-4 h-4" />
                                Descargar lista (Excel)
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          {backendViewReservasLoading ? (
                            <p className="text-sm text-gray-600 text-center py-6">Cargando reservas…</p>
                          ) : backendViewReservasError ? (
                            <p className="text-sm text-red-600">{backendViewReservasError}</p>
                          ) : backendViewReservas.length === 0 ? (
                            <p className="text-sm text-gray-600">
                              No hay reservas vinculadas a esta programación (o el listado del servidor no incluye la
                              relación; revisa el módulo de reservas).
                            </p>
                          ) : (
                            <div className="rounded-md border overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Reserva</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead className="min-w-[120px]">Documento</TableHead>
                                    <TableHead className="text-center">Personas</TableHead>
                                    <TableHead className="text-center w-[72px]">Acomp.</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Pago</TableHead>
                                    <TableHead className="min-w-[140px]">Notas (resumen)</TableHead>
                                    <TableHead className="w-[120px] text-right">Acción</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {backendViewReservas.map((row, idx) => {
                                    const rid = getReservaRowId(row);
                                    const notas = getReservaNotasResumen(row);
                                    return (
                                      <TableRow key={rid != null ? String(rid) : `r-${idx}`}>
                                        <TableCell className="font-mono text-sm">
                                          {rid != null ? `#${rid}` : '—'}
                                        </TableCell>
                                        <TableCell>
                                          <div className="font-medium text-gray-900">{getReservaClienteLabel(row)}</div>
                                          {row.cliente_email ? (
                                            <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                              {row.cliente_email}
                                            </div>
                                          ) : null}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-800 whitespace-nowrap">
                                          {getReservaDocumentoLabel(row)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {row.numero_participantes ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-center text-sm tabular-nums text-gray-700">
                                          {Array.isArray(row.acompanantes) ? row.acompanantes.length : '—'}
                                        </TableCell>
                                        <TableCell className="text-sm">{row.estado ?? '—'}</TableCell>
                                        <TableCell className="text-sm">{row.estado_pago ?? '—'}</TableCell>
                                        <TableCell className="text-sm text-gray-700 max-w-[220px] align-top">
                                          <span title={notas && notas !== '—' ? notas : ''}>
                                            {truncateResumenNotas(notas, 90)}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="border-teal-300 text-teal-800"
                                            disabled={rid == null}
                                            onClick={() => rid != null && openReservaPreview(rid, row)}
                                          >
                                            Ver reserva
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      {role === 'guide' && backendViewReservas.length > 0 && (
                        <Card className="border-violet-200">
                          <CardHeader className="bg-violet-50">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Users className="w-5 h-5" />
                              Clientes y acompañantes (detalle por reserva)
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6 space-y-5">
                            {backendViewReservas.map((row, ri) => {
                              const rid = getReservaRowId(row);
                              const comps = getReservaAcompanantes(row);
                              return (
                                <div
                                  key={rid != null ? `guide-acomp-${rid}` : `guide-acomp-${ri}`}
                                  className="rounded-lg border border-violet-100 bg-white p-4 space-y-2"
                                >
                                  <div className="flex flex-wrap items-baseline gap-2 justify-between">
                                    <p className="font-semibold text-gray-900">{getReservaClienteLabel(row)}</p>
                                    {rid != null ? (
                                      <Badge variant="outline" className="border-violet-300 text-violet-800">
                                        Reserva #{rid}
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <div className="text-sm text-gray-600 grid gap-1 sm:grid-cols-2">
                                    <span className="sm:col-span-2">
                                      Documento (titular): {getReservaDocumentoLabel(row)}
                                    </span>
                                    {row.cliente_email ? (
                                      <span className="break-all">Correo: {row.cliente_email}</span>
                                    ) : null}
                                    {row.cliente_telefono ? <span>Tel.: {row.cliente_telefono}</span> : null}
                                  </div>
                                  {comps.length > 0 ? (
                                    <div>
                                      <Label className="text-violet-900">Acompañantes ({comps.length})</Label>
                                      <ul className="mt-2 space-y-1 text-sm">
                                        {comps.map((ac, i) => (
                                          <li
                                            key={String(ac.id_detalle_reserva_acompanante ?? i)}
                                            className="rounded bg-violet-50/70 px-2 py-1.5"
                                          >
                                            <span className="font-medium text-gray-900">
                                              {[ac.nombre, ac.apellido].filter(Boolean).join(' ').trim() ||
                                                'Sin nombre'}
                                            </span>
                                            {[ac.tipo_documento, ac.numero_documento].filter(Boolean).length > 0
                                              ? ` · Doc.: ${[ac.tipo_documento, ac.numero_documento]
                                                  .filter(Boolean)
                                                  .join(' ')
                                                  .trim()}`
                                              : ''}
                                            {ac.telefono ? ` · Tel.: ${String(ac.telefono)}` : ''}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-500">
                                      Esta reserva no tiene acompañantes registrados (solo titular/es).
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    <Card className="border-gray-200">
                      <CardContent className="p-8 text-center text-gray-600">
                        No se encontró información detallada para esta programación.
                      </CardContent>
                    </Card>
                  )}

    </div>
    );
  };


  const renderStaffBackendCreateForm = () => (
<form
              className="flex flex-col gap-4 pb-2"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  if (!canCreate) {
                    toast.error(programmingPerms.getErrorMessage('crear'));
                    return;
                  }
                  if (backendCreateStep !== 2) {
                    const idRutaStep = Number(backendCreateForm.id_ruta);
                    if (!Number.isFinite(idRutaStep) || idRutaStep <= 0) {
                      toast.error('Selecciona una ruta para continuar');
                      return;
                    }
                    setBackendCreateStep(2);
                    return;
                  }

                  const idRuta = Number(backendCreateForm.id_ruta);
                  if (!Number.isFinite(idRuta) || idRuta <= 0) {
                    toast.error('Selecciona una ruta válida');
                    return;
                  }
                  if (!backendCreateForm.fecha_salida || !backendCreateForm.fecha_regreso) {
                    toast.error('Selecciona fechas de salida y regreso');
                    return;
                  }
                  const cupos = Number(backendCreateForm.cupos_totales);
                  if (!Number.isFinite(cupos) || cupos <= 0 || cupos > 30) {
                    toast.error('Los cupos totales deben estar entre 1 y 30');
                    return;
                  }

                  const precio = backendCreateForm.precio_programacion.trim()
                    ? Number(backendCreateForm.precio_programacion)
                    : null;
                  if (precio !== null && (!Number.isFinite(precio) || precio < 0)) {
                    toast.error('Precio inválido');
                    return;
                  }

                  const idEmpleado =
                    backendCreateForm.id_empleado !== '__none__'
                      ? Number(backendCreateForm.id_empleado)
                      : null;

                  setBackendCreateSaving(true);

                  await programacionAPI.create({
                    id_ruta: idRuta,
                    fecha_salida: backendCreateForm.fecha_salida,
                    fecha_regreso: backendCreateForm.fecha_regreso,
                    hora_salida: backendCreateForm.hora_salida || null,
                    hora_regreso: backendCreateForm.hora_regreso || null,
                    cupos_totales: cupos,
                    precio_programacion: precio,
                    id_empleado: Number.isFinite(Number(idEmpleado)) ? idEmpleado : null,
                    lugar_encuentro: backendCreateForm.lugar_encuentro?.trim() ? backendCreateForm.lugar_encuentro.trim() : null,
                    es_personalizada: false,
                  } as any);

                  const refreshed = await programacionAPI.getAll();
                  setBackendProgramaciones(refreshed);
                  toast.success('Programación creada');
                  closeCreateProgrammingPage();
                } catch (err: any) {
                  toast.error('No se pudo crear la programación', {
                    description: err?.message || 'Error desconocido',
                  });
                } finally {
                  setBackendCreateSaving(false);
                }
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label className="text-base font-semibold text-gray-900">Ruta *</Label>
                  <p className="text-sm text-gray-600">Selecciona una ruta y revisa sus servicios antes de crear la programación.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-green-300 text-green-700">
                    Paso {backendCreateStep} de 2
                  </Badge>
                  <Badge variant="outline" className="border-green-300 text-green-700">
                    {backendRutas.length} rutas activas
                  </Badge>
                  {backendCreateStep === 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      className="bg-green-700 hover:bg-green-800"
                      onClick={() => {
                        const idRutaStep = Number(backendCreateForm.id_ruta);
                        if (!Number.isFinite(idRutaStep) || idRutaStep <= 0) {
                          toast.error('Selecciona una ruta para continuar');
                          return;
                        }
                        setBackendCreateStep(2);
                      }}
                      disabled={backendCreateSaving || !backendCreateForm.id_ruta}
                    >
                      Siguiente
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" onClick={() => setBackendCreateStep(1)}>
                      Atrás
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all ${
                      backendCreateStep === 1 ? 'w-1/2' : 'w-full'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>1. Ruta y guía</span>
                  <span>2. Operación y confirmación</span>
                </div>
              </div>

              <div ref={backendCreateScrollRef} className="space-y-5">
                {backendCreateStep === 1 ? (
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <div className="space-y-3 min-w-0 flex flex-col min-h-0">
                      <Input
                        value={backendCreateRouteQuery}
                        onChange={(e) => setBackendCreateRouteQuery(e.target.value)}
                        placeholder="Buscar ruta, descripción o dificultad..."
                      />

                      {renderCompactRouteList(
                        filteredCreateRoutes,
                        backendCreateForm.id_ruta,
                        (routeId) => setBackendCreateForm((prev) => ({ ...prev, id_ruta: routeId })),
                        'No hay rutas que coincidan con la búsqueda.',
                        'h-[48vh] max-h-none'
                      )}
                    </div>

                    <div className="space-y-5 min-w-0 flex flex-col min-h-0">
                      {selectedCreateRoute ? (
                        renderRoutePreview(selectedCreateRoute)
                      ) : (
                        <Card className="border-dashed border-gray-200 bg-gray-50/40">
                          <CardContent className="p-4 text-sm text-gray-700">
                            Selecciona una ruta para ver su información y servicios.
                          </CardContent>
                        </Card>
                      )}

                      <div>
                        <Label className="text-base font-semibold text-gray-900">Guía turístico</Label>
                        <p className="text-sm text-gray-600">Asígnalo desde aquí mismo para dejar lista la operación.</p>
                      </div>
                      <Input
                        value={backendCreateGuideQuery}
                        onChange={(e) => setBackendCreateGuideQuery(e.target.value)}
                        placeholder="Buscar guía por nombre, correo o cargo..."
                      />

                      {renderCompactGuideList(
                        filteredCreateGuides,
                        backendCreateForm.id_empleado,
                        (guideId) => setBackendCreateForm((prev) => ({ ...prev, id_empleado: guideId })),
                        'No hay guías que coincidan con la búsqueda.',
                        'h-[32vh] max-h-none'
                      )}

                      {renderGuideAssignmentCard(selectedCreateGuide, backendCreateForm.id_empleado)}

                      {renderOperationalSummaryCard({
                        title: 'Resumen de creación',
                        subtitle: 'Lo que selecciones aquí será la base de la nueva programación.',
                        route: selectedCreateRoute,
                        guide: selectedCreateGuide,
                        form: backendCreateForm,
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <div className="space-y-5">
                      <Card className="border-green-200 shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base text-green-900">Calendario de la salida</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Fecha salida *</Label>
                              <Input
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={backendCreateForm.fecha_salida}
                                onChange={(e) => setBackendCreateForm((prev) => ({ ...prev, fecha_salida: e.target.value }))}
                              />
                            </div>

                            <div>
                              <Label>Fecha regreso *</Label>
                              <Input
                                type="date"
                                min={backendCreateForm.fecha_salida || new Date().toISOString().split('T')[0]}
                                value={backendCreateForm.fecha_regreso}
                                onChange={(e) => setBackendCreateForm((prev) => ({ ...prev, fecha_regreso: e.target.value }))}
                              />
                            </div>

                            <div>
                              <Label>Hora salida</Label>
                              <Input
                                type="time"
                                value={backendCreateForm.hora_salida}
                                onChange={(e) => setBackendCreateForm((prev) => ({ ...prev, hora_salida: e.target.value }))}
                              />
                            </div>

                            <div>
                              <Label>Hora regreso</Label>
                              <Input
                                type="time"
                                value={backendCreateForm.hora_regreso}
                                onChange={(e) => setBackendCreateForm((prev) => ({ ...prev, hora_regreso: e.target.value }))}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-green-200 shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base text-green-900">Capacidad y valor comercial</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Cupos totales *</Label>
                            <Input
                              type="number"
                              min="1"
                              max="30"
                              value={backendCreateForm.cupos_totales}
                              onChange={(e) => setBackendCreateForm((prev) => ({ ...prev, cupos_totales: e.target.value }))}
                              placeholder="Ej: 20"
                            />
                          </div>

                          <div>
                            <Label>Precio (opcional)</Label>
                            <Input
                              type="number"
                              value={backendCreateForm.precio_programacion}
                              onChange={(e) => setBackendCreateForm((prev) => ({ ...prev, precio_programacion: e.target.value }))}
                              placeholder="Ej: 120000"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-green-200 shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base text-green-900">Logística de encuentro</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Label>Punto de encuentro</Label>
                          <Input
                            value={backendCreateForm.lugar_encuentro}
                            onChange={(e) => setBackendCreateForm((prev) => ({ ...prev, lugar_encuentro: e.target.value }))}
                            placeholder="Ej: Parque principal, entrada de la finca, terminal..."
                          />

                          <p className="mt-2 text-xs text-gray-500">
                            Texto libre para operación y clientes (dirección o referencia). Opcional pero recomendado.
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-5">
                      {renderGuideAssignmentCard(
                        selectedCreateGuide,
                        backendCreateForm.id_empleado,
                        'Asignarlo ahora ayuda a dejar lista la operación desde el momento de crear.'
                      )}

                      {renderOperationalSummaryCard({
                        title: 'Confirmación final',
                        subtitle: 'Revisa esta ficha antes de crear la programación.',
                        route: selectedCreateRoute,
                        guide: selectedCreateGuide,
                        form: backendCreateForm,
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap justify-end gap-2 border-t border-gray-200 bg-slate-50/95 px-1 pt-4 backdrop-blur-sm">
                <Button type="button" variant="outline" onClick={closeCreateProgrammingPage}>
                  Cancelar
                </Button>
                {backendCreateStep === 1 ? (
                  <Button
                    type="button"
                    className="bg-green-700 hover:bg-green-800"
                    onClick={() => {
                      const idRutaStep = Number(backendCreateForm.id_ruta);
                      if (!Number.isFinite(idRutaStep) || idRutaStep <= 0) {
                        toast.error('Selecciona una ruta para continuar');
                        return;
                      }
                      setBackendCreateStep(2);
                    }}
                    disabled={backendCreateSaving || !backendCreateForm.id_ruta}
                  >
                    Siguiente
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={() => setBackendCreateStep(1)}>
                      Atrás
                    </Button>
                    <Button type="submit" className="bg-green-700 hover:bg-green-800" disabled={backendCreateSaving}>
                      {backendCreateSaving ? 'Creando…' : 'Crear'}
                    </Button>
                  </>
                )}
              </div>
            </form>
  );

  const renderStaffBackendEditForm = () => (
<form
                          className="flex flex-col gap-5 pb-2"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                              if (!canEdit) {
                                toast.error(programmingPerms.getErrorMessage('editar'));
                                return;
                              }
                              if (!backendEditTargetId) {
                                toast.error('No hay programación seleccionada');
                                return;
                              }
                              const idRuta = Number(backendEditForm.id_ruta);
                              if (!Number.isFinite(idRuta) || idRuta <= 0) {
                                toast.error('Ruta inválida');
                                return;
                              }
                              const fechaSalidaEnvio =
                                isBackendEditPersonalizada && backendEditContratoFechas
                                  ? backendEditContratoFechas.fecha_salida
                                  : backendEditForm.fecha_salida;
                              const fechaRegresoEnvio =
                                isBackendEditPersonalizada && backendEditContratoFechas
                                  ? backendEditContratoFechas.fecha_regreso
                                  : backendEditForm.fecha_regreso;

                              if (!fechaSalidaEnvio || !fechaRegresoEnvio) {
                                toast.error('Fechas incompletas');
                                return;
                              }

                              const cuposTotales = backendEditForm.cupos_totales.trim() ? Number(backendEditForm.cupos_totales) : null;
                              const cuposDisponibles = backendEditForm.cupos_disponibles.trim() ? Number(backendEditForm.cupos_disponibles) : null;
                              if (cuposTotales !== null && (!Number.isFinite(cuposTotales) || cuposTotales <= 0 || cuposTotales > 30)) {
                                toast.error('Los cupos totales deben estar entre 1 y 30');
                                return;
                              }
                              if (cuposDisponibles !== null && (!Number.isFinite(cuposDisponibles) || cuposDisponibles < 0 || cuposDisponibles > 30)) {
                                toast.error('Cupos disponibles inválidos');
                                return;
                              }

                              const precio = backendEditForm.precio_programacion.trim()
                                ? Number(backendEditForm.precio_programacion)
                                : null;
                              if (precio !== null && (!Number.isFinite(precio) || precio < 0)) {
                                toast.error('Precio inválido');
                                return;
                              }

                              const idEmpleado =
                                backendEditForm.id_empleado !== '__none__'
                                  ? Number(backendEditForm.id_empleado)
                                  : null;

                              const guiasApoyoPayload = backendEditGuiaApoyoIds
                                .map((id) => Number(id))
                                .filter((n) => Number.isFinite(n) && n > 0);

                              setBackendEditSaving(true);
                              await programacionAPI.update(backendEditTargetId, {
                                id_ruta: idRuta,
                                fecha_salida: fechaSalidaEnvio,
                                fecha_regreso: fechaRegresoEnvio,
                                hora_salida: backendEditForm.hora_salida || null,
                                hora_regreso: backendEditForm.hora_regreso || null,
                                cupos_totales: cuposTotales,
                                cupos_disponibles: cuposDisponibles,
                                precio_programacion: precio,
                                estado: backendEditForm.estado,
                                id_empleado: Number.isFinite(Number(idEmpleado)) ? idEmpleado : null,
                                lugar_encuentro: backendEditForm.lugar_encuentro?.trim()
                                  ? backendEditForm.lugar_encuentro.trim()
                                  : null,
                                guias_apoyo: guiasApoyoPayload,
                              } as any);

                              const refreshed = await programacionAPI.getAll();
                              setBackendProgramaciones(refreshed);
                              toast.success('Programación actualizada');
                              closeEditProgrammingPage();
                            } catch (err: any) {
                              toast.error('No se pudo actualizar la programación', {
                                description: err?.message || 'Error desconocido',
                              });
                            } finally {
                              setBackendEditSaving(false);
                            }
                          }}
                        >
                            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                            <div className="space-y-5 min-w-0">
                              {!isBackendEditPersonalizada ? (
                                <div className="space-y-3">
                                  <div className="flex items-end justify-between gap-4">
                                    <div>
                                      <Label className="text-base font-semibold text-gray-900">Ruta *</Label>
                                      <p className="text-sm text-gray-600">Edita la ruta y revisa nuevamente sus servicios.</p>
                                    </div>
                                    {selectedEditRoute && (
                                      <Badge variant="outline" className="border-green-300 text-green-700">
                                        Vista previa activa
                                      </Badge>
                                    )}
                                  </div>

                                  <Input
                                    value={backendEditRouteQuery}
                                    onChange={(e) => setBackendEditRouteQuery(e.target.value)}
                                    placeholder="Buscar ruta, descripción o dificultad..."
                                  />

                                  {renderCompactRouteList(
                                    filteredEditRoutes,
                                    backendEditForm.id_ruta,
                                    (routeId) => setBackendEditForm((prev) => ({ ...prev, id_ruta: routeId })),
                                    'No hay rutas que coincidan con la búsqueda.'
                                  )}

                                  {renderRoutePreview(selectedEditRoute)}
                                </div>
                              ) : (
                                <>
                                  <Alert className="border-violet-200 bg-violet-50/80 text-violet-900 [&>svg]:text-violet-700">
                                    <AlertTriangle />
                                    <AlertTitle>Salida personalizada (grupo cerrado)</AlertTitle>
                                    <AlertDescription className="text-violet-900/85">
                                      No uses la lógica de cupos públicos de catálogo: la capacidad y el precio quedaron pactados con el cliente.
                                      {backendEditContext?.idSolicitud != null
                                        ? ` Esta programación proviene de la solicitud personalizada #${backendEditContext.idSolicitud}.`
                                        : null}
                                    </AlertDescription>
                                  </Alert>

                                  <div className="space-y-3">
                                    <div>
                                      <Label className="text-base font-semibold text-gray-900">Ruta</Label>
                                      <p className="text-sm text-gray-600">
                                        La ruta no se modifica desde esta pantalla; conservamos la misma para el envío al guardar.
                                      </p>
                                    </div>
                                    <div className="rounded-lg border border-green-200 bg-white p-4 shadow-sm">
                                      <p className="text-xs uppercase tracking-wide text-gray-500">Ruta asignada</p>
                                      <p className="text-lg font-semibold text-gray-900">
                                        {selectedEditRoute?.nombre || backendEditContext?.rutaNombre || 'Ruta'}
                                      </p>
                                    </div>
                                    {renderRoutePreview(selectedEditRoute)}
                                  </div>
                                </>
                              )}

                              <Card className="border-green-200 shadow-sm">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base text-green-900">Calendario y operación</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {isBackendEditPersonalizada && personalizadaSalidaVigenteCliente ? (
                                    <div className="md:col-span-2">
                                      <Alert className="border-green-200 bg-green-50/90 text-green-900 [&>svg]:text-green-700">
                                        <CheckCircle2 />
                                        <AlertTitle>Itinerario confirmado con el cliente</AlertTitle>
                                        <AlertDescription className="text-green-900/85">
                                          La salida está vigente en operación: el cliente puede presentarse en las fechas acordadas
                                          {backendEditForm.hora_salida?.trim()
                                            ? ` (hora de encuentro/salida: ${formatTimeDisplay(backendEditForm.hora_salida)})`
                                            : ''}
                                          . Ajusta hora o punto de encuentro solo con coordinación previa con el cliente.
                                        </AlertDescription>
                                      </Alert>
                                    </div>
                                  ) : null}

                                  {isBackendEditPersonalizada &&
                                  backendEditForm.estado.toLowerCase().includes('cancel') ? (
                                    <div className="md:col-span-2">
                                      <Alert variant="destructive">
                                        <AlertTriangle />
                                        <AlertTitle>Salida cancelada</AlertTitle>
                                        <AlertDescription>
                                          Esta programación no está vigente; el cliente no debe asumir que el servicio se realizará.
                                        </AlertDescription>
                                      </Alert>
                                    </div>
                                  ) : null}

                                  {isBackendEditPersonalizada && backendEditContratoFechas ? (
                                    <>
                                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                        <Label>Fecha salida (pactada con el cliente)</Label>
                                        <p className="font-semibold text-gray-900 mt-1">
                                          {formatDisplayDate(backendEditContratoFechas.fecha_salida)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          No editable aquí: se mantiene igual que en la solicitud.
                                        </p>
                                      </div>
                                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                        <Label>Fecha regreso (pactada con el cliente)</Label>
                                        <p className="font-semibold text-gray-900 mt-1">
                                          {formatDisplayDate(backendEditContratoFechas.fecha_regreso)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          No editable aquí: se mantiene igual que en la solicitud (o la definida al convertir).
                                        </p>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div>
                                        <Label>Fecha salida *</Label>
                                        <Input
                                          type="date"
                                          min={new Date().toISOString().split('T')[0]}
                                          value={backendEditForm.fecha_salida}
                                          onChange={(e) =>
                                            setBackendEditForm((prev) => ({ ...prev, fecha_salida: e.target.value }))
                                          }
                                        />
                                      </div>

                                      <div>
                                        <Label>Fecha regreso *</Label>
                                        <Input
                                          type="date"
                                          min={backendEditForm.fecha_salida || new Date().toISOString().split('T')[0]}
                                          value={backendEditForm.fecha_regreso}
                                          onChange={(e) =>
                                            setBackendEditForm((prev) => ({ ...prev, fecha_regreso: e.target.value }))
                                          }
                                        />
                                      </div>
                                    </>
                                  )}

                                  <div>
                                    <Label>Hora salida</Label>
                                    <Input
                                      type="time"
                                      value={backendEditForm.hora_salida}
                                      onChange={(e) => setBackendEditForm((prev) => ({ ...prev, hora_salida: e.target.value }))}
                                    />
                                  </div>

                                  <div>
                                    <Label>Hora regreso</Label>
                                    <Input
                                      type="time"
                                      value={backendEditForm.hora_regreso}
                                      onChange={(e) => setBackendEditForm((prev) => ({ ...prev, hora_regreso: e.target.value }))}
                                    />
                                  </div>

                                  {!isBackendEditPersonalizada ? (
                                    <>
                                      <div>
                                        <Label>Cupos totales</Label>
                                        <Input
                                          type="number"
                                          min="1"
                                          max="30"
                                          value={backendEditForm.cupos_totales}
                                          onChange={(e) => handleBackendEditCuposTotalesChange(e.target.value)}
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                          Si cambias este valor, los cupos disponibles se recalculan con base en{' '}
                                          {backendEditCommittedSeats} cupos comprometidos.
                                        </p>
                                      </div>

                                      <div>
                                        <Label>Cupos disponibles</Label>
                                        <Input
                                          type="number"
                                          value={backendEditForm.cupos_disponibles}
                                          onChange={(e) => handleBackendEditCuposDisponiblesChange(e.target.value)}
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                          Máximo editable ahora:{' '}
                                          {Math.max(0, Number(backendEditForm.cupos_totales || 0) - backendEditCommittedSeats)}.
                                        </p>
                                      </div>

                                      <div>
                                        <Label>Precio</Label>
                                        <Input
                                          type="number"
                                          value={backendEditForm.precio_programacion}
                                          onChange={(e) =>
                                            setBackendEditForm((prev) => ({ ...prev, precio_programacion: e.target.value }))
                                          }
                                        />
                                      </div>
                                    </>
                                  ) : null}

                                  <div>
                                    <Label>Estado</Label>
                                    <Select
                                      value={backendEditForm.estado}
                                      onValueChange={(value) => setBackendEditForm((prev) => ({ ...prev, estado: value }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Programado">Programado</SelectItem>
                                        <SelectItem value="En Progreso">En Progreso</SelectItem>
                                        <SelectItem value="Completado">Completado</SelectItem>
                                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </CardContent>
                              </Card>

                              {isBackendEditPersonalizada ? (
                                <Card className="border-violet-100 bg-violet-50/40 shadow-sm">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base text-violet-900">Cupo y tarifa acordados</CardTitle>
                                  </CardHeader>
                                  <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                    <div className="rounded-lg border border-violet-100 bg-white p-3">
                                      <p className="text-xs text-gray-500">Cupos totales</p>
                                      <p className="font-semibold text-gray-900">
                                        {backendEditForm.cupos_totales.trim() || '—'}
                                      </p>
                                    </div>
                                    <div className="rounded-lg border border-violet-100 bg-white p-3">
                                      <p className="text-xs text-gray-500">Cupos disponibles</p>
                                      <p className="font-semibold text-gray-900">
                                        {backendEditForm.cupos_disponibles.trim() || '—'}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Comprometidos en esta salida: {backendEditCommittedSeats}
                                      </p>
                                    </div>
                                    <div className="rounded-lg border border-violet-100 bg-white p-3">
                                      <p className="text-xs text-gray-500">Precio de la salida</p>
                                      <p className="font-semibold text-gray-900">
                                        {backendEditForm.precio_programacion.trim()
                                          ? formatCurrency(backendEditForm.precio_programacion)
                                          : '—'}
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>
                              ) : null}

                              <Card className="border-green-200 shadow-sm">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base text-green-900">Punto de encuentro</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <Label>Punto de encuentro</Label>
                                  <Input
                                    value={backendEditForm.lugar_encuentro}
                                    onChange={(e) => setBackendEditForm((prev) => ({ ...prev, lugar_encuentro: e.target.value }))}
                                    placeholder="Ej: Parque principal / Entrada finca..."
                                  />

                                  <p className="mt-2 text-xs text-gray-500">
                                    Texto libre para operación y clientes (dirección o referencia). Opcional pero recomendado.
                                  </p>
                                </CardContent>
                              </Card>
                            </div>

                            <div className="space-y-5 min-w-0">
                              <div>
                                <Label className="text-base font-semibold text-gray-900">Guía turístico</Label>
                                <p className="text-sm text-gray-600">
                                  {isBackendEditPersonalizada
                                    ? 'Reasigna el guía si la operación del grupo cerrado lo requiere.'
                                    : 'Reasigna el guía desde el mismo flujo de edición.'}
                                </p>
                              </div>
                              <Input
                                value={backendEditGuideQuery}
                                onChange={(e) => setBackendEditGuideQuery(e.target.value)}
                                placeholder="Buscar guía por nombre, correo o cargo..."
                              />

                              {renderCompactGuideList(
                                filteredEditGuides,
                                backendEditForm.id_empleado,
                                (guideId) => {
                                  setBackendEditForm((prev) => ({ ...prev, id_empleado: guideId }));
                                  setBackendEditGuiaApoyoIds((prev) => prev.filter((id) => id !== guideId));
                                },
                                'No hay guías que coincidan con la búsqueda.'
                              )}

                              {renderGuideAssignmentCard(
                                selectedEditGuide,
                                backendEditForm.id_empleado,
                                'Si cambias el guía aquí, quedará actualizado directamente en la programación.'
                              )}

                              <Card className="border-blue-100 bg-blue-50/30 shadow-sm">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base text-blue-900">Guías de apoyo (opcional)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <p className="text-sm text-gray-700">
                                    Marca guías adicionales para refuerzo en campo. El guía principal sigue siendo el responsable en sistema.
                                  </p>
                                  <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                                    {filteredEditGuides
                                      .filter((g) => String(g.id_empleado) !== String(backendEditForm.id_empleado))
                                      .map((g) => {
                                        const gid = String(g.id_empleado);
                                        return (
                                          <label
                                            key={gid}
                                            className="flex items-center gap-3 rounded-md border border-blue-100 bg-white px-3 py-2 text-sm cursor-pointer"
                                          >
                                            <Checkbox
                                              checked={backendEditGuiaApoyoIds.includes(gid)}
                                              onCheckedChange={(c) => {
                                                setBackendEditGuiaApoyoIds((prev) =>
                                                  c === true
                                                    ? Array.from(new Set([...prev, gid]))
                                                    : prev.filter((x) => x !== gid),
                                                );
                                              }}
                                            />
                                            <span className="font-medium text-gray-900">{getGuideDisplayName(g)}</span>
                                          </label>
                                        );
                                      })}
                                  </div>
                                  {filteredEditGuides.filter(
                                    (g) => String(g.id_empleado) !== String(backendEditForm.id_empleado),
                                  ).length === 0 ? (
                                    <p className="text-xs text-gray-500">No hay más guías en el listado filtrado.</p>
                                  ) : null}
                                </CardContent>
                              </Card>

                              {renderOperationalSummaryCard({
                                title: isBackendEditPersonalizada ? 'Resumen (personalizada)' : 'Resumen de edición',
                                subtitle: isBackendEditPersonalizada
                                  ? 'Mismo criterio operativo: revisa fechas, encuentro y guía antes de guardar.'
                                  : 'Verifica la operación completa antes de guardar cambios.',
                                route: selectedEditRoute,
                                guide: selectedEditGuide,
                                form: backendEditForm,
                                includeAvailability: true,
                                status: backendEditForm.estado,
                              })}
                            </div>
                            </div>

                          <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap justify-end gap-2 border-t border-gray-200 bg-slate-50/95 px-1 pt-4 backdrop-blur-sm">
                            <Button type="button" variant="outline" onClick={closeEditProgrammingPage}>
                              Cancelar
                            </Button>
                            <Button type="submit" className="bg-green-700 hover:bg-green-800" disabled={backendEditSaving}>
                              {backendEditSaving ? 'Guardando…' : 'Guardar'}
                            </Button>
                          </div>
                        </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-sm border border-green-200"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {role === 'guide' ? 'Mis Programaciones Asignadas' : 
               role === 'client' ? 'Mis Programaciones' : 
               'Gestión de Programación'}
            </h1>
            <p className="text-gray-600 mt-1">
              {role === 'guide' ? 'Consulta las programaciones donde estás asignado como guía' : 
               role === 'client' ? 'Consulta tus programaciones, rutas, fechas y detalles de tu grupo' : 
               'Administra las programaciones de rutas turísticas'}
            </p>
            {isStaffRole && staffActiveTab === 'solicitudes' ? (
              <p className="text-sm text-green-700 mt-2">
                {backendSolicitudes.filter((s) => !s?.id_programacion).length}{' '}
                {backendSolicitudes.filter((s) => !s?.id_programacion).length === 1
                  ? 'solicitud pendiente'
                  : 'solicitudes pendientes'}
              </p>
            ) : filteredProgrammings.length > 0 ? (
              <p className="text-sm text-green-700 mt-2">
                {filteredProgrammings.length}{' '}
                {filteredProgrammings.length === 1 ? 'programación encontrada' : 'programaciones encontradas'}
              </p>
            ) : null}
          </div>

          {canCreate && (
            <Button onClick={() => (isStaffRole ? openBackendCreate() : setIsCreateModalOpen(true))} className="bg-green-700 hover:bg-green-800">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Programación
            </Button>
          )}
        </div>

        {/* Búsqueda y filtros (solo programación operativa; solicitudes tiene los suyos en la pestaña) */}
        {!(isStaffRole && staffActiveTab === 'solicitudes') ? (
        <div className="mt-6 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-green-700" />
              <Input
                placeholder="Buscar por ID, guía, ruta o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-green-300 pl-10 focus:border-green-500"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-green-200 hover:border-green-400 hover:bg-green-50"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <Filter className="mr-2 h-4 w-4 text-green-600" />
              <span className="text-green-700">Filtros</span>
              {hasActiveProgrammingFilters ? (
                <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-800">
                  Activos
                </Badge>
              ) : null}
            </Button>
          </div>

          {filtersOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-col flex-wrap gap-3 rounded-lg border border-green-100 bg-green-50/50 p-4 sm:flex-row"
            >
              <div className="min-w-[140px] flex-1 space-y-1.5">
                <Label className="text-xs text-green-800">Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-green-200 bg-white">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="scheduled">Programado</SelectItem>
                    <SelectItem value="in-progress">En progreso</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[140px] flex-1 space-y-1.5">
                <Label className="text-xs text-green-800">Tipo de salida</Label>
                <Select
                  value={tipoFilter}
                  onValueChange={(v) => setTipoFilter(v as typeof tipoFilter)}
                >
                  <SelectTrigger className="border-green-200 bg-white">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="programada">Programada</SelectItem>
                    <SelectItem value="personalizada">Personalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isStaffRole && canUseBackend ? (
                <>
                  <div className="min-w-[160px] flex-1 space-y-1.5">
                    <Label className="text-xs text-green-800">Guía</Label>
                    <Select value={guideFilter} onValueChange={setGuideFilter}>
                      <SelectTrigger className="border-green-200 bg-white">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los guías</SelectItem>
                        {programmingGuideOptions.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-[160px] flex-1 space-y-1.5">
                    <Label className="text-xs text-green-800">Ruta</Label>
                    <Select value={routeFilter} onValueChange={setRouteFilter}>
                      <SelectTrigger className="border-green-200 bg-white">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las rutas</SelectItem>
                        {programmingRouteOptions.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : null}

              <div className="min-w-[160px] flex-1 space-y-1.5">
                <Label className="text-xs text-green-800">Ordenar por</Label>
                <Select
                  value={sortFilter}
                  onValueChange={(v) => setSortFilter(v as ProgrammingsSortFilter)}
                >
                  <SelectTrigger className="border-green-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created-desc">Registro (más recientes primero)</SelectItem>
                    <SelectItem value="created-asc">Registro (más antiguas)</SelectItem>
                    <SelectItem value="date-asc">Fecha salida (próximas primero)</SelectItem>
                    <SelectItem value="date-desc">Fecha salida (más lejanas)</SelectItem>
                    <SelectItem value="time-asc">Hora salida (temprano)</SelectItem>
                    <SelectItem value="time-desc">Hora salida (tarde)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[140px] flex-1 space-y-1.5">
                <Label className="text-xs text-green-800">Salida desde</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border-green-200 bg-white"
                />
              </div>

              <div className="min-w-[140px] flex-1 space-y-1.5">
                <Label className="text-xs text-green-800">Salida hasta</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border-green-200 bg-white"
                />
              </div>

              <div className="flex w-full items-end sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-green-800 hover:bg-green-100"
                  disabled={!hasActiveProgrammingFilters && !searchTerm.trim()}
                  onClick={() => {
                    clearProgrammingFilters();
                    setSearchTerm('');
                  }}
                >
                  Limpiar búsqueda y filtros
                </Button>
              </div>
            </motion.div>
          ) : null}
        </div>
        ) : null}
      </motion.div>

      {isStaffRole ? (
        <Tabs
          value={staffActiveTab}
          onValueChange={(value) => {
            setStaffActiveTab(value as 'programaciones' | 'solicitudes');
            if (value === 'solicitudes') setFiltersOpen(false);
          }}
          className="space-y-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <TabsList className="grid w-full max-w-2xl grid-cols-2">
              <TabsTrigger value="programaciones">Programación operativa</TabsTrigger>
              <TabsTrigger value="solicitudes">Solicitudes personalizadas</TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="border-green-300 text-green-700">
                {(backendProgramaciones || []).length} salidas (operativas + personalizadas)
              </Badge>
              <Badge variant="outline" className="border-amber-300 text-amber-700">
                {backendSolicitudes.filter((s) => !s?.id_programacion).length} solicitudes activas
              </Badge>
              <Badge variant="outline" className="border-blue-300 text-blue-700">
                {backendProgramaciones.filter((p) => Boolean(p?.es_personalizada)).length} personalizadas convertidas
              </Badge>
            </div>
          </div>

          <TabsContent value="programaciones" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-lg border-green-200">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50">
                        <TableHead className="w-24">ID</TableHead>
                        <TableHead className="min-w-[9rem] w-auto text-center whitespace-nowrap">Tipo</TableHead>
                        <TableHead className="w-32">Ruta Principal</TableHead>
                        <TableHead className="w-28">Fecha</TableHead>
                        <TableHead className="w-32">Guía</TableHead>
                        <TableHead className="w-24 text-center">Ocupados</TableHead>
                        <TableHead className="w-28 text-center">Disponibles</TableHead>
                        <TableHead className="w-32">Estado</TableHead>
                        <TableHead className="w-36 text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentProgrammings.length > 0 ? (
                        currentProgrammings.map((prog) => (
                          <TableRow key={prog.id} className="hover:bg-green-50/50">
                            <TableCell className="font-semibold text-green-700">
                              {prog.programId}
                            </TableCell>
                            <TableCell className="overflow-visible px-3 text-center align-middle">
                              <div className="flex justify-center overflow-visible">
                                <SalidaTipoProgramacionBadge esPersonalizada={normalizeEsPersonalizada(prog.isPersonalizada)} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Route className="w-3 h-3 text-green-600 flex-shrink-0" />
                                <span className="text-sm truncate">{prog.routes[0]?.routeName}</span>
                              </div>
                              {prog.routes.length > 1 && (
                                <span className="text-xs text-gray-500">+{prog.routes.length - 1} más</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {prog.routes.length > 0 && (
                                <div className="text-sm space-y-0.5">
                                  <div>{formatDisplayDate(prog.routes[0].date)}</div>
                                  <div className="text-xs text-gray-500">
                                    Salida {formatTimeDisplay(prog.routes[0].startTime, '—')}
                                    {prog.routes[0].endTime
                                      ? ` · Regreso ${formatTimeDisplay(prog.routes[0].endTime, '—')}`
                                      : ''}
                                  </div>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{renderProgrammingGuideCell(prog)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-xs">
                                {prog.occupiedSeats ?? getTotalParticipants(prog.clients)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center justify-center gap-1">
                                  <Users className="w-3 h-3 text-gray-500" />
                                  <span className="text-sm">{prog.availableSeats ?? '—'}</span>
                                </div>
                                <span className="text-[11px] text-gray-500">
                                  de {prog.totalSeats ?? '—'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {canChangeStatus ? (
                                <Select
                                  value={prog.status}
                                  onValueChange={(value: any) => handleStatusChange(prog.id, value)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="scheduled">Programado</SelectItem>
                                    <SelectItem value="in-progress">En Progreso</SelectItem>
                                    <SelectItem value="completed">Completado</SelectItem>
                                    <SelectItem value="cancelled">Cancelado</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                getStatusBadge(prog.status)
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleView(prog)}
                                  className="h-8 w-8 p-0 hover:bg-blue-50"
                                  title="Ver detalles"
                                >
                                  <Eye className="w-4 h-4 text-blue-600" />
                                </Button>
                                {canEdit && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const id = Number(prog.id);
                                      if (!Number.isFinite(id) || id <= 0) {
                                        toast.error('ID inválido');
                                        return;
                                      }
                                      openBackendEdit(id, prog);
                                    }}
                                    className="relative z-10 h-8 w-8 p-0 hover:bg-green-50"
                                    title="Editar"
                                  >
                                    <Edit className="w-4 h-4 text-green-600" />
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedProgramming(prog);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                    className="h-8 w-8 p-0 hover:bg-red-50"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-12">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No se encontraron programaciones</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>

            {totalPages > 1 && (
              <motion.div
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center gap-2"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="border-green-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? 'bg-green-700 hover:bg-green-800' : 'border-green-300'}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="border-green-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="solicitudes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-amber-200 bg-amber-50/70">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">Por revisar</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {backendSolicitudes.filter((s) => !s?.id_programacion && !solicitudHabilitadaParaPago(s.estado)).length}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Solicitudes que aún no tienen pago habilitado.</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-200 bg-emerald-50/70">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Pago habilitado</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {backendSolicitudes.filter((s) => !s?.id_programacion && solicitudHabilitadaParaPago(s.estado)).length}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Solicitudes aprobadas para que el cliente suba el comprobante.</p>
                </CardContent>
              </Card>
              <Card className="border-blue-200 bg-blue-50/70">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-wide text-blue-700 font-semibold">Listas para convertir</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {backendSolicitudes.filter(
                      (s) =>
                        !s?.id_programacion &&
                        solicitudHabilitadaParaPago(s.estado) &&
                        String(s.venta_estado_pago || '') === 'Pagado'
                    ).length}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Ya pagadas y listas para pasar a programación operativa.</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Solicitudes personalizadas</CardTitle>
                <p className="text-sm text-gray-600">
                  Aquí revisas la solicitud, ajustas la cotización, apruebas/habilitas el pago y, cuando el comprobante quede aprobado, la conviertes en salida operativa.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {backendLoading ? (
                  <div className="p-6 text-sm text-gray-600">Cargando solicitudes…</div>
                ) : backendError ? (
                  <div className="p-6 text-sm text-red-600">{backendError}</div>
                ) : (() => {
                  const pendientes = backendSolicitudes.filter((s) => !s?.id_programacion);
                  const query = solicitudesSearchTerm.trim().toLowerCase();
                  const filteredPendientes = pendientes.filter((s) => {
                    const id = Number(s?.id_solicitud_personalizada);
                    const cliente = `${s?.cliente_nombre || ''} ${s?.cliente_apellido || ''}`.trim().toLowerCase();
                    const ruta = String(s?.ruta_nombre || '').toLowerCase();
                    const estado = String(s?.estado || '').toLowerCase();
                    const pago = String(s?.venta_estado_pago || '').toLowerCase();

                    const matchesQuery =
                      !query ||
                      String(id).includes(query) ||
                      cliente.includes(query) ||
                      ruta.includes(query) ||
                      estado.includes(query) ||
                      pago.includes(query);

                    if (!matchesQuery) return false;

                    if (solicitudesEstadoFilter === 'todas') return true;
                    const pagoHabilitado = solicitudHabilitadaParaPago(s.estado);
                    const pagoAprobado = String(s.venta_estado_pago || '') === 'Pagado';

                    if (solicitudesEstadoFilter === 'por_revisar') return !pagoHabilitado;
                    if (solicitudesEstadoFilter === 'pago_habilitado') return pagoHabilitado && !pagoAprobado;
                    if (solicitudesEstadoFilter === 'listas_convertir') return pagoHabilitado && pagoAprobado;
                    return true;
                  });

                  const itemsPerPageSolicitudes = 8;
                  const totalPagesSolicitudes = Math.max(1, Math.ceil(filteredPendientes.length / itemsPerPageSolicitudes));
                  const safePage = Math.min(Math.max(1, solicitudesPage), totalPagesSolicitudes);
                  const start = (safePage - 1) * itemsPerPageSolicitudes;
                  const pageItems = filteredPendientes.slice(start, start + itemsPerPageSolicitudes);

                  if (filteredPendientes.length === 0) {
                    return (
                      <div className="p-6 text-sm text-gray-600">
                        No hay solicitudes que coincidan con el filtro.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      <div className="px-4 pt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="relative w-full md:max-w-md">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-green-700 w-4 h-4" />
                          <Input
                            placeholder="Buscar por cliente, ruta, estado, ID..."
                            value={solicitudesSearchTerm}
                            onChange={(e) => {
                              setSolicitudesSearchTerm(e.target.value);
                              setSolicitudesPage(1);
                            }}
                            className="pl-10 border-green-300"
                          />
                        </div>

                        <div className="w-full md:w-[260px]">
                          <Select
                            value={solicitudesEstadoFilter}
                            onValueChange={(value: any) => {
                              setSolicitudesEstadoFilter(value);
                              setSolicitudesPage(1);
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Filtrar solicitudes" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todas">Todas</SelectItem>
                              <SelectItem value="por_revisar">Por revisar</SelectItem>
                              <SelectItem value="pago_habilitado">Pago habilitado</SelectItem>
                              <SelectItem value="listas_convertir">Listas para convertir</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50">
                            <TableHead className="w-20">ID</TableHead>
                            <TableHead>Cliente / Ruta</TableHead>
                            <TableHead className="w-32">Estado</TableHead>
                            <TableHead className="w-40">Pago</TableHead>
                            <TableHead className="w-32 text-center">Pedido</TableHead>
                            <TableHead className="w-[260px] text-center">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pageItems.map((s) => {
                            const id = Number(s.id_solicitud_personalizada);
                            const edit =
                              backendSolicitudEdits[id] ??
                              buildSolicitudEditState([s])[id] ?? {
                                fecha_salida: normalizeDateInputValue(s.fecha_deseada),
                                fecha_regreso: normalizeDateInputValue(
                                  (s as any).fecha_regreso_deseada || s.fecha_deseada || ''
                                ),
                                hora_salida: normalizeTimeInputValue(s.hora_deseada),
                                hora_regreso: normalizeTimeInputValue((s as any).hora_regreso_deseada || ''),
                                precio_programacion:
                                  s.precio_cotizado !== null && s.precio_cotizado !== undefined
                                    ? String(s.precio_cotizado)
                                    : '',
                                lugar_encuentro: s.lugar_encuentro != null ? String(s.lugar_encuentro) : '',
                                id_empleado: '__none__',
                                id_empleado_apoyo: '__none__',
                              };
                            const solicitudAprobada = solicitudHabilitadaParaPago(s.estado);
                            const pagoAprobado = String(s.venta_estado_pago || '') === 'Pagado';
                            const solicitudAbierta = solicitudPuedeRechazarse(s);
                            const isExpanded = expandedSolicitudId === id;

                            const validarPrecio = () => {
                              const precio = Number(edit.precio_programacion);
                              if (!Number.isFinite(precio) || precio < 0) {
                                toast.error('Precio inválido');
                                return null;
                              }
                              return precio;
                            };

                            const revisionCotizarPayload = (precio: number, estado: string) => {
                              const mainId =
                                edit.id_empleado !== '__none__' ? Number(edit.id_empleado) : null;
                              const apoyoId =
                                edit.id_empleado_apoyo !== '__none__'
                                  ? Number(edit.id_empleado_apoyo)
                                  : null;
                              if (
                                mainId &&
                                apoyoId &&
                                Number.isFinite(mainId) &&
                                Number.isFinite(apoyoId) &&
                                mainId === apoyoId
                              ) {
                                toast.error('El guía de apoyo debe ser distinto al guía principal');
                                return null;
                              }
                              return {
                                precio_cotizado: precio,
                                estado,
                                fecha_salida: edit.fecha_salida || null,
                                fecha_regreso: edit.fecha_regreso || null,
                                hora_salida: edit.hora_salida || null,
                                hora_regreso: edit.hora_regreso || null,
                                lugar_encuentro: edit.lugar_encuentro?.trim() || null,
                                id_empleado: Number.isFinite(Number(mainId)) && Number(mainId) > 0 ? mainId : null,
                                guias_apoyo:
                                  apoyoId && Number.isFinite(apoyoId) && apoyoId > 0 ? [apoyoId] : null,
                              };
                            };

                            const qRevMain = solicitudRevMainGuideQuery.trim().toLowerCase();
                            const filteredRevMainGuides = backendGuides.filter((guide) => {
                              if (!qRevMain) return true;
                              return [guide.nombre, guide.apellido, guide.cargo, guide.rol_nombre, guide.correo]
                                .filter(Boolean)
                                .some((value) => String(value).toLowerCase().includes(qRevMain));
                            });
                            const qRevApoyo = solicitudRevApoyoGuideQuery.trim().toLowerCase();
                            const filteredRevApoyoGuides = backendGuides.filter((guide) => {
                              if (String(guide.id_empleado) === edit.id_empleado) return false;
                              if (!qRevApoyo) return true;
                              return [guide.nombre, guide.apellido, guide.cargo, guide.rol_nombre, guide.correo]
                                .filter(Boolean)
                                .some((value) => String(value).toLowerCase().includes(qRevApoyo));
                            });

                            return (
                              <React.Fragment key={id}>
                                <TableRow className="hover:bg-green-50/50 align-top">
                                  <TableCell className="font-semibold text-green-700">#{id}</TableCell>
                                  <TableCell>
                                    <div className="text-sm font-medium text-gray-900">{s.ruta_nombre || `Ruta ${s.id_ruta}`}</div>
                                    <div className="text-xs text-gray-500">
                                      Cliente #{s.id_cliente}
                                      {s.cliente_nombre ? ` · ${s.cliente_nombre}${s.cliente_apellido ? ` ${s.cliente_apellido}` : ''}` : ''}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Solicitud: {formatDisplayDateTime(s.fecha_deseada, s.hora_deseada || null)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {s.cantidad_personas} persona{s.cantidad_personas === 1 ? '' : 's'} · {Math.max(0, Number(s.cantidad_personas || 1) - 1)} acompañante{Number(s.cantidad_personas || 1) - 1 === 1 ? '' : 's'}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-2">
                                      {getSolicitudStatusBadge(s.estado)}
                                      <p className="text-xs text-gray-500">{normalizeSolicitudStatus(s.estado)}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm font-medium">
                                      {s.id_venta != null ? `Venta #${s.id_venta}` : 'Sin venta'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Estado: {s.venta_estado_pago || '—'}
                                    </div>
                                    {s.reserva_monto_total != null && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        Total actual: {formatCurrency(s.reserva_monto_total)}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="inline-flex items-center gap-1"
                                      onClick={() => setExpandedSolicitudId((prev) => (prev === id ? null : id))}
                                    >
                                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                      {isExpanded ? 'Ocultar' : 'Ver pedido'}
                                    </Button>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={backendSolicitudSavingId === id || !solicitudAbierta}
                                        onClick={async () => {
                                          try {
                                            const precio = validarPrecio();
                                            if (precio === null) return;
                                            const payload = revisionCotizarPayload(
                                              precio,
                                              s.estado || 'PendienteRevision'
                                            );
                                            if (!payload) return;
                                            setBackendSolicitudSavingId(id);
                                            await solicitudesPersonalizadasAPI.cotizar(id, payload);
                                            await refreshBackendSolicitudes(id);
                                            toast.success('Revisión guardada', {
                                              description:
                                                'Quedaron guardados precio, fechas/horas operativas, punto de encuentro y guías en la solicitud (si el servidor los acepta).',
                                            });
                                          } catch (e: any) {
                                            toast.error('No se pudo guardar la revisión', {
                                              description: e?.message || 'Error desconocido',
                                            });
                                          } finally {
                                            setBackendSolicitudSavingId(null);
                                          }
                                        }}
                                      >
                                        {backendSolicitudSavingId === id ? 'Guardando…' : 'Guardar revisión'}
                                      </Button>

                                      <Button
                                        size="sm"
                                        className="border border-green-700 bg-green-600 text-white shadow-sm hover:bg-green-700 hover:text-white"
                                        disabled={backendSolicitudSavingId === id || !solicitudAbierta}
                                        onClick={async () => {
                                          try {
                                            const precio = validarPrecio();
                                            if (precio === null) return;
                                            const payload = revisionCotizarPayload(precio, 'AprobadaParaPago');
                                            if (!payload) return;
                                            setBackendSolicitudSavingId(id);
                                            await solicitudesPersonalizadasAPI.cotizar(id, payload);
                                            await refreshBackendSolicitudes(id);
                                            toast.success('Pago habilitado para el cliente');
                                          } catch (e: any) {
                                            toast.error('No se pudo habilitar el pago', {
                                              description: e?.message || 'Error desconocido',
                                            });
                                          } finally {
                                            setBackendSolicitudSavingId(null);
                                          }
                                        }}
                                      >
                                        <CheckCircle2 className="mr-1 h-3.5 w-3.5 shrink-0" />
                                        Aprobar y habilitar pago
                                      </Button>

                                      {solicitudAbierta && canEditProgramming && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-red-600 text-red-700 hover:bg-red-50"
                                          disabled={backendSolicitudSavingId === id}
                                          onClick={() => {
                                            setSolicitudRejectTarget(s);
                                            setSolicitudRejectMotivo('');
                                            setSolicitudRejectDialogOpen(true);
                                          }}
                                        >
                                          <Ban className="mr-1 h-3.5 w-3.5" />
                                          Rechazar solicitud
                                        </Button>
                                      )}

                                      <Button
                                        size="sm"
                                        className="bg-green-700 hover:bg-green-800"
                                        disabled={backendConvertingId === id || !solicitudAprobada || !pagoAprobado}
                                        onClick={async () => {
                                          try {
                                            if (!solicitudAprobada) {
                                              toast.error('Primero aprueba la solicitud y habilita el pago');
                                              return;
                                            }
                                            if (!pagoAprobado) {
                                              toast.error('No puedes convertir aún', {
                                                description: 'La venta debe estar en estado Pagado (pago aprobado).',
                                              });
                                              return;
                                            }
                                            if (!edit.fecha_salida || !edit.fecha_regreso) {
                                              toast.error('Completa las fechas operativas antes de convertir la solicitud');
                                              return;
                                            }

                                            const precio = validarPrecio();
                                            if (precio === null) return;

                                            const mainId =
                                              edit.id_empleado !== '__none__' ? Number(edit.id_empleado) : null;
                                            const apoyoId =
                                              edit.id_empleado_apoyo !== '__none__'
                                                ? Number(edit.id_empleado_apoyo)
                                                : null;
                                            if (
                                              mainId &&
                                              apoyoId &&
                                              Number.isFinite(mainId) &&
                                              Number.isFinite(apoyoId) &&
                                              mainId === apoyoId
                                            ) {
                                              toast.error('El guía de apoyo debe ser distinto al guía principal');
                                              return;
                                            }

                                            setBackendConvertingId(id);

                                            const resp: any = await solicitudesPersonalizadasAPI.convertirAProgramacion(id, {
                                              fecha_salida: edit.fecha_salida,
                                              fecha_regreso: edit.fecha_regreso,
                                              hora_salida: edit.hora_salida || null,
                                              hora_regreso: edit.hora_regreso || null,
                                              cupos_totales: Number(s.cantidad_personas || 1),
                                              precio_programacion: precio,
                                              precio_cotizado: precio,
                                              lugar_encuentro: edit.lugar_encuentro?.trim() || null,
                                              id_empleado:
                                                Number.isFinite(Number(mainId)) && Number(mainId) > 0 ? mainId : null,
                                              guias_apoyo:
                                                apoyoId && Number.isFinite(apoyoId) && apoyoId > 0 ? [apoyoId] : null,
                                            });

                                            const programacionNueva = resp?.data?.programacion as ProgramacionBackend | undefined;
                                            const solicitudNueva = resp?.data?.solicitud as SolicitudPersonalizada | undefined;

                                            const progId = Number(
                                              programacionNueva?.id_programacion ?? resp?.data?.id_programacion
                                            );

                                            if (Number.isFinite(progId) && progId > 0) {
                                              try {
                                                const cuposTot = Number(s.cantidad_personas || 1);
                                                const dispRaw = programacionNueva?.cupos_disponibles;
                                                const dispNum =
                                                  dispRaw != null && dispRaw !== ''
                                                    ? Number(dispRaw)
                                                    : NaN;
                                                const cuposDisponibles = Number.isFinite(dispNum) ? dispNum : 0;

                                                await programacionAPI.update(progId, {
                                                  id_ruta: s.id_ruta,
                                                  fecha_salida: edit.fecha_salida,
                                                  fecha_regreso: edit.fecha_regreso,
                                                  hora_salida: edit.hora_salida || null,
                                                  hora_regreso: edit.hora_regreso || null,
                                                  cupos_totales: cuposTot,
                                                  cupos_disponibles: cuposDisponibles,
                                                  precio_programacion: precio,
                                                  estado: (programacionNueva?.estado as string) || 'Programado',
                                                  id_empleado:
                                                    Number.isFinite(Number(mainId)) && Number(mainId) > 0
                                                      ? mainId
                                                      : null,
                                                  lugar_encuentro: edit.lugar_encuentro?.trim() || null,
                                                  guias_apoyo:
                                                    apoyoId && Number.isFinite(apoyoId) && apoyoId > 0 ? [apoyoId] : [],
                                                } as any);

                                                const fresh = await programacionAPI.getById(progId);
                                                setBackendProgramaciones((prev) => {
                                                  const rest = prev.filter((p) => p.id_programacion !== progId);
                                                  return [fresh as ProgramacionBackend, ...rest];
                                                });
                                              } catch (syncErr: any) {
                                                toast.warning('Salida creada; no se reforzaron todos los datos en la programación', {
                                                  description:
                                                    syncErr?.message ||
                                                    'Revisa la salida en edición o intenta actualizarla de nuevo.',
                                                });
                                                if (programacionNueva?.id_programacion) {
                                                  setBackendProgramaciones((prev) => [programacionNueva, ...prev]);
                                                }
                                              }
                                            } else if (programacionNueva?.id_programacion) {
                                              setBackendProgramaciones((prev) => [programacionNueva, ...prev]);
                                            }

                                            setBackendSolicitudes((prev) =>
                                              prev.map((row) =>
                                                row.id_solicitud_personalizada === id && solicitudNueva
                                                  ? solicitudNueva
                                                  : row
                                              )
                                            );

                                            removeSolicitudRevisionSessionDraft(id);
                                            setBackendSolicitudEdits((prev) => {
                                              const next = { ...prev };
                                              delete next[id];
                                              persistSolicitudRevisionSessionDrafts(next);
                                              return next;
                                            });

                                            toast.success('Solicitud convertida a programación');
                                            setStaffActiveTab('programaciones');
                                            setCurrentPage(1);
                                          } catch (e: any) {
                                            toast.error('No se pudo convertir la solicitud', {
                                              description: e?.message || 'Error desconocido',
                                            });
                                          } finally {
                                            setBackendConvertingId(null);
                                          }
                                        }}
                                      >
                                        {backendConvertingId === id ? 'Convirtiendo…' : 'Convertir a programación'}
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>

                                {isExpanded && (
                                  <TableRow className="bg-green-50/30">
                                    <TableCell colSpan={6} className="p-0">
                                      <div className="p-4 md:p-5">
                                        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-5">
                                          <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
                                                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Lo que pidió el cliente</p>
                                                <p className="text-sm text-gray-900">
                                                  Fecha/hora solicitada: {formatDisplayDateTime(s.fecha_deseada, s.hora_deseada || null)}
                                                </p>
                                                {(s as any).fecha_regreso_deseada && (
                                                  <p className="text-sm text-gray-900">
                                                    Regreso sugerido: {formatDisplayDateTime((s as any).fecha_regreso_deseada, (s as any).hora_regreso_deseada || null)}
                                                  </p>
                                                )}
                                                <p className="text-sm text-gray-900">
                                                  Participantes: {s.cantidad_personas} en total
                                                </p>
                                                <p className="text-sm text-gray-900">
                                                  <span className="font-medium">Observaciones:</span>{' '}
                                                  <span className="whitespace-pre-wrap break-words max-h-24 overflow-auto inline-block align-top">
                                                    {s.observaciones?.trim() || 'Sin observaciones registradas.'}
                                                  </span>
                                                </p>
                                              </div>

                                              <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
                                                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Servicios opcionales elegidos</p>
                                                <p className="text-sm text-gray-900">
                                                  {formatRequestedOptionalServices((s as any).servicios_opcionales)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                  Los acompañantes quedan en la reserva asociada. El punto de encuentro y la logística operativa puedes guardarlos en la revisión (y se reutilizan al convertir).
                                                </p>
                                              </div>
                                            </div>

                                            <div className="rounded-xl border border-green-200 bg-white p-4 space-y-4">
                                              <div>
                                                <p className="text-xs uppercase tracking-wide text-green-700 font-semibold">Revisión operativa</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                  Guardar revisión persiste cotización, fechas/horas operativas, punto de encuentro y guías (1 principal y hasta 1 de apoyo) sin habilitar pago. Aprobar y habilitar pago deja lista la solicitud para que el cliente suba el comprobante. Al convertir se usan los mismos datos de esta sección.
                                                </p>
                                                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5 mt-2">
                                                  Mientras el servidor no devuelva estos datos al recargar, la app los guarda en <strong>esta sesión del navegador</strong> al cambiar de módulo y los reaplica al volver. Al convertir a programación se envían al servidor y se borra el borrador local de esta solicitud.
                                                </p>
                                              </div>

                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                  <Label>Fecha salida operativa</Label>
                                                  <Input
                                                    type="date"
                                                    value={edit.fecha_salida}
                                                    onChange={(e) =>
                                                      setBackendSolicitudEdits((prev) => ({
                                                        ...prev,
                                                        [id]: { ...edit, fecha_salida: e.target.value },
                                                      }))
                                                    }
                                                  />
                                                </div>
                                                <div>
                                                  <Label>Hora salida operativa</Label>
                                                  <Input
                                                    type="time"
                                                    value={edit.hora_salida}
                                                    onChange={(e) =>
                                                      setBackendSolicitudEdits((prev) => ({
                                                        ...prev,
                                                        [id]: { ...edit, hora_salida: e.target.value },
                                                      }))
                                                    }
                                                  />
                                                </div>
                                                <div>
                                                  <Label>Fecha regreso operativa</Label>
                                                  <Input
                                                    type="date"
                                                    value={edit.fecha_regreso}
                                                    onChange={(e) =>
                                                      setBackendSolicitudEdits((prev) => ({
                                                        ...prev,
                                                        [id]: { ...edit, fecha_regreso: e.target.value },
                                                      }))
                                                    }
                                                  />
                                                </div>
                                                <div>
                                                  <Label>Hora regreso operativa</Label>
                                                  <Input
                                                    type="time"
                                                    value={edit.hora_regreso}
                                                    onChange={(e) =>
                                                      setBackendSolicitudEdits((prev) => ({
                                                        ...prev,
                                                        [id]: { ...edit, hora_regreso: e.target.value },
                                                      }))
                                                    }
                                                  />
                                                </div>
                                              </div>

                                              <div>
                                                <Label>Punto de encuentro confirmado</Label>
                                                <Textarea
                                                  rows={2}
                                                  className="mt-1 resize-y min-h-[72px]"
                                                  value={edit.lugar_encuentro}
                                                  onChange={(e) =>
                                                    setBackendSolicitudEdits((prev) => ({
                                                      ...prev,
                                                      [id]: { ...edit, lugar_encuentro: e.target.value },
                                                    }))
                                                  }
                                                  placeholder="Dirección o referencia acordada con el cliente"
                                                />
                                              </div>

                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="space-y-2 min-w-0">
                                                  <Label>Guía principal</Label>
                                                  <Input
                                                    className="h-9"
                                                    placeholder="Buscar guía…"
                                                    value={solicitudRevMainGuideQuery}
                                                    onChange={(e) => setSolicitudRevMainGuideQuery(e.target.value)}
                                                  />
                                                  {renderCompactGuideList(
                                                    filteredRevMainGuides,
                                                    edit.id_empleado,
                                                    (guideId) =>
                                                      setBackendSolicitudEdits((prev) => {
                                                        const cur = prev[id];
                                                        if (!cur) return prev;
                                                        return {
                                                          ...prev,
                                                          [id]: {
                                                            ...cur,
                                                            id_empleado: guideId,
                                                            id_empleado_apoyo:
                                                              cur.id_empleado_apoyo === guideId
                                                                ? '__none__'
                                                                : cur.id_empleado_apoyo,
                                                          },
                                                        };
                                                      }),
                                                    'No hay guías registrados',
                                                    'max-h-52'
                                                  )}
                                                </div>
                                                <div className="space-y-2 min-w-0">
                                                  <Label>Guía de apoyo (opcional, segundo guía)</Label>
                                                  <Input
                                                    className="h-9"
                                                    placeholder="Buscar guía…"
                                                    value={solicitudRevApoyoGuideQuery}
                                                    onChange={(e) => setSolicitudRevApoyoGuideQuery(e.target.value)}
                                                  />
                                                  {renderCompactGuideList(
                                                    filteredRevApoyoGuides,
                                                    edit.id_empleado_apoyo,
                                                    (guideId) =>
                                                      setBackendSolicitudEdits((prev) => {
                                                        const cur = prev[id];
                                                        if (!cur) return prev;
                                                        return {
                                                          ...prev,
                                                          [id]: { ...cur, id_empleado_apoyo: guideId },
                                                        };
                                                      }),
                                                    'No hay otro guía disponible',
                                                    'max-h-52'
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="space-y-4">
                                            <div className="rounded-xl border border-green-200 bg-white p-4 space-y-3">
                                              <div>
                                                <p className="text-xs uppercase tracking-wide text-green-700 font-semibold">Cotización final</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                  Este valor se guarda en la solicitud y se refleja en la venta/reserva asociada.
                                                </p>
                                              </div>
                                              <div>
                                                <Label>Precio cotizado</Label>
                                                <Input
                                                  type="number"
                                                  inputMode="decimal"
                                                  value={edit.precio_programacion}
                                                  onChange={(e) =>
                                                    setBackendSolicitudEdits((prev) => ({
                                                      ...prev,
                                                      [id]: { ...edit, precio_programacion: e.target.value },
                                                    }))
                                                  }
                                                  placeholder="Ej: 120000"
                                                />
                                              </div>
                                              <p className="text-xs text-gray-500">
                                                Si aquí no completas fechas válidas, no se podrá convertir la solicitud a programación.
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </TableBody>
                      </Table>
                      </div>

                      {totalPagesSolicitudes > 1 ? (
                        <div className="px-4 pb-4 flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSolicitudesPage((p) => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="border-green-300"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="text-xs text-gray-600">
                            Página {safePage} de {totalPagesSolicitudes}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSolicitudesPage((p) => Math.min(totalPagesSolicitudes, p + 1))}
                            disabled={safePage === totalPagesSolicitudes}
                            className="border-green-300"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <>
          <div
            className={cn(
              'gap-4',
              role === 'guide' &&
                'grid grid-cols-1 xl:grid-cols-[minmax(260px,300px)_1fr] xl:items-start',
            )}
          >
            {role === 'guide' ? (
              <Card className="border-emerald-200 shadow-sm xl:sticky xl:top-4">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base text-emerald-900">Mi disponibilidad</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-4">
                  <GuideAvailabilityCalendar
                    compact
                    programaciones={backendProgramaciones}
                    loading={backendLoading}
                    title="Días libres y ocupados"
                    description="Salidas donde estás asignado como guía (salida → regreso)."
                    occupiedLegend="Ocupado (salida asignada)"
                    freeDayMessage="Día libre: no tienes salidas asignadas."
                  />
                </CardContent>
              </Card>
            ) : null}

            <div className={cn(role === 'guide' && 'space-y-4 min-w-0')}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="shadow-lg border-green-200">
                  <CardContent className="p-0">
                    <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50">
                      <TableHead className="w-24">ID</TableHead>
                      <TableHead className="min-w-[9rem] w-auto text-center whitespace-nowrap">Tipo</TableHead>
                      <TableHead className="w-32">Ruta Principal</TableHead>
                      <TableHead className="w-28">Fecha</TableHead>
                      <TableHead className="w-32">Guía</TableHead>
                      <TableHead className="w-24 text-center">Ocupados</TableHead>
                      <TableHead className="w-28 text-center">Disponibles</TableHead>
                      <TableHead className="w-32">Estado</TableHead>
                      <TableHead className="w-36 text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentProgrammings.length > 0 ? (
                      currentProgrammings.map((prog) => (
                        <TableRow key={prog.id} className="hover:bg-green-50/50">
                          <TableCell className="font-semibold text-green-700">
                            {prog.programId}
                          </TableCell>
                          <TableCell className="overflow-visible px-3 text-center align-middle">
                            <div className="flex justify-center overflow-visible">
                              <SalidaTipoProgramacionBadge esPersonalizada={normalizeEsPersonalizada(prog.isPersonalizada)} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Route className="w-3 h-3 text-green-600 flex-shrink-0" />
                              <span className="text-sm truncate">{prog.routes[0]?.routeName}</span>
                            </div>
                            {prog.routes.length > 1 && (
                              <span className="text-xs text-gray-500">+{prog.routes.length - 1} más</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {prog.routes.length > 0 && (
                              <div className="text-sm">
                                {formatDisplayDate(prog.routes[0].date)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{renderProgrammingGuideCell(prog)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs">
                              {prog.occupiedSeats ?? getTotalParticipants(prog.clients)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center justify-center gap-1">
                                <Users className="w-3 h-3 text-gray-500" />
                                <span className="text-sm">{prog.availableSeats ?? '—'}</span>
                              </div>
                              <span className="text-[11px] text-gray-500">
                                de {prog.totalSeats ?? '—'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {canChangeStatus ? (
                              <Select
                                value={prog.status}
                                onValueChange={(value: any) => handleStatusChange(prog.id, value)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="scheduled">Programado</SelectItem>
                                  <SelectItem value="in-progress">En Progreso</SelectItem>
                                  <SelectItem value="completed">Completado</SelectItem>
                                  <SelectItem value="cancelled">Cancelado</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              getStatusBadge(prog.status)
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleView(prog)}
                                className="h-8 w-8 p-0 hover:bg-blue-50"
                                title="Ver detalles"
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
                          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">
                            {role === 'guide' ? 'No tienes programaciones asignadas' :
                             role === 'client' ? 'No tienes programaciones registradas' :
                             'No se encontraron programaciones'}
                          </p>
                          {(role === 'guide' || role === 'client') && (
                            <p className="text-sm text-gray-400 mt-2">
                              Contacta con el administrador para más información
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>

          {totalPages > 1 && (
            <motion.div
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-2"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="border-green-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? 'bg-green-700 hover:bg-green-800' : 'border-green-300'}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border-green-300"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
            </div>
          </div>
        </>
      )}

      <Dialog
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) {
            setStaffProgrammingCreatePage(false);
            setBackendCreateStep(1);
          } else {
            setBackendCreateStep(1);
          }
        }}
      >
        <DialogContent className="max-w-7xl w-[96vw] h-[95vh] max-h-[95vh] overflow-hidden flex flex-col min-h-0">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-green-800">Crear Nueva Programación</DialogTitle>
            <DialogDescription>
              Complete los datos paso a paso para crear una nueva programación de ruta turística
            </DialogDescription>
          </DialogHeader>
          {isStaffRole && canUseBackend ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
                {renderStaffBackendCreateForm()}
              </div>
            </div>
          ) : (
            <ProgrammingFormImproved
              onClose={closeCreateProgrammingPage}
              availableRoutes={availableRoutes}
              availableClients={availableClients}
              availableGuides={availableGuides}
              serviceOptions={serviceOptions}
              onSubmit={(formData) => {
                const selectedClients = availableClients.filter((c) => formData.clientIds.includes(c.id));
                const selectedGuide = availableGuides.find((g) => g.id === formData.guideId);
                const selectedServices = serviceOptions.filter((s) => formData.serviceIds.includes(s.id));

                const newProgramming: Programming = {
                  id: `prog-${Date.now()}`,
                  programId: `PRG-${(programmings.length + 1).toString().padStart(3, '0')}`,
                  routes: formData.routes,
                  clients: selectedClients,
                  guideId: formData.guideId,
                  guideName: selectedGuide?.name || '',
                  status: formData.status,
                  additionalServices: selectedServices,
                  notes: formData.notes,
                  createdAt: new Date().toISOString().split('T')[0],
                  createdBy: userName || 'Sistema',
                };
                setProgrammings([newProgramming, ...programmings]);
                toast.success('Programación creada exitosamente');
                closeCreateProgrammingPage();
              }}
              userName={userName}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            setBackendEditTargetId(null);
            setBackendEditContratoFechas(null);
            setBackendEditGuiaApoyoIds([]);
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] w-[min(96vw,72rem)] max-w-[min(96vw,72rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,72rem)]">
          <DialogHeader className="shrink-0 border-b border-green-100 px-6 py-4 pr-12">
            <DialogTitle className="text-green-800">
              {isBackendEditPersonalizada ? 'Editar salida personalizada' : 'Editar Programación'}
            </DialogTitle>
            <DialogDescription>
              {isBackendEditPersonalizada
                ? 'Las fechas de salida y regreso son las pactadas con el cliente (no se cambian aquí). Puedes ajustar horarios, punto de encuentro, estado, guía principal y guías de apoyo.'
                : 'Modifique los datos de la programación paso a paso'}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-4 [scrollbar-gutter:stable]">
          {isStaffRole && backendEditTargetId ? (
            renderStaffBackendEditForm()
          ) : selectedProgramming ? (
                        <ProgrammingFormImproved
                          programming={selectedProgramming}
                          onClose={closeEditProgrammingPage}
                          isEdit
                          availableRoutes={availableRoutes}
                          availableClients={availableClients}
                          availableGuides={availableGuides}
                          serviceOptions={serviceOptions}
                          onSubmit={(formData) => {
                            const selectedClients = availableClients.filter(c => formData.clientIds.includes(c.id));
                            const selectedGuide = availableGuides.find(g => g.id === formData.guideId);
                            const selectedServices = serviceOptions.filter(s => formData.serviceIds.includes(s.id));
                
                            setProgrammings(programmings.map(p => 
                              p.id === selectedProgramming.id ? {
                                ...p,
                                programId: formData.programId,
                                routes: formData.routes,
                                clients: selectedClients,
                                guideId: formData.guideId,
                                guideName: selectedGuide?.name || '',
                                status: formData.status,
                                additionalServices: selectedServices,
                                notes: formData.notes
                              } : p
                            ));
                            toast.success('Programación actualizada exitosamente');
                            closeEditProgrammingPage();
                          }}
                          userName={userName}
                        />
          ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalles */}
      <Dialog
        open={isViewModalOpen}
        onOpenChange={(open) => {
          setIsViewModalOpen(open);
          if (!open) resetViewModalState();
        }}
      >
        <DialogContent className="flex max-h-[90vh] w-[min(96vw,72rem)] max-w-[min(96vw,72rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,72rem)]">
          <DialogHeader className="shrink-0 border-b border-green-100 px-6 py-4 pr-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <DialogTitle className="text-green-800">
                  {role === 'guide' ? `Detalles de tu Programación - ${selectedProgramming?.programId}` :
                   role === 'client' ? `Detalles de tu Programación - ${selectedProgramming?.programId}` :
                   `Detalles de la Programación - ${selectedProgramming?.programId}`}
                </DialogTitle>
                <DialogDescription>
                  {role === 'guide' ? 'Información completa de la programación donde estás asignado como guía' :
                   role === 'client' ? 'Información completa de tu programación, grupo y ruta asignada' :
                   'Información completa de la programación'}
                </DialogDescription>
              </div>
              {canEdit && isStaffRole && selectedProgramming ? (
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0 bg-green-700 hover:bg-green-800"
                  onClick={() => {
                    const id = Number(selectedProgramming.id);
                    if (!Number.isFinite(id) || id <= 0) {
                      toast.error('ID inválido');
                      return;
                    }
                    openBackendEdit(id, selectedProgramming);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              ) : null}
            </div>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-4 [scrollbar-gutter:stable]">
          {selectedProgramming && (
              (isStaffRole || (role === 'guide' && canUseBackend)) ? (
                renderStaffOperativeDetailBody()
              ) : (
                <div className="space-y-6">
                {/* Resumen Rápido para Cliente/Guía */}
                {(role === 'client' || role === 'guide') && selectedProgramming.routes.length > 0 && (
                  <Card className="border-green-400 bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-900 mb-2">
                            {role === 'client' ? '¡Tu próxima aventura!' : 'Próxima guianza asignada'}
                          </h3>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <Label className="text-green-700">Ruta</Label>
                              <p className="font-medium text-green-900">{selectedProgramming.routes[0].routeName}</p>
                            </div>
                            <div>
                              <Label className="text-green-700">Salida</Label>
                              <p className="font-medium text-green-900">
                                {formatDateDisplay(selectedProgramming.routes[0].date)}
                              </p>
                              <p className="text-xs text-green-800 mt-0.5">
                                Hora: {formatTimeDisplay(selectedProgramming.routes[0].startTime, 'Por definir')}
                              </p>
                            </div>
                            <div>
                              <Label className="text-green-700">Hora de regreso</Label>
                              <p className="font-medium text-green-900">
                                {formatTimeDisplay(
                                  backendViewDetail?.hora_regreso ?? selectedProgramming.routes[0].endTime,
                                  'Por definir',
                                )}
                              </p>
                            </div>
                            {role === 'client' && (
                              <div>
                                <Label className="text-green-700">Guía</Label>
                                <p className="font-medium text-green-900">{selectedProgramming.guideName}</p>
                                {selectedProgramming.guidePhone ? (
                                  <p className="text-xs text-green-800 mt-0.5">{selectedProgramming.guidePhone}</p>
                                ) : null}
                                {selectedProgramming.guideEmail ? (
                                  <p className="text-xs text-green-800 truncate">{selectedProgramming.guideEmail}</p>
                                ) : null}
                              </div>
                            )}
                            <div>
                              <Label className="text-green-700">Participantes</Label>
                              <p className="font-medium text-green-900">{getTotalParticipants(selectedProgramming.clients)} personas</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          {getStatusBadge(selectedProgramming.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Info General */}
                <Card className="border-green-200">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="text-lg">Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-500">ID Programación</Label>
                        <p className="font-medium">{selectedProgramming.programId}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Estado</Label>
                        <div className="mt-1">{getStatusBadge(selectedProgramming.status)}</div>
                      </div>
                      <div>
                        <Label className="text-gray-500">Creado por</Label>
                        <p className="text-sm">{selectedProgramming.createdBy}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Fecha de creación</Label>
                        <p className="text-sm">{new Date(selectedProgramming.createdAt).toLocaleDateString('es-ES')}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Total Participantes</Label>
                        <p className="text-sm font-medium">{getTotalParticipants(selectedProgramming.clients)} personas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rutas */}
                <Card className="border-blue-200">
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Route className="w-5 h-5" />
                      Rutas Programadas ({selectedProgramming.routes.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {selectedProgramming.routes.map((route, idx) => (
                        <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Route className="w-4 h-4 text-blue-600" />
                            <p className="font-medium text-lg">{route.routeName}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <Label className="text-gray-500">Fecha</Label>
                              <p className="font-medium">
                                {new Date(route.date).toLocaleDateString('es-ES', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                            <div>
                              <Label className="text-gray-500">Hora de salida</Label>
                              <p className="font-medium text-green-700">
                                {formatTimeDisplay(route.startTime, 'Por definir')}
                              </p>
                            </div>
                            <div>
                              <Label className="text-gray-500">Hora de regreso</Label>
                              <p className="font-medium">
                                {formatTimeDisplay(route.endTime, 'Por definir')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {viewModalRutaLoading ? (
                  <Card className="border-slate-200">
                    <CardContent className="p-4 text-sm text-gray-600">
                      Cargando recomendaciones de la ruta…
                    </CardContent>
                  </Card>
                ) : null}
                {role === 'client' &&
                !viewModalRutaLoading &&
                String(viewModalRuta?.recomendaciones_participantes ?? '').trim() ? (
                  <Card className="border-emerald-200">
                    <CardHeader className="bg-emerald-50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Recomendaciones para tu salida
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {viewModalRuta!.recomendaciones_participantes}
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
                {role === 'guide' &&
                !viewModalRutaLoading &&
                String(viewModalRuta?.briefing_operativo_equipo ?? '').trim() ? (
                  <Card className="border-amber-200">
                    <CardHeader className="bg-amber-50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ClipboardList className="w-5 h-5" />
                        Briefing operativo (equipo)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-xs text-amber-900/80 mb-3">
                        Itinerario y coordinación interna. El punto de encuentro oficial con el grupo puede
                        figurar también en la programación.
                      </p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {viewModalRuta!.briefing_operativo_equipo}
                      </p>
                    </CardContent>
                  </Card>
                ) : null}

                {/* Clientes y Acompañantes */}
                <Card className="border-purple-200">
                  <CardHeader className="bg-purple-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      {role === 'client' ? 'Tu Grupo de Viaje' : `Clientes y Acompañantes (${selectedProgramming.clients.length} clientes)`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {role === 'client' ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-300">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <p className="font-medium text-blue-900">
                              Total de participantes en esta programación: {getTotalParticipants(selectedProgramming.clients)} personas
                            </p>
                          </div>
                          <p className="text-sm text-blue-700">
                            Viajarás con {getTotalParticipants(selectedProgramming.clients) - 1 - (selectedProgramming.clients.find(c => c.name === userName)?.companions.length || 0)} personas más
                          </p>
                        </div>

                        {selectedProgramming.clients.filter(c => c.name === userName).map((client) => (
                          <div 
                            key={client.id} 
                            className="p-4 rounded-lg border bg-green-50 border-green-400 ring-2 ring-green-300"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-lg">{client.name}</p>
                                  <Badge className="bg-green-600 text-white">TÚ</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-gray-500" />
                                    <span>{client.email}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-gray-500" />
                                    <span>{client.phone}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">Doc: {client.document}</p>
                              </div>
                            </div>

                            {client.companions.length > 0 && (
                              <div className="mt-4">
                                <Label className="text-gray-700 mb-2 block">Tus Acompañantes ({client.companions.length})</Label>
                                <div className="space-y-2">
                                  {client.companions.map((companion) => (
                                    <div key={companion.id} className="p-3 bg-white rounded border border-purple-100">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-medium text-sm">{companion.name}</p>
                                          <p className="text-xs text-gray-600">Doc: {companion.document}</p>
                                        </div>
                                        <div className="text-right text-xs">
                                          <p className="text-gray-600">{companion.phone}</p>
                                          {companion.age && <p className="text-gray-500">{companion.age} años</p>}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedProgramming.clients.map((client) => {
                          const isCurrentClient = role === 'guide' && client.name === userName;
                          return (
                          <div 
                            key={client.id} 
                            className={`p-4 rounded-lg border ${
                              isCurrentClient 
                                ? 'bg-green-50 border-green-400 ring-2 ring-green-300' 
                                : 'bg-purple-50 border-purple-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-lg">{client.name}</p>
                                  {isCurrentClient && (
                                    <Badge className="bg-green-600 text-white">TÚ</Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-gray-500" />
                                    <span>{client.email}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-gray-500" />
                                    <span>{client.phone}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">Doc: {client.document}</p>
                              </div>
                            </div>

                            {client.companions.length > 0 && (
                              <div className="mt-4">
                                <Label className="text-gray-700 mb-2 block">Acompañantes ({client.companions.length})</Label>
                                <div className="space-y-2">
                                  {client.companions.map((companion) => (
                                    <div key={companion.id} className="p-3 bg-white rounded border border-purple-100">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-medium text-sm">{companion.name}</p>
                                          <p className="text-xs text-gray-600">Doc: {companion.document}</p>
                                        </div>
                                        <div className="text-right text-xs">
                                          <p className="text-gray-600">{companion.phone}</p>
                                          {companion.age && <p className="text-gray-500">{companion.age} años</p>}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Guía */}
                <Card className="border-orange-200">
                  <CardHeader className="bg-orange-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {role === 'client' ? 'Tu Guía Asignado' : role === 'guide' ? 'Información del Guía (Tú)' : 'Guía Asignado'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {renderGuideContactFields({
                      name: selectedProgramming.guideName,
                      roleLabel: selectedProgramming.guideRoleLabel || 'Guía turístico',
                      email:
                        displayViewGuide?.correo ||
                        selectedProgramming.guideEmail ||
                        (backendViewDetail as any)?.empleado_correo,
                      phone:
                        displayViewGuide?.telefono ||
                        selectedProgramming.guidePhone ||
                        (backendViewDetail as any)?.empleado_telefono,
                      highlightSelf: role === 'guide' && selectedProgramming.guideName === userName,
                    })}
                  </CardContent>
                </Card>

                {/* Servicios Adicionales */}
                {selectedProgramming.additionalServices.length > 0 && (
                  <Card className="border-teal-200">
                    <CardHeader className="bg-teal-50">
                      <CardTitle className="text-lg">Servicios Adicionales ({selectedProgramming.additionalServices.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 gap-3">
                        {selectedProgramming.additionalServices.map((service) => (
                          <div key={service.id} className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                            <div className="flex items-center gap-2 mb-1">
                              {service.type === 'accommodation' && <Bed className="w-4 h-4 text-blue-600" />}
                              {service.type === 'food' && <Utensils className="w-4 h-4 text-orange-600" />}
                              {service.type === 'transport' && <Bus className="w-4 h-4 text-green-600" />}
                              {service.type === 'other' && <HomeIcon className="w-4 h-4 text-purple-600" />}
                              <p className="font-medium text-sm">{service.name}</p>
                            </div>
                            <p className="text-sm text-green-600 font-medium mt-1">
                              ${service.price.toLocaleString('es-CO')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notas */}
                {selectedProgramming.notes && (
                  <Card className="border-gray-200">
                    <CardHeader className="bg-gray-50">
                      <CardTitle className="text-lg">Notas</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-gray-700">{selectedProgramming.notes}</p>
                    </CardContent>
                  </Card>
                )}
                </div>
              )
          )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={reservaPreviewOpen}
        onOpenChange={(open) => {
          setReservaPreviewOpen(open);
          if (!open) setReservaPreview(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {(() => {
                const id = reservaPreview ? getReservaRowId(reservaPreview) : null;
                return id != null ? `Reserva #${id}` : 'Reserva';
              })()}
            </DialogTitle>
            <DialogDescription>Información completa de esta reserva.</DialogDescription>
          </DialogHeader>
          {reservaPreviewLoading ? (
            <p className="text-sm text-gray-600 py-8 text-center">Cargando…</p>
          ) : reservaPreview ? (
            <div className="space-y-4 text-sm">
              <div>
                <Label className="text-gray-500">Cliente</Label>
                <p className="font-medium text-gray-900">{getReservaClienteLabel(reservaPreview)}</p>
                <p className="mt-1 text-sm text-gray-700">
                  Documento: {getReservaDocumentoLabel(reservaPreview)}
                </p>
              </div>
              {(reservaPreview.cliente_email || reservaPreview.cliente_telefono) && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  { !!reservaPreview.cliente_email && (
                    <div>
                      <Label className="text-gray-500">Correo</Label>
                      <p className="break-all text-gray-900">{reservaPreview.cliente_email}</p>
                    </div>
                  )}
                  { !!reservaPreview.cliente_telefono && (
                    <div>
                      <Label className="text-gray-500">Teléfono</Label>
                      <p className="text-gray-900">{reservaPreview.cliente_telefono}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-500">Participantes</Label>
                  <p className="font-medium text-gray-900">{reservaPreview.numero_participantes ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Fecha reserva</Label>
                  <p className="font-medium text-gray-900">
                    {formatDateDisplay(reservaPreview.fecha_reserva)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Estado</Label>
                  <p className="font-medium text-gray-900">{reservaPreview.estado ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Pago</Label>
                  <p className="font-medium text-gray-900">{reservaPreview.estado_pago ?? '—'}</p>
                </div>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-4">
                <Label className="flex items-center gap-2 text-gray-800">
                  <Users className="h-4 w-4 text-purple-700" />
                  Acompañantes ({getReservaAcompanantes(reservaPreview).length})
                </Label>
                {getReservaAcompanantes(reservaPreview).length > 0 ? (
                  <div className="mt-3 overflow-x-auto rounded-md border border-purple-100 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-muted/0">
                          <TableHead>Nombre</TableHead>
                          <TableHead>Documento</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead className="whitespace-nowrap">F. nacimiento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getReservaAcompanantes(reservaPreview).map((acompanante, aidx) => (
                          <TableRow key={acompanante.id_detalle_reserva_acompanante ?? `ac-${aidx}`}>
                            <TableCell className="font-medium text-gray-900">
                              {`${acompanante.nombre || ''} ${acompanante.apellido || ''}`.trim() || '—'}
                            </TableCell>
                            <TableCell>
                              {[acompanante.tipo_documento, acompanante.numero_documento].filter(Boolean).join(' ').trim() || '—'}
                            </TableCell>
                            <TableCell>{acompanante.telefono?.trim() || '—'}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {acompanante.fecha_nacimiento
                                ? formatDisplayDate(acompanante.fecha_nacimiento)
                                : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-600">
                    Esta reserva no tiene acompañantes registrados en el sistema.
                  </p>
                )}
              </div>
              <div>
                <Label className="text-gray-500">Notas / observaciones</Label>
                <p className="mt-1 whitespace-pre-wrap rounded-md border bg-gray-50 p-3 text-gray-800">
                  {getReservaNotasResumen(reservaPreview) || 'Sin notas registradas.'}
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={reservaPreviewOpen}
        onOpenChange={(open) => {
          setReservaPreviewOpen(open);
          if (!open) setReservaPreview(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {(() => {
                const id = reservaPreview ? getReservaRowId(reservaPreview) : null;
                return id != null ? `Reserva #${id}` : 'Reserva';
              })()}
            </DialogTitle>
            <DialogDescription>Información completa de esta reserva.</DialogDescription>
          </DialogHeader>
          {reservaPreviewLoading ? (
            <p className="text-sm text-gray-600 py-8 text-center">Cargando…</p>
          ) : reservaPreview ? (
            <div className="space-y-4 text-sm">
              <div>
                <Label className="text-gray-500">Cliente</Label>
                <p className="font-medium text-gray-900">{getReservaClienteLabel(reservaPreview)}</p>
              </div>
              {(reservaPreview.cliente_email || reservaPreview.cliente_telefono) && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  { !!reservaPreview.cliente_email && (
                    <div>
                      <Label className="text-gray-500">Correo</Label>
                      <p className="break-all text-gray-900">{reservaPreview.cliente_email}</p>
                    </div>
                  )}
                  { !!reservaPreview.cliente_telefono && (
                    <div>
                      <Label className="text-gray-500">Teléfono</Label>
                      <p className="text-gray-900">{reservaPreview.cliente_telefono}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-500">Participantes</Label>
                  <p className="font-medium text-gray-900">{reservaPreview.numero_participantes ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Fecha reserva</Label>
                  <p className="font-medium text-gray-900">
                    {formatDateDisplay(reservaPreview.fecha_reserva)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Estado</Label>
                  <p className="font-medium text-gray-900">{reservaPreview.estado ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Pago</Label>
                  <p className="font-medium text-gray-900">{reservaPreview.estado_pago ?? '—'}</p>
                </div>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-4">
                <Label className="flex items-center gap-2 text-gray-800">
                  <Users className="h-4 w-4 text-purple-700" />
                  Acompañantes ({getReservaAcompanantes(reservaPreview).length})
                </Label>
                {getReservaAcompanantes(reservaPreview).length > 0 ? (
                  <div className="mt-3 overflow-x-auto rounded-md border border-purple-100 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-muted/0">
                          <TableHead>Nombre</TableHead>
                          <TableHead>Documento</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead className="whitespace-nowrap">F. nacimiento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getReservaAcompanantes(reservaPreview).map((acompanante, aidx) => (
                          <TableRow key={acompanante.id_detalle_reserva_acompanante ?? `ac-${aidx}`}>
                            <TableCell className="font-medium text-gray-900">
                              {`${acompanante.nombre || ''} ${acompanante.apellido || ''}`.trim() || '—'}
                            </TableCell>
                            <TableCell>
                              {[acompanante.tipo_documento, acompanante.numero_documento].filter(Boolean).join(' ').trim() || '—'}
                            </TableCell>
                            <TableCell>{acompanante.telefono?.trim() || '—'}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {acompanante.fecha_nacimiento
                                ? formatDisplayDate(acompanante.fecha_nacimiento)
                                : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-600">
                    Esta reserva no tiene acompañantes registrados en el sistema.
                  </p>
                )}
              </div>
              <div>
                <Label className="text-gray-500">Notas / observaciones</Label>
                <p className="mt-1 whitespace-pre-wrap rounded-md border bg-gray-50 p-3 text-gray-800">
                  {getReservaNotasResumen(reservaPreview) || 'Sin notas registradas.'}
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={solicitudRejectDialogOpen}
        onOpenChange={(open) => {
          setSolicitudRejectDialogOpen(open);
          if (!open) {
            setSolicitudRejectTarget(null);
            setSolicitudRejectMotivo('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Rechazar solicitud personalizada</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  La solicitud #{solicitudRejectTarget?.id_solicitud_personalizada} pasará a estado{' '}
                  <strong>Rechazada</strong>.
                  {solicitudRejectTarget?.id_reserva ? (
                    <>
                      {' '}
                      La reserva #{solicitudRejectTarget.id_reserva} se cancelará y dejará de bloquear eliminar la
                      ruta.
                    </>
                  ) : (
                    ' No hay reserva vinculada.'
                  )}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="solicitud-rechazo-motivo">
                    Motivo del rechazo *{' '}
                    <span className="font-normal text-gray-500">(mín. {SOLICITUD_RECHAZO_MOTIVO_MIN} caracteres)</span>
                  </Label>
                  <Textarea
                    id="solicitud-rechazo-motivo"
                    value={solicitudRejectMotivo}
                    onChange={(e) => setSolicitudRejectMotivo(e.target.value)}
                    placeholder="Ej.: No hay disponibilidad de guías en la fecha solicitada."
                    rows={3}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={backendSolicitudSavingId != null}>Volver</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={
                backendSolicitudSavingId != null ||
                solicitudRejectMotivo.trim().length < SOLICITUD_RECHAZO_MOTIVO_MIN
              }
              onClick={(e) => {
                e.preventDefault();
                void confirmarRechazoSolicitud();
              }}
            >
              {backendSolicitudSavingId != null ? 'Rechazando…' : 'Rechazar solicitud'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              ¿Eliminar programación?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la programación "{selectedProgramming?.programId}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
