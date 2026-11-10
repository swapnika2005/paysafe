import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/endpoints/admin.api";
import { QUERY_KEYS } from "@/api/queryKeys";

export function useAdminStats() {
  return useQuery({
    queryKey: QUERY_KEYS.adminStats,
    queryFn: async () => {
      const { data } = await adminApi.getStats();
      return data.data as {
        users: { total: number; frozen: number; active: number };
        transactions: {
          total: number;
          today: number;
          approved: number;
          blocked: number;
          fraud_rate: string;
        };
        fraud: { pending_reviews: number };
        volume: { total_inr: number; today_inr: number };
      };
    },
  });
}

export function useAdminUsers(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.adminUsers(params),
    queryFn: async () => {
      const { data } = await adminApi.getUsers(params);
      return data.data as {
        users: any[];
        pagination: { total: number; page: number; limit: number; pages: number };
      };
    },
    placeholderData: (prev) => prev,
  });
}

export function useFreezeUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminApi.freezeUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminStats });
    },
  });
}

export function useUnfreezeUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.unfreezeUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminStats });
    },
  });
}
