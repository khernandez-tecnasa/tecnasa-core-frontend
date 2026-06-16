import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Car,
  User,
  Calendar,
  FileText,
  Save,
  ChevronLeft,
  Loader2,
  Info,
  Search,
  Check,
  ChevronDown,
  AlertCircle,
  Wrench,
} from "lucide-react";

import {
  createReserva,
  getReserva,
  updateReserva,
  getDisponibilidad,
} from "@/services/reservas.service";
import { obtenerVehiculos } from "@/services/VehiculosService";
import { getEmpleados } from "@/services/AuthServices";

import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

// ─── SearchableSelect ────────────────────────────────────────────────────────
function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Buscar...",
  getLabel,
  renderOption,
  isDisabled,
  icon: Icon,
  hasError,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = value
    ? options.find((o) => o.id?.toString() === value?.toString())
    : null;

  const filtered = options.filter((o) =>
    getLabel(o).toLowerCase().includes(query.toLowerCase()),
  );

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (!open) setOpen(true);
  };

  const handleFocus = () => {
    setQuery("");
    setOpen(true);
  };

  const handleSelect = (option) => {
    if (isDisabled?.(option)) return;
    onChange(option.id);
    setOpen(false);
    setQuery("");
  };

  const displayValue = open ? query : selected ? getLabel(selected) : "";

  return (
    <div ref={containerRef} className="relative">
      {/* Input trigger */}
      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none"
            size={18}
          />
        )}
        <Search
          className="absolute right-9 top-1/2 -translate-y-1/2 text-muted-foreground/50 z-10 pointer-events-none"
          size={14}
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          size={16}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder={selected ? "" : placeholder}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          className={`w-full rounded-xl border pl-10 pr-16 py-2.5 text-sm outline-none transition-all font-medium cursor-text bg-background dark:bg-slate-900/60 ${
            hasError
              ? "border-rose-400/70 ring-2 ring-rose-400/20"
              : "border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          }`}
        />
        {/* Label de lo seleccionado cuando no está enfocado */}
        {!open && selected && (
          <div className="absolute inset-0 left-10 right-16 flex items-center pointer-events-none">
            <span className="text-sm font-medium truncate text-foreground">
              {getLabel(selected)}
            </span>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No se encontraron resultados
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              {filtered.map((o) => {
                const disabled = isDisabled?.(o);
                const isSelected = value?.toString() === o.id?.toString();
                return (
                  <button
                    key={o.id}
                    type="button"
                    disabled={disabled}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(o)}
                    className={`w-full text-left px-4 py-2.5 transition-colors flex items-center gap-3 ${
                      disabled
                        ? "opacity-40 cursor-not-allowed bg-transparent"
                        : isSelected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/60 cursor-pointer"
                    }`}>
                    <Check
                      size={14}
                      className={`shrink-0 transition-opacity ${isSelected ? "opacity-100 text-primary" : "opacity-0"}`}
                    />
                    <div className="flex-1 min-w-0">
                      {renderOption ? renderOption(o, disabled) : getLabel(o)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ReservasForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const { userData, hasPermiso } = useAuth();

  const isEdit = !!id;
  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const can = useCallback(
    (p) => isAdmin || hasPermiso(p),
    [isAdmin, hasPermiso],
  );
  const canAction = isEdit ? can("update_reserva") : can("create_reserva");

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const inicio = params.get("inicio");
  const fin = params.get("fin");

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(isEdit);
  const [vehiculos, setVehiculos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [vehiculosOcupados, setVehiculosOcupados] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    vehiculo_id: "",
    empleado_id: "",
    fecha_inicio: "",
    fecha_fin: "",
    motivo: "",
    es_mantenimiento: false,
  });

  useEffect(() => {
    if (inicio && fin) {
      setForm((prev) => ({
        ...prev,
        fecha_inicio: inicio.length > 10 ? inicio.slice(0, 16) : `${inicio}T00:00`,
        fecha_fin: fin.length > 10 ? fin.slice(0, 16) : `${fin}T23:59`,
      }));
    }
  }, []);

  useEffect(() => {
    const fetchDisponibilidad = async () => {
      if (!form.fecha_inicio || !form.fecha_fin) return;
      const ocupados = await getDisponibilidad(
        form.fecha_inicio,
        form.fecha_fin,
      );
      setVehiculosOcupados(ocupados || []);
    };
    fetchDisponibilidad();
  }, [form.fecha_inicio, form.fecha_fin]);

  useEffect(() => {
    const init = async () => {
      const [v, e] = await Promise.all([obtenerVehiculos(), getEmpleados()]);
      setVehiculos(v || []);
      setEmpleados(e || []);

      if (isEdit) {
        const data = await getReserva(id);
        if (data) {
          setForm({
            ...data,
            fecha_inicio: data.fecha_inicio?.slice(0, 16) || "",
            fecha_fin: data.fecha_fin?.slice(0, 16) || "",
            es_mantenimiento: !!data.es_mantenimiento,
          });
        } else {
          showToast("No se pudo cargar la información", "danger");
          navigate("/admin/reservas-vehiculos");
        }
        setDataLoading(false);
      }
    };
    init();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validar = () => {
    const errors = {};
    if (!form.vehiculo_id) errors.vehiculo_id = "Debes seleccionar un vehículo";
    if (!form.empleado_id) errors.empleado_id = "Debes seleccionar un responsable";
    if (!form.fecha_inicio || !form.fecha_fin)
      errors.fechas = "Debes seleccionar las fechas de salida y retorno";
    if (
      form.fecha_inicio &&
      form.fecha_fin &&
      new Date(form.fecha_inicio) > new Date(form.fecha_fin)
    )
      errors.fechas = "La fecha de salida no puede ser posterior a la de retorno";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validar();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const first = Object.values(errors)[0];
      return showToast(first, "warning");
    }
    if (!canAction)
      return showToast("No tienes permisos para esta acción", "warning");

    setLoading(true);
    const res = isEdit
      ? await updateReserva(id, form)
      : await createReserva(form);
    setLoading(false);

    if (res) {
      showToast(
        isEdit ? "Reserva actualizada" : "Reserva registrada",
        "success",
      );
      navigate("/admin/reservas-vehiculos");
    } else {
      showToast("Hubo un error en la operación", "danger");
    }
  };

  // Labels y render para los selects
  const getVehiculoLabel = (v) =>
    [v.placa, v.marca, v.modelo].filter(Boolean).join(" · ");

  const getEmpleadoLabel = (e) =>
    [e.nombre, e.puesto].filter(Boolean).join(" — ");

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[400px]">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={22} />
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Cargando reserva...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-in fade-in duration-500">
      {/* ── HEADER ── */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/admin/reservas-vehiculos")}
          className="mt-0.5 p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors text-muted-foreground hover:text-foreground shrink-0">
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <Car size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              {isEdit ? "Editar Reserva" : "Nueva Reserva"}
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              {isEdit
                ? "Modifica los datos de la reserva"
                : "Completa la información para asignar un vehículo"}
            </p>
          </div>
        </div>
      </div>

      {/* ── FORMULARIO ── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CARD 1: ASIGNACIÓN */}
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-1">
            <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
              <Info size={15} className="text-muted-foreground" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Información de asignación
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vehículo */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Vehículo de Flota
              </label>
              <SearchableSelect
                options={vehiculos}
                value={form.vehiculo_id}
                onChange={(val) => handleFieldChange("vehiculo_id", val)}
                placeholder="Buscar por placa, marca..."
                getLabel={getVehiculoLabel}
                icon={Car}
                hasError={!!fieldErrors.vehiculo_id}
                isDisabled={(v) => vehiculosOcupados.includes(v.id)}
                renderOption={(v, disabled) => (
                  <div>
                    <p className="text-sm font-bold">
                      {v.placa}
                      {disabled && (
                        <span className="ml-2 text-[10px] font-normal text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                          No disponible
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {[v.marca, v.modelo].filter(Boolean).join(" ")}
                    </p>
                  </div>
                )}
              />
              {fieldErrors.vehiculo_id && (
                <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                  <AlertCircle size={10} /> {fieldErrors.vehiculo_id}
                </p>
              )}
              {vehiculosOcupados.length > 0 && !fieldErrors.vehiculo_id && (
                <p className="text-[11px] text-amber-600 font-semibold">
                  Algunos vehículos no están disponibles en este rango
                </p>
              )}
            </div>

            {/* Empleado */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Responsable
              </label>
              <SearchableSelect
                options={empleados}
                value={form.empleado_id}
                onChange={(val) => handleFieldChange("empleado_id", val)}
                placeholder="Buscar por nombre o puesto..."
                getLabel={getEmpleadoLabel}
                icon={User}
                hasError={!!fieldErrors.empleado_id}
                renderOption={(e) => (
                  <div>
                    <p className="text-sm font-bold">{e.nombre}</p>
                    {e.puesto && (
                      <p className="text-[11px] text-muted-foreground">
                        {e.puesto}
                      </p>
                    )}
                  </div>
                )}
              />
              {fieldErrors.empleado_id && (
                <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                  <AlertCircle size={10} /> {fieldErrors.empleado_id}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: FECHAS Y MOTIVO */}
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-1">
            <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
              <Calendar size={15} className="text-muted-foreground" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Periodo y justificación
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha inicio */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Fecha Salida
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  size={15}
                />
                <input
                  type="datetime-local"
                  name="fecha_inicio"
                  value={form.fecha_inicio}
                  onChange={handleChange}
                  className={`w-full rounded-xl border pl-9 pr-4 py-2.5 text-sm outline-none transition-all bg-background dark:bg-slate-900/60 ${
                    fieldErrors.fechas
                      ? "border-rose-400/70 ring-2 ring-rose-400/20"
                      : "border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  }`}
                />
              </div>
            </div>

            {/* Fecha fin */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Fecha Retorno
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  size={15}
                />
                <input
                  type="datetime-local"
                  name="fecha_fin"
                  value={form.fecha_fin}
                  onChange={handleChange}
                  className={`w-full rounded-xl border pl-9 pr-4 py-2.5 text-sm outline-none transition-all bg-background dark:bg-slate-900/60 ${
                    fieldErrors.fechas
                      ? "border-rose-400/70 ring-2 ring-rose-400/20"
                      : "border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  }`}
                />
              </div>
              {fieldErrors.fechas && (
                <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                  <AlertCircle size={10} /> {fieldErrors.fechas}
                </p>
              )}
            </div>

            {/* Motivo — full width */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Justificación / Motivo
              </label>
              <textarea
                name="motivo"
                placeholder="Detalle el uso del vehículo (Ej: Visita técnica a Choluteca)"
                value={form.motivo}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all bg-background dark:bg-slate-900/60 placeholder:text-muted-foreground/50 border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Reserva para mantenimiento — full width */}
            <div className="md:col-span-2">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-background dark:bg-slate-900/60 cursor-pointer hover:border-primary/40 transition-colors">
                <input
                  type="checkbox"
                  checked={form.es_mantenimiento}
                  onChange={(e) =>
                    handleFieldChange("es_mantenimiento", e.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer"
                />
                <span className="flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-bold">
                    <Wrench size={13} className="text-muted-foreground" />
                    Reserva para mantenimiento
                  </span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    Mientras dure esta reserva, el vehículo quedará marcado
                    como "En Mantenimiento".
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* ── BOTONES ── */}
        <div className="flex flex-col-reverse md:flex-row gap-2 justify-end pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/reservas-vehiculos")}
            disabled={loading}
            className="md:min-w-[140px] rounded-2xl h-11 font-bold">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="md:min-w-[180px] rounded-2xl h-11 font-bold shadow-md shadow-primary/15 hover:shadow-primary/25 transition-all gap-2 disabled:opacity-60">
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {loading
              ? "Guardando..."
              : isEdit
                ? "Guardar Cambios"
                : "Crear Reserva"}
          </Button>
        </div>
      </form>
    </div>
  );
}
