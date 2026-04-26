import { useEffect, useMemo } from "react";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { X, Loader2, AlertTriangle } from "lucide-react";

import { validationSchemaFactory } from "./VehiculosModal";

/* ── Shared helpers ──────────────────────────────────────────────────── */

const STATE_OPTIONS = ["Disponible", "En Uso", "En Mantenimiento", "Reservado", "Inactivo"];

function fieldCls(hasError) {
  return [
    "w-full px-3 py-2.5 rounded-xl text-sm",
    "bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-200",
    "border transition-colors outline-none",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "placeholder:text-gray-400 dark:placeholder:text-gray-600",
    hasError
      ? "border-red-400 dark:border-red-600 ring-1 ring-red-400/30"
      : "border-gray-200 dark:border-gray-700 focus:border-primary/50 focus:ring-2 focus:ring-primary/15",
  ].join(" ");
}

function Field({ label, required, error, touched, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {touched && error && (
        <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1" role="alert">
          <AlertTriangle size={10} />
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Sheet ───────────────────────────────────────────────────────────── */

export default function VehiculoFormSheet({
  open,
  onClose,
  onSubmit,
  saving      = false,
  initialValues = {
    id:                   null,
    placa:                "",
    marca:                "",
    modelo:               "",
    estado:               "Disponible",
    id_ubicacion_actual:  null,
  },
  ubicOptions    = [],
  isLoadingUbics = false,
  title,
}) {
  const { t } = useTranslation();

  const validationSchema = useMemo(() => validationSchemaFactory(t), [t]);

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, helpers) => {
      try { await onSubmit?.(values); }
      finally { helpers.setSubmitting(false); }
    },
  });

  const isBusy = saving || formik.isSubmitting;

  /* Scroll lock */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const handleClose = () => { if (!isBusy) onClose?.(); };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full bg-card dark:bg-slate-900 rounded-t-3xl shadow-2xl dark:shadow-black/50 border border-border/40 flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {title || (initialValues?.id
              ? t("vehiculos.modal.title_edit",  "Editar vehículo")
              : t("vehiculos.modal.title_add",   "Agregar vehículo"))}
          </h2>
          <button
            onClick={handleClose}
            disabled={isBusy}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={formik.handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 pb-[env(safe-area-inset-bottom,0px)]">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t("vehiculos.modal.required_note", "Los campos marcados con * son obligatorios.")}
            </p>

            {/* Placa */}
            <Field
              label={t("vehiculos.modal.labels.placa", "Placa")}
              required
              error={formik.errors.placa}
              touched={formik.touched.placa}
            >
              <input
                name="placa"
                value={formik.values.placa}
                onChange={formik.handleChange}
                onBlur={() => formik.setFieldTouched("placa", true)}
                placeholder={t("vehiculos.modal.placeholders.placa", "Ej. ABC-123")}
                disabled={isBusy}
                autoFocus
                className={fieldCls(formik.touched.placa && !!formik.errors.placa)}
              />
            </Field>

            {/* Marca */}
            <Field
              label={t("vehiculos.modal.labels.marca", "Marca")}
              required
              error={formik.errors.marca}
              touched={formik.touched.marca}
            >
              <input
                name="marca"
                value={formik.values.marca}
                onChange={formik.handleChange}
                onBlur={() => formik.setFieldTouched("marca", true)}
                placeholder={t("vehiculos.modal.placeholders.marca", "Ej. Toyota")}
                disabled={isBusy}
                className={fieldCls(formik.touched.marca && !!formik.errors.marca)}
              />
            </Field>

            {/* Modelo */}
            <Field
              label={t("vehiculos.modal.labels.modelo", "Modelo")}
              required
              error={formik.errors.modelo}
              touched={formik.touched.modelo}
            >
              <input
                name="modelo"
                value={formik.values.modelo}
                onChange={formik.handleChange}
                onBlur={() => formik.setFieldTouched("modelo", true)}
                placeholder={t("vehiculos.modal.placeholders.modelo", "Ej. Corolla 2022")}
                disabled={isBusy}
                className={fieldCls(formik.touched.modelo && !!formik.errors.modelo)}
              />
            </Field>

            {/* Estado — native select avoids overflow/z-index issues in sheet */}
            <Field
              label={t("vehiculos.modal.labels.estado", "Estado")}
              required
              error={formik.errors.estado}
              touched={formik.touched.estado}
            >
              <select
                name="estado"
                value={formik.values.estado || ""}
                onChange={formik.handleChange}
                onBlur={() => formik.setFieldTouched("estado", true)}
                disabled={isBusy}
                className={fieldCls(formik.touched.estado && !!formik.errors.estado)}
              >
                <option value="" disabled>
                  {t("vehiculos.modal.placeholders.estado", "Selecciona estado")}
                </option>
                {STATE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {t(`vehiculos.states.${s.toLowerCase().replace(/\s+/g, "_")}`, s)}
                  </option>
                ))}
              </select>
            </Field>

            {/* Ubicación — native select */}
            <Field
              label={t("vehiculos.modal.labels.ubicacion", "Ubicación actual")}
              required
              error={formik.errors.id_ubicacion_actual}
              touched={formik.touched.id_ubicacion_actual}
            >
              <div className="relative">
                <select
                  name="id_ubicacion_actual"
                  value={formik.values.id_ubicacion_actual ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    formik.setFieldValue("id_ubicacion_actual", v === "" ? null : Number(v));
                  }}
                  onBlur={() => formik.setFieldTouched("id_ubicacion_actual", true)}
                  disabled={isBusy || isLoadingUbics}
                  className={fieldCls(formik.touched.id_ubicacion_actual && !!formik.errors.id_ubicacion_actual)}
                >
                  <option value="" disabled>
                    {isLoadingUbics
                      ? t("vehiculos.modal.loading_ubicaciones", "Cargando ubicaciones…")
                      : t("vehiculos.modal.placeholders.ubicacion", "Selecciona ubicación")}
                  </option>
                  {ubicOptions.length === 0 && !isLoadingUbics && (
                    <option value="" disabled>
                      {t("vehiculos.modal.no_ubicaciones", "No hay ubicaciones disponibles")}
                    </option>
                  )}
                  {ubicOptions.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre_ubicacion}</option>
                  ))}
                </select>
                {isLoadingUbics && (
                  <Loader2
                    size={14}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 animate-spin pointer-events-none"
                  />
                )}
              </div>
            </Field>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border/60 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isBusy}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              {t("vehiculos.modal.cancel", "Cancelar")}
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isBusy && <Loader2 size={14} className="animate-spin" />}
              {initialValues?.id
                ? t("vehiculos.modal.update", "Actualizar")
                : t("vehiculos.modal.save",   "Guardar")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
