import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Clock, Car, Loader2, ArrowRight, Calendar } from "lucide-react";

import AuditTimeline from "@/components/ui/AuditTimeline";
import { getReservas } from "@/services/reservas.service";

const STATUS_CLASSES = {
  reservado:  "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
  "en uso":   "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400",
  finalizado: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400",
  cancelado:  "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400",
};

function estadoClass(estado) {
  return STATUS_CLASSES[(estado || "").toLowerCase()] || "bg-muted text-muted-foreground";
}

const formatFecha = (str) => {
  if (!str) return "S/F";
  const [y, m, d] = str.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
};

export default function ReservaHistorial() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [reserva, setReserva] = useState(location.state?.reserva ?? null);
  const [loading, setLoading] = useState(!location.state?.reserva);

  useEffect(() => {
    if (reserva) return;
    let cancelled = false;
    getReservas()
      .then((raw) => {
        if (cancelled) return;
        const list = Array.isArray(raw) ? raw : [];
        const found = list.find((r) => String(r.id) === String(id));
        setReserva(found ?? null);
      })
      .catch(() => setReserva(null))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, reserva]);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/admin/reservas-vehiculos")}
          className="mt-0.5 p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors text-muted-foreground hover:text-foreground shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <Clock size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Historial de la reserva
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Registro de cambios y eventos
            </p>
          </div>
        </div>
      </div>

      {/* ── Info card ── */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-10 text-muted-foreground">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Cargando...</span>
        </div>
      ) : reserva ? (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-muted dark:bg-slate-800 flex items-center justify-center">
              <Car size={22} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl font-black tracking-tight text-gray-900 dark:text-gray-100">
                  {reserva.vehiculo_placa || `Reserva #${reserva.id}`}
                </span>
                {reserva.estado && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${estadoClass(reserva.estado)}`}>
                    {reserva.estado}
                  </span>
                )}
              </div>
              {reserva.empleado_nombre && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {reserva.empleado_nombre}
                </p>
              )}
              {(reserva.fecha_inicio || reserva.fecha_fin) && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground/70 font-medium">
                  <Calendar size={11} className="text-primary" />
                  {formatFecha(reserva.fecha_inicio)}
                  <ArrowRight size={10} className="opacity-40" />
                  {formatFecha(reserva.fecha_fin)}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 text-center text-muted-foreground text-sm">
          Reserva no encontrada.
        </div>
      )}

      {/* ── Audit timeline ── */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6">
        <AuditTimeline entidad="reserva" entidadId={Number(id)} />
      </div>

    </div>
  );
}
