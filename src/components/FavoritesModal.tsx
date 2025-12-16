import React, { useState } from 'react';
import { Heart, X, Star, MapPin, Clock, Users, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookTour?: (tourId: string) => void;
}

export function FavoritesModal({ isOpen, onClose, onBookTour }: FavoritesModalProps) {
  const [favorites, setFavorites] = useState([
    {
      id: '1',
      name: 'Caminata Sierra Nevada',
      description: 'Explora los senderos más hermosos de la Sierra Nevada con vistas espectaculares.',
      price: 150000,
      duration: '8 horas',
      difficulty: 'Moderado',
      location: 'Sierra Nevada',
      rating: 4.8,
      reviews: 124,
      image: 'https://images.unsplash.com/photo-1538422314488-83e8e11d298c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWtpbmclMjB0cmFpbCUyMGZvcmVzdHxlbnwxfHx8fDE3NTY5NjQ4NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      dateAdded: '2024-09-01',
      category: 'Senderismo'
    },
    {
      id: '2',
      name: 'Tour Cafetero Auténtico',
      description: 'Vive la experiencia completa del café desde la planta hasta la taza.',
      price: 120000,
      duration: '6 horas',
      difficulty: 'Fácil',
      location: 'Eje Cafetero',
      rating: 4.9,
      reviews: 89,
      image: 'https://images.unsplash.com/photo-1750967613671-297f1b63038d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBwbGFudGF0aW9uJTIwY29sb21iaWF8ZW58MXx8fHwxNzU2OTQ5OTA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
      dateAdded: '2024-08-28',
      category: 'Cultural'
    },
    {
      id: '3',
      name: 'Finca El Paraíso',
      description: 'Disfruta de la tranquilidad del campo en una finca eco-sostenible.',
      price: 85000,
      duration: '1 día completo',
      difficulty: 'Fácil',
      location: 'Quindío',
      rating: 4.7,
      reviews: 156,
      image: 'https://images.unsplash.com/photo-1635148040718-acf281233b8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMG5hdHVyZXxlbnwxfHx8fDE3NTY5NDQxMTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      dateAdded: '2024-09-05',
      category: 'Finca'
    },
    {
      id: '4',
      name: 'Paquete Aventura Completa',
      description: 'Tres días de aventura con diferentes actividades al aire libre.',
      price: 340000,
      duration: '3 días, 2 noches',
      difficulty: 'Avanzado',
      location: 'Multi-destino',
      rating: 4.8,
      reviews: 67,
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGFkdmVudHVyZXxlbnwxfHx8fDE3NTY5NDQ0Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      dateAdded: '2024-08-20',
      category: 'Paquete'
    }
  ]);

  const removeFavorite = (id: string) => {
    setFavorites(favorites.filter(fav => fav.id !== id));
    toast.success('Eliminado de favoritos', {
      description: 'El tour ha sido removido de tus favoritos.'
    });
  };

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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Senderismo':
        return 'bg-green-100 text-green-800';
      case 'Cultural':
        return 'bg-blue-100 text-blue-800';
      case 'Finca':
        return 'bg-yellow-100 text-yellow-800';
      case 'Paquete':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] bg-white shadow-xl border-2 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500" />
            <div>
              <CardTitle className="text-xl">Mis Favoritos</CardTitle>
              <p className="text-sm text-muted-foreground">{favorites.length} experiencias guardadas</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-red-100">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-6">
              {favorites.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No tienes favoritos aún</h3>
                  <p className="text-muted-foreground">
                    Explora nuestros tours y marca los que más te gusten con el corazón ❤️
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {favorites.map((favorite) => (
                    <Card key={favorite.id} className="border hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex space-x-4">
                          {/* Image */}
                          <div className="flex-shrink-0">
                            <img
                              src={favorite.image}
                              alt={favorite.name}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{favorite.name}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {favorite.description}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFavorite(favorite.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <Heart className="w-5 h-5 text-red-500 fill-current" />
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {favorite.duration}
                              </span>
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {favorite.location}
                              </span>
                              <span className="flex items-center">
                                <Star className="w-3 h-3 mr-1 text-yellow-500" />
                                {favorite.rating} ({favorite.reviews} reseñas)
                              </span>
                            </div>

                            {/* Badges */}
                            <div className="flex items-center space-x-2 mb-3">
                              <Badge className={getCategoryColor(favorite.category)}>
                                {favorite.category}
                              </Badge>
                              <Badge className={getDifficultyColor(favorite.difficulty)}>
                                {favorite.difficulty}
                              </Badge>
                            </div>

                            {/* Price and Actions */}
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-lg font-bold text-green-600">
                                  ${favorite.price.toLocaleString()}
                                </span>
                                <span className="text-sm text-muted-foreground ml-1">
                                  por persona
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-green-600 text-green-600 hover:bg-green-50"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Ver Detalles
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    if (onBookTour) {
                                      onBookTour(favorite.id);
                                      onClose();
                                    }
                                  }}
                                >
                                  Reservar
                                </Button>
                              </div>
                            </div>

                            <Separator className="my-3" />
                            <p className="text-xs text-muted-foreground">
                              Agregado el {new Date(favorite.dateAdded).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        {favorites.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Total de favoritos: {favorites.length}
              </p>
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}