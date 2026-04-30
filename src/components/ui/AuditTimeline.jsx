import { Loader2, RefreshCw } from "lucide-react";
import { useAudit } from "../../hooks/useAudit";

/* ── Metadata por acción ─────────────────────────────────────────────────── */

const ACCION_META = {
  crear:      { label: "Creado",            dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400" },
  actualizar: { label: "Actualizado",        dot: "bg-blue-500",    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400" },
  eliminar:   { label: "Eliminado",          dot: "bg-red-500",     badge: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400" },
  login:      { label: "Inicio de sesión",   dot: "bg-violet-500",  badge: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400" },
  logout:     { label: "Cierre de sesión",   dot: "bg-slate-400",   badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  revocar:    { label: "Sesiones revocadas", dot: "bg-amber-500",   badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400" },
  exportar:   { label: "Exportado",          dot: "bg-cyan-500",    badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400" },
  importar:   { label: "Importado",          dot: "bg-indigo-500",  badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400" },
};

const FIELD_LABELS = {
  placa:               "Placa",
  marca:               "Marca",
  modelo:              "Modelo",
  estado:              "Estado",
  id_ubicacion_actual: "Ubicación",
  nombre:              "Nombre",
  email:               "Email",
  username:            "Usuario",
  rol_id:              "Rol",
  estatus:             "Estatus",
  device_name:         "Dispositivo",
  device_type:         "Tipo",
  motivo:              "Motivo",
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-HN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getMeta(accion) {
  return ACCION_META[accion] ?? {
    label: accion,
    dot:   "bg-gray-400",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
}

function parseVal(v) {
  if (v == null) return null;
  if (typeof v === "string") {
    try { return JSON.parse(v); } catch { return null; }
  }
  return typeof v === "object" ? v : null;
}

function isScalar(v) {
  return v !== null && v !== undefined && typeof v !== "object";
}

/**
 * Calcula qué mostrar según la acción:
 * - crear    → todos los campos de nuevo como "valores iniciales"
 * - eliminar → todos los campos de anterior como "eliminados"
 * - actualizar → SOLO los campos que cambiaron entre anterior y nuevo
 */
function getChanges(accion, anterior, nuevo) {
  if (accion === "crear" || (!anterior && nuevo)) {
    return Object.entries(nuevo || {})
      .filter(([, v]) => isScalar(v))
      .map(([key, next]) => ({ key, prev: null, next }));
  }

  if (accion === "eliminar" || (anterior && !nuevo)) {
    return Object.entries(anterior || {})
      .filter(([, v]) => isScalar(v))
      .map(([key, prev]) => ({ key, prev, next: null }));
  }

  // actualizar (o cualquier otra): solo campos que cambiaron
  const allKeys = new Set([
    ...Object.keys(anterior || {}),
    ...Object.keys(nuevo    || {}),
  ]);
  const changes = [];
  for (const key of allKeys) {
    const prev = anterior?.[key];
    const next = nuevo?.[key];
    if (!isScalar(prev) && !isScalar(next)) continue; // skip objetos anidados
    if (prev === next) continue;                        // sin cambio
    if (prev == null && next == null) continue;         // ambos nulos
    changes.push({ key, prev: isScalar(prev) ? prev : null, next: isScalar(next) ? next : null });
  }
  return changes;
}

/* ── Diff renderer ───────────────────────────────────────────────────────── */

function ChangeDiff({ accion, anterior, nuevo }) {
  const changes = getChanges(accion, anterior, nuevo);
  if (changes.length === 0) return null;

  return (
    <div className="mt-2.5 rounded-xl border border-border/40 bg-muted/30 dark:bg-slate-800/30 divide-y divide-border/30 overflow-hidden text-[11px]">
      {changes.map(({ key, prev, next }) => (
        <div key={key} className="flex items-center gap-2 px-3 py-2">
          <span className="shrink-0 font-semibold text-muted-foreground w-[88px]">
            {FIELD_LABELS[key] ?? key}
          </span>
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {prev != null && (
              <span className="px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 line-through break-all">
                {String(prev)}
              </span>
            )}
            {prev != null && next != null && (
              <span className="text-muted-foreground font-bold">→</span>
            )}
            {next != null && (
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium break-all">
                {String(next)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Componente principal ─────────────────────────────────────────────────── */

export default function AuditTimeline({ entidad, entidadId }) {
  const { logs, loading, error, refresh } = useAudit(entidad, entidadId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Historial de cambios
        </p>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1.5 rounded-xl hover:bg-muted dark:hover:bg-slate-800 transition-colors text-muted-foreground disabled:opacity-40"
          title="Actualizar"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Cargando historial…</span>
        </div>
      )}
      {!loading && error && (
        <p className="text-sm text-center text-red-500 py-8">{error}</p>
      )}
      {!loading && !error && logs.length === 0 && (
        <p className="text-sm text-center text-muted-foreground py-10">
          Sin registros de auditoría aún.
        </p>
      )}

      {/* Timeline */}
      {!loading && logs.length > 0 && (
        <ol className="relative border-l border-border/40 dark:border-slate-700/40 space-y-6 pl-5">
          {logs.map((log) => {
            const meta     = getMeta(log.accion);
            const anterior = parseVal(log.valor_anterior);
            const nuevo    = parseVal(log.valor_nuevo);

            return (
              <li key={log.id} className="relative">
                {/* Dot */}
                <span className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full ring-2 ring-background dark:ring-slate-900 ${meta.dot}`} />

                {/* Badge + fecha */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${meta.badge}`}>
                    {meta.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(log.created_at)}
                  </span>
                </div>

                {/* Descripción */}
                {log.descripcion && (
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    {log.descripcion}
                  </p>
                )}

                {/* Usuario */}
                {log.usuario_nombre && (
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                    Por{" "}
                    <span className="font-medium text-muted-foreground">
                      {log.usuario_nombre}
                    </span>
                    {log.usuario_email ? ` · ${log.usuario_email}` : ""}
                  </p>
                )}

                {/* Diff — solo si hay datos */}
                {(anterior || nuevo) && (
                  <ChangeDiff accion={log.accion} anterior={anterior} nuevo={nuevo} />
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
