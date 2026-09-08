import type { ReactNode } from "react";
import { SignInButton } from "@clerk/nextjs";
import { buttonStyles } from "@/components/ui/button";

/**
 * The frame every signed-in page sits in.
 *
 * All six product pages were repeating the same container width, the same
 * padding, the same heading size and the same signed-out block with slightly
 * different wording each time. One shell means one place to change the rhythm,
 * and it guarantees the skip link's target exists on every route.
 */

export function PageShell({
  children,
  width = "wide",
}: {
  children: ReactNode;
  width?: "wide" | "reading";
}) {
  return (
    <main
      id="main"
      className={`mx-auto flex w-full flex-col gap-10 px-5 py-10 sm:px-8 sm:py-14 ${
        width === "wide" ? "max-w-6xl" : "max-w-4xl"
      }`}
    >
      {children}
    </main>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        {description && (
          <p className="max-w-[58ch] text-muted">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

/** The signed-out view of any protected page. */
export function SignedOutGate({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <PageShell width="reading">
      <div className="flex flex-col items-start gap-5 py-10">
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        <p className="max-w-[52ch] text-muted">{body}</p>
        <span className={buttonStyles({ size: "lg" })}>
          <SignInButton>Start practising</SignInButton>
        </span>
      </div>
    </PageShell>
  );
}
