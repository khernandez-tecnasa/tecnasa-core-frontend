import { useEffect, useState } from "react";
import { getOperacionActiva } from "@/services/operaciones.service";
import { useAuth } from "@/context/AuthContext";
import OperacionForm from "./OperacionForm";
import OperacionHeader from "./OperacionHeader";
import { Loader2, Lock } from "lucide-react";

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 opacity-40">
          <Lock size={40} className="mx-auto" />
          <p className="font-semibold text-sm">Acceso denegado</p>
        </div>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-4 animate-in fade-in duration-500">
      <OperacionHeader operacionActiva={operacionActiva} />

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
        <OperacionForm
          operacionActiva={operacionActiva}
          refresh={loadOperacion}
          canViewEstacionamientos={canViewEstacionamientos}
          canRegister={canRegister}
        />
      )}
    </div>
  );
}
