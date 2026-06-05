import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  TrendingUp,
  Award,
  Gift,
  Heart,
  FileText,
  Download,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { authAPI, clientesAPI, reservasAPI, type Reserva } from '../services/api';
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
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Switch } from './ui/switch';
import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';
import {
  getClientPasswordRequirementChecks,
  normalizeClientEmail,
  sanitizeDocumentInput,
  sanitizePhoneInput,
  validateClientFormForCreate,
  validateClientFormForEdit,
  type ClientFormValidationInput,
} from '../utils/clientFormValidation';
import { formatCurrencyCOP as formatCurrency } from '../utils/currencyDisplay';
import { formatDateDisplay } from '../utils/dateTimeDisplay';
import {
  buildExportFilename,
  exportToCsv,
  exportToExcel,
  type ExportColumn,
} from '../utils/exportListData';

const MAX_BIRTH_DATE = new Date().toISOString().slice(0, 10);

type ClientFormState = {
  name: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  preferences: string;
  location: string;
  notes: string;
  password: string;
  confirmPassword: string;
};

const EMPTY_CLIENT_FORM: ClientFormState = {
  name: '',
  email: '',
  phone: '',
  documentType: '',
  documentNumber: '',
  birthDate: '',
  preferences: '',
  location: '',
  notes: '',
  password: '',
  confirmPassword: '',
};

function toValidationInput(data: ClientFormState): ClientFormValidationInput {
  return {
    name: data.name,
    email: data.email,
    phone: data.phone,
    documentType: data.documentType,
    documentNumber: data.documentNumber,
    address: data.location,
    birthDate: data.birthDate,
    preferences: data.preferences,
    notes: data.notes,
    password: data.password,
    confirmPassword: data.confirmPassword,
  };
}

type ClientSortField =
  | 'id'
  | 'name'
  | 'email'
  | 'phone'
  | 'documentNumber'
  | 'address'
  | 'fechaRegistro'
  | 'lastVisit'
  | 'estado';

type SortDirection = 'asc' | 'desc';

function parseSortableTimestamp(value?: string | null): number {
  const raw = String(value || '').trim();
  if (!raw) return 0;
  const normalized = raw.includes('T') ? raw : `${raw.slice(0, 10)}T12:00:00`;
  const time = Date.parse(normalized);
  return Number.isFinite(time) ? time : 0;
}

function compareClients(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  field: ClientSortField,
  direction: SortDirection,
): number {
  let cmp = 0;

  switch (field) {
    case 'id':
      cmp = Number(a.id) - Number(b.id);
      break;
    case 'name':
      cmp = String(a.name || '').localeCompare(String(b.name || ''), 'es', {
        sensitivity: 'base',
      });
      break;
    case 'email':
      cmp = String(a.email || '').localeCompare(String(b.email || ''), 'es', {
        sensitivity: 'base',
      });
      break;
    case 'phone': {
      const digits = (v: unknown) => String(v || '').replace(/\D/g, '');
      cmp = digits(a.phone).localeCompare(digits(b.phone), 'es', { numeric: true });
      break;
    }
    case 'documentNumber':
      cmp = String(a.documentNumber || '').localeCompare(String(b.documentNumber || ''), 'es', {
        numeric: true,
        sensitivity: 'base',
      });
      break;
    case 'address':
      cmp = String(a.address || a.location || '').localeCompare(
        String(b.address || b.location || ''),
        'es',
        { sensitivity: 'base' },
      );
      break;
    case 'fechaRegistro':
      cmp =
        parseSortableTimestamp(a.fechaRegistro as string) -
        parseSortableTimestamp(b.fechaRegistro as string);
      break;
    case 'lastVisit':
      cmp =
        parseSortableTimestamp(a.lastVisit as string) - parseSortableTimestamp(b.lastVisit as string);
      break;
    case 'estado':
      cmp = Number(Boolean(a.isActive)) - Number(Boolean(b.isActive));
      break;
    default:
      cmp = 0;
  }

  if (cmp === 0) {
    cmp = String(a.name || '').localeCompare(String(b.name || ''), 'es', {
      sensitivity: 'base',
    });
  }

  return direction === 'asc' ? cmp : -cmp;
}

