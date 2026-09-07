import { queryOptions } from "@tanstack/react-query";
import {
  listProblemSolutions,
  listUserSolutions,
} from "@/lib/actions/solutions";

export const solutionKeys = {
  all: ["solutions"] as const,
  forProblem: (problemId: string) =>
    [...solutionKeys.all, "problem", problemId] as const,
  mine: (page: number) => [...solutionKeys.all, "mine", page] as const,
};

export function problemSolutionsQueryOptions(problemId: string) {
  return queryOptions({
    queryKey: solutionKeys.forProblem(problemId),
    queryFn: () => listProblemSolutions(problemId),
  });
}

export function userSolutionsQueryOptions(page = 1) {
  return queryOptions({
    queryKey: solutionKeys.mine(page),
    queryFn: () => listUserSolutions({ page }),
  });
}
