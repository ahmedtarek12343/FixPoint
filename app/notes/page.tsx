import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { SignInButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/lib/current-user";
import { getQueryClient } from "@/lib/query-client";
import { userNotesQueryOptions } from "@/lib/queries/notes";
import { NotesList } from "@/components/Notes/notes-list";

export default async function NotesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-4 p-8">
        <h1 className="text-2xl font-semibold">Notes</h1>
        <p className="opacity-70">Sign in to see your notes.</p>
        <SignInButton />
      </main>
    );
  }

  const queryClient = getQueryClient();
  await queryClient.query(userNotesQueryOptions(1));

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Notes</h1>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<p className="opacity-70">Loading notes…</p>}>
          <NotesList />
        </Suspense>
      </HydrationBoundary>
    </main>
  );
}
