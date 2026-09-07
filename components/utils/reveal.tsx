"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/**
 * Fades and lifts its direct children in, staggered.
 *
 * Two deliberate choices:
 *
 * 1. Children are NOT hidden by CSS first. If they were, a JS failure or a slow
 *    bundle would leave the page permanently blank. The cost is a possible
 *    one-frame flash; the benefit is content that always renders.
 * 2. `prefers-reduced-motion` is honoured here as well as in globals.css,
 *    because GSAP animates inline styles and never sees the CSS media query.
 */
export function Reveal({
  children,
  className,
  stagger = 0.07,
  delay = 0,
  y = 14,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  y?: number;
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
        duration: 0.5,
        ease: "power2.out",
        stagger,
        delay,
        // Without this GSAP leaves `transform: translate(0px, 0px)` behind, and
        // a transformed ancestor becomes the containing block for any
        // `position: fixed` descendant — which would trap a fullscreen overlay
        // inside this wrapper instead of the viewport.
        clearProps: "transform",
      });
    },
    { scope }
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
