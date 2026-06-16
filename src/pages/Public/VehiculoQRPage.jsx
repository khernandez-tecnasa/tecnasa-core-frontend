// src/pages/Public/VehiculoQRPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Car, AlertTriangle, CheckCircle, Loader2, LogIn, Clock } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { getVehiculoPublicInfo } from "../../services/VehiculosService";
import { obtenerRegistroPendientePorVehiculo } from "../../services/RegistrosService";
import { login } from "../../services/AuthServices";

const ESTADO_COLOR = {
  Disponible: "text-emerald-600 bg-emerald-50 border-emerald-200",
  "En Uso": "text-amber-600 bg-amber-50 border-amber-200",
  "En Mantenimiento": "text-orange-600 bg-orange-50 border-orange-200",
  Inactivo: "text-gray-500 bg-gray-50 border-gray-200",
};

export default function VehiculoQRPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData, checkingSession, refreshUser } = useAuth();

  const [vehiculo, setVehiculo] = useState(null);
  const [loadingVehiculo, setLoadingVehiculo] = useState(true);
  const [vehiculoError, setVehiculoError] = useState(null);

  const [registroPendiente, setRegistroPendiente] = useState(undefined); // undefined = sin verificar
  const [loadingStatus, setLoadingStatus] = useState(false);

  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // 1. Cargar info pública del vehículo al montar
  useEffect(() => {
    setLoadingVehiculo(true);
    getVehiculoPublicInfo(id)
      .then(setVehiculo)
      .catch(() => setVehiculoError("Vehículo no encontrado."))
      .finally(() => setLoadingVehiculo(false));
  }, [id]);

  // 2. Cuando el usuario ya está autenticado, verificar estado del vehículo
  useEffect(() => {
    if (checkingSession || !userData) return;

    setLoadingStatus(true);
    obtenerRegistroPendientePorVehiculo(id)
      .then(setRegistroPendiente)
      .catch(() => setRegistroPendiente(null))
      .finally(() => setLoadingStatus(false));
  }, [userData, checkingSession, id]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const data = await login(credentials.username, credentials.password);
      if (data?.require_2fa || data?.require_passkey) {
        setLoginError("Tu cuenta requiere verificación adicional. Usa la pantalla de inicio de sesión completa.");
        return;
      }
      await refreshUser();
    } catch (err) {
      setLoginError(err?.data?.error || err?.message || "Credenciales incorrectas.");
    } finally {
      setLoginLoading(false);
    }
  };

  const irARegistro = () => {
    navigate(`/admin/panel-vehiculos?vehiculo_id=${id}`);
  };

  // ── UI ──────────────────────────────────────────────────────────────────────

  if (loadingVehiculo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (vehiculoError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
        <div className="text-center space-y-3">
          <Car className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 font-medium">{vehiculoError}</p>
          <p className="text-sm text-gray-400">El código QR puede estar dañado o el vehículo fue eliminado.</p>
        </div>
      </div>
    );
  }

  const estadoClass = ESTADO_COLOR[vehiculo?.estado] || ESTADO_COLOR.Inactivo;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-start pt-10 px-4 pb-10">
      <div className="w-full max-w-sm space-y-5">

        {/* ── Tarjeta del vehículo ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Vehículo</p>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                {vehiculo.placa}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {vehiculo.marca && (
              <div>
                <p className="text-xs text-gray-400">Marca</p>
                <p className="font-medium text-gray-700 dark:text-gray-200">{vehiculo.marca}</p>
              </div>
            )}
            {vehiculo.modelo && (
              <div>
                <p className="text-xs text-gray-400">Modelo</p>
                <p className="font-medium text-gray-700 dark:text-gray-200">{vehiculo.modelo}</p>
              </div>
            )}
            {vehiculo.color && (
              <div>
                <p className="text-xs text-gray-400">Color</p>
                <p className="font-medium text-gray-700 dark:text-gray-200">{vehiculo.color}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400">Estado</p>
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${estadoClass}`}>
                {vehiculo.estado}
              </span>
            </div>
          </div>
        </div>

        {/* ── Sección según estado de auth ── */}
        {checkingSession ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !userData ? (
          /* ── Login inline ── */
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Inicia sesión para continuar</h2>
              <p className="text-sm text-gray-500">Necesitas autenticarte para registrar el uso del vehículo.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Usuario</label>
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={credentials.username}
                  onChange={(e) => setCredentials((p) => ({ ...p, username: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                  placeholder="tu@correo.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contraseña</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials((p) => ({ ...p, password: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {loginError && (
                <p className="text-xs text-red-500 dark:text-red-400">{loginError}</p>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-[var(--foreground)] font-semibold text-sm hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {loginLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                Ingresar
              </button>
            </form>
          </div>
        ) : loadingStatus ? (
          /* ── Verificando estado ── */
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400 shrink-0" />
            <p className="text-sm text-gray-500">Verificando disponibilidad...</p>
          </div>
        ) : registroPendiente ? (
          /* ── Vehículo en uso ── */
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Vehículo en uso</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Este vehículo está siendo utilizado actualmente.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <span className="font-medium">Empleado:</span>
                <span>{registroPendiente.nombre_empleado || "—"}</span>
              </div>
              {registroPendiente.fecha_salida && (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Salida:{" "}
                    {new Date(registroPendiente.fecha_salida).toLocaleString("es-HN", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-amber-600 dark:text-amber-500">
              El empleado debe registrar el regreso del vehículo antes de que puedas utilizarlo.
            </p>
          </div>
        ) : (
          /* ── Vehículo disponible ── */
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-5 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Vehículo disponible</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Puedes registrar la salida.</p>
              </div>
            </div>

            <button
              onClick={irARegistro}
              className="w-full py-3 rounded-2xl bg-primary text-[var(--foreground)] font-semibold text-base hover:opacity-90 active:opacity-80 transition-opacity shadow-sm"
            >
              Registrar Salida
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
