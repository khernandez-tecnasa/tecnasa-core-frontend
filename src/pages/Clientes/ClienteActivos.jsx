// src/pages/Clientes/ClienteActivos.jsx
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  X,
  Monitor,
  Loader2,
  Edit3,
  ArrowLeftRight,
  History,
  QrCode,
  Save,
  AlertTriangle,
  Download,
  MoreVertical,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";

import HistorialActivoModal from "../Inventario/HistorialActivoModal";
import MoverActivoModal     from "../Inventario/MoverActivoModal";
import ActivoFormModal      from "@pages/Inventario/ActivoFormModal";
import StyledQR             from "@/components/QRCode/StyledQR";
import useRowFocusHighlight from "@/hooks/useRowFocusHighlight";
import useIsMobile          from "@/hooks/useIsMobile";

import { useToast }               from "@/context/ToastContext";
import { useAuth }                from "@/context/AuthContext";
import { getActivosByCliente }    from "@/services/ActivosServices";
import { getPublicLinkForActivo } from "@/services/PublicLinksService";
import { getBodegas }             from "@/services/BodegasServices";
import { moverABodega }           from "@/services/UbicacionesServices";
import { ESTATUS_COLOR, ESTATUS_ACTIVO, TIPOS_ACTIVO, toOptions } from "@/constants/inventario";
import { Button }                 from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoTecnasa from "@/assets/newLogoTecnasaBlack.png";

// ── Catálogos (opciones para filtros) ────────────────────────────────────────

const ESTATUS_OPTIONS = [{ value: "", label: "Todos los estados" }, ...toOptions(ESTATUS_ACTIVO)];
const TIPO_OPTIONS    = [{ value: "", label: "Todos los tipos" },   ...toOptions(TIPOS_ACTIVO)];

// ── Helper: mapear ESTATUS_COLOR (joy) → clases Tailwind ─────────────────────

const ESTATUS_TW = {
  success: "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  danger:  "bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
  primary: "bg-primary/10 dark:bg-primary/15 text-primary border-primary/20",
  neutral: "bg-muted text-muted-foreground border-border/60",
};

