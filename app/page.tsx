import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/utils/reveal";
import { LoopDemo } from "@/components/Landing/loop-demo";
import { buttonStyles } from "@/components/ui/button";
import { Magnetic, SpotlightGroup } from "@/components/utils/interactive";

/** Sample topics for the analytics tile. Ordered worst to best, as the real
 *  dashboard orders them. Lengths are illustrative, not measured data. */
const SAMPLE_TOPICS = [
  { name: "dynamic programming", fill: 28 },
  { name: "graphs", fill: 46 },
  { name: "two pointers", fill: 81 },
];

const DOES = [
  "Times every attempt from the server clock, not the browser's",
  "Keeps your personal best per problem without you tracking it",
  "Pulls difficulty and topics from LeetCode and Codeforces for you",
  "Exports the whole history to CSV that Excel opens cleanly",
];

const DOES_NOT = [
  "Run your code or judge submissions. The real site still does that",
  "Grade your solution quality. It records what you say happened",
  "Post anything anywhere. Your history is yours and stays private",
];

export default function Home() {
  return (
    <main id="main">
      {/* ── Hero: asymmetric split, copy left, the working product right ───── */}
      <section className="mx-auto grid max-w-6xl gap-12 px-5 pt-16 pb-20 sm:px-8 sm:pt-24 lg:grid-cols-12 lg:gap-16">
        <Reveal className="flex flex-col items-start gap-6 lg:col-span-7" stagger={0.08}>
          <span className="text-sm font-medium tracking-wide text-accent">
            For LeetCode and Codeforces
          </span>

          <h1 className="max-w-[15ch] text-5xl leading-[1.02] font-semibold sm:text-6xl lg:text-7xl">
            Practice with the clock running.
          </h1>

          <p className="max-w-[46ch] text-lg text-muted">
            Your times, your notes, your weak topics and your duels. One place
            instead of four tabs.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Magnetic on the primary action only. On every button it stops
                reading as emphasis and starts reading as a restless page. */}
            <Show when="signed-in">
              <Magnetic>
                <Link href="/problems" className={buttonStyles({ size: "lg" })}>
                  Go to your problems
                  <ArrowRight size={18} weight="bold" />
                </Link>
              </Magnetic>
              <Link
                href="/dashboard"
                className={buttonStyles({ variant: "secondary", size: "lg" })}
              >
                See your stats
              </Link>
            </Show>

            <Show when="signed-out">
              <Magnetic>
                <span className={buttonStyles({ size: "lg" })}>
                  <SignInButton>Start practising</SignInButton>
                </span>
              </Magnetic>
            </Show>
          </div>
        </Reveal>

        <Reveal className="lg:col-span-5" delay={0.15}>
          <LoopDemo />
        </Reveal>
      </section>

      {/* ── Bento: five features, five cells, no filler tile ────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <SpotlightGroup>
          <Reveal
            trigger="scroll"
            className="grid gap-4 md:grid-cols-3"
            stagger={0.06}
          >
          {/* Wide cell: the thing the product actually replaces. */}
          <article data-spotlight
            className="spotlight flex flex-col justify-between gap-8 rounded-panel border border-border bg-surface p-7 transition-transform duration-300 ease-[var(--ease-out)] hover:-translate-y-0.5 md:col-span-2">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold">
                Your times, not a spreadsheet
              </h2>
              <p className="max-w-[52ch] text-muted">
                Every attempt is stored with its duration, so your personal best
                on a problem is a query rather than a cell you forgot to update.
              </p>
            </div>

            <ul className="flex flex-col divide-y divide-border text-sm">
              {[
                { title: "Valid Parentheses", time: "4:12", best: false },
                { title: "Two Sum", time: "2:47", best: true },
                { title: "Course Schedule", time: "18:03", best: false },
              ].map((row) => (
                <li
                  key={row.title}
                  className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className={row.best ? "font-medium" : "text-muted"}>
                    {row.title}
                  </span>
                  <span
                    data-numeric
                    className={`font-mono ${row.best ? "text-accent" : "text-muted"}`}
                  >
                    {row.time}
                  </span>
                </li>
              ))}
            </ul>
          </article>

          {/* Real bars, same rendering the dashboard uses. */}
          <article data-spotlight
            className="spotlight flex flex-col gap-6 rounded-panel border border-border bg-surface p-7 transition-transform duration-300 ease-[var(--ease-out)] hover:-translate-y-0.5">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">Weak spots, found for you</h2>
              <p className="text-sm text-muted">
                Attempts carry their topics, so the dashboard ranks what you
                actually finish.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted">Example</p>
              {SAMPLE_TOPICS.map((topic) => (
                <div key={topic.name} className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted">{topic.name}</span>
                  <span className="h-1.5 w-full overflow-hidden rounded-chip bg-surface-sunken">
                    <span
                      style={{ width: `${topic.fill}%` }}
                      className="block h-full rounded-chip bg-accent"
                    />
                  </span>
                </div>
              ))}
            </div>
          </article>

          {/* Grid pattern, because the feature is literally a grid you draw on. */}
          <article
            data-spotlight
            className="spotlight relative flex flex-col justify-end gap-2 overflow-hidden rounded-panel border border-border bg-accent-wash p-7 transition-transform duration-300 ease-[var(--ease-out)] hover:-translate-y-0.5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, var(--border) 0 1px, transparent 1px 22px), repeating-linear-gradient(90deg, var(--border) 0 1px, transparent 1px 22px)",
            }}
          >
            <h2 className="text-lg font-semibold">A whiteboard that stays put</h2>
            <p className="text-sm text-muted">
              Sketch the tree under the problem. It saves itself, and it is
              still there next time.
            </p>
          </article>

          <article data-spotlight
            className="spotlight flex flex-col gap-4 rounded-panel border border-border bg-surface-sunken p-7 transition-transform duration-300 ease-[var(--ease-out)] hover:-translate-y-0.5">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">Notes and solutions, filed</h2>
              <p className="text-sm text-muted">
                Write the trick down while it is fresh, save the code that
                worked, both against the problem.
              </p>
            </div>
            <code className="rounded-control border border-border bg-surface px-3 py-2 font-mono text-xs text-muted">
              seen[target - n] ?? push
            </code>
          </article>

          <article data-spotlight
            className="spotlight flex flex-col gap-2 rounded-panel border border-border bg-surface p-7 transition-transform duration-300 ease-[var(--ease-out)] hover:-translate-y-0.5">
            <h2 className="text-lg font-semibold">Abandoned timers close</h2>
            <p className="text-sm text-muted">
              Shut the laptop mid-attempt and the server closes it at your
              deadline, so one forgotten tab cannot poison your averages.
            </p>
          </article>
          </Reveal>
        </SpotlightGroup>
      </section>

      {/* ── Duels: full-width band, one centred moment ──────────────────────── */}
      <section className="border-y border-border bg-surface-sunken">
        <Reveal
          trigger="scroll"
          className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-5 py-24 text-center sm:px-8"
        >
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Race a friend on the same problem
          </h2>

          <p
            data-numeric
            aria-label="Example join code K 7 M 2 Q P"
            className="rounded-panel border border-border bg-surface px-8 py-5 font-mono text-4xl font-medium tracking-[0.35em] sm:text-5xl"
          >
            K7M2QP
          </p>

          <p className="max-w-[48ch] text-muted">
            Share the six characters. Both clocks start on the same second, and
            when it is over you each hand over your solution, so nobody has to
            take the winner&rsquo;s word for it.
          </p>
        </Reveal>
      </section>

      {/* ── Honest scope: two grouped lists, no cards ───────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <Reveal trigger="scroll" className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div className="flex flex-col gap-5">
            <h2 className="text-2xl font-semibold">What it does</h2>
            <ul className="flex flex-col divide-y divide-border">
              {DOES.map((item) => (
                <li key={item} className="py-3.5 first:pt-0">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-5">
            <h2 className="text-2xl font-semibold text-muted">
              What it does not
            </h2>
            <ul className="flex flex-col divide-y divide-border text-muted">
              {DOES_NOT.map((item) => (
                <li key={item} className="py-3.5 first:pt-0">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* ── Close: same CTA label as the hero, one intent per page ──────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-8 sm:px-8">
        <Reveal
          trigger="scroll"
          className="flex flex-col items-start gap-6 rounded-panel border border-border bg-surface px-7 py-14 sm:px-14"
        >
          <h2 className="max-w-[18ch] text-3xl font-semibold sm:text-4xl">
            Start the next one with the clock running.
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <Show when="signed-out">
              <span className={buttonStyles({ size: "lg" })}>
                <SignInButton>Start practising</SignInButton>
              </span>
            </Show>
            <Show when="signed-in">
              <Link href="/problems" className={buttonStyles({ size: "lg" })}>
                Go to your problems
                <ArrowRight size={18} weight="bold" />
              </Link>
            </Show>

            <a
              href="https://leetcode.com/problemset/"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ variant: "ghost", size: "lg" })}
            >
              Find a problem
              <ArrowUpRight size={18} weight="bold" />
            </a>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
