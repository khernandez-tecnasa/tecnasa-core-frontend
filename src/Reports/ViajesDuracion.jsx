// src/Reports/ViajesDuracion.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Search, X, Download, Timer, Loader2,
  AlertCircle, Calendar, Car,
} from "lucide-react";
import PaginationLite from "@/components/common/PaginationLite";
import ExportDialog from "@/components/Exports/ExportDialog";
import { getViajesDuracionReport } from "@/services/ReportServices";
import { Button } from "@/components/ui/button";
import useIsMobile from "@/hooks/useIsMobile";
import { useTranslation } from "react-i18next";

const debounced = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const fmtDateInput = (d) => { if (!d) return ""; const p = (n) => String(n).padStart(2,"0"); const dt = d instanceof Date ? d : new Date(d); return `${dt.getFullYear()}-${p(dt.getMonth()+1)}-${p(dt.getDate())}`; };
const todayStr = () => fmtDateInput(new Date());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

const fmtDuracion = (min) => {
  if (!min && min !== 0) return "N/A";
  const m = Number(min);
  if (!Number.isFinite(m) || m < 0) return "N/A";
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  if (h === 0) return `${mm} min`;
  return `${h}h ${mm}min`;
};

const RANGE_KEYS = ["all", "today", "7d", "month", "custom"];

function RankBadge({ pos }) {
  const base = "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ring-1";
  if (pos === 1) return <span className={`${base} bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-800/40`}>1</span>;
  if (pos === 2) return <span className={`${base} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-slate-200 dark:ring-slate-700`}>2</span>;
  if (pos === 3) return <span className={`${base} bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 ring-orange-200 dark:ring-orange-800/40`}>3</span>;
  return <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-semibold text-muted-foreground">{pos}</span>;
}

