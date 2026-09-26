# leeeto

A practice tracker for LeetCode and Codeforces. Start a problem here, it opens
on the real site with a clock running, and every attempt is recorded with its
duration, outcome and topics.

Built to replace the four things people actually juggle while grinding
problems: the problem tab, a stopwatch, a scratch pad, and a spreadsheet they
stopped updating three weeks ago.

<!-- TODO: screenshots. Suggested: the problem page with a timer running, the
     dashboard, and a duel room. 1600px wide, dark mode. -->

## Features

**Timing and history**
- One click starts the clock and opens the problem in a new tab.
- Configurable auto-give-up, capped at one hour.
- Every attempt stores start, end, duration, and whether it was solved, given
  up on, or timed out.
- Personal best per problem is an indexed query, not a column you maintain.
- Abandoned attempts are closed automatically, at the deadline you set rather
  than whenever the sweep happened to notice.

**Analytics**
- Solve rate, time practised, average solve time.
- Time-to-solve trend with a keyboard-navigable chart.
- Per-topic solve rate, so weak spots come from what you finish rather than
  what feels hard.
- Your own difficulty rating compared against the platform's, which answers a
  question no platform can: not how hard the problem is, but how hard it is
  for you.
- 14-day activity strip.
- CSV export of problems and attempts, opening cleanly in Excel.

**Working material**
- Multiple timestamped notes per problem, with full edit and delete.
- Saved solutions with a language, editable in place.
- An Excalidraw whiteboard per problem that autosaves and is still there next
  time, dockable or fullscreen.
- Whiteboard snapshots, kept per problem as a visual history.

**Duels**
- Race someone on the same problem with a six-character join code.
- Both clocks start on the same second.
- First to finish takes it, with ranks assigned under a row lock so two
  simultaneous finishes cannot both claim first place.

**Library**
- Paste a LeetCode or Codeforces URL and the title, difficulty and topics are
  fetched for you.
- Anything else is saved as a custom problem, where you supply the platform
  name and topics yourself.
- Search by name, filter by platform, topic, difficulty, progress, best-time
  bucket or recency, and sort six ways.
- Five colour themes, each with a light and a dark set.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Database | PostgreSQL via Prisma 7 with `@prisma/adapter-pg` |
| Auth | Clerk |
| Client cache | TanStack Query v5 |
| Forms | TanStack Form v1 |
| Rate limiting and cache | Upstash Redis |
| Styling | Tailwind CSS v4 with CSS custom properties |
| Animation | GSAP with `@gsap/react` |
| Whiteboard | Excalidraw |
| Icons | Phosphor |
| Tests | Vitest |

## Architecture

Five layers, and every feature goes through the same five.

```
app/           pages: auth check, prefetch, render shell
lib/queries/   { queryKey, queryFn } — no directive, shared by both sides
hooks/         "use client" — useSuspenseQuery / useMutation
lib/actions/   "use server" — mutations and reads
lib/data/      plain modules — the real database work
prisma/        schema and migrations
```

Each split solves one specific problem.

**`lib/data/` has no directive** so the same function can be called by an
action, a Route Handler, a scheduled job or a test script. A `"use server"`
file turns every export into a public HTTP endpoint, which is wrong for
internal helpers.

**`lib/queries/` deliberately has no directive either.** A query is a key plus
a fetcher, the server prefetches with them and the client reads with them, and
if the two ever disagree by one character the client silently refetches instead
of using the prefetched data. No error, no warning. One shared object makes
that impossible.

**Mutations go through Server Actions, polled reads do not.** The Next docs are
