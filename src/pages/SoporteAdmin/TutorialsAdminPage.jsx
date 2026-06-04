// src/pages/SoporteAdmin/TutorialsAdminPage.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Plus, Search, Pencil, Trash2, Eye, EyeOff, X, Save,
  Loader2, AlertTriangle, PlayCircle, ChevronUp, ChevronDown,
  ListChecks, Paperclip, ArrowUp, ArrowDown, Clock,
} from "lucide-react";

import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

import { listTutorials, getTutorialBySlug } from "@/services/help.api";
import {
  createTutorial,
  updateTutorial,
  deleteTutorial,
  replaceTutorialSteps,
  replaceTutorialAttachments,
} from "@/services/helpAdmin.api";

import PaginationLite from "@/components/common/PaginationLite.jsx";

/* ── Utils ────────────────────────────────────────────────────────── */
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
    const s = value.trim();
    if (!s) return [];
    if (s.startsWith("[") || s.startsWith("{")) {
      try {
        const j = JSON.parse(s);
        return Array.isArray(j) ? j.map((t) => String(t).trim()) : [];
      } catch { /* cae a CSV */ }
    }
    return s.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

function formatDateISO(d) {
  try {
    return (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10);
  } catch { return ""; }
}

function fmtDuration(secs) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}

const CATEGORY_OPTS = ["General", "Vehículos", "Registros", "Inventario", "Usuarios", "Reportes", "Reservas", "Viáticos"];

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
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ── TagInput ─────────────────────────────────────────────────────── */
function TagInput({ value = [], onChange, suggestions = [], placeholder }) {
  const [input, setInput] = useState("");
  const id = "tag-datalist-tut";

  const addTag = (raw) => {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
  };

  const onKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
      setInput("");
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const onBlur = () => {
    if (input.trim()) { addTag(input); setInput(""); }
  };

  return (
    <div className="flex flex-wrap gap-1.5 min-h-[38px] bg-card border border-border/60 rounded-xl px-2.5 py-1.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 transition-all">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-lg">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="hover:opacity-60 transition-opacity">
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        list={id}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={onBlur}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[100px] bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
      />
      <datalist id={id}>
        {suggestions.map((s) => <option key={s} value={s} />)}
      </datalist>
    </div>
  );
}

