import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { SignInButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/lib/current-user";
import { getQueryClient } from "@/lib/query-client";
import { userSolutionsQueryOptions } from "@/lib/queries/solutions";
import { SolutionsList } from "@/components/Solutions/solutions-list";

export default async function SolutionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-4 p-8">
        <h1 className="text-2xl font-semibold">Solutions</h1>
        <p className="opacity-70">Sign in to see your solutions.</p>
        <SignInButton />
      </main>
    );
  }

  const queryClient = getQueryClient();
  await queryClient.query(userSolutionsQueryOptions(1));

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Solutions</h1>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<p className="opacity-70">Loading solutions…</p>}>
          <SolutionsList />
        </Suspense>
      </HydrationBoundary>
    </main>
  );
}
