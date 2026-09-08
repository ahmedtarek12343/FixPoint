import { writeFileSync } from "node:fs";

const hex = (h) => { h = h.replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };
const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const L = (h) => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// name -> { light, dark }; each mode carries the full token set.
const THEMES = {
  graphite: {
    label: "Graphite",
    light: { bg:"#f7f6f3", surface:"#fdfcfa", sunken:"#f0eeea", fg:"#171614", muted:"#6b6760",
             accent:"#0a7350", accentHover:"#095f43", accentContrast:"#ffffff", danger:"#b3261e" },
    dark:  { bg:"#0c0c0b", surface:"#151513", sunken:"#080807", fg:"#edebe6", muted:"#9c978e",
             accent:"#3fc98d", accentHover:"#5cd7a1", accentContrast:"#04160e", danger:"#ff8a80" },
  },
  ember: {
    label: "Ember",
    light: { bg:"#faf7f4", surface:"#fffdfb", sunken:"#f2ebe4", fg:"#1c1613", muted:"#6d5f55",
             accent:"#a8400f", accentHover:"#8c340a", accentContrast:"#ffffff", danger:"#a81f2a" },
    dark:  { bg:"#100d0b", surface:"#1a1512", sunken:"#0a0807", fg:"#f0e9e3", muted:"#a3958a",
             accent:"#ff8b52", accentHover:"#ffa375", accentContrast:"#1c0d04", danger:"#ff8a80" },
  },
  cobalt: {
    label: "Cobalt",
    light: { bg:"#f5f6f8", surface:"#fdfdfe", sunken:"#eaedf2", fg:"#14171c", muted:"#616874",
             accent:"#1a5cc0", accentHover:"#154c9f", accentContrast:"#ffffff", danger:"#b3261e" },
    dark:  { bg:"#0a0c0f", surface:"#12151b", sunken:"#06080a", fg:"#e8ebf0", muted:"#919aa7",
             accent:"#6aa5ff", accentHover:"#8bbaff", accentContrast:"#04101f", danger:"#ff8a80" },
  },
  plum: {
    label: "Plum",
    light: { bg:"#f8f6f7", surface:"#fffdfe", sunken:"#f1eaed", fg:"#191416", muted:"#6a6064",
             accent:"#a11d4c", accentHover:"#85183f", accentContrast:"#ffffff", danger:"#b3261e" },
    dark:  { bg:"#0d0b0c", surface:"#161314", sunken:"#080707", fg:"#eee9eb", muted:"#9d9296",
             accent:"#ff7ba8", accentHover:"#ff9cbe", accentContrast:"#1f0611", danger:"#ff8a80" },
  },
  moss: {
    label: "Moss",
    light: { bg:"#f7f7f1", surface:"#fdfdf8", sunken:"#ecece1", fg:"#16170f", muted:"#65675a",
             accent:"#5f6b13", accentHover:"#4c560d", accentContrast:"#ffffff", danger:"#b3261e" },
    dark:  { bg:"#0c0d09", surface:"#141610", sunken:"#070805", fg:"#ebece2", muted:"#959888",
             accent:"#bccf4e", accentHover:"#cddb72", accentContrast:"#131608", danger:"#ff8a80" },
  },
};

let failures = 0;
const check = (theme, mode, label, fg, bg, need = 4.5) => {
  const r = ratio(fg, bg);
  const ok = r >= need;
  if (!ok) { failures++; console.log(`FAIL ${theme}/${mode} ${label}: ${r.toFixed(2)}:1 (${fg} on ${bg})`); }
  return ok;
};

for (const [name, theme] of Object.entries(THEMES)) {
  for (const mode of ["light", "dark"]) {
    const p = theme[mode];
    check(name, mode, "body on bg", p.fg, p.bg);
    check(name, mode, "body on surface", p.fg, p.surface);
    check(name, mode, "muted on bg", p.muted, p.bg);
    check(name, mode, "muted on surface", p.muted, p.surface);
    check(name, mode, "muted on sunken", p.muted, p.sunken);
    check(name, mode, "accent on bg", p.accent, p.bg);
    check(name, mode, "accent on surface", p.accent, p.surface);
    check(name, mode, "accent on sunken", p.accent, p.sunken);
    check(name, mode, "button label", p.accentContrast, p.accent);
    check(name, mode, "button label hover", p.accentContrast, p.accentHover);
    check(name, mode, "danger on bg", p.danger, p.bg);
    check(name, mode, "danger on surface", p.danger, p.surface);
  }
}

