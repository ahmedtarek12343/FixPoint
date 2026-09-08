import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { getQueryClient } from "@/lib/query-client";
import { duelHistoryQueryOptions } from "@/lib/queries/duels";
import { DuelLobby } from "@/components/Duels/duel-lobby";
import { DuelHistory } from "@/components/Duels/duel-history";
import { PageHeader, PageShell, SignedOutGate } from "@/components/ui/page";
import { Section } from "@/components/ui/surface";
import { SkeletonRows } from "@/components/ui/feedback";
import { QueryBoundary } from "@/components/ui/query-boundary";

export const metadata = { title: "Duels" };

export default async function DuelsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <SignedOutGate
        title="Duels"
        body="Share a six-character code and race someone on the same problem. Both clocks start on the same second."
      />
    );
  }

  // Plain props rather than a query: this list only fills a <select> and never
  // changes while the page is open, so it does not need a cache entry.
  const problems = await prisma.problem.findMany({
    where: { inLibraries: { some: { userId: user.id } } },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });

  const queryClient = getQueryClient();
  await queryClient.query(duelHistoryQueryOptions(1));

  return (
    <PageShell>
      <PageHeader
        title="Duels"
        description="Host a race on a problem in your library, or join one with a code."
      />

      <DuelLobby problems={problems} />

      <Section title="History">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <QueryBoundary label="Duel history" fallback={<SkeletonRows rows={3} />}>
            <DuelHistory />
          </QueryBoundary>
        </HydrationBoundary>
      </Section>
    </PageShell>
  );
}
