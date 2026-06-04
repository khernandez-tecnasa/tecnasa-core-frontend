// src/pages/Dashboard/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Car, Users2, CheckCircle2, LayoutDashboard, AlertTriangle,
  Loader2, RefreshCw, CalendarCheck, Wallet, Package,
  Wrench, CalendarDays, TrendingUp, Fuel, Gauge,
  ArrowRight, Activity, Clock,
} from "lucide-react";

import {
  getDashboardKpisData,
  getActividad7DiasData,
  getEmpleadosMasSalidasReport,
  getVehiculosMasUtilizadosReport,
  getKilometrajePorEmpleadoReport,
  getConsumoCombustibleVehiculoReport,
  getReservasEstadoReport,
} from "../../services/ReportServices";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-HN", { weekday: "short", day: "numeric" });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ title, value, sub, icon: Icon, accent, onClick }) {
  const styles = {
    blue:    { wrap: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40",    icon: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",    val: "text-blue-700 dark:text-blue-300" },
    emerald: { wrap: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40", icon: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400", val: "text-emerald-700 dark:text-emerald-300" },
    amber:   { wrap: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40",    icon: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",    val: "text-amber-700 dark:text-amber-300" },
    sky:     { wrap: "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800/40",          icon: "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400",          val: "text-sky-700 dark:text-sky-300" },
    violet:  { wrap: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/40",  icon: "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400",  val: "text-violet-700 dark:text-violet-300" },
    orange:  { wrap: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/40",  icon: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400",  val: "text-orange-700 dark:text-orange-300" },
    slate:   { wrap: "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/50",    icon: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",          val: "text-slate-700 dark:text-slate-300" },
    rose:    { wrap: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/40",        icon: "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400",          val: "text-rose-700 dark:text-rose-300" },
  };
  const s = styles[accent] || styles.slate;
  return (
    <div
      onClick={onClick}
      className={`${s.wrap} border rounded-3xl p-4 md:p-5 space-y-3 transition-all duration-200 ${onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`p-2 rounded-xl shrink-0 ${s.icon}`}>
          <Icon size={16} />
        </div>
        {onClick && <ArrowRight size={13} className="text-muted-foreground/50 mt-1 shrink-0" />}
      </div>
      <div>
        <p className={`text-2xl md:text-3xl font-black tabular-nums leading-none ${s.val}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground font-medium mt-0.5">{sub}</p>}
      </div>
      <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">{title}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, linkLabel, onLink }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl shrink-0">
          <Icon size={13} className="text-muted-foreground" />
        </div>
        <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{title}</h2>
      </div>
      {linkLabel && (
        <button onClick={onLink} className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline">
          {linkLabel} <ArrowRight size={11} />
        </button>
      )}
    </div>
  );
}

function PropBar({ pct, color = "bg-primary" }) {
  return (
    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[48px]">
      <div className={`h-full rounded-full ${color} opacity-80 transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function RankBadge({ rank }) {
  if (rank === 1) return <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[9px] font-black shrink-0">1</span>;
  if (rank === 2) return <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-black shrink-0">2</span>;
  if (rank === 3) return <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 text-[9px] font-black shrink-0">3</span>;
  return <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground text-[9px] font-bold shrink-0">{rank}</span>;
}

const RESERVA_STYLE = {
  Reservado:  { dot: "bg-amber-500",   text: "text-amber-700 dark:text-amber-400",   label: "Pendiente" },
  "En Uso":   { dot: "bg-blue-500",    text: "text-blue-700 dark:text-blue-400",     label: "En Uso" },
  Finalizado: { dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400",label: "Finalizado" },
  Cancelado:  { dot: "bg-rose-500",    text: "text-rose-700 dark:text-rose-400",      label: "Cancelado" },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-pulse">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 bg-muted rounded-2xl" />
        <div className="space-y-2">
          <div className="h-6 w-36 bg-muted rounded-xl" />
          <div className="h-3 w-52 bg-muted rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-3xl" />)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-3xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-52 bg-muted rounded-3xl" />
        <div className="h-52 bg-muted rounded-3xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-muted rounded-3xl" />)}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [kpis,    setKpis]    = useState(null);
  const [act7,    setAct7]    = useState([]);
  const [reservasEstado, setReservasEstado] = useState([]);
  const [empTop,   setEmpTop]   = useState([]);
  const [vehTop,   setVehTop]   = useState([]);
  const [kmTop,    setKmTop]    = useState([]);
  const [fuelTop,  setFuelTop]  = useState([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [k, a, res, emp, veh, km, fuel] = await Promise.all([
        getDashboardKpisData(),
        getActividad7DiasData(),
        getReservasEstadoReport(),
        getEmpleadosMasSalidasReport(),
        getVehiculosMasUtilizadosReport(),
        getKilometrajePorEmpleadoReport(),
        getConsumoCombustibleVehiculoReport(),
      ]);
      setKpis(k);
      setAct7(Array.isArray(a) ? a : []);
      setReservasEstado(Array.isArray(res) ? res : []);
      setEmpTop(Array.isArray(emp) ? emp : []);
      setVehTop(Array.isArray(veh) ? veh : []);
      setKmTop(Array.isArray(km)  ? km  : []);
      setFuelTop(Array.isArray(fuel) ? fuel : []);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const maxAct7     = useMemo(() => Math.max(...act7.map((d) => Number(d.total ?? 0)), 1), [act7]);
  const maxEmp      = useMemo(() => Math.max(...empTop.map((e) => Number(e.total_salidas ?? 0)), 1), [empTop]);
  const maxVeh      = useMemo(() => Math.max(...vehTop.map((v) => Number(v.total_usos ?? 0)), 1), [vehTop]);
  const maxKm       = useMemo(() => Math.max(...kmTop.map((r) => Number(r.kilometraje_total_recorrido ?? 0)), 1), [kmTop]);
  const totalReservas = useMemo(() => reservasEstado.reduce((s, r) => s + Number(r.total ?? 0), 0), [reservasEstado]);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 rounded-2xl">
          <AlertTriangle size={15} className="text-rose-500 shrink-0 mt-0.5" />
          <p className="flex-1 text-sm font-semibold text-rose-700 dark:text-rose-400">{error}</p>
          <button onClick={load} className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-200 transition-colors">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const K = kpis || {};

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-in fade-in duration-500">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 shadow-sm shrink-0">
            <LayoutDashboard size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">{t("dashboard.title", "Dashboard")}</h1>
            <p className="text-muted-foreground text-xs font-medium mt-0.5">{t("dashboard.subtitle", "Resumen general del sistema")}</p>
          </div>
        </div>
        <button onClick={load} className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors text-muted-foreground hover:text-foreground shrink-0" title="Actualizar">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ── KPI Fila A — Flota ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">Flota</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <KpiCard
            title="Vehículos en uso"
            value={`${K.vehiculos_en_uso ?? 0} / ${K.vehiculos_total ?? 0}`}
            sub={`${K.vehiculos_total ?? 0} en flota total`}
            icon={Car} accent="blue"
          />
          <KpiCard
            title="En mantenimiento"
            value={K.vehiculos_mantenimiento ?? 0}
            sub="requieren atención"
            icon={Wrench} accent="amber"
          />
          <KpiCard
            title="Registros hoy"
            value={K.registros_hoy ?? 0}
            sub="movimientos del día"
            icon={CheckCircle2} accent="emerald"
          />
          <KpiCard
            title="Registros semana"
            value={K.registros_semana ?? 0}
            sub="esta semana"
            icon={CalendarDays} accent="sky"
          />
        </div>
      </div>

      {/* ── KPI Fila B — Operaciones ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">Operaciones</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <KpiCard
            title="Empleados activos"
            value={K.empleados_total ?? 0}
            sub="registrados en el sistema"
            icon={Users2} accent="slate"
          />
          <KpiCard
            title="Reservas activas"
            value={K.reservas_activas ?? 0}
            sub={`${K.reservas_hoy ?? 0} iniciadas hoy`}
            icon={CalendarCheck} accent="violet"
            onClick={() => navigate("/admin/reports?view=reservas-estado")}
          />
          <KpiCard
            title="Viáticos pendientes"
            value={K.viaticos_pendientes ?? 0}
            sub="esperando aprobación"
            icon={Wallet} accent="orange"
            onClick={() => navigate("/admin/reports?view=viaticos-estado")}
          />
          <KpiCard
            title="Activos en inventario"
            value={`${K.activos_activos ?? 0} / ${K.activos_total ?? 0}`}
            sub="en estado activo"
            icon={Package} accent="slate"
            onClick={() => navigate("/admin/reports?view=activos-estado")}
          />
        </div>
      </div>

      {/* ── Gráficas principales ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Actividad últimos 7 días */}
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl p-5 md:p-6 shadow-sm">
          <SectionTitle
            icon={Activity}
            title="Actividad últimos 7 días"
            linkLabel="Ver reporte"
            onLink={() => navigate("/admin/reports?view=registros-uso")}
          />
          {act7.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Activity size={28} className="text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground">Sin movimientos recientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Barras */}
              <div className="flex items-end gap-2 h-32">
                {act7.map((d) => {
                  const pct = maxAct7 > 0 ? (Number(d.total) / maxAct7) * 100 : 0;
                  const isToday = d.fecha === new Date().toISOString().slice(0, 10);
                  return (
                    <div key={d.fecha} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-[10px] font-black text-muted-foreground tabular-nums">{d.total > 0 ? d.total : ""}</span>
                      <div className="w-full rounded-t-xl overflow-hidden bg-muted/30" style={{ height: "80px" }}>
                        <div
                          className={`w-full rounded-t-xl transition-all duration-700 ${isToday ? "bg-primary" : "bg-primary/40 dark:bg-primary/30"}`}
                          style={{ height: `${pct}%`, minHeight: pct > 0 ? "6px" : "0" }}
                        />
                      </div>
                      <span className={`text-[9px] font-bold truncate w-full text-center ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                        {fmtDate(d.fecha)}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Resumen debajo */}
              <div className="flex items-center gap-4 pt-1 border-t border-border/40">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /><span className="text-[10px] text-muted-foreground">Hoy</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary/40" /><span className="text-[10px] text-muted-foreground">Días anteriores</span></div>
                <span className="ml-auto text-[10px] text-muted-foreground font-medium">
                  Total 7d: <span className="font-black text-foreground">{act7.reduce((s, d) => s + Number(d.total ?? 0), 0)}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Reservas por estado */}
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl p-5 md:p-6 shadow-sm">
          <SectionTitle
            icon={CalendarCheck}
            title="Reservas por estado"
            linkLabel="Ver reporte"
            onLink={() => navigate("/admin/reports?view=reservas-estado")}
          />
          {reservasEstado.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <CalendarCheck size={28} className="text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground">Sin reservas registradas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mini cards 2×2 */}
              <div className="grid grid-cols-2 gap-3">
                {reservasEstado.slice(0, 4).map((r) => {
                  const s = RESERVA_STYLE[r.estado] || { dot: "bg-muted-foreground", text: "text-muted-foreground", label: r.estado };
                  const pct = totalReservas > 0 ? Math.round((Number(r.total) / totalReservas) * 100) : 0;
                  return (
                    <div key={r.estado} className="bg-muted/30 dark:bg-slate-800/40 rounded-2xl p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                        <span className={`text-[10px] font-black uppercase tracking-wide ${s.text}`}>{s.label || r.estado}</span>
                      </div>
                      <p className={`text-xl font-black tabular-nums ${s.text}`}>{r.total}</p>
                      <div className="h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${s.dot} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Barra apilada */}
              {totalReservas > 0 && (
                <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
                  {reservasEstado.map((r) => {
                    const s = RESERVA_STYLE[r.estado] || { dot: "bg-muted-foreground" };
                    const pct = Math.round((Number(r.total) / totalReservas) * 100);
                    return pct > 0 ? (
                      <div key={r.estado} className={`${s.dot} first:rounded-l-full last:rounded-r-full transition-all duration-700`} style={{ width: `${pct}%` }} title={`${r.estado}: ${r.total}`} />
                    ) : null;
                  })}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">
                Total: <span className="font-black text-foreground">{totalReservas}</span> reservas
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Top rankings ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Top empleados */}
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5">
            <SectionTitle
              icon={TrendingUp}
              title={t("dashboard.charts.top_employees", "Top empleados")}
              linkLabel="Ver reporte"
              onLink={() => navigate("/admin/reports?view=empleados-actividad")}
            />
          </div>
          {empTop.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 gap-2 pb-5">
              <Users2 size={28} className="text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground">{t("dashboard.empty_data", "Sin datos")}</p>
            </div>
          ) : (
            <div className="pb-3">
              {empTop.slice(0, 5).map((r, i) => (
                <div key={r.nombre_empleado} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                  <RankBadge rank={i + 1} />
                  <span className="text-sm font-semibold flex-1 min-w-0 truncate">{r.nombre_empleado.split(" ").slice(0, 2).join(" ")}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <PropBar pct={maxEmp > 0 ? (Number(r.total_salidas) / maxEmp) * 100 : 0} color="bg-blue-500" />
                    <span className="text-xs font-black tabular-nums w-6 text-right text-blue-600 dark:text-blue-400">{r.total_salidas}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top vehículos */}
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5">
            <SectionTitle
              icon={Car}
              title={t("dashboard.charts.top_vehicles", "Top vehículos")}
              linkLabel="Ver reporte"
              onLink={() => navigate("/admin/reports?view=vehiculos-uso")}
            />
          </div>
          {vehTop.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 gap-2 pb-5">
              <Car size={28} className="text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground">{t("dashboard.empty_data", "Sin datos")}</p>
            </div>
          ) : (
            <div className="pb-3">
              {vehTop.slice(0, 5).map((r, i) => (
                <div key={r.placa} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                  <RankBadge rank={i + 1} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{r.marca} {r.modelo}</p>
                    <p className="text-[10px] text-muted-foreground">{r.placa}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PropBar pct={maxVeh > 0 ? (Number(r.total_usos) / maxVeh) * 100 : 0} color="bg-emerald-500" />
                    <span className="text-xs font-black tabular-nums w-6 text-right text-emerald-600 dark:text-emerald-400">{r.total_usos}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tablas detalle ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Kilometraje */}
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-0">
            <SectionTitle
              icon={Gauge}
              title={t("dashboard.tables.km_title", "Kilometraje por empleado")}
              linkLabel="Ver reporte"
              onLink={() => navigate("/admin/reports?view=kilometraje-empleado")}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{t("dashboard.tables.employee", "Empleado")}</th>
                  <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{t("dashboard.tables.km_total", "Km Total")}</th>
                </tr>
              </thead>
              <tbody>
                {kmTop.length === 0 ? (
                  <tr><td colSpan={2} className="py-10 text-center text-sm text-muted-foreground">{t("dashboard.empty_data")}</td></tr>
                ) : kmTop.slice(0, 5).map((r, i) => {
                  const km = Number(r.kilometraje_total_recorrido ?? 0);
                  return (
                    <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <RankBadge rank={i + 1} />
                          <div>
                            <p className="text-sm font-medium leading-tight">{r.nombre_empleado.split(" ").slice(0, 2).join(" ")}</p>
                            {r.puesto && <p className="text-[10px] text-muted-foreground">{r.puesto}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <PropBar pct={maxKm > 0 ? (km / maxKm) * 100 : 0} color="bg-sky-500" />
                          <span className="text-xs font-black text-sky-600 dark:text-sky-400 tabular-nums w-16 text-right">{km.toFixed(1)} km</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Consumo combustible */}
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-0">
            <SectionTitle
              icon={Fuel}
              title={t("dashboard.tables.fuel_title", "Consumo combustible")}
              linkLabel="Ver reporte"
              onLink={() => navigate("/admin/reports?view=consumo-combustible-vehiculo")}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{t("dashboard.tables.vehicle", "Vehículo")}</th>
                  <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{t("dashboard.tables.consumption", "Consumo prom.")}</th>
                </tr>
              </thead>
              <tbody>
                {fuelTop.length === 0 ? (
                  <tr><td colSpan={2} className="py-10 text-center text-sm text-muted-foreground">{t("dashboard.empty_data")}</td></tr>
                ) : fuelTop.slice(0, 5).map((r, i) => {
                  const val = parseFloat(r.promedio_consumo_porcentaje ?? 0);
                  const barColor = val > 80 ? "bg-rose-500" : val > 50 ? "bg-amber-500" : "bg-emerald-500";
                  const textColor = val > 80 ? "text-rose-600 dark:text-rose-400" : val > 50 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";
                  return (
                    <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium leading-tight">{r.marca} {r.modelo}</p>
                        <p className="text-[10px] text-muted-foreground">{r.placa}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(val, 100)}%` }} />
                          </div>
                          <span className={`text-xs font-black tabular-nums w-10 text-right ${textColor}`}>{val.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Footer link ──────────────────────────────────────────────────────── */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => navigate("/admin/reports")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-border/60 bg-card dark:bg-slate-900/40 text-sm font-bold text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
        >
          <Clock size={14} />
          Ver todos los reportes
          <ArrowRight size={13} />
        </button>
      </div>

    </div>
  );
}
