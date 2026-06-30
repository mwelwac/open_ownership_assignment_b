import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = (error as { status?: number }).status;
        return status && status < 500 ? false : failureCount < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 20_000,
    },
  },
});
