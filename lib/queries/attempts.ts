import { queryOptions } from "@tanstack/react-query";
import { getProblemDetail } from "@/lib/actions/attempts";

export const attemptKeys = {
  all: ["attempts"] as const,
  detail: (problemId: string) =>
    [...attemptKeys.all, "problem", problemId] as const,
};

/** No "use client" here on purpose: shared by the server prefetch and the
 *  client hook so the key and the fetcher can't drift apart. */
export function problemDetailQueryOptions(problemId: string) {
  return queryOptions({
    queryKey: attemptKeys.detail(problemId),
    queryFn: () => getProblemDetail(problemId),
  });
}
