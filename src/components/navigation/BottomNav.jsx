import { useLocation, useNavigate } from "react-router-dom";
import {
  House,
  ClipboardList,
  ReceiptText,
  User2,
  MoreHorizontal,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import MoreHub from "./MoreHub";

const NAV_TABS = [
  {
    id: "inicio",
    label: "Inicio",
    icon: House,
    path: "/admin/home",
    perm: null,
  },
  {
    id: "registros",
    label: "Registros",
    icon: ClipboardList,
    path: "/admin/panel-vehiculos",
    perm: "registrar_uso",
  },
  {
    id: "gastos",
    label: "Gastos",
    icon: ReceiptText,
    path: "/admin/viaticos",
    perm: "gestionar_viaticos",
  },
  {
    id: "perfil",
    label: "Perfil",
    icon: User2,
    path: "/admin/mi-cuenta",
    perm: null,
  },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermiso, userData } = useAuth();
  const [hubOpen, setHubOpen] = useState(false);

  const checkPerm = (perm) =>
    userData?.rol === "Admin" || !perm || hasPermiso(perm);

  const isTabActive = (path) =>
    location.pathname === path ||
    (path !== "/admin/home" && location.pathname.startsWith(path));

  const isMoreActive =
    !NAV_TABS.some((t) => isTabActive(t.path)) &&
    location.pathname !== "/admin/home";

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 md:hidden" style={{ zIndex: "var(--z-bottom-nav, 40)" }}>
        {/* safe-area bottom for notch devices */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-stretch h-16">
            {NAV_TABS.filter((t) => checkPerm(t.perm)).map((tab) => {
              const active = isTabActive(tab.path);
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`
                    flex-1 flex flex-col items-center justify-center gap-0.5 pt-1 pb-2
                    transition-colors duration-150 touch-none select-none
                    ${active
                      ? "text-primary"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }
                  `}
                >
                  <span className="relative">
                    <Icon
                      size={22}
                      strokeWidth={active ? 2.5 : 1.8}
                      className={active ? "drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]" : ""}
                    />
                    {active && (
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </span>
                  <span
                    className={`text-[10px] font-medium leading-none tracking-wide ${
                      active ? "text-primary font-semibold" : ""
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}

            {/* Más tab */}
            <button
              onClick={() => setHubOpen(true)}
              className={`
                flex-1 flex flex-col items-center justify-center gap-0.5 pt-1 pb-2
                transition-colors duration-150 touch-none select-none
                ${isMoreActive || hubOpen
                  ? "text-primary"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }
              `}
            >
              <span className="relative">
                <MoreHorizontal
                  size={22}
                  strokeWidth={(isMoreActive || hubOpen) ? 2.5 : 1.8}
                  className={(isMoreActive || hubOpen) ? "drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]" : ""}
                />
                {(isMoreActive || hubOpen) && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </span>
              <span
                className={`text-[10px] font-medium leading-none tracking-wide ${
                  isMoreActive || hubOpen ? "text-primary font-semibold" : ""
                }`}
              >
                Más
              </span>
            </button>
          </div>

          {/* iOS safe area spacer */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </nav>

      <MoreHub open={hubOpen} onClose={() => setHubOpen(false)} />
    </>
  );
}
