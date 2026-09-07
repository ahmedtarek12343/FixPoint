import { prisma } from "@/lib/prisma";
import { AttemptStatus } from "@/generated/prisma/enums";
import { formatDuration } from "@/lib/format";
import { toCsv, type CsvColumn } from "@/lib/csv";

/**
 * Spreadsheet exports.
 *
 * Every duration is written twice: once in seconds as a real number, and once
 * formatted as h:mm:ss. The number is what makes the file useful — you can sum,
 * average and pivot on it — while the formatted string is what a human reads.
 * A single "1:23" text column would look right and be useless to Excel.
 */

const STATUS_LABELS: Record<AttemptStatus, string> = {
  IN_PROGRESS: "In progress",
  SOLVED: "Solved",
  GIVEN_UP: "Gave up",
  AUTO_GIVEN_UP: "Timed out",
};

/**
 * Floors rather than rounds, to match formatDuration. Rounding here made the
 * two columns disagree on the same row — 15716ms rendered as "16" beside
 * "0:15", which reads as a bug.
 */
const seconds = (ms: number | null) =>
  ms === null ? null : Math.floor(ms / 1000);

type ProblemRow = {
  title: string;
  source: string;
  difficulty: string | null;
  url: string;
  tags: string;
  attempts: number;
  solved: number;
  bestMs: number | null;
  averageSolveMs: number | null;
  lastAttemptAt: Date | null;
};

export async function exportProblemsCsv(userId: string): Promise<string> {
  const problems = await prisma.problem.findMany({
    where: { inLibraries: { some: { userId } } },
    orderBy: { createdAt: "desc" },
    include: {
      problemTags: { include: { tag: true } },
      attempts: {
        where: { userId },
        select: { status: true, durationMs: true, startedAt: true },
      },
    },
  });

  const rows: ProblemRow[] = problems.map((problem) => {
    const solved = problem.attempts.filter(
      (attempt) => attempt.status === AttemptStatus.SOLVED
    );
    const solvedDurations = solved
      .map((attempt) => attempt.durationMs)
      .filter((ms): ms is number => ms !== null);

    return {
      title: problem.title,
      source: problem.source,
      difficulty: problem.difficulty,
      url: problem.url,
      tags: problem.problemTags.map((pt) => pt.tag.name).join("; "),
      attempts: problem.attempts.length,
      solved: solved.length,
      bestMs: solvedDurations.length ? Math.min(...solvedDurations) : null,
      averageSolveMs: solvedDurations.length
        ? Math.round(
            solvedDurations.reduce((sum, ms) => sum + ms, 0) /
              solvedDurations.length
          )
        : null,
      lastAttemptAt: problem.attempts.reduce<Date | null>(
        (latest, attempt) =>
          !latest || attempt.startedAt > latest ? attempt.startedAt : latest,
        null
      ),
    };
  });

  const columns: CsvColumn<ProblemRow>[] = [
    { header: "Problem", value: (row) => row.title },
    { header: "Source", value: (row) => row.source },
    { header: "Difficulty", value: (row) => row.difficulty ?? "Unrated" },
    { header: "Topics", value: (row) => row.tags },
    { header: "Attempts", value: (row) => row.attempts },
    { header: "Solved", value: (row) => row.solved },
    { header: "Best time (s)", value: (row) => seconds(row.bestMs) },
    {
      header: "Best time",
      value: (row) => (row.bestMs === null ? "" : formatDuration(row.bestMs)),
    },
    { header: "Avg solve (s)", value: (row) => seconds(row.averageSolveMs) },
    {
      header: "Avg solve",
      value: (row) =>
        row.averageSolveMs === null ? "" : formatDuration(row.averageSolveMs),
    },
    {
      header: "Last attempt",
      value: (row) => row.lastAttemptAt?.toISOString() ?? "",
    },
    { header: "URL", value: (row) => row.url },
  ];

  return toCsv(rows, columns);
}

type AttemptRow = {
  title: string;
  source: string;
  difficulty: string | null;
  status: AttemptStatus;
  startedAt: Date;
  endedAt: Date | null;
  durationMs: number | null;
  timeLimitMs: number | null;
};

/** One row per attempt — the shape you want for pivot tables and charts. */
export async function exportAttemptsCsv(userId: string): Promise<string> {
  const attempts = await prisma.attempt.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    include: { problem: { select: { title: true, source: true, difficulty: true } } },
  });

  const rows: AttemptRow[] = attempts.map((attempt) => ({
    title: attempt.problem.title,
    source: attempt.problem.source,
    difficulty: attempt.problem.difficulty,
    status: attempt.status,
    startedAt: attempt.startedAt,
    endedAt: attempt.endedAt,
    durationMs: attempt.durationMs,
    timeLimitMs: attempt.timeLimitMs,
  }));

  const columns: CsvColumn<AttemptRow>[] = [
    { header: "Problem", value: (row) => row.title },
    { header: "Source", value: (row) => row.source },
    { header: "Difficulty", value: (row) => row.difficulty ?? "Unrated" },
    { header: "Result", value: (row) => STATUS_LABELS[row.status] },
    { header: "Started", value: (row) => row.startedAt.toISOString() },
    { header: "Ended", value: (row) => row.endedAt?.toISOString() ?? "" },
    { header: "Duration (s)", value: (row) => seconds(row.durationMs) },
    {
      header: "Duration",
      value: (row) =>
        row.durationMs === null ? "" : formatDuration(row.durationMs),
    },
    { header: "Time limit (s)", value: (row) => seconds(row.timeLimitMs) },
  ];

  return toCsv(rows, columns);
}
