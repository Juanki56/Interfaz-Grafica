// Mock data for admin dashboard sections - LIMPIO SIN CONTENIDO MÉDICO

export const mockUsers = [
  { id: '1', name: 'Carlos Ruiz', email: 'carlos@occitours.com', role: 'guide', status: 'Activo', joinDate: '2024-01-15', phone: '+57 301 234 5678' },
  { id: '2', name: 'Ana García', email: 'ana@occitours.com', role: 'advisor', status: 'Activo', joinDate: '2024-02-10', phone: '+57 310 987 6543' },
  { id: '3', name: 'María López', email: 'maria@occitours.com', role: 'client', status: 'Activo', joinDate: '2024-03-05', phone: '+57 320 456 7890' },
  { id: '4', name: 'Pedro Martínez', email: 'pedro@occitours.com', role: 'guide', status: 'Inactivo', joinDate: '2024-01-20', phone: '+57 315 234 5678' },
  { id: '5', name: 'Sofia Herrera', email: 'sofia@occitours.com', role: 'advisor', status: 'Activo', joinDate: '2024-02-28', phone: '+57 300 789 1234' }
];

export const mockPackages = [];

export const mockBookings = [
  { id: 'BK001', clientName: 'María López', clientEmail: 'maria@occitours.com', service: 'Tour Cafetero Premium', date: '2024-12-15', status: 'Confirmada', participants: 4, adults: 3, children: 1, total: 2400000, totalAmount: 2400000, guide: 'Carlos Ruiz', route: 'Ruta del Café', createdDate: '2024-12-01', paymentStatus: 'Pagado', paymentMethod: 'Transferencia', paymentReceipt: 'https://images.unsplash.com/photo-1603940516962-4976f0d44a19?w=800', specialRequests: '' },
  { id: 'BK002', clientName: 'Juan Pérez', clientEmail: 'juan.perez@email.com', service: 'Aventura en Finca', date: '2024-12-18', status: 'Pendiente', participants: 2, adults: 2, children: 0, total: 1200000, totalAmount: 1200000, guide: 'Carlos Ruiz', route: 'Finca El Paraíso', createdDate: '2024-12-03', paymentStatus: 'Abono', paymentMethod: 'Efectivo', paymentReceipt: 'https://images.unsplash.com/photo-1603940516962-4976f0d44a19?w=800', specialRequests: '' },
  { id: 'BK003', clientName: 'Ana Martínez', clientEmail: 'ana.martinez@email.com', service: 'Ruta Ecológica', date: '2024-12-20', status: 'Confirmada', participants: 6, adults: 4, children: 2, total: 3600000, totalAmount: 3600000, guide: 'Pedro Martínez', route: 'Sendero Verde', createdDate: '2024-12-05', paymentStatus: 'Pagado', paymentMethod: 'Tarjeta', paymentReceipt: 'https://images.unsplash.com/photo-1603940516962-4976f0d44a19?w=800', specialRequests: 'Alimentación vegetariana' },
  { id: 'BK004', clientName: 'Carlos Gómez', clientEmail: 'carlos.gomez@email.com', service: 'Tour Histórico', date: '2024-12-22', status: 'Confirmada', participants: 8, adults: 6, children: 2, total: 4000000, totalAmount: 4000000, guide: 'Carlos Ruiz', route: 'Patrimonio Colonial', createdDate: '2024-12-06', paymentStatus: 'Pagado', specialRequests: '' },
  { id: 'BK005', clientName: 'Laura Rodríguez', clientEmail: 'laura.r@email.com', service: 'Caminata Montaña', date: '2024-12-25', status: 'Cancelada', participants: 3, adults: 2, children: 1, total: 1800000, totalAmount: 1800000, guide: 'Pedro Martínez', route: 'Cerro Alto', createdDate: '2024-12-07', paymentStatus: 'Reembolsado', specialRequests: '' },
  { id: 'BK006', clientName: 'Diego Torres', clientEmail: 'diego.torres@email.com', service: 'Paseo Rural', date: '2025-01-05', status: 'Confirmada', participants: 5, adults: 3, children: 2, total: 2500000, totalAmount: 2500000, guide: 'Carlos Ruiz', route: 'Caminos del Campo', createdDate: '2024-12-08', paymentStatus: 'Pagado', specialRequests: 'Transporte desde hotel' },
  { id: 'BK007', clientName: 'Sofía Vargas', clientEmail: 'sofia.v@email.com', service: 'Tour Gastronómico', date: '2025-01-08', status: 'Pendiente', participants: 4, adults: 4, children: 0, total: 2200000, totalAmount: 2200000, guide: 'Pedro Martínez', route: 'Sabores Locales', createdDate: '2024-12-09', paymentStatus: 'Cotización', specialRequests: '' },
  { id: 'BK008', clientName: 'Roberto Jiménez', clientEmail: 'roberto.j@email.com', service: 'Aventura Extrema', date: '2025-01-10', status: 'Confirmada', participants: 2, adults: 2, children: 0, total: 1600000, totalAmount: 1600000, guide: 'Carlos Ruiz', route: 'Adrenalina Total', createdDate: '2024-12-10', paymentStatus: 'Pagado', specialRequests: 'Seguro de accidentes incluido' },
  { id: 'BK009', clientName: 'Patricia Silva', clientEmail: 'patricia.silva@email.com', service: 'Tour Familiar', date: '2025-01-12', status: 'Confirmada', participants: 7, adults: 4, children: 3, total: 3500000, totalAmount: 3500000, guide: 'Pedro Martínez', route: 'Diversión en Familia', createdDate: '2024-12-11', paymentStatus: 'Abono', specialRequests: 'Área de juegos para niños' },
  { id: 'BK010', clientName: 'Miguel Ángel', clientEmail: 'miguel.a@email.com', service: 'Ruta del Vino', date: '2025-01-15', status: 'Pendiente', participants: 4, adults: 4, children: 0, total: 2800000, totalAmount: 2800000, guide: 'Carlos Ruiz', route: 'Viñedos del Valle', createdDate: '2024-12-12', paymentStatus: 'Cotización', specialRequests: '' },
  { id: 'BK011', clientName: 'Valentina Cruz', clientEmail: 'valentina.c@email.com', service: 'Camping Nocturno', date: '2025-01-18', status: 'Confirmada', participants: 6, adults: 4, children: 2, total: 3000000, totalAmount: 3000000, guide: 'Pedro Martínez', route: 'Bajo las Estrellas', createdDate: '2024-12-13', paymentStatus: 'Pagado', specialRequests: 'Carpas dobles' },
  { id: 'BK012', clientName: 'Andrés Morales', clientEmail: 'andres.m@email.com', service: 'Tour de Aventura', date: '2025-01-20', status: 'Confirmada', participants: 3, adults: 3, children: 0, total: 1800000, totalAmount: 1800000, guide: 'Carlos Ruiz', route: 'Reto Extremo', createdDate: '2024-12-14', paymentStatus: 'Pagado', specialRequests: '' },
  { id: 'BK013', clientName: 'Camila Ríos', clientEmail: 'camila.rios@email.com', service: 'Paseo en Bicicleta', date: '2025-01-22', status: 'Pendiente', participants: 5, adults: 3, children: 2, total: 2500000, totalAmount: 2500000, guide: 'Pedro Martínez', route: 'Ciclo Ruta Verde', createdDate: '2024-12-15', paymentStatus: 'Abono', specialRequests: 'Bicicletas infantiles' },
  { id: 'BK014', clientName: 'Fernando López', clientEmail: 'fernando.lopez@email.com', service: 'Tour Fotográfico', date: '2025-01-25', status: 'Confirmada', participants: 4, adults: 4, children: 0, total: 2400000, totalAmount: 2400000, guide: 'Carlos Ruiz', route: 'Paisajes Increíbles', createdDate: '2024-12-16', paymentStatus: 'Pagado', specialRequests: 'Guía fotográfico profesional' },
  { id: 'BK015', clientName: 'Isabella Duarte', clientEmail: 'isabella.d@email.com', service: 'Experiencia Natural', date: '2025-01-28', status: 'Confirmada', participants: 8, adults: 5, children: 3, total: 4200000, totalAmount: 4200000, guide: 'Pedro Martínez', route: 'Naturaleza Viva', createdDate: '2024-12-17', paymentStatus: 'Pagado', specialRequests: 'Actividades educativas para niños' }
];

