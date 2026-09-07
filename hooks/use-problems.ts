"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { addProblem, type AddProblemInput } from "@/lib/actions/problems";
import { problemKeys, problemsQueryOptions } from "@/lib/queries/problems";
import { analyticsKeys } from "@/lib/queries/analytics";

export function useProblems(page = 1) {
  return useSuspenseQuery(problemsQueryOptions(page));
}

export function useAddProblem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddProblemInput) => addProblem(input),
    onSuccess: () => {
      // problemKeys.all, not a single page: adding a problem shifts every page.
      queryClient.invalidateQueries({ queryKey: problemKeys.all });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });
}
