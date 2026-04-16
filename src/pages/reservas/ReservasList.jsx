import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Car,
  User,
  Calendar,
  Play,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit3,
  Search,
  Clock,
  ArrowRight,
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
} from "@/services/reservas.service";

import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import useIsMobile from "@/hooks/useIsMobile";
import { Button } from "@/components/ui/button";

export default function ReservasList() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [viewMode, setViewMode] = useState("table");

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
    const [year, month, day] = fechaStr.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
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

  const handleDelete = async (id) => {
    if (!canDelete) return showToast("No tienes permiso", "warning");
    if (!confirm("¿Eliminar esta reserva definitivamente?")) return;
    const res = await deleteReserva(id);
    if (res) {
      showToast("Reserva eliminada", "success");
      fetchReservas();
    } else {
      showToast("Error al eliminar", "danger");
    }
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

  if (!canView)
    return <div className="p-10 text-center opacity-50">Acceso denegado</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Clock className="text-primary" size={32} />
            CONTROL DE RESERVAS
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Monitoreo y asignación de vehículos para el personal.
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={() => navigate("/admin/reservas-vehiculos/new")}
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl px-6 h-12">
            <Plus size={20} className="mr-2" /> Nueva Reserva
          </Button>
        )}
      </div>

      {/* FILTROS */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por placa o empleado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-muted/50 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 ring-primary/20 transition-all outline-none"
          />
        </div>

        {/* VIEW MODE */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setViewMode("table")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              viewMode === "table" ? "bg-primary text-white" : "bg-muted"
            }`}>
            Tabla
          </button>

          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              viewMode === "calendar" ? "bg-primary text-white" : "bg-muted"
            }`}>
            Calendario
          </button>
        </div>
      </div>

      {/* LISTADO */}
      <div className="bg-card border rounded-3xl shadow-sm overflow-hidden">
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
            {/* 🔥 TU TABLA ORIGINAL (NO LA TOQUES) */}
            {loading ? (
              <div className="p-20 text-center">Cargando...</div>
            ) : filteredReservas.length === 0 ? (
              <div className="p-20 text-center">No hay reservas</div>
            ) : isMobile ? (
              /* MOBILE */
              <div className="divide-y divide-border">
                {filteredReservas.map((r) => (
                  <div key={r.id} className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-black text-lg">
                          <Car size={18} className="text-primary" />
                          {r.vehiculo_placa}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User size={14} />
                          {r.empleado_nombre || "ID: " + r.empleado_id}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${getEstadoStyle(r.estado)}`}>
                        {r.estado}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground bg-muted/40 p-2 rounded-lg">
                      <Calendar size={14} />
                      {formatFechaLocal(r.fecha_inicio)}
                      <ArrowRight size={12} />
                      {formatFechaLocal(r.fecha_fin)}
                    </div>

                    <div className="flex gap-2 pt-2 overflow-x-auto pb-1">
                      {r.estado === "Reservado" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleEstado(r.id, "iniciar")}
                            className="bg-blue-600 hover:bg-blue-700 text-[11px] h-8 px-4 rounded-lg">
                            <Play size={12} className="mr-1" /> Iniciar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEstado(r.id, "cancelar")}
                            className="text-rose-600 border-rose-200 text-[11px] h-8 rounded-lg">
                            Cancelar
                          </Button>
                        </>
                      )}
                      {r.estado === "En Uso" && (
                        <Button
                          size="sm"
                          onClick={() => handleEstado(r.id, "finalizar")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-[11px] h-8 px-4 rounded-lg">
                          <CheckCircle2 size={12} className="mr-1" /> Finalizar
                        </Button>
                      )}
                      {canUpdate && r.estado === "Reservado" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            navigate(`/admin/reservas-vehiculos/edit/${r.id}`)
                          }
                          className="text-muted-foreground h-8 rounded-lg">
                          <Edit3 size={14} />
                        </Button>
                      )}
                      {canDelete && r.estado === "Reservado" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(r.id)}
                          className="text-rose-500 hover:bg-rose-50 h-8 rounded-lg">
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* DESKTOP */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30 border-b">
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Vehículo
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Empleado Responsable
                      </th>
                      <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Periodo de Uso
                      </th>
                      <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Acciones Operativas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredReservas.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-muted/10 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                              <Car size={20} />
                            </div>
                            <span className="font-bold tracking-tight">
                              {r.vehiculo_placa || "S/P"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold">
                            {r.empleado_nombre || "Desconocido"}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                            ID: {r.empleado_id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2 text-[11px] font-bold">
                            <span className="bg-muted px-2 py-1 rounded border">
                              {formatFechaLocal(r.fecha_inicio)}
                            </span>
                            <ArrowRight size={12} className="opacity-30" />
                            <span className="bg-muted px-2 py-1 rounded border">
                              {formatFechaLocal(r.fecha_fin)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${getEstadoStyle(r.estado)}`}>
                            {r.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            {/* ACCIONES DINÁMICAS */}
                            {r.estado === "Reservado" && (
                              <>
                                <button
                                  onClick={() => handleEstado(r.id, "iniciar")}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                  title="Iniciar Viaje">
                                  <Play size={18} fill="currentColor" />
                                </button>
                                <button
                                  onClick={() => handleEstado(r.id, "cancelar")}
                                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                  title="Cancelar">
                                  <XCircle size={18} />
                                </button>
                              </>
                            )}
                            {r.estado === "En Uso" && (
                              <button
                                onClick={() => handleEstado(r.id, "finalizar")}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                title="Finalizar Viaje">
                                <CheckCircle2 size={18} />
                              </button>
                            )}

                            <div className="h-6 w-[1px] bg-border mx-1" />

                            {/* EDITAR / ELIMINAR */}
                            {canUpdate && r.estado === "Reservado" && (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/admin/reservas-vehiculos/edit/${r.id}`,
                                  )
                                }
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                <Edit3 size={18} />
                              </button>
                            )}
                            {canDelete && r.estado === "Reservado" && (
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="p-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                <Trash2 size={18} />
                              </button>
                            )}
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
    </div>
  );
}
