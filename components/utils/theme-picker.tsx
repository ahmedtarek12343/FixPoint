"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Palette, Check } from "@phosphor-icons/react";
import {
  DEFAULT_THEME,
  MODES,
  MODE_STORAGE_KEY,
  THEMES,
  THEME_STORAGE_KEY,
  type ModeId,
  type ThemeId,
} from "@/lib/theme";

gsap.registerPlugin(useGSAP);

/**
 * Theme and mode picker.
 *
 * A menu rather than a sun/moon switch: there are five palettes and three modes
 * here, and a two-state toggle cannot express either. Mode also has a genuine
 * third value, "System", which a toggle has nowhere to put.
 *
 * State is written straight to the document element and to localStorage, and
 * read back before first paint by the bootstrap script, so there is no flash
 * and no server/client mismatch (the button renders the same markup either way;
 * only the checkmarks differ, and those settle in the first effect).
 */
export function ThemePicker() {
  const [open, setOpen] = useState(false);

  // Seeded from the DOM rather than from an effect. The bootstrap script has
  // already written both attributes by the time any of this runs, so reading
  // them back is exact and costs no extra render. On the server there is no
  // document, so the defaults stand; nothing that depends on these values is
  // rendered until the menu is opened, so hydration sees identical markup.
  const [theme, setTheme] = useState<ThemeId>(
    () =>
      (typeof document === "undefined"
        ? null
        : (document.documentElement.getAttribute("data-theme") as ThemeId)) ??
      DEFAULT_THEME
  );
  const [mode, setMode] = useState<ModeId>(
    () =>
      (typeof document === "undefined"
        ? null
        : (document.documentElement.getAttribute("data-mode") as ModeId)) ??
      "system"
  );

  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape. Both listeners are removed on
  // unmount, and neither is attached while the menu is shut.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Open animation only. Closing unmounts the panel, and animating an exit
  // would mean keeping a dead node around to animate; the menu is small enough
  // that an instant close reads as responsive rather than abrupt.
  useGSAP(
    () => {
      if (!open || !panel.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const tl = gsap.timeline({
        defaults: { duration: 0.28, ease: "power3.out" },
      });

      tl.from(panel.current, { opacity: 0, y: -8, scale: 0.97 }).from(
        panel.current.querySelectorAll("[data-menu-item]"),
        { opacity: 0, y: -6, duration: 0.22, stagger: 0.025 },
        "<0.05"
      );
    },
    { dependencies: [open], scope: root }
  );

  // setAttribute rather than assigning to `dataset`: the latter is a property
  // write on a DOM object the compiler cannot prove is safe to mutate, and it
  // is flagged. Same effect, and removeAttribute expresses "unset" better than
  // `delete` does anyway.
  const applyTheme = (next: ThemeId) => {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
  };

  const applyMode = (next: ModeId) => {
    setMode(next);
    // "system" removes the attribute entirely so the prefers-color-scheme
    // blocks in themes.css take over again.
    if (next === "system") {
      document.documentElement.removeAttribute("data-mode");
    } else {
      document.documentElement.setAttribute("data-mode", next);
    }
    try {
      localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {}
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Theme"
        onClick={() => setOpen((value) => !value)}
        className="flex size-9 items-center justify-center rounded-control text-muted transition-[color,background-color,transform] duration-200 ease-[var(--ease-out)] hover:bg-surface-sunken hover:text-foreground active:translate-y-px"
      >
        <Palette size={18} />
      </button>

      {open && (
        <div
          ref={panel}
          role="menu"
          style={{ zIndex: "var(--z-menu)" }}
          className="absolute right-0 mt-2 w-52 origin-top-right overflow-hidden rounded-panel border border-border bg-surface p-1.5 shadow-lg"
        >
          <p className="px-2.5 py-1.5 text-xs text-muted">Palette</p>
          {THEMES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="menuitemradio"
              aria-checked={theme === entry.id}
              data-menu-item
              onClick={() => applyTheme(entry.id)}
              className="flex w-full items-center gap-2.5 rounded-control px-2.5 py-1.5 text-sm transition-colors duration-150 hover:bg-surface-sunken"
            >
              {/* Two halves: the accent in light and in dark, so the swatch
                  tells you what the palette does in both modes. */}
              <span
                aria-hidden="true"
                className="flex size-4 shrink-0 overflow-hidden rounded-chip border border-border-strong"
              >
                <span
                  className="w-1/2"
                  style={{ backgroundColor: entry.light }}
                />
                <span className="w-1/2" style={{ backgroundColor: entry.dark }} />
              </span>
              {entry.label}
              {theme === entry.id && (
                <Check size={14} weight="bold" className="ml-auto text-accent" />
              )}
            </button>
          ))}

          <p className="mt-1 border-t border-border px-2.5 pt-2.5 pb-1.5 text-xs text-muted">
            Appearance
          </p>
          {MODES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="menuitemradio"
              aria-checked={mode === entry.id}
              data-menu-item
              onClick={() => applyMode(entry.id)}
              className="flex w-full items-center gap-2.5 rounded-control px-2.5 py-1.5 text-sm transition-colors duration-150 hover:bg-surface-sunken"
            >
              {entry.label}
              {mode === entry.id && (
                <Check size={14} weight="bold" className="ml-auto text-accent" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
