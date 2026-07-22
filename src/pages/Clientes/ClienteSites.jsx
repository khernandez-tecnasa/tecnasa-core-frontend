// src/pages/Clientes/ClienteSites.jsx
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  X,
  MapPin,
  Loader2,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  Building2,
  Save,
  ChevronDown,
  Globe2,
  MoreVertical,
  Edit3,
  AlertTriangle,
} from "lucide-react";

import {
  getSitesByCliente,
  createSite,
  updateSite,
} from "@/services/SitesServices";
import { getCities }      from "@/services/LocationServices";
import { useToast }       from "@/context/ToastContext";
import { useAuth }        from "@/context/AuthContext";
import { Button }         from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useIsMobile        from "@/hooks/useIsMobile";
import useRowFocusHighlight from "@/hooks/useRowFocusHighlight";
import PaginationLite     from "@/components/common/PaginationLite";

// ── Helpers ───────────────────────────────────────────────────────────────────

const normalize = (val) =>
  (val || "").toString().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

const isActivoVal = (value) => value === 1 || value === true || value === "1" || value === "true";

// ── Field helper ──────────────────────────────────────────────────────────────

function Field({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
          <AlertTriangle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

function inputCls(hasError) {
  return [
    "w-full rounded-xl border px-4 py-2.5 text-sm transition-all outline-none",
    "bg-background dark:bg-slate-900/60 placeholder:text-muted-foreground/50",
    hasError
      ? "border-rose-400/70 ring-2 ring-rose-400/20"
      : "border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
    "disabled:opacity-60",
  ].join(" ");
}

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
                placeholder="Buscar ciudad..."
                className="w-full bg-muted/40 dark:bg-slate-800/80 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none placeholder:text-muted-foreground/60 focus:ring-1 ring-primary/20 transition-all"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto overscroll-contain py-1.5 px-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-6 text-muted-foreground">
                <Globe2 size={16} className="opacity-40" />
                <p className="text-xs">{emptyLabel}</p>
              </div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(String(o.value)); setOpen(false); }}
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

