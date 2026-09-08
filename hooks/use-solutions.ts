"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  addSolution,
  deleteSolution,
  updateSolution,
} from "@/lib/actions/solutions";
import {
  problemSolutionsQueryOptions,
  solutionKeys,
  userSolutionsQueryOptions,
} from "@/lib/queries/solutions";
import { useToast } from "@/components/ui/toast";

export function useProblemSolutions(problemId: string) {
  return useSuspenseQuery(problemSolutionsQueryOptions(problemId));
}

export function useUserSolutions(page = 1) {
  return useSuspenseQuery(userSolutionsQueryOptions(page));
}

export function useAddSolution(problemId: string) {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: (vars: {
      code: string;
      language: string;
      attemptId?: string | null;
    }) => addSolution({ problemId, ...vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.all });
      success("Solution saved");
    },
  });
}

export function useUpdateSolution() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (vars: { id: string; code: string; language: string }) =>
      updateSolution(vars),
    // solutionKeys.all: an edit shows on both this problem's panel and the
    // account-wide list, and there is no cheap way to know which is on screen.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.all });
      success("Solution updated");
    },
    onError: (cause) => error(cause.message),
  });
}

export function useDeleteSolution() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteSolution(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.all });
      success("Solution deleted");
    },
    onError: (cause) => error(cause.message),
  });
}
