"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useUserSolutions } from "@/hooks/use-solutions";
import { Pagination } from "@/components/utils/pagination";

export function SolutionsList() {
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const { data } = useUserSolutions(page);

  const changePage = (next: number) => startTransition(() => setPage(next));

  if (data.items.length === 0) {
    return (
      <p className="opacity-70">
        No solutions saved yet — save the code that worked and it shows up here.
      </p>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${isPending ? "opacity-60" : ""}`}>
      <ul className="flex flex-col gap-3">
        {data.items.map((solution) => (
          <li
            key={solution.id}
            className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 dark:border-white/10"
          >
            <div className="flex items-center justify-between gap-3 text-xs opacity-60">
              <span>
                <Link
                  href={`/problems/${solution.problemId}`}
                  className="underline underline-offset-4"
                >
                  {solution.problemTitle}
                </Link>
                <span className="ml-2 rounded-full border border-black/10 px-2 py-0.5 dark:border-white/20">
                  {solution.language}
                </span>
              </span>
              <span>{new Date(solution.createdAt).toLocaleDateString()}</span>
            </div>

            <pre className="overflow-x-auto rounded-md bg-black/5 p-3 text-xs dark:bg-white/10">
              <code>{solution.code}</code>
            </pre>
          </li>
        ))}
      </ul>

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
