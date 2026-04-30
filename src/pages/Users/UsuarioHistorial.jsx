import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Users2, Loader2 } from "lucide-react";

import AuditTimeline from "@/components/ui/AuditTimeline";
import { getUsers } from "@/services/AuthServices";

const STATUS_CLASSES = {
  activo:   "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400",
  inactivo: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
};

function estadoClass(estatus) {
  const key = (estatus || "Activo").toLowerCase();
  return STATUS_CLASSES[key] || STATUS_CLASSES.inactivo;
}

export default function UsuarioHistorial() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [usuario, setUsuario] = useState(location.state?.usuario ?? null);
  const [loading, setLoading] = useState(!location.state?.usuario);

  useEffect(() => {
    if (usuario) return;
    let cancelled = false;
    getUsers()
      .then((raw) => {
        if (cancelled) return;
        const list = Array.isArray(raw) ? raw : [];
        const found = list.find((u) => String(u.id_usuario) === String(id));
        setUsuario(found ?? null);
      })
      .catch(() => setUsuario(null))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, usuario]);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/admin/usuarios")}
          className="mt-0.5 p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors text-muted-foreground hover:text-foreground shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <Users2 size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Historial del usuario
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
      ) : usuario ? (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-muted dark:bg-slate-800 flex items-center justify-center">
              <span className="text-lg font-black text-muted-foreground uppercase">
                {(usuario.nombre || usuario.username || "?")[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl font-black tracking-tight text-gray-900 dark:text-gray-100">
                  {usuario.nombre || usuario.username || "—"}
                </span>
                {usuario.estatus && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${estadoClass(usuario.estatus)}`}>
                    {usuario.estatus}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {usuario.email || "—"}
              </p>
              {usuario.username && (
                <p className="text-xs font-mono text-muted-foreground/60 mt-0.5">
                  @{usuario.username}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 text-center text-muted-foreground text-sm">
          Usuario no encontrado.
        </div>
      )}

      {/* ── Audit timeline ── */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6">
        <AuditTimeline entidad="usuario" entidadId={Number(id)} />
      </div>

    </div>
  );
}