export const mockFarms = [
  {
    id: 'F001',
    name: 'Finca El Paraíso Verde',
    location: 'Quindío, Colombia',
    area: '15 hectáreas',
    capacity: 25,
    pricePerNight: 180000,
    owner: 'Carlos Mendoza',
    status: 'active',
    rating: 4.8,
    description: 'Hermosa finca cafetera ubicada en el corazón del Eje Cafetero, rodeada de exuberante vegetación y paisajes de montaña. Perfecta para desconectarse de la rutina y disfrutar de la tranquilidad del campo. Incluye senderos ecológicos, piscina natural y vistas panorámicas espectaculares.',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
      'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800',
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800'
    ]
  },
  {
    id: 'F002',
    name: 'Hacienda La Montaña',
    location: 'Valle del Cauca, Colombia',
    area: '20 hectáreas',
    capacity: 30,
    pricePerNight: 220000,
    owner: 'María Fernanda Torres',
    status: 'active',
    rating: 4.9,
    description: 'Tradicional hacienda con más de 100 años de historia, rodeada de montañas y cultivos de café orgánico. Ofrece alojamiento en casas coloniales restauradas con todas las comodidades modernas. Ideal para grupos familiares y retiros corporativos. Incluye tours por el cafetal y degustaciones.',
    images: [
      'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?w=800',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
      'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=800',
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800',
      'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800',
      'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
    ]
  },
  {
    id: 'F003',
    name: 'Finca Bosque Nativo',
    location: 'Risaralda, Colombia',
    area: '12 hectáreas',
    capacity: 18,
    pricePerNight: 160000,
    owner: 'Andrés Silva',
    status: 'active',
    rating: 4.7,
    description: 'Reserva natural privada con bosque nativo y abundante fauna silvestre. Perfecta para amantes del ecoturismo y la observación de aves. Cuenta con cabañas ecológicas construidas con materiales sostenibles, senderos interpretativos y zona de camping. Experiencia auténtica de conexión con la naturaleza.',
    images: [
      'https://images.unsplash.com/photo-1511497584788-876760111969?w=800',
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
      'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800',
      'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800',
      'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800'
    ]
  },
  {
    id: 'F004',
    name: 'Finca Los Guaduales',
    location: 'Caldas, Colombia',
    area: '18 hectáreas',
    capacity: 22,
    pricePerNight: 195000,
    owner: 'Roberto Jiménez',
    status: 'active',
    rating: 4.6,
    description: 'Tradicional finca ganadera y agrícola con extensos cultivos de bambú y café. Ofrece experiencias rurales auténticas incluyendo ordeño, cabalgatas y elaboración de productos artesanales. Instalaciones cómodas con zona de recreación, piscina y salones para eventos. Gastronomía campesina de primera calidad.',
    images: [
      'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800',
      'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800',
      'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800'
    ]
  },
  {
    id: 'F005',
    name: 'Villa Campestre El Descanso',
    location: 'Quindío, Colombia',
    area: '10 hectáreas',
    capacity: 20,
    pricePerNight: 170000,
    owner: 'Laura Gómez',
    status: 'maintenance',
    rating: 4.5,
    description: 'Acogedora villa campestre con arquitectura moderna y diseño sostenible. Combina comodidad con naturaleza en un entorno tranquilo ideal para descanso familiar. Cuenta con piscina climatizada, zonas verdes amplias, huerta orgánica y espacios para yoga y meditación. Servicio de restaurante con productos de la finca.',
    images: [
      'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=800',
      'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800',
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
      'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?w=800',
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800'
    ]
  },
  {
    id: 'F006',
    name: 'Finca Agroturística Río Verde',
    location: 'Valle del Cauca, Colombia',
    area: '25 hectáreas',
    capacity: 35,
    pricePerNight: 250000,
    owner: 'Diego Ramírez',
    status: 'active',
    rating: 4.9,
    description: 'La finca agroturística más grande de la región, con río natural que atraviesa la propiedad. Ofrece múltiples actividades: pesca deportiva, rafting, senderismo, canopy y paseos en cuatrimoto. Instalaciones premium con alojamiento tipo glamping, restaurante gourmet y spa natural. Perfecta para grupos grandes y eventos especiales.',
    images: [
      'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800',
      'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?w=800',
      'https://images.unsplash.com/photo-1511497584788-876760111969?w=800',
      'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800',
      'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
      'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=800',
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800',
      'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800',
      'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
    ]
  }
];

