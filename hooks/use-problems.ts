"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  addProblem,
  editProblemMeta,
  rateProblemDifficulty,
  setProblemTags,
  type AddProblemInput,
  type ProblemFilters,
} from "@/lib/actions/problems";
import {
  EMPTY_FILTERS,
  problemKeys,
  problemFilterOptionsQueryOptions,
  problemsQueryOptions,
} from "@/lib/queries/problems";
import { attemptKeys } from "@/lib/queries/attempts";
import { analyticsKeys } from "@/lib/queries/analytics";
import { useToast } from "@/components/ui/toast";

export function useProblems(page = 1, filters: ProblemFilters = EMPTY_FILTERS) {
  return useSuspenseQuery(problemsQueryOptions(page, filters));
}

export function useProblemFilterOptions() {
  return useSuspenseQuery(problemFilterOptionsQueryOptions());
}

export function useAddProblem() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: (input: AddProblemInput) => addProblem(input),
    onSuccess: () => {
      // problemKeys.all, not a single page: adding a problem shifts every page.
      queryClient.invalidateQueries({ queryKey: problemKeys.all });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
      success("Problem added to your library");
    },
  });
}

/**
 * Saves topics for a problem whose platform did not supply any.
 *
 * Invalidates the analytics too: a newly tagged problem changes every per-topic
 * figure on the dashboard, including which topics now have enough attempts to
 * count as signal at all.
 */
export function useSetProblemTags(problemId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (tags: string[]) => setProblemTags(problemId, tags),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: attemptKeys.detail(problemId) });
      queryClient.invalidateQueries({ queryKey: problemKeys.all });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
      success(
        result.tags.length === 0
          ? "Topics cleared"
          : `Saved ${result.tags.length} topic${result.tags.length === 1 ? "" : "s"}`
      );
    },
    onError: (cause) => error(cause.message),
  });
}

/**
 * Saves how hard a problem felt to this user.
 *
 * Invalidates the analytics because the dashboard compares this rating against
 * the platform's, and for a custom problem the rating also becomes the
 * problem's own difficulty, which moves it between rows of the difficulty
 * breakdown.
 */
export function useRateProblem(problemId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (difficulty: string) =>
      rateProblemDifficulty(problemId, difficulty),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: attemptKeys.detail(problemId) });
      queryClient.invalidateQueries({ queryKey: problemKeys.all });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
      success(
        result.appliedToProblem
          ? "Saved. Custom problems take your rating as their difficulty."
          : "Difficulty saved"
      );
    },
    onError: (cause) => error(cause.message),
  });
}

/** Renames a problem, and sets the platform name on a custom one. */
export function useEditProblemMeta(problemId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (input: { title?: string; platformLabel?: string | null }) =>
      editProblemMeta({ problemId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attemptKeys.detail(problemId) });
      // problemKeys.all, not one page: a rename changes the title sort and the
      // platform filter, so every cached page and the platform list are stale.
      queryClient.invalidateQueries({ queryKey: problemKeys.all });
      success("Saved");
    },
    onError: (cause) => error(cause.message),
  });
}
