import { endpoints } from "../config/variables";
import { fetchConToken } from "../utils/ApiHelper";

//
// VIÁTICOS
//

// tipo: "activos" | "historico" | "todos" — filtra en backend
export async function getViaticos(tipo = "activos") {
  try {
    const url = `${endpoints.getViaticos}?tipo=${tipo}`;
    const res = await fetchConToken(url);
    if (!res.ok) throw new Error("No se pudieron obtener los viáticos");
    return await res.json();
  } catch (err) {
    console.error("getViaticos error:", err);
    return null;
  }
}

export async function getViatico(id) {
  try {
    const res = await fetchConToken(endpoints.getViatico + id);
    if (!res.ok) throw new Error("No se pudo obtener el viático");
    return await res.json();
  } catch (err) {
    console.error("getViatico error:", err);
    return null;
  }
}

export async function createViatico(data) {
  const res = await fetchConToken(endpoints.createViatico, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "No se pudo crear el viático");
  }
  return res.json();
}

export async function updateViatico(id, data) {
  try {
    const res = await fetchConToken(endpoints.updateViatico + id, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("No se pudo actualizar el viático");
    return await res.json();
  } catch (err) {
    console.error("updateViatico error:", err);
    return null;
  }
}

export async function deleteViatico(id) {
  try {
    const res = await fetchConToken(endpoints.deleteViatico + id, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("No se pudo eliminar el viático");
    return await res.json();
  } catch (err) {
    console.error("deleteViatico error:", err);
    return null;
  }
}

export async function aprobarViatico(id) {
  try {
    const res = await fetchConToken(
      endpoints.aprobarViatico + id + "/aprobar",
      { method: "PUT" },
    );
    if (!res.ok) throw new Error("No se pudo aprobar el viático");
    return await res.json();
  } catch (err) {
    console.error("aprobarViatico error:", err);
    return null;
  }
}

export async function rechazarViatico(id, motivoRechazo) {
  try {
    const res = await fetchConToken(
      endpoints.cancelarViatico + id + "/rechazar",
      {
        method: "PUT",
        body: JSON.stringify({ motivo: motivoRechazo }),
        headers: { "Content-Type": "application/json" },
      },
    );
    if (!res.ok) throw new Error("No se pudo rechazar el viático");
    return await res.json();
  } catch (err) {
    console.error("cancelarViatico error:", err);
    return null;
  }
}

export async function enviarRevision(id) {
  try {
    const res = await fetchConToken(
      endpoints.enviarRevisionViatico + id + "/enviar-revision",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!res.ok) throw new Error("Error al enviar a revisión");

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
