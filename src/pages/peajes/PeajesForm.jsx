import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Milestone,
  MapPin,
  Info,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { createPeaje, getPeaje, updatePeaje } from "@/services/peajes.service";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import useIsMobile from "@/hooks/useIsMobile";

// Fix default icon Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    },
  });
  return null;
}

export default function PeajesForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const { userData, hasPermiso } = useAuth();
  const isMobile = useIsMobile();

  const isEdit = !!id;
  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const can = useCallback(
    (p) => isAdmin || hasPermiso(p),
    [isAdmin, hasPermiso],
  );
  const canAction = isEdit ? can("update_peaje") : can("create_peaje");

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(isEdit);

  const [form, setForm] = useState({
    nombre: "",
    latitud: "",
    longitud: "",
    tarifa_liviano: "",
    tarifa_pesado: "",
  });

  useEffect(() => {
    if (!isEdit) return;
    const init = async () => {
      const data = await getPeaje(id);
      if (data) {
        setForm({
          nombre: data.nombre || "",
          latitud: data.latitud ?? "",
          longitud: data.longitud ?? "",
          tarifa_liviano: data.tarifa_liviano ?? "",
          tarifa_pesado: data.tarifa_pesado ?? "",
        });
      } else {
        showToast("No se pudo cargar el peaje", "danger");
        navigate("/admin/peajes");
      }
      setDataLoading(false);
    };
    init();
  }, [id, isEdit]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleMapClick = ({ lat, lng }) => {
    setForm((prev) => ({
      ...prev,
      latitud: lat.toFixed(6),
      longitud: lng.toFixed(6),
    }));
  };

  const validar = () => {
    if (!form.nombre.trim()) return "El nombre es obligatorio";
    if (form.latitud === "" || form.longitud === "")
      return "Selecciona la ubicación en el mapa o ingresa las coordenadas";
    if (!form.tarifa_liviano) return "La tarifa liviano es obligatoria";
    if (!form.tarifa_pesado) return "La tarifa pesado es obligatoria";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validar();
    if (error) return showToast(error, "warning");
    if (!canAction)
      return showToast("No tienes permisos para esta acción", "warning");

    const payload = {
      nombre: form.nombre.trim(),
      latitud: Number(form.latitud),
      longitud: Number(form.longitud),
      tarifa_liviano: Number(form.tarifa_liviano),
      tarifa_pesado: Number(form.tarifa_pesado),
    };

    setLoading(true);
    const res = isEdit
      ? await updatePeaje(id, payload)
      : await createPeaje(payload);
    setLoading(false);

    if (res) {
      showToast(
        isEdit ? "Peaje actualizado" : "Peaje creado correctamente",
        "success",
      );
      navigate("/admin/peajes");
    } else {
      showToast("Hubo un error. Verifica los datos.", "danger");
    }
  };

  const hasCoords =
    form.latitud !== "" &&
    form.longitud !== "" &&
    !isNaN(Number(form.latitud)) &&
    !isNaN(Number(form.longitud));

  const inputCls =
    "w-full rounded-xl border px-4 py-2.5 text-sm transition-all outline-none bg-background dark:bg-slate-900/60 placeholder:text-muted-foreground/50 border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20";

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={22} />
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Cargando peaje...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/admin/peajes")}
          className="mt-0.5 p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors text-muted-foreground hover:text-foreground shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 shrink-0">
            <Milestone size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              {isEdit ? "Editar Peaje" : "Nuevo Peaje"}
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              {isEdit
                ? "Modifica los datos del punto de cobro"
                : "Registra un nuevo punto de cobro en las rutas logísticas"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── SECCIÓN: INFORMACIÓN ── */}
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-1">
            <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
              <Info size={15} className="text-muted-foreground" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Información del Peaje
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre — full width */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Nombre del Peaje
              </label>
              <div className="relative">
                <Milestone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  size={15}
                />
                <input
                  type="text"
                  name="nombre"
                  placeholder="Ej: Peaje Comayagua Norte"
                  value={form.nombre}
                  onChange={handleChange}
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>

            {/* Tarifa Liviano */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Tarifa Liviano
              </label>
              <input
                type="number"
                name="tarifa_liviano"
                step="0.01"
                placeholder="Ej: 25.00"
                value={form.tarifa_liviano}
                onChange={handleChange}
                className={inputCls}
              />
            </div>

            {/* Tarifa Pesado */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Tarifa Pesado
              </label>
              <input
                type="number"
                name="tarifa_pesado"
                step="0.01"
                placeholder="Ej: 50.00"
                value={form.tarifa_pesado}
                onChange={handleChange}
                className={inputCls}
              />
            </div>

            {/* Latitud */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Latitud
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  size={15}
                />
                <input
                  type="number"
                  name="latitud"
                  step="0.000001"
                  placeholder="14.072300"
                  value={form.latitud}
                  onChange={handleChange}
                  className={`${inputCls} pl-9 font-mono`}
                />
              </div>
            </div>

            {/* Longitud */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Longitud
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  size={15}
                />
                <input
                  type="number"
                  name="longitud"
                  step="0.000001"
                  placeholder="-87.192100"
                  value={form.longitud}
                  onChange={handleChange}
                  className={`${inputCls} pl-9 font-mono`}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground bg-muted/40 dark:bg-slate-800/40 rounded-xl px-4 py-2.5 border border-border/60">
            Haz clic en el mapa para marcar la ubicación exacta del peaje.
          </p>
        </div>

        {/* ── MAPA ── */}
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 p-4 border-b border-border/60">
            <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
              <MapPin size={15} className="text-muted-foreground" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Ubicación en el Mapa
            </h2>
            {hasCoords && (
              <span className="ml-auto text-[11px] font-mono text-muted-foreground bg-muted/50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg">
                {Number(form.latitud).toFixed(5)},{" "}
                {Number(form.longitud).toFixed(5)}
              </span>
            )}
          </div>
          <div className={isMobile ? "h-[260px]" : "h-[380px]"}>
            <MapContainer
              center={
                hasCoords
                  ? [Number(form.latitud), Number(form.longitud)]
                  : [14.0723, -87.1921]
              }
              zoom={hasCoords ? 13 : 7}
              style={{ height: "100%", width: "100%", zIndex: 0 }}
              key={`map-${hasCoords}`}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ClickHandler onPick={handleMapClick} />
              {hasCoords && (
                <Marker
                  position={[Number(form.latitud), Number(form.longitud)]}
                />
              )}
            </MapContainer>
          </div>
        </div>

        {/* ── BOTONES ── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1 justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none sm:min-w-[180px] rounded-2xl h-11 font-bold shadow-md shadow-primary/15 hover:shadow-primary/25 transition-all gap-2 disabled:opacity-60">
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isEdit ? (
              <Save size={16} />
            ) : (
              <Plus size={16} />
            )}
            {loading
              ? "Guardando..."
              : isEdit
                ? "Guardar Cambios"
                : "Crear Peaje"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/peajes")}
            disabled={loading}
            className="flex-1 sm:flex-none sm:min-w-[140px] rounded-2xl h-11 font-bold">
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
