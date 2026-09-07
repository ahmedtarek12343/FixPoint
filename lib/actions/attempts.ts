"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser, requireUserForWrite } from "@/lib/current-user";
import { MAX_TIME_LIMIT_MS } from "@/lib/constants";
import { AttemptStatus } from "@/generated/prisma/enums";

/** Dates become ISO strings here — dehydration is JSON, so a `Date` would
 *  arrive on the client as a string while the type still claimed `Date`. */
export type AttemptDto = {
  id: string;
  status: AttemptStatus;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  timeLimitMs: number | null;
};

export type ProblemDetail = {
  id: string;
  title: string;
  url: string;
  source: string;
  difficulty: string | null;
  tags: string[];
  activeAttempt: AttemptDto | null;
  attempts: AttemptDto[];
  bestMs: number | null;
  solvedCount: number;
};

function toDto(attempt: {
  id: string;
  status: AttemptStatus;
  startedAt: Date;
  endedAt: Date | null;
  durationMs: number | null;
  timeLimitMs: number | null;
}): AttemptDto {
  return {
    id: attempt.id,
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    endedAt: attempt.endedAt?.toISOString() ?? null,
    durationMs: attempt.durationMs,
    timeLimitMs: attempt.timeLimitMs,
  };
}

export async function getProblemDetail(
  problemId: string
): Promise<ProblemDetail | null> {
  const user = await requireCurrentUser();

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { problemTags: { include: { tag: true } } },
  });
  if (!problem) return null;

  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id, problemId },
    orderBy: { startedAt: "desc" },
    take: 25,
  });

  const solved = attempts.filter(
    (attempt) => attempt.status === AttemptStatus.SOLVED
  );

  return {
    id: problem.id,
    title: problem.title,
    url: problem.url,
    source: problem.source,
    difficulty: problem.difficulty,
    tags: problem.problemTags.map((problemTag) => problemTag.tag.name),
    activeAttempt:
      attempts.map(toDto).find((a) => a.status === AttemptStatus.IN_PROGRESS) ??
      null,
    attempts: attempts.map(toDto),
    bestMs: solved.reduce<number | null>(
      (best, attempt) =>
        attempt.durationMs !== null && (best === null || attempt.durationMs < best)
          ? attempt.durationMs
          : best,
      null
    ),
    solvedCount: solved.length,
  };
}

export async function startAttempt(problemId: string, timeLimitMs: number | null) {
  const user = await requireUserForWrite();

  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) throw new Error("Problem not found");

  // Resuming beats stacking: if a timer is already running for this problem,
  // keep it rather than starting a second one.
  const running = await prisma.attempt.findFirst({
    where: { userId: user.id, problemId, status: AttemptStatus.IN_PROGRESS },
  });
  if (running) return toDto(running);

  const limit =
    timeLimitMs && timeLimitMs > 0
      ? Math.min(Math.round(timeLimitMs), MAX_TIME_LIMIT_MS)
      : null;

  const attempt = await prisma.attempt.create({
    data: {
      userId: user.id,
      problemId,
      status: AttemptStatus.IN_PROGRESS,
      startedAt: new Date(),
      timeLimitMs: limit,
    },
  });

  return toDto(attempt);
}

type EndOutcome = Extract<AttemptStatus, "SOLVED" | "GIVEN_UP" | "AUTO_GIVEN_UP">;

export async function endAttempt(attemptId: string, outcome: EndOutcome) {
  const user = await requireUserForWrite();

  // Look it up by owner, not just by id: the client says *which* attempt,
  // never whose.
  const attempt = await prisma.attempt.findFirst({
    where: { id: attemptId, userId: user.id, status: AttemptStatus.IN_PROGRESS },
  });
  if (!attempt) return null;

  const endedAt = new Date();
  // Computed from the stored startedAt, never from a client-sent elapsed
  // value, so a personal best can't be forged from devtools.
  let durationMs = endedAt.getTime() - attempt.startedAt.getTime();
  if (outcome === AttemptStatus.AUTO_GIVEN_UP && attempt.timeLimitMs) {
    durationMs = Math.min(durationMs, attempt.timeLimitMs);
  }

  const updated = await prisma.attempt.update({
    where: { id: attempt.id },
    data: { status: outcome, endedAt, durationMs },
  });

  return toDto(updated);
}