export const mockRoutes = [
  { id: 'RT001', name: 'Ruta del Café', description: 'Recorrido por las mejores fincas cafeteras de la región', duration: '6 horas', difficulty: 'Fácil', distance: '12 km', maxParticipants: 15, price: 600000, status: 'Activa', location: 'Quindío', highlights: ['Plantaciones de café', 'Degustación', 'Almuerzo típico'], createdDate: '2024-01-15' },
  { id: 'RT002', name: 'Finca El Paraíso', description: 'Día completo en finca con actividades recreativas', duration: '8 horas', difficulty: 'Fácil', distance: '5 km', maxParticipants: 20, price: 600000, status: 'Activa', location: 'Valle del Cauca', highlights: ['Piscina natural', 'Senderismo', 'Comida tradicional'], createdDate: '2024-02-10' },
  { id: 'RT003', name: 'Sendero Verde', description: 'Caminata ecológica por bosque nativo', duration: '5 horas', difficulty: 'Moderada', distance: '8 km', maxParticipants: 12, price: 600000, status: 'Activa', location: 'Risaralda', highlights: ['Flora y fauna', 'Cascadas', 'Avistamiento de aves'], createdDate: '2024-02-20' },
  { id: 'RT004', name: 'Patrimonio Colonial', description: 'Tour histórico por pueblos coloniales', duration: '7 horas', difficulty: 'Fácil', distance: '15 km', maxParticipants: 25, price: 500000, status: 'Activa', location: 'Caldas', highlights: ['Arquitectura colonial', 'Museos', 'Artesanías'], createdDate: '2024-03-05' },
  { id: 'RT005', name: 'Cerro Alto', description: 'Ascenso a la cima con vista panorámica', duration: '4 horas', difficulty: 'Difícil', distance: '6 km', maxParticipants: 10, price: 600000, status: 'Activa', location: 'Quindío', highlights: ['Vista 360°', 'Fotografía', 'Picnic'], createdDate: '2024-03-15' },
  { id: 'RT006', name: 'Caminos del Campo', description: 'Experiencia rural auténtica', duration: '6 horas', difficulty: 'Fácil', distance: '10 km', maxParticipants: 18, price: 500000, status: 'Activa', location: 'Valle del Cauca', highlights: ['Ordeño', 'Cabalgata', 'Quesería artesanal'], createdDate: '2024-04-01' },
  { id: 'RT007', name: 'Sabores Locales', description: 'Ruta gastronómica y cultural', duration: '5 horas', difficulty: 'Fácil', distance: '8 km', maxParticipants: 15, price: 550000, status: 'Activa', location: 'Risaralda', highlights: ['Degustaciones', 'Cocina local', 'Mercados'], createdDate: '2024-04-10' },
  { id: 'RT008', name: 'Adrenalina Total', description: 'Deportes extremos y aventura', duration: '7 horas', difficulty: 'Difícil', distance: '12 km', maxParticipants: 8, price: 800000, status: 'Activa', location: 'Caldas', highlights: ['Canopy', 'Rappel', 'Rafting'], createdDate: '2024-04-20' },
  { id: 'RT009', name: 'Diversión en Familia', description: 'Actividades para todas las edades', duration: '6 horas', difficulty: 'Fácil', distance: '7 km', maxParticipants: 30, price: 500000, status: 'Activa', location: 'Quindío', highlights: ['Juegos', 'Animales de granja', 'Piscina'], createdDate: '2024-05-01' },
  { id: 'RT010', name: 'Viñedos del Valle', description: 'Tour por viñedos boutique', duration: '5 horas', difficulty: 'Fácil', distance: '6 km', maxParticipants: 12, price: 700000, status: 'Activa', location: 'Valle del Cauca', highlights: ['Cata de vinos', 'Proceso de elaboración', 'Maridaje'], createdDate: '2024-05-10' },
  { id: 'RT011', name: 'Bajo las Estrellas', description: 'Camping y observación nocturna', duration: '12 horas', difficulty: 'Moderada', distance: '10 km', maxParticipants: 15, price: 500000, status: 'Activa', location: 'Risaralda', highlights: ['Astronomía', 'Fogata', 'Historias locales'], createdDate: '2024-05-20' },
  { id: 'RT012', name: 'Reto Extremo', description: 'Desafío físico en la naturaleza', duration: '8 horas', difficulty: 'Muy Difícil', distance: '15 km', maxParticipants: 8, price: 600000, status: 'Activa', location: 'Caldas', highlights: ['Escalada', 'Cross training', 'Supervivencia'], createdDate: '2024-06-01' },
  { id: 'RT013', name: 'Ciclo Ruta Verde', description: 'Paseo en bicicleta por caminos verdes', duration: '4 horas', difficulty: 'Moderada', distance: '20 km', maxParticipants: 12, price: 500000, status: 'Activa', location: 'Quindío', highlights: ['Ciclismo', 'Paisajes', 'Refrigerio'], createdDate: '2024-06-10' },
  { id: 'RT014', name: 'Paisajes Increíbles', description: 'Tour fotográfico por miradores naturales', duration: '6 horas', difficulty: 'Fácil', distance: '9 km', maxParticipants: 10, price: 600000, status: 'Activa', location: 'Valle del Cauca', highlights: ['Fotografía', 'Atardeceres', 'Viewpoints'], createdDate: '2024-06-20' },
  { id: 'RT015', name: 'Naturaleza Viva', description: 'Inmersión total en biodiversidad', duration: '8 horas', difficulty: 'Moderada', distance: '14 km', maxParticipants: 16, price: 525000, status: 'Activa', location: 'Risaralda', highlights: ['Biodiversidad', 'Conservación', 'Educación ambiental'], createdDate: '2024-07-01' }
];