function DurBar({ value, max, color = "cyan" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const colors = { cyan: "bg-cyan-500/70", amber: "bg-amber-400/70", rose: "bg-rose-500/70" };
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-black text-cyan-600 dark:text-cyan-400 tabular-nums min-w-[72px] text-right shrink-0">
        {fmtDuracion(value)}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[60px]">
        <div className={`h-full rounded-full ${colors[color] || colors.cyan} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ViajesDuracion() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { search } = useLocation();
  const isMobile = useIsMobile();
  const qs = useMemo(() => new URLSearchParams(search), [search]);

  const [query, setQuery] = useState(qs.get("q") || "");
  const [range, setRange] = useState(qs.get("range") || "all");
  const [from, setFrom] = useState(qs.get("from") || "");
  const [to, setTo] = useState(qs.get("to") || "");
  const [page, setPage] = useState(Number(qs.get("p") || 1));
  const rowsPerPage = 10;

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
    setPage(1);
  }, [range]);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try { const d = await getViajesDuracionReport({ from: from || undefined, to: to || undefined }); setRaw(Array.isArray(d) ? d : []); }
      catch (e) { console.error(e); setErr("reports.common.error_detail"); }
      finally { setLoading(false); }
    })();
  }, [from, to]);

  const onChangeQuery = useRef(debounced((v) => { setPage(1); setQuery(v); }, 250)).current;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter((r) => [r.marca, r.modelo, r.placa].map((v) => String(v ?? "").toLowerCase()).some((s) => s.includes(q)));
  }, [raw, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageSafe = Math.min(Math.max(page, 1), totalPages);
  const pageItems = useMemo(() => filtered.slice((pageSafe - 1) * rowsPerPage, pageSafe * rowsPerPage), [filtered, pageSafe]);
  const maxDur = useMemo(() => Math.max(...filtered.map((r) => Number(r.duracion_promedio_minutos ?? 0)), 1), [filtered]);

  const columnsExport = [
    { label: "#", get: (_r, i) => (pageSafe - 1) * rowsPerPage + i + 1 },
    { label: "Vehículo", get: (r) => `${r.marca} ${r.modelo}` },
    { label: "Placa", key: "placa" },
    { label: "Total Viajes", key: "total_viajes" },
    { label: "Duración Promedio", get: (r) => fmtDuracion(r.duracion_promedio_minutos) },
    { label: "Duración Máx.", get: (r) => fmtDuracion(r.duracion_max_minutos) },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button onClick={() => navigate("/admin/reports")} className="p-2 rounded-2xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground shrink-0"><ArrowLeft size={18} /></button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/15 ring-1 ring-cyan-500/20 shadow-sm shadow-cyan-500/10 shrink-0"><Timer size={20} className="text-cyan-600 dark:text-cyan-400" /></div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">{t("reports.viajes.title")}</h1>
              <p className="text-muted-foreground text-xs font-medium mt-0.5">{loading ? t("reports.viajes.loading") : t("reports.viajes.count", { count: filtered.length })}</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setOpenExport(true)} disabled={filtered.length === 0 || loading} className="rounded-2xl px-5 h-10 font-bold gap-2 shrink-0"><Download size={15} /><span className="hidden sm:inline">{t("reports.common.export")}</span></Button>
      </div>

      {/* Filtros */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl p-4 space-y-3 shadow-sm">
        <div className="relative group">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary pointer-events-none" />
          <input type="text" placeholder={t("reports.viajes.search_placeholder")} defaultValue={query} onChange={(e) => onChangeQuery(e.target.value)}
            className="w-full bg-muted/40 border border-border/50 rounded-2xl pl-9 pr-10 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/50" />
          {query && <button onClick={() => { setQuery(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"><X size={14} /></button>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground shrink-0"><Calendar size={13} />{t("reports.common.period")}</div>
          <div className="flex gap-1.5 flex-wrap">
            {RANGE_KEYS.map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${range === r ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{t(`reports.ranges.${r}`)}</button>
            ))}
          </div>
          {(query || range !== "all") && <button onClick={() => { setQuery(""); setRange("all"); setFrom(""); setTo(""); setPage(1); }} className="ml-auto text-[11px] font-semibold text-muted-foreground hover:text-rose-500 flex items-center gap-1"><X size={11} />{t("reports.common.clear")}</button>}
        </div>
        {range === "custom" && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs text-muted-foreground font-medium">{t("reports.common.from")}</span>
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="bg-muted/40 border border-border/50 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all" />
            <span className="text-xs text-muted-foreground font-medium">{t("reports.common.to")}</span>
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="bg-muted/40 border border-border/50 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all" />
          </div>
        )}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-cyan-500" /></div>
          <p className="text-sm text-muted-foreground font-medium">{t("reports.viajes.loading")}</p>
        </div>
      ) : err ? (
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 rounded-3xl p-6 flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div><p className="text-sm font-bold text-rose-700 dark:text-rose-400">{t("reports.common.error_title")}</p><p className="text-xs text-rose-600 mt-0.5">{t(err)}</p></div>
        </div>
      ) : (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
          {pageItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center"><Car size={28} className="text-muted-foreground/40" /></div>
              <p className="font-bold text-sm">{t("reports.viajes.empty_title")}</p>
              <p className="text-xs text-muted-foreground">{t("reports.viajes.empty_period")}</p>
            </div>
          ) : isMobile ? (
            <div className="divide-y divide-border/50">
              {pageItems.map((r, i) => {
                const pos = (pageSafe - 1) * rowsPerPage + i + 1;
                return (
                  <div key={`${r.placa}-${i}`} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                    <RankBadge pos={pos} />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0"><Car size={16} className="text-cyan-600 dark:text-cyan-400" /></div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{r.marca} {r.modelo}</p>
                        <p className="text-[11px] text-muted-foreground">{r.placa} · {r.total_viajes} {t("reports.viajes.mobile_trips")}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-black text-cyan-600 dark:text-cyan-400">{fmtDuracion(r.duracion_promedio_minutos)}</p>
                      <p className="text-[10px] text-muted-foreground">{t("reports.viajes.mobile_avg")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20">
                    {[
                      ["#", "text-center w-16"],
                      [t("reports.viajes.col_vehicle"), "text-left"],
                      [t("reports.viajes.col_plate"), "text-left"],
                      [t("reports.viajes.col_trips"), "text-left"],
                      [t("reports.viajes.col_avg_duration"), "text-left"],
                      [t("reports.viajes.col_max_duration"), "text-left"],
                    ].map(([h, cls]) => (
                      <th key={h} className={`px-5 py-3.5 ${cls}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{h}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((r, i) => {
                    const pos = (pageSafe - 1) * rowsPerPage + i + 1;
                    return (
                      <tr key={`${r.placa}-${i}`} className="border-b border-border/30 last:border-0 hover:bg-cyan-50/30 dark:hover:bg-cyan-900/5 transition-colors">
                        <td className="px-5 py-4 text-center"><RankBadge pos={pos} /></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0"><Car size={14} className="text-cyan-600 dark:text-cyan-400" /></div>
                            <span className="text-sm font-bold">{r.marca} {r.modelo}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4"><span className="text-xs bg-muted/50 border border-border/50 px-2.5 py-1 rounded-xl font-mono font-medium">{r.placa}</span></td>
                        <td className="px-5 py-4 text-sm font-semibold tabular-nums">{r.total_viajes}</td>
                        <td className="px-5 py-4"><DurBar value={Number(r.duracion_promedio_minutos ?? 0)} max={maxDur} /></td>
                        <td className="px-5 py-4 text-sm text-muted-foreground tabular-nums">{fmtDuracion(r.duracion_max_minutos)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {pageItems.length > 0 && (
            <div className="px-5 py-3.5 border-t border-border/40 flex items-center justify-between gap-4 bg-muted/10">
              <p className="text-xs text-muted-foreground font-medium">{t("reports.common.page_of", { page: pageSafe, total: totalPages })} · {t("reports.viajes.count", { count: filtered.length })}</p>
              <PaginationLite page={pageSafe} count={totalPages} onChange={setPage} size="sm" />
            </div>
          )}
        </div>
      )}

      <ExportDialog open={openExport} onClose={() => setOpenExport(false)} rows={filtered} columns={columnsExport} defaultTitle={t("reports.viajes.export_title")} defaultFilenameBase={`viajes_duracion_${from || "all"}_${to || "all"}`} />
    </div>
  );
}
