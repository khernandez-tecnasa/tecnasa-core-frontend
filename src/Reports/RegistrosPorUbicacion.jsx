// src/Reports/RegistrosPorUbicacion.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  X,
  Download,
  Loader2,
  AlertCircle,
  Calendar,
  MapPin,
  Car,
  User,
  ArrowRight,
  Gauge,
} from "lucide-react";

import PaginationLite from "@/components/common/PaginationLite";
import ExportDialog from "@/components/Exports/ExportDialog";
import { getRegistrosPorUbicacionReport } from "@/services/ReportServices";
import { Button } from "@/components/ui/button";
import useIsMobile from "@/hooks/useIsMobile";
import { useTranslation } from "react-i18next";

// ── Helpers ────────────────────────────────────────────────────────────────────
const debounced = (fn, ms = 250) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

const fmtDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-HN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtDateInput = (d) => {
  if (!d) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};
const todayStr = () => fmtDateInput(new Date());
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const RANGE_KEYS = ["all", "today", "7d", "month", "custom"];

// ── Componente principal ───────────────────────────────────────────────────────
export default function RegistrosPorUbicacion() {
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

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams(search);
    query ? params.set("q", query) : params.delete("q");
    page > 1 ? params.set("p", String(page)) : params.delete("p");
    range !== "all" ? params.set("range", range) : params.delete("range");
    from ? params.set("from", from) : params.delete("from");
    to ? params.set("to", to) : params.delete("to");
    const s = params.toString();
    window.history.replaceState(null, "", s ? `?${s}` : "");
  }, [query, page, range, from, to, search]);

  // Presets de rango
  useEffect(() => {
    if (range === "custom") return;
    if (range === "all") {
      setFrom(""); setTo("");
    } else if (range === "today") {
      const d = todayStr(); setFrom(d); setTo(d);
    } else if (range === "7d") {
      const now = new Date();
      setFrom(fmtDateInput(addDays(now, -6)));
      setTo(todayStr());
    } else if (range === "month") {
      const now = new Date();
      setFrom(fmtDateInput(new Date(now.getFullYear(), now.getMonth(), 1)));
      setTo(todayStr());
    }
    setPage(1);
  }, [range]);

  // Carga de datos
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await getRegistrosPorUbicacionReport({
          from: from || undefined,
          to: to || undefined,
        });
        setRaw(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErr("reports.common.error_detail");
      } finally {
        setLoading(false);
      }
    })();
  }, [from, to]);

  // Búsqueda con debounce
  const onChangeQuery = useRef(
    debounced((v) => { setPage(1); setQuery(v); }, 250)
  ).current;

  // Filtrado frontend
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromTs = from ? new Date(from + "T00:00:00").getTime() : null;
    const toTs = to ? new Date(to + "T23:59:59").getTime() : null;

    return (raw || []).filter((r) => {
      const textOk =
        !q ||
        [r.nombre_empleado, r.vehiculo, r.ubicacion_salida, r.ubicacion_regreso]
          .map((v) => String(v ?? "").toLowerCase())
          .some((s) => s.includes(q));

      if (!textOk) return false;
      if (!fromTs && !toTs) return true;

      const salidaTs = r.fecha_salida ? new Date(r.fecha_salida).getTime() : null;
      if (!salidaTs) return false;
      if (fromTs && salidaTs < fromTs) return false;
      if (toTs && salidaTs > toTs) return false;
      return true;
    });
  }, [raw, query, from, to]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageSafe = Math.min(Math.max(page, 1), totalPages);
  const pageItems = useMemo(() => {
    const start = (pageSafe - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, pageSafe, rowsPerPage]);

  const hasFilters = query || range !== "all";

  const clearFilters = () => {
    setQuery(""); setRange("all"); setFrom(""); setTo(""); setPage(1);
  };

  // Columnas de exportación
  const columnsExport = [
    { label: "#",                get: (_r, i) => (pageSafe - 1) * rowsPerPage + i + 1 },
    { label: "Empleado",         key: "nombre_empleado" },
    { label: "Vehículo",         key: "vehiculo" },
    { label: "Ubicación Salida", key: "ubicacion_salida" },
    { label: "Ubicación Regreso",key: "ubicacion_regreso" },
    { label: "Fecha Salida",     get: (r) => fmtDateTime(r.fecha_salida) },
    { label: "Fecha Regreso",    get: (r) => fmtDateTime(r.fecha_regreso) },
    { label: "Km Salida",        key: "km_salida" },
    { label: "Km Regreso",       key: "km_regreso" },
  ];

  const filenameBase = `ubicacion_registros_${from || "all"}_${to || "all"}`;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate("/admin/reports")}
            className="p-2 rounded-2xl hover:bg-muted/60 dark:hover:bg-slate-800 transition-colors text-muted-foreground hover:text-foreground shrink-0">
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 ring-1 ring-rose-500/20 dark:ring-rose-500/30 shadow-sm shadow-rose-500/10 shrink-0">
              <MapPin size={20} className="text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">
                {t("reports.ubicaciones.title")}
              </h1>
              <p className="text-muted-foreground text-xs font-medium mt-0.5">
                {loading
                  ? t("reports.ubicaciones.loading")
                  : t("reports.ubicaciones.count", { count: filtered.length })}
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setOpenExport(true)}
          disabled={filtered.length === 0 || loading}
          className="rounded-2xl px-5 h-10 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 gap-2 shrink-0 disabled:opacity-50">
          <Download size={15} />
          <span className="hidden sm:inline">{t("reports.common.export")}</span>
        </Button>
      </div>

      {/* ── BARRA DE FILTROS ── */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl p-4 space-y-3 shadow-sm">
        {/* Buscador */}
        <div className="relative group">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none"
          />
          <input
            type="text"
            placeholder={t("reports.ubicaciones.search_placeholder")}
            defaultValue={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            className="w-full bg-muted/40 dark:bg-slate-800/50 border border-border/50 rounded-2xl pl-9 pr-10 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 focus:bg-card transition-all placeholder:text-muted-foreground/50"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Rango de fechas */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground shrink-0">
            <Calendar size={13} />
            {t("reports.common.period")}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {RANGE_KEYS.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all duration-150 ${
                  range === r
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted/50 dark:bg-slate-800 border-border/50 text-muted-foreground hover:bg-muted dark:hover:bg-slate-700 hover:text-foreground"
                }`}>
                {t(`reports.ranges.${r}`)}
              </button>
            ))}
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-[11px] font-semibold text-muted-foreground hover:text-rose-500 transition-colors flex items-center gap-1">
              <X size={11} />
              {t("reports.common.clear")}
            </button>
          )}
        </div>

        {/* Inputs fecha personalizada */}
        {range === "custom" && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs text-muted-foreground font-medium">{t("reports.common.from")}</span>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="bg-muted/40 dark:bg-slate-800/50 border border-border/50 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all"
            />
            <span className="text-xs text-muted-foreground font-medium">{t("reports.common.to")}</span>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              className="bg-muted/40 dark:bg-slate-800/50 border border-border/50 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
        )}
      </div>

      {/* ── CONTENIDO ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 flex items-center justify-center">
            <Loader2 size={22} className="animate-spin text-rose-500" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">{t("reports.ubicaciones.loading")}</p>
        </div>
      ) : err ? (
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 rounded-3xl p-6 flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{t("reports.common.error_title")}</p>
            <p className="text-xs text-rose-600 dark:text-rose-500 mt-0.5">{t(err)}</p>
          </div>
        </div>
      ) : (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">

          {pageItems.length === 0 ? (
            /* Estado vacío */
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="w-16 h-16 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
                <MapPin size={28} className="text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">{t("reports.ubicaciones.empty_title")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {query
                    ? t("reports.ubicaciones.empty_query", { query })
                    : t("reports.ubicaciones.empty_period")}
                </p>
              </div>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-semibold text-primary hover:underline">
                  {t("reports.ubicaciones.see_all")}
                </button>
              )}
            </div>
          ) : isMobile ? (
            /* ── MOBILE: tarjetas ricas ── */
            <div className="divide-y divide-border/50">
              {pageItems.map((r, i) => {
                const pos = (pageSafe - 1) * rowsPerPage + i + 1;
                return (
                  <div
                    key={r.id || i}
                    className="p-4 hover:bg-muted/20 dark:hover:bg-slate-800/30 transition-colors space-y-3">

                    {/* Cabecera: número + empleado + vehículo */}
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-black text-muted-foreground/50 w-5 text-right shrink-0 pt-0.5">
                        {pos}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <User size={12} className="text-muted-foreground/60 shrink-0" />
                            <p className="text-sm font-bold truncate">{r.nombre_empleado || "—"}</p>
                          </div>
                          {r.vehiculo && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono bg-muted/60 dark:bg-slate-800 border border-border/50">
                              <Car size={10} className="text-muted-foreground/60" />
                              {r.vehiculo}
                            </span>
                          )}
                        </div>

                        {/* Ruta: salida → regreso */}
                        <div className="flex items-center gap-1.5 mt-2 text-xs">
                          <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 min-w-0">
                            <MapPin size={11} className="shrink-0" />
                            <span className="truncate font-medium">{r.ubicacion_salida || "—"}</span>
                          </div>
                          <ArrowRight size={11} className="text-muted-foreground/40 shrink-0" />
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 min-w-0">
                            <MapPin size={11} className="shrink-0" />
                            <span className="truncate font-medium">{r.ubicacion_regreso || t("reports.ubicaciones.in_progress")}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fechas y km */}
                    <div className="grid grid-cols-2 gap-2 ml-8">
                      <div className="bg-muted/40 dark:bg-slate-800/50 rounded-xl px-3 py-2 space-y-0.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{t("reports.ubicaciones.mobile_out")}</p>
                        <p className="text-[11px] font-semibold text-foreground">{fmtDateTime(r.fecha_salida)}</p>
                        {r.km_salida != null && (
                          <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                            <Gauge size={9} /> {r.km_salida} km
                          </p>
                        )}
                      </div>
                      <div className="bg-muted/40 dark:bg-slate-800/50 rounded-xl px-3 py-2 space-y-0.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{t("reports.ubicaciones.mobile_in")}</p>
                        <p className="text-[11px] font-semibold text-foreground">{fmtDateTime(r.fecha_regreso)}</p>
                        {r.km_regreso != null && (
                          <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                            <Gauge size={9} /> {r.km_regreso} km
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── DESKTOP: tabla ancha ── */
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20 dark:bg-slate-800/30">
                    {[
                      ["#",                                              "w-12 text-center"],
                      [t("reports.ubicaciones.col_employee"),            "text-left"],
                      [t("reports.ubicaciones.col_vehicle"),             "text-left"],
                      [t("reports.ubicaciones.col_location_out"),        "text-left"],
                      [t("reports.ubicaciones.col_location_in"),         "text-left"],
                      [t("reports.ubicaciones.col_date_out"),            "text-left whitespace-nowrap"],
                      [t("reports.ubicaciones.col_date_in"),             "text-left whitespace-nowrap"],
                      [t("reports.ubicaciones.col_km_out"),              "text-right"],
                      [t("reports.ubicaciones.col_km_in"),               "text-right"],
                    ].map(([label, cls]) => (
                      <th key={label} className={`px-4 py-3.5 ${cls}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                          {label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((r, i) => {
                    const pos = (pageSafe - 1) * rowsPerPage + i + 1;
                    return (
                      <tr
                        key={r.id || i}
                        className="border-b border-border/30 last:border-0 hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors group">

                        {/* # */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-xs font-semibold text-muted-foreground">{pos}</span>
                        </td>

                        {/* Empleado */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-muted/60 dark:bg-slate-800 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/20 flex items-center justify-center shrink-0 transition-colors">
                              <User size={13} className="text-muted-foreground group-hover:text-rose-500 transition-colors" />
                            </div>
                            <span className="text-sm font-bold whitespace-nowrap">
                              {r.nombre_empleado || "—"}
                            </span>
                          </div>
                        </td>

                        {/* Vehículo */}
                        <td className="px-4 py-3.5">
                          {r.vehiculo ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-bold font-mono bg-muted/60 dark:bg-slate-800 border border-border/50">
                              <Car size={11} className="text-muted-foreground/60" />
                              {r.vehiculo}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40 text-xs">—</span>
                          )}
                        </td>

                        {/* Ubicación salida */}
                        <td className="px-4 py-3.5 max-w-[160px]">
                          {r.ubicacion_salida ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <MapPin size={12} className="text-rose-500 shrink-0" />
                              <span className="text-xs font-medium truncate">{r.ubicacion_salida}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40 text-xs">—</span>
                          )}
                        </td>

                        {/* Ubicación regreso */}
                        <td className="px-4 py-3.5 max-w-[160px]">
                          {r.ubicacion_regreso ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <MapPin size={12} className="text-emerald-500 shrink-0" />
                              <span className="text-xs font-medium truncate">{r.ubicacion_regreso}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-500">{t("reports.ubicaciones.in_progress")}</span>
                          )}
                        </td>

                        {/* Fecha salida */}
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {fmtDateTime(r.fecha_salida)}
                          </span>
                        </td>

                        {/* Fecha regreso */}
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {fmtDateTime(r.fecha_regreso)}
                          </span>
                        </td>

                        {/* Km salida */}
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-xs font-mono text-foreground">
                            {r.km_salida ?? "—"}
                          </span>
                        </td>

                        {/* Km regreso */}
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-xs font-mono text-foreground">
                            {r.km_regreso ?? "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer con paginación */}
          {pageItems.length > 0 && (
            <div className="px-5 py-3.5 border-t border-border/40 flex items-center justify-between gap-4 bg-muted/10 dark:bg-slate-800/20">
              <p className="text-xs text-muted-foreground font-medium">
                {t("reports.common.page_of", { page: pageSafe, total: totalPages })} · {t("reports.ubicaciones.count", { count: filtered.length })}
              </p>
              <PaginationLite page={pageSafe} count={totalPages} onChange={setPage} size="sm" />
            </div>
          )}
        </div>
      )}

      {/* ── EXPORT ── */}
      <ExportDialog
        open={openExport}
        onClose={() => setOpenExport(false)}
        rows={filtered}
        pageRows={pageItems}
        columns={columnsExport}
        defaultTitle={t("reports.ubicaciones.export_title")}
        defaultSheetName={t("reports.ubicaciones.export_sheet")}
        defaultFilenameBase={filenameBase}
        defaultOrientation="landscape"
        includeGeneratedStamp
      />
    </div>
  );
}
