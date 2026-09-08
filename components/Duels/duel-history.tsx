"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sword } from "@phosphor-icons/react";
import { useDuelHistory } from "@/hooks/use-duels";
import { Pagination } from "@/components/utils/pagination";
import { EmptyState } from "@/components/ui/feedback";

const STATUS_LABELS = {
  PENDING: "Waiting",
  ACTIVE: "In progress",
  FINISHED: "Finished",
  CANCELLED: "Cancelled",
} as const;

function outcome(status: string, yourRank: number | null) {
  if (status !== "FINISHED") {
    return STATUS_LABELS[status as keyof typeof STATUS_LABELS];
  }
  if (yourRank === 1) return "Won";
  return yourRank ? `Position ${yourRank}` : "Did not finish";
}

export function DuelHistory() {
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const { data } = useDuelHistory(page);

  const changePage = (next: number) => startTransition(() => setPage(next));

  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={<Sword size={22} />}
        title="No duels yet"
        body="Host one above and send the code to someone. Both clocks start on the same second, so the times are comparable."
      />
    );
  }

  return (
    <div
      className={`flex flex-col gap-6 transition-opacity duration-200 ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th scope="col" className="py-2.5 pr-4 font-medium">
                Problem
              </th>
              <th scope="col" className="py-2.5 pr-4 font-medium">
                Opponent
              </th>
              <th scope="col" className="py-2.5 pr-4 font-medium">
                Result
              </th>
              <th scope="col" className="py-2.5 text-right font-medium">
                When
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.items.map((duel) => (
              <tr key={duel.id} className="transition-colors hover:bg-surface">
                <td className="py-3 pr-4">
                  <Link
                    href={`/duels/${duel.id}`}
                    className="font-medium transition-colors hover:text-accent"
                  >
                    {duel.problemTitle}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-muted">
                  {duel.opponents.length === 0
                    ? "nobody joined"
                    : duel.opponents.map((opponent) => opponent.name).join(", ")}
                </td>
                <td
                  className={`py-3 pr-4 ${
                    duel.yourRank === 1 ? "font-medium text-accent" : "text-muted"
                  }`}
                >
                  {outcome(duel.status, duel.yourRank)}
                </td>
                <td data-numeric className="py-3 text-right text-muted">
                  {new Date(duel.createdAt).toLocaleDateString()}
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
