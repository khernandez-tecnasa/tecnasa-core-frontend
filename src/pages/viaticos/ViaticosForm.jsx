import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Car,
  User,
  Calendar,
  FileText,
  Save,
  ChevronLeft,
  Loader2,
  Info,
  MapPin,
  Plus,
  Trash2,
  Wand2,
  Receipt,
  Building2,
  Route,
  CalendarCheck,
  Milestone,
  ChevronDown,
  Check,
} from "lucide-react";

import {
  createViatico,
  getViatico,
  updateViatico,
} from "@/services/viaticos.service";
import { obtenerVehiculos } from "@/services/VehiculosService";
import { getEmpleados } from "@/services/AuthServices";
import { getSites } from "@/services/SitesServices";
import { getClientes } from "@/services/ClientesServices";
import { getRuta, getRutas } from "@/services/rutas.service";
import { getReservas } from "@/services/reservas.service";
import { getPeajesByRuta } from "@/services/peajes.service";

import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import useIsMobile from "@/hooks/useIsMobile";

// ─── Tipos válidos según el schema del backend ────────────────────────────────
const TIPOS_GASTO = [
  "DESAYUNO",
  "ALMUERZO",
  "CENA",
  "HOSPEDAJE",
  "COMBUSTIBLE",
  "PEAJE",
  "IMPREVISTO",
];

const PRECIOS_BASE = {
  DESAYUNO: 150,
  ALMUERZO: 200,
  CENA: 200,
  HOSPEDAJE: 1500,
};

const DETALLE_VACIO = {
  tipo: "DESAYUNO",
  descripcion: "",
  cantidad: 1,
  precio_unitario: PRECIOS_BASE.DESAYUNO,
  fecha: "",
};

function generarDetallesAuto(fechaInicio, fechaFin) {
  const detalles = [];
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  let current = new Date(inicio);

  while (current <= fin) {
    const fecha = current.toISOString().split("T")[0];
    detalles.push({
      tipo: "DESAYUNO",
      descripcion: "",
      cantidad: 1,
      precio_unitario: PRECIOS_BASE.DESAYUNO,
      fecha,
    });
    detalles.push({
      tipo: "ALMUERZO",
      descripcion: "",
      cantidad: 1,
      precio_unitario: PRECIOS_BASE.ALMUERZO,
      fecha,
    });
    detalles.push({
      tipo: "CENA",
      descripcion: "",
      cantidad: 1,
      precio_unitario: PRECIOS_BASE.CENA,
      fecha,
    });
    current.setDate(current.getDate() + 1);
  }

  const noches = Math.max(0, Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)));
  if (noches > 0) {
    detalles.push({
      tipo: "HOSPEDAJE",
      descripcion: "",
      cantidad: noches,
      precio_unitario: PRECIOS_BASE.HOSPEDAJE,
      fecha: fechaInicio,
    });
  }

  return detalles;
}

