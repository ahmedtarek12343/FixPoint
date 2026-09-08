"use client";

import Link from "next/link";
import { ArrowLeft, ArrowSquareOut } from "@phosphor-icons/react";
import { useProblemDetail } from "@/hooks/use-attempts";
import { formatDuration } from "@/lib/format";
import { AttemptRunner } from "./attempt-runner";
import { NotesPanel } from "./notes-panel";
import { SolutionsPanel } from "./solutions-panel";
import { WhiteboardPanel } from "./whiteboard-panel";
import { SnapshotGallery } from "./snapshot-gallery";
import { Section } from "@/components/ui/surface";
import { DifficultyMeter, StatusChip } from "@/components/ui/chip";
import {
  AfterAttemptDialog,
  ProblemMetaRow,
  useAfterAttemptPrompt,
} from "./after-attempt";
import { StatRow, StatTile } from "@/components/Dashboard/stat-tile";

export function ProblemDetail({ problemId }: { problemId: string }) {
  const { data: problem } = useProblemDetail(problemId);

  // Asks for topics and for the user's own difficulty rating, once, at the
  // moment an attempt ends. See after-attempt.tsx for why that is the right
  // moment and why neither question belongs in the add form.
  const prompt = useAfterAttemptPrompt({
    problemId,
    tagCount: problem?.tags.length ?? 0,
    hasRating: Boolean(problem?.yourDifficulty),
    activeAttempt: problem?.activeAttempt ?? null,
    // attempts come back newest first, so [0] is the one that just ended.
    lastStatus: problem?.attempts[0]?.status ?? null,
  });

  // The server component already 404s on a missing problem; this only covers
  // the case where it is deleted while the page is open.
  if (!problem) {
    return <p className="text-muted">This problem no longer exists.</p>;
  }

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-4">
        {/* Every page needs a way back. */}
        <Link
          href="/problems"
          className="flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} />
          All problems
        </Link>

        <h1 className="text-3xl font-semibold sm:text-4xl">{problem.title}</h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <DifficultyMeter difficulty={problem.difficulty} />
          <span className="text-sm text-muted">
            {problem.platform === "LEETCODE"
              ? "leetcode"
              : problem.platform === "CODEFORCES"
                ? "codeforces"
                : problem.platform}
          </span>
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-accent transition-opacity hover:opacity-80"
          >
            Open the problem
            <ArrowSquareOut size={14} />
          </a>
        </div>

        <ProblemMetaRow
          problemId={problem.id}
          source={problem.source}
          platformDifficulty={problem.difficulty}
          title={problem.title}
          platformTitle={problem.platformTitle}
          platformLabel={problem.platformLabel}
          tags={problem.tags}
          yourDifficulty={problem.yourDifficulty}
        />
      </header>

      <AfterAttemptDialog
        problemId={problem.id}
        source={problem.source}
        platformDifficulty={problem.difficulty}
        initialTags={problem.tags}
        initialDifficulty={problem.yourDifficulty}
        askTopics={prompt.asking?.topics ?? false}
        askDifficulty={prompt.asking?.difficulty ?? false}
        open={prompt.asking !== null}
        onClose={prompt.close}
        onSkip={prompt.skip}
      />

      <AttemptRunner
        problemId={problem.id}
        problemUrl={problem.url}
        activeAttempt={problem.activeAttempt}
      />

      <StatRow>
        <StatTile
          label="Best time"
          value={
            problem.bestMs === null ? "None yet" : formatDuration(problem.bestMs)
          }
        />
        <StatTile label="Attempts" value={String(problem.attempts.length)} />
        <StatTile label="Solved" value={String(problem.solvedCount)} />
        <StatTile
          label="Solve rate"
          value={
            problem.attempts.length === 0
              ? "None yet"
              : `${Math.round((problem.solvedCount / problem.attempts.length) * 100)}%`
          }
        />
      </StatRow>

      <Section title="History">
        {problem.attempts.length === 0 ? (
          <p className="text-sm text-muted">
            No attempts yet. Start the clock above.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {problem.attempts.map((attempt) => (
              <li
                key={attempt.id}
                className="flex flex-wrap items-center justify-between gap-4 py-3"
              >
                <span data-numeric className="text-sm text-muted">
                  {new Date(attempt.startedAt).toLocaleString()}
                </span>
                <span className="flex items-center gap-4">
                  <StatusChip status={attempt.status} />
                  <span
                    data-numeric
                    className={`w-20 text-right font-mono text-sm ${
                      attempt.durationMs !== null &&
                      attempt.durationMs === problem.bestMs
                        ? "text-accent"
                        : ""
                    }`}
                  >
                    {attempt.durationMs === null
                      ? "not timed"
                      : formatDuration(attempt.durationMs)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <WhiteboardPanel problemId={problem.id} />
      <SnapshotGallery problemId={problem.id} />
      <NotesPanel problemId={problem.id} />
      <SolutionsPanel problemId={problem.id} />
    </div>
  );
}
