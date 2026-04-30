import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Wallet, Loader2, ArrowRight, Calendar } from "lucide-react";

import AuditTimeline from "@/components/ui/AuditTimeline";
import { getViatico } from "@/services/viaticos.service";

const STATUS_CLASSES = {
  borrador:  "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400",
  pendiente: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
  aprobado:  "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400",
  rechazado: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400",
  cancelado: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400",
  finalizado:"bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400",
  liquidado: "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400",
};

function estadoClass(estado) {
  return STATUS_CLASSES[(estado || "").toLowerCase()] || "bg-muted text-muted-foreground";
}

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

export default function ViaticoHistorial() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [viatico, setViatico] = useState(location.state?.viatico ?? null);
  const [loading, setLoading] = useState(!location.state?.viatico);

  useEffect(() => {
    if (viatico) return;
    let cancelled = false;
    getViatico(id)
      .then((data) => {
        if (cancelled) return;
        setViatico(data ?? null);
      })
      .catch(() => setViatico(null))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, viatico]);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/admin/viaticos")}
          className="mt-0.5 p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors text-muted-foreground hover:text-foreground shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <Wallet size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Historial del viático
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
      ) : viatico ? (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-muted dark:bg-slate-800 flex items-center justify-center">
              <Wallet size={22} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl font-black tracking-tight text-gray-900 dark:text-gray-100">
                  Viático #{viatico.id}
                </span>
                {viatico.estado && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${estadoClass(viatico.estado)}`}>
                    {viatico.estado}
                  </span>
                )}
              </div>
              {(viatico.fecha_salida || viatico.fecha_regreso) && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground/70 font-medium">
                  <Calendar size={11} className="text-primary" />
                  {formatFecha(viatico.fecha_salida)}
                  <ArrowRight size={10} className="opacity-40" />
                  {formatFecha(viatico.fecha_regreso)}
                </div>
              )}
              {viatico.total_general != null && (
                <p className="text-sm font-black text-primary mt-0.5">
                  {formatLps(viatico.total_general)}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 text-center text-muted-foreground text-sm">
          Viático no encontrado.
        </div>
      )}

      {/* ── Audit timeline ── */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6">
        <AuditTimeline entidad="viatico" entidadId={Number(id)} />
      </div>

    </div>
  );
}
