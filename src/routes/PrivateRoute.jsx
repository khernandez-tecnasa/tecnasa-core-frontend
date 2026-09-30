// src/routes/PrivateRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function PrivateRoute({ children }) {
  const { userData, checkingSession } = useAuth();
  const location = useLocation();

  // Nunca devolver null: así un problema transitorio no se percibe como una
  // pantalla en blanco.
  if (checkingSession) {
    return (
      <main
        className="min-h-screen flex items-center justify-center bg-gray-50"
        aria-busy="true"
        aria-live="polite">
        <p className="text-sm text-gray-600">Verificando sesión…</p>
      </main>
    );
  }

  // Si no hay usuario -> mandar a login con redirect
  if (!userData) {
    const redirectTo = `${location.pathname}${location.search || ""}`;
    return (
      <Navigate
        to={`/auth/login?redirect=${encodeURIComponent(redirectTo)}`}
        replace
      />
    );
  }

  // Si hay usuario -> render normal
  return children;
}
