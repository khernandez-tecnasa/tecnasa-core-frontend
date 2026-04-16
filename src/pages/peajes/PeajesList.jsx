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
  FileText,
} from "lucide-react";

import { getPeajes, deletePeaje } from "@/services/peajes.service";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function PeajesList() {
  const [peajes, setPeajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const { showToast } = useToast();
  const { userData, hasPermiso } = useAuth();
  const navigate = useNavigate();

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

  const handleDelete = async (id) => {
    if (!canDelete) return showToast("No tienes permiso", "warning");
    if (!confirm("¿Eliminar este peaje definitivamente?")) return;
    const res = await deletePeaje(id);
    if (res) {
      showToast("Peaje eliminado", "success");
      fetchPeajes();
    } else {
      showToast("Error al eliminar", "danger");
    }
  };

  const filtered = peajes.filter((p) =>
    (p.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!canView)
    return <div className="p-10 text-center opacity-50">Acceso denegado</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Milestone className="text-primary" size={32} />
            PEAJES
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Puntos de cobro y paradas en las rutas logísticas.
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => navigate("/admin/peajes/new")}
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl px-6 h-12">
            <Plus size={20} className="mr-2" /> Nuevo Peaje
          </Button>
        )}
      </div>

      {/* FILTROS */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm flex gap-4 items-center">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por nombre de peaje..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-muted/50 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 ring-primary/20 transition-all outline-none"
          />
        </div>
        <div className="ml-auto text-[11px] text-muted-foreground font-semibold">
          {filtered.length} peaje{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-card border rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-muted-foreground text-sm">Cargando peajes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center">
            <FileText size={40} className="mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground font-semibold">
              No hay peajes registrados
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Coordenadas
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-all">
                          <Milestone size={20} />
                        </div>
                        <span className="font-bold">{p.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold">
                        <MapPin size={12} className="text-primary" />
                        {Number(p.latitud || 0).toFixed(5)},{" "}
                        {Number(p.longitud || 0).toFixed(5)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {canUpdate && (
                          <button
                            onClick={() =>
                              navigate(`/admin/peajes/edit/${p.id}`)
                            }
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                            title="Editar">
                            <Edit3 size={18} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Eliminar">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
