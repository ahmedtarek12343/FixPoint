import { formatDuration } from "@/lib/format";
import type { SolvePoint } from "@/lib/actions/analytics";

const WIDTH = 640;
const HEIGHT = 180;
const PAD = { top: 16, right: 12, bottom: 24, left: 52 };

const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

/**
 * Time-to-solve over the last N solved attempts — change over time, so a line.
 * One series, so no legend: the heading names it.
 *
 * Strokes carry `vector-effect="non-scaling-stroke"` so the 2px line stays 2px
 * however wide the viewBox is stretched, instead of thickening on big screens.
 */
export function SolveTrend({ points }: { points: SolvePoint[] }) {
  if (points.length === 0) {
    return (
      <p className="text-sm text-[#898781]">
        Solve a problem and your times will chart here.
      </p>
    );
  }

  // `|| 1` guards the scale divide: a set of zero-length attempts would
  // otherwise put NaN in every coordinate and render nothing.
  const max = Math.max(...points.map((point) => point.durationMs)) || 1;
  const fastest = points.reduce((best, point) =>
    point.durationMs < best.durationMs ? point : best
  );

  const x = (index: number) =>
    points.length === 1
      ? PAD.left + PLOT_W / 2
      : PAD.left + (index / (points.length - 1)) * PLOT_W;
  const y = (durationMs: number) =>
    PAD.top + PLOT_H - (durationMs / max) * PLOT_H;

  const line = points
    .map((point, index) => `${x(index)},${y(point.durationMs)}`)
    .join(" ");

  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img">
        <title>Time to solve, oldest to most recent</title>

        {/* Recessive hairline grid — solid, never dashed. */}
        {[0, 0.5, 1].map((fraction) => {
          const lineY = PAD.top + PLOT_H * fraction;
          return (
            <line
              key={fraction}
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={lineY}
              y2={lineY}
              className="stroke-[#e1e0d9] dark:stroke-[#2c2c2a]"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* Y scale: only the extremes are labelled. */}
        <text
          x={PAD.left - 8}
          y={PAD.top + 4}
          textAnchor="end"
          className="fill-[#898781] text-[11px] tabular-nums"
        >
          {formatDuration(max)}
        </text>
        <text
          x={PAD.left - 8}
          y={PAD.top + PLOT_H + 4}
          textAnchor="end"
          className="fill-[#898781] text-[11px] tabular-nums"
        >
          0:00
        </text>

        {points.length > 1 ? (
          <polyline
            points={line}
            fill="none"
            className="stroke-[#2a78d6] dark:stroke-[#3987e5]"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}

        {points.map((point, index) => (
          <circle
            key={`${point.at}-${index}`}
            cx={x(index)}
            cy={y(point.durationMs)}
            r={4}
            className="fill-[#2a78d6] dark:fill-[#3987e5]"
          >
            {/* Enhances, never gates — the same values are in the table below. */}
            <title>
              {`${point.problemTitle}: ${formatDuration(point.durationMs)} on ${new Date(
                point.at
              ).toLocaleDateString()}`}
            </title>
          </circle>
        ))}

        {/* Direct-label the extreme only, not every point. */}
        <text
          x={x(points.indexOf(fastest))}
          y={y(fastest.durationMs) - 10}
          textAnchor="middle"
          className="fill-[#52514e] text-[11px] tabular-nums dark:fill-[#c3c2b7]"
        >
          {formatDuration(fastest.durationMs)}
        </text>
      </svg>

      <figcaption className="flex justify-between text-xs text-[#898781]">
        <span>{new Date(points[0].at).toLocaleDateString()}</span>
        <span>
          {points.length} solved attempt{points.length === 1 ? "" : "s"} · fastest{" "}
          {formatDuration(fastest.durationMs)}
        </span>
        <span>
          {new Date(points[points.length - 1].at).toLocaleDateString()}
        </span>
      </figcaption>
    </figure>
  );
}
