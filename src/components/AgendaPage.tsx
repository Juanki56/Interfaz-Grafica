import React, { useState } from 'react';
import { useAuth } from '../App';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  MapPin, 
  Users,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface AgendaEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  participants: number;
  maxParticipants: number;
  guide: string;
  status: 'programado' | 'en-progreso' | 'completado' | 'cancelado';
  type: 'tour' | 'caminata' | 'paquete' | 'evento';
  priority: 'alta' | 'media' | 'baja';
  createdBy: string;
  notes: string;
}

export function AgendaPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [showEditEventDialog, setShowEditEventDialog] = useState(false);
  const [showViewEventDialog, setShowViewEventDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '',
    location: '',
    maxParticipants: '',
    guide: '',
    type: 'tour',
    priority: 'media',
    notes: ''
  });

  // Mock data de eventos de agenda
  const mockEvents: AgendaEvent[] = [
    {
      id: 1,
      title: 'Caminata Sierra Nevada',
      description: 'Caminata de nivel intermedio por los senderos de Sierra Nevada',
      date: '2024-09-20',
      time: '06:00',
      duration: '8 horas',
      location: 'Parque Sierra Nevada',
      participants: 12,
      maxParticipants: 15,
      guide: 'Carlos Ruiz',
      status: 'programado',
      type: 'caminata',
      priority: 'alta',
      createdBy: 'Ana García',
      notes: 'Llevar protector solar y agua suficiente'
    },
    {
      id: 2,
      title: 'Tour Cafetero Familiar',
      description: 'Recorrido por fincas cafeteras con degustación',
      date: '2024-09-22',
      time: '08:30',
      duration: '6 horas',
      location: 'Finca El Paraíso',
      participants: 8,
      maxParticipants: 12,
      guide: 'María González',
      status: 'programado',
      type: 'tour',
      priority: 'media',
      createdBy: 'Admin',
      notes: 'Incluye almuerzo típico'
    },
    {
      id: 3,
      title: 'Avistamiento de Aves',
      description: 'Observación de aves endémicas en hábitat natural',
      date: '2024-09-18',
      time: '05:30',
      duration: '4 horas',
      location: 'Reserva Natural Águila Dorada',
      participants: 6,
      maxParticipants: 10,
      guide: 'Luis Castro',
      status: 'completado',
      type: 'tour',
      priority: 'media',
      createdBy: 'Ana García',
      notes: 'Actividad completada exitosamente'
    },
    {
      id: 4,
      title: 'Paquete Aventura 3 Días',
      description: 'Paquete completo con múltiples actividades',
      date: '2024-09-25',
      time: '07:00',
      duration: '3 días',
      location: 'Base Camp Occitours',
      participants: 0,
      maxParticipants: 20,
      guide: 'Por asignar',
      status: 'programado',
      type: 'paquete',
      priority: 'alta',
      createdBy: 'Admin',
      notes: 'Requiere confirmación de participantes'
    }
  ];

  const handleCreateEvent = () => {
    if (!newEvent.title.trim() || !newEvent.date || !newEvent.time) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    console.log('Creating event:', newEvent);
    toast.success(`Evento "${newEvent.title}" creado exitosamente`);
    setNewEvent({
      title: '',
      description: '',
      date: '',
      time: '',
      duration: '',
      location: '',
      maxParticipants: '',
      guide: '',
      type: 'tour',
      priority: 'media',
      notes: ''
    });
    setShowCreateEventDialog(false);
  };

  const handleEditEvent = (event: AgendaEvent) => {
    setSelectedEvent(event);
    setShowEditEventDialog(true);
  };

  const handleViewEvent = (event: AgendaEvent) => {
    setSelectedEvent(event);
    setShowViewEventDialog(true);
  };

  const handleUpdateEvent = () => {
    if (!selectedEvent) return;
    console.log('Updating event:', selectedEvent);
    toast.success(`Evento "${selectedEvent.title}" actualizado exitosamente`);
    setShowEditEventDialog(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = (eventId: number) => {
    setEventToDelete(eventId);
  };

  const confirmDeleteEvent = () => {
    if (eventToDelete) {
      console.log('Deleting event:', eventToDelete);
      toast.success('Evento eliminado exitosamente');
      setEventToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'programado':
        return 'bg-blue-100 text-blue-800';
      case 'en-progreso':
        return 'bg-yellow-100 text-yellow-800';
      case 'completado':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'programado':
        return <Clock className="w-4 h-4" />;
      case 'en-progreso':
        return <AlertCircle className="w-4 h-4" />;
      case 'completado':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelado':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'bg-red-100 text-red-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baja':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Determinar permisos según el rol
  const canCreate = user?.role === 'admin' || user?.role === 'advisor';
  const canEdit = user?.role === 'admin' || user?.role === 'advisor';
  const canDelete = user?.role === 'admin';
  const canView = true; // Todos pueden ver

  // Filtrar eventos según el término de búsqueda y estado
  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.guide.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agenda de Actividades</h1>
          <p className="text-muted-foreground">Gestiona los eventos y rutas programadas</p>
        </div>
        {canCreate && (
          <Dialog open={showCreateEventDialog} onOpenChange={setShowCreateEventDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Evento</DialogTitle>
                <DialogDescription>
                  Programa una nueva actividad o ruta en la agenda.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-title">Título del Evento *</Label>
                    <Input
                      id="event-title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      placeholder="Ej: Caminata Sierra Nevada"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-type">Tipo de Actividad</Label>
                    <Select value={newEvent.type} onValueChange={(value) => setNewEvent({...newEvent, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tour">Tour</SelectItem>
                        <SelectItem value="caminata">Caminata</SelectItem>
                        <SelectItem value="paquete">Paquete</SelectItem>
                        <SelectItem value="evento">Evento Especial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-description">Descripción</Label>
                  <Textarea
                    id="event-description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="Describe la actividad..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-date">Fecha *</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-time">Hora *</Label>
                    <Input
                      id="event-time"
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-duration">Duración</Label>
                    <Input
                      id="event-duration"
                      value={newEvent.duration}
                      onChange={(e) => setNewEvent({...newEvent, duration: e.target.value})}
                      placeholder="Ej: 6 horas"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-location">Ubicación</Label>
                    <Input
                      id="event-location"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                      placeholder="Ej: Parque Nacional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-participants">Máx. Participantes</Label>
                    <Input
                      id="event-participants"
                      type="number"
                      value={newEvent.maxParticipants}
                      onChange={(e) => setNewEvent({...newEvent, maxParticipants: e.target.value})}
                      placeholder="15"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-guide">Guía Asignado</Label>
                    <Select value={newEvent.guide} onValueChange={(value) => setNewEvent({...newEvent, guide: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un guía" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Carlos Ruiz">Carlos Ruiz</SelectItem>
                        <SelectItem value="María González">María González</SelectItem>
                        <SelectItem value="Luis Castro">Luis Castro</SelectItem>
                        <SelectItem value="Por asignar">Por asignar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-priority">Prioridad</Label>
                    <Select value={newEvent.priority} onValueChange={(value) => setNewEvent({...newEvent, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="baja">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-notes">Notas Adicionales</Label>
                  <Textarea
                    id="event-notes"
                    value={newEvent.notes}
                    onChange={(e) => setNewEvent({...newEvent, notes: e.target.value})}
                    placeholder="Información adicional para el evento..."
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateEventDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateEvent} className="bg-green-600 hover:bg-green-700">
                  Crear Evento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Buscar eventos..." 
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="programado">Programado</SelectItem>
              <SelectItem value="en-progreso">En Progreso</SelectItem>
              <SelectItem value="completado">Completado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Eventos Programados</p>
                <p className="text-2xl font-bold mt-1">
                  {mockEvents.filter(e => e.status === 'programado').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En Progreso</p>
                <p className="text-2xl font-bold mt-1">
                  {mockEvents.filter(e => e.status === 'en-progreso').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completados</p>
                <p className="text-2xl font-bold mt-1">
                  {mockEvents.filter(e => e.status === 'completado').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Participantes</p>
                <p className="text-2xl font-bold mt-1">
                  {mockEvents.reduce((sum, e) => sum + e.participants, 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de eventos */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos Programados</CardTitle>
          <p className="text-sm text-muted-foreground">
            Lista de todas las actividades y rutas en la agenda
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Fecha & Hora</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Participantes</TableHead>
                <TableHead>Guía</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {event.type} • {event.duration}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{event.date}</p>
                      <p className="text-sm text-muted-foreground">{event.time}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {event.participants}/{event.maxParticipants}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{event.guide}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(event.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(event.status)}
                        <span className="capitalize">{event.status.replace('-', ' ')}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getPriorityColor(event.priority)}>
                      {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {canView && (
                        <Button variant="ghost" size="sm" onClick={() => handleViewEvent(event)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => handleEditEvent(event)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setEventToDelete(event.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. El evento "{event.title}" será eliminado permanentemente de la agenda.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setEventToDelete(null)}>
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={confirmDeleteEvent}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para ver evento */}
      <Dialog open={showViewEventDialog} onOpenChange={setShowViewEventDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Evento</DialogTitle>
            <DialogDescription>
              Información completa del evento seleccionado
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Título</Label>
                  <p className="text-sm text-muted-foreground">{selectedEvent.title}</p>
                </div>
                <div>
                  <Label className="font-medium">Tipo</Label>
                  <p className="text-sm text-muted-foreground capitalize">{selectedEvent.type}</p>
                </div>
              </div>
              
              <div>
                <Label className="font-medium">Descripción</Label>
                <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="font-medium">Fecha</Label>
                  <p className="text-sm text-muted-foreground">{selectedEvent.date}</p>
                </div>
                <div>
                  <Label className="font-medium">Hora</Label>
                  <p className="text-sm text-muted-foreground">{selectedEvent.time}</p>
                </div>
                <div>
                  <Label className="font-medium">Duración</Label>
                  <p className="text-sm text-muted-foreground">{selectedEvent.duration}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Ubicación</Label>
                  <p className="text-sm text-muted-foreground">{selectedEvent.location}</p>
                </div>
                <div>
                  <Label className="font-medium">Guía</Label>
                  <p className="text-sm text-muted-foreground">{selectedEvent.guide}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="font-medium">Participantes</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent.participants}/{selectedEvent.maxParticipants}
                  </p>
                </div>
                <div>
                  <Label className="font-medium">Estado</Label>
                  <Badge variant="secondary" className={getStatusColor(selectedEvent.status)}>
                    {selectedEvent.status.replace('-', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label className="font-medium">Prioridad</Label>
                  <Badge variant="outline" className={getPriorityColor(selectedEvent.priority)}>
                    {selectedEvent.priority}
                  </Badge>
                </div>
              </div>

              {selectedEvent.notes && (
                <div>
                  <Label className="font-medium">Notas</Label>
                  <p className="text-sm text-muted-foreground">{selectedEvent.notes}</p>
                </div>
              )}

              <div>
                <Label className="font-medium">Creado por</Label>
                <p className="text-sm text-muted-foreground">{selectedEvent.createdBy}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowViewEventDialog(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar evento */}
      <Dialog open={showEditEventDialog} onOpenChange={setShowEditEventDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
            <DialogDescription>
              Modifica la información del evento seleccionado.
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Título del Evento</Label>
                  <Input
                    id="edit-title"
                    value={selectedEvent.title}
                    onChange={(e) => setSelectedEvent({...selectedEvent, title: e.target.value})}
                    placeholder="Ej: Caminata Sierra Nevada"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Tipo de Actividad</Label>
                  <Select value={selectedEvent.type} onValueChange={(value) => setSelectedEvent({...selectedEvent, type: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tour">Tour</SelectItem>
                      <SelectItem value="caminata">Caminata</SelectItem>
                      <SelectItem value="paquete">Paquete</SelectItem>
                      <SelectItem value="evento">Evento Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={selectedEvent.description}
                  onChange={(e) => setSelectedEvent({...selectedEvent, description: e.target.value})}
                  placeholder="Describe la actividad..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Fecha</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={selectedEvent.date}
                    onChange={(e) => setSelectedEvent({...selectedEvent, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-time">Hora</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={selectedEvent.time}
                    onChange={(e) => setSelectedEvent({...selectedEvent, time: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">Duración</Label>
                  <Input
                    id="edit-duration"
                    value={selectedEvent.duration}
                    onChange={(e) => setSelectedEvent({...selectedEvent, duration: e.target.value})}
                    placeholder="Ej: 6 horas"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Ubicación</Label>
                  <Input
                    id="edit-location"
                    value={selectedEvent.location}
                    onChange={(e) => setSelectedEvent({...selectedEvent, location: e.target.value})}
                    placeholder="Ej: Parque Nacional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-maxParticipants">Máx. Participantes</Label>
                  <Input
                    id="edit-maxParticipants"
                    type="number"
                    value={selectedEvent.maxParticipants}
                    onChange={(e) => setSelectedEvent({...selectedEvent, maxParticipants: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-guide">Guía Asignado</Label>
                  <Select value={selectedEvent.guide} onValueChange={(value) => setSelectedEvent({...selectedEvent, guide: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un guía" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Carlos Ruiz">Carlos Ruiz</SelectItem>
                      <SelectItem value="María González">María González</SelectItem>
                      <SelectItem value="Luis Castro">Luis Castro</SelectItem>
                      <SelectItem value="Ana Morales">Ana Morales</SelectItem>
                      <SelectItem value="Por asignar">Por asignar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Estado</Label>
                  <Select value={selectedEvent.status} onValueChange={(value) => setSelectedEvent({...selectedEvent, status: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="programado">Programado</SelectItem>
                      <SelectItem value="en-progreso">En Progreso</SelectItem>
                      <SelectItem value="completado">Completado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Prioridad</Label>
                  <Select value={selectedEvent.priority} onValueChange={(value) => setSelectedEvent({...selectedEvent, priority: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-participants">Participantes Actuales</Label>
                  <Input
                    id="edit-participants"
                    type="number"
                    value={selectedEvent.participants}
                    onChange={(e) => setSelectedEvent({...selectedEvent, participants: parseInt(e.target.value)})}
                    max={selectedEvent.maxParticipants}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notas Adicionales</Label>
                <Textarea
                  id="edit-notes"
                  value={selectedEvent.notes}
                  onChange={(e) => setSelectedEvent({...selectedEvent, notes: e.target.value})}
                  placeholder="Información adicional para el evento..."
                  rows={2}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setShowEditEventDialog(false);
              setSelectedEvent(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateEvent} className="bg-green-600 hover:bg-green-700">
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}