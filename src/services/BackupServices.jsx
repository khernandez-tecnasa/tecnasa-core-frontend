import { endpoints } from "../config/variables";
import { fetchConToken } from "../utils/ApiHelper";

export async function generarBackupManual() {
  const res = await fetchConToken(endpoints.backupManual, { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al generar backup");
  return data;
}

export async function descargarBackup() {
  const res = await fetchConToken(endpoints.backupDownload);
  if (!res.ok) throw new Error("Error al descargar backup");
  return res.blob();
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