export const mockServices = [
  { id: 'SV001', name: 'Cuatrimotos', category: 'Actividades', description: 'Recorrido en cuatrimoto por caminos rurales y senderos naturales', duration: '2 horas', price: 120000, status: 'Activo', provider: 'Aventura Extrema', capacity: 8, requirements: 'Licencia de conducción', createdDate: '2024-01-10' },
  { id: 'SV002', name: 'Pinta Caritas', category: 'Animación', description: 'Servicio de pinta caritas para eventos infantiles y familiares', duration: '3 horas', price: 80000, status: 'Activo', provider: 'Arte y Diversión', capacity: 30, requirements: 'Ninguno', createdDate: '2024-01-15' },
  { id: 'SV003', name: 'Buffet Campestre', category: 'Gastronomía', description: 'Buffet con comida típica y productos de la región', duration: 'Por evento', price: 45000, status: 'Activo', provider: 'Sabores del Campo', capacity: 100, requirements: 'Mínimo 20 personas', createdDate: '2024-01-20' },
  { id: 'SV004', name: 'Servicio de Meseros', category: 'Personal', description: 'Personal capacitado para atención de eventos', duration: 'Por evento', price: 80000, status: 'Activo', provider: 'Staff Profesional', capacity: 50, requirements: 'Mínimo 4 horas', createdDate: '2024-02-01' },
  { id: 'SV005', name: 'DJ y Sonido', category: 'Entretenimiento', description: 'Servicio de disc jockey con equipo de sonido profesional', duration: '4 horas', price: 350000, status: 'Activo', provider: 'Sound & Music', capacity: 200, requirements: 'Energía eléctrica 110V', createdDate: '2024-02-05' },
  { id: 'SV006', name: 'Decoración Temática', category: 'Ambientación', description: 'Decoración personalizada para eventos y celebraciones', duration: 'Día completo', price: 280000, status: 'Activo', provider: 'Decorarte', capacity: 0, requirements: 'Definir tema con anticipación', createdDate: '2024-02-10' },
  { id: 'SV007', name: 'Recreacionistas', category: 'Animación', description: 'Equipo de recreación para dinámicas y juegos grupales', duration: '3 horas', price: 150000, status: 'Activo', provider: 'RecreaFun', capacity: 50, requirements: 'Espacio amplio', createdDate: '2024-02-15' },
  { id: 'SV008', name: 'Fotografía Profesional', category: 'Multimedia', description: 'Cobertura fotográfica profesional de eventos', duration: '4 horas', price: 400000, status: 'Activo', provider: 'Moments Photography', capacity: 0, requirements: 'Ninguno', createdDate: '2024-02-20' },
  { id: 'SV009', name: 'Show de Títeres', category: 'Entretenimiento', description: 'Presentación de teatro de títeres para niños', duration: '1 hora', price: 120000, status: 'Activo', provider: 'Títeres Mágicos', capacity: 40, requirements: 'Espacio techado', createdDate: '2024-03-01' },
  { id: 'SV010', name: 'Canopy y Tirolesa', category: 'Actividades', description: 'Recorrido de aventura en alturas con líneas de tirolesa', duration: '2 horas', price: 95000, status: 'Activo', provider: 'Aventura Extrema', capacity: 12, requirements: 'Peso máximo 100kg', createdDate: '2024-03-05' },
  { id: 'SV011', name: 'Inflables Infantiles', category: 'Recreación', description: 'Alquiler de castillos inflables y juegos para niños', duration: 'Día completo', price: 250000, status: 'Activo', provider: 'Inflables Diversión', capacity: 20, requirements: 'Superficie plana', createdDate: '2024-03-10' },
  { id: 'SV012', name: 'Paseos a Caballo', category: 'Actividades', description: 'Cabalgatas por senderos y zonas rurales', duration: '1.5 horas', price: 75000, status: 'Activo', provider: 'Hacienda El Potrero', capacity: 10, requirements: 'Edad mínima 8 años', createdDate: '2024-03-15' },
  { id: 'SV013', name: 'Bartender y Cocteles', category: 'Gastronomía', description: 'Servicio de coctelería profesional y bar móvil', duration: '4 horas', price: 320000, status: 'Activo', provider: 'Mixology Pro', capacity: 80, requirements: 'Insumos por aparte', createdDate: '2024-03-20' },
  { id: 'SV014', name: 'Globoflexia', category: 'Animación', description: 'Creación de figuras con globos para entretenimiento', duration: '2 horas', price: 70000, status: 'Activo', provider: 'Arte y Diversión', capacity: 30, requirements: 'Ninguno', createdDate: '2024-03-25' },
  { id: 'SV015', name: 'Spa Natural', category: 'Bienestar', description: 'Masajes y tratamientos de relajación en entorno natural', duration: '2 horas', price: 180000, status: 'Activo', provider: 'Zen Spa', capacity: 6, requirements: 'Reserva previa', createdDate: '2024-04-01' }
];
export const mockTransport = [];

