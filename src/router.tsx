import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Keep screen data warm across route changes on slower mobile devices.
        staleTime: 90_000,
        gcTime: 20 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
        retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 5_000),
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 30,
    // Let Query control freshness; reuse preloaded data for 30s to avoid double fetches
    defaultPreloadStaleTime: 30_000,
    defaultPendingMs: 200,
    defaultPendingMinMs: 0,
  });

  return router;
};
