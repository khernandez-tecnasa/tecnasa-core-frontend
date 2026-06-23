import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Wrench, ArrowRight } from "lucide-react";
import { getOperacionActiva } from "@/services/operaciones.service";
import { useAuth } from "@/context/AuthContext";
import OperacionForm from "./OperacionForm";
import OperacionHeader from "./OperacionHeader";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";

export default function OperacionesPage() {
  const { userData, hasPermiso, checkingSession } = useAuth();
  const [searchParams] = useSearchParams();
  const vehiculoIdQR = searchParams.get("vehiculo_id");
  const [operacionActiva, setOperacionActiva] = useState(null);
  const [mantenimientoPendiente, setMantenimientoPendiente] = useState(null);
  // Cuando el empleado decide cerrar el regreso del vehículo de mantenimiento
  // desde el aviso de abajo, lo guardamos aquí para reutilizar exactamente
  // el mismo formulario de regreso que ya existe.
  const [regresoManualTarget, setRegresoManualTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const canView = isAdmin || !!hasPermiso("ver_vehiculos");
  const canViewEstacionamientos =
    isAdmin || !!hasPermiso("ver_estacionamientos");
  const canRegister = isAdmin || !!hasPermiso("registrar_uso");

  const loadOperacion = async () => {
    if (!userData?.id || !canView) return setLoading(false);
    setLoading(true);
    const data = await getOperacionActiva(userData.id);
    setOperacionActiva(data?.activa ?? null);
    setMantenimientoPendiente(data?.mantenimientoPendiente ?? null);
    setRegresoManualTarget(null);
    setLoading(false);
  };

  useEffect(() => {
    loadOperacion();
  }, [userData, canView]);

  if (checkingSession) return null;

  if (!canView)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 opacity-40">
          <Lock size={40} className="mx-auto" />
          <p className="font-semibold text-sm">Acceso denegado</p>
        </div>
      </div>
    );

  // El formulario de regreso/salida solo necesita UN registro "activo": o el
  // viaje normal bloqueante, o el de mantenimiento que el usuario eligió
  // cerrar explícitamente desde el aviso.
  const operacionParaFormulario = operacionActiva || regresoManualTarget;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-4 animate-in fade-in duration-500">
      <OperacionHeader operacionActiva={operacionParaFormulario} />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={22} />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground">
            Sincronizando estado…
          </p>
        </div>
      ) : (
        <>
          {mantenimientoPendiente && !operacionActiva && (
            <div className="flex items-center gap-3 p-4 bg-purple-50/80 border-2 border-purple-200/60 rounded-2xl dark:bg-purple-900/20 dark:border-purple-700/40">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                <Wrench size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-400">
                  Mantenimiento pendiente de regreso
                </p>
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 truncate">
                  {mantenimientoPendiente.placa} sigue en el taller
                </p>
              </div>
              {regresoManualTarget ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setRegresoManualTarget(null)}
                  className="shrink-0 rounded-xl font-bold">
                  Volver
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setRegresoManualTarget(mantenimientoPendiente)}
                  className="shrink-0 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1.5">
                  Registrar regreso
                  <ArrowRight size={13} />
                </Button>
              )}
            </div>
          )}

          <OperacionForm
            operacionActiva={operacionParaFormulario}
            refresh={loadOperacion}
            canViewEstacionamientos={canViewEstacionamientos}
            canRegister={canRegister}
            vehiculoIdPreseleccionado={vehiculoIdQR}
          />
        </>
      )}
    </div>
  );
}
