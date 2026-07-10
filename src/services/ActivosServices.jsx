import { endpoints } from "../config/variables";
import { fetchConToken } from "../utils/ApiHelper";

// 🔹 Obtener todos los activos (sin filtrar cliente)
export async function getActivos() {
    const res = await fetchConToken(endpoints.getActivos);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Error al obtener activos");
    return json;
}

// 🔹 Obtener un activo por ID (con ubicación actual)
export async function getActivoById(id) {
    const res = await fetchConToken(`${endpoints.getActivos}${id}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Error al obtener activo");
    return json;
}

// export async function getActivosEnBodegas() {
//     const res = await fetchConToken(`${endpoints.getActivosEnBodegas}`);
//     const json = await res.json();
//     if (!res.ok) throw new Error(json.message || "Error al obtener activos");
//     return json;
// }

export async function getActivosGlobal() {
    const res = await fetchConToken(`${endpoints.getActivosGlobal}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Error al obtener activos");
    return json;
}

// 🔹 Buscar activos por serial/código/modelo/ubicación, limitado (para selects tipo autocomplete)
export async function buscarActivos(q, limit = 20) {
    const params = new URLSearchParams({ q: q || "", limit: String(limit) });
    const res = await fetchConToken(`${endpoints.buscarActivos}?${params.toString()}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Error al buscar activos");
    return json;
}

// 🔹 Crear activo
export async function createActivo(data) {
    const res = await fetchConToken(endpoints.addActivo, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Error al crear activo");
    return json;
}

// 🔹 Actualizar activo
export async function updateActivo(id, data) {
    const res = await fetchConToken(`${endpoints.updateActivo}${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Error al actualizar activo");
    return json;
}

// 🔹 Obtener activos de un cliente específico
export async function getActivosByCliente(idCliente) {
    const res = await fetchConToken(`${endpoints.getActivosByCliente}${idCliente}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Error al obtener activos del cliente");
    return json;
}

export async function getHistorialUbicaciones(id) {
    const res = await fetchConToken(`${endpoints.getActivoById}${id}/historial`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Error al obtener historial");
    return json;
}
