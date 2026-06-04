import { endpoints } from "../config/variables";
import { fetchConToken } from "../utils/ApiHelper";

// 🚗 REGISTRAR SALIDA
// formData debe contener los campos de texto + archivos con nombre 'files'
export async function registrarSalida(formData) {
  try {
    const res = await fetchConToken(endpoints.operacionesSalida, {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || result.error || "Error al registrar salida");
    return result;
  } catch (err) {
    console.error("registrarSalida error:", err);
    throw err;
  }
}

// 🔚 REGISTRAR REGRESO
// formData debe contener los campos de texto + archivos con nombre 'files'
export async function registrarRegreso(formData) {
  try {
    const res = await fetchConToken(endpoints.operacionesRegreso, {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || result.error || "Error al registrar regreso");
    return result;
  } catch (err) {
    console.error("registrarRegreso error:", err);
    throw err;
  }
}

// 🔍 VER SI EL USUARIO TIENE UNA OPERACIÓN PENDIENTE
export async function getOperacionActiva(empleadoId) {
  try {
    const res = await fetchConToken(
      `${endpoints.getOperacionActiva}/${empleadoId}`,
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("getOperacionActiva error:", err);
    return null;
  }
}

export async function getReservaActivaVehiculo(vehiculoId) {
  try {
    const res = await fetchConToken(`/api/reservas/activa/${vehiculoId}`);

    if (!res.ok) throw new Error();

    return await res.json();
  } catch (err) {
    console.error("getReservaActivaVehiculo error:", err);
    return null;
  }
}

export async function getUltimoEstadoVehiculo(vehiculoId) {
  try {
    const res = await fetchConToken(
      `/api/operaciones/vehiculo/${vehiculoId}/ultimo-estado`,
    );

    if (!res.ok) throw new Error();

    return await res.json();
  } catch (err) {
    console.error("getUltimoEstadoVehiculo error:", err);
    return null;
  }
}
