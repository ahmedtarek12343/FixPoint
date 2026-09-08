import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/current-user";
import { getQueryClient } from "@/lib/query-client";
import { userSolutionsQueryOptions } from "@/lib/queries/solutions";
import { SolutionsList } from "@/components/Solutions/solutions-list";
import { PageHeader, PageShell, SignedOutGate } from "@/components/ui/page";
import { SkeletonRows } from "@/components/ui/feedback";
import { QueryBoundary } from "@/components/ui/query-boundary";

export const metadata = { title: "Solutions" };

export default async function SolutionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <SignedOutGate
        title="Solutions"
        body="Save the code that actually worked, in the language you wrote it in, filed against the problem instead of lost in a gist."
      />
    );
  }

  const queryClient = getQueryClient();
  await queryClient.query(userSolutionsQueryOptions(1));

  return (
    <PageShell width="reading">
      <PageHeader
        title="Solutions"
        description="Every solution you have saved, newest first."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <QueryBoundary label="Your solutions" fallback={<SkeletonRows rows={4} />}>
          <SolutionsList />
        </QueryBoundary>
      </HydrationBoundary>
    </PageShell>
  );
}
