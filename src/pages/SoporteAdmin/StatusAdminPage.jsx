// src/pages/SoporteAdmin/StatusAdminPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, Plus, Pencil, X, Save, Loader2,
  AlertTriangle, Zap, CheckCircle2, AlertCircle,
  Wrench, TrendingDown, Clock, RefreshCw, Layers,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getOverallStatus, listServices } from "@/services/help.api.js";
import { createOverallStatus, upsertService } from "@/services/helpAdmin.api.js";

/* ── Constants ────────────────────────────────────────────────────── */
const SERVICE_STATUSES = [
  { value: "OK",            label: "Operacional" },
  { value: "Degradado",     label: "Degradado" },
  { value: "Mantenimiento", label: "Mantenimiento" },
];

const OVERALL_STATUSES = [
  { value: "OK",       label: "OK — Todos los sistemas operacionales" },
  { value: "DEGRADADO", label: "Degradado — Algunos servicios con problemas" },
  { value: "INCIDENTE", label: "Incidente — Interrupción activa" },
];

/* ── Status helpers ───────────────────────────────────────────────── */
function statusKind(status) {
  const s = String(status || "").toLowerCase();
  if (/(ok|operacional|online|up)/i.test(s))              return "success";
  if (/(degrad|mantenimiento|maintenance|warn)/i.test(s)) return "warning";
  if (/(incident|outage|down|falla|error)/i.test(s))      return "danger";
  return "neutral";
}

const STATUS_DOT = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-rose-500",
  neutral: "bg-muted-foreground/40",
};

const STATUS_BADGE = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  danger:  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  neutral: "bg-muted/60 text-muted-foreground",
};

const GROUP_BAR = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-rose-500",
  neutral: "bg-muted-foreground/30",
};

const SEVERITY = { neutral: 0, success: 1, warning: 2, danger: 3 };
const worstKind = (kinds) =>
  (kinds || []).reduce((w, k) => (SEVERITY[k] > SEVERITY[w] ? k : w), "neutral");

function StatusIcon({ status }) {
  const s = String(status || "").toLowerCase();
  const cls = "shrink-0";
  if (s.includes("mantenimiento")) return <Wrench size={12} className={cls} />;
  if (s.includes("degrad"))        return <TrendingDown size={12} className={cls} />;
  if (/(incident|down|falla)/i.test(s)) return <AlertCircle size={12} className={cls} />;
  if (/(ok|operacional|up)/i.test(s))   return <CheckCircle2 size={12} className={cls} />;
  return null;
}

function fmtDt(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("es-GT", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return String(d); }
}

function timeAgo(d) {
  if (!d) return null;
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60)  return "hace unos segundos";
  const m = Math.floor(s / 60);
  if (m < 60)  return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

/* ── Shared ───────────────────────────────────────────────────────── */
const inputCls =
  "w-full bg-card border border-border/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/40";

function Field({ label, required, error, children, hint }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint  && <p className="text-[11px] text-muted-foreground/60">{hint}</p>}
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

