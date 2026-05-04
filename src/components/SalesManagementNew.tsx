import React, { useEffect, useState } from 'react';
import { 
  Plus,
  Search,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Printer,
  AlertTriangle,
  Mountain,
  Home,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';
import { clientesAPI, fincasAPI, pagosAPI, reservasAPI, rutasAPI, serviciosAPI, ventasAPI, type PagoCliente, type Reserva, type Venta } from '../services/api';
import { ReceiptProofViewerDialog } from './ReceiptProofViewerDialog';

// ===========================
// INTERFACES Y TIPOS
// ===========================

interface Client {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
}

interface Route {
  id: string;
  name: string;
  distance: string;
  difficulty: string;
  price: number;
}

interface Farm {
  id: string;
  name: string;
  capacity: number;
  location: string;
  price: number;
  includedServices: string[];
}

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
}

interface SalePayment {
  id: string;
  backendId: number;
  amount: number;
  date: string;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Verificado';
  paymentMethod: string;
  transactionNumber?: string;
  receiptUrl?: string;
  receiptName?: string;
  receiptType?: string;
  observations?: string;
  rejectionReason?: string;
}

interface Sale {
  id: string;
  backendId?: number;
  reservationId?: number;
  client: Client;
  saleType: string;
  amount: number;
  paidAmount?: number;
  pendingAmount?: number;
  date: string;
  status: 'Pagado' | 'Pendiente' | 'Parcial' | 'Anulado';
  mainService?: Route | Farm;
  additionalServices: Service[];
  paymentMethod: string;
  paymentHistory?: SalePayment[];
  cancellationDate?: string;
  cancellationReason?: string;
}

interface CancelledSale extends Sale {
  cancellationDate: string;
  cancellationReason: string;
}

type ViewMode = 'list' | 'create' | 'detail';

function normalizeSaleStatus(status?: string | null): Sale['status'] {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'pagado') return 'Pagado';
  if (normalized === 'parcial') return 'Parcial';
  if (normalized === 'cancelado') return 'Anulado';
  return 'Pendiente';
}

function formatBackendDate(value?: string | null): string {
  if (!value) return new Date().toISOString().split('T')[0];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10);
  return parsed.toISOString().split('T')[0];
}

function normalizePaymentStatus(status?: string | null): SalePayment['status'] {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'aprobado') return 'Aprobado';
  if (normalized === 'rechazado') return 'Rechazado';
  if (normalized === 'verificado') return 'Verificado';
  return 'Pendiente';
}

function mapPagoToSalePayment(pago: PagoCliente): SalePayment {
  return {
    id: `A-${String(pago.id_pago).padStart(3, '0')}`,
    backendId: Number(pago.id_pago),
    amount: Number(pago.monto || 0),
    date: formatBackendDate(pago.fecha_pago),
    status: normalizePaymentStatus(pago.estado),
    paymentMethod: String(pago.metodo_pago || 'Por definir'),
    transactionNumber: pago.numero_transaccion || undefined,
    receiptUrl:
      pago.comprobante_url ||
      (pago as { url_comprobante?: string | null }).url_comprobante ||
      (pago as { comprobante?: string | null }).comprobante ||
      undefined,
    receiptName: pago.comprobante_nombre || undefined,
    receiptType: pago.comprobante_tipo || undefined,
    observations: pago.observaciones || undefined,
    rejectionReason: pago.motivo_rechazo || undefined,
  };
}

function mapVentaToSale(venta: Venta, reserva?: Reserva | null): Sale {
  const programacion = reserva?.programaciones?.[0] as any;
  const finca = (reserva as any)?.fincas?.[0];
  const servicios = (reserva?.servicios || []).map((servicio: any, index: number) => ({
    id: String(servicio.id_servicio || servicio.id_detalle_reserva_servicio || index),
    name: String(servicio.servicio_nombre || `Servicio #${servicio.id_servicio || index + 1}`),
    price: Number(servicio.subtotal ?? servicio.precio_unitario ?? 0),
    category: 'Servicio',
    description: String(servicio.descripcion || `Cantidad: ${servicio.cantidad || 1}`),
  }));

  let saleType = 'Reserva';
  let mainService: Route | Farm | undefined;

  if (programacion) {
    saleType = servicios.length > 0 ? 'Ruta + Servicios' : 'Ruta';
    mainService = {
      id: String(programacion.id_programacion || programacion.id_ruta || ''),
      name: String(programacion.ruta_nombre || `Programación #${programacion.id_programacion}`),
      distance: programacion.fecha_salida ? `Salida ${formatBackendDate(programacion.fecha_salida)}` : 'Ruta programada',
      difficulty: String(programacion.dificultad || 'Por definir'),
      price: Number(programacion.subtotal ?? programacion.precio_unitario ?? venta.monto_total ?? 0),
    };
  } else if (finca) {
    saleType = servicios.length > 0 ? 'Finca + Servicios' : 'Finca';
    mainService = {
      id: String(finca.id_finca || ''),
      name: String(finca.finca_nombre || `Finca #${finca.id_finca}`),
      capacity: Number(finca.capacidad_personas || 0),
      location: String(finca.ubicacion || 'Por definir'),
      price: Number(finca.subtotal ?? venta.monto_total ?? 0),
      includedServices: [],
    };
  }

  return {
    id: `V-${String(venta.id_venta).padStart(3, '0')}`,
    backendId: Number(venta.id_venta),
    reservationId: Number(venta.id_reserva),
    client: {
      id: String(venta.id_cliente || venta.id_reserva || venta.id_venta),
      name: `${String(venta.cliente_nombre || '').trim()} ${String(venta.cliente_apellido || '').trim()}`.trim() || 'Cliente',
      document: String(venta.numero_documento || 'Documento no disponible'),
      phone: String(venta.cliente_telefono || '—'),
      email: String(venta.email || '—'),
    },
    saleType,
    amount: Number(venta.monto_total || 0),
    paidAmount: Number(venta.monto_pagado || 0),
    pendingAmount: Number(venta.saldo_pendiente || 0),
    date: formatBackendDate(venta.fecha_venta || venta.fecha_creacion),
    status: normalizeSaleStatus(venta.estado_pago),
    mainService,
    additionalServices: servicios,
    paymentMethod: String(venta.metodo_pago || 'Por definir'),
    paymentHistory: [],
  };
}

