leeeto
A practice tracker for LeetCode and Codeforces. Start a problem here, it opens on the real site with a clock running, and every attempt is recorded with its duration, outcome and topics.

Built to replace the four things people actually juggle while grinding problems: the problem tab, a stopwatch, a scratch pad, and a spreadsheet they stopped updating three weeks ago.

<!-- TODO: screenshots. Suggested: the problem page with a timer running, the dashboard, and a duel room. 1600px wide, dark mode. -->
Features
Timing and history

One click starts the clock and opens the problem in a new tab.
Configurable auto-give-up, capped at one hour.
Every attempt stores start, end, duration, and whether it was solved, given up on, or timed out.
Personal best per problem is an indexed query, not a column you maintain.
Abandoned attempts are closed automatically, at the deadline you set rather than whenever the sweep happened to notice.
Analytics

Solve rate, time practised, average solve time.
Time-to-solve trend with a keyboard-navigable chart.
Per-topic solve rate, so weak spots come from what you finish rather than what feels hard.
Your own difficulty rating compared against the platform's, which answers a question no platform can: not how hard the problem is, but how hard it is for you.
14-day activity strip.
CSV export of problems and attempts, opening cleanly in Excel.
Working material

Multiple timestamped notes per problem, with full edit and delete.
Saved solutions with a language, editable in place.
An Excalidraw whiteboard per problem that autosaves and is still there next time, dockable or fullscreen.
Whiteboard snapshots, kept per problem as a visual history.
Duels

Race someone on the same problem with a six-character join code.
Both clocks start on the same second.
First to finish takes it, with ranks assigned under a row lock so two simultaneous finishes cannot both claim first place.
Library

Paste a LeetCode or Codeforces URL and the title, difficulty and topics are fetched for you.
Anything else is saved as a custom problem, where you supply the platform name and topics yourself.
Search by name, filter by platform, topic, difficulty, progress, best-time bucket or recency, and sort six ways.
Five colour themes, each with a light and a dark set.
Stack
Framework	Next.js 16 (App Router), React 19, TypeScript
Database	PostgreSQL via Prisma 7 with @prisma/adapter-pg
Auth	Clerk
Client cache	TanStack Query v5
Forms	TanStack Form v1
Rate limiting and cache	Upstash Redis
Styling	Tailwind CSS v4 with CSS custom properties
Animation	GSAP with @gsap/react
Whiteboard	Excalidraw
Icons	Phosphor
Tests	Vitest
Architecture
Five layers, and every feature goes through the same five.

app/           pages: auth check, prefetch, render shell
lib/queries/   { queryKey, queryFn } — no directive, shared by both sides
hooks/         "use client" — useSuspenseQuery / useMutation
lib/actions/   "use server" — mutations and reads
lib/data/      plain modules — the real database work
prisma/        schema and migrations
Each split solves one specific problem.

lib/data/ has no directive so the same function can be called by an action, a Route Handler, a scheduled job or a test script. A "use server" file turns every export into a public HTTP endpoint, which is wrong for internal helpers.

lib/queries/ deliberately has no directive either. A query is a key plus a fetcher, the server prefetches with them and the client reads with them, and if the two ever disagree by one character the client silently refetches instead of using the prefetched data. No error, no warning. One shared object makes that impossible.

Mutations go through Server Actions, polled reads do not. The Next docs are explicit that Server Actions are queued per client. That is correct for writes and wrong for a poll, so the duel poll is a Route Handler: otherwise a two-second poll would share a queue with the mutation that decides the winner. A Route Handler can also answer with a real 429 and Retry-After, which an action cannot express.

Request lifecycle
server: page runs
  → getQueryClient()        fresh client per request, never a singleton
  → queryClient.query(...)  runs the fetcher in-process, no HTTP
  → dehydrate()             cache flattened to JSON
  → <HydrationBoundary>     JSON crosses in the RSC payload
browser: hydrate()          written into the singleton browser client
  → useSuspenseQuery()      same key, cache hit, never suspends
The server uses a fresh QueryClient per request because the cache is keyed by query, not by user. A shared server client would serve one account's dashboard to another. staleTime is non-zero for the same reason the prefetch exists: at the default of zero, hydrated data is stale on arrival and refetches immediately, which does all the work twice.

Notable decisions
These are the parts worth reading if you are here to see how it was built. Each one is commented in place.

Problems are a shared catalogue, libraries are a join table. Problem is deduplicated on (source, externalId), so there is one "Two Sum" row for everyone. That dedup is what lets two people duel on the same problem, keeps metadata fetched once rather than per user, and makes cross-user comparison possible. Ownership lives in UserProblem. Putting userId on Problem instead would have been one column and would have broken all three.

Per-user overrides never touch the shared row. Your difficulty rating and your rename are stored on UserProblem. Renaming "Two Sum" to "the hashmap one" must not rename it for every other user. For a custom problem the row is private, so the write goes through to Problem and the override is cleared, keeping one source of truth instead of two copies that drift.

