import api from "../axios";

export const transactionsApi = {
  getOne: (id) =>
    api.get(`/transactions/${id}`),

  getReceipt: (id) =>
    api.get(`/transactions/${id}/receipt`),
};