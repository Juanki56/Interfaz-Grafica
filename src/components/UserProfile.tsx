import React, { useState, useEffect } from 'react';
import { User, Calendar, MapPin, Clock, CreditCard, Package, ChevronRight, AlertCircle, Settings, Lock, Bell, Trash2, Shield, Mail, Phone, Eye, EyeOff, Save, DollarSign, FileText, ShoppingCart, Wallet, Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Separator } from './ui/separator';
import { useAuth } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';
import { ClientSalesTab, ClientPaymentsTab } from './ClientSalesAndPayments';
import { clientesAPI, authAPI } from '../services/api';

interface Booking {
  id: string;
  tourId: string;
  tourName: string;
  date: string;
  participants: number;
  specialRequests: string;
  total: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

interface UserProfileProps {
  onClose?: () => void;
}

export function UserProfile({ onClose }: UserProfileProps) {
  const { user, logout, setCurrentView } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    preferences: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    bookingUpdates: true,
    promotionsOffers: true
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'private',
    shareBookingHistory: false,
    allowDataCollection: false
  });
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Search states for Sales and Payments
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [paymentsSearchTerm, setPaymentsSearchTerm] = useState('');
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<any>(null);
  const [showPaymentDetailDialog, setShowPaymentDetailDialog] = useState(false);

  useEffect(() => {
    // Load bookings from localStorage
    const savedBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
    setBookings(savedBookings);

    // Load user profile data from localStorage
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setProfileData(prev => ({
        ...prev,
        ...parsedProfile,
        name: user?.name || prev.name,
        email: user?.email || prev.email
      }));
    }

    // Load settings from localStorage
    const savedNotifications = localStorage.getItem('notificationSettings');
    if (savedNotifications) {
      setNotificationSettings(JSON.parse(savedNotifications));
    }

    const savedPrivacy = localStorage.getItem('privacySettings');
    if (savedPrivacy) {
      setPrivacySettings(JSON.parse(savedPrivacy));
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const handleProfileUpdate = () => {
    // Validate required fields
    if (!profileData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    
    if (!profileData.email.trim()) {
      toast.error('El email es requerido');
      return;
    }
    
    // Save to localStorage
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    
    // Mock profile update
    console.log('Profile updated:', profileData);
    toast.success('Perfil actualizado exitosamente');
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    try {
      await authAPI.cambiarContrasena(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      toast.success('Contraseña cambiada exitosamente');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      toast.error(error.message || 'Error al cambiar la contraseña');
    }
  };

  const handleNotificationUpdate = () => {
    // Save to localStorage
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    
    // Mock notification settings update
    console.log('Notification settings updated:', notificationSettings);
    toast.success('Configuración de notificaciones actualizada');
  };

  const handlePrivacyUpdate = () => {
    // Save to localStorage
    localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
    
    // Mock privacy settings update
    console.log('Privacy settings updated:', privacySettings);
    toast.success('Configuración de privacidad actualizada');
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'ELIMINAR') {
      toast.error('Por favor escribe "ELIMINAR" para confirmar');
      return;
    }
    
    // Mock account deletion
    console.log('Account deleted');
    toast.success('Cuenta eliminada exitosamente');
    logout();
    setShowDeleteDialog(false);
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Get available tabs based on user role
  const getAvailableTabs = () => {
    const baseTabs = [
      { id: 'profile', label: 'Perfil', cols: 'grid-cols-4' },
      { id: 'security', label: 'Seguridad', cols: 'grid-cols-4' },
      { id: 'notifications', label: 'Notificaciones', cols: 'grid-cols-4' },
      { id: 'account', label: 'Cuenta', cols: 'grid-cols-4' }
    ];

    return baseTabs;
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl text-gray-800">Mi Perfil</h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
          {onClose && (
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          )}
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className={`grid w-full ${availableTabs[0]?.cols || 'grid-cols-4'}`}>
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                    <Input
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <Input
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="tu@email.com"
                      type="email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Teléfono</label>
                    <Input
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+57 300 123 4567"
                      type="tel"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Rol</label>
                    <Input
                      value={user?.role === 'client' ? 'Cliente' : user?.role || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {user?.role === 'client' ? 'Preferencias de Tours' : 
                     user?.role === 'guide' ? 'Especialidades y Experiencia' :
                     user?.role === 'advisor' ? 'Áreas de Especialización' :
                     'Notas Adicionales'}
                  </label>
                  <Textarea
                    value={profileData.preferences}
                    onChange={(e) => setProfileData(prev => ({ ...prev, preferences: e.target.value }))}
                    placeholder={
                      user?.role === 'client' ? "Describe tus preferencias para tours (actividades, nivel de dificultad, etc.)" :
                      user?.role === 'guide' ? "Describe tu experiencia como guía, especialidades y certificaciones" :
                      user?.role === 'advisor' ? "Describe tu experiencia en asesoría turística y áreas de especialización" :
                      "Información adicional relevante"
                    }
                    rows={3}
                  />
                </div>
                
                <Button onClick={handleProfileUpdate} className="bg-green-600 hover:bg-green-700">
                  Actualizar Perfil
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab - Only for clients */}
          {user?.role === 'client' && (
            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-800 flex items-center space-x-2">
                    <Package className="w-6 h-6" />
                    <span>Mis Reservas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl text-gray-600 mb-2">No tienes reservas aún</h3>
                      <p className="text-gray-500 mb-4">
                        Explora nuestros tours y fincas para hacer tu primera reserva
                      </p>
                      <Button 
                        onClick={() => {
                          setCurrentView('packages');
                          if (onClose) onClose();
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Explorar Tours
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <Card key={booking.id} className="border-l-4 border-l-green-500">
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-lg text-gray-800">{booking.tourName}</h3>
                                  <Badge className={getStatusColor(booking.status)}>
                                    {getStatusText(booking.status)}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(booking.date).toLocaleDateString('es-ES')}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <User className="w-4 h-4" />
                                    <span>{booking.participants} persona{booking.participants > 1 ? 's' : ''}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <CreditCard className="w-4 h-4" />
                                    <span>${booking.total.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {new Date(booking.createdAt).toLocaleDateString('es-ES')}
                                    </span>
                                  </div>
                                </div>
                                
                                {booking.specialRequests && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                      <strong>Solicitudes especiales:</strong> {booking.specialRequests}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex space-x-2">
                                {booking.status === 'pending' && (
                                  <Button size="sm" variant="outline" className="text-red-600 border-red-200">
                                    Cancelar
                                  </Button>
                                )}
                                <Button size="sm" variant="outline">
                                  Ver Detalles
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Sales Tab - Only for clients */}
          {user?.role === 'client' && (
            <TabsContent value="sales">
              <ClientSalesTab />
            </TabsContent>
          )}

          {/* Payments/Abonos Tab - Only for clients */}
          {user?.role === 'client' && (
            <TabsContent value="payments">
              <ClientPaymentsTab />
            </TabsContent>
          )}

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-800 flex items-center space-x-2">
                    <Lock className="w-6 h-6" />
                    <span>Seguridad</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-800 mb-4">Cambiar Contraseña</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Contraseña Actual</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder="Ingresa tu contraseña actual"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => togglePasswordVisibility('current')}
                          >
                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-password">Nueva Contraseña</Label>
                          <div className="relative">
                            <Input
                              id="new-password"
                              type={showPasswords.new ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                              placeholder="Mínimo 8 caracteres"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => togglePasswordVisibility('new')}
                            >
                              {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                          <div className="relative">
                            <Input
                              id="confirm-password"
                              type={showPasswords.confirm ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              placeholder="Confirma tu nueva contraseña"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => togglePasswordVisibility('confirm')}
                            >
                              {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <Button onClick={handlePasswordChange} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" />
                        Cambiar Contraseña
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium text-gray-800 mb-4">Configuración de Privacidad</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Visibilidad del Perfil</Label>
                          <p className="text-sm text-gray-600">Controla quién puede ver tu información básica</p>
                        </div>
                        <select 
                          className="border rounded-md px-3 py-2 bg-white"
                          value={privacySettings.profileVisibility}
                          onChange={(e) => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
                        >
                          <option value="private">Privado</option>
                          <option value="public">Público</option>
                          <option value="friends">Solo amigos</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Compartir Historial de Reservas</Label>
                          <p className="text-sm text-gray-600">Permite que otros vean tus tours realizados</p>
                        </div>
                        <Switch
                          checked={privacySettings.shareBookingHistory}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, shareBookingHistory: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Permitir Recolección de Datos</Label>
                          <p className="text-sm text-gray-600">Ayúdanos a mejorar con datos de uso anónimo</p>
                        </div>
                        <Switch
                          checked={privacySettings.allowDataCollection}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, allowDataCollection: checked }))}
                        />
                      </div>
                      
                      <Button onClick={handlePrivacyUpdate} className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Configuración
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800 flex items-center space-x-2">
                  <Bell className="w-6 h-6" />
                  <span>Notificaciones</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-800 mb-4">Preferencias de Notificación</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>Notificaciones por Email</span>
                        </Label>
                        <p className="text-sm text-gray-600">Recibe actualizaciones importantes por correo</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center space-x-2">
                          <Bell className="w-4 h-4" />
                          <span>Notificaciones Push</span>
                        </Label>
                        <p className="text-sm text-gray-600">Alertas instantáneas en tu dispositivo</p>
                      </div>
                      <Switch
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>Mensajes SMS</span>
                        </Label>
                        <p className="text-sm text-gray-600">Confirmaciones y recordatorios por mensaje</p>
                      </div>
                      <Switch
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-4">Tipos de Notificación</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>
                          {user?.role === 'client' ? 'Actualizaciones de Reservas' :
                           user?.role === 'guide' ? 'Asignaciones de Tours' :
                           user?.role === 'advisor' ? 'Consultas de Clientes' :
                           'Actualizaciones del Sistema'}
                        </Label>
                        <p className="text-sm text-gray-600">
                          {user?.role === 'client' ? 'Confirmaciones, cambios y cancelaciones' :
                           user?.role === 'guide' ? 'Nuevas asignaciones y cambios de tours' :
                           user?.role === 'advisor' ? 'Nuevas consultas y seguimientos' :
                           'Notificaciones importantes del sistema'}
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.bookingUpdates}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, bookingUpdates: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Promociones y Ofertas</Label>
                        <p className="text-sm text-gray-600">Descuentos especiales y nuevos tours</p>
                      </div>
                      <Switch
                        checked={notificationSettings.promotionsOffers}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, promotionsOffers: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Marketing por Email</Label>
                        <p className="text-sm text-gray-600">Boletines informativos y contenido exclusivo</p>
                      </div>
                      <Switch
                        checked={notificationSettings.marketingEmails}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, marketingEmails: checked }))}
                      />
                    </div>
                  </div>
                </div>
                
                <Button onClick={handleNotificationUpdate} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Preferencias
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-800 flex items-center space-x-2">
                    <Settings className="w-6 h-6" />
                    <span>Configuración de Cuenta</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Estado de la Cuenta</h3>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        <span className="text-green-800">Cuenta Activa</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Tu cuenta está verificada y en buen estado
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium text-gray-800 mb-4">Información de la Cuenta</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-gray-600">Usuario desde</Label>
                        <p className="font-medium">Enero 2024</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Última actividad</Label>
                        <p className="font-medium">Hoy</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">
                          {user?.role === 'client' ? 'Tours completados' :
                           user?.role === 'guide' ? 'Tours guiados' :
                           user?.role === 'advisor' ? 'Clientes atendidos' :
                           'Operaciones realizadas'}
                        </Label>
                        <p className="font-medium">
                          {user?.role === 'client' ? bookings.filter(b => b.status === 'confirmed').length :
                           user?.role === 'guide' ? '47' :
                           user?.role === 'advisor' ? '126' :
                           '89'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Tipo de cuenta</Label>
                        <p className="font-medium capitalize">{user?.role}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium text-gray-800 mb-4">Acciones Avanzadas</h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        Descargar mis datos
                      </Button>
                      {user?.role === 'client' && (
                        <Button variant="outline" className="w-full justify-start">
                          Exportar historial de reservas
                        </Button>
                      )}
                      {user?.role === 'guide' && (
                        <Button variant="outline" className="w-full justify-start">
                          Exportar historial de tours
                        </Button>
                      )}
                      {user?.role === 'advisor' && (
                        <Button variant="outline" className="w-full justify-start">
                          Exportar reporte de clientes
                        </Button>
                      )}
                      <Button variant="outline" className="w-full justify-start">
                        Solicitar verificación de cuenta
                      </Button>
                      {(user?.role === 'guide' || user?.role === 'advisor') && (
                        <Button variant="outline" className="w-full justify-start">
                          Solicitar capacitación adicional
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Delete Account Section */}
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center space-x-2">
                    <Trash2 className="w-6 h-6" />
                    <span>Zona de Peligro</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-800 mb-2">Eliminar Cuenta</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Esta acción eliminará permanentemente tu cuenta y todos los datos asociados. 
                        No podrás recuperar tu información una vez eliminada.
                      </p>
                    </div>
                    
                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar mi Cuenta
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente tu cuenta 
                            y se removerán todos tus datos de nuestros servidores.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="my-4">
                          <Label className="text-sm font-medium">
                            Para confirmar, escribe <strong>ELIMINAR</strong> en el campo de abajo:
                          </Label>
                          <Input
                            className="mt-2"
                            placeholder="ELIMINAR"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700"
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmText !== 'ELIMINAR'}
                          >
                            Eliminar Cuenta
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}