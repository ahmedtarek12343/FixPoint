import { describe, expect, it } from "vitest";
import { formatDuration, parseHoursMinutesToMs } from "@/lib/format";

describe("parseHoursMinutesToMs", () => {
  it.each([
    ["0:45", 45 * 60_000],
    ["1:00", 60 * 60_000],
    ["1:30", 90 * 60_000],
    ["0:05", 5 * 60_000],
  ])("parses %s", (input, expected) => {
    expect(parseHoursMinutesToMs(input)).toBe(expected);
  });

  it("treats a zero-length limit as no value", () => {
    // Otherwise "0:00" would start an attempt that auto-gives-up instantly.
    expect(parseHoursMinutesToMs("0:00")).toBeNull();
  });

  it.each(["1:75", "abc", "", "45", "1:2:3", "-1:30"])(
    "rejects %o",
    (input) => {
      expect(parseHoursMinutesToMs(input)).toBeNull();
    }
  );
});

describe("formatDuration", () => {
  it("omits the hours field under an hour", () => {
    expect(formatDuration(90_000)).toBe("1:30");
  });

  it("includes hours once past one", () => {
    expect(formatDuration(3_661_000)).toBe("1:01:01");
  });

  it("pads seconds", () => {
    expect(formatDuration(65_000)).toBe("1:05");
  });

  it("clamps negatives to zero rather than rendering '-1:-30'", () => {
    expect(formatDuration(-5000)).toBe("0:00");
  });
});
