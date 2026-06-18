import { endpoints } from "../config/variables";
import { fetchConToken } from "../utils/ApiHelper";

//
// RESERVAS
//

export async function getReservas() {
  try {
    const res = await fetchConToken(endpoints.getReservas);
    if (!res.ok) throw new Error("No se pudieron obtener las reservas");
    return await res.json();
  } catch (err) {
    console.error("getReservas error:", err);
    return null;
  }
}

export async function getReserva(id) {
  try {
    const res = await fetchConToken(endpoints.getReserva + id);
    if (!res.ok) throw new Error("No se pudo obtener la reserva");
    return await res.json();
  } catch (err) {
    console.error("getReserva error:", err);
    return null;
  }
}

export async function createReserva(data) {
  try {
    const res = await fetchConToken(endpoints.createReserva, {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("No se pudo crear la reserva");
    return await res.json();
  } catch (err) {
    console.error("createReserva error:", err);
    return null;
  }
}

export async function updateReserva(id, data) {
  try {
    const res = await fetchConToken(endpoints.updateReserva + id, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("No se pudo actualizar la reserva");
    return await res.json();
  } catch (err) {
    console.error("updateReserva error:", err);
    return null;
  }
}

// 🔥 acciones especiales
export async function iniciarReserva(id) {
  try {
    const res = await fetchConToken(
      endpoints.iniciarReserva + id + "/iniciar",
      {
        method: "POST",
      },
    );

    if (!res.ok) throw new Error("No se pudo iniciar la reserva");
    return await res.json();
  } catch (err) {
    console.error("iniciarReserva error:", err);
    return null;
  }
}

export async function finalizarReserva(id) {
  try {
    const res = await fetchConToken(
      endpoints.finalizarReserva + id + "/finalizar",
      {
        method: "POST",
      },
    );

    if (!res.ok) throw new Error("No se pudo finalizar la reserva");
    return await res.json();
  } catch (err) {
    console.error("finalizarReserva error:", err);
    return null;
  }
}

export async function cancelarReserva(id) {
  try {
    const res = await fetchConToken(
      endpoints.cancelarReserva + id + "/cancelar",
      {
        method: "POST",
      },
    );

    if (!res.ok) throw new Error("No se pudo cancelar la reserva");
    return await res.json();
  } catch (err) {
    console.error("cancelarReserva error:", err);
    return null;
  }
}

export async function deleteReserva(id) {
  try {
    const res = await fetchConToken(`${endpoints.deleteReserva}${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!res.ok) throw new Error("No se pudo eliminar la reserva");
    return await res.json();
  } catch (err) {
    console.error("deleteReserva error:", err);
    return null;
  }
}

export async function extenderReserva(id, data) {
  const res = await fetchConToken(`${endpoints.extenderReserva}${id}/extender`, {
    method: "PATCH",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "No se pudo extender la reserva");
  return body;
}

export async function getDisponibilidad(inicio, fin) {
  try {
    const res = await fetchConToken(
      `/api/reservas/disponibilidad?inicio=${inicio}&fin=${fin}`,
    );

    if (!res.ok) throw new Error("Error disponibilidad");

    const data = await res.json();
    return data || [];
  } catch (err) {
    console.error("getDisponibilidad error:", err);
    return [];
  }
}
