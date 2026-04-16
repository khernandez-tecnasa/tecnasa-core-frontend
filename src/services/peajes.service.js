import { endpoints } from "../config/variables";
import { fetchConToken } from "../utils/ApiHelper";

export async function getPeajes() {
  try {
    const res = await fetchConToken(endpoints.getPeajes);
    if (!res.ok) throw new Error("No se pudieron obtener los peajes");
    return await res.json();
  } catch (err) {
    console.error("getPeajes error:", err);
    return null;
  }
}

export async function getPeajesByRuta(rutaId) {
  try {
    const res = await fetchConToken(endpoints.getPeajesByRuta + rutaId);
    if (!res.ok) throw new Error("No se pudieron obtener los peajes de la ruta");
    return await res.json();
  } catch (err) {
    console.error("getPeajesByRuta error:", err);
    return [];
  }
}

export async function getPeaje(id) {
  try {
    const res = await fetchConToken(endpoints.getPeaje + id);
    if (!res.ok) throw new Error("No se pudo obtener el peaje");
    return await res.json();
  } catch (err) {
    console.error("getPeaje error:", err);
    return null;
  }
}

export async function createPeaje(data) {
  try {
    const res = await fetchConToken(endpoints.createPeaje, {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("No se pudo crear el peaje");
    return await res.json();
  } catch (err) {
    console.error("createPeaje error:", err);
    return null;
  }
}

export async function updatePeaje(id, data) {
  try {
    const res = await fetchConToken(endpoints.updatePeaje + id, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("No se pudo actualizar el peaje");
    return await res.json();
  } catch (err) {
    console.error("updatePeaje error:", err);
    return null;
  }
}

export async function deletePeaje(id) {
  try {
    const res = await fetchConToken(endpoints.deletePeaje + id, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("No se pudo eliminar el peaje");
    return await res.json();
  } catch (err) {
    console.error("deletePeaje error:", err);
    return null;
  }
}
