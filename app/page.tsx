import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import { Reveal } from "@/components/utils/reveal";

const FEATURES = [
  {
    title: "One timer, no stopwatch tab",
    body: "Start a problem here and it opens on LeetCode or Codeforces in a new tab while the clock runs. Solve it or give up — either way it's recorded.",
  },
  {
    title: "Your times, not a spreadsheet",
    body: "Every attempt is stored with its duration, so your personal best on a problem is a query, not a cell you forgot to update.",
  },
  {
    title: "Weak spots, found for you",
    body: "Attempts are tagged by topic, so the dashboard tells you which topics you actually struggle with instead of which ones feel hard.",
  },
  {
    title: "A whiteboard that stays put",
    body: "Sketch the tree or the pointers right under the problem. It saves itself and it's still there next time you come back.",
  },
  {
    title: "Race a friend",
    body: "Share a six-character join code, both start on the same problem at the same second, and first to finish takes it.",
  },
  {
    title: "Notes and solutions kept together",
    body: "Write down the trick while it's fresh and save the code that worked, filed against the problem instead of lost in a gist.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-20 px-8 py-20">
      <Reveal className="flex flex-col items-start gap-6" stagger={0.09}>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
          Practice tracker for LeetCode &amp; Codeforces
        </span>

        <h1 className="max-w-3xl text-4xl leading-[1.05] font-semibold sm:text-6xl">
          Practice problems with the clock running.
        </h1>

        <p className="max-w-xl text-lg text-muted">
          Timing, notes, a whiteboard, topic analytics and head-to-head duels in
          one place — instead of a problem tab, a stopwatch, a scratch pad and a
          spreadsheet you stopped updating three weeks ago.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Show when="signed-in">
            <Link
              href="/problems"
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-strong"
            >
              Go to your problems
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface"
            >
              See your stats
            </Link>
          </Show>

          <Show when="signed-out">
            <span className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-contrast">
              <SignInButton />
            </span>
          </Show>
        </div>
      </Reveal>

      <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5 transition-transform hover:-translate-y-0.5"
          >
            <h2 className="text-base font-medium">{feature.title}</h2>
            <p className="text-sm text-muted">{feature.body}</p>
          </div>
        ))}
      </Reveal>
    </main>
  );
}
