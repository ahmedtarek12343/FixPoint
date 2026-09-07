"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser, requireUserForWrite } from "@/lib/current-user";
import { upsertProblemFromUrl } from "@/lib/data/problems";
import {
  normalizePageArgs,
  toPage,
  type Page,
  type PageArgs,
} from "@/lib/pagination";
import { AttemptStatus } from "@/generated/prisma/enums";

/**
 * Rows are dehydrated to JSON on their way to the client, so these functions
 * return plain serializable shapes rather than Prisma models — a `Date` would
 * silently arrive as a string while the type still claimed `Date`. It also
 * keeps us from shipping columns the UI never renders.
 */
export type ProblemListItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  difficulty: string | null;
  tags: string[];
  attemptCount: number;
  solvedCount: number;
  bestMs: number | null;
};

export async function listProblems(
  args: PageArgs = {}
): Promise<Page<ProblemListItem>> {
  const user = await requireCurrentUser();
  const { page, pageSize, skip, take } = normalizePageArgs(args);

  // Problem is a shared catalogue, so the list MUST be scoped to this user's
  // library — otherwise every user sees every problem anyone ever added.
  const where = { inLibraries: { some: { userId: user.id } } };

  const [problems, total] = await Promise.all([
    prisma.problem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        problemTags: { include: { tag: true } },
        attempts: {
          where: { userId: user.id },
          select: { status: true, durationMs: true },
        },
      },
    }),
    prisma.problem.count({ where }),
  ]);

  const items = problems.map((problem) => {
    const solved = problem.attempts.filter(
      (attempt) => attempt.status === AttemptStatus.SOLVED
    );

    return {
      id: problem.id,
      title: problem.title,
      url: problem.url,
      source: problem.source,
      difficulty: problem.difficulty,
      tags: problem.problemTags.map((problemTag) => problemTag.tag.name),
      attemptCount: problem.attempts.length,
      solvedCount: solved.length,
      bestMs: solved.reduce<number | null>(
        (best, attempt) =>
          attempt.durationMs !== null &&
          (best === null || attempt.durationMs < best)
            ? attempt.durationMs
            : best,
        null
      ),
    };
  });

  return toPage(items, total, page, pageSize);
}

export type AddProblemInput = {
  url: string;
  title: string;
  difficulty: string;
  tags: string;
};

export async function addProblem(input: AddProblemInput) {
  const user = await requireUserForWrite();

  const problem = await upsertProblemFromUrl(user.id, input);

  // Deliberately no revalidatePath here: React Query owns this list on the
  // client, and doing both would refetch the same data twice.
  return { id: problem.id };
}
