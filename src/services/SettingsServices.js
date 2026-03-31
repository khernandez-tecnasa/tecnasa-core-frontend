// src/services/SettingsService.js
import { endpoints } from "../config/variables";
import { fetchConToken } from "../utils/ApiHelper";

function withParams(url, params = {}) {
  const u = new URL(url, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "")
      u.searchParams.set(k, String(v));
  });
  return u.toString().replace(window.location.origin, "");
}

export async function getAllSettings(opts = {}) {
  const url = withParams(endpoints.getSettings, { user_id: opts.userId });
  const res = await fetchConToken(url);
  const json = await res.json();
  if (!res.ok)
    throw new Error(json.message || "Error al obtener configuraciones");
  return json.data ?? json;
}

export async function getSection(section, opts = {}) {
  if (!section) throw new Error("section es requerido");
  const base = `${endpoints.getSettings.replace(
    /\/$/,
    ""
  )}/${encodeURIComponent(section)}`;
  const url = withParams(base, { user_id: opts.userId });
  const res = await fetchConToken(url);
  const json = await res.json();
  if (!res.ok)
    throw new Error(json.message || `Error al obtener sección ${section}`);
  return json.data ?? {};
}

/* ---------------------------
   Escritura (PATCH / merge parcial)
   --------------------------- */

export async function patchSection(section, partialPayload = {}, opts = {}) {
  const base = `${endpoints.getSettings.replace(
    /\/$/,
    ""
  )}/${encodeURIComponent(section)}`;
  const url = withParams(base, { user_id: opts.userId });

  const res = await fetchConToken(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partialPayload),
  });

  const json = await res.json();
  if (!res.ok)
    throw new Error(json.message || `Error al guardar sección ${section}`);
  // RETURN full json so caller can inspect action / data
  return json;
}

/* ---------------------------
   Historial
   --------------------------- */

export async function getSectionHistory(section, opts = {}) {
  if (!section) throw new Error("section es requerido");
  const base = `${endpoints.getSettings.replace(
    /\/$/,
    ""
  )}/${encodeURIComponent(section)}/history`;
  const url = withParams(base, {
    user_id: opts.userId,
    limit: opts.limit,
    offset: opts.offset,
  });
  const res = await fetchConToken(url);
  const json = await res.json();
  if (!res.ok)
    throw new Error(json.message || `Error al obtener historial ${section}`);
  return json.data ?? [];
}

/* ---------------------------
   Seguridad y Sesiones (NUEVO)
   --------------------------- */

/**
 * Obtiene sesiones activas y logs de actividad en paralelo
 */
export async function getSecurityData() {
  try {
    // Ejecutamos ambas peticiones al mismo tiempo para ser más rápidos
    const [resSessions, resLogs] = await Promise.all([
      fetchConToken(endpoints.sessions),
      fetchConToken(endpoints.activityLogs),
    ]);

    // Parseamos respuestas
    const sessionsJson = await resSessions.json();
    const logsJson = await resLogs.json();

    if (!resSessions.ok)
      throw new Error(sessionsJson.message || "Error cargando sesiones");
    if (!resLogs.ok) throw new Error(logsJson.message || "Error cargando logs");

    // Retornamos estructura unificada (ajusta .data si tu backend envuelven en { data: ... })
    return {
      sessions: Array.isArray(sessionsJson)
        ? sessionsJson
        : sessionsJson.data || [],
      logs: Array.isArray(logsJson) ? logsJson : logsJson.data || [],
    };
  } catch (error) {
    console.error("SettingsService: Error en getSecurityData", error);
    // Retornamos arrays vacíos para que la UI no rompa, pero lanzamos el error
    throw error;
  }
}

/**
 * Cierra todas las sesiones excepto la actual
 */
export async function revokeOtherSessions() {
  const res = await fetchConToken(endpoints.revokeSessions, {
    method: "POST",
  });
  const json = await res.json();

  if (!res.ok) throw new Error(json.message || "Error al revocar sesiones");

  return json;
}

export async function revokeSession(sessionId) {
  const res = await fetchConToken(endpoints.revokeSessions, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  const json = await res.json();

  if (!res.ok) throw new Error(json.message || "Error al revocar la sesión");

  return json;
}

/* ---------------------------
   Exports por defecto
   --------------------------- */
const SettingsService = {
  getAllSettings,
  getSection,
  patchSection,
  getSectionHistory,
  // Nuevos exports
  getSecurityData,
  revokeOtherSessions,
};

export default SettingsService;
