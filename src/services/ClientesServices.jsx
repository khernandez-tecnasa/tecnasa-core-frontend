import { endpoints } from "../config/variables";
import { fetchConToken } from "../utils/ApiHelper";

// Obtener todos
export async function getClientes() {
  try {
    const res = await fetchConToken(endpoints.getClientes);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    return json; // <- un array
  } catch (err) {
    console.error("Error getClientes:", err);
    throw err;
  }
}

export async function searchClientes(query) {
  try {
    // Ajusta el parámetro query según tu backend (ej: ?q=, ?search=, ?nombre=)
    const res = await fetchConToken(`${endpoints.getClientes}?search=${query}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error searchClientes:", err);
    return [];
  }
}

// Obtener uno
export async function getClienteById(id) {
  try {
    const res = await fetchConToken(`${endpoints.getClientes}${id}`);
    return await res.json();
  } catch (err) {
    console.error("Error getClienteById:", err);
    return null;
  }
}

// Crear (con logo opcional)
export async function createCliente(data, logoFile) {
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== null && v !== undefined) formData.append(k, v);
  });
  if (logoFile) formData.append("logo", logoFile);

  const res = await fetchConToken(endpoints.addCliente, {
    method: "POST",
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || json.error || "Error al crear cliente");
  }
  return json;
}

// Actualizar (con logo opcional)
export async function updateCliente(id, data, logoFile) {
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== null && v !== undefined) formData.append(k, v);
  });
  if (logoFile) formData.append("logo", logoFile);

  const res = await fetchConToken(`${endpoints.updateCliente}${id}`, {
    method: "PUT",
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      json.message || json.error || "Error al actualizar cliente",
    );
  }
  return json;
}
