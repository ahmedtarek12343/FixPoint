"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Fades and lifts its direct children in, staggered.
 *
 * The motion is doing one job: sequence. Reading order is top to bottom, so
 * things arrive top to bottom, which makes a dense page land as a series of
 * beats rather than a wall. That is the whole justification. There is no
 * parallax, no pinning and no infinite loop anywhere in this app, because
 * nothing here would be communicating anything.
 *
 * Three deliberate choices:
 *
 * 1. Children are NOT hidden by CSS first. If they were, a JS failure or a slow
 *    bundle would leave the page permanently blank. The cost is a possible
 *    one-frame flash; the benefit is content that always renders.
 * 2. `prefers-reduced-motion` is honoured here as well as in globals.css,
 *    because GSAP animates inline styles and never sees the CSS media query.
 * 3. ScrollTrigger, never a scroll event listener. A listener fires on every
 *    frame with no batching; ScrollTrigger reads position once per tick.
 */
export function Reveal({
  children,
  className,
  stagger = 0.07,
  delay = 0,
  y = 14,
  /** "mount" for above-the-fold content, "scroll" for everything below it. */
  trigger = "mount",
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  y?: number;
  trigger?: "mount" | "scroll";
}) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const targets = scope.current?.children;
      if (!targets?.length) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(targets, {
        opacity: 0,
        y,
        duration: 0.55,
        ease: "power2.out",
        stagger,
        delay,
        // Without this GSAP leaves `transform: translate(0px, 0px)` behind, and
        // a transformed ancestor becomes the containing block for any
        // `position: fixed` descendant, which would trap a fullscreen overlay
        // inside this wrapper instead of the viewport.
        clearProps: "transform",
        ...(trigger === "scroll"
          ? {
              scrollTrigger: {
                trigger: scope.current,
                // Fires once, a little before the block is fully on screen, so
                // the reveal has finished by the time it is being read.
                start: "top 85%",
                once: true,
              },
            }
          : {}),
      });
    },
    { scope, dependencies: [trigger] }
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
