import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  STATUS_CONFIG,
  DEFAULT_STATUS,
  fmtHora,
  fmtFecha,
  fmtKm,
} from "./trackingConfig";

// Fix leaflet default marker icon (bundler issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function InfoRow({ label, value, full }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <p className="text-[10px] font-semibold tracking-widest text-white/30 uppercase mb-0.5">
        {label}
      </p>
      <p
        className="text-sm text-white/85 font-medium leading-snug"
        title={typeof value === "string" ? value : undefined}>
        {value || "—"}
      </p>
    </div>
  );
}

function RutaMap({ ruta }) {
  const puntos = Array.isArray(ruta.puntos)
    ? ruta.puntos
    : (() => {
        try {
          return JSON.parse(ruta.puntos || "[]");
        } catch {
          return [];
        }
      })();

  const validos = puntos.filter((p) => p.lat != null && p.lng != null);
  if (!validos.length) return null;

  const center = [validos[0].lat, validos[0].lng];
  const polyline = validos.map((p) => [p.lat, p.lng]);

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height: "100%", width: "100%" }}
      zoomControl
      attributionControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline positions={polyline} color="#60a5fa" weight={3} opacity={0.85} />
      {validos.map((p, i) => (
        <Marker key={i} position={[p.lat, p.lng]}>
          {p.nombre && (
            <Popup>
              <span className="text-xs font-medium">{p.nombre}</span>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}

export default function VehicleDetailPanel({ vehiculo, onClose }) {
  const panelRef = useRef(null);
  const st = STATUS_CONFIG[vehiculo.estado] ?? DEFAULT_STATUS;

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Bloquear scroll del body mientras el panel está abierto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const hasRuta =
    vehiculo.ruta &&
    (() => {
      const pts = Array.isArray(vehiculo.ruta.puntos)
        ? vehiculo.ruta.puntos
        : (() => {
            try {
              return JSON.parse(vehiculo.ruta.puntos || "[]");
            } catch {
              return [];
            }
          })();
      return pts.some((p) => p.lat != null && p.lng != null);
    })();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel lateral */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle vehículo ${vehiculo.placa}`}
        className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-md
                   bg-[#0e1118] border-l border-white/10 shadow-2xl
                   animate-in slide-in-from-right duration-300">

        {/* Header del panel */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-white/8 shrink-0">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-white/30 uppercase mb-1">
              Detalle del vehículo
            </p>
            <h2 className="text-4xl font-black tracking-widest text-white leading-none">
              {vehiculo.placa}
            </h2>
            {(vehiculo.marca || vehiculo.modelo) && (
              <p className="text-sm text-white/40 mt-1.5">
                {[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(" ")}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg
                         bg-white/5 hover:bg-white/10 border border-white/10
                         text-white/50 hover:text-white transition-colors"
              aria-label="Cerrar">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Badge estado */}
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${st.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              {st.label}
            </span>
          </div>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto">

          {/* Datos principales */}
          <div className="px-6 py-5 grid grid-cols-2 gap-x-6 gap-y-4">
            <InfoRow label="Ubicación" value={vehiculo.ubicacion} full />

            {vehiculo.usuario_nombre && (
              <>
                <div className="col-span-2 h-px bg-white/8" />
                <InfoRow
                  label="Conductor"
                  value={vehiculo.usuario_nombre}
                  full
                />
                <InfoRow label="Hora de salida" value={fmtHora(vehiculo.hora_salida)} />
                <InfoRow label="KM de salida" value={fmtKm(vehiculo.km_salida)} />
                {vehiculo.combustible_salida != null && (
                  <InfoRow
                    label="Combustible"
                    value={`${vehiculo.combustible_salida}%`}
                  />
                )}
              </>
            )}

            {vehiculo.reserva_id && (
              <>
                <div className="col-span-2 h-px bg-white/8" />
                <p className="col-span-2 text-[10px] font-semibold tracking-widest text-white/30 uppercase">
                  Reserva
                </p>
                <InfoRow
                  label="Reservado por"
                  value={vehiculo.reserva_usuario}
                  full
                />
                <InfoRow
                  label="Período"
                  value={`${fmtFecha(vehiculo.reserva_inicio)} → ${fmtFecha(vehiculo.reserva_fin)}`}
                  full
                />
                {vehiculo.reserva_motivo && (
                  <InfoRow
                    label="Motivo"
                    value={vehiculo.reserva_motivo}
                    full
                  />
                )}
                <InfoRow label="Estado" value={vehiculo.reserva_estado} />
              </>
            )}
          </div>

          {/* Mapa de ruta */}
          {hasRuta && (
            <div className="px-6 pb-6">
              <div className="mb-3">
                <div className="h-px bg-white/8 mb-4" />
                <p className="text-[10px] font-semibold tracking-widest text-white/30 uppercase mb-1">
                  Ruta del día
                </p>
                <p className="text-sm font-semibold text-blue-400">
                  {vehiculo.ruta.nombre}
                </p>
                {vehiculo.ruta.descripcion && (
                  <p className="text-xs text-white/40 mt-0.5">
                    {vehiculo.ruta.descripcion}
                  </p>
                )}
              </div>
              <div
                className="rounded-xl overflow-hidden border border-white/10"
                style={{ height: 300 }}>
                <RutaMap ruta={vehiculo.ruta} />
              </div>
            </div>
          )}

          {/* Sin ruta */}
          {!hasRuta && (
            <div className="px-6 pb-6">
              <div className="h-px bg-white/8 mb-4" />
              <div className="rounded-xl border border-dashed border-white/10 bg-white/3 flex flex-col items-center justify-center py-8 gap-2 text-white/20">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497z"
                  />
                </svg>
                <p className="text-xs">Sin ruta asignada hoy</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
