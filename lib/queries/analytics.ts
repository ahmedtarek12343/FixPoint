import { queryOptions } from "@tanstack/react-query";
import { getAnalytics } from "@/lib/actions/analytics";

export const analyticsKeys = {
  all: ["analytics"] as const,
  summary: () => [...analyticsKeys.all, "summary"] as const,
};

/** No "use client": shared by the server prefetch and the client hook. */
export function analyticsQueryOptions() {
  return queryOptions({
    queryKey: analyticsKeys.summary(),
    queryFn: () => getAnalytics(),
  });
}
