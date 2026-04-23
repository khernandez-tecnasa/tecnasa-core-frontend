// src/pages/Administration/Roles/RolesList.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Search,
  Loader2,
  X,
  ShieldCheck,
  AlertTriangle,
  MoreVertical,
  KeyRound,
  Check,
  ChevronDown,
  ChevronRight,
  Save,
} from "lucide-react";

import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions,
  getAllPermisos,
} from "@/services/RolesServices";

import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import useIsMobile from "@/hooks/useIsMobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupPermisosByCategory(permisos) {
  const groups = {};
  (permisos || []).forEach((p) => {
    const raw =
      p.grupo ||
      p.category ||
      p.categoria ||
      p.group ||
      (() => {
        const parts = (p.nombre || "").split("_");
        return parts.length > 1 ? parts[1] : p.nombre;
      })();
    const label =
      String(raw).charAt(0).toUpperCase() +
      String(raw).slice(1).replace(/_/g, " ");
    if (!groups[label]) groups[label] = [];
    groups[label].push(p);
  });
  return Object.fromEntries(
    Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  );
}

function getPermisosCount(rol) {
  return (
    rol.total_permisos ??
    rol.permisos_count ??
    rol.num_permisos ??
    rol.cantPermisos ??
    rol.cantidad_permisos ??
    rol.permisos?.length ??
    null
  );
}

const FORM_INIT = { nombre: "", descripcion: "" };

// ── Componente principal ──────────────────────────────────────────────────────

