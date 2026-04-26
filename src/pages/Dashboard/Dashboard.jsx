import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  Car,
  Users2,
  Gauge,
  Fuel,
  RefreshCw,
  Clock,
  CheckCircle2,
  LayoutDashboard,
  AlertTriangle,
  Loader2,
  TrendingUp,
} from "lucide-react";

// Servicios
import { fetchDashboardData } from "../../services/DashboardServices";
import {
  getEmpleadosMasSalidasReport,
  getKilometrajePorEmpleadoReport,
  getVehiculosMasUtilizadosReport,
  getConsumoCombustibleVehiculoReport,
  getTotalEmpleados,
  getTotalVehiculos,
  getVehiculosEnUso,
} from "../../services/ReportServices";

/* ── KPI Card ─────────────────────────────────────────────────────────────── */

const ACCENT = {
  blue:    { icon: "bg-blue-50 dark:bg-blue-900/20 ring-blue-100 dark:ring-blue-800",    text: "text-blue-600 dark:text-blue-400" },
  emerald: { icon: "bg-emerald-50 dark:bg-emerald-900/20 ring-emerald-100 dark:ring-emerald-800", text: "text-emerald-600 dark:text-emerald-400" },
  slate:   { icon: "bg-slate-100 dark:bg-slate-800 ring-slate-200 dark:ring-slate-700",  text: "text-slate-600 dark:text-slate-400" },
  amber:   { icon: "bg-amber-50 dark:bg-amber-900/20 ring-amber-100 dark:ring-amber-800", text: "text-amber-600 dark:text-amber-400" },
};

function KpiCard({ title, value, icon: Icon, accent = "slate", trend }) {
  const a = ACCENT[accent];
  return (
    <div className="bg-card dark:bg-slate-900/40 rounded-3xl border border-border/60 shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        <div className={`p-2.5 rounded-2xl ring-1 shrink-0 ${a.icon}`}>
          <Icon size={17} className={a.text} />
        </div>
      </div>
      <p className="text-3xl font-black tracking-tight text-foreground leading-none">
        {value}
      </p>
      {trend && (
        <p className="text-xs text-muted-foreground font-medium">{trend}</p>
      )}
    </div>
  );
}

/* ── Section Header ───────────────────────────────────────────────────────── */

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl shrink-0">
        <Icon size={14} className="text-muted-foreground" />
      </div>
      <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
    </div>
  );
}

/* ── Empty row ────────────────────────────────────────────────────────────── */

function EmptyRow({ colSpan, label }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10 text-center">
        <p className="text-sm text-muted-foreground">{label}</p>
      </td>
    </tr>
  );
}

/* ── Loading Skeleton ─────────────────────────────────────────────────────── */

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-muted rounded-2xl" />
          <div className="space-y-2">
            <div className="h-7 w-40 bg-muted rounded-xl" />
            <div className="h-4 w-56 bg-muted rounded-lg" />
          </div>
        </div>
        <div className="w-9 h-9 bg-muted rounded-xl" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-3xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-72 bg-muted rounded-3xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

/* ── Dashboard ────────────────────────────────────────────────────────────── */

