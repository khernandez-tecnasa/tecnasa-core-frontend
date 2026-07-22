// src/pages/Clientes/ClienteInfo.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Edit3,
  Save,
  X,
  Loader2,
  Building2,
  ImagePlus,
  Trash2,
  MapPin,
  Monitor,
  Calendar,
  AlertTriangle,
} from "lucide-react";

import { getClienteById, updateCliente } from "@/services/ClientesServices";
import { getSitesByCliente }              from "@/services/SitesServices";
import { getActivosByCliente }            from "@/services/ActivosServices";
import { useToast }                       from "@/context/ToastContext";
import { useAuth }                        from "@/context/AuthContext";
import { Button }                         from "@/components/ui/button";

const ESTATUS = ["Activo", "Inactivo"];

// ── Avatar de cliente ─────────────────────────────────────────────────────────
function ClienteAvatar({ src, nombre, size = "md" }) {
  const sz = size === "lg"
    ? "w-20 h-20 text-2xl rounded-2xl"
    : "w-12 h-12 text-base rounded-xl";
  if (src) return <img src={src} alt={nombre} className={`${sz} object-contain bg-muted/40 dark:bg-slate-800`} />;
  return (
    <div className={`${sz} bg-primary/10 dark:bg-primary/15 text-primary font-black flex items-center justify-center shrink-0`}>
      {(nombre || "?")[0].toUpperCase()}
    </div>
  );
}

// ── Badge de estado ───────────────────────────────────────────────────────────
function StatusBadge({ estatus }) {
  if (estatus === "Activo")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Activo
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground border border-border/60">
      Inactivo
    </span>
  );
}

