// src/pages/SoporteAdmin/ChangelogsAdminPage.jsx
import { useCallback, useEffect, useState } from "react";
import {
  Plus, Search, Pencil, Trash2, Pin, X, Save,
  Loader2, AlertTriangle, Megaphone, ChevronDown, ChevronUp,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { listChangelogs } from "@/services/help.api.js";
import { createChangelog, updateChangelog, deleteChangelog } from "@/services/helpAdmin.api.js";
import PaginationLite from "@/components/common/PaginationLite.jsx";

/* ── Constants ────────────────────────────────────────────────────── */
const TYPE_OPTIONS = [
  { value: "Added",       label: "Added" },
  { value: "Changed",     label: "Changed" },
  { value: "Fixed",       label: "Fixed" },
  { value: "Removed",     label: "Removed" },
  { value: "Performance", label: "Performance" },
  { value: "Security",    label: "Security" },
  { value: "Deprecated",  label: "Deprecated" },
];

const TYPE_BADGE = {
  Added:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Changed:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Fixed:       "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Removed:     "bg-neutral-100 text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-400",
  Deprecated:  "bg-neutral-100 text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-400",
  Security:    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  Performance: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const TYPE_DOT = {
  Added:       "bg-emerald-500",
  Changed:     "bg-amber-500",
  Fixed:       "bg-blue-500",
  Removed:     "bg-neutral-400",
  Deprecated:  "bg-neutral-400",
  Security:    "bg-rose-500",
  Performance: "bg-emerald-500",
};

const AUDIENCE_OPTIONS = [
  { value: "all",       label: "Todos" },
  { value: "admins",    label: "Admins" },
  { value: "customers", label: "Customers" },
  { value: "internal",  label: "Internal" },
];

/* ── Utils ────────────────────────────────────────────────────────── */
function slugify(s = "") {
  return s.toString().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 160);
}

const asPinned = (v) => v === true || v === 1 || v === "1";

function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return String(d); }
}

const inputCls =
  "w-full bg-card border border-border/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/40";

/* ── Toggle ───────────────────────────────────────────────────────── */
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? "bg-primary" : "bg-muted-foreground/30"
      }`}>
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition duration-200 ${
        checked ? "translate-x-4" : "translate-x-0"
      }`} />
    </button>
  );
}

