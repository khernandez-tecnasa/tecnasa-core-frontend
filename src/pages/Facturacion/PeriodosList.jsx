// src/pages/Facturacion/PeriodosList.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarRange, Plus, Loader2, AlertTriangle, ChevronRight, Coins, Search } from "lucide-react";

import { getPeriodos, createPeriodo } from "@/services/facturacion.service";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function PeriodosList() {
  const navigate = useNavigate();
  const { userData, hasPermiso } = useAuth();

  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const can = useCallback((p) => isAdmin || hasPermiso(p), [isAdmin, hasPermiso]);
  const canCreate = can("crear_contratos") || can("gestion_ingenieria");

  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openNuevo, setOpenNuevo] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [anioFiltro, setAnioFiltro] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPeriodos();
      setPeriodos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const anios = useMemo(
    () => [...new Set(periodos.map((p) => p.anio))].sort((a, b) => b - a),
    [periodos],
  );

  const periodosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return periodos.filter((p) => {
      if (anioFiltro && String(p.anio) !== anioFiltro) return false;
      if (!q) return true;
      const texto = `${p.nombre || ""} ${MESES[p.mes - 1]} ${p.anio}`.toLowerCase();
      return texto.includes(q);
    });
  }, [periodos, busqueda, anioFiltro]);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shrink-0">
            <CalendarRange size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Períodos de Facturación
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Calendario mensual del proceso de contadores
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/facturacion/monedas")}
            className="rounded-2xl px-4 h-10 font-bold gap-2">
            <Coins size={16} /> <span className="hidden sm:inline">Monedas</span>
          </Button>
          {canCreate && (
            <Button onClick={() => setOpenNuevo(true)} className="rounded-2xl px-5 h-10 font-bold gap-2">
              <Plus size={17} /> <span className="hidden sm:inline">Nuevo período</span>
            </Button>
          )}
        </div>
      </div>

      {!loading && !error && periodos.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar período (ej. Marzo 2024)..."
              className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <select
            value={anioFiltro}
            onChange={(e) => setAnioFiltro(e.target.value)}
            className="rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm outline-none focus:border-primary/60 sm:w-40">
            <option value="">Todos los años</option>
            {anios.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <Loader2 className="animate-spin text-primary" size={22} />
            <p className="text-sm text-muted-foreground font-medium">Cargando períodos...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <AlertTriangle size={28} className="text-rose-500/50" />
            <p className="text-sm font-bold">{error}</p>
            <Button onClick={load} variant="outline" size="sm" className="rounded-xl">Reintentar</Button>
          </div>
        ) : periodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <CalendarRange size={28} className="text-muted-foreground/40" />
            <p className="font-bold text-sm">Sin períodos creados</p>
            <p className="text-xs text-muted-foreground">Crea el primer período usando el botón de arriba</p>
          </div>
        ) : periodosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Search size={24} className="text-muted-foreground/40" />
            <p className="font-bold text-sm">Sin resultados</p>
            <p className="text-xs text-muted-foreground">Intenta con otro mes/año o quita el filtro</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {periodosFiltrados.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/admin/facturacion/periodos/${p.id}`)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 dark:hover:bg-slate-800/30 transition-colors text-left">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-muted/60 dark:bg-slate-800 flex items-center justify-center">
                  <CalendarRange size={16} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{p.nombre || `${MESES[p.mes - 1]} ${p.anio}`}</p>
                  <p className="text-[11px] text-muted-foreground">{MESES[p.mes - 1]} de {p.anio}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground/50 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {openNuevo && (
        <NuevoPeriodoModal
          onClose={() => setOpenNuevo(false)}
          onCreated={() => {
            setOpenNuevo(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function NuevoPeriodoModal({ onClose, onCreated }) {
  const { showToast } = useToast();
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const nombre = `${MESES[mes - 1]} ${anio}`;
      await createPeriodo({ nombre, mes: Number(mes), anio: Number(anio) });
      showToast("Período creado", "success");
      onCreated();
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
      onClick={() => !saving && onClose()}>
      <div
        className="w-full max-w-sm bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 dark:bg-primary/15 rounded-2xl ring-1 ring-primary/20 shrink-0">
              <CalendarRange size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Nuevo Período</h2>
              <p className="text-sm text-muted-foreground mt-1">Crea el calendario para un mes específico.</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-border/50" />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Mes</label>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2.5 text-sm outline-none focus:border-primary/60">
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Año</label>
            <input
              type="number"
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
            />
          </div>
        </div>

        <div className="h-px bg-border/50" />

        <div className="flex gap-2.5">
          <Button onClick={submit} disabled={saving} className="flex-1 rounded-2xl h-10 font-bold gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {saving ? "Creando..." : "Crear"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1 rounded-2xl h-10 font-bold">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
