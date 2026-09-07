import { queryOptions } from "@tanstack/react-query";
import { getWhiteboard } from "@/lib/actions/whiteboard";

export const whiteboardKeys = {
  all: ["whiteboard"] as const,
  forProblem: (problemId: string) =>
    [...whiteboardKeys.all, "problem", problemId] as const,
};

export function whiteboardQueryOptions(problemId: string) {
  return queryOptions({
    queryKey: whiteboardKeys.forProblem(problemId),
    queryFn: () => getWhiteboard(problemId),
    // The board is only ever written by this tab; refetching would fight the
    // local editor state.
    staleTime: Infinity,
  });
}
