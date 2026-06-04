// src/pages/Reports/ReportsPage.jsx
import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3,
  Car,
  Users,
  MapPin,
  Search,
  X,
  History,
  Filter,
  ArrowRight,
  FileText,
  Timer,
  CalendarDays,
  CalendarCheck,
  Wallet,
  PieChart,
  Package,
  Warehouse,
  TrendingUp,
  Fuel,
  Route,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useIsMobile from "@/hooks/useIsMobile";

// ── Categorías ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Todos",
  "Operación",
  "Recursos Humanos",
  "Reservas",
  "Viáticos",
  "Inventario",
];

// ── Definición de reportes ─────────────────────────────────────────────────────
const REPORTS = [
  {
    id: "registros-uso",
    title: "Registros de Uso",
    description:
      "Analiza los registros de uso de vehículos en un rango de fechas determinado.",
    Icon: BarChart3,
    category: "Operación",
    tags: ["vehículos", "registros"],
    accent: "blue",
  },
  {
    id: "vehiculos-uso",
    title: "Vehículos por Uso",
    description:
      "Ranking de vehículos según la frecuencia y duración de su uso por el personal.",
    Icon: Car,
    category: "Operación",
    tags: ["vehículos", "ranking"],
    accent: "violet",
  },
  {
    id: "empleados-actividad",
    title: "Actividad de Empleados",
    description:
      "Resumen de la actividad operacional por empleado en el período seleccionado.",
    Icon: Users,
    category: "Recursos Humanos",
    tags: ["empleados", "actividad"],
    accent: "emerald",
  },
  {
    id: "kilometraje-empleado",
    title: "Kilometraje por Empleado",
    description:
      "Detalle del kilometraje acumulado por cada empleado en sus desplazamientos.",
    Icon: Car,
    category: "Operación",
    tags: ["kilometraje", "empleados"],
    accent: "amber",
  },
  {
    id: "ubicacion-vehiculo",
    title: "Ubicaciones de Vehículos",
    description:
      "Historial de ubicaciones registradas por vehículo en un período específico.",
    Icon: MapPin,
    category: "Operación",
    tags: ["ubicaciones", "vehiculos"],
    accent: "rose",
  },
  {
    id: "consumo-combustible-vehiculo",
    title: "Consumo de Combustible",
    description:
      "Análisis del consumo de combustible por vehículo, comparando eficiencia y costos.",
    Icon: Fuel,
    category: "Operación",
    tags: ["combustible", "vehiculos"],
    accent: "orange",
  },

  // ── Operación (nuevos) ──────────────────────────────────────────────────────
  {
    id: "viajes-duracion",
    title: "Duración de Viajes",
    description:
      "Tiempo promedio y máximo de viaje por vehículo. Identifica trayectos largos o inusuales.",
    Icon: Timer,
    category: "Operación",
    tags: ["vehículos", "duración", "tiempo"],
    accent: "cyan",
  },
  {
    id: "actividad-semanal",
    title: "Actividad por Día",
    description:
      "Distribución de salidas de vehículos según el día de la semana para optimizar la flota.",
    Icon: CalendarDays,
    category: "Operación",
    tags: ["actividad", "días", "estadística"],
    accent: "indigo",
  },

  // ── Reservas ────────────────────────────────────────────────────────────────
  {
    id: "reservas-estado",
    title: "Reservas por Estado",
    description:
      "Distribución de reservas de vehículos por estado: pendiente, en uso, finalizada o cancelada.",
    Icon: CalendarCheck,
    category: "Reservas",
    tags: ["reservas", "estado"],
    accent: "purple",
  },
  {
    id: "reservas-empleado",
    title: "Reservas por Empleado",
    description:
      "Ranking de empleados según la cantidad de reservas realizadas, finalizadas y canceladas.",
    Icon: Users,
    category: "Reservas",
    tags: ["reservas", "empleados", "ranking"],
    accent: "sky",
  },

  // ── Viáticos ────────────────────────────────────────────────────────────────
  {
    id: "viaticos-estado",
    title: "Viáticos por Estado",
    description:
      "Distribución de viáticos por estado: borrador, pendiente, aprobado, rechazado, liquidado.",
    Icon: Wallet,
    category: "Viáticos",
    tags: ["viáticos", "estado", "gasto"],
    accent: "teal",
  },
  {
    id: "viaticos-empleados",
    title: "Top Empleados Viáticos",
    description:
      "Empleados con mayor gasto en viáticos. Incluye monto total y kilómetros recorridos.",
    Icon: TrendingUp,
    category: "Viáticos",
    tags: ["viáticos", "empleados", "gasto", "ranking"],
    accent: "lime",
  },
  {
    id: "viaticos-tipo",
    title: "Gasto por Tipo de Viático",
    description:
      "Desglose del gasto total en viáticos por categoría: alimentación, hospedaje, peajes, etc.",
    Icon: PieChart,
    category: "Viáticos",
    tags: ["viáticos", "tipo", "desglose"],
    accent: "green",
  },

  // ── Inventario ──────────────────────────────────────────────────────────────
  {
    id: "activos-estado",
    title: "Estado de Activos",
    description:
      "Distribución de activos por estatus actual (activo, inactivo, mantenimiento) y por tipo.",
    Icon: Package,
    category: "Inventario",
    tags: ["activos", "estado", "inventario"],
    accent: "slate",
  },
  {
    id: "bodegas-ocupacion",
    title: "Ocupación de Bodegas",
    description:
      "Cantidad de activos almacenados en cada bodega, desglosados por ciudad y estado.",
    Icon: Warehouse,
    category: "Inventario",
    tags: ["bodegas", "ocupación", "inventario"],
    accent: "stone",
  },
];

