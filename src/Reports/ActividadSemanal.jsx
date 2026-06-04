// src/Reports/ActividadSemanal.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Download, CalendarDays, Loader2, AlertCircle, Calendar, X, Car, Users,
} from "lucide-react";
import ExportDialog from "@/components/Exports/ExportDialog";
import { getActividadSemanalReport } from "@/services/ReportServices";
import { Button } from "@/components/ui/button";

const fmtDateInput = (d) => { if (!d) return ""; const p = (n) => String(n).padStart(2,"0"); const dt = d instanceof Date ? d : new Date(d); return `${dt.getFullYear()}-${p(dt.getMonth()+1)}-${p(dt.getDate())}`; };
const todayStr = () => fmtDateInput(new Date());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

// DAYOFWEEK: 1=Dom, 2=Lun, ..., 7=Sab — queremos mostrar Lun→Dom
const ORDER = [2, 3, 4, 5, 6, 7, 1];
const DIA_SHORT = { 1: "Dom", 2: "Lun", 3: "Mar", 4: "Mié", 5: "Jue", 6: "Vie", 7: "Sáb" };
const DIA_COLOR = {
  2: "bg-indigo-500", 3: "bg-indigo-400", 4: "bg-indigo-500",
  5: "bg-indigo-400", 6: "bg-indigo-600", 7: "bg-violet-500", 1: "bg-slate-400",
};

const RANGE_LABELS = { all: "Todo", today: "Hoy", "7d": "7 días", month: "Este mes", custom: "Personalizado" };

export default function ActividadSemanal() {
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
      try { const d = await getActividadSemanalReport({ from: from || undefined, to: to || undefined }); setRaw(Array.isArray(d) ? d : []); }
      catch (e) { console.error(e); setErr("Error al cargar el reporte."); }
      finally { setLoading(false); }
    })();
  }, [from, to]);

  // Indexar por dia_num para lookup rápido
  const byDia = useMemo(() => {
    const map = {};
    raw.forEach((r) => { map[r.dia_num] = r; });
    return map;
  }, [raw]);

  const ordered = useMemo(() =>
    ORDER.map((num) => byDia[num] ?? { dia_num: num, dia_nombre: DIA_SHORT[num], total_salidas: 0, empleados_activos: 0, vehiculos_activos: 0 }),
    [byDia]
  );

  const maxSalidas = useMemo(() => Math.max(...ordered.map((r) => Number(r.total_salidas ?? 0)), 1), [ordered]);
  const totalSalidas = useMemo(() => ordered.reduce((s, r) => s + Number(r.total_salidas ?? 0), 0), [ordered]);

  const columnsExport = [
    { label: "Día", key: "dia_nombre" },
    { label: "Total Salidas", key: "total_salidas" },
    { label: "Empleados Activos", key: "empleados_activos" },
    { label: "Vehículos Activos", key: "vehiculos_activos" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button onClick={() => navigate("/admin/reports")} className="p-2 rounded-2xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground shrink-0"><ArrowLeft size={18} /></button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/15 ring-1 ring-indigo-500/20 shadow-sm shrink-0"><CalendarDays size={20} className="text-indigo-600 dark:text-indigo-400" /></div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">Actividad por Día</h1>
              <p className="text-muted-foreground text-xs font-medium mt-0.5">{loading ? "Cargando..." : `${totalSalidas} salidas en el período`}</p>
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
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-indigo-500" /></div>
          <p className="text-sm text-muted-foreground font-medium">Cargando actividad semanal...</p>
        </div>
      ) : err ? (
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 rounded-3xl p-6 flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div><p className="text-sm font-bold text-rose-700 dark:text-rose-400">Error al cargar</p><p className="text-xs text-rose-600 mt-0.5">{err}</p></div>
        </div>
      ) : (
        <>
          {/* Gráfico de barras */}
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-6">Salidas por día de la semana</p>
            <div className="flex items-end gap-3 h-40">
              {ordered.map((r) => {
                const pct = maxSalidas > 0 ? (Number(r.total_salidas) / maxSalidas) * 100 : 0;
                const isWeekend = r.dia_num === 1 || r.dia_num === 7;
                return (
                  <div key={r.dia_num} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-black text-muted-foreground tabular-nums">{r.total_salidas || 0}</span>
                    <div className="w-full rounded-t-xl overflow-hidden bg-muted/30" style={{ height: "96px" }}>
                      <div
                        className={`w-full rounded-t-xl transition-all duration-700 ${isWeekend ? "bg-slate-300 dark:bg-slate-700" : DIA_COLOR[r.dia_num] || "bg-indigo-500"}`}
                        style={{ height: `${pct}%`, minHeight: pct > 0 ? "6px" : "0" }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground truncate w-full text-center">{DIA_SHORT[r.dia_num]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabla detallada */}
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20">
                    {["Día", "Salidas", "Empleados Activos", "Vehículos Activos"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{h}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ordered.map((r) => {
                    const isWeekend = r.dia_num === 1 || r.dia_num === 7;
                    const isTop = Number(r.total_salidas) === maxSalidas && maxSalidas > 0;
                    return (
                      <tr key={r.dia_num} className={`border-b border-border/30 last:border-0 transition-colors ${isTop ? "bg-indigo-50/40 dark:bg-indigo-900/10" : "hover:bg-muted/20"}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-6 rounded-full ${isWeekend ? "bg-slate-300 dark:bg-slate-700" : DIA_COLOR[r.dia_num] || "bg-indigo-500"}`} />
                            <span className="text-sm font-bold">{r.dia_nombre || DIA_SHORT[r.dia_num]}</span>
                            {isTop && <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold ml-1">Más activo</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 tabular-nums w-8 text-right">{r.total_salidas || 0}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[60px]">
                              <div className={`h-full rounded-full ${DIA_COLOR[r.dia_num] || "bg-indigo-500"} opacity-70 transition-all duration-500`} style={{ width: `${maxSalidas > 0 ? (Number(r.total_salidas) / maxSalidas) * 100 : 0}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Users size={13} />{r.empleados_activos || 0}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Car size={13} />{r.vehiculos_activos || 0}</div>
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

      <ExportDialog open={openExport} onClose={() => setOpenExport(false)} rows={ordered} columns={columnsExport} defaultTitle="Actividad Semanal" defaultFilenameBase="actividad_semanal" />
    </div>
  );
}
