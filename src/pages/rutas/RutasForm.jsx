import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import {
  Save,
  X,
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

  // Label enriquecido para el autocomplete de sitios
  const getSiteLabel = (s) =>
    s
      ? [s?.nombre_ruta || s?.nombre, s?.descripcion, s?.cliente]
          .filter(Boolean)
          .join(" - ")
      : "";

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background/95 backdrop-blur sticky top-0 z-20 py-4 border-b">
        <div>
          <button
            onClick={() => navigate("/admin/rutas")}
            className="flex items-center text-xs font-bold text-muted-foreground hover:text-primary transition-colors mb-1">
            <ArrowLeft size={14} className="mr-1" /> VOLVER A LISTADO
          </button>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Route className="text-primary" />
            {isEdit ? "EDITAR RUTA" : "NUEVA RUTA LOGÍSTICA"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/rutas")}
            className="text-muted-foreground">
            <X size={18} className="mr-2" /> Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 px-6 shadow-lg shadow-primary/20">
            {loading ? (
              "Procesando..."
            ) : (
              <span className="flex items-center">
                <Save size={18} className="mr-2" />
                {isEdit ? "Guardar Cambios" : "Crear Ruta"}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* PANEL DE CONFIGURACIÓN (LADO IZQUIERDO) */}
        <div className="lg:col-span-5 space-y-6">
          {/* CARD: DATOS GENERALES */}
          <section className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
              <Info size={16} /> Información Base
            </h3>
            <div className="grid gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase">
                  Nombre descriptivo
                </label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Sula - San Lorenzo - Distribución"
                  className="w-full bg-muted/30 border border-transparent focus:border-primary/50 focus:bg-background rounded-xl px-4 py-2.5 transition-all outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase">
                  Descripción
                </label>
                <input
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Ej: Ruta de distribución zona norte"
                  className="w-full bg-muted/30 border border-transparent focus:border-primary/50 focus:bg-background rounded-xl px-4 py-2.5 transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={form.fecha_inicio}
                    onChange={handleChange}
                    className="w-full bg-muted/30 border-transparent rounded-xl px-3 py-2 text-sm focus:ring-1 ring-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    name="fecha_fin"
                    value={form.fecha_fin}
                    onChange={handleChange}
                    className="w-full bg-muted/30 border-transparent rounded-xl px-3 py-2 text-sm focus:ring-1 ring-primary outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* CARD: PUNTOS DE PARADA (DRAGGABLE) */}
          <section className="bg-card border rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold uppercase text-primary tracking-wider">
                  Itinerario
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Arrastra para reordenar las paradas
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addPuntoDesdeMapa({ lat: "", lng: "" })}
                className="h-8 text-xs">
                <Plus size={14} className="mr-1" /> Parada Manual
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
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                              snapshot.isDragging
                                ? "bg-background border-primary shadow-2xl scale-105 z-50"
                                : "bg-muted/20 border-transparent hover:border-border"
                            }`}>
                            <div
                              {...provided.dragHandleProps}
                              className="mt-2 text-muted-foreground/40 hover:text-primary cursor-grab active:cursor-grabbing">
                              <GripVertical size={20} />
                            </div>

                            <div className="flex-1 space-y-2 min-w-0">
                              {/* Selector de sitio con label enriquecido */}
                              <SiteAutocomplete
                                options={sites}
                                value={p.cliente_site_id}
                                getLabel={getSiteLabel}
                                onChange={(val) =>
                                  updatePunto(i, "cliente_site_id", val)
                                }
                              />

                              {/* Badge de orden */}
                              <span className="text-[9px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                                ORDEN: {p.orden}
                              </span>

                              {/* Coordenadas editables */}
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[8px] font-black uppercase text-muted-foreground shrink-0">
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
                                    className="flex-1 min-w-0 bg-muted/30 border border-transparent focus:border-primary/50 rounded-lg px-2 py-1 text-[10px] font-mono outline-none transition-colors"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[8px] font-black uppercase text-muted-foreground shrink-0">
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
                                    className="flex-1 min-w-0 bg-muted/30 border border-transparent focus:border-primary/50 rounded-lg px-2 py-1 text-[10px] font-mono outline-none transition-colors"
                                  />
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removePunto(i)}
                              className="mt-1 p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
              <div className="text-center py-10 border-2 border-dashed rounded-2xl">
                <MapPin
                  className="mx-auto text-muted-foreground/20 mb-2"
                  size={40}
                />
                <p className="text-xs text-muted-foreground">
                  Haz clic en el mapa para marcar puntos
                </p>
              </div>
            )}
          </section>
        </div>

        {/* PANEL DEL MAPA (LADO DERECHO) */}
        <div className="lg:col-span-7 h-[calc(100vh-200px)] min-h-[500px] sticky top-[100px]">
          <div className="bg-card border rounded-3xl overflow-hidden shadow-2xl h-full relative group">
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
