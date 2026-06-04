// src/pages/SoporteAdmin/FAQsAdminPage.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import {
  Search, Plus, Pencil, Trash2, Eye, EyeOff, Save, X,
  ChevronUp, ChevronDown, HelpCircle, AlertTriangle,
  Lock, Loader2, RefreshCw, Tag, ChevronsUpDown,
} from "lucide-react";

import { listFaqs } from "../../services/help.api";
import { createFaq, updateFaq, deleteFaq } from "../../services/helpAdmin.api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import PaginationLite from "../../components/common/PaginationLite";

/* ── Utils ──────────────────────────────────────────────────────────── */
function slugify(s = "") {
  return s
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 160);
}

function toTagArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((t) => String(t).trim()).filter(Boolean);
  if (typeof value === "string") {
    try { const p = JSON.parse(value); if (Array.isArray(p)) return p; } catch {}
    return value.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

function stripHtml(s = "") {
  const el = document.createElement("div");
  el.innerHTML = s;
  return (el.textContent || el.innerText || "").trim();
}

/* ── Validación ─────────────────────────────────────────────────────── */
const validationSchema = yup.object({
  question: yup.string().required("La pregunta es requerida"),
  answer:   yup.string().required("La respuesta es requerida"),
  category: yup.string().required("La categoría es requerida"),
  order:    yup.number().typeError("Debe ser un número").integer().min(0),
});

/* ── Toggle Switch ──────────────────────────────────────────────────── */
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

/* ── Tag Input ──────────────────────────────────────────────────────── */
function TagInput({ value = [], onChange, suggestions = [] }) {
  const [input, setInput] = useState("");
  const uid = "tag-sugg-" + Math.random().toString(36).slice(2, 7);

  const addTag = (raw) => {
    const tag = raw.trim().replace(/^#/, "");
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInput("");
  };

  const removeTag = (tag) => onChange(value.filter((t) => t !== tag));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(input); }
    else if (e.key === "Backspace" && !input && value.length) removeTag(value[value.length - 1]);
  };

  return (
    <div
      className="flex flex-wrap gap-1.5 px-2.5 py-2 bg-card border border-border/60 rounded-xl min-h-[40px] focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 transition-all cursor-text"
      onClick={(e) => e.currentTarget.querySelector("input")?.focus()}>
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
          #{tag}
          <button type="button" onClick={() => removeTag(tag)} className="hover:text-primary/60 transition-colors">
            <X size={9} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        list={uid}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input.trim() && addTag(input)}
        placeholder={value.length ? "" : "Escribe y presiona Enter…"}
        className="flex-1 min-w-[140px] bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
      />
      <datalist id={uid}>
        {suggestions.filter((s) => !value.includes(s)).map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}

/* ── Field wrapper ──────────────────────────────────────────────────── */
function Field({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground/70">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

const inputCls = "w-full bg-card border border-border/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/40";
const CATEGORY_OPTS = ["General", "Cuentas", "Técnico", "Facturación", "Accesos", "Reportes"];

/* ── Form Drawer ────────────────────────────────────────────────────── */
function FaqFormDrawer({ open, onClose, onSave, initial, tagOptions = [] }) {
  const formik = useFormik({
    initialValues: {
      question:   initial?.question   || "",
      answer:     initial?.answer     || "",
      category:   initial?.category   || "General",
      visibility: initial?.visibility || "public",
      tags:       toTagArray(initial?.tags),
      order:      initial?.order      ?? 0,
      isActive:   initial?.isActive   ?? 1,
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSave({
          ...values,
          slug:     initial?.slug || slugify(values.question),
          isActive: values.isActive ? 1 : 0,
        });
        onClose();
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={() => !formik.isSubmitting && onClose()}
      />

      {/* Panel */}
      <div className="w-full sm:max-w-lg bg-card dark:bg-slate-900 border-l border-border/60 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header del panel */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
          <div>
            <p className="font-black text-base">{initial ? "Editar FAQ" : "Nueva FAQ"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {initial ? "Modifica los campos y guarda los cambios" : "Completa los campos para crear la pregunta"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={formik.isSubmitting}
            className="p-2 rounded-xl hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all disabled:opacity-40">
            <X size={16} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={formik.handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <Field
            label="Pregunta"
            required
            error={formik.touched.question && formik.errors.question}>
            <input
              name="question"
              value={formik.values.question}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="¿Cuál es tu pregunta?"
              className={inputCls}
            />
          </Field>

          <Field
            label="Respuesta"
            required
            error={formik.touched.answer && formik.errors.answer}>
            <textarea
              name="answer"
              rows={7}
              value={formik.values.answer}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Escribe la respuesta completa aquí…"
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Categoría"
              required
              error={formik.touched.category && formik.errors.category}>
              <input
                name="category"
                list="cat-options"
                value={formik.values.category}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Categoría"
                className={inputCls}
              />
              <datalist id="cat-options">
                {CATEGORY_OPTS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>

            <Field label="Visibilidad">
              <select
                name="visibility"
                value={formik.values.visibility}
                onChange={formik.handleChange}
                className={`${inputCls} cursor-pointer`}>
                <option value="public">Público</option>
                <option value="internal">Interno</option>
              </select>
            </Field>
          </div>

          <Field label="Tags">
            <TagInput
              value={formik.values.tags}
              onChange={(v) => formik.setFieldValue("tags", v)}
              suggestions={tagOptions}
            />
            <p className="text-[11px] text-muted-foreground/60 mt-1">Presiona Enter o coma para agregar</p>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Orden"
              error={formik.touched.order && formik.errors.order}>
              <input
                type="number"
                name="order"
                min={0}
                value={formik.values.order}
                onChange={formik.handleChange}
                className={inputCls}
              />
            </Field>

            <Field label="Estado">
              <div className="flex items-center gap-3 h-[38px]">
                <Toggle
                  checked={Boolean(formik.values.isActive)}
                  onChange={(v) => formik.setFieldValue("isActive", v)}
                />
                <span className={`text-sm font-bold ${formik.values.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                  {formik.values.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
            </Field>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={formik.isSubmitting}
            className="h-9 px-4 rounded-xl border border-border/60 bg-card text-sm font-bold hover:bg-muted/60 transition-all disabled:opacity-40">
            Cancelar
          </button>
          <button
            type="button"
            onClick={formik.handleSubmit}
            disabled={formik.isSubmitting}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-60 disabled:pointer-events-none">
            {formik.isSubmitting
              ? <Loader2 size={14} className="animate-spin" />
              : <Save size={14} />}
            {formik.isSubmitting ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal de confirmación de eliminación ───────────────────────────── */
function DeleteModal({ faq, onConfirm, onCancel, loading }) {
  if (!faq) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
      onClick={() => !loading && onCancel()}>
      <div
        className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-900/30 shrink-0">
            <Trash2 size={18} className="text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="font-black text-base">¿Eliminar esta FAQ?</p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              "{faq.question}"
            </p>
            <p className="text-xs text-muted-foreground/70 mt-2">Esta acción no se puede deshacer.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 h-10 rounded-2xl border border-border/60 bg-card text-sm font-bold hover:bg-muted/60 transition-all disabled:opacity-40">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-10 rounded-2xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition-all disabled:opacity-60 disabled:pointer-events-none inline-flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {loading ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Columna ordenable ──────────────────────────────────────────────── */
function SortTh({ label, sortKey, sort, onSort, className = "" }) {
  const active = sort.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 cursor-pointer select-none hover:text-foreground transition-colors ${className}`}>
      <span className="inline-flex items-center gap-1">
        {label}
        {active
          ? sort.dir === "asc"
            ? <ChevronUp size={11} className="text-primary" />
            : <ChevronDown size={11} className="text-primary" />
          : <ChevronsUpDown size={11} className="opacity-30" />}
      </span>
    </th>
  );
}

/* ── Página principal ───────────────────────────────────────────────── */
export default function FAQsAdminPage() {
  const { hasPermiso, userData, checkingSession } = useAuth();
  const { showToast } = useToast();

  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const can = useCallback((p) => isAdmin || hasPermiso?.(p), [isAdmin, hasPermiso]);

  const canView   = can("help_manage");
  const canCreate = can("help_manage");
  const canEdit   = can("help_manage");
  const canDelete = can("help_manage");

  const [rows,       setRows]       = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [q,          setQ]          = useState("");
  const [visibility, setVisibility] = useState("all");
  const [active,     setActive]     = useState("all");

  const [page,  setPage]  = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort,  setSort]  = useState({ key: "order", dir: "asc" });

  const [openForm,   setOpenForm]   = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  /* Fetch */
  const fetchData = useCallback(async () => {
    if (checkingSession) return;
    if (!canView) { setRows([]); setTotal(0); setLoading(false); return; }
    setLoading(true);
    setFetchError(null);
    try {
      const res = await listFaqs({
        page, limit,
        q: q || undefined,
        visibility: visibility === "all" ? undefined : visibility,
        isActive:   active     === "all" ? undefined : active,
      });
      setRows(res?.items || []);
      setTotal(Number(res?.total || (res?.items || []).length));
    } catch {
      setFetchError("No se pudieron cargar las FAQs.");
    } finally {
      setLoading(false);
    }
  }, [checkingSession, canView, page, limit, q, visibility, active]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sortedRows = useMemo(() => {
    const src = rows.slice();
    const { key, dir } = sort;
    src.sort((a, b) => {
      const va = a?.[key] ?? "";
      const vb = b?.[key] ?? "";
      if (va < vb) return dir === "asc" ? -1 : 1;
      if (va > vb) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return src;
  }, [rows, sort]);

  const totalPages = Math.ceil(total / limit) || 1;

  const toggleSort = (key) =>
    setSort((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });

  const tagOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => toTagArray(r.tags).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [rows]);

  /* Handlers */
  const onCreate = () => {
    if (!canCreate) return showToast("Sin permiso", "warning");
    setEditing(null);
    setOpenForm(true);
  };

  const onEdit = (row) => {
    if (!canEdit) return showToast("Sin permiso", "warning");
    setEditing(row);
    setOpenForm(true);
  };

  const onDeleteRow = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFaq(deleteTarget.id);
      showToast("FAQ eliminada", "success");
      setDeleteTarget(null);
      fetchData();
    } catch {
      showToast("No se pudo eliminar", "error");
    } finally {
      setDeleting(false);
    }
  };

  const onQuickToggleActive = async (row) => {
    if (!canEdit) return showToast("Sin permiso", "warning");
    try {
      await updateFaq(row.id, { isActive: row.isActive ? 0 : 1 });
      setRows((rs) => rs.map((r) => r.id === row.id ? { ...r, isActive: r.isActive ? 0 : 1 } : r));
    } catch {
      showToast("No se pudo actualizar", "error");
    }
  };

  const onToggleVisibility = async (row) => {
    if (!canEdit) return showToast("Sin permiso", "warning");
    const next = row.visibility === "public" ? "internal" : "public";
    try {
      await updateFaq(row.id, { visibility: next });
      fetchData();
    } catch {
      showToast("No se pudo actualizar", "error");
    }
  };

  const onSaveForm = async (payload) => {
    if (editing) {
      await updateFaq(editing.id, payload);
      showToast("FAQ actualizada", "success");
    } else {
      await createFaq(payload);
      showToast("FAQ creada", "success");
    }
    fetchData();
  };

  /* View state */
  const viewState = checkingSession ? "checking"
    : !canView      ? "no-permission"
    : fetchError    ? "error"
    : loading       ? "loading"
    : sortedRows.length === 0 ? "empty"
    : "data";

  /* ── Render ── */
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 shrink-0">
            <HelpCircle size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Gestión de FAQs
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Crea y administra las preguntas frecuentes del sistema
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/35 transition-all duration-200 shrink-0">
            <Plus size={16} /> Nueva FAQ
          </button>
        )}
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Búsqueda */}
        <div className="relative group flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar pregunta..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-8 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/40 shadow-sm"
          />
          {q && (
            <button
              onClick={() => { setQ(""); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-md transition-colors text-muted-foreground/60 hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Visibilidad */}
        <select
          value={visibility}
          onChange={(e) => { setVisibility(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-xl border border-border/60 bg-card text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer">
          <option value="all">Toda visibilidad</option>
          <option value="public">Público</option>
          <option value="internal">Interno</option>
        </select>

        {/* Estado */}
        <select
          value={active}
          onChange={(e) => { setActive(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-xl border border-border/60 bg-card text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer">
          <option value="all">Todos los estados</option>
          <option value="1">Activos</option>
          <option value="0">Inactivos</option>
        </select>

        {!loading && total > 0 && (
          <span className="text-xs text-muted-foreground/70 font-medium ml-auto">
            <span className="font-bold text-foreground">{total}</span> FAQ{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* CONTENT */}
      {viewState === "checking" && (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl flex flex-col items-center gap-3 py-20">
          <Loader2 size={28} className="text-muted-foreground/40 animate-spin" />
          <p className="text-sm font-bold text-muted-foreground">Verificando sesión…</p>
        </div>
      )}

      {viewState === "loading" && (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl overflow-hidden">
          <div className="divide-y divide-border/40">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-8 h-3 bg-muted/60 dark:bg-slate-700/60 rounded" />
                <div className="flex-1 h-3.5 bg-muted/60 dark:bg-slate-700/60 rounded-lg w-3/5" />
                <div className="w-20 h-3 bg-muted/40 dark:bg-slate-700/40 rounded-lg" />
                <div className="w-16 h-5 bg-muted/40 dark:bg-slate-700/40 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {viewState === "error" && (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl flex flex-col items-center gap-4 py-16">
          <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-900/30">
            <AlertTriangle size={22} className="text-rose-500" />
          </div>
          <div className="text-center">
            <p className="font-bold text-sm">Error al cargar</p>
            <p className="text-xs text-muted-foreground mt-1">{fetchError}</p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-border/60 bg-card text-sm font-bold hover:bg-muted/60 transition-all">
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      )}

      {viewState === "no-permission" && (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl flex flex-col items-center gap-3 py-20">
          <div className="p-3 rounded-2xl bg-muted/50 dark:bg-slate-800/50">
            <Lock size={22} className="text-muted-foreground/40" />
          </div>
          <p className="font-bold text-sm">Sin permiso</p>
          <p className="text-xs text-muted-foreground">Contacta a un administrador</p>
        </div>
      )}

      {viewState === "empty" && (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl flex flex-col items-center gap-3 py-20">
          <div className="w-14 h-14 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
            <HelpCircle size={26} className="text-muted-foreground/30" />
          </div>
          <p className="font-bold text-sm">No hay FAQs</p>
          <p className="text-xs text-muted-foreground">
            {q || visibility !== "all" || active !== "all"
              ? "Prueba ajustando los filtros"
              : "Crea la primera pregunta frecuente"}
          </p>
          {canCreate && (
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-2 h-9 px-4 mt-1 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all">
              <Plus size={14} /> Nueva FAQ
            </button>
          )}
        </div>
      )}

      {viewState === "data" && (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
          {/* Tabla con scroll horizontal en móvil */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 dark:bg-slate-800/30">
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 w-14">ID</th>
                  <SortTh label="Pregunta"   sortKey="question"   sort={sort} onSort={toggleSort} className="w-[28%]" />
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 w-[28%]">Respuesta</th>
                  <SortTh label="Categoría"  sortKey="category"   sort={sort} onSort={toggleSort} />
                  <SortTh label="Visibilidad" sortKey="visibility" sort={sort} onSort={toggleSort} />
                  <SortTh label="Orden"      sortKey="order"      sort={sort} onSort={toggleSort} className="w-20" />
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 w-20">Activo</th>
                  <th className="px-4 py-3 w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {sortedRows.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-4 py-3.5 text-xs font-bold text-muted-foreground/60">{r.id}</td>

                    {/* Pregunta */}
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-bold line-clamp-2 leading-snug">{r.question}</p>
                    </td>

                    {/* Respuesta + tags */}
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {stripHtml(r.answer || "").slice(0, 120)}{stripHtml(r.answer || "").length > 120 ? "…" : ""}
                      </p>
                      {toTagArray(r.tags).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {toTagArray(r.tags).slice(0, 3).map((tag, i) => (
                            <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted/60 text-muted-foreground">
                              <Tag size={8} /> {tag}
                            </span>
                          ))}
                          {toTagArray(r.tags).length > 3 && (
                            <span className="text-[10px] text-muted-foreground/60 font-bold">+{toTagArray(r.tags).length - 3}</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Categoría */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-muted/60 text-muted-foreground">
                        {r.category}
                      </span>
                    </td>

                    {/* Visibilidad */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        r.visibility === "public"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-muted/60 text-muted-foreground"
                      }`}>
                        {r.visibility === "public" ? "Público" : "Interno"}
                      </span>
                    </td>

                    {/* Orden */}
                    <td className="px-4 py-3.5 text-sm text-muted-foreground font-medium">{r.order ?? 0}</td>

                    {/* Activo */}
                    <td className="px-4 py-3.5">
                      <Toggle
                        checked={!!r.isActive}
                        onChange={() => onQuickToggleActive(r)}
                        disabled={!canEdit}
                      />
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {canEdit && (
                          <button
                            title="Editar"
                            onClick={() => onEdit(r)}
                            className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all">
                            <Pencil size={13} />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            title={r.visibility === "public" ? "Hacer interno" : "Hacer público"}
                            onClick={() => onToggleVisibility(r)}
                            className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all">
                            {r.visibility === "public" ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            title="Eliminar"
                            onClick={() => setDeleteTarget(r)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-all">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer paginación */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/40">
            <PaginationLite
              page={page}
              count={totalPages}
              onChange={setPage}
              siblingCount={1}
              boundaryCount={1}
              showFirstLast={false}
            />

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground/60 hidden sm:inline">
                Filas por página:
              </span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="h-8 px-2 rounded-lg border border-border/60 bg-card text-xs font-bold outline-none focus:border-primary/50 cursor-pointer">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Form panel */}
      <FaqFormDrawer
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSave={onSaveForm}
        initial={editing}
        tagOptions={tagOptions}
      />

      {/* Delete modal */}
      <DeleteModal
        faq={deleteTarget}
        onConfirm={onDeleteRow}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
