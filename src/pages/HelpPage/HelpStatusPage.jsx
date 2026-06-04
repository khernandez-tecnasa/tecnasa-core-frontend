// src/pages/HelpPage/HelpStatusPage.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Zap, RefreshCw, AlertTriangle, CheckCircle2, AlertCircle,
  Wrench, TrendingDown, Info, Clock, Loader2, ArrowLeft,
} from "lucide-react";
import { getOverallStatus, listServices, statusToJoyColor } from "@/services/help.api.js";

/* ── Helpers ─────────────────────────────────────────────────────── */
const groupBy = (arr, key) =>
  (arr || []).reduce((acc, it) => {
    const g = it[key] || "General";
    acc[g] = acc[g] || [];
    acc[g].push(it);
    return acc;
  }, {});

const SEVERITY = { neutral: 0, success: 1, warning: 2, danger: 3 };
const worstColor = (colors) =>
  (colors || []).reduce((w, c) => (SEVERITY[c] > SEVERITY[w] ? c : w), "neutral");

function fmtDateTime(d) {
  try {
    return new Date(d).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return null; }
}

function timeAgo(input) {
  if (!input) return null;
  const s = Math.floor((Date.now() - new Date(input).getTime()) / 1000);
  if (s < 60) return "hace unos segundos";
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

/* Mapear colores de Joy a Tailwind */
const STATUS_DOT = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-rose-500",
  neutral: "bg-muted-foreground/40",
};
const STATUS_BADGE = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  danger:  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  neutral: "bg-muted/60 text-muted-foreground",
};
const GROUP_BAR = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-rose-500",
  neutral: "bg-muted-foreground/30",
};

function StatusIcon({ status }) {
  const s = String(status || "").toLowerCase();
  const cls = "shrink-0";
  if (s.includes("mantenimiento")) return <Wrench size={13} className={cls} />;
  if (s.includes("degrad"))        return <TrendingDown size={13} className={cls} />;
  if (/(incident|outage|down|falla)/i.test(s)) return <AlertCircle size={13} className={cls} />;
  if (/(ok|operacional|online|up)/i.test(s))   return <CheckCircle2 size={13} className={cls} />;
  return <Info size={13} className={cls} />;
}

/* ── Componente principal ────────────────────────────────────────── */
export default function HelpStatusPage() {
  const [loading, setLoading]     = useState(true);
  const [overall, setOverall]     = useState(null);
  const [services, setServices]   = useState([]);
  const [error, setError]         = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [ov, svcs] = await Promise.all([getOverallStatus(), listServices()]);
      setOverall(ov || null);
      setServices(Array.isArray(svcs) ? svcs : []);
    } catch (e) {
      setError(e?.message || "No se pudo cargar el estado del sistema.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const groups = useMemo(() => groupBy(services, "group_name"), [services]);
  const summary = useMemo(() => {
    const c = { success: 0, warning: 0, danger: 0, neutral: 0 };
    services.forEach((s) => { const k = statusToJoyColor(s.status); c[k] = (c[k] || 0) + 1; });
    return c;
  }, [services]);

  const overallColor = statusToJoyColor(overall?.overall_status);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="space-y-3">
        <RouterLink
          to="/admin/help"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={15} /> Centro de ayuda
        </RouterLink>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 shrink-0">
            <Zap size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Estado del sistema
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Monitoreo en tiempo real de todos los servicios
            </p>
          </div>
        </div>

        <button
          onClick={fetchAll}
          disabled={refreshing}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-border/60 bg-card text-sm font-bold hover:bg-muted/60 disabled:opacity-60 transition-all shrink-0">
          {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Actualizar
        </button>
      </div>
      </div>

      {/* ESTADO GENERAL */}
      {!loading && !error && overall && (
        <div className={`bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${STATUS_DOT[overallColor] || STATUS_DOT.neutral}`} />
              <div>
                <p className="font-bold text-sm">Estado general</p>
                {overall.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{overall.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${STATUS_BADGE[overallColor] || STATUS_BADGE.neutral}`}>
                <StatusIcon status={overall?.overall_status} />
                {overall?.overall_status || "—"}
              </span>
              {overall?.status_timestamp && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={11} />
                  {timeAgo(overall.status_timestamp)} · {fmtDateTime(overall.status_timestamp)}
                </span>
              )}
            </div>
          </div>

          {/* Resumen chips */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/40">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 self-center mr-1">Resumen:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> OK: {summary.success}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" /> Degradado/Mantenimiento: {summary.warning}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" /> Incidente: {summary.danger}
            </span>
          </div>
        </div>
      )}

      {/* GRUPOS DE SERVICIOS */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl overflow-hidden animate-pulse">
              <div className="h-1.5 bg-muted/50" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-muted/60 dark:bg-slate-700/60 rounded-lg w-2/5" />
                <div className="h-px bg-border/40" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-3 bg-muted/40 dark:bg-slate-700/40 rounded-lg w-4/5" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 rounded-2xl">
          <AlertTriangle size={18} className="text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(groups).map(([group, items]) => {
            const sorted = [...items].sort(
              (a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999) || String(a.name).localeCompare(String(b.name))
            );
            const groupColor = worstColor(sorted.map((s) => statusToJoyColor(s.status)));

            return (
              <div key={group} className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
                {/* Barra de color superior */}
                <div className={`h-1.5 ${GROUP_BAR[groupColor] || GROUP_BAR.neutral}`} />

                <div className="p-5">
                  {/* Cabecera del grupo */}
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-black text-sm">{group || "General"}</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_BADGE[groupColor] || STATUS_BADGE.neutral}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[groupColor] || STATUS_DOT.neutral}`} />
                      {groupColor === "success" ? "OK" : groupColor === "warning" ? "Atención" : groupColor === "danger" ? "Incidente" : "—"}
                    </span>
                  </div>

                  <div className="h-px bg-border/40 mb-4" />

                  {/* Servicios */}
                  <div className="space-y-3">
                    {sorted.map((s) => {
                      const c = statusToJoyColor(s.status);
                      return (
                        <div key={s.id} className="flex items-start gap-2.5">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STATUS_DOT[c] || STATUS_DOT.neutral}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold leading-snug">{s.name}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[c] || STATUS_BADGE.neutral}`}>
                                <StatusIcon status={s.status} />
                                {s.status}
                              </span>
                              {s.lastUpdated && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Clock size={9} /> {timeAgo(s.lastUpdated)}
                                </span>
                              )}
                            </div>
                            {s.message && (
                              <p className="text-xs text-muted-foreground mt-1">{s.message}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
