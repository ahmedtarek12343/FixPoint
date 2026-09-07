/**
 * Plain module, no "use server": a `"use server"` file may only export async
 * functions, so shared constants have to live outside the actions file even
 * though both sides need them.
 */

/** Hard ceiling on a self-imposed time limit: never more than an hour. */
export const MAX_TIME_LIMIT_MS = 60 * 60 * 1000;

/** Languages a solution can be submitted in. Stored as plain strings rather
 *  than an enum so adding one never needs a migration. */
export const LANGUAGES = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "C++",
  "C",
  "C#",
  "Go",
  "Rust",
  "Ruby",
  "Kotlin",
  "Swift",
  "PHP",
  "SQL",
  "Other",
] as const;

export const MAX_NOTE_LENGTH = 5000;
/** ~1MB of SVG text. A normal Excalidraw sketch is a few KB; this is a guard
 *  against a pathological drawing, not a target. */
export const MAX_SNAPSHOT_LENGTH = 1_000_000;
export const MAX_SOLUTION_LENGTH = 20000;

/**
 * A topic needs at least this many finished attempts before its solve rate is
 * treated as signal. Below it, one unlucky problem would read as a "weakness".
 */
export const MIN_ATTEMPTS_FOR_SIGNAL = 3;

/** Sentinel for the dropdown: not a duration, it reveals the h:mm input. */
export const CUSTOM_TIME_LIMIT = -1;

export const TIME_LIMIT_OPTIONS = [
  { label: "No limit", value: 0 },
  { label: "15 min", value: 15 * 60 * 1000 },
  { label: "30 min", value: 30 * 60 * 1000 },
  { label: "45 min", value: 45 * 60 * 1000 },
  { label: "1 hour", value: MAX_TIME_LIMIT_MS },
  { label: "Custom…", value: CUSTOM_TIME_LIMIT },
];
