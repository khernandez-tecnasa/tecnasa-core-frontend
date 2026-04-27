import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Loader2,
  Save,
  Send,
  CheckCircle,
  XCircle,
  BadgeCheck,
  Wallet,
  Car,
  User,
  Calendar,
  FileText,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  Receipt,
} from "lucide-react";

import {
  getLiquidacionByViaticoId,
  guardarLiquidacion,
  enviarRevisionLiquidacion,
  aprobarLiquidacion,
  rechazarLiquidacion,
  liquidarFinal,
} from "@/services/liquidaciones.service";
import { obtenerVehiculos } from "@/services/VehiculosService";
import { getEmpleados } from "@/services/AuthServices";

import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import useIsMobile from "@/hooks/useIsMobile";
import { exportLiquidacionExcel } from "@/utils/exportLiquidacionExcel";
import { sileo } from "sileo";

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPOS_GASTO = [
  "DESAYUNO",
  "ALMUERZO",
  "CENA",
  "HOSPEDAJE",
  "COMBUSTIBLE",
  "PEAJE",
  "IMPREVISTO",
];

const DETALLE_VACIO = {
  tipo: "IMPREVISTO",
  descripcion: "",
  cantidad: 1,
  precio_unitario: 0,
  fecha: "",
  comprobante_url: "",
};

// ─── Helper: Reglas de UI por rol y estado ────────────────────────────────────
//
// Centraliza qué puede ver o hacer cada rol según el estado actual.
// Recibe los permisos base del usuario (sin estado) y devuelve flags
// que el JSX consume directamente — sin condiciones dispersas.
//

function getUIRules(estado, userData, permisos) {
  if (!estado) {
    return {
      canEdit: false,
      canSend: false,
      canApprove: false,
      canReject: false,
      canLiquidate: false,
    };
  }
  const rol = (userData?.rol || "").toLowerCase();
  const isAdmin = rol === "admin";
  const isEmpleado = rol === "tecnico";
  const isSupervisor = rol === "supervisor";
  const isFinanzas = rol === "finanzas";

  if (isAdmin) {
    return {
      canEdit: true,
      canSend: true,
      canApprove: true,
      canReject: true,
      canLiquidate: true,
    };
  }

  if (estado === "Liquidado") {
    return {
      canEdit: false,
      canSend: false,
      canApprove: false,
      canReject: false,
      canLiquidate: false,
    };
  }

  // 🟡 EMPLEADO
  if (isEmpleado) {
    const editable = ["Borrador", "Pendiente", "Rechazado"].includes(estado);

    return {
      canEdit: editable,
      canSend: editable,
      canApprove: false,
      canReject: false,
      canLiquidate: false,
    };
  }

  // 🔵 SUPERVISOR
  if (isSupervisor) {
    return {
      canEdit: false,
      canSend: false,
      canApprove: estado === "Enviado",
      canReject: estado === "Enviado",
      canLiquidate: false,
    };
  }

  // 🟢 FINANZAS
  if (isFinanzas) {
    return {
      canEdit: false,
      canSend: false,
      canApprove: false,
      canReject: estado === "Aprobado",
      canLiquidate: estado === "Aprobado",
    };
  }

  // fallback
  return {
    canEdit: false,
    canSend: false,
    canApprove: false,
    canReject: false,
    canLiquidate: false,
  };
}

// ─── Helpers de formato ───────────────────────────────────────────────────────