function formatSpentCompact(value: number): string {
  const amount = Number(value || 0);
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K`;
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
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function formatDate(value?: string | null): string {
  return formatDateDisplay(value);
}

function isRegisterEmailConflictError(err: unknown): boolean {
  const msg = String((err as Error)?.message || err || '').toLowerCase();
  return msg.includes('correo') && (msg.includes('existe') || msg.includes('duplic'));
}

function isDuplicateEmailInList(
  email: string,
  list: Array<{ id?: string; email?: string }>,
  excludeId?: string,
): boolean {
  const normalized = normalizeClientEmail(email);
  if (!normalized) return false;
  return list.some(
    (c) =>
      normalizeClientEmail(String(c.email || '')) === normalized &&
      String(c.id ?? '') !== String(excludeId ?? ''),
  );
}

const FORM_MODAL_CLASS = 'max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl';
const DETAIL_MODAL_CLASS = 'max-h-[90vh] w-[95vw] max-w-6xl overflow-y-auto';

const CLIENT_EXPORT_COLUMNS: ExportColumn<Record<string, unknown>>[] = [
  { header: 'ID', getValue: (c) => String(c.id ?? '') },
  { header: 'Nombre', getValue: (c) => String(c.firstName ?? c.name ?? '') },
  { header: 'Apellido', getValue: (c) => String(c.lastName ?? '') },
  { header: 'Correo', getValue: (c) => String(c.email ?? '') },
  { header: 'Teléfono', getValue: (c) => String(c.phone ?? '') },
  { header: 'Tipo documento', getValue: (c) => String(c.documentType ?? '') },
  { header: 'Número documento', getValue: (c) => String(c.documentNumber ?? '') },
  { header: 'Dirección', getValue: (c) => String(c.address ?? c.location ?? '') },
  { header: 'Ciudad', getValue: (c) => String(c.city ?? '') },
  { header: 'País', getValue: (c) => String(c.country ?? '') },
  { header: 'Código postal', getValue: (c) => String(c.postalCode ?? '') },
  { header: 'Género', getValue: (c) => String(c.gender ?? '') },
  { header: 'Nacionalidad', getValue: (c) => String(c.nationality ?? '') },
  { header: 'Newsletter', getValue: (c) => (c.newsletter ? 'Sí' : 'No') },
  { header: 'Estado', getValue: (c) => (c.isActive ? 'Activo' : 'Inactivo') },
  {
    header: 'Fecha registro',
    getValue: (c) => formatDate(String(c.fechaRegistro || c.joinDate || '')),
  },
  { header: 'Último acceso', getValue: (c) => formatDate(String(c.lastVisit || '')) },
  { header: 'Preferencias', getValue: (c) => String(c.preferences ?? '') },
  { header: 'Notas', getValue: (c) => String(c.notes ?? '') },
];

export function ClientsManagement() {
  const permisos = usePermissions();
  const clientPerms = createModulePermissions(permisos, 'Clientes');
  const canViewClients = clientPerms.canView();
  const canCreateClient = clientPerms.canCreate();
  const canEditClient = clientPerms.canEdit();
  const canDeleteClient = clientPerms.canDelete();

  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [newsletterFilter, setNewsletterFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReservasCheck, setDeleteReservasCheck] = useState<{
    loading: boolean;
    activeReservas: Reserva[];
    error: boolean;
  } | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientReservasLoading, setClientReservasLoading] = useState(false);
  const [clientReservas, setClientReservas] = useState<Reserva[]>([]);
  const [clientReservasStats, setClientReservasStats] = useState<ReturnType<
    typeof computeClientReservationStats
  > | null>(null);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<ClientSortField>('fechaRegistro');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  // Cargar clientes del backend al montar el componente
  useEffect(() => {
    if (permisos.loadingRoles) return;
    if (!canViewClients) {
      setClients([]);
      setIsLoading(false);
      return;
    }
    cargarClientes();
  }, [permisos.loadingRoles, canViewClients]);

  const cargarClientes = async () => {
    try {
      setIsLoading(true);
      const data = await clientesAPI.getAll();
      // Mapear los datos del backend al formato del componente
      const clientesMapeados = data.map((c: any) => ({
        id: c.id_cliente?.toString() || c.id?.toString(),
        firstName: String(c.nombre || '').trim(),
        lastName: String(c.apellido || '').trim(),
        name: `${String(c.nombre || '').trim()} ${String(c.apellido || '').trim()}`.trim(),
        documentType: String(c.tipo_documento || c.tipoDocumento || '').trim(),
        documentNumber: c.numero_documento || '',
        email: c.correo || '',
        phone: c.telefono || '',
        address: c.direccion || '',
        city: c.ciudad || '',
        country: c.pais || '',
        postalCode: c.codigo_postal || '',
        gender: c.genero || '',
        nationality: c.nacionalidad || '',
        newsletter: Boolean(c.newsletter ?? c.suscrito_newsletter),
        preferences: '',
        experienceType: 'rural',
        frequencyLevel: 'Media',
        satisfactionLevel: 'Buena',
        totalBookings: 0,
        totalSpent: 0,
        lastVisit: c.ultimo_acceso || '',
        birthDate: String(c.fecha_nacimiento || c.fechaNacimiento || '').slice(0, 10),
        joinDate: c.fecha_registro || new Date().toISOString().split('T')[0],
        fechaRegistro: c.fecha_registro || c.fecha_creacion || c.created_at || '',
        fechaActualizacion: c.fecha_actualizacion || c.updated_at || '',
        createdAt: c.created_at || c.fecha_creacion || '',
        updatedAt: c.updated_at || c.fecha_actualizacion || '',
        idUsuario: c.id_usuarios ?? c.id_usuario ?? c.idUsuario ?? '',
        idRole: c.id_roles ?? c.id_role ?? '',
        location: c.direccion || '',
        favoriteRoutes: Array.isArray(c.favoriteRoutes) ? c.favoriteRoutes : [],
        notes: c.notas || c.notes || '',
        isActive: c.estado !== false,
      }));
      setClients(clientesMapeados);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      toast.error('Error al cargar clientes del servidor');
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const [formData, setFormData] = useState<ClientFormState>({ ...EMPTY_CLIENT_FORM });

  const passwordRequirementChecks = useMemo(
    () => getClientPasswordRequirementChecks(formData.password),
    [formData.password],
  );

  const createPasswordsMatch =
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          client.name.toLowerCase().includes(term) ||
          client.email.toLowerCase().includes(term) ||
          client.phone.toLowerCase().includes(term) ||
          (client.documentNumber &&
            client.documentNumber.toLowerCase().includes(term)) ||
          (client.address && client.address.toLowerCase().includes(term)) ||
          (client.location && client.location.toLowerCase().includes(term));
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && client.isActive) ||
          (statusFilter === 'inactive' && !client.isActive);
        const matchesDocumentType =
          documentTypeFilter === 'all' ||
          String(client.documentType || '').toUpperCase() === documentTypeFilter;
        const matchesNewsletter =
          newsletterFilter === 'all' ||
          (newsletterFilter === 'yes' && client.newsletter) ||
          (newsletterFilter === 'no' && !client.newsletter);
        return (
          matchesSearch &&
          matchesStatus &&
          matchesDocumentType &&
          matchesNewsletter
        );
      }),
    [clients, searchTerm, statusFilter, documentTypeFilter, newsletterFilter],
  );

  const sortedClients = useMemo(() => {
    const list = [...filteredClients];
    list.sort((a, b) => compareClients(a, b, sortField, sortDirection));
    return list;
  }, [filteredClients, sortField, sortDirection]);

  const paginatedClients = sortedClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(sortedClients.length / itemsPerPage);

  const filteredHistoryReservas = useMemo(
    () =>
      clientReservas.filter((reserva) =>
        reservaMatchesHistorySearch(reserva, historySearchTerm),
      ),
    [clientReservas, historySearchTerm],
  );

  const historyTotalPages = Math.max(
    1,
    Math.ceil(filteredHistoryReservas.length / CLIENT_HISTORY_ITEMS_PER_PAGE),
  );

  const paginatedHistoryReservas = useMemo(() => {
    const start = (historyPage - 1) * CLIENT_HISTORY_ITEMS_PER_PAGE;
    return filteredHistoryReservas.slice(
      start,
      start + CLIENT_HISTORY_ITEMS_PER_PAGE,
    );
  }, [filteredHistoryReservas, historyPage]);

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    statusFilter !== 'all' ||
    documentTypeFilter !== 'all' ||
    newsletterFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDocumentTypeFilter('all');
    setNewsletterFilter('all');
    setCurrentPage(1);
  };

  const handleExportClients = (format: 'csv' | 'xlsx') => {
    if (sortedClients.length === 0) {
      toast.error('No hay clientes para exportar con los filtros actuales');
      return;
    }

    const filename = buildExportFilename('clientes', format);

    try {
      if (format === 'csv') {
        exportToCsv(sortedClients, CLIENT_EXPORT_COLUMNS, filename);
      } else {
        exportToExcel(sortedClients, CLIENT_EXPORT_COLUMNS, filename, 'Clientes');
      }
      toast.success(
        `${sortedClients.length} cliente(s) exportados a ${format === 'csv' ? 'CSV' : 'Excel'}`,
      );
    } catch (error) {
      console.error('Error al exportar clientes:', error);
      toast.error('No se pudo generar el archivo de exportación');
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, documentTypeFilter, newsletterFilter, sortField, sortDirection]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historySearchTerm, selectedClient?.id]);

  useEffect(() => {
    if (historyPage > historyTotalPages) {
      setHistoryPage(historyTotalPages);
    }
  }, [historyPage, historyTotalPages]);

  useEffect(() => {
    if (!isHistoryModalOpen || !selectedClient?.id) {
      setClientReservas([]);
      setClientReservasStats(null);
      setClientReservasLoading(false);
      setHistorySearchTerm('');
      setHistoryPage(1);
      return;
    }

    let cancelled = false;

    const loadClientReservas = async () => {
      setClientReservasLoading(true);
      try {
        const reservas = await reservasAPI.getByCliente(Number(selectedClient.id));
        if (cancelled) return;
        const sorted = [...reservas].sort((a, b) => {
          const ta = parseSortableTimestamp(a.fecha_creacion ?? a.created_at ?? a.fecha_reserva);
          const tb = parseSortableTimestamp(b.fecha_creacion ?? b.created_at ?? b.fecha_reserva);
          return tb - ta;
        });
        setClientReservas(sorted);
        setClientReservasStats(computeClientReservationStats(sorted));
      } catch (error) {
        console.error('Error al cargar reservas del cliente:', error);
        if (!cancelled) {
          setClientReservas([]);
          setClientReservasStats(null);
          toast.error('No se pudieron cargar las reservas del cliente');
        }
      } finally {
        if (!cancelled) setClientReservasLoading(false);
      }
    };

    loadClientReservas();

    return () => {
      cancelled = true;
    };
  }, [isHistoryModalOpen, selectedClient?.id]);

  useEffect(() => {
    if (!isDeleteModalOpen || !selectedClient?.id) {
      setDeleteReservasCheck(null);
      return;
    }

    let cancelled = false;
    setDeleteReservasCheck({ loading: true, activeReservas: [], error: false });

    const verifyActiveReservas = async () => {
      try {
        const reservas = await reservasAPI.getByCliente(Number(selectedClient.id));
        if (cancelled) return;
        setDeleteReservasCheck({
          loading: false,
          activeReservas: getActiveReservas(reservas),
          error: false,
        });
      } catch (error) {
        console.error('Error al verificar reservas del cliente:', error);
        if (!cancelled) {
          setDeleteReservasCheck({ loading: false, activeReservas: [], error: true });
        }
      }
    };

    verifyActiveReservas();

    return () => {
      cancelled = true;
    };
  }, [isDeleteModalOpen, selectedClient?.id]);

  // Estadísticas
  const stats = {
    totalClients: clients.length,
    highFrequency: clients.filter(c => c.frequencyLevel === 'Alta').length,
    excellentSatisfaction: clients.filter(c => c.satisfactionLevel === 'Excelente').length,
    totalRevenue: clients.reduce((sum, c) => sum + c.totalSpent, 0)
  };

  const handleCreateClient = async () => {
    if (!canCreateClient) {
      toast.error('No tienes permiso para crear clientes');
      return;
    }

    const validationError = validateClientFormForCreate(toValidationInput(formData));
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const emailNormalized = normalizeClientEmail(formData.email);
    if (isDuplicateEmailInList(emailNormalized, clients)) {
      toast.error('Ya existe un cliente registrado con ese correo electrónico.');
      return;
    }

    try {
      setIsLoading(true);
      const nameParts = formData.name.trim().split(/\s+/);
      const nombre = nameParts[0] || formData.name.trim();
      const apellido = nameParts.slice(1).join(' ').trim();

      await authAPI.register({
        correo: emailNormalized,
        contrasena: formData.password,
        nombre,
        apellido,
        telefono: formData.phone.trim(),
        tipo_documento: formData.documentType.trim(),
        numero_documento: formData.documentNumber.trim(),
      });

      toast.success(
        'Cliente creado correctamente. Se registró su usuario de acceso con la contraseña indicada.',
      );
      setIsCreateModalOpen(false);
      setFormData({ ...EMPTY_CLIENT_FORM });
      await cargarClientes();
    } catch (error: unknown) {
      console.error('Error al crear cliente:', error);
      if (isRegisterEmailConflictError(error)) {
        toast.error('Ese correo ya está registrado como usuario. Usa otro correo o edita el usuario existente.');
        return;
      }
      const message =
        error instanceof Error ? error.message : 'No se pudo crear el cliente en el servidor';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Editar cliente
  const handleEditClient = (client: any) => {
    if (!canEditClient) {
      toast.error('No tienes permiso para editar clientes');
      return;
    }

    setSelectedClient(client);
    setFormData({
      ...EMPTY_CLIENT_FORM,
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      documentType: client.documentType || '',
      documentNumber: client.documentNumber || '',
      birthDate: String(client.birthDate || '').slice(0, 10),
      preferences: client.preferences || '',
      location: client.location || client.address || '',
      notes: client.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateClient = async () => {
    if (!canEditClient) {
      toast.error('No tienes permiso para editar clientes');
      return;
    }

    const validationError = validateClientFormForEdit(toValidationInput(formData));
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const emailNormalized = normalizeClientEmail(formData.email);
    if (isDuplicateEmailInList(emailNormalized, clients, selectedClient?.id)) {
      toast.error('Ya existe otro cliente registrado con ese correo electrónico.');
      return;
    }

    try {
      setIsLoading(true);
      const nameParts = formData.name.trim().split(/\s+/);
      const nombre = nameParts[0] || formData.name.trim();
      const apellido = nameParts.slice(1).join(' ').trim();

      await clientesAPI.update(parseInt(selectedClient.id, 10), {
        nombre,
        apellido,
        correo: emailNormalized,
        telefono: formData.phone.trim(),
        direccion: formData.location.trim() || undefined,
        tipo_documento: formData.documentType.trim() || undefined,
        numero_documento: formData.documentNumber.trim() || undefined,
        fecha_nacimiento: formData.birthDate.trim() || undefined,
      });

      toast.success('Cliente actualizado correctamente');
      setIsEditModalOpen(false);
      setSelectedClient(null);
      setFormData({ ...EMPTY_CLIENT_FORM });
      
      // Recargar clientes del servidor
      await cargarClientes();
      
    } catch (error: any) {
      console.error('❌ Error al actualizar cliente:', error);
      toast.error(error.message || 'Error al actualizar el cliente. Verifica que el backend esté corriendo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar cliente
  const handleDeleteClient = (client: any) => {
    if (!canDeleteClient) {
      toast.error('No tienes permiso para eliminar clientes');
      return;
    }

    setSelectedClient(client);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteClient = async () => {
    if (!canDeleteClient) {
      toast.error('No tienes permiso para eliminar clientes');
      return;
    }

    if (!selectedClient?.id) return;

    if (deleteReservasCheck?.loading) {
      toast.error('Espere mientras se verifican las reservas del cliente');
      return;
    }

    if (deleteReservasCheck?.error) {
      toast.error('No se pudo verificar las reservas. Intente de nuevo.');
      return;
    }

    try {
      setIsLoading(true);

      const reservas = await reservasAPI.getByCliente(Number(selectedClient.id));
      const activas = getActiveReservas(reservas);

      if (activas.length > 0) {
        const ids = activas
          .slice(0, 3)
          .map((r) => `#${getReservaId(r)}`)
          .join(', ');
        const extra =
          activas.length > 3 ? ` y ${activas.length - 3} más` : '';
        toast.error(
          `No se puede eliminar: tiene ${activas.length} reserva(s) activa(s) (${ids}${extra}). Cancele o finalice las reservas primero.`,
        );
        setDeleteReservasCheck({ loading: false, activeReservas: activas, error: false });
        return;
      }

      await clientesAPI.delete(parseInt(selectedClient.id));
      
      setClients(clients.filter(c => c.id !== selectedClient.id));
      toast.success('Cliente eliminado correctamente');
      setIsDeleteModalOpen(false);
      setSelectedClient(null);
    } catch (error: any) {
      console.error('Error al eliminar cliente:', error);
      toast.error(error.message || 'Error al eliminar el cliente');
    } finally {
      setIsLoading(false);
    }
  };

  // Cambiar estado del cliente
  const handleToggleClientStatus = (clientId: string, currentStatus: boolean) => {
    // Aquí puedes implementar la lógica de estado activo/inactivo
    toast.success(currentStatus ? 'Cliente desactivado' : 'Cliente activado');
  };

  const handleViewClientDetails = (client: any) => {
    setSelectedClient(client);
    setHistorySearchTerm('');
    setHistoryPage(1);
    setIsHistoryModalOpen(true);
  };

  if (!permisos.loadingRoles && !canViewClients) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Acceso denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">No tienes permiso para ver clientes.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-green-800">Gestión de Clientes</h2>
          <p className="text-gray-600">Administra tu base de clientes</p>
        </div>
        {canCreateClient && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        )}
      </motion.div>

      {/* Filtros y Búsqueda */}
      <Card className="border-green-200">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-green-800">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Buscar y filtrar clientes</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="md:col-span-2 xl:col-span-3">
              <Label>Buscar Cliente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Nombre, email, teléfono, documento, dirección..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de documento</Label>
              <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="CC">CC</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="TI">TI</SelectItem>
                  <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                  <SelectItem value="PEP">PEP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Newsletter</Label>
              <Select
                value={newsletterFilter}
                onValueChange={(v) => setNewsletterFilter(v as 'all' | 'yes' | 'no')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Suscritos</SelectItem>
                  <SelectItem value="no">No suscritos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ordenar por</Label>
              <Select
                value={sortField}
                onValueChange={(value) => {
                  setSortField(value as ClientSortField);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Campo de orden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre</SelectItem>
                  <SelectItem value="fechaRegistro">Fecha de registro</SelectItem>
                  <SelectItem value="id">ID</SelectItem>
                  <SelectItem value="email">Correo</SelectItem>
                  <SelectItem value="phone">Teléfono</SelectItem>
                  <SelectItem value="documentNumber">Documento</SelectItem>
                  <SelectItem value="address">Dirección</SelectItem>
                  <SelectItem value="lastVisit">Último acceso</SelectItem>
                  <SelectItem value="estado">Estado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Orden</Label>
              <Select
                value={sortDirection}
                onValueChange={(value) => {
                  setSortDirection(value as SortDirection);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Dirección" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascendente (A→Z / más antiguo)</SelectItem>
                  <SelectItem value="desc">Descendente (Z→A / más reciente)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-50"
                onClick={clearFilters}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de Clientes */}
      <Card className="border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-green-800">
                    Clientes ({filteredClients.length})
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                      disabled={sortedClients.length === 0}
                      onClick={() => handleExportClients('csv')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                      disabled={sortedClients.length === 0}
                      onClick={() => handleExportClients('xlsx')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {filteredClients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <Search className="mb-3 h-10 w-10 text-gray-300" />
                    <p className="font-medium text-gray-800">
                      {hasActiveFilters
                        ? searchTerm.trim()
                          ? `No se encontraron clientes para "${searchTerm.trim()}"`
                          : 'No hay clientes que coincidan con los filtros seleccionados'
                        : clients.length === 0
                          ? 'Aún no hay clientes registrados'
                          : 'No hay clientes que coincidan con los criterios de búsqueda'}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm.trim()
                        ? 'Prueba con otro nombre, correo, teléfono, documento o dirección.'
                        : clients.length === 0
                          ? 'Puedes registrar el primer cliente con el botón "Nuevo Cliente".'
                          : 'Ajusta los filtros e intenta de nuevo.'}
                    </p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        className="mt-4 border-green-300 text-green-700 hover:bg-green-50"
                        onClick={clearFilters}
                      >
                        Limpiar filtros
                      </Button>
                    )}
                  </div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">#{client.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-xs text-gray-600">{client.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{client.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {client.documentNumber || 'N/A'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">
                          {client.address || client.location}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={client.isActive}
                            onCheckedChange={(checked) => {
                              setClients(clients.map(c => 
                                c.id === client.id ? { ...c, isActive: checked } : c
                              ));
                              toast.success(checked ? 'Cliente activado' : 'Cliente desactivado');
                            }}
                            disabled={!canEditClient}
                            className="data-[state=checked]:bg-green-600"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              title="Ver detalles"
                              onClick={() => handleViewClientDetails(client)}
                              className="border-green-600 text-green-600 hover:bg-green-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canEditClient && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditClient(client)}
                                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {canDeleteClient && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteClient(client)}
                                className="border-red-600 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
                {/* Paginación Mejorada */}
                {filteredClients.length > 0 && totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-between mt-6 px-4"
                  >
                    <div className="text-sm text-gray-600">
                      Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredClients.length)} de {filteredClients.length} registros
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="border-green-300 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Anterior
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNumber}
                              variant={currentPage === pageNumber ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNumber)}
                              className={currentPage === pageNumber 
                                ? "bg-green-600 hover:bg-green-700" 
                                : "border-green-300 hover:bg-green-50"
                              }
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="border-green-300 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

      {/* Modal Crear Cliente */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className={FORM_MODAL_CLASS} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle className="text-green-800">Registrar Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Se crea la ficha de cliente y su usuario de acceso (correo y contraseña) para
              que pueda iniciar sesión y reservar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez"
                  maxLength={120}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@email.com"
                  maxLength={254}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+57 300 000 0000"
                  maxLength={20}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: sanitizePhoneInput(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="createDocumentType">Tipo de Documento *</Label>
                <Select
                  value={formData.documentType || '__empty__'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      documentType: value === '__empty__' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger className="w-full" id="createDocumentType">
                    <SelectValue placeholder="Selecciona tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">Selecciona…</SelectItem>
                    <SelectItem value="CC">CC</SelectItem>
                    <SelectItem value="CE">CE</SelectItem>
                    <SelectItem value="TI">TI</SelectItem>
                    <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                    <SelectItem value="PEP">PEP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="createDocumentNumber">Número de Documento *</Label>
                <Input
                  id="createDocumentNumber"
                  placeholder="Ej: 1098765432"
                  maxLength={20}
                  value={formData.documentNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      documentNumber: sanitizeDocumentInput(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="createBirthDate">Fecha de Nacimiento</Label>
                <Input
                  id="createBirthDate"
                  type="date"
                  max={MAX_BIRTH_DATE}
                  min="1900-01-01"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="location">Ubicación / Dirección</Label>
                <Input
                  id="location"
                  placeholder="Ciudad o dirección"
                  maxLength={200}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="password">Contraseña de acceso *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Contraseña segura"
                    maxLength={64}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repite la contraseña"
                    maxLength={64}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                  />
                </div>
                {formData.password.length > 0 && (
                  <ul className="rounded-md border border-green-100 bg-green-50/60 p-3 space-y-1">
                    {passwordRequirementChecks.map((req) => (
                      <li
                        key={req.id}
                        className={`text-xs ${req.met ? 'text-green-700' : 'text-gray-600'}`}
                      >
                        {req.met ? '✓' : '○'} {req.label}
                      </li>
                    ))}
                  </ul>
                )}
                {formData.confirmPassword.length > 0 && (
                  <p
                    className={`text-xs ${
                      createPasswordsMatch ? 'text-green-700' : 'text-red-600'
                    }`}
                  >
                    {createPasswordsMatch
                      ? '✓ Las contraseñas coinciden'
                      : '○ La confirmación no coincide'}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="preferences">Preferencias</Label>
              <Input
                id="preferences"
                placeholder="Ej: Rural, Gastronómica, Aventura"
                maxLength={500}
                value={formData.preferences}
                onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Información adicional sobre el cliente..."
                maxLength={1000}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateClient}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Registrando...' : 'Registrar Cliente'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Cliente */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className={FORM_MODAL_CLASS} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle className="text-green-800">Editar Cliente</DialogTitle>
            <DialogDescription>
              Complete el formulario para actualizar la información del cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Teléfono *</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  placeholder="+57 300 000 0000"
                  maxLength={20}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: sanitizePhoneInput(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-documentType">Tipo de Documento</Label>
                <Select
                  value={formData.documentType || '__empty__'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      documentType: value === '__empty__' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger className="w-full" id="edit-documentType">
                    <SelectValue placeholder="Tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">Sin especificar</SelectItem>
                    <SelectItem value="CC">CC</SelectItem>
                    <SelectItem value="CE">CE</SelectItem>
                    <SelectItem value="TI">TI</SelectItem>
                    <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                    <SelectItem value="PEP">PEP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-documentNumber">Número de Documento</Label>
                <Input
                  id="edit-documentNumber"
                  maxLength={20}
                  value={formData.documentNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      documentNumber: sanitizeDocumentInput(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-birthDate">Fecha de Nacimiento</Label>
                <Input
                  id="edit-birthDate"
                  type="date"
                  max={MAX_BIRTH_DATE}
                  min="1900-01-01"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-location">Ubicación / Dirección</Label>
                <Input
                  id="edit-location"
                  placeholder="Ciudad o dirección"
                  maxLength={200}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-preferences">Preferencias</Label>
              <Input
                id="edit-preferences"
                placeholder="Ej: Rural, Gastronómica, Aventura"
                maxLength={500}
                value={formData.preferences}
                onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                placeholder="Información adicional sobre el cliente..."
                maxLength={1000}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateClient}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Guardando...' : 'Actualizar Cliente'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar Cliente */}
      <Dialog
        open={isDeleteModalOpen}
        onOpenChange={(open) => {
          setIsDeleteModalOpen(open);
          if (!open) setDeleteReservasCheck(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-800">Eliminar Cliente</DialogTitle>
            <DialogDescription>
              {deleteReservasCheck?.loading
                ? 'Verificando reservas activas del cliente...'
                : deleteReservasCheck && deleteReservasCheck.activeReservas.length > 0
                  ? 'Este cliente no puede eliminarse mientras tenga reservas activas.'
                  : '¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deleteReservasCheck?.loading && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Consultando reservas en el sistema...
              </div>
            )}

            {deleteReservasCheck?.error && !deleteReservasCheck.loading && (
              <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  No se pudieron verificar las reservas. No es posible eliminar hasta confirmar
                  que no hay reservas activas.
                </p>
              </div>
            )}

            {deleteReservasCheck &&
              !deleteReservasCheck.loading &&
              deleteReservasCheck.activeReservas.length > 0 && (
                <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="space-y-2">
                    <p className="font-medium">
                      {deleteReservasCheck.activeReservas.length} reserva(s) activa(s) — eliminación
                      bloqueada
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-red-700">
                      {deleteReservasCheck.activeReservas.slice(0, 5).map((reserva) => (
                        <li key={getReservaId(reserva)}>
                          Reserva #{getReservaId(reserva)}
                          {reserva.tipo_servicio ? ` · ${reserva.tipo_servicio}` : ''} —{' '}
                          {reserva.estado || 'Pendiente'}
                          {reserva.fecha_reserva
                            ? ` (${formatDate(reserva.fecha_reserva)})`
                            : ''}
                        </li>
                      ))}
                    </ul>
                    {deleteReservasCheck.activeReservas.length > 5 && (
                      <p className="text-xs text-red-600">
                        y {deleteReservasCheck.activeReservas.length - 5} reserva(s) más...
                      </p>
                    )}
                    <p className="text-xs text-red-600">
                      Cancele o complete las reservas en el módulo de Reservas antes de eliminar
                      al cliente.
                    </p>
                  </div>
                </div>
              )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez"
                  value={selectedClient?.name}
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@email.com"
                  value={selectedClient?.email}
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="+57 300 000 0000"
                  value={selectedClient?.phone}
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Ciudad"
                  value={selectedClient?.location}
                  readOnly
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmDeleteClient}
                className="bg-red-600 hover:bg-red-700"
                disabled={
                  isLoading ||
                  deleteReservasCheck?.loading === true ||
                  deleteReservasCheck?.error === true ||
                  (deleteReservasCheck?.activeReservas.length ?? 0) > 0
                }
              >
                Eliminar Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Ver detalles del cliente */}
      <Dialog
        open={isHistoryModalOpen}
        onOpenChange={(open) => {
          setIsHistoryModalOpen(open);
          if (!open) {
            setHistorySearchTerm('');
            setHistoryPage(1);
          }
        }}
      >
        <DialogContent
          className={DETAIL_MODAL_CLASS}
          style={{ maxHeight: '90vh', overflowY: 'auto' }}
        >
          <DialogHeader>
            <DialogTitle className="text-green-800">Detalle del cliente</DialogTitle>
            <DialogDescription>
              Ficha completa, estadísticas reales y historial de reservas
            </DialogDescription>
          </DialogHeader>
          {selectedClient &&
            (() => {
              const stats = clientReservasStats;
              const totalBookings = stats?.totalBookings ?? selectedClient.totalBookings ?? 0;
              const totalSpent = stats?.totalSpent ?? selectedClient.totalSpent ?? 0;
              const totalReservado = stats?.totalReservado ?? 0;
              const frequencyLevel = stats?.frequencyLevel ?? selectedClient.frequencyLevel;

              return (
                <div className="space-y-6">
                  <div className="rounded-xl border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold text-green-800">{selectedClient.name}</h4>
                        <p className="text-sm text-green-700">Cliente #{selectedClient.id}</p>
                      </div>
                      <Badge className={selectedClient.isActive ? 'bg-green-600' : 'bg-gray-500'}>
                        {selectedClient.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card className="border-green-100">
                      <CardContent className="space-y-2 pt-5">
                        <h5 className="font-medium text-green-800">Identificación</h5>
                        <p className="text-sm">
                          <span className="text-gray-500">Nombre:</span>{' '}
                          {selectedClient.firstName || selectedClient.name || 'No registrado'}
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Apellido:</span>{' '}
                          {selectedClient.lastName || 'No registrado'}
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Tipo documento:</span>{' '}
                          {selectedClient.documentType || 'No registrado'}
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Nro documento:</span>{' '}
                          {selectedClient.documentNumber || 'No registrado'}
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Fecha nacimiento:</span>{' '}
                          {formatDate(selectedClient.birthDate)}
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Género:</span>{' '}
                          {selectedClient.gender || 'No registrado'}
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Nacionalidad:</span>{' '}
                          {selectedClient.nationality || 'No registrado'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-100">
                      <CardContent className="space-y-2 pt-5">
                        <h5 className="font-medium text-blue-800">Contacto y ubicación</h5>
                        <p className="text-sm">
                          <span className="text-gray-500">Correo:</span>{' '}
                          {selectedClient.email || 'No registrado'}
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Teléfono:</span>{' '}
                          {selectedClient.phone || 'No registrado'}
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Dirección:</span>{' '}
                          {selectedClient.address || selectedClient.location || 'No registrado'}
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Ciudad:</span>{' '}
                          {selectedClient.city || 'No registrado'}
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">País:</span>{' '}
                          {selectedClient.country || 'No registrado'}
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Código postal:</span>{' '}
                          {selectedClient.postalCode || 'No registrado'}
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Newsletter:</span>{' '}
                          {selectedClient.newsletter ? 'Sí' : 'No'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-4">
                    <h4 className="mb-3 font-medium text-blue-800">Comportamiento y preferencias</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm text-gray-600">Tipo de experiencia</p>
                        <Badge variant="outline" className="mt-1 capitalize">
                          {selectedClient.experienceType || 'No definido'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Frecuencia de visitas</p>
                        <Badge
                          variant={frequencyLevel === 'Alta' ? 'default' : 'secondary'}
                          className={`mt-1 ${
                            frequencyLevel === 'Alta'
                              ? 'bg-green-500'
                              : frequencyLevel === 'Media'
                                ? 'bg-yellow-500'
                                : 'bg-gray-400'
                          }`}
                        >
                          {frequencyLevel}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total pagado</p>
                        <p className="text-lg font-medium text-green-600">
                          {clientReservasLoading ? '...' : formatCurrency(totalSpent)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="mb-1 text-sm text-gray-600">Preferencias</p>
                        <p className="rounded bg-white/70 p-2 text-sm text-gray-700">
                          {selectedClient.preferences || 'No registradas'}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-sm text-gray-600">Notas</p>
                        <p className="rounded bg-white/70 p-2 text-sm text-gray-700">
                          {selectedClient.notes || 'Sin notas'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card className="border-green-200">
                      <CardContent className="pt-6 text-center">
                        <Calendar className="mx-auto mb-2 h-8 w-8 text-green-600" />
                        <p className="text-2xl font-bold text-green-700">
                          {clientReservasLoading ? '...' : totalBookings}
                        </p>
                        <p className="text-sm text-gray-600">Reservas</p>
                        {!clientReservasLoading && stats && stats.cancelledBookings > 0 && (
                          <p className="mt-1 text-xs text-gray-500">
                            {stats.activeBookings} activas · {stats.cancelledBookings} canceladas
                          </p>
                        )}
                      </CardContent>
                    </Card>
                    <Card className="border-green-200">
                      <CardContent className="pt-6 text-center">
                        <Award className="mx-auto mb-2 h-8 w-8 text-green-600" />
                        <p className="text-2xl font-bold text-green-700">
                          {clientReservasLoading ? '...' : formatSpentCompact(totalSpent)}
                        </p>
                        <p className="text-sm text-gray-600">Total pagado</p>
                      </CardContent>
                    </Card>
                    <Card className="border-green-200">
                      <CardContent className="pt-6 text-center">
                        <TrendingUp className="mx-auto mb-2 h-8 w-8 text-green-600" />
                        <p className="text-2xl font-bold text-green-700">
                          {clientReservasLoading ? '...' : formatSpentCompact(totalReservado)}
                        </p>
                        <p className="text-sm text-gray-600">Total reservado</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="mb-3 font-medium text-gray-800">Trazabilidad del registro</h4>
                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                      <p>
                        <span className="text-gray-500">ID cliente:</span>{' '}
                        {selectedClient.id || 'No registrado'}
                      </p>
                      <p>
                        <span className="text-gray-500">ID usuario:</span>{' '}
                        {selectedClient.idUsuario || 'No registrado'}
                      </p>
                      <p>
                        <span className="text-gray-500">ID rol:</span>{' '}
                        {selectedClient.idRole || 'No registrado'}
                      </p>
                      <p>
                        <span className="text-gray-500">Estado:</span>{' '}
                        {selectedClient.isActive ? 'Activo' : 'Inactivo'}
                      </p>
                      <p>
                        <span className="text-gray-500">Último acceso:</span>{' '}
                        {formatDate(selectedClient.lastVisit)}
                      </p>
                      <p>
                        <span className="text-gray-500">Fecha registro:</span>{' '}
                        {formatDate(selectedClient.fechaRegistro || selectedClient.joinDate)}
                      </p>
                      <p>
                        <span className="text-gray-500">Fecha actualización:</span>{' '}
                        {formatDate(selectedClient.fechaActualizacion || selectedClient.updatedAt)}
                      </p>
                      <p>
                        <span className="text-gray-500">Creado en:</span>{' '}
                        {formatDate(selectedClient.createdAt)}
                      </p>
                    </div>
                  </div>

                  {(clientReservasLoading || clientReservas.length > 0) && (
                    <div className="rounded-lg border border-green-100 p-4">
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h4 className="font-medium text-green-800">
                          Historial de reservas
                          {!clientReservasLoading && (
                            <span className="ml-2 text-sm font-normal text-gray-500">
                              ({clientReservas.length} en total)
                            </span>
                          )}
                        </h4>
                        {!clientReservasLoading && clientReservas.length > 0 && (
                          <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              placeholder="Buscar por ID, tipo, estado, fecha, monto..."
                              value={historySearchTerm}
                              onChange={(e) => setHistorySearchTerm(e.target.value)}
                              className="h-9 pl-9 text-sm"
                            />
                          </div>
                        )}
                      </div>

                      {clientReservasLoading ? (
                        <p className="py-6 text-center text-sm text-gray-500">
                          Cargando historial de reservas...
                        </p>
                      ) : filteredHistoryReservas.length === 0 ? (
                        <div className="flex flex-col items-center py-6 text-center">
                          <Search className="mb-2 h-8 w-8 text-gray-300" />
                          <p className="text-sm font-medium text-gray-700">
                            {historySearchTerm.trim()
                              ? `No hay reservas que coincidan con "${historySearchTerm.trim()}"`
                              : 'Sin reservas en el historial'}
                          </p>
                          {historySearchTerm.trim() && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3 border-green-300 text-green-700"
                              onClick={() => setHistorySearchTerm('')}
                            >
                              Limpiar búsqueda
                            </Button>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                            {paginatedHistoryReservas.map((reserva) => {
                              const reservaId = getReservaId(reserva);
                              return (
                                <div
                                  key={String(reservaId)}
                                  className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-green-50/60 px-3 py-2 text-sm"
                                >
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      Reserva #{reservaId}
                                      {reserva.tipo_servicio ? ` · ${reserva.tipo_servicio}` : ''}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {formatDate(reserva.fecha_reserva)} ·{' '}
                                      {reserva.numero_participantes ?? 1} participante(s)
                                      {reserva.estado_pago ? ` · Pago: ${reserva.estado_pago}` : ''}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <Badge
                                      variant="outline"
                                      className={
                                        isCancelledReserva(reserva.estado)
                                          ? 'border-red-200 text-red-700'
                                          : 'border-green-200 text-green-700'
                                      }
                                    >
                                      {reserva.estado || 'Pendiente'}
                                    </Badge>
                                    <p className="mt-1 text-xs text-gray-600">
                                      {formatCurrency(reservaMontoTotal(reserva))}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-3 flex flex-col gap-2 border-t border-green-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-gray-500">
                              {historySearchTerm.trim()
                                ? `${filteredHistoryReservas.length} resultado(s) de ${clientReservas.length} reservas`
                                : `Mostrando ${(historyPage - 1) * CLIENT_HISTORY_ITEMS_PER_PAGE + 1}–${Math.min(historyPage * CLIENT_HISTORY_ITEMS_PER_PAGE, filteredHistoryReservas.length)} de ${filteredHistoryReservas.length}`}
                            </p>
                            {historyTotalPages > 1 && (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 border-green-300 text-green-700"
                                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                                  disabled={historyPage <= 1}
                                >
                                  <ChevronLeft className="mr-1 h-4 w-4" />
                                  Anterior
                                </Button>
                                <span className="min-w-[4.5rem] text-center text-xs text-gray-600">
                                  {historyPage} / {historyTotalPages}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 border-green-300 text-green-700"
                                  onClick={() =>
                                    setHistoryPage((p) => Math.min(historyTotalPages, p + 1))
                                  }
                                  disabled={historyPage >= historyTotalPages}
                                >
                                  Siguiente
                                  <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {!clientReservasLoading && clientReservas.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                      Este cliente aún no tiene reservas registradas.
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 border-t pt-4">
                    <Button
                      onClick={() => setIsHistoryModalOpen(false)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}