const rgba = (h, a) => { const [r, g, b] = hex(h).map((c) => Math.round(c * 255)); return `rgb(${r} ${g} ${b} / ${a})`; };

const tokens = (p, mode) => `
  --background: ${p.bg};
  --surface: ${p.surface};
  --surface-sunken: ${p.sunken};
  --foreground: ${p.fg};
  --muted: ${p.muted};
  --border: ${mode === "dark" ? "rgb(255 255 255 / 0.11)" : rgba(p.fg, 0.11)};
  --border-strong: ${mode === "dark" ? "rgb(255 255 255 / 0.2)" : rgba(p.fg, 0.2)};
  --accent: ${p.accent};
  --accent-hover: ${p.accentHover};
  --accent-contrast: ${p.accentContrast};
  --accent-wash: ${rgba(p.accent, mode === "dark" ? 0.13 : 0.09)};
  --danger: ${p.danger};
  --danger-wash: ${rgba(p.danger, mode === "dark" ? 0.13 : 0.09)};
  --elev-sm: ${mode === "dark" ? "0 1px 2px rgb(0 0 0 / 0.5)" : `0 1px 2px ${rgba(p.fg, 0.06)}`};
  --elev-md: ${mode === "dark" ? "0 4px 16px -4px rgb(0 0 0 / 0.6)" : `0 4px 16px -4px ${rgba(p.fg, 0.1)}`};
  --elev-lg: ${mode === "dark" ? "0 18px 48px -12px rgb(0 0 0 / 0.7)" : `0 18px 48px -12px ${rgba(p.fg, 0.16)}`};
  --scrim: ${rgba(p.fg, 0.72)};
  color-scheme: ${mode};`;

let css = `/* ============================================================================
   Theme palettes. GENERATED by scripts/themes.mjs, do not hand-edit.

   Five themes, each with a light and a dark set. Every pair below was checked
   against WCAG AA (4.5:1) before being written: body and muted text on all
   three surfaces, the accent as link text on all three, the button label on
   both accent states, and the danger colour on two.

   Selector strategy, per theme:
     [data-theme=x]                              light values
     @media dark { [data-theme=x]:not([data-mode=light]) }   follows the OS
     [data-theme=x][data-mode=dark]              explicit choice wins

   The explicit block is last so a manual choice always beats the OS in both
   directions. \`data-mode\` is set before first paint by the script in layout.
   ============================================================================ */
`;

for (const [name, theme] of Object.entries(THEMES)) {
  const sel = name === "graphite" ? `:root, [data-theme="${name}"]` : `[data-theme="${name}"]`;
  const selDark = name === "graphite"
    ? `:root:not([data-mode="light"]), [data-theme="${name}"]:not([data-mode="light"])`
    : `[data-theme="${name}"]:not([data-mode="light"])`;
  const selForced = name === "graphite"
    ? `:root[data-mode="dark"], [data-theme="${name}"][data-mode="dark"]`
    : `[data-theme="${name}"][data-mode="dark"]`;

  css += `\n/* ${theme.label} */\n${sel} {${tokens(theme.light, "light")}\n}\n`;
  css += `\n@media (prefers-color-scheme: dark) {\n  ${selDark} {${tokens(theme.dark, "dark").replace(/\n  /g, "\n    ")}\n  }\n}\n`;
  css += `\n${selForced} {${tokens(theme.dark, "dark")}\n}\n`;
}

writeFileSync("C:/projects/leeeto/app/themes.css", css, "utf8");

const list = Object.entries(THEMES).map(([id, t]) => ({ id, label: t.label, swatch: t.light.accent, swatchDark: t.dark.accent }));
console.log(failures === 0 ? "ALL CONTRAST PAIRS PASS" : `${failures} FAILURES`);
console.log(JSON.stringify(list, null, 2));
