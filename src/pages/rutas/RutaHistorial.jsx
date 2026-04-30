import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Route, Loader2, Calendar } from "lucide-react";

import AuditTimeline from "@/components/ui/AuditTimeline";
import { getRuta } from "@/services/rutas.service";

const formatFecha = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
};

export default function RutaHistorial() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [ruta, setRuta]     = useState(location.state?.ruta ?? null);
  const [loading, setLoading] = useState(!location.state?.ruta);

  useEffect(() => {
    if (ruta) return;
    let cancelled = false;
    getRuta(id)
      .then((data) => {
        if (cancelled) return;
        setRuta(data ?? null);
      })
      .catch(() => setRuta(null))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, ruta]);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/admin/rutas")}
          className="mt-0.5 p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors text-muted-foreground hover:text-foreground shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <Route size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Historial de la ruta
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
      ) : ruta ? (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-muted dark:bg-slate-800 flex items-center justify-center">
              <Route size={22} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xl font-black tracking-tight text-gray-900 dark:text-gray-100">
                {ruta.nombre || "—"}
              </span>
              {ruta.descripcion && (
                <p className="text-sm text-muted-foreground mt-0.5 italic line-clamp-2">
                  {ruta.descripcion}
                </p>
              )}
              {(ruta.fecha_inicio || ruta.fecha_fin) && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground/70 font-medium">
                  <Calendar size={11} className="text-primary" />
                  {[formatFecha(ruta.fecha_inicio), formatFecha(ruta.fecha_fin)]
                    .filter(Boolean)
                    .join(" → ")}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 text-center text-muted-foreground text-sm">
          Ruta no encontrada.
        </div>
      )}

      {/* ── Audit timeline ── */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6">
        <AuditTimeline entidad="ruta" entidadId={Number(id)} />
      </div>

    </div>
  );
}
