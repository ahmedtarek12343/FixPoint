"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { MIN_ATTEMPTS_FOR_SIGNAL } from "@/lib/constants";
import { AttemptStatus } from "@/generated/prisma/enums";

export type TopicStat = {
  tag: string;
  attempts: number;
  solved: number;
  /** 0..1 */
  solveRate: number;
  avgSolveMs: number | null;
};

export type SolvedProblem = {
  id: string;
  title: string;
  source: string;
  difficulty: string | null;
  bestMs: number;
  solvedCount: number;
  lastSolvedAt: string;
};

export type DayActivity = {
  /** YYYY-MM-DD */
  date: string;
  attempts: number;
  solved: number;
};

export type DifficultyStat = {
  difficulty: string;
  attempts: number;
  solved: number;
  solveRate: number;
};

export type SolvePoint = {
  at: string;
  durationMs: number;
  problemTitle: string;
};

export type Analytics = {
  totalAttempts: number;
  problemsAttempted: number;
  problemsSolved: number;
  totalTimeMs: number;
  /** 0..1 across finished attempts */
  solveRate: number;
  avgSolveMs: number | null;
  /** Topics with enough attempts to mean something, best solve rate first. */
  topics: TopicStat[];
  /** Topics seen but still below the signal threshold. */
  lowDataTopics: string[];
  solvedProblems: SolvedProblem[];
  activity: DayActivity[];
  difficulties: DifficultyStat[];
  /** Oldest → newest, so the chart reads left to right. */
  solveTrend: SolvePoint[];
};

