"use client";

import { useState, useTransition } from "react";
import { Code } from "@phosphor-icons/react";
import { useUserSolutions } from "@/hooks/use-solutions";
import { Pagination } from "@/components/utils/pagination";
import { EmptyState } from "@/components/ui/feedback";
import { SolutionCard } from "./solution-card";

export function SolutionsList() {
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const { data } = useUserSolutions(page);

  const changePage = (next: number) => startTransition(() => setPage(next));

  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={<Code size={22} />}
        title="No solutions saved"
        body="Save the code that actually worked, in the language you wrote it in. It is filed against the problem, so you can compare it with the next attempt."
      />
    );
  }

  return (
    <div
      className={`flex flex-col gap-6 transition-opacity duration-200 ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <ul className="flex flex-col gap-3">
        {data.items.map((solution) => (
          <li key={solution.id}>
            <SolutionCard
              solution={solution}
              problemHref={`/problems/${solution.problemId}`}
            />
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
