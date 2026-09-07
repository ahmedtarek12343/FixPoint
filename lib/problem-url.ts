import { ProblemSource } from "@/generated/prisma/enums";

export type ParsedProblemUrl = {
  source: ProblemSource;
  /** Platform-native id: a LeetCode slug, or a Codeforces "1234A". Null for custom problems. */
  externalId: string | null;
  /** Normalized canonical URL we store and link out to. */
  url: string;
  /** Best-effort title, used to prefill the form. */
  suggestedTitle: string;
};

function titleize(slug: string) {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function parseProblemUrl(input: string): ParsedProblemUrl | null {
  const raw = input.trim();
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  const segments = url.pathname.split("/").filter(Boolean);

  // https://leetcode.com/problems/two-sum/ (optionally /description, /submissions ...)
  if (host.endsWith("leetcode.com")) {
    const slugIndex = segments.indexOf("problems");
    const slug = slugIndex === -1 ? undefined : segments[slugIndex + 1];
    if (slug) {
      return {
        source: ProblemSource.LEETCODE,
        externalId: slug,
        url: `https://leetcode.com/problems/${slug}/`,
        suggestedTitle: titleize(slug),
      };
    }
  }

  // https://codeforces.com/problemset/problem/1234/A
  // https://codeforces.com/contest/1234/problem/A
  if (host.endsWith("codeforces.com")) {
    let contestId: string | undefined;
    let index: string | undefined;

    if (segments[0] === "problemset" && segments[1] === "problem") {
      [contestId, index] = [segments[2], segments[3]];
    } else if (segments[0] === "contest" && segments[2] === "problem") {
      [contestId, index] = [segments[1], segments[3]];
    }

    if (contestId && index) {
      const problemIndex = index.toUpperCase();
      return {
        source: ProblemSource.CODEFORCES,
        externalId: `${contestId}${problemIndex}`,
        url: `https://codeforces.com/problemset/problem/${contestId}/${problemIndex}`,
        suggestedTitle: `Codeforces ${contestId}${problemIndex}`,
      };
    }
  }

  // Anything else is a custom problem: no external id, so it never dedupes.
  const lastSegment = segments.at(-1);
  return {
    source: ProblemSource.CUSTOM,
    externalId: null,
    url: url.toString(),
    suggestedTitle: lastSegment ? titleize(lastSegment.replace(/\.\w+$/, "")) : host,
  };
}
