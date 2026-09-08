"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { DifficultyStat } from "@/lib/actions/analytics";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const LABELS: Record<string, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
  UNRATED: "Unrated",
};

/**
 * Solve rate per difficulty. Same single-hue treatment as the topic bars: one
 * measure across categories is one series, so shading each bar by its own value
 * would encode the length twice.
 */
export function DifficultyBars({
  difficulties,
}: {
  difficulties: DifficultyStat[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const root = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      const bars = root.current?.querySelectorAll("[data-bar]");
      if (!bars?.length) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(bars, {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.07,
        scrollTrigger: { trigger: root.current, start: "top 85%", once: true },
      });
    },
    { dependencies: [difficulties.length], scope: root }
  );

  if (difficulties.length === 0) {
    return <p className="text-sm text-muted">No finished attempts yet.</p>;
  }

  return (
    <ul
      ref={root}
      className="flex flex-col"
      onMouseLeave={() => setActive(null)}
    >
      {difficulties.map((entry) => {
        const isActive = active === entry.difficulty;
        const dimmed = active !== null && !isActive;

        return (
          <li
            key={entry.difficulty}
            tabIndex={0}
            onMouseEnter={() => setActive(entry.difficulty)}
            onFocus={() => setActive(entry.difficulty)}
            onBlur={() => setActive(null)}
            className={`grid grid-cols-[5rem_1fr_auto] items-center gap-3 rounded-control px-2 py-2 transition-[background-color,opacity] duration-200 ${
              isActive ? "bg-surface-sunken" : ""
            } ${dimmed ? "opacity-45" : "opacity-100"}`}
          >
            <span className="text-sm">
              {LABELS[entry.difficulty] ?? entry.difficulty}
            </span>

            <span className="block h-2 w-full overflow-hidden rounded-chip bg-surface-sunken">
              <span
                data-bar
                className="block h-full rounded-r-chip bg-accent"
                style={{ width: `${Math.round(entry.solveRate * 100)}%` }}
              />
            </span>

            <span data-numeric className="text-right text-sm whitespace-nowrap">
              {Math.round(entry.solveRate * 100)}%
              <span className="ml-2 text-xs text-muted">
                {entry.solved}/{entry.attempts}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
