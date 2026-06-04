// src/Reports/ConsumoCombustibleVehiculo.jsx
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
  Car,
  Fuel,
} from "lucide-react";

import PaginationLite from "@/components/common/PaginationLite";
import ExportDialog from "@/components/Exports/ExportDialog";
import { getConsumoCombustibleVehiculoReport } from "@/services/ReportServices";
import { Button } from "@/components/ui/button";
import useIsMobile from "@/hooks/useIsMobile";

// ── Helpers ────────────────────────────────────────────────────────────────────
const debounced = (fn, ms = 250) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};
const fmtPct = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? `${v.toFixed(2)}%` : "N/A";
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

const RANGE_LABELS = {
  all: "Todo",
  today: "Hoy",
  "7d": "7 días",
  month: "Este mes",
  custom: "Personalizado",
};

// ── Color semántico del consumo ────────────────────────────────────────────────
// Alto consumo (%) = malo → rose; medio → amber; bajo → emerald
function getConsumptionColor(pct) {
  const v = Number(pct);
  if (!Number.isFinite(v)) return { bar: "bg-muted", text: "text-muted-foreground", badge: "bg-muted/60 text-muted-foreground border-border/50" };
  if (v > 70) return {
    bar:   "bg-rose-500",
    text:  "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40",
  };
  if (v > 40) return {
    bar:   "bg-amber-500",
    text:  "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40",
  };
  return {
    bar:   "bg-emerald-500",
    text:  "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
  };
}

