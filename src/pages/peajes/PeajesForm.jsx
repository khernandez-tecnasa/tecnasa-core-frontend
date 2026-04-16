import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Loader2,
  Save,
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

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground animate-pulse font-medium">
          Cargando peaje...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between bg-card p-4 rounded-2xl border shadow-sm">
        <button
          onClick={() => navigate("/admin/peajes")}
          className="flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft size={20} /> VOLVER
        </button>
        <div className="text-right">
          <h1 className="text-xl font-black tracking-tighter uppercase flex items-center gap-2 justify-end">
            <Milestone size={20} className="text-primary" />
            {isEdit ? "Editar Peaje" : "Nuevo Peaje"}
          </h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            AutoLog Logistics Management
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden">
          {/* DATOS */}
          <div className="p-6 md:p-8 border-b bg-muted/20 space-y-5">
            <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
              <Info size={14} /> Información del Peaje
            </h3>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase ml-1 text-muted-foreground">
                Nombre del Peaje
              </label>
              <div className="relative">
                <Milestone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <input
                  type="text"
                  name="nombre"
                  placeholder="Ej: Peaje Comayagua Norte"
                  value={form.nombre}
                  onChange={handleChange}
                  className="w-full bg-background border-2 border-muted rounded-2xl pl-10 pr-4 py-3 text-sm focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase ml-1 text-muted-foreground">
                  Tarifa Liviano
                </label>
                <input
                  type="number"
                  name="tarifa_liviano"
                  step="0.01"
                  placeholder="Ej: 25.00"
                  value={form.tarifa_liviano}
                  onChange={handleChange}
                  className="w-full bg-background border-2 border-muted rounded-2xl px-4 py-3 text-sm focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase ml-1 text-muted-foreground">
                  Tarifa Pesado
                </label>
                <input
                  type="number"
                  name="tarifa_pesado"
                  step="0.01"
                  placeholder="Ej: 50.00"
                  value={form.tarifa_pesado}
                  onChange={handleChange}
                  className="w-full bg-background border-2 border-muted rounded-2xl px-4 py-3 text-sm focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase ml-1 text-muted-foreground">
                  Latitud
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={18}
                  />
                  <input
                    type="number"
                    name="latitud"
                    step="0.000001"
                    placeholder="14.072300"
                    value={form.latitud}
                    onChange={handleChange}
                    className="w-full bg-background border-2 border-muted rounded-2xl pl-10 pr-4 py-3 text-sm focus:border-primary outline-none transition-all font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase ml-1 text-muted-foreground">
                  Longitud
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={18}
                  />
                  <input
                    type="number"
                    name="longitud"
                    step="0.000001"
                    placeholder="-87.192100"
                    value={form.longitud}
                    onChange={handleChange}
                    className="w-full bg-background border-2 border-muted rounded-2xl pl-10 pr-4 py-3 text-sm focus:border-primary outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground bg-muted/40 rounded-xl px-4 py-2.5 border">
              Haz clic en el mapa para marcar la ubicación exacta del peaje.
            </p>
          </div>

          {/* MAPA */}
          <div className="h-[380px] relative">
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

          {/* BOTÓN */}
          <div className="p-6 bg-muted/10 border-t">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 font-black rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90">
              {loading ? (
                <Loader2 className="mr-2 animate-spin" size={18} />
              ) : (
                <Save size={18} className="mr-2" />
              )}
              {isEdit ? "CONFIRMAR CAMBIOS" : "CREAR PEAJE"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
