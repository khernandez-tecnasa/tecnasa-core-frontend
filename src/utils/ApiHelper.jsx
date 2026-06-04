// src/utils/ApiHelper.jsx
import { apiFetch } from "./apiClient";

export async function fetchConToken(url, options = {}) {
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(options.headers || {}),
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
  };

  try {
    const res = await apiFetch(url, {
      ...options,
      headers,
    });
    return res;
  } catch (err) {
    console.error("fetchConToken error", err);
    throw err;
  }
}

export function withQuery(url, params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (entries.length === 0) return url;
  const qs = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
}

export async function fetchPublic(url, init = {}) {
  const res = await fetch(url, {
    credentials: "omit",
    headers: { Accept: "application/json", ...(init.headers || {}) },
    ...init,
  });
  return res;
}
