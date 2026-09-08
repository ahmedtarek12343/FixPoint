"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { DayActivity } from "@/lib/actions/analytics";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Renders "2026-09-06" as "Sep 6". */
function shortDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Last 14 days of attempts. One series, one hue; bars anchored to the baseline
 * and rounded at the data end only.
 *
 * Every column is `h-full` inside a fixed-height row on purpose: a percentage
 * height only resolves against a parent with a definite height, so columns that
 * size to their content would collapse every bar to nothing.
 *
 * The readout above the strip replaces per-bar labels. Fourteen numbers printed
 * at once is noise; one number that follows the pointer is legible, and because
 * it is a real element in flow rather than a floating tooltip it cannot be
 * clipped by the panel edge. Each column is focusable so the same readout is
 * reachable by keyboard.
 */
export function ActivityStrip({ activity }: { activity: DayActivity[] }) {
  const [active, setActive] = useState<DayActivity | null>(null);
  const root = useRef<HTMLDivElement>(null);

  const busiest = Math.max(...activity.map((day) => day.attempts), 0);
  const total = activity.reduce((sum, day) => sum + day.attempts, 0);
  const solved = activity.reduce((sum, day) => sum + day.solved, 0);

  useGSAP(
    () => {
      const bars = root.current?.querySelectorAll("[data-bar]");
      if (!bars?.length) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // Grown from the baseline, left to right, so the strip reads as a
      // timeline filling in rather than fourteen things appearing at once.
      gsap.from(bars, {
        scaleY: 0,
        transformOrigin: "bottom center",
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.03,
        scrollTrigger: { trigger: root.current, start: "top 90%", once: true },
      });
    },
    { dependencies: [activity.length], scope: root }
  );

  if (busiest === 0) {
    return (
      <p className="text-sm text-muted">
        No attempts in the last {activity.length} days.
      </p>
    );
  }

  const shown = active;

  return (
    <div ref={root} className="flex flex-col gap-3">
      {/* Reserves its own line whether or not anything is hovered, so the strip
          below never shifts up and down as the pointer moves across it. */}
      <p className="min-h-5 text-sm" data-numeric>
        {shown ? (
          <>
            <span className="font-medium">{shortDate(shown.date)}</span>
            <span className="text-muted">
              {" · "}
              {shown.attempts} attempt{shown.attempts === 1 ? "" : "s"}
              {shown.attempts > 0 ? `, ${shown.solved} solved` : ""}
            </span>
          </>
        ) : (
          <span className="text-muted">
            {total} attempt{total === 1 ? "" : "s"}, {solved} solved in{" "}
            {activity.length} days
          </span>
        )}
      </p>

      <div
        className="flex h-28 items-stretch gap-1"
        onMouseLeave={() => setActive(null)}
      >
        {activity.map((day) => {
          const isActive = shown?.date === day.date;

          return (
            <button
              key={day.date}
              type="button"
              tabIndex={0}
              onMouseEnter={() => setActive(day)}
              onFocus={() => setActive(day)}
              onBlur={() => setActive(null)}
              aria-label={`${shortDate(day.date)}: ${day.attempts} attempts, ${day.solved} solved`}
              className="flex h-full flex-1 cursor-default flex-col justify-end rounded-t-chip transition-colors duration-150 hover:bg-surface-sunken"
            >
              <span
                data-bar
                className={`block w-full rounded-t-chip transition-colors duration-150 ${
                  isActive ? "bg-accent-hover" : "bg-accent"
                }`}
                style={{
                  height: day.attempts
                    ? `${Math.max((day.attempts / busiest) * 100, 8)}%`
                    : "2px",
                  opacity: day.attempts ? 1 : 0.25,
                }}
              />
            </button>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-muted">
        <span>{shortDate(activity[0].date)}</span>
        <span>{shortDate(activity[activity.length - 1].date)}</span>
      </div>
    </div>
  );
}