export default function RolesList() {
  const { showToast } = useToast();
  const { can } = useAuth();
  const isMobile = useIsMobile();

  const canManage = can("asignar_permisos");

  const [roles, setRoles]           = useState([]);
  const [allPermisos, setAllPermisos] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal crear / editar
  const [modal, setModal]                       = useState(null);
  const [editTarget, setEditTarget]             = useState(null);
  const [form, setForm]                         = useState(FORM_INIT);
  const [selectedPermisos, setSelectedPermisos] = useState([]);
  const [loadingModal, setLoadingModal]         = useState(false);
  const [saving, setSaving]                     = useState(false);
  const [collapsedGroups, setCollapsedGroups]   = useState({});

  // Modal eliminar
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesData, permisosData] = await Promise.all([
        getRoles(),
        getAllPermisos(),
      ]);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setAllPermisos(Array.isArray(permisosData) ? permisosData : []);
    } catch {
      showToast("Error al cargar los datos", "danger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Modales ─────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(FORM_INIT);
    setSelectedPermisos([]);
    setCollapsedGroups({});
    setEditTarget(null);
    setModal("create");
  };

  const openEdit = async (rol) => {
    setForm({ nombre: rol.nombre || "", descripcion: rol.descripcion || "" });
    setSelectedPermisos([]);
    setCollapsedGroups({});
    setEditTarget(rol);
    setModal("edit");
    setLoadingModal(true);
    try {
      const full = await getRoleById(rol.id);
      if (full) {
        setForm({
          nombre:      full.nombre      || rol.nombre      || "",
          descripcion: full.descripcion || rol.descripcion || "",
        });
        const rawPerms = Array.isArray(full.permisos)
          ? full.permisos
          : Array.isArray(full.permisos_asignados)
            ? full.permisos_asignados
            : [];
        const ids = rawPerms.map((p) => (typeof p === "object" ? p.id : p));
        setSelectedPermisos(ids.filter(Boolean));
      }
    } catch {
      showToast("Error al cargar los permisos del rol", "danger");
    } finally {
      setLoadingModal(false);
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModal(null);
    setEditTarget(null);
    setForm(FORM_INIT);
    setSelectedPermisos([]);
  };

  // ── Toggles de permisos ─────────────────────────────────────────────────────
  const togglePermiso = (id) =>
    setSelectedPermisos((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  const toggleGroup = (groupPerms, allSelected) => {
    const ids = groupPerms.map((p) => p.id);
    setSelectedPermisos((prev) =>
      allSelected
        ? prev.filter((id) => !ids.includes(id))
        : [...new Set([...prev, ...ids])]
    );
  };

  // ── Guardar ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.nombre.trim())
      return showToast("El nombre del rol es obligatorio", "warning");

    setSaving(true);
    try {
      if (modal === "create") {
        const created = await createRole({
          nombre:      form.nombre.trim(),
          descripcion: form.descripcion.trim(),
        });
        const newId = created?.id ?? created?.insertId ?? null;
        if (newId && selectedPermisos.length > 0)
          await updateRolePermissions(newId, selectedPermisos);
        showToast("Rol creado correctamente", "success");
      } else {
        await updateRole(editTarget.id, {
          nombre:      form.nombre.trim(),
          descripcion: form.descripcion.trim(),
        });
        await updateRolePermissions(editTarget.id, selectedPermisos);
        showToast("Rol actualizado correctamente", "success");
      }
      closeModal();
      fetchAll();
    } catch {
      showToast("Error al guardar el rol", "danger");
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRole(deleteTarget.id);
      showToast("Rol eliminado correctamente", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      showToast("Error al eliminar el rol", "danger");
    } finally {
      setDeleting(false);
    }
  };

  // ── Filtrado ────────────────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      roles.filter((r) =>
        (r.nombre || "").toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [roles, searchTerm]
  );

  const groupedPermisos = groupPermisosByCategory(allPermisos);

  // ── AccionesMenu ────────────────────────────────────────────────────────────
  const AccionesMenu = ({ rol }) => (
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
        className="w-44 rounded-2xl shadow-xl border-border/60">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
          Acciones
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => openEdit(rol)}
          className="rounded-xl cursor-pointer gap-2 text-sm">
          <Edit3 size={13} /> Editar Rol
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setDeleteTarget(rol)}
          className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 rounded-xl cursor-pointer gap-2 text-sm">
          <Trash2 size={13} /> Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // ── Guard ────────────────────────────────────────────────────────────────────
  if (!canManage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 opacity-40">
          <ShieldCheck size={40} className="mx-auto" />
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
            <ShieldCheck size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Roles
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Administra los roles del sistema y sus permisos asignados
            </p>
          </div>
        </div>

        <Button
          onClick={openCreate}
          className="rounded-2xl px-5 h-10 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 gap-2 shrink-0">
          <Plus size={17} strokeWidth={2.5} />
          <span className="hidden sm:inline">Nuevo Rol</span>
        </Button>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-xs group">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar rol..."
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
            <span className="font-bold text-foreground">{filtered.length}</span>
            {searchTerm
              ? ` de ${roles.length}`
              : ` rol${roles.length !== 1 ? "es" : ""}`}
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
            <p className="text-sm text-muted-foreground font-medium">
              Cargando roles...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="w-16 h-16 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
              <ShieldCheck size={28} className="text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm">
                {searchTerm ? "Sin resultados" : "Sin roles registrados"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchTerm
                  ? `No hay coincidencias para "${searchTerm}"`
                  : "Crea el primer rol usando el botón de arriba"}
              </p>
            </div>
          </div>
        ) : isMobile ? (

          /* ── MOBILE: CARDS ── */
          <div className="divide-y divide-border/50">
            {filtered.map((rol) => {
              const count = getPermisosCount(rol);
              return (
                <div
                  key={rol.id}
                  className="p-4 flex items-center gap-3 hover:bg-muted/20 dark:hover:bg-slate-800/30 transition-colors group">
                  <div className="w-10 h-10 shrink-0 rounded-2xl bg-muted/60 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:ring-1 ring-primary/20 flex items-center justify-center transition-all duration-200">
                    <ShieldCheck
                      size={17}
                      className="text-muted-foreground group-hover:text-primary transition-colors"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm capitalize truncate">
                      {rol.nombre}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {rol.descripcion || "Sin descripción"}
                    </p>
                  </div>
                  {count !== null && (
                    <span className="shrink-0 px-2 py-1 text-[10px] font-bold rounded-full bg-primary/10 dark:bg-primary/15 text-primary border border-primary/20">
                      {count} perm.
                    </span>
                  )}
                  <AccionesMenu rol={rol} />
                </div>
              );
            })}
          </div>

        ) : (

          /* ── DESKTOP: TABLA ── */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 dark:bg-slate-800/30">
                  {["Rol", "Descripción", "Permisos", ""].map((h, i) => (
                    <th
                      key={i}
                      className={`px-6 py-3.5 ${
                        i === 2
                          ? "text-center"
                          : i === 3
                          ? "text-right"
                          : "text-left"
                      }`}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                        {h}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((rol) => {
                  const count = getPermisosCount(rol);
                  return (
                    <tr
                      key={rol.id}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors group">

                      {/* Rol */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 shrink-0 rounded-xl bg-muted/60 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:ring-1 ring-primary/20 flex items-center justify-center transition-all duration-200">
                            <ShieldCheck
                              size={16}
                              className="text-muted-foreground group-hover:text-primary transition-colors"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-sm capitalize">
                              {rol.nombre}
                            </div>
                            <div className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                              #{String(rol.id).padStart(4, "0")}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Descripción */}
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs">
                        <span className="line-clamp-1">
                          {rol.descripcion || "—"}
                        </span>
                      </td>

                      {/* Permisos */}
                      <td className="px-6 py-4 text-center">
                        {count !== null ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-primary/10 dark:bg-primary/15 text-primary border border-primary/20 dark:border-primary/25">
                            <KeyRound size={9} />
                            {count}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50 text-sm">
                            —
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          <AccionesMenu rol={rol} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL CREAR / EDITAR ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={closeModal}>
          <div
            className="w-full max-w-2xl bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 flex flex-col max-h-[92vh] animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex-none flex items-center gap-3 px-6 py-4 border-b border-border/60">
              <div className="p-2 bg-primary/10 dark:bg-primary/15 rounded-2xl ring-1 ring-primary/20 dark:ring-primary/25">
                <ShieldCheck size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black tracking-tight">
                  {modal === "create" ? "Nuevo Rol" : "Editar Rol"}
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {modal === "create"
                    ? "Define el nombre, descripción y permisos del rol"
                    : `Modificando: ${editTarget?.nombre}`}
                </p>
              </div>
              <button
                onClick={closeModal}
                disabled={saving}
                className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-40 text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            {/* Cuerpo scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-5">

              {/* ── Sección: Información básica ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">
                    Información básica
                  </span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    Nombre del Rol <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nombre: e.target.value }))
                    }
                    placeholder="ej: Supervisor, Operador, Contabilidad..."
                    disabled={saving}
                    className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    Descripción
                  </label>
                  <textarea
                    rows={2}
                    value={form.descripcion}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, descripcion: e.target.value }))
                    }
                    placeholder="Describe las responsabilidades y alcance de este rol..."
                    disabled={saving}
                    className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm resize-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* ── Sección: Permisos ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-px w-6 bg-border/50" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Permisos
                    </span>
                  </div>
                  <span
                    className={[
                      "flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-colors",
                      selectedPermisos.length > 0
                        ? "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border/60",
                    ].join(" ")}>
                    <KeyRound size={10} />
                    {selectedPermisos.length} / {allPermisos.length}
                  </span>
                </div>

                {loadingModal ? (
                  <div className="flex items-center justify-center gap-3 py-12 rounded-2xl border border-border/60 bg-muted/20 dark:bg-slate-800/20 text-muted-foreground">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm font-medium">
                      Cargando permisos del rol...
                    </span>
                  </div>
                ) : allPermisos.length === 0 ? (
                  <div className="text-center py-10 rounded-2xl border border-border/60 bg-muted/20 dark:bg-slate-800/20">
                    <KeyRound
                      size={24}
                      className="mx-auto mb-2 text-muted-foreground/30"
                    />
                    <p className="text-sm text-muted-foreground font-medium">
                      No hay permisos disponibles
                    </p>
                  </div>
                ) : (
                  <div className="border border-border/60 rounded-2xl overflow-hidden bg-card dark:bg-slate-900/60 max-h-72 overflow-y-auto">
                    {Object.entries(groupedPermisos).map(
                      ([category, perms], catIdx) => {
                        const allSelected = perms.every((p) =>
                          selectedPermisos.includes(p.id)
                        );
                        const someSelected = perms.some((p) =>
                          selectedPermisos.includes(p.id)
                        );
                        const selectedCount = perms.filter((p) =>
                          selectedPermisos.includes(p.id)
                        ).length;
                        const isCollapsed = collapsedGroups[category];

                        return (
                          <div
                            key={category}
                            className={
                              catIdx > 0 ? "border-t border-border/40" : ""
                            }>
                            {/* Cabecera de grupo */}
                            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 dark:bg-slate-800/30 sticky top-0 z-10">
                              <button
                                type="button"
                                onClick={() =>
                                  setCollapsedGroups((prev) => ({
                                    ...prev,
                                    [category]: !prev[category],
                                  }))
                                }
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 hover:text-primary transition-colors">
                                {isCollapsed ? (
                                  <ChevronRight size={12} />
                                ) : (
                                  <ChevronDown size={12} />
                                )}
                                {category}
                                <span
                                  className={[
                                    "px-1.5 py-0.5 text-[10px] font-bold rounded-full border normal-case tracking-normal",
                                    someSelected
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                      : "bg-muted text-muted-foreground/70 border-border/60",
                                  ].join(" ")}>
                                  {selectedCount}/{perms.length}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  toggleGroup(perms, allSelected)
                                }
                                className="text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors">
                                {allSelected
                                  ? "Quitar todos"
                                  : "Activar todos"}
                              </button>
                            </div>

                            {/* Items del grupo */}
                            {!isCollapsed && (
                              <div>
                                {perms.map((p, idx) => {
                                  const checked = selectedPermisos.includes(
                                    p.id
                                  );
                                  return (
                                    <div key={p.id}>
                                      {idx > 0 && (
                                        <div className="h-px bg-border/30 mx-4" />
                                      )}
                                      <div
                                        onClick={() => togglePermiso(p.id)}
                                        className={[
                                          "flex items-start gap-3 px-4 py-2.5 cursor-pointer select-none transition-all duration-150",
                                          checked
                                            ? "hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10"
                                            : "hover:bg-muted/40 dark:hover:bg-slate-800/40",
                                        ].join(" ")}>
                                        <div
                                          className={[
                                            "w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                                            checked
                                              ? "bg-primary border-primary"
                                              : "border-border bg-background hover:border-primary/60",
                                          ].join(" ")}>
                                          {checked && (
                                            <Check
                                              size={9}
                                              className="text-primary-foreground"
                                              strokeWidth={3}
                                            />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p
                                            className={[
                                              "text-[13px] font-bold capitalize leading-tight",
                                              checked
                                                ? "text-foreground"
                                                : "text-foreground/70",
                                            ].join(" ")}>
                                            {p.nombre.replace(/_/g, " ")}
                                          </p>
                                          {p.descripcion && (
                                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                              {p.descripcion}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-none px-6 py-4 border-t border-border/50 bg-card/95 dark:bg-slate-900/95 backdrop-blur-sm">
              <div className="flex gap-2.5">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || loadingModal || !form.nombre.trim()}
                  className="flex-1 rounded-2xl h-10 font-bold shadow-md shadow-primary/15 hover:shadow-primary/25 transition-all gap-2 disabled:opacity-60">
                  {saving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : modal === "create" ? (
                    <Plus size={15} />
                  ) : (
                    <Save size={15} />
                  )}
                  {saving
                    ? "Guardando..."
                    : modal === "create"
                    ? "Crear Rol"
                    : "Guardar Cambios"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 rounded-2xl h-10 font-bold">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ELIMINAR ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !deleting && setDeleteTarget(null)}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/10 dark:bg-rose-500/15 rounded-2xl ring-1 ring-rose-500/20 shrink-0">
                <AlertTriangle size={20} className="text-rose-500" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">
                  Eliminar Rol
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  ¿Eliminar el rol{" "}
                  <span className="font-bold text-foreground capitalize">
                    "{deleteTarget.nombre}"
                  </span>
                  ? Esta acción no se puede deshacer y afectará a todos los
                  usuarios con este rol asignado.
                </p>
              </div>
            </div>

            <div className="h-px bg-border/50" />

            <div className="flex gap-2.5">
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-2xl h-10 bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 hover:shadow-rose-600/30 transition-all gap-2 disabled:opacity-60">
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
    </div>
  );
}
