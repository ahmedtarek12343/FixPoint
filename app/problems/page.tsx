import { getCurrentUser } from "@/lib/current-user";
import { getQueryClient } from "@/lib/query-client";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import {
  problemFilterOptionsQueryOptions,
  problemsQueryOptions,
} from "@/lib/queries/problems";
import { AddProblemForm } from "@/components/Problems/add-problem-form";
import { ProblemList } from "@/components/Problems/problem-list";
import { PageHeader, PageShell, SignedOutGate } from "@/components/ui/page";
import { Section } from "@/components/ui/surface";
import { SkeletonRows } from "@/components/ui/feedback";
import { QueryBoundary } from "@/components/ui/query-boundary";

export const metadata = { title: "Problems" };

export default async function ProblemsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <SignedOutGate
        title="Your problems"
        body="Paste a LeetCode or Codeforces link, start the timer, and every attempt after that is recorded against it."
      />
    );
  }

  const queryClient = getQueryClient();
  // Runs the query function in-process, not over HTTP, so the client's
  // useSuspenseQuery hydrates from this instead of firing a queued POST.
  // `query` replaces the deprecated `prefetchQuery`; unlike it, this one
  // throws, so a broken fetcher surfaces instead of silently refetching.
  // Both run in parallel: the sequential-dispatch rule that applies to Server
  // Actions is a client-side dispatcher rule, not a server one.
  await Promise.all([
    queryClient.query(problemsQueryOptions()),
    queryClient.query(problemFilterOptionsQueryOptions()),
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Problems"
        description="Paste a link. Difficulty and topics are pulled from the source, so you only type what it cannot tell us."
      />

      <AddProblemForm />

      <Section title="Your library">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <QueryBoundary label="Your problems" fallback={<SkeletonRows />}>
            <ProblemList />
          </QueryBoundary>
        </HydrationBoundary>
      </Section>
    </PageShell>
  );
}
