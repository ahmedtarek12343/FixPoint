"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { PencilSimple, Quotes } from "@phosphor-icons/react";
import { useDeleteNote, useUpdateNote } from "@/hooks/use-notes";
import { MAX_NOTE_LENGTH } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { inputStyles } from "@/components/ui/field";
import type { NoteItem } from "@/lib/actions/notes";

gsap.registerPlugin(useGSAP);

/**
 * One note, and everything you can do to it.
 *
 * Notes used to be plain paragraphs separated by a hairline, which made them
 * read as page copy rather than as something the user wrote. They are now
 * given a surface, a quote mark and an accent rule down the left edge, so a
 * page of notes scans as a stack of distinct objects instead of one long
 * column of text. The rule is the cheapest signal available: it costs one
 * border and works in every theme without a second colour.
 *
 * The same component serves the problem page and the account-wide list, so the
 * edit and delete affordances cannot drift between them. `problemHref` is what
 * distinguishes the two: on a problem page you already know which problem it
 * belongs to, so the link is left off.
 */
export function NoteCard({
  note,
  problemHref,
}: {
  note: NoteItem;
  problemHref?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const root = useRef<HTMLDivElement>(null);

  const update = useUpdateNote();
  const remove = useDeleteNote();

  // A short lift when the editor opens, so the card that is now interactive is
  // visibly the one you clicked.
  useGSAP(
    () => {
      if (!editing || !root.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(root.current, {
        scale: 0.995,
        duration: 0.3,
        ease: "power2.out",
        clearProps: "transform",
      });
    },
    { dependencies: [editing], scope: root }
  );

  const edited = note.updatedAt !== note.createdAt;

  return (
    <div
      ref={root}
      className="relative overflow-hidden rounded-panel border border-border bg-surface pl-1 shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      {/* The accent rule. Absolute rather than a left border so it keeps the
          panel's rounded corners instead of squaring them off. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 bg-accent"
      />

      <div className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Quotes
            size={16}
            weight="fill"
            aria-hidden="true"
            className="text-accent"
          />

          {problemHref ? (
            <Link
              href={problemHref}
              className="text-sm font-medium transition-colors hover:text-accent"
            >
              {note.problemTitle}
            </Link>
          ) : null}

          <span data-numeric className="ml-auto text-xs text-muted">
            {new Date(note.createdAt).toLocaleString()}
            {edited && " · edited"}
          </span>
        </div>

        {editing ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={MAX_NOTE_LENGTH}
              rows={4}
              aria-label="Edit note"
              className={inputStyles}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={update.isPending || !draft.trim()}
                onClick={() =>
                  update.mutate(
                    { id: note.id, content: draft },
                    { onSuccess: () => setEditing(false) }
                  )
                }
              >
                {update.isPending ? "Saving" : "Save"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(note.content);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* whitespace-pre-wrap so line breaks the user typed survive. */}
            <p className="max-w-[68ch] text-sm whitespace-pre-wrap">
              {note.content}
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(note.content);
                  setEditing(true);
                }}
              >
                <PencilSimple size={14} />
                Edit
              </Button>
              <ConfirmButton
                disabled={remove.isPending}
                onConfirm={() => remove.mutate(note.id)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
