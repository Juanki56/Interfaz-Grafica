import { useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { serviciosAPI, ServicioConProveedor, proveedoresAPI, Proveedor } from "../services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export function ServiceManagement() {
  const [services, setServices] = useState<ServicioConProveedor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    duracion: "",
    capacidad: "",
    id_proveedores: "",
  });

  // Carga inicial de servicios con proveedor
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const [servRes, provRes] = await Promise.all([
          serviciosAPI.getAllConProveedor(),
          proveedoresAPI.getAll(),
        ]);
        // Si el endpoint con JOIN no devuelve resultados, al menos mostramos los servicios base.
        if (servRes?.length) {
          setServices(servRes);
        } else {
          const base = await serviciosAPI.getAll();
          setServices(base as ServicioConProveedor[]);
        }
        setProveedores(provRes);
      } catch (error: any) {
        console.error("Error inicializando servicios:", error);
        toast.error(error?.message || "Error cargando servicios");
        setServices([]);
        setProveedores([]);
      } finally {
        setIsLoading(false);
        setCurrentPage(1);
      }
    };

    init();
  }, []);

  // Filtrado
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      (service.nombre ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (service.descripcion ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Evita que la tabla quede vacía si el usuario estaba en una página alta
  // y después se recarga con menos resultados.
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredServices.length / itemsPerPage));
    setCurrentPage((p) => Math.min(p, maxPage));
  }, [filteredServices.length]);

  // Paginación
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Crear servicio
  const handleCreateService = async () => {
    if (!formData.nombre || !formData.precio) {
      toast.error("Completa los campos requeridos");
      return;
    }

    if (!formData.id_proveedores) {
      toast.error("Selecciona un proveedor");
      return;
    }

    try {
      await serviciosAPI.create({
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: Number(formData.precio),
        duracion: formData.duracion,
        capacidad: formData.capacidad ? Number(formData.capacidad) : undefined,
        id_proveedores: Number(formData.id_proveedores),
      });
      setShowCreateDialog(false);
      setFormData({
        nombre: "",
        descripcion: "",
        precio: "",
        duracion: "",
        capacidad: "",
        id_proveedores: "",
      });
      const servRes = await serviciosAPI.getAllConProveedor();
      if (servRes?.length) {
        setServices(servRes);
      } else {
        const base = await serviciosAPI.getAll();
        setServices(base as ServicioConProveedor[]);
      }
      setCurrentPage(1);
      toast.success("Servicio creado");
    } catch (error: any) {
      console.error("No se pudo crear el servicio:", error);
      toast.error(error?.message || "No se pudo crear el servicio");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-semibold text-gray-900">Gestión de Servicios</h2>
        <Button color="green" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" /> Crear Servicios
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar servicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios ({filteredServices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Cargando servicios...</div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedServices.map((service) => (
                  <TableRow key={service.id_servicio + "-" + (service.id_proveedores ?? "sinprov")}>
                    <TableCell>{service.nombre}</TableCell>
                    <TableCell>
                      {service.proveedor_nombre 
                        ? service.proveedor_nombre 
                        : <span className="text-gray-400">Sin proveedor</span>
                      }
                    </TableCell>
                    <TableCell>
                      {service.precio != null
                        ? `$${Number(service.precio).toLocaleString("es-CO")}`
                        : "-"}
                    </TableCell>
                    <TableCell>{service.duracion ?? "-"}</TableCell>
                    <TableCell>{service.capacidad ?? "-"}</TableCell>
                    <TableCell>{service.contacto ?? "-"}</TableCell>
                    <TableCell>
                      <Switch checked={service.estado === true} readOnly />
                      <span className="ml-2">{service.estado ? "Activo" : "Inactivo"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedServices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-gray-500">
                        <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No hay datos disponibles</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      <div className="flex justify-between items-center mt-4">
        <span>
          Mostrando {filteredServices.length > 0
            ? (currentPage - 1) * itemsPerPage + 1
            : 0} - {(currentPage - 1) * itemsPerPage + paginatedServices.length} de {filteredServices.length} registros
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </Button>
          <span className="rounded px-2 py-1 bg-green-100 text-green-700">{currentPage}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setCurrentPage((p) =>
                Math.min(Math.ceil(filteredServices.length / itemsPerPage), p + 1)
              )
            }
            disabled={currentPage === Math.ceil(filteredServices.length / itemsPerPage)}
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Dialog Crear Servicio */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Servicio</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Nombre</Label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData(f => ({ ...f, nombre: e.target.value }))}
            />
            <Label>Descripción</Label>
            <Textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(f => ({ ...f, descripcion: e.target.value }))}
            />
            <Label>Precio</Label>
            <Input
              type="number"
              value={formData.precio}
              onChange={(e) => setFormData(f => ({ ...f, precio: e.target.value }))}
            />
            <Label>Duración</Label>
            <Input
              value={formData.duracion}
              onChange={(e) => setFormData(f => ({ ...f, duracion: e.target.value }))}
            />
            <Label>Capacidad</Label>
            <Input
              value={formData.capacidad}
              onChange={(e) => setFormData(f => ({ ...f, capacidad: e.target.value }))}
            />
            <Label>Proveedor</Label>
            <Select
              value={formData.id_proveedores}
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >Cancelar</Button>
            <Button onClick={handleCreateService}>Crear Servicio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}