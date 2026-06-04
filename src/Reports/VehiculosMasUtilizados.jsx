// src/Reports/VehiculosMasUtilizados.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  X,
  Download,
  Car,
  Loader2,
  AlertCircle,
  Trophy,
} from "lucide-react";

import PaginationLite from "@/components/common/PaginationLite";
import ExportDialog from "@/components/Exports/ExportDialog";
import { getVehiculosMasUtilizadosReport } from "@/services/ReportServices";
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

const filenameBase = `vehiculos_top_${new Date().toISOString().slice(0, 10)}`;

// ── Badge de posición (top 3 con medalla) ─────────────────────────────────────
function RankBadge({ pos }) {
  if (pos === 1)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-black ring-1 ring-amber-200 dark:ring-amber-800/40">
        1
      </span>
    );
  if (pos === 2)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black ring-1 ring-slate-200 dark:ring-slate-700">
        2
      </span>
    );
  if (pos === 3)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-black ring-1 ring-orange-200 dark:ring-orange-800/40">
        3
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-semibold text-muted-foreground">
      {pos}
    </span>
  );
}

// ── Barra de uso proporcional ──────────────────────────────────────────────────
function UsageBar({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-black text-primary tabular-nums w-8 text-right shrink-0">
        {value ?? 0}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[60px]">
        <div
          className="h-full rounded-full bg-primary/70 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function VehiculosMasUtilizados() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const isMobile = useIsMobile();

  const qs = useMemo(() => new URLSearchParams(search), [search]);
  const [query, setQuery] = useState(qs.get("q") || "");
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
    const s = params.toString();
    window.history.replaceState(null, "", s ? `?${s}` : "");
  }, [query, page, search]);

  // Carga de datos
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await getVehiculosMasUtilizadosReport();
        setRaw(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErr("Error al cargar el reporte. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Búsqueda con debounce
  const onChangeQuery = useRef(
    debounced((v) => {
      setPage(1);
      setQuery(v);
    }, 250)
  ).current;

  // Filtrado
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter(
      (r) =>
        String(r.marca || "").toLowerCase().includes(q) ||
        String(r.modelo || "").toLowerCase().includes(q) ||
        String(r.placa || "").toLowerCase().includes(q)
    );
  }, [raw, query]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageSafe = Math.min(Math.max(page, 1), totalPages);
  const pageItems = useMemo(() => {
    const start = (pageSafe - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, pageSafe, rowsPerPage]);

  const maxUsos = useMemo(() => Math.max(...filtered.map((r) => r.total_usos ?? 0), 1), [filtered]);

  // Columnas de exportación
  const columnsExport = [
    { label: "#",           get: (_r, i) => (pageSafe - 1) * rowsPerPage + i + 1 },
    { label: "Marca",       key: "marca" },
    { label: "Modelo",      key: "modelo" },
    { label: "Placa",       key: "placa" },
    { label: "Total Usos",  key: "total_usos" },
  ];

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
            <div className="p-2.5 rounded-2xl bg-violet-500/10 dark:bg-violet-500/15 ring-1 ring-violet-500/20 dark:ring-violet-500/30 shadow-sm shadow-violet-500/10 shrink-0">
              <Trophy size={20} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">
                Vehículos más Utilizados
              </h1>
              <p className="text-muted-foreground text-xs font-medium mt-0.5">
                {loading
                  ? "Cargando..."
                  : `${filtered.length} vehículo${filtered.length !== 1 ? "s" : ""} en el ranking`}
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

      {/* ── TOOLBAR: Buscador ── */}
      <div className="relative group max-w-sm">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none"
        />
        <input
          type="text"
          placeholder="Buscar por marca, modelo o placa..."
          defaultValue={query}
          onChange={(e) => onChangeQuery(e.target.value)}
          className="w-full bg-card border border-border/60 rounded-2xl pl-9 pr-10 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/50 shadow-sm"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setPage(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── CONTENIDO ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 dark:bg-violet-500/15 flex items-center justify-center">
            <Loader2 size={22} className="animate-spin text-violet-500" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Cargando ranking...</p>
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
                <Car size={28} className="text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">Sin resultados</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {query
                    ? `No hay vehículos que coincidan con "${query}"`
                    : "No hay datos disponibles para el ranking"}
                </p>
              </div>
              {query && (
                <button
                  onClick={() => { setQuery(""); setPage(1); }}
                  className="text-xs font-semibold text-primary hover:underline">
                  Ver todos los vehículos
                </button>
              )}
            </div>
          ) : isMobile ? (
            /* ── MOBILE: Lista de tarjetas ── */
            <div className="divide-y divide-border/50">
              {pageItems.map((r, i) => {
                const pos = (pageSafe - 1) * rowsPerPage + i + 1;
                return (
                  <div key={`${r.placa}-${i}`} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Posición */}
                    <div className="shrink-0">
                      <RankBadge pos={pos} />
                    </div>

                    {/* Info vehículo */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-muted/60 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Car size={16} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">
                          {[r.marca, r.modelo].filter(Boolean).join(" ") || "—"}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">{r.placa || "—"}</p>
                      </div>
                    </div>

                    {/* Usos */}
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-black text-primary">{r.total_usos ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">usos</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── DESKTOP: Tabla ── */
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
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Total de Usos</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((r, i) => {
                    const pos = (pageSafe - 1) * rowsPerPage + i + 1;
                    const isTop3 = pos <= 3;
                    return (
                      <tr
                        key={`${r.placa}-${i}`}
                        className={`border-b border-border/30 last:border-0 transition-colors group ${
                          isTop3
                            ? "hover:bg-violet-50/50 dark:hover:bg-violet-900/10"
                            : "hover:bg-muted/20 dark:hover:bg-slate-800/20"
                        }`}>
                        {/* Posición */}
                        <td className="px-5 py-4 text-center">
                          <RankBadge pos={pos} />
                        </td>

                        {/* Vehículo */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all duration-200 ${
                              isTop3
                                ? "bg-violet-100 dark:bg-violet-900/30 group-hover:ring-1 ring-violet-200 dark:ring-violet-800/40"
                                : "bg-muted/60 dark:bg-slate-800 group-hover:bg-muted dark:group-hover:bg-slate-700"
                            }`}>
                              <Car size={16} className={isTop3 ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">
                                {r.marca || "—"}
                              </p>
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

                        {/* Total usos */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end">
                            <UsageBar value={r.total_usos ?? 0} max={maxUsos} />
                          </div>
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
                Página {pageSafe} de {totalPages} · {filtered.length} vehículo{filtered.length !== 1 ? "s" : ""}
              </p>
              <PaginationLite page={pageSafe} count={totalPages} onChange={setPage} size="sm" />
            </div>
          )}
        </div>
      )}

      {/* ── EXPORT MODAL ── */}
      <ExportDialog
        open={openExport}
        onClose={() => setOpenExport(false)}
        rows={filtered}
        columns={columnsExport}
        defaultTitle="Vehículos más Utilizados"
        defaultSheetName="Vehículos"
        defaultFilenameBase={filenameBase}
        defaultOrientation="portrait"
      />
    </div>
  );
}
