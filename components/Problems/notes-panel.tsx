"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { useAddNote, useProblemNotes } from "@/hooks/use-notes";
import { NoteCard } from "@/components/Notes/note-card";
import { MAX_NOTE_LENGTH } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/surface";
import { Field, inputStyles } from "@/components/ui/field";
import { ErrorNote } from "@/components/ui/feedback";

export function NotesPanel({ problemId }: { problemId: string }) {
  const { data: notes } = useProblemNotes(problemId);
  const [draft, setDraft] = useState("");

  const add = useAddNote(problemId);

  const submit = () => {
    if (!draft.trim()) return;
    add.mutate(draft, { onSuccess: () => setDraft("") });
  };

  const remaining = MAX_NOTE_LENGTH - draft.length;

  return (
    <Section title="Notes">
      <div className="flex flex-col gap-3">
        <Field
          label="New note"
          htmlFor="note-draft"
          hint="Plural on purpose. Add one per insight rather than editing a single wall of text."
        >
          <textarea
            id="note-draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MAX_NOTE_LENGTH}
            rows={3}
            placeholder="What tripped you up? What was the trick?"
            className={inputStyles}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={submit} disabled={!draft.trim() || add.isPending}>
            <Plus size={16} weight="bold" />
            {add.isPending ? "Saving" : "Add note"}
          </Button>

          {/* Only appears once it is actually worth knowing about. */}
          {remaining < 500 && (
            <span data-numeric className="text-xs text-muted">
              {remaining} characters left
            </span>
          )}
        </div>

        {add.isError && <ErrorNote>{add.error.message}</ErrorNote>}
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted">
          Nothing written down for this problem yet.
        </p>
      ) : (
        // Cards, not a divided list: a note should read as an object you wrote,
        // not as more page copy. Edit and delete live on the card, shared with
        // the account-wide notes page so the two cannot drift apart.
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id}>
              <NoteCard note={note} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
