"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { RatingComparison } from "@/lib/actions/analytics";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const LABELS: Record<string, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
  UNRATED: "Unrated",
};

/**
 * Your rating against the platform's, per platform level.
 *
 * This is the only figure on the dashboard that needs two independent
 * opinions, and it is the reason the app asks for one after every solve. It
 * answers a question no platform can: not "how hard is this problem" but "how
 * hard is this problem for me", and the disagreement is the signal. Finding
 * their Mediums consistently Hard is a concrete thing to work on. Finding their
 * Hards Easy is a sign to move up.
 *
 * Custom problems are excluded upstream, because for those the two values are
 * the same row by construction and would inflate the agreement.
 *
 * A diverging stacked bar rather than three separate ones: "harder" and
 * "easier" are opposite directions of one measure, so they belong on opposite
 * sides of a shared centre. Agreement sits in the middle, in the recessive
 * neutral, because it is the uninteresting case.
 */
export function RatingComparisonBars({
  comparison,
  unratedSolved,
}: {
  comparison: RatingComparison[];
  unratedSolved: number;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const bars = root.current?.querySelectorAll("[data-segment]");
      if (!bars?.length) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(bars, {
        scaleX: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.04,
        scrollTrigger: { trigger: root.current, start: "top 88%", once: true },
      });
    },
    { dependencies: [comparison.length], scope: root }
  );

  if (comparison.length === 0) {
    return (
      <p className="max-w-[58ch] text-sm text-muted">
        Nothing to compare yet. Solve a LeetCode or Codeforces problem and rate
        how hard it felt, and this fills in with where you and the platform
        disagree.
        {unratedSolved > 0 && (
          <>
            {" "}
            <span className="text-foreground">
              {unratedSolved} solved problem{unratedSolved === 1 ? "" : "s"}
            </span>{" "}
            {unratedSolved === 1 ? "is" : "are"} waiting on a rating.
          </>
        )}
      </p>
    );
  }

  const totalHarder = comparison.reduce((sum, row) => sum + row.harder, 0);
  const totalRated = comparison.reduce((sum, row) => sum + row.rated, 0);

  return (
    <div ref={root} className="flex flex-col gap-5">
      <p className="text-sm">
        You found{" "}
        <span data-numeric className="font-medium">
          {Math.round((totalHarder / totalRated) * 100)}%
        </span>{" "}
        of rated problems harder than their official difficulty.
      </p>

      <ul className="flex flex-col gap-4">
        {comparison.map((row) => {
          const pct = (value: number) => (value / row.rated) * 100;

          return (
            <li key={row.difficulty} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span>{LABELS[row.difficulty] ?? row.difficulty}</span>
                <span data-numeric className="text-xs text-muted">
                  {row.rated} rated
                </span>
              </div>

              <span
                className="flex h-2.5 w-full overflow-hidden rounded-chip bg-surface-sunken"
                role="img"
                aria-label={`${LABELS[row.difficulty]}: ${row.harder} felt harder, ${row.same} the same, ${row.easier} easier, of ${row.rated}`}
              >
                {/* Harder sits left of centre and carries the accent, because
                    it is the one you would act on. */}
                <span
                  data-segment
                  className="block h-full origin-right bg-accent"
                  style={{ width: `${pct(row.harder)}%` }}
                />
                <span
                  data-segment
                  className="block h-full origin-center bg-border-strong"
                  style={{ width: `${pct(row.same)}%` }}
                />
                <span
                  data-segment
                  className="block h-full origin-left bg-accent/35"
                  style={{ width: `${pct(row.easier)}%` }}
                />
              </span>

              <div
                data-numeric
                className="flex flex-wrap gap-x-4 text-xs text-muted"
              >
                <span>{row.harder} harder</span>
                <span>{row.same} agreed</span>
                <span>{row.easier} easier</span>
              </div>
            </li>
          );
        })}
      </ul>

      {unratedSolved > 0 && (
        <p className="text-xs text-muted">
          {unratedSolved} solved problem{unratedSolved === 1 ? "" : "s"} not
          rated yet, so {unratedSolved === 1 ? "it is" : "they are"} missing
          from this panel.
        </p>
      )}
    </div>
  );
}
