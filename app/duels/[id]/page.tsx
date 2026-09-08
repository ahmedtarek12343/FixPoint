import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/current-user";
import { getQueryClient } from "@/lib/query-client";
import { getDuelState } from "@/lib/data/duels";
import { duelKeys } from "@/lib/queries/duels";
import { DuelRoom } from "@/components/Duels/duel-room";
import { PageShell, SignedOutGate } from "@/components/ui/page";
import { SkeletonLine } from "@/components/ui/feedback";
import { QueryBoundary } from "@/components/ui/query-boundary";

export default async function DuelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <SignedOutGate
        title="Join the duel"
        body="Sign in to take your place in this race. Both clocks start together once the host begins."
      />
    );
  }

  const duel = await getDuelState(user.id, id);
  if (!duel) notFound();

  const queryClient = getQueryClient();
  // setQueryData, not query(): the client's queryFn fetches a relative URL that
  // only resolves in the browser, so the cache is seeded from the direct
  // database read instead of by running that fetcher here.
  queryClient.setQueryData(duelKeys.detail(id), duel);

  return (
    <PageShell width="reading">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <QueryBoundary
          label="This duel"
          fallback={
            <div className="flex flex-col gap-6">
              <SkeletonLine className="h-10 w-1/2" />
              <div className="skeleton h-56 rounded-panel" />
            </div>
          }
        >
          <DuelRoom duelId={id} />
        </QueryBoundary>
      </HydrationBoundary>
    </PageShell>
  );
}
