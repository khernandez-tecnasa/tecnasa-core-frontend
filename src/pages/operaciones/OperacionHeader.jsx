import { Activity } from "lucide-react";

export default function OperacionHeader({ operacionActiva }) {
  return (
    <div className="bg-card dark:bg-slate-900/40 rounded-3xl border border-border/60 shadow-sm overflow-hidden">
      {/* Accent bar */}
      <div
        className={`h-1 w-full ${
          operacionActiva
            ? "bg-gradient-to-r from-blue-500 to-indigo-500"
            : "bg-gradient-to-r from-emerald-400 to-teal-500"
        }`}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 md:p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl shrink-0">
              <Activity size={15} className="text-primary" />
            </div>
            <h1 className="text-base font-black tracking-tight text-foreground">
              Operaciones de Flota
            </h1>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground pl-9">
            {operacionActiva
              ? "Módulo de Recepción · Registro de Regreso"
              : "Módulo de Despacho · Registro de Salida"}
          </p>
        </div>

        <div
          className={`self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
            operacionActiva
              ? "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
              : "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              operacionActiva ? "bg-blue-500" : "bg-emerald-500"
            }`}
          />
          Sistema {operacionActiva ? "En Uso" : "Disponible"}
        </div>
      </div>
    </div>
  );
}
