// src/components/ComponentsReport/RegisterReport/ReportCard.jsx
import { Car, Clock, CheckCircle2, User, Calendar, ArrowRight } from "lucide-react";

// ── Status badge ───────────────────────────────────────────────────────────────
const ESTADO_CLASSES = {
  Activo: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/40",
  Finalizado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
};

const ESTADO_DEFAULT = "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700";

const EstadoIcon = ({ estado }) => {
  if (estado === "Activo") return <Clock size={12} className="text-amber-500" />;
  if (estado === "Finalizado") return <CheckCircle2 size={12} className="text-emerald-500" />;
  return null;
};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-HN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ── Componente ─────────────────────────────────────────────────────────────────
export default function ReportCard({ registro, onClick }) {
  const { vehiculo = {}, empleado = {}, fecha_salida, fecha_regreso, estado } = registro;
  const estadoClass = ESTADO_CLASSES[estado] || ESTADO_DEFAULT;

  return (
    <button
      onClick={() => onClick?.(registro)}
      className="group w-full text-left bg-card dark:bg-slate-900/60 border border-border/60 rounded-3xl p-5 flex flex-col gap-4 hover:shadow-md hover:border-border transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">

      {/* Header: icono vehículo + estado */}
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-100 dark:ring-blue-900/40 flex items-center justify-center shrink-0">
          <Car size={18} className="text-blue-600 dark:text-blue-400" />
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${estadoClass}`}>
            <EstadoIcon estado={estado} />
            {estado || "—"}
          </span>
          <div className="w-7 h-7 rounded-xl bg-muted/50 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:bg-primary/10 group-hover:ring-1 ring-primary/20">
            <ArrowRight size={13} className="text-primary" />
          </div>
        </div>
      </div>

      {/* Vehículo */}
      <div>
        <p className="font-black text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {vehiculo.placa || "Sin placa"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(" ") || "Vehículo sin detalle"}
        </p>
      </div>

      {/* Empleado */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 dark:bg-slate-800/50 rounded-xl px-3 py-2">
        <User size={12} className="shrink-0 text-muted-foreground/60" />
        <span className="font-semibold text-foreground truncate">{empleado.nombre || "—"}</span>
        {empleado.puesto && (
          <span className="truncate opacity-60">· {empleado.puesto}</span>
        )}
      </div>

      {/* Fechas */}
      <div className="flex flex-col gap-1.5 border-t border-border/40 pt-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Calendar size={11} className="shrink-0" />
          <span className="font-medium">Salida:</span>
          <span>{fmtDate(fecha_salida)}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Calendar size={11} className="shrink-0 opacity-0" />
          <span className="font-medium">Regreso:</span>
          <span className={fecha_regreso ? "" : "text-amber-500 font-semibold"}>
            {fecha_regreso ? fmtDate(fecha_regreso) : "En curso"}
          </span>
        </div>
      </div>
    </button>
  );
}
