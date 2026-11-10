import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          1000 * 60 * 2,  // 2 min — don't refetch if fresh
      gcTime:             1000 * 60 * 10, // 10 min — keep in cache
      retry:              1,              // retry once on failure
      refetchOnWindowFocus: true,         // refetch when tab becomes active
    },
    mutations: {
      retry: 0, // never retry mutations (send money etc.)
    },
  },
});

export default queryClient;