function EstatusBadge({ estatus }) {
  const joyColor = ESTATUS_COLOR?.[estatus] || "neutral";
  const tw       = ESTATUS_TW[joyColor] || ESTATUS_TW.neutral;
  if (!estatus) return <span className="text-muted-foreground/50 text-sm">—</span>;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full border ${tw}`}>
      {estatus}
    </span>
  );
}

const normalize = (val) =>
  (val || "").toString().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

// ── SearchableSelect ──────────────────────────────────────────────────────────

function SearchableSelect({ value, onChange, onBlur, options, placeholder, disabled, emptyLabel = "Sin resultados" }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const ref               = useRef(null);

  const filtered = useMemo(
    () => options.filter((o) => (o.label || "").toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );
  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); onBlur?.(); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onBlur]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setOpen((v) => !v); setQuery(""); }}
        className={[
          "w-full flex items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 outline-none text-left",
          "bg-background dark:bg-slate-900/60",
          open ? "border-primary/70 ring-2 ring-primary/20 shadow-sm" : "border-border hover:border-primary/40 hover:shadow-sm",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        ].join(" ")}>
        <span className={selected ? "font-medium text-foreground" : "text-muted-foreground text-sm"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={15} className={`text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-[200] top-full mt-1.5 w-full rounded-2xl border border-border/80 bg-card dark:bg-slate-900 shadow-2xl shadow-black/15 dark:shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-150">
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-muted/40 dark:bg-slate-800/80 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none placeholder:text-muted-foreground/60 focus:ring-1 ring-primary/20 transition-all"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto overscroll-contain py-1.5 px-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-6 text-muted-foreground">
                <Search size={16} className="opacity-40" />
                <p className="text-xs">{emptyLabel}</p>
              </div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={[
                    "w-full text-left px-3 py-2 text-sm rounded-xl transition-all duration-150",
                    String(value) === String(o.value)
                      ? "bg-primary/10 dark:bg-primary/20 text-primary font-semibold"
                      : "hover:bg-muted/60 dark:hover:bg-slate-800 text-foreground",
                  ].join(" ")}>
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ClienteActivos({ onCountChange }) {
  const { t }                                     = useTranslation();
  const { id }                                    = useParams();
  const [searchParams, setSearchParams]           = useSearchParams();
  const isMobile                                  = useIsMobile(768);
  const { showToast }                             = useToast();
  const { userData, checkingSession, hasPermiso } = useAuth();

  const isAdmin = useCallback(
    () => (userData?.rol || userData?.role || "").toLowerCase() === "admin" || Boolean(userData?.isAdmin) || Boolean(userData?.es_admin),
    [userData]
  );
  const can = useCallback((p) => isAdmin() || hasPermiso(p), [isAdmin, hasPermiso]);

  const canView        = can("ver_activos");
  const canEdit        = can("editar_activos");
  const canMove        = can("mover_activos");
  const canViewHistory = can("ver_historial_activos");
  const canQR          = can("crear_QR");

  const qrRef = useRef();

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter]     = useState("");

  const [selectedIds, setSelectedIds]   = useState([]);
  const hasSelection = selectedIds.length > 0;

  const [openEdit, setOpenEdit]           = useState(false);
  const [openMover, setOpenMover]         = useState(false);
  const [openHistorial, setOpenHistorial] = useState(false);
  const [openQR, setOpenQR]               = useState(false);
  const [openBulkMover, setOpenBulkMover] = useState(false);

  const [bodegas, setBodegas]               = useState([]);
  const [loadingBodegas, setLoadingBodegas] = useState(false);
  const [bulkBodega, setBulkBodega]         = useState("");
  const [bulkMotivo, setBulkMotivo]         = useState("");
  const [bulkSaving, setBulkSaving]         = useState(false);

  const [editing, setEditing]                       = useState(null);
  const [activoSeleccionado, setActivoSeleccionado] = useState(null);
  const [activoQR, setActivoQR]                     = useState(null);
  const [publicLink, setPublicLink]                 = useState("");

  // ── Carga ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (checkingSession) { setLoading(true); return; }
    if (!canView) { setError(null); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const activos = await getActivosByCliente(id);
      const arr = Array.isArray(activos) ? activos : [];
      setRows(arr);
      setSelectedIds([]);
      onCountChange?.(arr.length);
    } catch (err) {
      setError(err?.message || t("clients.assets.errors.load_failed"));
    } finally {
      setLoading(false);
    }
  }, [id, checkingSession, canView]);

  useEffect(() => { load(); }, [load]);

  const clienteNombre = useMemo(() => rows[0]?.cliente_nombre || "", [rows]);

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const s = normalize(search);
    return (rows || []).filter((r) => {
      const matchSearch = normalize(r.codigo).includes(s) || normalize(r.nombre).includes(s) || normalize(r.modelo).includes(s) || normalize(r.serial_number).includes(s) || normalize(r.site_nombre).includes(s);
      const matchStatus = !statusFilter || r.estatus === statusFilter;
      const matchType   = !typeFilter   || r.tipo    === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [rows, search, statusFilter, typeFilter]);

  const hasActiveFilters = Boolean(statusFilter || typeFilter);

  // ── Focus highlight ──────────────────────────────────────────────────────────
  const { highlightId, focusedRef, focusByToken } = useRowFocusHighlight({
    rows: filtered,
    matchRow: (r, token) => {
      const t = normalize(token);
      return String(r.id) === token || normalize(r.codigo) === t || normalize(r.serial_number) === t;
    },
    getRowId: (r) => r.id,
    highlightMs: 4000,
  });

  useEffect(() => {
    const token = searchParams.get("focus");
    if (!token) return;
    const next = new URLSearchParams(searchParams);
    next.delete("focus");
    setSearchParams(next, { replace: true });
    setSearch(""); setStatusFilter(""); setTypeFilter("");
    focusByToken(token);
  }, [searchParams, setSearchParams, focusByToken]);

  // ── Selección ────────────────────────────────────────────────────────────────
  const allVisibleIds     = useMemo(() => (filtered || []).map((r) => r.id), [filtered]);
  const allSelectedInPage = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id));

  const toggleSelectOne = (idActivo) => setSelectedIds((prev) => prev.includes(idActivo) ? prev.filter((x) => x !== idActivo) : [...prev, idActivo]);
  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      if (allSelectedInPage) return prev.filter((id) => !allVisibleIds.includes(id));
      const s = new Set(prev); allVisibleIds.forEach((id) => s.add(id)); return Array.from(s);
    });
  };

  // ── Acciones ─────────────────────────────────────────────────────────────────
  function editActivo(row) {
    if (!canEdit) return showToast(t("common.no_permission"), "warning");
    setEditing(row); setOpenEdit(true);
  }
  function abrirMover(row) {
    if (!canMove) return showToast(t("common.no_permission"), "warning");
    setActivoSeleccionado(row); setOpenMover(true);
  }
  function abrirHistorial(row) {
    if (!canViewHistory) return showToast(t("common.no_permission"), "warning");
    setActivoSeleccionado(row); setOpenHistorial(true);
  }
  async function abrirQR(row) {
    if (!canQR) return showToast(t("common.no_permission"), "warning");
    setActivoQR(row); setPublicLink("");
    try {
      const { url } = await getPublicLinkForActivo(row.id);
      setPublicLink(url);
    } catch (e) {
      setPublicLink(`${window.location.origin}/public/activos/${encodeURIComponent(row.codigo)}`);
    } finally {
      setOpenQR(true);
    }
  }
  function descargarQR() {
    if (!qrRef.current || !activoQR) return;
    qrRef.current.download("png", `QR_${activoQR.codigo}`);
  }

  // Carga bodegas al abrir panel
  useEffect(() => {
    if (!openBulkMover) return;
    setLoadingBodegas(true);
    getBodegas()
      .then((rows) => setBodegas(Array.isArray(rows) ? rows : []))
      .catch(() => { setBodegas([]); showToast(t("clients.assets.errors.load_warehouses"), "danger"); })
      .finally(() => setLoadingBodegas(false));
  }, [openBulkMover]);

  async function bulkMoveToBodega() {
    if (!bulkBodega) return showToast(t("clients.assets.errors.select_warehouse"), "warning");
    if (!selectedIds.length) return showToast(t("clients.assets.errors.no_selection"), "warning");
    if (!canMove) return showToast(t("common.no_permission"), "warning");
    setBulkSaving(true);
    try {
      const usuario = userData?.id_usuario ?? userData?.id ?? null;
      const failed  = [];
      for (const id_activo of [...selectedIds].sort((a, b) => a - b)) {
        try {
          await moverABodega({ id_activo, id_bodega: bulkBodega, motivo: bulkMotivo || "Movimiento masivo desde cliente", usuario_responsable: usuario });
        } catch (e) { failed.push({ id_activo, error: e?.message }); }
      }
      if (failed.length === 0) showToast(t("clients.assets.success.bulk_moved"), "success");
      else showToast(t("clients.assets.errors.bulk_partial", { count: failed.length }), "warning");
      setOpenBulkMover(false); setBulkBodega(""); setBulkMotivo(""); setSelectedIds([]); load();
    } catch (err) {
      showToast(err?.message || t("clients.assets.errors.bulk_failed"), "danger");
    } finally {
      setBulkSaving(false);
    }
  }

  // ── Opciones de bodegas para SearchableSelect ────────────────────────────────
  const bodegaOptions = useMemo(
    () => bodegas.map((b) => ({ value: String(b.id), label: b.nombre })),
    [bodegas]
  );

  // ── Menú de acciones por fila ────────────────────────────────────────────────
  const AccionesMenu = ({ row }) => {
    const hasActions = canEdit || canMove || canViewHistory || canQR;
    if (!hasActions) return null;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted/80 rounded-xl transition-colors">
            <MoreVertical size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-xl border-border/60">
          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
            Acciones
          </DropdownMenuLabel>

          {canEdit && (
            <DropdownMenuItem onClick={() => editActivo(row)} className="rounded-xl cursor-pointer gap-2 text-sm">
              <Edit3 size={13} /> {t("common.actions.edit")}
            </DropdownMenuItem>
          )}

          {canMove && (
            <DropdownMenuItem onClick={() => abrirMover(row)} className="rounded-xl cursor-pointer gap-2 text-sm">
              <ArrowLeftRight size={13} /> {t("common.actions.move")}
            </DropdownMenuItem>
          )}

          {(canViewHistory || canQR) && <DropdownMenuSeparator />}

          {canViewHistory && (
            <DropdownMenuItem onClick={() => abrirHistorial(row)} className="rounded-xl cursor-pointer gap-2 text-sm">
              <History size={13} /> {t("common.actions.history")}
            </DropdownMenuItem>
          )}

          {canQR && (
            <DropdownMenuItem onClick={() => abrirQR(row)} className="rounded-xl cursor-pointer gap-2 text-sm">
              <QrCode size={13} /> {t("common.actions.qr")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 shrink-0">
            <Monitor size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight">
              {clienteNombre ? `Activos de ${clienteNombre}` : "Activos"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {rows.length} total{filtered.length !== rows.length && ` · ${filtered.length} filtrado${filtered.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Botón mover masivo */}
        {canMove && (
          <Button
            size="sm"
            variant="outline"
            disabled={!hasSelection}
            onClick={() => setOpenBulkMover(true)}
            className="rounded-xl gap-2 text-xs font-bold h-9 disabled:opacity-50 shrink-0">
            <ArrowLeftRight size={13} />
            {t("clients.assets.actions.move_to_warehouse")}
            {hasSelection && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                {selectedIds.length}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[180px] max-w-xs group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder={t("clients.assets.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-8 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/50 shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-md text-muted-foreground/60 hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filtro estado */}
        <div className="w-[170px]">
          <SearchableSelect
            value={statusFilter}
            onChange={(v) => setStatusFilter(v || "")}
            options={ESTATUS_OPTIONS}
            placeholder="Estado"
          />
        </div>

        {/* Filtro tipo */}
        <div className="w-[170px]">
          <SearchableSelect
            value={typeFilter}
            onChange={(v) => setTypeFilter(v || "")}
            options={TIPO_OPTIONS}
            placeholder="Tipo"
          />
        </div>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <button
            onClick={() => { setStatusFilter(""); setTypeFilter(""); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-all">
            <X size={12} /> {t("common.actions.clear")}
          </button>
        )}

        {!loading && (
          <span className="text-xs text-muted-foreground/70 font-medium whitespace-nowrap ml-auto">
            <span className="font-bold text-foreground">{filtered.length}</span>
            {(search || hasActiveFilters) ? ` de ${rows.length}` : ` activo${rows.length !== 1 ? "s" : ""}`}
          </span>
        )}
      </div>

      {/* ── TABLA ── */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={18} />
            </div>
            <p className="text-sm text-muted-foreground font-medium">{t("clients.assets.loading")}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <AlertTriangle size={28} className="text-rose-500/50" />
            <div className="text-center">
              <p className="font-bold text-sm">{t("clients.assets.error_loading")}</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={load} variant="outline" size="sm" className="rounded-xl">{t("common.retry")}</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-14 h-14 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
              <Monitor size={24} className="text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm">{search ? t("clients.assets.empty.no_results") : t("clients.assets.empty.title")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? t("clients.assets.empty.no_match", { search }) : t("clients.assets.empty.no_assets")}
              </p>
            </div>
          </div>
        ) : isMobile ? (

          /* ── MOBILE CARDS ── */
          <div className="divide-y divide-border/50">
            {filtered.map((r) => {
              const isHighlighted = r.id === highlightId;
              return (
                <div
                  key={r.id}
                  ref={isHighlighted ? focusedRef : null}
                  className={[
                    "p-4 flex items-start gap-3 transition-colors",
                    isHighlighted ? "bg-primary/5" : "hover:bg-muted/20 dark:hover:bg-slate-800/30",
                  ].join(" ")}>
                  {canMove && (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(r.id)}
                      onChange={() => toggleSelectOne(r.id)}
                      className="mt-1 rounded accent-primary cursor-pointer shrink-0"
                    />
                  )}
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-muted/60 dark:bg-slate-800 flex items-center justify-center">
                    <Monitor size={13} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{r.nombre}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{r.codigo}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {r.tipo && (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-muted text-muted-foreground border border-border/60">
                          {r.tipo}
                        </span>
                      )}
                      <EstatusBadge estatus={r.estatus} />
                    </div>
                    {r.site_nombre && (
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary/10 dark:bg-primary/15 text-primary border border-primary/20">
                        {r.site_nombre}
                      </span>
                    )}
                  </div>
                  <AccionesMenu row={r} />
                </div>
              );
            })}
          </div>

        ) : (

          /* ── DESKTOP TABLA ── */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 dark:bg-slate-800/30">
                  <th className="px-4 py-3.5 text-center w-10">
                    {canMove && (
                      <input
                        type="checkbox"
                        checked={allSelectedInPage && filtered.length > 0}
                        ref={(el) => el && (el.indeterminate = !allSelectedInPage && hasSelection && filtered.length > 0)}
                        onChange={toggleSelectAllVisible}
                        className="rounded accent-primary cursor-pointer"
                      />
                    )}
                  </th>
                  {[t("clients.assets.columns.code"), t("clients.assets.columns.name"), t("clients.assets.columns.type"), t("clients.assets.columns.model"), t("clients.assets.columns.serial"), t("clients.assets.columns.site"), t("clients.assets.columns.status"), ""].map((h, i) => (
                    <th key={i} className={`px-4 py-3.5 ${i === 7 ? "text-right" : "text-left"}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{h}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isHighlighted = r.id === highlightId;
                  return (
                    <tr
                      key={r.id}
                      ref={isHighlighted ? focusedRef : null}
                      className={[
                        "border-b border-border/30 last:border-0 transition-colors group",
                        isHighlighted ? "bg-primary/5" : "hover:bg-muted/20 dark:hover:bg-slate-800/20",
                      ].join(" ")}>
                      <td className="px-4 py-4 text-center">
                        {canMove && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(r.id)}
                            onChange={() => toggleSelectOne(r.id)}
                            className="rounded accent-primary cursor-pointer"
                          />
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-mono text-muted-foreground">{r.codigo}</span>
                      </td>
                      <td className="px-4 py-4 max-w-[180px]">
                        <p className="text-sm font-bold truncate" title={r.nombre}>{r.nombre}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-muted-foreground">{r.tipo || "—"}</span>
                      </td>
                      <td className="px-4 py-4 max-w-[120px]">
                        <span className="text-sm text-muted-foreground truncate block" title={r.modelo}>{r.modelo || "—"}</span>
                      </td>
                      <td className="px-4 py-4 max-w-[120px]">
                        <span className="text-sm text-muted-foreground font-mono truncate block" title={r.serial_number}>{r.serial_number || "—"}</span>
                      </td>
                      <td className="px-4 py-4">
                        {r.site_nombre ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-primary/10 dark:bg-primary/15 text-primary border border-primary/20 max-w-[150px] truncate" title={r.site_nombre}>
                            {r.site_nombre}
                          </span>
                        ) : <span className="text-muted-foreground/50 text-sm">—</span>}
                      </td>
                      <td className="px-4 py-4">
                        <EstatusBadge estatus={r.estatus} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <AccionesMenu row={r} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODALES ESPECIALIZADOS (intactos) ── */}
      <ActivoFormModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        editing={editing}
        onSaved={load}
      />

      <HistorialActivoModal
        open={openHistorial}
        onClose={() => setOpenHistorial(false)}
        activo={activoSeleccionado}
      />

      <MoverActivoModal
        open={openMover}
        onClose={() => setOpenMover(false)}
        activo={activoSeleccionado}
        onSaved={() => { setOpenMover(false); load(); }}
        defaultTipo="Cliente"
        defaultClienteId={Number(id)}
      />

      {/* ── MODAL QR ── */}
      {openQR && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={() => { setOpenQR(false); setPublicLink(""); }}>
          <div
            className="w-full max-w-sm bg-card dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
              <div className="p-2 bg-primary/10 dark:bg-primary/15 rounded-2xl ring-1 ring-primary/20">
                <QrCode size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-base tracking-tight">{t("clients.assets.qr_title")}</h3>
                {activoQR && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {activoQR.nombre} · <span className="font-mono">{activoQR.codigo}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => { setOpenQR(false); setPublicLink(""); }}
                className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {activoQR && (
                <div className="flex flex-col items-center gap-3">
                  <StyledQR
                    ref={qrRef}
                    text={publicLink || `${window.location.origin}/public/activos/${encodeURIComponent(activoQR.codigo)}`}
                    logoUrl={logoTecnasa}
                    size={220}
                  />
                  {publicLink && (
                    <a href={publicLink} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                      {t("clients.assets.view_public_page")}
                    </a>
                  )}
                </div>
              )}

              <div className="flex gap-2.5">
                <Button onClick={descargarQR} className="flex-1 rounded-2xl h-10 font-bold gap-2">
                  <Download size={14} /> {t("common.actions.download_png")}
                </Button>
                <Button variant="outline" onClick={() => { setOpenQR(false); setPublicLink(""); }} className="flex-1 rounded-2xl h-10 font-bold">
                  {t("common.actions.close")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PANEL MOVER MASIVO ── */}
      {openBulkMover && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !bulkSaving && setOpenBulkMover(false)}
          />
          <div
            className={[
              "absolute bg-card dark:bg-slate-900 shadow-2xl border-border/40 flex flex-col animate-in duration-300",
              isMobile
                ? "inset-x-0 bottom-0 h-[85vh] rounded-t-3xl border-t slide-in-from-bottom"
                : "right-0 top-0 h-full w-[460px] border-l slide-in-from-right",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex-none flex items-center gap-3 px-6 py-4 border-b border-border/60 bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <div className="p-2 bg-primary/10 dark:bg-primary/15 rounded-2xl ring-1 ring-primary/20">
                <ArrowLeftRight size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black tracking-tight">{t("clients.assets.actions.move_to_warehouse")}</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {selectedIds.length} activo{selectedIds.length !== 1 ? "s" : ""} seleccionado{selectedIds.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => !bulkSaving && setOpenBulkMover(false)}
                disabled={bulkSaving}
                className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-40">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-4">

              {/* Sección destino */}
              <div className="bg-muted/30 dark:bg-slate-800/30 border border-border/40 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2.5 pb-1">
                  <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
                    <ArrowLeftRight size={13} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {t("clients.assets.form.destination_warehouse")}
                  </h3>
                </div>

                {/* Bodega SearchableSelect */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    Bodega <span className="text-primary">*</span>
                  </label>
                  {loadingBodegas ? (
                    <div className="flex items-center gap-2 py-3 text-muted-foreground">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-sm">{t("common.loading")}</span>
                    </div>
                  ) : (
                    <SearchableSelect
                      value={bulkBodega}
                      onChange={(v) => setBulkBodega(v)}
                      options={bodegaOptions}
                      placeholder={t("clients.sites.form.city_placeholder")}
                      disabled={bulkSaving}
                      emptyLabel={t("common.no_data")}
                    />
                  )}
                </div>
              </div>

              {/* Sección motivo */}
              <div className="bg-muted/30 dark:bg-slate-800/30 border border-border/40 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2.5 pb-1">
                  <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
                    <SlidersHorizontal size={13} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {t("clients.assets.bulk_move_title")}
                  </h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{t("clients.assets.form.reason")}</label>
                  <textarea
                    rows={3}
                    value={bulkMotivo}
                    onChange={(e) => setBulkMotivo(e.target.value)}
                    disabled={bulkSaving}
                    placeholder="Describe el motivo del movimiento..."
                    className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm resize-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Resumen activos seleccionados */}
              {selectedIds.length > 0 && (
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3">
                  <p className="text-xs text-primary font-semibold">
                    Se moverán <span className="font-black">{selectedIds.length}</span> activo{selectedIds.length !== 1 ? "s" : ""} a la bodega seleccionada.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-none px-6 py-4 border-t border-border/50 bg-card/95 dark:bg-slate-900/95 backdrop-blur-sm">
              <div className="flex gap-2.5">
                <Button
                  type="button"
                  disabled={bulkSaving || !selectedIds.length || !bulkBodega}
                  onClick={bulkMoveToBodega}
                  className="flex-1 rounded-2xl h-10 font-bold shadow-md shadow-primary/15 gap-2 disabled:opacity-60">
                  {bulkSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {bulkSaving ? t("clients.form.saving") : t("clients.assets.actions.move_selected")}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpenBulkMover(false)} disabled={bulkSaving} className="flex-1 rounded-2xl h-10 font-bold">
                  {t("common.actions.cancel")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
