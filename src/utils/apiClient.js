// src/utils/apiClient.js
// Wrapper de fetch con refresh automático de token JWT.

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = () => {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
};

const subscribeRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

async function doRefresh() {
  try {
    // Usamos fetch nativo para evitar recursión con apiFetch
    const res = await fetch("/api/auth/refresh", {
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
  const init = {
    ...options,
    credentials: "include",
  };

  const res = await fetch(url, init);

  // Si no es 401, o es una ruta pública de auth, devolver tal cual
  if (res.status !== 401 || isPublicAuthUrl(url)) {
    return res;
  }

  // Hay un 401 → intentar refresh
  if (!isRefreshing) {
    isRefreshing = true;
    const ok = await doRefresh();
    isRefreshing = false;

    if (ok) {
      onRefreshed();
      // Reintentar la petición original con fetch nativo
      return fetch(url, init);
    } else {
      window.dispatchEvent(new CustomEvent("auth:sessionExpired"));
      throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
    }
  }

  // Ya hay un refresh en curso → esperar y reintentar
  return new Promise((resolve, reject) => {
    subscribeRefresh(() => {
      fetch(url, init).then(resolve).catch(reject);
    });
  });
}
