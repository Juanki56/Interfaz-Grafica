import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: string;
  capacity: number;
  status: 'active' | 'inactive';
  includes: string[];
  requirements: string;
  rating: number;
  contactNumber: string;
  createdAt: string;
  updatedAt: string;
}

const mockServices: Service[] = [
  {
    id: '1',
    name: 'Guía Especializado en Aves',
    category: 'guia',
    description: 'Guía especializado en observación de aves con amplio conocimiento de especies locales.',
    price: 80000,
    duration: '4 horas',
    capacity: 8,
    status: 'active',
    includes: ['Guía certificado', 'Equipo de observación', 'Material educativo'],
    requirements: 'Ropa de colores neutros, silencio durante observación',
    rating: 4.8,
    contactNumber: '+57 300 123 4567',
    createdAt: '2024-01-15',
    updatedAt: '2024-12-15'
  },
  {
    id: '2',
    name: 'Transporte 4x4',
    category: 'transporte',
    description: 'Vehículo todo terreno para acceso a zonas rurales y montañosas.',
    price: 120000,
    duration: 'Día completo',
    capacity: 6,
    status: 'active',
    includes: ['Conductor certificado', 'Combustible', 'Seguro vehicular'],
    requirements: 'Documento de identidad',
    rating: 4.6,
    contactNumber: '+57 310 234 5678',
    createdAt: '2024-02-10',
    updatedAt: '2024-12-10'
  },
  {
    id: '3',
    name: 'Degustación de Café',
    category: 'experiencia',
    description: 'Experiencia completa de cata de café con barista profesional.',
    price: 45000,
    duration: '2 horas',
    capacity: 12,
    status: 'active',
    includes: ['Cata profesional', 'Explicación del proceso', 'Café para llevar'],
    requirements: 'Ninguno especial',
    rating: 4.9,
    contactNumber: '+57 320 345 6789',
    createdAt: '2024-01-20',
    updatedAt: '2024-12-08'
  },
  {
    id: '4',
    name: 'Hospedaje Finca Tradicional',
    category: 'alojamiento',
    description: 'Alojamiento en finca tradicional con desayuno incluido.',
    price: 65000,
    duration: 'Por noche',
    capacity: 4,
    status: 'active',
    includes: ['Habitación privada', 'Desayuno típico', 'WiFi'],
    requirements: 'Documento de identidad',
    rating: 4.7,
    contactNumber: '+57 315 456 7890',
    createdAt: '2024-03-05',
    updatedAt: '2024-12-05'
  },
  {
    id: '5',
    name: 'Equipo de Senderismo',
    category: 'equipo',
    description: 'Kit completo de equipo para senderismo y actividades al aire libre.',
    price: 25000,
    duration: 'Por día',
    capacity: 10,
    status: 'active',
    includes: ['Bastones', 'Casco', 'Arnés de seguridad', 'Botiquín'],
    requirements: 'Conocimientos básicos de seguridad',
    rating: 4.5,
    contactNumber: '+57 318 567 8901',
    createdAt: '2024-02-28',
    updatedAt: '2024-12-01'
  },
  {
    id: '6',
    name: 'Almuerzo Típico',
    category: 'alimentacion',
    description: 'Almuerzo con comida típica de la región.',
    price: 35000,
    duration: '1 hora',
    capacity: 20,
    status: 'active',
    includes: ['Plato principal', 'Bebida', 'Postre'],
    requirements: 'Ninguno especial',
    rating: 4.4,
    contactNumber: '+57 305 678 9012',
    createdAt: '2024-01-10',
    updatedAt: '2024-11-30'
  }
];

interface ServicesContextType {
  services: Service[];
  getServiceById: (id: string) => Service | undefined;
  getServicesByIds: (ids: string[]) => Service[];
  addService: (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export const ServicesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    // Initialize with mock data
    setServices(mockServices);
  }, []);

  const getServiceById = (id: string) => {
    return services.find(service => service.id === id);
  };

  const getServicesByIds = (ids: string[]) => {
    return services.filter(service => ids.includes(service.id));
  };

  const addService = (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newService: Service = {
      ...serviceData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setServices(prev => [...prev, newService]);
  };

  const updateService = (id: string, serviceData: Partial<Service>) => {
    setServices(prev =>
      prev.map(service =>
        service.id === id
          ? { ...service, ...serviceData, updatedAt: new Date().toISOString().split('T')[0] }
          : service
      )
    );
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(service => service.id !== id));
  };

  return (
    <ServicesContext.Provider
      value={{
        services,
        getServiceById,
        getServicesByIds,
        addService,
        updateService,
        deleteService
      }}
    >
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
};