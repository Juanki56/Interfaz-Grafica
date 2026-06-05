import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Users,
  Home,
  DollarSign,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  fincasAPI,
  propietariosAPI,
  Finca,
  Propietario,
  type ReservaBloqueoCatalogo,
} from '../services/api';
import { toast } from 'sonner';
import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';
import { FincaOwnerPicker } from './FincaOwnerPicker';
import {
  FINCA_LIMITS,
  isFincaPortadaUrl,
  sanitizeCapacityInput,
  sanitizeFincaText,
  sanitizePriceInput,
  validateFincaForm,
} from '../utils/fincaFormValidation';

interface FarmsManagementProps {
  canDelete?: boolean; // Admin puede eliminar, Asesor no
}

const normalizeFarmName = (value: string) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ');

type FarmStatusFilter = 'all' | 'active' | 'inactive';
type FarmSortField = 'nombre' | 'ubicacion' | 'precio' | 'capacidad' | 'propietario';
type FarmSortDirection = 'asc' | 'desc';
type FarmCapacityFilter = 'all' | 'small' | 'medium' | 'large';

const formatFincaReservaFecha = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('es-CO');
};

const findFarmNameConflict = (
  farms: { id: string; name: string }[],
  params: { nombre: string; excludeId?: string },
) => {
  const nameNorm = normalizeFarmName(params.nombre).toLowerCase();
  const exclude = params.excludeId ? String(params.excludeId) : null;

  for (const f of farms) {
    if (exclude && f.id === exclude) continue;
    if (normalizeFarmName(f.name).toLowerCase() === nameNorm) return true;
  }
  return false;
};