const formatFecha = (str) => {
  if (!str) return "—";
  const d = str.split("T")[0];
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

const toInputDate = (str) => {
  if (!str) return "";
  return str.split("T")[0];
};

const formatLps = (amount) =>
  `L ${Number(amount || 0).toLocaleString("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getBadgeClass = (estado) => {
  switch (estado) {
    case "Borrador":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "Pendiente":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Enviado":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Aprobado":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Rechazado":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "Liquidado":
      return "bg-violet-100 text-violet-700 border-violet-200";
    default:
      return "bg-muted text-muted-foreground border-transparent";
  }
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function LiquidacionForm() {
  const { id: viaticoId } = useParams(); // /viaticos/:id/liquidar
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { userData, hasPermiso } = useAuth();
  const isMobile = useIsMobile();

  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const can = useCallback(
    (p) => isAdmin || hasPermiso(p),
    [isAdmin, hasPermiso],
  );

  // Permisos base del usuario, independientes del estado
  const canRead = can("read_liquidacion");
  const canEditPerm = can("update_liquidacion");
  const canApprovePerm = can("approve_liquidacion");
  const canLiquidarPerm = can("liquidar_liquidacion");

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liquidacion, setLiquidacion] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [observaciones, setObservaciones] = useState("");

  // modal de rechazo
  const [showRechazarModal, setShowRechazarModal] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [rechazandoSubmit, setRechazandoSubmit] = useState(false);

  // catálogos para el resumen
  const [empMap, setEmpMap] = useState({});
  const [vehMap, setVehMap] = useState({});

  const [exporting, setExporting] = useState(false);

  // ── Reglas de UI centralizadas ─────────────────────────────────────────────
  // Se recalculan cuando cambia el estado o los permisos del usuario.
  const uiRules = useMemo(
    () =>
      getUIRules(liquidacion?.estado, userData, {
        canEditPerm,
        canApprovePerm,
        canLiquidarPerm,
      }) || {
        canEdit: false,
        canSend: false,
        canApprove: false,
        canReject: false,
        canLiquidate: false,
      },
    [
      liquidacion?.estado,
      userData,
      canEditPerm,
      canApprovePerm,
      canLiquidarPerm,
    ],
  );
  // Bandera auxiliar para mostrar el aviso de "estado bloqueado" en la tabla
  const estadoBloqueado = ["Aprobado", "Liquidado"].includes(
    liquidacion?.estado,
  );

  // ── Carga ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!canRead) return setLoading(false);
    setLoading(true);
    try {
      const [data, emps, vehs] = await Promise.all([
        getLiquidacionByViaticoId(viaticoId),
        getEmpleados(),
        obtenerVehiculos(),
      ]);

      const em = {};
      (emps || []).forEach((e) => {
        em[e.id] = e.nombre;
      });
      setEmpMap(em);

      const vm = {};
      (vehs || []).forEach((v) => {
        vm[v.id] = v.placa;
      });
      setVehMap(vm);

      if (!data) {
        showToast("No se encontró la liquidación para este viático", "danger");
        navigate(-1);
        return;
      }

      setLiquidacion(data);
      setObservaciones(data.observaciones || "");

      if (data.detalles?.length) {
        setDetalles(
          data.detalles.map((d) => ({
            tipo: d.tipo,
            descripcion: d.descripcion || "",
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            fecha: toInputDate(d.fecha),
            comprobante_url: d.comprobante_url || "",
          })),
        );
      } else if (data.sugeridos?.length) {
        setDetalles(
          data.sugeridos.map((d) => ({
            tipo: d.tipo,
            descripcion: d.descripcion || "",
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            fecha: toInputDate(d.fecha),
            comprobante_url: "",
          })),
        );
      } else {
        setDetalles([{ ...DETALLE_VACIO }]);
      }
    } catch {
      showToast("Error al cargar la liquidación", "danger");
    } finally {
      setLoading(false);
    }
  }, [viaticoId, canRead]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Cálculos en vivo ──────────────────────────────────────────────────────
  const totalGastado = useMemo(
    () =>
      detalles.reduce(
        (acc, d) =>
          acc + (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0),
        0,
      ),
    [detalles],
  );

  const totalAsignado = Number(liquidacion?.total_asignado || 0);
  const diferencia = totalAsignado - totalGastado;

  // ── Gestión de detalles ───────────────────────────────────────────────────
  const handleDetalleChange = (idx, field, value) => {
    setDetalles((prev) =>
      prev.map((d, i) => (i !== idx ? d : { ...d, [field]: value })),
    );
  };

  const agregarFila = () => {
    const fecha = liquidacion?.fecha_salida
      ? toInputDate(liquidacion.fecha_salida)
      : "";
    setDetalles((prev) => [...prev, { ...DETALLE_VACIO, fecha }]);
  };

  const eliminarFila = (idx) => {
    if (detalles.length === 1)
      return showToast("Debe haber al menos un detalle", "warning");
    setDetalles((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Acciones ──────────────────────────────────────────────────────────────
  const buildPayload = () => ({
    observaciones: observaciones || null,
    detalles: detalles.map((d) => ({
      tipo: d.tipo,
      descripcion: d.descripcion || null,
      cantidad: Number(d.cantidad),
      precio_unitario: Number(d.precio_unitario),
      fecha: d.fecha,
      comprobante_url: d.comprobante_url || null,
    })),
  });

  const handleGuardar = async () => {
    if (!uiRules.canEdit) return;
    setSubmitting(true);
    try {
      await guardarLiquidacion(liquidacion.id, buildPayload());
      showToast("Liquidación guardada como borrador", "success");
      fetchData();
    } catch (err) {
      showToast(err.message || "Error al guardar", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnviar = async () => {
    if (!uiRules.canSend) return;
    if (!detalles.length)
      return showToast("Agrega al menos un detalle", "warning");
    if (!confirm("¿Enviar a revisión? Se notificará al supervisor.")) return;
    setSubmitting(true);
    try {
      // Guardar primero, luego enviar
      await guardarLiquidacion(liquidacion.id, buildPayload());
      await enviarRevisionLiquidacion(liquidacion.id);
      showToast("Liquidación enviada a revisión", "success");
      fetchData();
    } catch (err) {
      showToast(err.message || "Error al enviar", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAprobar = async () => {
    if (!uiRules.canApprove) return;
    if (!confirm("¿Aprobar esta liquidación?")) return;
    setSubmitting(true);
    try {
      await aprobarLiquidacion(liquidacion.id);
      showToast("Liquidación aprobada", "success");
      fetchData();
    } catch (err) {
      showToast(err.message || "Error al aprobar", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRechazarConfirm = async () => {
    if (!motivoRechazo.trim())
      return showToast("Ingresa el motivo de rechazo", "warning");
    setRechazandoSubmit(true);
    try {
      await rechazarLiquidacion(liquidacion.id, motivoRechazo);
      showToast("Liquidación rechazada", "success");
      setShowRechazarModal(false);
      setMotivoRechazo("");
      fetchData();
    } catch (err) {
      showToast(err.message || "Error al rechazar", "danger");
    } finally {
      setRechazandoSubmit(false);
    }
  };

  const handleLiquidar = async () => {
    if (!uiRules.canLiquidate) return;
    if (
      !confirm(
        "¿Confirmar liquidación final? Esta acción no se puede revertir.",
      )
    )
      return;
    setSubmitting(true);
    try {
      await liquidarFinal(liquidacion.id);
      showToast("¡Viático liquidado exitosamente!", "success");
      fetchData();
    } catch (err) {
      showToast(err.message || "Error al liquidar", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    if (!liquidacion) return;

    if (!detalles.length) {
      return sileo.error({
        title: "Sin datos",
        description: "No hay gastos para exportar.",
      });
    }

    const exportTask = async () => {
      setExporting(true);
      try {
        await exportLiquidacionExcel(
          { ...liquidacion, empleado_nombre: empMap[liquidacion.empleado_id] },
          detalles,
        );
      } finally {
        setExporting(false);
      }
    };

    sileo.promise(exportTask(), {
      loading: {
        title: "Generando Excel...",
        description: `${detalles.length} registros procesados`,
        fill: "black",
        styles: {
          title: "text-white!",
          description: "text-white/75!",
          badge: "bg-white/20!",
          button: "bg-white/10!",
        },
      },
      success: {
        title: "Excel listo",
        description: "Archivo descargado correctamente.",
        fill: "black",
        styles: {
          title: "text-white!",
          description: "text-white/75!",
          badge: "bg-white/20!",
          button: "bg-white/10!",
        },
      },
      error: {
        title: "Error al exportar",
        description: "Intenta nuevamente.",
        fill: "black",
        styles: {
          title: "text-white!",
          description: "text-white/75!",
          badge: "bg-white/20!",
          button: "bg-white/10!",
        },
      },
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  if (!canRead) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <Wallet size={40} className="mx-auto mb-4 opacity-20" />
        <p className="font-semibold">
          No tienes permisos para ver liquidaciones.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="animate-spin text-primary" size={36} />
        <p className="text-muted-foreground animate-pulse font-medium">
          Cargando liquidación...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-card border rounded-2xl p-4 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft size={20} /> VOLVER
        </button>
        <div className="text-right">
          <h1 className="text-xl font-black tracking-tighter uppercase flex items-center gap-2 justify-end">
            <Receipt size={22} className="text-primary" />
            Liquidación de Viático
          </h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            Viático #{viaticoId}
          </p>
        </div>
      </div>

      {/* ── RESUMEN VIÁTICO ────────────────────────────────────────────────── */}
      <div className="bg-card border rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 bg-muted/20 border-b flex items-center justify-between gap-3">
          <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
            <Info size={14} /> Resumen del Viático
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all
              ${
                exporting
                  ? "bg-muted text-muted-foreground cursor-not-allowed opacity-70"
                  : "bg-background hover:bg-muted"
              }`}>
              {exporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileText size={14} />
              )}
              {exporting ? "Generando..." : "Excel"}
            </button>

            {liquidacion?.estado && (
              <span
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${getBadgeClass(liquidacion.estado)}`}>
                {liquidacion.estado}
              </span>
            )}
          </div>
        </div>

        <div
          className={`p-5 grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-4"}`}>
          <InfoTile
            icon={<User size={15} />}
            label="Empleado"
            value={
              empMap[liquidacion?.empleado_id] ||
              `ID: ${liquidacion?.empleado_id || "—"}`
            }
          />
          <InfoTile
            icon={<Car size={15} />}
            label="Vehículo"
            value={
              vehMap[liquidacion?.vehiculo_id] ||
              `ID: ${liquidacion?.vehiculo_id || "—"}`
            }
          />
          <InfoTile
            icon={<Calendar size={15} />}
            label="Período"
            value={`${formatFecha(liquidacion?.fecha_salida)} → ${formatFecha(liquidacion?.fecha_regreso)}`}
          />
          <InfoTile
            icon={<FileText size={15} />}
            label="Motivo"
            value={liquidacion?.motivo_viaje || "Sin motivo"}
          />
        </div>

        <div
          className={`px-5 pb-5 grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
          <TotalTile
            label="Total Asignado"
            value={formatLps(totalAsignado)}
            variant="neutral"
          />
          <TotalTile
            label="Total Gastado"
            value={formatLps(totalGastado)}
            variant="primary"
          />
          <TotalTile
            label="Diferencia"
            value={formatLps(diferencia)}
            variant={diferencia >= 0 ? "success" : "danger"}
            hint={diferencia >= 0 ? "A favor" : "Exceso"}
          />
        </div>
      </div>

      {/* ── DETALLES DE GASTO ────────────────────────────────────────────────── */}
      <div className="bg-card border rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between bg-muted/20">
          <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
            <Receipt size={14} /> Detalles de Gastos Reales
          </h3>
          {uiRules?.canEdit && (
            <button
              type="button"
              onClick={agregarFila}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
              <Plus size={14} /> Agregar fila
            </button>
          )}
        </div>

        {/* Aviso cuando el estado impide cualquier modificación */}
        {estadoBloqueado && (
          <div className="mx-5 mt-5 flex items-center gap-2 text-[11px] bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-2.5">
            <AlertTriangle size={13} className="shrink-0" />
            <span>
              Esta liquidación está en estado{" "}
              <strong>{liquidacion?.estado}</strong> y no puede modificarse.
            </span>
          </div>
        )}

        {/* Tabla — desktop */}
        {!isMobile ? (
          <div className="overflow-x-auto px-5 pb-5 mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 rounded-xl">
                  <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground w-36">
                    Tipo
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Descripción
                  </th>
                  <th className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground w-20">
                    Cant.
                  </th>
                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground w-32">
                    P. Unit.
                  </th>
                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground w-28">
                    Total
                  </th>
                  <th className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground w-32">
                    Fecha
                  </th>
                  {uiRules?.canEdit && <th className="px-3 py-3 w-10" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {detalles.map((d, idx) => (
                  <DetalleRow
                    key={idx}
                    d={d}
                    idx={idx}
                    editable={uiRules?.canEdit}
                    onChange={handleDetalleChange}
                    onRemove={eliminarFila}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards — mobile */
          <div className="p-4 space-y-3">
            {detalles.map((d, idx) => (
              <DetalleCard
                key={idx}
                d={d}
                idx={idx}
                editable={uiRules?.canEdit}
                onChange={handleDetalleChange}
                onRemove={eliminarFila}
              />
            ))}
          </div>
        )}

        <div className="mx-5 mb-5 bg-muted/30 border rounded-2xl px-6 py-4 flex justify-between items-center">
          <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Total Gastado ({detalles.length} ítems)
          </span>
          <span className="text-xl font-black text-primary">
            {formatLps(totalGastado)}
          </span>
        </div>
      </div>

      {/* ── OBSERVACIONES ────────────────────────────────────────────────────── */}
      <div className="bg-card border rounded-3xl shadow-sm p-5 space-y-3">
        <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">
          Observaciones
        </h3>
        <textarea
          rows={3}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          disabled={!uiRules?.canEdit}
          placeholder="Notas o comentarios adicionales..."
          className="w-full rounded-xl border bg-muted/50 px-4 py-3 text-sm resize-none focus:ring-2 ring-primary/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* ── BARRA DE ACCIONES ─────────────────────────────────────────────────── */}
      <div
        className={`bg-card border rounded-3xl shadow-sm p-5 flex flex-wrap gap-3 ${isMobile ? "flex-col" : ""}`}>
        {/* Guardar borrador — empleado en estados editables */}
        {uiRules?.canEdit && (
          <Button
            onClick={handleGuardar}
            disabled={submitting}
            variant="outline"
            className="rounded-2xl h-11 flex-1 font-bold">
            {submitting ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Guardar Borrador
          </Button>
        )}

        {/* Enviar a revisión — empleado en estados editables */}
        {uiRules?.canSend && (
          <Button
            onClick={handleEnviar}
            disabled={submitting}
            className="rounded-2xl h-11 flex-1 font-bold shadow-lg shadow-primary/20">
            {submitting ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Send size={16} className="mr-2" />
            )}
            Enviar a Revisión
          </Button>
        )}

        {/* Aprobar — supervisor cuando está Enviado */}
        {uiRules?.canApprove && (
          <Button
            onClick={handleAprobar}
            disabled={submitting}
            className="rounded-2xl h-11 flex-1 font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
            <CheckCircle size={16} className="mr-2" /> Aprobar
          </Button>
        )}

        {/* Rechazar — supervisor (Enviado) o finanzas (Aprobado) */}
        {uiRules?.canReject && (
          <Button
            onClick={() => setShowRechazarModal(true)}
            disabled={submitting}
            variant="outline"
            className="rounded-2xl h-11 flex-1 font-bold border-rose-300 text-rose-600 hover:bg-rose-50">
            <XCircle size={16} className="mr-2" /> Rechazar
          </Button>
        )}

        {/* Liquidar final — finanzas cuando está Aprobado */}
        {uiRules?.canLiquidate && (
          <Button
            onClick={handleLiquidar}
            disabled={submitting}
            className="rounded-2xl h-11 flex-1 font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20">
            <BadgeCheck size={16} className="mr-2" /> Liquidar Final
          </Button>
        )}
      </div>

      {/* ── MODAL RECHAZO ─────────────────────────────────────────────────────── */}
      {showRechazarModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => !rechazandoSubmit && setShowRechazarModal(false)}>
          <div
            className="bg-card rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-90 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 rounded-2xl shrink-0">
                <AlertTriangle size={20} className="text-rose-600" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">
                  Rechazar Liquidación
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Indica el motivo para que el empleado pueda corregirla.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Motivo de Rechazo *
              </label>
              <textarea
                rows={3}
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                disabled={rechazandoSubmit}
                placeholder="Ej: Montos inconsistentes, faltan comprobantes..."
                className="w-full rounded-xl border bg-muted/50 px-4 py-3 text-sm resize-none focus:ring-2 ring-rose-300/50 outline-none transition-all disabled:opacity-60"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleRechazarConfirm}
                disabled={rechazandoSubmit || !motivoRechazo.trim()}
                className="flex-1 rounded-2xl h-10 bg-rose-600 hover:bg-rose-700 text-white">
                {rechazandoSubmit ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <XCircle size={16} className="mr-2" />
                )}
                {rechazandoSubmit ? "Rechazando..." : "Confirmar Rechazo"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRechazarModal(false);
                  setMotivoRechazo("");
                }}
                disabled={rechazandoSubmit}
                className="flex-1 rounded-2xl h-10">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function InfoTile({ icon, label, value }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </div>
      <p className="font-bold text-sm truncate" title={value}>
        {value}
      </p>
    </div>
  );
}

function TotalTile({ label, value, variant, hint }) {
  const colors = {
    neutral: "bg-muted/50 border-muted",
    primary: "bg-primary/5 border-primary/20",
    success: "bg-emerald-50 border-emerald-200",
    danger: "bg-rose-50 border-rose-200",
  };
  const textColors = {
    neutral: "text-foreground",
    primary: "text-primary",
    success: "text-emerald-700",
    danger: "text-rose-700",
  };

  return (
    <div className={`rounded-2xl border p-4 ${colors[variant]}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </p>
      <p className={`text-xl font-black ${textColors[variant]}`}>{value}</p>
      {hint && (
        <p
          className={`text-[10px] font-bold mt-0.5 ${textColors[variant]} opacity-70`}>
          {hint}
        </p>
      )}
    </div>
  );
}

function DetalleRow({ d, idx, editable, onChange, onRemove }) {
  const subtotal = (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0);

  return (
    <tr className="hover:bg-muted/10 transition-colors">
      <td className="px-3 py-2">
        <select
          value={d.tipo}
          disabled={!editable}
          onChange={(e) => onChange(idx, "tipo", e.target.value)}
          className="w-full bg-muted/50 border border-muted rounded-xl px-2 py-1.5 text-xs font-bold focus:border-primary outline-none appearance-none disabled:opacity-50">
          {TIPOS_GASTO.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={d.descripcion}
          disabled={!editable}
          placeholder="Opcional..."
          onChange={(e) => onChange(idx, "descripcion", e.target.value)}
          className="w-full bg-muted/50 border border-muted rounded-xl px-3 py-1.5 text-xs focus:border-primary outline-none disabled:opacity-50"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          min={1}
          value={d.cantidad}
          disabled={!editable}
          onChange={(e) => onChange(idx, "cantidad", e.target.value)}
          className="w-full bg-muted/50 border border-muted rounded-xl px-2 py-1.5 text-xs text-center font-bold focus:border-primary outline-none disabled:opacity-50"
        />
      </td>
      <td className="px-3 py-2">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">
            L
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={d.precio_unitario}
            disabled={!editable}
            onChange={(e) => onChange(idx, "precio_unitario", e.target.value)}
            className="w-full bg-muted/50 border border-muted rounded-xl pl-5 pr-2 py-1.5 text-xs text-right font-bold focus:border-primary outline-none disabled:opacity-50"
          />
        </div>
      </td>
      <td className="px-3 py-2 text-right">
        <span className="text-xs font-black">{`L ${subtotal.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`}</span>
      </td>
      <td className="px-3 py-2">
        <input
          type="date"
          value={d.fecha}
          disabled={!editable}
          onChange={(e) => onChange(idx, "fecha", e.target.value)}
          className="w-full bg-muted/50 border border-muted rounded-xl px-2 py-1.5 text-xs focus:border-primary outline-none disabled:opacity-50"
        />
      </td>
      {editable && (
        <td className="px-2 py-2 text-center">
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
            <Trash2 size={14} />
          </button>
        </td>
      )}
    </tr>
  );
}

function DetalleCard({ d, idx, editable, onChange, onRemove }) {
  const subtotal = (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0);

  return (
    <div className="border rounded-2xl p-4 space-y-3 bg-muted/10">
      <div className="flex justify-between items-center">
        <select
          value={d.tipo}
          disabled={!editable}
          onChange={(e) => onChange(idx, "tipo", e.target.value)}
          className="bg-muted/50 border border-muted rounded-xl px-3 py-1.5 text-xs font-bold focus:border-primary outline-none appearance-none disabled:opacity-50">
          {TIPOS_GASTO.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-primary">{`L ${subtotal.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`}</span>
          {editable && (
            <button
              onClick={() => onRemove(idx)}
              className="p-1.5 text-muted-foreground hover:text-rose-600 rounded-lg transition-all">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <input
        type="text"
        value={d.descripcion}
        disabled={!editable}
        placeholder="Descripción..."
        onChange={(e) => onChange(idx, "descripcion", e.target.value)}
        className="w-full bg-muted/50 border border-muted rounded-xl px-3 py-2 text-xs focus:border-primary outline-none disabled:opacity-50"
      />

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[9px] font-black uppercase text-muted-foreground">
            Cant.
          </label>
          <input
            type="number"
            min={1}
            value={d.cantidad}
            disabled={!editable}
            onChange={(e) => onChange(idx, "cantidad", e.target.value)}
            className="w-full bg-muted/50 border border-muted rounded-xl px-2 py-1.5 text-xs text-center font-bold focus:border-primary outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-[9px] font-black uppercase text-muted-foreground">
            P. Unit.
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={d.precio_unitario}
            disabled={!editable}
            onChange={(e) => onChange(idx, "precio_unitario", e.target.value)}
            className="w-full bg-muted/50 border border-muted rounded-xl px-2 py-1.5 text-xs text-right font-bold focus:border-primary outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-[9px] font-black uppercase text-muted-foreground">
            Fecha
          </label>
          <input
            type="date"
            value={d.fecha}
            disabled={!editable}
            onChange={(e) => onChange(idx, "fecha", e.target.value)}
            className="w-full bg-muted/50 border border-muted rounded-xl px-2 py-1.5 text-[10px] focus:border-primary outline-none disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}
