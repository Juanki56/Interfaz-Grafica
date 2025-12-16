import React, { useState } from 'react';
import { useAuth } from '../App';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  MapPin, 
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
  Package,
  TreePine,
  Route as RouteIcon,
  DollarSign,
  User,
  Phone,
  Mail,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CalendarDays,
  Banknote,
  Bus,
  X,
  FileText,
  Save,
  Loader2,
  ChevronDown,
  Home,
  Mountain,
  Info,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollArea } from './ui/scroll-area';

interface Companion {
  id: string;
  name: string;
  document: string;
  phone: string;
  email?: string;
  age?: number;
}

interface TransportInfo {
  type: string;
  plate?: string;
  driver?: string;
  driverPhone?: string;
  pickupLocation: string;
  pickupTime: string;
  capacity: number;
}

interface Service {
  id: string;
  type: 'package' | 'route' | 'farm';
  name: string;
  description: string;
  duration?: string;
  capacity: number;
  price: number;
}

interface SchedulingReservation {
  id: string;
  bookingNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientDocument: string;
  date: string;
  startTime: string;
  endTime: string;
  participants: number;
  companions?: Companion[];
  serviceId: string; // ID del servicio asociado
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: 'paid' | 'partial' | 'pending' | 'cancelled';
  status: 'confirmed' | 'pending' | 'in-progress' | 'completed' | 'cancelled';
  guide?: string;
  guidePhone?: string;
  transport?: TransportInfo;
  notes: string;
  lastDetails?: string;
  createdAt: string;
  updatedAt: string;
}

interface DaySchedule {
  date: string;
  services: Service[];
}

