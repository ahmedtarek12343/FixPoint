import { Difficulty } from "@/generated/prisma/enums";

/**
 * Codeforces publishes a numeric rating rather than a difficulty band. These
 * cutoffs are the conventional reading of that scale.
 *
 * Kept in its own module (rather than beside the fetchers) so it can be tested
 * without constructing a Redis client at import time.
 */
export function ratingToDifficulty(
  rating: number | undefined
): Difficulty | undefined {
  if (!rating) return undefined;
  if (rating < 1400) return Difficulty.EASY;
  if (rating < 1900) return Difficulty.MEDIUM;
  return Difficulty.HARD;
}
