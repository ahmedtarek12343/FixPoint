"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser, requireUserForWrite } from "@/lib/current-user";
import { LANGUAGES, MAX_SOLUTION_LENGTH } from "@/lib/constants";
import {
  normalizePageArgs,
  toPage,
  type Page,
  type PageArgs,
} from "@/lib/pagination";

export type SolutionItem = {
  id: string;
  code: string;
  language: string;
  createdAt: string;
  problemId: string;
  problemTitle: string;
};

function toItem(solution: {
  id: string;
  code: string;
  language: string;
  createdAt: Date;
  problemId: string;
  problem: { title: string };
}): SolutionItem {
  return {
    id: solution.id,
    code: solution.code,
    language: solution.language,
    createdAt: solution.createdAt.toISOString(),
    problemId: solution.problemId,
    problemTitle: solution.problem.title,
  };
}

export async function listProblemSolutions(
  problemId: string
): Promise<SolutionItem[]> {
  const user = await requireCurrentUser();

  const solutions = await prisma.solution.findMany({
    where: { userId: user.id, problemId },
    orderBy: { createdAt: "desc" },
    include: { problem: { select: { title: true } } },
  });

  return solutions.map(toItem);
}

export async function listUserSolutions(
  args: PageArgs = {}
): Promise<Page<SolutionItem>> {
  const user = await requireCurrentUser();
  const { page, pageSize, skip, take } = normalizePageArgs(args);

  const where = { userId: user.id };

  const [solutions, total] = await Promise.all([
    prisma.solution.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { problem: { select: { title: true } } },
    }),
    prisma.solution.count({ where }),
  ]);

  return toPage(solutions.map(toItem), total, page, pageSize);
}

export async function addSolution(input: {
  problemId: string;
  code: string;
  language: string;
  attemptId?: string | null;
}) {
  const user = await requireUserForWrite();

  const code = input.code.trim();
  if (!code) throw new Error("Paste your solution first.");
  if (code.length > MAX_SOLUTION_LENGTH) {
    throw new Error(
      `Solutions are limited to ${MAX_SOLUTION_LENGTH} characters.`
    );
  }

  // The language comes from a <select>, but a select is UI, not a boundary.
  const language = (LANGUAGES as readonly string[]).includes(input.language)
    ? input.language
    : "Other";

  const problem = await prisma.problem.findUnique({
    where: { id: input.problemId },
    select: { id: true },
  });
  if (!problem) throw new Error("Problem not found");

  // An attempt can only be linked if it's this user's and on this problem.
  let attemptId: string | null = null;
  if (input.attemptId) {
    const attempt = await prisma.attempt.findFirst({
      where: {
        id: input.attemptId,
        userId: user.id,
        problemId: input.problemId,
      },
      select: { id: true },
    });
    attemptId = attempt?.id ?? null;
  }

  const solution = await prisma.solution.create({
    data: {
      userId: user.id,
      problemId: input.problemId,
      code,
      language,
      attemptId,
    },
  });

  return { id: solution.id };
}

export async function deleteSolution(id: string) {
  const user = await requireUserForWrite();

  const { count } = await prisma.solution.deleteMany({
    where: { id, userId: user.id },
  });
  if (count === 0) throw new Error("Solution not found");

  return { id };
}
