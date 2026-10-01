import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { endpoints } from "@/config/variables";

const POLL_INTERVAL_MS = 3000;

export default function RestoreMaintenanceOverlay() {
  const [restoreState, setRestoreState] = useState({
    active: false,
    isInitiator: false,
  });
  const overlayRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isRestoring = restoreState.active;
  const isInitiator = restoreState.isInitiator;

  useEffect(() => {
    let mounted = true;

    const checkRestoreStatus = async () => {
      try {
        const response = await fetch(endpoints.backupRestoreActive, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          if (mounted) setRestoreState({ active: false, isInitiator: false });
          return;
        }
        const data = await response.json();
        if (mounted) {
          setRestoreState({
            active: data.active === true,
            isInitiator: data.isInitiator === true,
          });
        }
      } catch {
        // Una falla de red no debe ocultar un bloqueo que ya estaba visible.
      }
    };

    void checkRestoreStatus();
    const intervalId = window.setInterval(checkRestoreStatus, POLL_INTERVAL_MS);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (isRestoring && isInitiator && location.pathname !== "/admin/backup") {
      navigate("/admin/backup", { replace: true });
    }
  }, [isInitiator, isRestoring, location.pathname, navigate]);

  useEffect(() => {
    if (!isRestoring) return undefined;

    overlayRef.current?.focus();
    const preventKeyboardActions = (event) => {
      if (["Tab", "Enter", " ", "Spacebar"].includes(event.key)) {
        event.preventDefault();
      }
    };
    document.addEventListener("keydown", preventKeyboardActions, true);
    return () => document.removeEventListener("keydown", preventKeyboardActions, true);
  }, [isRestoring]);

  // El iniciador sigue viendo el progreso en la pantalla de Backups, pero no
  // puede navegar a otro módulo mientras la restauración está activa.
  if (!isRestoring || isInitiator) return null;

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-5 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="restore-maintenance-title"
      aria-describedby="restore-maintenance-description">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-amber-300/25 bg-card shadow-2xl shadow-black/50 dark:bg-slate-900">
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
        <div className="p-7 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-500/15 ring-1 ring-amber-400/30">
            <ShieldAlert className="size-8 text-amber-500" aria-hidden="true" />
          </div>
          <h1 id="restore-maintenance-title" className="mt-5 text-xl font-black tracking-tight text-foreground">
            Restauración del sistema en curso
          </h1>
          <p id="restore-maintenance-description" className="mt-3 text-sm leading-6 text-muted-foreground">
            Estamos restaurando información de forma segura. Esta ventana se
            desbloqueará automáticamente al finalizar el proceso.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            No cierres ni realices acciones
          </div>
        </div>
      </section>
    </div>
  );
}
