// src/pages/Dashboard/Home.jsx
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronRight,
  Megaphone,
  Moon,
  Package,
  Pin,
  Search,
  Sun,
  Truck,
  Car,
  Users2,
  CalendarCheck,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Wrench,
  FileText,
  LayoutDashboard,
  ArrowRight,
  MapPin,
  Server,
  Zap,
  CheckCircle,
  Clock,
  TrendingUp,
  Building2,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useCommandPalette } from "@/context/CommandPaletteContext";
import { getPinnedChangelogs, getOverallStatus } from "@/services/help.api";
import {
  getDashboardKpisData,
  getActividad7DiasData,
} from "@/services/ReportServices";
import { getReservas } from "@/services/reservas.service";
import { getViaticos } from "@/services/viaticos.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso, locale = "es-HN") => {
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString(locale, { weekday: "short", day: "numeric" });
  } catch {
    return iso?.slice(5) ?? "";
  }
};

// ─── LiveClock (unchanged) ─────────────────────────────────────────────────────

function LiveClock({ timeFormat, locale, timezone, dateFormat }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = useMemo(() => {
    try {
      let d = now;
      if (timezone)
        d = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
      let h = d.getHours();
      const mm = d.getMinutes().toString().padStart(2, "0");
      const ss = d.getSeconds().toString().padStart(2, "0");
      if (timeFormat === "24h")
        return `${h.toString().padStart(2, "0")}:${mm}:${ss}`;
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h.toString().padStart(2, "0")}:${mm}:${ss} ${ampm}`;
    } catch {
      return "--:--:--";
    }
  }, [now, timeFormat, timezone]);

  const date = useMemo(() => {
    try {
      const tz = timezone || undefined;
      const fmt = (opts) =>
        new Intl.DateTimeFormat(locale, { timeZone: tz, ...opts }).format(now);

      const weekday = fmt({ weekday: "long" });
      const year    = fmt({ year: "numeric" });
      const month   = fmt({ month: "long" });
      const day     = fmt({ day: "numeric" });

      if (dateFormat?.startsWith("YYYY"))
        return `${weekday}, ${year} ${month} ${day}`;
      if (dateFormat?.startsWith("MM"))
        return `${weekday}, ${month} ${day}, ${year}`;
      // DD/MM/YYYY — orden natural del locale
      return fmt({ weekday: "long", year: "numeric", month: "long", day: "numeric" });
    } catch {
      return "";
    }
  }, [now, locale, timezone, dateFormat]);

  return (
    <div className="space-y-1">
      <p
        className="text-4xl md:text-6xl font-extrabold tabular-nums tracking-tight leading-none"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--primary)/0.75), hsl(var(--primary)))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
        {time}
      </p>
      <p className="text-sm text-muted-foreground capitalize font-medium">
        {date}
      </p>
    </div>
  );
}

// ─── MiniKpi chip ──────────────────────────────────────────────────────────────

function MiniKpi({ icon: Icon, label, value, accent, onClick }) {
  const styles = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400",
    emerald:
      "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400",
    amber:
      "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400",
    violet:
      "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/40 text-violet-600 dark:text-violet-400",
  };
  const s = styles[accent] || styles.blue;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border ${s} ${onClick ? "hover:shadow-sm hover:-translate-y-px transition-all duration-150 cursor-pointer" : "cursor-default"} text-left`}>
      <Icon size={14} className="shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wider opacity-70 leading-none truncate">
          {label}
        </p>
        <p className="text-base font-black tabular-nums leading-tight mt-0.5">
          {value ?? "—"}
        </p>
      </div>
    </button>
  );
}

// ─── AlertItem ─────────────────────────────────────────────────────────────────

