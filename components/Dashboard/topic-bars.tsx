"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Tag as TagIcon } from "@phosphor-icons/react";
import { formatDuration } from "@/lib/format";
import { MIN_ATTEMPTS_FOR_SIGNAL } from "@/lib/constants";
import type { TopicStat, UntaggedProblem } from "@/lib/actions/analytics";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * One measure (solve rate) across nominal categories (topics) = one series, so
 * every bar is the same hue. Shading bars by their own value would double-encode
 * length as colour and burn the only free channel.
 *
 * Values are rendered in a column beside the bars rather than inside them, so a
 * short bar can never clip its own label, and that column doubles as the table
 * view: nothing here is reachable only by hovering.
 *
 * Interaction adds emphasis, never information. Hovering a row dims the others
 * so a single topic can be read out of a dense list, and reveals the attempt
 * counts it already carries. Every row is also focusable, so the same emphasis
 * is available from the keyboard.
 */
export function TopicBars({
  topics,
  lowDataTopics,
  untaggedProblems,
}: {
  topics: TopicStat[];
  lowDataTopics: string[];
  untaggedProblems: UntaggedProblem[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  // Bars grow from the baseline as the block scrolls in. The motion is doing
  // one job: it makes the relative lengths land in sequence instead of all at
  // once, which is how you read a ranked list anyway. `once` so it never
  // replays on scroll-back, and scaleX so it is a compositor-only transform.
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
        stagger: 0.05,
        scrollTrigger: { trigger: root.current, start: "top 85%", once: true },
      });
    },
    { dependencies: [topics.length], scope: root }
  );

  const untaggedNotice =
    untaggedProblems.length > 0 ? (
      <div className="flex flex-col items-start gap-2 rounded-panel border border-dashed border-border-strong p-4">
        <p className="flex items-center gap-2 text-sm">
          <TagIcon size={15} className="text-accent" aria-hidden="true" />
          <span>
            <span data-numeric className="font-medium">
              {untaggedProblems.length}
            </span>{" "}
            {untaggedProblems.length === 1 ? "problem has" : "problems have"} no
            topics
          </span>
        </p>
        <p className="max-w-[52ch] text-xs text-muted">
          They are missing from everything on this panel. LeetCode and
          Codeforces problems get their topics automatically; these came from
          somewhere that does not publish them.
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {untaggedProblems.slice(0, 5).map((problem) => (
            <li key={problem.id}>
              <Link
                href={`/problems/${problem.id}`}
                className="block max-w-52 truncate rounded-chip bg-surface-sunken px-2 py-0.5 text-xs transition-colors hover:text-accent"
              >
                {problem.title}
              </Link>
            </li>
          ))}
          {untaggedProblems.length > 5 && (
            <li className="px-1 py-0.5 text-xs text-muted">
              and {untaggedProblems.length - 5} more
            </li>
          )}
        </ul>
      </div>
    ) : null;

  if (topics.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          No topic has {MIN_ATTEMPTS_FOR_SIGNAL} finished attempts yet. Solve a
          few more problems and your strengths and weak spots will show up here.
          {lowDataTopics.length > 0 ? (
            <> Waiting on: {lowDataTopics.join(", ")}.</>
          ) : null}
        </p>
        {untaggedNotice}
      </div>
    );
  }

  const strongest = topics.slice(0, 2).map((topic) => topic.tag);
  const weakest = topics
    .slice(-2)
    .filter((topic) => !strongest.includes(topic.tag))
    .map((topic) => topic.tag)
    .reverse();

  return (
    <div ref={root} className="flex flex-col gap-4">
      {/* The strength/weakness read is carried by text, not by colour: the bars
          stay one hue. */}
      <p className="text-sm text-foreground">
        Strongest: <span className="font-medium">{strongest.join(", ")}</span>
        {weakest.length > 0 ? (
          <>
            {" · "}Needs work:{" "}
            <span className="font-medium">{weakest.join(", ")}</span>
          </>
        ) : null}
      </p>

      <ul
        className="flex flex-col"
        onMouseLeave={() => setActive(null)}
      >
        {topics.map((topic) => {
          const isActive = active === topic.tag;
          const dimmed = active !== null && !isActive;

          return (
            <li key={topic.tag}>
              <div
                tabIndex={0}
                onMouseEnter={() => setActive(topic.tag)}
                onFocus={() => setActive(topic.tag)}
                onBlur={() => setActive(null)}
                className={`grid grid-cols-[7rem_1fr_auto] items-center gap-3 rounded-control px-2 py-2 transition-[background-color,opacity] duration-200 ${
                  isActive ? "bg-surface-sunken" : ""
                } ${dimmed ? "opacity-45" : "opacity-100"}`}
              >
                <span className="truncate text-sm" title={topic.tag}>
                  {topic.tag}
                </span>

                {/* Thin mark, rounded only at the data end; the baseline end
                    stays square against the track's origin. Must be
                    block-level: an inline element ignores width and height. */}
                <span className="block h-2 w-full overflow-hidden rounded-chip bg-surface-sunken">
                  <span
                    data-bar
                    className="block h-full rounded-r-chip bg-accent"
                    style={{ width: `${Math.round(topic.solveRate * 100)}%` }}
                  />
                </span>

                <span
                  data-numeric
                  className="text-right text-sm whitespace-nowrap"
                >
                  {Math.round(topic.solveRate * 100)}%
                  <span className="ml-2 text-xs text-muted">
                    {topic.solved}/{topic.attempts}
                  </span>
                </span>
              </div>

              {/* Detail on demand, in flow rather than in a floating tooltip, so
                  it cannot fall off the edge of a narrow column. */}
              {isActive && topic.avgSolveMs !== null && (
                <p
                  data-numeric
                  className="px-2 pb-2 text-xs text-muted"
                >
                  {formatDuration(topic.avgSolveMs)} average when solved
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {lowDataTopics.length > 0 && (
        <p className="text-xs text-muted">
          Not enough attempts yet: {lowDataTopics.join(", ")}
        </p>
      )}

      {untaggedNotice}
    </div>
  );
}
