import { useState, useEffect, useMemo, useRef } from "react";
import { AlertTriangle, Search, ChevronDown, Loader2 } from "lucide-react";

/* ── Shared field styling ───────────────────────────────────────────── */

export function inputClass(hasError) {
  return [
    "w-full rounded-xl border px-4 py-2.5 text-sm transition-all outline-none",
    "bg-background dark:bg-slate-900/60 placeholder:text-muted-foreground/50",
    hasError
      ? "border-rose-400/70 ring-2 ring-rose-400/20"
      : "border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
    "disabled:opacity-60",
  ].join(" ");
}

export function Field({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
          <AlertTriangle size={10} />
          {error}
        </p>
      )}
    </div>
  );
}

/* ── SearchableSelect ───────────────────────────────────────────────── */

export function SearchableSelect({
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  disabled,
  emptyLabel = "Sin resultados",
}) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const ref               = useRef(null);

  const filtered = useMemo(
    () => options.filter((o) => (o.label || "").toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );
  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
          open
            ? "border-primary/70 ring-2 ring-primary/20 shadow-sm"
            : "border-border hover:border-primary/40 hover:shadow-sm",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        <span className={selected ? "font-medium text-foreground" : "text-muted-foreground text-sm"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-[300] top-full mt-1.5 w-full rounded-2xl border border-border/80 bg-card dark:bg-slate-900 shadow-2xl shadow-black/15 dark:shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-150">
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
                  onClick={() => { onChange(String(o.value)); setOpen(false); }}
                  className={[
                    "w-full text-left px-3 py-2 text-sm rounded-xl transition-all duration-150",
                    String(value) === String(o.value)
                      ? "bg-primary/10 dark:bg-primary/20 text-primary font-semibold"
                      : "hover:bg-muted/60 dark:hover:bg-slate-800 text-foreground",
                  ].join(" ")}
                >
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

/* ── Form fields — used by the full-page desktop form ───────────────── */

const STATE_OPTIONS = ["Disponible", "En Uso", "En Mantenimiento", "Reservado", "Inactivo"];

export default function VehiculoFormFields({ formik, isBusy, ubicOptions = [], isLoadingUbics = false, t }) {
  const stateOpts = STATE_OPTIONS.map((s) => ({
    value: s,
    label: t?.(`vehiculos.states.${s.toLowerCase().replace(/\s+/g, "_")}`, s) || s,
  }));

  const ubicOpts = ubicOptions.map((u) => ({
    value: String(u.id),
    label: u.nombre_ubicacion,
  }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Placa */}
      <Field
        label={t?.("vehiculos.modal.labels.placa", "Placa")}
        required
        error={formik.touched.placa && formik.errors.placa}
      >
        <input
          name="placa"
          value={formik.values.placa}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={isBusy}
          autoFocus
          placeholder={t?.("vehiculos.modal.placeholders.placa", "Ej. ABC-123")}
          className={inputClass(formik.touched.placa && !!formik.errors.placa)}
        />
      </Field>

      {/* Marca */}
      <Field
        label={t?.("vehiculos.modal.labels.marca", "Marca")}
        required
        error={formik.touched.marca && formik.errors.marca}
      >
        <input
          name="marca"
          value={formik.values.marca}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={isBusy}
          placeholder={t?.("vehiculos.modal.placeholders.marca", "Ej. Toyota")}
          className={inputClass(formik.touched.marca && !!formik.errors.marca)}
        />
      </Field>

      {/* Modelo */}
      <Field
        label={t?.("vehiculos.modal.labels.modelo", "Modelo")}
        required
        error={formik.touched.modelo && formik.errors.modelo}
      >
        <input
          name="modelo"
          value={formik.values.modelo}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={isBusy}
          placeholder={t?.("vehiculos.modal.placeholders.modelo", "Ej. Corolla 2022")}
          className={inputClass(formik.touched.modelo && !!formik.errors.modelo)}
        />
      </Field>

      {/* Estado */}
      <Field
        label={t?.("vehiculos.modal.labels.estado", "Estado")}
        required
        error={formik.touched.estado && formik.errors.estado}
      >
        <SearchableSelect
          value={formik.values.estado || ""}
          onChange={(val) => formik.setFieldValue("estado", val)}
          onBlur={() => formik.setFieldTouched("estado", true)}
          options={stateOpts}
          placeholder={t?.("vehiculos.modal.placeholders.estado", "Selecciona estado")}
          disabled={isBusy}
        />
      </Field>

      {/* Ubicación — full width */}
      <div className="sm:col-span-2">
        <Field
          label={t?.("vehiculos.modal.labels.ubicacion", "Ubicación actual")}
          required
          error={formik.touched.id_ubicacion_actual && formik.errors.id_ubicacion_actual}
        >
          <div className="relative">
            <SearchableSelect
              value={formik.values.id_ubicacion_actual ? String(formik.values.id_ubicacion_actual) : ""}
              onChange={(val) => formik.setFieldValue("id_ubicacion_actual", Number(val))}
              onBlur={() => formik.setFieldTouched("id_ubicacion_actual", true)}
              options={ubicOpts}
              placeholder={
                isLoadingUbics
                  ? t?.("vehiculos.modal.loading_ubicaciones", "Cargando ubicaciones…")
                  : t?.("vehiculos.modal.placeholders.ubicacion", "Selecciona ubicación")
              }
              disabled={isBusy || isLoadingUbics}
              emptyLabel={t?.("vehiculos.modal.no_ubicaciones", "Sin ubicaciones disponibles")}
            />
            {isLoadingUbics && (
              <Loader2
                size={13}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin pointer-events-none"
              />
            )}
          </div>
        </Field>
      </div>
    </div>
  );
}
