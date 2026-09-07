import { Suspense } from "react";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { SignInButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/lib/current-user";
import { getQueryClient } from "@/lib/query-client";
import { getDuelState } from "@/lib/data/duels";
import { duelKeys } from "@/lib/queries/duels";
import { DuelRoom } from "@/components/Duels/duel-room";

export default async function DuelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-4 p-8">
        <p className="opacity-70">Sign in to join this duel.</p>
        <SignInButton />
      </main>
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
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-8">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<p className="opacity-70">Loading duel…</p>}>
          <DuelRoom duelId={id} />
        </Suspense>
      </HydrationBoundary>
    </main>
  );
}
