// src/context/AuthContext.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import * as AuthServices from "../services/AuthServices";
import { getPermisosEfectivos } from "../services/PermissionsServices";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  const loadPermisos = async (userId) => {
    try {
      const efectivos = await getPermisosEfectivos(userId);
      setPermisos(Array.isArray(efectivos) ? efectivos : []);
    } catch {
      setPermisos([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const serverUser = await AuthServices.me();
        setUser(serverUser);
        if (serverUser?.id) await loadPermisos(serverUser.id);
      } catch {
        setUser(null);
        setPermisos([]);
      } finally {
        setCheckingSession(false);
      }
    };
    init();
  }, []);

  // Escuchar sesión expirada globalmente (viene de apiClient cuando refresh falla)
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setPermisos([]);
      // No redirigir si ya estamos en una ruta pública de auth (ej: reset-password)
      const publicPaths = ["/auth/reset-password", "/auth/forgot-password", "/auth/login"];
      const isPublic = publicPaths.some((p) => window.location.pathname.startsWith(p));
      if (!isPublic) navigate("/auth/login");
    };
    window.addEventListener("auth:sessionExpired", handleExpired);
    return () => window.removeEventListener("auth:sessionExpired", handleExpired);
  }, [navigate]);

  const refreshUser = async () => {
    try {
      const serverUser = await AuthServices.me();
      setUser(serverUser);
      if (serverUser?.id) await loadPermisos(serverUser.id);
      return serverUser;
    } catch {
      setUser(null);
      setPermisos([]);
      return null;
    }
  };

  const logout = async () => {
    try {
      await AuthServices.logout();
    } catch (e) {
      console.error("logout error", e);
    } finally {
      setUser(null);
      setPermisos([]);
      navigate("/auth/login");
    }
  };

  const isAdmin = useMemo(
    () => (user?.rol || "").toLowerCase() === "admin",
    [user?.rol],
  );

  // Fuente de verdad: admin bypasea todo, igual que el middleware
  const can = useCallback(
    (permiso) => isAdmin || permisos.includes(permiso),
    [isAdmin, permisos],
  );

  // Alias para no romper código existente que usa hasPermiso
  const hasPermiso = can;

  return (
    <AuthContext.Provider
      value={{
        userData: user,
        setUser,
        logout,
        checkingSession,
        permisos,
        isAdmin,
        can,
        hasPermiso,
        refreshUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
