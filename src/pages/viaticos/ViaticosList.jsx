import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  History,
} from "lucide-react";

import {
  getViaticos,
  getViatico,
  deleteViatico,
  aprobarViatico,
  rechazarViatico,
  cancelarViatico,
  enviarRevision,
} from "@/services/viaticos.service";
import { obtenerVehiculos } from "@/services/VehiculosService";
import { getEmpleados } from "@/services/AuthServices";
import exportViaticos from "@/utils/exportViaticos";

import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import useIsMobile from "@/hooks/useIsMobile";
import useRowFocusHighlight from "@/hooks/useRowFocusHighlight";

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

  const [approveTarget, setApproveTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cancelViaticoTarget, setCancelViaticoTarget] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

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
  const canCancel = can("cancel_viatico");

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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setProcessingAction(true);
    const res = await deleteViatico(deleteTarget.id);
    setProcessingAction(false);
    if (res) {
      showToast("Viático eliminado", "success");
      setDeleteTarget(null);
      fetchViaticos(tipoActivo);
    } else {
      showToast("Error al eliminar", "danger");
    }
  };

  const confirmAprobar = async () => {
    if (!approveTarget) return;
    setProcessingAction(true);
    const res = await aprobarViatico(approveTarget.id);
    setProcessingAction(false);
    if (res) {
      showToast("Viático aprobado", "success");
      setApproveTarget(null);
      setDetalle(null);
      fetchViaticos(tipoActivo);
    } else {
      showToast("Error al aprobar", "danger");
    }
  };

  const confirmCancelarViatico = async () => {
    if (!cancelViaticoTarget) return;
    setProcessingAction(true);
    try {
      await cancelarViatico(cancelViaticoTarget.id);
      showToast("Viático cancelado", "success");
      setCancelViaticoTarget(null);
      setDetalle(null);
      fetchViaticos(tipoActivo);
    } catch (err) {
      showToast(err.message || "Error al cancelar el viático", "danger");
    } finally {
      setProcessingAction(false);
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
    canUpdate &&
    v.estado !== "Cancelado" &&
    (isAdmin || (v.estado !== "Aprobado" && v.estado !== "Liquidado"));
  const canDeleteRow = (v) =>
    canDelete &&
    v.estado !== "Cancelado" &&
    (isAdmin || (v.estado !== "Aprobado" && v.estado !== "Liquidado"));
  const canCancelRow = (v) =>
    canCancel &&
    v.estado !== "Cancelado" &&
    v.estado !== "Liquidado";

  // Búsqueda local por nombre de empleado o placa — no filtra por estado
  const filtered = viaticos.filter((v) => {
    const term = searchTerm.toLowerCase();
    return (
      (empMap[v.empleado_id] || "").toLowerCase().includes(term) ||
      (vehMap[v.vehiculo_id] || "").toLowerCase().includes(term)
    );
  });

  const [searchParams, setSearchParams] = useSearchParams();

  const { highlightId, focusedRef, focusByToken } = useRowFocusHighlight({
    rows: filtered,
    matchRow: (v, token) => String(v.id) === String(token),
    getRowId: (v) => v.id,
    highlightMs: 4000,
  });

  useEffect(() => {
    const token = searchParams.get("focus");
    if (!token) return;
    const next = new URLSearchParams(searchParams);
    next.delete("focus");
    setSearchParams(next, { replace: true });
    setSearchTerm("");
    // "todos" para no ocultar el viático si está fuera del tab "Activos"
    setTipoActivo("todos");
    focusByToken(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ─── Menú de acciones ─────────────────────────────────────────────────────
  const AccionesMenu = ({ v }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-muted/80 rounded-xl transition-colors">
          <MoreVertical size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 rounded-2xl shadow-xl border-border/60">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
          Acciones
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => handleVerDetalle(v)}
          className="rounded-xl cursor-pointer gap-2 text-sm">
          <Eye size={13} /> Ver Detalle
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate(`/admin/viaticos/historial/${v.id}`, { state: { viatico: v } })}
          className="rounded-xl cursor-pointer gap-2 text-sm">
          <History size={13} /> Historial
        </DropdownMenuItem>

        {canExport && (
          <DropdownMenuItem
            onClick={() => handleExport(v.id)}
            className="rounded-xl cursor-pointer gap-2 text-sm">
            {exportingId === v.id ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <FileText size={13} />
            )}
            Exportar Excel
          </DropdownMenuItem>
        )}

        {canRead && (v.estado === "Aprobado" || v.estado === "Liquidado") && (
          <DropdownMenuItem
            onClick={() => navigate(`/admin/viaticos/${v.id}/liquidar`)}
            className="rounded-xl cursor-pointer gap-2 text-sm">
            <Receipt size={13} /> Ver Liquidación
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {canApprove &&
          (v.estado === "Borrador" || v.estado === "Pendiente") && (
            <>
              <DropdownMenuItem
                onClick={() => setApproveTarget(v)}
                className="rounded-xl cursor-pointer gap-2 text-sm text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-500/10">
                <CheckCircle size={13} /> Aprobar Viático
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCancelTarget(v.id)}
                className="rounded-xl cursor-pointer gap-2 text-sm text-amber-600 focus:text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-500/10">
                <XCircle size={13} /> Rechazar Viático
              </DropdownMenuItem>
            </>
          )}

        {canEnviarRevision && v.estado === "Rechazado" && (
          <DropdownMenuItem
            onClick={() => handleEnviarRevision(v.id)}
            className="rounded-xl cursor-pointer gap-2 text-sm">
            <ArrowRight size={13} /> Enviar a Revisión
          </DropdownMenuItem>
        )}

        {canCancelRow(v) && (
          <DropdownMenuItem
            onClick={() => setCancelViaticoTarget(v)}
            className="rounded-xl cursor-pointer gap-2 text-sm text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10">
            <XCircle size={13} /> Cancelar Viático
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {canEditRow(v) && (
          <DropdownMenuItem
            onClick={() => navigate(`/admin/viaticos/edit/${v.id}`)}
            className="rounded-xl cursor-pointer gap-2 text-sm">
            <Edit3 size={13} /> Editar Solicitud
          </DropdownMenuItem>
        )}

        {canDeleteRow(v) && (
          <DropdownMenuItem
            onClick={() => setDeleteTarget(v)}
            className="rounded-xl cursor-pointer gap-2 text-sm text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10">
            <Trash2 size={13} /> Eliminar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (!canView)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 opacity-40">
          <Wallet size={40} className="mx-auto" />
          <p className="font-semibold text-sm">Acceso denegado</p>
        </div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <Wallet size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Gestión de Viáticos
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Gastos de viaje y liquidaciones del personal
            </p>
          </div>
        </div>
        {canCreate && (
          <Button
            onClick={() => navigate("/admin/viaticos/new")}
            className="rounded-2xl px-5 h-10 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 gap-2 shrink-0">
            <Plus size={17} strokeWidth={2.5} />
            <span className="hidden sm:inline">Nueva Solicitud</span>
          </Button>
        )}
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Búsqueda */}
        <div className="relative w-full max-w-xs group">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar por empleado o vehículo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/50 shadow-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 dark:bg-slate-800/50 border border-border/60 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                tipoActivo === tab.value
                  ? "bg-card dark:bg-slate-900 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contador */}
        {!loading && (
          <span className="text-xs text-muted-foreground/70 font-medium whitespace-nowrap ml-auto">
            <span className="font-bold text-foreground">{filtered.length}</span>
            {` registro${filtered.length !== 1 ? "s" : ""}`}
          </span>
        )}
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={22} />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Cargando viáticos...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="w-16 h-16 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
              <FileText size={28} className="text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm">
                {searchTerm ? "Sin resultados" : "Sin viáticos registrados"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchTerm
                  ? `No hay coincidencias para "${searchTerm}"`
                  : "Crea la primera solicitud usando el botón de arriba"}
              </p>
            </div>
          </div>
        ) : isMobile ? (
          /* ── MOBILE ── */
          <div className="divide-y divide-border/50">
            {filtered.map((v) => (
              <div
                key={v.id}
                ref={highlightId === v.id ? focusedRef : null}
                className={`p-4 transition-colors ${
                  highlightId === v.id
                    ? "bg-amber-50 dark:bg-amber-900/20"
                    : "hover:bg-muted/20 dark:hover:bg-slate-800/30"
                }`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-muted/60 dark:bg-slate-800 flex items-center justify-center">
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

                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-muted/40 dark:bg-slate-800/50 rounded-xl px-3 py-2 mb-3">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Calendar size={11} />
                    <span className="bg-background dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-border/50">
                      {formatFecha(v.fecha_salida)}
                    </span>
                    <ArrowRight size={10} className="opacity-30" />
                    <span className="bg-background dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-border/50">
                      {formatFecha(v.fecha_regreso)}
                    </span>
                  </div>
                  <span className="font-black text-sm text-primary self-end md:self-auto">
                    {formatLps(v.total_general)}
                  </span>
                </div>

                <div className="flex justify-end">
                  <AccionesMenu v={v} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── DESKTOP ── */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 dark:bg-slate-800/30">
                  {[
                    ["Empleado", "text-left"],
                    ["Vehículo", "text-left"],
                    ["Período", "text-center"],
                    ["Total General", "text-right"],
                    ["Estado", "text-center"],
                    ["Acciones", "text-right"],
                  ].map(([label, align]) => (
                    <th key={label} className={`px-6 py-3.5 ${align}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                        {label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    ref={highlightId === v.id ? focusedRef : null}
                    className={`border-b border-border/30 last:border-0 transition-colors group ${
                      highlightId === v.id
                        ? "bg-amber-50 dark:bg-amber-900/20"
                        : "hover:bg-muted/20 dark:hover:bg-slate-800/20"
                    }`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 shrink-0 rounded-xl bg-muted/60 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:ring-1 ring-primary/20 flex items-center justify-center transition-all duration-200">
                          <User
                            size={16}
                            className="text-muted-foreground group-hover:text-primary transition-colors"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-sm">
                            {empMap[v.empleado_id] || "—"}
                          </div>
                          <div className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                            ID: {v.empleado_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Car size={14} className="text-muted-foreground/60" />
                        <span className="font-semibold text-sm">
                          {vehMap[v.vehiculo_id] || "S/P"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 text-[11px] font-medium">
                        <span className="bg-muted/60 dark:bg-slate-800 px-2 py-1 rounded-lg border border-border/50">
                          {formatFecha(v.fecha_salida)}
                        </span>
                        <ArrowRight size={12} className="opacity-30" />
                        <span className="bg-muted/60 dark:bg-slate-800 px-2 py-1 rounded-lg border border-border/50">
                          {formatFecha(v.fecha_regreso)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-sm text-primary">
                        {formatLps(v.total_general)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full border ${getEstadoBadge(v.estado)}`}>
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

      {/* ── MODAL DETALLE ── */}
      {detalle && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => setDetalle(null)}>
          <div
            className="bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 w-full max-w-xl p-6 space-y-4 animate-in slide-in-from-bottom md:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/15">
                  <ReceiptText size={16} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight leading-none">
                    Viático #{detalle.id}
                  </h2>
                  <span
                    className={`inline-block mt-1 px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full border ${getEstadoBadge(detalle.estado)}`}>
                    {detalle.estado || "Borrador"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDetalle(null)}
                className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="h-px bg-border/50" />

            <div className="space-y-2.5 text-sm">
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

            <div className="border-t border-border/50 pt-4 space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
                <ReceiptText size={13} /> Detalle de Gastos
              </h3>

              {loadingItems ? (
                <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm font-medium">Cargando ítems...</span>
                </div>
              ) : detalleItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin ítems registrados
                </p>
              ) : (
                <div className="rounded-2xl border border-border/60 overflow-hidden text-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/30 dark:bg-slate-800/40 border-b border-border/60">
                          {[
                            "Tipo",
                            "Descripción",
                            "Fecha",
                            "Cant.",
                            "P.Unit.",
                            "Subtotal",
                          ].map((h, i) => (
                            <th
                              key={h}
                              className={`px-3 py-2 font-black uppercase tracking-wider text-muted-foreground/70 ${i >= 3 ? "text-right" : i === 2 ? "text-center" : "text-left"}`}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detalleItems.map((item, idx) => {
                          const subtotal =
                            item.subtotal ??
                            Number(item.cantidad || 1) *
                              Number(item.precio_unitario || 0);
                          return (
                            <tr
                              key={idx}
                              className="border-b border-border/30 last:border-0 hover:bg-muted/20 dark:hover:bg-slate-800/20">
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

            <div className="flex justify-between items-center border-t border-border/50 pt-3">
              <span className="text-muted-foreground font-semibold text-sm">
                Total General
              </span>
              <span className="text-xl font-black text-primary">
                {formatLps(detalle.total_general)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {canApprove &&
                (detalle.estado === "Pendiente" ||
                  detalle.estado === "Borrador") && (
                  <>
                    <Button
                      onClick={() => setApproveTarget(detalle)}
                      className="rounded-2xl h-10 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 gap-2 font-bold">
                      <CheckCircle size={15} /> Aprobar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCancelTarget(detalle.id)}
                      className="rounded-2xl h-10 border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 flex-1 gap-2 font-bold">
                      <XCircle size={15} /> Rechazar
                    </Button>
                  </>
                )}
              {canApprove && detalle.estado === "Rechazado" && (
                <Button
                  onClick={() => handleEnviarRevision(detalle.id)}
                  className="rounded-2xl h-10 bg-amber-500 hover:bg-amber-600 text-white gap-2 font-bold">
                  <ArrowRight size={15} /> Enviar a revisión
                </Button>
              )}
              {canEditRow(detalle) && (
                <Button
                  onClick={() => {
                    navigate(`/admin/viaticos/edit/${detalle.id}`);
                    setDetalle(null);
                  }}
                  className="rounded-2xl h-10 flex-1 gap-2 font-bold">
                  <Edit3 size={15} /> Editar
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setDetalle(null)}
                className="rounded-2xl h-10 flex-1 font-bold">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: APROBAR VIÁTICO ── */}
      {approveTarget && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !processingAction && setApproveTarget(null)}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-2xl ring-1 ring-emerald-500/20 shrink-0">
                <CheckCircle size={20} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">
                  Aprobar Viático
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  ¿Aprobar el viático de{" "}
                  <span className="font-bold text-foreground">
                    {empMap[approveTarget.empleado_id] ||
                      `ID ${approveTarget.empleado_id}`}
                  </span>
                  ? El empleado será notificado y podrá proceder con su
                  liquidación.
                </p>
              </div>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex gap-2.5">
              <Button
                onClick={confirmAprobar}
                disabled={processingAction}
                className="flex-1 rounded-2xl h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md gap-2 disabled:opacity-60">
                {processingAction ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle size={15} />
                )}
                {processingAction ? "Aprobando..." : "Sí, aprobar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setApproveTarget(null)}
                disabled={processingAction}
                className="flex-1 rounded-2xl h-10 font-bold">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RECHAZAR VIÁTICO ── */}
      {cancelTarget !== null && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !cancelLoading && setCancelTarget(null)}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 rounded-2xl ring-1 ring-amber-500/20 shrink-0">
                <XCircle size={20} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">
                  Rechazar Viático
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Indica el motivo del rechazo. Se notificará al empleado por
                  correo electrónico.
                </p>
              </div>
            </div>
            <div className="h-px bg-border/50" />
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Motivo de Rechazo *
              </label>
              <textarea
                rows={3}
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Ej: Documentación incompleta, fechas incorrectas..."
                disabled={cancelLoading}
                className="w-full rounded-xl border px-4 py-2.5 text-sm resize-none outline-none transition-all bg-background dark:bg-slate-900/60 border-border focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 placeholder:text-muted-foreground/50 disabled:opacity-60"
              />
            </div>
            <div className="flex gap-2.5">
              <Button
                onClick={handleRechazarConfirm}
                disabled={cancelLoading || !motivoRechazo.trim()}
                className="flex-1 rounded-2xl h-10 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md gap-2 disabled:opacity-60">
                {cancelLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <XCircle size={15} />
                )}
                {cancelLoading ? "Rechazando..." : "Confirmar rechazo"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCancelTarget(null);
                  setMotivoRechazo("");
                }}
                disabled={cancelLoading}
                className="flex-1 rounded-2xl h-10 font-bold">
                Volver
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CANCELAR VIÁTICO ── */}
      {cancelViaticoTarget && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !processingAction && setCancelViaticoTarget(null)}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/10 dark:bg-rose-500/15 rounded-2xl ring-1 ring-rose-500/20 shrink-0">
                <XCircle size={20} className="text-rose-500" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">
                  Cancelar Viático
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  ¿Cancelar el viático de{" "}
                  <span className="font-bold text-foreground">
                    {empMap[cancelViaticoTarget.empleado_id] ||
                      `ID ${cancelViaticoTarget.empleado_id}`}
                  </span>
                  ? Esta acción cambiará el estado a <span className="font-bold text-rose-600">Cancelado</span> y no podrá editarse.
                </p>
              </div>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex gap-2.5">
              <Button
                onClick={confirmCancelarViatico}
                disabled={processingAction}
                className="flex-1 rounded-2xl h-10 bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md gap-2 disabled:opacity-60">
                {processingAction ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <XCircle size={15} />
                )}
                {processingAction ? "Cancelando..." : "Sí, cancelar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setCancelViaticoTarget(null)}
                disabled={processingAction}
                className="flex-1 rounded-2xl h-10 font-bold">
                Volver
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ELIMINAR VIÁTICO ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !processingAction && setDeleteTarget(null)}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/10 dark:bg-rose-500/15 rounded-2xl ring-1 ring-rose-500/20 shrink-0">
                <AlertTriangle size={20} className="text-rose-500" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">
                  Eliminar Viático
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  ¿Eliminar definitivamente el viático de{" "}
                  <span className="font-bold text-foreground">
                    {empMap[deleteTarget.empleado_id] ||
                      `ID ${deleteTarget.empleado_id}`}
                  </span>
                  ? Este registro no podrá recuperarse.
                </p>
              </div>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex gap-2.5">
              <Button
                onClick={confirmDelete}
                disabled={processingAction}
                className="flex-1 rounded-2xl h-10 bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md gap-2 disabled:opacity-60">
                {processingAction ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                {processingAction ? "Eliminando..." : "Sí, eliminar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={processingAction}
                className="flex-1 rounded-2xl h-10 font-bold">
                Cancelar
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