// ── Colores por accent ─────────────────────────────────────────────────────────
const ACCENT_CLASSES = {
  blue: {
    icon: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-blue-100 dark:ring-blue-900/40",
    badge: "text-blue-600 dark:text-blue-400",
    hover: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
  },
  violet: {
    icon: "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 ring-violet-100 dark:ring-violet-900/40",
    badge: "text-violet-600 dark:text-violet-400",
    hover: "group-hover:text-violet-600 dark:group-hover:text-violet-400",
  },
  emerald: {
    icon: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/40",
    badge: "text-emerald-600 dark:text-emerald-400",
    hover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
  },
  amber: {
    icon: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 ring-amber-100 dark:ring-amber-900/40",
    badge: "text-amber-600 dark:text-amber-400",
    hover: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
  },
  rose: {
    icon: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 ring-rose-100 dark:ring-rose-900/40",
    badge: "text-rose-600 dark:text-rose-400",
    hover: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
  },
  orange: {
    icon: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 ring-orange-100 dark:ring-orange-900/40",
    badge: "text-orange-600 dark:text-orange-400",
    hover: "group-hover:text-orange-600 dark:group-hover:text-orange-400",
  },
  cyan: {
    icon: "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 ring-cyan-100 dark:ring-cyan-900/40",
    badge: "text-cyan-600 dark:text-cyan-400",
    hover: "group-hover:text-cyan-600 dark:group-hover:text-cyan-400",
  },
  indigo: {
    icon: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 ring-indigo-100 dark:ring-indigo-900/40",
    badge: "text-indigo-600 dark:text-indigo-400",
    hover: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
  },
  purple: {
    icon: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 ring-purple-100 dark:ring-purple-900/40",
    badge: "text-purple-600 dark:text-purple-400",
    hover: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
  },
  sky: {
    icon: "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 ring-sky-100 dark:ring-sky-900/40",
    badge: "text-sky-600 dark:text-sky-400",
    hover: "group-hover:text-sky-600 dark:group-hover:text-sky-400",
  },
  teal: {
    icon: "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 ring-teal-100 dark:ring-teal-900/40",
    badge: "text-teal-600 dark:text-teal-400",
    hover: "group-hover:text-teal-600 dark:group-hover:text-teal-400",
  },
  lime: {
    icon: "bg-lime-50 dark:bg-lime-900/20 text-lime-600 dark:text-lime-400 ring-lime-100 dark:ring-lime-900/40",
    badge: "text-lime-600 dark:text-lime-400",
    hover: "group-hover:text-lime-600 dark:group-hover:text-lime-400",
  },
  green: {
    icon: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 ring-green-100 dark:ring-green-900/40",
    badge: "text-green-600 dark:text-green-400",
    hover: "group-hover:text-green-600 dark:group-hover:text-green-400",
  },
  slate: {
    icon: "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 ring-slate-200 dark:ring-slate-700/60",
    badge: "text-slate-600 dark:text-slate-400",
    hover: "group-hover:text-slate-700 dark:group-hover:text-slate-300",
  },
  stone: {
    icon: "bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 ring-stone-200 dark:ring-stone-700/60",
    badge: "text-stone-600 dark:text-stone-400",
    hover: "group-hover:text-stone-700 dark:group-hover:text-stone-300",
  },
};

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

