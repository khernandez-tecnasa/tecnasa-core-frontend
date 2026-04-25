import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, LogOut, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCommandPalette } from "@/context/CommandPaletteContext";
import LogoutModal from "@/components/ui/LogoutModal";
import logoLight from "@/assets/newLogoTecnasaBlack.png";
import logoDark from "@/assets/newLogoTecnasa.png";

export default function MobileHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermiso, userData, logout } = useAuth();
  const { setOpen: openSearch } = useCommandPalette();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const canViewNotifications =
    userData?.rol === "Admin" || hasPermiso("ver_notificaciones");
  const isNotifActive = location.pathname.startsWith("/admin/notificaciones");

  const handleLogout = async () => {
    setLogoutOpen(false);
    await logout();
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm"
        style={{ height: "var(--mobile-header-height)", zIndex: "var(--z-mobile-header)" }}
      >
        <div className="relative flex items-center justify-center h-full px-3">

          {/* Left — logout */}
          <button
            onClick={() => setLogoutOpen(true)}
            aria-label="Cerrar sesión"
            className="absolute left-3 w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <LogOut size={18} strokeWidth={1.8} />
          </button>

          {/* Center — logo */}
          <button
            onClick={() => navigate("/admin/home")}
            className="flex items-center focus:outline-none"
            aria-label="Ir al inicio"
          >
            <img src={logoLight} alt="Tecnasa" className="h-7 object-contain dark:hidden" />
            <img src={logoDark}  alt="Tecnasa" className="h-7 object-contain hidden dark:block" />
          </button>

          {/* Right — search + notifications */}
          <div className="absolute right-3 flex items-center gap-1">
            <button
              onClick={() => openSearch(true)}
              aria-label="Buscar"
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Search size={18} strokeWidth={1.8} />
            </button>

            {canViewNotifications && (
              <button
                onClick={() => navigate("/admin/notificaciones")}
                aria-label="Notificaciones"
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center
                  transition-colors duration-150
                  ${isNotifActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }
                `}
              >
                <Bell size={18} strokeWidth={isNotifActive ? 2.5 : 1.8} />
              </button>
            )}
          </div>
        </div>
      </header>

      <LogoutModal
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
