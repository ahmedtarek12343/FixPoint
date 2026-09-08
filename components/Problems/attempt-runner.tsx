"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Check, X, ArrowSquareOut } from "@phosphor-icons/react";
import { formatDuration, parseHoursMinutesToMs } from "@/lib/format";
import {
  CUSTOM_TIME_LIMIT,
  MAX_TIME_LIMIT_MS,
  TIME_LIMIT_OPTIONS,
} from "@/lib/constants";
import { useEndAttempt, useStartAttempt } from "@/hooks/use-attempts";
import type { AttemptDto } from "@/lib/actions/attempts";
import { Button, buttonStyles } from "@/components/ui/button";
import { Panel } from "@/components/ui/surface";
import { Field, inputStyles } from "@/components/ui/field";
import { ErrorNote } from "@/components/ui/feedback";

type Props = {
  problemId: string;
  problemUrl: string;
  activeAttempt: AttemptDto | null;
};

/**
 * The running clock is the loudest thing on the page by design: it is the one
 * number the user is here for, so it gets display scale, the accent colour and
 * a raised surface, and everything else on the page steps back while it runs.
 */
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

  // The clock is pure client state: derived from the server's startedAt and
  // never written anywhere. The authoritative duration is recomputed
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
        customError = "Use h:mm, for example 0:45.";
      } else if (parsedCustom > MAX_TIME_LIMIT_MS) {
        customError = `The maximum is ${formatDuration(MAX_TIME_LIMIT_MS)}.`;
      }
    }

    // A custom limit has to be valid before the timer can start; the preset
    // options are always ready.
    const limitToStart = isCustom ? parsedCustom : selectedLimit || null;
    const canStart =
      !isCustom || (parsedCustom !== null && parsedCustom <= MAX_TIME_LIMIT_MS);

    return (
      <Panel className="flex flex-col gap-6 p-6 sm:p-7">
        <div className="flex flex-wrap items-end gap-4">
          <Field
            label="Give up automatically after"
            htmlFor="time-limit"
            hint="Capped at one hour. Nothing past that is practice."
            className="w-56"
          >
            <select
              id="time-limit"
              value={selectedLimit}
              onChange={(event) => setSelectedLimit(Number(event.target.value))}
              className={inputStyles}
            >
              {TIME_LIMIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          {isCustom && (
            <Field
              label="How long"
              htmlFor="custom-limit"
              error={customError}
              className="w-32"
            >
              <input
                id="custom-limit"
                value={customLimit}
                onChange={(event) => setCustomLimit(event.target.value)}
                placeholder="0:45"
                inputMode="numeric"
                aria-invalid={customError ? true : undefined}
                aria-describedby={
                  customError ? "custom-limit-error" : undefined
                }
                data-numeric
                className={`${inputStyles} font-mono`}
              />
            </Field>
          )}
        </div>

        {start.isError && <ErrorNote>{start.error.message}</ErrorNote>}

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
          className={buttonStyles({
            size: "lg",
            className: `w-fit ${canStart ? "" : "pointer-events-none opacity-45"}`,
          })}
        >
          <Play size={18} weight="fill" />
          Start solving
          <ArrowSquareOut size={16} />
        </a>
      </Panel>
    );
  }

  const remainingMs = activeAttempt.timeLimitMs
    ? activeAttempt.timeLimitMs - elapsedMs
    : null;
  const isPending = start.isPending || end.isPending;
  const nearlyOut = remainingMs !== null && remainingMs < 60_000;

  return (
    <Panel tone="live" className="flex flex-col gap-6 p-6 sm:p-7">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <p
          data-numeric
          role="timer"
          aria-live="off"
          className="font-mono text-6xl leading-none font-medium text-accent sm:text-7xl"
        >
          {formatDuration(elapsedMs)}
        </p>

        {remainingMs !== null && (
          <p
            data-numeric
            className={`text-sm ${nearlyOut ? "font-medium text-danger" : "text-muted"}`}
          >
            {formatDuration(Math.max(0, remainingMs))} left
          </p>
        )}
      </div>

      {end.isError && <ErrorNote>{end.error.message}</ErrorNote>}

      <div className="flex flex-wrap gap-2">
        <Button
          size="lg"
          disabled={isPending}
          onClick={() =>
            end.mutate({ attemptId: activeAttempt.id, outcome: "SOLVED" })
          }
        >
          <Check size={18} weight="bold" />
          Solved it
        </Button>

        <Button
          variant="secondary"
          size="lg"
          disabled={isPending}
          onClick={() =>
            end.mutate({ attemptId: activeAttempt.id, outcome: "GIVEN_UP" })
          }
        >
          <X size={18} weight="bold" />
          Give up
        </Button>

        <a
          href={problemUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonStyles({ variant: "ghost", size: "lg" })}
        >
          Reopen problem
          <ArrowSquareOut size={16} />
        </a>
      </div>
    </Panel>
  );
}
