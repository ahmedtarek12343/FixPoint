/**
 * Parses a user-typed "h:mm" time limit into milliseconds.
 * Returns null for anything unparseable or zero, so the caller can tell the
 * difference between "not filled in yet" and a real value.
 */
export function parseHoursMinutesToMs(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):([0-5]?\d)$/);
  if (!match) return null;

  const totalMinutes = Number(match[1]) * 60 + Number(match[2]);
  return totalMinutes > 0 ? totalMinutes * 60 * 1000 : null;
}

/** Formats a millisecond duration as h:mm:ss (or m:ss under an hour). */
export function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (value: number) => String(value).padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}
