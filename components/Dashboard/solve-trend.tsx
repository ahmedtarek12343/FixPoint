"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { formatDuration } from "@/lib/format";
import type { SolvePoint } from "@/lib/actions/analytics";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const WIDTH = 640;
const HEIGHT = 180;
const PAD = { top: 16, right: 12, bottom: 24, left: 52 };

const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

/**
 * Time-to-solve over the last N solved attempts: change over time, so a line.
 * One series, so no legend; the heading names it.
 *
 * Strokes carry `vector-effect="non-scaling-stroke"` so the 2px line stays 2px
 * however wide the viewBox is stretched, instead of thickening on big screens.
 *
 * Interaction: the whole plot is one pointer target that snaps to the nearest
 * point, rather than fourteen tiny circles you have to hit exactly. Arrow keys
 * walk the series once the chart has focus, and the readout is an HTML element
 * over the chart rather than SVG <text>, so it can wrap, and it can never be
 * clipped by the viewBox at the edges of the series.
 */
export function SolveTrend({ points }: { points: SolvePoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPolylineElement>(null);

  // Draws the line on as the chart scrolls in, then fades the points in behind
  // it. The motion is doing real work here: a time series read left to right is
  // exactly what a left-to-right draw communicates.
  useGSAP(
    () => {
      if (!root.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top 85%", once: true },
      });

      if (line.current) {
        const length = line.current.getTotalLength();
        tl.fromTo(
          line.current,
          { strokeDasharray: length, strokeDashoffset: length },
          {
            strokeDashoffset: 0,
            duration: 1.1,
            ease: "power2.inOut",
            // Cleared so the dash pattern does not linger and interfere with
            // the stroke once the draw is finished.
            clearProps: "strokeDasharray,strokeDashoffset",
          }
        );
      }

      const dots = root.current.querySelectorAll("[data-dot]");
      if (dots.length) {
        tl.from(
          dots,
          { opacity: 0, scale: 0, transformOrigin: "center", duration: 0.3, stagger: 0.03 },
          "-=0.7"
        );
      }
    },
    { dependencies: [points.length], scope: root }
  );

  if (points.length === 0) {
    return (
      <p className="text-sm text-muted">
        Solve a problem and your times will chart here.
      </p>
    );
  }

  // `|| 1` guards the scale divide: a set of zero-length attempts would
  // otherwise put NaN in every coordinate and render nothing.
  const max = Math.max(...points.map((point) => point.durationMs)) || 1;
  const fastestIndex = points.reduce(
    (best, point, index) =>
      point.durationMs < points[best].durationMs ? index : best,
    0
  );

  const x = (index: number) =>
    points.length === 1
      ? PAD.left + PLOT_W / 2
      : PAD.left + (index / (points.length - 1)) * PLOT_W;
  const y = (durationMs: number) => PAD.top + PLOT_H - (durationMs / max) * PLOT_H;

  const polyline = points
    .map((point, index) => `${x(index)},${y(point.durationMs)}`)
    .join(" ");

  /** Maps a pointer position to the nearest point index. */
  const pointerToIndex = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    // The SVG scales to its container, so the pointer has to be converted back
    // into viewBox units before it can be compared with the plotted x values.
    const viewX = ((event.clientX - box.left) / box.width) * WIDTH;
    const ratio = (viewX - PAD.left) / PLOT_W;
    const index = Math.round(ratio * (points.length - 1));
    return Math.min(Math.max(index, 0), points.length - 1);
  };

  const shownIndex = active ?? fastestIndex;
  const shown = points[shownIndex];

  return (
    <figure ref={root} className="flex flex-col gap-2">
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full touch-none"
          role="img"
          tabIndex={0}
          aria-label={`Time to solve across ${points.length} attempts, oldest first. Fastest ${formatDuration(points[fastestIndex].durationMs)}.`}
          onPointerMove={(event) => setActive(pointerToIndex(event))}
          onPointerLeave={() => setActive(null)}
          onBlur={() => setActive(null)}
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            const step = event.key === "ArrowRight" ? 1 : -1;
            setActive((current) => {
              const next = (current ?? fastestIndex) + step;
              return Math.min(Math.max(next, 0), points.length - 1);
            });
          }}
        >
          <title>Time to solve, oldest to most recent</title>

          {/* Recessive hairline grid, solid, never dashed. */}
          {[0, 0.5, 1].map((fraction) => {
            const lineY = PAD.top + PLOT_H * fraction;
            return (
              <line
                key={fraction}
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={lineY}
                y2={lineY}
                className="stroke-border"
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
            className="fill-muted text-[11px] tabular-nums"
          >
            {formatDuration(max)}
          </text>
          <text
            x={PAD.left - 8}
            y={PAD.top + PLOT_H + 4}
            textAnchor="end"
            className="fill-muted text-[11px] tabular-nums"
          >
            0:00
          </text>

          {/* Crosshair for the point being read. */}
          {active !== null && (
            <line
              x1={x(active)}
              x2={x(active)}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              className="stroke-accent"
              strokeWidth={1}
              strokeOpacity={0.45}
              vectorEffect="non-scaling-stroke"
            />
          )}

          {points.length > 1 && (
            <polyline
              ref={line}
              points={polyline}
              fill="none"
              className="stroke-accent"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {points.map((point, index) => (
            <circle
              key={`${point.at}-${index}`}
              data-dot
              cx={x(index)}
              cy={y(point.durationMs)}
              r={index === shownIndex ? 6 : 4}
              className={
                index === shownIndex ? "fill-accent stroke-background" : "fill-accent"
              }
              strokeWidth={index === shownIndex ? 2 : 0}
            />
          ))}
        </svg>

        {/* HTML readout rather than SVG text: it can wrap, it inherits the page
            font, and clamping keeps it inside the box at both ends. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-control border border-border bg-surface px-2.5 py-1.5 text-xs shadow-md transition-[left] duration-100"
          style={{
            left: `${Math.min(Math.max((x(shownIndex) / WIDTH) * 100, 12), 88)}%`,
          }}
        >
          <p className="max-w-40 truncate font-medium">{shown.problemTitle}</p>
          <p data-numeric className="text-muted">
            {formatDuration(shown.durationMs)}
            {" · "}
            {new Date(shown.at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <figcaption className="flex justify-between text-xs text-muted">
        <span>{new Date(points[0].at).toLocaleDateString()}</span>
        <span>
          {points.length} solved attempt{points.length === 1 ? "" : "s"} ·
          fastest {formatDuration(points[fastestIndex].durationMs)}
        </span>
        <span>{new Date(points[points.length - 1].at).toLocaleDateString()}</span>
      </figcaption>
    </figure>
  );
}
