"use client";

import Link from "next/link";
import { useAnalytics } from "@/hooks/use-analytics";
import { formatDuration } from "@/lib/format";
import { StatTile } from "./stat-tile";
import { TopicBars } from "./topic-bars";
import { ActivityStrip } from "./activity-strip";
import { SolveTrend } from "./solve-trend";
import { DifficultyBars } from "./difficulty-bars";

export function Dashboard() {
  const { data } = useAnalytics();

  if (data.totalAttempts === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="opacity-70">
          Nothing to show yet — finish an attempt and your stats appear here.
        </p>
        <Link
          href="/problems"
          className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Go solve something
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Problems solved"
          value={String(data.problemsSolved)}
          hint={`of ${data.problemsAttempted} attempted`}
        />
        <StatTile
          label="Solve rate"
          value={`${Math.round(data.solveRate * 100)}%`}
          hint={`${data.totalAttempts} finished attempts`}
        />
        <StatTile
          label="Time practised"
          value={formatDuration(data.totalTimeMs)}
          hint="across all attempts"
        />
        <StatTile
          label="Avg time to solve"
          value={data.avgSolveMs === null ? "—" : formatDuration(data.avgSolveMs)}
          hint="solved attempts only"
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Time to solve</h2>
        <SolveTrend points={data.solveTrend} />
      </section>

      <div className="grid gap-10 sm:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Topics</h2>
          <TopicBars topics={data.topics} lowDataTopics={data.lowDataTopics} />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">By difficulty</h2>
          <DifficultyBars difficulties={data.difficulties} />
        </section>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Last 14 days</h2>
        <ActivityStrip activity={data.activity} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Solved problems</h2>
        {data.solvedProblems.length === 0 ? (
          <p className="text-sm text-[#898781]">Nothing solved yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 dark:border-white/10">
                <tr className="text-[#898781]">
                  <th className="py-2 pr-4 font-medium">Problem</th>
                  <th className="py-2 pr-4 font-medium">Difficulty</th>
                  <th className="py-2 pr-4 font-medium">Times solved</th>
                  <th className="py-2 pr-4 font-medium">Best time</th>
                  <th className="py-2 font-medium">Last solved</th>
                </tr>
              </thead>
              <tbody>
                {data.solvedProblems.map((problem) => (
                  <tr
                    key={problem.id}
                    className="border-b border-black/5 dark:border-white/10"
                  >
                    <td className="py-2 pr-4">
                      <Link
                        href={`/problems/${problem.id}`}
                        className="underline underline-offset-4"
                      >
                        {problem.title}
                      </Link>
                      <span className="ml-2 text-xs text-[#898781]">
                        {problem.source.toLowerCase()}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      {problem.difficulty?.toLowerCase() ?? "—"}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">
                      {problem.solvedCount}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">
                      {formatDuration(problem.bestMs)}
                    </td>
                    <td className="py-2 tabular-nums">
                      {new Date(problem.lastSolvedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
