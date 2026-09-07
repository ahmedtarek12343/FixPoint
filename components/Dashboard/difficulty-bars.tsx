import type { DifficultyStat } from "@/lib/actions/analytics";

const LABELS: Record<string, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
  UNRATED: "Unrated",
};

/**
 * Solve rate per difficulty. Same single-hue treatment as the topic bars — one
 * measure across categories is one series, so shading each bar by its own value
 * would encode the length twice.
 */
export function DifficultyBars({ difficulties }: { difficulties: DifficultyStat[] }) {
  if (difficulties.length === 0) {
    return <p className="text-sm text-[#898781]">No finished attempts yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {difficulties.map((entry) => (
        <li
          key={entry.difficulty}
          className="grid grid-cols-[5rem_1fr_auto] items-center gap-3"
        >
          <span className="text-sm">
            {LABELS[entry.difficulty] ?? entry.difficulty}
          </span>

          <div className="h-2 w-full overflow-hidden rounded-[4px] bg-[#e1e0d9] dark:bg-[#2c2c2a]">
            <div
              className="h-full rounded-r-[4px] bg-[#2a78d6] dark:bg-[#3987e5]"
              style={{ width: `${Math.round(entry.solveRate * 100)}%` }}
            />
          </div>

          <span className="text-right text-sm tabular-nums">
            {Math.round(entry.solveRate * 100)}%
            <span className="ml-2 text-xs text-[#898781]">
              {entry.solved}/{entry.attempts}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
