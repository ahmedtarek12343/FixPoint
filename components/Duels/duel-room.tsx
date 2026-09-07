"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDuel, useFinishDuel, useStartDuel } from "@/hooks/use-duels";
import { formatDuration } from "@/lib/format";
import { WhiteboardPanel } from "@/components/Problems/whiteboard-panel";

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
      <div className="flex flex-col gap-3">
        <p className="opacity-70">
          You&apos;re not in this duel. Ask for the join code and enter it from
          the duels page.
        </p>
        <Link href="/duels" className="w-fit underline underline-offset-4">
          Back to duels
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{duel.problem.title}</h1>
        <p className="text-sm opacity-70">
          {duel.problem.source.toLowerCase()}
          {duel.problem.difficulty
            ? ` · ${duel.problem.difficulty.toLowerCase()}`
            : ""}
        </p>
      </div>

      {duel.status === "PENDING" ? (
        <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-5 dark:border-white/15">
          <div>
            <div className="text-xs uppercase tracking-wide opacity-60">
              Join code
            </div>
            <div className="mt-1 font-mono text-4xl tracking-[0.2em]">
              {duel.code}
            </div>
            <p className="mt-2 text-sm opacity-70">
              Share this with your opponent — they enter it on the duels page.
            </p>
          </div>

          {duel.you.isHost ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={duel.participants.length < 2 || start.isPending}
                onClick={() => start.mutate()}
                className="w-fit rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {duel.participants.length < 2
                  ? "Waiting for an opponent…"
                  : "Start duel"}
              </button>
              {start.isError ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {start.error.message}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm opacity-70">
              Waiting for the host to start the duel…
            </p>
          )}
        </section>
      ) : null}

      {duel.status === "ACTIVE" ? (
        <section className="flex flex-col gap-4 rounded-lg border border-emerald-600/40 bg-emerald-600/5 p-5">
          <span className="font-mono text-4xl tabular-nums">
            {formatDuration(elapsedMs)}
          </span>

          <div className="flex flex-wrap gap-2">
            <a
              href={duel.problem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Open problem ↗
            </a>

            {duel.you.finishedAt ? (
              <span className="rounded-md bg-emerald-600/15 px-4 py-2 text-sm">
                You finished — waiting for the others.
              </span>
            ) : (
              <button
                type="button"
                disabled={finish.isPending}
                onClick={() => finish.mutate()}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                I solved it
              </button>
            )}
          </div>
        </section>
      ) : null}

      {duel.status === "FINISHED" ? (
        <section className="rounded-lg border border-black/10 p-5 dark:border-white/15">
          <h2 className="text-lg font-semibold">
            {duel.you.rank === 1 ? "You won 🎉" : "Duel over"}
          </h2>
        </section>
      ) : null}

      {duel.status === "ACTIVE" ? (
        // Same board as the problem page — one per user per problem, so
        // anything sketched during the duel is still there afterwards.
        <WhiteboardPanel problemId={duel.problem.id} title="Scratch space" />
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          Players ({duel.participants.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {duel.participants.map((participant) => {
            const finishMs =
              participant.finishedAt && startedAtMs
                ? new Date(participant.finishedAt).getTime() - startedAtMs
                : null;

            return (
              <li
                key={participant.userId}
                className="flex items-center justify-between rounded-md border border-black/10 px-4 py-2 text-sm dark:border-white/10"
              >
                <span>
                  {participant.name}
                  {participant.isYou ? (
                    <span className="ml-2 text-xs opacity-60">you</span>
                  ) : null}
                </span>

                <span className="tabular-nums opacity-70">
                  {participant.rank ? `#${participant.rank}` : "solving…"}
                  {finishMs !== null ? ` · ${formatDuration(finishMs)}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
