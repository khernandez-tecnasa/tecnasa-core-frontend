import { endpoints } from "../config/variables";
import { fetchConToken, withQuery } from "../utils/ApiHelper";

// ── Helper ────────────────────────────────────────────────────────────────────
async function fetchReport(url, params = {}) {
  try {
    const fullUrl = withQuery(url, params);
    const res = await fetchConToken(fullUrl);
    const data = await res.json();
    if (!res.ok) {
      console.error("Error al obtener reporte:", data);
      return [];
    }
    return data;
  } catch (err) {
    console.error("fetchReport error:", err);
    return [];
  }
}

// ── Existentes (ahora con soporte de fechas) ──────────────────────────────────

export async function getRegisterReport({ from, to, status } = {}) {
  return fetchReport(endpoints.getRegisterReport, { from, to, status });
}

export async function getEmpleadosMasSalidasReport({ from, to } = {}) {
  return fetchReport(endpoints.getEmpleadosMasSalidas, { from, to });
}

export async function getKilometrajePorEmpleadoReport({ from, to } = {}) {
  return fetchReport(endpoints.getKilometrajePorEmpleado, { from, to });
}

export async function getVehiculosMasUtilizadosReport({ from, to } = {}) {
  return fetchReport(endpoints.getVehiculosMasUtilizados, { from, to });
}

export async function getRegistrosPorUbicacionReport({ from, to } = {}) {
  return fetchReport(endpoints.getRegistrosPorUbicacion, { from, to });
}

export async function getConsumoCombustibleVehiculoReport({ from, to } = {}) {
  return fetchReport(endpoints.getConsumoCombustibleVehiculo, { from, to });
}

// ── Nuevos ────────────────────────────────────────────────────────────────────

export async function getViajesDuracionReport({ from, to } = {}) {
  return fetchReport(endpoints.getViajesDuracion, { from, to });
}

export async function getActividadSemanalReport({ from, to } = {}) {
  return fetchReport(endpoints.getActividadSemanal, { from, to });
}

export async function getReservasEstadoReport({ from, to } = {}) {
  return fetchReport(endpoints.getReservasEstado, { from, to });
}

export async function getReservasPorEmpleadoReport({ from, to } = {}) {
  return fetchReport(endpoints.getReservasPorEmpleado, { from, to });
}

export async function getViaticosEstadoReport({ from, to } = {}) {
  return fetchReport(endpoints.getViaticosEstado, { from, to });
}

export async function getViaticosEmpleadosReport({ from, to } = {}) {
  return fetchReport(endpoints.getViaticosEmpleados, { from, to });
}

export async function getViaticosporTipoReport({ from, to } = {}) {
  return fetchReport(endpoints.getViaticosporTipo, { from, to });
}

export async function getActivosEstadoReport() {
  try {
    const res = await fetchConToken(endpoints.getActivosEstado);
    const data = await res.json();
    if (!res.ok) return { byEstatus: [], byTipo: [] };
    return data;
  } catch (err) {
    console.error("getActivosEstadoReport error:", err);
    return { byEstatus: [], byTipo: [] };
  }
}

export async function getBodegasOcupacionReport() {
  return fetchReport(endpoints.getBodegasOcupacion);
}

// ── Dashboard nuevos ──────────────────────────────────────────────────────────

export async function getDashboardKpisData() {
  try {
    const res = await fetchConToken(endpoints.getDashboardKpis);
    const data = await res.json();
    if (!res.ok) return null;
    return data;
  } catch (err) {
    console.error("getDashboardKpisData error:", err);
    return null;
  }
}

export async function getActividad7DiasData() {
  return fetchReport(endpoints.getActividad7Dias);
}

// ── Dashboard metrics (legacy) ────────────────────────────────────────────────

export async function getTotalEmpleados() {
  try {
    const res = await fetchConToken(endpoints.getTotalEmpleados);
    const data = await res.json();
    if (!res.ok) return { total: 0 };
    return data;
  } catch (err) {
    console.error("getTotalEmpleados error:", err);
    return { total: 0 };
  }
}

export async function getTotalVehiculos() {
  try {
    const res = await fetchConToken(endpoints.getTotalVehiculos);
    const data = await res.json();
    if (!res.ok) return { total: 0 };
    return data;
  } catch (err) {
    console.error("getTotalVehiculos error:", err);
    return { total: 0 };
  }
}

export async function getVehiculosEnUso() {
  try {
    const res = await fetchConToken(endpoints.getVehiculosEnUso);
    const data = await res.json();
    if (!res.ok) return { total: 0 };
    return data;
  } catch (err) {
    console.error("getVehiculosEnUso error:", err);
    return { total: 0 };
  }
}

export async function getVehiculosEnMantenimiento() {
  try {
    const res = await fetchConToken(endpoints.getVehiculosEnMantenimiento);
    const data = await res.json();
    if (!res.ok) return { total: 0 };
    return data;
  } catch (err) {
    console.error("getVehiculosEnMantenimiento error:", err);
    return { total: 0 };
  }
}
