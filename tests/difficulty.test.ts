import { describe, expect, it } from "vitest";
import { ratingToDifficulty } from "@/lib/difficulty";

describe("ratingToDifficulty", () => {
  it.each([
    [800, "EASY"],
    [1399, "EASY"],
    [1400, "MEDIUM"],
    [1899, "MEDIUM"],
    [1900, "HARD"],
    [3500, "HARD"],
  ])("maps rating %i to %s", (rating, expected) => {
    expect(ratingToDifficulty(rating)).toBe(expected);
  });

  it.each([undefined, 0])(
    "returns undefined for %o so the problem stays unrated",
    (rating) => {
      // Unrated must not silently become EASY — the dashboard groups by this.
      expect(ratingToDifficulty(rating)).toBeUndefined();
    }
  );
});