const ACTIVITY_DAYS = 14;
const TREND_POINTS = 20;
/** Difficulty is ordinal, so it's displayed in this order, not by value. */
const DIFFICULTY_ORDER = ["EASY", "MEDIUM", "HARD", "UNRATED"];

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getAnalytics(): Promise<Analytics> {
  const user = await requireCurrentUser();

  // In-progress attempts have no outcome yet, so they'd drag every rate down.
  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id, status: { not: AttemptStatus.IN_PROGRESS } },
    include: {
      problem: { include: { problemTags: { include: { tag: true } } } },
    },
    orderBy: { startedAt: "desc" },
  });

  const solvedAttempts = attempts.filter(
    (attempt) => attempt.status === AttemptStatus.SOLVED
  );
  const solvedDurations = solvedAttempts
    .map((attempt) => attempt.durationMs)
    .filter((ms): ms is number => ms !== null);

  // --- per-topic rollup -----------------------------------------------------
  const topicTotals = new Map<
    string,
    { attempts: number; solved: number; solveMsTotal: number; solveMsCount: number }
  >();

  for (const attempt of attempts) {
    const isSolved = attempt.status === AttemptStatus.SOLVED;

    for (const { tag } of attempt.problem.problemTags) {
      const totals = topicTotals.get(tag.name) ?? {
        attempts: 0,
        solved: 0,
        solveMsTotal: 0,
        solveMsCount: 0,
      };

      totals.attempts += 1;
      if (isSolved) {
        totals.solved += 1;
        if (attempt.durationMs !== null) {
          totals.solveMsTotal += attempt.durationMs;
          totals.solveMsCount += 1;
        }
      }

      topicTotals.set(tag.name, totals);
    }
  }

  const allTopics: TopicStat[] = [...topicTotals.entries()].map(
    ([tag, totals]) => ({
      tag,
      attempts: totals.attempts,
      solved: totals.solved,
      solveRate: totals.solved / totals.attempts,
      avgSolveMs: totals.solveMsCount
        ? Math.round(totals.solveMsTotal / totals.solveMsCount)
        : null,
    })
  );

  const topics = allTopics
    .filter((topic) => topic.attempts >= MIN_ATTEMPTS_FOR_SIGNAL)
    // Best solve rate first; a faster average breaks ties.
    .sort(
      (a, b) =>
        b.solveRate - a.solveRate ||
        (a.avgSolveMs ?? Infinity) - (b.avgSolveMs ?? Infinity)
    );

  const lowDataTopics = allTopics
    .filter((topic) => topic.attempts < MIN_ATTEMPTS_FOR_SIGNAL)
    .map((topic) => topic.tag)
    .sort();

  // --- solved problems, best time each -------------------------------------
  const byProblem = new Map<string, SolvedProblem>();

  for (const attempt of solvedAttempts) {
    if (attempt.durationMs === null) continue;

    const existing = byProblem.get(attempt.problemId);
    if (!existing) {
      byProblem.set(attempt.problemId, {
        id: attempt.problemId,
        title: attempt.problem.title,
        source: attempt.problem.source,
        difficulty: attempt.problem.difficulty,
        bestMs: attempt.durationMs,
        solvedCount: 1,
        // attempts are ordered newest first, so the first one seen is the latest
        lastSolvedAt: (attempt.endedAt ?? attempt.startedAt).toISOString(),
      });
      continue;
    }

    existing.solvedCount += 1;
    existing.bestMs = Math.min(existing.bestMs, attempt.durationMs);
  }

  // --- difficulty rollup ----------------------------------------------------
  const difficultyTotals = new Map<string, { attempts: number; solved: number }>();

  for (const attempt of attempts) {
    const key = attempt.problem.difficulty ?? "UNRATED";
    const totals = difficultyTotals.get(key) ?? { attempts: 0, solved: 0 };

    totals.attempts += 1;
    if (attempt.status === AttemptStatus.SOLVED) totals.solved += 1;
    difficultyTotals.set(key, totals);
  }

  const difficulties: DifficultyStat[] = DIFFICULTY_ORDER.filter((key) =>
    difficultyTotals.has(key)
  ).map((key) => {
    const totals = difficultyTotals.get(key)!;
    return {
      difficulty: key,
      attempts: totals.attempts,
      solved: totals.solved,
      solveRate: totals.solved / totals.attempts,
    };
  });

  // --- solve-time trend -----------------------------------------------------
  // solvedAttempts is newest-first; take the recent slice, then flip it so the
  // chart runs left to right in time order.
  const solveTrend: SolvePoint[] = solvedAttempts
    .filter((attempt) => attempt.durationMs !== null)
    .slice(0, TREND_POINTS)
    .reverse()
    .map((attempt) => ({
      at: (attempt.endedAt ?? attempt.startedAt).toISOString(),
      durationMs: attempt.durationMs!,
      problemTitle: attempt.problem.title,
    }));

  // --- activity strip -------------------------------------------------------
  const activity: DayActivity[] = [];
  const today = new Date();

  for (let offset = ACTIVITY_DAYS - 1; offset >= 0; offset--) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const key = dateKey(day);

    const onDay = attempts.filter(
      (attempt) => dateKey(attempt.startedAt) === key
    );

    activity.push({
      date: key,
      attempts: onDay.length,
      solved: onDay.filter((a) => a.status === AttemptStatus.SOLVED).length,
    });
  }

  return {
    totalAttempts: attempts.length,
    problemsAttempted: new Set(attempts.map((a) => a.problemId)).size,
    problemsSolved: new Set(solvedAttempts.map((a) => a.problemId)).size,
    totalTimeMs: attempts.reduce((sum, a) => sum + (a.durationMs ?? 0), 0),
    solveRate: attempts.length ? solvedAttempts.length / attempts.length : 0,
    avgSolveMs: solvedDurations.length
      ? Math.round(
          solvedDurations.reduce((sum, ms) => sum + ms, 0) /
            solvedDurations.length
        )
      : null,
    topics,
    lowDataTopics,
    solvedProblems: [...byProblem.values()].sort((a, b) =>
      b.lastSolvedAt.localeCompare(a.lastSolvedAt)
    ),
    activity,
    difficulties,
    solveTrend,
  };
}
