"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useUserNotes } from "@/hooks/use-notes";
import { Pagination } from "@/components/utils/pagination";

export function NotesList() {
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const { data } = useUserNotes(page);

  const changePage = (next: number) => startTransition(() => setPage(next));

  if (data.items.length === 0) {
    return (
      <p className="opacity-70">
        No notes yet — open a problem and write down what tripped you up.
      </p>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${isPending ? "opacity-60" : ""}`}>
      <ul className="flex flex-col gap-3">
        {data.items.map((note) => (
          <li
            key={note.id}
            className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 dark:border-white/10"
          >
            <div className="flex items-center justify-between gap-3 text-xs opacity-60">
              <Link
                href={`/problems/${note.problemId}`}
                className="underline underline-offset-4"
              >
                {note.problemTitle}
              </Link>
              <span>{new Date(note.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{note.content}</p>
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
