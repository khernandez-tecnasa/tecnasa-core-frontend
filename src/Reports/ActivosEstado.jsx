// src/Reports/ActivosEstado.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Download, Package, Loader2, AlertCircle, Tag,
} from "lucide-react";
import ExportDialog from "@/components/Exports/ExportDialog";
import { getActivosEstadoReport } from "@/services/ReportServices";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const ESTATUS_STYLE = {
  Activo:      { bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800/40", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  Inactivo:    { bg: "bg-slate-50 dark:bg-slate-900/30",     border: "border-slate-200 dark:border-slate-700/40",     text: "text-slate-600 dark:text-slate-400",     dot: "bg-slate-400" },
  Mantenimiento:{ bg: "bg-amber-50 dark:bg-amber-900/20",   border: "border-amber-200 dark:border-amber-800/40",     text: "text-amber-700 dark:text-amber-400",     dot: "bg-amber-500" },
  Dañado:      { bg: "bg-rose-50 dark:bg-rose-900/20",       border: "border-rose-200 dark:border-rose-800/40",       text: "text-rose-700 dark:text-rose-400",       dot: "bg-rose-500" },
  Dado_de_baja:{ bg: "bg-red-50 dark:bg-red-900/20",         border: "border-red-200 dark:border-red-800/40",         text: "text-red-700 dark:text-red-400",         dot: "bg-red-500" },
};
const DEFAULT_STYLE = { bg: "bg-muted/30", border: "border-border/50", text: "text-muted-foreground", dot: "bg-muted-foreground" };

const TIPO_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-cyan-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-green-500",
  "bg-yellow-500", "bg-red-500", "bg-purple-500", "bg-sky-500",
];

