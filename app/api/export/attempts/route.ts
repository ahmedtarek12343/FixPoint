import { getCurrentUser } from "@/lib/current-user";
import { exportAttemptsCsv } from "@/lib/data/export";
import { csvResponse } from "@/lib/csv";
import { enforceRateLimit, exportLimiter, RateLimitError } from "@/lib/rate-limit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  try {
    await enforceRateLimit(exportLimiter, user.id);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return new Response(error.message, { status: 429 });
    }
    throw error;
  }

  const csv = await exportAttemptsCsv(user.id);
  const date = new Date().toISOString().slice(0, 10);

  return csvResponse(csv, `leeeto-attempts-${date}.csv`);
}
