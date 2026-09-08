"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CaretDown } from "@phosphor-icons/react";

gsap.registerPlugin(useGSAP);

/**
 * A disclosure that actually animates open and shut.
 *
 * Height is the awkward property here: `height: auto` is not a number, so it
 * cannot be interpolated by CSS at all, which is why the usual workaround is a
 * hardcoded max-height that either clips tall content or adds a dead pause on
 * short content. GSAP measures the natural height at the start of the tween and
 * animates to that real number, then clears the inline value so the panel goes
 * back to sizing itself. A textarea that grows while open still works.
 *
 * The content stays mounted while closed and is hidden with `visibility` plus
 * zero height rather than unmounted, so a half-typed form is not thrown away by
 * collapsing the panel. `inert` keeps it out of the tab order while shut.
 */
export function Collapsible({
  summary,
  children,
  defaultOpen = false,
  id,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  id: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const caret = useRef<HTMLSpanElement>(null);
  // Skips the entrance tween on first paint: animating from closed to open on
  // mount would look like the page was still loading.
  const mounted = useRef(false);

  useGSAP(
    () => {
      const element = panel.current;
      if (!element) return;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (!mounted.current || reduced) {
        mounted.current = true;
        gsap.set(element, {
          height: open ? "auto" : 0,
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
        });
        gsap.set(caret.current, { rotate: open ? 180 : 0 });
        return;
      }

      gsap.to(caret.current, { rotate: open ? 180 : 0, duration: 0.3, ease: "power2.out" });

      if (open) {
        gsap.fromTo(
          element,
          { height: 0, opacity: 0, visibility: "visible" },
          {
            height: "auto",
            opacity: 1,
            duration: 0.42,
            ease: "power3.out",
            // Back to auto so content that grows later is not trapped at the
            // height it happened to have when the tween ended.
            clearProps: "height",
          }
        );
        return;
      }

      gsap.to(element, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => gsap.set(element, { visibility: "hidden" }),
      });
    },
    { dependencies: [open], scope: root }
  );

  return (
    <div ref={root} className="overflow-hidden rounded-panel border border-border bg-surface">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-6 py-4 text-left transition-colors duration-200 hover:bg-surface-sunken"
      >
        <span className="flex-1">{summary}</span>
        <span
          ref={caret}
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-control text-muted"
        >
          <CaretDown size={16} weight="bold" />
        </span>
      </button>

      <div
        ref={panel}
        id={id}
        // inert while shut so collapsed form fields are not tabbable.
        inert={!open}
        className="overflow-hidden"
      >
        {children}
      </div>
    </div>
  );
}
