import React, { useState } from 'react';
import { 
  UtensilsCrossed,
  Coffee,
  Soup,
  Pizza,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  X,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Check,
  AlertCircle,
  ChevronDown,
  Package,
  Route,
  Star,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { DashboardGrid } from './DashboardLayout';
import { toast } from 'sonner';

interface Restaurant {
  id: number;
  name: string;
  mealType: 'desayuno' | 'almuerzo' | 'refrigerio';
  associationType: 'ruta' | 'paquete';
  associatedItem: string;
  status: 'opcional' | 'incluido';
  capacity: number;
  price: number;
  location: string;
  phone: string;
  description: string;
  rating: number;
  specialties: string[];
}

// Mock data
const mockRestaurants: Restaurant[] = [
  {
    id: 1,
    name: 'La Casona del Café',
    mealType: 'desayuno',
    associationType: 'paquete',
    associatedItem: 'Aventura Cafetera Premium',
    status: 'incluido',
    capacity: 40,
    price: 25000,
    location: 'Salento, Quindío',
    phone: '321 456 7890',
    description: 'Restaurante tradicional con vista al valle del Cocora. Especializado en desayunos típicos colombianos.',
    rating: 4.8,
    specialties: ['Arepas', 'Tamales', 'Café orgánico']
  },
  {
    id: 2,
    name: 'El Mirador Andino',
    mealType: 'almuerzo',
    associationType: 'ruta',
    associatedItem: 'Ruta del Cóndor',
    status: 'opcional',
    capacity: 60,
    price: 35000,
    location: 'Villa de Leyva, Boyacá',
    phone: '312 345 6789',
    description: 'Restaurante campestre con vistas panorámicas. Cocina tradicional boyacense.',
    rating: 4.6,
    specialties: ['Trucha', 'Ajiaco', 'Cocido boyacense']
  },
  {
    id: 3,
    name: 'Sabores del Valle',
    mealType: 'almuerzo',
    associationType: 'paquete',
    associatedItem: 'Experiencia Cafetera Completa',
    status: 'incluido',
    capacity: 50,
    price: 32000,
    location: 'Filandia, Quindío',
    phone: '320 987 6543',
    description: 'Cocina fusión con ingredientes locales. Experiencia gastronómica única.',
    rating: 4.9,
    specialties: ['Sancocho', 'Bandeja paisa', 'Postres caseros']
  },
  {
    id: 4,
    name: 'Café & Delicias',
    mealType: 'refrigerio',
    associationType: 'ruta',
    associatedItem: 'Tour Valle del Cocora',
    status: 'opcional',
    capacity: 30,
    price: 15000,
    location: 'Cocora, Quindío',
    phone: '318 234 5678',
    description: 'Cafetería artesanal al pie de las palmas de cera. Ideal para una pausa refrescante.',
    rating: 4.7,
    specialties: ['Café de especialidad', 'Empanadas', 'Jugos naturales']
  },
  {
    id: 5,
    name: 'Fogón Paisa',
    mealType: 'almuerzo',
    associationType: 'ruta',
    associatedItem: 'Ruta del Bambú',
    status: 'incluido',
    capacity: 45,
    price: 28000,
    location: 'Circasia, Quindío',
    phone: '315 876 5432',
    description: 'Comida típica paisa en ambiente rural. Recetas tradicionales de la región.',
    rating: 4.5,
    specialties: ['Frijoles', 'Chicharrón', 'Arepa de chócolo']
  },
  {
    id: 6,
    name: 'El Descanso del Viajero',
    mealType: 'desayuno',
    associationType: 'ruta',
    associatedItem: 'Amanecer en Cocora',
    status: 'opcional',
    capacity: 35,
    price: 20000,
    location: 'Salento, Quindío',
    phone: '317 654 3210',
    description: 'Desayunos caseros con productos de la finca. Ambiente familiar y acogedor.',
    rating: 4.6,
    specialties: ['Pan casero', 'Huevos criollos', 'Chocolate caliente']
  }
];

export function RestaurantManagement() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(mockRestaurants);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMealType, setFilterMealType] = useState<string>('all');
  const [filterAssociation, setFilterAssociation] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Restaurant>>({
    name: '',
    mealType: 'desayuno',
    associationType: 'ruta',
    associatedItem: '',
    status: 'opcional',
    capacity: 0,
    price: 0,
    location: '',
    phone: '',
    description: '',
    rating: 0,
    specialties: []
  });

  // Statistics
  const stats = {
    totalRestaurants: restaurants.length,
    byMealType: {
      desayuno: restaurants.filter(r => r.mealType === 'desayuno').length,
      almuerzo: restaurants.filter(r => r.mealType === 'almuerzo').length,
      refrigerio: restaurants.filter(r => r.mealType === 'refrigerio').length,
    },
    byStatus: {
      incluido: restaurants.filter(r => r.status === 'incluido').length,
      opcional: restaurants.filter(r => r.status === 'opcional').length,
    },
    averageRating: (restaurants.reduce((sum, r) => sum + r.rating, 0) / restaurants.length).toFixed(1),
    totalCapacity: restaurants.reduce((sum, r) => sum + r.capacity, 0),
  };

  // Filter restaurants
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMealType = filterMealType === 'all' || restaurant.mealType === filterMealType;
    const matchesAssociation = filterAssociation === 'all' || restaurant.associationType === filterAssociation;
    const matchesStatus = filterStatus === 'all' || restaurant.status === filterStatus;
    
    return matchesSearch && matchesMealType && matchesAssociation && matchesStatus;
  });

  // Handlers
  const handleCreate = () => {
    const newRestaurant: Restaurant = {
      id: Date.now(),
      ...formData as Restaurant,
    };
    setRestaurants([...restaurants, newRestaurant]);
    setShowCreateModal(false);
    resetForm();
    toast.success('Restaurante creado exitosamente');
  };

  const handleEdit = () => {
    if (selectedRestaurant) {
      setRestaurants(restaurants.map(r => 
        r.id === selectedRestaurant.id ? { ...r, ...formData } : r
      ));
      setShowEditModal(false);
      setSelectedRestaurant(null);
      resetForm();
      toast.success('Restaurante actualizado exitosamente');
    }
  };

  const handleDelete = () => {
    if (selectedRestaurant) {
      setRestaurants(restaurants.filter(r => r.id !== selectedRestaurant.id));
      setShowDeleteModal(false);
      setSelectedRestaurant(null);
      toast.success('Restaurante eliminado exitosamente');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mealType: 'desayuno',
      associationType: 'ruta',
      associatedItem: '',
      status: 'opcional',
      capacity: 0,
      price: 0,
      location: '',
      phone: '',
      description: '',
      rating: 0,
      specialties: []
    });
  };

  const openEditModal = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setFormData(restaurant);
    setShowEditModal(true);
  };

  const openViewModal = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowViewModal(true);
  };

  const openDeleteModal = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDeleteModal(true);
  };

  const getMealTypeIcon = (type: string) => {
    switch(type) {
      case 'desayuno': return Coffee;
      case 'almuerzo': return Soup;
      case 'refrigerio': return Pizza;
      default: return UtensilsCrossed;
    }
  };

  const getMealTypeColor = (type: string) => {
    switch(type) {
      case 'desayuno': return 'bg-orange-100 text-orange-700';
      case 'almuerzo': return 'bg-green-100 text-green-700';
      case 'refrigerio': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'incluido' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-amber-100 text-amber-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // KPI Cards
  const kpis = [
    {
      title: 'Total Restaurantes',
      value: stats.totalRestaurants.toString(),
      icon: UtensilsCrossed,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Capacidad Total',
      value: `${stats.totalCapacity} personas`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Calificación Promedio',
      value: stats.averageRating,
      icon: Star,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      change: '+0.3',
      trend: 'up'
    },
    {
      title: 'Servicios Incluidos',
      value: `${stats.byStatus.incluido}/${stats.totalRestaurants}`,
      icon: Check,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '60%',
      trend: 'up'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Gestión de Restaurantes</h2>
          <p className="text-gray-600 mt-1">Administra los restaurantes asociados a rutas y paquetes turísticos</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Restaurante
        </Button>
      </div>

      {/* KPI Cards */}
      <DashboardGrid cols={4}>
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">{kpi.title}</p>
                    <p className="text-gray-900">{kpi.value}</p>
                    <div className="flex items-center space-x-1">
                      <ArrowUpRight className="w-3 h-3 text-green-600" />
                      <span className="text-sm text-green-600">{kpi.change}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                    <Icon className={`w-6 h-6 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </DashboardGrid>

      {/* Stats Cards */}
      <DashboardGrid cols={3}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Distribución por Tipo de Comida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-orange-600" />
                <span className="text-sm">Desayuno</span>
              </div>
              <span>{stats.byMealType.desayuno}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Soup className="w-4 h-4 text-green-600" />
                <span className="text-sm">Almuerzo</span>
              </div>
              <span>{stats.byMealType.almuerzo}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pizza className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Refrigerio</span>
              </div>
              <span>{stats.byMealType.refrigerio}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Por Tipo de Asociación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Rutas</span>
              </div>
              <span>{restaurants.filter(r => r.associationType === 'ruta').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600" />
                <span className="text-sm">Paquetes</span>
              </div>
              <span>{restaurants.filter(r => r.associationType === 'paquete').length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Por Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm">Incluido</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {stats.byStatus.incluido}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm">Opcional</span>
              </div>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                {stats.byStatus.opcional}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </DashboardGrid>

      {/* Filters and Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <CardTitle className="text-gray-900">Lista de Restaurantes</CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar restaurante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Tipo de Comida</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setFilterMealType('all')}>
                    Todos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMealType('desayuno')}>
                    Desayuno
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMealType('almuerzo')}>
                    Almuerzo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMealType('refrigerio')}>
                    Refrigerio
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Asociación</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setFilterAssociation('all')}>
                    Todos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterAssociation('ruta')}>
                    Rutas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterAssociation('paquete')}>
                    Paquetes
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Estado</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                    Todos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('incluido')}>
                    Incluido
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('opcional')}>
                    Opcional
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Restaurante</TableHead>
                  <TableHead>Tipo de Comida</TableHead>
                  <TableHead>Asociado a</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Calificación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRestaurants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No se encontraron restaurantes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRestaurants.map((restaurant) => {
                    const MealIcon = getMealTypeIcon(restaurant.mealType);
                    return (
                      <TableRow key={restaurant.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                              <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{restaurant.name}</p>
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {restaurant.location}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getMealTypeColor(restaurant.mealType)}>
                            <MealIcon className="w-3 h-3 mr-1" />
                            {restaurant.mealType.charAt(0).toUpperCase() + restaurant.mealType.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">{restaurant.associatedItem}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              {restaurant.associationType === 'ruta' ? (
                                <><Route className="w-3 h-3" />Ruta</>
                              ) : (
                                <><Package className="w-3 h-3" />Paquete</>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusColor(restaurant.status)}>
                            {restaurant.status.charAt(0).toUpperCase() + restaurant.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{restaurant.capacity}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(restaurant.price)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{restaurant.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewModal(restaurant)}
                              className="hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(restaurant)}
                              className="hover:bg-emerald-50 hover:text-emerald-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteModal(restaurant)}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination info */}
          {filteredRestaurants.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <p>
                Mostrando {filteredRestaurants.length} de {restaurants.length} restaurantes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false);
          setShowEditModal(false);
          resetForm();
          setSelectedRestaurant(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showCreateModal ? 'Crear Nuevo Restaurante' : 'Editar Restaurante'}
            </DialogTitle>
            <DialogDescription>
              {showCreateModal 
                ? 'Complete la información del restaurante que desea agregar al sistema.'
                : 'Modifique los datos del restaurante según sea necesario.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nombre del Restaurante *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: La Casona del Café"
                />
              </div>

              <div>
                <Label htmlFor="mealType">Tipo de Comida *</Label>
                <Select 
                  value={formData.mealType} 
                  onValueChange={(value: any) => setFormData({...formData, mealType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desayuno">
                      <div className="flex items-center gap-2">
                        <Coffee className="w-4 h-4 text-orange-600" />
                        Desayuno
                      </div>
                    </SelectItem>
                    <SelectItem value="almuerzo">
                      <div className="flex items-center gap-2">
                        <Soup className="w-4 h-4 text-green-600" />
                        Almuerzo
                      </div>
                    </SelectItem>
                    <SelectItem value="refrigerio">
                      <div className="flex items-center gap-2">
                        <Pizza className="w-4 h-4 text-blue-600" />
                        Refrigerio
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="associationType">Tipo de Asociación *</Label>
                <Select 
                  value={formData.associationType} 
                  onValueChange={(value: any) => setFormData({...formData, associationType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ruta">
                      <div className="flex items-center gap-2">
                        <Route className="w-4 h-4" />
                        Ruta Turística
                      </div>
                    </SelectItem>
                    <SelectItem value="paquete">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Paquete Turístico
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="associatedItem">
                  {formData.associationType === 'ruta' ? 'Ruta Asociada' : 'Paquete Asociado'} *
                </Label>
                <Input
                  id="associatedItem"
                  value={formData.associatedItem}
                  onChange={(e) => setFormData({...formData, associatedItem: e.target.value})}
                  placeholder={formData.associationType === 'ruta' ? 'Ej: Ruta del Cóndor' : 'Ej: Aventura Cafetera Premium'}
                />
              </div>

              <div>
                <Label htmlFor="status">Estado del Servicio *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => setFormData({...formData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incluido">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Incluido (Obligatorio)
                      </div>
                    </SelectItem>
                    <SelectItem value="opcional">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        Opcional (Cliente decide)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="capacity">Capacidad (personas)</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 0})}
                  placeholder="Ej: 40"
                />
              </div>

              <div>
                <Label htmlFor="price">Precio por Persona (COP)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                  placeholder="Ej: 25000"
                />
              </div>

              <div>
                <Label htmlFor="location">Ubicación *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Ej: Salento, Quindío"
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono de Contacto</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Ej: 321 456 7890"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descripción del restaurante, ambiente, especialidades..."
                  rows={3}
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Información sobre el estado del servicio:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li><strong>Incluido:</strong> El servicio está incluido automáticamente en el paquete/ruta.</li>
                    <li><strong>Opcional:</strong> El cliente puede decidir si incluir este servicio al hacer la reserva.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                resetForm();
                setSelectedRestaurant(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={showCreateModal ? handleCreate : handleEdit}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!formData.name || !formData.location || !formData.associatedItem}
            >
              {showCreateModal ? 'Crear Restaurante' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Restaurante</DialogTitle>
            <DialogDescription>
              Información completa del restaurante seleccionado.
            </DialogDescription>
          </DialogHeader>

          {selectedRestaurant && (
            <div className="space-y-6 py-4">
              <div className="flex items-start gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <UtensilsCrossed className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-1">{selectedRestaurant.name}</h3>
                  <p className="text-gray-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedRestaurant.location}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{selectedRestaurant.rating}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Tipo de Comida</p>
                  <Badge className={getMealTypeColor(selectedRestaurant.mealType)}>
                    {selectedRestaurant.mealType.charAt(0).toUpperCase() + selectedRestaurant.mealType.slice(1)}
                  </Badge>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Estado</p>
                  <Badge className={getStatusColor(selectedRestaurant.status)}>
                    {selectedRestaurant.status.charAt(0).toUpperCase() + selectedRestaurant.status.slice(1)}
                  </Badge>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Capacidad</p>
                  <p className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span>{selectedRestaurant.capacity} personas</span>
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Precio por Persona</p>
                  <p className="font-medium">{formatCurrency(selectedRestaurant.price)}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 mb-2">Asociado a</p>
                <div className="flex items-center gap-2">
                  {selectedRestaurant.associationType === 'ruta' ? (
                    <Route className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Package className="w-5 h-5 text-blue-600" />
                  )}
                  <div>
                    <p className="font-medium text-blue-900">{selectedRestaurant.associatedItem}</p>
                    <p className="text-sm text-blue-700">
                      {selectedRestaurant.associationType === 'ruta' ? 'Ruta Turística' : 'Paquete Turístico'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Descripción</p>
                <p className="text-gray-800">{selectedRestaurant.description}</p>
              </div>

              {selectedRestaurant.specialties && selectedRestaurant.specialties.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Especialidades</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRestaurant.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="bg-emerald-100 text-emerald-800">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Contacto</p>
                <p className="text-gray-800">{selectedRestaurant.phone}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowViewModal(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar este restaurante?
            </DialogDescription>
          </DialogHeader>

          {selectedRestaurant && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 mb-1">{selectedRestaurant.name}</p>
                    <p className="text-sm text-red-700">
                      Esta acción no se puede deshacer. El restaurante será eliminado permanentemente del sistema.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar Restaurante
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}