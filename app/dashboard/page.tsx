import Link from "next/link";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { DownloadSimple, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getCurrentUser } from "@/lib/current-user";
import { getQueryClient } from "@/lib/query-client";
import { analyticsQueryOptions } from "@/lib/queries/analytics";
import { Dashboard } from "@/components/Dashboard/dashboard";
import { PageHeader, PageShell, SignedOutGate } from "@/components/ui/page";
import { SkeletonStats } from "@/components/ui/feedback";
import { QueryBoundary } from "@/components/ui/query-boundary";
import { buttonStyles } from "@/components/ui/button";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <SignedOutGate
        title="Dashboard"
        body="Your solve rate, your fastest times, and the topics you actually struggle with rather than the ones that feel hard."
      />
    );
  }

  const queryClient = getQueryClient();
  await queryClient.query(analyticsQueryOptions());

  return (
    <PageShell>
      <PageHeader
        title="Dashboard"
        description="Finished attempts only. Anything still running is left out so it cannot drag a rate down."
        actions={
          <>
            {/* Plain anchors: Content-Disposition on the response triggers the
                download, so no client-side JavaScript is involved. */}
            <a
              href="/api/export/problems"
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              <DownloadSimple size={16} />
              Problems CSV
            </a>
            <a
              href="/api/export/attempts"
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              <DownloadSimple size={16} />
              Attempts CSV
            </a>
            <Link
              href="/problems"
              className={buttonStyles({ variant: "ghost", size: "sm" })}
            >
              Problems
              <ArrowRight size={16} />
            </Link>
          </>
        }
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <QueryBoundary label="Your stats" fallback={<SkeletonStats />}>
          <Dashboard />
        </QueryBoundary>
      </HydrationBoundary>
    </PageShell>
  );
}