// ── Barra de consumo ───────────────────────────────────────────────────────────
function ConsumptionBar({ value }) {
  const v = Number(value);
  const pct = Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 0;
  const { bar, text } = getConsumptionColor(v);
  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm font-black tabular-nums w-16 text-right shrink-0 ${text}`}>
        {fmtPct(v)}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[60px]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Badge de consumo compacto (mobile) ────────────────────────────────────────
function ConsumptionBadge({ value }) {
  const { badge } = getConsumptionColor(Number(value));
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border ${badge}`}>
      <Fuel size={11} />
      {fmtPct(value)}
    </span>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function ConsumoCombustibleVehiculo() {
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
        const data = await getConsumoCombustibleVehiculoReport({
          from: from || undefined,
          to: to || undefined,
        });
        setRaw(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErr("Error al cargar el reporte. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    })();
  }, [from, to]);

  // Búsqueda con debounce
  const onChangeQuery = useRef(
    debounced((v) => { setPage(1); setQuery(v); }, 250)
  ).current;

  // Filtrado
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return raw;
    return (raw || []).filter((r) =>
      [r.marca, r.modelo, r.placa]
        .map((v) => String(v ?? "").toLowerCase())
        .some((s) => s.includes(q))
    );
  }, [raw, query]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageSafe = Math.min(Math.max(page, 1), totalPages);
  const pageItems = useMemo(() => {
    const start = (pageSafe - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, pageSafe, rowsPerPage]);

  const hasFilters = query || range !== "all";

  // Columnas de exportación
  const columnsExport = [
    { label: "#",                   get: (_r, i) => (pageSafe - 1) * rowsPerPage + i + 1 },
    { label: "Marca",               key: "marca" },
    { label: "Modelo",              key: "modelo" },
    { label: "Placa",               key: "placa" },
    {
      label: "Consumo Promedio (%)",
      key: "promedio_consumo_porcentaje",
      get: (r) => {
        const v = Number(r.promedio_consumo_porcentaje);
        return Number.isFinite(v) ? v.toFixed(2) : "";
      },
    },
  ];

  const filenameBase = `consumo_combustible_${from || "all"}_${to || "all"}`;

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
            <div className="p-2.5 rounded-2xl bg-orange-500/10 dark:bg-orange-500/15 ring-1 ring-orange-500/20 dark:ring-orange-500/30 shadow-sm shadow-orange-500/10 shrink-0">
              <Fuel size={20} className="text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">
                Consumo de Combustible
              </h1>
              <p className="text-muted-foreground text-xs font-medium mt-0.5">
                {loading
                  ? "Cargando..."
                  : `${filtered.length} vehículo${filtered.length !== 1 ? "s" : ""} con registros`}
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setOpenExport(true)}
          disabled={filtered.length === 0 || loading}
          className="rounded-2xl px-5 h-10 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 gap-2 shrink-0 disabled:opacity-50">
          <Download size={15} />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </div>

      {/* ── LEYENDA DE COLORES ── */}
      <div className="flex items-center gap-3 flex-wrap text-[11px] font-semibold text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          Bajo consumo (≤ 40%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          Consumo medio (41–70%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
          Alto consumo (&gt; 70%)
        </span>
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
            placeholder="Buscar por marca, modelo o placa..."
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
            Período
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(RANGE_LABELS).map(([r, label]) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all duration-150 ${
                  range === r
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted/50 dark:bg-slate-800 border-border/50 text-muted-foreground hover:bg-muted dark:hover:bg-slate-700 hover:text-foreground"
                }`}>
                {label}
              </button>
            ))}
          </div>

          {hasFilters && (
            <button
              onClick={() => { setQuery(""); setRange("all"); setFrom(""); setTo(""); setPage(1); }}
              className="ml-auto text-[11px] font-semibold text-muted-foreground hover:text-rose-500 transition-colors flex items-center gap-1">
              <X size={11} />
              Limpiar
            </button>
          )}
        </div>

        {/* Inputs fecha personalizada */}
        {range === "custom" && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs text-muted-foreground font-medium">Desde</span>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="bg-muted/40 dark:bg-slate-800/50 border border-border/50 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all"
            />
            <span className="text-xs text-muted-foreground font-medium">Hasta</span>
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
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center">
            <Loader2 size={22} className="animate-spin text-orange-500" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Cargando reporte...</p>
        </div>
      ) : err ? (
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 rounded-3xl p-6 flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-700 dark:text-rose-400">Error al cargar</p>
            <p className="text-xs text-rose-600 dark:text-rose-500 mt-0.5">{err}</p>
          </div>
        </div>
      ) : (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">

          {pageItems.length === 0 ? (
            /* Estado vacío */
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="w-16 h-16 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
                <Fuel size={28} className="text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">Sin resultados</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {query
                    ? `No hay vehículos que coincidan con "${query}"`
                    : "No hay datos disponibles para el período seleccionado"}
                </p>
              </div>
              {hasFilters && (
                <button
                  onClick={() => { setQuery(""); setRange("all"); setFrom(""); setTo(""); setPage(1); }}
                  className="text-xs font-semibold text-primary hover:underline">
                  Ver todos los vehículos
                </button>
              )}
            </div>
          ) : isMobile ? (
            /* ── MOBILE: lista de tarjetas ── */
            <div className="divide-y divide-border/50">
              {pageItems.map((r, i) => {
                const pos = (pageSafe - 1) * rowsPerPage + i + 1;
                return (
                  <div
                    key={`${r.placa}-${i}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Número */}
                    <span className="text-xs font-semibold text-muted-foreground/50 w-5 text-right shrink-0">
                      {pos}
                    </span>

                    {/* Icono vehículo */}
                    <div className="w-9 h-9 rounded-xl bg-muted/60 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <Car size={16} className="text-muted-foreground" />
                    </div>

                    {/* Info vehículo */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">
                        {[r.marca, r.modelo].filter(Boolean).join(" ") || "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">{r.placa || "—"}</p>
                    </div>

                    {/* Badge de consumo */}
                    <div className="shrink-0">
                      <ConsumptionBadge value={r.promedio_consumo_porcentaje} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── DESKTOP: tabla ── */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20 dark:bg-slate-800/30">
                    <th className="px-5 py-3.5 text-center w-16">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">#</span>
                    </th>
                    <th className="px-5 py-3.5 text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Vehículo</span>
                    </th>
                    <th className="px-5 py-3.5 text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Placa</span>
                    </th>
                    <th className="px-5 py-3.5 text-right">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Consumo Promedio</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((r, i) => {
                    const pos = (pageSafe - 1) * rowsPerPage + i + 1;
                    const pct = Number(r.promedio_consumo_porcentaje);
                    const isHigh = Number.isFinite(pct) && pct > 70;
                    return (
                      <tr
                        key={`${r.placa}-${i}`}
                        className={`border-b border-border/30 last:border-0 transition-colors group ${
                          isHigh
                            ? "hover:bg-rose-50/40 dark:hover:bg-rose-900/10"
                            : "hover:bg-muted/20 dark:hover:bg-slate-800/20"
                        }`}>
                        {/* # */}
                        <td className="px-5 py-4 text-center">
                          <span className="text-xs font-semibold text-muted-foreground">{pos}</span>
                        </td>

                        {/* Vehículo */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 shrink-0 rounded-xl bg-muted/60 dark:bg-slate-800 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/20 flex items-center justify-center transition-all duration-200">
                              <Car size={16} className="text-muted-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">{r.marca || "—"}</p>
                              <p className="text-xs text-muted-foreground">{r.modelo || "—"}</p>
                            </div>
                          </div>
                        </td>

                        {/* Placa */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold font-mono bg-muted/60 dark:bg-slate-800 border border-border/50 text-foreground">
                            <Car size={11} className="text-muted-foreground/60" />
                            {r.placa || "—"}
                          </span>
                        </td>

                        {/* Consumo */}
                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <ConsumptionBar value={r.promedio_consumo_porcentaje} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer paginación */}
          {pageItems.length > 0 && (
            <div className="px-5 py-3.5 border-t border-border/40 flex items-center justify-between gap-4 bg-muted/10 dark:bg-slate-800/20">
              <p className="text-xs text-muted-foreground font-medium">
                Página {pageSafe} de {totalPages} · {filtered.length} vehículo{filtered.length !== 1 ? "s" : ""}
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
        defaultTitle="Consumo de Combustible por Vehículo"
        defaultSheetName="Consumo"
        defaultFilenameBase={filenameBase}
        defaultOrientation="portrait"
        includeGeneratedStamp
        logoUrl="/newLogoTecnasa.png"
      />
    </div>
  );
}
