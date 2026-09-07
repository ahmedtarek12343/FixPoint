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
