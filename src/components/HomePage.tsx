import React from 'react';
import { ArrowRight, Star, MapPin, Clock, Users, Shield, ChevronRight, Sparkles, TrendingUp, Facebook, Instagram, Twitter, Mail, Phone } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getFeaturedRoutes, mockFarms } from '../utils/mockData';
import { motion } from 'motion/react';
import heroImage from 'figma:asset/d8d3bc172f99829d8ecd1672db5f890e39054e24.png';

interface HomePageProps {
  onViewChange: (view: string, itemId?: string) => void;
}

export function HomePage({ onViewChange }: HomePageProps) {
  const featuredRoutes = getFeaturedRoutes();
  const featuredRoute = featuredRoutes[0]; // Primera ruta destacada

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src={heroImage}
            alt="Paisaje montañoso colombiano con senderista contemplando la naturaleza"
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(0.8) opacity(0.9)' }}
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl mb-6 text-white">
            Descubre la
            <span className="text-green-400 block">Naturaleza Colombiana</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto">
            Aventuras únicas en paisajes espectaculares con guías expertos y experiencias auténticas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => onViewChange('routes')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
            >
              Explorar Rutas
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => onViewChange('farms')}
              className="border-white text-white hover:bg-white hover:text-green-800 px-8 py-3 text-lg"
            >
              Ver Fincas
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Route Section */}
      {featuredRoute && (
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl mb-4 text-gray-800">Ruta Destacada</h2>
              <p className="text-xl text-gray-600">La experiencia más popular de esta temporada</p>
            </div>
            
            <Card className="overflow-hidden bg-white shadow-xl">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative h-64 md:h-full">
                  <ImageWithFallback
                    src={featuredRoute.image}
                    alt={featuredRoute.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-4 left-4 bg-green-600 text-white">
                    Destacado
                  </Badge>
                </div>
                
                <CardContent className="p-8 flex flex-col justify-center">
                  <h3 className="text-3xl mb-4 text-gray-800">{featuredRoute.name}</h3>
                  <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                    {featuredRoute.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">{featuredRoute.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Máx. {featuredRoute.maxGroupSize}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">{featuredRoute.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">{featuredRoute.difficulty}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-3xl text-green-600">
                        ${featuredRoute.price.toLocaleString()}
                      </span>
                      <span className="text-gray-500 ml-2">por persona</span>
                    </div>
                    <Button 
                      onClick={() => onViewChange('route-detail', featuredRoute.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Ver Detalles
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl mb-4 text-gray-800">¿Por qué elegirnos?</h2>
            <p className="text-xl text-gray-600">Experiencias únicas con los más altos estándares de calidad</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 border-none shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl mb-4 text-gray-800">Seguridad Garantizada</h3>
              <p className="text-gray-600">
                Guías certificados y equipos de seguridad de primera calidad para todas nuestras actividades.
              </p>
            </Card>
            
            <Card className="text-center p-8 border-none shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl mb-4 text-gray-800">Grupos Pequeños</h3>
              <p className="text-gray-600">
                Experiencias personalizadas con grupos reducidos para una mejor conexión con la naturaleza.
              </p>
            </Card>
            
            <Card className="text-center p-8 border-none shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl mb-4 text-gray-800">Destinos Únicos</h3>
              <p className="text-gray-600">
                Acceso exclusivo a lugares vírgenes y paisajes espectaculares fuera del turismo tradicional.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Inspirational CTA Section with Background Image */}
      <motion.section 
        className="relative py-32 px-4 overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1571245692302-0aa602fc33b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dGlmdWwlMjBmYXJtJTIwaG91c2UlMjBuYXR1cmV8ZW58MXx8fHwxNzY1MjIwNzE0fDA&ixlib=rb-4.1.0&q=80&w=1080)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/50 to-emerald-900/40"></div>
        </div>

        {/* Content */}
        <motion.div 
          className="relative z-10 max-w-4xl mx-auto text-center text-white"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-block mb-6"
          >
            <Sparkles className="w-16 h-16 text-green-300 mx-auto" />
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl mb-6">
            Vive la Experiencia de Finca Perfecta
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-green-100 leading-relaxed">
            Hospédate en nuestras fincas rurales de lujo, rodeado de naturaleza pura y comodidades excepcionales. 
            <span className="block mt-2">Relájate en espacios campestres únicos diseñados para tu descanso total.</span>
          </p>
        </motion.div>
      </motion.section>

      {/* Top Rated Farms Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center space-x-2 mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <Badge className="bg-green-600 text-white px-4 py-1 text-sm">
                Más Cotizadas 2024
              </Badge>
            </div>
            <h2 className="text-4xl mb-4 text-gray-800">Las Fincas Más Solicitadas del Año</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Descubre los destinos favoritos de nuestros clientes y reserva tu experiencia inolvidable
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Finca 1 - Vista del Valle (más cotizada) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -10 }}
            >
              <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-green-200">
                <div className="relative h-80">
                  <ImageWithFallback
                    src={mockFarms[5].image}
                    alt={mockFarms[5].name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                      <Star className="w-3 h-3 mr-1 fill-white" />
                      #1 Más Cotizada
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-2xl text-white mb-1">{mockFarms[5].name}</h3>
                        <div className="flex items-center space-x-1 text-green-300">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{mockFarms[5].location}</span>
                        </div>
                      </div>
                      <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2">
                        <div className="text-2xl text-green-600">${mockFarms[5].pricePerNight.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">por noche</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {mockFarms[5].shortDescription}
                  </p>
                  
                  <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-green-600" />
                      <span>Hasta {mockFarms[5].maxGuests} huéspedes</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {mockFarms[5].amenities.slice(0, 3).map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-green-300 text-green-700">
                        {amenity}
                      </Badge>
                    ))}
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      onClick={() => onViewChange('farm-detail', mockFarms[5].id)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Reservar Ahora
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Finca 2 - El Paraíso (segunda más cotizada) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ y: -10 }}
            >
              <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-blue-200">
                <div className="relative h-80">
                  <ImageWithFallback
                    src={mockFarms[0].image}
                    alt={mockFarms[0].name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                      <Star className="w-3 h-3 mr-1 fill-white" />
                      #2 Más Cotizada
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-2xl text-white mb-1">{mockFarms[0].name}</h3>
                        <div className="flex items-center space-x-1 text-blue-300">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{mockFarms[0].location}</span>
                        </div>
                      </div>
                      <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2">
                        <div className="text-2xl text-blue-600">${mockFarms[0].pricePerNight.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">por noche</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {mockFarms[0].shortDescription}
                  </p>
                  
                  <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Hasta {mockFarms[0].maxGuests} huéspedes</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {mockFarms[0].amenities.slice(0, 3).map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-blue-300 text-blue-700">
                        {amenity}
                      </Badge>
                    ))}
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      onClick={() => onViewChange('farm-detail', mockFarms[0].id)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Reservar Ahora
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl mb-6">¿Listo para tu próxima aventura?</h2>
          <p className="text-xl mb-8 text-green-100">
            Descubre paisajes únicos y vive experiencias inolvidables en la naturaleza colombiana
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => onViewChange('routes')}
              className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3"
            >
              Explorar Rutas
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => onViewChange('farms')}
              className="border-white text-white hover:bg-white hover:text-green-600 px-8 py-3"
            >
              Ver Fincas
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-white text-lg mb-4">Occitours</h3>
              <p className="text-sm mb-4">
                Tu mejor aliado para descubrir la magia de la naturaleza colombiana.
              </p>
              <div className="flex space-x-3">
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => onViewChange('home')} className="hover:text-green-400 transition-colors">
                    Inicio
                  </button>
                </li>
                <li>
                  <button onClick={() => onViewChange('routes')} className="hover:text-green-400 transition-colors">
                    Rutas
                  </button>
                </li>
                <li>
                  <button onClick={() => onViewChange('farms')} className="hover:text-green-400 transition-colors">
                    Fincas
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    Términos y Condiciones
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    Política de Privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    Políticas de Cancelación
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white mb-4">Ayuda y Contacto</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-green-400" />
                  <a href="mailto:info@occitours.com" className="hover:text-green-400 transition-colors">
                    info@occitours.com
                  </a>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-green-400" />
                  <a href="tel:+573001234567" className="hover:text-green-400 transition-colors">
                    +57 300 123 4567
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    Preguntas Frecuentes
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-400 transition-colors">
                    Centro de Ayuda
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Occitours. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}