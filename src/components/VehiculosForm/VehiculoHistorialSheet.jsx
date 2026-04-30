import { useEffect } from "react";
import { X, Car } from "lucide-react";
import AuditTimeline from "@/components/ui/AuditTimeline";

const STATUS_DOT = {
  disponible:         "bg-emerald-500",
  "en uso":           "bg-amber-500",
  "en mantenimiento": "bg-red-500",
  reservado:          "bg-blue-500",
  inactivo:           "bg-gray-400",
};

function estadoDot(estado) {
  return STATUS_DOT[(estado || "").toLowerCase()] ?? "bg-gray-400";
}

export default function VehiculoHistorialSheet({ open, onClose, vehiculo }) {
  /* Scroll lock */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open || !vehiculo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative h-full w-full max-w-md bg-card dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60 shrink-0">
          <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/15 shrink-0">
            <Car size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
              Historial — {vehiculo.placa}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Vehicle info card */}
        <div className="px-5 py-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 dark:bg-slate-800/40">
            <div className="w-10 h-10 rounded-xl bg-muted dark:bg-slate-800 flex items-center justify-center shrink-0">
              <Car size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  {vehiculo.placa}
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${estadoDot(vehiculo.estado)}`} />
                  {vehiculo.estado}
                </span>
              </div>
              {vehiculo.nombre_ubicacion && (
                <p className="text-[11px] text-muted-foreground truncate">
                  📍 {vehiculo.nombre_ubicacion}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Timeline — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <AuditTimeline entidad="vehiculo" entidadId={vehiculo.id} />
        </div>
      </div>
    </div>
  );
}
