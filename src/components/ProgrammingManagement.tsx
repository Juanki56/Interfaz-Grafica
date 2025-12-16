import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Plus,
  Search,
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
  Bus
} from 'lucide-react';
import { ProgrammingFormImproved } from './ProgrammingFormImproved';
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
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';

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
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  additionalServices: AdditionalService[];
  notes?: string;
  createdAt: string;
  createdBy: string;
}

interface ProgrammingManagementProps {
  role: 'admin' | 'advisor' | 'guide' | 'client';
  userId?: string;
  userName?: string;
}

export function ProgrammingManagement({ role, userId, userName }: ProgrammingManagementProps) {
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
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProgramming, setSelectedProgramming] = useState<Programming | null>(null);
  
  const itemsPerPage = 4; // Paginación de 4 items

  // Permisos según rol
  const canCreate = role === 'admin' || role === 'advisor';
  const canEdit = role === 'admin' || role === 'advisor';
  const canDelete = role === 'admin';
  const canChangeStatus = role === 'admin' || role === 'guide';
  const canViewDetails = true; // Todos los roles pueden ver detalles completos

  // Filtrar programaciones
  const getFilteredProgrammings = () => {
    let filtered = programmings;

    // Si es cliente, solo ver sus propias programaciones
    if (role === 'client') {
      filtered = filtered.filter(p => 
        p.clients.some(c => c.name === userName)
      );
    }

    // Si es guía, solo ver las programaciones asignadas a él
    if (role === 'guide') {
      filtered = filtered.filter(p => p.guideName === userName);
    }

    // Aplicar filtros
    filtered = filtered.filter(prog => {
      const matchesSearch = 
        prog.programId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prog.guideName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prog.routes.some(r => r.routeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        prog.clients.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || prog.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    return filtered;
  };

  const filteredProgrammings = getFilteredProgrammings();

  // Paginación
  const totalPages = Math.ceil(filteredProgrammings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProgrammings = filteredProgrammings.slice(startIndex, endIndex);

  // Handlers
  const handleView = (programming: Programming) => {
    setSelectedProgramming(programming);
    setIsViewModalOpen(true);
  };

  const handleEdit = (programming: Programming) => {
    setSelectedProgramming(programming);
    setIsEditModalOpen(true);
  };

  const handleDelete = () => {
    if (selectedProgramming) {
      setProgrammings(programmings.filter(p => p.id !== selectedProgramming.id));
      toast.success('Programación eliminada exitosamente');
      setIsDeleteDialogOpen(false);
      setSelectedProgramming(null);
    }
  };

  const handleStatusChange = (programmingId: string, newStatus: Programming['status']) => {
    setProgrammings(programmings.map(p => 
      p.id === programmingId ? { ...p, status: newStatus } : p
    ));
    toast.success('Estado actualizado exitosamente');
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
                              {new Date(route.date).toLocaleDateString('es-ES')} • {route.startTime} - {route.endTime}
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
            {filteredProgrammings.length > 0 && (
              <p className="text-sm text-green-700 mt-2">
                {filteredProgrammings.length} {filteredProgrammings.length === 1 ? 'programación encontrada' : 'programaciones encontradas'}
              </p>
            )}
          </div>

          {canCreate && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-green-700 hover:bg-green-800">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Programación
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-700 w-4 h-4" />
            <Input
              placeholder="Buscar por ID, cliente, guía o ruta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-green-300 focus:border-green-500"
            />
          </div>
        </div>
      </motion.div>

      {/* Tabla Compacta */}
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
                  <TableHead className="w-32">Ruta Principal</TableHead>
                  <TableHead className="w-28">Fecha</TableHead>
                  <TableHead className="w-32">Guía</TableHead>
                  <TableHead className="w-24 text-center">Clientes</TableHead>
                  <TableHead className="w-24 text-center">Particip.</TableHead>
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
                            {new Date(prog.routes[0].date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm truncate">{prog.guideName}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {prog.clients.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="w-3 h-3 text-gray-500" />
                          <span className="text-sm">{getTotalParticipants(prog.clients)}</span>
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
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(prog)}
                              className="h-8 w-8 p-0 hover:bg-green-50"
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
                    <TableCell colSpan={8} className="text-center py-12">
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

      {/* Paginación */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
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
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={
                  currentPage === page
                    ? "bg-green-600 hover:bg-green-700"
                    : "border-green-300 hover:bg-green-50"
                }
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

      {/* Modal Crear */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle className="text-green-800">Crear Nueva Programación</DialogTitle>
            <DialogDescription>
              Complete los datos paso a paso para crear una nueva programación de ruta turística
            </DialogDescription>
          </DialogHeader>
          <ProgrammingFormImproved
            onClose={() => setIsCreateModalOpen(false)}
            availableRoutes={availableRoutes}
            availableClients={availableClients}
            availableGuides={availableGuides}
            serviceOptions={serviceOptions}
            onSubmit={(formData) => {
              const selectedClients = availableClients.filter(c => formData.clientIds.includes(c.id));
              const selectedGuide = availableGuides.find(g => g.id === formData.guideId);
              const selectedServices = serviceOptions.filter(s => formData.serviceIds.includes(s.id));
              
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
                createdBy: userName || 'Sistema'
              };
              setProgrammings([newProgramming, ...programmings]);
              toast.success('Programación creada exitosamente');
              setIsCreateModalOpen(false);
            }}
            userName={userName}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle className="text-green-800">Editar Programación</DialogTitle>
            <DialogDescription>
              Modifique los datos de la programación paso a paso
            </DialogDescription>
          </DialogHeader>
          {selectedProgramming && (
            <ProgrammingFormImproved
              programming={selectedProgramming}
              onClose={() => setIsEditModalOpen(false)}
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
                setIsEditModalOpen(false);
              }}
              userName={userName}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalles */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {role === 'guide' ? `Detalles de tu Programación - ${selectedProgramming?.programId}` : 
               role === 'client' ? `Detalles de tu Programación - ${selectedProgramming?.programId}` : 
               `Detalles de la Programación - ${selectedProgramming?.programId}`}
            </DialogTitle>
            <DialogDescription>
              {role === 'guide' ? 'Información completa de la programación donde estás asignado como guía' : 
               role === 'client' ? 'Información completa de tu programación, grupo y ruta asignada' : 
               'Información completa de la programación'}
            </DialogDescription>
          </DialogHeader>
          {selectedProgramming && (
            <ScrollArea className="max-h-[70vh] pr-4">
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
                              <Label className="text-green-700">Fecha y Hora</Label>
                              <p className="font-medium text-green-900">
                                {new Date(selectedProgramming.routes[0].date).toLocaleDateString('es-ES', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })} - {selectedProgramming.routes[0].startTime}
                              </p>
                            </div>
                            {role === 'client' && (
                              <div>
                                <Label className="text-green-700">Guía</Label>
                                <p className="font-medium text-green-900">{selectedProgramming.guideName}</p>
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
                              <Label className="text-gray-500">Hora de Encuentro</Label>
                              <p className="font-medium text-green-700">{route.startTime}</p>
                            </div>
                            <div>
                              <Label className="text-gray-500">Hora de Finalización</Label>
                              <p className="font-medium">{route.endTime}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

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
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center">
                        <User className="w-6 h-6 text-orange-700" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">{selectedProgramming.guideName}</p>
                        {role === 'guide' && selectedProgramming.guideName === userName && (
                          <Badge className="bg-orange-600 text-white mt-1">TÚ</Badge>
                        )}
                      </div>
                    </div>
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
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

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
