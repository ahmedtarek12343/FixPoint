import type { NextRequest } from "next/server";
import { closeStaleAttempts } from "@/lib/data/attempts";

/**
 * Scheduled sweep that closes abandoned attempts. See lib/data/attempts.ts for
 * why the client-side timer isn't enough.
 *
 * This endpoint mutates data and is not tied to a user session, so it fails
 * CLOSED: no configured secret means every request is rejected. That's the
 * opposite of the rate limiter, which fails open — the difference is that this
 * is an authorization check, and those never degrade to "allow".
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[cron] CRON_SECRET is not set; refusing to run.");
    return new Response("Not configured", { status: 503 });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await closeStaleAttempts();
  console.log("[cron] closed stale attempts:", result);

  return Response.json({ ok: true, ...result });
}
