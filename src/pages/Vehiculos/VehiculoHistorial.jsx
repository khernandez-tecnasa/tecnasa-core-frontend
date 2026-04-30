import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Car, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import AuditTimeline from "@/components/ui/AuditTimeline";
import { obtenerVehiculos } from "@/services/VehiculosService";

/* ── Status badge ──────────────────────────────────────────────────── */

const STATUS_CLASSES = {
  disponible:
    "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400",
  en_uso:
    "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
  "en uso":
    "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
  en_mantenimiento:
    "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400",
  "en mantenimiento":
    "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400",
  reservado: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400",
  inactivo: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
};

function estadoClass(estado) {
  const key = (estado || "").toLowerCase().replace(/-/g, "_");
  return STATUS_CLASSES[key] || STATUS_CLASSES.inactivo;
}

function getCambios(valorAnterior = {}, valorNuevo = {}) {
  const cambios = [];

  const keys = new Set([
    ...Object.keys(valorAnterior || {}),
    ...Object.keys(valorNuevo || {}),
  ]);

  keys.forEach((key) => {
    const antes = valorAnterior?.[key];
    const despues = valorNuevo?.[key];

    if (antes !== despues) {
      cambios.push({
        campo: key,
        antes,
        despues,
      });
    }
  });

  return cambios;
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function VehiculoHistorial() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [vehiculo, setVehiculo] = useState(location.state?.vehiculo ?? null);
  const [loading, setLoading] = useState(!location.state?.vehiculo);
  const cambios = getCambios(log.valor_anterior, log.valor_nuevo);

  useEffect(() => {
    if (vehiculo) return;
    let cancelled = false;
    obtenerVehiculos()
      .then((raw) => {
        if (cancelled) return;
        const list = Array.isArray(raw)
          ? raw
          : (raw?.vehiculos ?? raw?.data ?? []);
        const found = list.find((x) => String(x.id) === String(id));
        setVehiculo(found ?? null);
      })
      .catch(() => setVehiculo(null))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, vehiculo]);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/admin/vehiculos")}
          className="mt-0.5 p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors text-muted-foreground hover:text-foreground shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <Car size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              {t("vehiculos.historial_title", "Historial del vehículo")}
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              {t(
                "vehiculos.historial_subtitle",
                "Registro de cambios y eventos",
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Vehicle info card ── */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-10 text-muted-foreground">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">
            {t("vehiculos.loading", "Cargando...")}
          </span>
        </div>
      ) : vehiculo ? (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-muted dark:bg-slate-800 flex items-center justify-center">
              <Car size={22} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl font-black tracking-tight text-gray-900 dark:text-gray-100">
                  {vehiculo.placa}
                </span>
                {vehiculo.estado && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${estadoClass(vehiculo.estado)}`}>
                    {vehiculo.estado}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(" · ")}
              </p>
              {vehiculo.nombre_ubicacion && (
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  {vehiculo.nombre_ubicacion}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 text-center text-muted-foreground text-sm">
          {t("vehiculos.not_found", "Vehículo no encontrado.")}
        </div>
      )}

      {/* ── Audit timeline ── */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6">
        <AuditTimeline entidad="vehiculo" entidadId={Number(id)} />
      </div>
    </div>
  );
}
