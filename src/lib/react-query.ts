import { QueryClient } from "@tanstack/react-query";

const ONE_MINUTE = 60 * 1000;

export const queryPresets = {
  detail: {
    gcTime: 10 * ONE_MINUTE,
    refetchOnWindowFocus: false as const,
    staleTime: 2 * ONE_MINUTE,
  },
  operational: {
    gcTime: 10 * ONE_MINUTE,
    refetchOnWindowFocus: false as const,
    staleTime: ONE_MINUTE,
  },
  search: {
    gcTime: 5 * ONE_MINUTE,
    refetchOnWindowFocus: false as const,
    staleTime: 30 * 1000,
  },
  static: {
    gcTime: 30 * ONE_MINUTE,
    refetchOnWindowFocus: false as const,
    staleTime: 10 * ONE_MINUTE,
  },
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: ONE_MINUTE,
    },
  },
});
