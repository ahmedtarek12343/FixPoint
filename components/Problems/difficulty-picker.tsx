"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const CHOICES = [
  { id: "EASY", label: "Easy", note: "Saw it straight away", steps: 1 },
  { id: "MEDIUM", label: "Medium", note: "Took some working out", steps: 2 },
  { id: "HARD", label: "Hard", note: "Struggled, or needed a hint", steps: 3 },
] as const;

/**
 * Three-way rating, in the same ordinal-meter language the rest of the app uses
 * for difficulty. Segmented buttons rather than a select: there are exactly
 * three options, they are ordered, and the whole point is to answer in one tap
 * without opening anything.
 *
 * The sub-labels exist because "Medium" on its own invites people to guess at
 * what the platform would say. The question is about them, not the platform.
 */
export function DifficultyPicker({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (difficulty: string) => void;
  disabled?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);

  // A small settle on the chosen option. Confirms the tap registered, which
  // matters when the same tap also dismisses the dialog a moment later.
  useGSAP(
    () => {
      if (!value || !root.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const selected = root.current.querySelector(`[data-choice="${value}"]`);
      if (!selected) return;

      gsap.fromTo(
        selected,
        { scale: 0.96 },
        { scale: 1, duration: 0.4, ease: "back.out(3)", clearProps: "transform" }
      );
    },
    { dependencies: [value], scope: root }
  );

  return (
    <div
      ref={root}
      role="radiogroup"
      aria-label="How hard was this for you"
      className="grid gap-2 sm:grid-cols-3"
    >
      {CHOICES.map((choice) => {
        const selected = value === choice.id;

        return (
          <button
            key={choice.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            data-choice={choice.id}
            onClick={() => onChange(choice.id)}
            className={`flex flex-col items-start gap-2 rounded-control border p-3 text-left transition-[border-color,background-color,transform] duration-200 ease-[var(--ease-out)] active:translate-y-px disabled:opacity-50 ${
              selected
                ? "border-accent bg-accent-wash"
                : "border-border hover:border-border-strong hover:bg-surface-sunken"
            }`}
          >
            <span className="flex items-end gap-0.5" aria-hidden="true">
              {[0, 1, 2].map((step) => (
                <span
                  key={step}
                  style={{ height: `${6 + step * 3}px` }}
                  className={`w-1 rounded-[1px] ${
                    step < choice.steps
                      ? selected
                        ? "bg-accent"
                        : "bg-muted"
                      : "bg-border-strong"
                  }`}
                />
              ))}
            </span>

            <span className="flex flex-col gap-0.5">
              <span
                className={`text-sm font-medium ${selected ? "text-accent" : ""}`}
              >
                {choice.label}
              </span>
              <span className="text-xs text-muted">{choice.note}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
