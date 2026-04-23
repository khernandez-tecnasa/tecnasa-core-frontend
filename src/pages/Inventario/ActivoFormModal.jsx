// src/pages/Inventario/ActivoFormModal.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import {
  Monitor,
  X,
  Save,
  Plus,
  Loader2,
  AlertTriangle,
  Search,
  ChevronDown,
  Package,
  Tag,
} from "lucide-react";

import { useAuth }    from "../../context/AuthContext";
import { useToast }   from "../../context/ToastContext";
import { Button }     from "@/components/ui/button";
import useIsMobile    from "@/hooks/useIsMobile";

import {
  createActivoEnBodega,
  getNextActivoCode,
} from "../../services/ActivosBodegaServices";
import { updateActivo }   from "../../services/ActivosServices";
import { ESTATUS_ACTIVO, TIPOS_ACTIVO, ESTATUS_COLOR } from "../../constants/inventario";

// ── SearchableSelect ──────────────────────────────────────────────────────────

function SearchableSelect({ value, onChange, options, placeholder, disabled, emptyLabel = "Sin resultados" }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const ref               = useRef(null);

  const filtered = useMemo(
    () => options.filter((o) => (o.label || "").toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );
  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setOpen((v) => !v); setQuery(""); }}
        className={[
          "w-full flex items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 outline-none text-left",
          "bg-background dark:bg-slate-900/60",
          open ? "border-primary/70 ring-2 ring-primary/20" : "border-border hover:border-primary/40",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        ].join(" ")}>
        <span className={selected ? "font-medium text-foreground" : "text-muted-foreground text-sm"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={15} className={`text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-[300] top-full mt-1.5 w-full rounded-2xl border border-border/80 bg-card dark:bg-slate-900 shadow-2xl dark:shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-muted/40 dark:bg-slate-800/80 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none placeholder:text-muted-foreground/60 focus:ring-1 ring-primary/20"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto overscroll-contain py-1.5 px-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-6 text-muted-foreground">
                <Search size={16} className="opacity-40" />
                <p className="text-xs">{emptyLabel}</p>
              </div>
            ) : filtered.map((o) => (
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Field helper ──────────────────────────────────────────────────────────────

function Field({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
        {label}{required && <span className="text-primary ml-1">*</span>}
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

// ── Catálogos ────────────────────────────────────────────────────────────────

const TIPO_OPTIONS    = TIPOS_ACTIVO.map((v) => ({ value: v, label: v }));
const ESTATUS_OPTIONS = ESTATUS_ACTIVO.map((v) => ({ value: v, label: v }));

// ── Esquema de validación ─────────────────────────────────────────────────────

const validationSchema = yup.object({
  nombre:        yup.string().trim().required("El nombre es requerido"),
  modelo:        yup.string().nullable(),
  serial_number: yup.string().nullable(),
  tipo:          yup.string().required("El tipo es requerido"),
  estatus:       yup.string().required("El estado es requerido"),
});

// ── Componente principal ──────────────────────────────────────────────────────

export default function ActivoFormModal({ open, onClose, onSaved, idBodega, editing }) {
  const { userData }  = useAuth();
  const { showToast } = useToast();
  const isMobile      = useIsMobile(768);

  const isEditing  = !!editing;
  const isCreating = !isEditing && !!idBodega;

  const [nextCode, setNextCode]     = useState("");
  const [loadingNext, setLoadingNext] = useState(false);
  const [nextErr, setNextErr]       = useState("");

  const formik = useFormik({
    initialValues: {
      nombre:        "",
      modelo:        "",
      serial_number: "",
      tipo:          "Otro",
      estatus:       "Activo",
    },
    validationSchema,
    onSubmit: async (values, helpers) => {
      try {
        const payload = {
          nombre:              values.nombre.trim(),
          modelo:              values.modelo || null,
          serial_number:       values.serial_number || null,
          tipo:                values.tipo,
          estatus:             values.estatus,
          usuario_responsable: userData?.id_usuario ?? userData?.id ?? null,
        };

        if (isEditing) {
          await updateActivo(editing.id, payload);
          showToast("Activo actualizado", "success");
        } else if (isCreating) {
          await createActivoEnBodega({ ...payload, id_bodega: idBodega });
          showToast("Activo creado", "success");
        }

        onSaved?.();
        onClose?.();
      } catch (err) {
        showToast(err?.message || "Error al guardar", "danger");
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (!open) { formik.resetForm(); return; }

    if (isEditing) {
      formik.setValues({
        nombre:        editing.nombre        || "",
        modelo:        editing.modelo        || "",
        serial_number: editing.serial_number || "",
        tipo:          editing.tipo          || "Otro",
        estatus:       editing.estatus       || "Activo",
      });
      setNextCode(editing.codigo || "");
    } else if (isCreating) {
      formik.resetForm();
      setNextCode(""); setLoadingNext(true); setNextErr("");
      getNextActivoCode()
        .then((r) => setNextCode(typeof r === "string" ? r : r?.next ?? ""))
        .catch(() => setNextErr("Error al obtener el código"))
        .finally(() => setLoadingNext(false));
    }
  }, [open, editing, idBodega]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const isSubmitting = formik.isSubmitting;

  // Color del badge de código
  const badgeColor = isCreating
    ? nextErr ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary border-primary/20"
    : `bg-${ESTATUS_COLOR[formik.values.estatus] === "success" ? "emerald" : ESTATUS_COLOR[formik.values.estatus] === "danger" ? "rose" : "primary"}/10 text-primary border-primary/20`;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => !isSubmitting && onClose?.()}
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
            <Monitor size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black tracking-tight">
              {isEditing ? "Editar Activo" : "Nuevo Activo"}
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isEditing ? `Modificando: ${editing.nombre}` : "Completa la información del activo"}
            </p>
          </div>
          <button
            onClick={() => !isSubmitting && onClose?.()}
            disabled={isSubmitting}
            className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-40">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-4">

          {/* Código */}
          <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 dark:bg-slate-800/40 rounded-2xl border border-border/40">
            <Tag size={14} className="text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Código</p>
              {isCreating && loadingNext ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Loader2 size={12} className="animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Generando...</span>
                </div>
              ) : (
                <p className="text-sm font-black font-mono text-foreground mt-0.5">{nextCode || "—"}</p>
              )}
            </div>
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${isEditing ? "bg-muted text-muted-foreground border-border/60" : "bg-primary/10 text-primary border-primary/20"}`}>
              {isEditing ? "Fijo" : "Auto"}
            </span>
          </div>

          {/* Sección: Información básica */}
          <div className="bg-muted/30 dark:bg-slate-800/30 border border-border/40 rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-1">
              <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
                <Monitor size={13} className="text-muted-foreground" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Información básica
              </h3>
            </div>

            <Field label="Nombre" required error={formik.touched.nombre && formik.errors.nombre}>
              <input
                autoFocus
                name="nombre"
                value={formik.values.nombre}
                onChange={formik.handleChange}
                onBlur={() => formik.setFieldTouched("nombre", true)}
                disabled={isSubmitting}
                placeholder="Nombre del activo..."
                className={inputCls(formik.touched.nombre && formik.errors.nombre)}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Modelo">
                <input
                  name="modelo"
                  value={formik.values.modelo}
                  onChange={formik.handleChange}
                  disabled={isSubmitting}
                  placeholder="Ej: HP LaserJet..."
                  className={inputCls(false)}
                />
              </Field>

              <Field label="Número de serie">
                <input
                  name="serial_number"
                  value={formik.values.serial_number}
                  onChange={formik.handleChange}
                  disabled={isSubmitting}
                  placeholder="Serial number..."
                  className={inputCls(false)}
                />
              </Field>
            </div>
          </div>

          {/* Sección: Clasificación */}
          <div className="bg-muted/30 dark:bg-slate-800/30 border border-border/40 rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-1">
              <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
                <Package size={13} className="text-muted-foreground" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Clasificación
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Tipo" required error={formik.touched.tipo && formik.errors.tipo}>
                <SearchableSelect
                  value={formik.values.tipo}
                  onChange={(v) => formik.setFieldValue("tipo", v)}
                  options={TIPO_OPTIONS}
                  placeholder="Selecciona un tipo..."
                  disabled={isSubmitting}
                />
              </Field>

              <Field label="Estado" required error={formik.touched.estatus && formik.errors.estatus}>
                <SearchableSelect
                  value={formik.values.estatus}
                  onChange={(v) => formik.setFieldValue("estatus", v)}
                  options={ESTATUS_OPTIONS}
                  placeholder="Selecciona un estado..."
                  disabled={isSubmitting}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none px-6 py-4 border-t border-border/50 bg-card/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <div className="flex gap-2.5">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={formik.handleSubmit}
              className="flex-1 rounded-2xl h-10 font-bold shadow-md shadow-primary/15 gap-2 disabled:opacity-60">
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : isEditing ? <Save size={15} /> : <Plus size={15} />}
              {isSubmitting ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Activo"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose?.()}
              disabled={isSubmitting}
              className="flex-1 rounded-2xl h-10 font-bold">
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
