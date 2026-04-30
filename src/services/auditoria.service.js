import { api } from "./api";

export const AuditoriaService = {
  getByEntidad: (entidad, entidadId, params = {}) =>
    api.get(`/audit/${entidad}/${entidadId}`, { params }),
};
