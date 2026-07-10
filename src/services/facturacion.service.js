import { endpoints } from "../config/variables";
import { fetchConToken } from "../utils/ApiHelper";

//
// CONTRATOS
//

export async function getContratosByCliente(idCliente) {
  const res = await fetchConToken(`${endpoints.getContratosByCliente}${idCliente}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al obtener contratos");
  return json;
}

export async function getContratoById(id) {
  const res = await fetchConToken(`${endpoints.getContratoById}${id}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al obtener el contrato");
  return json;
}

export async function createContrato(data) {
  const res = await fetchConToken(endpoints.createContrato, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al crear el contrato");
  return json;
}

export async function updateContrato(id, data) {
  const res = await fetchConToken(`${endpoints.updateContrato}${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al actualizar el contrato");
  return json;
}

export async function desactivarContrato(id) {
  const res = await fetchConToken(`${endpoints.deleteContrato}${id}`, {
    method: "DELETE",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al desactivar el contrato");
  return json;
}

//
// ITEMS (impresoras en contrato)
//

export async function getContratoItems(idContrato) {
  const res = await fetchConToken(`${endpoints.getContratoItems}${idContrato}/items`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al obtener las impresoras del contrato");
  return json;
}

export async function addContratoItem(data) {
  const res = await fetchConToken(endpoints.addContratoItem, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al agregar la impresora al contrato");
  return json;
}

export async function updateContratoItemPrecios(id, data) {
  const res = await fetchConToken(`${endpoints.updateContratoItem}${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al actualizar los precios");
  return json;
}

export async function removeContratoItem(id) {
  const res = await fetchConToken(`${endpoints.deleteContratoItem}${id}`, {
    method: "DELETE",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al retirar la impresora del contrato");
  return json;
}

//
// GRUPOS DE FACTURACION (bolsones)
//

export async function getGruposByCliente(idCliente) {
  const res = await fetchConToken(`${endpoints.getGruposByCliente}${idCliente}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al obtener los grupos de facturación");
  return json;
}

export async function createGrupoFacturacion(data) {
  const res = await fetchConToken(endpoints.createGrupoFacturacion, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al crear el grupo de facturación");
  return json;
}

export async function updateGrupoFacturacion(id, data) {
  const res = await fetchConToken(`${endpoints.updateGrupoFacturacion}${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al actualizar el grupo");
  return json;
}

export async function asignarItemAGrupo(idItem, grupoId) {
  const res = await fetchConToken(`${endpoints.asignarItemAGrupo}${idItem}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grupo_id: grupoId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al asignar la impresora al grupo");
  return json;
}

//
// PERIODOS / ESTADOS DE CIERRE
//

export async function getPeriodos() {
  const res = await fetchConToken(endpoints.getPeriodos);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al obtener los periodos");
  return json;
}

export async function createPeriodo(data) {
  const res = await fetchConToken(endpoints.createPeriodo, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al crear el periodo");
  return json;
}

export async function getEstadoPeriodoCliente(periodoId, clienteId) {
  const res = await fetchConToken(`${endpoints.getEstadoPeriodoCliente}${periodoId}/estado/${clienteId}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al obtener el estado");
  return json;
}

export async function changePeriodoEstado(periodoId, nuevoEstado, clienteId) {
  const res = await fetchConToken(`${endpoints.changePeriodoEstado}${periodoId}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nuevo_estado: nuevoEstado, cliente_id: clienteId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al cambiar el estado");
  return json;
}

//
// LECTURAS MENSUALES
//

export async function previsualizarLecturas(file, clienteId) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("cliente_id", clienteId);
  const res = await fetchConToken(endpoints.previsualizarLecturas, {
    method: "POST",
    body: fd,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al previsualizar el archivo");
  return json;
}

export async function guardarLecturasDefinitivas(periodoId, lecturas, clienteId) {
  const res = await fetchConToken(endpoints.guardarLecturasDefinitivas, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ periodo_id: periodoId, cliente_id: clienteId, lecturas }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al guardar las lecturas");
  return json;
}

//
// REEMPLAZOS TEMPORALES
//

export async function createReemplazo(data) {
  const res = await fetchConToken(endpoints.createReemplazo, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al registrar el reemplazo");
  return json;
}

export async function getReemplazosByPeriodo(periodoId, clienteId) {
  const qs = clienteId ? `?clienteId=${clienteId}` : "";
  const res = await fetchConToken(`${endpoints.getReemplazosByPeriodo}${periodoId}${qs}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al obtener los reemplazos");
  return json;
}

export async function deleteReemplazo(id) {
  const res = await fetchConToken(`${endpoints.deleteReemplazo}${id}`, {
    method: "DELETE",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al eliminar el reemplazo");
  return json;
}

export async function getUltimoReemplazo({ contratoItemId, activoTemporalId, periodoId }) {
  const params = new URLSearchParams({
    contratoItemId: String(contratoItemId),
    activoTemporalId: String(activoTemporalId),
    periodoId: String(periodoId),
  });
  const res = await fetchConToken(`${endpoints.getUltimoReemplazo}?${params.toString()}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al buscar el reemplazo anterior");
  return json;
}

//
// REPORTES (PROFORMA)
//

export async function getReporteMensual(periodoId, clienteId) {
  const res = await fetchConToken(`${endpoints.getReporteMensual}${periodoId}/cliente/${clienteId}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al generar el reporte");
  return json;
}

//
// MONEDAS / TIPOS DE CAMBIO
//

export async function getMonedas() {
  const res = await fetchConToken(endpoints.getMonedas);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al obtener las monedas");
  return json;
}

export async function createMoneda(data) {
  const res = await fetchConToken(endpoints.getMonedas, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al crear la moneda");
  return json;
}

export async function getTiposCambio(idMoneda) {
  const res = await fetchConToken(`${endpoints.getMonedas}${idMoneda}/tipos-cambio`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al obtener los tipos de cambio");
  return json;
}

export async function createTipoCambio(data) {
  const res = await fetchConToken(`${endpoints.getMonedas}tipos-cambio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Error al registrar el tipo de cambio");
  return json;
}
