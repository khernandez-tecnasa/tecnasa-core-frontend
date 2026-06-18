import { endpoints } from "../config/variables";
import { fetchConToken } from "../utils/ApiHelper";

const base = () => endpoints.notifGrupos;

export async function getGrupos({ search = "" } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const url = `${base()}${params.toString() ? `?${params}` : ""}`;
  const res = await fetchConToken(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al listar grupos");
  return json;
}

export async function getGrupo(id) {
  const res = await fetchConToken(`${base()}${id}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al obtener grupo");
  return json;
}

export async function createGrupo({ nombre, descripcion }) {
  const res = await fetchConToken(base(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, descripcion }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al crear grupo");
  return json;
}

export async function updateGrupo(id, { nombre, descripcion }) {
  const res = await fetchConToken(`${base()}${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, descripcion }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al actualizar grupo");
  return json;
}

export async function deleteGrupo(id) {
  const res = await fetchConToken(`${base()}${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al eliminar grupo");
  return json;
}

export async function getMiembros(grupoId) {
  const res = await fetchConToken(`${base()}${grupoId}/miembros`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al listar miembros");
  return json;
}

export async function addMiembros(grupoId, ids_usuario) {
  const res = await fetchConToken(`${base()}${grupoId}/miembros`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids_usuario }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al agregar miembros");
  return json;
}

export async function removeMiembro(grupoId, id_usuario) {
  const res = await fetchConToken(`${base()}${grupoId}/miembros/${id_usuario}`, {
    method: "DELETE",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al quitar miembro");
  return json;
}

export async function searchUsuarios(q = "") {
  const params = new URLSearchParams({ q, limit: "50" });
  const res = await fetchConToken(`${endpoints.getUsers}?${params}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al buscar usuarios");
  return Array.isArray(json) ? json : json.data ?? json.rows ?? [];
}
