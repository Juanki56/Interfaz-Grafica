import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Star, Heart, Search, Filter, Users, CreditCard, ShoppingCart, MapPin, CheckCircle, Camera, MessageCircle, Route, Share2, TreePine, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../App';
import { SatisfactionSurvey } from './SatisfactionSurvey';
import { ChatSimulator } from './ChatSimulator';
import { TourBookingModal } from './TourBookingModal';
import { BookingDetailsModal } from './BookingDetailsModal';

export function ClientDashboard() {
  const [activeTab, setActiveTab] = useState('discover');
  const [isLoading, setIsLoading] = useState(true);
  const [showSurvey, setShowSurvey] = useState(false);
  const [selectedTourForSurvey, setSelectedTourForSurvey] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatConfig, setChatConfig] = useState({ type: 'individual' as 'group' | 'individual', title: '', participants: [] });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTourForBooking, setSelectedTourForBooking] = useState<any>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<any>(null);
  const { user } = useAuth();

  // Mock tours data
  const mockTours = [
    {
      id: '1',
      name: 'Caminata Sierra Nevada',
      description: 'Explora los senderos más hermosos de la Sierra Nevada con vistas espectaculares.',
      price: 150000,
      duration: '8 horas',
      difficulty: 'Moderado',
      location: 'Sierra Nevada',
      capacity: 12,
      rating: 4.8,
      reviews: 124,
      image: 'https://images.unsplash.com/photo-1538422314488-83e8e11d298c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWtpbmclMjB0cmFpbCUyMGZvcmVzdHxlbnwxfHx8fDE3NTY5NjQ4NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      featured: true
    },
    {
      id: '2',
      name: 'Tour Cafetero Auténtico',
      description: 'Vive la experiencia completa del café desde la plantación hasta la taza.',
      price: 120000,
      duration: '6 horas',
      difficulty: 'Fácil',
      location: 'Eje Cafetero',
      capacity: 15,
      rating: 4.9,
      reviews: 89,
      image: 'https://images.unsplash.com/photo-1750967613671-297f1b63038d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBwbGFudGF0aW9uJTIwY29sb21iaWF8ZW58MXx8fHwxNzU2OTQ5OTA4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      featured: false
    },
    {
      id: '3',
      name: 'Avistamiento de Aves',
      description: 'Descubre la increíble diversidad de aves en su hábitat natural.',
      price: 95000,
      duration: '5 horas',
      difficulty: 'Fácil',
      location: 'Reserva Natural El Dorado',
      capacity: 8,
      rating: 4.7,
      reviews: 156,
      image: 'https://images.unsplash.com/photo-1635148040718-acf281233b8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMG5hdHVyZXxlbnwxfHx8fDE3NTY5NDQxMTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      featured: false
    }
  ];

  // Mock bookings data - Actualizado con más diversidad de experiencias
  const mockBookings = [
    {
      id: 'booking_1',
      tour: mockTours[1],
      type: 'tour',
      name: 'Tour Cafetero Auténtico',
      date: '2024-09-18',
      participants: 2,
      totalAmount: 240000,
      paidAmount: 240000,
      remainingAmount: 0,
      status: 'confirmed',
      paymentStatus: 'completed',
      hasAccommodation: false,
      paymentReceipt: 'https://example.com/receipt1.jpg',
      specialRequests: 'Dieta vegetariana para 1 persona',
      cancellationDeadline: '2024-09-16',
      location: 'Finca La Esperanza'
    },
    {
      id: 'booking_2',
      tour: mockTours[0],
      type: 'tour',
      name: 'Caminata Sierra Nevada',
      date: '2024-09-25',
      participants: 3,
      totalAmount: 450000,
      paidAmount: 0,
      remainingAmount: 450000,
      status: 'pending',
      paymentStatus: 'pending',
      hasAccommodation: false,
      paymentReceipt: null,
      specialRequests: 'Ninguna',
      cancellationDeadline: '2024-09-23',
      location: 'Sierra Nevada'
    },
    {
      id: 'booking_3',
      type: 'finca',
      name: 'Finca El Paraíso - Experiencia Completa',
      date: '2024-10-05',
      participants: 4,
      totalAmount: 320000,
      paidAmount: 320000,
      remainingAmount: 0,
      status: 'confirmed',
      paymentStatus: 'completed',
      hasAccommodation: true,
      paymentReceipt: 'https://example.com/receipt3.jpg',
      specialRequests: 'Celebración de aniversario',
      cancellationDeadline: '2024-10-03',
      location: 'Finca El Paraíso, Quindío',
      duration: '2 días, 1 noche',
      includes: ['Alojamiento', 'Todas las comidas', 'Actividades guiadas', 'Transporte']
    },
    {
      id: 'booking_4',
      type: 'finca',
      name: 'Finca Bella Vista - Retiro de Fin de Semana',
      date: '2024-09-28',
      participants: 2,
      totalAmount: 180000,
      paidAmount: 90000,
      remainingAmount: 90000,
      status: 'pending',
      paymentStatus: 'partial',
      hasAccommodation: true,
      paymentReceipt: 'https://example.com/receipt4_initial.jpg',
      remainingPaymentReceipt: null,
      specialRequests: 'Yoga matutino',
      cancellationDeadline: '2024-09-26',
      location: 'Finca Bella Vista, Cundinamarca',
      duration: '1 día completo',
      includes: ['Desayuno', 'Almuerzo', 'Actividades recreativas']
    },
    {
      id: 'booking_5',
      type: 'paquete',
      name: 'Paquete Aventura Completa',
      date: '2024-10-12',
      participants: 2,
      totalAmount: 680000,
      paidAmount: 680000,
      remainingAmount: 0,
      status: 'confirmed',
      paymentStatus: 'completed',
      hasAccommodation: false,
      paymentReceipt: 'https://example.com/receipt5.jpg',
      specialRequests: 'Fotografía profesional',
      cancellationDeadline: '2024-10-10',
      location: 'Multi-destino',
      duration: '3 días, 2 noches',
      includes: ['3 Tours diferentes', 'Alojamiento', 'Transporte', 'Guía especializado']
    }
  ];

  const completedBookings = [];
  const upcomingBookings = mockBookings;

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleBookTour = async (tourId: string) => {
    const tour = mockTours.find(t => t.id === tourId);
    if (tour) {
      setSelectedTourForBooking(tour);
      setShowBookingModal(true);
    }
  };

  // Format tours for display
  const availableTours = mockTours.map((tour, index) => ({
    ...tour,
    priceFormatted: `$${tour.price.toLocaleString()}`,
    nextAvailable: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }));

  // Format bookings for display - Actualizado para mostrar todos los tipos
  const myBookings = upcomingBookings.map(booking => ({
    id: booking.id,
    name: booking.name || booking.tour?.name || 'Experiencia',
    type: booking.type || 'tour',
    date: booking.date,
    time: booking.type === 'finca' ? 'Check-in 2:00 PM' : '07:00 AM',
    participants: booking.participants,
    totalPaid: `${booking.totalAmount?.toLocaleString() || '0'}`,
    status: booking.status === 'confirmed' ? 'Confirmado' : 'Pendiente',
    guide: booking.type === 'finca' ? 'Anfitrión Asignado' : 'Guía Asignado',
    paymentStatus: booking.paymentStatus,
    specialRequests: booking.specialRequests,
    cancellationDeadline: booking.cancellationDeadline,
    canCancel: new Date(booking.cancellationDeadline) > new Date(),
    location: booking.location,
    duration: booking.duration,
    includes: booking.includes || []
  }));

  const pastTours = [
    {
      id: 'P001',
      tourName: 'Caminata Sendero Perdido',
      date: '2024-08-15',
      rating: 5,
      photos: 23,
      guide: 'Miguel Ángel',
      hasRated: true
    },
    {
      id: 'P002',
      tourName: 'Tour Cafetero Auténtico',
      date: '2024-08-20',
      rating: 0,
      photos: 15,
      guide: 'Ana García',
      hasRated: false
    }
  ];

  const handleOpenSurvey = (tour: any) => {
    setSelectedTourForSurvey(tour);
    setShowSurvey(true);
  };

  const handleCancelBooking = (bookingId: string) => {
    if (confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      alert('Reserva cancelada exitosamente. Se procesará el reembolso según las políticas.');
    }
  };

  const handlePayment = (bookingId: string) => {
    alert('Redirigiendo al portal de pagos...');
  };

  // Nuevas funciones para manejo de botones
  const handleViewItinerary = (booking: any) => {
    alert(`Ver itinerario detallado de "${booking.tourName || booking.name}"`);
  };

  const handleContactGuide = (booking: any) => {
    setChatConfig({
      type: 'individual',
      title: 'Carlos Ruiz (Guía)',
      participants: []
    });
    setShowChat(true);
  };

  const handleShareBooking = (booking: any) => {
    if (navigator.share) {
      navigator.share({
        title: booking.tourName || booking.name,
        text: `¡Voy a disfrutar de esta increíble experiencia!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  const handleBookTourNew = (tour: any) => {
    setSelectedTourForBooking(tour);
    setShowBookingModal(true);
  };

  const handleViewBookingDetails = (bookingId: string) => {
    const booking = upcomingBookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBookingForDetails(booking);
      setShowBookingDetails(true);
    }
  };

  const stats = [
    { title: 'Tours Realizados', value: completedBookings.length.toString(), change: 'Este año', icon: Calendar, color: 'text-green-600' },
    { title: 'Próximas Reservas', value: upcomingBookings.length.toString(), change: 'Confirmadas', icon: Clock, color: 'text-blue-600' },
    { title: 'Puntos de Fidelidad', value: (completedBookings.length * 200).toString(), change: 'Disponibles', icon: Star, color: 'text-yellow-600' },
    { title: 'Favoritos', value: '8', change: 'Tours guardados', icon: Heart, color: 'text-red-600' }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Fácil':
        return 'bg-green-100 text-green-800';
      case 'Moderado':
        return 'bg-yellow-100 text-yellow-800';
      case 'Avanzado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return 'bg-green-100 text-green-800';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Clock className="w-8 h-8 mx-auto text-green-600 mb-2 animate-spin" />
          <p className="text-muted-foreground">Cargando tus tours...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showSurvey && selectedTourForSurvey && (
        <SatisfactionSurvey
          tourId={selectedTourForSurvey.id}
          tourName={selectedTourForSurvey.tourName}
          tourDate={selectedTourForSurvey.date}
          guideName={selectedTourForSurvey.guide}
          onClose={() => setShowSurvey(false)}
        />
      )}
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">¡Bienvenido de vuelta!</h1>
          <p className="text-muted-foreground">Descubre nuevas aventuras y gestiona tus experiencias</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Heart className="w-4 h-4 mr-2" />
            Mis Favoritos
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <Search className="w-4 h-4 mr-2" />
            Explorar Tours
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="discover">Descubrir</TabsTrigger>
          <TabsTrigger value="bookings">Mis Reservas</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex space-x-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Buscar tours..." className="pl-10" />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>

          {/* Featured Tour */}
          {availableTours.filter(tour => tour.featured).map((tour) => (
            <Card key={tour.id} className="overflow-hidden bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-1/2">
                  <ImageWithFallback
                    src={tour.image}
                    alt={tour.name}
                    className="w-full h-64 lg:h-full object-cover"
                  />
                </div>
                <div className="lg:w-1/2 p-6 lg:p-8">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className="bg-green-600 text-white">Destacado</Badge>
                    <Badge variant="secondary" className={getDifficultyColor(tour.difficulty)}>
                      {tour.difficulty}
                    </Badge>
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-3">{tour.name}</h2>
                  <p className="text-muted-foreground mb-4">{tour.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm">
                      <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>{tour.duration}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>Próximo: {tour.nextAvailable}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Star className="w-4 h-4 mr-2 text-yellow-500" />
                      <span>{tour.rating?.toFixed(1)} ({tour.reviews} reseñas)</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="font-semibold text-green-600">{tour.priceFormatted}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleBookTour(tour.id)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Reservar Ahora
                    </Button>
                    <Button variant="outline">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Available Tours Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableTours.filter(tour => !tour.featured).map((tour) => (
              <Card key={tour.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <div className="relative">
                  <ImageWithFallback
                    src={tour.image}
                    alt={tour.name}
                    className="w-full h-48 object-cover"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-3 right-3 bg-white/80 hover:bg-white/90"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Badge 
                    variant="secondary" 
                    className={`absolute top-3 left-3 ${getDifficultyColor(tour.difficulty)}`}
                  >
                    {tour.difficulty}
                  </Badge>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{tour.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{tour.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
                        <span>{tour.duration}</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 mr-1 text-yellow-500" />
                        <span>{tour.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Próximo:</span>
                      <span>{tour.nextAvailable}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600">{tour.priceFormatted}</span>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleBookTour(tour.id)}
                    >
                      Reservar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          {/* Tours Confirmados - Nueva sección según historia de usuario */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Tours Confirmados</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Experiencias programadas y confirmadas para disfrutar
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myBookings.filter(booking => booking.status === 'Confirmado').length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar className="w-10 h-10 mx-auto text-green-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No tienes tours confirmados</h3>
                    <p className="text-muted-foreground mb-4">
                      Completa el pago de tus reservas pendientes para confirmarlas
                    </p>
                  </div>
                ) : (
                  myBookings
                    .filter(booking => booking.status === 'Confirmado')
                    .map((booking) => (
                      <div key={booking.id} className="p-4 bg-white border border-green-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-green-800">{booking.tourName}</h3>
                            <p className="text-sm text-muted-foreground">Guía: {booking.guide}</p>
                          </div>
                          <Badge className="bg-green-600 text-white">
                            Confirmado
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-green-600" />
                            <span className="font-medium">{booking.date}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-green-600" />
                            <span>{booking.time}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2 text-green-600" />
                            <span>{booking.participants} participante{booking.participants > 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-green-600 text-green-600 hover:bg-green-50"
                            onClick={() => handleViewItinerary(booking)}
                          >
                            <Route className="w-4 h-4 mr-1" />
                            Ver Itinerario
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-green-600 text-green-600 hover:bg-green-50"
                            onClick={() => handleContactGuide(booking)}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Contactar Guía
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-green-600 text-green-600 hover:bg-green-50"
                            onClick={() => handleShareBooking(booking)}
                          >
                            <Share2 className="w-4 h-4 mr-1" />
                            Compartir
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Todas las Reservas */}
          <Card>
            <CardHeader>
              <CardTitle>Todas mis Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No tienes reservas</h3>
                    <p className="text-muted-foreground mb-4">
                      ¡Explora nuestros tours y haz tu primera reserva!
                    </p>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setActiveTab('discover')}
                    >
                      Explorar Tours
                    </Button>
                  </div>
                ) : (
                  myBookings.map((booking) => (
                    <div key={booking.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            {booking.type === 'finca' && <TreePine className="w-4 h-4 text-green-600" />}
                            {booking.type === 'paquete' && <Package className="w-4 h-4 text-blue-600" />}
                            {booking.type === 'tour' && <Route className="w-4 h-4 text-orange-600" />}
                            <h3 className="font-semibold text-lg">{booking.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">{booking.guide}</p>
                          {booking.location && (
                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {booking.location}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(booking.status)}
                          >
                            {booking.status}
                          </Badge>
                          {booking.duration && (
                            <p className="text-xs text-muted-foreground mt-1">{booking.duration}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span>{booking.date}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span>{booking.time}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span>{booking.participants} participante{booking.participants > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center">
                          <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="font-semibold text-green-600">{booking.totalPaid}</span>
                        </div>
                      </div>

                      {booking.paymentStatus === 'pending' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-yellow-800">Pago Pendiente</p>
                              <p className="text-xs text-yellow-700">Completa el pago para confirmar tu reserva</p>
                            </div>
                            <Button 
                              size="sm" 
                              className="bg-yellow-600 hover:bg-yellow-700"
                              onClick={() => handlePayment(booking.id)}
                            >
                              Pagar Ahora
                            </Button>
                          </div>
                        </div>
                      )}

                      {booking.specialRequests && booking.specialRequests !== 'Ninguna' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                          <p className="text-xs text-blue-800">
                            <strong>Solicitudes especiales:</strong> {booking.specialRequests}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
                        <span>Fecha límite para cancelar: {booking.cancellationDeadline}</span>
                        {booking.canCancel && (
                          <Badge variant="outline" className="text-green-700">
                            Cancelación gratuita
                          </Badge>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewBookingDetails(booking.id)}
                        >
                          Ver Detalles
                        </Button>
                        <Button variant="outline" size="sm">
                          Contactar Guía
                        </Button>
                        {booking.canCancel && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mis Tours Realizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastTours.map((tour) => (
                  <Card key={tour.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{tour.tourName}</h3>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i}
                              className={`w-4 h-4 ${
                                i < tour.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-2" />
                          <span>{tour.date}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-2" />
                          <span>Guía: {tour.guide}</span>
                        </div>
                        <div className="flex items-center">
                          <Camera className="w-3 h-3 mr-2" />
                          <span>{tour.photos} fotos compartidas</span>
                        </div>
                      </div>

                      <div className="flex space-x-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          Ver Fotos
                        </Button>
                        {!tour.hasRated ? (
                          <Button 
                            size="sm" 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleOpenSurvey(tour)}
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Evaluar
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="flex-1">
                            Repetir Tour
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Mi Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-green-100 text-green-700 text-2xl">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{user?.name || 'Usuario'}</h2>
                  <p className="text-muted-foreground">{user?.email || 'email@example.com'}</p>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 mt-1">
                    Miembro VIP
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Estadísticas</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Tours completados:</span>
                      <span className="font-medium">{completedBookings.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kilómetros caminados:</span>
                      <span className="font-medium">287 km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Puntos de fidelidad:</span>
                      <span className="font-medium text-green-600">{completedBookings.length * 200}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Preferencias</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Dificultad preferida:</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Moderado
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Tipo de tour favorito:</span>
                      <span>Senderismo</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mejor horario:</span>
                      <span>Mañana temprano</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Chat Simulator */}
      <ChatSimulator
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        chatType={chatConfig.type}
        chatTitle={chatConfig.title}
        userRole="client"
        participants={chatConfig.participants}
      />

      {/* Booking Modal */}
      {showBookingModal && selectedTourForBooking && (
        <TourBookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedTourForBooking(null);
          }}
          tour={selectedTourForBooking}
        />
      )}

      {/* Survey Modal */}
      {showSurvey && selectedTourForSurvey && (
        <SatisfactionSurvey
          isOpen={showSurvey}
          onClose={() => {
            setShowSurvey(false);
            setSelectedTourForSurvey(null);
          }}
          tour={selectedTourForSurvey}
          onSubmit={() => {
            setShowSurvey(false);
            setSelectedTourForSurvey(null);
          }}
        />
      )}

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBookingForDetails && (
        <BookingDetailsModal
          isOpen={showBookingDetails}
          onClose={() => {
            setShowBookingDetails(false);
            setSelectedBookingForDetails(null);
          }}
          booking={selectedBookingForDetails}
        />
      )}
    </>
  );
}