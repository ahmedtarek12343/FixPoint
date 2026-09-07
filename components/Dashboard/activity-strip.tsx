import type { DayActivity } from "@/lib/actions/analytics";

/** Renders "2026-09-06" as "Sep 6". */
function shortDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Last 14 days of attempts. One series, one hue; bars anchored to the baseline
 * and rounded at the data end only. The busiest day is direct-labeled rather
 * than putting a number on all fourteen.
 *
 * Every column is `h-full` inside a fixed-height row on purpose: a percentage
 * height only resolves against a parent with a definite height, so columns that
 * size to their content would collapse every bar to nothing.
 */
export function ActivityStrip({ activity }: { activity: DayActivity[] }) {
  const busiest = Math.max(...activity.map((day) => day.attempts), 0);

  if (busiest === 0) {
    return (
      <p className="text-sm text-[#898781]">
        No attempts in the last {activity.length} days.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-28 items-stretch gap-1">
        {activity.map((day) => (
          <div
            key={day.date}
            className="flex h-full flex-1 flex-col justify-end gap-1"
            // Enhances, never gates: the same counts are in the tables below.
            title={`${shortDate(day.date)}: ${day.attempts} attempt${
              day.attempts === 1 ? "" : "s"
            }, ${day.solved} solved`}
          >
            {day.attempts === busiest ? (
              <span className="text-center text-xs tabular-nums text-[#898781]">
                {day.attempts}
              </span>
            ) : null}

            <div
              className="w-full rounded-t-[4px] bg-[#2a78d6] dark:bg-[#3987e5]"
              style={{
                height: day.attempts
                  ? `${Math.max((day.attempts / busiest) * 100, 8)}%`
                  : "2px",
                opacity: day.attempts ? 1 : 0.2,
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between text-xs text-[#898781]">
        <span>{shortDate(activity[0].date)}</span>
        <span>{shortDate(activity[activity.length - 1].date)}</span>
      </div>
    </div>
  );
}
