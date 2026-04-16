import { fetchConToken } from "../utils/ApiHelper";

const BASE = "/api/liquidaciones";

export async function getLiquidacionByViaticoId(viaticoId) {
  try {
    const res = await fetchConToken(`${BASE}/viatico/${viaticoId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("getLiquidacionByViaticoId error:", err);
    return null;
  }
}

export async function getLiquidacion(id) {
  try {
    const res = await fetchConToken(`${BASE}/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("getLiquidacion error:", err);
    return null;
  }
}

export async function getLiquidaciones() {
  try {
    const res = await fetchConToken(BASE);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("getLiquidaciones error:", err);
    return [];
  }
}

export async function guardarLiquidacion(id, data) {
  const res = await fetchConToken(`${BASE}/${id}/guardar`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Error al guardar");
  }
  return await res.json();
}

export async function enviarRevisionLiquidacion(id) {
  const res = await fetchConToken(`${BASE}/${id}/enviar-revision`, {
    method: "PUT",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Error al enviar a revisión");
  }
  return await res.json();
}

export async function aprobarLiquidacion(id) {
  const res = await fetchConToken(`${BASE}/${id}/aprobar`, { method: "PUT" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Error al aprobar");
  }
  return await res.json();
}

export async function rechazarLiquidacion(id, observaciones) {
  const res = await fetchConToken(`${BASE}/${id}/rechazar`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ observaciones }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Error al rechazar");
  }
  return await res.json();
}

export async function liquidarFinal(id) {
  const res = await fetchConToken(`${BASE}/${id}/liquidar`, { method: "PUT" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Error al liquidar");
  }
  return await res.json();
}
