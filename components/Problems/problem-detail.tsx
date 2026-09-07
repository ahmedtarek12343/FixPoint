"use client";

import Link from "next/link";
import { useProblemDetail } from "@/hooks/use-attempts";
import { formatDuration } from "@/lib/format";
import { AttemptRunner } from "./attempt-runner";
import { NotesPanel } from "./notes-panel";
import { SolutionsPanel } from "./solutions-panel";
import { WhiteboardPanel } from "./whiteboard-panel";
import { SnapshotGallery } from "./snapshot-gallery";
import type { AttemptStatus } from "@/generated/prisma/enums";

const STATUS_LABELS: Record<AttemptStatus, string> = {
  IN_PROGRESS: "In progress",
  SOLVED: "Solved",
  GIVEN_UP: "Gave up",
  AUTO_GIVEN_UP: "Timed out",
};

export function ProblemDetail({ problemId }: { problemId: string }) {
  const { data: problem } = useProblemDetail(problemId);

  // The server component already 404s on a missing problem; this only covers
  // the case where it's deleted while the page is open.
  if (!problem) {
    return <p className="opacity-70">This problem no longer exists.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/problems"
          className="text-sm underline underline-offset-4 opacity-60 hover:opacity-100"
        >
          ← All problems
        </Link>
        <h1 className="text-3xl font-semibold">{problem.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm opacity-70">
          <span>{problem.source.toLowerCase()}</span>
          {problem.difficulty ? (
            <>
              <span>·</span>
              <span>{problem.difficulty.toLowerCase()}</span>
            </>
          ) : null}
          {problem.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-black/10 px-2 py-0.5 text-xs dark:border-white/20"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <AttemptRunner
        problemId={problem.id}
        problemUrl={problem.url}
        activeAttempt={problem.activeAttempt}
      />

      <section className="grid grid-cols-3 gap-4">
        <Stat
          label="Best time"
          value={problem.bestMs === null ? "—" : formatDuration(problem.bestMs)}
        />
        <Stat label="Attempts" value={String(problem.attempts.length)} />
        <Stat label="Solved" value={String(problem.solvedCount)} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">History</h2>
        {problem.attempts.length === 0 ? (
          <p className="text-sm opacity-70">No attempts yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 dark:border-white/15">
              <tr className="opacity-60">
                <th className="py-2 pr-4 font-medium">Started</th>
                <th className="py-2 pr-4 font-medium">Result</th>
                <th className="py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {problem.attempts.map((attempt) => (
                <tr
                  key={attempt.id}
                  className="border-b border-black/5 dark:border-white/10"
                >
                  <td className="py-2 pr-4">
                    {new Date(attempt.startedAt).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">{STATUS_LABELS[attempt.status]}</td>
                  <td className="py-2 font-mono tabular-nums">
                    {attempt.durationMs === null
                      ? "—"
                      : formatDuration(attempt.durationMs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <WhiteboardPanel problemId={problem.id} />
      <SnapshotGallery problemId={problem.id} />
      <NotesPanel problemId={problem.id} />
      <SolutionsPanel problemId={problem.id} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
      <div className="text-xs uppercase tracking-wide opacity-60">{label}</div>
      <div className="mt-1 font-mono text-2xl tabular-nums">{value}</div>
    </div>
  );
}
