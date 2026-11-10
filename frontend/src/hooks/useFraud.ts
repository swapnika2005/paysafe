import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fraudApi } from "@/api/endpoints/fraud.api";
import { QUERY_KEYS } from "@/api/queryKeys";

export function useFraudReports(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.fraudReports(params),
    queryFn: async () => {
      const { data } = await fraudApi.getReports(params);
      return data.data as {
        reports: any[];
        pagination: { total: number; page: number; limit: number; pages: number };
      };
    },
    placeholderData: (prev) => prev,
  });
}

export function useConfirmFraud() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, admin_note }: { id: string; admin_note?: string }) =>
      fraudApi.confirm(id, admin_note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fraud-reports"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminStats });
    },
  });
}

export function useOverrideFraud() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, admin_note }: { id: string; admin_note?: string }) =>
      fraudApi.override(id, admin_note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fraud-reports"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminStats });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wallet });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
    },
  });
}
