import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "../api/endpoints/transactions.api";
import { QUERY_KEYS } from "../api/queryKeys";


export const useTransaction = (id) => {
  return useQuery({
    queryKey: QUERY_KEYS.transaction(id),
    queryFn:  async () => {
      const { data } = await transactionsApi.getOne(id);
      return data.data.transaction;
    },
    enabled: !!id, // only fetch if id exists
  });
};

s
export const useReceipt = (id) => {
  return useQuery({
    queryKey: QUERY_KEYS.receipt(id),
    queryFn:  async () => {
      const { data } = await transactionsApi.getReceipt(id);
      return data.data.receipt;
    },
    enabled:   !!id,
    staleTime: Infinity, // receipt never changes — cache forever
  });
};