"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

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

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4 border-t border-border pt-4"
    >
      <p data-numeric className="text-sm text-muted">
        Page {page} of {pageCount}
        <span className="ml-2">({total} total)</span>
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1 || isPending}
          onClick={() => onPageChange(page - 1)}
        >
          <CaretLeft size={14} weight="bold" />
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pageCount || isPending}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <CaretRight size={14} weight="bold" />
        </Button>
      </div>
    </nav>
  );
}
