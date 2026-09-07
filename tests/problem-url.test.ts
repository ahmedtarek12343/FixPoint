import { describe, expect, it } from "vitest";
import { parseProblemUrl } from "@/lib/problem-url";

describe("parseProblemUrl — LeetCode", () => {
  it("extracts the slug as the external id", () => {
    expect(parseProblemUrl("https://leetcode.com/problems/two-sum/")).toMatchObject({
      source: "LEETCODE",
      externalId: "two-sum",
      url: "https://leetcode.com/problems/two-sum/",
      suggestedTitle: "Two Sum",
    });
  });

  // The canonical URL is what gets stored, so trailing segments must not create
  // a second row for the same problem.
  it.each(["/description", "/submissions", "/solutions"])(
    "normalises the %s suffix to the same canonical url",
    (suffix) => {
      const parsed = parseProblemUrl(
        `https://leetcode.com/problems/two-sum${suffix}`
      );
      expect(parsed).toMatchObject({
        externalId: "two-sum",
        url: "https://leetcode.com/problems/two-sum/",
      });
    }
  );

  it("accepts a url typed without a scheme", () => {
    expect(parseProblemUrl("leetcode.com/problems/two-sum")).toMatchObject({
      source: "LEETCODE",
      externalId: "two-sum",
    });
  });
});

describe("parseProblemUrl — Codeforces", () => {
  // Both URL shapes refer to the same problem and must produce one external id.
  it("handles the problemset shape", () => {
    expect(
      parseProblemUrl("https://codeforces.com/problemset/problem/1352/A")
    ).toMatchObject({ source: "CODEFORCES", externalId: "1352A" });
  });

  it("handles the contest shape", () => {
    expect(
      parseProblemUrl("https://codeforces.com/contest/1352/problem/A")
    ).toMatchObject({ source: "CODEFORCES", externalId: "1352A" });
  });

  it("upper-cases the problem index so 'a' and 'A' dedupe", () => {
    expect(
      parseProblemUrl("https://codeforces.com/contest/1352/problem/a")
    ).toMatchObject({ externalId: "1352A" });
  });
});

describe("parseProblemUrl — other input", () => {
  it("falls back to a custom problem with no external id", () => {
    // A null external id means the (source, externalId) unique never dedupes
    // these, which is intended: two custom problems are two problems.
    expect(parseProblemUrl("https://example.com/my-puzzle")).toMatchObject({
      source: "CUSTOM",
      externalId: null,
    });
  });

  it.each(["", "   ", "not a url at all"])(
    "returns null for unusable input %o",
    (input) => {
      expect(parseProblemUrl(input)).toBeNull();
    }
  );
});