export const mockSales = [
  { id: 'VT001', clientName: 'María López', clientEmail: 'maria@occitours.com', service: 'Tour Cafetero Premium', date: '2024-12-01', status: 'Pagado', totalAmount: 2400000, paidAmount: 2400000, pendingAmount: 0, paymentMethod: 'Tarjeta de Crédito', advisor: 'Ana García', createdDate: '2024-12-01', dueDate: '2024-12-15' },
  { id: 'VT002', clientName: 'Juan Pérez', clientEmail: 'juan.perez@email.com', service: 'Aventura en Finca', date: '2024-12-03', status: 'Abono', totalAmount: 1200000, paidAmount: 600000, pendingAmount: 600000, paymentMethod: 'Transferencia', advisor: 'Ana García', createdDate: '2024-12-03', dueDate: '2024-12-18' },
  { id: 'VT003', clientName: 'Ana Martínez', clientEmail: 'ana.martinez@email.com', service: 'Ruta Ecológica', date: '2024-12-05', status: 'Pagado', totalAmount: 3600000, paidAmount: 3600000, pendingAmount: 0, paymentMethod: 'Efectivo', advisor: 'Sofia Herrera', createdDate: '2024-12-05', dueDate: '2024-12-20' },
  { id: 'VT004', clientName: 'Carlos Gómez', clientEmail: 'carlos.gomez@email.com', service: 'Tour Histórico', date: '2024-12-06', status: 'Pagado', totalAmount: 4000000, paidAmount: 4000000, pendingAmount: 0, paymentMethod: 'Tarjeta de Crédito', advisor: 'Ana García', createdDate: '2024-12-06', dueDate: '2024-12-22' },
  { id: 'VT005', clientName: 'Laura Rodríguez', clientEmail: 'laura.r@email.com', service: 'Caminata Montaña', date: '2024-12-07', status: 'Cancelado', totalAmount: 1800000, paidAmount: 0, pendingAmount: 0, paymentMethod: 'N/A', advisor: 'Sofia Herrera', createdDate: '2024-12-07', dueDate: '2024-12-25' },
  { id: 'VT006', clientName: 'Diego Torres', clientEmail: 'diego.torres@email.com', service: 'Paseo Rural', date: '2024-12-08', status: 'Pagado', totalAmount: 2500000, paidAmount: 2500000, pendingAmount: 0, paymentMethod: 'Transferencia', advisor: 'Ana García', createdDate: '2024-12-08', dueDate: '2025-01-05' },
  { id: 'VT007', clientName: 'Sofía Vargas', clientEmail: 'sofia.v@email.com', service: 'Tour Gastronómico', date: '2024-12-09', status: 'Cotización', totalAmount: 2200000, paidAmount: 0, pendingAmount: 2200000, paymentMethod: 'N/A', advisor: 'Sofia Herrera', createdDate: '2024-12-09', dueDate: '2025-01-08' },
  { id: 'VT008', clientName: 'Roberto Jiménez', clientEmail: 'roberto.j@email.com', service: 'Aventura Extrema', date: '2024-12-10', status: 'Pagado', totalAmount: 1600000, paidAmount: 1600000, pendingAmount: 0, paymentMethod: 'Tarjeta de Débito', advisor: 'Ana García', createdDate: '2024-12-10', dueDate: '2025-01-10' },
  { id: 'VT009', clientName: 'Patricia Silva', clientEmail: 'patricia.silva@email.com', service: 'Tour Familiar', date: '2024-12-11', status: 'Abono', totalAmount: 3500000, paidAmount: 1750000, pendingAmount: 1750000, paymentMethod: 'Transferencia', advisor: 'Sofia Herrera', createdDate: '2024-12-11', dueDate: '2025-01-12' },
  { id: 'VT010', clientName: 'Miguel Ángel', clientEmail: 'miguel.a@email.com', service: 'Ruta del Vino', date: '2024-12-12', status: 'Cotización', totalAmount: 2800000, paidAmount: 0, pendingAmount: 2800000, paymentMethod: 'N/A', advisor: 'Ana García', createdDate: '2024-12-12', dueDate: '2025-01-15' },
  { id: 'VT011', clientName: 'Valentina Cruz', clientEmail: 'valentina.c@email.com', service: 'Camping Nocturno', date: '2024-12-13', status: 'Pagado', totalAmount: 3000000, paidAmount: 3000000, pendingAmount: 0, paymentMethod: 'Tarjeta de Crédito', advisor: 'Sofia Herrera', createdDate: '2024-12-13', dueDate: '2025-01-18' },
  { id: 'VT012', clientName: 'Andrés Morales', clientEmail: 'andres.m@email.com', service: 'Tour de Aventura', date: '2024-12-14', status: 'Pagado', totalAmount: 1800000, paidAmount: 1800000, pendingAmount: 0, paymentMethod: 'Efectivo', advisor: 'Ana García', createdDate: '2024-12-14', dueDate: '2025-01-20' },
  { id: 'VT013', clientName: 'Camila Ríos', clientEmail: 'camila.rios@email.com', service: 'Paseo en Bicicleta', date: '2024-12-15', status: 'Abono', totalAmount: 2500000, paidAmount: 1250000, pendingAmount: 1250000, paymentMethod: 'Transferencia', advisor: 'Sofia Herrera', createdDate: '2024-12-15', dueDate: '2025-01-22' },
  { id: 'VT014', clientName: 'Fernando López', clientEmail: 'fernando.lopez@email.com', service: 'Tour Fotográfico', date: '2024-12-16', status: 'Pagado', totalAmount: 2400000, paidAmount: 2400000, pendingAmount: 0, paymentMethod: 'Tarjeta de Crédito', advisor: 'Ana García', createdDate: '2024-12-16', dueDate: '2025-01-25' },
  { id: 'VT015', clientName: 'Isabella Duarte', clientEmail: 'isabella.d@email.com', service: 'Experiencia Natural', date: '2024-12-17', status: 'Pagado', totalAmount: 4200000, paidAmount: 4200000, pendingAmount: 0, paymentMethod: 'Transferencia', advisor: 'Sofia Herrera', createdDate: '2024-12-17', dueDate: '2025-01-28' }
];

