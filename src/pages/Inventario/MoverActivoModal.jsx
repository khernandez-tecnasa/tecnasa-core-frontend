// src/pages/Inventario/MoverActivoModal.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import {
  ArrowLeftRight,
  X,
  Save,
  Loader2,
  AlertTriangle,
  Search,
  ChevronDown,
  Warehouse,
  Users,
  Building2,
  MapPin,
} from "lucide-react";

import { moverActivo }              from "../../services/UbicacionesServices";
import { getBodegas }               from "../../services/BodegasServices";
import { getClientes }              from "../../services/ClientesServices";
import { getActiveSitesByCliente }  from "../../services/SitesServices";
import { getEmpleados }             from "../../services/AuthServices";
import { useToast }                 from "../../context/ToastContext";
import { useAuth }                  from "../../context/AuthContext";
import { Button }                   from "@/components/ui/button";
import useIsMobile                  from "@/hooks/useIsMobile";

// ── Helpers ───────────────────────────────────────────────────────────────────

const normalize = (s = "") =>
  s.toString().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// ── SearchableSelect ──────────────────────────────────────────────────────────

function SearchableSelect({ value, onChange, onBlur, options, placeholder, disabled, emptyLabel = "Sin resultados", loading: isLoading }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const ref               = useRef(null);

  const filtered = useMemo(
    () => options.filter((o) => normalize(o.label || "").includes(normalize(query))),
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
        disabled={disabled || isLoading}
        onClick={() => { setOpen((v) => !v); setQuery(""); }}
        className={[
          "w-full flex items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 outline-none text-left",
          "bg-background dark:bg-slate-900/60",
          open ? "border-primary/70 ring-2 ring-primary/20" : "border-border hover:border-primary/40",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        ].join(" ")}>
        {isLoading ? (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Loader2 size={13} className="animate-spin" /> Cargando...
          </span>
        ) : (
          <span className={selected ? "font-medium text-foreground" : "text-muted-foreground text-sm"}>
            {selected ? selected.label : placeholder}
          </span>
        )}
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
          <div className="max-h-52 overflow-y-auto overscroll-contain py-1.5 px-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-6 text-muted-foreground">
                <Search size={16} className="opacity-40" />
                <p className="text-xs">{emptyLabel}</p>
              </div>
            ) : filtered.map((o) => (
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

// ── Tipos de destino ──────────────────────────────────────────────────────────

const TIPO_OPTIONS = [
  { value: "Bodega",   label: "Bodega" },
  { value: "Cliente",  label: "Cliente" },
  { value: "Empleado", label: "Empleado" },
];

const TIPO_ICON = {
  Bodega:   <Warehouse size={15} className="text-muted-foreground" />,
  Cliente:  <Building2 size={15} className="text-muted-foreground" />,
  Empleado: <Users size={15} className="text-muted-foreground" />,
};

// ── Esquema de validación ─────────────────────────────────────────────────────

const validationSchema = yup.object({
  tipo_destino: yup.string().required("El tipo de destino es requerido"),
  motivo:       yup.string().required("El motivo es requerido"),
  id_bodega:    yup.string().when("tipo_destino", {
    is: "Bodega",
    then: (s) => s.required("Debes seleccionar una bodega"),
    otherwise: (s) => s.nullable(),
  }),
  id_empleado:  yup.string().when("tipo_destino", {
    is: "Empleado",
    then: (s) => s.required("Debes seleccionar un empleado"),
    otherwise: (s) => s.nullable(),
  }),
  id_site:      yup.string().when("tipo_destino", {
    is: "Cliente",
    then: (s) => s.required("Debes seleccionar un site"),
    otherwise: (s) => s.nullable(),
  }),
});

// ── Componente principal ──────────────────────────────────────────────────────

export default function MoverActivoModal({
  open,
  onClose,
  activo,
  onSaved,
  defaultTipo = "Bodega",
  defaultClienteId = null,
}) {
  const { showToast } = useToast();
  const { userData }  = useAuth();
  const isMobile      = useIsMobile(768);

  const [clientes, setClientes]           = useState([]);
  const [sites, setSites]                 = useState([]);
  const [bodegas, setBodegas]             = useState([]);
  const [empleados, setEmpleados]         = useState([]);
  const [loadingBase, setLoadingBase]     = useState(false);
  const [loadingSites, setLoadingSites]   = useState(false);
  const [loadingEmp, setLoadingEmp]       = useState(false);

  const formik = useFormik({
    initialValues: {
      tipo_destino: defaultTipo,
      id_cliente:   defaultClienteId ? String(defaultClienteId) : "",
      id_site:      "",
      id_bodega:    "",
      id_empleado:  "",
      motivo:       "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await moverActivo({
          id_activo:          activo.id,
          tipo_destino:       values.tipo_destino,
          id_cliente_site:    values.tipo_destino === "Cliente"  ? values.id_site     : null,
          id_bodega:          values.tipo_destino === "Bodega"   ? values.id_bodega   : null,
          id_empleado:        values.tipo_destino === "Empleado" ? values.id_empleado : null,
          motivo:             values.motivo,
          usuario_responsable: userData?.id_usuario ?? userData?.id ?? null,
        });
        showToast("Activo movido correctamente", "success");
        onClose?.(); onSaved?.();
      } catch (err) {
        showToast(err?.message || "Error al mover el activo", "danger");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Cargar datos base al abrir
  useEffect(() => {
    if (!open) return;
    formik.resetForm({
      values: {
        tipo_destino: defaultTipo,
        id_cliente:   defaultClienteId ? String(defaultClienteId) : "",
        id_site:      "",
        id_bodega:    "",
        id_empleado:  "",
        motivo:       "",
      },
    });
    setLoadingBase(true);
    Promise.all([getClientes(), getBodegas()])
      .then(([cli, bod]) => {
        setClientes(Array.isArray(cli) ? cli : []);
        setBodegas(Array.isArray(bod) ? bod : []);
      })
      .catch(() => showToast("Error al cargar datos", "danger"))
      .finally(() => setLoadingBase(false));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar sites cuando cambia el cliente
  useEffect(() => {
    const { tipo_destino, id_cliente } = formik.values;
    if (tipo_destino === "Cliente" && id_cliente) {
      setLoadingSites(true);
      getActiveSitesByCliente(id_cliente)
        .then((rows) => setSites(Array.isArray(rows) ? rows : []))
        .catch(() => setSites([]))
        .finally(() => setLoadingSites(false));
    } else {
      setSites([]);
    }
  }, [formik.values.tipo_destino, formik.values.id_cliente]);

  // Cargar empleados cuando el tipo es Empleado
  useEffect(() => {
    if (formik.values.tipo_destino === "Empleado" && open) {
      setLoadingEmp(true);
      getEmpleados()
        .then((rows) => setEmpleados(Array.isArray(rows) ? rows : []))
        .catch(() => setEmpleados([]))
        .finally(() => setLoadingEmp(false));
    }
  }, [formik.values.tipo_destino, open]);

  // Limpiar campos al cambiar tipo
  useEffect(() => {
    const tipo = formik.values.tipo_destino;
    if (tipo === "Bodega") {
      formik.setFieldValue("id_cliente", "");
      formik.setFieldValue("id_site", "");
      formik.setFieldValue("id_empleado", "");
    } else if (tipo === "Cliente") {
      formik.setFieldValue("id_bodega", "");
      formik.setFieldValue("id_empleado", "");
    } else if (tipo === "Empleado") {
      formik.setFieldValue("id_bodega", "");
      formik.setFieldValue("id_cliente", "");
      formik.setFieldValue("id_site", "");
    }
  }, [formik.values.tipo_destino]); // eslint-disable-line react-hooks/exhaustive-deps

  // Opciones para SearchableSelect
  const bodegaOptions = useMemo(() => bodegas.map((b) => ({ value: String(b.id), label: b.nombre || `Bodega ${b.id}` })), [bodegas]);
  const clienteOptions = useMemo(() => clientes.map((c) => ({ value: String(c.id), label: c.nombre || `Cliente ${c.id}` })), [clientes]);
  const siteOptions = useMemo(() => sites.map((s) => {
    const desc = (s.descripcion || "").trim();
    return { value: String(s.id), label: (!desc || desc === "-") ? s.nombre : `${s.nombre} - ${desc}` };
  }), [sites]);
  const empleadoOptions = useMemo(() => empleados.map((e) => ({
    value: String(e.id),
    label: [e.nombre || e.usuario_nombre, e.puesto ? `— ${e.puesto}` : ""].filter(Boolean).join(" "),
  })), [empleados]);

  if (!open) return null;

  const isSubmitting    = formik.isSubmitting;
  const tipo            = formik.values.tipo_destino;

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
            : "right-0 top-0 h-full w-[480px] border-l slide-in-from-right",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex-none flex items-center gap-3 px-6 py-4 border-b border-border/60 bg-card/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="p-2 bg-primary/10 dark:bg-primary/15 rounded-2xl ring-1 ring-primary/20">
            <ArrowLeftRight size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black tracking-tight">Mover Activo</h2>
            {activo && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {activo.nombre} · <span className="font-mono">{activo.codigo}</span>
              </p>
            )}
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

          {/* Sección: Tipo de destino */}
          <div className="bg-muted/30 dark:bg-slate-800/30 border border-border/40 rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-1">
              <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
                <ArrowLeftRight size={13} className="text-muted-foreground" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Tipo de destino
              </h3>
            </div>

            {/* Toggle de tipo */}
            <div className="grid grid-cols-3 gap-2">
              {TIPO_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => formik.setFieldValue("tipo_destino", value)}
                  className={[
                    "flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl text-xs font-bold border transition-all",
                    tipo === value
                      ? "bg-primary/10 border-primary/40 text-primary dark:bg-primary/15"
                      : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground",
                  ].join(" ")}>
                  <span className={tipo === value ? "text-primary" : ""}>
                    {TIPO_ICON[value]}
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Sección: Destino específico */}
          <div className="bg-muted/30 dark:bg-slate-800/30 border border-border/40 rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-1">
              <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
                <MapPin size={13} className="text-muted-foreground" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {tipo === "Bodega" ? "Bodega de destino" : tipo === "Cliente" ? "Cliente y Site" : "Empleado asignado"}
              </h3>
            </div>

            {/* BODEGA */}
            {tipo === "Bodega" && (
              <Field label="Bodega" required error={formik.touched.id_bodega && formik.errors.id_bodega}>
                <SearchableSelect
                  value={formik.values.id_bodega}
                  onChange={(v) => formik.setFieldValue("id_bodega", v)}
                  onBlur={() => formik.setFieldTouched("id_bodega", true)}
                  options={bodegaOptions}
                  placeholder="Selecciona una bodega..."
                  disabled={isSubmitting}
                  loading={loadingBase}
                  emptyLabel="Sin bodegas disponibles"
                />
              </Field>
            )}

            {/* CLIENTE + SITE */}
            {tipo === "Cliente" && (
              <>
                <Field label="Cliente">
                  <SearchableSelect
                    value={formik.values.id_cliente}
                    onChange={(v) => { formik.setFieldValue("id_cliente", v); formik.setFieldValue("id_site", ""); }}
                    options={clienteOptions}
                    placeholder="Selecciona un cliente..."
                    disabled={isSubmitting}
                    loading={loadingBase}
                    emptyLabel="Sin clientes disponibles"
                  />
                </Field>

                <Field label="Site" required error={formik.touched.id_site && formik.errors.id_site}>
                  <SearchableSelect
                    value={formik.values.id_site}
                    onChange={(v) => formik.setFieldValue("id_site", v)}
                    onBlur={() => formik.setFieldTouched("id_site", true)}
                    options={siteOptions}
                    placeholder={formik.values.id_cliente ? "Selecciona un site..." : "Selecciona un cliente primero"}
                    disabled={!formik.values.id_cliente || isSubmitting}
                    loading={loadingSites}
                    emptyLabel="Sin sites activos para este cliente"
                  />
                </Field>
              </>
            )}

            {/* EMPLEADO */}
            {tipo === "Empleado" && (
              <Field label="Empleado" required error={formik.touched.id_empleado && formik.errors.id_empleado}>
                <SearchableSelect
                  value={formik.values.id_empleado}
                  onChange={(v) => formik.setFieldValue("id_empleado", v)}
                  onBlur={() => formik.setFieldTouched("id_empleado", true)}
                  options={empleadoOptions}
                  placeholder="Selecciona un empleado..."
                  disabled={isSubmitting}
                  loading={loadingEmp}
                  emptyLabel="Sin empleados disponibles"
                />
              </Field>
            )}
          </div>

          {/* Sección: Motivo */}
          <div className="bg-muted/30 dark:bg-slate-800/30 border border-border/40 rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-1">
              <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
                <Save size={13} className="text-muted-foreground" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Trazabilidad
              </h3>
            </div>

            <Field label="Motivo" required error={formik.touched.motivo && formik.errors.motivo}>
              <textarea
                name="motivo"
                rows={3}
                value={formik.values.motivo}
                onChange={formik.handleChange}
                onBlur={() => formik.setFieldTouched("motivo", true)}
                disabled={isSubmitting}
                placeholder="Describe el motivo del movimiento..."
                className={[
                  "w-full rounded-xl border px-4 py-2.5 text-sm transition-all outline-none resize-none",
                  "bg-background dark:bg-slate-900/60 placeholder:text-muted-foreground/50",
                  formik.touched.motivo && formik.errors.motivo
                    ? "border-rose-400/70 ring-2 ring-rose-400/20"
                    : "border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
                  "disabled:opacity-60",
                ].join(" ")}
              />
            </Field>
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
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <ArrowLeftRight size={15} />}
              {isSubmitting ? "Moviendo..." : "Mover Activo"}
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
