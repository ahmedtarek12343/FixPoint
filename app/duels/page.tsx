import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { SignInButton } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { getQueryClient } from "@/lib/query-client";
import { duelHistoryQueryOptions } from "@/lib/queries/duels";
import { DuelLobby } from "@/components/Duels/duel-lobby";
import { DuelHistory } from "@/components/Duels/duel-history";

export default async function DuelsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-4 p-8">
        <h1 className="text-2xl font-semibold">Duels</h1>
        <p className="opacity-70">Sign in to duel someone.</p>
        <SignInButton />
      </main>
    );
  }

  // Plain props rather than a query: this list only fills a <select> and never
  // changes while the page is open, so it doesn't need a cache entry.
  const problems = await prisma.problem.findMany({
    where: { inLibraries: { some: { userId: user.id } } },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });

  const queryClient = getQueryClient();
  await queryClient.query(duelHistoryQueryOptions(1));

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 p-8">
      <h1 className="text-2xl font-semibold">Duels</h1>

      <DuelLobby problems={problems} />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">History</h2>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense fallback={<p className="opacity-70">Loading duels…</p>}>
            <DuelHistory />
          </Suspense>
        </HydrationBoundary>
      </section>
    </main>
  );
}
