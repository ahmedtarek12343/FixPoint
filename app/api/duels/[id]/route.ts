import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getDuelState } from "@/lib/data/duels";
import { pollLimiter } from "@/lib/rate-limit";

/**
 * The polling endpoint for a live duel.
 *
 * This is a Route Handler rather than a Server Action on purpose: actions are
 * queued per client, so a 2-second poll would compete with the mutation that
 * decides the winner. A plain GET has no such queue.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Polled every 2s per open tab. A Route Handler can answer with a real 429
  // plus Retry-After, which a Server Action can't express.
  const { success, reset } = await pollLimiter.limit(user.id);
  if (!success) {
    return new Response("Too many requests", {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(Math.ceil((reset - Date.now()) / 1000), 1)),
      },
    });
  }

  const duel = await getDuelState(user.id, id);
  if (!duel) return new Response("Not found", { status: 404 });

  return Response.json(duel);
}
