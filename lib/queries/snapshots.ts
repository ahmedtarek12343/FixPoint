import { queryOptions } from "@tanstack/react-query";
import { listSnapshots } from "@/lib/actions/snapshots";

export const snapshotKeys = {
  all: ["snapshots"] as const,
  forProblem: (problemId: string) =>
    [...snapshotKeys.all, "problem", problemId] as const,
};

export function snapshotsQueryOptions(problemId: string) {
  return queryOptions({
    queryKey: snapshotKeys.forProblem(problemId),
    queryFn: () => listSnapshots(problemId),
  });
}