// ===========================
// DATOS MOCK
// ===========================

const mockClients: Client[] = [
  { id: '1', name: 'Carlos Méndez', document: '1234567890', phone: '3001234567', email: 'carlos@email.com' },
  { id: '2', name: 'Ana López', document: '0987654321', phone: '3009876543', email: 'ana@email.com' },
  { id: '3', name: 'Miguel Torres', document: '1122334455', phone: '3001122334', email: 'miguel@email.com' },
  { id: '4', name: 'Laura Ramírez', document: '2233445566', phone: '3102233445', email: 'laura@email.com' },
  { id: '5', name: 'Diego Vargas', document: '3344556677', phone: '3153344556', email: 'diego@email.com' },
  { id: '6', name: 'Patricia Gómez', document: '4455667788', phone: '3204455667', email: 'patricia@email.com' },
  { id: '7', name: 'Roberto Castro', document: '5566778899', phone: '3005566778', email: 'roberto@email.com' },
  { id: '8', name: 'Sandra Morales', document: '6677889900', phone: '3106677889', email: 'sandra@email.com' },
];

const mockRoutes: Route[] = [
  { id: '1', name: 'Cascada El Paraíso', distance: '12 km', difficulty: 'Moderada', price: 85000 },
  { id: '2', name: 'Montaña Verde', distance: '8 km', difficulty: 'Fácil', price: 65000 },
  { id: '3', name: 'Sendero del Cóndor', distance: '15 km', difficulty: 'Difícil', price: 120000 },
];

const mockFarms: Farm[] = [
  { 
    id: '1', 
    name: 'Finca Villa María', 
    capacity: 50, 
    location: 'Quindío', 
    price: 450000,
    includedServices: ['Piscina', 'Zona BBQ', 'Parqueadero']
  },
  { 
    id: '2', 
    name: 'Finca El Descanso', 
    capacity: 30, 
    location: 'Risaralda', 
    price: 350000,
    includedServices: ['Zona de juegos', 'Cocina']
  },
  { 
    id: '3', 
    name: 'Finca Bella Vista', 
    capacity: 80, 
    location: 'Caldas', 
    price: 600000,
    includedServices: ['Piscina', 'Jacuzzi', 'Salón de eventos']
  },
];

const mockServices: Service[] = [
  { id: '1', name: 'Mariachi', price: 250000, category: 'Entretenimiento', description: 'Grupo musical mariachi, 2 horas' },
  { id: '2', name: 'Decoración con flores', price: 180000, category: 'Decoración', description: 'Arreglos florales para evento' },
  { id: '3', name: 'Fotografía profesional', price: 320000, category: 'Fotografía', description: 'Sesión completa con álbum digital' },
  { id: '4', name: 'Lunch gourmet', price: 45000, category: 'Alimentación', description: 'Por persona, incluye bebida' },
  { id: '5', name: 'Transporte adicional', price: 120000, category: 'Transporte', description: 'Bus turístico 40 pasajeros' },
];

