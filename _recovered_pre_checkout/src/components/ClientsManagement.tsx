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
import { clientesAPI } from '../services/api';
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
        name: `${c.nombre} ${c.apellido}`,
        documentNumber: c.numero_documento || '',
        email: c.correo || '',
        phone: c.telefono || '',
        address: c.direccion || '',
        preferences: '',
        experienceType: 'rural',
        frequencyLevel: 'Media',
        satisfactionLevel: 'Buena',
        totalBookings: 0,
        totalSpent: 0,
        lastVisit: c.ultimo_acceso || new Date().toISOString().split('T')[0],
        joinDate: c.fecha_registro || new Date().toISOString().split('T')[0],
        location: '',
        favoriteRoutes: [],
        notes: '',
        isActive: c.estado !== false
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

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferences: '',
    location: '',
    notes: '',
    password: '',
    confirmPassword: ''
  });

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

  // Crear cliente
  const handleCreateClient = () => {
    if (!canCreateClient) {
      toast.error('No tienes permiso para crear clientes');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }
    
    const newClient = {
      id: (clients.length + 1).toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      preferences: formData.preferences,
      experienceType: 'rural',
      frequencyLevel: 'Baja',
      satisfactionLevel: 'Buena',
      totalBookings: 0,
      totalSpent: 0,
      lastVisit: new Date().toISOString().split('T')[0],
      joinDate: new Date().toISOString().split('T')[0],
      location: formData.location,
      favoriteRoutes: [],
      notes: formData.notes,
      isActive: true
    };
    
    setClients([...clients, newClient]);
    toast.success('Cliente registrado correctamente');
    setIsCreateModalOpen(false);
    setFormData({ name: '', email: '', phone: '', preferences: '', location: '', notes: '', password: '', confirmPassword: '' });
  };

  // Editar cliente
  const handleEditClient = (client: any) => {
    if (!canEditClient) {
      toast.error('No tienes permiso para editar clientes');
      return;
    }

    setSelectedClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      preferences: client.preferences,
      location: client.location,
      notes: client.notes,
      password: '',
      confirmPassword: ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateClient = async () => {
    if (!canEditClient) {
      toast.error('No tienes permiso para editar clientes');
      return;
    }

    const validationError = validateClientFormForEdit(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const emailNormalized = normalizeClientEmail(formData.email);
    if (
      isDuplicateEmailInList(emailNormalized, clients, selectedClient?.id)
    ) {
      toast.error('Ya existe otro cliente registrado con ese correo electrónico.');
      return;
    }
    
    try {
      setIsLoading(true);
      const [nombre, ...apellidoParts] = formData.name.split(' ');
      const apellido = apellidoParts.join(' ') || '';

      console.log('🔄 Actualizando cliente:', {
        id: selectedClient.id,
        nombre,
        apellido,
        telefono: formData.phone,
        direccion: formData.location
      });

      const resultado = await clientesAPI.update(parseInt(selectedClient.id), {
        nombre,
        apellido,
        telefono: formData.phone,
        direccion: formData.location
      });
      
      console.log('✅ Cliente actualizado:', resultado);
      
      toast.success('Cliente actualizado correctamente');
      setIsEditModalOpen(false);
      setSelectedClient(null);
      setFormData({ name: '', email: '', phone: '', preferences: '', location: '', notes: '', password: '', confirmPassword: '' });
      
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

  // Ver historial
  const handleViewHistory = (client: any) => {
    setSelectedClient(client);
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
                              onClick={() => handleViewHistory(client)}
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
              Complete el formulario para agregar un nuevo cliente
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
                <Label htmlFor="editDocumentType">Tipo de Documento</Label>
                <Select
                  value={formData.documentType || '__empty__'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      documentType: value === '__empty__' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
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
                <Label htmlFor="editDocumentNumber">Número de Documento</Label>
                <Input
                  id="editDocumentNumber"
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
                <Label htmlFor="editBirthDate">Fecha de Nacimiento</Label>
                <Input
                  id="editBirthDate"
                  type="date"
                  max={MAX_BIRTH_DATE}
                  min="1900-01-01"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Ciudad"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Contraseña segura"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite la contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
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
                className="bg-green-600 hover:bg-green-700"
              >
                Registrar Cliente
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
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  placeholder="+57 300 000 0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Ciudad"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="preferences">Preferencias</Label>
              <Input
                id="preferences"
                placeholder="Ej: Rural, Gastronómica, Aventura"
                value={formData.preferences}
                onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Información adicional sobre el cliente..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateClient}
                className="bg-green-600 hover:bg-green-700"
              >
                Actualizar Cliente
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

      {/* Modal Historial de Cliente */}
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Historial Completo del Cliente</DialogTitle>
            <DialogDescription>
              Información detallada y registro de actividades
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              {/* Información del cliente */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3">Información Personal</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-medium">{selectedClient.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedClient.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium">{selectedClient.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Documento</p>
                    <p className="font-medium">{selectedClient.documentNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Dirección</p>
                    <p className="font-medium">{selectedClient.address || selectedClient.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ubicación</p>
                    <p className="font-medium">{selectedClient.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cliente desde</p>
                    <p className="font-medium">{selectedClient.joinDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Última visita</p>
                    <p className="font-medium">{selectedClient.lastVisit}</p>
                  </div>
                </div>
              </div>

              {/* Información de Comportamiento */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Información de Comportamiento</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tipo de Experiencia</p>
                    <Badge variant="outline" className="capitalize mt-1">
                      {selectedClient.experienceType}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Frecuencia de Visitas</p>
                    <Badge
                      variant={selectedClient.frequencyLevel === 'Alta' ? 'default' : 'secondary'}
                      className={`mt-1 ${
                        selectedClient.frequencyLevel === 'Alta'
                          ? 'bg-green-500'
                          : selectedClient.frequencyLevel === 'Media'
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                      }`}
                    >
                      {selectedClient.frequencyLevel}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Gastado</p>
                    <p className="font-medium text-green-600 text-lg">${selectedClient.totalSpent.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-green-200">
                  <CardContent className="pt-6 text-center">
                    <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">{selectedClient.totalBookings}</p>
                    <p className="text-sm text-gray-600">Reservas</p>
                  </CardContent>
                </Card>
                <Card className="border-green-200">
                  <CardContent className="pt-6 text-center">
                    <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">${(selectedClient.totalSpent / 1000).toFixed(0)}K</p>
                    <p className="text-sm text-gray-600">Total Gastado</p>
                  </CardContent>
                </Card>
                <Card className="border-green-200">
                  <CardContent className="pt-6 text-center">
                    <Heart className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">{selectedClient.satisfactionLevel}</p>
                    <p className="text-sm text-gray-600">Satisfacción</p>
                  </CardContent>
                </Card>
              </div>

              {/* Rutas favoritas */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Rutas Favoritas</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedClient.favoriteRoutes.map((route: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-green-50 border-green-300">
                      <MapPin className="w-3 h-3 mr-1" />
                      {route}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Preferencias */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Preferencias</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedClient.preferences}</p>
              </div>

              {/* Notas */}
              {selectedClient.notes && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Notas</h4>
                  <p className="text-gray-600 bg-yellow-50 p-3 rounded-lg">{selectedClient.notes}</p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}