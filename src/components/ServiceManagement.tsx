import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  Plus, Edit, Trash2, Eye, Settings,
  ChevronLeft, ChevronRight, Search, Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "./ui/table";
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle, DialogDescription
} from "./ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "./ui/alert-dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import {
  serviciosAPI, ServicioConProveedor,
  proveedoresAPI, Proveedor
} from "../services/api";
import { usePermissions } from '../hooks/usePermissions';
import { createModulePermissions } from '../utils/permissionHelper';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "./ui/select";

type AplicaServicioForm = "finca" | "ruta";

type ServicioFormData = {
  nombre: string;
  descripcion: string;
  precio: string;
  id_proveedores: string;
  aplica_a: AplicaServicioForm;
};

const emptyForm: ServicioFormData = {
  nombre: "",
  descripcion: "",
  precio: "",
  id_proveedores: "",
  aplica_a: "ruta",
};

function normalizarAplicaServicio(raw: unknown): AplicaServicioForm {
  const v = String(raw ?? "")
    .trim()
    .toLowerCase();
  return v === "finca" ? "finca" : "ruta";
}

function servicioEstaActivo(service: ServicioConProveedor): boolean {
  const e = service.estado;
  if (e === true) return true;
  if (e === false) return false;
  const t = String(e ?? "").trim().toLowerCase();
  if (t.includes("inactiv")) return false;
  if (t.includes("activ")) return true;
  return true;
}

