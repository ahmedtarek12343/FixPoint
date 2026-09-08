import type { ReactNode } from "react";
import { Warning } from "@phosphor-icons/react/dist/ssr";

/**
 * Loading, empty and error states.
 *
 * A spinner tells you nothing about what is arriving. These skeletons match the
 * shape of the real content, so the layout does not jump when data lands and
 * the user can already see what kind of thing is coming.
 */

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`skeleton h-4 rounded-chip ${className}`} />;
}

/** Stands in for a paginated table while the first page loads. */
export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-px" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-b border-border py-4"
        >
          <SkeletonLine className="w-1/3" />
          <SkeletonLine className="w-16" />
          <SkeletonLine className="ml-auto w-20" />
        </div>
      ))}
    </div>
  );
}

/** Stands in for the dashboard's tile row plus its first chart. */
export function SkeletonStats() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      <div className="grid gap-px overflow-hidden rounded-panel border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex flex-col gap-3 bg-surface p-5">
            <SkeletonLine className="w-20" />
            <SkeletonLine className="h-8 w-24" />
          </div>
        ))}
      </div>
      <div className="skeleton h-48 rounded-panel" />
    </div>
  );
}

/**
 * An empty list is the first thing a new user sees, so it gets a real
 * composition and a way forward rather than one grey sentence.
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-panel border border-dashed border-border-strong px-6 py-10 sm:px-10 sm:py-14">
      <span
        className="flex size-11 items-center justify-center rounded-control bg-accent-wash text-accent"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="text-lg font-semibold">{title}</p>
        <p className="max-w-[52ch] text-sm text-muted">{body}</p>
      </div>
      {action}
    </div>
  );
}

/** Inline, next to the thing that failed. Never a toast, never window.alert. */
export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-control bg-danger-wash px-3 py-2 text-sm text-danger"
    >
      <Warning size={16} weight="bold" className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
