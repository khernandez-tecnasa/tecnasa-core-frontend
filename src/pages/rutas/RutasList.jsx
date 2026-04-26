import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Map,
  Calendar,
  Edit3,
  Trash2,
  Route,
  ChevronRight,
  Milestone,
  X,
  Loader2,
  AlertTriangle,
  MoreVertical,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { getRutas, getRuta, deleteRuta } from "@/services/rutas.service";
import { getPeajesByRuta } from "@/services/peajes.service";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import useIsMobile from "@/hooks/useIsMobile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const peajeIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="
      width:24px;
      height:24px;
      background:#6366f1;
      border:2px solid white;
      border-radius:20px;
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:0 2px 6px rgba(0,0,0,.25);
      color:white;
      font-size:14px;
      font-weight:bold;
    ">
      $
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function RutasList() {
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal peajes
  const [modalRuta, setModalRuta] = useState(null);
  const [modalPeajes, setModalPeajes] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Delete state
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();
  const { userData, hasPermiso } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const can = useCallback(
    (p) => isAdmin || hasPermiso(p),
    [isAdmin, hasPermiso],
  );

  const canView = can("read_ruta");
  const canCreate = can("create_ruta");
  const canEdit = can("update_ruta");
  const canDelete = can("delete_ruta");

  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const fetchRutas = async () => {
    if (!canView) return setLoading(false);
    setLoading(true);
    const data = await getRutas();
    if (!data) showToast("Error al cargar rutas", "danger");
    setRutas(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRutas();
  }, [canView]);

  const handleVerPeajes = async (rutaRow) => {
    setModalLoading(true);
    setModalRuta({ nombre: rutaRow.nombre, puntos: [] });
    setModalPeajes([]);

    let peajesDetectados = [];
    const ORS_API_KEY =
      "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjJhMjM2ZDc3NmVmYTQzNGJhMWI1Mzg4YmRjY2IxZmM0IiwiaCI6Im11cm11cjY0In0=";

    try {
      const rutaFull = await getRuta(rutaRow.id);
      const peajes = await getPeajesByRuta(rutaRow.id);

      peajesDetectados = peajes || [];
      let coordinates = null;

      const puntosValidos = rutaFull?.puntos || [];

      if (puntosValidos.length >= 2) {
        try {
          const bodyCoords = puntosValidos.map((p) => [
            Number(p.longitud),
            Number(p.latitud),
          ]);

          const response = await fetch(
            `https://api.openrouteservice.org/v2/directions/driving-car/geojson`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: ORS_API_KEY,
              },
              body: JSON.stringify({ coordinates: bodyCoords }),
            },
          );

          if (response.ok) {
            const data = await response.json();
            if (data.features?.[0]?.geometry?.coordinates) {
              coordinates = data.features[0].geometry.coordinates.map(
                (coord) => [coord[1], coord[0]],
              );

              peajesDetectados = (peajes || []).filter((peaje) => {
                return coordinates.some(([lat, lng]) => {
                  const dist = haversine(
                    lat,
                    lng,
                    Number(peaje.latitud),
                    Number(peaje.longitud),
                  );
                  return dist <= 400;
                });
              });
            }
          }
        } catch (err) {
          console.error("Falló OpenRouteService, usando línea recta:", err);
        }

        setModalRuta({
          nombre: rutaRow.nombre,
          puntos: puntosValidos,
          ruta_real: coordinates,
        });
      }

      setModalPeajes(peajesDetectados);
    } catch (error) {
      console.error("Error general:", error);
      showToast("Error al cargar la información de la ruta", "danger");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      const res = await deleteRuta(deleteTarget.id);

      if (res) {
        showToast("Ruta eliminada correctamente", "success");
        fetchRutas();
        setDeleteTarget(null);
      } else {
        showToast("No se pudo eliminar la ruta. Intenta de nuevo.", "danger");
      }
    } finally {
      setDeleting(false);
    }
  };

  const filteredRutas = rutas.filter((r) =>
    r.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Map size={48} className="mb-4 opacity-20" />
        <p>No tienes permisos para visualizar el catálogo de rutas.</p>
      </div>
    );
  }

  const AccionesMenu = ({ ruta }) => {
    return (
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

          {canEdit && (
            <DropdownMenuItem
              onClick={() => navigate(`edit/${ruta.id}`)}
              className="rounded-xl cursor-pointer gap-2 text-sm">
              <Edit3 size={13} /> Editar
            </DropdownMenuItem>
          )}

          {canDelete && (
            <DropdownMenuItem
              onClick={() => {
                setDeleteTarget(ruta);
              }}
              className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30 rounded-xl cursor-pointer gap-2 text-sm">
              <Trash2 size={13} /> Eliminar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      {/* HEADER & TOP ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Route className="text-primary" size={32} />
            RUTAS LOGÍSTICAS
          </h1>
          <p className="text-muted-foreground text-sm">
            Gestiona los trayectos y destinos de la flota en tiempo real.
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={() => navigate("/admin/rutas/new")}
            className="rounded-2xl px-5 h-10 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 gap-2 shrink-0">
            <Plus size={20} className="mr-2" /> Nueva Ruta
          </Button>
        )}
      </div>

      {/* FILTROS / TOOLBAR */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full max-w-xs group">
          <Search
            size={15}
            className="
              text-muted-foreground/50
              transition-colors pointer-events-none
              absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary
            "
          />
          <input
            type="text"
            placeholder="Buscar por nombre de ruta..."
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
            <span className="font-bold text-foreground">
              {filteredRutas.length}
            </span>
            {searchTerm
              ? ` de ${rutas.length}`
              : ` ruta${rutas.length !== 1 ? "s" : ""}`}
          </span>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={22} />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Cargando rutas...
            </p>
          </div>
        ) : filteredRutas.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="w-16 h-16 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
              <Map size={28} className="text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm">
                {searchTerm ? "Sin resultados" : "Sin rutas registradas"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchTerm
                  ? `No hay coincidencias para "${searchTerm}"`
                  : "Crea la primera ruta usando el botón de arriba"}
              </p>
            </div>
          </div>
        ) : isMobile ? (
          /* 📱 MOBILE VIEW (CARDS) */
          <div className="divide-y divide-border">
            {filteredRutas.map((ruta) => (
              <div
                key={ruta.id}
                className="p-5 active:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg leading-tight">
                    {ruta.nombre}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerPeajes(ruta)}
                      className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                      title="Ver peajes">
                      <Milestone size={18} />
                    </button>
                    <AccionesMenu ruta={ruta} />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 italic">
                  {ruta.descripcion || "Sin descripción detallada"}
                </p>

                <div className="flex items-center gap-4 text-[11px] font-bold uppercase text-muted-foreground bg-muted/50 p-3 rounded-xl">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-primary" />
                    {ruta.fecha_inicio
                      ? new Date(ruta.fecha_inicio).toLocaleDateString()
                      : "-"}
                  </div>
                  <ChevronRight size={12} />
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-primary" />
                    {ruta.fecha_fin
                      ? new Date(ruta.fecha_fin).toLocaleDateString()
                      : "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 💻 DESKTOP VIEW (TABLE) */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 dark:bg-slate-800/30">
                  {[
                    "Nombre de Ruta",
                    "Descripción",
                    "Vigencia",
                    "Peajes",
                    "",
                  ].map((h, i) => (
                    <th
                      key={i}
                      className={`px-6 py-3.5 ${i === 4 ? "text-right" : "text-left"}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                        {h}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRutas.map((ruta) => {
                  return (
                    <tr
                      key={ruta.id}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 shrink-0 rounded-xl bg-muted/60 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:ring-1 ring-primary/20 flex items-center justify-center transition-all duration-200">
                            <Map size={16} className="text-primary" />
                          </div>
                          <div>
                            <div className="font-bold text-sm">
                              {ruta.nombre || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative group max-w-[250px]">
                          <span className="text-sm text-muted-foreground block truncate italic">
                            {ruta.descripcion || "N/A"}
                          </span>

                          <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block bg-gray-900 text-white text-xs rounded-2xl px-2 py-1 z-10 shadow">
                            {ruta.descripcion || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap">
                          <Calendar size={12} className="text-primary" />
                          {ruta.fecha_inicio
                            ? new Date(ruta.fecha_inicio).toLocaleDateString()
                            : "-"}
                          <span className="opacity-30">|</span>
                          {ruta.fecha_fin
                            ? new Date(ruta.fecha_fin).toLocaleDateString()
                            : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleVerPeajes(ruta)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors"
                          title="Ver peajes de esta ruta">
                          <Milestone size={16} />
                        </button>
                      </td>
                      {/* <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <button
                              onClick={() =>
                                navigate(`/admin/rutas/edit/${ruta.id}`)
                              }
                              className="p-2 hover:bg-primary hover:text-white rounded-xl text-primary transition-all shadow-sm border border-primary/10"
                              title="Editar Ruta">
                              <Edit3 size={18} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteTarget(ruta)}
                              disabled={!!deletingId}
                              className="p-2 hover:bg-destructive hover:text-white rounded-xl text-destructive transition-all shadow-sm border border-destructive/10 disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Eliminar Ruta">
                              {deletingId === ruta.id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </button>
                          )}
                        </div>
                      </td> */}
                      <td className="px-6 py-4 text-right">
                        <AccionesMenu ruta={ruta} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRM DELETE DIALOG */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !deleting && setDeleteTarget(null)}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 dark:bg-red-500/15 rounded-2xl ring-1 ring-red-500/20 shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>

              <div>
                <h2 className="text-base font-black tracking-tight">
                  Eliminar Ruta
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  ¿Eliminar la ruta{" "}
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
                className="flex-1 rounded-2xl h-10 bg-red-500 hover:bg-red-600 text-white font-bold shadow-md gap-2 disabled:opacity-60">
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

      {/* MODAL PEAJES */}
      {modalRuta && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => setModalRuta(null)}>
          <div
            className="w-full max-w-2xl bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="font-black text-lg uppercase tracking-tight flex items-center gap-2">
                  <Milestone size={20} className="text-amber-500" />
                  {modalRuta.nombre}
                </h2>
                {!modalLoading && (
                  <p className="text-sm text-muted-foreground font-semibold mt-0.5">
                    {modalPeajes.length === 0
                      ? "Esta ruta no tiene peajes registrados"
                      : `Esta ruta pasa por ${modalPeajes.length} peaje${modalPeajes.length !== 1 ? "s" : ""}`}
                  </p>
                )}
              </div>
              <button
                onClick={() => setModalRuta(null)}
                className="p-2 hover:bg-muted rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>

            {modalLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="animate-spin text-primary" size={28} />
                <p className="text-sm text-muted-foreground">Cargando...</p>
              </div>
            ) : (
              <>
                {/* Mapa */}
                <div className="h-64 relative">
                  <MapContainer
                    center={
                      modalPeajes.length > 0
                        ? [
                            Number(modalPeajes[0].latitud),
                            Number(modalPeajes[0].longitud),
                          ]
                        : modalRuta.puntos.length > 0
                          ? [
                              Number(modalRuta.puntos[0].latitud),
                              Number(modalRuta.puntos[0].longitud),
                            ]
                          : [14.0723, -87.1921]
                    }
                    zoom={9}
                    style={{ height: "100%", width: "100%", zIndex: 0 }}
                    scrollWheelZoom={false}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {modalRuta.ruta_real?.length > 0 ? (
                      <Polyline
                        positions={modalRuta.ruta_real}
                        pathOptions={{
                          color: "#6366f1",
                          weight: 4,
                          opacity: 0.8,
                        }}
                      />
                    ) : modalRuta.puntos.length >= 2 ? (
                      <Polyline
                        positions={modalRuta.puntos.map((p) => [
                          Number(p.latitud),
                          Number(p.longitud),
                        ])}
                        pathOptions={{
                          color: "#6366f1",
                          weight: 4,
                          opacity: 0.5,
                          dashArray: "5, 5",
                        }}
                      />
                    ) : null}
                    {modalPeajes.map((p) => (
                      <Marker
                        key={p.id}
                        position={[Number(p.latitud), Number(p.longitud)]}
                        icon={peajeIcon}
                      />
                    ))}
                  </MapContainer>
                </div>

                {/* Lista de peajes */}
                {modalPeajes.length > 0 && (
                  <div className="px-6 py-4 space-y-2 max-h-48 overflow-y-auto">
                    {modalPeajes.map((p, i) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 p-3 bg-muted/40 border border-border rounded-2xl hover:bg-muted/60 transition">
                        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-black">
                          {i + 1}
                        </div>

                        <div className="flex-1">
                          <p className="font-bold text-sm">{p.nombre}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {Number(p.latitud).toFixed(5)},{" "}
                            {Number(p.longitud).toFixed(5)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="px-6 py-4 border-t flex justify-end">
              <Button
                variant="outline"
                onClick={() => setModalRuta(null)}
                className="rounded-2xl h-10 px-6">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
