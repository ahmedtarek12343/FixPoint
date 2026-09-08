import Link from "next/link";

/**
 * Deliberately not a four-column link farm. This product has five routes and
 * two legal pages; a footer that pretends otherwise is filler.
 */
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2 font-semibold tracking-tight">
            <span
              aria-hidden="true"
              className="relative size-4 overflow-hidden rounded-[4px] border border-border-strong bg-surface"
            >
              <span className="absolute inset-x-0 bottom-0 h-2/5 bg-accent" />
            </span>
            leeeto
          </span>
          <p className="text-sm text-muted">
            Practice with the clock running.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link href="/problems" className="text-muted transition-colors hover:text-foreground">
            Problems
          </Link>
          <Link href="/dashboard" className="text-muted transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/duels" className="text-muted transition-colors hover:text-foreground">
            Duels
          </Link>
          <Link href="/privacy" className="text-muted transition-colors hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="text-muted transition-colors hover:text-foreground">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
