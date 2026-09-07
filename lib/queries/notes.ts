import { queryOptions } from "@tanstack/react-query";
import { listProblemNotes, listUserNotes } from "@/lib/actions/notes";

export const noteKeys = {
  all: ["notes"] as const,
  forProblem: (problemId: string) =>
    [...noteKeys.all, "problem", problemId] as const,
  mine: (page: number) => [...noteKeys.all, "mine", page] as const,
};

export function problemNotesQueryOptions(problemId: string) {
  return queryOptions({
    queryKey: noteKeys.forProblem(problemId),
    queryFn: () => listProblemNotes(problemId),
  });
}

export function userNotesQueryOptions(page = 1) {
  return queryOptions({
    queryKey: noteKeys.mine(page),
    queryFn: () => listUserNotes({ page }),
  });
}
