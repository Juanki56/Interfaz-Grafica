// Mock data for Occitours platform
export interface Route {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  duration: string;
  difficulty: 'Fácil' | 'Moderado' | 'Difícil';
  price: number;
  image: string;
  gallery: string[];
  includes: string[];
  itinerary: {
    time: string;
    activity: string;
    description: string;
  }[];
  location: string;
  maxGroupSize: number;
  featured: boolean;
}

export interface Farm {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  location: string;
  image: string;
  gallery: string[];
  services: string[];
  activities: string[];
  pricePerNight: number;
  maxGuests: number;
  amenities: string[];
}

export interface TourPackage {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  duration: string;
  price: number;
  image: string;
  includes: string[];
  routes: string[]; // Route IDs
  farms: string[]; // Farm IDs
  featured: boolean;
}

export const mockRoutes: Route[] = [
  {
    id: '1',
    name: 'Sendero del Cóndor',
    description: 'Una experiencia única de senderismo a través de paisajes montañosos espectaculares donde podrás avistar cóndores en su hábitat natural.',
    shortDescription: 'Senderismo de montaña con avistamiento de cóndores',
    duration: '8 horas',
    difficulty: 'Moderado',
    price: 120000,
    image: 'https://images.unsplash.com/photo-1648804536048-0a7d8b103bbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGhpa2luZyUyMHRyYWlsJTIwc2NlbmljfGVufDF8fHx8MTc1Njk5MDg0MHww&ixlib=rb-4.1.0&q=80&w=1080',
    gallery: [
      'https://images.unsplash.com/photo-1648804536048-0a7d8b103bbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGhpa2luZyUyMHRyYWlsJTIwc2NlbmljfGVufDF8fHx8MTc1Njk5MDg0MHww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1722570132287-346fdb600005?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDb2xvbWJpYW4lMjBsYW5kc2NhcGUlMjBtb3VudGFpbiUyMHZpZXd8ZW58MXx8fHwxNzU3MDI4NjAxfDA&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    includes: ['Guía especializado', 'Equipo de seguridad', 'Refrigerio', 'Transporte ida y vuelta', 'Seguro de accidentes'],
    itinerary: [
      { time: '6:00 AM', activity: 'Punto de encuentro', description: 'Reunión en el centro de la ciudad' },
      { time: '7:00 AM', activity: 'Inicio del sendero', description: 'Caminata hacia el mirador principal' },
      { time: '10:00 AM', activity: 'Avistamiento de cóndores', description: 'Observación de aves en su hábitat natural' },
      { time: '12:00 PM', activity: 'Almuerzo', description: 'Refrigerio en el mirador' },
      { time: '2:00 PM', activity: 'Descenso', description: 'Regreso por sendero alternativo' },
      { time: '4:00 PM', activity: 'Finalización', description: 'Regreso al punto de encuentro' }
    ],
    location: 'Parque Nacional Natural',
    maxGroupSize: 12,
    featured: true
  },
  {
    id: '2',
    name: 'Valle de los Frailejones',
    description: 'Descubre la magia del páramo colombiano en una caminata ecológica entre frailejones centenarios y lagunas cristalinas.',
    shortDescription: 'Caminata ecológica en el páramo',
    duration: '6 horas',
    difficulty: 'Fácil',
    price: 85000,
    image: 'https://images.unsplash.com/photo-1722570132287-346fdb600005?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDb2xvbWJpYW4lMjBsYW5kc2NhcGUlMjBtb3VudGFpbiUyMHZpZXd8ZW58MXx8fHwxNzU3MDI4NjAxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    gallery: [
      'https://images.unsplash.com/photo-1722570132287-346fdb600005?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDb2xvbWJpYW4lMjBsYW5kc2NhcGUlMjBtb3VudGFpbiUyMHZpZXd8ZW58MXx8fHwxNzU3MDI4NjAxfDA&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    includes: ['Guía naturalista', 'Transporte', 'Refrigerio', 'Equipo básico'],
    itinerary: [
      { time: '8:00 AM', activity: 'Salida', description: 'Transporte hacia el páramo' },
      { time: '9:30 AM', activity: 'Inicio caminata', description: 'Sendero de los frailejones' },
      { time: '11:00 AM', activity: 'Laguna principal', description: 'Descanso y fotografías' },
      { time: '1:00 PM', activity: 'Almuerzo', description: 'Comida típica de la región' },
      { time: '2:30 PM', activity: 'Regreso', description: 'Caminata de vuelta' },
      { time: '4:00 PM', activity: 'Finalización', description: 'Retorno a la ciudad' }
    ],
    location: 'Páramo de Sumapaz',
    maxGroupSize: 15,
    featured: false
  },
  {
    id: '3',
    name: 'Cascadas Escondidas',
    description: 'Aventura extrema hacia cascadas vírgenes a través de senderos selvéticos y ríos cristalinos.',
    shortDescription: 'Aventura extrema a cascadas vírgenes',
    duration: '10 horas',
    difficulty: 'Difícil',
    price: 180000,
    image: 'https://images.unsplash.com/photo-1731838618091-9986fda09c01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjB0b3VyaXNtJTIwYWR2ZW50dXJlJTIwcGFja2FnZXxlbnwxfHx8fDE3NTcwMjg1OTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    gallery: [
      'https://images.unsplash.com/photo-1731838618091-9986fda09c01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjB0b3VyaXNtJTIwYWR2ZW50dXJlJTIwcGFja2FnZXxlbnwxfHx8fDE3NTcwMjg1OTh8MA&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    includes: ['Guía experto', 'Equipo completo de seguridad', 'Almuerzo', 'Transporte 4x4', 'Seguro premium'],
    itinerary: [
      { time: '5:00 AM', activity: 'Salida temprana', description: 'Transporte en vehículo 4x4' },
      { time: '7:00 AM', activity: 'Inicio trekking', description: 'Sendero selvético avanzado' },
      { time: '10:00 AM', activity: 'Primera cascada', description: 'Baño y descanso' },
      { time: '12:00 PM', activity: 'Almuerzo selvático', description: 'Comida en la naturaleza' },
      { time: '2:00 PM', activity: 'Cascada principal', description: 'Destino final y actividades acuáticas' },
      { time: '4:00 PM', activity: 'Regreso', description: 'Trekking de retorno' },
      { time: '6:00 PM', activity: 'Finalización', description: 'Retorno en vehículo' }
    ],
    location: 'Selva Húmeda Tropical',
    maxGroupSize: 8,
    featured: true
  },
  {
    id: '4',
    name: 'Camino Real Colonial',
    description: 'Recorre antiguos caminos empedrados de la época colonial, visitando pueblos patrimonio y miradores históricos.',
    shortDescription: 'Ruta histórica por caminos coloniales',
    duration: '7 horas',
    difficulty: 'Moderado',
    price: 95000,
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpYyUyMHRyYWlsJTIwY29sb21iaWF8ZW58MXx8fHwxNzU3MDI4NjA1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    gallery: [
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpYyUyMHRyYWlsJTIwY29sb21iaWF8ZW58MXx8fHwxNzU3MDI4NjA1fDA&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    includes: ['Guía histórico', 'Entrada a museos', 'Refrigerio tradicional', 'Transporte', 'Material educativo'],
    itinerary: [
      { time: '8:00 AM', activity: 'Salida', description: 'Punto de encuentro en plaza principal' },
      { time: '9:00 AM', activity: 'Camino empedrado', description: 'Inicio de recorrido histórico' },
      { time: '11:00 AM', activity: 'Pueblo patrimonio', description: 'Visita guiada y museo local' },
      { time: '1:00 PM', activity: 'Almuerzo típico', description: 'Comida en fonda tradicional' },
      { time: '2:30 PM', activity: 'Mirador colonial', description: 'Vista panorámica y fotografías' },
      { time: '3:30 PM', activity: 'Regreso', description: 'Retorno al punto de partida' }
    ],
    location: 'Santander',
    maxGroupSize: 20,
    featured: false
  },
  {
    id: '5',
    name: 'Aventura en Rápidos',
    description: 'Emocionante descenso en rafting por aguas bravas nivel III-IV, con paisajes espectaculares de cañón.',
    shortDescription: 'Rafting extremo en aguas bravas',
    duration: '5 horas',
    difficulty: 'Difícil',
    price: 165000,
    image: 'https://images.unsplash.com/photo-1554629947-334ff61d85dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYWZ0aW5nJTIwYWR2ZW50dXJlfGVufDF8fHx8MTc1NzAyODYwNnww&ixlib=rb-4.1.0&q=80&w=1080',
    gallery: [
      'https://images.unsplash.com/photo-1554629947-334ff61d85dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYWZ0aW5nJTIwYWR2ZW50dXJlfGVufDF8fHx8MTc1NzAyODYwNnww&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    includes: ['Instructor certificado', 'Equipo completo de rafting', 'Chaleco salvavidas', 'Casco', 'Almuerzo', 'Seguro de accidentes', 'Transporte', 'Fotografía de la experiencia'],
    itinerary: [
      { time: '8:00 AM', activity: 'Preparación', description: 'Instrucciones y equipamiento' },
      { time: '9:00 AM', activity: 'Calentamiento', description: 'Rápidos nivel I-II' },
      { time: '10:30 AM', activity: 'Rápidos avanzados', description: 'Descenso nivel III-IV' },
      { time: '12:00 PM', activity: 'Descanso', description: 'Almuerzo en la ribera' },
      { time: '1:00 PM', activity: 'Finalización', description: 'Regreso y entrega de fotos' }
    ],
    location: 'Río Suárez',
    maxGroupSize: 16,
    featured: true
  },
  {
    id: '6',
    name: 'Observatorio de Estrellas',
    description: 'Excursión nocturna a alta montaña para observación astronómica con telescopios profesionales.',
    shortDescription: 'Observación de estrellas en alta montaña',
    duration: '6 horas',
    difficulty: 'Fácil',
    price: 75000,
    image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFycyUyMG5pZ2h0JTIwc2t5fGVufDF8fHx8MTc1NzAyODYwN3ww&ixlib=rb-4.1.0&q=80&w=1080',
    gallery: [
      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFycyUyMG5pZ2h0JTIwc2t5fGVufDF8fHx8MTc1NzAyODYwN3ww&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    includes: ['Astrónomo guía', 'Telescopios profesionales', 'Binoculares', 'Cena caliente', 'Bebidas', 'Mantas térmicas', 'Transporte', 'Charla educativa'],
    itinerary: [
      { time: '6:00 PM', activity: 'Salida', description: 'Transporte a zona de observación' },
      { time: '7:00 PM', activity: 'Instalación', description: 'Preparación de equipos' },
      { time: '8:00 PM', activity: 'Observación', description: 'Estrellas, planetas y constelaciones' },
      { time: '10:00 PM', activity: 'Cena', description: 'Refrigerio bajo las estrellas' },
      { time: '11:00 PM', activity: 'Regreso', description: 'Retorno a la ciudad' }
    ],
    location: 'Páramo de Chingaza',
    maxGroupSize: 25,
    featured: false
  },
  {
    id: '7',
    name: 'Ruta del Café Premium',
    description: 'Tour exclusivo por fincas cafeteras de alta calidad, con cata profesional y proceso completo del café.',
    shortDescription: 'Tour premium del café con cata profesional',
    duration: '9 horas',
    difficulty: 'Fácil',
    price: 135000,
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBmYXJtJTIwY29sb21iaWF8ZW58MXx8fHwxNzU3MDI4NjA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    gallery: [
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBmYXJtJTIwY29sb21iaWF8ZW58MXx8fHwxNzU3MDI4NjA4fDA&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    includes: ['Catador profesional', 'Visita a 3 fincas', 'Cata de 10 variedades', 'Almuerzo gourmet', 'Café de regalo', 'Transporte privado', 'Material educativo'],
    itinerary: [
      { time: '7:00 AM', activity: 'Recogida', description: 'Transporte desde el hotel' },
      { time: '8:30 AM', activity: 'Primera finca', description: 'Proceso de recolección' },
      { time: '10:00 AM', activity: 'Segunda finca', description: 'Tostado y procesamiento' },
      { time: '12:00 PM', activity: 'Almuerzo', description: 'Comida en finca cafetera' },
      { time: '2:00 PM', activity: 'Tercera finca', description: 'Cata profesional' },
      { time: '4:00 PM', activity: 'Finalización', description: 'Regreso con café premium' }
    ],
    location: 'Eje Cafetero',
    maxGroupSize: 10,
    featured: true
  },
  {
    id: '8',
    name: 'Expedición Fotográfica Natural',
    description: 'Ruta diseñada para fotógrafos, visitando los mejores spots naturales al amanecer y atardecer.',
    shortDescription: 'Tour fotográfico en los mejores paisajes',
    duration: '12 horas',
    difficulty: 'Moderado',
    price: 145000,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjBwaG90b2dyYXBoeXxlbnwxfHx8fDE3NTcwMjg2MDl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    gallery: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjBwaG90b2dyYXBoeXxlbnwxfHx8fDE3NTcwMjg2MDl8MA&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    includes: ['Fotógrafo guía profesional', 'Acceso a locaciones exclusivas', 'Desayuno y almuerzo', 'Tips de fotografía', 'Transporte 4x4', 'Edición básica de fotos'],
    itinerary: [
      { time: '4:30 AM', activity: 'Salida pre-amanecer', description: 'Transporte al primer punto' },
      { time: '5:30 AM', activity: 'Golden hour mañana', description: 'Fotografía de amanecer' },
      { time: '8:00 AM', activity: 'Desayuno', description: 'Refrigerio en mirador' },
      { time: '9:00 AM', activity: 'Cascadas y bosque', description: 'Fotografía de naturaleza' },
      { time: '12:00 PM', activity: 'Almuerzo', description: 'Comida y revisión de fotos' },
      { time: '2:00 PM', activity: 'Páramo', description: 'Paisajes de altura' },
      { time: '5:00 PM', activity: 'Golden hour tarde', description: 'Atardecer épico' },
      { time: '6:30 PM', activity: 'Regreso', description: 'Retorno con galería digital' }
    ],
    location: 'Cordillera Central',
    maxGroupSize: 8,
    featured: false
  }
];

export const mockFarms: Farm[] = [
  {
    id: '1',
    name: 'Finca El Paraíso',
    description: 'Una hermosa finca cafetera ubicada en las montañas, perfecta para desconectarse y disfrutar de la naturaleza.',
    shortDescription: 'Finca cafetera de montaña con vistas espectaculares',
    location: 'Zona Cafetera',
    image: 'https://images.unsplash.com/photo-1677207856236-37bd1aee7011?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydXJhbCUyMGZhcm0lMjBob3VzZSUyMGNvdW50cnlzaWRlfGVufDF8fHx8MTc1NzAxNTgzN3ww&ixlib=rb-4.1.0&q=80&w=1080',
    gallery: [
      'https://images.unsplash.com/photo-1677207856236-37bd1aee7011?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydXJhbCUyMGZhcm0lMjBob3VzZSUyMGNvdW50cnlzaWRlfGVufDF8fHx8MTc1NzAxNTgzN3ww&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    services: ['Alojamiento rural', 'Comidas típicas', 'Tour del café', 'Senderismo'],
    activities: ['Recolección de café', 'Observación de aves', 'Caminatas ecológicas', 'Talleres artesanales'],
    pricePerNight: 150000,
    maxGuests: 8,
    amenities: ['WiFi', 'Agua caliente', 'Cocina equipada', 'Zona de fogata', 'Piscina natural']
  },
  {
    id: '2',
    name: 'Hacienda Las Flores',
    description: 'Tradicional hacienda ganadera con amplios espacios verdes y actividades ecológicas para toda la familia.',
    shortDescription: 'Hacienda ganadera familiar con actividades ecológicas',
    location: 'Llanos Orientales',
    image: 'https://images.unsplash.com/photo-1677207856236-37bd1aee7011?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydXJhbCUyMGZhcm0lMjBob3VzZSUyMGNvdW50cnlzaWRlfGVufDF8fHx8MTc1NzAxNTgzN3ww&ixlib=rb-4.1.0&q=80&w=1080',
    gallery: [
      'https://images.unsplash.com/photo-1677207856236-37bd1aee7011?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydXJhbCUyMGZhcm0lMjBob3VzZSUyMGNvdW50cnlzaWRlfGVufDF8fHx8MTc1NzAxNTgzN3ww&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    services: ['Hospedaje familiar', 'Comida criolla', 'Cabalgatas', 'Pesca deportiva'],
    activities: ['Ordeño de vacas', 'Cabalgatas al atardecer', 'Pesca en estanque', 'Fogatas nocturnas'],
    pricePerNight: 120000,
    maxGuests: 12,
    amenities: ['Área BBQ', 'Cancha de fútbol', 'Zona de juegos', 'Hamacas', 'Establo']
  },
  {
    id: '3',
    name: 'Villa Verde Ecológica',
    description: 'Refugio ecológico en medio del bosque nublado, ideal para observación de flora y fauna silvestre.',
    shortDescription: 'Eco-lodge en bosque nublado para naturalistas',
    location: 'Bosque Andino',
    image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlY28lMjBsb2RnZSUyMG5hdHVyZXxlbnwxfHx8fDE3NTcwMjg2MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    gallery: [
      'https://images.unsplash.com/photo-1464207687429-7505649dae38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlY28lMjBsb2RnZSUyMG5hdHVyZXxlbnwxfHx8fDE3NTcwMjg2MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    services: ['Cabañas ecológicas', 'Alimentación orgánica', 'Guías naturalistas', 'Observación de aves'],
    activities: ['Avistamiento de aves', 'Senderismo interpretativo', 'Fotografía de naturaleza', 'Talleres de conservación'],
    pricePerNight: 180000,
    maxGuests: 6,
    amenities: ['Energía solar', 'Senderos privados', 'Mirador de aves', 'Biblioteca natural', 'Telescopio']
  },
  {
    id: '4',
    name: 'Rancho del Sol',
    description: 'Auténtico rancho llanero con experiencias ganaderas y actividades ecuestres tradicionales.',
    shortDescription: 'Rancho llanero con experiencias ganaderas auténticas',
    location: 'Sabanas del Meta',
    image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYW5jaCUyMGhvcnNlcyUyMGNvdW50cnl8ZW58MXx8fHwxNzU3MDI4NjAzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    gallery: [
      'https://images.unsplash.com/photo-1560493676-04071c5f467b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYW5jaCUyMGhvcnNlcyUyMGNvdW50cnl8ZW58MXx8fHwxNzU3MDI4NjAzfDA&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    services: ['Alojamiento campestre', 'Comida llanera', 'Cabalgatas guiadas', 'Shows folclóricos'],
    activities: ['Trabajo de llano', 'Ordeño tradicional', 'Coleo', 'Asados llaneros', 'Música tradicional'],
    pricePerNight: 130000,
    maxGuests: 10,
    amenities: ['Corrales', 'Pista de coleo', 'Fogón llanero', 'Piscina', 'Jardines tropicales']
  },
  {
    id: '5',
    name: 'Casa de Campo Riverside',
    description: 'Encantadora casa rural a orillas del río, perfecta para familias que buscan tranquilidad y actividades acuáticas.',
    shortDescription: 'Casa campestre junto al río con actividades acuáticas',
    location: 'Valle del Cauca',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaXZlciUyMGhvdXNlJTIwY291bnRyeXNpZGV8ZW58MXx8fHwxNzU3MDI4NjA0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    gallery: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaXZlciUyMGhvdXNlJTIwY291bnRyeXNpZGV8ZW58MXx8fHwxNzU3MDI4NjA0fDA&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    services: ['Hospedaje familiar', 'Desayuno incluido', 'Kayaks disponibles', 'Pesca deportiva'],
    activities: ['Kayak en río', 'Pesca artesanal', 'Senderismo ribereño', 'Picnic playero', 'Natación'],
    pricePerNight: 140000,
    maxGuests: 8,
    amenities: ['Muelle privado', 'Kayaks', 'Asador', 'Terraza con río', 'WiFi', 'Zona de juegos']
  },
  {
    id: '6',
    name: 'Finca Vista del Valle',
    description: 'Espectacular finca con panorámicas 360° del valle, ideal para eventos y retiros corporativos o familiares.',
    shortDescription: 'Finca panorámica perfecta para eventos',
    location: 'Cundinamarca',
    image: 'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VudHJ5JTIwaG91c2UlMjB2aWV3fGVufDF8fHx8MTc1NzAyODYxMHww&ixlib=rb-4.1.0&q=80&w=1080',
    gallery: [
      'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VudHJ5JTIwaG91c2UlMjB2aWV3fGVufDF8fHx8MTc1NzAyODYxMHww&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    services: ['Hospedaje Premium', 'Chef privado disponible', 'Salón de eventos', 'Servicio de catering'],
    activities: ['Yoga al amanecer', 'Senderismo guiado', 'Ciclomontañismo', 'Meditación', 'Talleres wellness'],
    pricePerNight: 250000,
    maxGuests: 15,
    amenities: ['Piscina infinity', 'Jacuzzi', 'Salón eventos', 'WiFi alta velocidad', 'Cancha tenis', 'Gimnasio']
  },
  {
    id: '7',
    name: 'Refugio de Montaña Los Pinos',
    description: 'Cabaña rústica en zona de bosque alto andino, perfecta para aventureros y amantes del frío.',
    shortDescription: 'Cabaña de montaña para aventureros',
    location: 'Boyacá',
    image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGNhYmlufGVufDF8fHx8MTc1NzAyODYxMXww&ixlib=rb-4.1.0&q=80&w=1080',
    gallery: [
      'https://images.unsplash.com/photo-1542718610-a1d656d1884c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGNhYmlufGVufDF8fHx8MTc1NzAyODYxMXww&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    services: ['Alojamiento rústico', 'Desayuno campestre', 'Guías de montaña', 'Leña para chimenea'],
    activities: ['Trekking extremo', 'Escalada en roca', 'Observación fauna', 'Campamento', 'Fotografía silvestre'],
    pricePerNight: 95000,
    maxGuests: 6,
    amenities: ['Chimenea a leña', 'Cocina rústica', 'Senderos marcados', 'Mirador natural', 'Estacionamiento']
  },
  {
    id: '8',
    name: 'Granja Orgánica El Sembrador',
    description: 'Granja agroecológica familiar donde podrás aprender sobre cultivos orgánicos y sostenibilidad.',
    shortDescription: 'Granja orgánica educativa y familiar',
    location: 'Antioquia',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwZmFybXxlbnwxfHx8fDE3NTcwMjg2MTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    gallery: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwZmFybXxlbnwxfHx8fDE3NTcwMjg2MTJ8MA&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    services: ['Alojamiento ecológico', 'Comida 100% orgánica', 'Talleres agrícolas', 'Mercado de productos'],
    activities: ['Cosecha de vegetales', 'Compostaje', 'Apicultura', 'Elaboración mermeladas', 'Granja de animales'],
    pricePerNight: 110000,
    maxGuests: 10,
    amenities: ['Huerta orgánica', 'Gallinero', 'Apiario', 'Zona compostaje', 'Tienda de productos', 'WiFi básico']
  }
];

export const mockPackages: TourPackage[] = [
  {
    id: '1',
    name: 'Aventura Completa de Montaña',
    description: 'Paquete de 3 días que combina senderismo extremo y hospedaje en finca cafetera.',
    shortDescription: 'Paquete de aventura de montaña con hospedaje rural',
    duration: '3 días / 2 noches',
    price: 450000,
    image: 'https://images.unsplash.com/photo-1648804536048-0a7d8b103bbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGhpa2luZyUyMHRyYWlsJTIwc2NlbmljfGVufDF8fHx8MTc1Njk5MDg0MHww&ixlib=rb-4.1.0&q=80&w=1080',
    includes: [
      'Sendero del Cóndor',
      'Cascadas Escondidas', 
      '2 noches en Finca El Paraíso',
      'Todas las comidas',
      'Transporte incluido',
      'Guías especializados'
    ],
    routes: ['1', '3'],
    farms: ['1'],
    featured: true
  },
  {
    id: '2',
    name: 'Escapada Rural Relajante',
    description: 'Fin de semana perfecto para desconectarse en el campo con actividades suaves.',
    shortDescription: 'Fin de semana rural con actividades relajantes',
    duration: '2 días / 1 noche',
    price: 280000,
    image: 'https://images.unsplash.com/photo-1677207856236-37bd1aee7011?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydXJhbCUyMGZhcm0lMjBob3VzZSUyMGNvdW50cnlzaWRlfGVufDF8fHx8MTc1NzAxNTgzN3ww&ixlib=rb-4.1.0&q=80&w=1080',
    includes: [
      'Valle de los Frailejones',
      '1 noche en Hacienda Las Flores',
      'Comidas típicas',
      'Actividades de granja',
      'Transporte'
    ],
    routes: ['2'],
    farms: ['2'],
    featured: false
  },
  {
    id: '3',
    name: 'Experiencia Ecológica Completa',
    description: 'Sumérgete en la naturaleza con este paquete de 4 días que combina bosques nublados y cascadas vírgenes.',
    shortDescription: 'Inmersión total en bosque nublado y cascadas',
    duration: '4 días / 3 noches',
    price: 620000,
    image: 'https://images.unsplash.com/photo-1731838618091-9986fda09c01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjB0b3VyaXNtJTIwYWR2ZW50dXJlJTIwcGFja2FnZXxlbnwxfHx8fDE3NTcwMjg1OTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    includes: [
      'Cascadas Escondidas',
      'Valle de los Frailejones',
      '3 noches en Villa Verde Ecológica',
      'Todas las comidas orgánicas',
      'Guías naturalistas',
      'Transporte 4x4',
      'Talleres de conservación'
    ],
    routes: ['2', '3'],
    farms: ['3'],
    featured: true
  },
  {
    id: '4',
    name: 'Aventura Llanera Tradicional',
    description: 'Vive la auténtica experiencia llanera con cabalgatas, trabajo de campo y cultura tradicional.',
    shortDescription: 'Experiencia auténtica de los llanos colombianos',
    duration: '3 días / 2 noches',
    price: 380000,
    image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYW5jaCUyMGhvcnNlcyUyMGNvdW50cnl8ZW58MXx8fHwxNzU3MDI4NjAzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    includes: [
      'Sendero del Cóndor',
      '2 noches en Rancho del Sol',
      'Comida llanera tradicional',
      'Cabalgatas diarias',
      'Show de música llanera',
      'Actividades ganaderas',
      'Transporte'
    ],
    routes: ['1'],
    farms: ['4'],
    featured: false
  }
];

// Helper functions
export const getRouteById = (id: string): Route | undefined => {
  return mockRoutes.find(route => route.id === id);
};

export const getFarmById = (id: string): Farm | undefined => {
  return mockFarms.find(farm => farm.id === id);
};

export const getPackageById = (id: string): TourPackage | undefined => {
  return mockPackages.find(pkg => pkg.id === id);
};

export const getFeaturedRoutes = (): Route[] => {
  return mockRoutes.filter(route => route.featured);
};

export const getFeaturedPackages = (): TourPackage[] => {
  return mockPackages.filter(pkg => pkg.featured);
};

// Restaurant interfaces and data
export interface Restaurant {
  id: number;
  name: string;
  mealType: 'desayuno' | 'almuerzo' | 'refrigerio';
  price: number;
  description: string;
  rating: number;
  associatedRoutes: string[]; // Route IDs that can optionally include this restaurant
}

export const mockRestaurants: Restaurant[] = [
  {
    id: 1,
    name: 'Café del Sendero',
    mealType: 'desayuno',
    price: 20000,
    description: 'Desayuno típico colombiano con café orgánico y arepas',
    rating: 4.7,
    associatedRoutes: ['1', '2']
  },
  {
    id: 2,
    name: 'El Mirador Andino',
    mealType: 'almuerzo',
    price: 32000,
    description: 'Almuerzo completo con vista panorámica a las montañas',
    rating: 4.8,
    associatedRoutes: ['1', '3']
  },
  {
    id: 3,
    name: 'Sabores del Páramo',
    mealType: 'refrigerio',
    price: 15000,
    description: 'Refrigerio con productos locales y bebidas calientes',
    rating: 4.6,
    associatedRoutes: ['2']
  },
  {
    id: 4,
    name: 'Fogón de Montaña',
    mealType: 'almuerzo',
    price: 35000,
    description: 'Cocina tradicional con trucha fresca y acompañamientos típicos',
    rating: 4.9,
    associatedRoutes: ['3']
  },
  {
    id: 5,
    name: 'El Descanso del Viajero',
    mealType: 'desayuno',
    price: 18000,
    description: 'Desayuno casero con productos de la finca',
    rating: 4.5,
    associatedRoutes: ['3']
  }
];

// Get restaurants available for a specific route
export const getRestaurantsByRoute = (routeId: string): Restaurant[] => {
  return mockRestaurants.filter(restaurant => 
    restaurant.associatedRoutes.includes(routeId)
  );
};