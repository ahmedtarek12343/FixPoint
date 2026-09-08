"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createSnapshot, deleteSnapshot } from "@/lib/actions/snapshots";
import { snapshotKeys, snapshotsQueryOptions } from "@/lib/queries/snapshots";
import { useToast } from "@/components/ui/toast";

export function useSnapshots(problemId: string) {
  return useSuspenseQuery(snapshotsQueryOptions(problemId));
}

/** The snapshot button lives in the whiteboard toolbar and the gallery it lands
 *  in is usually scrolled off screen, so both outcomes get a toast. */
export function useCreateSnapshot(problemId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (vars: { svg: string; label?: string }) =>
      createSnapshot({ problemId, ...vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: snapshotKeys.forProblem(problemId),
      });
      success("Snapshot saved");
    },
    onError: (cause) => error(cause.message),
  });
}

export function useDeleteSnapshot(problemId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteSnapshot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: snapshotKeys.forProblem(problemId),
      });
      success("Snapshot deleted");
    },
    onError: (cause) => error(cause.message),
  });
}
