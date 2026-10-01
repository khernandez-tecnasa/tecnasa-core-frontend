// src/routes/AppRoutes.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { SoftRefreshProvider } from "@/context/SoftRefreshContext";
import AuthRoutes from "./auth.routes";
import ForgotPasswordRequest from "../pages/Auth/ForgotPasswordRequest";
import ResetPassword from "../pages/Auth/ResetPassword";
import QrcodeRoutes from "./qrcode.routes";
import DashboardRoutes from "./dashboard.routes";
import ExpiredSessionOverlay from "../components/ExpiredSession/ExpiredSessionOverlay";
import RestoreMaintenanceOverlay from "../components/RestoreMaintenanceOverlay";

import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";
import ThemeSynchronizer from "@/components/common/ThemeSynchronizer";
import { SettingsProvider } from "@/context/SettingsContext";
import { AppThemeProvider } from "@/context/AppThemeContext";

import { useAccessibility } from "../hooks/useAccessibility";

const AccessibilityManager = () => {
  useAccessibility();
  return null;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <AppThemeProvider>
            <SoftRefreshProvider>
              <ThemeSynchronizer />
              <AccessibilityManager />
              <RestoreMaintenanceOverlay />

              <Routes>
                {/* La recuperación siempre debe abrir, aun si hay una cookie
                    expirada o una sesión activa en otra pestaña. */}
                <Route
                  path="/auth/forgot-password"
                  element={<ForgotPasswordRequest />}
                />
                <Route
                  path="/auth/reset-password"
                  element={<ResetPassword />}
                />

                {/* Login: bloqueado únicamente cuando ya existe sesión válida. */}
                <Route
                  path="/auth/*"
                  element={
                    <PublicRoute>
                      <AuthRoutes />
                    </PublicRoute>
                  }
                />

                {/* Rutas públicas reales (QR activos, etc.) */}
                <Route path="/public/*" element={<QrcodeRoutes />} />

                {/* Rutas protegidas del admin */}
                <Route
                  path="/admin/*"
                  element={
                    <PrivateRoute>
                      <ExpiredSessionOverlay>
                        <DashboardRoutes />
                      </ExpiredSessionOverlay>
                    </PrivateRoute>
                  }
                />
              </Routes>
            </SoftRefreshProvider>
          </AppThemeProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
