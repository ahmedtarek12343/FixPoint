import { Suspense } from "react";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { SignInButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/lib/current-user";
import { getQueryClient } from "@/lib/query-client";
import { problemDetailQueryOptions } from "@/lib/queries/attempts";
import { problemNotesQueryOptions } from "@/lib/queries/notes";
import { problemSolutionsQueryOptions } from "@/lib/queries/solutions";
import { snapshotsQueryOptions } from "@/lib/queries/snapshots";
import { ProblemDetail } from "@/components/Problems/problem-detail";

export default async function ProblemIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-4 p-8">
        <p className="opacity-70">Sign in to start the timer on this problem.</p>
        <SignInButton />
      </main>
    );
  }

  const queryClient = getQueryClient();
  // Three reads, but they run in parallel here on the server — the sequential
  // dispatch that applies to Server Actions is a client-side dispatcher rule,
  // not a server one. The detail call does double duty: it warms the cache and
  // tells us whether the problem exists at all.
  const [problem] = await Promise.all([
    queryClient.query(problemDetailQueryOptions(id)),
    queryClient.query(problemNotesQueryOptions(id)),
    queryClient.query(problemSolutionsQueryOptions(id)),
    queryClient.query(snapshotsQueryOptions(id)),
  ]);
  if (!problem) notFound();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-8">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<p className="opacity-70">Loading…</p>}>
          <ProblemDetail problemId={id} />
        </Suspense>
      </HydrationBoundary>
    </main>
  );
}
