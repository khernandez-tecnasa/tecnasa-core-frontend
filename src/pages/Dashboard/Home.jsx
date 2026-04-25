import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
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
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useCommandPalette } from "@/context/CommandPaletteContext";
import { getPinnedChangelogs } from "@/services/help.api";

/* ─── Live clock ────────────────────────────────────────────────────── */

function LiveClock({ timeFormat, locale, timezone }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = useMemo(() => {
    try {
      let d = now;
      if (timezone) d = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
      let h = d.getHours();
      const mm = d.getMinutes().toString().padStart(2, "0");
      const ss = d.getSeconds().toString().padStart(2, "0");
      if (timeFormat === "24h") return `${h.toString().padStart(2, "0")}:${mm}:${ss}`;
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h.toString().padStart(2, "0")}:${mm}:${ss} ${ampm}`;
    } catch { return "--:--:--"; }
  }, [now, timeFormat, timezone]);

  const date = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(now);
    } catch { return ""; }
  }, [now, locale, timezone]);

  return (
    <div className="space-y-1">
      <p
        className="text-5xl md:text-7xl font-extrabold tabular-nums tracking-tight leading-none"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary)/0.75), hsl(var(--primary)))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {time}
      </p>
      <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 capitalize font-medium">
        {date}
      </p>
    </div>
  );
}

/* ─── Skeleton ──────────────────────────────────────────────────────── */

function ClockSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-16 md:h-20 w-72 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
    </div>
  );
}

/* ─── Quick access button ────────────────────────────────────────────── */

function QuickBtn({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        w-full flex items-center justify-between gap-3
        px-4 py-3.5 rounded-xl
        bg-gray-50 dark:bg-gray-800
        hover:bg-primary/5 dark:hover:bg-primary/10
        border border-transparent hover:border-primary/20
        text-gray-700 dark:text-gray-300
        transition-all duration-150 group
      "
    >
      <span className="flex items-center gap-3 text-sm font-medium">
        <span className="text-primary opacity-80 group-hover:opacity-100 transition-opacity">
          {icon}
        </span>
        {label}
      </span>
      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors shrink-0" />
    </button>
  );
}

/* ─── Home ───────────────────────────────────────────────────────────── */

export default function Home() {
  const { t, i18n } = useTranslation();
  const { userData } = useAuth();
  const { settings, loading } = useSettings();
  const { setOpen: openSearch } = useCommandPalette();
  const navigate = useNavigate();

  const [weather, setWeather] = useState(null);
  const [pinned, setPinned] = useState([]);
  const [pinnedLoading, setPinnedLoading] = useState(true);

  const firstName = userData?.nombre?.split(" ")[0] || "Usuario";
  const weatherKey = import.meta.env.VITE_OWM_KEY;

  const configTimeFormat = settings?.timeFormat || "12h";
  const configDateFormat = settings?.dateFormat || "DD/MM/YYYY";
  const configLanguage   = settings?.language || i18n.language || "es-HN";
  const configTimezone   = settings?.timezone;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return { text: t("home.greeting.morning"), Icon: Sun,  color: "text-yellow-500" };
    if (h < 18) return { text: t("home.greeting.afternoon"), Icon: Sun, color: "text-orange-500" };
    return       { text: t("home.greeting.evening"),   Icon: Moon, color: "text-indigo-400" };
  }, [t]);

  useEffect(() => {
    // Weather
    if (weatherKey && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          const lang = configLanguage.split("-")[0];
          fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=${lang}&appid=${weatherKey}`
          )
            .then((r) => r.json())
            .then((d) => {
              if (d.main) setWeather({ temp: Math.round(d.main.temp), desc: d.weather[0].description, icon: d.weather[0].icon, city: d.name });
            })
            .catch(() => {});
        },
        () => {},
      );
    }

    // Pinned changelogs
    getPinnedChangelogs(3)
      .then((d) => setPinned(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setPinnedLoading(false));
  }, [weatherKey, configLanguage]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Search bar — mobile only ────────────────────────────────── */}
      <button
        onClick={() => openSearch(true)}
        className="
          md:hidden w-full flex items-center gap-3
          px-4 py-3 rounded-xl
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          text-gray-400 dark:text-gray-500 text-sm
          hover:border-primary/40 transition-colors
        "
        aria-label="Abrir buscador"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">Buscar módulos y datos…</span>
        <kbd className="hidden sm:inline text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-mono">
          Ctrl+K
        </kbd>
      </button>

      {/* ── Hero section ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center"
      >
        {/* Greeting + clock */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <greeting.Icon className={`w-7 h-7 ${greeting.color} shrink-0`} />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {greeting.text},{" "}
              <span className="text-gray-900 dark:text-white font-bold">{firstName}.</span>
            </h2>
          </div>

          {loading ? <ClockSkeleton /> : (
            <LiveClock
              key={configTimeFormat}
              timeFormat={configTimeFormat}
              locale={configLanguage}
              timezone={configTimezone}
            />
          )}
        </div>

        {/* Weather widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          {weather ? (
            <div className="flex items-center justify-between p-5 rounded-2xl bg-primary/8 dark:bg-primary/12 border border-primary/15">
              <div className="space-y-0.5">
                <p className="text-4xl font-bold text-primary">{weather.temp}°C</p>
                <p className="text-sm font-semibold text-primary/80 capitalize">{weather.desc}</p>
                <p className="text-xs text-primary/60">{weather.city}</p>
              </div>
              <img
                src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`}
                alt="weather"
                className="w-24 h-24 drop-shadow-lg"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center p-5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 h-28">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {t("home.weather_not_available", "Clima no disponible")}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>

      <div className="h-px bg-gray-200 dark:bg-gray-700" />

      {/* ── Bottom grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Novedades — 2 col */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="lg:col-span-2 space-y-3"
        >
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            <Pin className="w-4 h-4 text-amber-500" />
            {t("home.news_title", "Novedades")}
          </h3>

          {pinnedLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : pinned.length > 0 ? (
            pinned.map((news) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="
                  flex gap-4 p-4 rounded-xl
                  border border-gray-200 dark:border-gray-700
                  hover:border-primary/30 hover:shadow-sm
                  bg-white dark:bg-gray-900
                  transition-all duration-150 group
                "
              >
                <div className="w-11 h-11 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight truncate">
                      {news.title}
                    </p>
                    <span className={`
                      shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide
                      ${news.type === "Important"
                        ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                      }
                    `}>
                      {news.type || "Update"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {news.description}
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/admin/help/changelog/${news.slug}`)}
                  className="shrink-0 self-center text-xs font-medium text-primary hover:underline"
                >
                  {t("home.read_more", "Ver más")}
                </button>
              </motion.div>
            ))
          ) : (
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {t("home.no_news", "No hay novedades por ahora.")}
              </p>
            </div>
          )}
        </motion.div>

        {/* Accesos rápidos — 1 col */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            {t("home.quick_access", "Accesos rápidos")}
          </h3>

          <div className="space-y-2">
            <QuickBtn
              icon={<BarChart3 className="w-4 h-4" />}
              label={t("menu.dashboard", "Dashboard")}
              onClick={() => navigate("/admin/dashboard")}
            />
            <QuickBtn
              icon={<Package className="w-4 h-4" />}
              label={t("menu.inventory", "Inventario")}
              onClick={() => navigate("/admin/inventario/activos")}
            />
            <QuickBtn
              icon={<Truck className="w-4 h-4" />}
              label={t("menu.fleet", "Flota")}
              onClick={() => navigate("/admin/vehiculos")}
            />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
