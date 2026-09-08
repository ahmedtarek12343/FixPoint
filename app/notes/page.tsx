import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/current-user";
import { getQueryClient } from "@/lib/query-client";
import { userNotesQueryOptions } from "@/lib/queries/notes";
import { NotesList } from "@/components/Notes/notes-list";
import { PageHeader, PageShell, SignedOutGate } from "@/components/ui/page";
import { SkeletonRows } from "@/components/ui/feedback";
import { QueryBoundary } from "@/components/ui/query-boundary";

export const metadata = { title: "Notes" };

export default async function NotesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <SignedOutGate
        title="Notes"
        body="Write down the trick while it is still fresh. Notes are filed against the problem, so they are waiting for you the next time you open it."
      />
    );
  }

  const queryClient = getQueryClient();
  await queryClient.query(userNotesQueryOptions(1));

  return (
    <PageShell width="reading">
      <PageHeader
        title="Notes"
        description="Everything you have written down, newest first."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <QueryBoundary label="Your notes" fallback={<SkeletonRows rows={4} />}>
          <NotesList />
        </QueryBoundary>
      </HydrationBoundary>
    </PageShell>
  );
}
