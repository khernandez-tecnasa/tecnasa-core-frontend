import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Activity,
  BarChart3,
  BellDot,
  Boxes,
  Briefcase,
  Building,
  Building2,
  CalendarCheck,
  Car,
  ChevronDown,
  ClipboardList,
  Database,
  Factory,
  FileText,
  Flag,
  Globe2,
  HelpCircle,
  House,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  LogOut,
  MapPin,
  Megaphone,
  MessageCircleQuestion,
  Milestone,
  MoreHorizontal,
  Package,
  PlayCircle,
  ReceiptText,
  Route,
  Settings,
  Settings2,
  ShieldCheck,
  Sparkles,
  SquareParking,
  Truck,
  User2,
  Users2,
  Warehouse,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useCommandPalette } from "@/context/CommandPaletteContext";
import LogoutModal from "@/components/ui/LogoutModal";
import { useAuth } from "./AuthContext";
import { closeSidebar } from "../utils/ToggleSidebar";
import logoLight from "../assets/newLogoTecnasaBlack.png";
import logoDark from "../assets/newLogoTecnasa.png";
import useIsMobile from "../hooks/useIsMobile";

/* ─── Helpers ──────────────────────────────────────────────────────── */

function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function NavItem({ path, icon, label, currentPath, onNavigate, canView }) {
  if (!canView) return null;
  const isActive =
    currentPath === path ||
    (path !== "/admin/home" && currentPath.startsWith(path));

  return (
    <button
      onClick={() => onNavigate(path)}
      className={`
        w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
        transition-colors duration-150 text-left
        ${
          isActive
            ? "bg-primary/10 text-primary font-semibold"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 font-medium"
        }
      `}>
      <span className="shrink-0 w-5 flex items-center justify-center">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function NavGroup({ icon, label, items, currentPath, onNavigate, children }) {
  const isGroupActive = items.some(
    (item) =>
      item.canView &&
      (currentPath === item.path ||
        (item.path !== "/admin/home" && currentPath.startsWith(item.path))),
  );
  const [open, setOpen] = useState(isGroupActive);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium
          text-gray-600 dark:text-gray-400
          hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100
          transition-colors duration-150">
        <span className="shrink-0 w-5 flex items-center justify-center">
          {icon}
        </span>
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{ maxHeight: open ? "600px" : "0px", opacity: open ? 1 : 0 }}>
        <div className="mt-0.5 ml-4 pl-3 border-l border-gray-200 dark:border-gray-700 space-y-0.5 py-0.5">
          {children}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 select-none">
      {children}
    </p>
  );
}

function KindIcon({ kind }) {
  const k = String(kind || "").toLowerCase();
  const cls = "w-4 h-4";
  if (k.includes("veh") || k.includes("car")) return <Car className={cls} />;
  if (k.includes("activo") || k.includes("asset"))
    return <Package className={cls} />;
  if (k.includes("cliente") || k.includes("compa") || k.includes("company"))
    return <Building2 className={cls} />;
  if (k.includes("site")) return <MapPin className={cls} />;
  if (k.includes("city")) return <Building className={cls} />;
  if (k.includes("country") || k.includes("pais"))
    return <Flag className={cls} />;
  if (k.includes("parking") || k.includes("parkin"))
    return <SquareParking className={cls} />;
  if (k.includes("warehouse") || k.includes("bodega"))
    return <Factory className={cls} />;
  if (k.includes("reporte")) return <FileText className={cls} />;
  if (k.includes("registro") || k.includes("record"))
    return <FileText className={cls} />;
  return <Database className={cls} />;
}

/* ─── Main sidebar ──────────────────────────────────────────────────── */

