// src/components/Users/Permissions/UserPermissionsDrawer.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  ShieldCheck,
  Search,
  Loader2,
  Save,
  CheckCircle2,
} from "lucide-react";

import { useToast } from "@/context/ToastContext";
import {
  getUserPermissions,
  updateUserPermissions,
} from "@/services/PermissionsServices";
import useIsMobile from "@/hooks/useIsMobile";
import { Button } from "@/components/ui/button";

// ── Toggle visual (pointer-events-none, el clic lo gestiona la fila padre) ────

const Toggle = ({ checked, disabled }) => (
  <div
    role="switch"
    aria-checked={checked}
    className={[
      "relative shrink-0 mt-0.5 w-9 h-5 rounded-full border transition-all duration-200 pointer-events-none",
      checked
        ? "bg-emerald-500 border-emerald-500"
        : "bg-muted border-border",
      disabled ? "opacity-40" : "",
    ].join(" ")}
  >
    <span
      className={[
        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200",
        checked ? "left-[18px]" : "left-0.5",
      ].join(" ")}
    />
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────────

export default function UserPermissionsDrawer({
  user,
  open,
  onClose,
  onUpdateSuccess,
}) {
  const { showToast } = useToast();
  const isMobile = useIsMobile();

  const [loading, setLoading]                   = useState(false);
  const [saving, setSaving]                     = useState(false);
  const [permissionsData, setPermissionsData]   = useState({});
  const [originalAssigned, setOriginalAssigned] = useState([]);
  const [assignedList, setAssignedList]         = useState([]);
  const [searchTerm, setSearchTerm]             = useState("");

  // ── Carga de permisos ───────────────────────────────────────────────────────
  const fetchPermissions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setSearchTerm("");
    try {
      const res = await getUserPermissions(user.id_usuario);
      const rawGroups = res?.permisos || {};
      setPermissionsData(rawGroups);

      const current = Object.values(rawGroups)
        .flat()
        .filter((p) => p.asignado)
        .map((p) => p.nombre);

      setOriginalAssigned(current);
      setAssignedList(current);
    } catch {
      showToast("Error al cargar permisos", "danger");
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (open) fetchPermissions();
  }, [open, fetchPermissions]);

  // ── Filtrado ────────────────────────────────────────────────────────────────
  const filteredPermissions = useMemo(() => {
    if (!searchTerm.trim()) return permissionsData;
    const term = searchTerm.toLowerCase();
    const result = {};
    Object.entries(permissionsData).forEach(([group, perms]) => {
      const matched = perms.filter(
        (p) =>
          p.nombre.toLowerCase().includes(term) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(term))
      );
      if (matched.length > 0 || group.toLowerCase().includes(term)) {
        result[group] = group.toLowerCase().includes(term) ? perms : matched;
      }
    });
    return result;
  }, [permissionsData, searchTerm]);

  // ── Contador de cambios ─────────────────────────────────────────────────────
  const changesCount = useMemo(() => {
    const orig = new Set(originalAssigned);
    const curr = new Set(assignedList);
    let n = 0;
    for (const p of orig) if (!curr.has(p)) n++;
    for (const p of curr) if (!orig.has(p)) n++;
    return n;
  }, [originalAssigned, assignedList]);

  // ── Acciones ────────────────────────────────────────────────────────────────
  const handleToggle = (nombre) =>
    setAssignedList((prev) =>
      prev.includes(nombre)
        ? prev.filter((p) => p !== nombre)
        : [...prev, nombre]
    );

  const handleGroupToggle = (perms) => {
    const names = perms.map((p) => p.nombre);
    const allOn = names.every((n) => assignedList.includes(n));
    setAssignedList((prev) =>
      allOn
        ? prev.filter((p) => !names.includes(p))
        : [...new Set([...prev, ...names])]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserPermissions(user.id_usuario, assignedList);
      showToast("Permisos actualizados", "success");
      onUpdateSuccess?.();
      onClose();
    } catch {
      showToast("Error al guardar permisos", "danger");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const totalPerms  = Object.values(permissionsData).flat().length;
  const activePerms = assignedList.length;

  // ── Clases del panel (mobile = bottom sheet / desktop = side drawer) ─────────
  const panelClass = isMobile
    ? "absolute inset-x-0 bottom-0 h-[92vh] rounded-t-3xl animate-in slide-in-from-bottom duration-300"
    : "absolute right-0 top-0 h-full w-[480px] animate-in slide-in-from-right duration-300";

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => !saving && onClose()}
      />

      {/* Panel */}
      <div
        className={`${panelClass} bg-card dark:bg-slate-900 shadow-2xl dark:shadow-black/60 flex flex-col overflow-hidden border-l border-border/40`}
        onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="flex-none flex items-center gap-3 px-5 py-4 border-b border-border/60">
          <div className="p-2 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 shrink-0">
            <ShieldCheck size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-black tracking-tight uppercase">
              Permisos del Usuario
            </h2>
            {user?.nombre && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Editando accesos de{" "}
                <span className="font-bold text-foreground">
                  {user.nombre}
                </span>
              </p>
            )}
          </div>
          <button
            onClick={() => !saving && onClose()}
            disabled={saving}
            className="shrink-0 p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40">
            <X size={16} />
          </button>
        </div>

        {/* ── Buscador + contador ── */}
        {!loading && totalPerms > 0 && (
          <div className="flex-none px-4 py-3 border-b border-border/40 bg-muted/20 dark:bg-slate-800/20">
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 group">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Buscar permiso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-card dark:bg-slate-900 border border-border/60 rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-card dark:bg-slate-900 border border-border/60">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-[11px] font-bold text-foreground">
                  {activePerms}
                </span>
                <span className="text-[11px] text-muted-foreground/60">
                  / {totalPerms}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Contenido scrollable ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={18} />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Cargando permisos...
              </p>
            </div>
          ) : Object.keys(filteredPermissions).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <div className="w-12 h-12 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
                <ShieldCheck size={22} className="text-muted-foreground/40" />
              </div>
              <p className="font-bold text-sm">Sin resultados</p>
              <p className="text-xs text-muted-foreground text-center">
                {searchTerm
                  ? `No hay permisos que coincidan con "${searchTerm}"`
                  : "No hay permisos disponibles para este usuario"}
              </p>
            </div>
          ) : (
            Object.entries(filteredPermissions).map(([groupName, perms]) => {
              const activeInGroup = perms.filter((p) =>
                assignedList.includes(p.nombre)
              ).length;
              const allActive = perms.length > 0 && activeInGroup === perms.length;

              return (
                <div key={groupName} className="space-y-2">
                  {/* ── Cabecera del grupo ── */}
                  <div className="flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                        {groupName}
                      </span>
                      <span
                        className={[
                          "px-1.5 py-0.5 text-[10px] font-bold rounded-full border transition-colors",
                          activeInGroup > 0
                            ? "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-muted text-muted-foreground/70 border-border/60",
                        ].join(" ")}>
                        {activeInGroup}/{perms.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGroupToggle(perms)}
                      className="text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors">
                      {allActive ? "Desactivar todo" : "Activar todo"}
                    </button>
                  </div>

                  {/* ── Ítems de permisos ── */}
                  <div className="bg-card dark:bg-slate-900/60 border border-border/60 rounded-2xl overflow-hidden">
                    {perms.map((perm, idx) => {
                      const isActive = assignedList.includes(perm.nombre);
                      return (
                        <div key={perm.id ?? perm.nombre}>
                          {idx > 0 && (
                            <div className="h-px bg-border/40 mx-4" />
                          )}
                          <div
                            className={[
                              "flex items-start gap-3 px-4 py-3 cursor-pointer select-none transition-all duration-150",
                              isActive
                                ? "hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10"
                                : "hover:bg-muted/40 dark:hover:bg-slate-800/40",
                            ].join(" ")}
                            onClick={() => !saving && handleToggle(perm.nombre)}>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <p
                                className={[
                                  "text-[13px] font-bold capitalize leading-tight",
                                  isActive
                                    ? "text-foreground"
                                    : "text-foreground/70",
                                ].join(" ")}>
                                {perm.nombre.replace(/_/g, " ")}
                              </p>
                              {perm.descripcion && (
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                  {perm.descripcion}
                                </p>
                              )}
                            </div>
                            <Toggle checked={isActive} disabled={saving} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer fijo con blur ── */}
        <div className="flex-none px-4 py-3.5 border-t border-border/50 bg-card/95 dark:bg-slate-900/95 backdrop-blur-sm">
          {changesCount > 0 && (
            <p className="text-[11px] text-muted-foreground text-center mb-2.5">
              <span className="font-bold text-foreground">{changesCount}</span>{" "}
              cambio{changesCount !== 1 ? "s" : ""} pendiente
              {changesCount !== 1 ? "s" : ""} por guardar
            </p>
          )}
          <div className="flex gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-2xl h-10 font-bold">
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className={[
                "flex-1 rounded-2xl h-10 font-bold gap-2 shadow-md transition-all duration-200",
                changesCount > 0
                  ? "shadow-primary/15 hover:shadow-primary/30"
                  : "opacity-80",
              ].join(" ")}>
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
