// src/pages/Facturacion/PeriodoClientes.jsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Building2, Loader2, AlertTriangle, ChevronRight, ChevronLeft, CalendarRange } from "lucide-react";

import { getClientes } from "@/services/ClientesServices";
import { getEstadoPeriodoCliente } from "@/services/facturacion.service";
import { Button } from "@/components/ui/button";

const ESTADO_CLASSES = {
  Nuevo: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  Abierto: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  "En Revision": "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  Aprobado: "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",
  Cerrado: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
};

function EstadoBadge({ estado }) {
  const cls = ESTADO_CLASSES[estado] || ESTADO_CLASSES.Nuevo;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase rounded-full border ${cls}`}>
      {estado}
    </span>
  );
}

export default function PeriodoClientes() {
  const { periodoId } = useParams();
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [estados, setEstados] = useState({}); // { [clienteId]: estado }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClientes();
      const arr = Array.isArray(data) ? data : [];
      setClientes(arr);

      const pares = await Promise.all(
        arr.map(async (c) => {
          try {
            const r = await getEstadoPeriodoCliente(periodoId, c.id);
            return [c.id, r.estado];
          } catch {
            return [c.id, "Nuevo"];
          }
        })
      );
      setEstados(Object.fromEntries(pares));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [periodoId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      <div>
        <Link
          to="/admin/facturacion/periodos"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ChevronLeft size={16} /> Volver a períodos
        </Link>

        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shrink-0">
            <CalendarRange size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Clientes del Período
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Selecciona un cliente para cargar/revisar sus lecturas
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <Loader2 className="animate-spin text-primary" size={22} />
            <p className="text-sm text-muted-foreground font-medium">Cargando clientes...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <AlertTriangle size={28} className="text-rose-500/50" />
            <p className="text-sm font-bold">{error}</p>
            <Button onClick={load} variant="outline" size="sm" className="rounded-xl">Reintentar</Button>
          </div>
        ) : clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Building2 size={28} className="text-muted-foreground/40" />
            <p className="font-bold text-sm">Sin clientes registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {clientes.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/admin/facturacion/periodos/${periodoId}/cliente/${c.id}`)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 dark:hover:bg-slate-800/30 transition-colors text-left">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-muted/60 dark:bg-slate-800 flex items-center justify-center">
                  <Building2 size={16} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{c.nombre}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{c.codigo}</p>
                </div>
                <EstadoBadge estado={estados[c.id] || "Nuevo"} />
                <ChevronRight size={16} className="text-muted-foreground/50 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
