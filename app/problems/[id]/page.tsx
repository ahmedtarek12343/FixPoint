import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/current-user";
import { getQueryClient } from "@/lib/query-client";
import { problemDetailQueryOptions } from "@/lib/queries/attempts";
import { problemNotesQueryOptions } from "@/lib/queries/notes";
import { problemSolutionsQueryOptions } from "@/lib/queries/solutions";
import { snapshotsQueryOptions } from "@/lib/queries/snapshots";
import { ProblemDetail } from "@/components/Problems/problem-detail";
import { PageShell, SignedOutGate } from "@/components/ui/page";
import { SkeletonLine, SkeletonRows } from "@/components/ui/feedback";
import { QueryBoundary } from "@/components/ui/query-boundary";

export default async function ProblemIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <SignedOutGate
        title="Start the timer"
        body="Sign in to time this problem, keep notes on it, and save the solution that worked."
      />
    );
  }

  const queryClient = getQueryClient();
  // Four reads, but they run in parallel here on the server. The sequential
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
    <PageShell>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <QueryBoundary
          label="This problem"
          fallback={
            <div className="flex flex-col gap-8">
              <SkeletonLine className="h-10 w-2/3 max-w-md" />
              <div className="skeleton h-40 rounded-panel" />
              <SkeletonRows rows={3} />
            </div>
          }
        >
          <ProblemDetail problemId={id} />
        </QueryBoundary>
      </HydrationBoundary>
    </PageShell>
  );
}
