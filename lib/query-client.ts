import { QueryClient, environmentManager } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Non-zero staleTime matters for SSR: without it, everything we
        // prefetch on the server is considered stale the moment it hydrates
        // and immediately refetches on the client.
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  // The server needs a fresh client per request so one user's data never
  // leaks into another's cache. The browser keeps a single long-lived one.
  if (environmentManager.isServer()) return makeQueryClient();

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
