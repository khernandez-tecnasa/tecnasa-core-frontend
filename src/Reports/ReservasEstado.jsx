// src/Reports/ReservasEstado.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Download, CalendarCheck, Loader2, AlertCircle, Calendar, X, Car, Users,
} from "lucide-react";
import ExportDialog from "@/components/Exports/ExportDialog";
import { getReservasEstadoReport } from "@/services/ReportServices";
import { Button } from "@/components/ui/button";

const fmtDateInput = (d) => { if (!d) return ""; const p = (n) => String(n).padStart(2,"0"); const dt = d instanceof Date ? d : new Date(d); return `${dt.getFullYear()}-${p(dt.getMonth()+1)}-${p(dt.getDate())}`; };
const todayStr = () => fmtDateInput(new Date());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

const RANGE_LABELS = { all: "Todo", today: "Hoy", "7d": "7 días", month: "Este mes", custom: "Personalizado" };

const ESTADO_STYLE = {
  Reservado:  { bg: "bg-amber-50 dark:bg-amber-900/20",  border: "border-amber-200 dark:border-amber-800/40",  text: "text-amber-700 dark:text-amber-400",  dot: "bg-amber-500",   label: "Pendiente" },
  "En Uso":   { bg: "bg-blue-50 dark:bg-blue-900/20",    border: "border-blue-200 dark:border-blue-800/40",    text: "text-blue-700 dark:text-blue-400",    dot: "bg-blue-500",    label: "En Uso" },
  Finalizado: { bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800/40", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", label: "Finalizado" },
  Cancelado:  { bg: "bg-rose-50 dark:bg-rose-900/20",    border: "border-rose-200 dark:border-rose-800/40",    text: "text-rose-700 dark:text-rose-400",    dot: "bg-rose-500",    label: "Cancelado" },
};
const DEFAULT_STYLE = { bg: "bg-muted/30", border: "border-border/50", text: "text-muted-foreground", dot: "bg-muted-foreground", label: "" };

