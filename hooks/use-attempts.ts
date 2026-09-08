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
import { formatDuration } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import type { AttemptStatus } from "@/generated/prisma/enums";

/**
 * Toast policy across all the mutation hooks in this folder:
 *
 * - A success toast only where the result is otherwise invisible. Starting a
 *   timer already turns the panel into a running clock, so a toast on top of
 *   that is noise; saving a note produces no visible change, so it gets one.
 * - An error toast only where nothing else reports the failure. Anything the
 *   user has to act on (a rejected URL, a validation message) is rendered
 *   inline next to the control instead, because a message on a dismiss timer
 *   is the wrong home for something you need to read and fix.
 */

export function useProblemDetail(problemId: string) {
  return useSuspenseQuery(problemDetailQueryOptions(problemId));
}

/** Starting or ending an attempt changes this problem's history, the best-time
 *  column on the list page, and every figure on the dashboard, so all three
 *  caches are invalidated together. */
function invalidateAttempt(queryClient: QueryClient, problemId: string) {
  queryClient.invalidateQueries({ queryKey: attemptKeys.detail(problemId) });
  queryClient.invalidateQueries({ queryKey: problemKeys.all });
  queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
}

/** No toast: the panel visibly becomes a running clock, and the runner renders
 *  any failure inline. */
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

const OUTCOME_MESSAGE: Record<EndOutcome, string> = {
  SOLVED: "Solved in",
  GIVEN_UP: "Gave up after",
  AUTO_GIVEN_UP: "Time ran out at",
};

export function useEndAttempt(problemId: string) {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: (vars: { attemptId: string; outcome: EndOutcome }) =>
      endAttempt(vars.attemptId, vars.outcome),
    onSuccess: (attempt, vars) => {
      invalidateAttempt(queryClient, problemId);

      // The clock disappears the moment the attempt ends, so the toast is the
      // only place the final time is stated. Worth saying out loud.
      if (attempt?.durationMs != null) {
        success(
          `${OUTCOME_MESSAGE[vars.outcome]} ${formatDuration(attempt.durationMs)}`
        );
      }
    },
  });
}