Duel ranks are assigned under a row lock. A transaction alone is not enough. Postgres defaults to Read Committed, and two players finishing at the same instant update different participant rows, so nothing serialises them: both read "nobody has finished" and both claim first. SELECT … FOR UPDATE on the shared parent row forces an order. Verified by running two concurrent finishes with the lock removed, which produced ranks=[1,1] and a duel stuck in ACTIVE two times out of three.

Ownership is in the WHERE clause, never in an if. Every scoped query filters by userId in the query itself rather than fetching by id and comparing afterwards. Fetch-then-check has already read the row into memory, and one missing branch becomes a breach.

The stale-attempt sweep records the deadline, not the wall clock. A sweep running at 3am for an attempt that timed out at 9pm must not record a six-hour attempt on a thirty-minute limit. Attempts with no limit are closed with durationMs left NULL, because "unknown" is true and 0 is a lie that drags the averages down.

The sweep runs on request, not on a schedule. A stale attempt only damages its own owner's figures, and the only moment that damage is visible is when somebody loads the app. It runs in after() so it never blocks a response, guarded by an in-process timestamp and then a Redis key set with NX, so at most one sweep happens per window across every instance. The scheduled route remains as a daily backstop.

Rate limits fail open, authorisation fails closed. An Upstash outage should not take the app down, so enforceRateLimit logs and continues. The cron endpoint mutates data with no user session, so a missing CRON_SECRET rejects every request. Availability controls degrade toward availability; authorisation controls degrade toward denial.

CSV output is treated as untrusted input to another program. Excel and Sheets execute a cell beginning =, +, - or @, and problem titles come from external APIs. Strings starting with those are prefixed with an apostrophe; numbers are left alone. Plus a UTF-8 BOM, CRLF endings and RFC 4180 quoting, so the file opens correctly rather than as mojibake.

Whiteboard snapshots render through <img src="data:image/svg+xml,…">. SVG is an executable document format. An <img> never runs script inside one, so a hostile file is inert even if the upload filter is wrong.

Difficulty is an ordinal meter, not a traffic light. Three unrelated hues would give the page three more accent colours, and green-versus-red is the worst possible pair to carry meaning for the two commonest forms of colour blindness. It is a three-segment bar that fills up, readable with no colour at all.

Getting started
Requires Bun, a PostgreSQL database, a Clerk application and an Upstash Redis database.

git clone https://github.com/ahmedtarek12343/leeeto.git
cd leeeto
bun install          # postinstall runs `prisma generate`

cp .env.example .env # then fill it in, see below

bunx prisma migrate deploy
bun dev
Open http://localhost:3000.

Restart the dev server after any prisma generate or prisma migrate. The generated client lives in generated/prisma inside the project, so Turbopack caches it and will otherwise serve a stale copy with confusing "Unknown argument" errors.

Environment
See .env.example for the annotated version.

Variable	Notes
DATABASE_URL	Use the pooled connection string in production
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY	Public by design
CLERK_SECRET_KEY	
CLERK_WEBHOOK_SIGNING_SECRET	From the webhook endpoint in the Clerk dashboard
UPSTASH_REDIS_REST_URL	
UPSTASH_REDIS_REST_TOKEN	
CRON_SECRET	Any long random string: openssl rand -hex 32
Scripts
bun dev          # dev server
bun run build    # prisma migrate deploy && next build
bun test         # Vitest
bun run lint     # ESLint
Two verification scripts under scripts/ exercise the shared-catalogue rules against a real database. Each creates its own rows and deletes them in a finally, so they are safe to re-run.

bun run scripts/verify-rating.ts
bun run scripts/verify-title-filters.ts
Deployment
Any host that runs Next.js. On Vercel:

Set all seven environment variables.
Leave the build command alone; it comes from package.json and applies migrations before building.
Add a Clerk webhook pointing at https://<domain>/api/users/webhook for user.created, user.updated and user.deleted, then set the signing secret.
vercel.json declares a daily cron. The Hobby plan only permits daily schedules, which is why the sweep primarily runs on request instead.
Testing
66 unit tests across 6 files, covering the pure logic where a silent wrong answer would be hard to notice: pagination clamping, problem URL parsing, duration formatting, SVG safety, difficulty mapping and CSV escaping.

bun test
Known gap: there are no integration tests against a database. The duel race, ownership scoping and the filter paths are covered by the verification scripts above rather than by a suite, which means a regression in them would not fail the build. That is the next thing worth fixing.

Project structure
app/              routes: 9 pages, 5 route handlers
  api/            cron, duel polling, CSV export, Clerk webhook
components/       grouped by area: Problems, Dashboard, Duels, Notes,
                  Solutions, Landing, ui, utils
hooks/            TanStack Query hooks, one per area
lib/
  actions/        "use server"
  data/           plain modules, the real database work
  queries/        query keys and fetchers, shared server and client
prisma/           schema and 9 migrations
scripts/          palette generation, database verification
tests/            Vitest
13 models and 4 enums. scripts/themes.mjs generates app/themes.css and refuses to emit unless every foreground and background pair in all five themes passes WCAG AA in both light and dark, which is 120 checks.

In progress
Streaks. Schema and migration are in; the application layer is next.
Spaced repetition scheduling.
Duel solution exchange, where both players submit and neither sees the other's until both have.
Integration tests against a dedicated test database.
