"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration, parseHoursMinutesToMs } from "@/lib/format";
import {
  CUSTOM_TIME_LIMIT,
  MAX_TIME_LIMIT_MS,
  TIME_LIMIT_OPTIONS,
} from "@/lib/constants";
import { useEndAttempt, useStartAttempt } from "@/hooks/use-attempts";
import type { AttemptDto } from "@/lib/actions/attempts";

type Props = {
  problemId: string;
  problemUrl: string;
  activeAttempt: AttemptDto | null;
};

export function AttemptRunner({ problemId, problemUrl, activeAttempt }: Props) {
  const [selectedLimit, setSelectedLimit] = useState(0);
  const [customLimit, setCustomLimit] = useState("");
  const [elapsedMs, setElapsedMs] = useState(0);
  const autoGaveUp = useRef(false);

  const start = useStartAttempt(problemId);
  const end = useEndAttempt(problemId);

  const startedAtMs = activeAttempt
    ? new Date(activeAttempt.startedAt).getTime()
    : null;

  // The clock is pure client state — it's derived from the server's startedAt
  // and never written anywhere. The authoritative duration is recomputed
  // server-side when the attempt ends.
  useEffect(() => {
    if (startedAtMs === null) return;

    autoGaveUp.current = false;
    const tick = () => setElapsedMs(Date.now() - startedAtMs);
    tick();

    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [startedAtMs]);

  useEffect(() => {
    if (!activeAttempt?.timeLimitMs || autoGaveUp.current) return;
    if (elapsedMs < activeAttempt.timeLimitMs) return;

    autoGaveUp.current = true;
    end.mutate({ attemptId: activeAttempt.id, outcome: "AUTO_GIVEN_UP" });
  }, [elapsedMs, activeAttempt, end]);

  if (!activeAttempt) {
    const isCustom = selectedLimit === CUSTOM_TIME_LIMIT;
    const parsedCustom = isCustom ? parseHoursMinutesToMs(customLimit) : null;

    let customError: string | null = null;
    if (isCustom && customLimit.trim()) {
      if (parsedCustom === null) {
        customError = "Use h:mm — for example 0:45.";
      } else if (parsedCustom > MAX_TIME_LIMIT_MS) {
        customError = `Maximum is ${formatDuration(MAX_TIME_LIMIT_MS)}.`;
      }
    }

    // A custom limit has to be valid before the timer can start; the preset
    // options are always ready.
    const limitToStart = isCustom ? parsedCustom : selectedLimit || null;
    const canStart =
      !isCustom || (parsedCustom !== null && parsedCustom <= MAX_TIME_LIMIT_MS);

    return (
      <div className="flex flex-col gap-4 rounded-lg border border-black/10 p-5 dark:border-white/15">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="time-limit" className="text-sm opacity-70">
            Give up automatically after
          </label>
          <select
            id="time-limit"
            value={selectedLimit}
            onChange={(event) => setSelectedLimit(Number(event.target.value))}
            className="rounded-md border border-black/15 px-2 py-1 text-sm dark:border-white/20"
          >
            {TIME_LIMIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {isCustom ? (
            <input
              value={customLimit}
              onChange={(event) => setCustomLimit(event.target.value)}
              placeholder="0:45"
              inputMode="numeric"
              aria-label="Custom time limit in hours and minutes"
              className="w-20 rounded-md border border-black/15 px-2 py-1 text-sm tabular-nums dark:border-white/20"
            />
          ) : null}
        </div>

        {customError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{customError}</p>
        ) : null}

        {/* A real anchor rather than window.open: the click itself opens the
            tab, so popup blockers stay out of it while the mutation runs. */}
        <a
          href={problemUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!canStart}
          onClick={(event) => {
            if (!canStart) {
              event.preventDefault();
              return;
            }
            start.mutate(limitToStart);
          }}
          className={`inline-flex w-fit items-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 ${
            canStart ? "" : "pointer-events-none opacity-50"
          }`}
        >
          Start solving ↗
        </a>
      </div>
    );
  }

  const remainingMs = activeAttempt.timeLimitMs
    ? activeAttempt.timeLimitMs - elapsedMs
    : null;
  const isPending = start.isPending || end.isPending;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-emerald-600/40 bg-emerald-600/5 p-5">
      <div className="flex flex-wrap items-baseline gap-4">
        <span className="font-mono text-4xl tabular-nums">
          {formatDuration(elapsedMs)}
        </span>
        {remainingMs !== null ? (
          <span
            className={`text-sm ${
              remainingMs < 60_000
                ? "text-red-600 dark:text-red-400"
                : "opacity-70"
            }`}
          >
            {formatDuration(Math.max(0, remainingMs))} left
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            end.mutate({ attemptId: activeAttempt.id, outcome: "SOLVED" })
          }
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Solved it
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            end.mutate({ attemptId: activeAttempt.id, outcome: "GIVEN_UP" })
          }
          className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
        >
          Give up
        </button>
        <a
          href={problemUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md px-4 py-2 text-sm underline underline-offset-4 opacity-70 hover:opacity-100"
        >
          Reopen problem ↗
        </a>
      </div>
    </div>
  );
}
