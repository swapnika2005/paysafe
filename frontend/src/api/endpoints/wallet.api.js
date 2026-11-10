import api from "../axios";

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `spk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const walletApi = {
  getBalance: () => api.get("/wallet/balance"),

  topUp: (amount) => api.post("/wallet/topup", { amount }),

  sendMoney: (data) => {
    const idempotencyKey = data.idempotency_key || createIdempotencyKey();
    const { idempotency_key: _ignored, ...body } = data;
    return api.post("/wallet/send", body, {
      headers: { "Idempotency-Key": idempotencyKey },
    });
  },

  getHistory: (params) => api.get("/wallet/history", { params }),

  getLogs: (params) => api.get("/wallet/logs", { params }),

  getStats: () => api.get("/wallet/stats"),

  exportLogs: () =>
    api.get("/wallet/logs", {
      params: { export: true },
      responseType: "blob",
    }),

  lookupUser: (phone) => api.get("/wallet/lookup", { params: { phone } }),

  getRecentContacts: () => api.get("/wallet/recent-contacts"),
};
