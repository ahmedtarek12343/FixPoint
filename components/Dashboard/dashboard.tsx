"use client";

import Link from "next/link";
import { ChartLineUp, ArrowRight } from "@phosphor-icons/react";
import { useAnalytics } from "@/hooks/use-analytics";
import { formatDuration } from "@/lib/format";
import { StatRow, StatTile } from "./stat-tile";
import { TopicBars } from "./topic-bars";
import { ActivityStrip } from "./activity-strip";
import { SolveTrend } from "./solve-trend";
import { DifficultyBars } from "./difficulty-bars";
import { RatingComparisonBars } from "./rating-comparison";
import { Section } from "@/components/ui/surface";
import { EmptyState } from "@/components/ui/feedback";
import { DifficultyMeter } from "@/components/ui/chip";
import { buttonStyles } from "@/components/ui/button";

export function Dashboard() {
  const { data } = useAnalytics();

  if (data.totalAttempts === 0) {
    return (
      <EmptyState
        icon={<ChartLineUp size={22} />}
        title="Nothing measured yet"
        body="Finish one attempt and this fills in: your solve rate, your fastest times, and which topics you actually get through."
        action={
          <Link href="/problems" className={buttonStyles()}>
            Go solve something
            <ArrowRight size={16} weight="bold" />
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-14">
      <StatRow>
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
          label="Average solve"
          value={
            data.avgSolveMs === null ? "None yet" : formatDuration(data.avgSolveMs)
          }
          hint="solved attempts only"
        />
      </StatRow>

      <Section
        title="Time to solve"
        description="Your last solved attempts, oldest on the left."
      >
        <SolveTrend points={data.solveTrend} />
      </Section>

      <div className="grid gap-14 lg:grid-cols-2 lg:gap-12">
        <Section
          title="Topics"
          description="Ranked by how often you finish, not how often you start."
        >
          <TopicBars
            topics={data.topics}
            lowDataTopics={data.lowDataTopics}
            untaggedProblems={data.untaggedProblems}
          />
        </Section>

        <Section title="By difficulty">
          <DifficultyBars difficulties={data.difficulties} />
        </Section>
      </div>

      <Section
        title="Your rating against theirs"
        description="How hard problems felt to you, next to what the platform calls them. Custom problems are left out: they only have your rating."
      >
        <RatingComparisonBars
          comparison={data.ratingComparison}
          unratedSolved={data.unratedSolved}
        />
      </Section>

      <Section title="Last 14 days">
        <ActivityStrip activity={data.activity} />
      </Section>

      <Section title="Solved problems">
        {data.solvedProblems.length === 0 ? (
          <p className="text-sm text-muted">Nothing solved yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[38rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th scope="col" className="py-2.5 pr-4 font-medium">
                    Problem
                  </th>
                  <th scope="col" className="py-2.5 pr-4 font-medium">
                    Difficulty
                  </th>
                  <th scope="col" className="py-2.5 pr-4 text-right font-medium">
                    Solved
                  </th>
                  <th scope="col" className="py-2.5 pr-4 text-right font-medium">
                    Best
                  </th>
                  <th scope="col" className="py-2.5 text-right font-medium">
                    Last
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.solvedProblems.map((problem) => (
                  <tr
                    key={problem.id}
                    className="transition-colors hover:bg-surface"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/problems/${problem.id}`}
                        className="font-medium transition-colors hover:text-accent"
                      >
                        {problem.title}
                      </Link>
                      <span className="ml-2 text-xs text-muted">
                        {problem.source.toLowerCase()}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <DifficultyMeter difficulty={problem.difficulty} />
                    </td>
                    <td data-numeric className="py-3 pr-4 text-right">
                      {problem.solvedCount}
                    </td>
                    <td
                      data-numeric
                      className="py-3 pr-4 text-right font-mono text-accent"
                    >
                      {formatDuration(problem.bestMs)}
                    </td>
                    <td data-numeric className="py-3 text-right text-muted">
                      {new Date(problem.lastSolvedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
