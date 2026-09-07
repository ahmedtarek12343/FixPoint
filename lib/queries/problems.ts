import { queryOptions } from "@tanstack/react-query";
import { listProblems } from "@/lib/actions/problems";

export const problemKeys = {
  all: ["problems"] as const,
  // The page number belongs in the key: each page is its own cache entry, so
  // stepping back to a page you've seen is instant.
  list: (page: number) => [...problemKeys.all, "list", page] as const,
};

/**
 * Shared by the server prefetch and the client hook so the key and the fetcher
 * can't drift apart. No "use client" here on purpose — this module has to be
 * importable from both sides.
 */
export function problemsQueryOptions(page = 1) {
  return queryOptions({
    queryKey: problemKeys.list(page),
    // Wrapped in an arrow rather than passed as `queryFn: listProblems`:
    // React Query calls queryFn with a context object, and handing that to a
    // server action would try to send it across the wire as an argument.
    queryFn: () => listProblems({ page }),
  });
}
