// src/Reports/ViaticosporTipo.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Download, PieChart, Loader2, AlertCircle, Calendar, X,
  Utensils, Moon, BedDouble, Fuel, CreditCard, Zap, Hash,
} from "lucide-react";
import ExportDialog from "@/components/Exports/ExportDialog";
import { getViaticosporTipoReport } from "@/services/ReportServices";
import { Button } from "@/components/ui/button";

const fmtDateInput = (d) => { if (!d) return ""; const p = (n) => String(n).padStart(2,"0"); const dt = d instanceof Date ? d : new Date(d); return `${dt.getFullYear()}-${p(dt.getMonth()+1)}-${p(dt.getDate())}`; };
const todayStr = () => fmtDateInput(new Date());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const fmtCurrency = (v) => {
  const n = Number(v ?? 0);
  return n.toLocaleString("es-HN", { style: "currency", currency: "HNL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const RANGE_LABELS = { all: "Todo", today: "Hoy", "7d": "7 días", month: "Este mes", custom: "Personalizado" };

const TIPO_CONFIG = {
  DESAYUNO:   { label: "Desayuno",   icon: Utensils,   bg: "bg-amber-50 dark:bg-amber-900/20",   border: "border-amber-200 dark:border-amber-800/40",   text: "text-amber-700 dark:text-amber-400",   dot: "bg-amber-500" },
  ALMUERZO:   { label: "Almuerzo",   icon: Utensils,   bg: "bg-orange-50 dark:bg-orange-900/20",  border: "border-orange-200 dark:border-orange-800/40",  text: "text-orange-700 dark:text-orange-400",  dot: "bg-orange-500" },
  CENA:       { label: "Cena",       icon: Moon,       bg: "bg-indigo-50 dark:bg-indigo-900/20",  border: "border-indigo-200 dark:border-indigo-800/40",  text: "text-indigo-700 dark:text-indigo-400",  dot: "bg-indigo-500" },
  HOSPEDAJE:  { label: "Hospedaje",  icon: BedDouble,  bg: "bg-violet-50 dark:bg-violet-900/20",  border: "border-violet-200 dark:border-violet-800/40",  text: "text-violet-700 dark:text-violet-400",  dot: "bg-violet-500" },
  COMBUSTIBLE:{ label: "Combustible",icon: Fuel,       bg: "bg-red-50 dark:bg-red-900/20",        border: "border-red-200 dark:border-red-800/40",        text: "text-red-700 dark:text-red-400",        dot: "bg-red-500" },
  PEAJE:      { label: "Peaje",      icon: CreditCard, bg: "bg-slate-50 dark:bg-slate-900/30",    border: "border-slate-200 dark:border-slate-700/40",    text: "text-slate-700 dark:text-slate-400",    dot: "bg-slate-500" },
  IMPREVISTO: { label: "Imprevisto", icon: Zap,        bg: "bg-rose-50 dark:bg-rose-900/20",      border: "border-rose-200 dark:border-rose-800/40",      text: "text-rose-700 dark:text-rose-400",      dot: "bg-rose-500" },
};
const DEFAULT_TIPO = { label: "", icon: Hash, bg: "bg-muted/30", border: "border-border/50", text: "text-muted-foreground", dot: "bg-muted-foreground" };

export default function ViaticosporTipo() {
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
      try {
        const d = await getViaticosporTipoReport({ from: from || undefined, to: to || undefined });
        setRaw(Array.isArray(d) ? d : []);
      } catch (e) { console.error(e); setErr("Error al cargar el reporte."); }
      finally { setLoading(false); }
    })();
  }, [from, to]);

  const totalMonto   = useMemo(() => raw.reduce((s, r) => s + Number(r.monto_total ?? 0), 0), [raw]);
  const totalCantidad = useMemo(() => raw.reduce((s, r) => s + Number(r.cantidad ?? 0), 0), [raw]);
  const maxMonto     = useMemo(() => Math.max(...raw.map((r) => Number(r.monto_total ?? 0)), 1), [raw]);

  const columnsExport = [
    { label: "Tipo",      key: "tipo" },
    { label: "Cantidad",  key: "cantidad" },
    { label: "Monto Total", get: (r) => fmtCurrency(r.monto_total) },
    { label: "% del Total", get: (r) => totalMonto > 0 ? `${Math.round((Number(r.monto_total) / totalMonto) * 100)}%` : "0%" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button onClick={() => navigate("/admin/reports")} className="p-2 rounded-2xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground shrink-0"><ArrowLeft size={18} /></button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-green-500/10 dark:bg-green-500/15 ring-1 ring-green-500/20 shadow-sm shrink-0"><PieChart size={20} className="text-green-600 dark:text-green-400" /></div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">Viáticos por Tipo</h1>
              <p className="text-muted-foreground text-xs font-medium mt-0.5">
                {loading ? "Cargando..." : `${totalCantidad} registros · ${fmtCurrency(totalMonto)} total`}
              </p>
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
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-green-500" /></div>
          <p className="text-sm text-muted-foreground font-medium">Cargando desglose por tipo...</p>
        </div>
      ) : err ? (
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 rounded-3xl p-6 flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div><p className="text-sm font-bold text-rose-700 dark:text-rose-400">Error al cargar</p><p className="text-xs text-rose-600 mt-0.5">{err}</p></div>
        </div>
      ) : raw.length === 0 ? (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center"><PieChart size={28} className="text-muted-foreground/40" /></div>
          <p className="font-bold text-sm">Sin registros</p>
          <p className="text-xs text-muted-foreground">No hay viáticos en el período seleccionado</p>
        </div>
      ) : (
        <>
          {/* Tarjetas de tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {raw.map((r) => {
              const cfg = TIPO_CONFIG[r.tipo] || DEFAULT_TIPO;
              const IconComp = cfg.icon;
              const pct = totalMonto > 0 ? Math.round((Number(r.monto_total) / totalMonto) * 100) : 0;
              return (
                <div key={r.tipo} className={`${cfg.bg} ${cfg.border} border rounded-3xl p-5 space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComp size={14} className={cfg.text} />
                      <span className={`text-xs font-black uppercase tracking-wide ${cfg.text}`}>{cfg.label || r.tipo}</span>
                    </div>
                    <span className={`text-xs font-bold ${cfg.text} opacity-70`}>{pct}%</span>
                  </div>
                  <div>
                    <p className={`text-2xl font-black tabular-nums ${cfg.text}`}>{fmtCurrency(r.monto_total)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.cantidad} registro{Number(r.cantidad) !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${cfg.dot} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barra apilada */}
          {totalMonto > 0 && (
            <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl p-5 shadow-sm space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Distribución por monto</p>
              <div className="flex h-4 rounded-full overflow-hidden gap-px">
                {raw.map((r) => {
                  const cfg = TIPO_CONFIG[r.tipo] || DEFAULT_TIPO;
                  const pct = totalMonto > 0 ? Math.round((Number(r.monto_total) / totalMonto) * 100) : 0;
                  return pct > 0 ? (
                    <div key={r.tipo} className={`${cfg.dot} first:rounded-l-full last:rounded-r-full transition-all duration-700`} style={{ width: `${pct}%` }} title={`${r.tipo}: ${fmtCurrency(r.monto_total)} (${pct}%)`} />
                  ) : null;
                })}
              </div>
              <div className="flex flex-wrap gap-3">
                {raw.map((r) => {
                  const cfg = TIPO_CONFIG[r.tipo] || DEFAULT_TIPO;
                  return (
                    <div key={r.tipo} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className="text-xs text-muted-foreground">{cfg.label || r.tipo} <span className="font-bold text-foreground">{fmtCurrency(r.monto_total)}</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabla detallada */}
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20">
                    {["Tipo", "Cantidad", "Monto Total", "Distribución"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{h}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {raw.map((r) => {
                    const cfg = TIPO_CONFIG[r.tipo] || DEFAULT_TIPO;
                    const IconComp = cfg.icon;
                    const pct = totalMonto > 0 ? Math.round((Number(r.monto_total) / totalMonto) * 100) : 0;
                    return (
                      <tr key={r.tipo} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-6 rounded-full ${cfg.dot}`} />
                            <IconComp size={13} className={cfg.text} />
                            <span className={`text-sm font-bold ${cfg.text}`}>{cfg.label || r.tipo}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-black tabular-nums">{r.cantidad}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-black tabular-nums text-green-600 dark:text-green-400">{fmtCurrency(r.monto_total)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold tabular-nums w-8 text-right">{pct}%</span>
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[60px]">
                              <div className={`h-full rounded-full ${cfg.dot} opacity-70 transition-all duration-500`} style={{ width: `${maxMonto > 0 ? (Number(r.monto_total) / maxMonto) * 100 : 0}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <ExportDialog open={openExport} onClose={() => setOpenExport(false)} rows={raw} columns={columnsExport} defaultTitle="Viáticos por Tipo" defaultFilenameBase="viaticos_tipo" />
    </div>
  );
}
