"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useDuelHistory } from "@/hooks/use-duels";
import { Pagination } from "@/components/utils/pagination";

const STATUS_LABELS = {
  PENDING: "Waiting",
  ACTIVE: "In progress",
  FINISHED: "Finished",
  CANCELLED: "Cancelled",
} as const;

function outcome(status: string, yourRank: number | null) {
  if (status !== "FINISHED") return STATUS_LABELS[status as keyof typeof STATUS_LABELS];
  if (yourRank === 1) return "Won";
  return yourRank ? `#${yourRank}` : "Didn't finish";
}

export function DuelHistory() {
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const { data } = useDuelHistory(page);

  const changePage = (next: number) => startTransition(() => setPage(next));

  if (data.items.length === 0) {
    return <p className="text-sm opacity-70">No duels yet.</p>;
  }

  return (
    <div className={`flex flex-col gap-4 ${isPending ? "opacity-60" : ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 dark:border-white/15">
            <tr className="opacity-60">
              <th className="py-2 pr-4 font-medium">Problem</th>
              <th className="py-2 pr-4 font-medium">Opponent</th>
              <th className="py-2 pr-4 font-medium">Result</th>
              <th className="py-2 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((duel) => (
              <tr
                key={duel.id}
                className="border-b border-black/5 dark:border-white/10"
              >
                <td className="py-2 pr-4">
                  <Link
                    href={`/duels/${duel.id}`}
                    className="underline underline-offset-4"
                  >
                    {duel.problemTitle}
                  </Link>
                </td>
                <td className="py-2 pr-4">
                  {duel.opponents.length === 0
                    ? "—"
                    : duel.opponents.map((o) => o.name).join(", ")}
                </td>
                <td className="py-2 pr-4">
                  {outcome(duel.status, duel.yourRank)}
                </td>
                <td className="py-2 tabular-nums opacity-70">
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
