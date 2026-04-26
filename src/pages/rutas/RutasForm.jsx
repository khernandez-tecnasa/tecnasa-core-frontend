import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import {
  Save,
  ArrowLeft,
  GripVertical,
  Trash2,
  MapPin,
  Plus,
  Route,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteAutocomplete } from "@/components/rutas/Autocomplete";
import MapSelector from "@/components/rutas/MapSelector";
import { createRuta, updateRuta, getRuta } from "@/services/rutas.service";
import { getSites } from "@/services/SitesServices";

import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

export default function RutasForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const { showToast } = useToast();
  const { userData, hasPermiso } = useAuth();

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: "",
    puntos: [],
  });

  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const can = useCallback(
    (p) => isAdmin || hasPermiso(p),
    [isAdmin, hasPermiso],
  );

  const canCreate = can("create_ruta");
  const canEdit = can("update_ruta");

  const formatDateInput = (date) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const sitesData = await getSites();
        setSites(sitesData || []);

        if (isEdit) {
          const data = await getRuta(id);
          if (data) {
            setForm({
              nombre: data.nombre,
              descripcion: data.descripcion,
              fecha_inicio: formatDateInput(data.fecha_inicio),
              fecha_fin: formatDateInput(data.fecha_fin),
              puntos: data.puntos || [],
            });
          } else {
            showToast("No se encontró la ruta especificada", "danger");
            navigate("/admin/rutas");
          }
        }
      } catch (error) {
        showToast("Error al sincronizar con el servidor", "danger");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isEdit, navigate, showToast]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updatePunto = (index, field, value) => {
    setForm((prev) => {
      const nuevosPuntos = [...prev.puntos];
      nuevosPuntos[index] = { ...nuevosPuntos[index], [field]: value };
      return { ...prev, puntos: nuevosPuntos };
    });
  };

  const addPuntoDesdeMapa = (latlng) => {
    setForm((prev) => {
      const nuevoPunto = {
        orden: prev.puntos.length + 1,
        nombre_referencia: "",
        cliente_site_id: "",
        latitud: latlng.lat || "",
        longitud: latlng.lng || "",
      };
      return { ...prev, puntos: [...prev.puntos, nuevoPunto] };
    });
  };

  const removePunto = (index) => {
    const nuevosPuntos = form.puntos.filter((_, i) => i !== index);
    const reordenados = nuevosPuntos.map((p, i) => ({ ...p, orden: i + 1 }));
    setForm({ ...form, puntos: reordenados });
    showToast("Punto removido del itinerario", "info");
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(form.puntos);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    const finalPuntos = items.map((p, i) => ({ ...p, orden: i + 1 }));
    setForm({ ...form, puntos: finalPuntos });
  };

  const limpiarPayload = (form) => {
    return {
      nombre: form.nombre,
      descripcion: form.descripcion,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      puntos: form.puntos.map((p, i) => ({
        orden: i + 1,
        cliente_site_id: p.cliente_site_id || null,
        latitud: p.latitud,
        longitud: p.longitud,
        nombre_referencia: p.nombre_referencia || "",
      })),
    };
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Validaciones con mensajes específicos
    if (!form.nombre.trim())
      return showToast("No puedes dejar el nombre de la ruta vacío", "warning");

    if (!form.descripcion.trim())
      return showToast("No puedes dejar la descripción vacía", "warning");

    if (form.puntos.length < 2)
      return showToast(
        "Debes agregar al menos 2 puntos al itinerario",
        "warning",
      );

    const sinCoordenadas = form.puntos.findIndex(
      (p) => !p.latitud || !p.longitud,
    );
    if (sinCoordenadas !== -1)
      return showToast(
        `El punto ${sinCoordenadas + 1} no tiene coordenadas. Haz clic en el mapa o ingrésalas manualmente.`,
        "warning",
      );

    if (isEdit && !canEdit)
      return showToast("No tienes permiso para editar esta ruta", "danger");
    if (!isEdit && !canCreate)
      return showToast("No tienes permiso para crear rutas", "danger");

    setLoading(true);
    const payload = limpiarPayload(form);

    const res = isEdit
      ? await updateRuta(id, payload)
      : await createRuta(payload);
    setLoading(false);

    if (res) {
      showToast(
        isEdit ? "Ruta actualizada con éxito" : "Ruta guardada correctamente",
        "success",
      );
      navigate("/admin/rutas");
    } else {
      showToast("Hubo un error al procesar la solicitud", "danger");
    }
  };

  const inputCls = [
    "w-full rounded-xl border px-4 py-2.5 text-sm transition-all outline-none",
    "bg-background dark:bg-slate-900/60 placeholder:text-muted-foreground/50",
    "border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
  ].join(" ");

  // Label enriquecido para el autocomplete de sitios
  const getSiteLabel = (s) =>
    s
      ? [s?.nombre_ruta || s?.nombre, s?.descripcion, s?.cliente]
          .filter(Boolean)
          .join(" - ")
      : "";

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-in fade-in duration-500">
      {/* ── HEADER ── */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/admin/rutas")}
          className="mt-0.5 p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors text-muted-foreground hover:text-foreground shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <Route size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              {isEdit ? "Editar Ruta" : "Nueva Ruta Logística"}
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              {isEdit
                ? "Modifica los datos y el itinerario de la ruta"
                : "Completa la información y marca los puntos en el mapa"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── PANEL IZQUIERDO: CONFIGURACIÓN ── */}
        <div className="lg:col-span-5 space-y-6">
          {/* CARD: DATOS GENERALES */}
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-1">
              <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
                <Info size={15} className="text-muted-foreground" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Información base
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  Nombre descriptivo
                </label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Sula - San Lorenzo - Distribución"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  Descripción
                </label>
                <input
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Ej: Ruta de distribución zona norte"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={form.fecha_inicio}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    name="fecha_fin"
                    value={form.fecha_fin}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CARD: PUNTOS DE PARADA */}
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pb-1">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
                  <MapPin size={15} className="text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Itinerario
                  </h2>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    Arrastra para reordenar las paradas
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addPuntoDesdeMapa({ lat: "", lng: "" })}
                className="h-8 text-xs rounded-xl">
                <Plus size={12} className="mr-1" /> Parada Manual
              </Button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="itinerario">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3">
                    {form.puntos.map((p, i) => (
                      <Draggable
                        key={`punto-${i}`}
                        draggableId={`draggable-${i}`}
                        index={i}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                              snapshot.isDragging
                                ? "bg-background border-primary shadow-2xl scale-105 z-50"
                                : "bg-muted/20 dark:bg-slate-800/30 border-border/40 hover:border-border"
                            }`}>
                            <div
                              {...provided.dragHandleProps}
                              className="mt-2 text-muted-foreground/40 hover:text-primary cursor-grab active:cursor-grabbing">
                              <GripVertical size={20} />
                            </div>

                            <div className="flex-1 space-y-2 min-w-0">
                              <SiteAutocomplete
                                options={sites}
                                value={p.cliente_site_id}
                                getLabel={getSiteLabel}
                                onChange={(val) =>
                                  updatePunto(i, "cliente_site_id", val)
                                }
                              />

                              <span className="text-[9px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-lg">
                                ORDEN: {p.orden}
                              </span>

                              <div className="grid grid-cols-2 gap-2 mt-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
                                    Lat
                                  </span>
                                  <input
                                    type="number"
                                    step="0.0001"
                                    value={p.latitud || ""}
                                    onChange={(e) =>
                                      updatePunto(i, "latitud", e.target.value)
                                    }
                                    placeholder="0.0000"
                                    className="flex-1 min-w-0 bg-background dark:bg-slate-900/60 border border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20 rounded-lg px-2 py-1 text-[10px] font-mono outline-none transition-all"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
                                    Lng
                                  </span>
                                  <input
                                    type="number"
                                    step="0.0001"
                                    value={p.longitud || ""}
                                    onChange={(e) =>
                                      updatePunto(i, "longitud", e.target.value)
                                    }
                                    placeholder="0.0000"
                                    className="flex-1 min-w-0 bg-background dark:bg-slate-900/60 border border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20 rounded-lg px-2 py-1 text-[10px] font-mono outline-none transition-all"
                                  />
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removePunto(i)}
                              className="mt-1 p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {form.puntos.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-border/50 rounded-2xl">
                <MapPin
                  className="mx-auto text-muted-foreground/20 mb-2"
                  size={40}
                />
                <p className="text-xs text-muted-foreground">
                  Haz clic en el mapa para marcar puntos
                </p>
              </div>
            )}
          </div>

          {/* ── BOTONES DE ACCIÓN ── */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 sm:flex-none sm:min-w-[180px] rounded-2xl h-11 font-bold shadow-md shadow-primary/15 hover:shadow-primary/25 transition-all gap-2 disabled:opacity-60">
              {loading ? (
                "Procesando..."
              ) : (
                <>
                  <Save size={16} />
                  {isEdit ? "Guardar Cambios" : "Crear Ruta"}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/rutas")}
              disabled={loading}
              className="flex-1 sm:flex-none sm:min-w-[140px] rounded-2xl h-11 font-bold">
              Cancelar
            </Button>
          </div>
        </div>

        {/* ── PANEL DERECHO: MAPA ── */}
        <div className="lg:col-span-7 h-[calc(100vh-200px)] min-h-[500px] sticky top-[100px]">
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl overflow-hidden shadow-sm h-full">
            <MapSelector
              puntos={form.puntos}
              onAdd={addPuntoDesdeMapa}
              onRouteChange={({ distancia }) => {
                console.log("Distancia real:", distancia);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
