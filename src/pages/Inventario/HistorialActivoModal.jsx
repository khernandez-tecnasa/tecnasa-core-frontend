// src/pages/Inventario/HistorialActivoModal.jsx
import { useState, useEffect, useMemo } from "react";
import {
  X,
  History,
  Search,
  Loader2,
  Download,
  SlidersHorizontal,
  Building2,
  Warehouse,
  Users,
  MapPin,
  ChevronDown,
} from "lucide-react";

import { getHistorialUbicaciones } from "../../services/ActivosServices";
import { useToast }                from "../../context/ToastContext";
import useIsMobile                 from "../../hooks/useIsMobile";
import ExportDialog                from "@/components/Exports/ExportDialog";
import { Button }                  from "@/components/ui/button";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(str) {
  if (!str) return null;
  try { return new Date(str).toLocaleString("es-HN", { dateStyle: "medium", timeStyle: "short" }); }
  catch { return str; }
}

const TIPO_COLOR = {
  Cliente:  "bg-primary/10 dark:bg-primary/15 text-primary border-primary/20",
  Bodega:   "bg-muted text-muted-foreground border-border/60",
  Empleado: "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

const TIPO_ICON = {
  Cliente:  <Building2 size={11} />,
  Bodega:   <Warehouse size={11} />,
  Empleado: <Users size={11} />,
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function HistorialActivoModal({ open, onClose, activo }) {
  const { showToast } = useToast();
  const isMobile      = useIsMobile(768);

  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [tipoFilter, setTipoFilter] = useState("");
  const [textFilter, setTextFilter] = useState("");
  const [onlyOpen, setOnlyOpen]     = useState(false);
  const [fromDate, setFromDate]     = useState("");
  const [toDate, setToDate]         = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Export
  const [openExport, setOpenExport] = useState(false);

  // ── Carga ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (open && activo) {
      setTipoFilter(""); setTextFilter(""); setOnlyOpen(false);
      setFromDate(""); setToDate(""); setShowFilters(false);
      load();
    }
  }, [open, activo]);

  async function load() {
    setLoading(true);
    try {
      const data = await getHistorialUbicaciones(activo.id);
      setRows(data || []);
    } catch (err) {
      showToast(err.message || "Error al cargar el historial", "danger");
    } finally {
      setLoading(false);
    }
  }

  // ── Opciones dinámicas de tipo ────────────────────────────────────────────────
  const tipoOptions = useMemo(() => {
    const set = new Set((rows || []).map((r) => r.tipo_destino).filter(Boolean));
    return Array.from(set);
  }, [rows]);

  // ── Filtrado ──────────────────────────────────────────────────────────────────
  const fromDateObj = useMemo(() => fromDate ? new Date(`${fromDate}T00:00:00`) : null, [fromDate]);
  const toDateObj   = useMemo(() => toDate   ? new Date(`${toDate}T23:59:59`)   : null, [toDate]);

  const filtered = useMemo(() => {
    return (rows || []).filter((m) => {
      if (tipoFilter && m.tipo_destino !== tipoFilter) return false;
      if (onlyOpen && m.fecha_fin) return false;
      if (fromDateObj || toDateObj) {
        const inicio = new Date(m.fecha_inicio);
        if (fromDateObj && inicio < fromDateObj) return false;
        if (toDateObj   && inicio > toDateObj)   return false;
      }
      const q = textFilter.trim().toLowerCase();
      if (q) {
        const hay = [m.cliente_nombre, m.site_nombre, m.bodega_nombre, m.empleado_nombre, m.motivo]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, tipoFilter, onlyOpen, textFilter, fromDateObj, toDateObj]);

  const hasActiveFilters = tipoFilter || onlyOpen || fromDate || toDate;

  // ── Columnas exportación ──────────────────────────────────────────────────────
  const EXPORT_COLS = [
    { label: "Destino",      key: "tipo_destino" },
    { label: "Cliente",      key: "cliente_nombre" },
    { label: "Site",         key: "site_nombre" },
    { label: "Bodega",       key: "bodega_nombre" },
    { label: "Fecha inicio", key: "fecha_inicio" },
    { label: "Fecha fin",    key: "fecha_fin" },
    { label: "Motivo",       key: "motivo" },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className={[
          "absolute bg-card dark:bg-slate-900 shadow-2xl border-border/40 flex flex-col animate-in duration-300",
          isMobile
            ? "inset-x-0 bottom-0 h-[95vh] rounded-t-3xl border-t slide-in-from-bottom"
            : "right-0 top-0 h-full w-[560px] border-l slide-in-from-right",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}>

        {/* ── HEADER FIJO ── */}
        <div className="flex-none border-b border-border/60 bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm">
          {/* Título */}
          <div className="flex items-center gap-3 px-6 py-4">
            <div className="p-2 bg-primary/10 dark:bg-primary/15 rounded-2xl ring-1 ring-primary/20">
              <History size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-black tracking-tight">Historial de Ubicaciones</h2>
              {activo && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {activo.nombre} · <span className="font-mono">{activo.codigo}</span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Barra de búsqueda + filtros */}
          {!loading && rows.length > 0 && (
            <div className="px-6 pb-4 space-y-3">
              <div className="flex gap-2">
                {/* Búsqueda texto */}
                <div className="relative flex-1 group">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar en historial..."
                    value={textFilter}
                    onChange={(e) => setTextFilter(e.target.value)}
                    className="w-full bg-muted/40 dark:bg-slate-800/50 border border-border/60 rounded-xl pl-9 pr-8 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/50"
                  />
                  {textFilter && (
                    <button onClick={() => setTextFilter("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-md text-muted-foreground/60 hover:text-foreground">
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Toggle filtros avanzados */}
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={[
                    "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-all shrink-0",
                    hasActiveFilters
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground",
                  ].join(" ")}>
                  <SlidersHorizontal size={14} />
                  {hasActiveFilters && <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">!</span>}
                </button>

                {/* Exportar */}
                <button
                  onClick={() => setOpenExport(true)}
                  disabled={filtered.length === 0}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Download size={14} />
                </button>
              </div>

              {/* Filtros avanzados expandibles */}
              {showFilters && (
                <div className="bg-muted/30 dark:bg-slate-800/30 border border-border/40 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-1 duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Tipo */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo</label>
                      <div className="relative">
                        <select
                          value={tipoFilter}
                          onChange={(e) => setTipoFilter(e.target.value)}
                          className="w-full bg-background dark:bg-slate-900/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all appearance-none pr-8">
                          <option value="">Todos</option>
                          {tipoOptions.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                      </div>
                    </div>

                    {/* Solo actuales */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado</label>
                      <label className="flex items-center gap-2.5 cursor-pointer py-2">
                        <div
                          onClick={() => setOnlyOpen((v) => !v)}
                          className={[
                            "relative w-9 h-5 rounded-full border transition-all duration-200 cursor-pointer shrink-0",
                            onlyOpen ? "bg-primary border-primary" : "bg-muted border-border",
                          ].join(" ")}>
                          <span className={["absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200", onlyOpen ? "left-4" : "left-0.5"].join(" ")} />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">Solo actuales</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Desde</label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full bg-background dark:bg-slate-900/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hasta</label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full bg-background dark:bg-slate-900/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={() => { setTipoFilter(""); setOnlyOpen(false); setFromDate(""); setToDate(""); }}
                      className="text-xs text-muted-foreground hover:text-foreground font-semibold underline-offset-2 hover:underline transition-colors">
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}

              {/* Contador */}
              {filtered.length !== rows.length && (
                <p className="text-xs text-muted-foreground">
                  Mostrando <span className="font-bold text-foreground">{filtered.length}</span> de {rows.length} registros
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── CONTENIDO SCROLLABLE ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain bg-muted/20 dark:bg-slate-900/20">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 h-full py-24">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={18} />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Cargando historial...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 h-full py-24">
              <div className="w-14 h-14 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
                <History size={24} className="text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">Sin historial</p>
                <p className="text-xs text-muted-foreground mt-1">Este activo no tiene registros de ubicación</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 h-full py-24">
              <div className="w-14 h-14 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
                <SlidersHorizontal size={24} className="text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">Sin coincidencias</p>
                <p className="text-xs text-muted-foreground mt-1">Ajusta los filtros para ver resultados</p>
              </div>
            </div>
          ) : (
            <div className="px-6 py-5">
              {/* Timeline */}
              <div className="space-y-0">
                {filtered.map((m, idx) => {
                  const isCurrent  = !m.fecha_fin;
                  const fechaInicio = formatDate(m.fecha_inicio);
                  const fechaFin   = m.fecha_fin ? formatDate(m.fecha_fin) : null;
                  const siteActivo = m.site_activo === 1 || m.site_activo === true || m.site_activo === "1";
                  const tipoCls   = TIPO_COLOR[m.tipo_destino] || TIPO_COLOR.Bodega;
                  const tipoIcon  = TIPO_ICON[m.tipo_destino] || <MapPin size={11} />;

                  // Destino label
                  let destLabel = "—";
                  if (m.cliente_nombre)  destLabel = `${m.cliente_nombre}${m.site_nombre ? ` / ${m.site_nombre}` : ""}`;
                  else if (m.bodega_nombre)  destLabel = m.bodega_nombre;
                  else if (m.empleado_nombre) destLabel = m.empleado_nombre;

                  return (
                    <div key={idx} className="flex gap-4">
                      {/* Línea de tiempo */}
                      <div className="flex flex-col items-center shrink-0 w-5">
                        {idx > 0 && <div className="w-0.5 h-4 bg-border/60" />}
                        <div className={[
                          "w-3 h-3 rounded-full border-2 shrink-0 my-1 z-10",
                          isCurrent
                            ? "bg-emerald-500 border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"
                            : "bg-muted border-border/60",
                        ].join(" ")} />
                        {idx < filtered.length - 1 && <div className="w-0.5 flex-1 bg-border/60 min-h-[20px]" />}
                      </div>

                      {/* Tarjeta */}
                      <div className={[
                        "flex-1 mb-3 rounded-2xl border p-4 transition-all",
                        isCurrent
                          ? "bg-card dark:bg-slate-900 border-emerald-500/20 shadow-sm"
                          : "bg-card/50 dark:bg-slate-900/50 border-border/40",
                      ].join(" ")}>
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full border ${tipoCls}`}>
                              {tipoIcon} {m.tipo_destino || "—"}
                            </span>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Actual
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground/70 font-mono whitespace-nowrap shrink-0">
                            {fechaInicio}
                          </span>
                        </div>

                        {/* Destino */}
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-1.5">
                            <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 mt-0.5 shrink-0">Destino</span>
                            <span className="text-sm font-semibold text-foreground leading-snug">
                              {destLabel}
                              {m.site_nombre && !siteActivo && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                  Site inactivo
                                </span>
                              )}
                            </span>
                          </div>

                          {m.motivo && (
                            <div className="flex items-start gap-1.5">
                              <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 mt-0.5 shrink-0">Motivo</span>
                              <span className="text-sm text-muted-foreground leading-snug">{m.motivo}</span>
                            </div>
                          )}

                          {fechaFin && (
                            <p className="text-[11px] text-muted-foreground/60 italic mt-1">
                              Hasta: {fechaFin}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        {!loading && rows.length > 0 && (
          <div className="flex-none px-6 py-3 border-t border-border/50 bg-card/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{filtered.length}</span>{" "}
              {filtered.length !== rows.length && `de ${rows.length} `}
              registro{filtered.length !== 1 ? "s" : ""}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenExport(true)}
              disabled={filtered.length === 0}
              className="rounded-xl gap-2 text-xs font-bold h-8">
              <Download size={12} /> Exportar
            </Button>
          </div>
        )}
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={openExport}
        onClose={() => setOpenExport(false)}
        rows={filtered}
        columns={EXPORT_COLS}
        defaultTitle={`Historial de Ubicaciones - ${activo?.codigo}`}
        defaultFilenameBase={`historial_${activo?.codigo}`}
      />
    </div>
  );
}
