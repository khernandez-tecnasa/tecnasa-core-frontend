import { endpoints } from "../config/variables";
import { fetchConToken } from "../utils/ApiHelper";

const base = () => endpoints.notifEventos;

export async function getEventos({ search = "", activo } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (typeof activo !== "undefined") params.set("activo", activo ? "1" : "0");
  const url = `${base()}${params.toString() ? `?${params}` : ""}`;
  const res = await fetchConToken(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al listar eventos");
  return Array.isArray(json) ? json : json.rows ?? [];
}

export async function createEvento({ clave, nombre, descripcion, severidad_def, activo }) {
  const res = await fetchConToken(base(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clave, nombre, descripcion, severidad_def, activo }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al crear evento");
  return json;
}

export async function updateEvento(id, data) {
  const res = await fetchConToken(`${base()}${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al actualizar evento");
  return json;
}

export async function deleteEvento(id) {
  const res = await fetchConToken(`${base()}${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al eliminar evento");
  return json;
}

export async function toggleEventoEstado(id, activo) {
  const res = await fetchConToken(`${base()}${id}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activo }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al cambiar estado");
  return json;
}

export async function getEventoGrupos(eventoId) {
  const res = await fetchConToken(`${base()}${eventoId}/grupos`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al obtener grupos del evento");
  return Array.isArray(json) ? json : [];
}

export async function setEventoGrupos(eventoId, grupoIds) {
  const res = await fetchConToken(`${base()}${eventoId}/grupos`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grupos: grupoIds }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al asignar grupos");
  return json;
}
