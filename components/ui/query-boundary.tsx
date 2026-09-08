"use client";

import { Component, Suspense, ViewTransition, type ReactNode } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ArrowClockwise, PlugsConnected } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

/**
 * Suspense and an error boundary, always together.
 *
 * `useSuspenseQuery` has two exits: it suspends while loading and it THROWS on
 * failure. A bare <Suspense> only handles the first, so before this existed a
 * dropped connection on any page took out the whole route with React's default
 * blank screen. Every place that suspends now uses this instead, so the two
 * exits are handled in one place and cannot drift apart.
 *
 * The reset wiring is the part worth understanding: React Query caches the
 * failure, so remounting the subtree alone would rethrow the same error
 * immediately. `QueryErrorResetBoundary` hands down a `reset` that clears the
 * cached error, and the boundary calls it and then clears its own state, so
 * "Try again" genuinely refetches instead of redrawing the same message.
 */

type FallbackProps = { error: Error; retry: () => void };

class ErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void; fallback: (props: FallbackProps) => ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Kept: a boundary that swallows the stack makes production failures
    // unreadable. Swap for a reporting call when there is somewhere to send it.
    console.error("[query-boundary]", error);
  }

  render() {
    if (this.state.error) {
      return this.props.fallback({
        error: this.state.error,
        retry: () => {
          this.props.onReset();
          this.setState({ error: null });
        },
      });
    }
    return this.props.children;
  }
}

/**
 * The default failure UI.
 *
 * It names what failed and offers the way out, rather than apologising. The
 * raw message is shown because every error that reaches here is one of ours:
 * an action throwing "Unauthorized" or a rate limit saying how long to wait,
 * both of which are more useful than "Something went wrong".
 */
function DefaultFallback({
  error,
  retry,
  label,
}: FallbackProps & { label: string }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-panel border border-danger/25 bg-danger-wash px-6 py-8">
      <span
        className="flex size-11 items-center justify-center rounded-control bg-surface text-danger"
        aria-hidden="true"
      >
        <PlugsConnected size={22} />
      </span>

      <div className="flex flex-col gap-1.5">
        <p className="text-lg font-semibold">{label} could not load</p>
        <p className="max-w-[52ch] text-sm text-muted">{error.message}</p>
      </div>

      <Button variant="secondary" onClick={retry}>
        <ArrowClockwise size={16} weight="bold" />
        Try again
      </Button>
    </div>
  );
}

export function QueryBoundary({
  children,
  fallback,
  /** Names the thing that failed, e.g. "Your problems". */
  label = "This section",
  errorFallback,
}: {
  children: ReactNode;
  /** The loading skeleton. */
  fallback: ReactNode;
  label?: string;
  /** Override the failure UI where the default frame does not fit. */
  errorFallback?: (props: FallbackProps) => ReactNode;
}) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallback={(props) =>
            errorFallback ? (
              errorFallback(props)
            ) : (
              <DefaultFallback {...props} label={label} />
            )
          }
        >
          <Suspense
            fallback={
              // The skeleton yields, the content arrives from just below it.
              // See the .skeleton-out / .content-in rules in globals.css.
              <ViewTransition exit="skeleton-out">{fallback}</ViewTransition>
            }
          >
            {/* default="none" so this boundary sits out unrelated transitions,
                such as a route change happening elsewhere on the page. */}
            <ViewTransition enter="content-in" default="none">
              {children}
            </ViewTransition>
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