export const mockRoles = [
  {
    id: '1',
    name: 'Administrador',
    description: 'Acceso completo al sistema de gestión turística',
    permissions: [
      'usuarios.crear', 'usuarios.leer', 'usuarios.editar', 'usuarios.eliminar',
      'reservas.crear', 'reservas.leer', 'reservas.editar', 'reservas.eliminar',
      'fincas.crear', 'fincas.leer', 'fincas.editar', 'fincas.eliminar',
      'rutas.crear', 'rutas.leer', 'rutas.editar', 'rutas.eliminar',
      'servicios.crear', 'servicios.leer', 'servicios.editar', 'servicios.eliminar',
      'ventas.crear', 'ventas.leer', 'ventas.editar', 'ventas.eliminar',
      'personal.crear', 'personal.leer', 'personal.editar', 'personal.eliminar',
      'roles.crear', 'roles.leer', 'roles.editar', 'roles.eliminar',
      'reportes.generar', 'configuracion.modificar'
    ],
    modules: ['Dashboard', 'Usuarios', 'Reservas', 'Fincas', 'Rutas', 'Servicios', 'Ventas', 'Empleados', 'Roles'],
    views: ['Lista completa', 'Formularios', 'Detalles', 'Reportes', 'Estadísticas'],
    fields: {
      usuarios: ['*'],
      reservas: ['*'],
      fincas: ['*'],
      rutas: ['*'],
      servicios: ['*'],
      ventas: ['*'],
      personal: ['*'],
      roles: ['*']
    },
    usersCount: 2,
    status: 'Activo',
    priority: 1,
    createdDate: '2023-01-01'
  },
  {
    id: '2',
    name: 'Asesor',
    description: 'Gestión completa del sistema con permisos limitados',
    permissions: [
      'usuarios.crear', 'usuarios.leer', 'usuarios.editar',
      'reservas.crear', 'reservas.leer', 'reservas.editar',
      'fincas.crear', 'fincas.leer', 'fincas.editar',
      'rutas.crear', 'rutas.leer', 'rutas.editar',
      'servicios.crear', 'servicios.leer', 'servicios.editar',
      'ventas.crear', 'ventas.leer', 'ventas.editar',
      'personal.crear', 'personal.leer', 'personal.editar'
    ],
    modules: ['Dashboard', 'Usuarios', 'Reservas', 'Fincas', 'Rutas', 'Servicios', 'Ventas', 'Empleados'],
    views: ['Lista completa', 'Formularios', 'Detalles'],
    fields: {
      usuarios: ['nombre', 'email', 'teléfono', 'rol'],
      reservas: ['*'],
      fincas: ['*'],
      rutas: ['*'],
      servicios: ['*'],
      ventas: ['*'],
      personal: ['nombre', 'especialidad']
    },
    usersCount: 5,
    status: 'Activo',
    priority: 2,
    createdDate: '2023-02-01'
  },
  {
    id: '3',
    name: 'Guía Turístico',
    description: 'Acceso a rutas, servicios y visualización de reservas asignadas',
    permissions: [
      'rutas.leer',
      'servicios.leer',
      'reservas.leer',
      'personal.leer'
    ],
    modules: ['Rutas', 'Servicios', 'Reservas', 'Clientes'],
    views: ['Lista de asignaciones', 'Detalles'],
    fields: {
      rutas: ['*'],
      servicios: ['nombre', 'descripción', 'duración'],
      reservas: ['cliente', 'fecha', 'ruta', 'participantes'],
      personal: ['nombre', 'especialidad', 'disponibilidad']
    },
    usersCount: 8,
    status: 'Activo',
    priority: 3,
    createdDate: '2023-03-01'
  },
  {
    id: '4',
    name: 'Cliente',
    description: 'Acceso limitado para visualización de servicios y gestión de reservas propias',
    permissions: [
      'servicios.leer',
      'reservas.crear',
      'reservas.leer'
    ],
    modules: ['Servicios', 'Mis Reservas', 'Mi Perfil'],
    views: ['Catálogo', 'Mis reservas'],
    fields: {
      servicios: ['nombre', 'precio', 'descripción'],
      reservas: ['*']
    },
    usersCount: 156,
    status: 'Activo',
    priority: 4,
    createdDate: '2023-01-01'
  }
];