const mockSales: Sale[] = [
  {
    id: 'V-001',
    client: mockClients[0],
    saleType: 'Ruta',
    amount: 85000,
    date: '2024-11-15',
    status: 'Pagado',
    mainService: mockRoutes[0],
    additionalServices: [],
    paymentMethod: 'Transferencia'
  },
  {
    id: 'V-002',
    client: mockClients[1],
    saleType: 'Finca + Servicios',
    amount: 1180000,
    date: '2024-11-18',
    status: 'Pendiente',
    mainService: mockFarms[1],
    additionalServices: [mockServices[0], mockServices[1]],
    paymentMethod: 'Efectivo'
  },
  {
    id: 'V-003',
    client: mockClients[2],
    saleType: 'Ruta + Servicios',
    amount: 485000,
    date: '2024-11-20',
    status: 'Pagado',
    mainService: mockRoutes[2],
    additionalServices: [mockServices[3]],
    paymentMethod: 'Tarjeta'
  },
  {
    id: 'V-004',
    client: mockClients[3],
    saleType: 'Finca',
    amount: 850000,
    date: '2024-11-21',
    status: 'Pagado',
    mainService: mockFarms[0],
    additionalServices: [],
    paymentMethod: 'Transferencia'
  },
  {
    id: 'V-005',
    client: mockClients[0],
    saleType: 'Ruta + Servicios',
    amount: 320000,
    date: '2024-11-22',
    status: 'Abono',
    mainService: mockRoutes[1],
    additionalServices: [mockServices[2]],
    paymentMethod: 'Efectivo'
  },
  {
    id: 'V-006',
    client: mockClients[1],
    saleType: 'Finca + Servicios',
    amount: 1350000,
    date: '2024-11-23',
    status: 'Pagado',
    mainService: mockFarms[2],
    additionalServices: [mockServices[0], mockServices[3]],
    paymentMethod: 'Tarjeta'
  },
  {
    id: 'V-007',
    client: mockClients[2],
    saleType: 'Ruta',
    amount: 125000,
    date: '2024-11-24',
    status: 'Pendiente',
    mainService: mockRoutes[0],
    additionalServices: [],
    paymentMethod: 'Efectivo'
  },
  {
    id: 'V-008',
    client: mockClients[3],
    saleType: 'Finca + Servicios',
    amount: 950000,
    date: '2024-11-25',
    status: 'Pagado',
    mainService: mockFarms[1],
    additionalServices: [mockServices[1]],
    paymentMethod: 'Transferencia'
  },
  {
    id: 'V-009',
    client: mockClients[0],
    saleType: 'Ruta + Servicios',
    amount: 540000,
    date: '2024-11-26',
    status: 'Cotización',
    mainService: mockRoutes[2],
    additionalServices: [mockServices[2], mockServices[4]],
    paymentMethod: 'N/A'
  },
  {
    id: 'V-010',
    client: mockClients[4],
    saleType: 'Finca',
    amount: 780000,
    date: '2024-11-27',
    status: 'Abono',
    mainService: mockFarms[0],
    additionalServices: [],
    paymentMethod: 'Tarjeta'
  },
  {
    id: 'V-011',
    client: mockClients[5],
    saleType: 'Ruta',
    amount: 95000,
    date: '2024-11-28',
    status: 'Pagado',
    mainService: mockRoutes[1],
    additionalServices: [],
    paymentMethod: 'Efectivo'
  },
  {
    id: 'V-012',
    client: mockClients[6],
    saleType: 'Finca + Servicios',
    amount: 1450000,
    date: '2024-11-29',
    status: 'Pagado',
    mainService: mockFarms[2],
    additionalServices: [mockServices[0], mockServices[1], mockServices[3]],
    paymentMethod: 'Transferencia'
  },
  {
    id: 'V-013',
    client: mockClients[7],
    saleType: 'Ruta + Servicios',
    amount: 410000,
    date: '2024-11-30',
    status: 'Pendiente',
    mainService: mockRoutes[0],
    additionalServices: [mockServices[4]],
    paymentMethod: 'Tarjeta'
  },
  {
    id: 'V-014',
    client: mockClients[0],
    saleType: 'Finca',
    amount: 920000,
    date: '2024-12-01',
    status: 'Pagado',
    mainService: mockFarms[1],
    additionalServices: [],
    paymentMethod: 'Efectivo'
  },
  {
    id: 'V-015',
    client: mockClients[1],
    saleType: 'Ruta',
    amount: 115000,
    date: '2024-12-02',
    status: 'Cotización',
    mainService: mockRoutes[2],
    additionalServices: [],
    paymentMethod: 'N/A'
  },
  {
    id: 'V-016',
    client: mockClients[2],
    saleType: 'Finca + Servicios',
    amount: 1250000,
    date: '2024-12-03',
    status: 'Abono',
    mainService: mockFarms[0],
    additionalServices: [mockServices[2], mockServices[3]],
    paymentMethod: 'Transferencia'
  },
  {
    id: 'V-017',
    client: mockClients[3],
    saleType: 'Ruta + Servicios',
    amount: 385000,
    date: '2024-12-04',
    status: 'Pagado',
    mainService: mockRoutes[1],
    additionalServices: [mockServices[1]],
    paymentMethod: 'Tarjeta'
  },
  {
    id: 'V-018',
    client: mockClients[4],
    saleType: 'Finca',
    amount: 870000,
    date: '2024-12-05',
    status: 'Pendiente',
    mainService: mockFarms[2],
    additionalServices: [],
    paymentMethod: 'Efectivo'
  },
  {
    id: 'V-019',
    client: mockClients[5],
    saleType: 'Ruta',
    amount: 145000,
    date: '2024-12-06',
    status: 'Pagado',
    mainService: mockRoutes[0],
    additionalServices: [],
    paymentMethod: 'Transferencia'
  },
  {
    id: 'V-020',
    client: mockClients[6],
    saleType: 'Finca + Servicios',
    amount: 1580000,
    date: '2024-12-07',
    status: 'Pagado',
    mainService: mockFarms[1],
    additionalServices: [mockServices[0], mockServices[2], mockServices[4]],
    paymentMethod: 'Tarjeta'
  },
  {
    id: 'V-021',
    client: mockClients[7],
    saleType: 'Ruta + Servicios',
    amount: 465000,
    date: '2024-12-08',
    status: 'Cotización',
    mainService: mockRoutes[2],
    additionalServices: [mockServices[3]],
    paymentMethod: 'N/A'
  },
  {
    id: 'V-022',
    client: mockClients[0],
    saleType: 'Finca',
    amount: 810000,
    date: '2024-12-09',
    status: 'Pagado',
    mainService: mockFarms[0],
    additionalServices: [],
    paymentMethod: 'Efectivo'
  },
  {
    id: 'V-023',
    client: mockClients[1],
    saleType: 'Ruta',
    amount: 105000,
    date: '2024-12-10',
    status: 'Abono',
    mainService: mockRoutes[1],
    additionalServices: [],
    paymentMethod: 'Transferencia'
  },
  {
    id: 'V-024',
    client: mockClients[2],
    saleType: 'Finca + Servicios',
    amount: 1120000,
    date: '2024-12-11',
    status: 'Pagado',
    mainService: mockFarms[2],
    additionalServices: [mockServices[1], mockServices[4]],
    paymentMethod: 'Tarjeta'
  },
  {
    id: 'V-025',
    client: mockClients[3],
    saleType: 'Ruta + Servicios',
    amount: 520000,
    date: '2024-12-12',
    status: 'Pendiente',
    mainService: mockRoutes[0],
    additionalServices: [mockServices[0], mockServices[2]],
    paymentMethod: 'Efectivo'
  }
];

// ===========================
// COMPONENTE PRINCIPAL
// ===========================

