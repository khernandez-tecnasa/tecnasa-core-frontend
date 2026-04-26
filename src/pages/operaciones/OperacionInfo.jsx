import { Car, AlertTriangle, Gauge, Fuel, MapPin } from "lucide-react";

export default function OperacionInfo({ vehiculo, operacionActiva, reserva }) {
  const unidad = operacionActiva || vehiculo;
  if (!unidad && !reserva) return null;

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {/* UNIDAD SELECCIONADA */}
      {unidad && (
        <div
          className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${
            operacionActiva
              ? "bg-blue-50/70 border-blue-200/70 dark:bg-blue-900/20 dark:border-blue-700/40"
              : "bg-emerald-50/70 border-emerald-200/70 dark:bg-emerald-900/20 dark:border-emerald-700/40"
          }`}
        >
          <div
            className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center shadow-md ${
              operacionActiva ? "bg-blue-500" : "bg-emerald-500"
            }`}
          >
            <Car size={18} className="text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Unidad en Gestión
            </p>
            <p className="text-xl font-black tracking-tight text-foreground truncate leading-tight">
              {unidad.placa}
            </p>
          </div>

          <span
            className={`shrink-0 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
              operacionActiva
                ? "bg-blue-100 text-blue-700 dark:bg-blue-800/50 dark:text-blue-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-800/50 dark:text-emerald-300"
            }`}
          >
            {operacionActiva ? "En Uso" : "Listo"}
          </span>
        </div>
      )}

      {/* Datos de salida */}
      {operacionActiva && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Gauge size={13} />, label: "KM salida",    value: operacionActiva.km_salida },
            { icon: <Fuel size={13} />,  label: "Combustible",  value: `${operacionActiva.combustible_salida}%` },
            { icon: <MapPin size={13} />,label: "Ubicación",    value: operacionActiva.nombre_ubicacion },
          ].map(({ icon, label, value }) => (
            <div key={label} className="bg-muted/50 dark:bg-slate-800/50 rounded-2xl p-3 text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                {icon}
                <p className="text-[9px] font-black uppercase tracking-widest">{label}</p>
              </div>
              <p className="text-sm font-bold text-foreground truncate">{value || "—"}</p>
            </div>
          ))}
        </div>
      )}

      {/* RESERVA ACTIVA */}
      {reserva && (
        <div className="flex items-start gap-3 p-4 bg-amber-50/80 border-2 border-amber-200/60 rounded-2xl dark:bg-amber-900/20 dark:border-amber-700/40">
          <AlertTriangle size={17} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Reserva Confirmada Detectada
            </p>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mt-0.5">
              {reserva.motivo}
              <br />
              <span className="text-xs text-muted-foreground">
                Inicio: {new Date(reserva.fecha_inicio).toLocaleDateString()}
                {" — "}
                Fin: {new Date(reserva.fecha_fin).toLocaleDateString()}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
