"use client";

import { useState, useTransition } from "react";
import { NotePencil } from "@phosphor-icons/react";
import { useUserNotes } from "@/hooks/use-notes";
import { Pagination } from "@/components/utils/pagination";
import { EmptyState } from "@/components/ui/feedback";
import { NoteCard } from "./note-card";

export function NotesList() {
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const { data } = useUserNotes(page);

  const changePage = (next: number) => startTransition(() => setPage(next));

  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={<NotePencil size={22} />}
        title="Nothing written down yet"
        body="Open a problem and write down what tripped you up while it is still fresh. It will be waiting the next time you come back to it."
      />
    );
  }

  return (
    <div
      className={`flex flex-col gap-6 transition-opacity duration-200 ${
        isPending ? "opacity-60" : ""
      }`}
    >
      {/* Cards rather than a divided list. A note is something the user wrote,
          and it should look like an object on the page rather than more body
          copy. Editing and deleting live on the card itself, so this page is a
          real view of your notes and not a read-only mirror of them. */}
      <ul className="flex flex-col gap-3">
        {data.items.map((note) => (
          <li key={note.id}>
            <NoteCard note={note} problemHref={`/problems/${note.problemId}`} />
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
