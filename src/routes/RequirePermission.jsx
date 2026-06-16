// src/routes/RequirePermission.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function RequirePermission({
  permiso,
  children,
  redirectTo = "/admin/home",
}) {
  const { can, checkingSession } = useAuth();

  if (checkingSession) return null;

  if (!can(permiso)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
