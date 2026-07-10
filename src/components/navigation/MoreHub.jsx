import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { X } from "lucide-react";
import {
  LayoutDashboard,
  Truck,
  BarChart3,
  Route,
  CalendarCheck,
  Milestone,
  Building2,
  Globe2,
  MapPin,
  SquareParking,
  Warehouse,
  Package,
  Users2,
  ShieldCheck,
  BellDot,
  MessageCircleQuestion,
  PlayCircle,
  Megaphone,
  Activity,
  Settings,
  HelpCircle,
  CalendarRange,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const HUB_CATEGORIES = [
  {
    id: "vehiculos",
    label: "Vehículos",
    color: "bg-blue-50 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
    items: [
      { path: "/admin/vehiculos", icon: Truck, label: "Vehículos", perm: ["gestionar_vehiculos", "ver_vehiculos"] },
      { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", perm: ["ver_dashboard"] },
      { path: "/admin/reports", icon: BarChart3, label: "Reportes", perm: ["ver_reportes"] },
    ],
  },
  {
    id: "viajes",
    label: "Control de Viajes",
    color: "bg-amber-50 dark:bg-amber-950",
    iconColor: "text-amber-600 dark:text-amber-400",
    items: [
      { path: "/admin/rutas", icon: Route, label: "Rutas", perm: ["gestionar_rutas"] },
      { path: "/admin/reservas-vehiculos", icon: CalendarCheck, label: "Reservas", perm: ["gestionar_reservas"] },
      { path: "/admin/peajes", icon: Milestone, label: "Peajes", perm: ["gestionar_peajes"] },
    ],
  },
  {
    id: "gestion",
    label: "Gestión",
    color: "bg-emerald-50 dark:bg-emerald-950",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    items: [
      { path: "/admin/clientes", icon: Building2, label: "Compañías", perm: ["gestionar_companias"] },
      { path: "/admin/countries", icon: Globe2, label: "Países", perm: ["gestionar_paises"] },
      { path: "/admin/cities", icon: MapPin, label: "Ciudades", perm: ["gestionar_ciudades"] },
      { path: "/admin/parkings", icon: SquareParking, label: "Estacionamientos", perm: ["gestionar_estacionamientos"] },
      { path: "/admin/facturacion/periodos", icon: CalendarRange, label: "Facturación", perm: ["ver_contratos", "gestion_ingenieria", "gestion_finanzas", "gestion_operaciones"] },
    ],
  },
  {
    id: "inventario",
    label: "Inventario",
    color: "bg-violet-50 dark:bg-violet-950",
    iconColor: "text-violet-600 dark:text-violet-400",
    items: [
      { path: "/admin/inventario/bodegas", icon: Warehouse, label: "Bodegas", perm: ["gestionar_bodegas"] },
      { path: "/admin/inventario/activos", icon: Package, label: "Activos", perm: ["gestionar_activos"] },
    ],
  },
  {
    id: "sistema",
    label: "Sistema",
    color: "bg-rose-50 dark:bg-rose-950",
    iconColor: "text-rose-600 dark:text-rose-400",
    items: [
      { path: "/admin/usuarios", icon: Users2, label: "Usuarios", perm: ["gestionar_usuarios"] },
      { path: "/admin/roles", icon: ShieldCheck, label: "Roles", perm: ["asignar_permisos"] },
      { path: "/admin/notificaciones", icon: BellDot, label: "Notificaciones", perm: ["ver_notificaciones"] },
    ],
  },
  {
    id: "soporte",
    label: "Soporte y Ayuda",
    color: "bg-sky-50 dark:bg-sky-950",
    iconColor: "text-sky-600 dark:text-sky-400",
    items: [
      { path: "/admin/support/faqs", icon: MessageCircleQuestion, label: "FAQs", perm: ["help_manage"] },
      { path: "/admin/support/tutorials", icon: PlayCircle, label: "Tutoriales", perm: ["help_manage"] },
      { path: "/admin/support/changelogs", icon: Megaphone, label: "Novedades", perm: ["help_manage"] },
      { path: "/admin/support/services", icon: Activity, label: "Estado Servicios", perm: ["help_manage"] },
      { path: "/admin/help", icon: HelpCircle, label: "Centro de Ayuda", perm: null },
    ],
  },
  {
    id: "cuenta",
    label: "Mi Cuenta",
    color: "bg-gray-50 dark:bg-gray-800",
    iconColor: "text-gray-600 dark:text-gray-400",
    items: [
      { path: "/admin/configuraciones", icon: Settings, label: "Configuraciones", perm: null },
    ],
  },
];

export default function MoreHub({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermiso, userData } = useAuth();

  const checkPerm = (perms) => {
    if (userData?.rol === "Admin") return true;
    if (!perms) return true;
    return perms.some((p) => hasPermiso(p));
  };

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  // Close hub when route changes
  useEffect(() => {
    if (open) onClose();
  }, [location.pathname]);

  // Trap scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 md:hidden flex flex-col" style={{ zIndex: "var(--z-hub, 45)" }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative mt-auto bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl animate-[iosSheet_0.35s_cubic-bezier(0.25,0.8,0.25,1)] max-h-[85dvh] flex flex-col">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Todos los módulos
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto overscroll-contain px-4 pb-6 flex-1 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {HUB_CATEGORIES.map((category) => {
            const visibleItems = category.items.filter((item) => checkPerm(item.perm));
            if (visibleItems.length === 0) return null;

            return (
              <div key={category.id} className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-0.5">
                  {category.label}
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      location.pathname === item.path ||
                      (item.path !== "/admin/home" &&
                        location.pathname.startsWith(item.path));

                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        className={`
                          flex flex-col items-center gap-1.5 p-3 rounded-xl
                          transition-all duration-150 active:scale-95
                          ${isActive
                            ? "bg-primary/10 ring-1 ring-primary/30"
                            : `${category.color} hover:opacity-80`
                          }
                        `}
                      >
                        <div className={`${isActive ? "text-primary" : category.iconColor}`}>
                          <Icon size={22} strokeWidth={1.7} />
                        </div>
                        <span
                          className={`
                            text-[11px] font-medium leading-tight text-center
                            ${isActive
                              ? "text-primary font-semibold"
                              : "text-gray-700 dark:text-gray-300"
                            }
                          `}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
