import { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import {
  STATUS_CONFIG,
  DEFAULT_STATUS,
  fmtHora,
} from "./trackingConfig";
import VehicleDetailPanel from "./VehicleDetailPanel";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:3000"
  : (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api$/, "") ||
    "https://autologapi-production.up.railway.app";

const REFRESH_INTERVAL_MS = 30_000;

// ── Card simplificada ─────────────────────────────────────────────────────────

function VehicleCard({ v, onClick }) {
  const st = STATUS_CONFIG[v.estado] ?? DEFAULT_STATUS;
  const enUso = v.estado === "En Uso";

  return (
    <button
      type="button"
      onClick={() => onClick(v)}
      className={`
        w-full text-left flex flex-col gap-3 rounded-2xl border bg-white/5
        backdrop-blur-sm p-5 shadow-lg transition-all duration-200
        hover:bg-white/10 hover:scale-[1.02] active:scale-[0.99] cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
        ${st.card} ${st.glow}
      `}>

      {/* Placa + badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-white/30 uppercase mb-0.5">
            Placa
          </p>
          <p className="text-3xl font-black tracking-wider text-white leading-none">
            {v.placa}
          </p>
        </div>

        <span
          className={`
            flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shrink-0
            ${st.badge}
          `}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          {st.label}
        </span>
      </div>

      <div className="h-px bg-white/8" />

      {/* Info mínima */}
      <div className="flex flex-col gap-2 text-sm">
        {/* Ubicación */}
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-white/30 uppercase mb-0.5">
            Ubicación
          </p>
          <p className="text-sm text-white/75 font-medium truncate">
            {v.ubicacion || "—"}
          </p>
        </div>

        {/* Conductor (solo si está en uso) */}
        {enUso && v.usuario_nombre && (
          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <svg
                  className="w-3 h-3 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </div>
              <p className="text-xs text-white/70 font-medium truncate">
                {v.usuario_nombre}
              </p>
            </div>
            {v.hora_salida && (
              <p className="text-xs text-white/40 shrink-0">
                {fmtHora(v.hora_salida)}
              </p>
            )}
          </div>
        )}

        {/* Indicador de reserva (solo icono) */}
        {v.reserva_id && !enUso && (
          <div className="flex items-center gap-1.5 mt-1">
            <svg
              className="w-3 h-3 text-blue-400 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"
              />
            </svg>
            <p className="text-xs text-blue-400/80">
              {v.reserva_usuario ? `Reservado · ${v.reserva_usuario}` : "Reservado"}
            </p>
          </div>
        )}

        {/* Indicador de ruta (solo icono) */}
        {v.ruta && (
          <div className="flex items-center gap-1.5">
            <svg
              className="w-3 h-3 text-blue-400/70 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497z"
              />
            </svg>
            <p className="text-xs text-blue-400/60 truncate">{v.ruta.nombre}</p>
          </div>
        )}
      </div>

      {/* Ver detalle hint */}
      <div className="flex items-center gap-1 text-[10px] text-white/20 mt-auto pt-1">
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        Ver detalle
      </div>
    </button>
  );
}

// ── Barra de estado ───────────────────────────────────────────────────────────

function StatusBar({ connected, lastUpdate, total, counts }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-white/4 border-b border-white/8 text-xs text-white/50">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"
            }`}
          />
          {connected ? "En vivo" : "Reconectando…"}
        </span>

        {Object.entries(counts).map(
          ([estado, n]) =>
            n > 0 && (
              <span
                key={estado}
                className={`${
                  STATUS_CONFIG[estado]?.badge ?? ""
                } px-2 py-0.5 rounded-full font-semibold`}>
                {n} {STATUS_CONFIG[estado]?.label ?? estado}
              </span>
            ),
        )}
      </div>

      <div className="flex items-center gap-4">
        <span>{total} vehículos</span>
        {lastUpdate && (
          <span>
            Actualizado{" "}
            {lastUpdate.toLocaleTimeString("es-HN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Reloj ─────────────────────────────────────────────────────────────────────

function Clock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("es-HN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("es-HN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function TrackingVehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);
  const socketRef = useRef(null);
  const refreshRef = useRef(null);

  const applyUpdate = useCallback((data) => {
    if (!Array.isArray(data)) return;
    setVehiculos(data);
    setLastUpdate(new Date());
    // Actualizar datos del vehículo seleccionado si está abierto
    setSelectedVehiculo((prev) => {
      if (!prev) return null;
      const updated = data.find((v) => v.id === prev.id);
      return updated ?? null;
    });
  }, []);

  const fetchREST = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/public/tracking/vehiculos`);
      if (res.ok) {
        const data = await res.json();
        applyUpdate(data);
      }
    } catch {
      // silencioso — WebSocket cubrirá actualizaciones
    } finally {
      setLoading(false);
    }
  }, [applyUpdate]);

  // Carga inicial + polling fallback cada 30 s
  useEffect(() => {
    fetchREST();
    refreshRef.current = setInterval(fetchREST, REFRESH_INTERVAL_MS);
    return () => clearInterval(refreshRef.current);
  }, [fetchREST]);

  // Socket.io
  useEffect(() => {
    const socket = io(API_BASE, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("tracking:update", applyUpdate);
    return () => socket.disconnect();
  }, [applyUpdate]);

  const counts = vehiculos.reduce((acc, v) => {
    acc[v.estado] = (acc[v.estado] || 0) + 1;
    return acc;
  }, {});

  return (
    <div
      className="min-h-screen bg-[#0a0c10] text-white flex flex-col"
      style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-wide text-white">
            Monitoreo de Flota
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            Panel de seguimiento en tiempo real
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-mono font-bold text-white/80">
            <Clock />
          </p>
          <p className="text-xs text-white/30">
            {new Date().toLocaleDateString("es-HN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
      </header>

      {/* Barra de estado */}
      <StatusBar
        connected={connected}
        lastUpdate={lastUpdate}
        total={vehiculos.length}
        counts={counts}
      />

      {/* Grid */}
      <main className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-white/30">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            <p className="text-sm">Cargando vehículos…</p>
          </div>
        ) : vehiculos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-white/30">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
              />
            </svg>
            <p className="text-sm">Sin vehículos registrados</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {vehiculos.map((v) => (
              <VehicleCard
                key={v.id}
                v={v}
                onClick={setSelectedVehiculo}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 py-2 border-t border-white/8 text-center text-[10px] text-white/20 shrink-0">
        Tecnasa Honduras · Sistema Autolog
      </footer>

      {/* Panel de detalle */}
      {selectedVehiculo && (
        <VehicleDetailPanel
          vehiculo={selectedVehiculo}
          onClose={() => setSelectedVehiculo(null)}
        />
      )}
    </div>
  );
}
