import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Clock, Route } from "lucide-react";

const API_KEY =
  "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjJhMjM2ZDc3NmVmYTQzNGJhMWI1Mzg4YmRjY2IxZmM0IiwiaCI6Im11cm11cjY0In0=";

function ClickHandler({ onAdd }) {
  useMapEvents({
    click(e) {
      onAdd(e.latlng);
    },
  });
  return null;
}

export default function MapSelector({ puntos = [], onAdd, onRouteChange }) {
  const [ruta, setRuta] = useState([]);
  const [distancia, setDistancia] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [rutaAnimadaIndex, setRutaAnimadaIndex] = useState(0);
  const animIntervalRef = useRef(null);

  const calcularRuta = async () => {
    if (puntos.length < 2) {
      setRuta([]);
      setDistancia(0);
      setDuracion(0);
      return;
    }

    try {
      const response = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          method: "POST",
          headers: {
            Authorization: API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            coordinates: puntos.map((p) => [
              Number(p.longitud),
              Number(p.latitud),
            ]),
          }),
        },
      );

      const data = await response.json();
      const summary = data.features[0].properties.summary;
      const dist = summary.distance / 1000;
      const tiempo = summary.duration / 60;
      const coords = data.features[0].geometry.coordinates;
      const rutaLatLng = coords.map(([lng, lat]) => [lat, lng]);

      setRuta(rutaLatLng);
      setDistancia(dist);
      setDuracion(tiempo);

      if (onRouteChange) {
        onRouteChange({ distancia: dist, ruta: rutaLatLng });
      }
    } catch (error) {
      console.error("Error calculando ruta:", error);
    }
  };

  useEffect(() => {
    calcularRuta();
  }, [puntos]);

  // Animación progresiva del polyline al recibir nueva ruta
  useEffect(() => {
    if (animIntervalRef.current) clearInterval(animIntervalRef.current);

    if (ruta.length === 0) {
      setRutaAnimadaIndex(0);
      return;
    }

    setRutaAnimadaIndex(1);
    const step = Math.max(1, Math.ceil(ruta.length / 60));

    animIntervalRef.current = setInterval(() => {
      setRutaAnimadaIndex((prev) => {
        const next = prev + step;
        if (next >= ruta.length) {
          clearInterval(animIntervalRef.current);
          return ruta.length;
        }
        return next;
      });
    }, 16);

    return () => clearInterval(animIntervalRef.current);
  }, [ruta]);

  const rutaVisible = ruta.slice(0, rutaAnimadaIndex);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[14.0723, -87.1921]}
        zoom={7}
        className="h-full w-full z-0">
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler onAdd={onAdd} />

        {puntos.map((p, i) => (
          <Marker key={i} position={[p.latitud, p.longitud]} />
        ))}

        {rutaVisible.length > 1 && (
          <Polyline
            positions={rutaVisible}
            pathOptions={{
              color: "#2563eb",
              weight: 5,
              opacity: 0.9,
            }}
          />
        )}
      </MapContainer>

      <div className="absolute bottom-8 left-8 right-8 bg-background/90 backdrop-blur-md border shadow-2xl rounded-2xl p-5 flex items-center justify-between z-[1000] border-primary/20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--joy-palette-primary-main)] text-white p-3 rounded-xl shadow-lg shadow-[var(--joy-palette-primary-main)]/30">
              <Route size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-[var(--joy-palette-primary-main)] uppercase tracking-widest">
                Distancia
              </p>
              <p className="text-2xl font-black">
                {distancia.toFixed(1)}
                <span className="text-xs font-medium text-muted-foreground ml-1">
                  KM
                </span>
              </p>
            </div>
          </div>

          <div className="h-10 w-[1px] bg-border mx-2 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="bg-[var(--joy-palette-primary-main)] text-white p-3 rounded-xl shadow-lg shadow-orange-500/30">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-[var(--joy-palette-primary-main)] uppercase tracking-widest">
                Tiempo Est.
              </p>
              <p className="text-2xl font-black">
                {duracion > 60
                  ? `${Math.floor(duracion / 60)}h ${Math.round(duracion % 60)}m`
                  : `${Math.round(duracion)} min`}
              </p>
            </div>
          </div>
        </div>

        <div className="text-right hidden lg:block">
          <p className="text-[10px] font-bold text-muted-foreground uppercase italic tracking-tighter">
            AutoLog Engine v2
          </p>
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase">
              {puntos.length} Paradas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
