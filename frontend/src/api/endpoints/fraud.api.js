import api from "../axios";

export const fraudApi = {
  getReports: (params = {}) => api.get("/fraud", { params }),

  getReport: (id) => api.get(`/fraud/${id}`),

  confirm: (id, admin_note) =>
    api.post(`/fraud/${id}/confirm`, { admin_note }),

  override: (id, admin_note) =>
    api.post(`/fraud/${id}/override`, { admin_note }),
};
