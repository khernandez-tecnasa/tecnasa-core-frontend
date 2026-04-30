import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Milestone,
  Edit3,
  Trash2,
  MapPin,
  Loader2,
  AlertTriangle,
  MoreVertical,
  X,
  History,
} from "lucide-react";

import { getPeajes, deletePeaje } from "@/services/peajes.service";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import useIsMobile from "@/hooks/useIsMobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PeajesList() {
  const [peajes, setPeajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();
  const { userData, hasPermiso } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const can = useCallback(
    (p) => isAdmin || hasPermiso(p),
    [isAdmin, hasPermiso],
  );

  const canView = can("read_peaje");
  const canCreate = can("create_peaje");
  const canUpdate = can("update_peaje");
  const canDelete = can("delete_peaje");

  const fetchPeajes = useCallback(async () => {
    if (!canView) return setLoading(false);
    setLoading(true);
    const data = await getPeajes();
    if (!data) showToast("Error al cargar peajes", "danger");
    setPeajes(data || []);
    setLoading(false);
  }, [canView]);

  useEffect(() => {
    fetchPeajes();
  }, [fetchPeajes]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deletePeaje(deleteTarget.id);
      if (res) {
        showToast("Peaje eliminado", "success");
        fetchPeajes();
        setDeleteTarget(null);
      } else {
        showToast("Error al eliminar", "danger");
      }
    } finally {
      setDeleting(false);
    }
  };

  const filtered = peajes.filter((p) =>
    (p.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-muted-foreground">
        <div className="w-16 h-16 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
          <Milestone size={28} className="opacity-30" />
        </div>
        <p className="text-sm font-medium">
          No tienes permisos para visualizar los peajes.
        </p>
      </div>
    );
  }

  const AccionesMenu = ({ p }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-muted/80 rounded-xl transition-colors">
          <MoreVertical size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 rounded-2xl shadow-xl border-border/60">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
          Acciones
        </DropdownMenuLabel>

        {canUpdate && (
          <DropdownMenuItem
            onClick={() => navigate(`/admin/peajes/edit/${p.id}`)}
            className="rounded-xl cursor-pointer gap-2 text-sm">
            <Edit3 size={13} /> Editar
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={() => navigate(`/admin/peajes/historial/${p.id}`, { state: { peaje: p } })}
          className="rounded-xl cursor-pointer gap-2 text-sm">
          <History size={13} /> Historial
        </DropdownMenuItem>

        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteTarget(p)}
              className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30 rounded-xl cursor-pointer gap-2 text-sm">
              <Trash2 size={13} /> Eliminar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 shrink-0">
            <Milestone size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none">
              Peajes
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Puntos de cobro y paradas en las rutas logísticas.
            </p>
          </div>
        </div>

        {canCreate && (
          <Button
            onClick={() => navigate("/admin/peajes/new")}
            className="rounded-2xl px-5 h-10 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 gap-2 shrink-0">
            <Plus size={16} /> Nuevo Peaje
          </Button>
        )}
      </div>

      {/* TOOLBAR */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full max-w-xs group">
          <Search
            size={15}
            className="text-muted-foreground/50 transition-colors pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary"
          />
          <input
            type="text"
            placeholder="Buscar por nombre de peaje..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-8 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/50 shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-md transition-colors text-muted-foreground/60 hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>

        {!loading && (
          <span className="text-xs text-muted-foreground/70 font-medium whitespace-nowrap">
            <span className="font-bold text-foreground">{filtered.length}</span>
            {searchTerm
              ? ` de ${peajes.length}`
              : ` peaje${peajes.length !== 1 ? "s" : ""}`}
          </span>
        )}
      </div>

      {/* MAIN CARD */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={22} />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Cargando peajes...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="w-16 h-16 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
              <Milestone size={28} className="text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm">
                {searchTerm ? "Sin resultados" : "Sin peajes registrados"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchTerm
                  ? `No hay coincidencias para "${searchTerm}"`
                  : "Crea el primer peaje usando el botón de arriba"}
              </p>
            </div>
          </div>
        ) : isMobile ? (
          /* 📱 MOBILE VIEW (CARDS) */
          <div className="divide-y divide-border/50">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="p-4 flex items-center gap-3 hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                  <Milestone size={18} className="text-amber-600 dark:text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{p.nombre}</p>
                  <div className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-mono text-muted-foreground">
                    <MapPin size={10} className="text-primary shrink-0" />
                    {Number(p.latitud || 0).toFixed(5)},{" "}
                    {Number(p.longitud || 0).toFixed(5)}
                  </div>
                </div>
                <AccionesMenu p={p} />
              </div>
            ))}
          </div>
        ) : (
          /* 💻 DESKTOP VIEW (TABLE) */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 dark:bg-slate-800/30">
                  {["Nombre", "Coordenadas", ""].map((h, i) => (
                    <th
                      key={i}
                      className={`px-6 py-3.5 ${i === 2 ? "text-right" : i === 1 ? "text-center" : "text-left"}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                        {h}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-50 dark:bg-amber-500/10 group-hover:bg-amber-100 dark:group-hover:bg-amber-500/15 group-hover:ring-1 ring-amber-500/20 flex items-center justify-center transition-all duration-200">
                          <Milestone
                            size={16}
                            className="text-amber-600 dark:text-amber-500"
                          />
                        </div>
                        <span className="font-bold text-sm">{p.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-muted/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold">
                        <MapPin size={11} className="text-primary" />
                        {Number(p.latitud || 0).toFixed(5)},{" "}
                        {Number(p.longitud || 0).toFixed(5)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <AccionesMenu p={p} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRM DELETE MODAL */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !deleting && setDeleteTarget(null)}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/10 dark:bg-rose-500/15 rounded-2xl ring-1 ring-rose-500/20 shrink-0">
                <AlertTriangle size={20} className="text-rose-500" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">
                  Eliminar Peaje
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  ¿Eliminar el peaje{" "}
                  <span className="font-bold text-foreground">
                    "{deleteTarget.nombre}"
                  </span>
                  ? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="h-px bg-border/50" />

            <div className="flex gap-2.5">
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-2xl h-10 bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md gap-2 disabled:opacity-60">
                {deleting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                {deleting ? "Eliminando..." : "Eliminar"}
              </Button>

              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-2xl h-10 font-bold">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
