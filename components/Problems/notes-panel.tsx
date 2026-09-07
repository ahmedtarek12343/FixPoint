"use client";

import { useState } from "react";
import {
  useAddNote,
  useDeleteNote,
  useProblemNotes,
  useUpdateNote,
} from "@/hooks/use-notes";
import { MAX_NOTE_LENGTH } from "@/lib/constants";

const textareaClass =
  "w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20";

export function NotesPanel({ problemId }: { problemId: string }) {
  const { data: notes } = useProblemNotes(problemId);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const add = useAddNote(problemId);
  const update = useUpdateNote();
  const remove = useDeleteNote();

  const submit = () => {
    if (!draft.trim()) return;
    add.mutate(draft, { onSuccess: () => setDraft("") });
  };

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Notes</h2>

      <div className="flex flex-col gap-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={MAX_NOTE_LENGTH}
          rows={3}
          placeholder="What tripped you up? What was the trick?"
          className={textareaClass}
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim() || add.isPending}
            className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {add.isPending ? "Saving…" : "Add note"}
          </button>
          {add.isError ? (
            <span className="text-sm text-red-600 dark:text-red-400">
              {add.error.message}
            </span>
          ) : null}
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm opacity-70">No notes on this problem yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-black/10 p-4 dark:border-white/10"
            >
              {editingId === note.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editDraft}
                    onChange={(event) => setEditDraft(event.target.value)}
                    maxLength={MAX_NOTE_LENGTH}
                    rows={3}
                    className={textareaClass}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={update.isPending}
                      onClick={() =>
                        update.mutate(
                          { id: note.id, content: editDraft },
                          { onSuccess: () => setEditingId(null) }
                        )
                      }
                      className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-md px-3 py-1.5 text-sm opacity-70 hover:opacity-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* whitespace-pre-wrap so line breaks the user typed survive */}
                  <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                  <div className="flex items-center gap-3 text-xs opacity-60">
                    <span>{new Date(note.createdAt).toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(note.id);
                        setEditDraft(note.content);
                      }}
                      className="underline underline-offset-4 hover:opacity-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(note.id)}
                      className="underline underline-offset-4 hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
