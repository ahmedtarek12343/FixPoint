"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useProblems } from "@/hooks/use-problems";
import { formatDuration } from "@/lib/format";
import { Pagination } from "@/components/utils/pagination";

export function ProblemList() {
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const { data } = useProblems(page);

  // Without the transition, changing the page changes the query key, the new
  // key has no data, and useSuspenseQuery drops the whole table to the Suspense
  // fallback. Inside a transition React keeps the old rows up until the next
  // page is ready.
  const changePage = (next: number) => startTransition(() => setPage(next));

  if (data.items.length === 0) {
    return (
      <p className="opacity-70">
        Nothing here yet — paste a LeetCode or Codeforces link above.
      </p>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${isPending ? "opacity-60" : ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 dark:border-white/15">
            <tr className="opacity-60">
              <th className="py-2 pr-4 font-medium">Problem</th>
              <th className="py-2 pr-4 font-medium">Difficulty</th>
              <th className="py-2 pr-4 font-medium">Attempts</th>
              <th className="py-2 pr-4 font-medium">Solved</th>
              <th className="py-2 font-medium">Best time</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((problem) => (
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
                  <span className="ml-2 text-xs opacity-50">
                    {problem.source.toLowerCase()}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  {problem.difficulty?.toLowerCase() ?? "—"}
                </td>
                <td className="py-2 pr-4 tabular-nums">{problem.attemptCount}</td>
                <td className="py-2 pr-4 tabular-nums">{problem.solvedCount}</td>
                <td className="py-2 font-mono tabular-nums">
                  {problem.bestMs === null ? "—" : formatDuration(problem.bestMs)}
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
  );
}