export function SchedulingPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showDeleteServiceDialog, setShowDeleteServiceDialog] = useState(false);
  const [showDeleteScheduleDialog, setShowDeleteScheduleDialog] = useState(false);
  const [showCreateScheduleDialog, setShowCreateScheduleDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('');

  // Mock Services
  const mockServices: Service[] = [
    {
      id: 's1',
      type: 'package',
      name: 'Tour Cafetero Premium',
      description: 'Experiencia completa en la cultura del café con visitas a fincas y degustaciones',
      duration: '8 horas',
      capacity: 20,
      price: 450000
    },
    {
      id: 's2',
      type: 'route',
      name: 'Sendero del Café',
      description: 'Caminata guiada por plantaciones de café con paisajes espectaculares',
      duration: '4 horas',
      capacity: 15,
      price: 85000
    },
    {
      id: 's3',
      type: 'route',
      name: 'Ruta de los Colibríes',
      description: 'Avistamiento de aves en reserva natural',
      duration: '6 horas',
      capacity: 12,
      price: 65000
    },
    {
      id: 's4',
      type: 'farm',
      name: 'Finca El Paraíso',
      description: 'Visita a finca ecológica con actividades agrícolas y gastronómicas',
      duration: '5 horas',
      capacity: 25,
      price: 80000
    },
    {
      id: 's5',
      type: 'package',
      name: 'Experiencia Rural Familiar',
      description: 'Paquete familiar completo con almuerzo y actividades recreativas',
      duration: '7 horas',
      capacity: 30,
      price: 320000
    },
    {
      id: 's6',
      type: 'route',
      name: 'Sendero del Café y las Mariposas',
      description: 'Ruta ecológica con mariposario y plantaciones',
      duration: '5 horas',
      capacity: 18,
      price: 85000
    },
    {
      id: 's7',
      type: 'package',
      name: 'Aventura Extrema Full Day',
      description: 'Rafting, canopy, rappel y almuerzo campestre',
      duration: '12 horas',
      capacity: 15,
      price: 1200000
    }
  ];

  // Mock Reservations con serviceId
  const mockReservations: SchedulingReservation[] = [
    {
      id: '1',
      bookingNumber: 'OCC-2025-001',
      clientName: 'Juan Carlos Pérez Rodríguez',
      clientEmail: 'juan.perez@email.com',
      clientPhone: '+57 320 555 0123',
      clientDocument: '1234567890',
      date: '2025-10-27',
      startTime: '08:00',
      endTime: '18:00',
      participants: 4,
      serviceId: 's1',
      companions: [
        { id: 'c1', name: 'María Pérez', document: '9876543210', phone: '+57 310 555 0001', email: 'maria.p@email.com', age: 35 },
        { id: 'c2', name: 'Carlos Pérez Jr.', document: '5554443330', phone: '+57 315 555 0002', age: 12 },
        { id: 'c3', name: 'Ana Sofía Pérez', document: '1112223330', phone: '+57 318 555 0003', age: 8 }
      ],
      totalAmount: 790000,
      paidAmount: 400000,
      pendingAmount: 390000,
      paymentStatus: 'partial',
      status: 'confirmed',
      guide: 'Carlos Ruiz Mendoza',
      guidePhone: '+57 300 555 9999',
      transport: {
        type: 'Bus Turístico',
        plate: 'ABC-123',
        driver: 'Pedro Gómez',
        driverPhone: '+57 310 555 8888',
        pickupLocation: 'Hotel Plaza Mayor',
        pickupTime: '07:30',
        capacity: 25
      },
      notes: 'Cliente solicita guía en inglés. Requiere menú vegetariano para 2 personas.',
      lastDetails: 'Confirmado pick-up. Cliente notificado vía WhatsApp.',
      createdAt: '2025-10-15T10:30:00',
      updatedAt: '2025-10-20T14:20:00'
    },
    {
      id: '2',
      bookingNumber: 'OCC-2025-002',
      clientName: 'María González Sánchez',
      clientEmail: 'maria.g@email.com',
      clientPhone: '+57 310 555 0456',
      clientDocument: '9876543210',
      date: '2025-10-28',
      startTime: '06:00',
      endTime: '14:00',
      participants: 2,
      serviceId: 's3',
      companions: [
        { id: 'c4', name: 'Jorge González', document: '7776665550', phone: '+57 320 555 0004', email: 'jorge.g@email.com', age: 42 }
      ],
      totalAmount: 130000,
      paidAmount: 130000,
      pendingAmount: 0,
      paymentStatus: 'paid',
      status: 'confirmed',
      guide: 'Ana Gómez Torres',
      guidePhone: '+57 315 555 7777',
      transport: {
        type: 'Camioneta 4x4',
        plate: 'XYZ-789',
        driver: 'Luis Martínez',
        driverPhone: '+57 318 555 6666',
        pickupLocation: 'Terminal de Transportes',
        pickupTime: '05:30',
        capacity: 7
      },
      notes: 'Pareja de observadores de aves experimentados. Traen equipo propio.',
      createdAt: '2025-10-10T09:15:00',
      updatedAt: '2025-10-18T11:30:00'
    },
    {
      id: '3',
      bookingNumber: 'OCC-2025-003',
      clientName: 'Roberto Silva Vargas',
      clientEmail: 'r.silva@email.com',
      clientPhone: '+57 315 555 0789',
      clientDocument: '5551234567',
      date: '2025-10-30',
      startTime: '10:00',
      endTime: '17:00',
      participants: 6,
      serviceId: 's5',
      companions: [
        { id: 'c5', name: 'Laura Silva', document: '4443332220', phone: '+57 300 555 0005', age: 38 },
        { id: 'c6', name: 'Diego Silva', document: '3332221110', phone: '+57 310 555 0006', age: 15 },
        { id: 'c7', name: 'Sofía Silva', document: '2221110000', phone: '+57 315 555 0007', age: 13 },
        { id: 'c8', name: 'Carmen Vargas', document: '1110009990', phone: '+57 318 555 0008', age: 65 },
        { id: 'c9', name: 'Alberto Vargas', document: '9998887770', phone: '+57 320 555 0009', age: 68 }
      ],
      totalAmount: 480000,
      paidAmount: 0,
      pendingAmount: 480000,
      paymentStatus: 'pending',
      status: 'pending',
      notes: 'Familia multigeneracional. Abuelos requieren actividades de baja intensidad.',
      createdAt: '2025-10-12T16:45:00',
      updatedAt: '2025-10-12T16:45:00'
    },
    {
      id: '4',
      bookingNumber: 'OCC-2025-004',
      clientName: 'Andrea López Ramírez',
      clientEmail: 'andrea.lopez@email.com',
      clientPhone: '+57 318 555 0654',
      clientDocument: '4445556660',
      date: '2025-11-02',
      startTime: '09:00',
      endTime: '15:00',
      participants: 3,
      serviceId: 's6',
      companions: [
        { id: 'c10', name: 'Patricia López', document: '8887776660', phone: '+57 300 555 0010', age: 29 },
        { id: 'c11', name: 'Daniela Ramírez', document: '7776665550', phone: '+57 310 555 0011', age: 31 }
      ],
      totalAmount: 255000,
      paidAmount: 100000,
      pendingAmount: 155000,
      paymentStatus: 'partial',
      status: 'confirmed',
      guide: 'Carlos Ruiz Mendoza',
      guidePhone: '+57 300 555 9999',
      notes: 'Grupo vegetariano. Solicitan menú especial sin productos de origen animal.',
      lastDetails: 'Menú confirmado con restaurante. Guía notificado de restricciones alimentarias.',
      createdAt: '2025-10-18T13:30:00',
      updatedAt: '2025-10-22T10:15:00'
    },
    {
      id: '5',
      bookingNumber: 'OCC-2025-005',
      clientName: 'Miguel Ángel Torres',
      clientEmail: 'miguel.torres@email.com',
      clientPhone: '+57 300 555 0321',
      clientDocument: '7778889990',
      date: '2025-11-05',
      startTime: '07:00',
      endTime: '19:00',
      participants: 8,
      serviceId: 's7',
      companions: [
        { id: 'c12', name: 'Sandra Torres', document: '6665554440', phone: '+57 315 555 0012', age: 45 },
        { id: 'c13', name: 'Camilo Torres', document: '5554443330', phone: '+57 318 555 0013', age: 22 },
        { id: 'c14', name: 'Valentina Torres', document: '4443332220', phone: '+57 320 555 0014', age: 19 },
        { id: 'c15', name: 'Andrés Mora', document: '3332221110', phone: '+57 300 555 0015', age: 24 },
        { id: 'c16', name: 'Carolina Mora', document: '2221110000', phone: '+57 310 555 0016', age: 23 },
        { id: 'c17', name: 'Felipe Ruiz', document: '1110009990', phone: '+57 315 555 0017', age: 25 },
        { id: 'c18', name: 'Isabella Ruiz', document: '9998887770', phone: '+57 318 555 0018', age: 21 }
      ],
      totalAmount: 1200000,
      paidAmount: 1200000,
      pendingAmount: 0,
      paymentStatus: 'paid',
      status: 'confirmed',
      guide: 'Miguel Torres Castro',
      guidePhone: '+57 320 555 5555',
      transport: {
        type: 'Bus Aventura',
        plate: 'DEF-456',
        driver: 'Santiago Vargas',
        driverPhone: '+57 315 555 4444',
        pickupLocation: 'Parque Principal',
        pickupTime: '06:30',
        capacity: 15
      },
      notes: 'Grupo joven para actividades de aventura. Todos firmaron deslinde de responsabilidad.',
      lastDetails: 'Equipo de seguridad verificado. Condiciones climáticas favorables confirmadas.',
      createdAt: '2025-10-05T11:00:00',
      updatedAt: '2025-10-25T16:00:00'
    },
    // Agregar más reservas para el día 27
    {
      id: '6',
      bookingNumber: 'OCC-2025-006',
      clientName: 'Laura Martínez Díaz',
      clientEmail: 'laura.m@email.com',
      clientPhone: '+57 305 555 1234',
      clientDocument: '3334445556',
      date: '2025-10-27',
      startTime: '08:30',
      endTime: '13:30',
      participants: 5,
      serviceId: 's2',
      companions: [
        { id: 'c19', name: 'Pedro Díaz', document: '2223334445', phone: '+57 312 555 0019', age: 40 },
        { id: 'c20', name: 'Lucía Martínez', document: '1112223334', phone: '+57 316 555 0020', age: 16 },
        { id: 'c21', name: 'Sofía Martínez', document: '0001112223', phone: '+57 319 555 0021', age: 14 },
        { id: 'c22', name: 'Gabriel Díaz', document: '9990001112', phone: '+57 321 555 0022', age: 11 }
      ],
      totalAmount: 425000,
      paidAmount: 425000,
      pendingAmount: 0,
      paymentStatus: 'paid',
      status: 'confirmed',
      guide: 'Ana Gómez Torres',
      guidePhone: '+57 315 555 7777',
      transport: {
        type: 'Van Turística',
        plate: 'GHI-456',
        driver: 'Carlos Ramírez',
        driverPhone: '+57 314 555 3333',
        pickupLocation: 'Centro Comercial',
        pickupTime: '08:00',
        capacity: 12
      },
      notes: 'Familia con niños. Requieren pausas frecuentes.',
      lastDetails: 'Confirmado itinerario adaptado para niños.',
      createdAt: '2025-10-16T14:20:00',
      updatedAt: '2025-10-21T09:15:00'
    }
  ];

  // Calendar utilities
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getReservationsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return mockReservations.filter(r => r.date === dateString);
  };

  const getServicesForDate = (date: Date): Service[] => {
    const reservations = getReservationsForDate(date);
    const serviceIds = [...new Set(reservations.map(r => r.serviceId))];
    return mockServices.filter(s => serviceIds.includes(s.id));
  };

  const getReservationsForService = (serviceId: string, date: Date): SchedulingReservation[] => {
    const dateString = date.toISOString().split('T')[0];
    return mockReservations.filter(r => r.serviceId === serviceId && r.date === dateString);
  };

  const getFilteredServices = (date: Date): Service[] => {
    let services = getServicesForDate(date);
    
    // Filter by service type
    if (serviceTypeFilter !== 'all') {
      services = services.filter(s => s.type === serviceTypeFilter);
    }
    
    // Filter by client
    if (clientFilter.trim()) {
      const reservations = getReservationsForDate(date);
      const filteredReservations = reservations.filter(r => 
        r.clientName.toLowerCase().includes(clientFilter.toLowerCase()) ||
        r.clientEmail.toLowerCase().includes(clientFilter.toLowerCase())
      );
      const serviceIds = [...new Set(filteredReservations.map(r => r.serviceId))];
      services = services.filter(s => serviceIds.includes(s.id));
    }
    
    return services;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const handleDayClick = (date: Date) => {
    const services = getServicesForDate(date);
    if (services.length > 0) {
      setSelectedDate(date);
      setShowDayDetails(true);
      setServiceTypeFilter('all');
      setClientFilter('');
    }
  };

  const handleDeleteService = (service: Service) => {
    setSelectedService(service);
    setShowDeleteServiceDialog(true);
  };

  const confirmDeleteService = () => {
    if (selectedService) {
      toast.success(`Servicio ${selectedService.name} eliminado de la programación`);
      setShowDeleteServiceDialog(false);
      setSelectedService(null);
    }
  };

  const handleDeleteSchedule = () => {
    if (selectedDate) {
      setShowDeleteScheduleDialog(true);
    }
  };

  const confirmDeleteSchedule = () => {
    if (selectedDate) {
      toast.success(`Programación del ${selectedDate.toLocaleDateString('es-CO')} eliminada`);
      setShowDeleteScheduleDialog(false);
      setShowDayDetails(false);
      setSelectedDate(null);
    }
  };

  const handleDownload = async (reservation: SchedulingReservation) => {
    setIsDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(`Reserva ${reservation.bookingNumber} descargada`);
    setIsDownloading(false);
  };

  // Calculate statistics
  const stats = {
    totalReservations: mockReservations.length,
    confirmed: mockReservations.filter(r => r.status === 'confirmed').length,
    pending: mockReservations.filter(r => r.status === 'pending').length,
    completed: mockReservations.filter(r => r.status === 'completed').length,
    totalRevenue: mockReservations.reduce((sum, r) => sum + r.totalAmount, 0),
    paidRevenue: mockReservations.reduce((sum, r) => sum + r.paidAmount, 0),
    pendingRevenue: mockReservations.reduce((sum, r) => sum + r.pendingAmount, 0),
    totalParticipants: mockReservations.reduce((sum, r) => sum + r.participants, 0)
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'in-progress': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-300';
      case 'cancelled': return 'bg-gray-50 text-gray-600 border-gray-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-600';
      case 'partial': return 'bg-amber-50 text-amber-600';
      case 'pending': return 'bg-gray-50 text-gray-600';
      case 'cancelled': return 'bg-red-50 text-red-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'package': return Package;
      case 'route': return RouteIcon;
      case 'farm': return Home;
      default: return Package;
    }
  };

  const getServiceTypeName = (type: string) => {
    switch (type) {
      case 'package': return 'Paquete';
      case 'route': return 'Ruta';
      case 'farm': return 'Finca';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-white to-emerald-50/30 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4"
        >
          <div>
            <h1 className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
              Programación de Servicios
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona servicios turísticos y visualiza todas las reservas asociadas
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateScheduleDialog(true)}
            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Programación
          </Button>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-400 to-green-500 text-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-50 text-sm">Total Reservas</p>
                  <p className="text-3xl mt-2">{stats.totalReservations}</p>
                  <div className="flex items-center gap-1 mt-2 text-emerald-50 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>+15% este mes</span>
                  </div>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <CalendarDays className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Confirmadas</p>
                  <p className="text-3xl text-emerald-500 mt-2">{stats.confirmed}</p>
                  <p className="text-amber-500 text-sm mt-2">{stats.pending} pendientes</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Ingresos Totales</p>
                  <p className="text-2xl text-emerald-500 mt-2">
                    ${(stats.totalRevenue / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-green-500 text-sm mt-2">
                    ${(stats.paidRevenue / 1000000).toFixed(1)}M pagados
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <Banknote className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Participantes</p>
                  <p className="text-3xl text-emerald-500 mt-2">{stats.totalParticipants}</p>
                  <p className="text-gray-600 text-sm mt-2">Este período</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <Users className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-lg border-0 overflow-hidden">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePreviousMonth}
                  className="text-white hover:bg-white/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="text-center">
                  <h2 className="text-xl capitalize">{monthName}</h2>
                  <p className="text-emerald-50 text-sm mt-1">
                    Haz clic en un día para ver los servicios y reservas
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextMonth}
                  className="text-white hover:bg-white/20"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <CardContent className="p-6">
              {/* Day names */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                  <div key={day} className="text-center text-sm text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const date = new Date(year, month, day);
                  const dateString = date.toISOString().split('T')[0];
                  const services = getServicesForDate(date);
                  const reservations = getReservationsForDate(date);
                  const isToday = dateString === new Date().toISOString().split('T')[0];
                  const hasServices = services.length > 0;

                  return (
                    <motion.div
                      key={day}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.005 }}
                      whileHover={{ scale: hasServices ? 1.05 : 1.02 }}
                      className="aspect-square"
                    >
                      <div
                        className={`
                          h-full rounded-lg p-2 transition-all
                          ${isToday ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}
                          ${hasServices 
                            ? 'bg-gradient-to-br from-emerald-50/80 to-green-50/80 border-2 border-emerald-200 cursor-pointer shadow-sm hover:shadow-md hover:border-emerald-300' 
                            : 'bg-white border border-gray-200 hover:bg-gray-50'}
                        `}
                        onClick={() => hasServices && handleDayClick(date)}
                      >
                        <div className="flex flex-col h-full">
                          <span className={`text-sm ${isToday ? 'text-emerald-500' : hasServices ? 'text-emerald-600' : 'text-gray-700'}`}>
                            {day}
                          </span>
                          {hasServices && (
                            <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-hidden">
                              <div className="text-xs text-emerald-600">
                                {services.length} {services.length === 1 ? 'servicio' : 'servicios'}
                              </div>
                              <div className="text-xs text-gray-600">
                                {reservations.length} {reservations.length === 1 ? 'reserva' : 'reservas'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Day Details Sheet */}
      <Sheet open={showDayDetails} onOpenChange={setShowDayDetails}>
        <SheetContent side="right" className="w-full sm:max-w-[900px] p-0 overflow-hidden flex flex-col">
          <SheetHeader className="p-6 pb-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white shrink-0">
            <SheetTitle className="text-white text-2xl">
              {selectedDate && (
                <>
                  {selectedDate.toLocaleDateString('es-CO', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </>
              )}
            </SheetTitle>
            <SheetDescription className="text-emerald-50">
              {selectedDate && getFilteredServices(selectedDate).length} servicios • {selectedDate && getReservationsForDate(selectedDate).length} reservas totales
            </SheetDescription>
          </SheetHeader>

          {/* Filters */}
          <div className="px-6 py-4 bg-emerald-50/50 border-b border-emerald-100 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-emerald-600" />
              <p className="text-sm text-emerald-700">Filtrar programación</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Tipo de Servicio</Label>
                <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                  <SelectTrigger className="h-9 border-emerald-200 focus:ring-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="package">Paquetes</SelectItem>
                    <SelectItem value="route">Rutas</SelectItem>
                    <SelectItem value="farm">Fincas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Cliente</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    className="h-9 pl-9 border-emerald-200 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-6 py-4">
              {selectedDate && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedDate.toISOString()}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4 pb-4"
                  >
                    {getFilteredServices(selectedDate).length === 0 ? (
                      <div className="text-center py-12">
                        <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No hay servicios que coincidan con los filtros</p>
                      </div>
                    ) : (
                      getFilteredServices(selectedDate).map((service, serviceIndex) => {
                        const ServiceIcon = getServiceIcon(service.type);
                        const serviceReservations = getReservationsForService(service.id, selectedDate);
                        const totalParticipants = serviceReservations.reduce((sum, r) => sum + r.participants, 0);

                        return (
                          <motion.div
                            key={service.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: serviceIndex * 0.1 }}
                          >
                            <Card className="border border-emerald-200 overflow-hidden shadow-md">
                              {/* Service Header */}
                              <div className="bg-gradient-to-r from-emerald-400 to-green-400 p-4 text-white">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                      <ServiceIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge className="bg-white/30 text-white border-0">
                                          {getServiceTypeName(service.type)}
                                        </Badge>
                                        <Badge className="bg-emerald-600 text-white border-0">
                                          {serviceReservations.length} {serviceReservations.length === 1 ? 'reserva' : 'reservas'}
                                        </Badge>
                                      </div>
                                      <h3 className="text-lg">{service.name}</h3>
                                      <p className="text-emerald-50 text-sm mt-1">{service.description}</p>
                                      <div className="flex items-center gap-4 mt-2 text-sm">
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-4 h-4" />
                                          <span>{service.duration}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Users className="w-4 h-4" />
                                          <span>{totalParticipants}/{service.capacity}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <DollarSign className="w-4 h-4" />
                                          <span>{formatCurrency(service.price)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteService(service)}
                                    className="text-white hover:bg-white/20"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Reservations */}
                              <div className="p-4">
                                <Accordion type="single" collapsible className="space-y-3">
                                  {serviceReservations.map((reservation) => (
                                    <AccordionItem
                                      key={reservation.id}
                                      value={reservation.id}
                                      className="border border-gray-200 rounded-lg overflow-hidden"
                                    >
                                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between w-full pr-4">
                                          <div className="flex items-center gap-3 text-left">
                                            <Avatar className="h-10 w-10 bg-emerald-50 border border-emerald-200">
                                              <AvatarFallback className="bg-emerald-50 text-emerald-600">
                                                {reservation.clientName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div>
                                              <p className="text-gray-900">{reservation.clientName}</p>
                                              <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm text-emerald-500">{reservation.bookingNumber}</span>
                                                <Badge className={getStatusColor(reservation.status)} variant="outline">
                                                  {reservation.status === 'confirmed' ? 'Confirmada' :
                                                   reservation.status === 'pending' ? 'Pendiente' :
                                                   reservation.status === 'completed' ? 'Completada' : 'Cancelada'}
                                                </Badge>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                              <Users className="w-4 h-4" />
                                              <span>{reservation.participants}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Clock className="w-4 h-4" />
                                              <span>{reservation.startTime}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <ScrollArea className="max-h-[500px] px-4 pb-4 pt-2">
                                          <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-4 mt-2"
                                          >
                                            {/* Client Details */}
                                            <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                              <div>
                                                <p className="text-xs text-gray-600">Documento</p>
                                                <p className="text-sm text-gray-900">{reservation.clientDocument}</p>
                                              </div>
                                              <div>
                                                <p className="text-xs text-gray-600">Teléfono</p>
                                                <p className="text-sm text-gray-900">{reservation.clientPhone}</p>
                                              </div>
                                              <div className="col-span-2">
                                                <p className="text-xs text-gray-600">Email</p>
                                                <p className="text-sm text-gray-900">{reservation.clientEmail}</p>
                                              </div>
                                            </div>

                                            {/* Companions */}
                                            {reservation.companions && reservation.companions.length > 0 && (
                                              <div className="space-y-2">
                                                <h4 className="text-sm text-gray-700 flex items-center gap-2">
                                                  <Users className="w-4 h-4 text-emerald-500" />
                                                  Acompañantes ({reservation.companions.length})
                                                </h4>
                                                <div className="space-y-2">
                                                  {reservation.companions.map((companion) => (
                                                    <motion.div
                                                      key={companion.id}
                                                      initial={{ opacity: 0, x: -10 }}
                                                      animate={{ opacity: 1, x: 0 }}
                                                      className="p-3 bg-blue-50/50 rounded-lg border border-blue-100"
                                                    >
                                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>
                                                          <p className="text-xs text-gray-600">Nombre</p>
                                                          <p className="text-gray-900">{companion.name}</p>
                                                        </div>
                                                        <div>
                                                          <p className="text-xs text-gray-600">Documento</p>
                                                          <p className="text-gray-900">{companion.document}</p>
                                                        </div>
                                                        {companion.age && (
                                                          <div>
                                                            <p className="text-xs text-gray-600">Edad</p>
                                                            <p className="text-gray-900">{companion.age} años</p>
                                                          </div>
                                                        )}
                                                        <div>
                                                          <p className="text-xs text-gray-600">Teléfono</p>
                                                          <p className="text-gray-900">{companion.phone}</p>
                                                        </div>
                                                      </div>
                                                    </motion.div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {/* Guide & Transport */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              {/* Guide */}
                                              {reservation.guide && (
                                                <div className="p-4 bg-green-50/50 rounded-lg border border-green-100">
                                                  <h4 className="text-sm text-gray-700 flex items-center gap-2 mb-2">
                                                    <User className="w-4 h-4 text-green-500" />
                                                    Guía Asignado
                                                  </h4>
                                                  <p className="text-gray-900">{reservation.guide}</p>
                                                  {reservation.guidePhone && (
                                                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                                      <Phone className="w-3 h-3" />
                                                      {reservation.guidePhone}
                                                    </p>
                                                  )}
                                                </div>
                                              )}

                                              {/* Transport */}
                                              {reservation.transport && (
                                                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                                                  <h4 className="text-sm text-gray-700 flex items-center gap-2 mb-2">
                                                    <Bus className="w-4 h-4 text-blue-500" />
                                                    Transporte
                                                  </h4>
                                                  <p className="text-gray-900">{reservation.transport.type}</p>
                                                  <div className="text-sm text-gray-600 mt-2 space-y-1">
                                                    <p>Conductor: {reservation.transport.driver}</p>
                                                    <p>Placa: {reservation.transport.plate}</p>
                                                    <p>Punto: {reservation.transport.pickupLocation}</p>
                                                    <p>Hora: {reservation.transport.pickupTime}</p>
                                                  </div>
                                                </div>
                                              )}
                                            </div>

                                            {/* Payment */}
                                            <div className="p-4 bg-gradient-to-r from-emerald-50/50 to-green-50/50 rounded-lg border border-emerald-100">
                                              <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm text-gray-700 flex items-center gap-2">
                                                  <DollarSign className="w-4 h-4 text-emerald-500" />
                                                  Información de Pago
                                                </h4>
                                                <Badge className={getPaymentStatusColor(reservation.paymentStatus)}>
                                                  {reservation.paymentStatus === 'paid' ? 'Pagado' :
                                                   reservation.paymentStatus === 'partial' ? 'Parcial' :
                                                   reservation.paymentStatus === 'pending' ? 'Pendiente' : 'Cancelado'}
                                                </Badge>
                                              </div>
                                              <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                  <p className="text-gray-600">Total</p>
                                                  <p className="text-gray-900">{formatCurrency(reservation.totalAmount)}</p>
                                                </div>
                                                <div>
                                                  <p className="text-gray-600">Pagado</p>
                                                  <p className="text-emerald-500">{formatCurrency(reservation.paidAmount)}</p>
                                                </div>
                                                <div>
                                                  <p className="text-gray-600">Pendiente</p>
                                                  <p className="text-amber-500">{formatCurrency(reservation.pendingAmount)}</p>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Notes */}
                                            {reservation.notes && (
                                              <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100">
                                                <h4 className="text-sm text-gray-700 flex items-center gap-2 mb-2">
                                                  <FileText className="w-4 h-4 text-amber-500" />
                                                  Notas Especiales
                                                </h4>
                                                <p className="text-sm text-gray-700">{reservation.notes}</p>
                                              </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex items-center justify-end gap-2 pt-2 border-t">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDownload(reservation)}
                                                disabled={isDownloading}
                                                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                              >
                                                {isDownloading ? (
                                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                ) : (
                                                  <Download className="w-4 h-4 mr-2" />
                                                )}
                                                Descargar
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                              >
                                                <Edit className="w-4 h-4 mr-2" />
                                                Editar
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                              >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Eliminar
                                              </Button>
                                            </div>
                                          </motion.div>
                                        </ScrollArea>
                                      </AccordionContent>
                                    </AccordionItem>
                                  ))}
                                </Accordion>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 bg-gray-50 border-t flex items-center justify-between shrink-0">
            <Button
              variant="outline"
              onClick={handleDeleteSchedule}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Programación Completa
            </Button>
            <Button
              onClick={() => setShowDayDetails(false)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Cerrar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Service Dialog */}
      <AlertDialog open={showDeleteServiceDialog} onOpenChange={setShowDeleteServiceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-600">
              ¿Eliminar servicio de la programación?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar el servicio <span className="text-gray-900">{selectedService?.name}</span> de la programación.
              Todas las reservas asociadas también serán eliminadas. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteService}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Eliminar Servicio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Schedule Dialog */}
      <AlertDialog open={showDeleteScheduleDialog} onOpenChange={setShowDeleteScheduleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-600">
              ¿Eliminar programación completa?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar toda la programación del {selectedDate?.toLocaleDateString('es-CO')}.
              Se eliminarán todos los servicios y reservas de ese día. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSchedule}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Eliminar Programación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Schedule Dialog */}
      <Dialog open={showCreateScheduleDialog} onOpenChange={setShowCreateScheduleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-600">Nueva Programación</DialogTitle>
            <DialogDescription>
              Programa un nuevo servicio turístico en el calendario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Servicio</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="package">Paquete Turístico</SelectItem>
                    <SelectItem value="route">Ruta</SelectItem>
                    <SelectItem value="farm">Finca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Servicio</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar servicio..." />
                </SelectTrigger>
                <SelectContent>
                  {mockServices.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora de Inicio</Label>
                <Input type="time" />
              </div>
              <div className="space-y-2">
                <Label>Hora de Fin</Label>
                <Input type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas Adicionales</Label>
              <Textarea placeholder="Detalles adicionales sobre la programación..." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateScheduleDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast.success('Programación creada exitosamente');
                setShowCreateScheduleDialog(false);
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Programación
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
