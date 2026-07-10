// src/pages/Facturacion/PeriodoClienteWorkspace.jsx
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Building2,
  ChevronLeft,
  Upload,
  Loader2,
  AlertTriangle,
  Save,
  FileSpreadsheet,
  RefreshCcw,
  Plus,
  Trash2,
  Receipt,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

import {
  getEstadoPeriodoCliente,
  changePeriodoEstado,
  previsualizarLecturas,
  guardarLecturasDefinitivas,
  getReemplazosByPeriodo,
  createReemplazo,
  deleteReemplazo,
  getUltimoReemplazo,
  getContratosByCliente,
  getContratoItems,
} from "@/services/facturacion.service";
import { buscarActivos } from "@/services/ActivosServices";
import { getClientes } from "@/services/ClientesServices";

import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const ESTADO_CLASSES = {
  Nuevo: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  Abierto: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  "En Revision": "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  Aprobado: "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",
  Cerrado: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
};

function EstadoBadge({ estado }) {
  const cls = ESTADO_CLASSES[estado] || ESTADO_CLASSES.Nuevo;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase rounded-full border ${cls}`}>
      {estado}
    </span>
  );
}

const BLOQUEADOS_PARA_CARGA = ["En Revision", "Aprobado", "Cerrado"];

export default function PeriodoClienteWorkspace() {
  const { periodoId, clienteId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { userData, hasPermiso } = useAuth();

  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const can = useCallback((p) => isAdmin || hasPermiso(p), [isAdmin, hasPermiso]);
  const canIngenieria = can("gestion_ingenieria");
  const canFinanzas = can("gestion_finanzas");
  const canOperaciones = can("gestion_operaciones");

  const [clienteNombre, setClienteNombre] = useState("");
  const [estado, setEstado] = useState("Nuevo");
  const [loadingEstado, setLoadingEstado] = useState(true);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const [archivo, setArchivo] = useState(null);
  const [previewRows, setPreviewRows] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const fileInputRef = useRef(null);

  const [reemplazos, setReemplazos] = useState([]);
  const [loadingReemplazos, setLoadingReemplazos] = useState(true);
  const [openReemplazo, setOpenReemplazo] = useState(false);

  const notaKey = `nota_${periodoId}_${clienteId}`;
  const [notaFechas, setNotaFechas] = useState(() => localStorage.getItem(`nota_${periodoId}_${clienteId}`) || "");

  const handleNotaChange = (e) => {
    const val = e.target.value;
    setNotaFechas(val);
    localStorage.setItem(notaKey, val);
  };

  const bloqueado = BLOQUEADOS_PARA_CARGA.includes(estado);

  const loadEstado = useCallback(async () => {
    setLoadingEstado(true);
    try {
      const r = await getEstadoPeriodoCliente(periodoId, clienteId);
      setEstado(r.estado);
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setLoadingEstado(false);
    }
  }, [periodoId, clienteId]);

  const loadReemplazos = useCallback(async () => {
    setLoadingReemplazos(true);
    try {
      const data = await getReemplazosByPeriodo(periodoId, clienteId);
      setReemplazos(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setLoadingReemplazos(false);
    }
  }, [periodoId, clienteId]);

  useEffect(() => {
    loadEstado();
    loadReemplazos();
    getClientes()
      .then((arr) => {
        const c = (arr || []).find((x) => String(x.id) === String(clienteId));
        setClienteNombre(c?.nombre || `Cliente #${clienteId}`);
      })
      .catch(() => {});
  }, [loadEstado, loadReemplazos, clienteId]);

  const handlePrevisualizar = async () => {
    if (!archivo) return showToast("Selecciona un archivo Excel", "warning");
    setPreviewing(true);
    try {
      const rows = await previsualizarLecturas(archivo, clienteId);
      setPreviewRows(rows);
      showToast(`${rows.length} impresoras procesadas`, "success");
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setPreviewing(false);
    }
  };

  const updatePreviewField = (idTemp, field, value) => {
    setPreviewRows((rows) =>
      rows.map((r) => (r.id_temp === idTemp ? { ...r, [field]: value } : r))
    );
  };

  const handleGuardar = async () => {
    if (!previewRows || previewRows.length === 0) return;
    setGuardando(true);
    try {
      const lecturas = previewRows.map((r) => ({
        contrato_item_id: r.contrato_item_id,
        lectura_mono: Number(r.lectura_mono) || 0,
        lectura_color: Number(r.lectura_color) || 0,
        lectura_inicial_mono: r.primera_carga ? Number(r.lectura_inicial_mono ?? r.lectura_mono) || 0 : null,
        lectura_inicial_color: r.primera_carga ? Number(r.lectura_inicial_color ?? r.lectura_color) || 0 : null,
      }));
      const result = await guardarLecturasDefinitivas(periodoId, lecturas, clienteId);
      showToast(`${result.total} lecturas guardadas`, "success");
      setPreviewRows(null);
      setArchivo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Si estaba "Nuevo", al guardar lecturas pasa a "Abierto"
      if (estado === "Nuevo" && (canIngenieria || isAdmin)) {
        try {
          await changePeriodoEstado(periodoId, "Abierto", clienteId);
        } catch {
          // si falla el cambio automático no es crítico, solo no se actualiza el badge
        }
      }
      loadEstado();
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (nuevo) => {
    setCambiandoEstado(true);
    try {
      await changePeriodoEstado(periodoId, nuevo, clienteId);
      showToast(`Estado actualizado a ${nuevo}`, "success");
      loadEstado();
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setCambiandoEstado(false);
    }
  };

  const faltantesCount = useMemo(
    () => (previewRows || []).filter((r) => String(r.estado).startsWith("FALTANTE")).length,
    [previewRows]
  );

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      <div>
        <Link
          to={`/admin/facturacion/periodos/${periodoId}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ChevronLeft size={16} /> Volver a clientes del período
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shrink-0">
              <Building2 size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
                {clienteNombre}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                {loadingEstado ? (
                  <Loader2 size={12} className="animate-spin text-muted-foreground" />
                ) : (
                  <EstadoBadge estado={estado} />
                )}
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate(`/admin/facturacion/periodos/${periodoId}/cliente/${clienteId}/reporte`)}
            className="rounded-2xl gap-2 font-bold shrink-0">
            <Receipt size={15} /> Ver Reporte
          </Button>
        </div>
      </div>

      {/* ── CAMBIO DE ESTADO ── */}
      <EstadoActions
        estado={estado}
        canIngenieria={canIngenieria}
        canFinanzas={canFinanzas}
        canOperaciones={canOperaciones}
        cambiando={cambiandoEstado}
        onChange={cambiarEstado}
      />

      {/* ── NOTA DE LECTURA ── */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm px-5 md:px-6 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            Lectura de contadores correspondientes al período del
          </span>
          <input
            value={notaFechas}
            onChange={handleNotaChange}
            disabled={bloqueado}
            placeholder="23/02 al 22/03/2026"
            className="flex-1 min-w-[180px] rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-1.5 text-xs outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {bloqueado && notaFechas && (
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wide">bloqueado</span>
          )}
        </div>
      </div>

      {/* ── CARGA DE LECTURAS ── */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-muted dark:bg-slate-800">
            <FileSpreadsheet size={16} className="text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight">Cargar lecturas (Excel)</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sube el reporte de contadores exportado del software de monitoreo
            </p>
          </div>
        </div>

        {bloqueado ? (
          <div className="bg-muted/40 dark:bg-slate-800/50 rounded-2xl p-4 text-sm text-muted-foreground">
            El período está en estado <b>{estado}</b> — para cargar nuevas lecturas primero debe regresarse a "Abierto".
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                className="flex-1 text-sm rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 outline-none focus:border-primary/60 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:px-3 file:py-1.5 file:text-xs file:font-bold"
              />
              <Button
                onClick={handlePrevisualizar}
                disabled={!archivo || previewing}
                className="rounded-xl gap-2 font-bold shrink-0 disabled:opacity-60">
                {previewing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {previewing ? "Procesando..." : "Previsualizar"}
              </Button>
            </div>

            {previewRows && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {previewRows.length} impresora{previewRows.length !== 1 ? "s" : ""}
                    {faltantesCount > 0 && (
                      <span className="text-amber-600 dark:text-amber-400"> · {faltantesCount} sin lectura en el Excel (llenar manual)</span>
                    )}
                  </p>
                  <button
                    onClick={() => { setPreviewRows(null); setArchivo(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <RefreshCcw size={11} /> Descartar
                  </button>
                </div>

                <div className="border border-border/60 rounded-2xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 dark:bg-slate-800/40 border-b border-border/60">
                        {["Serial", "Modelo", "Lectura Mono", "Lectura Color", "Inicial Mono", "Inicial Color", "Estado"].map((h) => (
                          <th key={h} className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((r) => {
                        const faltante = String(r.estado).startsWith("FALTANTE");
                        const tieneReemplazo = reemplazos.some((rp) => rp.contrato_item_id === r.contrato_item_id);
                        return (
                          <tr key={r.id_temp} className={`border-b border-border/30 last:border-0 ${faltante ? "bg-amber-50/60 dark:bg-amber-950/20" : ""}`}>
                            <td className="px-3 py-2 font-mono text-xs">
                              {r.serial}
                              {tieneReemplazo && (
                                <span
                                  title="Esta impresora tuvo un reemplazo temporal este período — la lectura aquí debe ser PARCIAL (hasta el día del cambio), no la del mes completo."
                                  className="ml-1.5 inline-flex items-center px-1.5 py-0.5 text-[9px] font-black uppercase rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                                  Parcial
                                </span>
                              )}
                              {r.primera_carga && (
                                <span
                                  title="Primera lectura registrada de esta impresora — no se cobrará uso este mes, la lectura inicial se vuelve el punto de partida."
                                  className="ml-1.5 inline-flex items-center px-1.5 py-0.5 text-[9px] font-black uppercase rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                                  Primera carga
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs">{r.modelo}</td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={r.lectura_mono}
                                onChange={(e) => updatePreviewField(r.id_temp, "lectura_mono", e.target.value)}
                                className="w-24 rounded-lg border border-border bg-background dark:bg-slate-900/60 px-2 py-1 text-xs outline-none focus:border-primary/60"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={r.lectura_color}
                                onChange={(e) => updatePreviewField(r.id_temp, "lectura_color", e.target.value)}
                                className="w-24 rounded-lg border border-border bg-background dark:bg-slate-900/60 px-2 py-1 text-xs outline-none focus:border-primary/60"
                              />
                            </td>
                            <td className="px-3 py-2">
                              {r.primera_carga ? (
                                <input
                                  type="number"
                                  value={r.lectura_inicial_mono ?? r.lectura_mono}
                                  onChange={(e) => updatePreviewField(r.id_temp, "lectura_inicial_mono", e.target.value)}
                                  className="w-24 rounded-lg border border-sky-300 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/30 px-2 py-1 text-xs outline-none focus:border-primary/60"
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {r.primera_carga ? (
                                <input
                                  type="number"
                                  value={r.lectura_inicial_color ?? r.lectura_color}
                                  onChange={(e) => updatePreviewField(r.id_temp, "lectura_inicial_color", e.target.value)}
                                  className="w-24 rounded-lg border border-sky-300 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/30 px-2 py-1 text-xs outline-none focus:border-primary/60"
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`text-[10px] font-bold uppercase ${faltante ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                {r.estado}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Button onClick={handleGuardar} disabled={guardando} className="rounded-2xl h-10 font-bold gap-2 disabled:opacity-60">
                  {guardando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {guardando ? "Guardando..." : "Guardar lecturas definitivas"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── REEMPLAZOS TEMPORALES ── */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-muted dark:bg-slate-800">
              <RefreshCcw size={16} className="text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Reemplazos temporales</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cuando una impresora de respaldo cubrió a una dañada, sus copias se suman aquí
              </p>
            </div>
          </div>
          {!bloqueado && (
            <Button size="sm" variant="outline" onClick={() => setOpenReemplazo(true)} className="rounded-xl gap-1.5 text-xs font-bold h-8 shrink-0">
              <Plus size={13} /> Nuevo
            </Button>
          )}
        </div>

        {loadingReemplazos ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="animate-spin text-primary" size={18} />
          </div>
        ) : reemplazos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin reemplazos registrados en este período</p>
        ) : (
          <div className="space-y-2">
            {reemplazos.map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-muted/40 dark:bg-slate-800/50 rounded-xl p-3">
                <div className="flex-1 min-w-0 text-sm">
                  <p className="font-semibold truncate">
                    {r.serial_titular} <ArrowRight size={11} className="inline mx-1 text-muted-foreground" /> {r.serial_backup}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Mono: +{r.uso_calculado ?? 0} · Color: +{r.uso_calculado_color ?? 0}
                  </p>
                </div>
                {!bloqueado && (
                  <button
                    onClick={async () => {
                      if (!confirm("¿Eliminar este reemplazo?")) return;
                      try {
                        await deleteReemplazo(r.id);
                        showToast("Reemplazo eliminado", "success");
                        loadReemplazos();
                      } catch (err) {
                        showToast(err.message, "danger");
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-colors shrink-0">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {openReemplazo && (
        <NuevoReemplazoModal
          periodoId={periodoId}
          clienteId={clienteId}
          onClose={() => setOpenReemplazo(false)}
          onCreated={() => {
            setOpenReemplazo(false);
            loadReemplazos();
          }}
        />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Botones de cambio de estado, según rol y estado actual
────────────────────────────────────────────────────────────────────────── */

function EstadoActions({ estado, canIngenieria, canFinanzas, canOperaciones, cambiando, onChange }) {
  const botones = [];

  if (estado === "Abierto" && canIngenieria) {
    botones.push({ label: "Enviar a Revisión", target: "En Revision", icon: ArrowRight });
  }
  if (estado === "En Revision") {
    if (canOperaciones) botones.push({ label: "Aprobar", target: "Aprobado", icon: ArrowRight });
    if (canIngenieria) botones.push({ label: "Regresar a Abierto", target: "Abierto", icon: RotateCcw, variant: "outline" });
  }
  if (estado === "Aprobado") {
    if (canOperaciones) botones.push({ label: "Cerrar período", target: "Cerrado", icon: ArrowRight });
    if (canFinanzas) botones.push({ label: "Devolver a Revisión", target: "En Revision", icon: RotateCcw, variant: "outline" });
  }
  if (estado === "Cerrado" && canOperaciones) {
    botones.push({ label: "Reabrir (Admin/Operaciones)", target: "Abierto", icon: RotateCcw, variant: "outline" });
  }

  if (botones.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {botones.map((b) => (
        <Button
          key={b.target + b.label}
          size="sm"
          variant={b.variant || "default"}
          disabled={cambiando}
          onClick={() => onChange(b.target)}
          className="rounded-xl gap-1.5 text-xs font-bold disabled:opacity-60">
          {cambiando ? <Loader2 size={13} className="animate-spin" /> : <b.icon size={13} />}
          {b.label}
        </Button>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MODAL: Nuevo reemplazo temporal
────────────────────────────────────────────────────────────────────────── */

function NuevoReemplazoModal({ periodoId, clienteId, onClose, onCreated }) {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [buscarTitular, setBuscarTitular] = useState("");

  const [activos, setActivos] = useState([]);
  const [loadingActivos, setLoadingActivos] = useState(false);
  const [buscarBackup, setBuscarBackup] = useState("");
  const [activoSel, setActivoSel] = useState(null);

  const [itemId, setItemId] = useState("");
  const [fechaCambio, setFechaCambio] = useState("");
  const [lecturaInicial, setLecturaInicial] = useState("0");
  const [lecturaFinal, setLecturaFinal] = useState("0");
  const [lecturaInicialColor, setLecturaInicialColor] = useState("0");
  const [lecturaFinalColor, setLecturaFinalColor] = useState("0");
  const [buscandoAnterior, setBuscandoAnterior] = useState(false);
  const [saving, setSaving] = useState(false);

  // Impresoras titulares del cliente: son pocas, se cargan completas una
  // vez y se filtran en el navegador por serial/código/modelo.
  useEffect(() => {
    (async () => {
      try {
        const contratos = await getContratosByCliente(clienteId);
        const todos = await Promise.all(
          (contratos || []).map((c) => getContratoItems(c.id).catch(() => []))
        );
        setItems(todos.flat());
      } catch {
        showToast("Error al cargar impresoras del cliente", "danger");
      } finally {
        setLoadingItems(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemsFiltrados = items.filter((it) => {
    const q = buscarTitular.trim().toLowerCase();
    if (!q) return true;
    return (
      (it.codigo || "").toLowerCase().includes(q) ||
      (it.modelo || "").toLowerCase().includes(q) ||
      (it.serial_number || "").toLowerCase().includes(q) ||
      (it.ubicacion || "").toLowerCase().includes(q)
    );
  });

  // Impresoras de respaldo: el inventario completo puede ser enorme, así
  // que se busca por serial/ubicación en el backend con un límite, en vez
  // de cargar todos los activos del sistema de una sola vez.
  useEffect(() => {
    const q = buscarBackup.trim();
    if (!q) {
      setActivos([]);
      return;
    }
    setLoadingActivos(true);
    const t = setTimeout(() => {
      buscarActivos(q, 20)
        .then((data) => setActivos(Array.isArray(data) ? data : []))
        .catch(() => showToast("Error al buscar activos", "danger"))
        .finally(() => setLoadingActivos(false));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscarBackup]);

  // Continuidad multi-mes: si esta misma pareja titular+respaldo ya venía
  // de un período anterior, precarga su última lectura como inicial.
  useEffect(() => {
    if (!itemId || !activoSel) return;
    setBuscandoAnterior(true);
    getUltimoReemplazo({ contratoItemId: itemId, activoTemporalId: activoSel.id, periodoId })
      .then((anterior) => {
        if (anterior) {
          setLecturaInicial(String(anterior.lectura_final ?? 0));
          setLecturaInicialColor(String(anterior.lectura_final_color ?? 0));
          showToast("Se precargó la lectura inicial del período anterior de esta misma impresora temporal", "info");
        }
      })
      .catch(() => {})
      .finally(() => setBuscandoAnterior(false));
  }, [itemId, activoSel, periodoId]);

  const submit = async () => {
    if (!itemId || !activoSel) {
      return showToast("Selecciona la impresora titular y la de respaldo", "warning");
    }
    setSaving(true);
    try {
      await createReemplazo({
        contrato_item_id: Number(itemId),
        activo_temporal_id: Number(activoSel.id),
        periodo_id: Number(periodoId),
        fecha_cambio: fechaCambio || null,
        lectura_inicial: Number(lecturaInicial) || 0,
        lectura_final: Number(lecturaFinal) || 0,
        lectura_inicial_color: Number(lecturaInicialColor) || 0,
        lectura_final_color: Number(lecturaFinalColor) || 0,
      });
      showToast("Reemplazo registrado", "success");
      onCreated();
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
      onClick={() => !saving && onClose()}>
      <div
        className="w-full max-w-lg bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-4 animate-in slide-in-from-bottom md:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 dark:bg-primary/15 rounded-2xl ring-1 ring-primary/20 shrink-0">
            <RefreshCcw size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">Nuevo Reemplazo Temporal</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Las copias de la impresora de respaldo se sumarán a la titular en este período. Solo se cobra por clic — nunca renta.
            </p>
          </div>
        </div>

        <div className="h-px bg-border/50" />

        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Impresora titular (del contrato) <span className="text-primary">*</span>
          </label>
          <input
            value={buscarTitular}
            onChange={(e) => setBuscarTitular(e.target.value)}
            placeholder="Buscar por serial, código, modelo o site/ubicación..."
            className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2 text-sm outline-none focus:border-primary/60 mb-1.5"
          />
          {loadingItems ? (
            <div className="flex items-center gap-2 text-muted-foreground py-2"><Loader2 size={14} className="animate-spin" /> Cargando...</div>
          ) : (
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              size={Math.min(itemsFiltrados.length || 1, 5)}
              className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm outline-none focus:border-primary/60">
              {itemsFiltrados.length === 0 && <option value="" disabled>Sin resultados</option>}
              {itemsFiltrados.map((it) => (
                <option key={it.id} value={it.id}>{it.modelo} ({it.codigo}) — {it.serial_number} — {it.ubicacion}</option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Impresora de respaldo — solo las que están en bodega <span className="text-primary">*</span>
          </label>
          <input
            value={activoSel ? `${activoSel.modelo} — ${activoSel.serial_number}` : buscarBackup}
            onChange={(e) => { setActivoSel(null); setBuscarBackup(e.target.value); }}
            placeholder="Buscar por número de serie..."
            className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
          />
          {loadingActivos && (
            <div className="flex items-center gap-2 text-muted-foreground py-1.5 text-xs"><Loader2 size={13} className="animate-spin" /> Buscando...</div>
          )}
          {!activoSel && activos.length > 0 && (
            <div className="border border-border/60 rounded-xl divide-y divide-border/40 max-h-40 overflow-y-auto">
              {activos.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { setActivoSel(a); setActivos([]); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/40 dark:hover:bg-slate-800/40 transition-colors">
                  <span className="font-semibold">{a.modelo}</span>{" "}
                  <span className="text-muted-foreground">— {a.serial_number} · {a.ubicacion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Fecha del cambio (opcional)
          </label>
          <input type="date" value={fechaCambio} onChange={(e) => setFechaCambio(e.target.value)}
            className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm outline-none focus:border-primary/60" />
        </div>

        {buscandoAnterior && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Buscando si esta pareja ya tuvo lecturas en un período anterior...</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-muted-foreground">Lectura inicial mono</label>
            <input type="number" value={lecturaInicial} onChange={(e) => setLecturaInicial(e.target.value)}
              className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-muted-foreground">Lectura final mono</label>
            <input type="number" value={lecturaFinal} onChange={(e) => setLecturaFinal(e.target.value)}
              className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-muted-foreground">Lectura inicial color</label>
            <input type="number" value={lecturaInicialColor} onChange={(e) => setLecturaInicialColor(e.target.value)}
              className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-muted-foreground">Lectura final color</label>
            <input type="number" value={lecturaFinalColor} onChange={(e) => setLecturaFinalColor(e.target.value)}
              className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
        </div>

        <div className="h-px bg-border/50" />

        <div className="flex gap-2.5">
          <Button onClick={submit} disabled={saving} className="flex-1 rounded-2xl h-10 font-bold gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {saving ? "Guardando..." : "Registrar"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1 rounded-2xl h-10 font-bold">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
