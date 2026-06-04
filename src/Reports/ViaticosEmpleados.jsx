// src/Reports/ViaticosEmpleados.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Download, TrendingUp, Loader2, AlertCircle, Calendar, X, Search, User, DollarSign, Route,
} from "lucide-react";
import ExportDialog from "@/components/Exports/ExportDialog";
import { getViaticosEmpleadosReport } from "@/services/ReportServices";
import { Button } from "@/components/ui/button";

const fmtDateInput = (d) => { if (!d) return ""; const p = (n) => String(n).padStart(2,"0"); const dt = d instanceof Date ? d : new Date(d); return `${dt.getFullYear()}-${p(dt.getMonth()+1)}-${p(dt.getDate())}`; };
const todayStr = () => fmtDateInput(new Date());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const fmtCurrency = (v) => {
  const n = Number(v ?? 0);
  return n.toLocaleString("es-HN", { style: "currency", currency: "HNL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const RANGE_LABELS = { all: "Todo", today: "Hoy", "7d": "7 días", month: "Este mes", custom: "Personalizado" };

function RankBadge({ rank }) {
  if (rank === 1) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-black">1</span>;
  if (rank === 2) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black">2</span>;
  if (rank === 3) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 text-[10px] font-black">3</span>;
  return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">{rank}</span>;
}

function EmpAvatar({ name, rank }) {
  const initials = (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const color = rank === 1 ? "bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 ring-lime-200 dark:ring-lime-800/40"
              : rank === 2 ? "bg-lime-50 dark:bg-lime-900/20 text-lime-600 dark:text-lime-500 ring-lime-100 dark:ring-lime-800/20"
              : rank === 3 ? "bg-lime-50 dark:bg-lime-900/10 text-lime-500 dark:text-lime-600 ring-lime-100/50"
              : "bg-muted text-muted-foreground ring-border/40";
  return (
    <div className={`w-9 h-9 rounded-2xl ring-1 flex items-center justify-center text-xs font-black shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

export default function ViaticosEmpleados() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const qs = useMemo(() => new URLSearchParams(search), [search]);

  const [range, setRange] = useState(qs.get("range") || "all");
  const [from, setFrom] = useState(qs.get("from") || "");
  const [to, setTo] = useState(qs.get("to") || "");
  const [raw, setRaw] = useState([]);
  const [q, setQ] = useState("");
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
        const d = await getViaticosEmpleadosReport({ from: from || undefined, to: to || undefined });
        setRaw(Array.isArray(d) ? d : []);
      } catch (e) { console.error(e); setErr("Error al cargar el reporte."); }
      finally { setLoading(false); }
    })();
  }, [from, to]);

  const filtered = useMemo(() => {
    if (!q.trim()) return raw;
    const lq = q.toLowerCase();
    return raw.filter((r) =>
      (r.nombre_empleado || "").toLowerCase().includes(lq) ||
      (r.puesto || "").toLowerCase().includes(lq)
    );
  }, [raw, q]);

  const maxMonto = useMemo(() => Math.max(...raw.map((r) => Number(r.monto_total ?? 0)), 1), [raw]);

  const columnsExport = [
    { label: "#",              get: (_, i) => i + 1 },
    { label: "Empleado",       key: "nombre_empleado" },
    { label: "Puesto",         key: "puesto" },
    { label: "Total Viáticos", key: "total_viaticos" },
    { label: "Monto Total",    get: (r) => fmtCurrency(r.monto_total) },
    { label: "Km Total",       get: (r) => `${Number(r.km_total ?? 0).toFixed(1)} km` },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button onClick={() => navigate("/admin/reports")} className="p-2 rounded-2xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground shrink-0"><ArrowLeft size={18} /></button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-lime-500/10 dark:bg-lime-500/15 ring-1 ring-lime-500/20 shadow-sm shrink-0"><TrendingUp size={20} className="text-lime-600 dark:text-lime-400" /></div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">Viáticos por Empleado</h1>
              <p className="text-muted-foreground text-xs font-medium mt-0.5">{loading ? "Cargando..." : `${raw.length} empleado${raw.length !== 1 ? "s" : ""} con viáticos`}</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setOpenExport(true)} disabled={raw.length === 0 || loading} className="rounded-2xl px-5 h-10 font-bold gap-2 shrink-0"><Download size={15} /><span className="hidden sm:inline">Exportar</span></Button>
      </div>

      {/* Filtros */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl p-4 shadow-sm space-y-3">
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Desde</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-muted/40 border border-border/50 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all" />
            <span className="text-xs text-muted-foreground font-medium">Hasta</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-muted/40 border border-border/50 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all" />
          </div>
        )}
        {/* Búsqueda */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar empleado o puesto..."
            className="w-full pl-8 pr-4 py-2 bg-muted/40 border border-border/50 rounded-xl text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all"
          />
          {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={13} /></button>}
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="w-12 h-12 rounded-2xl bg-lime-500/10 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-lime-500" /></div>
          <p className="text-sm text-muted-foreground font-medium">Cargando viáticos por empleado...</p>
        </div>
      ) : err ? (
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 rounded-3xl p-6 flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div><p className="text-sm font-bold text-rose-700 dark:text-rose-400">Error al cargar</p><p className="text-xs text-rose-600 mt-0.5">{err}</p></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center"><User size={28} className="text-muted-foreground/40" /></div>
          <p className="font-bold text-sm">{q ? "Sin resultados" : "Sin datos"}</p>
          <p className="text-xs text-muted-foreground">{q ? "Prueba con otra búsqueda" : "No hay viáticos en el período seleccionado"}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20">
                    {["#", "Empleado", "Puesto", "Viáticos", "Monto Total", "Km Total"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{h}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const rank = i + 1;
                    const isTop = rank <= 3;
                    return (
                      <tr key={r.nombre_empleado} className={`border-b border-border/30 last:border-0 transition-colors ${isTop ? "bg-lime-50/30 dark:bg-lime-900/5" : "hover:bg-muted/20"}`}>
                        <td className="px-5 py-4 w-12"><RankBadge rank={rank} /></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <EmpAvatar name={r.nombre_empleado} rank={rank} />
                            <span className="text-sm font-bold">{r.nombre_empleado}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 bg-muted/50 rounded-lg">{r.puesto || "—"}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-black tabular-nums">{r.total_viaticos}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black tabular-nums text-lime-600 dark:text-lime-400">{fmtCurrency(r.monto_total)}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[60px]">
                              <div className="h-full rounded-full bg-lime-500 opacity-70 transition-all duration-500" style={{ width: `${maxMonto > 0 ? (Number(r.monto_total) / maxMonto) * 100 : 0}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Route size={13} />{Number(r.km_total ?? 0).toFixed(1)} km
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((r, i) => {
              const rank = i + 1;
              return (
                <div key={r.nombre_empleado} className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-2xl p-4 flex items-center gap-3">
                  <RankBadge rank={rank} />
                  <EmpAvatar name={r.nombre_empleado} rank={rank} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{r.nombre_empleado}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.puesto || "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-lime-600 dark:text-lime-400 tabular-nums">{fmtCurrency(r.monto_total)}</p>
                    <p className="text-[10px] text-muted-foreground">{r.total_viaticos} viát.</p>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length < raw.length && (
            <p className="text-center text-xs text-muted-foreground">Mostrando {filtered.length} de {raw.length} empleados</p>
          )}
        </>
      )}

      <ExportDialog open={openExport} onClose={() => setOpenExport(false)} rows={filtered} columns={columnsExport} defaultTitle="Viáticos por Empleado" defaultFilenameBase="viaticos_empleados" />
    </div>
  );
}
