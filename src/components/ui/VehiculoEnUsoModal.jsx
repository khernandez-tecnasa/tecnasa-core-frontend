import { useEffect, useState } from "react";
import { X, AlertTriangle, Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";

/**
 * Modal que se muestra cuando un vehículo está en uso al intentar
 * acceder al enlace de QR de registro.
 *
 * Props:
 *   open          boolean
 *   onClose       () => void
 *   registro      { nombre_empleado, email_empleado, fecha_salida }
 *   vehiculoPlaca string
 *   onNotificar   () => Promise<void>   — acción de enviar email
 */
export default function VehiculoEnUsoModal({
  open,
  onClose,
  registro,
  vehiculoPlaca,
  onNotificar,
}) {
  const [notifState, setNotifState] = useState("idle"); // idle | loading | success | error

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setNotifState("idle");
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const nombre = registro?.nombre_empleado || "—";
  const email  = registro?.email_empleado  || null;
  const fecha  = registro?.fecha_salida
    ? new Date(registro.fecha_salida).toLocaleString("es-HN", {
        day: "2-digit", month: "short",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  const handleNotificar = async () => {
    if (!onNotificar) return;
    setNotifState("loading");
    try {
      await onNotificar();
      setNotifState("success");
    } catch {
      setNotifState("error");
    }
  };

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center p-4 sm:p-6" style={{ zIndex: 600 }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 rounded-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-[fadeIn_0.2s_ease]">

        {/* Header */}
        <div className="bg-amber-500 px-5 py-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">Vehículo en uso</p>
            <p className="text-amber-100 text-xs mt-0.5">
              {vehiculoPlaca ? `Unidad ${vehiculoPlaca}` : "Esta unidad"} no está disponible
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-0.5 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info del empleado */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <span className="text-amber-600 dark:text-amber-400 font-bold text-sm">
                {nombre[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium">En uso por</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{nombre}</p>
              {email && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{email}</p>
              )}
            </div>
            {fecha && (
              <div className="text-right shrink-0">
                <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium">Salida</p>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{fecha}</p>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3 leading-relaxed">
            Pide al empleado que registre el regreso o envíale una notificación.
          </p>
        </div>

        {/* Estado de notificación */}
        {notifState === "success" && (
          <div className="mx-5 mb-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Notificación enviada correctamente.
            </p>
          </div>
        )}
        {notifState === "error" && (
          <div className="mx-5 mb-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs font-medium text-red-700 dark:text-red-400">
              No se pudo enviar la notificación.
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="px-5 pb-5 flex gap-3">
          {email && notifState !== "success" && (
            <button
              onClick={handleNotificar}
              disabled={notifState === "loading"}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 disabled:opacity-50 transition-colors"
            >
              {notifState === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              Notificar
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