export default function Dashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    totalEmpleados: 0,
    totalVehiculos: 0,
    vehiculosEnUso: 0,
    registrosHoy: 0,
    registrosPendientes: 0,
    empleadosTop: [],
    vehiculosTop: [],
    kilometrajeTop: [],
    consumoTop: [],
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        empleadosTotal,
        vehiculosTotal,
        enUso,
        hoy,
        empTop,
        vehTop,
        kmTop,
        fuelTop,
      ] = await Promise.all([
        getTotalEmpleados(),
        getTotalVehiculos(),
        getVehiculosEnUso(),
        fetchDashboardData("registros_hoy"),
        getEmpleadosMasSalidasReport(),
        getVehiculosMasUtilizadosReport(),
        getKilometrajePorEmpleadoReport(),
        getConsumoCombustibleVehiculoReport(),
      ]);

      setData({
        totalEmpleados: empleadosTotal?.total || 0,
        totalVehiculos: vehiculosTotal?.total || 0,
        vehiculosEnUso: enUso?.total || 0,
        registrosHoy: hoy[0]?.total_hoy || 0,
        empleadosTop: empTop || [],
        vehiculosTop: vehTop || [],
        kilometrajeTop: kmTop || [],
        consumoTop: fuelTop || [],
      });
    } catch (e) {
      console.error(e);
      setError(t("dashboard.errors.load_failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const chartEmpleados = useMemo(
    () => ({
      labels: data.empleadosTop
        .slice(0, 5)
        .map((e) => e.nombre_empleado.split(" ")[0]),
      data: data.empleadosTop.slice(0, 5).map((e) => e.total_salidas),
    }),
    [data.empleadosTop],
  );

  const chartVehiculos = useMemo(
    () => ({
      labels: data.vehiculosTop.slice(0, 5).map((v) => v.placa),
      data: data.vehiculosTop.slice(0, 5).map((v) => v.total_usos),
    }),
    [data.vehiculosTop],
  );

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 rounded-2xl">
          <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <p className="flex-1 text-sm font-semibold text-red-700 dark:text-red-400">
            {error}
          </p>
          <button
            onClick={loadData}
            className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <LayoutDashboard size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              {t("dashboard.title")}
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              {t("dashboard.subtitle")}
            </p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="mt-0.5 p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors text-muted-foreground hover:text-foreground shrink-0"
          title="Actualizar datos"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title={t("dashboard.kpi.active_vehicles")}
          value={`${data.vehiculosEnUso} / ${data.totalVehiculos}`}
          icon={Car}
          accent="blue"
          trend={t("dashboard.kpi.currently_in_use")}
        />
        <KpiCard
          title={t("dashboard.kpi.today_activity")}
          value={data.registrosHoy}
          icon={CheckCircle2}
          accent="emerald"
          trend={t("dashboard.kpi.movements_today")}
        />
        <KpiCard
          title={t("dashboard.kpi.total_employees")}
          value={data.totalEmpleados}
          icon={Users2}
          accent="slate"
          trend={t("dashboard.kpi.registered")}
        />
        <KpiCard
          title={t("dashboard.kpi.pending_maintenance")}
          value="0"
          icon={Clock}
          accent="amber"
          trend={t("dashboard.kpi.requires_attention")}
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top empleados */}
        <div className="bg-card dark:bg-slate-900/40 rounded-3xl border border-border/60 shadow-sm p-5 md:p-6">
          <SectionHeader icon={TrendingUp} title={t("dashboard.charts.top_employees")} />
          {chartEmpleados.data.length > 0 ? (
            <div className="w-full h-64">
              <BarChart
                series={[{
                  data: chartEmpleados.data,
                  color: "hsl(var(--primary))",
                  label: t("dashboard.charts.exits"),
                }]}
                xAxis={[{ scaleType: "band", data: chartEmpleados.labels }]}
                margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                borderRadius={6}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
              <TrendingUp size={28} className="opacity-20" />
              <p className="text-sm">{t("dashboard.empty_data")}</p>
            </div>
          )}
        </div>

        {/* Top vehículos */}
        <div className="bg-card dark:bg-slate-900/40 rounded-3xl border border-border/60 shadow-sm p-5 md:p-6">
          <SectionHeader icon={Car} title={t("dashboard.charts.top_vehicles")} />
          {chartVehiculos.data.length > 0 ? (
            <div className="w-full h-64">
              <BarChart
                series={[{
                  data: chartVehiculos.data,
                  color: "#10b981",
                  label: t("dashboard.charts.uses"),
                }]}
                xAxis={[{ scaleType: "band", data: chartVehiculos.labels }]}
                margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                borderRadius={6}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
              <Car size={28} className="opacity-20" />
              <p className="text-sm">{t("dashboard.empty_data")}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Tables ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Tabla Kilometraje */}
        <div className="bg-card dark:bg-slate-900/40 rounded-3xl border border-border/60 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <SectionHeader icon={Gauge} title={t("dashboard.tables.km_title")} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30 dark:bg-slate-800/30">
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {t("dashboard.tables.employee")}
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {t("dashboard.tables.km_total")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.kilometrajeTop.length === 0 ? (
                  <EmptyRow colSpan={2} label={t("dashboard.empty_data")} />
                ) : (
                  data.kilometrajeTop.slice(0, 5).map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-black text-primary">{i + 1}</span>
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {row.nombre_empleado}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted/60 dark:bg-slate-800 text-foreground border border-border/50">
                          {Number(row.kilometraje_total_recorrido).toFixed(1)} km
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla Combustible */}
        <div className="bg-card dark:bg-slate-900/40 rounded-3xl border border-border/60 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <SectionHeader icon={Fuel} title={t("dashboard.tables.fuel_title")} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30 dark:bg-slate-800/30">
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {t("dashboard.tables.vehicle")}
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground w-36">
                    {t("dashboard.tables.consumption")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.consumoTop.length === 0 ? (
                  <EmptyRow colSpan={2} label={t("dashboard.empty_data")} />
                ) : (
                  data.consumoTop.slice(0, 5).map((row, i) => {
                    const val = parseFloat(row.promedio_consumo_porcentaje);
                    const barColor =
                      val > 80
                        ? "bg-red-500"
                        : val > 50
                          ? "bg-amber-500"
                          : "bg-emerald-500";
                    return (
                      <tr
                        key={i}
                        className="border-b border-border/30 last:border-0 hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-foreground">
                            {row.marca} {row.modelo}
                          </p>
                          <p className="text-xs text-muted-foreground">{row.placa}</p>
                        </td>
                        <td className="px-5 py-3.5 w-36">
                          <div className="space-y-1.5">
                            <span className="text-xs text-muted-foreground block text-right">
                              {val.toFixed(1)}%
                            </span>
                            <div className="h-1.5 bg-muted dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${barColor}`}
                                style={{ width: `${Math.min(val, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