function AlertItem({ icon: Icon, text, accent, to, navigate }) {
  const colors = {
    amber: {
      dot: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-400",
      bg: "hover:bg-amber-50 dark:hover:bg-amber-900/10",
    },
    blue: {
      dot: "bg-blue-500",
      text: "text-blue-700 dark:text-blue-400",
      bg: "hover:bg-blue-50 dark:hover:bg-blue-900/10",
    },
    violet: {
      dot: "bg-violet-500",
      text: "text-violet-700 dark:text-violet-400",
      bg: "hover:bg-violet-50 dark:hover:bg-violet-900/10",
    },
    rose: {
      dot: "bg-rose-500",
      text: "text-rose-700 dark:text-rose-400",
      bg: "hover:bg-rose-50 dark:hover:bg-rose-900/10",
    },
  };
  const c = colors[accent] || colors.amber;
  return (
    <button
      onClick={() => to && navigate(to)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${c.bg} ${to ? "cursor-pointer" : "cursor-default"}`}>
      <div className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
      <span className={`flex-1 text-sm font-semibold text-left ${c.text}`}>
        {text}
      </span>
      {to && (
        <ChevronRight size={13} className="text-muted-foreground/50 shrink-0" />
      )}
    </button>
  );
}

// ─── QuickBtn (mejorado) ───────────────────────────────────────────────────────

function QuickBtn({ icon: Icon, label, sub, iconColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl bg-muted/40 dark:bg-slate-800/60 hover:bg-primary/5 dark:hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all duration-150 group text-left">
      <div
        className={`w-8 h-8 rounded-xl bg-card dark:bg-slate-900 border border-border/50 flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow`}>
        <Icon size={15} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground leading-tight truncate">
          {label}
        </p>
        {sub && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            {sub}
          </p>
        )}
      </div>
      <ChevronRight
        size={13}
        className="text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0"
      />
    </button>
  );
}

// ─── SystemStatus ──────────────────────────────────────────────────────────────

function SystemStatus({ status }) {
  const { t } = useTranslation();
  if (!status) return null;
  const s = (status.status || status.overall || "operational").toLowerCase();
  const isOp = s === "operational";
  const isDeg = s === "degraded" || s === "partial";
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      <div
        className={`w-1.5 h-1.5 rounded-full ${isOp ? "bg-emerald-500" : isDeg ? "bg-amber-500" : "bg-rose-500"} ${isOp ? "animate-pulse" : ""}`}
      />
      <span className="text-[11px] font-medium text-muted-foreground">
        {isOp
          ? t("home.system.operational")
          : isDeg
            ? t("home.system.degraded")
            : t("home.system.maintenance")}
      </span>
      <Server size={11} className="text-muted-foreground/50" />
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const { t, i18n } = useTranslation();
  const { userData, isAdmin, can } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const { setOpen: openSearch } = useCommandPalette();
  const navigate = useNavigate();

  const firstName = userData?.nombre?.split(" ")[0] || "Usuario";
  const weatherKey = import.meta.env.VITE_OWM_KEY;
  const configTimeFormat = settings?.timeFormat || "12h";
  const configLanguage = settings?.language || i18n.language || "es-HN";
  const configTimezone = settings?.timezone;
  const configDateFormat = settings?.dateFormat || "DD/MM/YYYY";

  // ── State ──
  const [weather, setWeather] = useState(null);
  const [pinned, setPinned] = useState([]);
  const [pinnedLoading, setPinnedLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [act7, setAct7] = useState([]);
  const [myReservas, setMyReservas] = useState([]);
  const [myViaticos, setMyViaticos] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // ── Greeting ──
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12)
      return {
        text: t("home.greeting.morning", "Buenos días"),
        Icon: Sun,
        color: "text-yellow-500",
      };
    if (h < 18)
      return {
        text: t("home.greeting.afternoon", "Buenas tardes"),
        Icon: Sun,
        color: "text-orange-500",
      };
    return {
      text: t("home.greeting.evening", "Buenas noches"),
      Icon: Moon,
      color: "text-indigo-400",
    };
  }, [t]);

  // ── Data loading ──
  useEffect(() => {
    // Weather (independent)
    if (weatherKey && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          const lang = configLanguage.split("-")[0];
          fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=${lang}&appid=${weatherKey}`,
          )
            .then((r) => r.json())
            .then((d) => {
              if (d.main)
                setWeather({
                  temp: Math.round(d.main.temp),
                  desc: d.weather[0].description,
                  icon: d.weather[0].icon,
                  city: d.name,
                });
            })
            .catch(() => {});
        },
        () => {},
      );
    }

    // Pinned changelogs (independent)
    getPinnedChangelogs(3)
      .then((d) => setPinned(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setPinnedLoading(false));

    // Main data batch
    (async () => {
      setDataLoading(true);
      try {
        const [kpisData, act7Data, statusData] = await Promise.all([
          getDashboardKpisData().catch(() => null),
          getActividad7DiasData().catch(() => []),
          getOverallStatus().catch(() => null),
        ]);
        setKpis(kpisData);
        setAct7(Array.isArray(act7Data) ? act7Data : []);
        setSystemStatus(statusData);

        // Personal data for non-admin employees
        if (!isAdmin) {
          const [resData, viatData] = await Promise.all([
            getReservas().catch(() => null),
            getViaticos("activos").catch(() => null),
          ]);
          setMyReservas(Array.isArray(resData) ? resData : []);
          setMyViaticos(Array.isArray(viatData) ? viatData : []);
        }
      } catch (e) {
        console.error("Home data load error:", e);
      } finally {
        setDataLoading(false);
      }
    })();
  }, [isAdmin, weatherKey, configLanguage]);

  // ── Derived ──
  const maxAct7 = useMemo(
    () => Math.max(...act7.map((d) => Number(d.total ?? 0)), 1),
    [act7],
  );

  const attentionItems = useMemo(() => {
    if (dataLoading) return [];
    const items = [];
    if (isAdmin) {
      if ((kpis?.viaticos_pendientes ?? 0) > 0)
        items.push({
          icon: Wallet,
          accent: "amber",
          text: t("home.attention.viaticos_pending", { count: kpis.viaticos_pendientes }),
          to: "/admin/viaticos",
        });
      if ((kpis?.vehiculos_mantenimiento ?? 0) > 0)
        items.push({
          icon: Wrench,
          accent: "rose",
          text: t("home.attention.vehicles_maintenance", { count: kpis.vehiculos_mantenimiento }),
          to: "/admin/vehiculos",
        });
      if ((kpis?.reservas_activas ?? 0) > 0)
        items.push({
          icon: CalendarCheck,
          accent: "blue",
          text: t("home.attention.active_reservations", { count: kpis.reservas_activas }),
          to: "/admin/reservas-vehiculos",
        });
    } else {
      const upcoming = myReservas.filter(
        (r) => r.estado === "Reservado",
      ).length;
      const active = myViaticos.filter((v) =>
        ["Borrador", "Pendiente"].includes(v.estado),
      ).length;
      if (upcoming > 0)
        items.push({
          icon: CalendarCheck,
          accent: "violet",
          text: t("home.attention.upcoming_reservations", { count: upcoming }),
          to: "/admin/reservas-vehiculos",
        });
      if (active > 0)
        items.push({
          icon: Wallet,
          accent: "amber",
          text: t("home.attention.active_viaticos", { count: active }),
          to: "/admin/viaticos",
        });
    }
    return items;
  }, [isAdmin, kpis, myReservas, myViaticos, dataLoading, t]);

  const quickItems = useMemo(() => {
    const all = [
      {
        icon: LayoutDashboard,
        label: t("home.quick.dashboard_label"),
        sub: t("home.quick.dashboard_sub"),
        iconColor: "text-primary",
        to: "/admin/dashboard",
        perm: "gestionar_home",
      },
      {
        icon: FileText,
        label: t("home.quick.reports_label"),
        sub: t("home.quick.reports_sub"),
        iconColor: "text-blue-500",
        to: "/admin/reports",
        perm: "ver_reportes",
      },
      {
        icon: CalendarCheck,
        label: t("home.quick.reservations_label"),
        sub: kpis?.reservas_activas
          ? t("home.quick.reservations_active", { count: kpis.reservas_activas })
          : t("home.quick.reservations_manage"),
        iconColor: "text-violet-500",
        to: "/admin/reservas-vehiculos",
        perm: null,
      },
      {
        icon: Wallet,
        label: t("home.quick.viaticos_label"),
        sub: kpis?.viaticos_pendientes
          ? t("home.quick.viaticos_pending", { count: kpis.viaticos_pendientes })
          : t("home.quick.viaticos_manage"),
        iconColor: "text-orange-500",
        to: "/admin/viaticos",
        perm: null,
      },
      {
        icon: Package,
        label: t("home.quick.inventory_label"),
        sub: kpis?.activos_total
          ? t("home.quick.inventory_assets", { count: kpis.activos_total })
          : t("home.quick.inventory_manage"),
        iconColor: "text-slate-500",
        to: "/admin/inventario/activos",
        perm: "ver_activos",
      },
      {
        icon: Car,
        label: t("home.quick.fleet_label"),
        sub: kpis?.vehiculos_total
          ? t("home.quick.fleet_vehicles", { count: kpis.vehiculos_total })
          : t("home.quick.fleet_manage"),
        iconColor: "text-emerald-500",
        to: "/admin/vehiculos",
        perm: "ver_vehiculos",
      },
    ];
    return all.filter((item) => !item.perm || can(item.perm));
  }, [can, kpis, t]);

  // ── Render ──
  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-6">
      {/* ── Search bar — mobile only ─────────────────────────────────────── */}
      <button
        onClick={() => openSearch(true)}
        className="md:hidden w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-card dark:bg-slate-900 border border-border/60 text-muted-foreground text-sm hover:border-primary/40 transition-colors"
        aria-label="Abrir buscador">
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">{t("home.search_placeholder")}</span>
        <kbd className="hidden sm:inline text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">
          Ctrl+K
        </kbd>
      </button>

      {/* ── Mini KPI strip ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <MiniKpi
          icon={Car}
          label={t("home.kpi.in_use")}
          value={
            dataLoading
              ? "…"
              : `${kpis?.vehiculos_en_uso ?? 0} / ${kpis?.vehiculos_total ?? 0}`
          }
          accent="blue"
          onClick={kpis ? () => navigate("/admin/vehiculos") : null}
        />
        <MiniKpi
          icon={CheckCircle2}
          label={t("home.kpi.today")}
          value={dataLoading ? "…" : (kpis?.registros_hoy ?? 0)}
          accent="emerald"
        />
        <MiniKpi
          icon={CalendarCheck}
          label={t("home.kpi.active_reservations")}
          value={dataLoading ? "…" : (kpis?.reservas_activas ?? 0)}
          accent="violet"
          onClick={kpis ? () => navigate("/admin/reservas-vehiculos") : null}
        />
        <MiniKpi
          icon={Wallet}
          label={t("home.kpi.pending_viaticos")}
          value={dataLoading ? "…" : (kpis?.viaticos_pendientes ?? 0)}
          accent="amber"
          onClick={kpis ? () => navigate("/admin/viaticos") : null}
        />
      </motion.div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {/* Left: Greeting + Clock + Sparkline */}
        <div className="bg-card dark:bg-slate-900/60 border border-border/60 rounded-3xl p-5 md:p-6 space-y-4 flex flex-col justify-between">
          {/* Greeting */}
          <div className="flex items-center gap-2.5">
            <greeting.Icon className={`w-5 h-5 ${greeting.color} shrink-0`} />
            <h2 className="text-base font-semibold text-muted-foreground">
              {greeting.text},{" "}
              <span className="text-foreground font-bold">{firstName}.</span>
            </h2>
          </div>

          {/* Clock */}
          {settingsLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-12 w-56 bg-muted rounded-xl" />
              <div className="h-3.5 w-40 bg-muted rounded-lg" />
            </div>
          ) : (
            <LiveClock
              key={`${configTimeFormat}-${configDateFormat}`}
              timeFormat={configTimeFormat}
              locale={configLanguage}
              timezone={configTimezone}
              dateFormat={configDateFormat}
            />
          )}

          {/* Mini sparkline — últimos 7 días */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1.5">
                <Activity size={10} /> {t("home.activity_week")}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                {act7.reduce((s, d) => s + Number(d.total ?? 0), 0)} {t("home.records_suffix")}
              </span>
            </div>
            {dataLoading ? (
              <div className="flex items-end gap-1.5 h-10 animate-pulse">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-muted"
                    style={{ height: `${30 + Math.random() * 70}%` }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-end gap-1.5 h-10">
                {act7.map((d) => {
                  const pct =
                    maxAct7 > 0 ? (Number(d.total) / maxAct7) * 100 : 0;
                  const isToday =
                    d.fecha === new Date().toISOString().slice(0, 10);
                  return (
                    <div
                      key={d.fecha}
                      className="flex flex-col items-center gap-0.5 flex-1 min-w-0"
                      title={`${fmtDate(d.fecha, configLanguage)}: ${d.total}`}>
                      <div
                        className="w-full rounded-t overflow-hidden bg-muted/40"
                        style={{ height: "32px" }}>
                        <div
                          className={`w-full rounded-t transition-all duration-700 ${isToday ? "bg-primary" : "bg-primary/30 dark:bg-primary/25"}`}
                          style={{
                            height: `${pct}%`,
                            minHeight: pct > 0 ? "3px" : "0",
                          }}
                        />
                      </div>
                      <span
                        className={`text-[8px] font-bold truncate w-full text-center leading-none ${isToday ? "text-primary" : "text-muted-foreground/50"}`}>
                        {fmtDate(d.fecha, configLanguage).split(" ")[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Weather OR stats placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-col gap-3">
          {/* Weather widget */}
          {weather ? (
            <div className="flex items-center justify-between px-5 py-4 rounded-3xl bg-primary/8 dark:bg-primary/12 border border-primary/15 flex-shrink-0">
              <div className="space-y-0.5">
                <p className="text-4xl font-bold text-primary tabular-nums">
                  {weather.temp}°C
                </p>
                <p className="text-sm font-semibold text-primary/80 capitalize">
                  {weather.desc}
                </p>
                <p className="text-xs text-primary/60 flex items-center gap-1">
                  <MapPin size={10} />
                  {weather.city}
                </p>
              </div>
              <img
                src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`}
                alt="weather"
                className="w-20 h-20 drop-shadow-lg"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center px-5 py-4 rounded-3xl border border-dashed border-border/60 h-28">
              <p className="text-xs text-muted-foreground">
                {t("home.weather_not_available", "Clima no disponible")}
              </p>
            </div>
          )}

          {/* Stats mini-row */}
          <div className="grid grid-cols-2 gap-3 flex-1">
            {[
              {
                icon: Users2,
                label: t("home.stats.employees"),
                value: kpis?.empleados_total ?? "—",
                color: "text-slate-600 dark:text-slate-400",
                bg: "bg-slate-100 dark:bg-slate-800",
              },
              {
                icon: TrendingUp,
                label: t("home.stats.week_records"),
                value: kpis?.registros_semana ?? "—",
                color: "text-sky-600 dark:text-sky-400",
                bg: "bg-sky-100 dark:bg-sky-900/30",
              },
              {
                icon: Package,
                label: t("home.stats.total_assets"),
                value: kpis?.activos_total ?? "—",
                color: "text-violet-600 dark:text-violet-400",
                bg: "bg-violet-100 dark:bg-violet-900/30",
              },
              {
                icon: Building2,
                label: t("home.stats.fleet_vehicles"),
                value: kpis?.vehiculos_total ?? "—",
                color: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-100 dark:bg-emerald-900/30",
              },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div
                key={label}
                className="bg-card dark:bg-slate-900/60 border border-border/60 rounded-2xl p-3.5 space-y-1.5">
                <div
                  className={`w-7 h-7 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={13} className={color} />
                </div>
                <p className="text-xl font-black tabular-nums leading-none">
                  {dataLoading ? (
                    <span className="inline-block w-6 h-4 bg-muted rounded animate-pulse" />
                  ) : (
                    value
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ── Requiere atención ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="bg-card dark:bg-slate-900/60 border border-border/60 rounded-3xl overflow-hidden">
        <div className="px-5 pt-4 pb-2 flex items-center gap-2">
          <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
            <Zap size={12} className="text-muted-foreground" />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            {t("home.attention.title")}
          </h3>
          {!dataLoading && attentionItems.length === 0 && (
            <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("home.attention.all_good")}
            </span>
          )}
        </div>

        <div className="px-2 pb-2">
          {dataLoading ? (
            <div className="space-y-1 px-2 pb-2 animate-pulse">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-10 bg-muted/50 rounded-2xl" />
              ))}
            </div>
          ) : attentionItems.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-3">
              <CheckCircle size={16} className="text-emerald-500 shrink-0" />
              <p className="text-sm text-muted-foreground">
                {isAdmin
                  ? t("home.attention.no_pending_admin")
                  : t("home.attention.no_pending_user")}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {attentionItems.map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}>
                  <AlertItem {...item} navigate={navigate} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* ── Bottom grid: Novedades + Accesos rápidos ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Novedades — 2 col */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-amber-500 shrink-0" />
            <h3 className="text-sm font-bold text-foreground">
              {t("home.news_title", "Novedades")}
            </h3>
          </div>

          {pinnedLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-muted/60" />
              ))}
            </div>
          ) : pinned.length > 0 ? (
            pinned.map((news, i) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="flex gap-4 p-4 rounded-2xl border border-border/60 bg-card dark:bg-slate-900/60 hover:border-primary/30 hover:shadow-sm transition-all duration-150 group">
                <div className="w-10 h-10 rounded-xl bg-muted/60 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="font-bold text-sm text-foreground leading-tight truncate">
                      {news.title}
                    </p>
                    <span
                      className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${news.type === "Important" ? "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400" : "bg-muted text-muted-foreground"}`}>
                      {news.type || "Update"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {news.description}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/admin/help/changelog/${news.slug}`)}
                  className="shrink-0 self-center text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                  Ver <ArrowRight size={11} />
                </button>
              </motion.div>
            ))
          ) : (
            <div className="p-6 rounded-2xl bg-muted/30 border border-border/40 text-center">
              <p className="text-sm text-muted-foreground">
                {t("home.no_news", "No hay novedades por ahora.")}
              </p>
            </div>
          )}
        </motion.div>

        {/* Accesos rápidos — 1 col */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.4 }}
          className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            <h3 className="text-sm font-bold text-foreground">
              {t("home.quick_access", "Accesos rápidos")}
            </h3>
          </div>
          <div className="space-y-1.5">
            {quickItems.map((item) => (
              <QuickBtn
                key={item.to}
                icon={item.icon}
                label={item.label}
                sub={item.sub}
                iconColor={item.iconColor}
                onClick={() => navigate(item.to)}
              />
            ))}
            {quickItems.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                {t("home.quick.no_access")}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Estado del sistema ───────────────────────────────────────────── */}
      <SystemStatus status={systemStatus} />
    </div>
  );
}
