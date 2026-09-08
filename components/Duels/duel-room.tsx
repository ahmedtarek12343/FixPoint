"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowSquareOut, Check, Trophy } from "@phosphor-icons/react";
import { useDuel, useFinishDuel, useStartDuel } from "@/hooks/use-duels";
import { formatDuration } from "@/lib/format";
import { WhiteboardPanel } from "@/components/Problems/whiteboard-panel";
import { Button, buttonStyles } from "@/components/ui/button";
import { Panel, Section } from "@/components/ui/surface";
import { ErrorNote } from "@/components/ui/feedback";
import { DifficultyMeter } from "@/components/ui/chip";

/** Ticks while the duel is running; the elapsed value is display-only. */
function useElapsed(startedAt: string | null, running: boolean) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!startedAt || !running) return;

    const startedAtMs = new Date(startedAt).getTime();
    const tick = () => setElapsedMs(Date.now() - startedAtMs);
    tick();

    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [startedAt, running]);

  return elapsedMs;
}

export function DuelRoom({ duelId }: { duelId: string }) {
  const { data: duel } = useDuel(duelId);
  const start = useStartDuel(duelId);
  const finish = useFinishDuel(duelId);

  const elapsedMs = useElapsed(duel.startedAt, duel.status === "ACTIVE");
  const startedAtMs = duel.startedAt ? new Date(duel.startedAt).getTime() : null;

  if (!duel.you.isParticipant) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-2xl font-semibold">You are not in this duel</h1>
        <p className="max-w-[52ch] text-muted">
          Ask for the join code and enter it on the duels page.
        </p>
        <Link href="/duels" className={buttonStyles({ variant: "secondary" })}>
          <ArrowLeft size={16} />
          Back to duels
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <Link
          href="/duels"
          className="flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} />
          All duels
        </Link>

        <h1 className="text-3xl font-semibold sm:text-4xl">
          {duel.problem.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4">
          <DifficultyMeter difficulty={duel.problem.difficulty} />
          <span className="text-sm text-muted">
            {duel.problem.source.toLowerCase()}
          </span>
        </div>
      </header>

      {duel.status === "PENDING" && (
        <Panel className="flex flex-col items-start gap-6 p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted">Join code</p>
            <p
              data-numeric
              className="font-mono text-5xl font-medium tracking-[0.3em] sm:text-6xl"
            >
              {duel.code}
            </p>
            <p className="max-w-[46ch] text-sm text-muted">
              Send this to your opponent. They enter it on the duels page and
              land straight in here.
            </p>
          </div>

          {duel.you.isHost ? (
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                disabled={duel.participants.length < 2 || start.isPending}
                onClick={() => start.mutate()}
              >
                {duel.participants.length < 2
                  ? "Waiting for an opponent"
                  : "Start the duel"}
              </Button>
              {start.isError && <ErrorNote>{start.error.message}</ErrorNote>}
            </div>
          ) : (
            <p className="text-sm text-muted">
              Waiting for the host to start. Both clocks begin on the same
              second.
            </p>
          )}
        </Panel>
      )}

      {duel.status === "ACTIVE" && (
        <Panel tone="live" className="flex flex-col gap-6 p-6 sm:p-8">
          <p
            data-numeric
            role="timer"
            className="font-mono text-6xl leading-none font-medium text-accent sm:text-7xl"
          >
            {formatDuration(elapsedMs)}
          </p>

          {finish.isError && <ErrorNote>{finish.error.message}</ErrorNote>}

          <div className="flex flex-wrap gap-2">
            {duel.you.finishedAt ? (
              <p className="flex items-center gap-2 rounded-control bg-surface px-4 py-2.5 text-sm">
                <Check size={16} weight="bold" className="text-accent" />
                You are in. Waiting for the others.
              </p>
            ) : (
              <Button
                size="lg"
                disabled={finish.isPending}
                onClick={() => finish.mutate()}
              >
                <Check size={18} weight="bold" />
                I solved it
              </Button>
            )}

            <a
              href={duel.problem.url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ variant: "secondary", size: "lg" })}
            >
              Open problem
              <ArrowSquareOut size={16} />
            </a>
          </div>
        </Panel>
      )}

      {duel.status === "FINISHED" && (
        <Panel
          tone={duel.you.rank === 1 ? "live" : "default"}
          className="flex items-center gap-4 p-6 sm:p-8"
        >
          {duel.you.rank === 1 && (
            <Trophy
              size={32}
              weight="fill"
              className="shrink-0 text-accent"
              aria-hidden="true"
            />
          )}
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold">
              {duel.you.rank === 1 ? "You took it" : "Duel over"}
            </h2>
            <p className="text-sm text-muted">
              {duel.you.rank === 1
                ? "Fastest finish of the round."
                : `You finished ${duel.you.rank === null ? "unranked" : `in position ${duel.you.rank}`}.`}
            </p>
          </div>
        </Panel>
      )}

      {duel.status === "ACTIVE" && (
        // Same board as the problem page: one per user per problem, so anything
        // sketched during the duel is still there afterwards.
        <WhiteboardPanel problemId={duel.problem.id} title="Scratch space" />
      )}

      <Section title={`Players (${duel.participants.length})`}>
        <ul className="flex flex-col divide-y divide-border">
          {duel.participants.map((participant) => {
            const finishMs =
              participant.finishedAt && startedAtMs
                ? new Date(participant.finishedAt).getTime() - startedAtMs
                : null;

            return (
              <li
                key={participant.userId}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    data-numeric
                    className={`w-6 font-mono text-sm ${
                      participant.rank === 1 ? "text-accent" : "text-muted"
                    }`}
                  >
                    {participant.rank ? `#${participant.rank}` : "  "}
                  </span>
                  <span className={participant.isYou ? "font-medium" : ""}>
                    {participant.name}
                  </span>
                  {participant.isYou && (
                    <span className="text-xs text-muted">you</span>
                  )}
                </span>

                <span
                  data-numeric
                  className="font-mono text-sm text-muted"
                >
                  {finishMs !== null ? formatDuration(finishMs) : "solving"}
                </span>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}
