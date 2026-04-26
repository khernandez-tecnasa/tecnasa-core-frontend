// src/layouts/MainLayout.jsx
import { useEffect } from "react";
import Box from "@mui/joy/Box";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import Sidebar from "../context/SideBar";
import MobileHeader from "../components/navigation/MobileHeader";
import BottomNav from "../components/navigation/BottomNav";
import CommandPalette from "../components/navigation/CommandPalette";
import { CommandPaletteProvider } from "@/context/CommandPaletteContext";
import { useSoftRefresh } from "@/context/SoftRefreshContext";

export default function MainLayout() {
  const { key: refreshKey, trigger } = useSoftRefresh();

  // Soft refresh con F5 / Ctrl(Cmd)+R (sin recargar toda la app)
  useEffect(() => {
    const onKey = (e) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        document.activeElement?.isContentEditable;

      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      const isRefreshKey =
        e.key === "F5" || (ctrlOrCmd && e.key.toLowerCase() === "r");

      if (!isRefreshKey || isTyping) return;

      e.preventDefault();
      e.stopPropagation();
      trigger();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [trigger]);

  return (
    <CommandPaletteProvider>
      <Box sx={{ display: "flex", minHeight: "100dvh" }}>
        <MobileHeader />
        <Sidebar />
        <Box
          component="main"
          className="MainContent"
          sx={{
            px: { xs: 2, md: 6 },
            pt: {
              xs: "calc(var(--mobile-header-height, 52px) + 12px)",
              md: 3,
            },
            pb: {
              xs: "calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom) + 8px)",
              md: 3,
            },
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            height: "100dvh",
            overflowY: "auto",
            gap: 1,
          }}>
          <div key={refreshKey}>
            <Outlet />
          </div>
        </Box>
        <BottomNav />
        <CommandPalette />
      </Box>
    </CommandPaletteProvider>
  );
}
