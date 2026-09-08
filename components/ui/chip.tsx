import type { AttemptStatus } from "@/generated/prisma/enums";

/**
 * Small labels: topic tags, difficulty, attempt outcome.
 *
 * Difficulty is deliberately NOT a green/amber/red traffic light. Three unrelated
 * hues would give the page a second, third and fourth accent, and the two most
 * common forms of colour blindness make green-vs-red the worst possible pair to
 * carry meaning. It is an ordinal value, so it gets an ordinal shape: a
 * three-segment meter that fills up, readable without colour at all.
 */

export function Tag({ children }: { children: string }) {
  return (
    <span className="rounded-chip bg-surface-sunken px-2 py-0.5 text-xs text-muted">
      {children}
    </span>
  );
}

const DIFFICULTY_STEPS: Record<string, number> = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
};

export function DifficultyMeter({
  difficulty,
}: {
  difficulty: string | null;
}) {
  const filled = difficulty ? (DIFFICULTY_STEPS[difficulty] ?? 0) : 0;
  const label = difficulty
    ? difficulty.charAt(0) + difficulty.slice(1).toLowerCase()
    : "Unrated";

  return (
    <span className="inline-flex items-center gap-2" title={label}>
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((step) => (
          <span
            key={step}
            style={{ height: `${6 + step * 3}px` }}
            className={`w-1 rounded-[1px] ${
              step < filled ? "bg-accent" : "bg-border-strong"
            }`}
          />
        ))}
      </span>
      <span className="text-sm text-muted">{label}</span>
    </span>
  );
}

const STATUS_LABELS: Record<AttemptStatus, string> = {
  IN_PROGRESS: "Running",
  SOLVED: "Solved",
  GIVEN_UP: "Gave up",
  AUTO_GIVEN_UP: "Timed out",
};

export function StatusChip({ status }: { status: AttemptStatus }) {
  const isRunning = status === "IN_PROGRESS";
  const isSolved = status === "SOLVED";

  const tone = isSolved
    ? "bg-accent-wash text-accent"
    : isRunning
      ? "bg-accent-wash text-accent"
      : "bg-surface-sunken text-muted";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-chip px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      {/* The only dot in the design system. It marks a genuinely live state,
          which is the one case where a status dot earns its place. */}
      {isRunning && (
        <span className="relative flex size-1.5" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70" />
          <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
        </span>
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}
