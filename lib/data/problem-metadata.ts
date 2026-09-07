import { Redis } from "@upstash/redis";
import { Difficulty, ProblemSource } from "@/generated/prisma/enums";
import { ratingToDifficulty } from "@/lib/difficulty";

/**
 * Looks up a problem's real title, difficulty and topic tags from the source
 * platform.
 *
 * This is what makes the topic analytics trustworthy: without it, tags only
 * exist when a user remembers to type them, so "your weak topics" really means
 * "the topics you bothered to label".
 *
 * Every lookup is best-effort. A network failure, a rate limit, or a changed
 * response shape must never stop someone adding a problem — the caller falls
 * back to the slug-derived title.
 */

export type ProblemMetadata = {
  title?: string;
  difficulty?: Difficulty;
  tags?: string[];
};

const FETCH_TIMEOUT_MS = 5000;
/** The Codeforces archive is a ~2MB document, so it gets more headroom. */
const CODEFORCES_TIMEOUT_MS = 12000;
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function fetchLeetCode(slug: string): Promise<ProblemMetadata | null> {
  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // LeetCode rejects requests without a browser-ish UA and referer.
      "User-Agent": "Mozilla/5.0 (compatible; leeeto/1.0)",
      Referer: `https://leetcode.com/problems/${slug}/`,
    },
    body: JSON.stringify({
      query: `query q($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          title
          difficulty
          topicTags { name }
        }
      }`,
      variables: { titleSlug: slug },
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) return null;

  const json = (await response.json()) as {
    data?: {
      question?: {
        title?: string;
        difficulty?: string;
        topicTags?: { name: string }[];
      } | null;
    };
  };

  const question = json.data?.question;
  if (!question) return null;

  const difficulty = question.difficulty?.toUpperCase();

  return {
    title: question.title,
    difficulty:
      difficulty && difficulty in Difficulty
        ? (difficulty as Difficulty)
        : undefined,
    tags: question.topicTags?.map((tag) => tag.name.toLowerCase()),
  };
}

async function fetchCodeforces(
  externalId: string
): Promise<ProblemMetadata | null> {
  // externalId is "1234A": contest id then problem index.
  const match = externalId.match(/^(\d+)([A-Z]\d*)$/i);
  if (!match) return null;

  const [, contestId, index] = match;

  // Codeforces has no per-problem endpoint, and contest.standings rejects the
  // paging params for non-admins (it would return full standings otherwise).
  // problemset.problems is the endpoint actually designed for metadata: ~2.2MB
  // for all 11k problems, but this only runs on a cache miss, and the result is
  // cached per problem for a week.
  const response = await fetch("https://codeforces.com/api/problemset.problems", {
    signal: AbortSignal.timeout(CODEFORCES_TIMEOUT_MS),
  });

  if (!response.ok) return null;

  const json = (await response.json()) as {
    status?: string;
    result?: {
      problems?: {
        contestId?: number;
        index: string;
        name: string;
        rating?: number;
        tags?: string[];
      }[];
    };
  };

  if (json.status !== "OK") return null;

  const problem = json.result?.problems?.find(
    (candidate) =>
      String(candidate.contestId) === contestId &&
      candidate.index.toUpperCase() === index.toUpperCase()
  );
  if (!problem) return null;

  return {
    title: `${contestId}${problem.index} — ${problem.name}`,
    difficulty: ratingToDifficulty(problem.rating),
    tags: problem.tags?.map((tag) => tag.toLowerCase()),
  };
}

export async function fetchProblemMetadata(
  source: ProblemSource,
  externalId: string | null
): Promise<ProblemMetadata | null> {
  if (!externalId) return null;

  const cacheKey = `leeeto:meta:${source}:${externalId}`;

  try {
    const cached = await redis.get<ProblemMetadata>(cacheKey);
    if (cached) return cached;
  } catch (error) {
    // A cache miss and a broken cache should behave the same way.
    console.error("[metadata] cache read failed:", error);
  }

  let metadata: ProblemMetadata | null = null;

  try {
    if (source === ProblemSource.LEETCODE) {
      metadata = await fetchLeetCode(externalId);
    } else if (source === ProblemSource.CODEFORCES) {
      metadata = await fetchCodeforces(externalId);
    }
  } catch (error) {
    // Timeouts, DNS failures, shape changes — adding a problem still works.
    console.error(`[metadata] lookup failed for ${source}/${externalId}:`, error);
    return null;
  }

  if (metadata) {
    try {
      await redis.set(cacheKey, metadata, { ex: CACHE_TTL_SECONDS });
    } catch (error) {
      console.error("[metadata] cache write failed:", error);
    }
  }

  return metadata;
}
