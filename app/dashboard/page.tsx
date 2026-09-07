import { Suspense } from "react";
import Link from "next/link";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { SignInButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/lib/current-user";
import { getQueryClient } from "@/lib/query-client";
import { analyticsQueryOptions } from "@/lib/queries/analytics";
import { Dashboard } from "@/components/Dashboard/dashboard";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-4 p-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="opacity-70">Sign in to see your stats.</p>
        <SignInButton />
      </main>
    );
  }

  const queryClient = getQueryClient();
  await queryClient.query(analyticsQueryOptions());

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <div className="flex flex-wrap items-center gap-2">
          {/* Plain links: Content-Disposition on the response triggers the
              download, so no client-side JS is involved. */}
          <a
            href="/api/export/problems"
            className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-surface"
          >
            Export problems (CSV)
          </a>
          <a
            href="/api/export/attempts"
            className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-surface"
          >
            Export attempts (CSV)
          </a>
          <Link
            href="/problems"
            className="text-sm underline underline-offset-4 text-muted hover:text-foreground"
          >
            Problems →
          </Link>
        </div>
      </div>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<p className="opacity-70">Loading stats…</p>}>
          <Dashboard />
        </Suspense>
      </HydrationBoundary>
    </main>
  );
}