export const overviewStats = {
  totalUsers: 5,
  totalPackages: 0,
  totalBookings: 0,
  totalRevenue: 0,
  monthlyGrowth: 15.2,
  satisfactionRate: 4.7,
  activeGuides: 2,
  activeFarms: 0
};

export const salesAnalytics = {
  monthlyRevenue: [
    { month: 'Ene', paquetes: 2400000, fincas: 1800000, rutas: 900000, total: 5100000 },
    { month: 'Feb', paquetes: 2800000, fincas: 2200000, rutas: 1100000, total: 6100000 },
    { month: 'Mar', paquetes: 3200000, fincas: 2600000, rutas: 1300000, total: 7100000 },
    { month: 'Abr', paquetes: 2900000, fincas: 2400000, rutas: 1200000, total: 6500000 },
    { month: 'May', paquetes: 3400000, fincas: 2800000, rutas: 1400000, total: 7700000 },
    { month: 'Jun', paquetes: 3800000, fincas: 3200000, rutas: 1600000, total: 8600000 },
    { month: 'Jul', paquetes: 4200000, fincas: 3600000, rutas: 1800000, total: 9600000 },
    { month: 'Ago', paquetes: 3900000, fincas: 3400000, rutas: 1700000, total: 9000000 },
    { month: 'Sep', paquetes: 3600000, fincas: 3000000, rutas: 1500000, total: 8100000 },
    { month: 'Oct', paquetes: 3800000, fincas: 3200000, rutas: 1600000, total: 8600000 },
    { month: 'Nov', paquetes: 4100000, fincas: 3500000, rutas: 1750000, total: 9350000 },
    { month: 'Dic', paquetes: 4500000, fincas: 3800000, rutas: 1900000, total: 10200000 }
  ],
  salesByType: [
    { type: 'Paquetes', value: 45, amount: 41000000, color: '#8B5CF6' },
    { type: 'Fincas', value: 35, amount: 32000000, color: '#10B981' },
    { type: 'Rutas', value: 20, amount: 18000000, color: '#F59E0B' }
  ],
  paymentMethods: [
    { method: 'Tarjeta de Crédito', percentage: 40, amount: 36400000 },
    { method: 'Transferencia', percentage: 30, amount: 27300000 },
    { method: 'Efectivo', percentage: 20, amount: 18200000 },
    { method: 'Tarjeta de Débito', percentage: 10, amount: 9100000 }
  ],
  salesStatus: [
    { status: 'Pagado', count: 45, percentage: 60 },
    { status: 'Abono', count: 20, percentage: 27 },
    { status: 'Cotización', count: 10, percentage: 13 }
  ],
  topAdvisors: [
    { name: 'Ana García', sales: 25, revenue: 28500000, commission: 2850000 },
    { name: 'Sofia Herrera', sales: 18, revenue: 21200000, commission: 2120000 },
    { name: 'Carlos Mendoza', sales: 12, revenue: 14800000, commission: 1480000 },
    { name: 'Laura Pérez', sales: 8, revenue: 9500000, commission: 950000 }
  ],
  salesTrends: {
    totalSales: 91000000,
    growth: 15.2,
    averageTicket: 1365000,
    conversionRate: 24.5,
    repeatCustomers: 18.7
  }
};