export function SalesManagement() {
  const permisos = usePermissions();
  const ventasPerms = createModulePermissions(permisos, 'Ventas');
  const canViewVentas = ventasPerms.canView();
  const canCreateVenta = ventasPerms.canCreate();
  const canEditVenta = ventasPerms.canEdit();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cancelledSales, setCancelledSales] = useState<CancelledSale[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [createClients, setCreateClients] = useState<Client[]>(mockClients);
  const [createRoutes, setCreateRoutes] = useState<Route[]>(mockRoutes);
  const [createFarms, setCreateFarms] = useState<Farm[]>(mockFarms);
  const [createServices, setCreateServices] = useState<Service[]>(mockServices);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Control del diálogo de anulación
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    if (!canViewVentas) return;

    const loadSales = async () => {
      try {
        setLoadingSales(true);
        const data = await ventasAPI.getAll();
        setSales((data || []).map((venta) => mapVentaToSale(venta)));
      } catch (error: any) {
        toast.error(error?.message || 'No se pudieron cargar las ventas');
        setSales([]);
      } finally {
        setLoadingSales(false);
      }
    };

    void loadSales();
  }, [canViewVentas]);

  useEffect(() => {
    if (!canCreateVenta) return;

    const loadCreateData = async () => {
      try {
        const [clients, routes, farms, services] = await Promise.all([
          clientesAPI.getAll(),
          rutasAPI.getAll(),
          fincasAPI.getAll(),
          serviciosAPI.getAll(),
        ]);

        setCreateClients(
          (clients || []).map((client) => ({
            id: String(client.id_cliente),
            name: `${String(client.nombre || '').trim()} ${String(client.apellido || '').trim()}`.trim(),
            document: String(client.numero_documento || 'Sin documento'),
            phone: String(client.telefono || '—'),
            email: String((client as any).correo || '—'),
          }))
        );

        setCreateRoutes(
          (routes || []).map((route) => ({
            id: String(route.id_ruta),
            name: String(route.nombre),
            distance: `${route.duracion_dias || '—'} día(s)`,
            difficulty: String(route.dificultad || 'Por definir'),
            price: Number(route.precio_base || 0),
          }))
        );

        setCreateFarms(
          (farms || []).map((farm) => ({
            id: String(farm.id_finca),
            name: String(farm.nombre),
            capacity: Number(farm.capacidad_personas || 0),
            location: String(farm.ubicacion || farm.direccion || 'Por definir'),
            price: Number(farm.precio_por_noche || 0),
            includedServices: [],
          }))
        );

        setCreateServices(
          (services || []).map((service) => ({
            id: String(service.id_servicio),
            name: String(service.nombre),
            price: Number(service.precio || 0),
            category: String(service.categoria || 'Servicio'),
            description: String(service.descripcion || 'Sin descripción'),
          }))
        );
      } catch {
        // Si algo falla, mantener la UI con los datos mock existentes.
      }
    };

    void loadCreateData();
  }, [canCreateVenta]);

  const handleCreateSale = (newSale: Sale) => {
    if (!canCreateVenta) {
      toast.error('No tienes permiso para crear ventas');
      return;
    }

    setSales([newSale, ...sales]);
    setViewMode('list');
  };

  const handleViewDetail = async (sale: Sale) => {
    try {
      setLoadingDetail(true);
      const ventaDetallePromise = sale.backendId ? ventasAPI.getById(sale.backendId) : Promise.resolve(null as any);
      const reservaDetallePromise = sale.reservationId ? reservasAPI.getById(sale.reservationId) : Promise.resolve(null as any);
      const pagosDetallePromise = sale.backendId ? pagosAPI.getByVenta(sale.backendId) : Promise.resolve([]);
      const [ventaDetalle, reservaDetalle, pagosDetalle] = await Promise.all([
        ventaDetallePromise,
        reservaDetallePromise,
        pagosDetallePromise,
      ]);
      const mapped = ventaDetalle ? mapVentaToSale(ventaDetalle, reservaDetalle) : sale;
      setSelectedSale({
        ...mapped,
        paymentHistory: (pagosDetalle || []).map(mapPagoToSalePayment),
      });
      setViewMode('detail');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cargar el detalle de la venta');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleInitiateCancellation = (saleId: string) => {
    if (!canEditVenta) {
      toast.error('No tienes permiso para anular ventas');
      return;
    }

    setSaleToCancel(saleId);
    setShowCancelDialog(true);
  };

  const handleConfirmCancellation = async () => {
    if (!canEditVenta) {
      toast.error('No tienes permiso para anular ventas');
      return;
    }

    if (saleToCancel) {
      const saleToUpdate = sales.find((s) => s.id === saleToCancel);
      if (!saleToUpdate?.backendId) {
        toast.error('No se pudo identificar la venta a anular');
        return;
      }

      try {
        await ventasAPI.cancelar(saleToUpdate.backendId);

        const cancelledSale: CancelledSale = {
          ...saleToUpdate,
          status: 'Anulado',
          cancellationDate: new Date().toISOString().split('T')[0],
          cancellationReason: cancellationReason || 'Sin motivo especificado'
        };

        setSales((current) => current.map((s) => (s.id === saleToCancel ? cancelledSale : s)));
        setCancelledSales((current) => [cancelledSale, ...current]);

        if (selectedSale?.id === saleToCancel) {
          setSelectedSale(cancelledSale);
        }

        toast.success('Venta anulada correctamente');
        setShowCancelDialog(false);
        setSaleToCancel(null);
        setCancellationReason('');
      } catch (error: any) {
        toast.error(error?.message || 'No se pudo anular la venta');
      }
    }
  };

  const handleCancelDialogClose = () => {
    setShowCancelDialog(false);
    setSaleToCancel(null);
    setCancellationReason('');
  };

  if (!permisos.loadingRoles && !canViewVentas) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-red-700">Acceso denegado</h2>
            <p className="text-gray-700 mt-2">No tienes permiso para ver ventas.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AnimatePresence mode="wait">
        {viewMode === 'list' && (
          <SalesListView
            key="list"
            sales={sales}
            loading={loadingSales}
            loadingDetail={loadingDetail}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            dateRange={dateRange}
            setDateRange={setDateRange}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            canCreateVenta={canCreateVenta}
            canEditVenta={canEditVenta}
            onCreateNew={() => {
              if (!canCreateVenta) {
                toast.error('No tienes permiso para crear ventas');
                return;
              }
              setViewMode('create');
            }}
            onViewDetail={handleViewDetail}
            onCancelSale={handleInitiateCancellation}
          />
        )}
        
        {viewMode === 'create' && (
          <CreateSaleView
            key="create"
            onBack={() => setViewMode('list')}
            onCreate={handleCreateSale}
            clients={createClients}
            routes={createRoutes}
            farms={createFarms}
            services={createServices}
            canCreateVenta={canCreateVenta}
          />
        )}
        
        {viewMode === 'detail' && selectedSale && (
          <SaleDetailView
            key="detail"
            sale={selectedSale}
            onBack={() => setViewMode('list')}
            onCancel={handleInitiateCancellation}
            canEditVenta={canEditVenta}
          />
        )}
      </AnimatePresence>

      {/* Diálogo de Confirmación de Anulación */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-white border-2 border-red-200">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-red-900">
                Advertencia: Anular Venta
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p className="text-gray-700">
                  Estás a punto de <span className="font-semibold">anular permanentemente</span> la venta{' '}
                  <span className="font-semibold text-red-700">{saleToCancel}</span>.
                </p>
                <p className="text-gray-700">
                  Esta acción cambiará el estado de la venta a "Anulado" y se guardará un registro 
                  completo de esta operación, incluyendo la fecha y el motivo de la anulación.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Importante:</strong> Esta acción no se puede deshacer. La venta permanecerá 
                    en el sistema pero será marcada como anulada.
                  </p>
                </div>
                
                <div className="mt-4 space-y-2">
                  <Label htmlFor="cancellation-reason" className="text-gray-900">
                    Motivo de la anulación (opcional)
                  </Label>
                  <Textarea
                    id="cancellation-reason"
                    placeholder="Ej: Cliente canceló, error en el registro, duplicado..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="min-h-[80px] border-gray-300 focus:border-red-500"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={handleCancelDialogClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancellation}
              disabled={!canEditVenta}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sí, Anular Venta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ===========================
// PANTALLA 1: LISTA DE VENTAS
// ===========================

interface SalesListViewProps {
  sales: Sale[];
  loading: boolean;
  loadingDetail: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterType: string;
  setFilterType: (value: string) => void;
  dateRange: { from: string; to: string };
  setDateRange: (range: { from: string; to: string }) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  canCreateVenta: boolean;
  canEditVenta: boolean;
  onCreateNew: () => void;
  onViewDetail: (sale: Sale) => void;
  onCancelSale: (saleId: string) => void;
}

function SalesListView({
  sales,
  loading,
  loadingDetail,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  dateRange,
  setDateRange,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  canCreateVenta,
  canEditVenta,
  onCreateNew,
  onViewDetail,
  onCancelSale
}: SalesListViewProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: Sale['status']) => {
    const styles = {
      Pagado: 'bg-green-100 text-green-700 border-green-200',
      Pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      Parcial: 'bg-blue-100 text-blue-700 border-blue-200',
      Anulado: 'bg-red-100 text-red-700 border-red-200'
    };
    return styles[status];
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.date.includes(searchTerm);
    
    const matchesType = filterType === 'all' || sale.saleType.toLowerCase().includes(filterType.toLowerCase());
    
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = filteredSales.slice(startIndex, startIndex + itemsPerPage);

  const handleGeneratePDF = (sale: Sale) => {
    alert(`Generando PDF para la venta ${sale.id}...`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-green-800">Gestión de Ventas</h1>
          <p className="text-gray-600 mt-1">Administra todas las ventas de rutas, fincas y servicios</p>
        </div>
        {canCreateVenta && (
          <Button 
            onClick={onCreateNew}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Registrar Venta
          </Button>
        )}
      </div>

      <Card className="border-green-100 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por cliente, fecha o servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <Label>Servicios Adquiridos</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="mt-2 border-gray-200 focus:border-green-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ruta">Ruta</SelectItem>
                  <SelectItem value="finca">Finca</SelectItem>
                  <SelectItem value="ruta + servicios">Ruta + Servicios</SelectItem>
                  <SelectItem value="finca + servicios">Finca + Servicios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-100 shadow-sm">
        <CardContent className="p-6">
          {loading ? (
            <div className="py-16 text-center text-gray-500">Cargando ventas...</div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-green-100 bg-green-50">
                  <TableHead className="text-green-800">ID Venta</TableHead>
                  <TableHead className="text-green-800">Cliente</TableHead>
                  <TableHead className="text-green-800">Servicios Adquiridos</TableHead>
                  <TableHead className="text-green-800">Monto Total</TableHead>
                  <TableHead className="text-green-800">Fecha</TableHead>
                  <TableHead className="text-green-800 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.map((sale, index) => (
                  <TableRow 
                    key={sale.id} 
                    className={`border-green-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <TableCell className="font-medium text-green-700">{sale.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{sale.client.name}</p>
                        <p className="text-sm text-gray-500">{sale.client.document}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700">{sale.saleType}</span>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {formatCurrency(sale.amount)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(sale.date).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetail(sale)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Ver Detalles"
                        >
                          {loadingDetail ? <span className="text-xs">...</span> : <Eye className="w-4 h-4" />}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGeneratePDF(sale)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Generar PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>

                        {sale.status !== 'Anulado' && canEditVenta && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCancelSale(sale.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Anular Venta"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredSales.length)} de {filteredSales.length} ventas
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ===========================
// PANTALLA 2: CREAR VENTA
// ===========================

interface CreateSaleViewProps {
  onBack: () => void;
  onCreate: (sale: Sale) => void;
  clients: Client[];
  routes: Route[];
  farms: Farm[];
  services: Service[];
  canCreateVenta: boolean;
}

function CreateSaleView({ onBack, onCreate, clients, routes, farms, services, canCreateVenta }: CreateSaleViewProps) {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [saleType, setSaleType] = useState<'route' | 'farm' | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedFarm, setSelectedFarm] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('transferencia');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calcular totales
  const calculateTotal = () => {
    let mainServicePrice = 0;
    
    if (saleType === 'route' && selectedRoute) {
      const route = routes.find(r => r.id === selectedRoute);
      mainServicePrice = route?.price || 0;
    } else if (saleType === 'farm' && selectedFarm) {
      const farm = farms.find(f => f.id === selectedFarm);
      mainServicePrice = farm?.price || 0;
    }

    const servicesPrice = selectedServices.reduce((sum, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return sum + (service?.price || 0);
    }, 0);

    return {
      mainServicePrice,
      servicesPrice,
      total: mainServicePrice + servicesPrice
    };
  };

  const { mainServicePrice, servicesPrice, total } = calculateTotal();

  const handleSubmit = () => {
    if (!canCreateVenta) {
      toast.error('No tienes permiso para crear ventas');
      return;
    }

    if (!selectedClient) {
      alert('Debes seleccionar un cliente');
      return;
    }

    if (!saleType) {
      alert('Debes seleccionar un tipo de venta (Ruta o Finca)');
      return;
    }

    if (saleType === 'route' && !selectedRoute) {
      alert('Debes seleccionar una ruta');
      return;
    }

    if (saleType === 'farm' && !selectedFarm) {
      alert('Debes seleccionar una finca');
      return;
    }

    const client = clients.find(c => c.id === selectedClient)!;
    let mainService: Route | Farm | undefined;
    let saleTypeName = '';

    if (saleType === 'route') {
      mainService = routes.find(r => r.id === selectedRoute);
      saleTypeName = selectedServices.length > 0 ? 'Ruta + Servicios' : 'Ruta';
    } else {
      mainService = farms.find(f => f.id === selectedFarm);
      saleTypeName = selectedServices.length > 0 ? 'Finca + Servicios' : 'Finca';
    }

    const additionalServices = selectedServices.map(id => 
      services.find(s => s.id === id)!
    );

    const newSale: Sale = {
      id: `V-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      client,
      saleType: saleTypeName,
      amount: total,
      date: new Date().toISOString().split('T')[0],
      status: 'Pendiente',
      mainService,
      additionalServices,
      paymentMethod
    };

    onCreate(newSale);
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(id => id !== serviceId));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-green-700 hover:bg-green-50">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-green-800">Registrar Nueva Venta</h1>
          <p className="text-gray-600 mt-1">Completa la información de la venta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECCIÓN 1: SELECCIONAR CLIENTE */}
          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Sección 1: Seleccionar Cliente</h2>
              <div className="space-y-4">
                <div>
                  <Label>Cliente *</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="mt-2 border-gray-200 focus:border-green-500">
                      <SelectValue placeholder="Selecciona un cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} — {client.document}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECCIÓN 2: TIPO DE VENTA */}
          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Sección 2: Tipo de Venta</h2>
              <p className="text-sm text-gray-600 mb-4">
                Selecciona una de las dos opciones
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Venta de Ruta */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSaleType('route');
                    setSelectedFarm('');
                  }}
                  className={`
                    p-6 rounded-lg border-2 cursor-pointer transition-all
                    ${saleType === 'route' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-white hover:border-green-300'
                    }
                  `}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={`
                      p-4 rounded-full 
                      ${saleType === 'route' ? 'bg-green-100' : 'bg-gray-100'}
                    `}>
                      <Mountain className={`w-8 h-8 ${saleType === 'route' ? 'text-green-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Venta de Ruta</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Selecciona una ruta turística. Puedes agregar servicios adicionales.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Venta de Finca */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSaleType('farm');
                    setSelectedRoute('');
                  }}
                  className={`
                    p-6 rounded-lg border-2 cursor-pointer transition-all
                    ${saleType === 'farm' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-white hover:border-green-300'
                    }
                  `}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={`
                      p-4 rounded-full 
                      ${saleType === 'farm' ? 'bg-green-100' : 'bg-gray-100'}
                    `}>
                      <Home className={`w-8 h-8 ${saleType === 'farm' ? 'text-green-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Venta de Finca</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Selecciona una finca aliada. Puedes agregar servicios adicionales.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>

          {/* SECCIÓN 3: SELECCIONAR RUTA (solo visible si escoge Ruta) */}
          {saleType === 'route' && (
            <Card className="border-green-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-green-800">Sección 3: Seleccionar Ruta</h2>
                  {selectedRoute && (
                    <Button
                      onClick={() => setSelectedRoute('')}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Quitar Ruta
                    </Button>
                  )}
                </div>
                
                {selectedRoute ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-lg border-2 border-green-500 bg-green-50"
                  >
                    {(() => {
                      const route = routes.find(r => r.id === selectedRoute);
                      return route ? (
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-green-100 rounded-full">
                                <Mountain className="w-6 h-6 text-green-600" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">{route.name}</h3>
                                <p className="text-sm text-green-700 mt-1">✓ Ruta Seleccionada</p>
                              </div>
                            </div>
                            <p className="font-semibold text-green-700">{formatCurrency(route.price)}</p>
                          </div>
                          <div className="flex gap-4 text-sm text-gray-600 bg-white rounded-lg p-3">
                            <span>📍 Distancia: {route.distance}</span>
                            <span>🏔️ Dificultad: {route.difficulty}</span>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-3">Haz clic en una ruta para seleccionarla:</p>
                    {routes.map(route => (
                      <motion.div
                        key={route.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setSelectedRoute(route.id)}
                        className="p-4 rounded-lg border-2 border-gray-200 hover:border-green-300 cursor-pointer transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{route.name}</h3>
                            <div className="flex gap-4 mt-2 text-sm text-gray-600">
                              <span>📍 Distancia: {route.distance}</span>
                              <span>🏔️ Dificultad: {route.difficulty}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-700">{formatCurrency(route.price)}</p>
                            <p className="text-xs text-gray-500 mt-1">Precio</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* SECCIÓN 4: SELECCIONAR FINCA (solo visible si escoge Finca) */}
          {saleType === 'farm' && (
            <Card className="border-green-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-green-800">Sección 4: Seleccionar Finca</h2>
                  {selectedFarm && (
                    <Button
                      onClick={() => setSelectedFarm('')}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Quitar Finca
                    </Button>
                  )}
                </div>
                
                {selectedFarm ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-lg border-2 border-green-500 bg-green-50"
                  >
                    {(() => {
                      const farm = farms.find(f => f.id === selectedFarm);
                      return farm ? (
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-green-100 rounded-full">
                                <Home className="w-6 h-6 text-green-600" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">{farm.name}</h3>
                                <p className="text-sm text-green-700 mt-1">✓ Finca Seleccionada</p>
                              </div>
                            </div>
                            <p className="font-semibold text-green-700">{formatCurrency(farm.price)}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 space-y-2">
                            <div className="flex gap-4 text-sm text-gray-600">
                              <span>📍 Ubicación: {farm.location}</span>
                              <span>👥 Capacidad: {farm.capacity} personas</span>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-2">Servicios incluidos:</p>
                              <div className="flex flex-wrap gap-1">
                                {farm.includedServices.map((service, idx) => (
                                  <Badge key={idx} variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                    {service}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-3">Haz clic en una finca para seleccionarla:</p>
                    {farms.map(farm => (
                      <motion.div
                        key={farm.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setSelectedFarm(farm.id)}
                        className="p-4 rounded-lg border-2 border-gray-200 hover:border-green-300 cursor-pointer transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{farm.name}</h3>
                            <div className="flex gap-4 mt-2 text-sm text-gray-600">
                              <span>📍 Ubicación: {farm.location}</span>
                              <span>👥 Capacidad: {farm.capacity} personas</span>
                            </div>
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Servicios incluidos:</p>
                              <div className="flex flex-wrap gap-1">
                                {farm.includedServices.map((service, idx) => (
                                  <Badge key={idx} variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                    {service}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-medium text-green-700">{formatCurrency(farm.price)}</p>
                            <p className="text-xs text-gray-500 mt-1">Precio base</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* SECCIÓN 5: SERVICIOS ADICIONALES (Opcional) */}
          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-green-800">Sección 5: Servicios Adicionales (Opcional)</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Selecciona servicios adicionales para la venta
                  </p>
                </div>
                {selectedServices.length > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {selectedServices.length} seleccionado{selectedServices.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              
              {/* Servicios seleccionados */}
              {selectedServices.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-900">Servicios Seleccionados:</p>
                  </div>
                  <div className="space-y-2">
                    {selectedServices.map(serviceId => {
                      const service = services.find(s => s.id === serviceId);
                      return service ? (
                        <motion.div
                          key={serviceId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center justify-between p-4 rounded-lg border-2 border-green-300 bg-green-50"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-green-100 rounded-full">
                              <Check className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{service.name}</p>
                              <p className="text-sm text-gray-600">{service.description}</p>
                            </div>
                            <p className="font-medium text-green-700 mr-3">{formatCurrency(service.price)}</p>
                          </div>
                          <Button
                            onClick={() => handleRemoveService(serviceId)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-100"
                            title="Quitar servicio"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ) : null;
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Subtotal Servicios Adicionales:</span>
                      <span className="font-medium text-green-700">
                        {formatCurrency(servicesPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Servicios disponibles para agregar */}
              <div>
                <p className="text-sm font-medium text-gray-900 mb-3">
                  {selectedServices.length > 0 ? 'Agregar Más Servicios:' : 'Servicios Disponibles:'}
                </p>
                <div className="space-y-2">
                  {services
                    .filter(service => !selectedServices.includes(service.id))
                    .map(service => (
                      <motion.div
                        key={service.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => handleServiceToggle(service.id)}
                        className="p-3 rounded-lg border-2 border-gray-200 hover:border-green-300 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{service.name}</p>
                            <p className="text-sm text-gray-600">{service.description}</p>
                          </div>
                          <p className="font-medium text-gray-700">{formatCurrency(service.price)}</p>
                        </div>
                      </motion.div>
                    ))}
                </div>
                {services.filter(s => !selectedServices.includes(s.id)).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                    ✓ Todos los servicios han sido seleccionados
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral derecho: Resumen de la Venta */}
        <div className="lg:col-span-1">
          <Card className="border-green-100 shadow-sm sticky top-6">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Resumen de la Venta</h2>
              
              <div className="space-y-4">
                {selectedClient && (
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Cliente</p>
                    <p className="font-medium text-gray-900">
                      {clients.find(c => c.id === selectedClient)?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {clients.find(c => c.id === selectedClient)?.document}
                    </p>
                  </div>
                )}

                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Tipo de Venta</p>
                  <p className="font-medium text-gray-900">
                    {saleType === 'route' && 'Ruta'}
                    {saleType === 'farm' && 'Finca'}
                    {!saleType && 'No seleccionado'}
                    {selectedServices.length > 0 && ' + Servicios'}
                  </p>
                </div>

                {mainServicePrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio Principal</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(mainServicePrice)}
                    </span>
                  </div>
                )}
                
                {servicesPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Servicios Adicionales ({selectedServices.length})
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(servicesPrice)}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t-2 border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Total</span>
                    <span className="text-green-700 font-semibold">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <div>
                    <Label className="text-sm text-gray-600">Estado Inicial</Label>
                    <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-700 w-full justify-center">
                      Pendiente
                    </Badge>
                  </div>

                  <div>
                    <Label>Método de Pago</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="mt-2 border-gray-200 focus:border-green-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <Button 
                    onClick={handleSubmit}
                    disabled={!canCreateVenta}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    Registrar Venta
                  </Button>
                  <Button 
                    onClick={onBack}
                    variant="outline" 
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

// ===========================
// PANTALLA 3: VER DETALLE DE VENTA
// ===========================

interface SaleDetailViewProps {
  sale: Sale;
  onBack: () => void;
  onCancel: (saleId: string) => void;
  canEditVenta: boolean;
}

function SaleDetailView({ sale, onBack, onCancel, canEditVenta }: SaleDetailViewProps) {
  const paymentHistory = sale.paymentHistory || [];
  const [receiptDialog, setReceiptDialog] = useState<{
    open: boolean;
    url?: string;
    name?: string;
    mime?: string;
  }>({ open: false });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: Sale['status']) => {
    const styles = {
      Pagado: 'bg-green-100 text-green-700 border-green-200',
      Pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      Parcial: 'bg-blue-100 text-blue-700 border-blue-200',
      Anulado: 'bg-red-100 text-red-700 border-red-200'
    };
    return styles[status];
  };

  const getPaymentStatusBadge = (status: SalePayment['status']) => {
    const styles = {
      Pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      Aprobado: 'bg-green-100 text-green-700 border-green-200',
      Rechazado: 'bg-red-100 text-red-700 border-red-200',
      Verificado: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return styles[status];
  };

  const handlePrintPDF = () => {
    alert(`Generando PDF de la venta ${sale.id}...`);
  };

  const handleOpenReceipt = (payment: SalePayment) => {
    if (!payment.receiptUrl) {
      toast.error('Este pago no tiene comprobante adjunto');
      return;
    }
    setReceiptDialog({
      open: true,
      url: payment.receiptUrl,
      name: payment.receiptName,
      mime: payment.receiptType,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <ReceiptProofViewerDialog
        open={receiptDialog.open}
        onOpenChange={(open) => setReceiptDialog((d) => ({ ...d, open }))}
        url={receiptDialog.url}
        fileName={receiptDialog.name}
        mimeType={receiptDialog.mime}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="text-green-700 hover:bg-green-50">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-green-800">Ver Detalle de Venta</h1>
            <p className="text-gray-600 mt-1">ID: {sale.id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Datos Principales</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ID Venta</p>
                  <p className="font-medium text-gray-900 mt-1">{sale.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nombre del Cliente</p>
                  <p className="font-medium text-gray-900 mt-1">{sale.client.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Venta</p>
                  <p className="font-medium text-gray-900 mt-1">{sale.saleType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {new Date(sale.date).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <Badge variant="secondary" className={`mt-1 ${getStatusBadge(sale.status)}`}>
                    {sale.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Método de Pago</p>
                  <p className="font-medium text-gray-900 mt-1 capitalize">{sale.paymentMethod}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {sale.mainService && (
            <Card className="border-green-100 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-green-800 mb-4">Detalle del Servicio Principal</h2>
                
                {'distance' in sale.mainService ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Ruta Seleccionada</p>
                      <p className="font-medium text-gray-900 mt-1">{sale.mainService.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Distancia</p>
                      <p className="font-medium text-gray-900 mt-1">{sale.mainService.distance}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dificultad</p>
                      <p className="font-medium text-gray-900 mt-1">{sale.mainService.difficulty}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Precio</p>
                      <p className="font-medium text-green-700 mt-1">
                        {formatCurrency(sale.mainService.price)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Finca Seleccionada</p>
                      <p className="font-medium text-gray-900 mt-1">{sale.mainService.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ubicación</p>
                      <p className="font-medium text-gray-900 mt-1">{sale.mainService.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Capacidad</p>
                      <p className="font-medium text-gray-900 mt-1">{sale.mainService.capacity} personas</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Precio Base</p>
                      <p className="font-medium text-green-700 mt-1">
                        {formatCurrency(sale.mainService.price)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {sale.additionalServices.length > 0 && (
            <Card className="border-green-100 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-green-800 mb-4">Servicios Adicionales</h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-green-100 bg-green-50">
                        <TableHead className="text-green-800">Servicio</TableHead>
                        <TableHead className="text-green-800">Descripción</TableHead>
                        <TableHead className="text-green-800 text-right">Precio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sale.additionalServices.map((service, index) => (
                        <TableRow 
                          key={service.id} 
                          className={`border-green-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          <TableCell className="font-medium text-gray-900">
                            {service.name}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {service.description}
                          </TableCell>
                          <TableCell className="text-right font-medium text-gray-900">
                            {formatCurrency(service.price)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Totales</h2>
              <div className="space-y-3">
                {sale.mainService && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Servicio Principal</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(sale.mainService.price)}
                    </span>
                  </div>
                )}
                {sale.additionalServices.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Servicios Adicionales ({sale.additionalServices.length})
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(
                        sale.additionalServices.reduce((sum, s) => sum + s.price, 0)
                      )}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t-2 border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Monto Total</span>
                    <span className="text-green-700 font-semibold">
                      {formatCurrency(sale.amount)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Comprobantes y Abonos</h2>
              {paymentHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-green-100 bg-green-50">
                        <TableHead className="text-green-800">ID</TableHead>
                        <TableHead className="text-green-800">Fecha</TableHead>
                        <TableHead className="text-green-800">Método</TableHead>
                        <TableHead className="text-green-800 text-right">Monto</TableHead>
                        <TableHead className="text-green-800">Estado</TableHead>
                        <TableHead className="text-green-800 text-right">Comprobante</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.map((payment, index) => (
                        <TableRow
                          key={payment.backendId}
                          className={`border-green-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          <TableCell className="font-medium text-gray-900">{payment.id}</TableCell>
                          <TableCell className="text-gray-600">
                            {new Date(payment.date).toLocaleDateString('es-CO')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900 capitalize">{payment.paymentMethod}</p>
                              <p className="text-sm text-gray-500">{payment.transactionNumber || 'Sin referencia'}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getPaymentStatusBadge(payment.status)}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {payment.receiptUrl ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenReceipt(payment)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver
                              </Button>
                            ) : (
                              <span className="text-sm text-gray-400">Sin archivo</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">
                    Esta venta aún no tiene comprobantes ni abonos registrados.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border-green-100 shadow-sm sticky top-6">
            <CardContent className="p-6">
              <h2 className="text-green-800 mb-4">Acciones Disponibles</h2>
              <div className="space-y-3">
                
                <Button 
                  onClick={handlePrintPDF}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Generar PDF
                </Button>
                
                {sale.status !== 'Anulado' && canEditVenta && (
                  <Button 
                    onClick={() => onCancel(sale.id)}
                    variant="outline"
                    className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Anular Venta
                  </Button>
                )}

                <Button 
                  onClick={onBack}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Volver al Listado
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <h3 className="font-medium text-gray-900">Resumen Rápido</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium text-gray-900">{sale.client.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <Badge variant="secondary" className={getStatusBadge(sale.status)}>
                      {sale.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium text-gray-900">{sale.saleType}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-900">Total:</span>
                    <span className="font-medium text-green-700">
                      {formatCurrency(sale.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">Comprobantes:</span>
                    <span className="font-medium text-gray-900">{paymentHistory.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
