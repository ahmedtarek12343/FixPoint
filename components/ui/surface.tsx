import type { ReactNode } from "react";

/**
 * Grouping primitives.
 *
 * A card is not the default way to group things. Most groups on this page are
 * better served by space or a single hairline, so there are three levels here
 * and `Panel` is the one you should reach for least:
 *
 *   Section  - space only. No box. The default.
 *   Rows     - one hairline between items, none above the first or below the
 *              last. A border on every row is what makes a list look like a
 *              spreadsheet.
 *   Panel    - an actual raised surface. Use it only where elevation carries
 *              meaning: a running timer, an editor, a live duel.
 */

export function Section({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex flex-col gap-5 ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            {title && (
              <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
            )}
            {description && (
              <p className="max-w-[60ch] text-sm text-muted">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Panel({
  children,
  className = "",
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  /** "live" tints the panel with the accent while something is running. */
  tone?: "default" | "live";
}) {
  const toneClass =
    tone === "live"
      ? "border-accent/35 bg-accent-wash"
      : "border-border bg-surface";

  return (
    <div
      className={`rounded-panel border ${toneClass} shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** A hairline-separated list. No border above the first row or below the last. */
export function Rows({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ul className={`flex flex-col divide-y divide-border ${className}`}>
      {children}
    </ul>
  );
}
