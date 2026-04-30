import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";

import AuditTimeline from "@/components/ui/AuditTimeline";
import { getRoles } from "@/services/RolesServices";

export default function RolHistorial() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [rol, setRol]         = useState(location.state?.rol ?? null);
  const [loading, setLoading] = useState(!location.state?.rol);

  useEffect(() => {
    if (rol) return;
    let cancelled = false;
    getRoles()
      .then((raw) => {
        if (cancelled) return;
        const list = Array.isArray(raw) ? raw : [];
        const found = list.find((r) => String(r.id) === String(id));
        setRol(found ?? null);
      })
      .catch(() => setRol(null))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, rol]);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/admin/roles")}
          className="mt-0.5 p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors text-muted-foreground hover:text-foreground shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <ShieldCheck size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Historial del rol
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Registro de cambios y eventos
            </p>
          </div>
        </div>
      </div>

      {/* ── Info card ── */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-10 text-muted-foreground">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Cargando...</span>
        </div>
      ) : rol ? (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-muted dark:bg-slate-800 flex items-center justify-center">
              <ShieldCheck size={22} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xl font-black tracking-tight capitalize text-gray-900 dark:text-gray-100">
                {rol.nombre || "—"}
              </span>
              {rol.descripcion && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {rol.descripcion}
                </p>
              )}
              <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">
                #{String(rol.id).padStart(4, "0")}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 text-center text-muted-foreground text-sm">
          Rol no encontrado.
        </div>
      )}

      {/* ── Audit timeline ── */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6">
        <AuditTimeline entidad="rol" entidadId={Number(id)} />
      </div>

    </div>
  );
}
