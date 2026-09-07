"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createSnapshot, deleteSnapshot } from "@/lib/actions/snapshots";
import { snapshotKeys, snapshotsQueryOptions } from "@/lib/queries/snapshots";

export function useSnapshots(problemId: string) {
  return useSuspenseQuery(snapshotsQueryOptions(problemId));
}

export function useCreateSnapshot(problemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { svg: string; label?: string }) =>
      createSnapshot({ problemId, ...vars }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: snapshotKeys.forProblem(problemId),
      }),
  });
}

export function useDeleteSnapshot(problemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSnapshot(id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: snapshotKeys.forProblem(problemId),
      }),
  });
}
