import { useEffect, useState, useCallback } from "react";
import { AuditoriaService } from "../services/auditoria.service";

export function useAudit(entidad, entidadId) {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    if (!entidadId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await AuditoriaService.getByEntidad(entidad, entidadId);
      setLogs(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err?.message || "Error al cargar historial");
    } finally {
      setLoading(false);
    }
  }, [entidad, entidadId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { logs, loading, error, refresh: fetch };
}
