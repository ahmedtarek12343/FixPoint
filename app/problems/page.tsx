import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { SignInButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/lib/current-user";
import { getQueryClient } from "@/lib/query-client";
import { problemsQueryOptions } from "@/lib/queries/problems";
import { AddProblemForm } from "@/components/Problems/add-problem-form";
import { ProblemList } from "@/components/Problems/problem-list";

export default async function ProblemsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-4 p-8">
        <h1 className="text-2xl font-semibold">Your problems</h1>
        <p className="opacity-70">Sign in to start tracking problems.</p>
        <SignInButton />
      </main>
    );
  }

  const queryClient = getQueryClient();
  // Runs the query function in-process, not over HTTP, so the client's
  // useSuspenseQuery hydrates from this instead of firing a queued POST.
  // `query` replaces the deprecated `prefetchQuery`; unlike it, this one
  // throws, and a prefetch failing shouldn't take the page down — a failed
  // query is left out of dehydrate() and the client just fetches it itself.
  await queryClient.query(problemsQueryOptions());

  return (
    <main className="mx-auto flex container flex-col gap-10 p-8">
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Add a problem</h1>
        <AddProblemForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Your problems</h2>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense fallback={<p className="opacity-70">Loading problems…</p>}>
            <ProblemList />
          </Suspense>
        </HydrationBoundary>
      </section>
    </main>
  );
}
