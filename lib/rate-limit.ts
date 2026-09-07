import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting for Server Actions and Route Handlers.
 *
 * Actions are public POST endpoints — anyone with a session can call them
 * directly, as fast as they like, without going through the UI. These limits
 * are the backstop for that.
 */

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/** Ordinary writes: notes, solutions, problems, duels. */
export const writeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  prefix: "leeeto:write",
  analytics: false,
});

/**
 * Whiteboard autosave fires on a 1.5s debounce while drawing, so it needs a
 * far looser budget than a form submit.
 */
export const autosaveLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(120, "1 m"),
  prefix: "leeeto:autosave",
  analytics: false,
});

/** The duel poll runs every 2s per open tab — 30/min per tab, doubled for a
 *  second tab, plus headroom. */
export const pollLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(90, "1 m"),
  prefix: "leeeto:poll",
  analytics: false,
});

/** Exports scan the whole account, so they're cheap to request and expensive
 *  to serve. Nobody legitimately needs one every few seconds. */
export const exportLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "leeeto:export",
  analytics: false,
});

export class RateLimitError extends Error {
  constructor(retryAfterSeconds: number) {
    super(
      `Too many requests — try again in ${Math.max(retryAfterSeconds, 1)}s.`
    );
    this.name = "RateLimitError";
  }
}

/**
 * Throws RateLimitError when the caller is over budget.
 *
 * Fails OPEN when Redis itself is unreachable: rate limiting is abuse
 * mitigation, not authorization, so an Upstash outage should not take the
 * whole app down. Authorization checks never fail open — those are separate
 * and always run.
 */
export async function enforceRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<void> {
  try {
    const { success, reset } = await limiter.limit(identifier);
    if (success) return;

    throw new RateLimitError(Math.ceil((reset - Date.now()) / 1000));
  } catch (error) {
    if (error instanceof RateLimitError) throw error;

    console.error("[rate-limit] Redis unavailable, allowing request:", error);
  }
}
