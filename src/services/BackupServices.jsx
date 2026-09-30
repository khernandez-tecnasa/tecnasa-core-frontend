import { endpoints } from "../config/variables";
import { fetchConToken } from "../utils/ApiHelper";

export async function generarBackupManual({ backupType = "full" } = {}) {
  const res = await fetchConToken(endpoints.backupManual, {
    method: "POST",
    body: JSON.stringify({ backupType }),
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al generar backup");
  return data;
}

export async function descargarBackup(id) {
  const res = await fetchConToken(endpoints.backupDownload(id));
  if (!res.ok) throw new Error("Error al descargar backup");
  return res.blob();
}

export async function eliminarBackup(id) {
  const res = await fetchConToken(endpoints.backupById(id), { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al eliminar backup");
  return data;
}

export async function verificarBackup(id) {
  const res = await fetchConToken(endpoints.backupVerify(id), { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al verificar backup");
  return data;
}

export async function cancelarBackup(id) {
  const res = await fetchConToken(endpoints.backupCancel(id), { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al cancelar backup");
  return data;
}

export async function iniciarAutorizacionRestauracion(backupId) {
  const res = await fetchConToken(endpoints.backupRestoreAuthorize(backupId), {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "No se pudo iniciar la verificación");
  return data;
}

export async function verificarAutorizacionRestauracion(backupId, proof) {
  const res = await fetchConToken(endpoints.backupRestoreAuthorizeVerify(backupId), {
    method: "POST",
    skipAuthRefresh: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proof),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "No se pudo verificar tu identidad");
  return data;
}

export async function iniciarRestauracion(backupId, confirmationText, authorizationToken) {
  const res = await fetchConToken(endpoints.backupRestoreStart(backupId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmationText, authorizationToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "No se pudo iniciar la restauración");
  return data;
}

export async function obtenerEstadoRestauracion(id) {
  const res = await fetchConToken(endpoints.backupRestoreStatus(id));
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "No se pudo consultar la restauración");
  return data;
}

export async function obtenerListaBackups() {
  const res = await fetchConToken(endpoints.backupList);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al listar backups");
  return data;
}

export async function iniciarRestore(sqlFile) {
  const formData = new FormData();
  formData.append("sqlFile", sqlFile);
  const res = await fetchConToken(endpoints.backupRestoreInit, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al iniciar restauración");
  return data;
}

export async function ejecutarRestore(confirmationToken, confirmationText) {
  const res = await fetchConToken(endpoints.backupRestoreExecute, {
    method: "POST",
    body: JSON.stringify({ confirmationToken, confirmationText }),
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al restaurar");
  return data;
}
