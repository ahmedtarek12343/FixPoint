import { formatDuration } from "@/lib/format";
import { MIN_ATTEMPTS_FOR_SIGNAL } from "@/lib/constants";
import type { TopicStat } from "@/lib/actions/analytics";

/**
 * One measure (solve rate) across nominal categories (topics) = one series, so
 * every bar is the same hue. Shading bars by their own value would double-encode
 * length as color and burn the only free channel.
 *
 * Values are rendered in a column beside the bars rather than inside them, so
 * a short bar can never clip its own label — and that column doubles as the
 * table view, so nothing is reachable only by hovering.
 */
export function TopicBars({
  topics,
  lowDataTopics,
}: {
  topics: TopicStat[];
  lowDataTopics: string[];
}) {
  if (topics.length === 0) {
    return (
      <p className="text-sm text-[#898781]">
        No topic has {MIN_ATTEMPTS_FOR_SIGNAL} finished attempts yet. Solve a few
        more problems and your strengths and weak spots will show up here.
        {lowDataTopics.length > 0 ? (
          <> Waiting on: {lowDataTopics.join(", ")}.</>
        ) : null}
      </p>
    );
  }

  const strongest = topics.slice(0, 2).map((topic) => topic.tag);
  const weakest = topics
    .slice(-2)
    .filter((topic) => !strongest.includes(topic.tag))
    .map((topic) => topic.tag)
    .reverse();

  return (
    <div className="flex flex-col gap-4">
      {/* The strength/weakness read is carried by text, not by color — the bars
          stay one hue. */}
      <p className="text-sm text-[#52514e] dark:text-[#c3c2b7]">
        Strongest: <span className="font-medium">{strongest.join(", ")}</span>
        {weakest.length > 0 ? (
          <>
            {" · "}Needs work:{" "}
            <span className="font-medium">{weakest.join(", ")}</span>
          </>
        ) : null}
      </p>

      <ul className="flex flex-col gap-3">
        {topics.map((topic) => (
          <li key={topic.tag} className="grid grid-cols-[8rem_1fr_auto] items-center gap-3">
            <span className="truncate text-sm" title={topic.tag}>
              {topic.tag}
            </span>

            {/* Thin mark, rounded only at the data end; the baseline end stays
                square against the track's origin. Must be block-level: an
                inline element ignores width and height entirely. */}
            <div className="h-2 w-full overflow-hidden rounded-[4px] bg-[#e1e0d9] dark:bg-[#2c2c2a]">
              <div
                className="h-full rounded-r-[4px] bg-[#2a78d6] dark:bg-[#3987e5]"
                style={{ width: `${Math.round(topic.solveRate * 100)}%` }}
              />
            </div>

            <span className="text-right text-sm tabular-nums">
              {Math.round(topic.solveRate * 100)}%
              <span className="ml-2 text-xs text-[#898781]">
                {topic.solved}/{topic.attempts}
                {topic.avgSolveMs !== null
                  ? ` · ${formatDuration(topic.avgSolveMs)} avg`
                  : ""}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {lowDataTopics.length > 0 ? (
        <p className="text-xs text-[#898781]">
          Not enough attempts yet: {lowDataTopics.join(", ")}
        </p>
      ) : null}
    </div>
  );
}