/** Componente de campos del formulario con restricciones en tiempo real */
function ServicioFormFields({
  formData,
  setFormData,
  proveedores,
}: {
  formData: ServicioFormData;
  setFormData: Dispatch<SetStateAction<ServicioFormData>>;
  proveedores: Proveedor[];
}) {
  
  // Solo permite letras (mayúsculas, minúsculas, tildes, ñ) y espacios
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    setFormData((f) => ({ ...f, nombre: clean }));
  };

  // Solo permite números positivos, máximo 10 dígitos y formatea con puntos en tiempo real
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setFormData((f) => ({ ...f, precio: formatted }));
  };

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Nombre *</Label>
          <Input
            value={formData.nombre}
            onChange={handleNameChange}
            placeholder="Nombre del servicio (solo letras)"
          />
        </div>
        <div>
          <Label>Precio *</Label>
          <Input
            value={formData.precio}
            onChange={handlePriceChange}
            placeholder="0"
          />
        </div>
      </div>
      <div>
        <Label>Descripción *</Label>
        <Textarea
          value={formData.descripcion}
          onChange={(e) => setFormData((f) => ({ ...f, descripcion: e.target.value }))}
          placeholder="Descripción del servicio"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Proveedor *</Label>
          <Select
            value={formData.id_proveedores || undefined}
            onValueChange={(v: string) => setFormData((f) => ({ ...f, id_proveedores: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona proveedor" />
            </SelectTrigger>
            <SelectContent>
              {proveedores.map((p) => (
                <SelectItem key={p.id_proveedores} value={String(p.id_proveedores)}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Ámbito del servicio *</Label>
          <Select
            value={formData.aplica_a}
            onValueChange={(v: AplicaServicioForm) => setFormData((f) => ({ ...f, aplica_a: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona ámbito" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="finca">
                Finca — oferta global (reservas de finca, mismo catálogo para todas)
              </SelectItem>
              <SelectItem value="ruta">
                Ruta — solo para rutas (elegibles al configurar cada ruta)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Los de <strong>finca</strong> aparecen en la reserva pública de fincas; los de <strong>ruta</strong> se asocian por ruta en programación. All fields marked with * are mandatory.
      </p>
    </div>
  );
}

export function ServiceManagement() {
  const permisos = usePermissions();
  const servicePerms = createModulePermissions(permisos, 'Servicios');
  const providerPerms = createModulePermissions(permisos, 'Proveedores');
  const canViewServices = servicePerms.canView();
  const canCreateService = servicePerms.canCreate();
  const canEditService = servicePerms.canEdit();
  const canDeleteService = servicePerms.canDelete();
  const canViewProviders = providerPerms.canView();

  const [services, setServices] = useState<ServicioConProveedor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [aplicaFilter, setAplicaFilter] = useState<string>("__all__");
  const [estadoFilter, setEstadoFilter] = useState<string>("__all__");
  const [proveedorFilter, setProveedorFilter] = useState<string>("__all__");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<ServicioConProveedor | null>(null);

  const itemsPerPage = 10;

  const [formData, setFormData] = useState<ServicioFormData>(emptyForm);
  const [serviceToToggle, setServiceToToggle] = useState<ServicioConProveedor | null>(null);
  const [showConfirmToggle, setShowConfirmToggle] = useState(false);

  const cargarServicios = async () => {
    try {
      const [servRes, provRes] = await Promise.all([
        serviciosAPI.getAllConProveedor(),
        canViewProviders ? proveedoresAPI.getAll() : Promise.resolve([] as Proveedor[]),
      ]);
      if (servRes?.length) {
        setServices(servRes);
      } else {
        const base = await serviciosAPI.getAll();
        setServices(base as ServicioConProveedor[]);
      }
      setProveedores(provRes as Proveedor[]);
    } catch (error: any) {
      toast.error(error?.message || "Error cargando servicios");
      setServices([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      if (permisos.loadingRoles) return;
      if (!canViewServices) {
        setServices([]);
        setIsLoading(false);
        return;
      }
      await cargarServicios();
      setIsLoading(false);
      setCurrentPage(1);
    };
    init();
  }, [permisos.loadingRoles, canViewServices]);

  const hasActiveFilters =
    aplicaFilter !== "__all__" || estadoFilter !== "__all__" || proveedorFilter !== "__all__";

  const clearFilters = () => {
    setAplicaFilter("__all__");
    setEstadoFilter("__all__");
    setProveedorFilter("__all__");
  };

  const proveedorOptions = useMemo(() => {
    const map = new Map<number, string>();
    proveedores.forEach((p) => {
      if (p?.id_proveedores != null) map.set(Number(p.id_proveedores), p.nombre || `Proveedor #${p.id_proveedores}`);
    });
    services.forEach((s) => {
      const id = s.id_proveedores != null ? Number(s.id_proveedores) : NaN;
      if (Number.isFinite(id) && id > 0 && !map.has(id)) {
        map.set(id, s.proveedor_nombre || `Proveedor #${id}`);
      }
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
  }, [proveedores, services]);

  const filteredServices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return services.filter((service) => {
      if (aplicaFilter !== "__all__") {
        const amb = normalizarAplicaServicio(service.aplica_a);
        if (amb !== aplicaFilter) return false;
      }
      if (estadoFilter !== "__all__") {
        const activo = servicioEstaActivo(service);
        if (estadoFilter === "activo" && !activo) return false;
        if (estadoFilter === "inactivo" && activo) return false;
      }
      if (proveedorFilter !== "__all__") {
        if (proveedorFilter === "__sin__") {
          if (service.id_proveedores != null && Number(service.id_proveedores) > 0) return false;
        } else if (String(service.id_proveedores ?? "") !== proveedorFilter) {
          return false;
        }
      }
      if (!term) return true;
      const precioTxt =
        service.precio != null && service.precio !== undefined
          ? String(service.precio)
          : "";
      const haystack = [
        service.nombre,
        service.descripcion,
        service.proveedor_nombre,
        precioTxt,
        normalizarAplicaServicio(service.aplica_a) === "finca" ? "finca" : "ruta",
        servicioEstaActivo(service) ? "activo" : "inactivo",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [services, searchTerm, aplicaFilter, estadoFilter, proveedorFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, aplicaFilter, estadoFilter, proveedorFilter]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredServices.length / itemsPerPage));
    setCurrentPage((p) => Math.min(p, maxPage));
  }, [filteredServices.length]);

  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreate = async () => {
    if (!canCreateService) {
      toast.error('No tienes permiso para crear servicios');
      return;
    }

    // Validaciones estrictas de campos obligatorios
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!formData.precio.trim()) {
      toast.error("El precio es obligatorio");
      return;
    }
    if (!formData.descripcion.trim()) {
      toast.error("La descripción es obligatoria");
      return;
    }
    if (!formData.id_proveedores) {
      toast.error("El proveedor es obligatorio");
      return;
    }
    if (!formData.aplica_a) {
      toast.error("El ámbito del servicio es obligatorio");
      return;
    }

    // Quitar puntos de formato para mandarlo como número limpio al backend
    const numericPrice = Number(formData.precio.replace(/\./g, ""));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast.error("El precio debe ser un número positivo");
      return;
    }

    try {
      await serviciosAPI.create({
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio: numericPrice,
        id_proveedores: Number(formData.id_proveedores),
        aplica_a: formData.aplica_a,
      });
      toast.success("Servicio creado exitosamente");
      setShowCreateDialog(false);
      setFormData(emptyForm);
      await cargarServicios();
      setCurrentPage(1);
    } catch (error: any) {
      toast.error(error?.message || "No se pudo crear el servicio");
    }
  };

  const handleEdit = (service: ServicioConProveedor) => {
    if (!canEditService) {
      toast.error('No tienes permiso para editar servicios');
      return;
    }

    setSelectedService(service);

    // Dar formato con puntos al precio de base de datos antes de cargarlo en el form
    const rawPrice = service.precio?.toString() || "";
    const cleanDigits = rawPrice.replace(/\D/g, "").slice(0, 10);
    const formattedPrice = cleanDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    setFormData({
      nombre: service.nombre || "",
      descripcion: service.descripcion || "",
      precio: formattedPrice,
      id_proveedores: service.id_proveedores?.toString() || "",
      aplica_a: normalizarAplicaServicio(service.aplica_a),
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!canEditService) {
      toast.error('No tienes permiso para editar servicios');
      return;
    }

    if (!selectedService) return;

    // Validaciones estrictas de campos obligatorios en Edición
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!formData.precio.trim()) {
      toast.error("El precio es obligatorio");
      return;
    }
    if (!formData.descripcion.trim()) {
      toast.error("La descripción es obligatoria");
      return;
    }
    if (!formData.id_proveedores) {
      toast.error("El proveedor es obligatorio");
      return;
    }
    if (!formData.aplica_a) {
      toast.error("El ámbito del servicio es obligatorio");
      return;
    }

    // Quitar puntos de formato para enviarlo al backend
    const numericPrice = Number(formData.precio.replace(/\./g, ""));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast.error("El precio debe ser un número positivo");
      return;
    }

    try {
      await serviciosAPI.update(selectedService.id_servicio, {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio: numericPrice,
        id_proveedores: Number(formData.id_proveedores),
        aplica_a: formData.aplica_a,
      } as any);
      toast.success("Servicio actualizado exitosamente");
      setShowEditDialog(false);
      setFormData(emptyForm);
      setSelectedService(null);
      await cargarServicios();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo actualizar el servicio");
    }
  };

  const handleDelete = async () => {
    if (!canDeleteService) {
      toast.error('No tienes permiso para eliminar servicios');
      return;
    }

    if (!selectedService) return;
    try {
      await serviciosAPI.delete(selectedService.id_servicio);
      toast.success("Servicio eliminado exitosamente");
      setShowDeleteDialog(false);
      setSelectedService(null);
      await cargarServicios();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo eliminar el servicio");
    }
  };

  const handleToggleEstado = (service: ServicioConProveedor) => {
    if (!canEditService) {
      toast.error('No tienes permiso para editar servicios');
      return;
    }
    setServiceToToggle(service);
    setShowConfirmToggle(true);
  };

  const confirmToggleEstado = async () => {
    if (!serviceToToggle) return;
    
    const activo = servicioEstaActivo(serviceToToggle);
    const servicioId = serviceToToggle.id_servicio;
    
    setShowConfirmToggle(false);
    setServiceToToggle(null);
    
    try {
      await serviciosAPI.update(servicioId, {
        estado: !activo,
      } as any);
      toast.success(`Servicio ${!activo ? 'activado' : 'desactivado'}`);
      await cargarServicios();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo cambiar el estado");
    }
  };

  if (!permisos.loadingRoles && !canViewServices) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Acceso denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">No tienes permiso para ver servicios.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Gestión de Servicios</h2>
          <p className="text-gray-500 text-sm">Administra los servicios y sus proveedores</p>
        </div>
        {canCreateService && (
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => {
            setFormData(emptyForm);
            setShowCreateDialog(true);
          }}>
            <Plus className="w-4 h-4 mr-2" /> Crear Servicio
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="relative flex-1 min-w-0 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
              <Input
                placeholder="Buscar por nombre, descripción, proveedor, precio, ámbito..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-green-200 w-full"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-green-200 hover:bg-green-50 shrink-0"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <Filter className="w-4 h-4 mr-2 text-green-600" />
              Filtros
              {hasActiveFilters ? (
                <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-800">
                  Activos
                </Badge>
              ) : null}
            </Button>
          </div>

          {filtersOpen ? (
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 rounded-lg border border-green-100 bg-green-50/50 p-4">
              <div className="space-y-1.5 min-w-[160px] flex-1">
                <Label className="text-xs text-green-800">Ámbito</Label>
                <Select value={aplicaFilter} onValueChange={setAplicaFilter}>
                  <SelectTrigger className="border-green-200 bg-white">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    <SelectItem value="ruta">Ruta</SelectItem>
                    <SelectItem value="finca">Finca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 min-w-[160px] flex-1">
                <Label className="text-xs text-green-800">Estado</Label>
                <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                  <SelectTrigger className="border-green-200 bg-white">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 min-w-[200px] flex-1">
                <Label className="text-xs text-green-800">Proveedor</Label>
                <Select value={proveedorFilter} onValueChange={setProveedorFilter}>
                  <SelectTrigger className="border-green-200 bg-white">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    <SelectItem value="__sin__">Sin proveedor</SelectItem>
                    {proveedorOptions.map(([id, nombre]) => (
                      <SelectItem key={id} value={String(id)}>
                        {nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-green-800 hover:bg-green-100"
                  disabled={!hasActiveFilters && !searchTerm.trim()}
                  onClick={() => {
                    clearFilters();
                    setSearchTerm("");
                  }}
                >
                  Limpiar búsqueda y filtros
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">
            Servicios ({filteredServices.length}
            {services.length !== filteredServices.length ? ` de ${services.length}` : ""})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Cargando servicios...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-green-200">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Ámbito</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedServices.map((service) => (
                  <TableRow key={service.id_servicio + "-" + (service.id_proveedores ?? "sinprov")} className="border-green-100 hover:bg-green-50">
                    <TableCell className="font-medium">{service.nombre}</TableCell>
                    <TableCell className="text-gray-600 text-sm max-w-[200px] truncate">
                      {service.descripcion || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          normalizarAplicaServicio(service.aplica_a) === "finca"
                            ? "bg-sky-100 text-sky-900 border-sky-200"
                            : "bg-amber-50 text-amber-900 border-amber-200"
                        }
                      >
                        {normalizarAplicaServicio(service.aplica_a) === "finca" ? "Finca" : "Ruta"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {service.precio != null
                        ? `$${Number(service.precio).toLocaleString("es-CO")}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {service.proveedor_nombre
                        ? <Badge variant="outline">{service.proveedor_nombre}</Badge>
                        : <span className="text-gray-400 text-sm">Sin proveedor</span>
                      }
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={servicioEstaActivo(service)}
                        onCheckedChange={() => handleToggleEstado(service)}
                        disabled={!canEditService}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost"
                          className="hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => { setSelectedService(service); setShowViewDialog(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canEditService && (
                          <Button size="sm" variant="ghost"
                            className="hover:bg-green-50 hover:text-green-600"
                            onClick={() => handleEdit(service)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDeleteService && (
                          <Button size="sm" variant="ghost"
                            className="hover:bg-red-50 hover:text-red-600"
                            onClick={() => { setSelectedService(service); setShowDeleteDialog(true); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedServices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      <Settings className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>
                        {services.length === 0
                          ? "No hay servicios disponibles"
                          : "Ningún servicio coincide con la búsqueda o los filtros"}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {filteredServices.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-green-100">
              <p className="text-sm text-gray-600">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                {Math.min(currentPage * itemsPerPage, filteredServices.length)} de {filteredServices.length} resultado
                {filteredServices.length === 1 ? "" : "s"}
                {services.length !== filteredServices.length ? (
                  <span className="text-gray-500"> (catálogo: {services.length})</span>
                ) : null}
              </p>
              {Math.ceil(filteredServices.length / itemsPerPage) > 1 ? (
                <div className="flex gap-2 items-center">
                  <Button size="sm" variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="border-green-200 text-green-700">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {currentPage} de {Math.ceil(filteredServices.length / itemsPerPage)}
                  </span>
                  <Button size="sm" variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredServices.length / itemsPerPage), p + 1))}
                    disabled={currentPage === Math.ceil(filteredServices.length / itemsPerPage)}
                    className="border-green-200 text-green-700">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Crear */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Crear Nuevo Servicio</DialogTitle>
            <DialogDescription>Completa todos los campos obligatorios para registrar un nuevo servicio.</DialogDescription>
          </DialogHeader>
          <ServicioFormFields formData={formData} setFormData={setFormData} proveedores={proveedores} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleCreate}>
              Crear Servicio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Editar Servicio</DialogTitle>
            <DialogDescription>Modifica la información del servicio. Todos los campos son obligatorios.</DialogDescription>
          </DialogHeader>
          <ServicioFormFields formData={formData} setFormData={setFormData} proveedores={proveedores} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleUpdate}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ver */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-green-800">Detalle del Servicio</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-3">
              {[
                { label: "Nombre", value: selectedService.nombre },
                { label: "Descripción", value: selectedService.descripcion || "—" },
                {
                  label: "Ámbito",
                  value: normalizarAplicaServicio(selectedService.aplica_a) === "finca" ? "Finca" : "Ruta",
                },
                { label: "Precio", value: selectedService.precio ? `$${Number(selectedService.precio).toLocaleString("es-CO")}` : "—" },
                { label: "Proveedor", value: selectedService.proveedor_nombre || "Sin proveedor" },
                { label: "Estado", value: servicioEstaActivo(selectedService) ? "Activo" : "Inactivo" },
                { label: "Fecha creación", value: selectedService.fecha_creacion ? new Date(selectedService.fecha_creacion).toLocaleDateString('es-CO') : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-green-100">
                  <span className="font-medium text-green-800">{label}</span>
                  <span className="text-gray-600">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Cerrar</Button>
            {canEditService && (
              <Button className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => { setShowViewDialog(false); if (selectedService) handleEdit(selectedService); }}>
                <Edit className="w-4 h-4 mr-2" /> Editar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Cambio de Estado */}
      <AlertDialog open={showConfirmToggle} onOpenChange={setShowConfirmToggle}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de estado</AlertDialogTitle>
            <AlertDialogDescription>
              {serviceToToggle && servicioEstaActivo(serviceToToggle)
                ? `¿Desactivar el servicio "${serviceToToggle.nombre}"? Los clientes no podrán verlo en las reservas.`
                : `¿Activar el servicio "${serviceToToggle?.nombre}"? Estará disponible en las reservas.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleEstado} className="bg-green-600 hover:bg-green-700">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">¿Eliminar servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el servicio <span className="font-semibold">{selectedService?.nombre}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Confirmar eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}