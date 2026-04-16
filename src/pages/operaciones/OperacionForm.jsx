import { useState, useEffect } from "react";
import {
  Gauge,
  Fuel,
  FileText,
  MapPin,
  Save,
  X,
  Loader2,
  Info,
  Car,
  Camera,
} from "lucide-react";
import {
  registrarSalida,
  registrarRegreso,
  getReservaActivaVehiculo,
  getUltimoEstadoVehiculo,
} from "@/services/operaciones.service";
import { getParkings } from "@/services/ParkingServices";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import OperacionVehiculo from "./OperacionVehiculo";
import OperacionInfo from "./OperacionInfo";
import UploadImages from "@/components/RegisterForm/UploadImages";

// ─── Helpers visuales ───────────────────────────────────────────────────────

function SectionLabel({ icon, label }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
      {icon}
      {label}
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";

// ─── Componente principal ────────────────────────────────────────────────────

export default function OperacionForm({
  operacionActiva,
  refresh,
  canViewEstacionamientos,
  canRegister,
}) {
  const { userData } = useAuth();
  const { showToast } = useToast();

  const [vehiculo, setVehiculo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parkings, setParkings] = useState([]);
  const [images, setImages] = useState([]);
  const [reservaVehiculo, setReservaVehiculo] = useState(null);
  const [ultimoEstado, setUltimoEstado] = useState(null);
  const [form, setForm] = useState({
    km: "",
    combustible: "",
    comentario: "",
    ubicacion: "",
  });

  const isAutofilled = !!ultimoEstado;

  useEffect(() => {
    const loadUltimo = async () => {
      if (!vehiculo) return;

      const data = await getUltimoEstadoVehiculo(vehiculo.id);
      setUltimoEstado(data);

      if (data) {
        setForm((prev) => ({
          ...prev,
          km: data.km || "",
          combustible: data.combustible || "",
          ubicacion: data.ubicacion || "",
        }));
      }
    };

    loadUltimo();
  }, [vehiculo]);

  useEffect(() => {
    const load = async () => {
      if (!canViewEstacionamientos) return;
      const data = await getParkings();
      setParkings(data || []);
    };
    load();
  }, [canViewEstacionamientos]);

  useEffect(() => {
    const loadReserva = async () => {
      if (!vehiculo) {
        setReservaVehiculo(null);
        return;
      }

      const reserva = await getReservaActivaVehiculo(vehiculo.id);
      setReservaVehiculo(reserva);
    };

    loadReserva();
  }, [vehiculo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userData) return;
    if (!canRegister)
      return showToast("No tienes permiso para registrar", "warning");

    if (!operacionActiva && !vehiculo)
      return showToast("Seleccione una unidad", "warning");
    if (!form.km || !form.ubicacion)
      return showToast("Complete los campos obligatorios", "warning");

    if (!operacionActiva && ultimoEstado) {
      if (form.km < ultimoEstado.km) {
        return showToast(
          `El KM no puede ser menor al último registrado (${ultimoEstado.km})`,
          "warning",
        );
      }
    }

    if (operacionActiva) {
      const kmSalida = operacionActiva.km_salida;
      const kmRegreso = Number(form.km);

      if (kmRegreso < kmSalida) {
        return showToast(
          "El KM de regreso no puede ser menor al de salida",
          "warning",
        );
      }

      const diferencia = kmRegreso - kmSalida;

      if (diferencia > 1000) {
        return showToast(
          "Kilometraje excesivo, verifique los datos",
          "warning",
        );
      }
    }

    if (reservaVehiculo) {
      const hoy = new Date().toISOString().slice(0, 10);

      const inicio = reservaVehiculo.fecha_inicio.slice(0, 10);
      const fin = reservaVehiculo.fecha_fin.slice(0, 10);

      const dentro = hoy >= inicio && hoy <= fin;
      const esDueno = reservaVehiculo.empleado_id === userData.id;

      if (dentro && !esDueno) {
        return showToast(
          "Este vehículo está reservado para otro empleado",
          "warning",
        );
      }
    }

    setLoading(true);
    try {
      if (operacionActiva) {
        await registrarRegreso({
          idEmpleado: userData.id,
          idVehiculo: operacionActiva.id_vehiculo,
          fechaRegreso: new Date(),
          kmRegreso: form.km,
          combustibleRegreso: form.combustible,
          comentarioRegreso: form.comentario,
          idUbicacionRegreso: form.ubicacion,
        });
        showToast("Retorno registrado exitosamente", "success");
      } else {
        await registrarSalida({
          idEmpleado: userData.id,
          idVehiculo: vehiculo.id,
          fechaSalida: new Date(),
          kmSalida: form.km,
          combustibleSalida: form.combustible,
          comentarioSalida: form.comentario,
          idUbicacionSalida: form.ubicacion,
        });
        showToast("Salida de unidad confirmada", "success");
      }
      setForm({ km: "", combustible: "", comentario: "", ubicacion: "" });
      setVehiculo(null);
      setImages([]);
      await refresh();
    } catch (err) {
      showToast("Error en la operación de flota", "danger");
    } finally {
      setLoading(false);
    }
  };

  const isActive = !!operacionActiva;
  const showForm = vehiculo || operacionActiva;

  const kmDiff =
    operacionActiva && form.km ? form.km - operacionActiva.km_salida : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 animate-in slide-in-from-bottom-3 duration-500">
      {/* ── SELECCIÓN DE UNIDAD ─────────────────────────────────────────── */}
      {!operacionActiva && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 md:p-6 space-y-4">
          <SectionLabel icon={<Car size={13} />} label="Selección de Unidad" />
          <OperacionVehiculo onSelect={setVehiculo} selectedId={vehiculo?.id} />
        </div>
      )}

      {/* ── INFO UNIDAD ──────────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 md:p-6">
          <OperacionInfo
            vehiculo={vehiculo}
            operacionActiva={operacionActiva}
            reserva={reservaVehiculo}
          />
        </div>
      )}

      {/* ── DATOS TÉCNICOS ───────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 md:p-6 space-y-5">
          <SectionLabel icon={<Info size={13} />} label="Estado Técnico" />
          {isAutofilled && !operacionActiva && (
            <p className="text-xs text-blue-500 font-semibold">
              Datos cargados automáticamente del último registro
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* KM */}
            <Field label="Odómetro (KM)" icon={<Gauge size={16} />}>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={form.km}
                readOnly={isAutofilled}
                placeholder="Kilometraje Actual"
                onChange={(e) => {
                  let value = Number(e.target.value);
                  if (value < 0) return;

                  setForm({ ...form, km: value });
                }}
                className={`${inputCls} ${isAutofilled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              {kmDiff !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Recorrido estimado: {kmDiff} km
                </p>
              )}
            </Field>

            {/* UBICACIÓN */}
            <Field label="Punto de Control" icon={<MapPin size={16} />}>
              <select
                value={form.ubicacion}
                disabled={isAutofilled}
                onChange={(e) =>
                  setForm({ ...form, ubicacion: e.target.value })
                }
                className={`${inputCls} appearance-none cursor-pointer`}>
                <option value="">Seleccione punto...</option>
                {parkings.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre_ubicacion}
                  </option>
                ))}
              </select>
            </Field>

            {/* COMBUSTIBLE */}
            <Field label="Combustible (%)" icon={<Fuel size={16} />}>
              <input
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                value={form.combustible}
                readOnly={isAutofilled}
                placeholder="0 - 100"
                onChange={(e) => {
                  let value = Number(e.target.value);

                  if (value < 0) value = 0;
                  if (value > 100) value = 100;

                  setForm({ ...form, combustible: value });
                }}
                className={inputCls}
              />
            </Field>

            {/* COMENTARIO */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Observaciones
              </label>
              <div className="relative">
                <FileText
                  className="absolute left-3 top-3.5 text-slate-400 pointer-events-none"
                  size={16}
                />
                <textarea
                  placeholder="Novedades técnicas o estéticas..."
                  value={form.comentario}
                  onChange={(e) =>
                    setForm({ ...form, comentario: e.target.value })
                  }
                  rows={3}
                  className={`${inputCls} resize-none pt-3 leading-relaxed`}
                />
              </div>
            </div>
          </div>

          {/* ── EVIDENCIA FOTOGRÁFICA ─────────────────────────────────── */}
          <div className="space-y-2 pt-1">
            <SectionLabel
              icon={<Camera size={13} />}
              label="Evidencia Fotográfica"
            />
            <UploadImages
              value={images}
              onChange={setImages}
              maxCount={6}
              maxSizeMB={6}
              capture="environment"
            />
          </div>
        </div>
      )}

      {/* ── ACCIONES ─────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setVehiculo(null)}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-sm font-black uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <X size={16} />
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className={`flex-[2] flex items-center justify-center gap-2 h-12 rounded-xl text-white text-sm font-black uppercase tracking-wider shadow-lg transition-all disabled:opacity-60 ${
              isActive
                ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-blue-900/40"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-emerald-900/40"
            }`}>
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            {isActive ? "Confirmar Retorno" : "Confirmar Salida"}
          </button>
        </div>
      )}
    </form>
  );
}
