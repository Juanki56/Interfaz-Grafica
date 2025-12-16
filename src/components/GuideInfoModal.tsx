import React, { useState } from 'react';
import { X, Star, MessageCircle, Phone, Mail, Award, MapPin, Calendar, Users, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';

interface GuideInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: () => void;
  guideId?: string;
}

export function GuideInfoModal({ isOpen, onClose, onStartChat, guideId }: GuideInfoModalProps) {
  // Mock guide data - en una app real vendría de una API
  const guide = {
    id: guideId || 'guide-1',
    name: 'Carlos Ruiz Montoya',
    role: 'Guía Especializado en Senderismo',
    avatar: '',
    rating: 4.9,
    totalReviews: 247,
    experience: '8 años',
    languages: ['Español', 'Inglés', 'Portugués'],
    location: 'Santa Marta, Magdalena',
    phone: '+57 300 123 4567',
    email: 'carlos.ruiz@occitours.com',
    bio: 'Apasionado por la naturaleza y la aventura, Carlos ha dedicado los últimos 8 años a mostrar la belleza de la Sierra Nevada a viajeros de todo el mundo. Su conocimiento profundo de la flora, fauna y cultura local hace que cada experiencia sea única e inolvidable.',
    specialties: [
      'Senderismo de alta montaña',
      'Avistamiento de aves',
      'Fotografía de naturaleza',
      'Historia cultural local'
    ],
    certifications: [
      'Certificado en Primeros Auxilios',
      'Guía Oficial de Turismo SENA',
      'Especialización en Eco-turismo',
      'Curso de Seguridad en Montaña'
    ],
    statistics: {
      toursCompleted: 342,
      clientsGuided: 1250,
      yearsActive: 8,
      successRate: 99.2
    },
    upcomingTours: [
      {
        id: '1',
        name: 'Caminata Sierra Nevada',
        date: '2024-09-15',
        participants: 8,
        duration: '8 horas'
      },
      {
        id: '2',
        name: 'Tour Cafetero',
        date: '2024-09-18',
        participants: 6,
        duration: '6 horas'
      }
    ],
    recentReviews: [
      {
        id: '1',
        client: 'María López',
        rating: 5,
        comment: 'Carlos fue increíble! Su conocimiento sobre la flora local y su pasión por el senderismo hicieron que el tour fuera inolvidable.',
        date: '2024-09-01',
        tour: 'Caminata Sierra Nevada'
      },
      {
        id: '2',
        client: 'Pedro García',
        rating: 5,
        comment: 'Excelente guía, muy profesional y siempre atento a la seguridad del grupo. Lo recomiendo 100%.',
        date: '2024-08-28',
        tour: 'Avistamiento de Aves'
      },
      {
        id: '3',
        client: 'Ana Jiménez',
        rating: 5,
        comment: 'Carlos conoce cada rincón de la sierra. Sus historias y explicaciones enriquecieron mucho la experiencia.',
        date: '2024-08-25',
        tour: 'Tour Cultural'
      }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300',
      'https://images.unsplash.com/photo-1602080858428-57174f9431cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300'
    ]
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] bg-white shadow-xl border-2 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-green-100 text-green-700 text-lg">
                {guide.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{guide.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{guide.role}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="font-semibold">{guide.rating}</span>
              <span className="text-sm text-muted-foreground">({guide.totalReviews} reseñas)</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-red-100">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-6">
              <Tabs defaultValue="info" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Información</TabsTrigger>
                  <TabsTrigger value="reviews">Reseñas ({guide.totalReviews})</TabsTrigger>
                  <TabsTrigger value="tours">Tours</TabsTrigger>
                  <TabsTrigger value="gallery">Galería</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-6">
                  {/* Quick Actions */}
                  <div className="flex space-x-3">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={onStartChat}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Enviar Mensaje
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Phone className="w-4 h-4 mr-2" />
                      Llamar
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  </div>

                  {/* Bio */}
                  <div>
                    <h3 className="font-semibold mb-2">Sobre Carlos</h3>
                    <p className="text-muted-foreground">{guide.bio}</p>
                  </div>

                  {/* Key Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{guide.statistics.toursCompleted}</div>
                      <div className="text-sm text-muted-foreground">Tours completados</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{guide.statistics.clientsGuided}</div>
                      <div className="text-sm text-muted-foreground">Clientes guiados</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{guide.statistics.yearsActive}</div>
                      <div className="text-sm text-muted-foreground">Años de experiencia</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{guide.statistics.successRate}%</div>
                      <div className="text-sm text-muted-foreground">Tasa de éxito</div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h3 className="font-semibold mb-3">Información de contacto</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{guide.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{guide.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{guide.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Languages */}
                  <div>
                    <h3 className="font-semibold mb-3">Idiomas</h3>
                    <div className="flex space-x-2">
                      {guide.languages.map((lang) => (
                        <Badge key={lang} variant="secondary">{lang}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Specialties */}
                  <div>
                    <h3 className="font-semibold mb-3">Especialidades</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {guide.specialties.map((specialty) => (
                        <div key={specialty} className="flex items-center space-x-2">
                          <Award className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{specialty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div>
                    <h3 className="font-semibold mb-3">Certificaciones</h3>
                    <div className="space-y-2">
                      {guide.certifications.map((cert) => (
                        <div key={cert} className="flex items-center space-x-2">
                          <Badge className="bg-blue-100 text-blue-800">{cert}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Reseñas de clientes</h3>
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span className="font-semibold">{guide.rating}</span>
                      <span className="text-muted-foreground">de {guide.totalReviews} reseñas</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {guide.recentReviews.map((review) => (
                      <Card key={review.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{review.client}</h4>
                              <p className="text-sm text-muted-foreground">{review.tour}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm mb-2">{review.comment}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.date).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="tours" className="space-y-4">
                  <h3 className="font-semibold">Próximos tours</h3>
                  <div className="space-y-3">
                    {guide.upcomingTours.map((tour) => (
                      <Card key={tour.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{tour.name}</h4>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {tour.date}
                                </span>
                                <span className="flex items-center">
                                  <Users className="w-3 h-3 mr-1" />
                                  {tour.participants} personas
                                </span>
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {tour.duration}
                                </span>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">Confirmado</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="gallery" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Galería de fotos</h3>
                    <Button variant="outline" size="sm">
                      <Camera className="w-4 h-4 mr-2" />
                      Ver todas
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {guide.gallery.map((image, index) => (
                      <div key={index} className="aspect-square overflow-hidden rounded-lg">
                        <img
                          src={image}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </CardContent>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Miembro desde {new Date().getFullYear() - guide.statistics.yearsActive}
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={onStartChat}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contactar
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}