import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { PageShell } from "@/components/ui/page";
import { buttonStyles } from "@/components/ui/button";

export const metadata = { title: "Not found" };

/**
 * Every dead end needs a way out, so this offers the three routes someone is
 * most likely to have been aiming for rather than a bare apology.
 */
export default function NotFound() {
  return (
    <PageShell width="reading">
      <div className="flex flex-col items-start gap-6 py-16">
        <p data-numeric className="font-mono text-6xl font-medium text-accent">
          404
        </p>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold sm:text-4xl">
            That page is not here
          </h1>
          <p className="max-w-[52ch] text-muted">
            The link may be stale, or the problem or duel behind it was deleted.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/problems" className={buttonStyles()}>
            Your problems
            <ArrowRight size={16} weight="bold" />
          </Link>
          <Link
            href="/dashboard"
            className={buttonStyles({ variant: "secondary" })}
          >
            Dashboard
          </Link>
          <Link href="/" className={buttonStyles({ variant: "ghost" })}>
            Home
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
