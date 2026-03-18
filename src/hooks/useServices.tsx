import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Servicio, serviciosAPI } from '../services/api';

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

const DEFAULT_CATEGORY = 'otros';

const mapServicioToService = (servicio: Servicio): Service => {
  const fecha = servicio.fecha_creacion || new Date().toISOString().split('T')[0];
  return {
    id: String(servicio.id_servicio),
    name: servicio.nombre,
    category: DEFAULT_CATEGORY,
    description: servicio.descripcion || '',
    price: Number(servicio.precio || 0),
    duration: 'No definida',
    capacity: 1,
    status: servicio.estado === false ? 'inactive' : 'active',
    includes: [],
    requirements: '',
    rating: 0,
    contactNumber: '',
    createdAt: fecha,
    updatedAt: fecha,
  };
};

interface ServicesContextType {
  services: Service[];
  getServiceById: (id: string) => Service | undefined;
  getServicesByIds: (ids: string[]) => Service[];
  refreshServices: () => Promise<void>;
  addService: (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export const ServicesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<Service[]>([]);

  const refreshServices = async () => {
    try {
      const data = await serviciosAPI.getAll();
      setServices(data.map(mapServicioToService));
    } catch (error: any) {
      console.error('Error cargando servicios:', error);
      toast.error(error?.message || 'Error al cargar servicios desde el backend');
    }
  };

  useEffect(() => {
    void refreshServices();
  }, []);

  const getServiceById = (id: string) => {
    return services.find(service => service.id === id);
  };

  const getServicesByIds = (ids: string[]) => {
    return services.filter(service => ids.includes(service.id));
  };

  const addService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await serviciosAPI.create({
        nombre: serviceData.name,
        descripcion: serviceData.description,
        precio: serviceData.price,
        estado: serviceData.status === 'active',
      });
      await refreshServices();
    } catch (error: any) {
      console.error('Error creando servicio:', error);
      toast.error(error?.message || 'Error al crear servicio');
      throw error;
    }
  };

  const updateService = async (id: string, serviceData: Partial<Service>) => {
    try {
      await serviciosAPI.update(Number(id), {
        ...(serviceData.name !== undefined ? { nombre: serviceData.name } : {}),
        ...(serviceData.description !== undefined ? { descripcion: serviceData.description } : {}),
        ...(serviceData.price !== undefined ? { precio: serviceData.price } : {}),
        ...(serviceData.status !== undefined ? { estado: serviceData.status === 'active' } : {}),
      });
      await refreshServices();
    } catch (error: any) {
      console.error('Error actualizando servicio:', error);
      toast.error(error?.message || 'Error al actualizar servicio');
      throw error;
    }
  };

  const deleteService = async (id: string) => {
    try {
      await serviciosAPI.delete(Number(id));
      await refreshServices();
    } catch (error: any) {
      console.error('Error eliminando servicio:', error);
      toast.error(error?.message || 'Error al eliminar servicio');
      throw error;
    }
  };

  return (
    <ServicesContext.Provider
      value={{
        services,
        getServiceById,
        getServicesByIds,
        refreshServices,
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