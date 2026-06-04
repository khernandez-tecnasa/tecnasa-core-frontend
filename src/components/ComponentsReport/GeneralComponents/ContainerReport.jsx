// src/components/ComponentsReport/GeneralComponents/ContainerReport.jsx
import { lazy, Suspense, useMemo } from "react";
import { useLocation } from "react-router-dom";

// 🔌 Mapa de vistas → import perezoso
const registry = {
  // ── Existentes ──────────────────────────────────────────────────────────────
  "registros-uso":              lazy(() => import("../../../Reports/RegisterReport")),
  "vehiculos-uso":              lazy(() => import("../../../Reports/VehiculosMasUtilizados")),
  "empleados-actividad":        lazy(() => import("../../../Reports/EmpleadosMasSalidas")),
  "kilometraje-empleado":       lazy(() => import("../../../Reports/KilometrajePorEmpleado")),
  "ubicacion-vehiculo":         lazy(() => import("../../../Reports/RegistrosPorUbicacion")),
  "consumo-combustible-vehiculo": lazy(() => import("../../../Reports/ConsumoCombustibleVehiculo")),
  "activos-general":            lazy(() => import("../../../Reports/ActivosGeneral.jsx")),
  "clientes-sitios":            lazy(() => import("../../../Reports/ClientesSitos.jsx")),

  // ── Nuevos ──────────────────────────────────────────────────────────────────
  "viajes-duracion":    lazy(() => import("../../../Reports/ViajesDuracion.jsx")),
  "actividad-semanal":  lazy(() => import("../../../Reports/ActividadSemanal.jsx")),
  "reservas-estado":    lazy(() => import("../../../Reports/ReservasEstado.jsx")),
  "reservas-empleado":  lazy(() => import("../../../Reports/ReservasPorEmpleado.jsx")),
  "viaticos-estado":    lazy(() => import("../../../Reports/ViaticosEstado.jsx")),
  "viaticos-empleados": lazy(() => import("../../../Reports/ViaticosEmpleados.jsx")),
  "viaticos-tipo":      lazy(() => import("../../../Reports/ViaticosporTipo.jsx")),
  "activos-estado":     lazy(() => import("../../../Reports/ActivosEstado.jsx")),
  "bodegas-ocupacion":  lazy(() => import("../../../Reports/BodegasOcupacion.jsx")),
};

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function ContainerReport() {
  const qs = useQuery();
  const view = qs.get("view") || "registros-uso";
  const Report = useMemo(() => registry[view] || registry["registros-uso"], [view]);

  return (
    <div className="max-w-[1400px] mx-auto">
      <Suspense fallback={<ReportSkeleton />}>
        <Report />
      </Suspense>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-muted" />
        <div className="space-y-1.5">
          <div className="h-5 w-44 bg-muted rounded-xl" />
          <div className="h-3 w-28 bg-muted rounded-lg" />
        </div>
      </div>
      <div className="h-12 bg-muted rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-muted rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
