// src/routes/PublicRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function PublicRoute({ children }) {
  const { userData, checkingSession } = useAuth();

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

  // Si ya está logueado: no tiene nada que hacer en /auth/*
  // Lo mandamos siempre al home del admin
  if (userData) {
    return <Navigate to="/admin/home" replace />;
  }

  // Si NO está logueado -> puede ver la ruta pública (login, reset, etc.)
  return children;
}
