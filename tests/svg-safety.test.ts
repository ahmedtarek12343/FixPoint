import { describe, expect, it } from "vitest";
import { isSvgSafe, looksLikeSvg } from "@/lib/svg-safety";

describe("isSvgSafe", () => {
  it("accepts a plain Excalidraw-style export", () => {
    expect(
      isSvgSafe('<svg xmlns="http://www.w3.org/2000/svg"><rect x="1"/></svg>')
    ).toBe(true);
  });

  it.each([
    ["a script element", "<svg><script>alert(1)</script></svg>"],
    ["an onload handler", '<svg><image onload="alert(1)"/></svg>'],
    ["an onerror handler", '<svg><image onerror="alert(1)"/></svg>'],
    ["upper case with padding", '<svg><g ONERROR ="x"/></svg>'],
  ])("rejects %s", (_label, svg) => {
    expect(isSvgSafe(svg)).toBe(false);
  });

  // Hyphenated attributes contain "on" mid-word; a sloppier pattern would
  // reject every real drawing.
  it.each([
    '<svg><text font-size="12">ok</text></svg>',
    '<svg><rect stroke-dasharray="4"/></svg>',
  ])("does not false-positive on %o", (svg) => {
    expect(isSvgSafe(svg)).toBe(true);
  });
});

describe("looksLikeSvg", () => {
  it("accepts svg markup", () => {
    expect(looksLikeSvg('<svg xmlns="x"></svg>')).toBe(true);
  });

  it("rejects anything else", () => {
    expect(looksLikeSvg("<html><body>nope</body></html>")).toBe(false);
  });
});
