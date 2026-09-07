"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { addSolution, deleteSolution } from "@/lib/actions/solutions";
import {
  problemSolutionsQueryOptions,
  solutionKeys,
  userSolutionsQueryOptions,
} from "@/lib/queries/solutions";

export function useProblemSolutions(problemId: string) {
  return useSuspenseQuery(problemSolutionsQueryOptions(problemId));
}

export function useUserSolutions(page = 1) {
  return useSuspenseQuery(userSolutionsQueryOptions(page));
}

export function useAddSolution(problemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      code: string;
      language: string;
      attemptId?: string | null;
    }) => addSolution({ problemId, ...vars }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: solutionKeys.all }),
  });
}

export function useDeleteSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSolution(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: solutionKeys.all }),
  });
}
