// src/pages/Public/PublicActivoPage.jsx
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Package,
  MapPin,
  Mail,
  AlertTriangle,
  Loader2,
  Building2,
  Factory,
  Calendar,
  Hash,
  RotateCcw,
} from "lucide-react";

// Usa env var para no estar cambiando a mano entre dev/prod.
// IMPORTANTE: el fallback NUNCA debe apuntar a producción — si la variable
// no está configurada, debe quedar claro en local/staging que falta config,
// no apuntar silenciosamente al backend real.
const API_BASE =
  import.meta.env.VITE_API_BASE_URL_QR || "http://localhost:3000";

const TECNASA_LOGO_URL =
  "https://dgatthzqfkneyqmrnkom.supabase.co/storage/v1/object/public/Autolog/newLogoTecnasa.png";

// Soporte
const SUPPORT_EMAIL = "micros.teh@tecnasadesk.com";

const ESTATUS_CLASSES = {
  activo: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  arrendado: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  "en mantenimiento": "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  inactivo: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

function EstatusBadge({ estatus }) {
  const key = (estatus || "activo").toLowerCase();
  const cls = ESTATUS_CLASSES[key] || ESTATUS_CLASSES.activo;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${cls}`}>
      {estatus || "Activo"}
    </span>
  );
}

function DestinoBadge({ tipo }) {
  if (!tipo) return null;
  const isCliente = tipo === "Cliente";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase tracking-wide rounded-full ${
        isCliente
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground"
      }`}>
      {tipo}
    </span>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="text-muted-foreground/70 font-semibold min-w-[88px] shrink-0">
        {label}
      </span>
      <span className="font-semibold text-foreground truncate">{value ?? "—"}</span>
    </div>
  );
}

function OuterShell({ children }) {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-muted/40 dark:bg-slate-950 px-3 py-6 sm:px-6 sm:py-10">
      {children}
    </div>
  );
}

