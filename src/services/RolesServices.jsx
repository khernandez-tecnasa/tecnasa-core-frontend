// src/services/RolesServices.jsx
import { endpoints } from "../config/variables";
import { fetchConToken } from "../utils/ApiHelper";

// Normaliza listas simples: [], { roles: [] }, { data: [] }
function normalizeArray(data, ...keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

/**
 * Normaliza la respuesta de permisos a un array plano,
 * inyectando el campo `grupo` si viene en formato agrupado.
 *
 * Formatos soportados:
 *   A) [{ id, nombre, grupo?, categoria? }]            — plano con campo grupo
 *   B) { permisos: [{ id, nombre }] }                  — envuelto plano
 *   C) { "Vehiculos": [{id,nombre}], "Usuarios": [...] } — objeto agrupado (igual que getUserPermissions)
 *   D) { permisos: { "Vehiculos": [...], ... } }        — objeto agrupado envuelto
 */
function toFlatPermisos(data) {
  if (!data) return [];

  // A) y B): es o contiene un array
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.permisos)) return data.permisos;
  if (Array.isArray(data.data)) return data.data;

  // D): objeto envuelto en { permisos: { ... } }
  const inner =
    data.permisos && typeof data.permisos === "object" && !Array.isArray(data.permisos)
      ? data.permisos
      : data;

  // C): objeto cuyas values son arrays → formato agrupado de la DB
  const entries = Object.entries(inner);
  if (entries.length > 0 && Array.isArray(entries[0][1])) {
    return entries.flatMap(([grupo, perms]) =>
      perms.map((p) => ({ ...p, grupo }))
    );
  }

  return [];
}

export async function getRoles() {
  try {
    const res = await fetchConToken(endpoints.getRoles, { method: "GET" });
    if (!res.ok) throw new Error("No se pudo obtener los roles");
    const data = await res.json();
    return normalizeArray(data, "roles", "data");
  } catch (err) {
    console.error("getRoles error:", err);
    return [];
  }
}

export async function getRoleById(id) {
  try {
    const res = await fetchConToken(`${endpoints.getRoleById}${id}`, { method: "GET" });
    if (!res.ok) throw new Error("No se pudo obtener el rol");
    const data = await res.json();
    // El backend puede devolver el objeto directo o anidado en { rol: {...} }
    return data?.rol ?? data?.role ?? data;
  } catch (err) {
    console.error("getRoleById error:", err);
    return null;
  }
}

export async function createRole(data) {
  try {
    const res = await fetchConToken(endpoints.createRole, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("No se pudo crear el rol");
    return await res.json();
  } catch (err) {
    console.error("createRole error:", err);
    throw err;
  }
}

export async function updateRole(id, data) {
  try {
    const res = await fetchConToken(`${endpoints.updateRole}${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("No se pudo actualizar el rol");
    return await res.json();
  } catch (err) {
    console.error("updateRole error:", err);
    throw err;
  }
}

export async function deleteRole(id) {
  try {
    const res = await fetchConToken(`${endpoints.deleteRole}${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("No se pudo eliminar el rol");
    return await res.json();
  } catch (err) {
    console.error("deleteRole error:", err);
    throw err;
  }
}

export async function updateRolePermissions(id, permisos) {
  try {
    const res = await fetchConToken(`${endpoints.updateRolePermisos}${id}/permisos`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permisos }),
    });
    if (!res.ok) throw new Error("No se pudo actualizar los permisos del rol");
    return await res.json();
  } catch (err) {
    console.error("updateRolePermissions error:", err);
    throw err;
  }
}

export async function getAllPermisos() {
  try {
    const res = await fetchConToken(endpoints.getPermisos, { method: "GET" });
    if (!res.ok) throw new Error("No se pudo obtener los permisos");
    const data = await res.json();
    return toFlatPermisos(data);
  } catch (err) {
    console.error("getAllPermisos error:", err);
    return [];
  }
}
