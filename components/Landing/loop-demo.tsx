"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Check, X, ArrowCounterClockwise } from "@phosphor-icons/react";
import { formatDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/surface";
import { StatusChip } from "@/components/ui/chip";
import type { AttemptStatus } from "@/generated/prisma/enums";

/**
 * The hero visual.
 *
 * This is the real loop, running: the same `formatDuration` the app uses, the
 * same status chips, the same timer arithmetic (elapsed is recomputed from an
 * absolute start timestamp rather than accumulated, so it cannot drift). It is
 * a working demo rather than a screenshot of one, which means it can never go
 * stale against the product and there is nothing here pretending to be
 * something it is not.
 *
 * Nothing is persisted. Signing in is what turns this into your actual history.
 */

type Recorded = { id: number; durationMs: number; status: AttemptStatus };

export function LoopDemo() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [recorded, setRecorded] = useState<Recorded[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    if (startedAt === null) return;

    const tick = () => setElapsedMs(Date.now() - startedAt);
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [startedAt]);

  const finish = (status: AttemptStatus) => {
    setRecorded((previous) =>
      [{ id: nextId.current++, durationMs: elapsedMs, status }, ...previous].slice(
        0,
        3
      )
    );
    setStartedAt(null);
    setElapsedMs(0);
  };

  const running = startedAt !== null;

  return (
    <Panel tone={running ? "live" : "default"} className="overflow-hidden">
      <div className="flex flex-col gap-5 p-6 sm:p-7">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Two Sum</span>
            <span className="text-xs text-muted">leetcode</span>
          </div>
          {running ? (
            <StatusChip status="IN_PROGRESS" />
          ) : (
            <span className="text-xs text-muted">Try it</span>
          )}
        </div>

        <p
          data-numeric
          className={`font-mono text-5xl leading-none font-medium sm:text-6xl ${
            running ? "text-accent" : "text-foreground"
          }`}
        >
          {formatDuration(elapsedMs)}
        </p>

        <div className="flex flex-wrap gap-2">
          {running ? (
            <>
              <Button onClick={() => finish("SOLVED")}>
                <Check size={16} weight="bold" />
                Solved it
              </Button>
              <Button variant="secondary" onClick={() => finish("GIVEN_UP")}>
                <X size={16} weight="bold" />
                Give up
              </Button>
            </>
          ) : (
            <Button onClick={() => setStartedAt(Date.now())}>
              <Play size={16} weight="fill" />
              Start the clock
            </Button>
          )}

          {recorded.length > 0 && !running && (
            <Button
              variant="ghost"
              onClick={() => setRecorded([])}
              aria-label="Clear the demo attempts"
            >
              <ArrowCounterClockwise size={16} />
              Clear
            </Button>
          )}
        </div>
      </div>

      {recorded.length > 0 && (
        <div className="border-t border-border bg-surface-sunken/60 px-6 py-4 sm:px-7">
          <p className="mb-2.5 text-xs text-muted">This session</p>
          <ul className="flex flex-col divide-y divide-border">
            {recorded.map((attempt) => (
              <li
                key={attempt.id}
                className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
              >
                <span data-numeric className="font-mono text-sm">
                  {formatDuration(attempt.durationMs)}
                </span>
                <StatusChip status={attempt.status} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
