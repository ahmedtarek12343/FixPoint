"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ListChecks, FunnelSimple } from "@phosphor-icons/react";
import { useProblems } from "@/hooks/use-problems";
import { formatDuration } from "@/lib/format";
import { Pagination } from "@/components/utils/pagination";
import { ProblemFilterBar } from "./problem-filters";
import { DifficultyMeter } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import type { ProblemFilters } from "@/lib/actions/problems";

const PLATFORM_LABELS: Record<string, string> = {
  LEETCODE: "leetcode",
  CODEFORCES: "codeforces",
};

export function ProblemList() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ProblemFilters>({});
  const [isPending, startTransition] = useTransition();
  const { data } = useProblems(page, filters);

  // Without the transition, changing the page or a filter changes the query
  // key, the new key has no data, and useSuspenseQuery drops the whole table to
  // the Suspense fallback. Inside a transition React keeps the old rows up
  // until the next result is ready.
  const changePage = (next: number) => startTransition(() => setPage(next));

  const changeFilters = (next: ProblemFilters) =>
    startTransition(() => {
      setFilters(next);
      // Page 3 of the old result set is rarely page 3 of the new one, and an
      // empty page reads as "no results" when there are plenty.
      setPage(1);
    });

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <ProblemFilterBar filters={filters} onChange={changeFilters} />

      {data.items.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={<FunnelSimple size={22} />}
            title="Nothing matches"
            body="No problem in your library fits all of those filters at once. Try widening one of them."
            action={
              <Button variant="secondary" onClick={() => changeFilters({})}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<ListChecks size={22} />}
            title="Your library is empty"
            body="Paste a LeetCode or Codeforces link in the box above. The title, difficulty and topics come across on their own."
          />
        )
      ) : (
        <div
          className={`flex flex-col gap-6 transition-opacity duration-200 ${
            isPending ? "opacity-60" : ""
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th scope="col" className="py-2.5 pr-4 font-medium">
                    Problem
                  </th>
                  <th scope="col" className="py-2.5 pr-4 font-medium">
                    Rated
                  </th>
                  <th scope="col" className="py-2.5 pr-4 font-medium">
                    You
                  </th>
                  <th scope="col" className="py-2.5 pr-4 text-right font-medium">
                    Attempts
                  </th>
                  <th scope="col" className="py-2.5 pr-4 text-right font-medium">
                    Best time
                  </th>
                  <th scope="col" className="py-2.5 text-right font-medium">
                    Last tried
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((problem) => (
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
                        {PLATFORM_LABELS[problem.platform] ?? problem.platform}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <DifficultyMeter difficulty={problem.difficulty} />
                    </td>
                    <td className="py-3 pr-4">
                      {problem.yourDifficulty ? (
                        <DifficultyMeter difficulty={problem.yourDifficulty} />
                      ) : (
                        <span className="text-sm text-muted">not rated</span>
                      )}
                    </td>
                    <td data-numeric className="py-3 pr-4 text-right text-muted">
                      {problem.attemptCount}
                      {problem.solvedCount > 0 && (
                        <span className="text-accent">
                          {" "}
                          ({problem.solvedCount} solved)
                        </span>
                      )}
                    </td>
                    <td
                      data-numeric
                      className={`py-3 pr-4 text-right font-mono ${
                        problem.bestMs === null ? "text-muted" : "text-accent"
                      }`}
                    >
                      {problem.bestMs === null
                        ? "not yet"
                        : formatDuration(problem.bestMs)}
                    </td>
                    <td data-numeric className="py-3 text-right text-muted">
                      {problem.lastAttemptAt
                        ? new Date(problem.lastAttemptAt).toLocaleDateString()
                        : "never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={data.page}
            pageCount={data.pageCount}
            total={data.total}
            isPending={isPending}
            onPageChange={changePage}
          />
        </div>
      )}
    </div>
  );
}