export default function ReservasEstado() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const qs = useMemo(() => new URLSearchParams(search), [search]);

  const [range, setRange] = useState(qs.get("range") || "all");
  const [from, setFrom] = useState(qs.get("from") || "");
  const [to, setTo] = useState(qs.get("to") || "");
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [openExport, setOpenExport] = useState(false);

  useEffect(() => {
    if (range === "custom") return;
    if (range === "all") { setFrom(""); setTo(""); }
    else if (range === "today") { const d = todayStr(); setFrom(d); setTo(d); }
    else if (range === "7d") { setFrom(fmtDateInput(addDays(new Date(), -6))); setTo(todayStr()); }
    else if (range === "month") { const n = new Date(); setFrom(fmtDateInput(new Date(n.getFullYear(), n.getMonth(), 1))); setTo(todayStr()); }
  }, [range]);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try { const d = await getReservasEstadoReport({ from: from || undefined, to: to || undefined }); setRaw(Array.isArray(d) ? d : []); }
      catch (e) { console.error(e); setErr("Error al cargar el reporte."); }
      finally { setLoading(false); }
    })();
  }, [from, to]);

  const total = useMemo(() => raw.reduce((s, r) => s + Number(r.total ?? 0), 0), [raw]);

  const columnsExport = [
    { label: "Estado", key: "estado" },
    { label: "Total", key: "total" },
    { label: "Vehículos distintos", key: "vehiculos_distintos" },
    { label: "Empleados distintos", key: "empleados_distintos" },
    { label: "% del total", get: (r) => total > 0 ? `${Math.round((Number(r.total) / total) * 100)}%` : "0%" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button onClick={() => navigate("/admin/reports")} className="p-2 rounded-2xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground shrink-0"><ArrowLeft size={18} /></button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 dark:bg-purple-500/15 ring-1 ring-purple-500/20 shadow-sm shrink-0"><CalendarCheck size={20} className="text-purple-600 dark:text-purple-400" /></div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">Reservas por Estado</h1>
              <p className="text-muted-foreground text-xs font-medium mt-0.5">{loading ? "Cargando..." : `${total} reserva${total !== 1 ? "s" : ""} en total`}</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setOpenExport(true)} disabled={raw.length === 0 || loading} className="rounded-2xl px-5 h-10 font-bold gap-2 shrink-0"><Download size={15} /><span className="hidden sm:inline">Exportar</span></Button>
      </div>

      {/* Filtros */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground shrink-0"><Calendar size={13} />Período</div>
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(RANGE_LABELS).map(([r, label]) => (
              <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${range === r ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{label}</button>
            ))}
          </div>
          {range !== "all" && <button onClick={() => { setRange("all"); setFrom(""); setTo(""); }} className="ml-auto text-[11px] font-semibold text-muted-foreground hover:text-rose-500 flex items-center gap-1"><X size={11} />Limpiar</button>}
        </div>
        {range === "custom" && (
          <div className="flex items-center gap-2 flex-wrap pt-3">
            <span className="text-xs text-muted-foreground font-medium">Desde</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-muted/40 border border-border/50 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all" />
            <span className="text-xs text-muted-foreground font-medium">Hasta</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-muted/40 border border-border/50 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all" />
          </div>
        )}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-purple-500" /></div>
          <p className="text-sm text-muted-foreground font-medium">Cargando reservas...</p>
        </div>
      ) : err ? (
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 rounded-3xl p-6 flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div><p className="text-sm font-bold text-rose-700 dark:text-rose-400">Error al cargar</p><p className="text-xs text-rose-600 mt-0.5">{err}</p></div>
        </div>
      ) : raw.length === 0 ? (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center"><CalendarCheck size={28} className="text-muted-foreground/40" /></div>
          <p className="font-bold text-sm">Sin reservas</p>
          <p className="text-xs text-muted-foreground">No hay reservas en el período seleccionado</p>
        </div>
      ) : (
        <>
          {/* Tarjetas de estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {raw.map((r) => {
              const s = ESTADO_STYLE[r.estado] || DEFAULT_STYLE;
              const pct = total > 0 ? Math.round((Number(r.total) / total) * 100) : 0;
              return (
                <div key={r.estado} className={`${s.bg} ${s.border} border rounded-3xl p-5 space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                      <span className={`text-xs font-black uppercase tracking-wide ${s.text}`}>{r.estado}</span>
                    </div>
                    <span className={`text-xs font-bold ${s.text} opacity-70`}>{pct}%</span>
                  </div>
                  <p className={`text-3xl font-black tabular-nums ${s.text}`}>{r.total}</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Car size={11} />{r.vehiculos_distintos ?? 0} vehículos</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users size={11} />{r.empleados_distintos ?? 0} empleados</div>
                  </div>
                  {/* Barra de porcentaje */}
                  <div className="h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${s.dot} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barra apilada */}
          {total > 0 && (
            <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl p-5 shadow-sm space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Distribución total</p>
              <div className="flex h-4 rounded-full overflow-hidden gap-px">
                {raw.map((r) => {
                  const s = ESTADO_STYLE[r.estado] || DEFAULT_STYLE;
                  const pct = Math.round((Number(r.total) / total) * 100);
                  return pct > 0 ? (
                    <div key={r.estado} className={`${s.dot} first:rounded-l-full last:rounded-r-full transition-all duration-700`} style={{ width: `${pct}%` }} title={`${r.estado}: ${r.total} (${pct}%)`} />
                  ) : null;
                })}
              </div>
              <div className="flex flex-wrap gap-3">
                {raw.map((r) => {
                  const s = ESTADO_STYLE[r.estado] || DEFAULT_STYLE;
                  return (
                    <div key={r.estado} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                      <span className="text-xs text-muted-foreground">{r.estado} <span className="font-bold text-foreground">{r.total}</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <ExportDialog open={openExport} onClose={() => setOpenExport(false)} rows={raw} columns={columnsExport} defaultTitle="Reservas por Estado" defaultFilenameBase="reservas_estado" />
    </div>
  );
}