/* ── OverallFormDrawer ────────────────────────────────────────────── */
function OverallFormDrawer({ open, onClose, onSave, initial }) {
  const [status, setStatus] = useState("OK");
  const [desc, setDesc]     = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStatus(initial?.overall_status || "OK");
    setDesc(initial?.description || "");
    setSaving(false);
  }, [open, initial]);

  const submit = async () => {
    setSaving(true);
    try {
      await onSave({ overall_status: status, description: desc.trim() || null });
      onClose?.();
    } catch { /* toast handled by caller */ }
    finally { setSaving(false); }
  };

  if (!open) return null;

  const kind = statusKind(status);

  return (
    <div className="fixed inset-0 z-50 flex" onClick={() => !saving && onClose?.()}>
      <div className="flex-1 bg-black/30 dark:bg-black/50 backdrop-blur-sm" />
      <div
        className="w-full sm:max-w-md bg-card dark:bg-slate-900 border-l border-border/60 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 dark:bg-primary/15 rounded-xl ring-1 ring-primary/20">
              <Zap size={16} className="text-primary" />
            </div>
            <h2 className="font-black text-base tracking-tight">Estado global</h2>
          </div>
          <button
            onClick={() => !saving && onClose?.()}
            className="p-1.5 rounded-xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Estado del sistema" required>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputCls}>
              {OVERALL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>

          {/* Vista previa */}
          <div className={`flex items-center gap-2.5 p-3 rounded-2xl border border-border/60 ${STATUS_BADGE[kind]}`}>
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[kind]}`} />
            <span className="text-sm font-bold">{status || "—"}</span>
          </div>

          <Field label="Descripción visible a los usuarios (opcional)">
            <textarea
              className={`${inputCls} resize-none`}
              rows={5}
              placeholder="Ej. Estamos experimentando latencia elevada en la API. ETA de resolución: 30 min."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-6 py-4 border-t border-border/60 shrink-0">
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl h-10 font-bold text-sm bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button
            onClick={() => !saving && onClose?.()}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center rounded-2xl h-10 font-bold text-sm border border-border/60 bg-card hover:bg-muted/60 transition-all disabled:opacity-60">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── ServiceFormDrawer ────────────────────────────────────────────── */
function ServiceFormDrawer({ open, onClose, onSave, initial, groupSuggestions = [] }) {
  const [name, setName]         = useState("");
  const [groupName, setGroupName] = useState("");
  const [status, setStatus]     = useState("OK");
  const [message, setMessage]   = useState("");
  const [order, setOrder]       = useState(0);
  const [saving, setSaving]     = useState(false);
  const [errors, setErrors]     = useState({});

  useEffect(() => {
    if (!open) return;
    setName(initial?.name || "");
    setGroupName(initial?.group_name || "");
    setStatus(initial?.status || "OK");
    setMessage(initial?.message || "");
    setOrder(initial?.display_order ?? 0);
    setSaving(false);
    setErrors({});
  }, [open, initial]);

  const submit = async () => {
    const e = {};
    if (!name.trim()) e.name = "El nombre es obligatorio";
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        status,
        message: message.trim() || null,
        group_name: groupName.trim() || null,
        display_order: Number(order) || 0,
      });
      onClose?.();
    } catch { /* toast handled by caller */ }
    finally { setSaving(false); }
  };

  if (!open) return null;

  const kind = statusKind(status);

  return (
    <div className="fixed inset-0 z-50 flex" onClick={() => !saving && onClose?.()}>
      <div className="flex-1 bg-black/30 dark:bg-black/50 backdrop-blur-sm" />
      <div
        className="w-full sm:max-w-md bg-card dark:bg-slate-900 border-l border-border/60 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl ring-1 ring-emerald-200/60">
              <Activity size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="font-black text-base tracking-tight">
              {initial ? "Editar servicio" : "Nuevo servicio"}
            </h2>
          </div>
          <button
            onClick={() => !saving && onClose?.()}
            className="p-1.5 rounded-xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Nombre del servicio" required error={errors.name}>
            <input
              className={inputCls}
              placeholder="Ej. API REST, Base de datos, Jobs…"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
            />
          </Field>

          <Field label="Grupo (opcional)">
            <input
              list="grp-suggest"
              className={inputCls}
              placeholder="Ej. Backend, Integraciones, Frontend…"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <datalist id="grp-suggest">
              {groupSuggestions.map((g) => <option key={g} value={g} />)}
            </datalist>
          </Field>

          <Field label="Estado">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputCls}>
              {SERVICE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>

          {/* Vista previa estado */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_BADGE[kind]}`}>
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[kind]}`} />
            <StatusIcon status={status} />
            {status}
          </div>

          <Field label="Mensaje (opcional)" hint="Breve descripción visible en la página de estado">
            <input
              className={inputCls}
              placeholder="Ej. Latencia elevada en región US-East…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Field>

          <Field label="Orden de visualización" hint="Menor número = aparece primero en el grupo">
            <input
              type="number"
              className={inputCls}
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-6 py-4 border-t border-border/60 shrink-0">
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl h-10 font-bold text-sm bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button
            onClick={() => !saving && onClose?.()}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center rounded-2xl h-10 font-bold text-sm border border-border/60 bg-card hover:bg-muted/60 transition-all disabled:opacity-60">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────── */
export default function StatusAdminPage() {
  const { hasPermiso, userData, checkingSession } = useAuth();
  const { showToast } = useToast();

  const isAdmin  = (userData?.rol || "").toLowerCase() === "admin";
  const canManage = isAdmin || hasPermiso?.("help_manage");

  const [overall, setOverall]   = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Drawers
  const [openOverall, setOpenOverall]     = useState(false);
  const [openService, setOpenService]     = useState(false);
  const [editingService, setEditingService] = useState(null);

  /* ── Fetch ───────────────────────────────────────────────────────── */
  const fetchAll = useCallback(async (soft = false) => {
    if (checkingSession) return;
    if (!canManage) { setOverall(null); setServices([]); setLoading(false); return; }
    if (soft) setRefreshing(true); else setLoading(true);
    setErr(null);
    try {
      const [ov, svcs] = await Promise.all([getOverallStatus(), listServices()]);
      setOverall(ov || null);
      setServices(Array.isArray(svcs) ? svcs : []);
    } catch (e) {
      setErr(e?.message || "No se pudo cargar el estado");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [checkingSession, canManage]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Grouped services ────────────────────────────────────────────── */
  const groupedServices = useMemo(() => {
    const map = new Map();
    services.forEach((s) => {
      const g = s.group_name || "General";
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(s);
    });
    for (const [g, arr] of map.entries()) {
      arr.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      map.set(g, arr);
    }
    return Array.from(map.entries());
  }, [services]);

  const groupSuggestions = useMemo(() =>
    Array.from(new Set(services.map((s) => s.group_name).filter(Boolean))).sort(),
  [services]);

  /* ── Actions ─────────────────────────────────────────────────────── */
  const saveOverall = async (payload) => {
    await createOverallStatus(payload);
    showToast("Estado global actualizado", "success");
    fetchAll(true);
  };

  const saveService = async (payload) => {
    await upsertService(payload);
    showToast("Servicio guardado", "success");
    fetchAll(true);
  };

  /* ── View state ──────────────────────────────────────────────────── */
  const viewState = checkingSession
    ? "checking"
    : !canManage
    ? "no-permission"
    : err
    ? "error"
    : loading
    ? "loading"
    : "data";

  const overallKind = overall ? statusKind(overall.overall_status) : "neutral";

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <>
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <Activity size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Estado de Servicios
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Gestiona el estado global y los servicios del sistema
            </p>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-border/60 bg-card text-sm font-bold hover:bg-muted/60 disabled:opacity-60 transition-all">
              {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Actualizar
            </button>
            <button
              onClick={() => setOpenOverall(true)}
              className="inline-flex items-center gap-2 rounded-2xl px-5 h-10 font-bold text-sm bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all duration-200">
              <Zap size={16} />
              Estado global
            </button>
          </div>
        )}
      </div>

      {/* ESTADOS DE VISTA */}
      {viewState === "checking" && (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <Loader2 size={28} className="animate-spin opacity-40" />
          <p className="text-sm font-medium">Verificando sesión…</p>
        </div>
      )}

      {viewState === "no-permission" && (
        <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl flex flex-col items-center gap-3 py-20">
          <div className="w-14 h-14 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
            <Activity size={26} className="text-muted-foreground/30" />
          </div>
          <p className="font-bold text-sm">Sin permisos para gestionar el estado</p>
          <p className="text-xs text-muted-foreground">Consulta con un administrador.</p>
        </div>
      )}

      {viewState === "error" && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 rounded-2xl">
          <AlertTriangle size={18} className="text-rose-500 shrink-0" />
          <p className="flex-1 text-sm text-rose-700 dark:text-rose-300">{err}</p>
          <button
            onClick={() => fetchAll()}
            className="shrink-0 h-8 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold transition-colors">
            Reintentar
          </button>
        </div>
      )}

      {viewState === "loading" && (
        <div className="space-y-4">
          {/* Skeleton overall */}
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl p-5 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="h-5 bg-muted/60 dark:bg-slate-700/60 rounded-lg w-1/4" />
              <div className="h-8 w-24 bg-muted/60 dark:bg-slate-700/60 rounded-xl" />
            </div>
            <div className="h-px bg-border/40 my-4" />
            <div className="space-y-2">
              <div className="h-4 bg-muted/40 rounded-lg w-2/5" />
              <div className="h-3 bg-muted/30 rounded-lg w-3/5" />
            </div>
          </div>
          {/* Skeleton services */}
          {[0, 1].map((i) => (
            <div key={i} className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl overflow-hidden animate-pulse">
              <div className="h-1.5 bg-muted/50" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-muted/60 rounded-lg w-1/5" />
                <div className="h-px bg-border/40" />
                {[0, 1, 2].map((j) => (
                  <div key={j} className="h-3 bg-muted/40 rounded-lg w-4/5" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewState === "data" && (
        <div className="space-y-5">

          {/* ESTADO GLOBAL */}
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
            {/* Barra de color superior */}
            <div className={`h-1.5 ${GROUP_BAR[overallKind]}`} />
            <div className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 dark:bg-primary/15 rounded-2xl ring-1 ring-primary/20 shrink-0">
                    <Zap size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-black text-sm">Estado global del sistema</p>
                    {overall?.status_timestamp && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock size={9} />
                        {timeAgo(overall.status_timestamp)} · {fmtDt(overall.status_timestamp)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {overall ? (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${STATUS_BADGE[overallKind]}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[overallKind]}`} />
                      <StatusIcon status={overall.overall_status} />
                      {overall.overall_status || "—"}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Sin datos aún</span>
                  )}
                </div>
              </div>

              {overall?.description && (
                <>
                  <div className="h-px bg-border/40 my-4" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{overall.description}</p>
                </>
              )}

              {!overall && (
                <>
                  <div className="h-px bg-border/40 my-4" />
                  <p className="text-sm text-muted-foreground/60 italic">
                    No hay registros de estado global. Haz clic en "Estado global" para crear uno.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* SERVICIOS */}
          <div>
            {/* Cabecera sección servicios */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-muted-foreground/60" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                  Servicios configurados
                </span>
                {!loading && (
                  <span className="text-[10px] font-bold text-muted-foreground/50">
                    ({services.length})
                  </span>
                )}
              </div>
              {canManage && (
                <button
                  onClick={() => { setEditingService(null); setOpenService(true); }}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors">
                  <Plus size={13} /> Nuevo servicio
                </button>
              )}
            </div>

            {groupedServices.length === 0 ? (
              <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl flex flex-col items-center gap-3 py-16">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
                  <Activity size={22} className="text-muted-foreground/30" />
                </div>
                <p className="font-bold text-sm">Sin servicios configurados</p>
                <p className="text-xs text-muted-foreground">Agrega el primero con el botón de arriba</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {groupedServices.map(([group, items]) => {
                  const groupKind = worstKind(items.map((s) => statusKind(s.status)));
                  return (
                    <div key={group} className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
                      {/* Barra de color */}
                      <div className={`h-1.5 ${GROUP_BAR[groupKind]}`} />

                      <div className="p-4">
                        {/* Cabecera grupo */}
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-black text-sm">{group}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_BADGE[groupKind]}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[groupKind]}`} />
                            {groupKind === "success" ? "OK" : groupKind === "warning" ? "Atención" : groupKind === "danger" ? "Incidente" : "—"}
                          </span>
                        </div>

                        <div className="h-px bg-border/40 mb-3" />

                        {/* Servicios del grupo */}
                        <div className="space-y-2.5">
                          {items.map((s) => {
                            const sk = statusKind(s.status);
                            return (
                              <div key={s.id} className="flex items-start gap-2.5 group/row">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STATUS_DOT[sk]}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-bold leading-snug truncate">{s.name}</p>
                                    {canManage && (
                                      <button
                                        onClick={() => { setEditingService(s); setOpenService(true); }}
                                        title="Editar"
                                        className="p-1 rounded-lg opacity-0 group-hover/row:opacity-100 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all shrink-0">
                                        <Pencil size={12} />
                                      </button>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[sk]}`}>
                                      <StatusIcon status={s.status} />
                                      {s.status}
                                    </span>
                                    {s.lastUpdated && (
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                        <Clock size={8} /> {timeAgo(s.lastUpdated)}
                                      </span>
                                    )}
                                  </div>
                                  {s.message && (
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.message}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    {/* DRAWERS */}
    <OverallFormDrawer
      open={openOverall}
      onClose={() => setOpenOverall(false)}
      onSave={saveOverall}
      initial={overall}
    />

    <ServiceFormDrawer
      open={openService}
      onClose={() => setOpenService(false)}
      onSave={saveService}
      initial={editingService}
      groupSuggestions={groupSuggestions}
    />
    </>
  );
}
