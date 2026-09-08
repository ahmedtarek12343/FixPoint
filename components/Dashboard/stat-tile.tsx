/**
 * A headline number. Deliberately not a chart: one value is a stat tile, not a
 * one-bar bar chart.
 *
 * These are rendered as one hairline-divided block rather than four separate
 * cards (see StatRow below). Four boxes in a row is the most templated thing a
 * dashboard can do, and the border does no work that a single divider does not
 * already do better.
 *
 * The value uses proportional figures, not tabular: tabular-nums exists to
 * align digits down a column, and on a large standalone number it just looks
 * loose.
 */
export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 bg-surface p-5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-3xl font-semibold sm:text-4xl">{value}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

/** The hairline grid the tiles sit in. The background bleeds through the 1px
 *  gaps, which is what draws the dividers. */
export function StatRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-panel border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  );
}
