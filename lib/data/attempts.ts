import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/prisma";

/**
 * Closes attempts that were abandoned rather than finished.
 *
 * The client-side timer can only auto-give-up while its tab is open. Close the
 * laptop mid-attempt and the row stays IN_PROGRESS forever: it inflates the
 * attempt count, and `startAttempt` resumes the zombie instead of starting a
 * fresh timer. This is the server-side backstop, meant to run on a schedule.
 *
 * Plain module (no "use server") so the cron route and the tests can call it
 * directly.
 */

/** An attempt with no self-imposed limit is still abandoned after this long. */
const ABANDONED_AFTER_MS = 24 * 60 * 60 * 1000;

export async function closeStaleAttempts() {
  // Done in SQL so the whole sweep is one atomic statement rather than a
  // read-then-write race against someone finishing an attempt right now.
  //
  // endedAt is the deadline, NOT now(): a sweep that runs late must not inflate
  // the recorded duration. durationMs is exactly the limit the user set.
  const timedOut = await prisma.$executeRaw`
    UPDATE "Attempt"
    SET status = 'AUTO_GIVEN_UP',
        "endedAt" = "startedAt" + ("timeLimitMs" * interval '1 millisecond'),
        "durationMs" = "timeLimitMs"
    WHERE status = 'IN_PROGRESS'
      AND "timeLimitMs" IS NOT NULL
      AND "startedAt" + ("timeLimitMs" * interval '1 millisecond') <= now()
  `;

  // No-limit attempts have no deadline to record, so durationMs stays NULL —
  // an abandoned attempt shouldn't contribute a 24-hour "solve time" to the
  // averages. It still counts as a non-solve, which is accurate.
  const abandoned = await prisma.$executeRaw`
    UPDATE "Attempt"
    SET status = 'AUTO_GIVEN_UP',
        "endedAt" = now()
    WHERE status = 'IN_PROGRESS'
      AND "timeLimitMs" IS NULL
      AND "startedAt" <= now() - ${`${ABANDONED_AFTER_MS} milliseconds`}::interval
  `;

  return { timedOut, abandoned };
}

/**
 * The same sweep, run opportunistically on a real request instead of on a
 * schedule.
 *
 * Vercel's Hobby plan only allows daily cron schedules, which would leave an
 * abandoned attempt sitting IN_PROGRESS for up to 24 hours. This removes the
 * dependency on a scheduler altogether, and it is arguably the more correct
 * design: a stale attempt only ever damages its own owner's figures, and the
 * only moment that damage is visible is when somebody loads the app. Sweeping
 * just before the data is read means it is never stale at the point of use.
 *
 * Two guards keep the cost near zero:
 *
 * 1. An in-process timestamp. Serverless instances are reused, so a warm one
 *    skips straight out without touching the network at all.
 * 2. A Redis key with a TTL, set with NX so the write itself is the lock. That
 *    is what stops ten concurrent instances all running the sweep at once; a
 *    read-then-write check would race.
 *
 * Called through `after()` so it runs once the response has already been sent
 * and adds nothing to the request the user is waiting on.
 */
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const SWEEP_LOCK_KEY = "leeeto:sweep:stale-attempts";

let lastSweepAt = 0;

export async function sweepStaleAttemptsIfDue() {
  const now = Date.now();
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // NX: only sets if absent, so exactly one instance wins the window.
    const won = await redis.set(SWEEP_LOCK_KEY, "1", {
      nx: true,
      px: SWEEP_INTERVAL_MS,
    });
    if (won === null) return;

    const result = await closeStaleAttempts();
    if (result.timedOut || result.abandoned) {
      console.log("[sweep] closed stale attempts:", result);
    }
  } catch (error) {
    // Never surfaces to the user: this runs after the response is sent, and a
    // janitor that cannot run is not a reason to fail anything. The scheduled
    // route is still there as a backstop.
    console.error("[sweep] skipped:", error);
  }
}
