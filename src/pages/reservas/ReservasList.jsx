import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Car,
  Calendar,
  Play,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit3,
  Search,
  Clock,
  ArrowRight,
  MoreVertical,
  AlertTriangle,
  Loader2,
  History,
  Wrench,
  CalendarPlus,
} from "lucide-react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import {
  getReservas,
  updateReserva,
  deleteReserva,
  iniciarReserva,
  finalizarReserva,
  cancelarReserva,
  extenderReserva,
} from "@/services/reservas.service";

import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import useIsMobile from "@/hooks/useIsMobile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ReservasList() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [viewMode, setViewMode] = useState("table");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [extenderTarget, setExtenderTarget] = useState(null);
  const [nuevaFechaFin, setNuevaFechaFin] = useState("");
  const [processing, setProcessing] = useState(false);

  const { showToast } = useToast();
  const { userData, hasPermiso } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const can = useCallback(
    (p) => isAdmin || hasPermiso(p),
    [isAdmin, hasPermiso],
  );

  const canView = can("read_reserva");
  const canCreate = can("create_reserva");
  const canDelete = can("delete_reserva");
  const canUpdate = can("update_reserva");
  const canExtender = can("extender_reserva");

  const fetchReservas = async () => {
    if (!canView) return setLoading(false);
    setLoading(true);
    const data = await getReservas();
    if (!data) showToast("Error al cargar reservas", "danger");
    setReservas(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReservas();
  }, [canView]);

  const formatFechaLocal = (fechaStr) => {
    if (!fechaStr) return "S/F";
    const [fecha, hora] = fechaStr.split("T");
    const [year, month, day] = fecha.split("-");
    const hhmm = hora?.slice(0, 5);
    return hhmm ? `${day}/${month}/${year} ${hhmm}` : `${day}/${month}/${year}`;
  };

  const formatFechaISO = (date) => {
    if (!date) return null;
    // Si ya es un objeto Date, lo convertimos; si es string, creamos el Date primero
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  const formatFechaParaDB = (date) => {
    if (!date) return null;
    const d = new Date(date);
    // Restamos 1 día para compensar el ajuste visual del calendario
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  };

  const handleEstado = async (id, action) => {
    if (!canUpdate) return showToast("No tienes permiso", "warning");

    let res;
    if (action === "iniciar") res = await iniciarReserva(id);
    if (action === "finalizar") res = await finalizarReserva(id);
    if (action === "cancelar") res = await cancelarReserva(id);

    if (res) {
      showToast(
        `Reserva ${action === "iniciar" ? "iniciada" : action === "finalizar" ? "finalizada" : "cancelada"}`,
        "success",
      );
      fetchReservas();
    } else {
      showToast("Error al actualizar estado", "danger");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setProcessing(true);
    const res = await deleteReserva(deleteTarget.id);
    setProcessing(false);
    if (res) {
      showToast("Reserva eliminada", "success");
      setDeleteTarget(null);
      fetchReservas();
    } else {
      showToast("Error al eliminar", "danger");
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setProcessing(true);
    const res = await cancelarReserva(cancelTarget.id);
    setProcessing(false);
    if (res) {
      showToast("Reserva cancelada", "success");
      setCancelTarget(null);
      fetchReservas();
    } else {
      showToast("Error al cancelar reserva", "danger");
    }
  };

  const confirmExtender = async () => {
    if (!extenderTarget || !nuevaFechaFin) return;
    setProcessing(true);
    try {
      await extenderReserva(extenderTarget.id, { nueva_fecha_fin: nuevaFechaFin });
      showToast("Reserva extendida correctamente", "success");
      setExtenderTarget(null);
      setNuevaFechaFin("");
      fetchReservas();
    } catch (err) {
      showToast(err.message || "Error al extender reserva", "danger");
    } finally {
      setProcessing(false);
    }
  };

  const getMinExtension = (fechaFin) => {
    if (!fechaFin) return "";
    // Un minuto después del fin actual como mínimo seleccionable
    const d = new Date(fechaFin);
    d.setMinutes(d.getMinutes() + 1);
    // formato YYYY-MM-DDTHH:MM para datetime-local
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleEventDrop = async (info) => {
    const estado = info.event.extendedProps.estado;

    if (estado !== "Reservado") {
      showToast("No se puede modificar esta reserva", "warning");
      info.revert();
      return;
    }

    const id = info.event.id;

    const fecha_inicio = formatFechaISO(info.event.start);
    const fecha_fin = info.event.end
      ? formatFechaParaDB(info.event.end)
      : fecha_inicio;

    try {
      const res = await updateReserva(id, {
        fecha_inicio,
        fecha_fin,
      });

      if (res) {
        showToast("Reserva actualizada", "success");
        fetchReservas();
      } else {
        throw new Error();
      }
    } catch (err) {
      showToast("Error al mover reserva", "danger");
      info.revert();
    }
  };

  const handleSelect = (info) => {
    const inicio = info.startStr;
    const fechaFin = new Date(info.endStr);
    fechaFin.setDate(fechaFin.getDate() - 1);
    const fin = fechaFin.toISOString().split("T")[0];

    navigate(`/admin/reservas-vehiculos/new?inicio=${inicio}&fin=${fin}`);
  };

  const handleEventResize = async (info) => {
    const estado = info.event.extendedProps.estado;
    if (["En Uso", "Finalizado", "Cancelado"].includes(estado)) {
      showToast(
        "No se puede modificar una reserva en curso o finalizada",
        "warning",
      );
      info.revert();
      return;
    }

    const id = info.event.id;

    const fecha_inicio = formatFechaISO(info.event.start);
    const fecha_fin = info.event.end
      ? formatFechaParaDB(info.event.end)
      : fecha_inicio;

    try {
      const res = await updateReserva(id, {
        fecha_inicio,
        fecha_fin,
      });

      if (res) {
        showToast("Duración actualizada", "success");
        fetchReservas();
      } else {
        throw new Error();
      }
    } catch (err) {
      showToast("Error al cambiar duración", "danger");
      info.revert();
    }
  };

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case "Reservado":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "En Uso":
        return "bg-blue-100 text-blue-700 border-blue-200 shadow-sm shadow-blue-100";
      case "Finalizado":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Cancelado":
        return "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return "bg-muted text-muted-foreground border-transparent";
    }
  };

  const filteredReservas = reservas.filter(
    (r) =>
      (r.vehiculo_placa || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (r.empleado_nombre || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const getEventColors = (estado) => {
    switch (estado) {
      case "Reservado":
        return { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" };
      case "En Uso":
        return { bg: "#dbeafe", text: "#1e40af", border: "#3b82f6" };
      case "Finalizado":
        return { bg: "#dcfce7", text: "#166534", border: "#10b981" };
      case "Cancelado":
        return { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" };
      default:
        return { bg: "#f1f5f9", text: "#475569", border: "#64748b" };
    }
  };

  const eventos = filteredReservas.map((r) => {
    const colors = getEventColors(r.estado);

    const fechaFinAjustada = new Date(r.fecha_fin);
    fechaFinAjustada.setDate(fechaFinAjustada.getDate() + 1);
    return {
      id: r.id.toString(),
      title: r.vehiculo_placa,
      start: formatFechaISO(r.fecha_inicio),
      end: formatFechaISO(fechaFinAjustada),
      backgroundColor: colors.bg,
      textColor: colors.text,
      borderColor: colors.border,
      extendedProps: {
        estado: r.estado,
        empleado: r.empleado_nombre,
      },
      editable: !["En Uso", "Finalizado", "Cancelado"].includes(r.estado),
    };
  });

  const renderEventContent = (eventInfo) => {
    return (
      <div className="flex flex-col px-1 py-0.5 overflow-hidden">
        <div className="flex items-center gap-1">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: eventInfo.borderColor }}
          />
          <span className="truncate uppercase font-black text-[9px]">
            {eventInfo.event.title}
          </span>
        </div>
        <span className="text-[8px] opacity-80 truncate font-medium">
          {eventInfo.event.extendedProps.empleado}
        </span>
      </div>
    );
  };

  const AccionesMenu = ({ r }) => (
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
        className="w-48 rounded-2xl shadow-xl border-border/60">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
          Acciones
        </DropdownMenuLabel>

        {r.estado === "Reservado" && (
          <DropdownMenuItem
            onClick={() => handleEstado(r.id, "iniciar")}
            className="rounded-xl cursor-pointer gap-2 text-sm text-blue-600 focus:text-blue-600 focus:bg-blue-50 dark:focus:bg-blue-500/10">
            <Play size={13} fill="currentColor" /> Iniciar viaje
          </DropdownMenuItem>
        )}

        {r.estado === "En Uso" && (
          <DropdownMenuItem
            onClick={() => handleEstado(r.id, "finalizar")}
            className="rounded-xl cursor-pointer gap-2 text-sm text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-500/10">
            <CheckCircle2 size={13} /> Finalizar viaje
          </DropdownMenuItem>
        )}

        {r.estado === "En Uso" && canExtender && (
          <DropdownMenuItem
            onClick={() => {
              setExtenderTarget(r);
              // Inicializa con el día siguiente al fin actual, hora 08:00
              const d = new Date(r.fecha_fin);
              d.setDate(d.getDate() + 1);
              d.setHours(8, 0, 0, 0);
              const pad = (n) => String(n).padStart(2, "0");
              setNuevaFechaFin(
                `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T08:00`
              );
            }}
            className="rounded-xl cursor-pointer gap-2 text-sm text-violet-600 focus:text-violet-600 focus:bg-violet-50 dark:focus:bg-violet-500/10">
            <CalendarPlus size={13} /> Extender reserva
          </DropdownMenuItem>
        )}

        {canUpdate && r.estado === "Reservado" && (
          <DropdownMenuItem
            onClick={() => navigate(`/admin/reservas-vehiculos/edit/${r.id}`)}
            className="rounded-xl cursor-pointer gap-2 text-sm">
            <Edit3 size={13} /> Editar
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={() => navigate(`/admin/reservas-vehiculos/historial/${r.id}`, { state: { reserva: r } })}
          className="rounded-xl cursor-pointer gap-2 text-sm">
          <History size={13} /> Historial
        </DropdownMenuItem>

        {r.estado === "Reservado" && <DropdownMenuSeparator />}

        {r.estado === "Reservado" && (
          <DropdownMenuItem
            onClick={() => setCancelTarget(r)}
            className="rounded-xl cursor-pointer gap-2 text-sm text-amber-600 focus:text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-500/10">
            <XCircle size={13} /> Cancelar reserva
          </DropdownMenuItem>
        )}

        {canDelete && r.estado === "Reservado" && (
          <DropdownMenuItem
            onClick={() => setDeleteTarget(r)}
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
          <Clock size={40} className="mx-auto" />
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
            <Clock size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Reservas de Vehículos
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Monitoreo y asignación de vehículos para el personal
            </p>
          </div>
        </div>

        {canCreate && (
          <Button
            onClick={() => navigate("/admin/reservas-vehiculos/new")}
            className="rounded-2xl px-5 h-10 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 gap-2 shrink-0">
            <Plus size={17} strokeWidth={2.5} />
            <span className="hidden sm:inline">Nueva Reserva</span>
          </Button>
        )}
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full max-w-xs group">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar por placa o empleado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/50 shadow-sm"
          />
        </div>

        <div className="flex gap-1 bg-muted/50 dark:bg-slate-800/50 border border-border/60 rounded-xl p-1 ml-auto">
          <button
            onClick={() => setViewMode("table")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              viewMode === "table"
                ? "bg-card dark:bg-slate-900 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            Tabla
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              viewMode === "calendar"
                ? "bg-card dark:bg-slate-900 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            Calendario
          </button>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        {viewMode === "calendar" ? (
          <div className="p-6 calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="es"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridWeek",
              }}
              buttonText={{
                today: "Hoy",
                month: "Mes",
                week: "Semana",
              }}
              events={eventos}
              eventContent={renderEventContent}
              editable={true}
              eventResize={handleEventResize}
              eventDrop={handleEventDrop}
              selectable={true}
              select={handleSelect}
              eventClick={(info) => {
                const estado = info.event.extendedProps.estado;
                if (estado !== "Reservado") {
                  showToast(
                    "Solo se pueden editar reservas en estado 'Reservado'",
                    "warning",
                  );
                  return;
                }
                navigate(`/admin/reservas-vehiculos/edit/${info.event.id}`);
              }}
              height="auto"
            />
          </div>
        ) : (
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Clock className="animate-pulse text-primary" size={22} />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Cargando reservas...
                </p>
              </div>
            ) : filteredReservas.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24">
                <div className="w-16 h-16 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
                  <Clock size={28} className="text-muted-foreground/40" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm">
                    {searchTerm ? "Sin resultados" : "Sin reservas registradas"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchTerm
                      ? `No hay coincidencias para "${searchTerm}"`
                      : "Crea la primera reserva usando el botón de arriba"}
                  </p>
                </div>
              </div>
            ) : isMobile ? (
              /* ── MOBILE ── */
              <div className="divide-y divide-border/50">
                {filteredReservas.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 hover:bg-muted/20 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-muted/60 dark:bg-slate-800 flex items-center justify-center">
                          <Car size={18} className="text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-bold text-sm">
                            {r.vehiculo_placa}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {r.empleado_nombre || "ID: " + r.empleado_id}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full border ${getEstadoStyle(r.estado)}`}>
                          {r.estado}
                        </span>
                        {!!r.es_mantenimiento && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border bg-orange-100 text-orange-700 border-orange-200">
                            <Wrench size={9} /> Mantenimiento
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground bg-muted/40 dark:bg-slate-800/50 px-3 py-2 rounded-xl mb-3">
                      <Calendar size={12} />
                      {formatFechaLocal(r.fecha_inicio)}
                      <ArrowRight size={10} className="opacity-40" />
                      {formatFechaLocal(r.fecha_fin)}
                    </div>

                    <div className="flex justify-end">
                      <AccionesMenu r={r} />
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
                        ["Vehículo", "text-left"],
                        ["Empleado Responsable", "text-left"],
                        ["Periodo de Uso", "text-center"],
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
                    {filteredReservas.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-border/30 last:border-0 hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 shrink-0 rounded-xl bg-muted/60 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:ring-1 ring-primary/20 flex items-center justify-center transition-all duration-200">
                              <Car
                                size={16}
                                className="text-muted-foreground group-hover:text-primary transition-colors"
                              />
                            </div>
                            <span className="font-bold text-sm">
                              {r.vehiculo_placa || "S/P"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-sm">
                            {r.empleado_nombre || "Desconocido"}
                          </div>
                          <div className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                            ID: {r.empleado_id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2 text-[11px] font-medium">
                            <span className="bg-muted/60 dark:bg-slate-800 px-2 py-1 rounded-lg border border-border/50">
                              {formatFechaLocal(r.fecha_inicio)}
                            </span>
                            <ArrowRight size={12} className="opacity-30" />
                            <span className="bg-muted/60 dark:bg-slate-800 px-2 py-1 rounded-lg border border-border/50">
                              {formatFechaLocal(r.fecha_fin)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full border ${getEstadoStyle(r.estado)}`}>
                              {r.estado}
                            </span>
                            {!!r.es_mantenimiento && (
                              <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border bg-orange-100 text-orange-700 border-orange-200">
                                <Wrench size={9} /> Mantenimiento
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <AccionesMenu r={r} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
      {/* ── MODAL: CANCELAR RESERVA ── */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !processing && setCancelTarget(null)}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 rounded-2xl ring-1 ring-amber-500/20 shrink-0">
                <XCircle size={20} className="text-amber-500" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">
                  Cancelar Reserva
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  ¿Cancelar la reserva del vehículo{" "}
                  <span className="font-bold text-foreground">
                    "{cancelTarget.vehiculo_placa}"
                  </span>{" "}
                  asignado a{" "}
                  <span className="font-bold text-foreground">
                    {cancelTarget.empleado_nombre || `ID ${cancelTarget.empleado_id}`}
                  </span>
                  ? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex gap-2.5">
              <Button
                onClick={confirmCancel}
                disabled={processing}
                className="flex-1 rounded-2xl h-10 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md gap-2 disabled:opacity-60">
                {processing ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <XCircle size={15} />
                )}
                {processing ? "Cancelando..." : "Sí, cancelar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setCancelTarget(null)}
                disabled={processing}
                className="flex-1 rounded-2xl h-10 font-bold">
                Volver
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ELIMINAR RESERVA ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !processing && setDeleteTarget(null)}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/10 dark:bg-rose-500/15 rounded-2xl ring-1 ring-rose-500/20 shrink-0">
                <AlertTriangle size={20} className="text-rose-500" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">
                  Eliminar Reserva
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  ¿Eliminar definitivamente la reserva del vehículo{" "}
                  <span className="font-bold text-foreground">
                    "{deleteTarget.vehiculo_placa}"
                  </span>
                  ? Este registro no podrá recuperarse.
                </p>
              </div>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex gap-2.5">
              <Button
                onClick={confirmDelete}
                disabled={processing}
                className="flex-1 rounded-2xl h-10 bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md gap-2 disabled:opacity-60">
                {processing ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                {processing ? "Eliminando..." : "Sí, eliminar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={processing}
                className="flex-1 rounded-2xl h-10 font-bold">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EXTENDER RESERVA ── */}
      {extenderTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !processing && (setExtenderTarget(null), setNuevaFechaFin(""))}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-violet-500/10 dark:bg-violet-500/15 rounded-2xl ring-1 ring-violet-500/20 shrink-0">
                <CalendarPlus size={20} className="text-violet-500" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">Extender Reserva</h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Vehículo{" "}
                  <span className="font-bold text-foreground">
                    "{extenderTarget.vehiculo_placa}"
                  </span>{" "}
                  — asignado a{" "}
                  <span className="font-bold text-foreground">
                    {extenderTarget.empleado_nombre || `ID ${extenderTarget.empleado_id}`}
                  </span>
                </p>
              </div>
            </div>

            <div className="h-px bg-border/50" />

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Nueva fecha y hora de regreso
              </label>
              <input
                type="datetime-local"
                value={nuevaFechaFin}
                min={getMinExtension(extenderTarget.fecha_fin)}
                onChange={(e) => setNuevaFechaFin(e.target.value)}
                className="w-full bg-muted/40 dark:bg-slate-800/60 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 transition-all"
              />
              <p className="text-[11px] text-muted-foreground">
                Fecha fin actual:{" "}
                <span className="font-semibold">{formatFechaLocal(extenderTarget.fecha_fin)}</span>
              </p>
            </div>

            <div className="h-px bg-border/50" />

            <div className="flex gap-2.5">
              <Button
                onClick={confirmExtender}
                disabled={processing || !nuevaFechaFin}
                className="flex-1 rounded-2xl h-10 bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-md gap-2 disabled:opacity-60">
                {processing ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CalendarPlus size={15} />
                )}
                {processing ? "Extendiendo..." : "Extender"}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setExtenderTarget(null); setNuevaFechaFin(""); }}
                disabled={processing}
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