export default function Sidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermiso, isAdmin, userData, logout: ctxLogout } = useAuth();
  const isMobile = useIsMobile(768);

  const currentPath = location.pathname;
  const userName = userData?.nombre || "Usuario";
  const userEmail = userData?.email || "usuario@test.com";

  const { setOpen: openCommandPalette } = useCommandPalette();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const checkPermission = useCallback(
    (permiso) => isAdmin || (permiso ? hasPermiso(permiso) : true),
    [isAdmin, hasPermiso],
  );

  /* ── Nav items data ─────────────────────────────────────────────── */

  const navItems = useMemo(
    () => [
      {
        path: "/admin/home",
        icon: <House size={18} strokeWidth={1.8} />,
        label: t("sidebar.inicio"),
        perm: null,
        canView: true,
        kind: "general",
        group: "General",
      },
      {
        path: "/admin/dashboard",
        icon: <LayoutDashboard size={18} strokeWidth={1.8} />,
        label: t("sidebar.dashboard"),
        perm: "ver_dashboard",
        canView: checkPermission("ver_dashboard"),
        kind: "general",
        group: "General",
      },
      {
        path: "/admin/vehiculos",
        icon: <Truck size={18} strokeWidth={1.8} />,
        label: t("sidebar.vehiculos"),
        perm: "gestionar_vehiculos",
        canView:
          checkPermission("gestionar_vehiculos") ||
          checkPermission("ver_vehiculos"),
        kind: "vehicle",
        group: "General",
      },
      {
        path: "/admin/panel-vehiculos",
        icon: <ClipboardList size={18} strokeWidth={1.8} />,
        label: t("sidebar.registros"),
        perm: "registrar_uso",
        canView: checkPermission("registrar_uso"),
        kind: "record",
        group: "General",
      },
      {
        path: "/admin/reports",
        icon: <BarChart3 size={18} strokeWidth={1.8} />,
        label: t("sidebar.reportes"),
        perm: "ver_reportes",
        canView: checkPermission("ver_reportes"),
        kind: "reporte",
        group: "General",
      },
    ],
    [t, checkPermission],
  );

  const logisticaItems = useMemo(
    () => [
      {
        path: "/admin/rutas",
        icon: <Route size={18} strokeWidth={1.8} />,
        label: "Rutas",
        perm: "gestionar_rutas",
        canView: checkPermission("gestionar_rutas"),
        kind: "route",
        group: "Viáticos",
      },
      {
        path: "/admin/reservas-vehiculos",
        icon: <CalendarCheck size={18} strokeWidth={1.8} />,
        label: "Reservas",
        perm: "gestionar_reservas",
        canView: checkPermission("gestionar_reservas"),
        kind: "reservation",
        group: "Viáticos",
      },
      {
        path: "/admin/viaticos",
        icon: <ReceiptText size={18} strokeWidth={1.8} />,
        label: "Gastos",
        perm: "gestionar_viaticos",
        canView: checkPermission("gestionar_viaticos"),
        kind: "viatico",
        group: "Viáticos",
      },
      {
        path: "/admin/peajes",
        icon: <Milestone size={18} strokeWidth={1.8} />,
        label: "Peajes",
        perm: "gestionar_peajes",
        canView: checkPermission("gestionar_peajes"),
        kind: "peaje",
        group: "Viáticos",
      },
    ],
    [t, checkPermission],
  );

  const managementItems = useMemo(
    () => [
      {
        path: "/admin/clientes",
        icon: <Building2 size={18} strokeWidth={1.8} />,
        label: t("sidebar.companias"),
        perm: "gestionar_companias",
        canView: checkPermission("gestionar_companias"),
        kind: "company",
        group: "Gestión",
      },
      {
        path: "/admin/countries",
        icon: <Globe2 size={18} strokeWidth={1.8} />,
        label: t("sidebar.paises"),
        perm: "gestionar_paises",
        canView: checkPermission("gestionar_paises"),
        kind: "country",
        group: "Gestión",
      },
      {
        path: "/admin/cities",
        icon: <MapPin size={18} strokeWidth={1.8} />,
        label: t("sidebar.ciudades"),
        perm: "gestionar_ciudades",
        canView: checkPermission("gestionar_ciudades"),
        kind: "city",
        group: "Gestión",
      },
      {
        path: "/admin/parkings",
        icon: <SquareParking size={18} strokeWidth={1.8} />,
        label: t("sidebar.estacionamientos"),
        perm: "gestionar_estacionamientos",
        canView: checkPermission("gestionar_estacionamientos"),
        kind: "parking",
        group: "Gestión",
      },
    ],
    [t, checkPermission],
  );

  const inventoryItems = useMemo(
    () => [
      {
        path: "/admin/inventario/bodegas",
        icon: <Warehouse size={18} strokeWidth={1.8} />,
        label: t("sidebar.bodegas"),
        perm: "gestionar_bodegas",
        canView: checkPermission("gestionar_bodegas"),
        kind: "warehouse",
        group: "Inventario",
      },
      {
        path: "/admin/inventario/activos",
        icon: <Package size={18} strokeWidth={1.8} />,
        label: t("sidebar.activos"),
        perm: "gestionar_activos",
        canView: checkPermission("gestionar_activos"),
        kind: "asset",
        group: "Inventario",
      },
    ],
    [t, checkPermission],
  );

  const systemItems = useMemo(
    () => [
      {
        path: "/admin/usuarios",
        icon: <Users2 size={18} strokeWidth={1.8} />,
        label: t("sidebar.gestion_usuarios"),
        perm: "gestionar_usuarios",
        canView: checkPermission("gestionar_usuarios"),
        kind: "sistema",
        group: "Sistema",
      },
      {
        path: "/admin/roles",
        icon: <ShieldCheck size={18} strokeWidth={1.8} />,
        label: "Roles",
        perm: "asignar_permisos",
        canView: checkPermission("asignar_permisos"),
        kind: "sistema",
        group: "Sistema",
      },
      {
        path: "/admin/notificaciones",
        icon: <BellDot size={18} strokeWidth={1.8} />,
        label: t("sidebar.notificaciones"),
        perm: "ver_notificaciones",
        canView: checkPermission("ver_notificaciones"),
        kind: "notificaciones",
        group: "Sistema",
      },
      {
        path: "/admin/backup",
        icon: <Database size={18} strokeWidth={1.8} />,
        label: "Backup y Restauración",
        perm: "gestionar_backup",
        canView: checkPermission("gestionar_backup"),
        kind: "sistema",
        group: "Sistema",
      },
    ],
    [t, checkPermission],
  );

  const supportAndHelpItems = useMemo(
    () => [
      {
        path: "/admin/support/faqs",
        icon: <MessageCircleQuestion size={18} strokeWidth={1.8} />,
        label: t("sidebar.gestionar_faqs"),
        perm: "help_manage",
        canView: checkPermission("help_manage"),
        kind: "soporte",
        group: "Soporte y Ayuda",
      },
      {
        path: "/admin/support/tutorials",
        icon: <PlayCircle size={18} strokeWidth={1.8} />,
        label: t("sidebar.gestionar_tutoriales"),
        perm: "help_manage",
        canView: checkPermission("help_manage"),
        kind: "soporte",
        group: "Soporte y Ayuda",
      },
      {
        path: "/admin/support/changelogs",
        icon: <Megaphone size={18} strokeWidth={1.8} />,
        label: t("sidebar.gestionar_novedades"),
        perm: "help_manage",
        canView: checkPermission("help_manage"),
        kind: "soporte",
        group: "Soporte y Ayuda",
      },
      {
        path: "/admin/support/services",
        icon: <Activity size={18} strokeWidth={1.8} />,
        label: t("sidebar.estado_de_servicios"),
        perm: "help_manage",
        canView: checkPermission("help_manage"),
        kind: "soporte",
        group: "Soporte y Ayuda",
      },
    ],
    [t, checkPermission],
  );

  /* ── Logout ─────────────────────────────────────────────────────── */

  const logoutHandler = useCallback(() => {
    setLogoutOpen(true);
  }, []);

  /* ── Keyboard shortcuts ─────────────────────────────────────────── */

  useEffect(() => {
    const onKey = (e) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        document.activeElement?.isContentEditable;
      if (isTyping) return;

      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Ctrl+K handled by CommandPalette component
      if (ctrl && e.key === ",") {
        e.preventDefault();
        if (checkPermission("ver_configuraciones"))
          navigate("/admin/configuraciones");
        return;
      }
      if (ctrl && key === "h") {
        e.preventDefault();
        navigate("/admin/help");
        return;
      }
      if (ctrl && key === "q") {
        e.preventDefault();
        logoutHandler();
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, logoutHandler, checkPermission]);

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) closeSidebar();
  };

  /* ── Render ─────────────────────────────────────────────────────── */

  const showViajes =
    checkPermission("gestionar_rutas") ||
    checkPermission("gestionar_reservas") ||
    checkPermission("gestionar_viaticos") ||
    checkPermission("gestionar_peajes");

  const showGestion =
    checkPermission("gestionar_companias") ||
    checkPermission("gestionar_paises") ||
    checkPermission("gestionar_ciudades") ||
    checkPermission("gestionar_estacionamientos");

  const showInventario =
    checkPermission("gestionar_bodegas") ||
    checkPermission("gestionar_activos");

  const showSistema =
    checkPermission("asignar_permisos") ||
    checkPermission("ver_notificaciones") ||
    checkPermission("gestionar_usuarios") ||
    checkPermission("gestionar_backup");

  const showSoporte = checkPermission("help_manage");

  return (
    <>
      {/* ── Sidebar shell ──────────────────────────────────────────── */}
      <aside
        className="
          hidden md:flex flex-col
          sticky top-0 h-dvh shrink-0
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-700
        "
        style={{ width: "var(--sidebar-width, 260px)" }}>
        {/* Logo + search ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 shrink-0">
          <button
            onClick={() => handleNavigate("/admin/home")}
            className="flex items-center focus:outline-none min-w-0"
            aria-label="Ir al inicio">
            <img
              src={logoLight}
              alt="Tecnasa"
              className="h-9 object-contain dark:hidden"
            />
            <img
              src={logoDark}
              alt="Tecnasa"
              className="h-9 object-contain hidden dark:block"
            />
          </button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => openCommandPalette(true)}
            title="Buscar módulos y datos… (Ctrl+K)"
            className="shrink-0 h-8 w-8 rounded-xl">
            <Sparkles className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="h-px bg-gray-200 dark:bg-gray-700 mx-4" />

        {/* Navigation ─────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-0.5">
          <SectionLabel>General</SectionLabel>

          {navItems.map((item) => (
            <NavItem
              key={item.path}
              path={item.path}
              icon={item.icon}
              label={item.label}
              currentPath={currentPath}
              onNavigate={handleNavigate}
              canView={item.canView}
            />
          ))}

          {showViajes && (
            <>
              <SectionLabel>Control de Viajes</SectionLabel>
              <NavGroup
                icon={<Briefcase size={18} strokeWidth={1.8} />}
                label="Control de Viajes"
                items={logisticaItems}
                currentPath={currentPath}
                onNavigate={handleNavigate}>
                {logisticaItems.map((item) => (
                  <NavItem
                    key={item.path}
                    path={item.path}
                    icon={item.icon}
                    label={item.label}
                    currentPath={currentPath}
                    onNavigate={handleNavigate}
                    canView={item.canView}
                  />
                ))}
              </NavGroup>
            </>
          )}

          {showGestion && (
            <>
              <SectionLabel>Gestión</SectionLabel>
              <NavGroup
                icon={<Settings2 size={18} strokeWidth={1.8} />}
                label={t("sidebar.gestion")}
                items={managementItems}
                currentPath={currentPath}
                onNavigate={handleNavigate}>
                {managementItems.map((item) => (
                  <NavItem
                    key={item.path}
                    path={item.path}
                    icon={item.icon}
                    label={item.label}
                    currentPath={currentPath}
                    onNavigate={handleNavigate}
                    canView={item.canView}
                  />
                ))}
              </NavGroup>
            </>
          )}

          {showInventario && (
            <>
              <SectionLabel>Inventario</SectionLabel>
              <NavGroup
                icon={<Boxes size={18} strokeWidth={1.8} />}
                label={t("sidebar.inventario")}
                items={inventoryItems}
                currentPath={currentPath}
                onNavigate={handleNavigate}>
                {inventoryItems.map((item) => (
                  <NavItem
                    key={item.path}
                    path={item.path}
                    icon={item.icon}
                    label={item.label}
                    currentPath={currentPath}
                    onNavigate={handleNavigate}
                    canView={item.canView}
                  />
                ))}
              </NavGroup>
            </>
          )}

          {showSistema && (
            <>
              <SectionLabel>Sistema</SectionLabel>
              <NavGroup
                icon={<ShieldCheck size={18} strokeWidth={1.8} />}
                label={t("sidebar.sistema")}
                items={systemItems}
                currentPath={currentPath}
                onNavigate={handleNavigate}>
                {systemItems.map((item) => (
                  <NavItem
                    key={item.path}
                    path={item.path}
                    icon={item.icon}
                    label={item.label}
                    currentPath={currentPath}
                    onNavigate={handleNavigate}
                    canView={item.canView}
                  />
                ))}
              </NavGroup>
            </>
          )}

          {showSoporte && (
            <>
              <SectionLabel>Soporte y Ayuda</SectionLabel>
              <NavGroup
                icon={<LifeBuoy size={18} strokeWidth={1.8} />}
                label={t("sidebar.ayuda")}
                items={supportAndHelpItems}
                currentPath={currentPath}
                onNavigate={handleNavigate}>
                {supportAndHelpItems.map((item) => (
                  <NavItem
                    key={item.path}
                    path={item.path}
                    icon={item.icon}
                    label={item.label}
                    currentPath={currentPath}
                    onNavigate={handleNavigate}
                    canView={item.canView}
                  />
                ))}
              </NavGroup>
            </>
          )}

          {/* Centro de ayuda — siempre visible */}
          <div className="pt-1">
            <NavItem
              path="/admin/help"
              icon={<HelpCircle size={18} strokeWidth={1.8} />}
              label={t("sidebar.centro_de_ayuda")}
              currentPath={currentPath}
              onNavigate={handleNavigate}
              canView
            />
          </div>
        </nav>

        {/* Footer ─────────────────────────────────────────────────── */}
        <div className="shrink-0">
          <div className="h-px bg-gray-200 dark:bg-gray-700 mx-4" />

          <div className="flex items-center gap-2.5 px-3 py-3">
            {/* Avatar */}
            <div
              className="
                shrink-0 w-9 h-9 rounded-full
                bg-primary/15 text-primary
                flex items-center justify-center
                text-sm font-bold uppercase
                ring-2 ring-primary/20
              ">
              {getInitials(userName)}
            </div>

            {/* Name + email */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                {userName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight">
                {userEmail}
              </p>
            </div>

            {/* More options dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 hover:bg-muted/80 rounded-xl transition-colors"
                  aria-label="Opciones de cuenta">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuPortal>
                <DropdownMenuContent
                  align="start"
                  className="w-56 z-[15000] rounded-2xl shadow-xl border-border/60">
                  <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                    {t("sidebar.mi_cuenta")}
                  </DropdownMenuLabel>

                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onSelect={() => navigate("/admin/mi-cuenta")}
                      className="rounded-xl cursor-pointer gap-2 text-sm">
                      <User2 className="h-4 w-4" />
                      <span>{t("sidebar.mi_perfil")}</span>
                    </DropdownMenuItem>

                    {checkPermission("ver_configuraciones") && (
                      <DropdownMenuItem
                        onSelect={() => navigate("/admin/configuraciones")}
                        className="rounded-xl cursor-pointer gap-2 text-sm">
                        <Settings className="h-4 w-4" />
                        <span>{t("sidebar.configuraciones")}</span>
                        <DropdownMenuShortcut>Ctrl+,</DropdownMenuShortcut>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      onSelect={() => navigate("/admin/help")}
                      className="rounded-xl cursor-pointer gap-2 text-sm">
                      <HelpCircle className="h-4 w-4" />
                      <span>{t("sidebar.centro_de_ayuda")}</span>
                      <DropdownMenuShortcut>Ctrl+H</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onSelect={logoutHandler}
                    className="rounded-xl cursor-pointer gap-2 text-sm text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950">
                    <LogOut className="h-4 w-4" />
                    <span>{t("sidebar.cerrar_sesion")}</span>
                    <DropdownMenuShortcut>Ctrl+Q</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      <LogoutModal
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={async () => {
          setLogoutOpen(false);
          await ctxLogout();
        }}
      />
    </>
  );
}
