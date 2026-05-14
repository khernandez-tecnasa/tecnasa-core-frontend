export const STATUS_CONFIG = {
  Disponible: {
    label: "Disponible",
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    card: "border-emerald-500/20",
    glow: "shadow-emerald-500/10",
  },
  "En Uso": {
    label: "En Uso",
    dot: "bg-amber-400 animate-pulse",
    badge: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    card: "border-amber-500/25",
    glow: "shadow-amber-500/10",
  },
  Reservado: {
    label: "Reservado",
    dot: "bg-blue-400",
    badge: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
    card: "border-blue-500/20",
    glow: "shadow-blue-500/10",
  },
  "En Mantenimiento": {
    label: "Mantenimiento",
    dot: "bg-red-400",
    badge: "bg-red-500/15 text-red-300 border border-red-500/30",
    card: "border-red-500/20",
    glow: "shadow-red-500/10",
  },
  Inactivo: {
    label: "Inactivo",
    dot: "bg-gray-500",
    badge: "bg-gray-500/15 text-gray-400 border border-gray-500/30",
    card: "border-gray-700/40",
    glow: "",
  },
};

export const DEFAULT_STATUS = {
  label: "Desconocido",
  dot: "bg-gray-500",
  badge: "bg-gray-500/15 text-gray-400 border border-gray-500/30",
  card: "border-gray-700/40",
  glow: "",
};

export function fmtHora(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-HN", {
    day: "2-digit",
    month: "short",
  });
}

export function fmtKm(val) {
  if (val == null) return "—";
  return `${Number(val).toLocaleString("es-HN")} km`;
}
