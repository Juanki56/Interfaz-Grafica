import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Clock,
  Route,
  Users,
  UserCheck,
  CheckCircle,
  Plus,
  Trash2,
  Mail,
  Phone,
  Bed,
  Utensils,
  Bus,
  Home as HomeIcon,
  FileText,
  Save,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DialogFooter } from './ui/dialog';
import { toast } from 'sonner';

interface ProgrammingRoute {
  routeId: string;
  routeName: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface Companion {
  id: string;
  name: string;
  document: string;
  phone: string;
  age: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  companions: Companion[];
}

interface Guide {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
}

interface AvailableRoute {
  id: string;
  name: string;
  duration: string;
}

interface ServiceOption {
  id: string;
  name: string;
  type: 'accommodation' | 'food' | 'transport' | 'other';
  price: number;
}

interface Programming {
  id: string;
  programId: string;
  routes: ProgrammingRoute[];
  clients: Client[];
  guideId: string;
  guideName: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  additionalServices: ServiceOption[];
  notes?: string;
  createdAt: string;
  createdBy: string;
}

interface ProgrammingFormImprovedProps {
  programming?: Programming;
  onClose: () => void;
  isEdit?: boolean;
  availableRoutes: AvailableRoute[];
  availableClients: Client[];
  availableGuides: Guide[];
  serviceOptions: ServiceOption[];
  onSubmit: (formData: any) => void;
  userName?: string;
}

export function ProgrammingFormImproved({
  programming,
  onClose,
  isEdit,
  availableRoutes,
  availableClients,
  availableGuides,
  serviceOptions,
  onSubmit,
  userName
}: ProgrammingFormImprovedProps) {
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

  const [formStep, setFormStep] = useState('routes');

  const handleAddRoute = () => {
    if (newRoute.routeId && newRoute.date && newRoute.startTime && newRoute.endTime) {
      const route = availableRoutes.find(r => r.id === newRoute.routeId);
      if (route) {
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
      toast.error('Complete todos los campos obligatorios: Rutas, Clientes y Guía');
      return;
    }

    onSubmit(formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs value={formStep} onValueChange={setFormStep} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <TabsTrigger
            value="routes"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white flex items-center gap-2"
          >
            <Route className="w-4 h-4" />
            <span className="hidden sm:inline">Rutas</span>
            {formData.routes.length > 0 && (
              <Badge className="ml-1 bg-green-700 text-white h-5 px-1.5">{formData.routes.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="clients"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Clientes</span>
            {formData.clientIds.length > 0 && (
              <Badge className="ml-1 bg-green-700 text-white h-5 px-1.5">{formData.clientIds.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="guide-services"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Guía</span>
            {formData.guideId && <CheckCircle className="w-4 h-4 ml-1" />}
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Detalles</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="max-h-[60vh] pr-4 mt-4">
          {/* Tab 1: Rutas */}
          <TabsContent value="routes" className="space-y-4 mt-0">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Route className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Configurar Rutas</h4>
                  <p className="text-sm text-gray-600">Agregue las rutas turísticas de esta programación</p>
                </div>
              </div>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="routeSelect" className="text-green-900 font-medium">Seleccionar Ruta *</Label>
                      <Select value={newRoute.routeId} onValueChange={(value) => setNewRoute({ ...newRoute, routeId: value })}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Elija una ruta turística" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoutes.map(route => (
                            <SelectItem key={route.id} value={route.id}>
                              <div className="flex items-center gap-2">
                                <Route className="w-4 h-4 text-green-600" />
                                <span>{route.name} - {route.duration}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="routeDate" className="text-green-900 font-medium">Fecha *</Label>
                      <Input
                        id="routeDate"
                        type="date"
                        value={newRoute.date}
                        onChange={(e) => setNewRoute({ ...newRoute, date: e.target.value })}
                        className="bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="routeStartTime" className="text-green-900 font-medium">Hora Inicio *</Label>
                        <Input
                          id="routeStartTime"
                          type="time"
                          value={newRoute.startTime}
                          onChange={(e) => setNewRoute({ ...newRoute, startTime: e.target.value })}
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="routeEndTime" className="text-green-900 font-medium">Hora Fin *</Label>
                        <Input
                          id="routeEndTime"
                          type="time"
                          value={newRoute.endTime}
                          onChange={(e) => setNewRoute({ ...newRoute, endTime: e.target.value })}
                          className="bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddRoute}
                    variant="outline"
                    className="w-full border-green-600 text-green-700 hover:bg-green-100 hover:text-green-800 font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Ruta a la Programación
                  </Button>
                </CardContent>
              </Card>

              {formData.routes.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-green-900 font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Rutas Agregadas ({formData.routes.length})
                  </Label>
                  <div className="space-y-2">
                    {formData.routes.map((route, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Route className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-green-900">{route.routeName}</p>
                            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(route.date).toLocaleDateString('es-ES', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: 'short'
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {route.startTime} - {route.endTime}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveRoute(index)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {formData.routes.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-green-200 rounded-lg bg-green-50/50">
                  <Route className="w-12 h-12 text-green-300 mx-auto mb-2" />
                  <p className="text-gray-600">No hay rutas agregadas aún</p>
                  <p className="text-sm text-gray-500">Complete el formulario arriba para agregar la primera ruta</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 2: Clientes */}
          <TabsContent value="clients" className="space-y-4 mt-0">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Seleccionar Clientes</h4>
                  <p className="text-sm text-gray-600">Elija los clientes que participarán en esta programación</p>
                </div>
              </div>

              {formData.clientIds.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">
                      {formData.clientIds.length} cliente{formData.clientIds.length !== 1 ? 's' : ''} seleccionado{formData.clientIds.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm text-green-600">
                      ({availableClients
                        .filter(c => formData.clientIds.includes(c.id))
                        .reduce((sum, c) => sum + 1 + c.companions.length, 0)} participantes totales)
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
                {availableClients.map(client => {
                  const isSelected = formData.clientIds.includes(client.id);
                  return (
                    <motion.div
                      key={client.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex items-start space-x-3 p-4 border-2 rounded-lg transition-all cursor-pointer hover:shadow-md ${
                        isSelected
                          ? 'bg-green-50 border-green-400 shadow-sm'
                          : 'bg-white border-gray-200 hover:border-green-200'
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          setFormData({ ...formData, clientIds: formData.clientIds.filter(id => id !== client.id) });
                        } else {
                          setFormData({ ...formData, clientIds: [...formData.clientIds, client.id] });
                        }
                      }}
                    >
                      <Checkbox
                        id={`client-${client.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, clientIds: [...formData.clientIds, client.id] });
                          } else {
                            setFormData({ ...formData, clientIds: formData.clientIds.filter(id => id !== client.id) });
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor={`client-${client.id}`} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8 bg-blue-100">
                              <AvatarFallback className="text-blue-600 text-sm">
                                {client.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-gray-900">{client.name}</p>
                              <div className="flex items-center gap-3 text-sm text-gray-600 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {client.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {client.phone}
                                </span>
                              </div>
                            </div>
                          </div>
                          {client.companions.length > 0 && (
                            <div className="mt-2 ml-10 pl-3 border-l-2 border-green-200">
                              <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {client.companions.length} Acompañante{client.companions.length > 1 ? 's' : ''}
                              </p>
                              <div className="space-y-1">
                                {client.companions.map(comp => (
                                  <p key={comp.id} className="text-xs text-gray-600">
                                    • {comp.name} ({comp.age} años)
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </label>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {formData.clientIds.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50/50">
                  <Users className="w-12 h-12 text-blue-300 mx-auto mb-2" />
                  <p className="text-gray-600">No hay clientes seleccionados</p>
                  <p className="text-sm text-gray-500">Haga clic en los clientes para agregarlos</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 3: Guía y Servicios */}
          <TabsContent value="guide-services" className="space-y-6 mt-0">
            {/* Guía */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Asignar Guía Turístico</h4>
                  <p className="text-sm text-gray-600">Seleccione el guía responsable de esta programación</p>
                </div>
              </div>

              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 shadow-sm">
                <CardContent className="p-4">
                  <Label htmlFor="guide" className="text-gray-900 font-medium mb-2 block">Guía Asignado *</Label>
                  <Select value={formData.guideId} onValueChange={(value) => setFormData({ ...formData, guideId: value })}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccione un guía certificado" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGuides.map(guide => (
                        <SelectItem key={guide.id} value={guide.id}>
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">{guide.name}</span>
                            <span className="text-sm text-gray-500">- {guide.specialization}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.guideId && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>Guía seleccionado correctamente</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Servicios Adicionales */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <HomeIcon className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Servicios Adicionales</h4>
                  <p className="text-sm text-gray-600">Seleccione los servicios complementarios incluidos</p>
                </div>
              </div>

              {formData.serviceIds.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 text-orange-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">
                      {formData.serviceIds.length} servicio{formData.serviceIds.length !== 1 ? 's' : ''} seleccionado{formData.serviceIds.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                {serviceOptions.map(service => {
                  const isSelected = formData.serviceIds.includes(service.id);
                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex items-start space-x-3 p-3 border-2 rounded-lg transition-all cursor-pointer hover:shadow-md ${
                        isSelected
                          ? 'bg-orange-50 border-orange-400 shadow-sm'
                          : 'bg-white border-gray-200 hover:border-orange-200'
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          setFormData({ ...formData, serviceIds: formData.serviceIds.filter(id => id !== service.id) });
                        } else {
                          setFormData({ ...formData, serviceIds: [...formData.serviceIds, service.id] });
                        }
                      }}
                    >
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, serviceIds: [...formData.serviceIds, service.id] });
                          } else {
                            setFormData({ ...formData, serviceIds: formData.serviceIds.filter(id => id !== service.id) });
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor={`service-${service.id}`} className="cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            {service.type === 'accommodation' && <Bed className="w-4 h-4 text-blue-600" />}
                            {service.type === 'food' && <Utensils className="w-4 h-4 text-orange-600" />}
                            {service.type === 'transport' && <Bus className="w-4 h-4 text-green-600" />}
                            {service.type === 'other' && <HomeIcon className="w-4 h-4 text-purple-600" />}
                            <p className="font-medium text-sm">{service.name}</p>
                          </div>
                          <p className="text-sm font-semibold text-green-600">
                            ${service.price.toLocaleString('es-CO')}
                          </p>
                        </label>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Detalles Finales */}
          <TabsContent value="details" className="space-y-4 mt-0">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Detalles Finales</h4>
                  <p className="text-sm text-gray-600">Configure el estado y notas adicionales</p>
                </div>
              </div>

              {/* Resumen */}
              <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Resumen de la Programación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Route className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-600">Rutas</p>
                        <p className="font-semibold text-green-900">{formData.routes.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-600">Clientes</p>
                        <p className="font-semibold text-green-900">{formData.clientIds.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-600">Guía</p>
                        <p className="font-semibold text-green-900">
                          {formData.guideId ? availableGuides.find(g => g.id === formData.guideId)?.name : 'No asignado'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <HomeIcon className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-xs text-gray-600">Servicios</p>
                        <p className="font-semibold text-green-900">{formData.serviceIds.length}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Estado */}
              <div>
                <Label htmlFor="status" className="text-gray-900 font-medium mb-2 block">Estado de la Programación</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>Programado</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="in-progress">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>En Progreso</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Completado</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Cancelado</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notas */}
              <div>
                <Label htmlFor="notes" className="text-gray-900 font-medium mb-2 block">Notas y Observaciones</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Escriba aquí cualquier observación importante, requerimientos especiales de los clientes, restricciones alimenticias, condiciones médicas relevantes, etc."
                  rows={4}
                  className="bg-white resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Estas notas serán visibles para el guía y el equipo administrativo
                </p>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="gap-2">
          <X className="w-4 h-4" />
          Cancelar
        </Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-700 gap-2">
          <Save className="w-4 h-4" />
          {isEdit ? 'Guardar Cambios' : 'Crear Programación'}
        </Button>
      </DialogFooter>
    </form>
  );
}