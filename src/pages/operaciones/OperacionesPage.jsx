import { useEffect, useState } from "react";
import { getOperacionActiva } from "@/services/operaciones.service";
import { useAuth } from "@/context/AuthContext";
import OperacionForm from "./OperacionForm";
import OperacionHeader from "./OperacionHeader";
import { Loader2 } from "lucide-react";

export default function OperacionesPage() {
  const { userData, hasPermiso, checkingSession } = useAuth();
  const [operacionActiva, setOperacionActiva] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const canView = isAdmin || !!hasPermiso("ver_vehiculos");
  const canViewEstacionamientos =
    isAdmin || !!hasPermiso("ver_estacionamientos");
  const canRegister = isAdmin || !!hasPermiso("registrar_uso");

  const loadOperacion = async () => {
    if (!userData?.id || !canView) return setLoading(false);
    setLoading(true);
    const op = await getOperacionActiva(userData.id);
    setOperacionActiva(op);
    setLoading(false);
  };

  useEffect(() => {
    loadOperacion();
  }, [userData, canView]);

  if (checkingSession) return null;

  if (!canView)
    return <div className="p-10 text-center opacity-50">Acceso denegado</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-4">
        <OperacionHeader operacionActiva={operacionActiva} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
              <Loader2
                className="absolute inset-0 m-auto animate-spin text-primary"
                size={26}
              />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
              Sincronizando Estado
            </p>
          </div>
        ) : (
          <OperacionForm
            operacionActiva={operacionActiva}
            refresh={loadOperacion}
            canViewEstacionamientos={canViewEstacionamientos}
            canRegister={canRegister}
          />
        )}
      </div>
    </div>
  );
}
