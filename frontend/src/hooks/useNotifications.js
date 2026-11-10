import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../api/endpoints/notifications.api";
import { QUERY_KEYS } from "../api/queryKeys";


export const useNotifications = (params = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.notifications, params],
    queryFn:  async () => {
      const { data } = await notificationsApi.getAll(params);
      return data.data;
    },
    refetchInterval: 1000 * 60, // poll every 60 seconds
  });
};


export const useMarkOneRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => notificationsApi.markOneRead(id),

    // Optimistic update — mark read instantly without waiting for API
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notifications });

      const previous = queryClient.getQueryData(QUERY_KEYS.notifications);

      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.notifications },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.map((n) =>
              n.id === id ? { ...n, is_read: true } : n
            ),
            unread_count: Math.max(0, (old.unread_count || 0) - 1),
          };
        }
      );

      return { previous };
    },

    // Rollback if API fails
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.notifications, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });
};


export const useMarkAllRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),

    // Optimistic update — mark all read instantly
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notifications });

      const previous = queryClient.getQueryData(QUERY_KEYS.notifications);

      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.notifications },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.map((n) => ({
              ...n,
              is_read: true,
            })),
            unread_count: 0,
          };
        }
      );

      return { previous };
    },

    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.notifications, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });
};