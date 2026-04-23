import { useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Hook para centralizar permisos.
 * API:
 * - isAdmin: boolean
 * - has(name): boolean
 * - canAny(...perms): boolean  → true si tiene al menos uno
 * - canAll(...perms): boolean  → true si tiene todos
 */
export default function usePermissions() {
  const { isAdmin, can } = useAuth();

  const has = useCallback((name) => can(name), [can]);
  const canAny = useCallback((...names) => names.some((n) => can(n)), [can]);
  const canAll = useCallback((...names) => names.every((n) => can(n)), [can]);

  return useMemo(
    () => ({ isAdmin, has, canAny, canAll }),
    [isAdmin, has, canAny, canAll]
  );
}