export default function ActivosEstado() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [byEstatus, setByEstatus] = useState([]);
  const [byTipo, setByTipo]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState(null);
  const [openExportEstatus, setOpenExportEstatus] = useState(false);
  const [openExportTipo,    setOpenExportTipo]    = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        const d = await getActivosEstadoReport();
        setByEstatus(Array.isArray(d?.byEstatus) ? d.byEstatus : []);
        setByTipo(Array.isArray(d?.byTipo) ? d.byTipo : []);
      } catch (e) { console.error(e); setErr("reports.common.error_detail"); }
      finally { setLoading(false); }
    })();
  }, []);

  const totalEstatus = useMemo(() => byEstatus.reduce((s, r) => s + Number(r.total ?? 0), 0), [byEstatus]);
  const totalTipo    = useMemo(() => byTipo.reduce((s, r) => s + Number(r.total ?? 0), 0), [byTipo]);
  const maxTipo      = useMemo(() => Math.max(...byTipo.map((r) => Number(r.total ?? 0)), 1), [byTipo]);

  const columnsEstatus = [
    { label: "Estatus", key: "estatus" },
    { label: "Total",   key: "total" },
    { label: "% del Total", get: (r) => totalEstatus > 0 ? `${Math.round((Number(r.total) / totalEstatus) * 100)}%` : "0%" },
  ];
  const columnsTipo = [
    { label: "Tipo",    key: "tipo" },
    { label: "Total",   key: "total" },
    { label: "% del Total", get: (r) => totalTipo > 0 ? `${Math.round((Number(r.total) / totalTipo) * 100)}%` : "0%" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button onClick={() => navigate("/admin/reports")} className="p-2 rounded-2xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground shrink-0"><ArrowLeft size={18} /></button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-500/10 dark:bg-slate-500/15 ring-1 ring-slate-500/20 shadow-sm shrink-0"><Package size={20} className="text-slate-600 dark:text-slate-400" /></div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">{t("reports.activosEstado.title")}</h1>
              <p className="text-muted-foreground text-xs font-medium mt-0.5">
                {loading ? t("reports.activosEstado.loading") : t("reports.activosEstado.count", { count: totalEstatus })}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => setOpenExportEstatus(true)} disabled={byEstatus.length === 0 || loading} className="rounded-2xl px-4 h-10 font-bold gap-2 text-sm"><Download size={14} /><span className="hidden sm:inline">{t("reports.activosEstado.export_by_status")}</span></Button>
          <Button onClick={() => setOpenExportTipo(true)} disabled={byTipo.length === 0 || loading} className="rounded-2xl px-4 h-10 font-bold gap-2 text-sm"><Download size={14} /><span className="hidden sm:inline">{t("reports.activosEstado.export_by_type")}</span></Button>
        </div>
      </div>

      {/* Nota: sin filtros de fecha */}
      <div className="bg-muted/30 border border-border/40 rounded-2xl px-4 py-2.5 flex items-center gap-2">
        <Tag size={13} className="text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{t("reports.activosEstado.note")}</p>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="w-12 h-12 rounded-2xl bg-slate-500/10 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-slate-500" /></div>
          <p className="text-sm text-muted-foreground font-medium">{t("reports.activosEstado.loading")}</p>
        </div>
      ) : err ? (
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 rounded-3xl p-6 flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div><p className="text-sm font-bold text-rose-700 dark:text-rose-400">{t("reports.common.error_title")}</p><p className="text-xs text-rose-600 mt-0.5">{t(err)}</p></div>
        </div>
      ) : (
        <>
          {/* Sección: Por Estatus */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">{t("reports.activosEstado.section_status")}</h2>

            {byEstatus.length === 0 ? (
              <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl flex items-center justify-center py-10">
                <p className="text-sm text-muted-foreground">{t("reports.activosEstado.empty_status")}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {byEstatus.map((r) => {
                    const s = ESTATUS_STYLE[r.estatus] || DEFAULT_STYLE;
                    const pct = totalEstatus > 0 ? Math.round((Number(r.total) / totalEstatus) * 100) : 0;
                    return (
                      <div key={r.estatus} className={`${s.bg} ${s.border} border rounded-3xl p-5 space-y-3`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                            <span className={`text-xs font-black uppercase tracking-wide ${s.text}`}>{r.estatus}</span>
                          </div>
                          <span className={`text-xs font-bold ${s.text} opacity-70`}>{pct}%</span>
                        </div>
                        <p className={`text-3xl font-black tabular-nums ${s.text}`}>{r.total}</p>
                        <div className="h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${s.dot} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalEstatus > 0 && (
                  <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl p-5 shadow-sm space-y-3">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">{t("reports.activosEstado.chart_title")}</p>
                    <div className="flex h-4 rounded-full overflow-hidden gap-px">
                      {byEstatus.map((r) => {
                        const s = ESTATUS_STYLE[r.estatus] || DEFAULT_STYLE;
                        const pct = Math.round((Number(r.total) / totalEstatus) * 100);
                        return pct > 0 ? (
                          <div key={r.estatus} className={`${s.dot} first:rounded-l-full last:rounded-r-full transition-all duration-700`} style={{ width: `${pct}%` }} title={`${r.estatus}: ${r.total} (${pct}%)`} />
                        ) : null;
                      })}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {byEstatus.map((r) => {
                        const s = ESTATUS_STYLE[r.estatus] || DEFAULT_STYLE;
                        return (
                          <div key={r.estatus} className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                            <span className="text-xs text-muted-foreground">{r.estatus} <span className="font-bold text-foreground">{r.total}</span></span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sección: Por Tipo */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">{t("reports.activosEstado.section_type")}</h2>

            {byTipo.length === 0 ? (
              <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl flex items-center justify-center py-10">
                <p className="text-sm text-muted-foreground">{t("reports.activosEstado.empty_type")}</p>
              </div>
            ) : (
              <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/20">
                        {[
                          t("reports.activosEstado.col_type"),
                          t("reports.activosEstado.col_total"),
                          t("reports.activosEstado.col_dist"),
                        ].map((h) => (
                          <th key={h} className="px-5 py-3.5 text-left">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{h}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {byTipo.map((r, i) => {
                        const dotColor = TIPO_COLORS[i % TIPO_COLORS.length];
                        const pct = totalTipo > 0 ? Math.round((Number(r.total) / totalTipo) * 100) : 0;
                        return (
                          <tr key={r.tipo} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-6 rounded-full ${dotColor}`} />
                                <span className="text-sm font-bold">{r.tipo || "—"}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-sm font-black tabular-nums">{r.total}</span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold tabular-nums w-8 text-right">{pct}%</span>
                                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[60px]">
                                  <div className={`h-full rounded-full ${dotColor} opacity-70 transition-all duration-500`} style={{ width: `${maxTipo > 0 ? (Number(r.total) / maxTipo) * 100 : 0}%` }} />
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
            )}
          </div>
        </>
      )}

      <ExportDialog open={openExportEstatus} onClose={() => setOpenExportEstatus(false)} rows={byEstatus} columns={columnsEstatus} defaultTitle={t("reports.activosEstado.export_title_status")} defaultFilenameBase="activos_estatus" />
      <ExportDialog open={openExportTipo} onClose={() => setOpenExportTipo(false)} rows={byTipo} columns={columnsTipo} defaultTitle={t("reports.activosEstado.export_title_type")} defaultFilenameBase="activos_tipo" />
    </div>
  );
}
