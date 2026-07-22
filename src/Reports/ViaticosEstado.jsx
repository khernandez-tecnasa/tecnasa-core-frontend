// src/Reports/ViaticosEstado.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Download, Wallet, Loader2, AlertCircle, Calendar, X, Hash, DollarSign,
} from "lucide-react";
import ExportDialog from "@/components/Exports/ExportDialog";
import { getViaticosEstadoReport } from "@/services/ReportServices";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const fmtDateInput = (d) => { if (!d) return ""; const p = (n) => String(n).padStart(2,"0"); const dt = d instanceof Date ? d : new Date(d); return `${dt.getFullYear()}-${p(dt.getMonth()+1)}-${p(dt.getDate())}`; };
const todayStr = () => fmtDateInput(new Date());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const fmtCurrency = (v) => {
  const n = Number(v ?? 0);
  return n.toLocaleString("es-HN", { style: "currency", currency: "HNL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const RANGE_KEYS = ["all", "today", "7d", "month", "custom"];

const ESTADO_STYLE = {
  Borrador:   { bg: "bg-slate-50 dark:bg-slate-900/30",    border: "border-slate-200 dark:border-slate-700/50",    text: "text-slate-600 dark:text-slate-400",    dot: "bg-slate-400",    dotBg: "bg-slate-400" },
  Pendiente:  { bg: "bg-amber-50 dark:bg-amber-900/20",    border: "border-amber-200 dark:border-amber-800/40",    text: "text-amber-700 dark:text-amber-400",    dot: "bg-amber-500",    dotBg: "bg-amber-500" },
  Aprobado:   { bg: "bg-teal-50 dark:bg-teal-900/20",      border: "border-teal-200 dark:border-teal-800/40",      text: "text-teal-700 dark:text-teal-400",      dot: "bg-teal-500",     dotBg: "bg-teal-500" },
  Rechazado:  { bg: "bg-rose-50 dark:bg-rose-900/20",      border: "border-rose-200 dark:border-rose-800/40",      text: "text-rose-700 dark:text-rose-400",      dot: "bg-rose-500",     dotBg: "bg-rose-500" },
  Liquidado:  { bg: "bg-emerald-50 dark:bg-emerald-900/20",border: "border-emerald-200 dark:border-emerald-800/40",text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500",  dotBg: "bg-emerald-500" },
  Cancelado:  { bg: "bg-red-50 dark:bg-red-900/20",        border: "border-red-200 dark:border-red-800/40",        text: "text-red-700 dark:text-red-400",        dot: "bg-red-500",      dotBg: "bg-red-500" },
};
const DEFAULT_STYLE = { bg: "bg-muted/30", border: "border-border/50", text: "text-muted-foreground", dot: "bg-muted-foreground", dotBg: "bg-muted-foreground" };

export default function ViaticosEstado() {
  const { t } = useTranslation();
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
        const d = await getViaticosEstadoReport({ from: from || undefined, to: to || undefined });
        setRaw(Array.isArray(d) ? d : []);
      } catch (e) { console.error(e); setErr("reports.common.error_detail"); }
      finally { setLoading(false); }
    })();
  }, [from, to]);

  const totalCount  = useMemo(() => raw.reduce((s, r) => s + Number(r.total ?? 0), 0), [raw]);
  const totalMonto  = useMemo(() => raw.reduce((s, r) => s + Number(r.monto_total ?? 0), 0), [raw]);
  const maxMonto    = useMemo(() => Math.max(...raw.map((r) => Number(r.monto_total ?? 0)), 1), [raw]);

  const columnsExport = [
    { label: "Estado",       key: "estado" },
    { label: "Total Viáticos", key: "total" },
    { label: "Monto Total",  get: (r) => fmtCurrency(r.monto_total) },
    { label: "% del total",  get: (r) => totalMonto > 0 ? `${Math.round((Number(r.monto_total) / totalMonto) * 100)}%` : "0%" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button onClick={() => navigate("/admin/reports")} className="p-2 rounded-2xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground shrink-0"><ArrowLeft size={18} /></button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 dark:bg-teal-500/15 ring-1 ring-teal-500/20 shadow-sm shrink-0"><Wallet size={20} className="text-teal-600 dark:text-teal-400" /></div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">{t("reports.viaticosEstado.title")}</h1>
              <p className="text-muted-foreground text-xs font-medium mt-0.5">
                {loading ? t("reports.viaticosEstado.loading") : t("reports.viaticosEstado.count", { count: totalCount, amount: fmtCurrency(totalMonto) })}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => setOpenExport(true)} disabled={raw.length === 0 || loading} className="rounded-2xl px-5 h-10 font-bold gap-2 shrink-0"><Download size={15} /><span className="hidden sm:inline">{t("reports.common.export")}</span></Button>
      </div>

      {/* Filtros */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground shrink-0"><Calendar size={13} />{t("reports.common.period")}</div>
          <div className="flex gap-1.5 flex-wrap">
            {RANGE_KEYS.map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${range === r ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{t(`reports.ranges.${r}`)}</button>
            ))}
          </div>
          {range !== "all" && <button onClick={() => { setRange("all"); setFrom(""); setTo(""); }} className="ml-auto text-[11px] font-semibold text-muted-foreground hover:text-rose-500 flex items-center gap-1"><X size={11} />{t("reports.common.clear")}</button>}
        </div>
        {range === "custom" && (
          <div className="flex items-center gap-2 flex-wrap pt-3">
            <span className="text-xs text-muted-foreground font-medium">{t("reports.common.from")}</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-muted/40 border border-border/50 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all" />
            <span className="text-xs text-muted-foreground font-medium">{t("reports.common.to")}</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-muted/40 border border-border/50 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all" />
          </div>
        )}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-teal-500" /></div>
          <p className="text-sm text-muted-foreground font-medium">{t("reports.viaticosEstado.loading")}</p>
        </div>
      ) : err ? (
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 rounded-3xl p-6 flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div><p className="text-sm font-bold text-rose-700 dark:text-rose-400">{t("reports.common.error_title")}</p><p className="text-xs text-rose-600 mt-0.5">{t(err)}</p></div>
        </div>
      ) : raw.length === 0 ? (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center"><Wallet size={28} className="text-muted-foreground/40" /></div>
          <p className="font-bold text-sm">{t("reports.viaticosEstado.empty_title")}</p>
          <p className="text-xs text-muted-foreground">{t("reports.viaticosEstado.empty_period")}</p>
        </div>
      ) : (
        <>
          {/* Tarjetas de estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {raw.map((r) => {
              const s = ESTADO_STYLE[r.estado] || DEFAULT_STYLE;
              const pctCount = totalCount > 0 ? Math.round((Number(r.total) / totalCount) * 100) : 0;
              const pctMonto = totalMonto > 0 ? Math.round((Number(r.monto_total) / totalMonto) * 100) : 0;
              return (
                <div key={r.estado} className={`${s.bg} ${s.border} border rounded-3xl p-5 space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                      <span className={`text-xs font-black uppercase tracking-wide ${s.text}`}>{r.estado}</span>
                    </div>
                    <span className={`text-xs font-bold ${s.text} opacity-70`}>{pctMonto}%</span>
                  </div>
                  <div className="space-y-0.5">
                    <p className={`text-3xl font-black tabular-nums ${s.text}`}>{r.total}</p>
                    <p className="text-xs text-muted-foreground font-medium">{t("reports.viaticosEstado.card_label")}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><DollarSign size={11} />{fmtCurrency(r.monto_total)}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Hash size={11} />{pctCount}% {t("reports.viaticosEstado.card_pct")}</div>
                  </div>
                  {/* Barra de porcentaje por monto */}
                  <div className="h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${s.dot} rounded-full transition-all duration-700`} style={{ width: `${pctMonto}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barra apilada por monto */}
          {totalMonto > 0 && (
            <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl p-5 shadow-sm space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">{t("reports.viaticosEstado.chart_title")}</p>
              <div className="flex h-4 rounded-full overflow-hidden gap-px">
                {raw.map((r) => {
                  const s = ESTADO_STYLE[r.estado] || DEFAULT_STYLE;
                  const pct = totalMonto > 0 ? Math.round((Number(r.monto_total) / totalMonto) * 100) : 0;
                  return pct > 0 ? (
                    <div key={r.estado} className={`${s.dot} first:rounded-l-full last:rounded-r-full transition-all duration-700`} style={{ width: `${pct}%` }} title={`${r.estado}: ${fmtCurrency(r.monto_total)} (${pct}%)`} />
                  ) : null;
                })}
              </div>
              <div className="flex flex-wrap gap-3">
                {raw.map((r) => {
                  const s = ESTADO_STYLE[r.estado] || DEFAULT_STYLE;
                  return (
                    <div key={r.estado} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                      <span className="text-xs text-muted-foreground">{r.estado} <span className="font-bold text-foreground">{fmtCurrency(r.monto_total)}</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabla */}
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20">
                    {[
                      t("reports.viaticosEstado.col_state"),
                      t("reports.viaticosEstado.col_viaticos"),
                      t("reports.viaticosEstado.col_amount"),
                      t("reports.viaticosEstado.col_pct"),
                    ].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{h}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {raw.map((r) => {
                    const s = ESTADO_STYLE[r.estado] || DEFAULT_STYLE;
                    const pct = totalMonto > 0 ? Math.round((Number(r.monto_total) / totalMonto) * 100) : 0;
                    return (
                      <tr key={r.estado} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-6 rounded-full ${s.dot}`} />
                            <span className={`text-sm font-bold ${s.text}`}>{r.estado}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-black tabular-nums">{r.total}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-black tabular-nums text-teal-600 dark:text-teal-400">{fmtCurrency(r.monto_total)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold tabular-nums w-8 text-right">{pct}%</span>
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[60px]">
                              <div className={`h-full rounded-full ${s.dot} opacity-70 transition-all duration-500`} style={{ width: `${maxMonto > 0 ? (Number(r.monto_total) / maxMonto) * 100 : 0}%` }} />
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

      <ExportDialog open={openExport} onClose={() => setOpenExport(false)} rows={raw} columns={columnsExport} defaultTitle={t("reports.viaticosEstado.export_title")} defaultFilenameBase="viaticos_estado" />
    </div>
  );
}