export default function ClienteSites({ onCountChange }) {
  const { t }                                     = useTranslation();
  const { id }                                    = useParams();
  const [searchParams, setSearchParams]           = useSearchParams();
  const { showToast }                             = useToast();
  const { userData, checkingSession, hasPermiso } = useAuth();
  const isMobile                                  = useIsMobile(768);

  const isAdmin = useCallback(
    () => (userData?.rol || userData?.role || "").toLowerCase() === "admin" || Boolean(userData?.isAdmin) || Boolean(userData?.es_admin),
    [userData]
  );
  const can = useCallback((p) => isAdmin() || hasPermiso(p), [isAdmin, hasPermiso]);

  const canView   = can("ver_sites");
  const canCreate = can("crear_sites");
  const canEdit   = can("editar_sites");

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [rows, setRows]         = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const [search, setSearch]             = useState("");
  const [cityFilter, setCityFilter]     = useState("");
  const [statusFilter, setStatusFilter] = useState("activos");

  const [page, setPage]   = useState(1);
  const rowsPerPage = 10;

  // Panel filtros
  const [filterOpen, setFilterOpen]   = useState(false);
  const [draftCity, setDraftCity]     = useState("");
  const [draftStatus, setDraftStatus] = useState("activos");

  // Selección
  const [selectedIds, setSelectedIds]   = useState([]);
  const hasSelection = selectedIds.length > 0;

  // Panel crear/editar
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({ nombre: "", descripcion: "", id_ciudad: "", activo: "1" });
  const [formError, setFormError] = useState({});
  const [saving, setSaving]   = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  // ── Carga ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (checkingSession) { setLoading(true); return; }
    if (!canView) { setError(null); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [sitesData, ciudadesData] = await Promise.all([getSitesByCliente(id), getCities()]);
      const sites = Array.isArray(sitesData) ? sitesData : [];
      setRows(sites);
      setCiudades(Array.isArray(ciudadesData) ? ciudadesData : []);
      setSelectedIds([]);
      onCountChange?.(sites.length);
    } catch (err) {
      setError(err?.message || t("clients.sites.errors.load_failed"));
    } finally {
      setLoading(false);
    }
  }, [id, checkingSession, canView]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, cityFilter, statusFilter]);

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const s = normalize(search);
    return (rows || []).filter((r) => {
      const matchSearch = normalize(r.nombre).includes(s) || normalize(r.descripcion).includes(s) || normalize(r.ciudad).includes(s);
      const matchCity   = !cityFilter || String(r.id_ciudad) === String(cityFilter);
      const isActivo    = isActivoVal(r.activo);
      const matchStatus = statusFilter === "activos" ? isActivo : statusFilter === "inactivos" ? !isActivo : true;
      return matchSearch && matchCity && matchStatus;
    });
  }, [rows, search, cityFilter, statusFilter]);

  const totalPages    = Math.ceil(filtered.length / rowsPerPage);
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

  // ── Focus highlight ──────────────────────────────────────────────────────────
  const { highlightId, focusedRef, focusByToken } = useRowFocusHighlight({
    rows: filtered,
    matchRow: (r, token) => String(r.id) === token || normalize(r.nombre) === normalize(token),
    getRowId: (r) => r.id,
    highlightMs: 4000,
  });

  useEffect(() => {
    const token = searchParams.get("focus");
    if (!token) return;
    const next = new URLSearchParams(searchParams);
    next.delete("focus");
    setSearchParams(next, { replace: true });
    setSearch(""); setCityFilter(""); setStatusFilter("todos");
    setDraftCity(""); setDraftStatus("todos");
    focusByToken(token);
  }, [searchParams, setSearchParams, focusByToken]);

  // ── Selección ────────────────────────────────────────────────────────────────
  const pageIds           = useMemo(() => paginatedRows.map((r) => r.id), [paginatedRows]);
  const allSelectedInPage = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleSelectOne = (idSite) => setSelectedIds((prev) => prev.includes(idSite) ? prev.filter((x) => x !== idSite) : [...prev, idSite]);
  const toggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      if (allSelectedInPage) return prev.filter((id) => !pageIds.includes(id));
      const s = new Set(prev); pageIds.forEach((id) => s.add(id)); return Array.from(s);
    });
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  function newSite() {
    if (!canCreate) return showToast(t("common.no_permission"), "warning");
    setEditing(null);
    setForm({ nombre: "", descripcion: "", id_ciudad: "", activo: "1" });
    setFormError({});
    setOpen(true);
  }

  function editSite(row) {
    if (!canEdit) return showToast(t("common.no_permission"), "warning");
    setEditing(row);
    setForm({ nombre: row.nombre, descripcion: row.descripcion || "", id_ciudad: row.id_ciudad ? String(row.id_ciudad) : "", activo: isActivoVal(row.activo) ? "1" : "0" });
    setFormError({});
    setOpen(true);
  }

  async function onSubmit() {
    const errors = {};
    if (!form.nombre.trim()) errors.nombre = t("clients.sites.errors.name_required");
    if (Object.keys(errors).length) { setFormError(errors); return; }
    setFormError({});
    setSaving(true);
    try {
      const payload = { nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null, id_ciudad: form.id_ciudad || null, id_cliente: id, activo: form.activo === "1" ? 1 : 0 };
      if (editing) {
        if (!canEdit) throw new Error(t("common.no_permission"));
        await updateSite(editing.id, payload);
        showToast(t("clients.sites.success.updated"), "success");
      } else {
        if (!canCreate) throw new Error(t("common.no_permission"));
        await createSite(payload);
        showToast(t("clients.sites.success.created"), "success");
      }
      setOpen(false); setEditing(null); load();
    } catch (err) {
      showToast(err?.message || t("clients.sites.errors.save_failed"), "danger");
    } finally {
      setSaving(false);
    }
  }

  async function bulkUpdateActivo(newActivo) {
    if (!canEdit) return showToast(t("common.no_permission"), "warning");
    if (!selectedIds.length) return;
    setBulkSaving(true);
    try {
      await Promise.all(
        selectedIds.map((idSite) => {
          const row = rows.find((r) => r.id === idSite);
          if (!row) return null;
          return updateSite(idSite, { id_cliente: id, nombre: row.nombre, descripcion: row.descripcion || null, id_ciudad: row.id_ciudad || null, activo: newActivo ? 1 : 0 });
        })
      );
      showToast(t("clients.sites.success.bulk_updated"), "success");
      setSelectedIds([]); load();
    } catch (err) {
      showToast(err?.message || t("clients.sites.errors.bulk_failed"), "danger");
    } finally {
      setBulkSaving(false);
    }
  }

  const cityOptions = useMemo(() => ciudades.map((c) => ({ value: c.id, label: c.ciudad || c.nombre })), [ciudades]);
  const availableCities = useMemo(() => {
    const seen = new Map();
    (rows || []).forEach((r) => { if (r.id_ciudad && r.ciudad) seen.set(String(r.id_ciudad), r.ciudad); });
    return Array.from(seen, ([id, nombre]) => ({ value: id, label: nombre }));
  }, [rows]);

  const totalSites   = rows.length;
  const totalActivos = useMemo(() => (rows || []).filter((r) => isActivoVal(r.activo)).length, [rows]);
  const bulkIsActivate = statusFilter === "inactivos";
  const hasActiveFilters = cityFilter || statusFilter !== "activos";

  // ── Menú de acciones ────────────────────────────────────────────────────────
  const AccionesMenu = ({ row }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted/80 rounded-xl transition-colors">
          <MoreVertical size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-2xl shadow-xl border-border/60">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
          Acciones
        </DropdownMenuLabel>
        {canEdit && (
          <DropdownMenuItem onClick={() => editSite(row)} className="rounded-xl cursor-pointer gap-2 text-sm">
            <Edit3 size={13} /> {t("common.actions.edit")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-300">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 shrink-0">
            <MapPin size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight">{t("clients.tabs.sites")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalSites} total · {totalActivos} activo{totalActivos !== 1 ? "s" : ""} · {totalSites - totalActivos} inactivo{(totalSites - totalActivos) !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {canCreate && (
          <Button onClick={newSite} className="rounded-2xl px-4 h-9 font-bold gap-2 shadow-md shadow-primary/15 shrink-0">
            <Plus size={15} strokeWidth={2.5} />
            {t("clients.sites.actions.new")}
          </Button>
        )}
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder={t("clients.sites.search_placeholder")}
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

        <button
          onClick={() => { setDraftCity(cityFilter); setDraftStatus(statusFilter); setFilterOpen(true); }}
          className={[
            "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all",
            hasActiveFilters
              ? "bg-primary/10 border-primary/40 text-primary"
              : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border",
          ].join(" ")}>
          <SlidersHorizontal size={14} />
          {t("clients.sites.filters_title")}
          {hasActiveFilters && <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">!</span>}
        </button>

        {canEdit && hasSelection && (
          <button
            disabled={bulkSaving}
            onClick={() => bulkUpdateActivo(bulkIsActivate)}
            className={[
              "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-60",
              bulkIsActivate
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
                : "bg-muted border-border/60 text-muted-foreground hover:text-foreground",
            ].join(" ")}>
            {bulkSaving ? <Loader2 size={12} className="animate-spin" /> : bulkIsActivate ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {bulkIsActivate ? t("clients.sites.actions.activate") : t("clients.sites.actions.deactivate")} ({selectedIds.length})
          </button>
        )}

        {!loading && (
          <span className="text-xs text-muted-foreground/70 font-medium whitespace-nowrap ml-auto">
            <span className="font-bold text-foreground">{filtered.length}</span>
            {(search || hasActiveFilters) ? ` de ${rows.length}` : ` site${rows.length !== 1 ? "s" : ""}`}
          </span>
        )}
      </div>

      {/* ── CONTENIDO ── */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={18} />
            </div>
            <p className="text-sm text-muted-foreground font-medium">{t("clients.sites.loading")}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <AlertTriangle size={28} className="text-rose-500/50" />
            <div className="text-center">
              <p className="font-bold text-sm">{t("clients.sites.error_loading")}</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={load} variant="outline" size="sm" className="rounded-xl">{t("common.retry")}</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-14 h-14 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
              <MapPin size={24} className="text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm">{search ? t("clients.sites.empty.no_results") : t("clients.sites.empty.title")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? t("clients.sites.empty.no_match", { search }) : t("clients.sites.empty.create_hint")}
              </p>
            </div>
          </div>
        ) : isMobile ? (

          /* ── MOBILE CARDS ── */
          <div className="divide-y divide-border/50">
            {paginatedRows.map((r) => {
              const isActivo      = isActivoVal(r.activo);
              const isHighlighted = r.id === highlightId;
              return (
                <div
                  key={r.id}
                  ref={isHighlighted ? focusedRef : null}
                  className={[
                    "p-4 flex items-start gap-3 transition-colors",
                    isHighlighted ? "bg-primary/5" : "hover:bg-muted/20 dark:hover:bg-slate-800/30",
                  ].join(" ")}>
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-muted/60 dark:bg-slate-800 flex items-center justify-center mt-0.5">
                    <MapPin size={13} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm truncate">{r.nombre}</p>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(r.id)}
                        onChange={() => toggleSelectOne(r.id)}
                        className="rounded accent-primary cursor-pointer"
                      />
                    </div>
                    {r.descripcion && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{r.descripcion}</p>}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {r.ciudad && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary/10 dark:bg-primary/15 text-primary border border-primary/20">
                          <Building2 size={8} />{r.ciudad}
                        </span>
                      )}
                      {isActivo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1 h-1 rounded-full bg-emerald-500" />{t("common.status.active")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-muted text-muted-foreground border border-border/60">
                          {t("common.status.inactive")}
                        </span>
                      )}
                    </div>
                  </div>
                  <AccionesMenu row={r} />
                </div>
              );
            })}
          </div>

        ) : (

          /* ── DESKTOP TABLA ── */
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20 dark:bg-slate-800/30">
                    <th className="px-4 py-3.5 text-center w-10">
                      <input
                        type="checkbox"
                        checked={allSelectedInPage}
                        ref={(el) => el && (el.indeterminate = !allSelectedInPage && hasSelection)}
                        onChange={toggleSelectAllPage}
                        className="rounded accent-primary cursor-pointer"
                      />
                    </th>
                    {[t("clients.sites.title"), t("clients.sites.columns.description"), t("clients.sites.columns.city"), t("clients.sites.columns.status"), ""].map((h, i) => (
                      <th key={i} className={`px-6 py-3.5 ${i === 4 ? "text-right" : "text-left"}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{h}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((r) => {
                    const isActivo      = isActivoVal(r.activo);
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
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(r.id)}
                            onChange={() => toggleSelectOne(r.id)}
                            className="rounded accent-primary cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 shrink-0 rounded-xl bg-muted/60 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:ring-1 ring-primary/20 flex items-center justify-center transition-all duration-200">
                              <MapPin size={13} className="text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div>
                              <p className="text-sm font-bold leading-tight">{r.nombre}</p>
                              <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">#{String(r.id).padStart(4, "0")}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-[200px]">
                          <p className="text-sm text-muted-foreground truncate">{r.descripcion || "—"}</p>
                        </td>
                        <td className="px-6 py-4">
                          {r.ciudad ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-primary/10 dark:bg-primary/15 text-primary border border-primary/20">
                              <Building2 size={9} />{r.ciudad}
                            </span>
                          ) : <span className="text-muted-foreground/50 text-sm">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          {isActivo ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{t("common.status.active")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-muted text-muted-foreground border border-border/60">
                              {t("common.status.inactive")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
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

            {/* Footer paginación */}
            {rows.length > 0 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-border/50 bg-muted/10 dark:bg-slate-800/10">
                <p className="text-xs text-muted-foreground">
                  {t("common.showing_results", { count: paginatedRows.length, total: filtered.length })}
                </p>
                <PaginationLite page={page} count={totalPages} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── PANEL FILTROS ── */}
      {filterOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setFilterOpen(false)} />
          <div className={[
            "absolute bg-card dark:bg-slate-900 shadow-2xl border-border/40 flex flex-col animate-in duration-300",
            isMobile
              ? "inset-x-0 bottom-0 h-auto max-h-[80vh] rounded-t-3xl border-t"
              : "right-0 top-0 h-full w-[360px] border-l slide-in-from-right",
          ].join(" ")}>
            <div className="flex-none flex items-center gap-3 px-6 py-4 border-b border-border/60">
              <SlidersHorizontal size={18} className="text-primary" />
              <h3 className="font-black tracking-tight flex-1">{t("clients.sites.filters_title")}</h3>
              <button onClick={() => setFilterOpen(false)} className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl text-muted-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Ciudad */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{t("clients.sites.columns.city")}</label>
                <SearchableSelect
                  value={draftCity}
                  onChange={setDraftCity}
                  options={[{ value: "", label: t("common.all_cities") }, ...availableCities]}
                  placeholder={t("common.all_cities")}
                />
              </div>
              {/* Estatus */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{t("clients.sites.columns.status")}</label>
                <div className="space-y-1.5">
                  {[["activos", t("clients.filter.active")], ["inactivos", t("clients.filter.inactive")], ["todos", t("clients.filter.all")]].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setDraftStatus(val)}
                      className={[
                        "w-full py-2 px-4 rounded-xl text-sm font-semibold border text-left transition-all",
                        draftStatus === val ? "bg-primary/10 border-primary/40 text-primary" : "border-border/60 text-muted-foreground hover:border-border",
                      ].join(" ")}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-none px-6 py-4 border-t border-border/50 bg-card/95 dark:bg-slate-900/95 backdrop-blur-sm">
              <div className="flex gap-2.5">
                <Button
                  onClick={() => { setCityFilter(draftCity); setStatusFilter(draftStatus); setFilterOpen(false); }}
                  className="flex-1 rounded-2xl h-10 font-bold gap-2">
                  {t("common.actions.apply")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setDraftCity(""); setDraftStatus("activos"); setCityFilter(""); setStatusFilter("activos"); setFilterOpen(false); }}
                  className="flex-1 rounded-2xl h-10 font-bold">
                  {t("common.actions.clear")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PANEL CREAR / EDITAR ── */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !saving && setOpen(false)}
          />
          <div
            className={[
              "absolute bg-card dark:bg-slate-900 shadow-2xl border-border/40 flex flex-col animate-in duration-300",
              isMobile
                ? "inset-x-0 bottom-0 h-[92vh] rounded-t-3xl border-t slide-in-from-bottom"
                : "right-0 top-0 h-full w-[460px] border-l slide-in-from-right",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex-none flex items-center gap-3 px-6 py-4 border-b border-border/60 bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <div className="p-2 bg-primary/10 dark:bg-primary/15 rounded-2xl ring-1 ring-primary/20">
                <MapPin size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black tracking-tight">{editing ? t("clients.sites.edit_title") : t("clients.sites.create_title")}</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {editing ? t("clients.sites.form.edit_subtitle", { name: editing.nombre }) : t("clients.sites.form.create_subtitle")}
                </p>
              </div>
              <button
                onClick={() => !saving && setOpen(false)}
                disabled={saving}
                className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-40">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-4">

              {/* Sección: Información básica */}
              <div className="bg-muted/30 dark:bg-slate-800/30 border border-border/40 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2.5 pb-1">
                  <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
                    <MapPin size={13} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {t("clients.sites.form.section_basic")}
                  </h3>
                </div>

                <Field label={t("clients.sites.form.name")} required error={formError.nombre}>
                  <input
                    autoFocus
                    value={form.nombre}
                    onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setFormError((p) => ({ ...p, nombre: "" })); }}
                    disabled={saving}
                    placeholder={t("clients.sites.form.name_placeholder")}
                    className={inputCls(!!formError.nombre)}
                  />
                </Field>

                <Field label={t("clients.sites.form.description")}>
                  <textarea
                    rows={2}
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    disabled={saving}
                    placeholder={t("clients.sites.form.description_placeholder")}
                    className={`${inputCls(false)} resize-none`}
                  />
                </Field>
              </div>

              {/* Sección: Ubicación y Estado */}
              <div className="bg-muted/30 dark:bg-slate-800/30 border border-border/40 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2.5 pb-1">
                  <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
                    <Globe2 size={13} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {t("clients.sites.form.section_location")}
                  </h3>
                </div>

                <Field label={t("clients.sites.form.city")}>
                  <SearchableSelect
                    value={form.id_ciudad}
                    onChange={(val) => setForm({ ...form, id_ciudad: val })}
                    options={cityOptions}
                    placeholder={t("clients.sites.form.city_placeholder")}
                    disabled={saving}
                    emptyLabel={t("clients.sites.form.no_cities")}
                  />
                </Field>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{t("clients.sites.form.status")}</label>
                  <div className="flex gap-2">
                    {[["1", t("common.status.active"), "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"], ["0", t("common.status.inactive"), "bg-muted border-border text-foreground"]].map(([val, label, activeClass]) => (
                      <button
                        key={val}
                        type="button"
                        disabled={saving}
                        onClick={() => setForm({ ...form, activo: val })}
                        className={[
                          "flex-1 py-2 rounded-xl text-sm font-semibold border transition-all",
                          form.activo === val ? activeClass : "border-border/60 text-muted-foreground hover:border-border",
                        ].join(" ")}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-none px-6 py-4 border-t border-border/50 bg-card/95 dark:bg-slate-900/95 backdrop-blur-sm">
              <div className="flex gap-2.5">
                <Button
                  type="button"
                  disabled={saving}
                  onClick={onSubmit}
                  className="flex-1 rounded-2xl h-10 font-bold shadow-md shadow-primary/15 hover:shadow-primary/25 transition-all gap-2 disabled:opacity-60">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : editing ? <Save size={15} /> : <Plus size={15} />}
                  {saving ? t("clients.sites.form.saving") : editing ? t("common.actions.save_changes") : t("clients.sites.actions.create")}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving} className="flex-1 rounded-2xl h-10 font-bold">
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
