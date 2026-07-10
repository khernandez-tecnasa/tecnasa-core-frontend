// src/pages/Clientes/ClienteContratos.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  FileText,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Printer,
  Layers,
  Edit3,
  Trash2,
  Search,
  GitBranch,
} from "lucide-react";

import {
  getContratosByCliente,
  createContrato,
  updateContrato,
  desactivarContrato,
  getContratoItems,
  addContratoItem,
  updateContratoItemPrecios,
  removeContratoItem,
  getGruposByCliente,
  createGrupoFacturacion,
  updateGrupoFacturacion,
  asignarItemAGrupo,
  getMonedas,
} from "@/services/facturacion.service";
import { getActivosByCliente } from "@/services/ActivosServices";

import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import useIsMobile from "@/hooks/useIsMobile";
import { Button } from "@/components/ui/button";

const normalize = (val) =>
  (val || "").toString().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

const formatFecha = (d) => {
  if (!d) return "—";
  const [y, m, day] = String(d).slice(0, 10).split("-");
  return `${day}/${m}/${y}`;
};

const money = (n) =>
  `L ${Number(n || 0).toLocaleString("es-HN", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;

export default function ClienteContratos({ onCountChange }) {
  const { id } = useParams();
  const { userData, hasPermiso } = useAuth();

  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const can = useCallback((p) => isAdmin || hasPermiso(p), [isAdmin, hasPermiso]);

  const canView = can("ver_contratos");
  const canCreate = can("crear_contratos");
  const canEdit = can("editar_contratos");

  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openNuevo, setOpenNuevo] = useState(false);
  const [parentForAdenda, setParentForAdenda] = useState(null);
  const [editingContrato, setEditingContrato] = useState(null);

  const [detalle, setDetalle] = useState(null); // contrato abierto en el drawer

  const load = useCallback(async () => {
    if (!canView) return setLoading(false);
    setLoading(true);
    setError(null);
    try {
      const data = await getContratosByCliente(id);
      const arr = Array.isArray(data) ? data : [];
      setContratos(arr);
      onCountChange?.(arr.length);
    } catch (err) {
      setError(err?.message || "Error al cargar los contratos");
    } finally {
      setLoading(false);
    }
  }, [id, canView]);

  useEffect(() => {
    load();
  }, [load]);

  // Agrupar: contratos maestros con sus adendas debajo
  const agrupados = useMemo(() => {
    const maestros = contratos.filter((c) => !c.contrato_padre_id);
    const adendasPorPadre = contratos.reduce((acc, c) => {
      if (c.contrato_padre_id) {
        acc[c.contrato_padre_id] = acc[c.contrato_padre_id] || [];
        acc[c.contrato_padre_id].push(c);
      }
      return acc;
    }, {});
    return maestros.map((m) => ({ ...m, adendas: adendasPorPadre[m.id] || [] }));
  }, [contratos]);

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <FileText size={32} className="opacity-30" />
        <p className="text-sm font-medium">No tienes permisos para ver los contratos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 shrink-0">
            <FileText size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight">Contratos de facturación</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {contratos.length} contrato{contratos.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {canCreate && (
          <Button
            size="sm"
            onClick={() => {
              setParentForAdenda(null);
              setOpenNuevo(true);
            }}
            className="rounded-xl gap-2 text-xs font-bold h-9">
            <Plus size={14} /> Nuevo contrato
          </Button>
        )}
      </div>

      {/* ── LISTA ── */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={18} />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Cargando contratos...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <AlertTriangle size={28} className="text-rose-500/50" />
            <p className="text-sm font-bold">{error}</p>
            <Button onClick={load} variant="outline" size="sm" className="rounded-xl">Reintentar</Button>
          </div>
        ) : agrupados.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-14 h-14 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
              <FileText size={24} className="text-muted-foreground/40" />
            </div>
            <p className="font-bold text-sm">Sin contratos registrados</p>
            <p className="text-xs text-muted-foreground">Crea el primer contrato usando el botón de arriba</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {agrupados.map((c) => (
              <div key={c.id}>
                <button
                  onClick={() => setDetalle(c)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 dark:hover:bg-slate-800/30 transition-colors text-left">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-muted/60 dark:bg-slate-800 flex items-center justify-center">
                    <FileText size={15} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{c.nombre}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatFecha(c.fecha_inicio)} — {c.fecha_fin ? formatFecha(c.fecha_fin) : "indefinido"}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <Printer size={10} /> {c.total_impresoras ?? 0}
                  </span>
                  {canCreate && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setParentForAdenda(c);
                        setOpenNuevo(true);
                      }}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                      <GitBranch size={11} /> Adenda
                    </span>
                  )}
                  <ChevronRight size={16} className="text-muted-foreground/50 shrink-0" />
                </button>

                {c.adendas.length > 0 && (
                  <div className="pl-12 pb-2 space-y-1">
                    {c.adendas.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setDetalle(a)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted/30 dark:hover:bg-slate-800/30 transition-colors text-left">
                        <GitBranch size={12} className="text-muted-foreground/60 shrink-0" />
                        <span className="text-sm font-semibold truncate flex-1">{a.nombre}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {a.total_impresoras ?? 0} impresora{(a.total_impresoras ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL: NUEVO / EDITAR CONTRATO / ADENDA ── */}
      {openNuevo && (
        <NuevoContratoModal
          clienteId={id}
          parent={parentForAdenda}
          editing={editingContrato}
          onClose={() => {
            setOpenNuevo(false);
            setEditingContrato(null);
          }}
          onCreated={() => {
            setOpenNuevo(false);
            setEditingContrato(null);
            setDetalle(null);
            load();
          }}
        />
      )}

      {/* ── DRAWER: DETALLE DE CONTRATO ── */}
      {detalle && (
        <ContratoDetailDrawer
          contrato={detalle}
          clienteId={id}
          canEdit={canEdit}
          onClose={() => setDetalle(null)}
          onChanged={load}
          onEdit={() => {
            setEditingContrato(detalle);
            setOpenNuevo(true);
          }}
          onDeactivated={() => {
            setDetalle(null);
            load();
          }}
        />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MODAL: Nuevo contrato / adenda
────────────────────────────────────────────────────────────────────────── */

function NuevoContratoModal({ clienteId, parent, editing, onClose, onCreated }) {
  const { showToast } = useToast();
  const isEdit = !!editing;
  const [nombre, setNombre] = useState(
    editing ? editing.nombre : parent ? `Adenda de ${parent.nombre}` : ""
  );
  const [fechaInicio, setFechaInicio] = useState(
    editing ? String(editing.fecha_inicio).slice(0, 10) : ""
  );
  const [fechaFin, setFechaFin] = useState(
    editing?.fecha_fin ? String(editing.fecha_fin).slice(0, 10) : ""
  );
  const [monedas, setMonedas] = useState([]);
  const [monedaId, setMonedaId] = useState(editing?.moneda_factura_id || "");
  const [tipoCambioFijo, setTipoCambioFijo] = useState(
    editing?.tipo_cambio_fijo != null ? String(editing.tipo_cambio_fijo) : ""
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMonedas()
      .then((data) => {
        const lista = Array.isArray(data) ? data : [];
        setMonedas(lista);
        if (!monedaId) {
          const usd = lista.find((m) => m.codigo === "USD");
          if (usd) setMonedaId(usd.id);
        }
      })
      .catch(() => {});
  }, []);

  const monedaSeleccionada = monedas.find((m) => m.id === Number(monedaId));
  const esUSD = !monedaSeleccionada || monedaSeleccionada.codigo === "USD";

  const submit = async () => {
    if (!nombre.trim() || !fechaInicio) {
      return showToast("Nombre y fecha de inicio son obligatorios", "warning");
    }
    setSaving(true);
    try {
      const payloadMoneda = {
        moneda_factura_id: monedaId || null,
        tipo_cambio_fijo: esUSD ? null : (Number(tipoCambioFijo) || null),
      };
      if (isEdit) {
        await updateContrato(editing.id, {
          nombre: nombre.trim(),
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin || null,
          contrato_padre_id: editing.contrato_padre_id || null,
          ...payloadMoneda,
        });
        showToast("Contrato actualizado", "success");
      } else {
        await createContrato({
          cliente_id: Number(clienteId),
          nombre: nombre.trim(),
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin || null,
          contrato_padre_id: parent?.id || null,
          ...payloadMoneda,
        });
        showToast(parent ? "Adenda creada" : "Contrato creado", "success");
      }
      onCreated();
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
      onClick={() => !saving && onClose()}>
      <div
        className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 dark:bg-primary/15 rounded-2xl ring-1 ring-primary/20 shrink-0">
            <FileText size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">
              {isEdit ? "Editar Contrato" : parent ? "Nueva Adenda" : "Nuevo Contrato"}
            </h2>
            {parent && !isEdit && (
              <p className="text-sm text-muted-foreground mt-1">
                Subcontrato de <span className="font-bold text-foreground">{parent.nombre}</span>
              </p>
            )}
          </div>
        </div>

        <div className="h-px bg-border/50" />

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Nombre <span className="text-primary">*</span>
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Contrato 2026, Adenda 1"
              className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Fecha inicio <span className="text-primary">*</span>
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Fecha fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Moneda de facturación
            </label>
            <select
              value={monedaId}
              onChange={(e) => setMonedaId(e.target.value)}
              className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all">
              {monedas.map((m) => (
                <option key={m.id} value={m.id}>{m.codigo} — {m.nombre}</option>
              ))}
            </select>
          </div>

          {!esUSD && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Tasa de cambio fija (opcional)
              </label>
              <input
                type="number"
                step="0.0001"
                value={tipoCambioFijo}
                onChange={(e) => setTipoCambioFijo(e.target.value)}
                placeholder="Vacío = usar la tasa del periodo"
                className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <p className="text-[11px] text-muted-foreground">
                Si el contrato fijó la tasa al firmarse, escríbela aquí — se usará siempre, sin importar cómo cambie el dólar después. Si se deja vacía, se usa la tasa vigente de cada periodo.
              </p>
            </div>
          )}
        </div>

        <div className="h-px bg-border/50" />

        <div className="flex gap-2.5">
          <Button
            onClick={submit}
            disabled={saving}
            className="flex-1 rounded-2xl h-10 font-bold gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1 rounded-2xl h-10 font-bold">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   DRAWER: Detalle de contrato (impresoras + grupos)
────────────────────────────────────────────────────────────────────────── */

function ContratoDetailDrawer({ contrato, clienteId, canEdit, onClose, onChanged, onEdit, onDeactivated }) {
  const { showToast } = useToast();
  const isMobile = useIsMobile(768);
  const esContratoPadre = !contrato.contrato_padre_id;
  const [tab, setTab] = useState("impresoras");

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const [grupos, setGrupos] = useState([]);
  const [loadingGrupos, setLoadingGrupos] = useState(true);

  const [openAddItem, setOpenAddItem] = useState(false);
  const [openNuevoGrupo, setOpenNuevoGrupo] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [searchItems, setSearchItems] = useState("");

  const handleDeactivate = async () => {
    if (!confirm(`¿Desactivar el contrato "${contrato.nombre}"? Dejará de aparecer en el listado.`)) return;
    setDeactivating(true);
    try {
      await desactivarContrato(contrato.id);
      showToast("Contrato desactivado", "success");
      onDeactivated();
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setDeactivating(false);
    }
  };

  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const data = await getContratoItems(contrato.id);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setLoadingItems(false);
    }
  }, [contrato.id]);

  const loadGrupos = useCallback(async () => {
    setLoadingGrupos(true);
    try {
      const data = await getGruposByCliente(clienteId);
      setGrupos(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setLoadingGrupos(false);
    }
  }, [clienteId]);

  useEffect(() => {
    loadItems();
    loadGrupos();
  }, [loadItems, loadGrupos]);

  const filteredItems = useMemo(() => {
    const q = normalize(searchItems);
    if (!q) return items;
    return items.filter(
      (it) =>
        normalize(it.modelo).includes(q) ||
        normalize(it.serial_number).includes(q) ||
        normalize(it.codigo).includes(q)
    );
  }, [items, searchItems]);

  const handleRemoveItem = async (item) => {
    if (!confirm(`¿Retirar "${item.codigo}" de este contrato?`)) return;
    try {
      await removeContratoItem(item.id);
      showToast("Impresora retirada del contrato", "success");
      loadItems();
      onChanged();
    } catch (err) {
      showToast(err.message, "danger");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
      <div
        className={[
          "absolute bg-card dark:bg-slate-900 shadow-2xl border-border/40 flex flex-col animate-in duration-300",
          isMobile
            ? "inset-x-0 bottom-0 h-[88vh] rounded-t-3xl border-t slide-in-from-bottom"
            : "right-0 top-0 h-full w-[560px] border-l slide-in-from-right",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex-none flex items-center gap-3 px-6 py-4 border-b border-border/60">
          <div className="p-2 bg-primary/10 dark:bg-primary/15 rounded-2xl ring-1 ring-primary/20">
            <FileText size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black tracking-tight truncate">{contrato.nombre}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {formatFecha(contrato.fecha_inicio)} — {contrato.fecha_fin ? formatFecha(contrato.fecha_fin) : "indefinido"}
            </p>
          </div>
          {canEdit && (
            <>
              <button
                onClick={onEdit}
                title="Editar contrato"
                className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl text-muted-foreground hover:text-foreground transition-colors">
                <Edit3 size={15} />
              </button>
              <button
                onClick={handleDeactivate}
                disabled={deactivating}
                title="Desactivar contrato"
                className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl text-muted-foreground hover:text-rose-600 transition-colors disabled:opacity-50">
                {deactivating ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs — Grupos/Bolsones solo vive en el contrato padre: un grupo ya
            no pertenece a un contrato puntual, así que se gestiona desde ahí
            y se usa también para asignar impresoras de sus adendas. */}
        <div className="flex-none flex gap-1 px-6 pt-3 bg-muted/20 dark:bg-slate-800/20 border-b border-border/60">
          {[
            { key: "impresoras", label: "Impresoras", icon: Printer },
            ...(esContratoPadre ? [{ key: "grupos", label: "Grupos / Bolsones", icon: Layers }] : []),
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-bold border-b-2 transition-colors ${
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-3">
          {tab === "impresoras" || !esContratoPadre ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">
                  {items.length} impresora{items.length !== 1 ? "s" : ""} en este contrato
                </p>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOpenAddItem(true)}
                    className="rounded-xl gap-1.5 text-xs font-bold h-8">
                    <Plus size={13} /> Vincular impresora
                  </Button>
                )}
              </div>

              {items.length > 0 && (
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    value={searchItems}
                    onChange={(e) => setSearchItems(e.target.value)}
                    placeholder="Buscar por modelo, serial o código..."
                    className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 pl-8 pr-4 py-2 text-xs outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
              )}

              {loadingItems ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="animate-spin text-primary" size={20} />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <Printer size={24} className="text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Sin impresoras vinculadas todavía</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin resultados para "{searchItems}"</p>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((it) => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      canEdit={canEdit}
                      grupos={grupos}
                      onRemove={() => handleRemoveItem(it)}
                      onSavedPrecios={loadItems}
                      onAsignarGrupo={async (grupoId) => {
                        try {
                          await asignarItemAGrupo(it.id, grupoId || null);
                          showToast("Impresora reasignada", "success");
                          loadItems();
                          loadGrupos();
                        } catch (err) {
                          showToast(err.message, "danger");
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">
                  {grupos.length} grupo{grupos.length !== 1 ? "s" : ""} de facturación
                </p>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingGrupo(null);
                      setOpenNuevoGrupo(true);
                    }}
                    className="rounded-xl gap-1.5 text-xs font-bold h-8">
                    <Plus size={13} /> Nuevo grupo
                  </Button>
                )}
              </div>

              {loadingGrupos ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="animate-spin text-primary" size={20} />
                </div>
              ) : grupos.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <Layers size={24} className="text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Sin grupos de facturación todavía</p>
                  <p className="text-xs text-muted-foreground/70 max-w-[280px]">
                    Un grupo agrupa varias impresoras bajo una sola bolsa de impresiones (ej. "Finca Santa Rita")
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {grupos.map((g) => (
                    <div
                      key={g.id}
                      className="bg-muted/40 dark:bg-slate-800/50 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm flex-1 truncate">{g.nombre}</p>
                        {!!g.es_bolson && (
                          <span className="shrink-0 px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                            Bolsón
                          </span>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditingGrupo(g);
                              setOpenNuevoGrupo(true);
                            }}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-muted dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground transition-colors">
                            <Edit3 size={13} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span className="text-muted-foreground">
                          Bolsa mono: <b className="text-foreground">{g.bolsa_mono ?? 0}</b>
                        </span>
                        <span className="text-muted-foreground">
                          Bolsa color: <b className="text-foreground">{g.bolsa_color ?? 0}</b>
                        </span>
                        <span className="text-muted-foreground">
                          Renta base: <b className="text-foreground">{money(g.precio_fijo_mensual)}</b>
                        </span>
                        <span className="text-muted-foreground">
                          Impresoras: <b className="text-foreground">{g.total_impresoras_asignadas ?? 0}</b>
                        </span>
                        <span className="col-span-2 text-muted-foreground">
                          Excedente:{" "}
                          <b className="text-foreground">
                            {g.frecuencia_excedentes === "ANUAL"
                              ? `Anual — ${["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][(g.mes_cierre_anual ?? 12) - 1]}`
                              : "Mensual"}
                          </b>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {openAddItem && (
        <AddItemModal
          contratoId={contrato.id}
          clienteId={clienteId}
          grupos={grupos}
          onClose={() => setOpenAddItem(false)}
          onAdded={() => {
            setOpenAddItem(false);
            loadItems();
            onChanged();
          }}
        />
      )}

      {openNuevoGrupo && (
        <NuevoGrupoModal
          clienteId={clienteId}
          editing={editingGrupo}
          onClose={() => {
            setOpenNuevoGrupo(false);
            setEditingGrupo(null);
          }}
          onCreated={() => {
            setOpenNuevoGrupo(false);
            setEditingGrupo(null);
            loadGrupos();
          }}
        />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Fila de impresora (con edición inline de precios)
────────────────────────────────────────────────────────────────────────── */

function ItemRow({ item, canEdit, grupos, onRemove, onSavedPrecios, onAsignarGrupo }) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [renta, setRenta] = useState(item.precio_renta);
  const [mono, setMono] = useState(item.precio_clic_mono);
  const [color, setColor] = useState(item.precio_clic_color);
  const [saving, setSaving] = useState(false);

  const guardarPrecios = async () => {
    setSaving(true);
    try {
      await updateContratoItemPrecios(item.id, {
        precio_renta: Number(renta) || 0,
        precio_clic_mono: Number(mono) || 0,
        precio_clic_color: Number(color) || 0,
      });
      showToast("Precios actualizados", "success");
      setEditing(false);
      onSavedPrecios();
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-muted/40 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{item.modelo}</p>
          <p className="text-[11px] text-muted-foreground font-mono">
            {item.serial_number && <span className="mr-2 text-foreground/70">{item.serial_number}</span>}
            {item.codigo}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setEditing((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-muted dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground transition-colors">
              <Edit3 size={13} />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-black uppercase text-muted-foreground">Renta</label>
              <input
                type="number"
                step="0.0001"
                value={renta}
                onChange={(e) => setRenta(e.target.value)}
                className="w-full rounded-lg border border-border bg-background dark:bg-slate-900/60 px-2 py-1.5 text-xs outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-muted-foreground">Clic mono</label>
              <input
                type="number"
                step="0.0001"
                value={mono}
                onChange={(e) => setMono(e.target.value)}
                className="w-full rounded-lg border border-border bg-background dark:bg-slate-900/60 px-2 py-1.5 text-xs outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-muted-foreground">Clic color</label>
              <input
                type="number"
                step="0.0001"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full rounded-lg border border-border bg-background dark:bg-slate-900/60 px-2 py-1.5 text-xs outline-none focus:border-primary/60"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={saving} onClick={guardarPrecios} className="rounded-xl h-8 text-xs font-bold flex-1">
              {saving ? <Loader2 size={12} className="animate-spin" /> : "Guardar"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="rounded-xl h-8 text-xs font-bold flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <span className="text-muted-foreground">Renta: <b className="text-foreground">{money(item.precio_renta)}</b></span>
          <span className="text-muted-foreground">Mono: <b className="text-foreground">{money(item.precio_clic_mono)}</b></span>
          <span className="text-muted-foreground">Color: <b className="text-foreground">{money(item.precio_clic_color)}</b></span>
        </div>
      )}

      {canEdit && grupos.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <Layers size={12} className="text-muted-foreground/60 shrink-0" />
          <select
            value={item.grupo_id || ""}
            onChange={(e) => onAsignarGrupo(e.target.value || null)}
            className="flex-1 rounded-lg border border-border bg-background dark:bg-slate-900/60 px-2 py-1 text-xs outline-none focus:border-primary/60">
            <option value="">Sin grupo (cobro individual)</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>{g.nombre}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MODAL: Vincular impresora existente al contrato
────────────────────────────────────────────────────────────────────────── */

function AddItemModal({ contratoId, clienteId, grupos, onClose, onAdded }) {
  const { showToast } = useToast();
  const [activos, setActivos] = useState([]);
  const [loadingActivos, setLoadingActivos] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [precioRenta, setPrecioRenta] = useState("0");
  const [precioMono, setPrecioMono] = useState("0");
  const [precioColor, setPrecioColor] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getActivosByCliente(clienteId)
      .then((data) => setActivos(Array.isArray(data) ? data : []))
      .catch(() => showToast("Error al cargar activos", "danger"))
      .finally(() => setLoadingActivos(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = useMemo(() => {
    const s = normalize(search);
    if (!s) return activos.slice(0, 30);
    return activos
      .filter((a) => normalize(a.codigo).includes(s) || normalize(a.nombre).includes(s) || normalize(a.serial_number).includes(s))
      .slice(0, 30);
  }, [activos, search]);

  const submit = async () => {
    if (!selectedId) return showToast("Selecciona una impresora", "warning");
    setSaving(true);
    try {
      await addContratoItem({
        contrato_id: contratoId,
        activo_id: Number(selectedId),
        grupo_id: grupoId || null,
        precio_renta: Number(precioRenta) || 0,
        precio_clic_mono: Number(precioMono) || 0,
        precio_clic_color: Number(precioColor) || 0,
      });
      showToast("Impresora vinculada al contrato", "success");
      onAdded();
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
      onClick={() => !saving && onClose()}>
      <div
        className="w-full max-w-lg bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-4 animate-in slide-in-from-bottom md:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 dark:bg-primary/15 rounded-2xl ring-1 ring-primary/20 shrink-0">
            <Printer size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">Vincular impresora existente</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Busca un activo ya registrado en inventario para vincularlo a este contrato.
            </p>
          </div>
        </div>

        <div className="h-px bg-border/50" />

        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Impresora <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, nombre o serial..."
              className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          {loadingActivos ? (
            <div className="flex items-center gap-2 py-3 text-muted-foreground">
              <Loader2 size={14} className="animate-spin" /> <span className="text-sm">Cargando activos...</span>
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto border border-border/60 rounded-xl divide-y divide-border/40">
              {filtrados.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin resultados</p>
              ) : (
                filtrados.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(String(a.id))}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      String(selectedId) === String(a.id) ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted/50 dark:hover:bg-slate-800/40"
                    }`}>
                    {a.nombre} <span className="font-mono text-xs text-muted-foreground">({a.codigo})</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {grupos.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Grupo de facturación (opcional)
            </label>
            <select
              value={grupoId}
              onChange={(e) => setGrupoId(e.target.value)}
              className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm outline-none focus:border-primary/60">
              <option value="">Sin grupo (cobro individual)</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-muted-foreground">Renta</label>
            <input type="number" step="0.0001" value={precioRenta} onChange={(e) => setPrecioRenta(e.target.value)}
              className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-muted-foreground">Clic mono</label>
            <input type="number" step="0.0001" value={precioMono} onChange={(e) => setPrecioMono(e.target.value)}
              className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-muted-foreground">Clic color</label>
            <input type="number" step="0.0001" value={precioColor} onChange={(e) => setPrecioColor(e.target.value)}
              className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
        </div>

        <div className="h-px bg-border/50" />

        <div className="flex gap-2.5">
          <Button onClick={submit} disabled={saving || !selectedId} className="flex-1 rounded-2xl h-10 font-bold gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {saving ? "Vinculando..." : "Vincular"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1 rounded-2xl h-10 font-bold">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MODAL: Nuevo grupo de facturación (bolsón)
────────────────────────────────────────────────────────────────────────── */

function NuevoGrupoModal({ clienteId, editing, onClose, onCreated }) {
  const { showToast } = useToast();
  const isEdit = !!editing;
  const [nombre, setNombre] = useState(editing?.nombre || "");
  const [esBolson, setEsBolson] = useState(editing ? !!editing.es_bolson : false);
  const [bolsaMono, setBolsaMono] = useState(String(editing?.bolsa_mono ?? "0"));
  const [bolsaColor, setBolsaColor] = useState(String(editing?.bolsa_color ?? "0"));
  const [precioFijo, setPrecioFijo] = useState(String(editing?.precio_fijo_mensual ?? "0"));
  const [precioExcMono, setPrecioExcMono] = useState(String(editing?.precio_excedente_mono ?? "0"));
  const [precioExcColor, setPrecioExcColor] = useState(String(editing?.precio_excedente_color ?? "0"));
  const [frecuencia, setFrecuencia] = useState(editing?.frecuencia_excedentes || "MENSUAL");
  const [mesCierre, setMesCierre] = useState(String(editing?.mes_cierre_anual || 12));
  const [monedas, setMonedas] = useState([]);
  const [monedaId, setMonedaId] = useState(editing?.moneda_factura_id || "");
  const [tipoCambioFijo, setTipoCambioFijo] = useState(
    editing?.tipo_cambio_fijo != null ? String(editing.tipo_cambio_fijo) : ""
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMonedas()
      .then((data) => {
        const lista = Array.isArray(data) ? data : [];
        setMonedas(lista);
        if (!monedaId) {
          const usd = lista.find((m) => m.codigo === "USD");
          if (usd) setMonedaId(usd.id);
        }
      })
      .catch(() => {});
  }, []);

  const monedaSeleccionada = monedas.find((m) => m.id === Number(monedaId));
  const esUSD = !monedaSeleccionada || monedaSeleccionada.codigo === "USD";

  const submit = async () => {
    if (!nombre.trim()) return showToast("El nombre es obligatorio", "warning");
    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        es_bolson: esBolson,
        bolsa_mono: Number(bolsaMono) || 0,
        bolsa_color: Number(bolsaColor) || 0,
        precio_fijo_mensual: Number(precioFijo) || 0,
        precio_excedente_mono: Number(precioExcMono) || 0,
        precio_excedente_color: Number(precioExcColor) || 0,
        frecuencia_excedentes: frecuencia,
        mes_cierre_anual: frecuencia === "ANUAL" ? Number(mesCierre) : null,
        moneda_factura_id: monedaId || null,
        tipo_cambio_fijo: esUSD ? null : (Number(tipoCambioFijo) || null),
      };
      if (isEdit) {
        await updateGrupoFacturacion(editing.id, payload);
        showToast("Grupo actualizado", "success");
      } else {
        await createGrupoFacturacion({ cliente_id: clienteId, ...payload });
        showToast("Grupo creado", "success");
      }
      onCreated();
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
      onClick={() => !saving && onClose()}>
      <div
        className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-4 animate-in slide-in-from-bottom md:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-violet-500/10 dark:bg-violet-500/15 rounded-2xl ring-1 ring-violet-500/20 shrink-0">
            <Layers size={20} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">
              {isEdit ? "Editar Grupo de Facturación" : "Nuevo Grupo de Facturación"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Ej: "Finca Santa Rita" — varias impresoras compartiendo una bolsa de impresiones.
            </p>
          </div>
        </div>

        <div className="h-px bg-border/50" />

        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Nombre <span className="text-primary">*</span>
          </label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input type="checkbox" checked={esBolson} onChange={(e) => setEsBolson(e.target.checked)} className="rounded accent-primary" />
          <div>
            <p className="text-sm font-semibold">Es bolsón</p>
            <p className="text-[11px] text-muted-foreground">Suma los contadores de todas las impresoras del grupo bajo una sola bolsa de impresiones</p>
          </div>
        </label>

        {esBolson && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-muted-foreground">Bolsa mono</label>
                <input type="number" value={bolsaMono} onChange={(e) => setBolsaMono(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-primary/60" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-muted-foreground">Bolsa color</label>
                <input type="number" value={bolsaColor} onChange={(e) => setBolsaColor(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-primary/60" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-muted-foreground">Renta base</label>
                <input type="number" step="0.01" value={precioFijo} onChange={(e) => setPrecioFijo(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-primary/60" />
              </div>
              <div />
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-muted-foreground">Excedente mono</label>
                <input type="number" step="0.0001" value={precioExcMono} onChange={(e) => setPrecioExcMono(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-primary/60" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-muted-foreground">Excedente color</label>
                <input type="number" step="0.0001" value={precioExcColor} onChange={(e) => setPrecioExcColor(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-primary/60" />
              </div>
            </div>

            {/* Frecuencia de cobro del excedente */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Frecuencia de cobro del excedente
              </label>
              <div className="flex gap-2">
                {[
                  { value: "MENSUAL", label: "Mensual" },
                  { value: "ANUAL", label: "Anual" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFrecuencia(opt.value)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                      frecuencia === opt.value
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 bg-background dark:bg-slate-900/60"
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {frecuencia === "ANUAL" && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-black uppercase text-muted-foreground">
                    Mes de cobro anual
                  </label>
                  <select
                    value={mesCierre}
                    onChange={(e) => setMesCierre(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all">
                    {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((mes, i) => (
                      <option key={i + 1} value={i + 1}>{mes}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground/70 italic">
                    El excedente acumulado del año se cobra en el período de este mes.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-muted-foreground">Moneda de facturación</label>
              <select
                value={monedaId}
                onChange={(e) => setMonedaId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-primary/60">
                {monedas.map((m) => (
                  <option key={m.id} value={m.id}>{m.codigo} — {m.nombre}</option>
                ))}
              </select>
            </div>

            {!esUSD && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-muted-foreground">Tasa de cambio fija (opcional)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={tipoCambioFijo}
                  onChange={(e) => setTipoCambioFijo(e.target.value)}
                  placeholder="Vacío = usar la tasa del periodo"
                  className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
            )}
          </>
        )}

        <div className="h-px bg-border/50" />

        <div className="flex gap-2.5">
          <Button onClick={submit} disabled={saving} className="flex-1 rounded-2xl h-10 font-bold gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear grupo"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1 rounded-2xl h-10 font-bold">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
