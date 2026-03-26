import { fetchConToken } from "@/utils/ApiHelper.jsx";
import { api } from "./api.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const PRE = "/facturacion";

export const FacturacionService = {
  // ==========================================
  // CONTRATOS Y ESTRUCTURA
  // ==========================================
  getContratosByCliente: (clienteId) =>
    api.get(`${PRE}/contratos/cliente/${clienteId}`),

  createContrato: (data) => api.post(`${PRE}/contratos`, data),
  getContratoById: (id) => api.get(`${PRE}/contratos/${id}`),
  updateContrato: (id, data) => api.put(`${PRE}/contratos/${id}`, data),
  desactivarContrato: (id) => api.del(`${PRE}/contratos/${id}`),

  // --- ITEMS (EQUIPOS) ---
  getItemsByContrato: (contratoId) =>
    api.get(`${PRE}/contratos/${contratoId}/items`),

  addItemToContrato: (data) => api.post(`${PRE}/contratos/items`, data),

  removeItemFromContrato: (itemId) =>
    api.del(`${PRE}/contratos/items/${itemId}`),

  updatePreciosItem: (itemId, data) =>
    api.put(`${PRE}/contratos/items/${itemId}`, data),

  // --- GRUPOS (BOLSONES) ---
  createGrupo: (data) => api.post(`${PRE}/grupos`, data),
  getGruposByContrato: (id) => api.get(`${PRE}/grupos/contrato/${id}`),
  updateGrupo: (id, data) => api.put(`${PRE}/grupos/${id}`, data),

  assignItemToGrupo: (itemId, grupoId) =>
    api.patch(`${PRE}/grupos/asignar-item/${itemId}`, { grupo_id: grupoId }),

  // ==========================================
  // PERIODOS Y ESTADOS (NUEVA LÓGICA)
  // ==========================================

  // 1. Obtener Calendario (Sin estados)
  getPeriodos: () => api.get(`${PRE}/periodos`),

  // 2. Crear Nuevo Mes en Calendario
  createPeriodo: (data) => api.post(`${PRE}/periodos`, data),

  // 3. Obtener Estado Específico (El Semáforo del Cliente)
  // GET /facturacion/periodos/:periodoId/estado/:clienteId
  getEstadoPeriodoCliente: (periodoId, clienteId) =>
    api.get(`${PRE}/periodos/${periodoId}/estado/${clienteId}`),

  // 4. Cambiar Estado (Ahora requiere cliente_id)
  changeEstadoPeriodo: (id, nuevoEstado, clienteId) =>
    api.patch(`${PRE}/periodos/${id}/estado`, {
      nuevo_estado: nuevoEstado,
      cliente_id: clienteId, // <--- IMPORTANTE
    }),

  // ==========================================
  // CARGA DE LECTURAS (INGENIERÍA)
  // ==========================================

  // Previsualizar errores antes de guardar
  previsualizarLecturas: async (file, clienteId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("cliente_id", clienteId);

    const res = await fetchConToken(
      `${BASE_URL}${PRE}/previsualizar-lecturas`,
      { method: "POST", body: formData },
    );

    // Manejo manual para asegurar que capturamos errores del backend
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al previsualizar el archivo");
    }
    return await res.json();
  },

  // Guardado Definitivo (Impacta DB)
  guardarLecturasDefinitivas: (periodoId, lecturasArray) =>
    api.post(`${PRE}/guardar-lecturas`, {
      periodo_id: periodoId,
      lecturas: lecturasArray,
    }),

  // Método Legacy (Carga directa sin previsualización - Opcional)
  uploadLecturas: async (periodoId, file) => {
    const formData = new FormData();
    formData.append("periodo_id", periodoId);
    formData.append("file", file);

    const urlCompleta = `${BASE_URL}${PRE}/subir-lecturas`;
    const res = await fetchConToken(urlCompleta, {
      method: "POST",
      body: formData,
    });

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      if (!res.ok) throw new Error(json.message || "Error subiendo archivo");
      return json;
    } catch (e) {
      throw new Error(
        `Error del servidor (${res.status}): Verifica la conexión`,
      );
    }
  },

  // ==========================================
  // REPORTES Y OPERACIONES
  // ==========================================
  getReporteMensual: (periodoId, clienteId) =>
    api.get(`${PRE}/reportes/${periodoId}/cliente/${clienteId}`),

  // ==========================================
  // REEMPLAZOS (IMPRESORAS TEMPORALES)
  // ==========================================
  createReemplazo: (data) => api.post(`${PRE}/reemplazos`, data),

  getReemplazosByPeriodo: (periodoId) =>
    api.get(`${PRE}/reemplazos/periodo/${periodoId}`),

  deleteReemplazo: (id) => api.del(`${PRE}/reemplazos/${id}`),
};