/* ── Field ────────────────────────────────────────────────────────── */
function Field({ label, required, error, children, hint }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/60">{hint}</p>}
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

/* ── DeleteModal ──────────────────────────────────────────────────── */
function DeleteModal({ open, title, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
      onClick={() => !loading && onCancel()}>
      <div
        className="w-full max-w-sm bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 rounded-2xl ring-1 ring-rose-200/60 shrink-0">
            <Trash2 size={18} className="text-rose-500" />
          </div>
          <div>
            <h2 className="font-black text-base">¿Eliminar novedad?</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              <span className="font-bold text-foreground">"{title}"</span> será eliminada permanentemente.
            </p>
          </div>
        </div>
        <div className="h-px bg-border/50" />
        <div className="flex gap-2.5">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl h-10 font-bold text-sm bg-rose-500 text-white shadow-md shadow-rose-500/20 hover:bg-rose-600 transition-all disabled:opacity-60">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            {loading ? "Eliminando…" : "Sí, eliminar"}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center rounded-2xl h-10 font-bold text-sm border border-border/60 bg-card hover:bg-muted/60 transition-all disabled:opacity-60">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── ChangelogFormDrawer ──────────────────────────────────────────── */
function ChangelogFormDrawer({ open, onClose, onSave, initial }) {
  const { showToast } = useToast();

  const [date, setDate]           = useState("");
  const [type, setType]           = useState("Added");
  const [audience, setAudience]   = useState("all");
  const [title, setTitle]         = useState("");
  const [description, setDescription] = useState("");
  const [pinned, setPinned]       = useState(false);
  const [slug, setSlug]           = useState("");
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState({});

  useEffect(() => {
    if (!open) return;
    setDate(initial?.date ? String(initial.date).slice(0, 10) : new Date().toISOString().slice(0, 10));
    setType(initial?.type || "Added");
    setAudience(initial?.audience || "all");
    setTitle(initial?.title || "");
    setDescription(initial?.description || "");
    setPinned(asPinned(initial?.pinned));
    setSlug(initial?.slug || "");
    setSaving(false);
    setErrors({});
  }, [open, initial]);

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = "El título es obligatorio";
    if (!date) e.date = "La fecha es obligatoria";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await onSave({
        date,
        type,
        audience,
        title: title.trim(),
        description: description.trim() || null,
        pinned: pinned ? 1 : 0,
        slug: slug.trim() || slugify(title),
      });
      onClose?.();
    } catch (err) {
      showToast(err?.message || "No se pudo guardar", "danger");
    } finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={() => !saving && onClose?.()}>
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 dark:bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="w-full sm:max-w-lg bg-card dark:bg-slate-900 border-l border-border/60 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl ring-1 ring-amber-200/60 shrink-0">
              <Megaphone size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="font-black text-base tracking-tight">
              {initial ? "Editar novedad" : "Nueva novedad"}
            </h2>
          </div>
          <button
            onClick={() => !saving && onClose?.()}
            className="p-1.5 rounded-xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Fecha + Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha" required error={errors.date}>
              <input
                type="date"
                className={inputCls}
                value={date}
                onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: "" })); }}
              />
            </Field>
            <Field label="Tipo">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={inputCls}>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Audiencia */}
          <Field label="Audiencia">
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className={inputCls}>
              {AUDIENCE_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </Field>

          {/* Título */}
          <Field label="Título" required error={errors.title}>
            <input
              className={inputCls}
              maxLength={160}
              placeholder="Ej. Nuevo módulo de reportes avanzados"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: "" })); }}
            />
          </Field>

          {/* Descripción */}
          <Field label="Descripción (opcional)">
            <textarea
              className={`${inputCls} resize-none`}
              rows={5}
              placeholder="Resumen, notas, links relevantes…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          {/* Slug */}
          <Field
            label="Slug (opcional)"
            hint="Si se deja vacío se genera automáticamente del título">
            <input
              className={inputCls}
              placeholder="nuevo-modulo-reportes"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </Field>

          {/* Vista previa tipo */}
          {type && (
            <div className="flex items-center gap-2 p-3 rounded-2xl border border-border/60 bg-muted/20 dark:bg-slate-800/20">
              <div className={`w-2 h-2 rounded-full shrink-0 ${TYPE_DOT[type] || "bg-muted-foreground/40"}`} />
              <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                TYPE_BADGE[type] || "bg-muted/60 text-muted-foreground"
              }`}>
                {type}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                {audience !== "all" ? `· ${audience}` : "· Todos"}
              </span>
            </div>
          )}

          {/* Fijado toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-muted/20 dark:bg-slate-800/20">
            <div className="flex items-center gap-2">
              <Pin size={14} className={pinned ? "text-primary" : "text-muted-foreground/50"} />
              <div>
                <p className="text-sm font-bold">Fijado en novedades</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {pinned ? "Aparece primero en la lista" : "Orden cronológico normal"}
                </p>
              </div>
            </div>
            <Toggle checked={pinned} onChange={setPinned} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-6 py-4 border-t border-border/60 shrink-0">
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl h-10 font-bold text-sm bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button
            onClick={() => !saving && onClose?.()}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center rounded-2xl h-10 font-bold text-sm border border-border/60 bg-card hover:bg-muted/60 transition-all disabled:opacity-60">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────── */
export default function ChangelogsAdminPage() {
  const { hasPermiso, userData, checkingSession } = useAuth();
  const { showToast } = useToast();

  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const canManage = isAdmin || hasPermiso?.("help_manage");

  // Filtros
  const [q, setQ]               = useState("");
  const [type, setType]         = useState("all");
  const [audience, setAudience] = useState("all");
  const [pinnedFilter, setPinnedFilter] = useState("all");
  const [page, setPage]         = useState(1);
  const [limit, setLimit]       = useState(10);

  // Data
  const [rows, setRows]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [viewError, setViewError] = useState(null);

  // Paneles
  const [openForm, setOpenForm]         = useState(false);
  const [editing, setEditing]           = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  /* ── Fetch ───────────────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    if (checkingSession) return;
    if (!canManage) { setRows([]); setTotal(0); setLoading(false); return; }
    setLoading(true);
    setViewError(null);
    try {
      const res = await listChangelogs({
        q: q || undefined,
        type: type === "all" ? undefined : type,
        audience: audience === "all" ? undefined : audience,
        pinned: pinnedFilter === "all" ? undefined : pinnedFilter,
        page,
        limit,
        _ts: Date.now(),
      });
      const items = res?.items || [];
      setRows(items);
      setTotal(Number(res?.total || items.length));
    } catch (e) {
      setViewError(e?.message || "No se pudieron cargar las novedades");
      setRows([]);
      setTotal(0);
    } finally { setLoading(false); }
  }, [checkingSession, canManage, q, type, audience, pinnedFilter, page, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / limit) || 1;

  /* ── Actions ─────────────────────────────────────────────────────── */
  const onSaveForm = async (payload) => {
    if (editing) {
      await updateChangelog(editing.id, payload);
      showToast("Novedad actualizada", "success");
    } else {
      await createChangelog(payload);
      showToast("Novedad creada", "success");
      setPage(1);
    }
    fetchData();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteChangelog(deleteTarget.id);
      showToast("Novedad eliminada", "success");
      setDeleteTarget(null);
      fetchData();
    } catch (e) {
      showToast(e?.message || "No se pudo eliminar", "danger");
    } finally { setDeleting(false); }
  };

  const onTogglePinned = async (row) => {
    const next = asPinned(row.pinned) ? 0 : 1;
    try {
      await updateChangelog(row.id, { pinned: next });
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, pinned: !!next } : r)));
    } catch (e) { showToast(e?.message || "No se pudo actualizar", "danger"); }
  };

  /* ── View state ──────────────────────────────────────────────────── */
  const viewState = checkingSession
    ? "checking"
    : !canManage
    ? "no-permission"
    : viewError
    ? "error"
    : loading
    ? "loading"
    : rows.length === 0
    ? "empty"
    : "data";

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <>
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <Megaphone size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Gestionar Novedades
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Crea y administra los changelogs del centro de ayuda
            </p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={() => { setEditing(null); setOpenForm(true); }}
            className="inline-flex items-center gap-2 rounded-2xl px-5 h-10 font-bold text-sm bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/35 transition-all duration-200 shrink-0">
            <Plus size={16} />
            Nueva novedad
          </button>
        )}
      </div>

      {/* FILTROS */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
          <input
            className="w-full pl-9 pr-3 h-9 bg-card border border-border/60 rounded-xl text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/40"
            placeholder="Buscar novedades…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>

        {/* Tipo */}
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="h-9 px-3 bg-card border border-border/60 rounded-xl text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer">
          <option value="all">Todos los tipos</option>
          {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        {/* Audiencia */}
        <select
          value={audience}
          onChange={(e) => { setAudience(e.target.value); setPage(1); }}
          className="h-9 px-3 bg-card border border-border/60 rounded-xl text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer">
          <option value="all">Toda la audiencia</option>
          {AUDIENCE_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>

        {/* Fijado */}
        <select
          value={pinnedFilter}
          onChange={(e) => { setPinnedFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 bg-card border border-border/60 rounded-xl text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer">
          <option value="all">Fijado (todos)</option>
          <option value="1">Solo fijados</option>
          <option value="0">No fijados</option>
        </select>

        {/* Filas por página */}
        <select
          value={String(limit)}
          onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
          className="h-9 px-3 bg-card border border-border/60 rounded-xl text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer">
          <option value="10">10 / pág</option>
          <option value="25">25 / pág</option>
          <option value="50">50 / pág</option>
        </select>

        {!loading && (
          <span className="text-xs text-muted-foreground/70 font-medium ml-auto hidden sm:block">
            <span className="font-bold text-foreground">{total}</span> novedad{total !== 1 ? "es" : ""}
          </span>
        )}
      </div>

      {/* TABLA */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">

        {viewState === "checking" && (
          <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
            <Loader2 size={28} className="animate-spin opacity-40" />
            <p className="text-sm font-medium">Verificando sesión…</p>
          </div>
        )}

        {viewState === "no-permission" && (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-14 h-14 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
              <Megaphone size={26} className="text-muted-foreground/30" />
            </div>
            <p className="font-bold text-sm">Sin permisos para gestionar novedades</p>
            <p className="text-xs text-muted-foreground">Consulta con un administrador.</p>
          </div>
        )}

        {viewState === "error" && (
          <div className="flex items-center gap-3 m-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 rounded-2xl">
            <AlertTriangle size={18} className="text-rose-500 shrink-0" />
            <p className="flex-1 text-sm text-rose-700 dark:text-rose-300">{viewError}</p>
            <button
              onClick={fetchData}
              className="shrink-0 h-8 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold transition-colors">
              Reintentar
            </button>
          </div>
        )}

        {viewState === "loading" && (
          <div className="divide-y divide-border/40">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-5 py-4 animate-pulse">
                <div className="w-2.5 h-2.5 rounded-full bg-muted/60 dark:bg-slate-700 mt-1.5 shrink-0" />
                <div className="flex-1 space-y-2 py-0.5">
                  <div className="h-3.5 bg-muted/60 dark:bg-slate-700/60 rounded-lg w-3/5" />
                  <div className="h-3 bg-muted/40 dark:bg-slate-700/40 rounded-lg w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {viewState === "empty" && (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-14 h-14 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
              <Megaphone size={26} className="text-muted-foreground/30" />
            </div>
            <p className="font-bold text-sm">No hay novedades todavía</p>
            <p className="text-xs text-muted-foreground">
              {q || type !== "all" || audience !== "all" || pinnedFilter !== "all"
                ? "Ajusta los filtros para ver más resultados"
                : "Crea la primera con el botón \"Nueva novedad\""}
            </p>
          </div>
        )}

        {viewState === "data" && (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 740 }}>
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 dark:bg-slate-800/30">
                  <th className="px-5 py-3.5 text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Fecha</span>
                  </th>
                  <th className="px-4 py-3.5 text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Novedad</span>
                  </th>
                  <th className="px-4 py-3.5 text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Tipo</span>
                  </th>
                  <th className="px-4 py-3.5 text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Audiencia</span>
                  </th>
                  <th className="px-4 py-3.5 text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Fijado</span>
                  </th>
                  <th className="px-4 py-3.5 text-right pr-5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors group">

                    {/* Fecha */}
                    <td className="px-5 py-3.5 shrink-0">
                      <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                        {fmtDate(r.date)}
                      </span>
                    </td>

                    {/* Novedad */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${TYPE_DOT[r.type] || "bg-muted-foreground/40"}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm">{r.title}</p>
                            {asPinned(r.pinned) && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary">
                                <Pin size={8} /> Fijado
                              </span>
                            )}
                          </div>
                          {r.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 max-w-[340px] truncate">
                              {r.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Tipo */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        TYPE_BADGE[r.type] || "bg-muted/60 text-muted-foreground"
                      }`}>
                        {r.type}
                      </span>
                    </td>

                    {/* Audiencia */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium text-muted-foreground capitalize">
                        {r.audience || "all"}
                      </span>
                    </td>

                    {/* Fijado */}
                    <td className="px-4 py-3.5">
                      <Toggle
                        checked={asPinned(r.pinned)}
                        onChange={() => canManage && onTogglePinned(r)}
                        disabled={!canManage}
                      />
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3.5 pr-5">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditing(r); setOpenForm(true); }}
                          disabled={!canManage}
                          title="Editar"
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          disabled={!canManage}
                          title="Eliminar"
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors disabled:opacity-30">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINACIÓN */}
      {viewState === "data" && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground/60 order-2 sm:order-1">
            Mostrando {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total} novedades
          </p>
          <div className="order-1 sm:order-2">
            <PaginationLite
              page={page}
              count={totalPages}
              onChange={setPage}
              siblingCount={1}
              boundaryCount={1}
              showFirstLast={false}
            />
          </div>
        </div>
      )}
    </div>

    {/* PANELES Y MODALES */}
    <ChangelogFormDrawer
      open={openForm}
      initial={editing}
      onClose={() => setOpenForm(false)}
      onSave={onSaveForm}
    />

    <DeleteModal
      open={!!deleteTarget}
      title={deleteTarget?.title || ""}
      onConfirm={confirmDelete}
      onCancel={() => setDeleteTarget(null)}
      loading={deleting}
    />
    </>
  );
}