function StatePanel({ icon: Icon, title, description, code, danger, action }) {
  return (
    <OuterShell>
      <div className="mx-auto w-full max-w-md">
        <div className="bg-card dark:bg-slate-900 rounded-3xl border border-border/60 shadow-xl dark:shadow-black/40 p-6 sm:p-8 text-center space-y-3">
          <div
            className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center ${
              danger
                ? "bg-rose-500/10 dark:bg-rose-500/15"
                : "bg-primary/10 dark:bg-primary/15"
            }`}>
            <Icon
              className={danger ? "text-rose-500" : "text-primary animate-spin"}
              size={24}
            />
          </div>
          <h1 className="font-black text-lg tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
          {code && (
            <p className="text-xs text-muted-foreground/60 font-mono">Código: {code}</p>
          )}
          {action}
        </div>
      </div>
    </OuterShell>
  );
}

function formatDate(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleDateString("es-HN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(dt);
  }
}

export default function PublicActivoPage() {
  const { codigo } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [data, setData] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });

  useEffect(() => {
    let mounted = true;
    setState({ loading: true, error: null });

    if (!token) {
      setState({
        loading: false,
        error:
          "Este enlace público no es válido. Vuelve a escanear el QR o abre el activo desde la aplicación.",
      });
      return () => {};
    }

    const url = new URL(
      `${API_BASE}/public/activos/${encodeURIComponent(codigo)}`
    );
    url.searchParams.set("token", token);

    fetch(url.toString())
      .then(async (r) => {
        if (!r.ok) {
          if (r.status === 401 || r.status === 403) {
            throw new Error(
              "Enlace inválido o expirado. Vuelve a escanear el QR o abre el activo desde la aplicación."
            );
          }
          throw new Error(`(${r.status}) No se pudo cargar el activo`);
        }
        return r.json();
      })
      .then((json) => mounted && setData(json))
      .catch((e) => mounted && setState({ loading: false, error: e.message }))
      .finally(() => mounted && setState((s) => ({ ...s, loading: false })));
    return () => {
      mounted = false;
    };
  }, [codigo, token]);

  if (state.loading) {
    return (
      <StatePanel
        icon={Loader2}
        title="Cargando activo…"
        code={codigo}
      />
    );
  }

  if (state.error || !data) {
    return (
      <StatePanel
        icon={AlertTriangle}
        danger
        title="No se pudo mostrar el activo"
        description={state.error || "Activo no encontrado"}
        code={codigo}
        action={
          <button
            onClick={() => window.location.reload()}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-muted hover:bg-muted/80 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
            <RotateCcw size={14} /> Reintentar
          </button>
        }
      />
    );
  }

  const {
    nombre,
    modelo,
    serial_number,
    tipo,
    estatus,
    fecha_registro,
    ubicacion_actual,
  } = data;

  // Correo: ticket directo
  const emailSubject = encodeURIComponent(
    `Reporte de falla - Activo ${codigo}`
  );
  const emailBody = encodeURIComponent(
    [
      "Hola equipo de soporte Tecnasa,",
      "",
      "Estoy reportando una falla en el siguiente equipo:",
      "",
      `- Código: ${codigo}`,
      `- Nombre: ${nombre || "—"}`,
      `- Modelo: ${modelo || "—"}`,
      `- Serie: ${serial_number || "—"}`,
      `- Ubicación / Site: ${ubicacion_actual?.site || "—"}`,
      "",
      "Descripción de la falla (favor completar):",
      "- ...............................................................",
      "",
      "Les agradezco su apoyo con esta gestión.",
      "",
      "Saludos.",
    ].join("\n")
  );
  const emailHref = `mailto:${SUPPORT_EMAIL}?subject=${emailSubject}&body=${emailBody}`;

  return (
    <OuterShell>
      <div className="mx-auto w-full max-w-2xl">
        <div className="bg-card dark:bg-slate-900 rounded-3xl border border-border/60 shadow-xl dark:shadow-black/40 overflow-hidden">
          {/* ── HEADER ── */}
          <div className="p-5 sm:p-7 pb-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2 rounded-full bg-white ring-2 ring-primary/20 dark:ring-primary/30 shadow-sm shrink-0 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center overflow-hidden">
                  <img
                    src={data.tecnasa_logo_url || TECNASA_LOGO_URL}
                    alt="Tecnasa"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextSibling.style.display = "flex";
                    }}
                  />
                  <Package
                    size={26}
                    className="text-primary hidden items-center justify-center"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Ficha de Activo
                  </p>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight truncate">
                    {nombre || "Activo sin nombre"}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-muted-foreground bg-muted/60 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                      <Hash size={11} /> {codigo}
                    </span>
                    <EstatusBadge estatus={estatus} />
                  </div>
                </div>
              </div>

              {/* Logo cliente / bodega */}
              {data.meta?.isEnCliente && data.cliente_logo_url ? (
                <div className="shrink-0 flex items-center justify-center bg-white rounded-2xl border border-border/60 p-2 w-full sm:w-36 h-16">
                  <img
                    src={data.cliente_logo_url}
                    alt="Logo cliente"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : data.meta?.isEnBodega ? (
                <div className="shrink-0 flex items-center gap-2 bg-muted/60 dark:bg-slate-800/60 rounded-xl px-3 py-2">
                  <Factory size={16} className="text-muted-foreground" />
                  <span className="text-xs font-bold truncate">
                    {ubicacion_actual?.bodega || "—"}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="h-px bg-border/50" />

          {/* ── INFO CARDS ── */}
          <div className="p-5 sm:p-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted/40 dark:bg-slate-800/50 rounded-2xl p-4 space-y-2.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
                  Información del activo
                </p>
                <Row label="Modelo" value={modelo} />
                <Row label="Serie" value={serial_number} />
                <Row label="Tipo" value={tipo} />
                <Row
                  label="Registrado"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} className="text-muted-foreground/60" />
                      {formatDate(fecha_registro)}
                    </span>
                  }
                />
              </div>

              <div className="bg-muted/40 dark:bg-slate-800/50 rounded-2xl p-4 space-y-2.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
                  Ubicación actual
                </p>
                {ubicacion_actual ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={13} className="text-muted-foreground/60" />
                      <DestinoBadge tipo={ubicacion_actual.tipo_destino} />
                    </div>
                    {ubicacion_actual.tipo_destino === "Cliente" ? (
                      <>
                        <Row
                          label="Cliente"
                          value={
                            <span className="inline-flex items-center gap-1">
                              <Building2 size={12} className="text-muted-foreground/60" />
                              {ubicacion_actual.cliente}
                            </span>
                          }
                        />
                        <Row label="Site" value={ubicacion_actual.site} />
                      </>
                    ) : (
                      <Row label="Bodega" value={ubicacion_actual.bodega} />
                    )}
                    <Row label="Desde" value={formatDate(ubicacion_actual.desde)} />
                    {ubicacion_actual.motivo && (
                      <Row label="Motivo" value={ubicacion_actual.motivo} />
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground/70">
                    Sin ubicación activa registrada.
                  </p>
                )}
              </div>
            </div>

            {/* ── SOPORTE ── */}
            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/15 dark:border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3.5">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/15 shrink-0">
                  <Mail size={16} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground leading-snug">
                  ¿Tienes algún problema con este equipo? Aperturar un ticket de soporte por correo.
                </p>
              </div>
              <a
                href={emailHref}
                className="shrink-0 w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition-opacity">
                <Mail size={14} /> Reportar por correo
              </a>
            </div>
          </div>
        </div>
      </div>
    </OuterShell>
  );
}
