// services/api.js
import { apiFetch } from "../utils/apiClient";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function request(
  path,
  { method = "GET", headers = {}, body, params } = {}
) {
  const url = new URL(`${BASE_URL}${path}`);

  // Agregar parámetros si vienen
  if (params && typeof params === "object") {
    Object.entries(params).forEach(
      ([k, v]) => v != null && url.searchParams.set(k, v)
    );
  }

  const init = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include",
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const res = await apiFetch(url.toString(), init);

  const isJson = (res.headers.get("content-type") || "").includes(
    "application/json"
  );

  if (!res.ok) {
    const err = isJson
      ? await res.json().catch(() => ({}))
      : { error: await res.text() };
    throw new Error(err.message || err.error || `HTTP ${res.status}`);
  }

  return isJson ? res.json() : res.text();
}

export const api = {
  get: (p, opts) => request(p, { ...opts, method: "GET" }),
  post: (p, body, opts) => request(p, { ...opts, method: "POST", body }),
  put: (p, body, opts) => request(p, { ...opts, method: "PUT", body }),
  patch: (p, body, opts) => request(p, { ...opts, method: "PATCH", body }),
  del: (p, opts) => request(p, { ...opts, method: "DELETE" }),
};
