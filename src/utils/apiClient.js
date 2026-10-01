// src/utils/apiClient.js
// Wrapper de fetch con refresh automático de token JWT.
import { API_BASE_URL } from "../config/variables";

// Una única promesa compartida evita que solicitudes simultáneas queden
// esperando indefinidamente si la renovación falla.
let refreshPromise = null;

async function doRefresh() {
  try {
    // Usamos fetch nativo para evitar recursión con apiFetch
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    return res.ok;
  } catch (err) {
    console.error("doRefresh error:", err);
    return false;
  }
}

function isPublicAuthUrl(url) {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/forgot-password") ||
    url.includes("/auth/reset-password") ||
    url.includes("/auth/refresh")
  );
}

/**
 * Wrapper de fetch con refresh automático de token.
 * - Si la respuesta es 401, intenta POST /api/auth/refresh.
 * - Si el refresh tiene éxito, reintenta la petición original.
 * - Si el refresh falla, dispara evento 'auth:sessionExpired' y lanza error.
 */
export async function apiFetch(url, options = {}) {
  // La verificación reforzada está ligada al token con el que se inició el
  // intento. Renovarlo y repetir la solicitud puede invalidar ese intento y
  // convertir un error de identidad en un falso problema de sesión.
  const skipAuthRefresh = options.skipAuthRefresh === true;
  const { skipAuthRefresh: _skipAuthRefresh, ...fetchOptions } = options;
  const init = {
    ...fetchOptions,
    credentials: "include",
  };

  const res = await fetch(url, init);

  // Si no es 401, o es una ruta pública de auth, devolver tal cual
  if (res.status !== 401 || isPublicAuthUrl(url) || skipAuthRefresh) {
    return res;
  }

  // Hay un 401 → todas las solicitudes concurrentes esperan la misma
  // renovación. Antes, las suscritas nunca se resolvían si el refresh fallaba.
  if (!refreshPromise) {
    refreshPromise = doRefresh()
      .then((ok) => {
        if (ok) return true;
        // Esta única promesa compartida emite el evento una sola vez para
        // todas las solicitudes que recibieron el mismo 401.
        window.dispatchEvent(new CustomEvent("auth:sessionExpired"));
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  const refreshed = await refreshPromise;
  if (!refreshed) {
    throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
  }

  // Reintentar la petición original con fetch nativo.
  return fetch(url, init);
}
