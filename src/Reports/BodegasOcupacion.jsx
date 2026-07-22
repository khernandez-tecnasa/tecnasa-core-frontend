// src/Reports/BodegasOcupacion.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Download, Warehouse, Loader2, AlertCircle, Search, X, MapPin, Package, CheckCircle2,
} from "lucide-react";
import ExportDialog from "@/components/Exports/ExportDialog";
import { getBodegasOcupacionReport } from "@/services/ReportServices";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

function OccupancyBar({ activos, otros, total }) {
  const pctActivos = total > 0 ? Math.round((activos / total) * 100) : 0;
  const pctOtros   = total > 0 ? Math.round((otros   / total) * 100) : 0;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden bg-muted gap-px min-w-[80px]">
      {pctActivos > 0 && <div className="bg-emerald-500 rounded-l-full transition-all duration-500" style={{ width: `${pctActivos}%` }} title={`Activos: ${activos}`} />}
      {pctOtros > 0 && <div className="bg-amber-400 transition-all duration-500" style={{ width: `${pctOtros}%` }} title={`Otros: ${otros}`} />}
    </div>
  );
}

export default function BodegasOcupacion() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [raw, setRaw]               = useState([]);
  const [q, setQ]                   = useState("");
  const [loading, setLoading]       = useState(true);
  const [err, setErr]               = useState(null);
  const [openExport, setOpenExport] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        const d = await getBodegasOcupacionReport();
        setRaw(Array.isArray(d) ? d : []);
      } catch (e) { console.error(e); setErr("reports.common.error_detail"); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return raw;
    const lq = q.toLowerCase();
    return raw.filter((r) =>
      (r.bodega || "").toLowerCase().includes(lq) ||
      (r.ciudad || "").toLowerCase().includes(lq)
    );
  }, [raw, q]);

  const totals = useMemo(() => ({
    bodegas:   raw.length,
    activos:   raw.reduce((s, r) => s + Number(r.total_activos ?? 0), 0),
    activos_a: raw.reduce((s, r) => s + Number(r.activos_activos ?? 0), 0),
    otros:     raw.reduce((s, r) => s + Number(r.otros ?? 0), 0),
  }), [raw]);

  const maxActivos = useMemo(() => Math.max(...raw.map((r) => Number(r.total_activos ?? 0)), 1), [raw]);

  const columnsExport = [
    { label: "Bodega",          key: "bodega" },
    { label: "Ciudad",          key: "ciudad" },
    { label: "Total Activos",   key: "total_activos" },
    { label: "Estado Activo",   key: "activos_activos" },
    { label: "Otros estados",   key: "otros" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button onClick={() => navigate("/admin/reports")} className="p-2 rounded-2xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground shrink-0"><ArrowLeft size={18} /></button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-stone-500/10 dark:bg-stone-500/15 ring-1 ring-stone-500/20 shadow-sm shrink-0"><Warehouse size={20} className="text-stone-600 dark:text-stone-400" /></div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">{t("reports.bodegas.title")}</h1>
              <p className="text-muted-foreground text-xs font-medium mt-0.5">
                {loading ? t("reports.bodegas.loading") : t("reports.bodegas.count", { warehouses: totals.bodegas, assets: totals.activos })}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => setOpenExport(true)} disabled={raw.length === 0 || loading} className="rounded-2xl px-5 h-10 font-bold gap-2 shrink-0"><Download size={15} /><span className="hidden sm:inline">{t("reports.common.export")}</span></Button>
      </div>

      {/* Búsqueda */}
      {!loading && !err && raw.length > 0 && (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl p-4 shadow-sm">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("reports.bodegas.search_placeholder")}
              className="w-full pl-8 pr-4 py-2 bg-muted/40 border border-border/50 rounded-xl text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all"
            />
            {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={13} /></button>}
          </div>
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="w-12 h-12 rounded-2xl bg-stone-500/10 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-stone-500" /></div>
          <p className="text-sm text-muted-foreground font-medium">{t("reports.bodegas.loading")}</p>
        </div>
      ) : err ? (
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 rounded-3xl p-6 flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div><p className="text-sm font-bold text-rose-700 dark:text-rose-400">{t("reports.common.error_title")}</p><p className="text-xs text-rose-600 mt-0.5">{t(err)}</p></div>
        </div>
      ) : raw.length === 0 ? (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center"><Warehouse size={28} className="text-muted-foreground/40" /></div>
          <p className="font-bold text-sm">{t("reports.bodegas.empty_title")}</p>
          <p className="text-xs text-muted-foreground">{t("reports.bodegas.empty_text")}</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { labelKey: "card_warehouses", value: totals.bodegas,   icon: Warehouse,    color: "text-stone-600 dark:text-stone-400",    iconBg: "bg-stone-500/10" },
              { labelKey: "card_total_assets", value: totals.activos,   icon: Package,      color: "text-slate-600 dark:text-slate-400",    iconBg: "bg-slate-500/10" },
              { labelKey: "card_active", value: totals.activos_a, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-500/10" },
              { labelKey: "card_other", value: totals.otros,     icon: Package,      color: "text-amber-600 dark:text-amber-400",    iconBg: "bg-amber-500/10" },
            ].map(({ labelKey, value, icon: Icon, color, iconBg }) => (
              <div key={labelKey} className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl p-4 space-y-2">
                <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center`}>
                  <Icon size={15} className={color} />
                </div>
                <p className="text-2xl font-black tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground font-medium">{t(`reports.bodegas.${labelKey}`)}</p>
              </div>
            ))}
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-4 px-1">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-xs text-muted-foreground">{t("reports.bodegas.legend_active")}</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-400" /><span className="text-xs text-muted-foreground">{t("reports.bodegas.legend_other")}</span></div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20">
                    {[
                      t("reports.bodegas.col_warehouse"),
                      t("reports.bodegas.col_city"),
                      t("reports.bodegas.col_total"),
                      t("reports.bodegas.col_active"),
                      t("reports.bodegas.col_other"),
                      t("reports.bodegas.col_occupancy"),
                    ].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{h}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const total   = Number(r.total_activos ?? 0);
                    const activos = Number(r.activos_activos ?? 0);
                    const otros   = Number(r.otros ?? 0);
                    const isTop   = total === maxActivos && maxActivos > 0;
                    return (
                      <tr key={r.id} className={`border-b border-border/30 last:border-0 transition-colors ${isTop ? "bg-stone-50/40 dark:bg-stone-900/10" : "hover:bg-muted/20"}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-900/40 flex items-center justify-center shrink-0">
                              <Warehouse size={14} className="text-stone-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{r.bodega || "—"}</p>
                              {isTop && <span className="text-[10px] bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-400 px-1.5 py-0.5 rounded-full font-bold">{t("reports.bodegas.badge_fullest")}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin size={12} />{r.ciudad || "—"}</div>
                        </td>
                        <td className="px-5 py-4"><span className="text-sm font-black tabular-nums">{total}</span></td>
                        <td className="px-5 py-4"><span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{activos}</span></td>
                        <td className="px-5 py-4"><span className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">{otros}</span></td>
                        <td className="px-5 py-4 min-w-[120px]"><OccupancyBar activos={activos} otros={otros} total={total} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((r) => {
              const total   = Number(r.total_activos ?? 0);
              const activos = Number(r.activos_activos ?? 0);
              const otros   = Number(r.otros ?? 0);
              return (
                <div key={r.id} className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-900/40 flex items-center justify-center shrink-0">
                        <Warehouse size={14} className="text-stone-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{r.bodega || "—"}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={10} />{r.ciudad || "—"}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black tabular-nums">{total}</p>
                      <p className="text-[10px] text-muted-foreground">{t("reports.bodegas.mobile_assets")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{activos} {t("reports.bodegas.legend_active").toLowerCase()}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{otros} {t("reports.bodegas.legend_other").toLowerCase()}</span>
                  </div>
                  <OccupancyBar activos={activos} otros={otros} total={total} />
                </div>
              );
            })}
          </div>

          {filtered.length < raw.length && (
            <p className="text-center text-xs text-muted-foreground">{t("reports.bodegas.showing", { shown: filtered.length, total: raw.length })}</p>
          )}
        </>
      )}

      <ExportDialog open={openExport} onClose={() => setOpenExport(false)} rows={filtered} columns={columnsExport} defaultTitle={t("reports.bodegas.export_title")} defaultFilenameBase="bodegas_ocupacion" />
    </div>
  );
}
