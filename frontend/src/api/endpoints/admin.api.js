import api from "../axios";

export const adminApi = {
  getStats: () => api.get("/admin/stats"),

  getUsers: (params = {}) => api.get("/admin/users", { params }),

  getUser: (id) => api.get(`/admin/users/${id}`),

  freezeUser: (id, reason) =>
    api.post(`/admin/users/${id}/freeze`, { reason }),

  unfreezeUser: (id) => api.post(`/admin/users/${id}/unfreeze`),
};
