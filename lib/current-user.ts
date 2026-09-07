import { auth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, writeLimiter } from "@/lib/rate-limit";

/**
 * Resolves the Clerk session to our own User row.
 *
 * The Clerk webhook (app/api/users/webhook) is what normally creates this row,
 * but it can't reach a local dev server without a tunnel, so we fall back to
 * creating the row from the session itself.
 */
export async function getCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) return existing;

  const clerkUser = await clerkCurrentUser();
  if (!clerkUser) return null;

  return prisma.user.create({
    data: {
      clerkId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      name:
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
        "Anonymous",
      imageUrl: clerkUser.imageUrl,
    },
  });
}

/**
 * Same as getCurrentUser, but throws instead of returning null. Use this inside
 * Server Actions: they're reachable by anyone who can POST, so every one of
 * them has to check auth itself rather than relying on the page that rendered.
 */
export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

/**
 * Auth plus a write-rate budget, for mutating actions.
 *
 * Reads keep using `requireCurrentUser` so browsing never eats the write
 * budget. The order matters: authenticate first, then rate limit by user id,
 * so an unauthenticated caller can't burn another user's allowance.
 */
export async function requireUserForWrite() {
  const user = await requireCurrentUser();
  await enforceRateLimit(writeLimiter, user.id);
  return user;
}
