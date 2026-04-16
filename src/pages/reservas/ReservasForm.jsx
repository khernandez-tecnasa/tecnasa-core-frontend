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
          className={`w-full bg-background border-2 rounded-2xl pl-10 pr-16 py-3 text-sm outline-none transition-all font-medium cursor-text ${
            hasError
              ? "border-destructive/60 focus:border-destructive"
              : "border-muted focus:border-primary"
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
  });

  useEffect(() => {
    if (inicio && fin) {
      setForm((prev) => ({ ...prev, fecha_inicio: inicio, fecha_fin: fin }));
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
            fecha_inicio: data.fecha_inicio?.split("T")[0] || "",
            fecha_fin: data.fecha_fin?.split("T")[0] || "",
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
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground animate-pulse font-medium">
          Obteniendo detalles de reserva...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between bg-card p-4 rounded-2xl border shadow-sm">
        <button
          onClick={() => navigate("/admin/reservas-vehiculos")}
          className="flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft size={20} /> VOLVER
        </button>
        <div className="text-right">
          <h1 className="text-xl font-black tracking-tighter uppercase">
            {isEdit ? "Editar Reserva" : "Asignación de Vehículo"}
          </h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            AutoLog Logistics Management
          </p>
        </div>
      </div>

      {/* MAIN FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden">
          {/* SECCIÓN 1: ASIGNACIÓN */}
          <div className="p-6 md:p-8 border-b bg-muted/20">
            <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Info size={14} /> Información de Asignación
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* VEHÍCULO — Searchable */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase ml-1 text-muted-foreground">
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
                      <p className={`text-sm font-bold ${disabled ? "" : ""}`}>
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
                  <p className="flex items-center gap-1 text-xs text-destructive font-semibold">
                    <AlertCircle size={12} /> {fieldErrors.vehiculo_id}
                  </p>
                )}
                {vehiculosOcupados.length > 0 && !fieldErrors.vehiculo_id && (
                  <p className="text-xs text-amber-600 font-semibold">
                    Algunos vehículos no están disponibles en este rango
                  </p>
                )}
              </div>

              {/* EMPLEADO — Searchable */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase ml-1 text-muted-foreground">
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
                  <p className="flex items-center gap-1 text-xs text-destructive font-semibold">
                    <AlertCircle size={12} /> {fieldErrors.empleado_id}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: FECHAS Y MOTIVO */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase ml-1 text-muted-foreground">
                  Fecha Salida
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={18}
                  />
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={form.fecha_inicio}
                    onChange={handleChange}
                    className={`w-full bg-background border-2 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none transition-all ${
                      fieldErrors.fechas
                        ? "border-destructive/60 focus:border-destructive"
                        : "border-muted focus:border-primary"
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase ml-1 text-muted-foreground">
                  Fecha Retorno
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={18}
                  />
                  <input
                    type="date"
                    name="fecha_fin"
                    value={form.fecha_fin}
                    onChange={handleChange}
                    className={`w-full bg-background border-2 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none transition-all ${
                      fieldErrors.fechas
                        ? "border-destructive/60 focus:border-destructive"
                        : "border-muted focus:border-primary"
                    }`}
                  />
                </div>
                {fieldErrors.fechas && (
                  <p className="flex items-center gap-1 text-xs text-destructive font-semibold">
                    <AlertCircle size={12} /> {fieldErrors.fechas}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase ml-1 text-muted-foreground">
                Justificación / Motivo
              </label>
              <div className="relative">
                <FileText
                  className="absolute left-3 top-4 text-muted-foreground"
                  size={18}
                />
                <textarea
                  name="motivo"
                  placeholder="Detalle el uso del vehículo (Ej: Visita técnica a Choluteca)"
                  value={form.motivo}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-background border-2 border-muted rounded-2xl pl-10 pr-4 py-3 text-sm focus:border-primary outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="p-6 bg-muted/10 flex flex-col md:flex-row gap-3 border-t">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-[2] h-12 text-[var(--muted-foreground)] font-black bg-[var(--popover)] rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90">
              {loading ? (
                <Loader2 className="mr-2 animate-spin" />
              ) : (
                <Save size={18} className="mr-2" />
              )}
              {isEdit ? "CONFIRMAR CAMBIOS" : "CREAR RESERVA"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
