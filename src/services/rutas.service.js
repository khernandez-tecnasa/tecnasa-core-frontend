import { endpoints } from "../config/variables";
import { fetchConToken } from "../utils/ApiHelper";

//
// RUTAS
//

export async function getRutas() {
  try {
    const res = await fetchConToken(endpoints.getRutas);
    if (!res.ok) throw new Error("No se pudieron obtener las rutas");
    return await res.json();
  } catch (err) {
    console.error("getRutas error:", err);
    return null;
  }
}

export async function getRuta(id) {
  try {
    const res = await fetchConToken(endpoints.getRuta + id);
    if (!res.ok) throw new Error("No se pudo obtener la ruta");
    return await res.json();
  } catch (err) {
    console.error("getRuta error:", err);
    return null;
  }
}

export async function createRuta(data) {
  try {
    const res = await fetchConToken(endpoints.createRuta, {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("No se pudo crear la ruta");
    return await res.json();
  } catch (err) {
    console.error("createRuta error:", err);
    return null;
  }
}

export async function updateRuta(id, data) {
  try {
    const res = await fetchConToken(endpoints.updateRuta + id, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("No se pudo actualizar la ruta");
    return await res.json();
  } catch (err) {
    console.error("updateRuta error:", err);
    return null;
  }
}

export async function deleteRuta(id) {
  try {
    const res = await fetchConToken(endpoints.deleteRuta + id, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("No se pudo eliminar la ruta");
    return await res.json();
  } catch (err) {
    console.error("deleteRuta error:", err);
    return null;
  }
}
