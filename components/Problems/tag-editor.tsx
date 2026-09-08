"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { X, Plus } from "@phosphor-icons/react";

gsap.registerPlugin(useGSAP);

/**
 * Chip input for a problem's topics.
 *
 * A comma-separated text field was the old approach and it was wrong for this
 * job: you cannot see what you have already added, a stray comma silently
 * creates an empty tag, and there is no way to remove one thing without
 * retyping the line. Chips make the current set visible and individually
 * removable, which matters because these values feed the topic analytics.
 *
 * Enter, comma and Tab all commit. Backspace on an empty field removes the last
 * chip, which is the behaviour anyone who has used a tag field expects.
 */

/** The topics LeetCode and Codeforces use most, offered as one-tap chips so the
 *  common case needs no typing at all. */
const SUGGESTIONS = [
  "arrays",
  "two pointers",
  "hash map",
  "binary search",
  "sorting",
  "dp",
  "greedy",
  "graphs",
  "trees",
  "recursion",
  "math",
  "strings",
];

export function TagEditor({
  value,
  onChange,
  id = "tag-editor",
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  id?: string;
}) {
  const [draft, setDraft] = useState("");
  const list = useRef<HTMLDivElement>(null);

  const add = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (!tag || value.includes(tag) || value.length >= 12) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  const remove = (tag: string) => onChange(value.filter((entry) => entry !== tag));

  // Animate only the chip that just arrived. Re-running the whole list on every
  // change would replay the entrance for chips already sitting there.
  useGSAP(
    () => {
      const chips = list.current?.querySelectorAll("[data-chip]");
      const latest = chips?.[chips.length - 1];
      if (!latest) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(latest, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: "back.out(2)",
        clearProps: "transform",
      });
    },
    { dependencies: [value.length], scope: list }
  );

  const unused = SUGGESTIONS.filter((tag) => !value.includes(tag)).slice(0, 6);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={list}
        className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-control border border-border bg-surface px-2 py-2 transition-colors focus-within:border-accent"
      >
        {value.map((tag) => (
          <span
            key={tag}
            data-chip
            className="flex items-center gap-1 rounded-chip bg-accent-wash py-1 pr-1 pl-2 text-sm text-accent"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              aria-label={`Remove ${tag}`}
              className="flex size-4 items-center justify-center rounded-[3px] transition-colors hover:bg-accent hover:text-accent-contrast"
            >
              <X size={10} weight="bold" />
            </button>
          </span>
        ))}

        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "," || event.key === "Tab") {
              if (!draft.trim()) return;
              event.preventDefault();
              add(draft);
            } else if (event.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length ? "" : "Type a topic, press Enter"}
          className="min-w-32 flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted"
        />
      </div>

      {unused.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted">Common:</span>
          {unused.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => add(tag)}
              className="flex items-center gap-1 rounded-chip border border-border px-2 py-0.5 text-xs text-muted transition-[color,border-color,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-px hover:border-accent hover:text-accent"
            >
              <Plus size={10} weight="bold" />
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
