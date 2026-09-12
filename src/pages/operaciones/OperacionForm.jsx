import { useState, useEffect, useMemo } from "react";
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
  Sparkles,
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
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

// ─── Helpers visuales ────────────────────────────────────────────────────────

function SectionLabel({ icon, label }) {
  return (
    <div className="flex items-center gap-2 pb-1">
      <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl shrink-0">
        {icon}
      </div>
      <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </h2>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-background dark:bg-slate-900/60 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60";

// ─── Componente principal ─────────────────────────────────────────────────────

export default function OperacionForm({
  operacionActiva,
  refresh,
  canViewEstacionamientos,
  canRegister,
  vehiculoIdPreseleccionado = null,
}) {
  const { t } = useTranslation();
  const { userData, isAdmin, can } = useAuth();
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
          km: data.km ?? "",
          combustible: data.combustible ?? "",
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

  // Administradores (o quienes gestionan estacionamientos) ven todos los
  // parqueos. El resto solo ve los de su propia ciudad (si tiene alguno
  // asignado; si no, se muestran todos como respaldo).
  const visibleParkings = useMemo(() => {
    if (isAdmin || can("gestionar_estacionamientos")) return parkings;
    if (!userData?.id_ciudad) return parkings;

    const deSuCiudad = parkings.filter(
      (p) => p.id_ciudad === userData.id_ciudad,
    );
    return deSuCiudad.length > 0 ? deSuCiudad : parkings;
  }, [parkings, isAdmin, can, userData]);

  // Si solo hay un punto de control disponible, se preselecciona para
  // evitar que el usuario tenga que elegirlo manualmente cada vez.
  useEffect(() => {
    if (form.ubicacion || isAutofilled) return;
    if (visibleParkings.length === 1) {
      setForm((prev) => ({ ...prev, ubicacion: visibleParkings[0].id }));
    }
  }, [visibleParkings, form.ubicacion, isAutofilled]);

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
      return showToast(t("operaciones.toast.no_permission"), "warning");

    if (!operacionActiva && !vehiculo)
      return showToast(t("operaciones.toast.select_unit"), "warning");
    if (!form.km || !form.ubicacion)
      return showToast(t("operaciones.toast.required_fields"), "warning");
    if (images.length === 0)
      return showToast(t("operaciones.toast.required_images"), "warning");

    if (!operacionActiva && ultimoEstado) {
      if (form.km < ultimoEstado.km) {
        return showToast(
          t("operaciones.toast.km_too_low", { km: ultimoEstado.km }),
          "warning",
        );
      }
    }

    if (operacionActiva) {
      const kmSalida = operacionActiva.km_salida;
      const kmRegreso = Number(form.km);

      if (kmRegreso < kmSalida) {
        return showToast(
          t("operaciones.toast.km_return_low"),
          "warning",
        );
      }

      const diferencia = kmRegreso - kmSalida;

      if (diferencia > 2500) {
        return showToast(
          t("operaciones.toast.km_excessive"),
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
          t("operaciones.toast.reserved_other"),
          "warning",
        );
      }
    }

    setLoading(true);
    try {
      if (operacionActiva) {
        const fd = new FormData();
        fd.append("idEmpleado", userData.id);
        fd.append("idVehiculo", operacionActiva.id_vehiculo);
        fd.append("fechaRegreso", new Date().toISOString());
        fd.append("kmRegreso", form.km);
        fd.append("combustibleRegreso", form.combustible ?? "");
        fd.append("comentarioRegreso", form.comentario ?? "");
        fd.append("idUbicacionRegreso", form.ubicacion);
        images.forEach((img) => fd.append("files", img));
        await registrarRegreso(fd);
        showToast(t("operaciones.toast.return_success"), "success");
      } else {
        const fd = new FormData();
        fd.append("idEmpleado", userData.id);
        fd.append("idVehiculo", vehiculo.id);
        fd.append("fechaSalida", new Date().toISOString());
        fd.append("kmSalida", form.km);
        fd.append("combustibleSalida", form.combustible ?? "");
        fd.append("comentarioSalida", form.comentario ?? "");
        fd.append("idUbicacionSalida", form.ubicacion);
        images.forEach((img) => fd.append("files", img));
        await registrarSalida(fd);
        showToast(t("operaciones.toast.departure_success"), "success");
      }
      setForm({ km: "", combustible: "", comentario: "", ubicacion: "" });
      setVehiculo(null);
      setImages([]);
      await refresh();
    } catch (err) {
      showToast(err?.message || t("operaciones.toast.error_process"), "danger");
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
        <div className="bg-card dark:bg-slate-900/40 rounded-3xl border border-border/60 shadow-sm p-5 md:p-6 space-y-4">
          <SectionLabel
            icon={<Car size={13} className="text-muted-foreground" />}
            label={t("operaciones.form.section_unit")}
          />
          <OperacionVehiculo
            onSelect={setVehiculo}
            selectedId={vehiculo?.id}
            preselectId={vehiculoIdPreseleccionado}
          />
        </div>
      )}

      {/* ── INFO UNIDAD ──────────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-card dark:bg-slate-900/40 rounded-3xl border border-border/60 shadow-sm p-5 md:p-6">
          <OperacionInfo
            vehiculo={vehiculo}
            operacionActiva={operacionActiva}
            reserva={reservaVehiculo}
          />
        </div>
      )}

      {/* ── DATOS TÉCNICOS ───────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-card dark:bg-slate-900/40 rounded-3xl border border-border/60 shadow-sm p-5 md:p-6 space-y-5">
          <SectionLabel
            icon={<Info size={13} className="text-muted-foreground" />}
            label={t("operaciones.form.section_technical")}
          />

          {isAutofilled && !operacionActiva && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 text-primary">
              <Sparkles size={13} className="shrink-0" />
              <p className="text-xs font-semibold">
                {t("operaciones.form.autofilled")}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* KM */}
            <Field label={t("operaciones.form.field_km")} icon={<Gauge size={15} />}>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={form.km}
                readOnly={isAutofilled}
                placeholder={t("operaciones.form.ph_km")}
                onChange={(e) => {
                  let value = Number(e.target.value);
                  if (value < 0) return;
                  setForm({ ...form, km: value });
                }}
                className={`${inputCls} ${isAutofilled ? "opacity-60 cursor-not-allowed" : ""}`}
              />
              {kmDiff !== null && (
                <p className="text-xs text-muted-foreground mt-1.5 pl-1">
                  {t("operaciones.form.km_diff")}{" "}
                  <span className="font-semibold text-foreground">
                    {kmDiff} km
                  </span>
                </p>
              )}
            </Field>

            {/* UBICACIÓN */}
            <Field label={t("operaciones.form.field_location")} icon={<MapPin size={15} />}>
              <select
                value={form.ubicacion}
                disabled={isAutofilled}
                onChange={(e) =>
                  setForm({ ...form, ubicacion: e.target.value })
                }
                className={`${inputCls} appearance-none cursor-pointer`}>
                <option value="">{t("operaciones.form.ph_location")}</option>
                {visibleParkings.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre_ubicacion}
                  </option>
                ))}
              </select>
            </Field>

            {/* COMBUSTIBLE */}
            <Field label={t("operaciones.form.field_fuel")} icon={<Fuel size={15} />}>
              <select
                value={form.combustible}
                disabled={isAutofilled}
                onChange={(e) =>
                  setForm({ ...form, combustible: Number(e.target.value) })
                }
                className={`${inputCls} appearance-none cursor-pointer`}>
                <option value="">{t("operaciones.form.ph_fuel")}</option>
                <option value={100}>{t("operaciones.form.fuel_full")}</option>
                <option value={75}>3/4</option>
                <option value={50}>{t("operaciones.form.fuel_half")}</option>
                <option value={25}>1/4</option>
                <option value={0}>{t("operaciones.form.fuel_empty")}</option>
              </select>
            </Field>

            {/* COMENTARIO */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                {t("operaciones.form.field_observations")}
              </label>
              <div className="relative">
                <FileText
                  className="absolute left-3.5 top-3.5 text-muted-foreground pointer-events-none"
                  size={15}
                />
                <textarea
                  placeholder={t("operaciones.form.ph_observations")}
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

          {/* ── EVIDENCIA FOTOGRÁFICA ──────────────────────────────────── */}
          <div className="space-y-3 pt-1">
            <SectionLabel
              icon={<Camera size={13} className="text-muted-foreground" />}
              label={t("operaciones.form.section_photos")}
            />
            <UploadImages
              value={images}
              onChange={setImages}
              maxCount={4}
              maxSizeMB={10}
            />
          </div>
        </div>
      )}

      {/* ── ACCIONES ──────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variante="outline"
            onClick={() => setVehiculo(null)}
            className="flex-1 rounded-2xl h-10 font-bold">
            {t("common.actions.cancel")}
          </Button>

          <Button
            type="submit"
            variant="outline"
            disabled={loading}
            className="flex-1 rounded-2xl h-10 font-bold shadow-md shadow-primary/15 hover:shadow-primary/25 transition-all gap-2 disabled:opacity-60">
            {loading ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <Save size={17} />
            )}
            {isActive ? t("operaciones.form.btn_return") : t("operaciones.form.btn_departure")}
          </Button>
        </div>
      )}
    </form>
  );
}