// ── Componente: Tarjeta de reporte ─────────────────────────────────────────────
function ReportCard({ report, onClick }) {
  const a = ACCENT_CLASSES[report.accent] || ACCENT_CLASSES.blue;
  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-card dark:bg-slate-900/60 border border-border/60 rounded-3xl p-5 flex flex-col gap-4 hover:shadow-md hover:border-border transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-2xl ring-1 ${a.icon}`}>
          <report.Icon size={20} />
        </div>
        <div className="w-8 h-8 rounded-xl bg-muted/50 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:bg-primary/10 group-hover:ring-1 ring-primary/20">
          <ArrowRight size={14} className="text-primary -translate-x-0.5 group-hover:translate-x-0 transition-transform" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5">
        <h3 className={`font-bold text-sm text-foreground transition-colors ${a.hover}`}>
          {report.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {report.description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-border/40">
        <span className={`text-[10px] font-black uppercase tracking-widest ${a.badge}`}>
          {report.category}
        </span>
        <div className="flex gap-1 flex-wrap justify-end">
          {report.tags.map((t) => (
            <span
              key={t}
              className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-muted/60 dark:bg-slate-800 text-muted-foreground uppercase tracking-wide">
              #{t}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

// ── Componente: Tarjeta de recientes ──────────────────────────────────────────
function RecentCard({ report, onClick }) {
  const a = ACCENT_CLASSES[report.accent] || ACCENT_CLASSES.blue;
  return (
    <button
      onClick={onClick}
      className="group w-full text-left flex items-center gap-3 bg-muted/40 dark:bg-slate-800/50 border border-border/50 rounded-2xl px-4 py-3 hover:bg-card hover:border-border hover:shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
      <div className={`p-2 rounded-xl ring-1 shrink-0 ${a.icon}`}>
        <report.Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold truncate text-foreground">{report.title}</p>
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{report.category}</p>
      </div>
      <ArrowRight size={13} className="shrink-0 text-muted-foreground/40 group-hover:text-primary ml-auto transition-colors" />
    </button>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function ReportsPage() {
  const qs = useQuery();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [query, setQuery] = useState(qs.get("q") || "");
  const [category, setCategory] = useState(qs.get("cat") || "Todos");
  const [tag, setTag] = useState(qs.get("tag") || "");

  // Recientes (LocalStorage)
  const [recentIds, setRecentIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recent_reports") || "[]");
    } catch {
      return [];
    }
  });

  // Sincronizar URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category && category !== "Todos") params.set("cat", category);
    if (tag) params.set("tag", tag);
    const s = params.toString();
    window.history.replaceState(
      null,
      "",
      s ? `/admin/reports?${s}` : "/admin/reports"
    );
  }, [query, category, tag]);

  // Filtrado
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REPORTS.filter((r) => {
      const matchQ =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
      const matchC = category === "Todos" || r.category === category;
      const matchTag = !tag || r.tags.includes(tag);
      return matchQ && matchC && matchTag;
    });
  }, [query, category, tag]);

  const recentReports = recentIds
    .map((id) => REPORTS.find((r) => r.id === id))
    .filter(Boolean);

  const openReport = (id) => {
    const next = [id, ...recentIds.filter((x) => x !== id)].slice(0, 4);
    setRecentIds(next);
    localStorage.setItem("recent_reports", JSON.stringify(next));
    navigate(`/admin/reports?view=${id}`);
  };

  // Nube de tags
  const allTags = useMemo(() => {
    const map = new Map();
    REPORTS.forEach((r) =>
      r.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1))
    );
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, []);

  const hasFilters = query || category !== "Todos" || tag;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <FileText size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Reportes
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Genera y exporta reportes de las operaciones del sistema
            </p>
          </div>
        </div>
      </div>

      {/* ── SEARCH + CATEGORY FILTERS ── */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative w-full group">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar reporte por nombre, descripción o etiqueta..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-card border border-border/60 rounded-2xl pl-9 pr-10 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/50 shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category chips — scrollable horizontal */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-150 ${
                category === c
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                  : "bg-card border-border/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── SECCIÓN RECIENTES ── */}
      {recentReports.length > 0 && !query && category === "Todos" && !tag && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <History size={15} className="text-primary" />
              Vistos recientemente
            </div>
            <button
              onClick={() => {
                setRecentIds([]);
                localStorage.removeItem("recent_reports");
              }}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Limpiar historial
            </button>
          </div>

          <div className={`grid gap-2 ${isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-4"}`}>
            {recentReports.map((r) => (
              <RecentCard key={r.id} report={r} onClick={() => openReport(r.id)} />
            ))}
          </div>
        </div>
      )}

      {/* ── CONTADOR + TAG ACTIVO ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Filter size={13} className="text-muted-foreground/60" />
          {filtered.length} reporte{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
        </div>

        {tag && (
          <button
            onClick={() => setTag("")}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
            #{tag}
            <X size={10} />
          </button>
        )}

        {hasFilters && (
          <button
            onClick={() => { setQuery(""); setCategory("Todos"); setTag(""); }}
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors ml-auto">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── GRID DE REPORTES ── */}
      {filtered.length === 0 ? (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-16 h-16 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
            <FileText size={28} className="text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <p className="font-bold text-sm">Sin resultados</p>
            <p className="text-xs text-muted-foreground mt-1">
              No hay reportes que coincidan con tu búsqueda
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-2xl mt-1"
            onClick={() => { setQuery(""); setCategory("Todos"); setTag(""); }}>
            Ver todos los reportes
          </Button>
        </div>
      ) : (
        <div className={`grid gap-4 ${
          isMobile
            ? "grid-cols-1"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}>
          {filtered.map((r) => (
            <ReportCard key={r.id} report={r} onClick={() => openReport(r.id)} />
          ))}
        </div>
      )}

      {/* ── TAGS CLOUD ── */}
      {allTags.length > 0 && (
        <div className="pt-5 border-t border-border/40 space-y-2.5">
          <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
            Etiquetas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setTag(tag === t ? "" : t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 ${
                  tag === t
                    ? "bg-foreground text-background border-foreground"
                    : "bg-muted/50 dark:bg-slate-800 border-border/50 text-muted-foreground hover:bg-muted dark:hover:bg-slate-700 hover:text-foreground"
                }`}>
                #{t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
