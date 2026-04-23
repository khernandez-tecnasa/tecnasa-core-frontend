// src/pages/Clientes/ClientesList.jsx
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  X,
  Building2,
  Loader2,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ImagePlus,
  Trash2,
  Save,
  ExternalLink,
} from "lucide-react";

import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import useIsMobile from "@/hooks/useIsMobile";
import usePermissions from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";

import {
  getClientes,
  createCliente,
} from "@/services/ClientesServices.jsx";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESTATUS = ["Activo", "Inactivo"];

function StatusBadge({ estatus }) {
  if (estatus === "Activo") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Activo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-muted text-muted-foreground border border-border/60">
      Inactivo
    </span>
  );
}

function ClienteAvatar({ src, nombre, size = "sm" }) {
  const sizeClass = size === "lg"
    ? "w-16 h-16 text-xl rounded-2xl"
    : "w-9 h-9 text-sm rounded-xl";

  if (src) {
    return (
      <img
        src={src}
        alt={nombre}
        className={`${sizeClass} object-contain bg-muted/40 dark:bg-slate-800 shrink-0`}
      />
    );
  }
  return (
    <div className={`${sizeClass} shrink-0 bg-primary/10 dark:bg-primary/15 text-primary font-black flex items-center justify-center`}>
      {(nombre || "?")[0].toUpperCase()}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ClientesList() {
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("todos");
  const [sortKey, setSortKey]             = useState("nombre");
  const [sortDir, setSortDir]             = useState("asc");

  const [open, setOpen]             = useState(false);
  const [form, setForm]             = useState({ codigo: "", nombre: "", descripcion: "", estatus: "Activo" });
  const [logoFile, setLogoFile]     = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving]         = useState(false);

  const isMobile        = useIsMobile(768);
  const { showToast }   = useToast();
  const { checkingSession } = useAuth();
  const searchInputRef  = useRef(null);

  const { canAny } = usePermissions();
  const canView   = canAny("ver_companias");
  const canCreate = canAny("crear_companias");

  // ── Carga ───────────────────────────────────────────────────────────────────
  const loadClientes = useCallback(async () => {
    if (checkingSession) { setLoading(true); return; }
    if (!canView) { setLoading(false); setError(null); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await getClientes();
      if (data) setRows(data);
      else setError("Error al cargar los clientes");
    } catch (err) {
      setError(err?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [checkingSession, canView]);

  useEffect(() => { loadClientes(); }, [loadClientes]);

  // Cleanup blobs
  useEffect(() => {
    return () => { if (logoPreview && logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview); };
  }, [logoPreview]);

  // Atajos de teclado
  useEffect(() => {
    const handleKey = (e) => {
      const tag = e.target.tagName.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || e.target.isContentEditable;
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      if (!isTyping && e.key === "/") { e.preventDefault(); searchInputRef.current?.focus(); return; }
      if (!isTyping && ctrlOrMeta && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (canCreate) newCliente();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [canCreate]);

  // ── Formulario ───────────────────────────────────────────────────────────────
  function newCliente() {
    if (!canCreate) return showToast("Sin permisos", "warning");
    setForm({ codigo: "", nombre: "", descripcion: "", estatus: "Activo" });
    setLogoFile(null);
    setLogoPreview(null);
    setOpen(true);
  }

  function onLogoChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) return showToast("Solo se aceptan imágenes", "warning");
    if (f.size > 2 * 1024 * 1024) return showToast("La imagen supera 2 MB", "warning");
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  }

  async function onSubmit(e) {
    e?.preventDefault();
    if (!canCreate) return showToast("Sin permisos", "warning");
    if (!form.codigo.trim()) return showToast("El código es obligatorio", "warning");
    if (!form.nombre.trim()) return showToast("El nombre es obligatorio", "warning");
    setSaving(true);
    try {
      await createCliente(form, logoFile);
      showToast("Cliente creado correctamente", "success");
      setOpen(false);
      loadClientes();
    } catch (err) {
      showToast(err?.message || "Error al crear el cliente", "danger");
    } finally {
      setSaving(false);
    }
  }

  // ── Filtros y ordenamiento ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    return (Array.isArray(rows) ? rows : []).filter((r) => {
      const matchSearch = !q || (r.codigo || "").toLowerCase().includes(q) || (r.nombre || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "todos" ? true : r.estatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [rows, search, statusFilter]);

  const sortedRows = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = (a?.[sortKey] ?? "").toString().toLowerCase();
      const vb = (b?.[sortKey] ?? "").toString().toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key) => {
    if (!key) return;
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-muted-foreground/40" />;
    return sortDir === "asc"
      ? <ChevronUp size={12} className="text-primary" />
      : <ChevronDown size={12} className="text-primary" />;
  };

  // ── Guard ────────────────────────────────────────────────────────────────────
  if (!canView && !checkingSession) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 opacity-40">
          <Building2 size={40} className="mx-auto" />
          <p className="font-semibold text-sm">Acceso denegado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <Building2 size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">Clientes</h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Gestiona las compañías y sus sitios asociados
            </p>
          </div>
        </div>
        {canCreate && (
          <Button
            onClick={newCliente}
            className="rounded-2xl px-5 h-10 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 gap-2 shrink-0">
            <Plus size={17} strokeWidth={2.5} />
            <span className="hidden sm:inline">Nuevo Cliente</span>
          </Button>
        )}
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs group">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-8 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/50 shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-md transition-colors text-muted-foreground/60 hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border/60">
          {[["todos", "Todos"], ["Activo", "Activos"], ["Inactivo", "Inactivos"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={[
                "px-3 py-1 text-xs font-semibold rounded-lg transition-all",
                statusFilter === val
                  ? "bg-card dark:bg-slate-800 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}>
              {label}
            </button>
          ))}
        </div>

        {!loading && (
          <span className="text-xs text-muted-foreground/70 font-medium whitespace-nowrap">
            <span className="font-bold text-foreground">{sortedRows.length}</span>
            {search || statusFilter !== "todos" ? ` de ${rows.length}` : ` cliente${rows.length !== 1 ? "s" : ""}`}
          </span>
        )}
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={22} />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Cargando clientes...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 dark:bg-rose-500/15 flex items-center justify-center">
              <Building2 size={28} className="text-rose-500/50" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm">Error al cargar</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={loadClientes} variant="outline" size="sm" className="rounded-xl">Reintentar</Button>
          </div>
        ) : sortedRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="w-16 h-16 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
              <Building2 size={28} className="text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm">{search ? "Sin resultados" : "Sin clientes"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? `No hay coincidencias para "${search}"` : "Crea el primer cliente usando el botón de arriba"}
              </p>
            </div>
          </div>
        ) : isMobile ? (

          /* ── MOBILE: CARDS ── */
          <div className="divide-y divide-border/50">
            {sortedRows.map((r) => (
              <Link
                key={r.id}
                to={`/admin/clientes/${r.id}/informacion`}
                className="flex items-center gap-3 p-4 hover:bg-muted/20 dark:hover:bg-slate-800/30 transition-colors group">
                <ClienteAvatar src={r.logo_url} nombre={r.nombre} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{r.nombre}</p>
                  <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{r.codigo}</p>
                </div>
                <StatusBadge estatus={r.estatus} />
              </Link>
            ))}
          </div>

        ) : (

          /* ── DESKTOP: TABLA ── */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 dark:bg-slate-800/30">
                  {[
                    { key: "nombre", label: "Cliente" },
                    { key: "codigo", label: "Código" },
                    { key: null, label: "Descripción" },
                    { key: "estatus", label: "Estado" },
                    { key: null, label: "" },
                  ].map(({ key, label }, i) => (
                    <th
                      key={i}
                      onClick={() => handleSort(key)}
                      className={`px-6 py-3.5 text-left ${key ? "cursor-pointer select-none" : ""}`}>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                        {label}
                        {key && <SortIcon col={key} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ClienteAvatar src={r.logo_url} nombre={r.nombre} />
                        <div>
                          <Link
                            to={`/admin/clientes/${r.id}/informacion`}
                            className="font-bold text-sm hover:text-primary transition-colors">
                            {r.nombre}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-muted-foreground font-mono">{r.codigo}</span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <span className="text-sm text-muted-foreground line-clamp-1">{r.descripcion || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge estatus={r.estatus} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <Link
                          to={`/admin/clientes/${r.id}/informacion`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all">
                          <ExternalLink size={12} />
                          Ver detalle
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── PANEL LATERAL: CREAR CLIENTE ── */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !saving && setOpen(false)}
          />
          <div className={`${isMobile ? "absolute inset-x-0 bottom-0 h-[92vh] rounded-t-3xl animate-in slide-in-from-bottom duration-300" : "absolute right-0 top-0 h-full w-[440px] animate-in slide-in-from-right duration-300"} bg-card dark:bg-slate-900 shadow-2xl dark:shadow-black/60 flex flex-col border-l border-border/40`}
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex-none flex items-center gap-3 px-6 py-4 border-b border-border/60">
              <div className="p-2 bg-primary/10 dark:bg-primary/15 rounded-2xl ring-1 ring-primary/20 dark:ring-primary/25">
                <Building2 size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black tracking-tight">Nuevo Cliente</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Completa la información de la compañía</p>
              </div>
              <button
                onClick={() => !saving && setOpen(false)}
                disabled={saving}
                className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-40 text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            {/* Cuerpo scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-5">

              {/* Sección: Info básica */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Información básica</span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>

                {/* Código */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    Código <span className="text-primary">*</span>
                  </label>
                  <input
                    autoFocus
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    disabled={saving}
                    placeholder="ej: CLI-001, ACME..."
                    className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 disabled:opacity-60"
                  />
                </div>

                {/* Nombre */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    Nombre <span className="text-primary">*</span>
                  </label>
                  <input
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    disabled={saving}
                    placeholder="Nombre de la compañía..."
                    className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 disabled:opacity-60"
                  />
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    Descripción
                  </label>
                  <textarea
                    rows={2}
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    disabled={saving}
                    placeholder="Descripción opcional..."
                    className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm resize-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 disabled:opacity-60"
                  />
                </div>

                {/* Estatus */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    Estatus <span className="text-primary">*</span>
                  </label>
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
                </div>
              </div>

              {/* Sección: Logo */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Logo</span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>

                <div className="flex items-center gap-4 p-4 border border-dashed border-border/60 rounded-2xl bg-muted/20 dark:bg-slate-800/20">
                  <div className="w-16 h-16 rounded-2xl border border-border/60 bg-muted/40 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {logoPreview
                      ? <img src={logoPreview} alt="logo" className="w-full h-full object-contain" />
                      : <Building2 size={20} className="text-muted-foreground/30" />}
                  </div>
                  <div className="space-y-2">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-xl border border-border/60 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
                      <ImagePlus size={13} />
                      {logoPreview ? "Cambiar imagen" : "Subir logo"}
                      <input type="file" hidden accept="image/*" onChange={onLogoChange} disabled={saving} />
                    </label>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-all">
                        <Trash2 size={12} /> Quitar
                      </button>
                    )}
                    <p className="text-[10px] text-muted-foreground/60">PNG, JPG. Máx 2 MB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-none px-6 py-4 border-t border-border/50 bg-card/95 dark:bg-slate-900/95 backdrop-blur-sm">
              <div className="flex gap-2.5">
                <Button
                  type="button"
                  disabled={saving}
                  onClick={onSubmit}
                  className="flex-1 rounded-2xl h-10 font-bold shadow-md shadow-primary/15 hover:shadow-primary/25 transition-all gap-2 disabled:opacity-60">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? "Guardando..." : "Crear Cliente"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                  className="flex-1 rounded-2xl h-10 font-bold">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
