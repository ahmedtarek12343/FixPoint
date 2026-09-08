"use client";

import { useState } from "react";
import Link from "next/link";
import { PencilSimple } from "@phosphor-icons/react";
import { useDeleteSolution, useUpdateSolution } from "@/hooks/use-solutions";
import { LANGUAGES, MAX_SOLUTION_LENGTH } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { inputStyles } from "@/components/ui/field";
import { Tag } from "@/components/ui/chip";
import type { SolutionItem } from "@/lib/actions/solutions";

/**
 * One saved solution, with edit and delete.
 *
 * Shared by the problem page and the account-wide list for the same reason the
 * note card is: two copies of an edit form drift, and this one has a language
 * select that has to stay in step with the create form.
 *
 * The code block keeps its own horizontal scroll so a long line scrolls inside
 * the card rather than stretching the page, which is the failure mode a <pre>
 * has by default.
 */
export function SolutionCard({
  solution,
  problemHref,
}: {
  solution: SolutionItem;
  problemHref?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState(solution.code);
  const [language, setLanguage] = useState(solution.language);

  const update = useUpdateSolution();
  const remove = useDeleteSolution();

  const cancel = () => {
    setCode(solution.code);
    setLanguage(solution.language);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-3 rounded-panel border border-border bg-surface p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-3">
        {problemHref ? (
          <Link
            href={problemHref}
            className="text-sm font-medium transition-colors hover:text-accent"
          >
            {solution.problemTitle}
          </Link>
        ) : null}

        {editing ? (
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            aria-label="Language"
            className={`${inputStyles} w-auto py-1 text-xs`}
          >
            {LANGUAGES.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        ) : (
          <Tag>{solution.language}</Tag>
        )}

        <span data-numeric className="ml-auto text-xs text-muted">
          {new Date(solution.createdAt).toLocaleString()}
        </span>
      </div>

      {editing ? (
        <>
          <textarea
            value={code}
            onChange={(event) => setCode(event.target.value)}
            maxLength={MAX_SOLUTION_LENGTH}
            rows={10}
            spellCheck={false}
            aria-label="Edit solution"
            className={`${inputStyles} font-mono`}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={update.isPending || !code.trim()}
              onClick={() =>
                update.mutate(
                  { id: solution.id, code, language },
                  { onSuccess: () => setEditing(false) }
                )
              }
            >
              {update.isPending ? "Saving" : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <pre className="overflow-x-auto rounded-control border border-border bg-surface-sunken p-4 text-xs">
            <code className="font-mono">{solution.code}</code>
          </pre>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(true)}
            >
              <PencilSimple size={14} />
              Edit
            </Button>
            <ConfirmButton
              disabled={remove.isPending}
              onConfirm={() => remove.mutate(solution.id)}
            />
          </div>
        </>
      )}
    </div>
  );
}