const formatLps = (amount) =>
  `L ${Number(amount || 0).toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatFecha = (str) => {
  if (!str) return "";
  return str.split("T")[0];
};

// ─── SearchableSelect ─────────────────────────────────────────────────────────
function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Buscar...",
  getLabel,
  renderOption,
  icon: Icon,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = value
    ? options.find((o) => String(o.id) === String(value))
    : null;

  const filtered = options.filter((o) =>
    getLabel(o).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            size={16}
          />
        )}
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-transform ${open ? "rotate-180" : ""}`}
          size={14}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={open ? query : selected ? getLabel(selected) : ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          className="w-full bg-background dark:bg-slate-900/60 border border-border rounded-xl pl-9 pr-8 py-2.5 text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
        />
        {/* {!open && selected && (
          <div className="absolute inset-0 left-9 right-8 flex items-center pointer-events-none">
            <span className="text-sm font-medium truncate">
              {getLabel(selected)}
            </span>
          </div>
        )} */}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border rounded-2xl shadow-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-4 text-sm text-center text-muted-foreground">
              Sin resultados
            </div>
          ) : (
            <div className="max-h-52 overflow-y-auto">
              {filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-2 transition-colors hover:bg-muted/60 ${String(value) === String(o.id) ? "bg-primary/10 text-primary" : ""}`}>
                  <Check
                    size={12}
                    className={`shrink-0 transition-opacity ${String(value) === String(o.id) ? "opacity-100" : "opacity-0"}`}
                  />
                  <div className="flex-1 min-w-0">
                    {renderOption ? (
                      renderOption(o)
                    ) : (
                      <span className="text-sm truncate">{getLabel(o)}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ViaticosForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const { userData, hasPermiso } = useAuth();
  const isMobile = useIsMobile();

  const isEdit = !!id;
  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const can = useCallback(
    (p) => isAdmin || hasPermiso(p),
    [isAdmin, hasPermiso],
  );
  const canAction = isEdit ? can("update_viatico") : can("create_viatico");

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(isEdit);

  const [vehiculos, setVehiculos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [sites, setSites] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [reservas, setReservas] = useState([]);

  const [peajesRuta, setPeajesRuta] = useState([]);
  const [loadingPeajes, setLoadingPeajes] = useState(false);

  const [form, setForm] = useState({
    empleado_id: "",
    vehiculo_id: "",
    fecha_salida: "",
    fecha_regreso: "",
    origen_site_id: "",
    destino_site_id: "",
    motivo_viaje: "",
    cliente_id: "",
    ruta_id: "",
    reserva_id: "",
  });

  const [detalles, setDetalles] = useState([{ ...DETALLE_VACIO }]);

  useEffect(() => {
    const init = async () => {
      try {
        const [vehs, emps, sts, clts, rts, ress] = await Promise.all([
          obtenerVehiculos(),
          getEmpleados(),
          getSites(),
          getClientes().catch(() => []),
          getRutas().catch(() => []),
          getReservas().catch(() => []),
        ]);
        setVehiculos(vehs || []);
        setEmpleados(emps || []);
        setSites(sts || []);
        setClientes(clts || []);
        setRutas(rts || []);
        setReservas(ress || []);
      } catch {
        showToast("Error al cargar catálogos", "danger");
      }

      if (isEdit) {
        const data = await getViatico(id);
        if (data) {
          setForm({
            empleado_id: data.empleado_id ?? "",
            vehiculo_id: data.vehiculo_id ?? "",
            fecha_salida: formatFecha(data.fecha_salida),
            fecha_regreso: formatFecha(data.fecha_regreso),
            origen_site_id: data.origen_site_id ?? "",
            destino_site_id: data.destino_site_id ?? "",
            motivo_viaje: data.motivo_viaje ?? "",
            cliente_id: data.cliente_id ?? "",
            ruta_id: data.ruta_id ?? "",
            reserva_id: data.reserva_id ?? "",
          });
          setDetalles(
            (data.detalles || []).map((d) => ({
              tipo: d.tipo,
              descripcion: d.descripcion || "",
              cantidad: d.cantidad,
              precio_unitario: d.precio_unitario,
              fecha: formatFecha(d.fecha),
            })),
          );
          setDetalles((prev) =>
            prev.filter((d) => d.tipo !== "PEAJE" || d.descripcion),
          );
          if (!data.detalles?.length) setDetalles([{ ...DETALLE_VACIO }]);
        } else {
          showToast("No se pudo cargar el viático", "danger");
          navigate("/admin/viaticos");
        }
        setDataLoading(false);
      }
    };
    init();
  }, [id, isEdit]);

  useEffect(() => {
    if (!form.ruta_id) {
      setPeajesRuta([]);
      return;
    }
    setLoadingPeajes(true);
    getPeajesByRuta(form.ruta_id).then((data) => {
      setPeajesRuta(data || []);
      setLoadingPeajes(false);
      if (!form.fecha_salida) return;
      if (data?.length) {
        const nuevos = data.map((p) => ({
          tipo: "PEAJE",
          descripcion: p.nombre,
          cantidad: 2,
          precio_unitario: Number(p.tarifa_liviano || 0),
          fecha: form.fecha_salida,
        }));
        setDetalles((prev) => {
          const sinPeajes = prev.filter((d) => d.tipo !== "PEAJE");
          return [...sinPeajes, ...nuevos];
        });
      }
    });
  }, [form.ruta_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Selección de RUTA → autocomplete motivo + limpiar reserva
  const handleRutaSelect = async (rutaId) => {
    const ruta = rutas.find((r) => String(r.id) === String(rutaId));
    let origen = "";
    let destino = "";
    if (rutaId) {
      const rutaFull = await getRuta(rutaId);
      const puntos = rutaFull?.puntos || [];
      origen = puntos[0]?.cliente_site_id || "";
      destino = puntos[puntos.length - 1]?.cliente_site_id || "";
    }
    setForm((prev) => ({
      ...prev,
      ruta_id: rutaId,
      origen_site_id: origen,
      destino_site_id: destino,
      fecha_salida: formatFecha(ruta?.fecha_inicio),
      fecha_regreso: formatFecha(ruta?.fecha_fin),
      motivo_viaje: ruta?.descripcion || prev.motivo_viaje,
    }));
  };

  const agregarPeajesADetalles = () => {
    if (!peajesRuta.length) return;
    const nuevos = peajesRuta.map((p) => ({
      tipo: "PEAJE",
      descripcion: p.nombre,
      cantidad: 2,
      precio_unitario: Number(p.tarifa_liviano || 0),
      fecha: form.fecha_salida,
    }));
    setDetalles((prev) => {
      const sinPeajes = prev.filter((d) => d.tipo !== "PEAJE");
      return [...sinPeajes, ...nuevos];
    });
  };

  // Selección de RESERVA → autocomplete fechas/empleado/vehiculo
  const handleReservaChange = (reservaId) => {
    const reserva = reservas.find((r) => String(r.id) === String(reservaId));
    setForm((prev) => ({
      ...prev,
      reserva_id: reservaId,
      ...(reserva && {
        fecha_salida: formatFecha(reserva.fecha_inicio),
        fecha_regreso: formatFecha(reserva.fecha_fin),
        empleado_id: reserva.empleado_id ?? prev.empleado_id,
        vehiculo_id: reserva.vehiculo_id ?? prev.vehiculo_id,
        motivo_viaje: reserva.motivo || prev.motivo_viaje,
      }),
    }));
  };

  const agregarDetalle = () => {
    const fecha = form.fecha_salida || "";
    setDetalles((prev) => [...prev, { ...DETALLE_VACIO, fecha }]);
  };

  const eliminarDetalle = (idx) => {
    if (detalles.length === 1)
      return showToast("Debe haber al menos un detalle de gasto", "warning");
    setDetalles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDetalleChange = (idx, field, value) => {
    setDetalles((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        const updated = { ...d, [field]: value };
        if (field === "tipo" && PRECIOS_BASE[value] !== undefined) {
          updated.precio_unitario = PRECIOS_BASE[value];
        }
        return updated;
      }),
    );
  };

  const handleAutoGenerar = () => {
    if (!form.fecha_salida || !form.fecha_regreso)
      return showToast("Ingresa fechas de salida y regreso primero", "warning");
    if (new Date(form.fecha_salida) > new Date(form.fecha_regreso))
      return showToast(
        "La fecha de salida no puede ser posterior al regreso",
        "warning",
      );
    if (detalles.length > 1 || detalles.some((d) => d.fecha || d.descripcion)) {
      if (!confirm("¿Reemplazar los detalles actuales con los automáticos?"))
        return;
    }
    const generados = generarDetallesAuto(
      form.fecha_salida,
      form.fecha_regreso,
    );
    setDetalles(generados);
    showToast(
      `${generados.length} detalles generados automáticamente`,
      "success",
    );
  };

  const totalPreview = useMemo(
    () =>
      detalles.reduce(
        (acc, d) =>
          acc + (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0),
        0,
      ),
    [detalles],
  );

  const validar = () => {
    if (!form.empleado_id) return "Selecciona un empleado";
    if (!form.vehiculo_id) return "Selecciona un vehículo";
    if (!form.fecha_salida || !form.fecha_regreso)
      return "Ingresa las fechas de viaje";
    if (new Date(form.fecha_salida) > new Date(form.fecha_regreso))
      return "La fecha de salida no puede ser posterior al regreso";
    if (detalles.length === 0) return "Agrega al menos un detalle de gasto";
    for (let i = 0; i < detalles.length; i++) {
      const d = detalles[i];
      if (!d.tipo) return `Fila ${i + 1}: selecciona un tipo`;
      if (!d.fecha) return `Fila ${i + 1}: ingresa la fecha del gasto`;
      if (Number(d.cantidad) < 1) return `Fila ${i + 1}: cantidad mínima es 1`;
      if (Number(d.precio_unitario) < 0)
        return `Fila ${i + 1}: precio no puede ser negativo`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validar();
    if (error) return showToast(error, "warning");
    if (!canAction)
      return showToast("No tienes permisos para esta acción", "warning");

    const payload = {
      empleado_id: Number(form.empleado_id),
      vehiculo_id: Number(form.vehiculo_id),
      fecha_salida: form.fecha_salida,
      fecha_regreso: form.fecha_regreso,
      origen_site_id: form.origen_site_id ? Number(form.origen_site_id) : null,
      destino_site_id: form.destino_site_id
        ? Number(form.destino_site_id)
        : null,
      motivo_viaje: form.motivo_viaje || null,
      cliente_id: form.cliente_id ? Number(form.cliente_id) : null,
      ruta_id: form.ruta_id ? Number(form.ruta_id) : null,
      reserva_id: form.reserva_id ? Number(form.reserva_id) : null,
      detalles: detalles.map((d) => ({
        tipo: d.tipo,
        descripcion: d.descripcion || null,
        cantidad: Number(d.cantidad),
        precio_unitario: Number(d.precio_unitario),
        fecha: d.fecha,
      })),
    };

    setLoading(true);
    const res = isEdit
      ? await updateViatico(id, payload)
      : await createViatico(payload);
    setLoading(false);

    if (res) {
      showToast(
        isEdit
          ? "Viático actualizado correctamente"
          : "Viático creado correctamente",
        "success",
      );
      navigate("/admin/viaticos");
    } else {
      showToast(
        "Hubo un error. Verifica los datos e inténtalo de nuevo.",
        "danger",
      );
    }
  };

  // Labels para SearchableSelect
  const getEmpleadoLabel = (e) =>
    [e.nombre, e.puesto].filter(Boolean).join(" — ");
  const getVehiculoLabel = (v) =>
    [v.placa, v.marca, v.modelo].filter(Boolean).join(" · ");
  const getRutaLabel = (r) =>
    [r.nombre, r.descripcion].filter(Boolean).join(" — ");
  const getClienteLabel = (c) => c.nombre || c.razon_social || "";
  const getSiteLabel = (s) =>
    [s.nombre, s.descripcion, s.cliente].filter(Boolean).join(" · ");
  const getReservaLabel = (r) =>
    r.motivo ? `${r.motivo} — ${r.estado || ""}` : `Reserva #${r.id}`;

  const inputCls =
    "w-full rounded-xl border px-4 py-2.5 text-sm transition-all outline-none bg-background dark:bg-slate-900/60 placeholder:text-muted-foreground/50 border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20";

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={22} />
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Cargando viático...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/admin/viaticos")}
          className="mt-0.5 p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors text-muted-foreground hover:text-foreground shrink-0">
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 shrink-0">
            <Receipt size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              {isEdit ? "Editar Viático" : "Nueva Solicitud de Viáticos"}
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              {isEdit
                ? "Modifica los datos de la solicitud"
                : "Completa la información para registrar una solicitud de viáticos"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── SECCIÓN 1: CONTEXTO ──────────────────────────────────────────── */}
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-1">
            <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
              <Info size={15} className="text-muted-foreground" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Contexto del Viaje
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CLIENTE */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Cliente (opcional)
              </label>
              <SearchableSelect
                options={[{ id: "", nombre: "Sin cliente" }, ...clientes]}
                value={form.cliente_id}
                onChange={(val) =>
                  handleFieldChange("cliente_id", val === "" ? "" : val)
                }
                placeholder="Buscar cliente..."
                getLabel={getClienteLabel}
                icon={Building2}
              />
            </div>

            {/* RUTA */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Ruta (opcional)
              </label>
              <SearchableSelect
                options={[
                  { id: "", nombre: "Sin ruta", descripcion: "" },
                  ...rutas,
                ]}
                value={form.ruta_id}
                onChange={(val) => handleRutaSelect(val === "" ? "" : val)}
                placeholder="Buscar ruta..."
                getLabel={(r) => r.nombre || "Sin ruta"}
                icon={Route}
                renderOption={(r) => (
                  <div>
                    <p className="text-sm font-bold">
                      {r.nombre || "Sin ruta"}
                    </p>
                    {r.descripcion && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {r.descripcion}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* RESERVA */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Reserva (opcional)
              </label>
              <SearchableSelect
                options={[
                  { id: "", motivo: "Sin reserva", estado: "" },
                  ...reservas.filter((r) => r.estado === "Reservado"),
                ]}
                value={form.reserva_id}
                onChange={(val) => handleReservaChange(val === "" ? "" : val)}
                placeholder="Buscar reserva..."
                getLabel={getReservaLabel}
                icon={CalendarCheck}
                renderOption={(r) => (
                  <div>
                    <p className="text-sm font-bold">
                      {r.motivo || "Sin reserva"}
                    </p>
                    {r.estado && (
                      <p className="text-[11px] text-muted-foreground">
                        {r.estado}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          {form.ruta_id && (
            <div className="flex items-start gap-2 text-[11px] bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 rounded-xl px-4 py-2.5">
              <Route size={13} className="mt-0.5 shrink-0" />
              <span>
                Motivo autocompletado desde la ruta seleccionada.
                {loadingPeajes
                  ? " Cargando peajes..."
                  : peajesRuta.length > 0
                    ? ` Esta ruta pasa por ${peajesRuta.length} peaje${peajesRuta.length !== 1 ? "s" : ""}: ${peajesRuta.map((p) => p.nombre).join(", ")}.`
                    : " Esta ruta no tiene peajes registrados."}
              </span>
            </div>
          )}
          {form.reserva_id && (
            <div className="flex items-start gap-2 text-[11px] bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl px-4 py-2.5">
              <CalendarCheck size={13} className="mt-0.5 shrink-0" />
              <span>
                Fechas, empleado y vehículo autocompletados desde la reserva
                seleccionada.
              </span>
            </div>
          )}
          {peajesRuta.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {peajesRuta.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 px-3 py-1 text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full">
                  <Milestone size={11} /> {p.nombre}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── SECCIÓN 2: ASIGNACIÓN ─────────────────────────────────────────── */}
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-1">
            <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
              <User size={15} className="text-muted-foreground" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Asignación de Personal y Vehículo
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* EMPLEADO */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Empleado Responsable
              </label>
              <SearchableSelect
                options={empleados}
                value={form.empleado_id}
                onChange={(val) => handleFieldChange("empleado_id", val)}
                placeholder="Buscar empleado..."
                getLabel={getEmpleadoLabel}
                icon={User}
                renderOption={(e) => (
                  <div>
                    <p className="text-sm font-bold">{e.nombre}</p>
                    {e.puesto && (
                      <p className="text-[11px] text-muted-foreground">
                        {e.puesto}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* VEHÍCULO */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Vehículo Asignado
              </label>
              <SearchableSelect
                options={vehiculos}
                value={form.vehiculo_id}
                onChange={(val) => handleFieldChange("vehiculo_id", val)}
                placeholder="Buscar por placa, marca..."
                getLabel={getVehiculoLabel}
                icon={Car}
                renderOption={(v) => (
                  <div>
                    <p className="text-sm font-bold">{v.placa}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {[v.marca, v.modelo].filter(Boolean).join(" ")}
                    </p>
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        {/* ── SECCIÓN 3: SITIOS Y FECHAS ────────────────────────────────────── */}
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-1">
            <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
              <MapPin size={15} className="text-muted-foreground" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Ruta y Período de Viaje
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Sitio de Origen (opcional)
              </label>
              <SearchableSelect
                options={[
                  {
                    id: "",
                    nombre: "Sin origen",
                    descripcion: "",
                    cliente: "",
                  },
                  ...sites,
                ]}
                value={form.origen_site_id}
                onChange={(val) =>
                  handleFieldChange("origen_site_id", val === "" ? "" : val)
                }
                placeholder="Buscar sitio de origen..."
                getLabel={getSiteLabel}
                icon={MapPin}
                renderOption={(s) => (
                  <div>
                    <p className="text-sm font-bold">
                      {s.nombre || "Sin origen"}
                    </p>
                    {(s.descripcion || s.cliente) && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {[s.descripcion, s.cliente].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Sitio de Destino (opcional)
              </label>
              <SearchableSelect
                options={[
                  {
                    id: "",
                    nombre: "Sin destino",
                    descripcion: "",
                    cliente: "",
                  },
                  ...sites,
                ]}
                value={form.destino_site_id}
                onChange={(val) =>
                  handleFieldChange("destino_site_id", val === "" ? "" : val)
                }
                placeholder="Buscar sitio de destino..."
                getLabel={getSiteLabel}
                icon={MapPin}
                renderOption={(s) => (
                  <div>
                    <p className="text-sm font-bold">
                      {s.nombre || "Sin destino"}
                    </p>
                    {(s.descripcion || s.cliente) && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {[s.descripcion, s.cliente].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Fecha de Salida
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  size={15}
                />
                <input
                  type="date"
                  name="fecha_salida"
                  value={form.fecha_salida}
                  onChange={handleChange}
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Fecha de Regreso
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  size={15}
                />
                <input
                  type="date"
                  name="fecha_regreso"
                  value={form.fecha_regreso}
                  onChange={handleChange}
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Motivo del Viaje (opcional)
              </label>
              <textarea
                name="motivo_viaje"
                placeholder="Ej: Visita técnica a cliente en Choluteca..."
                value={form.motivo_viaje}
                onChange={handleChange}
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        </div>

        {/* ── SECCIÓN 4: DETALLES DE GASTOS ──────────────────────────────────── */}
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
                <Receipt size={15} className="text-muted-foreground" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Detalles de Gastos
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAutoGenerar}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors">
                <Wand2 size={13} /> Auto-generar
              </button>
              <button
                type="button"
                onClick={agregarPeajesADetalles}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors">
                <Milestone size={13} /> Agregar peajes
              </button>
              <button
                type="button"
                onClick={agregarDetalle}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                <Plus size={13} /> Agregar fila
              </button>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground bg-muted/40 dark:bg-slate-800/40 rounded-xl px-4 py-2.5 border border-border/60">
            <strong>Auto-generar</strong> calcula Desayuno, Almuerzo, Cena y
            Hospedaje por cada día del viaje.
          </p>

          {/* TABLA DE DETALLES — desktop */}
          {!isMobile ? (
            <div className="border border-border/60 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20 dark:bg-slate-800/30">
                      <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 w-36">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                        Descripción
                      </th>
                      <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 w-24">
                        Cant.
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 w-32">
                        Precio Unit.
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 w-28">
                        Total
                      </th>
                      <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 w-32">
                        Fecha
                      </th>
                      <th className="px-4 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((d, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-border/30 last:border-0 hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-2">
                          <select
                            value={d.tipo}
                            onChange={(e) =>
                              handleDetalleChange(idx, "tipo", e.target.value)
                            }
                            className="w-full bg-background dark:bg-slate-900/60 border border-border rounded-xl px-2 py-1.5 text-xs font-bold focus:border-primary/60 outline-none transition-all appearance-none cursor-pointer">
                            {TIPOS_GASTO.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            placeholder="Opcional..."
                            value={d.descripcion}
                            onChange={(e) =>
                              handleDetalleChange(
                                idx,
                                "descripcion",
                                e.target.value,
                              )
                            }
                            className="w-full bg-background dark:bg-slate-900/60 border border-border rounded-xl px-3 py-1.5 text-xs focus:border-primary/60 outline-none transition-all"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={1}
                            value={d.cantidad}
                            onChange={(e) =>
                              handleDetalleChange(
                                idx,
                                "cantidad",
                                e.target.value,
                              )
                            }
                            className="w-full bg-background dark:bg-slate-900/60 border border-border rounded-xl px-3 py-1.5 text-xs text-center font-bold focus:border-primary/60 outline-none transition-all"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">
                              L
                            </span>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={d.precio_unitario}
                              onChange={(e) =>
                                handleDetalleChange(
                                  idx,
                                  "precio_unitario",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-background dark:bg-slate-900/60 border border-border rounded-xl pl-6 pr-3 py-1.5 text-xs text-right font-bold focus:border-primary/60 outline-none transition-all"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className="text-xs font-black">
                            {formatLps(
                              (Number(d.cantidad) || 0) *
                                (Number(d.precio_unitario) || 0),
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="date"
                            value={d.fecha}
                            onChange={(e) =>
                              handleDetalleChange(idx, "fecha", e.target.value)
                            }
                            className="w-full bg-background dark:bg-slate-900/60 border border-border rounded-xl px-2 py-1.5 text-xs focus:border-primary/60 outline-none transition-all"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => eliminarDetalle(idx)}
                            className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-muted/20 dark:bg-slate-800/30 border-t border-border/60 px-6 py-4 flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  Total Estimado ({detalles.length} ítems)
                </span>
                <span className="text-xl font-black text-primary">
                  {formatLps(totalPreview)}
                </span>
              </div>
            </div>
          ) : (
            /* DETALLES — mobile cards */
            <div className="space-y-3">
              {detalles.map((d, idx) => (
                <div
                  key={idx}
                  className="border border-border/60 rounded-2xl p-4 space-y-3 bg-muted/10 dark:bg-slate-800/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Ítem #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => eliminarDetalle(idx)}
                      className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Tipo
                      </label>
                      <select
                        value={d.tipo}
                        onChange={(e) =>
                          handleDetalleChange(idx, "tipo", e.target.value)
                        }
                        className="w-full bg-background dark:bg-slate-900/60 border border-border rounded-xl px-3 py-2 text-sm font-bold focus:border-primary/60 outline-none appearance-none cursor-pointer">
                        {TIPOS_GASTO.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={d.fecha}
                        onChange={(e) =>
                          handleDetalleChange(idx, "fecha", e.target.value)
                        }
                        className="w-full bg-background dark:bg-slate-900/60 border border-border rounded-xl px-3 py-2 text-sm focus:border-primary/60 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Descripción
                    </label>
                    <input
                      type="text"
                      placeholder="Opcional..."
                      value={d.descripcion}
                      onChange={(e) =>
                        handleDetalleChange(idx, "descripcion", e.target.value)
                      }
                      className="w-full bg-background dark:bg-slate-900/60 border border-border rounded-xl px-3 py-2 text-sm focus:border-primary/60 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={d.cantidad}
                        onChange={(e) =>
                          handleDetalleChange(idx, "cantidad", e.target.value)
                        }
                        className="w-full bg-background dark:bg-slate-900/60 border border-border rounded-xl px-3 py-2 text-sm text-center font-bold focus:border-primary/60 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Precio Unit.
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-muted-foreground">
                          L
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={d.precio_unitario}
                          onChange={(e) =>
                            handleDetalleChange(
                              idx,
                              "precio_unitario",
                              e.target.value,
                            )
                          }
                          className="w-full bg-background dark:bg-slate-900/60 border border-border rounded-xl pl-7 pr-3 py-2 text-sm text-right font-bold focus:border-primary/60 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-border/60">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                      Subtotal
                    </span>
                    <span className="font-black text-sm text-primary">
                      {formatLps(
                        (Number(d.cantidad) || 0) *
                          (Number(d.precio_unitario) || 0),
                      )}
                    </span>
                  </div>
                </div>
              ))}

              <div className="bg-muted/20 dark:bg-slate-800/30 border border-border/60 rounded-2xl px-5 py-4 flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  Total ({detalles.length} ítems)
                </span>
                <span className="text-xl font-black text-primary">
                  {formatLps(totalPreview)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── BOTONES ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1 justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none sm:min-w-[200px] rounded-2xl h-11 font-bold shadow-md shadow-primary/15 hover:shadow-primary/25 transition-all gap-2 disabled:opacity-60">
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {loading
              ? "Guardando..."
              : isEdit
                ? "Guardar Cambios"
                : "Crear Solicitud"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/viaticos")}
            disabled={loading}
            className="flex-1 sm:flex-none sm:min-w-[140px] rounded-2xl h-11 font-bold">
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