/* ── Field ────────────────────────────────────────────────────────── */
function Field({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

/* ── SortTh ───────────────────────────────────────────────────────── */
function SortTh({ label, sortKey, sort, onSort, className = "" }) {
  const active = sort.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`px-4 py-3.5 text-left cursor-pointer select-none ${className}`}>
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 hover:text-foreground transition-colors">
        {label}
        {active
          ? sort.dir === "asc"
            ? <ChevronUp size={11} />
            : <ChevronDown size={11} />
          : <ChevronUp size={11} className="opacity-20" />}
      </span>
    </th>
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
            <h2 className="font-black text-base">¿Eliminar tutorial?</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              <span className="font-bold text-foreground">"{title}"</span> será eliminado permanentemente. Esta acción no se puede deshacer.
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

/* ── TutorialFormDrawer ────────────────────────────────────────────── */
function TutorialFormDrawer({ open, onClose, onSave, initial, tagOptions = [] }) {
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl]       = useState("");
  const [imageUrl, setImageUrl]       = useState("");
  const [category, setCategory]       = useState("");
  const [visibility, setVisibility]   = useState("public");
  const [tags, setTags]               = useState([]);
  const [durationSecs, setDurationSecs] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [saving, setSaving]           = useState(false);
  const [errors, setErrors]           = useState({});

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title || "");
    setDescription(initial?.description || "");
    setVideoUrl(initial?.videoUrl || "");
    setImageUrl(initial?.imageUrl || "");
    setCategory(initial?.category || "");
    setVisibility(initial?.visibility || "public");
    setTags(toTagArray(initial?.tags));
    setDurationSecs(initial?.duration_seconds ?? "");
    setPublishedDate(initial?.publishedDate ? formatDateISO(initial.publishedDate) : "");
    setSaving(false);
    setErrors({});
  }, [open, initial]);

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = "El título es obligatorio";
    if (!videoUrl.trim()) e.videoUrl = "La URL del video es obligatoria";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || "",
        videoUrl: videoUrl.trim(),
        imageUrl: imageUrl.trim() || null,
        category: category.trim() || null,
        visibility,
        tags,
        duration_seconds: durationSecs !== "" ? Number(durationSecs) : null,
        publishedDate: publishedDate || null,
        slug: initial?.slug || slugify(title),
      });
      onClose?.();
    } catch { /* toast is handled by caller */ }
    finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={() => !saving && onClose?.()}>
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 dark:bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="w-full sm:max-w-xl bg-card dark:bg-slate-900 border-l border-border/60 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl ring-1 ring-emerald-200/60 shrink-0">
              <PlayCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="font-black text-base tracking-tight">
              {initial ? "Editar tutorial" : "Nuevo tutorial"}
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
          <Field label="Título" required error={errors.title}>
            <input
              className={inputCls}
              placeholder="Ej. ¿Cómo usar el panel de vehículos?"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: "" })); }}
            />
          </Field>

          <Field label="Video URL" required error={errors.videoUrl}>
            <input
              className={inputCls}
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => { setVideoUrl(e.target.value); setErrors((p) => ({ ...p, videoUrl: "" })); }}
            />
          </Field>

          <Field label="Imagen de portada (opcional)">
            <input
              className={inputCls}
              placeholder="https://.../cover.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </Field>

          <Field label="Descripción">
            <textarea
              className={`${inputCls} resize-none`}
              rows={4}
              placeholder="Resumen breve del tutorial…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoría">
              <input
                list="tut-cat-opts"
                className={inputCls}
                placeholder="Ej. Reservas…"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <datalist id="tut-cat-opts">
                {CATEGORY_OPTS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>

            <Field label="Duración (segundos)">
              <input
                type="number"
                min="0"
                className={inputCls}
                placeholder="Ej. 300"
                value={durationSecs}
                onChange={(e) => setDurationSecs(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Visibilidad">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className={inputCls}>
                <option value="public">Público</option>
                <option value="internal">Interno</option>
              </select>
            </Field>

            <Field label="Fecha publicación">
              <input
                type="date"
                className={inputCls}
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Tags">
            <TagInput
              value={tags}
              onChange={setTags}
              suggestions={tagOptions}
              placeholder="Escribe un tag y Enter…"
            />
          </Field>

          {/* Publicado toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-muted/20 dark:bg-slate-800/20">
            <div>
              <p className="text-sm font-bold">Publicado</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {publishedDate ? `Publicado el ${publishedDate}` : "No publicado"}
              </p>
            </div>
            <Toggle
              checked={!!publishedDate}
              onChange={(v) => setPublishedDate(v ? formatDateISO(new Date()) : "")}
            />
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

/* ── StepsModal ────────────────────────────────────────────────────── */
function StepsModal({ open, onClose, tutorial, onSave }) {
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setItems(
      Array.isArray(tutorial?.steps)
        ? tutorial.steps.map((s) => ({
            id: s.id || null,
            step_no: s.step_no || 1,
            title: s.title || "",
            body: s.body || "",
            imageUrl: s.imageUrl || "",
          }))
        : []
    );
    setSaving(false);
  }, [open, tutorial]);

  const add = () =>
    setItems((arr) => [
      ...arr,
      { id: null, step_no: (arr[arr.length - 1]?.step_no || 0) + 1, title: "", body: "", imageUrl: "" },
    ]);

  const move = (idx, dir) =>
    setItems((arr) => {
      const next = arr.slice();
      const j = idx + dir;
      if (j < 0 || j >= next.length) return arr;
      [next[idx], next[j]] = [next[j], next[idx]];
      next.forEach((s, i) => (s.step_no = i + 1));
      return next;
    });

  const remove = (idx) =>
    setItems((arr) => arr.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_no: i + 1 })));

  const updateField = (idx, key, value) =>
    setItems((arr) => { const next = arr.slice(); next[idx] = { ...next[idx], [key]: value }; return next; });

  const save = async () => {
    setSaving(true);
    try {
      await onSave(items.map(({ title, body, imageUrl, step_no }) => ({
        title: String(title || ""),
        body: String(body || ""),
        imageUrl: imageUrl || null,
        step_no: Number(step_no) || 1,
      })));
    } finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-card dark:bg-slate-900 rounded-3xl shadow-2xl border border-border/40 flex flex-col animate-in zoom-in-95 duration-200"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 dark:bg-primary/15 rounded-xl ring-1 ring-primary/20">
              <ListChecks size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="font-black text-base tracking-tight">Pasos del tutorial</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[300px]">
                {tutorial?.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {items.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                <ListChecks size={22} className="text-muted-foreground/30" />
              </div>
              <p className="font-bold text-sm">Sin pasos todavía</p>
              <p className="text-xs text-muted-foreground">Agrega el primero con el botón de abajo</p>
            </div>
          )}

          {items.map((s, idx) => (
            <div key={idx} className="bg-muted/20 dark:bg-slate-800/30 border border-border/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0">
                    {s.step_no}
                  </span>
                  <input
                    className={inputCls}
                    placeholder="Título del paso…"
                    value={s.title}
                    onChange={(e) => updateField(idx, "title", e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg hover:bg-muted/60 disabled:opacity-30 transition-colors">
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => move(idx, 1)}
                    disabled={idx === items.length - 1}
                    className="p-1.5 rounded-lg hover:bg-muted/60 disabled:opacity-30 transition-colors">
                    <ArrowDown size={13} />
                  </button>
                  <button
                    onClick={() => remove(idx)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-muted-foreground hover:text-rose-500 transition-colors">
                    <X size={13} />
                  </button>
                </div>
              </div>

              <textarea
                className={`${inputCls} resize-none`}
                rows={3}
                placeholder="Contenido del paso…"
                value={s.body}
                onChange={(e) => updateField(idx, "body", e.target.value)}
              />

              <input
                className={inputCls}
                placeholder="URL de imagen (opcional) https://..."
                value={s.imageUrl || ""}
                onChange={(e) => updateField(idx, "imageUrl", e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border/60 shrink-0">
          <button
            onClick={add}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-border/60 bg-card text-sm font-bold hover:bg-muted/60 transition-all">
            <Plus size={14} /> Añadir paso
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-border/60 bg-card text-sm font-bold hover:bg-muted/60 transition-all">
              Cerrar
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── AttachmentsModal ──────────────────────────────────────────────── */
function AttachmentsModal({ open, onClose, tutorial, onSave }) {
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setItems(
      Array.isArray(tutorial?.attachments)
        ? tutorial.attachments.map((a) => ({
            id: a.id || null,
            name: a.name || "",
            url: a.url || "",
            mime_type: a.mime_type || "",
            size_kb: a.size_kb || "",
          }))
        : []
    );
    setSaving(false);
  }, [open, tutorial]);

  const add = () => setItems((arr) => [...arr, { id: null, name: "", url: "", mime_type: "", size_kb: "" }]);
  const remove = (idx) => setItems((arr) => arr.filter((_, i) => i !== idx));
  const updateField = (idx, key, value) =>
    setItems((arr) => { const next = arr.slice(); next[idx] = { ...next[idx], [key]: value }; return next; });

  const save = async () => {
    setSaving(true);
    try {
      await onSave(items.map(({ name, url, mime_type, size_kb }) => ({
        name: String(name || ""),
        url: String(url || ""),
        mime_type: mime_type || null,
        size_kb: size_kb ? Number(size_kb) : null,
      })));
    } finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-card dark:bg-slate-900 rounded-3xl shadow-2xl border border-border/40 flex flex-col animate-in zoom-in-95 duration-200"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl ring-1 ring-amber-200/60">
              <Paperclip size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-black text-base tracking-tight">Adjuntos</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[280px]">
                {tutorial?.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {items.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Paperclip size={22} className="text-muted-foreground/30" />
              </div>
              <p className="font-bold text-sm">Sin adjuntos todavía</p>
              <p className="text-xs text-muted-foreground">Añade archivos o enlaces descargables</p>
            </div>
          )}

          {items.map((a, idx) => (
            <div key={idx} className="bg-muted/20 dark:bg-slate-800/30 border border-border/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/20 text-amber-600 text-xs font-black flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  className={inputCls}
                  placeholder="Nombre del adjunto…"
                  value={a.name}
                  onChange={(e) => updateField(idx, "name", e.target.value)}
                />
                <button
                  onClick={() => remove(idx)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-muted-foreground hover:text-rose-500 transition-colors shrink-0">
                  <X size={13} />
                </button>
              </div>

              <input
                className={inputCls}
                placeholder="URL del archivo https://..."
                value={a.url}
                onChange={(e) => updateField(idx, "url", e.target.value)}
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inputCls}
                  placeholder="MIME type (application/pdf…)"
                  value={a.mime_type}
                  onChange={(e) => updateField(idx, "mime_type", e.target.value)}
                />
                <input
                  type="number"
                  className={inputCls}
                  placeholder="Tamaño (KB)"
                  value={a.size_kb}
                  onChange={(e) => updateField(idx, "size_kb", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border/60 shrink-0">
          <button
            onClick={add}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-border/60 bg-card text-sm font-bold hover:bg-muted/60 transition-all">
            <Plus size={14} /> Añadir adjunto
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-border/60 bg-card text-sm font-bold hover:bg-muted/60 transition-all">
              Cerrar
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────── */
export default function TutorialsAdminPage() {
  const { showToast } = useToast();
  const { hasPermiso, userData, checkingSession } = useAuth();
  const canManage =
    hasPermiso?.("help_manage") || (userData?.rol || "").toLowerCase() === "admin";

  // Data
  const [rows, setRows]   = useState([]);
  const [total, setTotal] = useState(0);

  // Filtros
  const [q, setQ]               = useState("");
  const [visibility, setVisibility] = useState("all");
  const [category, setCategory] = useState("");
  const [page, setPage]         = useState(1);
  const [limit, setLimit]       = useState(10);
  const [sort, setSort]         = useState({ key: "title", dir: "asc" });

  // Estado
  const [loading, setLoading]   = useState(true);
  const [viewError, setViewError] = useState(null);

  // Paneles
  const [openForm, setOpenForm]             = useState(false);
  const [editing, setEditing]               = useState(null);
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [deleting, setDeleting]             = useState(false);
  const [openSteps, setOpenSteps]           = useState(false);
  const [openAttachments, setOpenAttachments] = useState(false);
  const [selected, setSelected]             = useState(null);

  /* ── Fetch ───────────────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    if (checkingSession) return;
    if (!canManage) { setRows([]); setTotal(0); setLoading(false); return; }
    setLoading(true);
    setViewError(null);
    try {
      const res = await listTutorials({
        page, limit,
        q: q || undefined,
        category: category || undefined,
        visibility: visibility === "all" ? undefined : visibility,
      });
      const items = res?.items || [];
      setRows(items);
      setTotal(Number(res?.total || items.length));
    } catch (e) {
      setViewError(e?.message || "No se pudieron cargar los tutoriales");
      setRows([]);
      setTotal(0);
    } finally { setLoading(false); }
  }, [page, limit, q, category, visibility, canManage, checkingSession]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Sort local ──────────────────────────────────────────────────── */
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

  /* ── Tag options ─────────────────────────────────────────────────── */
  const tagOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => toTagArray(r.tags).forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  /* ── Actions ─────────────────────────────────────────────────────── */
  const onSaveForm = async (payload) => {
    if (!canManage) throw new Error("Sin permiso");
    if (editing) {
      await updateTutorial(editing.id, payload);
      showToast("Tutorial actualizado", "success");
    } else {
      await createTutorial(payload);
      showToast("Tutorial creado", "success");
    }
    fetchData();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTutorial(deleteTarget.id);
      showToast("Tutorial eliminado", "success");
      setDeleteTarget(null);
      fetchData();
    } catch (e) {
      showToast(e?.message || "No se pudo eliminar", "danger");
    } finally { setDeleting(false); }
  };

  const onQuickToggleVisibility = async (row) => {
    const next = row.visibility === "public" ? "internal" : "public";
    try {
      await updateTutorial(row.id, { visibility: next });
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, visibility: next } : r)));
    } catch (e) { showToast(e?.message || "No se pudo actualizar", "danger"); }
  };

  const onQuickTogglePublished = async (row) => {
    const next = row.publishedDate ? null : formatDateISO(new Date());
    try {
      await updateTutorial(row.id, { publishedDate: next });
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, publishedDate: next } : r)));
    } catch (e) { showToast(e?.message || "No se pudo actualizar", "danger"); }
  };

  const openStepsFor = async (row) => {
    try {
      const full = await getTutorialBySlug(row.slug);
      setSelected(full);
      setOpenSteps(true);
    } catch { showToast("No pude cargar los pasos", "danger"); }
  };

  const openAttachmentsFor = async (row) => {
    try {
      const full = await getTutorialBySlug(row.slug);
      setSelected(full);
      setOpenAttachments(true);
    } catch { showToast("No pude cargar los adjuntos", "danger"); }
  };

  const saveSteps = async (stepsPayload) => {
    await replaceTutorialSteps(selected.id, stepsPayload);
    showToast("Pasos guardados", "success");
    setOpenSteps(false);
  };

  const saveAttachments = async (attPayload) => {
    await replaceTutorialAttachments(selected.id, attPayload);
    showToast("Adjuntos guardados", "success");
    setOpenAttachments(false);
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
            <PlayCircle size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Gestionar Tutoriales
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Crea, edita y organiza los tutoriales del centro de ayuda
            </p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={() => { setEditing(null); setOpenForm(true); }}
            className="inline-flex items-center gap-2 rounded-2xl px-5 h-10 font-bold text-sm bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/35 transition-all duration-200 shrink-0">
            <Plus size={16} />
            Nuevo tutorial
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
            placeholder="Buscar tutoriales…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>

        {/* Categoría */}
        <input
          list="tut-admin-cat"
          className="h-9 px-3 w-full sm:w-48 bg-card border border-border/60 rounded-xl text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/40"
          placeholder="Categoría"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
        />
        <datalist id="tut-admin-cat">
          {CATEGORY_OPTS.map((c) => <option key={c} value={c} />)}
        </datalist>

        {/* Visibilidad */}
        <select
          value={visibility}
          onChange={(e) => { setVisibility(e.target.value); setPage(1); }}
          className="h-9 px-3 bg-card border border-border/60 rounded-xl text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer">
          <option value="all">Todos</option>
          <option value="public">Públicos</option>
          <option value="internal">Internos</option>
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
            <span className="font-bold text-foreground">{total}</span> tutorial{total !== 1 ? "es" : ""}
          </span>
        )}
      </div>

      {/* TABLA */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">

        {/* States */}
        {viewState === "checking" && (
          <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
            <Loader2 size={28} className="animate-spin opacity-40" />
            <p className="text-sm font-medium">Verificando sesión…</p>
          </div>
        )}

        {viewState === "no-permission" && (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-14 h-14 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
              <PlayCircle size={26} className="text-muted-foreground/30" />
            </div>
            <p className="font-bold text-sm">Sin permisos para gestionar tutoriales</p>
            <p className="text-xs text-muted-foreground">Consulta con un administrador.</p>
          </div>
        )}

        {viewState === "error" && (
          <div className="flex items-center gap-3 m-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 rounded-2xl">
            <AlertTriangle size={18} className="text-rose-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-rose-700 dark:text-rose-300">{viewError}</p>
            </div>
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
                <div className="w-8 h-8 rounded-xl bg-muted/60 dark:bg-slate-700 shrink-0" />
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
              <PlayCircle size={26} className="text-muted-foreground/30" />
            </div>
            <p className="font-bold text-sm">No hay tutoriales todavía</p>
            <p className="text-xs text-muted-foreground">
              {q || category || visibility !== "all"
                ? "Ajusta los filtros para ver más resultados"
                : "Crea el primero con el botón \"Nuevo tutorial\""}
            </p>
          </div>
        )}

        {viewState === "data" && (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 820 }}>
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 dark:bg-slate-800/30">
                  <SortTh label="Título"       sortKey="title"         sort={sort} onSort={toggleSort} className="pl-5" />
                  <SortTh label="Categoría"    sortKey="category"      sort={sort} onSort={toggleSort} />
                  <SortTh label="Visibilidad"  sortKey="visibility"    sort={sort} onSort={toggleSort} />
                  <SortTh label="Publicado"    sortKey="publishedDate" sort={sort} onSort={toggleSort} />
                  <th className="px-4 py-3.5 text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Duración</span>
                  </th>
                  <th className="px-4 py-3.5 text-right pr-5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors group">

                    {/* Título */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center mt-0.5">
                          <PlayCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate max-w-[260px]">{r.title}</p>
                          {r.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[260px] mt-0.5">
                              {r.description.slice(0, 90)}{r.description.length > 90 ? "…" : ""}
                            </p>
                          )}
                          {toTagArray(r.tags).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {toTagArray(r.tags).slice(0, 3).map((t) => (
                                <span key={t} className="inline-block px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md">
                                  {t}
                                </span>
                              ))}
                              {toTagArray(r.tags).length > 3 && (
                                <span className="text-[10px] text-muted-foreground/60 font-medium">
                                  +{toTagArray(r.tags).length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted/60 dark:bg-slate-800/60 text-muted-foreground">
                        {r.category || "—"}
                      </span>
                    </td>

                    {/* Visibilidad */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => canManage && onQuickToggleVisibility(r)}
                        title={r.visibility === "public" ? "Hacer interno" : "Hacer público"}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                          r.visibility === "public"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/50"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted"
                        }`}>
                        {r.visibility === "public" ? <Eye size={10} /> : <EyeOff size={10} />}
                        {r.visibility === "public" ? "Público" : "Interno"}
                      </button>
                    </td>

                    {/* Publicado */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Toggle
                          checked={!!r.publishedDate}
                          onChange={() => canManage && onQuickTogglePublished(r)}
                          disabled={!canManage}
                        />
                        {r.publishedDate && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock size={9} />
                            {formatDateISO(r.publishedDate)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Duración */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-muted-foreground font-medium">
                        {fmtDuration(r.duration_seconds)}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3.5 pr-5">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {/* Editar */}
                        <button
                          onClick={() => { setEditing(r); setOpenForm(true); }}
                          disabled={!canManage}
                          title="Editar"
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30">
                          <Pencil size={14} />
                        </button>

                        {/* Pasos */}
                        <button
                          onClick={() => openStepsFor(r)}
                          disabled={!canManage}
                          title="Gestionar pasos"
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30">
                          <ListChecks size={14} />
                        </button>

                        {/* Adjuntos */}
                        <button
                          onClick={() => openAttachmentsFor(r)}
                          disabled={!canManage}
                          title="Gestionar adjuntos"
                          className="p-1.5 rounded-lg hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600 transition-colors disabled:opacity-30">
                          <Paperclip size={14} />
                        </button>

                        {/* Eliminar */}
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
            Mostrando {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total} tutoriales
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
    <TutorialFormDrawer
      open={openForm}
      initial={editing}
      onClose={() => setOpenForm(false)}
      onSave={onSaveForm}
      tagOptions={tagOptions}
    />

    <StepsModal
      open={openSteps}
      onClose={() => setOpenSteps(false)}
      tutorial={selected}
      onSave={saveSteps}
    />

    <AttachmentsModal
      open={openAttachments}
      onClose={() => setOpenAttachments(false)}
      tutorial={selected}
      onSave={saveAttachments}
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