// ── Campo de lectura ──────────────────────────────────────────────────────────
function FieldView({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value || <span className="text-muted-foreground/50">—</span>}</p>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ClienteInfo() {
  const { t }          = useTranslation();
  const { id }         = useParams();
  const { showToast }  = useToast();
  const { userData, checkingSession, hasPermiso } = useAuth();

  const isAdmin = useCallback(
    () => (userData?.rol || userData?.role || "").toLowerCase() === "admin" || Boolean(userData?.isAdmin) || Boolean(userData?.es_admin),
    [userData]
  );
  const can = useCallback((p) => isAdmin() || hasPermiso(p), [isAdmin, hasPermiso]);

  const canView = can("ver_companias");
  const canEdit = can("editar_companias");

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [cliente, setCliente]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({ codigo: "", nombre: "", descripcion: "", estatus: "Activo" });
  const [logoFile, setLogoFile]       = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const prevBlobUrlRef                = useRef(null);

  // Resumen
  const [summary, setSummary]               = useState({ totalSites: 0, activeSites: 0, inactiveSites: 0, totalActivos: 0, activosByStatus: {} });
  const [summaryLoading, setSummaryLoading] = useState(false);

  // ── Carga principal ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (checkingSession) { setLoading(true); return; }
    if (!canView) { setLoading(false); setError(null); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await getClienteById(id);
      if (!data) {
        setCliente(null);
      } else {
        setCliente(data);
        setForm({ codigo: data.codigo || "", nombre: data.nombre || "", descripcion: data.descripcion || "", estatus: data.estatus || "Activo" });
        setLogoPreview(data.logo_url || null);
        setLogoFile(null);
      }
    } catch (err) {
      setError(err?.message || t("clients.errors.load_failed"));
    } finally {
      setLoading(false);
    }
  }, [id, checkingSession, canView]);

  // ── Carga resumen ─────────────────────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    if (!canView) return;
    setSummaryLoading(true);
    try {
      const [sites, activos] = await Promise.all([getSitesByCliente(id), getActivosByCliente(id)]);
      const sitesArr  = Array.isArray(sites)  ? sites  : [];
      const activosArr = Array.isArray(activos) ? activos : [];
      const isSiteActivo = (v) => v === 1 || v === "1" || v === true || v === "true";
      const totalSites  = sitesArr.length;
      const activeSites = sitesArr.filter((s) => isSiteActivo(s.activo)).length;
      const activosByStatus = {};
      activosArr.forEach((a) => { const k = a.estatus || "Sin estatus"; activosByStatus[k] = (activosByStatus[k] || 0) + 1; });
      setSummary({ totalSites, activeSites, inactiveSites: totalSites - activeSites, totalActivos: activosArr.length, activosByStatus });
    } catch (e) { console.warn("Summary error:", e); }
    finally { setSummaryLoading(false); }
  }, [id, canView]);

  useEffect(() => { load(); loadSummary(); }, [load, loadSummary]);

  // Cleanup blobs
  useEffect(() => {
    return () => { if (prevBlobUrlRef.current) { URL.revokeObjectURL(prevBlobUrlRef.current); prevBlobUrlRef.current = null; } };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function onLogoChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) return showToast(t("clients.errors.image_only"), "warning");
    if (f.size > 2 * 1024 * 1024) return showToast(t("clients.errors.image_size"), "warning");
    if (prevBlobUrlRef.current) { URL.revokeObjectURL(prevBlobUrlRef.current); prevBlobUrlRef.current = null; }
    const blobUrl = URL.createObjectURL(f);
    prevBlobUrlRef.current = blobUrl;
    setLogoFile(f);
    setLogoPreview(blobUrl);
  }

  async function onSave() {
    if (!canEdit) return showToast(t("common.no_permission"), "warning");
    if (!form.codigo.trim()) return showToast(t("clients.errors.code_required"), "warning");
    if (!form.nombre.trim())  return showToast(t("clients.errors.name_required"), "warning");
    setSaving(true);
    try {
      await updateCliente(id, form, logoFile);
      showToast(t("clients.success.updated"), "success");
      setEditMode(false);
      await load();
      await loadSummary();
    } catch (err) {
      showToast(err?.message || t("clients.errors.update_failed"), "danger");
    } finally {
      setSaving(false);
    }
  }

  function onCancel() {
    if (cliente) {
      setForm({ codigo: cliente.codigo || "", nombre: cliente.nombre || "", descripcion: cliente.descripcion || "", estatus: cliente.estatus || "Activo" });
      setLogoFile(null);
      setLogoPreview(cliente.logo_url || null);
    }
    setEditMode(false);
  }

  const createdAtText = useMemo(() => {
    if (!cliente?.fecha_registro) return "—";
    const d = new Date(cliente.fecha_registro);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  }, [cliente?.fecha_registro]);

  // ── Estados de carga ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={22} />
        </div>
        <p className="text-sm text-muted-foreground font-medium">{t("clients.loading_info")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 flex items-center justify-center">
          <AlertTriangle size={28} className="text-rose-500/60" />
        </div>
        <div className="text-center">
          <p className="font-bold text-sm">{t("clients.sites.error_loading")}</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
        <Button onClick={load} variant="outline" size="sm" className="rounded-xl">{t("common.retry")}</Button>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Building2 size={40} className="text-muted-foreground/30" />
        <p className="text-sm font-semibold">{t("clients.not_found")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ── HEADER con botones de edición ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ClienteAvatar src={logoPreview} nombre={cliente.nombre} size="lg" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Clientes / Detalle
            </p>
            <h2 className="text-xl font-black tracking-tight leading-tight">{cliente.nombre}</h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{cliente.codigo}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!editMode ? (
            canEdit && (
              <Button
                onClick={() => setEditMode(true)}
                variant="outline"
                className="rounded-2xl h-9 px-4 gap-2 font-bold">
                <Edit3 size={14} /> {t("common.actions.edit")}
              </Button>
            )
          ) : (
            <>
              <Button
                onClick={onCancel}
                disabled={saving}
                variant="outline"
                className="rounded-2xl h-9 px-4 gap-2 font-bold">
                <X size={14} /> {t("common.actions.cancel")}
              </Button>
              <Button
                onClick={onSave}
                disabled={saving}
                className="rounded-2xl h-9 px-4 gap-2 font-bold shadow-md shadow-primary/15">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? t("clients.form.saving") : t("common.actions.save")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── GRID PRINCIPAL ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Columna izquierda: Datos */}
        <div className="md:col-span-2 space-y-5">
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 space-y-5">

            {/* Sección info */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border/50" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">{t("clients.form.section_basic")}</span>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Código */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  {t("clients.columns.code")} {editMode && <span className="text-primary">*</span>}
                </label>
                {editMode ? (
                  <input
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    disabled={saving}
                    className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono disabled:opacity-60"
                  />
                ) : (
                  <p className="text-sm font-semibold font-mono">{cliente.codigo}</p>
                )}
              </div>

              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  {t("clients.columns.name")} {editMode && <span className="text-primary">*</span>}
                </label>
                {editMode ? (
                  <input
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    disabled={saving}
                    className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-60"
                  />
                ) : (
                  <p className="text-sm font-semibold">{cliente.nombre}</p>
                )}
              </div>

              {/* Descripción */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{t("clients.columns.description")}</label>
                {editMode ? (
                  <textarea
                    rows={2}
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    disabled={saving}
                    className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm resize-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-60"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{cliente.descripcion || "—"}</p>
                )}
              </div>

              {/* Estatus */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{t("clients.columns.status")}</label>
                {editMode ? (
                  <div className="flex gap-2">
                    {ESTATUS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={saving}
                        onClick={() => setForm({ ...form, estatus: s })}
                        className={[
                          "flex-1 py-2 rounded-xl text-sm font-semibold border transition-all",
                          form.estatus === s
                            ? s === "Activo"
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted border-border text-foreground"
                            : "border-border/60 text-muted-foreground hover:border-border",
                        ].join(" ")}>
                        {s}
                      </button>
                    ))}
                  </div>
                ) : (
                  <StatusBadge estatus={cliente.estatus} />
                )}
              </div>

              {/* Fecha creación */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Calendar size={9} /> {t("clients.form.registered_at")}
                </label>
                <p className="text-xs text-muted-foreground">{createdAtText}</p>
              </div>
            </div>

            {/* Logo en modo edición */}
            {editMode && (
              <>
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">{t("clients.form.logo_section")}</span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>
                <div className="flex items-center gap-4 p-4 border border-dashed border-border/60 rounded-2xl bg-muted/20 dark:bg-slate-800/20">
                  <div className="w-16 h-16 rounded-2xl border border-border/60 bg-muted/40 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    {logoPreview
                      ? <img src={logoPreview} alt="logo" className="w-full h-full object-contain" />
                      : <Building2 size={20} className="text-muted-foreground/30" />}
                  </div>
                  <div className="space-y-2">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-xl border border-border/60 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
                      <ImagePlus size={13} />
                      {logoPreview ? t("clients.form.image_change") : t("clients.form.image_upload")}
                      <input type="file" hidden accept="image/*" onChange={onLogoChange} disabled={saving} />
                    </label>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-all">
                        <Trash2 size={12} /> {t("common.actions.remove")}
                      </button>
                    )}
                    <p className="text-[10px] text-muted-foreground/60">{t("clients.form.image_hint")}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Columna derecha: Stats */}
        <div className="space-y-4">

          {/* Card: Activos */}
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/25 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Monitor size={16} className="text-primary" />
              <p className="text-xs font-black uppercase tracking-widest text-primary/70">{t("clients.tabs.assets")}</p>
            </div>
            <div>
              <p className="text-3xl font-black text-primary">{summary.totalActivos}</p>
              <p className="text-xs text-muted-foreground mt-0.5">total registrado{summary.totalActivos !== 1 ? "s" : ""}</p>
            </div>
            {Object.keys(summary.activosByStatus).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-primary/10">
                {Object.entries(summary.activosByStatus).map(([st, count]) => (
                  <span key={st} className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 dark:bg-primary/15 text-primary border border-primary/20">
                    {st}: {count}
                  </span>
                ))}
              </div>
            )}
            {summaryLoading && <Loader2 size={14} className="animate-spin text-primary/50" />}
          </div>

          {/* Card: Sites */}
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-muted-foreground" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">{t("clients.tabs.sites")}</p>
            </div>
            <div>
              <p className="text-3xl font-black">{summary.totalSites}</p>
              <p className="text-xs text-muted-foreground mt-0.5">total registrado{summary.totalSites !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex gap-2 pt-1 border-t border-border/50">
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {t("clients.filter.active")}: {summary.activeSites}
              </span>
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-muted text-muted-foreground border border-border/60">
                {t("clients.filter.inactive")}: {summary.inactiveSites}
              </span>
            </div>
            {summaryLoading && <Loader2 size={14} className="animate-spin text-muted-foreground/50" />}
          </div>
        </div>
      </div>
    </div>
  );
}
