// src/pages/Users/UsersList.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users2,
  Plus,
  Search,
  X,
  Edit3,
  Loader2,
  MoreVertical,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  UserCheck,
  UserX,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
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

import {
  getUsers,
  deleteUser,
  restoreUser,
} from "@/services/AuthServices";
import { getRoles } from "@/services/RolesServices";
import { sendRecoveryPassword } from "@/services/MailServices";
import UserPermissionsDrawer from "@/components/Users/Permissions/UserPermissionsDrawer";

// ── Helpers ───────────────────────────────────────────────────────────────────

const normalize = (val) =>
  (val || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

// ── Componente ────────────────────────────────────────────────────────────────

export default function UsersList() {
  const navigate = useNavigate();
  const { userData, hasPermiso } = useAuth();
  const { showToast } = useToast();
  const isMobile = useIsMobile();

  // Mismo patrón que el Users.jsx original: isAdmin bypass + permisos del rol
  const isAdmin = useCallback(
    () =>
      (userData?.rol || userData?.role || "").toLowerCase() === "admin" ||
      Boolean(userData?.isAdmin) ||
      Boolean(userData?.es_admin),
    [userData]
  );
  const can = useCallback(
    (p) => isAdmin() || hasPermiso(p),
    [isAdmin, hasPermiso]
  );

  const canView        = can("ver_usuarios");
  const canCreate      = can("crear_usuario");
  const canEdit        = can("editar_usuario");
  const canDelete      = can("eliminar_usuario");
  const canRestore     = can("restaurar_usuario");
  const canAssignPerms = can("asignar_permisos");

  const [users, setUsers]                   = useState([]);
  const [roles, setRoles]                   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState("");
  const [showInactive, setShowInactive]     = useState(false);
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [deleting, setDeleting]             = useState(false);
  const [permDrawerOpen, setPermDrawerOpen] = useState(false);
  const [permUser, setPermUser]             = useState(null);

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([getUsers(), getRoles()]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch {
      showToast("Error al cargar los datos", "danger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getRoleName = useCallback(
    (rol_id) => {
      if (!rol_id) return null;
      const r = roles.find((r) => String(r.id) === String(rol_id));
      return r?.nombre || r?.name || null;
    },
    [roles]
  );

  // ── Filtrado ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const s = normalize(search);
    return users.filter((u) => {
      const active = (u.estatus || "Activo") === "Activo";
      if (!showInactive && !active) return false;
      const roleName = getRoleName(u.rol_id) || u.rol || "";
      const text = normalize(
        `${u.nombre} ${u.email} ${u.username} ${roleName} ${u.puesto || ""} ${u.ciudad || ""}`
      );
      return text.includes(s);
    });
  }, [users, showInactive, search, getRoleName]);

  // ── Acciones ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const r = await deleteUser(deleteTarget.id_usuario);
      if (r && !r.error) {
        showToast("Usuario desactivado", "success");
        setUsers((prev) =>
          prev.map((u) =>
            u.id_usuario === deleteTarget.id_usuario
              ? { ...u, estatus: "Inactivo" }
              : u
          )
        );
        setDeleteTarget(null);
      } else {
        showToast("Error al desactivar", "danger");
      }
    } catch {
      showToast("Error al desactivar", "danger");
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = useCallback(
    async (user) => {
      try {
        const r = await restoreUser(user.id_usuario);
        if (r && !r.error) {
          showToast("Usuario restaurado", "success");
          setUsers((prev) =>
            prev.map((u) =>
              u.id_usuario === user.id_usuario ? { ...u, estatus: "Activo" } : u
            )
          );
        } else {
          showToast("Error al restaurar", "danger");
        }
      } catch {
        showToast("Error al restaurar", "danger");
      }
    },
    [showToast]
  );

  const handleResetPassword = useCallback(
    async (email) => {
      if (!email) return;
      try {
        await sendRecoveryPassword(email);
        showToast("Correo de recuperación enviado", "success");
      } catch {
        showToast("Error al enviar correo", "danger");
      }
    },
    [showToast]
  );

  // ── Menú de acciones ────────────────────────────────────────────────────────
  const AccionesMenu = ({ user }) => {
    const isInactive = (user.estatus || "Activo") !== "Activo";
    return (
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
          className="w-48 rounded-2xl shadow-xl border-border/60">
          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
            Acciones
          </DropdownMenuLabel>

          {canEdit && (
            <DropdownMenuItem
              onClick={() => navigate(`edit/${user.id_usuario}`)}
              className="rounded-xl cursor-pointer gap-2 text-sm">
              <Edit3 size={13} /> Editar
            </DropdownMenuItem>
          )}

          {canAssignPerms && (
            <DropdownMenuItem
              onClick={() => {
                setPermUser(user);
                setPermDrawerOpen(true);
              }}
              className="rounded-xl cursor-pointer gap-2 text-sm">
              <ShieldCheck size={13} /> Permisos
            </DropdownMenuItem>
          )}

          {canEdit && (
            <DropdownMenuItem
              onClick={() => handleResetPassword(user.email)}
              className="rounded-xl cursor-pointer gap-2 text-sm">
              <KeyRound size={13} /> Resetear contraseña
            </DropdownMenuItem>
          )}

          {(canDelete || canRestore) && <DropdownMenuSeparator />}

          {!isInactive && canDelete && (
            <DropdownMenuItem
              onClick={() => setDeleteTarget(user)}
              className="text-amber-600 focus:text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-950/30 rounded-xl cursor-pointer gap-2 text-sm">
              <UserX size={13} /> Desactivar
            </DropdownMenuItem>
          )}

          {isInactive && canRestore && (
            <DropdownMenuItem
              onClick={() => handleRestore(user)}
              className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950/30 rounded-xl cursor-pointer gap-2 text-sm">
              <UserCheck size={13} /> Restaurar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // ── Guard ───────────────────────────────────────────────────────────────────
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 opacity-40">
          <Users2 size={40} className="mx-auto" />
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
            <Users2 size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Usuarios
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Gestiona los usuarios y sus accesos al sistema
            </p>
          </div>
        </div>

        {canCreate && (
          <Button
            onClick={() => navigate("new")}
            className="rounded-2xl px-5 h-10 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 gap-2 shrink-0">
            <Plus size={17} strokeWidth={2.5} />
            <span className="hidden sm:inline">Nuevo</span>
          </Button>
        )}
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Buscador */}
        <div className="relative w-full max-w-xs group">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-8 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/50 shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-md transition-colors text-muted-foreground/60 hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Toggle inactivos */}
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <div
            onClick={() => setShowInactive((v) => !v)}
            className={[
              "relative w-9 h-5 rounded-full border transition-all duration-200 cursor-pointer",
              showInactive
                ? "bg-primary border-primary"
                : "bg-muted border-border hover:border-primary/40",
            ].join(" ")}>
            <span
              className={[
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                showInactive ? "left-4" : "left-0.5",
              ].join(" ")}
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">
            Incluir inactivos
          </span>
        </label>

        {/* Contador */}
        {!loading && (
          <span className="text-xs text-muted-foreground/70 font-medium whitespace-nowrap">
            <span className="font-bold text-foreground">{filtered.length}</span>
            {search
              ? ` de ${users.length}`
              : ` usuario${users.length !== 1 ? "s" : ""}`}
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
              Cargando usuarios...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="w-16 h-16 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
              <Users2 size={28} className="text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm">
                {search ? "Sin resultados" : "Sin usuarios registrados"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search
                  ? `No hay coincidencias para "${search}"`
                  : "Crea el primer usuario usando el botón de arriba"}
              </p>
            </div>
          </div>
        ) : isMobile ? (

          /* ── MOBILE: CARDS ── */
          <div className="divide-y divide-border/50">
            {filtered.map((u) => {
              const isInactive = (u.estatus || "Activo") !== "Activo";
              const roleName   = getRoleName(u.rol_id) || u.rol;
              return (
                <div
                  key={u.id_usuario}
                  className="p-4 flex items-center gap-3 hover:bg-muted/20 dark:hover:bg-slate-800/30 transition-colors group">
                  {/* Avatar inicial */}
                  <div className="w-10 h-10 shrink-0 rounded-2xl bg-muted/60 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:ring-1 ring-primary/20 flex items-center justify-center transition-all duration-200">
                    <span className="text-sm font-black text-muted-foreground group-hover:text-primary transition-colors uppercase">
                      {(u.nombre || u.username || "?")[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm truncate">
                        {u.nombre || u.username}
                      </p>
                      {isInactive && (
                        <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-muted text-muted-foreground border border-border/60">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {u.email}
                    </p>
                    {roleName && (
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary/10 dark:bg-primary/15 text-primary border border-primary/20">
                        {roleName}
                      </span>
                    )}
                  </div>
                  <AccionesMenu user={u} />
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
                  {["Usuario", "Correo", "Rol", "Estado", ""].map((h, i) => (
                    <th
                      key={i}
                      className={`px-6 py-3.5 ${i === 4 ? "text-right" : "text-left"}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                        {h}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isInactive = (u.estatus || "Activo") !== "Activo";
                  const roleName   = getRoleName(u.rol_id) || u.rol;
                  return (
                    <tr
                      key={u.id_usuario}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors group">

                      {/* Usuario */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 shrink-0 rounded-xl bg-muted/60 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:ring-1 ring-primary/20 flex items-center justify-center transition-all duration-200">
                            <span className="text-xs font-black text-muted-foreground group-hover:text-primary transition-colors uppercase">
                              {(u.nombre || u.username || "?")[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-sm">
                              {u.nombre || "—"}
                            </div>
                            <div className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                              @{u.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Correo */}
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {u.email || "—"}
                      </td>

                      {/* Rol */}
                      <td className="px-6 py-4">
                        {roleName ? (
                          <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full bg-primary/10 dark:bg-primary/15 text-primary border border-primary/20 dark:border-primary/25">
                            {roleName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50 text-sm">—</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        <span
                          className={[
                            "inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full border",
                            isInactive
                              ? "bg-muted/50 text-muted-foreground border-border/60"
                              : "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                          ].join(" ")}>
                          {isInactive ? "Inactivo" : "Activo"}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          <AccionesMenu user={u} />
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

      {/* ── MODAL DESACTIVAR ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !deleting && setDeleteTarget(null)}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 rounded-2xl ring-1 ring-amber-500/20 shrink-0">
                <AlertTriangle size={20} className="text-amber-500" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">
                  Desactivar Usuario
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  ¿Desactivar a{" "}
                  <span className="font-bold text-foreground">
                    "{deleteTarget.nombre || deleteTarget.username}"
                  </span>
                  ? El usuario perderá acceso inmediatamente.
                </p>
              </div>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex gap-2.5">
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-2xl h-10 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md gap-2 disabled:opacity-60">
                {deleting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <UserX size={15} />
                )}
                {deleting ? "Desactivando..." : "Desactivar"}
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

      {/* ── PERMISSIONS DRAWER ── */}
      <UserPermissionsDrawer
        open={permDrawerOpen}
        onClose={() => {
          setPermDrawerOpen(false);
          setPermUser(null);
        }}
        user={permUser}
      />
    </div>
  );
}
