import React, { useState } from 'react';
import { 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle, 
  Navigation,
  Phone,
  Star,
  User,
  Route,
  Package,
  DollarSign,
  Bus,
  AlertCircle,
  Calendar,
  Mail,
  Eye,
  Download,
  Loader2,
  ChevronRight,
  TrendingUp,
  CalendarDays,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Search } from 'lucide-react';

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

interface GuideReservation {
  id: string;
  bookingNumber: string;
  serviceType: 'route' | 'package';
  serviceName: string;
  serviceDescription: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientDocument: string;
  date: string;
  startTime: string;
  endTime: string;
  participants: number;
  companions?: Companion[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
  status: 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  guideStatus: 'available' | 'unavailable';
  transport?: TransportInfo;
  meetingPoint: string;
  notes: string;
  difficulty?: string;
  distance?: string;
  duration?: string;
  createdAt: string;
  updatedAt: string;
}

export function GuideDashboard({ initialTab = 'routes' }: { initialTab?: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<GuideReservation | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - Reservas asignadas al guía
  const myReservations: GuideReservation[] = [
    {
      id: '1',
      bookingNumber: 'OCC-2025-001',
      serviceType: 'package',
      serviceName: 'Tour Cafetero Premium',
      serviceDescription: 'Paquete completo que incluye visita a 3 fincas cafeteras, degustación profesional de café, almuerzo típico colombiano y transporte incluido',
      clientName: 'Juan Carlos Pérez Rodríguez',
      clientEmail: 'juan.perez@email.com',
      clientPhone: '+57 320 555 0123',
      clientDocument: '1234567890',
      date: '2025-10-27',
      startTime: '08:00',
      endTime: '18:00',
      participants: 4,
      companions: [
        { id: 'c1', name: 'María Pérez', document: '9876543210', phone: '+57 310 555 0001', email: 'maria.p@email.com', age: 35 },
        { id: 'c2', name: 'Carlos Pérez Jr.', document: '5554443330', phone: '+57 315 555 0002', age: 12 },
        { id: 'c3', name: 'Ana Sofía Pérez', document: '1112223330', phone: '+57 318 555 0003', age: 8 }
      ],
      totalAmount: 790000,
      paidAmount: 790000,
      pendingAmount: 0,
      paymentStatus: 'paid',
      status: 'confirmed',
      guideStatus: 'available',
      transport: {
        type: 'Bus Turístico',
        plate: 'ABC-123',
        driver: 'Pedro Gómez',
        driverPhone: '+57 310 555 8888',
        pickupLocation: 'Hotel Plaza Mayor',
        pickupTime: '07:30',
        capacity: 25
      },
      meetingPoint: 'Hotel Plaza Mayor - Recepción Principal',
      notes: 'Cliente solicita guía en inglés. Requiere menú vegetariano para 2 personas. Familia con niños pequeños.',
      difficulty: 'Fácil',
      duration: '10 horas',
      createdAt: '2025-10-15T10:30:00',
      updatedAt: '2025-10-20T14:20:00'
    },
    {
      id: '2',
      bookingNumber: 'OCC-2025-002',
      serviceType: 'route',
      serviceName: 'Ruta de los Colibríes',
      serviceDescription: 'Experiencia de avistamiento de aves en reserva natural. Incluye caminata guiada de 5 horas, equipo de observación y refrigerio.',
      clientName: 'María González Sánchez',
      clientEmail: 'maria.g@email.com',
      clientPhone: '+57 310 555 0456',
      clientDocument: '9876543210',
      date: '2025-10-28',
      startTime: '06:00',
      endTime: '14:00',
      participants: 2,
      companions: [
        { id: 'c4', name: 'Jorge González', document: '7776665550', phone: '+57 320 555 0004', email: 'jorge.g@email.com', age: 42 }
      ],
      totalAmount: 130000,
      paidAmount: 130000,
      pendingAmount: 0,
      paymentStatus: 'paid',
      status: 'confirmed',
      guideStatus: 'available',
      transport: {
        type: 'Camioneta 4x4',
        plate: 'XYZ-789',
        driver: 'Luis Martínez',
        driverPhone: '+57 318 555 6666',
        pickupLocation: 'Terminal de Transportes',
        pickupTime: '05:30',
        capacity: 7
      },
      meetingPoint: 'Terminal de Transportes - Entrada Principal',
      notes: 'Pareja de observadores de aves experimentados. Traen equipo propio de fotografía.',
      difficulty: 'Moderado',
      distance: '8 km',
      duration: '5 horas',
      createdAt: '2025-10-10T09:15:00',
      updatedAt: '2025-10-18T11:30:00'
    },
    {
      id: '3',
      bookingNumber: 'OCC-2025-004',
      serviceType: 'route',
      serviceName: 'Sendero del Café y las Mariposas',
      serviceDescription: 'Ruta ecológica que combina plantaciones de café con mariposario natural. Incluye degustación de café y almuerzo campestre.',
      clientName: 'Andrea López Ramírez',
      clientEmail: 'andrea.lopez@email.com',
      clientPhone: '+57 318 555 0654',
      clientDocument: '4445556660',
      date: '2025-11-02',
      startTime: '09:00',
      endTime: '15:00',
      participants: 3,
      companions: [
        { id: 'c10', name: 'Patricia López', document: '8887776660', phone: '+57 300 555 0010', age: 29 },
        { id: 'c11', name: 'Daniela Ramírez', document: '7776665550', phone: '+57 310 555 0011', age: 31 }
      ],
      totalAmount: 255000,
      paidAmount: 100000,
      pendingAmount: 155000,
      paymentStatus: 'partial',
      status: 'confirmed',
      guideStatus: 'available',
      meetingPoint: 'Finca La Esperanza - Entrada Principal',
      notes: 'Grupo vegetariano. Solicitan menú especial sin productos de origen animal. Todas tienen experiencia en senderismo.',
      difficulty: 'Fácil',
      distance: '6 km',
      duration: '6 horas',
      createdAt: '2025-10-18T13:30:00',
      updatedAt: '2025-10-22T10:15:00'
    },
    {
      id: '4',
      bookingNumber: 'OCC-2025-005',
      serviceType: 'package',
      serviceName: 'Aventura Extrema Full Day',
      serviceDescription: 'Paquete de aventura completo con rafting clase III, canopy (8 líneas), rappel de 40m y almuerzo campestre. Incluye todo el equipo de seguridad.',
      clientName: 'Miguel Ángel Torres',
      clientEmail: 'miguel.torres@email.com',
      clientPhone: '+57 300 555 0321',
      clientDocument: '7778889990',
      date: '2025-11-05',
      startTime: '07:00',
      endTime: '19:00',
      participants: 8,
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
      guideStatus: 'available',
      transport: {
        type: 'Bus Aventura',
        plate: 'DEF-456',
        driver: 'Santiago Vargas',
        driverPhone: '+57 315 555 4444',
        pickupLocation: 'Parque Principal',
        pickupTime: '06:30',
        capacity: 15
      },
      meetingPoint: 'Parque Principal - Monumento Central',
      notes: 'Grupo joven para actividades de aventura. Todos firmaron deslinde de responsabilidad. Verificar condiciones climáticas.',
      difficulty: 'Avanzado',
      duration: '12 horas',
      createdAt: '2025-10-05T11:00:00',
      updatedAt: '2025-10-25T16:00:00'
    },
    {
      id: '5',
      bookingNumber: 'OCC-2025-007',
      serviceType: 'route',
      serviceName: 'Cascadas del Bosque Nublado',
      serviceDescription: 'Caminata de alta montaña hacia cascadas escondidas en bosque nublado. Dificultad alta, requiere buena condición física.',
      clientName: 'Carlos Mendoza Suárez',
      clientEmail: 'carlos.mendoza@email.com',
      clientPhone: '+57 315 555 0987',
      clientDocument: '3334445550',
      date: '2025-11-08',
      startTime: '05:00',
      endTime: '16:00',
      participants: 5,
      companions: [
        { id: 'c19', name: 'Lucía Mendoza', document: '2223334440', phone: '+57 320 555 0019', age: 28 },
        { id: 'c20', name: 'Roberto Suárez', document: '1112223330', phone: '+57 310 555 0020', age: 32 },
        { id: 'c21', name: 'Elena Vargas', document: '9998887770', phone: '+57 318 555 0021', age: 30 },
        { id: 'c22', name: 'Diego Castro', document: '8887776660', phone: '+57 300 555 0022', age: 35 }
      ],
      totalAmount: 425000,
      paidAmount: 200000,
      pendingAmount: 225000,
      paymentStatus: 'partial',
      status: 'confirmed',
      guideStatus: 'available',
      transport: {
        type: 'Camioneta 4x4 Doble Cabina',
        plate: 'GHI-789',
        driver: 'Javier Rojas',
        driverPhone: '+57 315 555 3333',
        pickupLocation: 'Hostal Montaña Alta',
        pickupTime: '04:30',
        capacity: 8
      },
      meetingPoint: 'Hostal Montaña Alta - Área de Parqueo',
      notes: 'Grupo experimentado en montañismo. Todos con equipo propio. Verificar pronóstico para niebla densa.',
      difficulty: 'Avanzado',
      distance: '14 km',
      duration: '11 horas',
      createdAt: '2025-10-20T14:00:00',
      updatedAt: '2025-10-23T09:30:00'
    },
    {
      id: '6',
      bookingNumber: 'OCC-2025-009',
      serviceType: 'package',
      serviceName: 'Experiencia Cultural Indígena',
      serviceDescription: 'Paquete cultural que incluye visita a comunidad indígena, participación en ritual tradicional, artesanías y almuerzo típico comunitario.',
      clientName: 'Isabella Fernández',
      clientEmail: 'isabella.f@email.com',
      clientPhone: '+57 310 555 0246',
      clientDocument: '6667778880',
      date: '2025-11-10',
      startTime: '08:30',
      endTime: '17:30',
      participants: 6,
      companions: [
        { id: 'c23', name: 'Antonio Fernández', document: '5556667770', phone: '+57 320 555 0023', age: 48 },
        { id: 'c24', name: 'Sofía Fernández', document: '4445556660', phone: '+57 315 555 0024', age: 16 },
        { id: 'c25', name: 'Mateo Fernández', document: '3334445550', phone: '+57 318 555 0025', age: 14 },
        { id: 'c26', name: 'Clara Jiménez', document: '2223334440', phone: '+57 300 555 0026', age: 70 },
        { id: 'c27', name: 'José Jiménez', document: '1112223330', phone: '+57 310 555 0027', age: 72 }
      ],
      totalAmount: 540000,
      paidAmount: 540000,
      pendingAmount: 0,
      paymentStatus: 'paid',
      status: 'confirmed',
      guideStatus: 'available',
      transport: {
        type: 'Van Turística',
        plate: 'JKL-012',
        driver: 'Martha Lucía',
        driverPhone: '+57 318 555 2222',
        pickupLocation: 'Hotel Centro Histórico',
        pickupTime: '08:00',
        capacity: 12
      },
      meetingPoint: 'Hotel Centro Histórico - Lobby',
      notes: 'Familia multigeneracional interesada en cultura. Abuelos requieren ritmo pausado. Traducción al inglés requerida.',
      difficulty: 'Fácil',
      duration: '9 horas',
      createdAt: '2025-10-22T10:45:00',
      updatedAt: '2025-10-24T15:20:00'
    },
    {
      id: '7',
      bookingNumber: 'OCC-2025-011',
      serviceType: 'route',
      serviceName: 'Sendero de los Frailejones',
      serviceDescription: 'Ruta de páramo alto para observación de frailejones y fauna endémica. Incluye explicación botánica detallada.',
      clientName: 'Fernando Ruiz García',
      clientEmail: 'fernando.ruiz@email.com',
      clientPhone: '+57 320 555 0135',
      clientDocument: '9998887770',
      date: '2025-11-12',
      startTime: '06:30',
      endTime: '13:30',
      participants: 4,
      companions: [
        { id: 'c28', name: 'Adriana García', document: '8887776660', phone: '+57 315 555 0028', age: 38 },
        { id: 'c29', name: 'Julián Ruiz', document: '7776665550', phone: '+57 310 555 0029', age: 15 },
        { id: 'c30', name: 'Martín Ruiz', document: '6665554440', phone: '+57 318 555 0030', age: 12 }
      ],
      totalAmount: 340000,
      paidAmount: 170000,
      pendingAmount: 170000,
      paymentStatus: 'partial',
      status: 'confirmed',
      guideStatus: 'available',
      meetingPoint: 'Centro de Visitantes Páramo - Estacionamiento',
      notes: 'Familia interesada en botánica. Padre es biólogo. Niños con experiencia en caminatas de altura.',
      difficulty: 'Moderado',
      distance: '10 km',
      duration: '7 horas',
      createdAt: '2025-10-25T11:15:00',
      updatedAt: '2025-10-26T14:45:00'
    },
    {
      id: '8',
      bookingNumber: 'OCC-2025-013',
      serviceType: 'package',
      serviceName: 'Experiencia Nocturna en la Selva',
      serviceDescription: 'Paquete de aventura nocturna que incluye caminata guiada, observación de fauna nocturna, fogata y cena bajo las estrellas.',
      clientName: 'Valentina Morales',
      clientEmail: 'valentina.m@email.com',
      clientPhone: '+57 310 555 0579',
      clientDocument: '4445556660',
      date: '2025-11-15',
      startTime: '17:00',
      endTime: '23:30',
      participants: 10,
      companions: [
        { id: 'c31', name: 'Sebastián Morales', document: '3334445550', phone: '+57 320 555 0031', age: 26 },
        { id: 'c32', name: 'Camila Torres', document: '2223334440', phone: '+57 315 555 0032', age: 24 },
        { id: 'c33', name: 'Daniel Reyes', document: '1112223330', phone: '+57 318 555 0033', age: 28 },
        { id: 'c34', name: 'Laura Sánchez', document: '9998887770', phone: '+57 300 555 0034', age: 25 },
        { id: 'c35', name: 'Andrés Gómez', document: '8887776660', phone: '+57 310 555 0035', age: 27 },
        { id: 'c36', name: 'Carolina Díaz', document: '7776665550', phone: '+57 315 555 0036', age: 23 },
        { id: 'c37', name: 'Felipe Martínez', document: '6665554440', phone: '+57 318 555 0037', age: 29 },
        { id: 'c38', name: 'Natalia Castro', document: '5554443330', phone: '+57 320 555 0038', age: 26 },
        { id: 'c39', name: 'Jorge Herrera', document: '4443332220', phone: '+57 310 555 0039', age: 30 }
      ],
      totalAmount: 950000,
      paidAmount: 950000,
      pendingAmount: 0,
      paymentStatus: 'paid',
      status: 'confirmed',
      guideStatus: 'available',
      transport: {
        type: 'Bus Turístico',
        plate: 'MNO-345',
        driver: 'Ricardo Pérez',
        driverPhone: '+57 315 555 1111',
        pickupLocation: 'Plaza de Bolívar',
        pickupTime: '16:30',
        capacity: 20
      },
      meetingPoint: 'Plaza de Bolívar - Estatua Principal',
      notes: 'Grupo de amigos jóvenes. Primera experiencia nocturna en selva para todos. Llevar linternas y repelente extra.',
      difficulty: 'Moderado',
      duration: '6.5 horas',
      createdAt: '2025-10-28T16:30:00',
      updatedAt: '2025-10-29T10:00:00'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleViewDetails = (reservation: GuideReservation) => {
    setSelectedReservation(reservation);
    setShowDetailsDialog(true);
  };

  const handleDownload = async (reservation: GuideReservation) => {
    setIsDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(`Información de ${reservation.bookingNumber} descargada`);
    setIsDownloading(false);
  };

  const handleChangeStatus = (reservation: GuideReservation, newStatus: 'available' | 'unavailable') => {
    toast.success(`Estado cambiado a ${newStatus === 'available' ? 'Disponible' : 'No Disponible'}`);
  };

  // Filter reservations
  const filteredReservations = myReservations.filter(reservation => {
    const matchesSearch = 
      reservation.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    totalReservations: myReservations.length,
    confirmed: myReservations.filter(r => r.status === 'confirmed').length,
    completed: myReservations.filter(r => r.status === 'completed').length,
    totalParticipants: myReservations.reduce((sum, r) => sum + r.participants, 0),
    routesCount: myReservations.filter(r => r.serviceType === 'route').length,
    packagesCount: myReservations.filter(r => r.serviceType === 'package').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-600 text-white border-green-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700';
      case 'partial': return 'bg-amber-100 text-amber-700';
      case 'pending': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    if (!difficulty) return 'bg-gray-100 text-gray-700';
    switch (difficulty.toLowerCase()) {
      case 'fácil': return 'bg-emerald-100 text-emerald-700';
      case 'moderado': return 'bg-amber-100 text-amber-700';
      case 'avanzado': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4"
        >
          <div>
            <h1 className="bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
              Panel del Guía Turístico
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona tus rutas y paquetes asignados
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-600 text-white px-4 py-2">
              <Star className="w-4 h-4 mr-2" />
              Calificación: 4.9 ⭐
            </Badge>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Mis Reservas</p>
                  <p className="text-3xl mt-2">{stats.totalReservations}</p>
                  <div className="flex items-center gap-1 mt-2 text-emerald-100 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>{stats.confirmed} confirmadas</span>
                  </div>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <CalendarDays className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Rutas Asignadas</p>
                  <p className="text-3xl text-emerald-600 mt-2">{stats.routesCount}</p>
                  <p className="text-gray-600 text-sm mt-2">Rutas activas</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <Route className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Paquetes</p>
                  <p className="text-3xl text-emerald-600 mt-2">{stats.packagesCount}</p>
                  <p className="text-gray-600 text-sm mt-2">Paquetes asignados</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <Package className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Participantes</p>
                  <p className="text-3xl text-emerald-600 mt-2">{stats.totalParticipants}</p>
                  <p className="text-gray-600 text-sm mt-2">Total personas</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <Users className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-lg border-0">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    placeholder="Buscar por cliente, servicio o número de reserva..." 
                    className="pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-48 border-gray-200">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="confirmed">Confirmadas</SelectItem>
                    <SelectItem value="in-progress">En Progreso</SelectItem>
                    <SelectItem value="completed">Completadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reservations List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
              <CardTitle className="text-emerald-800 flex items-center gap-2">
                <CalendarDays className="w-6 h-6" />
                Mis Rutas y Reservas Asignadas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {filteredReservations.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-gray-700 mb-2">No se encontraron reservas</h3>
                  <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReservations.map((reservation, index) => (
                    <motion.div
                      key={reservation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      className="p-6 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => handleViewDetails(reservation)}
                    >
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 rounded-lg ${
                                reservation.serviceType === 'route' ? 'bg-emerald-100' : 'bg-blue-100'
                              }`}>
                                {reservation.serviceType === 'route' ? (
                                  <Route className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <Package className="w-5 h-5 text-blue-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-emerald-600">{reservation.bookingNumber}</span>
                                  <Badge className={getStatusColor(reservation.status)} variant="outline">
                                    {reservation.status === 'confirmed' ? 'Confirmada' :
                                     reservation.status === 'in-progress' ? 'En Progreso' :
                                     reservation.status === 'completed' ? 'Completada' : 'Cancelada'}
                                  </Badge>
                                  <Badge variant="outline" className="bg-white">
                                    {reservation.serviceType === 'route' ? 'Ruta' : 'Paquete'}
                                  </Badge>
                                  {reservation.difficulty && (
                                    <Badge className={getDifficultyColor(reservation.difficulty)} variant="outline">
                                      {reservation.difficulty}
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="text-gray-900 mt-1">{reservation.serviceName}</h3>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Select
                              value={reservation.guideStatus}
                              onValueChange={(value) => handleChangeStatus(reservation, value as 'available' | 'unavailable')}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="available">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Disponible
                                  </div>
                                </SelectItem>
                                <SelectItem value="unavailable">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    No Disponible
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Main Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Date & Time */}
                          <div className="p-3 bg-emerald-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm text-emerald-700">Fecha y Hora</span>
                            </div>
                            <p className="text-gray-900">
                              {new Date(reservation.date).toLocaleDateString('es-CO', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {reservation.startTime} - {reservation.endTime}
                            </p>
                            {reservation.duration && (
                              <p className="text-xs text-emerald-600 mt-1">
                                Duración: {reservation.duration}
                              </p>
                            )}
                          </div>

                          {/* Client */}
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-blue-700">Cliente</span>
                            </div>
                            <p className="text-gray-900 truncate">{reservation.clientName}</p>
                            <p className="text-sm text-gray-600 truncate">{reservation.clientPhone}</p>
                            {reservation.companions && (
                              <p className="text-xs text-blue-600 mt-1">
                                +{reservation.companions.length} acompañantes
                              </p>
                            )}
                          </div>

                          {/* Participants */}
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-4 h-4 text-purple-600" />
                              <span className="text-sm text-purple-700">Grupo</span>
                            </div>
                            <p className="text-2xl text-gray-900">{reservation.participants}</p>
                            <p className="text-sm text-gray-600">personas</p>
                            {reservation.distance && (
                              <p className="text-xs text-purple-600 mt-1">
                                {reservation.distance}
                              </p>
                            )}
                          </div>

                          {/* Payment */}
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-700">Pago</span>
                            </div>
                            <p className="text-gray-900">{formatCurrency(reservation.totalAmount)}</p>
                            <Badge className={`${getPaymentStatusColor(reservation.paymentStatus)} text-xs mt-1`}>
                              {reservation.paymentStatus === 'paid' ? 'Pagado' :
                               reservation.paymentStatus === 'partial' ? 'Parcial' : 'Pendiente'}
                            </Badge>
                          </div>
                        </div>

                        {/* Meeting Point & Transport */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                            <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-amber-700 mb-1">Punto de Encuentro</p>
                              <p className="text-gray-900">{reservation.meetingPoint}</p>
                            </div>
                          </div>

                          {reservation.transport && (
                            <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                              <Bus className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-indigo-700 mb-1">Transporte</p>
                                <p className="text-gray-900">{reservation.transport.type}</p>
                                <p className="text-sm text-gray-600">
                                  {reservation.transport.driver} - {reservation.transport.pickupTime}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {reservation.notes && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">{reservation.notes}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-600">
                            Actualizado: {new Date(reservation.updatedAt).toLocaleDateString('es-CO')}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(reservation);
                              }}
                              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              disabled={isDownloading}
                            >
                              {isDownloading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Download className="w-4 h-4 mr-2" />
                                  Descargar
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(reservation);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-emerald-700 flex items-center gap-2">
                {selectedReservation?.serviceType === 'route' ? (
                  <Route className="w-5 h-5" />
                ) : (
                  <Package className="w-5 h-5" />
                )}
                Detalles Completos de la Reserva
              </DialogTitle>
              <DialogDescription>
                {selectedReservation?.bookingNumber} - {selectedReservation?.serviceName}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 pr-4">
              {selectedReservation && (
                <div className="space-y-6 py-4">
                  {/* Service Info */}
                  <Card className="border-emerald-200 bg-emerald-50/50">
                    <CardHeader>
                      <CardTitle className="text-emerald-800 flex items-center gap-2">
                        {selectedReservation.serviceType === 'route' ? (
                          <Route className="w-5 h-5" />
                        ) : (
                          <Package className="w-5 h-5" />
                        )}
                        Información del Servicio
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Tipo de Servicio</p>
                        <Badge className="mt-1">
                          {selectedReservation.serviceType === 'route' ? 'Ruta' : 'Paquete'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Nombre</p>
                        <p className="text-gray-900">{selectedReservation.serviceName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Descripción</p>
                        <p className="text-gray-700">{selectedReservation.serviceDescription}</p>
                      </div>
                      {selectedReservation.difficulty && (
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Dificultad</p>
                            <Badge className={getDifficultyColor(selectedReservation.difficulty)}>
                              {selectedReservation.difficulty}
                            </Badge>
                          </div>
                          {selectedReservation.distance && (
                            <div>
                              <p className="text-sm text-gray-600">Distancia</p>
                              <p className="text-gray-900">{selectedReservation.distance}</p>
                            </div>
                          )}
                          {selectedReservation.duration && (
                            <div>
                              <p className="text-sm text-gray-600">Duración</p>
                              <p className="text-gray-900">{selectedReservation.duration}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Client Information */}
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader>
                      <CardTitle className="text-blue-800 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Información del Cliente (Representante)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Nombre Completo</p>
                          <p className="text-gray-900">{selectedReservation.clientName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Documento</p>
                          <p className="text-gray-900">{selectedReservation.clientDocument}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="text-gray-900">{selectedReservation.clientEmail}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Teléfono</p>
                          <p className="text-gray-900">{selectedReservation.clientPhone}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Companions */}
                  {selectedReservation.companions && selectedReservation.companions.length > 0 && (
                    <Card className="border-purple-200 bg-purple-50/50">
                      <CardHeader>
                        <CardTitle className="text-purple-800 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Acompañantes ({selectedReservation.companions.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedReservation.companions.map((companion) => (
                            <div key={companion.id} className="p-4 bg-white rounded-lg border border-purple-100">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <p className="text-sm text-gray-600">Nombre</p>
                                  <p className="text-gray-900">{companion.name}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Documento</p>
                                  <p className="text-gray-900">{companion.document}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Teléfono</p>
                                  <p className="text-gray-900">{companion.phone}</p>
                                </div>
                                {companion.age && (
                                  <div>
                                    <p className="text-sm text-gray-600">Edad</p>
                                    <p className="text-gray-900">{companion.age} años</p>
                                  </div>
                                )}
                              </div>
                              {companion.email && (
                                <div className="mt-2">
                                  <p className="text-sm text-gray-600">Email</p>
                                  <p className="text-gray-900">{companion.email}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Schedule */}
                  <Card className="border-orange-200 bg-orange-50/50">
                    <CardHeader>
                      <CardTitle className="text-orange-800 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Horario y Ubicación
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Fecha</p>
                          <p className="text-gray-900">
                            {new Date(selectedReservation.date).toLocaleDateString('es-CO', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Horario</p>
                          <p className="text-gray-900">
                            {selectedReservation.startTime} - {selectedReservation.endTime}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600">Punto de Encuentro</p>
                          <p className="text-gray-900">{selectedReservation.meetingPoint}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transport */}
                  {selectedReservation.transport && (
                    <Card className="border-indigo-200 bg-indigo-50/50">
                      <CardHeader>
                        <CardTitle className="text-indigo-800 flex items-center gap-2">
                          <Bus className="w-5 h-5" />
                          Información de Transporte
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Tipo de Vehículo</p>
                            <p className="text-gray-900">{selectedReservation.transport.type}</p>
                          </div>
                          {selectedReservation.transport.plate && (
                            <div>
                              <p className="text-sm text-gray-600">Placa</p>
                              <p className="text-gray-900">{selectedReservation.transport.plate}</p>
                            </div>
                          )}
                          {selectedReservation.transport.driver && (
                            <div>
                              <p className="text-sm text-gray-600">Conductor</p>
                              <p className="text-gray-900">{selectedReservation.transport.driver}</p>
                            </div>
                          )}
                          {selectedReservation.transport.driverPhone && (
                            <div>
                              <p className="text-sm text-gray-600">Teléfono Conductor</p>
                              <p className="text-gray-900">{selectedReservation.transport.driverPhone}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-gray-600">Punto de Recogida</p>
                            <p className="text-gray-900">{selectedReservation.transport.pickupLocation}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Hora de Recogida</p>
                            <p className="text-gray-900">{selectedReservation.transport.pickupTime}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Capacidad</p>
                            <p className="text-gray-900">{selectedReservation.transport.capacity} personas</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Payment Info */}
                  <Card className="border-green-200 bg-green-50/50">
                    <CardHeader>
                      <CardTitle className="text-green-800 flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Información de Pago
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="text-xl text-gray-900">{formatCurrency(selectedReservation.totalAmount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Pagado</p>
                            <p className="text-xl text-emerald-600">{formatCurrency(selectedReservation.paidAmount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Pendiente</p>
                            <p className="text-xl text-amber-600">{formatCurrency(selectedReservation.pendingAmount)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Estado de Pago</p>
                          <Badge className={`${getPaymentStatusColor(selectedReservation.paymentStatus)} px-4 py-1`}>
                            {selectedReservation.paymentStatus === 'paid' ? 'Pagado Completo' :
                             selectedReservation.paymentStatus === 'partial' ? 'Pago Parcial' : 'Pago Pendiente'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  {selectedReservation.notes && (
                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-gray-800 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          Notas y Observaciones Importantes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 leading-relaxed">{selectedReservation.notes}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Status */}
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-gray-800 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Estado de la Reserva
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Estado General</p>
                          <Badge className={getStatusColor(selectedReservation.status)}>
                            {selectedReservation.status === 'confirmed' ? 'Confirmada' :
                             selectedReservation.status === 'in-progress' ? 'En Progreso' :
                             selectedReservation.status === 'completed' ? 'Completada' : 'Cancelada'}
                          </Badge>
                        </div>
                        <Separator orientation="vertical" className="h-12" />
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Mi Disponibilidad</p>
                          <Badge className={selectedReservation.guideStatus === 'available' ? 
                            'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                            {selectedReservation.guideStatus === 'available' ? 'Disponible' : 'No Disponible'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Metadata */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p>Creado: {new Date(selectedReservation.createdAt).toLocaleString('es-CO')}</p>
                      </div>
                      <div>
                        <p>Actualizado: {new Date(selectedReservation.updatedAt).toLocaleString('es-CO')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowDetailsDialog(false)}
              >
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  if (selectedReservation) {
                    handleDownload(selectedReservation);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar Info
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
