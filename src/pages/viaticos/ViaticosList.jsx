import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Car,
  User,
  Trash2,
  Edit3,
  Search,
  FileText,
  Eye,
  Wallet,
  ArrowRight,
  Loader2,
  X,
  CheckCircle,
  XCircle,
  ReceiptText,
  AlertTriangle,
  MoreVertical,
  Receipt,
  Calendar,
} from "lucide-react";

import {
  getViaticos,
  getViatico,
  deleteViatico,
  aprobarViatico,
  rechazarViatico,
  enviarRevision,
} from "@/services/viaticos.service";
import { obtenerVehiculos } from "@/services/VehiculosService";
import { getEmpleados } from "@/services/AuthServices";
import exportViaticos from "@/utils/exportViaticos";

import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import useIsMobile from "@/hooks/useIsMobile";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { sileo } from "sileo";

// ─── Tabs de filtro — cada value se envía al backend como query param `tipo` ──
const TABS = [
  { label: "Activos", value: "activos" },
  { label: "Liquidados", value: "historico" },
  { label: "Todos", value: "todos" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getEstadoBadge = (estado) => {
  switch (estado) {
    case "Borrador":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "Pendiente":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Aprobado":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Rechazado":
    case "Cancelado":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "Finalizado":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Liquidado":
      return "bg-violet-100 text-violet-700 border-violet-200";
    default:
      return "bg-muted text-muted-foreground border-transparent";
  }
};

const formatFecha = (str) => {
  if (!str) return "S/F";
  const [y, m, d] = str.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
};

const formatLps = (amount) =>
  `L ${Number(amount || 0).toLocaleString("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const capTipo = (tipo) =>
  tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase() : "—";

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ViaticosList() {
  const [viaticos, setViaticos] = useState([]);
  const [empMap, setEmpMap] = useState({});
  const [vehMap, setVehMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Tab activo — controla qué query param se envía al backend
  const [tipoActivo, setTipoActivo] = useState("activos");

  const [detalle, setDetalle] = useState(null);
  const [detalleItems, setDetalleItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const [exportingId, setExportingId] = useState(null);

  const { showToast } = useToast();
  const { userData, hasPermiso } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const can = useCallback(
    (p) => isAdmin || hasPermiso(p),
    [isAdmin, hasPermiso],
  );

  const canView = can("read_viatico");
  const canCreate = can("create_viatico");
  const canDelete = can("delete_viatico");
  const canUpdate = can("update_viatico");
  const canApprove = can("approve_viatico");
  const canExport = can("export_viatico");
  const canRead = can("read_liquidacion");
  const canEnviarRevision = can("enviar_revision");

  // ── Fetch centralizado — llama al backend con el tipo del tab activo ────────
  const fetchViaticos = useCallback(
    async (tipo) => {
      if (!canView) return setLoading(false);
      setLoading(true);
      try {
        const [data, emps, vehs] = await Promise.all([
          getViaticos(tipo),
          getEmpleados(),
          obtenerVehiculos(),
        ]);
        setViaticos(data || []);
        const em = {};
        (emps || []).forEach((e) => {
          em[e.id] = e.nombre;
        });
        setEmpMap(em);
        const vm = {};
        (vehs || []).forEach((v) => {
          vm[v.id] = v.placa;
        });
        setVehMap(vm);
      } catch {
        showToast("Error al cargar los datos", "danger");
      } finally {
        setLoading(false);
      }
    },
    [canView],
  );

  // Carga inicial y cada vez que el tab cambia
  useEffect(() => {
    fetchViaticos(tipoActivo);
  }, [tipoActivo, fetchViaticos]);

  // ── Cambio de tab ──────────────────────────────────────────────────────────
  const handleTabChange = (valor) => {
    if (valor === tipoActivo) return;
    setSearchTerm(""); // limpiar búsqueda al cambiar de vista
    setTipoActivo(valor);
  };

  const handleVerDetalle = async (v) => {
    setDetalle(v);
    setDetalleItems([]);
    setLoadingItems(true);
    const full = await getViatico(v.id);
    setDetalleItems(full?.detalles || []);
    setLoadingItems(false);
  };

  const handleDelete = async (id) => {
    if (!canDelete) return showToast("No tienes permiso", "warning");
    if (!confirm("¿Eliminar este viático definitivamente?")) return;
    const res = await deleteViatico(id);
    if (res) {
      showToast("Viático eliminado", "success");
      fetchViaticos(tipoActivo);
    } else {
      showToast("Error al eliminar", "danger");
    }
  };

  const handleAprobar = async (id) => {
    if (!canApprove) return showToast("No tienes permiso", "warning");
    if (!confirm("¿Aprobar este viático?")) return;
    const res = await aprobarViatico(id);
    if (res) {
      showToast("Viático aprobado", "success");
      setDetalle(null);
      fetchViaticos(tipoActivo);
    } else {
      showToast("Error al aprobar", "danger");
    }
  };

  const handleRechazarConfirm = async () => {
    if (!motivoRechazo.trim())
      return showToast("Ingresa un motivo de rechazo", "warning");
    setCancelLoading(true);
    const res = await rechazarViatico(cancelTarget, motivoRechazo);
    setCancelLoading(false);
    if (res) {
      showToast("Viático cancelado", "success");
      setCancelTarget(null);
      setMotivoRechazo("");
      setDetalle(null);
      fetchViaticos(tipoActivo);
    } else {
      showToast("Error al cancelar", "danger");
    }
  };

  const handleEnviarRevision = async (id) => {
    if (!confirm("¿Enviar a revisión nuevamente?")) return;
    const res = await enviarRevision(id);
    if (res) {
      showToast("Enviado a revisión", "success");
      fetchViaticos(tipoActivo);
    } else {
      showToast("Error al enviar", "danger");
    }
  };

  const handleExport = async (id) => {
    if (!canExport) {
      return sileo.error({
        title: "Acceso denegado",
        description: "No tienes permisos para exportar este documento.",
      });
    }
    const exportTask = async () => {
      const full = await getViatico(id);
      await exportViaticos(full);
    };
    sileo.promise(exportTask(), {
      loading: {
        title: "Generando reporte...",
        description: "Obteniendo datos y preparando el archivo.",
        fill: "black",
        styles: {
          title: "text-white!",
          description: "text-white/75!",
          badge: "bg-white/20!",
          button: "bg-white/10!",
        },
      },
      success: {
        title: "Exportación completa",
        description: "El archivo se ha generado con éxito.",
        fill: "black",
        styles: {
          title: "text-white!",
          description: "text-white/75!",
          badge: "bg-white/20!",
          button: "bg-white/10!",
        },
      },
      error: {
        title: "Error de exportación",
        description: "Ocurrió un problema al conectar con el servidor.",
        fill: "black",
        styles: {
          title: "text-white!",
          description: "text-white/75!",
          badge: "bg-white/20!",
          button: "bg-white/10!",
        },
      },
    });
  };

  const canEditRow = (v) =>
    canUpdate && (isAdmin || (v.estado !== "Aprobado" && v.estado !== "Liquidado"));
  const canDeleteRow = (v) =>
    canDelete && (isAdmin || (v.estado !== "Aprobado" && v.estado !== "Liquidado"));

  // Búsqueda local por nombre de empleado o placa — no filtra por estado
  const filtered = viaticos.filter((v) => {
    const term = searchTerm.toLowerCase();
    return (
      (empMap[v.empleado_id] || "").toLowerCase().includes(term) ||
      (vehMap[v.vehiculo_id] || "").toLowerCase().includes(term)
    );
  });

  // ─── Menú de acciones reutilizable (desktop + mobile) ─────────────────────
  const AccionesMenu = ({ v }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 w-9 p-0 hover:bg-muted rounded-full">
          <MoreVertical size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>

        <DropdownMenuItem onClick={() => handleVerDetalle(v)}>
          <Eye className="mr-2 h-4 w-4" /> Ver Detalle
        </DropdownMenuItem>

        {canExport && (
          <DropdownMenuItem onClick={() => handleExport(v.id)}>
            {exportingId === v.id ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Exportar Excel
          </DropdownMenuItem>
        )}

        {canRead && (v.estado === "Aprobado" || v.estado === "Liquidado") && (
          <DropdownMenuItem
            onClick={() => navigate(`/admin/viaticos/${v.id}/liquidar`)}>
            <Receipt className="mr-2 h-4 w-4" /> Ver Liquidación
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {canApprove &&
          (v.estado === "Borrador" || v.estado === "Pendiente") && (
            <>
              <DropdownMenuItem
                onClick={() => handleAprobar(v.id)}
                className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50">
                <CheckCircle className="mr-2 h-4 w-4" /> Aprobar Viático
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCancelTarget(v.id)}
                className="text-amber-600 focus:text-amber-600 focus:bg-amber-50">
                <XCircle className="mr-2 h-4 w-4" /> Rechazar Viático
              </DropdownMenuItem>
            </>
          )}

        {canEnviarRevision && v.estado === "Rechazado" && (
          <DropdownMenuItem onClick={() => handleEnviarRevision(v.id)}>
            <ArrowRight className="mr-2 h-4 w-4" /> Enviar a Revisión
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {canEditRow(v) && (
          <DropdownMenuItem
            onClick={() => navigate(`/admin/viaticos/edit/${v.id}`)}>
            <Edit3 className="mr-2 h-4 w-4" /> Editar Solicitud
          </DropdownMenuItem>
        )}

        {canDeleteRow(v) && (
          <DropdownMenuItem
            onClick={() => handleDelete(v.id)}
            className="text-rose-600 focus:text-rose-600 focus:bg-rose-50">
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (!canView)
    return <div className="p-10 text-center opacity-50">Acceso denegado</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Wallet className="text-primary" size={32} />
            GESTIÓN DE GASTOS
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Gestión de gastos de viaje y liquidaciones del personal.
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => navigate("/admin/viaticos/new")}
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl px-6 h-12 w-full md:w-auto">
            <Plus size={20} className="mr-2" /> Nueva Solicitud
          </Button>
        )}
      </div>

      {/* TABS — cada tab dispara una nueva petición al backend */}
      <div className="bg-card border rounded-2xl p-1.5 shadow-sm flex gap-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${tipoActivo === tab.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm flex gap-4 items-center">
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por empleado o vehículo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-muted/50 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 ring-primary/20 transition-all outline-none"
          />
        </div>
        <div className="shrink-0 text-[11px] text-muted-foreground font-semibold whitespace-nowrap">
          {filtered.length} reg.
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="bg-card border rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-muted-foreground text-sm">
              Cargando viáticos...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center">
            <FileText size={40} className="mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground font-semibold">
              No hay viáticos registrados
            </p>
          </div>
        ) : isMobile ? (
          /* ── MOBILE: CARDS ───────────────────────────────────────────────── */
          <div className="divide-y divide-border">
            {filtered.map((v) => (
              <div key={v.id} className="p-4 space-y-3">
                {/* Empleado + Estado */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-muted flex items-center justify-center">
                      <User size={18} className="text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">
                        {empMap[v.empleado_id] || "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Car size={11} />
                        {vehMap[v.vehiculo_id] || "S/P"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-1 text-[10px] font-black uppercase rounded-full border ${getEstadoBadge(v.estado)}`}>
                    {v.estado || "Borrador"}
                  </span>
                </div>

                {/* Fechas + Total */}
                <div className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    <Calendar size={11} className="text-primary" />
                    <span className="bg-background px-2 py-0.5 rounded border">
                      {formatFecha(v.fecha_salida)}
                    </span>
                    <ArrowRight size={10} className="opacity-30" />
                    <span className="bg-background px-2 py-0.5 rounded border">
                      {formatFecha(v.fecha_regreso)}
                    </span>
                  </div>
                  <span className="font-black text-sm text-primary">
                    {formatLps(v.total_general)}
                  </span>
                </div>

                {/* Acciones */}
                <div className="flex justify-end">
                  <AccionesMenu v={v} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── DESKTOP: TABLA ──────────────────────────────────────────────── */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Empleado
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Vehículo
                  </th>
                  <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Período
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Total General
                  </th>
                  <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                          <User size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-sm">
                            {empMap[v.empleado_id] || "—"}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                            ID: {v.empleado_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Car size={16} className="text-muted-foreground" />
                        <span className="font-bold text-sm">
                          {vehMap[v.vehiculo_id] || "S/P"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 text-[11px] font-bold">
                        <span className="bg-muted px-2 py-1 rounded border">
                          {formatFecha(v.fecha_salida)}
                        </span>
                        <ArrowRight size={12} className="opacity-30" />
                        <span className="bg-muted px-2 py-1 rounded border">
                          {formatFecha(v.fecha_regreso)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-sm">
                        {formatLps(v.total_general)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${getEstadoBadge(v.estado)}`}>
                        {v.estado || "Borrador"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <AccionesMenu v={v} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DETALLE */}
      {detalle && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setDetalle(null)}>
          <div
            className="bg-card rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-xl p-6 space-y-4 animate-in slide-in-from-bottom md:zoom-in-90 duration-200 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black uppercase tracking-tight">
                  Viático #{detalle.id}
                </h2>
                <span
                  className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${getEstadoBadge(detalle.estado)}`}>
                  {detalle.estado || "Borrador"}
                </span>
              </div>
              <button
                onClick={() => setDetalle(null)}
                className="p-2 hover:bg-muted rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <Row
                label="Empleado"
                value={
                  empMap[detalle.empleado_id] || `ID: ${detalle.empleado_id}`
                }
              />
              <Row
                label="Vehículo"
                value={
                  vehMap[detalle.vehiculo_id] || `ID: ${detalle.vehiculo_id}`
                }
              />
              <Row label="Salida" value={formatFecha(detalle.fecha_salida)} />
              <Row label="Regreso" value={formatFecha(detalle.fecha_regreso)} />
              {detalle.motivo_viaje && (
                <Row label="Motivo" value={detalle.motivo_viaje} />
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ReceiptText size={14} /> Detalle de Gastos
              </h3>

              {loadingItems ? (
                <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Cargando ítems...</span>
                </div>
              ) : detalleItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin ítems registrados
                </p>
              ) : (
                <div className="rounded-xl border overflow-hidden text-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/40 border-b">
                          <th className="px-3 py-2 text-left font-bold uppercase tracking-wider text-muted-foreground">
                            Tipo
                          </th>
                          <th className="px-3 py-2 text-left font-bold uppercase tracking-wider text-muted-foreground">
                            Descripción
                          </th>
                          <th className="px-3 py-2 text-center font-bold uppercase tracking-wider text-muted-foreground">
                            Fecha
                          </th>
                          <th className="px-3 py-2 text-right font-bold uppercase tracking-wider text-muted-foreground">
                            Cant.
                          </th>
                          <th className="px-3 py-2 text-right font-bold uppercase tracking-wider text-muted-foreground">
                            P. Unit.
                          </th>
                          <th className="px-3 py-2 text-right font-bold uppercase tracking-wider text-muted-foreground">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {detalleItems.map((item, idx) => {
                          const subtotal =
                            item.subtotal ??
                            Number(item.cantidad || 1) *
                            Number(item.precio_unitario || 0);
                          return (
                            <tr key={idx} className="hover:bg-muted/10">
                              <td className="px-3 py-2 font-semibold">
                                {capTipo(item.tipo)}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground max-w-[120px] truncate">
                                {item.descripcion || "—"}
                              </td>
                              <td className="px-3 py-2 text-center text-muted-foreground">
                                {formatFecha(item.fecha)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.cantidad}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {formatLps(item.precio_unitario)}
                              </td>
                              <td className="px-3 py-2 text-right font-bold">
                                {formatLps(subtotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center border-t pt-3">
              <span className="text-muted-foreground font-semibold text-sm">
                Total General
              </span>
              <span className="text-xl font-black text-primary">
                {formatLps(detalle.total_general)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {canApprove &&
                (detalle.estado === "Pendiente" ||
                  detalle.estado === "Borrador") && (
                  <>
                    <Button
                      onClick={() => handleAprobar(detalle.id)}
                      className="rounded-2xl h-10 bg-emerald-600 hover:bg-emerald-700 text-white flex-1">
                      <CheckCircle size={16} className="mr-2" /> Aprobar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCancelTarget(detalle.id)}
                      className="rounded-2xl h-10 border-rose-300 text-rose-600 hover:bg-rose-50 flex-1">
                      <XCircle size={16} className="mr-2" /> Cancelar
                    </Button>
                  </>
                )}
              {canApprove && detalle.estado === "Rechazado" && (
                <Button
                  onClick={() => handleEnviarRevision(detalle.id)}
                  className="rounded-2xl h-10 bg-amber-500 hover:bg-amber-600 text-white">
                  <ArrowRight size={16} className="mr-2" /> Enviar a revisión
                </Button>
              )}
              {canEditRow(detalle) && (
                <Button
                  onClick={() => {
                    navigate(`/admin/viaticos/edit/${detalle.id}`);
                    setDetalle(null);
                  }}
                  className="rounded-2xl h-10 flex-1">
                  <Edit3 size={16} className="mr-2" /> Editar
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setDetalle(null)}
                className="rounded-2xl h-10 flex-1">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CANCELAR */}
      {cancelTarget !== null && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => !cancelLoading && setCancelTarget(null)}>
          <div
            className="bg-card rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-90 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 rounded-2xl shrink-0">
                <AlertTriangle size={22} className="text-rose-600" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">
                  Cancelar Viático
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Indica el motivo del rechazo. Se enviará por correo al
                  empleado.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Motivo de Rechazo *
              </label>
              <textarea
                rows={3}
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Ej: Documentación incompleta, fechas incorrectas..."
                disabled={cancelLoading}
                className="w-full rounded-xl border bg-muted/50 px-4 py-3 text-sm resize-none focus:ring-2 ring-rose-300/50 outline-none transition-all disabled:opacity-60"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleRechazarConfirm}
                disabled={cancelLoading || !motivoRechazo.trim()}
                className="flex-1 rounded-2xl h-10 bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-60">
                {cancelLoading ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <XCircle size={16} className="mr-2" />
                )}
                {cancelLoading ? "Cancelando..." : "Confirmar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCancelTarget(null);
                  setMotivoRechazo("");
                }}
                disabled={cancelLoading}
                className="flex-1 rounded-2xl h-10">
                Volver
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground font-semibold shrink-0">
        {label}
      </span>
      <span className="font-bold text-right">{value}</span>
    </div>
  );
}