export function FarmsManagement({ canDelete = true }: FarmsManagementProps) {
  const permisos = usePermissions();
  const farmPerms = createModulePermissions(permisos, 'Fincas');
  const ownerPerms = createModulePermissions(permisos, 'Propietarios');
  const canViewFarms = farmPerms.canView();
  const canCreateFarm = farmPerms.canCreate();
  const canEditFarm = farmPerms.canEdit();
  const canDeleteFarm = farmPerms.canDelete();
  const canViewOwners = ownerPerms.canView();

  const [farms, setFarms] = useState<any[]>([]);
  const [propietarios, setPropietarios] = useState<Propietario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<FarmStatusFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [capacityFilter, setCapacityFilter] = useState<FarmCapacityFilter>('all');
  const [sortField, setSortField] = useState<FarmSortField>('nombre');
  const [sortDirection, setSortDirection] = useState<FarmSortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [farmPendingDelete, setFarmPendingDelete] = useState<any>(null);
  const [deleteCheck, setDeleteCheck] = useState<{
    puedeEliminar: boolean;
    totalReservas: number;
    reservas: ReservaBloqueoCatalogo[];
  } | null>(null);
  const [isCheckingDelete, setIsCheckingDelete] = useState(false);
  const [isDeletingFarm, setIsDeletingFarm] = useState(false);
  const [togglingFarmId, setTogglingFarmId] = useState<string | null>(null);

  const itemsPerPage = 10;

  // Cargar fincas y propietarios desde la API
  useEffect(() => {
    if (permisos.loadingRoles) return;
    if (!canViewFarms) {
      setFarms([]);
      setIsLoading(false);
      return;
    }

    loadFarms();
    if (canViewOwners) {
      loadPropietarios();
    }
    // Escuchar cambios globales en propietarios para mantener sincronizados los selects
    const handleOwnersChanged = () => {
      if (canViewOwners) loadPropietarios();
    };
    window.addEventListener('propietarios:changed', handleOwnersChanged as EventListener);
    return () => {
      window.removeEventListener('propietarios:changed', handleOwnersChanged as EventListener);
    };
  }, [permisos.loadingRoles, canViewFarms, canViewOwners]);

  const loadFarms = async () => {
    try {
      setIsLoading(true);
      const fincasFromDB = await fincasAPI.getAll();

      // Imagen: el backend ya enriquece `imagen_principal` desde Storage cuando aplica.
      const mappedFarms = (fincasFromDB || []).map((finca) => ({
        id: finca.id_finca.toString(),
        backendId: finca.id_finca,
        id_propietario: finca.id_propietario,
        name: finca.nombre,
        nombre: finca.nombre,
        location: finca.ubicacion || '',
        direccion: finca.direccion || '',
        description: finca.descripcion || '',
        capacity: finca.capacidad_personas || 0,
        pricePerNight: finca.precio_por_noche || 0,
        imagen_principal: finca.imagen_principal?.trim() || '',
        estado: finca.estado === true,
        status: finca.estado === true ? 'active' : 'inactive',
        fecha_registro: finca.fecha_registro,
        owner: finca.propietario_nombre
          ? `${finca.propietario_nombre} ${finca.propietario_apellido || ''}`.trim()
          : 'N/A',
      }));
      
      setFarms(mappedFarms);
      console.log('✅ Fincas cargadas desde BD:', mappedFarms);
    } catch (error) {
      console.error('❌ Error cargando fincas:', error);
      toast.error('Error al cargar las fincas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPropietarios = async () => {
    try {
      const propietariosFromDB = await propietariosAPI.getActive();
      setPropietarios(propietariosFromDB);
      console.log('✅ Propietarios cargados:', propietariosFromDB);
    } catch (error) {
      console.error('❌ Error cargando propietarios:', error);
      toast.error('Error al cargar propietarios');
    }
  };

  const locationOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const farm of farms) {
      const raw = String(farm.location || '').trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      if (!seen.has(key)) seen.set(key, raw);
    }
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, 'es'));
  }, [farms]);

  const ownerOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const farm of farms) {
      const owner = String(farm.owner || '').trim();
      if (!owner || owner === 'N/A') continue;
      const key = owner.toLowerCase();
      if (!seen.has(key)) seen.set(key, owner);
    }
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, 'es'));
  }, [farms]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    locationFilter !== 'all' ||
    statusFilter !== 'all' ||
    ownerFilter !== 'all' ||
    capacityFilter !== 'all' ||
    sortField !== 'nombre' ||
    sortDirection !== 'asc';

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('all');
    setStatusFilter('all');
    setOwnerFilter('all');
    setCapacityFilter('all');
    setSortField('nombre');
    setSortDirection('asc');
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, locationFilter, statusFilter, ownerFilter, capacityFilter, sortField, sortDirection]);

  const filteredFarms = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return farms.filter((farm) => {
      if (q) {
        const haystack = [
          farm.name,
          farm.location,
          farm.direccion,
          farm.description,
          farm.owner,
        ]
          .map((v) => String(v || '').toLowerCase())
          .join(' ');
        if (!haystack.includes(q)) return false;
      }

      if (locationFilter !== 'all') {
        const loc = String(farm.location || '').trim().toLowerCase();
        if (loc !== locationFilter.toLowerCase()) return false;
      }

      if (statusFilter !== 'all' && farm.status !== statusFilter) return false;

      if (ownerFilter !== 'all') {
        const owner = String(farm.owner || '').trim().toLowerCase();
        if (owner !== ownerFilter.toLowerCase()) return false;
      }

      const cap = Number(farm.capacity) || 0;
      if (capacityFilter === 'small' && (cap <= 0 || cap > 6)) return false;
      if (capacityFilter === 'medium' && (cap < 7 || cap > 12)) return false;
      if (capacityFilter === 'large' && cap < 13) return false;

      return true;
    });
  }, [farms, searchTerm, locationFilter, statusFilter, ownerFilter, capacityFilter]);

  const sortedFarms = useMemo(() => {
    const list = [...filteredFarms];
    const dir = sortDirection === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'ubicacion':
          cmp = String(a.location || '').localeCompare(String(b.location || ''), 'es');
          break;
        case 'precio':
          cmp = (Number(a.pricePerNight) || 0) - (Number(b.pricePerNight) || 0);
          break;
        case 'capacidad':
          cmp = (Number(a.capacity) || 0) - (Number(b.capacity) || 0);
          break;
        case 'propietario':
          cmp = String(a.owner || '').localeCompare(String(b.owner || ''), 'es');
          break;
        case 'nombre':
        default:
          cmp = String(a.name || '').localeCompare(String(b.name || ''), 'es');
      }
      return cmp * dir;
    });

    return list;
  }, [filteredFarms, sortField, sortDirection]);

  // Paginación (10 fincas por página)
  const totalPages = Math.max(1, Math.ceil(sortedFarms.length / itemsPerPage));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * itemsPerPage;
  const currentFarms = sortedFarms.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Cambiar estado de finca (persiste en backend)
  const handleStatusChange = async (farmId: string, active: boolean) => {
    if (!canEditFarm) {
      toast.error('No tienes permiso para editar fincas');
      return;
    }

    const farm = farms.find((f) => f.id === farmId);
    if (!farm) return;

    const id = Number(farm.id);
    if (!Number.isFinite(id) || id <= 0) {
      toast.error('ID de finca no válido.');
      return;
    }

    const prevStatus = farm.status;
    const prevEstado = farm.estado;
    const newStatus = active ? 'active' : 'inactive';

    setTogglingFarmId(farmId);
    setFarms((prev) =>
      prev.map((f) =>
        f.id === farmId ? { ...f, status: newStatus, estado: active } : f,
      ),
    );

    try {
      await fincasAPI.update(id, { estado: active });
      toast.success(active ? 'Finca activada' : 'Finca desactivada');
      if (selectedFarm?.id === farmId) {
        setSelectedFarm((prev: typeof selectedFarm) =>
          prev ? { ...prev, status: newStatus, estado: active } : prev,
        );
      }
    } catch (e: any) {
      setFarms((prev) =>
        prev.map((f) =>
          f.id === farmId ? { ...f, status: prevStatus, estado: prevEstado } : f,
        ),
      );
      toast.error(e?.message || 'No se pudo actualizar el estado de la finca');
    } finally {
      setTogglingFarmId(null);
    }
  };

  // Acciones
  const handleView = (farm: any) => {
    setSelectedFarm(farm);
    setSelectedImageIndex(0);
    setIsViewModalOpen(true);
  };

  const handleEdit = (farm: any) => {
    if (!canEditFarm) {
      toast.error('No tienes permiso para editar fincas');
      return;
    }
    setSelectedFarm(farm);
    setIsEditModalOpen(true);
  };

  const closeDeleteDialog = () => {
    if (isDeletingFarm) return;
    setDeleteDialogOpen(false);
    setFarmPendingDelete(null);
    setDeleteCheck(null);
    setIsCheckingDelete(false);
    setIsDeletingFarm(false);
  };

  const openDeleteDialog = async (farm: any) => {
    if (!canDeleteFarm) {
      toast.error('No tienes permiso para eliminar fincas');
      return;
    }
    const id = Number(farm.backendId ?? farm.id);
    if (!Number.isFinite(id) || id <= 0) {
      toast.error('ID de finca no válido.');
      return;
    }

    setFarmPendingDelete(farm);
    setDeleteDialogOpen(true);
    setDeleteCheck(null);
    setIsCheckingDelete(true);

    try {
      const check = await fincasAPI.canDelete(id);
      setDeleteCheck(check);
    } catch {
      setDeleteCheck(null);
      toast.error('No se pudo verificar si la finca tiene reservas asociadas.');
    } finally {
      setIsCheckingDelete(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!farmPendingDelete) return;
    if (deleteCheck && !deleteCheck.puedeEliminar) return;

    const id = Number(farmPendingDelete.backendId ?? farmPendingDelete.id);
    if (!Number.isFinite(id) || id <= 0) {
      toast.error('ID de finca no válido.');
      return;
    }

    setIsDeletingFarm(true);
    try {
      await fincasAPI.delete(id);
      toast.success('Finca eliminada correctamente.');
      setFarms((prev) => prev.filter((f) => f.id !== farmPendingDelete.id));
      closeDeleteDialog();
    } catch (e: any) {
      const msg =
        e?.message ||
        'No se pudo eliminar la finca. Cancela primero las reservas futuras de hospedaje no canceladas.';
      toast.error(msg);
    } finally {
      setIsDeletingFarm(false);
    }
  };

  const handleCreate = () => {
    if (!canCreateFarm) {
      toast.error('No tienes permiso para crear fincas');
      return;
    }
    setIsCreateModalOpen(true);
  };

  // Obtener badge de estado
  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      active: { label: 'Activa', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      inactive: { label: 'Inactiva', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
      maintenance: { label: 'Mantenimiento', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
      available: { label: 'Disponible', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Formulario de crear/editar
  const FarmForm = ({ 
    farm, 
    onClose, 
    isEdit, 
    propietarios 
  }: { 
    farm?: any; 
    onClose: () => void; 
    isEdit?: boolean;
    propietarios: Propietario[];
  }) => {
    const [formData, setFormData] = useState({
      nombre: farm?.nombre ?? farm?.name ?? '',
      descripcion: farm?.descripcion ?? farm?.description ?? '',
      direccion: farm?.direccion ?? '',
      ubicacion: farm?.ubicacion ?? farm?.location ?? '',
      capacidad_personas: farm?.capacidad_personas ?? farm?.capacity ?? '',
      precio_por_noche: farm?.precio_por_noche ?? farm?.pricePerNight ?? '',
      id_propietario: farm?.id_propietario ?? '',
      estado: farm?.estado ?? (farm?.status === 'active' || farm?.status === undefined),
    });
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(
      farm?.imagen_principal?.trim() || null,
    );
    const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      if (!isEdit || !farm?.id) return;

      const farmId = Number(farm.id);
      if (!Number.isFinite(farmId) || farmId <= 0) return;

      let cancelled = false;
      (async () => {
        try {
          const urls = await fincasAPI.getImagenes(farmId);
          if (cancelled) return;

          const portadaFromStorage = urls.find(isFincaPortadaUrl);
          const portada =
            portadaFromStorage ||
            (farm.imagen_principal?.trim() && !urls.length ? farm.imagen_principal.trim() : '') ||
            '';
          const galeria = urls.filter((u) => u !== portada && !isFincaPortadaUrl(u));

          setExistingCoverUrl(portada || null);
          setExistingGalleryUrls(galeria);
        } catch {
          if (!cancelled && farm?.imagen_principal?.trim()) {
            setExistingCoverUrl(farm.imagen_principal.trim());
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [isEdit, farm?.id, farm?.imagen_principal]);

    const validateImageFile = (file: File): string | null => {
      if (!file.type.startsWith('image/')) {
        return 'Solo se permiten archivos de imagen.';
      }
      if (file.size > FINCA_LIMITS.maxImageBytes) {
        return 'Cada imagen debe pesar máximo 5 MB.';
      }
      return null;
    };

    const galleryFileKey = (file: File) =>
      `${file.name}|${file.size}|${file.lastModified}`;

    const handleGalleryFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(e.target.files || []);
      if (!picked.length) return;

      setGalleryFiles((prev) => {
        const seen = new Set(prev.map(galleryFileKey));
        const merged = [...prev];

        for (const file of picked) {
          const key = galleryFileKey(file);
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(file);
        }

        if (merged.length > FINCA_LIMITS.maxGalleryFiles) {
          toast.error(
            `Máximo ${FINCA_LIMITS.maxGalleryFiles} fotos nuevas en la galería por guardado.`,
          );
          return merged.slice(0, FINCA_LIMITS.maxGalleryFiles);
        }

        return merged;
      });

      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    };

    const removePendingGalleryFile = (index: number) => {
      setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (isEdit) {
        if (!canEditFarm) {
          toast.error('No tienes permiso para editar fincas');
          return;
        }
      } else {
        if (!canCreateFarm) {
          toast.error('No tienes permiso para crear fincas');
          return;
        }
      }
      
      if (isSubmitting) return;

      const validation = validateFincaForm(formData);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      const nombreNorm = String(validation.payload.nombre);

      if (
        findFarmNameConflict(farms, {
          nombre: nombreNorm,
          excludeId: isEdit && farm ? String(farm.id) : undefined,
        })
      ) {
        toast.error('Ya existe otra finca con ese nombre.');
        return;
      }

      if (galleryFiles.length > FINCA_LIMITS.maxGalleryFiles) {
        toast.error(`Máximo ${FINCA_LIMITS.maxGalleryFiles} fotos en la galería por carga.`);
        return;
      }

      const filesToCheck = [...(coverFile ? [coverFile] : []), ...galleryFiles];
      for (const file of filesToCheck) {
        const fileError = validateImageFile(file);
        if (fileError) {
          toast.error(fileError);
          return;
        }
      }
      
      try {
        setIsSubmitting(true);
        
        const fincaData = {
          ...validation.payload,
          estado: formData.estado,
        };
        
        console.log('📤 Enviando datos de finca:', fincaData);
        
        if (isEdit && farm) {
          // Actualizar finca existente
          await fincasAPI.update(farm.id, fincaData);

          const farmId = Number(farm.id);
          const hasNewImages = Boolean(coverFile) || galleryFiles.length > 0;
          if (Number.isFinite(farmId) && farmId > 0 && hasNewImages) {
            try {
              await fincasAPI.uploadImagenes(farmId, {
                portada: coverFile,
                galeria: galleryFiles,
              });
            } catch (e: any) {
              toast.error(`La finca se actualizó, pero falló la subida de fotos: ${e?.message || 'Error'}`);
            }
          }
          toast.success('Finca actualizada exitosamente');
        } else {
          // Crear nueva finca
          const resp: any = await fincasAPI.create(fincaData);

          const createdPayload: any = resp?.data ?? resp;
          const createdIdRaw = createdPayload?.id_finca ?? createdPayload?.id;
          const createdId = createdIdRaw != null ? Number(createdIdRaw) : null;

          const hasNewImages = Boolean(coverFile) || galleryFiles.length > 0;
          if (createdId && hasNewImages) {
            try {
              await fincasAPI.uploadImagenes(createdId, {
                portada: coverFile,
                galeria: galleryFiles,
              });
            } catch (e: any) {
              toast.error(`La finca se creó, pero falló la subida de fotos: ${e?.message || 'Error'}`);
            }
          }
          toast.success('Finca creada exitosamente');
        }
        
        // Recargar lista de fincas
        await loadFarms();
        onClose();
      } catch (error: any) {
        console.error('❌ Error guardando finca:', error);
        toast.error(error.message || 'Error al guardar la finca');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="nombre">Nombre de la Finca *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nombre: sanitizeFincaText(e.target.value, FINCA_LIMITS.nombre.max),
                })
              }
              placeholder="Ej: Finca El Paraíso"
              maxLength={FINCA_LIMITS.nombre.max}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.nombre.length}/{FINCA_LIMITS.nombre.max} · no puede repetirse con otra finca.
            </p>
          </div>

          <div className="col-span-2">
            <FincaOwnerPicker
              propietarios={propietarios}
              value={String(formData.id_propietario || '')}
              onChange={(id) => setFormData({ ...formData, id_propietario: id })}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="ubicacion">Ubicación</Label>
            <Input
              id="ubicacion"
              value={formData.ubicacion}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ubicacion: sanitizeFincaText(e.target.value, FINCA_LIMITS.ubicacion.max),
                })
              }
              placeholder="Ej: Santa Fe de Antioquia"
              maxLength={FINCA_LIMITS.ubicacion.max}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">Máx. {FINCA_LIMITS.ubicacion.max} caracteres.</p>
          </div>

          <div>
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={formData.direccion}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  direccion: sanitizeFincaText(e.target.value, FINCA_LIMITS.direccion.max),
                })
              }
              placeholder="Ej: Vereda La Esperanza Km 5"
              maxLength={FINCA_LIMITS.direccion.max}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">Máx. {FINCA_LIMITS.direccion.max} caracteres.</p>
          </div>

          <div>
            <Label htmlFor="capacidad_personas">Capacidad (personas)</Label>
            <Input
              id="capacidad_personas"
              type="text"
              inputMode="numeric"
              value={formData.capacidad_personas}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacidad_personas: sanitizeCapacityInput(e.target.value),
                })
              }
              placeholder="Ej: 20"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Entero entre {FINCA_LIMITS.capacidad.min} y {FINCA_LIMITS.capacidad.max} (sin negativos).
            </p>
          </div>

          <div>
            <Label htmlFor="precio_por_noche">Precio por noche (COP)</Label>
            <Input
              id="precio_por_noche"
              type="text"
              inputMode="decimal"
              value={formData.precio_por_noche}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  precio_por_noche: sanitizePriceInput(e.target.value),
                })
              }
              placeholder="Ej: 150000"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">Mayor o igual a 0; no se permiten valores negativos.</p>
          </div>

          <div className="col-span-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  descripcion: sanitizeFincaText(e.target.value, FINCA_LIMITS.descripcion.max),
                })
              }
              placeholder="Descripción detallada de la finca..."
              rows={4}
              maxLength={FINCA_LIMITS.descripcion.max}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              {String(formData.descripcion || '').length}/{FINCA_LIMITS.descripcion.max} caracteres.
            </p>
          </div>

          <div className="col-span-2 space-y-3 rounded-lg border border-dashed border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-800">Imágenes (Supabase Storage)</p>

            <div>
              <Label htmlFor="finca_portada">Portada (tarjeta y listados)</Label>
              <Input
                id="finca_portada"
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                1 imagen, máx. 5 MB. Se guarda como principal en Storage.
              </p>
              {(coverFile || existingCoverUrl) && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={coverFile ? URL.createObjectURL(coverFile) : existingCoverUrl!}
                    alt="Vista previa portada"
                    className="h-20 w-28 rounded-md object-cover border"
                  />
                  <span className="text-xs text-gray-500">
                    {coverFile ? 'Nueva portada (se subirá al guardar)' : 'Portada actual'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="finca_galeria">Galería (página de detalle)</Label>
              <Input
                ref={galleryInputRef}
                id="finca_galeria"
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryFilesChange}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Hasta {FINCA_LIMITS.maxGalleryFiles} fotos nuevas por guardado, 5 MB c/u. Puedes elegir
                varias a la vez o volver a «Elegir archivos» para sumar más antes de guardar.
              </p>
              {isEdit && existingGalleryUrls.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {existingGalleryUrls.length} foto(s) ya en Storage
                  {galleryFiles.length > 0 ? ` · +${galleryFiles.length} nueva(s) pendiente(s)` : ''}.
                </p>
              )}
              {galleryFiles.length > 0 && !isEdit && (
                <p className="text-xs text-emerald-700 mt-1">
                  {galleryFiles.length} foto(s) lista(s) para subir al guardar.
                </p>
              )}
              {(galleryFiles.length > 0 || (isEdit && existingGalleryUrls.length > 0)) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {isEdit &&
                    existingGalleryUrls.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt="Galería actual"
                        className="h-16 w-16 rounded-md object-cover border"
                        title="Ya guardada en Storage"
                      />
                    ))}
                  {galleryFiles.map((file, idx) => (
                    <div key={galleryFileKey(file)} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-16 w-16 rounded-md object-cover border"
                      />
                      <button
                        type="button"
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs leading-none"
                        onClick={() => removePendingGalleryFile(idx)}
                        disabled={isSubmitting}
                        aria-label={`Quitar ${file.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-2 flex items-center space-x-2">
            <Switch
              id="estado"
              checked={formData.estado}
              onCheckedChange={(checked: boolean) => setFormData({ ...formData, estado: checked })}
              disabled={isSubmitting}
            />
            <Label htmlFor="estado" className="cursor-pointer">
              {formData.estado ? 'Activa' : 'Inactiva'}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : (isEdit ? 'Actualizar Finca' : 'Crear Finca')}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  if (!permisos.loadingRoles && !canViewFarms) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Acceso denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">No tienes permiso para ver fincas.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="text-green-800 text-xl font-semibold">Gestión de Fincas</h2>
          <p className="text-gray-600 text-sm">Administra alojamientos, precios y propietarios</p>
        </div>
        {canCreateFarm && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Finca
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nueva Finca</DialogTitle>
                <DialogDescription>
                  Complete los campos para registrar una nueva finca en el sistema.
                </DialogDescription>
              </DialogHeader>
              <FarmForm onClose={() => setIsCreateModalOpen(false)} propietarios={propietarios} />
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

      <Card className="border-green-200">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-green-800">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Buscar y filtrar fincas</span>
            </div>
            <Badge variant="outline" className="border-green-300 text-green-800 bg-green-50">
              {sortedFarms.length} de {farms.length} fincas
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="md:col-span-2 xl:col-span-4">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Nombre, ubicación, dirección, propietario o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-green-200 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <Label>Ubicación</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full border-green-200">
                  <SelectValue placeholder="Todas las ubicaciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ubicaciones</SelectItem>
                  {locationOptions.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Estado</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as FarmStatusFilter)}
              >
                <SelectTrigger className="w-full border-green-200">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="inactive">Inactivas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Propietario</Label>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-full border-green-200">
                  <SelectValue placeholder="Todos los propietarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los propietarios</SelectItem>
                  {ownerOptions.map((owner) => (
                    <SelectItem key={owner} value={owner}>
                      {owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Capacidad</Label>
              <Select
                value={capacityFilter}
                onValueChange={(v) => setCapacityFilter(v as FarmCapacityFilter)}
              >
                <SelectTrigger className="w-full border-green-200">
                  <SelectValue placeholder="Cualquier capacidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquier capacidad</SelectItem>
                  <SelectItem value="small">Hasta 6 personas</SelectItem>
                  <SelectItem value="medium">7 a 12 personas</SelectItem>
                  <SelectItem value="large">13 o más personas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ordenar por</Label>
              <Select
                value={sortField}
                onValueChange={(v) => setSortField(v as FarmSortField)}
              >
                <SelectTrigger className="w-full border-green-200">
                  <SelectValue placeholder="Campo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nombre">Nombre</SelectItem>
                  <SelectItem value="ubicacion">Ubicación</SelectItem>
                  <SelectItem value="precio">Precio por noche</SelectItem>
                  <SelectItem value="capacidad">Capacidad</SelectItem>
                  <SelectItem value="propietario">Propietario</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Orden</Label>
              <Select
                value={sortDirection}
                onValueChange={(v) => setSortDirection(v as FarmSortDirection)}
              >
                <SelectTrigger className="w-full border-green-200">
                  <SelectValue placeholder="Dirección" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascendente (A→Z / menor)</SelectItem>
                  <SelectItem value="desc">Descendente (Z→A / mayor)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-50"
                onClick={clearFilters}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 py-4">
          <CardTitle className="text-green-800 text-lg">
            Listado de fincas ({sortedFarms.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Cargando fincas...</div>
        ) : currentFarms.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-green-100 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-50 border-b border-green-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Finca</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Ubicación</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Dirección</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Capacidad</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Precio/Noche</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Propietario</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-center text-xs text-gray-700 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentFarms.map((farm, index) => (
                    <motion.tr
                      key={farm.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-green-50 transition-colors"
                    >
                      {/* Finca */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{farm.name}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{farm.description || 'Sin descripción'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Ubicación */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <MapPin className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span>{farm.location || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Dirección */}
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700">{farm.direccion || 'N/A'}</p>
                      </td>

                      {/* Capacidad */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <Users className="w-3 h-3 text-green-600" />
                          <span>{farm.capacity || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Precio */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            {farm.pricePerNight ? `$${farm.pricePerNight.toLocaleString()}` : 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Propietario */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <User className="w-3 h-3 text-green-600" />
                          <span>{farm.owner}</span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={farm.status === 'active'}
                            onCheckedChange={(checked: boolean) => {
                              void handleStatusChange(farm.id, checked);
                            }}
                            disabled={!canEditFarm || togglingFarmId === farm.id}
                            className="data-[state=checked]:bg-green-600"
                          />
                          {getStatusBadge(farm.status)}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(farm)}
                            className="border-green-300 hover:bg-green-50"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          {canEditFarm && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(farm)}
                              className="border-blue-300 hover:bg-blue-50"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
                          {canDelete && canDeleteFarm && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50 border-red-300"
                              onClick={() => openDeleteDialog(farm)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-12 px-4">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-800">
              {hasActiveFilters
                ? searchTerm.trim()
                  ? `No hay fincas que coincidan con «${searchTerm.trim()}»`
                  : 'No hay fincas con los filtros seleccionados'
                : 'Aún no hay fincas registradas'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {hasActiveFilters
                ? 'Prueba con otros criterios o limpia los filtros.'
                : canCreateFarm
                  ? 'Crea la primera finca con el botón «Nueva Finca».'
                  : 'Cuando existan fincas, aparecerán aquí.'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-green-300 text-green-700"
                onClick={clearFilters}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        )}

      {/* Paginación */}
      {!isLoading && sortedFarms.length > itemsPerPage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 px-2"
        >
          <p className="text-sm text-gray-600">
            Mostrando {startIndex + 1}–{Math.min(startIndex + itemsPerPage, sortedFarms.length)} de{' '}
            {sortedFarms.length} fincas · Página {activePage} de {totalPages}
          </p>

          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(activePage - 1)}
              disabled={activePage === 1}
              className="border-green-300 hover:bg-green-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNumber: number;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (activePage <= 3) {
                  pageNumber = i + 1;
                } else if (activePage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = activePage - 2 + i;
                }

                return (
                  <Button
                    key={pageNumber}
                    variant={activePage === pageNumber ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                    className={
                      activePage === pageNumber
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'border-green-300 hover:bg-green-50'
                    }
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(activePage + 1)}
              disabled={activePage === totalPages}
              className="border-green-300 hover:bg-green-50"
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      )}
        </CardContent>
      </Card>

      {/* Modal de Ver Detalles */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Finca</DialogTitle>
            <DialogDescription>
              Información completa de la finca seleccionada.
            </DialogDescription>
          </DialogHeader>
          {selectedFarm && (
            <div className="space-y-4">
              {/* Imagen principal */}
              {selectedFarm.imagen_principal && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={selectedFarm.imagen_principal}
                    alt={selectedFarm.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Nombre</Label>
                  <p className="font-medium">{selectedFarm.name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Ubicación</Label>
                  <p>{selectedFarm.location || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Dirección</Label>
                  <p>{selectedFarm.direccion || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Capacidad</Label>
                  <p>{selectedFarm.capacity ? `${selectedFarm.capacity} personas` : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Precio por Noche</Label>
                  <p className="text-green-600 font-medium">
                    {selectedFarm.pricePerNight ? `$${selectedFarm.pricePerNight.toLocaleString()}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Propietario</Label>
                  <p>{selectedFarm.owner}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedFarm.status)}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Fecha de Registro</Label>
                  <p className="text-sm">{selectedFarm.fecha_registro ? new Date(selectedFarm.fecha_registro).toLocaleDateString('es-CO') : 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-500">Descripción</Label>
                  <p className="text-sm mt-1">{selectedFarm.description || 'Sin descripción'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Editar */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Finca</DialogTitle>
            <DialogDescription>
              Modifique los campos que desee actualizar.
            </DialogDescription>
          </DialogHeader>
          {selectedFarm && (
            <FarmForm
              farm={selectedFarm}
              onClose={() => setIsEditModalOpen(false)}
              isEdit
              propietarios={propietarios}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar finca?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                {farmPendingDelete && (
                  <p>
                    Esta acción no se puede deshacer. Se eliminará permanentemente la finca "
                    {farmPendingDelete.name}".
                  </p>
                )}
                {isCheckingDelete && <p>Verificando reservas asociadas…</p>}
                {!isCheckingDelete && deleteCheck && !deleteCheck.puedeEliminar && (
                  <>
                    <p className="text-red-700 font-medium">
                      No se puede eliminar: hay {deleteCheck.totalReservas} reserva(s) futura(s) de
                      hospedaje no cancelada(s). Cancélalas desde Reservas y vuelve a intentar.
                    </p>
                    {deleteCheck.reservas.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-red-200 bg-red-50/50 p-2">
                        <p className="text-xs font-medium text-red-900 mb-2">Reservas vinculadas:</p>
                        <ul className="space-y-2">
                          {deleteCheck.reservas.map((r) => (
                            <li
                              key={r.id_reserva}
                              className="text-xs text-red-950 border-b border-red-100 last:border-0 pb-2 last:pb-0"
                            >
                              <span className="font-semibold">Reserva #{r.id_reserva}</span>
                              {r.estado ? (
                                <span className="ml-1 text-red-800">({r.estado})</span>
                              ) : null}
                              {r.cliente ? (
                                <span className="block text-red-900/90">Cliente: {r.cliente}</span>
                              ) : null}
                              <span className="block text-red-800/90">
                                Estadía: {formatFincaReservaFecha(r.fecha_checkin)} →{' '}
                                {formatFincaReservaFecha(r.fecha_checkout)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
                {!isCheckingDelete && deleteCheck?.puedeEliminar && (
                  <p className="text-green-800">
                    No hay reservas futuras de hospedaje sin cancelar. Puedes eliminar esta finca.
                    Reservas pasadas o ya canceladas no bloquean.
                  </p>
                )}
                {!isCheckingDelete && !deleteCheck && (
                  <p>
                    Solo es posible eliminar si no quedan reservas futuras de hospedaje sin cancelar
                    vinculadas a esta finca.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingFarm}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={
                isCheckingDelete ||
                isDeletingFarm ||
                (deleteCheck != null && !deleteCheck.puedeEliminar)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingFarm ? 'Eliminando…' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}