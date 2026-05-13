import { useEffect, useState, useMemo } from "react";
import {
  Plus, Edit, Trash2, Eye, Settings,
  ChevronLeft, ChevronRight, Filter, ArrowUpDown
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
  DialogHeader, DialogTitle, DialogDescription,
  DialogTrigger
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

const emptyForm = {
  nombre: "",
  descripcion: "",
  precio: "",
  id_proveedores: "",
  estado: true,
};

type ServiceFormData = typeof emptyForm;

interface ServiceFormFieldsProps {
  formData: ServiceFormData;
  formErrors: Record<string, string>;
  proveedores: Proveedor[];
  onNombreChange: (value: string) => void;
  onPrecioChange: (value: string) => void;
  onDescripcionChange: (value: string) => void;
  onProveedorChange: (value: string) => void;
  onEstadoChange: (value: boolean) => void;
}

function ServiceFormFields({
  formData,
  formErrors,
  proveedores,
  onNombreChange,
  onPrecioChange,
  onDescripcionChange,
  onProveedorChange,
  onEstadoChange,
}: ServiceFormFieldsProps) {
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Nombre *</Label>
          <Input
            autoFocus
            value={formData.nombre}
            onChange={(e) => onNombreChange(e.target.value)}
            placeholder="Nombre del servicio"
          />
          {formErrors.nombre && <p className="text-sm text-red-600 mt-1">{formErrors.nombre}</p>}
        </div>
        <div>
          <Label>Precio *</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={formData.precio}
            onChange={(e) => onPrecioChange(e.target.value)}
            placeholder="0"
          />
          {formErrors.precio && <p className="text-sm text-red-600 mt-1">{formErrors.precio}</p>}
        </div>
      </div>
      <div>
        <Label>Descripción *</Label>
        <Textarea
          value={formData.descripcion}
          onChange={(e) => onDescripcionChange(e.target.value)}
          placeholder="Descripción del servicio"
        />
        {formErrors.descripcion && <p className="text-sm text-red-600 mt-1">{formErrors.descripcion}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Proveedor *</Label>
          <Select
            value={formData.id_proveedores}
            onValueChange={(v: string) => onProveedorChange(v)}
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
          {formErrors.id_proveedores && <p className="text-sm text-red-600 mt-1">{formErrors.id_proveedores}</p>}
        </div>
        <div className="flex flex-col justify-end">
          <Label>Estado *</Label>
          <div className="flex items-center gap-3 mt-2">
            <Switch
              checked={formData.estado}
              onCheckedChange={onEstadoChange}
              className="data-[state=checked]:bg-green-600"
            />
            <span className="text-sm text-gray-700">{formData.estado ? 'Activo' : 'Inactivo'}</span>
          </div>
        </div>
      </div>
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
  const [currentPage, setCurrentPage] = useState(1);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Nuevos estados para filtros y ordenamiento
  const [filterCriteria, setFilterCriteria] = useState<{ type: 'nombre' | 'estado' | 'proveedor'; value: string }>({ type: 'nombre', value: '' });
  const [sortCriteria, setSortCriteria] = useState<{ field: 'nombre' | 'estado' | 'proveedor'; direction: 'asc' | 'desc' }>({ field: 'nombre', direction: 'asc' });
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<ServicioConProveedor | null>(null);

  const itemsPerPage = 10;

  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  // Filtrar y ordenar servicios
  const filteredAndSortedServices = useMemo(() => {
    let filtered = services.filter((service) => {
      // Búsqueda por nombre y descripción
      const matchesSearch = (service.nombre ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (service.descripcion ?? "").toLowerCase().includes(searchTerm.toLowerCase());

      // Filtros adicionales
      let matchesFilter = true;
      if (filterCriteria.value) {
        switch (filterCriteria.type) {
          case 'nombre':
            matchesFilter = (service.nombre ?? "").toLowerCase().includes(filterCriteria.value.toLowerCase());
            break;
          case 'estado':
            const estadoStr = service.estado ? 'activo' : 'inactivo';
            matchesFilter = estadoStr.includes(filterCriteria.value.toLowerCase());
            break;
          case 'proveedor':
            matchesFilter = (service.proveedor_nombre ?? "").toLowerCase().includes(filterCriteria.value.toLowerCase());
            break;
        }
      }

      return matchesSearch && matchesFilter;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: string | boolean;
      let bValue: string | boolean;

      switch (sortCriteria.field) {
        case 'nombre':
          aValue = (a.nombre ?? "").toLowerCase();
          bValue = (b.nombre ?? "").toLowerCase();
          break;
        case 'estado':
          aValue = Boolean(a.estado);
          bValue = Boolean(b.estado);
          break;
        case 'proveedor':
          aValue = (a.proveedor_nombre ?? "").toLowerCase();
          bValue = (b.proveedor_nombre ?? "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortCriteria.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortCriteria.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [services, searchTerm, filterCriteria, sortCriteria]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredAndSortedServices.length / itemsPerPage));
    setCurrentPage((p) => Math.min(p, maxPage));
  }, [filteredAndSortedServices.length]);

  const paginatedServices = filteredAndSortedServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const sanitizeNombre = (value: string) => value.replace(/[^A-Za-zÀ-ÿ\s]/g, "");
  const sanitizePrecio = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");
    return parts.length > 1
      ? `${parts[0]}.${parts.slice(1).join("")}`
      : parts[0];
  };
  const sanitizeDescripcion = (value: string) => value.replace(/[^A-Za-z0-9À-ÿ\s]/g, "");

  const validarFormulario = () => {
    const errors: Record<string, string> = {};
    const nombre = formData.nombre.trim();
    const precio = formData.precio.trim();
    const descripcion = formData.descripcion.trim();
    const proveedor = formData.id_proveedores;

    if (!nombre) {
      errors.nombre = "El nombre es obligatorio.";
    } else if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nombre)) {
      errors.nombre = "El nombre solo puede contener letras.";
    }

    if (!precio) {
      errors.precio = "El precio es obligatorio.";
    } else if (!/^\d+(\.\d{1,2})?$/.test(precio)) {
      errors.precio = "El precio debe ser un número válido.";
    } else if (Number(precio) < 0) {
      errors.precio = "El precio no puede ser negativo.";
    }

    if (!descripcion) {
      errors.descripcion = "La descripción es obligatoria.";
    } else if (!/^[A-Za-z0-9À-ÿ\s]+$/.test(descripcion)) {
      errors.descripcion = "La descripción solo puede contener letras y números.";
    }

    if (!proveedor) {
      errors.id_proveedores = "Selecciona un proveedor.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!canCreateService) {
      toast.error('No tienes permiso para crear servicios');
      return;
    }

    if (!validarFormulario()) return;

    try {
      await serviciosAPI.create({
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio: Number(formData.precio),
        id_proveedores: Number(formData.id_proveedores),
        estado: formData.estado,
      });
      toast.success("Servicio creado exitosamente");
      setShowCreateDialog(false);
      setFormData(emptyForm);
      setFormErrors({});
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
    setFormData({
      nombre: service.nombre || "",
      descripcion: service.descripcion || "",
      precio: service.precio?.toString() || "",
      id_proveedores: service.id_proveedores?.toString() || "",
      estado: Boolean(service.estado),
    });
    setFormErrors({});
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!canEditService) {
      toast.error('No tienes permiso para editar servicios');
      return;
    }

    if (!selectedService) return;
    if (!validarFormulario()) return;

    try {
      await serviciosAPI.update(selectedService.id_servicio, {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio: Number(formData.precio),
        id_proveedores: Number(formData.id_proveedores),
        estado: formData.estado,
      } as any);
      toast.success("Servicio actualizado exitosamente");
      setShowEditDialog(false);
      setFormData(emptyForm);
      setSelectedService(null);
      setFormErrors({});
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

  const handleToggleEstado = async (service: ServicioConProveedor) => {
    if (!canEditService) {
      toast.error('No tienes permiso para editar servicios');
      return;
    }

    try {
      await serviciosAPI.update(service.id_servicio, {
        estado: !service.estado,
      } as any);
      toast.success(`Servicio ${!service.estado ? 'activado' : 'desactivado'}`);
      await cargarServicios();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo cambiar el estado");
    }
  };

  const handleApplyFilter = () => {
    setShowFilterDialog(false);
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setFilterCriteria({ type: 'nombre', value: '' });
    setShowFilterDialog(false);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    const [field, direction] = value.split('-');
    setSortCriteria({ field: field as any, direction: direction as 'asc' | 'desc' });
    setCurrentPage(1);
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
            setFormErrors({});
            setShowCreateDialog(true);
          }}>
            <Plus className="w-4 h-4 mr-2" /> Crear Servicio
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Buscar servicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-green-200"
            />
            <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-green-200 text-green-700">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filtrar Servicios</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="filter-type" className="text-right">Filtrar por</Label>
                    <Select value={filterCriteria.type} onValueChange={(value: any) => setFilterCriteria({ ...filterCriteria, type: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nombre">Nombre</SelectItem>
                        <SelectItem value="estado">Estado</SelectItem>
                        <SelectItem value="proveedor">Proveedor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="filter-value" className="text-right">Valor</Label>
                    <Input
                      id="filter-value"
                      value={filterCriteria.value}
                      onChange={(e) => setFilterCriteria({ ...filterCriteria, value: e.target.value })}
                      placeholder={`Buscar por ${filterCriteria.type}`}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleClearFilter}>Limpiar</Button>
                  <Button onClick={handleApplyFilter}>Aplicar</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Select value={`${sortCriteria.field}-${sortCriteria.direction}`} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[200px] border-green-200">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nombre-asc">Nombre A-Z</SelectItem>
                <SelectItem value="nombre-desc">Nombre Z-A</SelectItem>
                <SelectItem value="estado-asc">Estado Activo primero</SelectItem>
                <SelectItem value="estado-desc">Estado Inactivo primero</SelectItem>
                <SelectItem value="proveedor-asc">Proveedor A-Z</SelectItem>
                <SelectItem value="proveedor-desc">Proveedor Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">Servicios ({filteredAndSortedServices.length})</CardTitle>
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
                        checked={service.estado === true}
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
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      <Settings className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>No hay servicios disponibles</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {Math.ceil(filteredAndSortedServices.length / itemsPerPage) > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-green-100">
              <p className="text-sm text-gray-600">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredAndSortedServices.length)} de {filteredAndSortedServices.length}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-green-200 text-green-700">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 self-center">
                  Página {currentPage} de {Math.ceil(filteredAndSortedServices.length / itemsPerPage)}
                </span>
                <Button size="sm" variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredAndSortedServices.length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(filteredAndSortedServices.length / itemsPerPage)}
                  className="border-green-200 text-green-700">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Crear */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Crear Nuevo Servicio</DialogTitle>
            <DialogDescription>Completa los campos para registrar un nuevo servicio.</DialogDescription>
          </DialogHeader>
          <ServiceFormFields
            formData={formData}
            formErrors={formErrors}
            proveedores={proveedores}
            onNombreChange={(value) => setFormData((f) => ({ ...f, nombre: sanitizeNombre(value) }))}
            onPrecioChange={(value) => setFormData((f) => ({ ...f, precio: sanitizePrecio(value) }))}
            onDescripcionChange={(value) => setFormData((f) => ({ ...f, descripcion: sanitizeDescripcion(value) }))}
            onProveedorChange={(value) => setFormData((f) => ({ ...f, id_proveedores: value }))}
            onEstadoChange={(value) => setFormData((f) => ({ ...f, estado: value }))}
          />
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
            <DialogDescription>Modifica la información del servicio.</DialogDescription>
          </DialogHeader>
          <ServiceFormFields
            formData={formData}
            formErrors={formErrors}
            proveedores={proveedores}
            onNombreChange={(value) => setFormData((f) => ({ ...f, nombre: sanitizeNombre(value) }))}
            onPrecioChange={(value) => setFormData((f) => ({ ...f, precio: sanitizePrecio(value) }))}
            onDescripcionChange={(value) => setFormData((f) => ({ ...f, descripcion: sanitizeDescripcion(value) }))}
            onProveedorChange={(value) => setFormData((f) => ({ ...f, id_proveedores: value }))}
            onEstadoChange={(value) => setFormData((f) => ({ ...f, estado: value }))}
          />
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
                { label: "Precio", value: selectedService.precio ? `$${Number(selectedService.precio).toLocaleString("es-CO")}` : "—" },
                { label: "Proveedor", value: selectedService.proveedor_nombre || "Sin proveedor" },
                { label: "Estado", value: selectedService.estado ? "Activo" : "Inactivo" },
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
            <Button className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => { setShowViewDialog(false); if (selectedService) handleEdit(selectedService); }}>
              <Edit className="w-4 h-4 mr-2" /> Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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