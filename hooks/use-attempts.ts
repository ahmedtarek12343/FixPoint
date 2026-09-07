"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
  type QueryClient,
} from "@tanstack/react-query";
import { endAttempt, startAttempt } from "@/lib/actions/attempts";
import { attemptKeys, problemDetailQueryOptions } from "@/lib/queries/attempts";
import { problemKeys } from "@/lib/queries/problems";
import { analyticsKeys } from "@/lib/queries/analytics";
import type { AttemptStatus } from "@/generated/prisma/enums";

export function useProblemDetail(problemId: string) {
  return useSuspenseQuery(problemDetailQueryOptions(problemId));
}

/** Starting or ending an attempt changes this problem's history, the best-time
 *  column on the list page, and every figure on the dashboard — so all three
 *  caches are invalidated together. */
function invalidateAttempt(queryClient: QueryClient, problemId: string) {
  queryClient.invalidateQueries({ queryKey: attemptKeys.detail(problemId) });
  queryClient.invalidateQueries({ queryKey: problemKeys.all });
  queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
}

export function useStartAttempt(problemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (timeLimitMs: number | null) =>
      startAttempt(problemId, timeLimitMs),
    onSuccess: () => invalidateAttempt(queryClient, problemId),
  });
}

type EndOutcome = Extract<
  AttemptStatus,
  "SOLVED" | "GIVEN_UP" | "AUTO_GIVEN_UP"
>;

export function useEndAttempt(problemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { attemptId: string; outcome: EndOutcome }) =>
      endAttempt(vars.attemptId, vars.outcome),
    onSuccess: () => invalidateAttempt(queryClient, problemId),
  });
}
