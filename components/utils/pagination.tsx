"use client";

/**
 * Page controls for any paginated list.
 *
 * `isPending` comes from the caller's `useTransition`: page changes are wrapped
 * in a transition so React keeps the current rows on screen while the next page
 * loads, instead of dropping to the Suspense fallback and flashing the layout.
 */
export function Pagination({
  page,
  pageCount,
  total,
  isPending,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  isPending?: boolean;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  const buttonClass =
    "rounded-md border border-black/15 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10";

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm opacity-60">
        Page {page} of {pageCount}
        <span className="ml-2 tabular-nums">({total} total)</span>
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          disabled={page <= 1 || isPending}
          onClick={() => onPageChange(page - 1)}
        >
          ← Prev
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={page >= pageCount || isPending}
          onClick={() => onPageChange(page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
