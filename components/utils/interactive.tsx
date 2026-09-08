"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/**
 * Pointer-driven hover effects.
 *
 * Both of these deliberately never touch React state. A pointermove handler
 * that calls setState re-renders the tree on every frame the mouse moves, which
 * is fine on a desktop demo and collapses on anything slower. `gsap.quickTo`
 * and `quickSetter` write straight to the element, off the render cycle
 * entirely, and `useGSAP` reverts them if the component unmounts mid-motion.
 *
 * Every handler is registered inside the useGSAP callback and removed in its
 * cleanup, so nothing survives a re-render.
 */

/**
 * Pulls the element gently toward the cursor while it is hovered.
 *
 * Reserved for the single primary call to action on a page. On more than that
 * it stops reading as "this is the thing to press" and starts reading as a page
 * that will not sit still.
 */
export function Magnetic({
  children,
  strength = 0.28,
  className,
}: {
  children: React.ReactNode;
  /** Fraction of the cursor's offset from centre that the element follows. */
  strength?: number;
  className?: string;
}) {
  const root = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // A magnetic pull needs a cursor. On touch there is none, and the effect
      // would fire once on tap and stick.
      if (!window.matchMedia("(hover: hover)").matches) return;

      const moveX = gsap.quickTo(element, "x", { duration: 0.5, ease: "power3.out" });
      const moveY = gsap.quickTo(element, "y", { duration: 0.5, ease: "power3.out" });

      const onMove = (event: PointerEvent) => {
        const box = element.getBoundingClientRect();
        moveX((event.clientX - (box.left + box.width / 2)) * strength);
        moveY((event.clientY - (box.top + box.height / 2)) * strength);
      };

      const onLeave = () => {
        moveX(0);
        moveY(0);
      };

      element.addEventListener("pointermove", onMove);
      element.addEventListener("pointerleave", onLeave);

      return () => {
        element.removeEventListener("pointermove", onMove);
        element.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: root }
  );

  return (
    <span ref={root} className={`inline-block ${className ?? ""}`}>
      {children}
    </span>
  );
}

/**
 * Lights the border of each child under the cursor.
 *
 * One listener on the container rather than one per card, and the position is
 * published as two CSS custom properties that a radial gradient in the card's
 * own styles reads. That keeps the JavaScript to two number writes per frame
 * however many cards there are.
 */
export function SpotlightGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = root.current;
      if (!container) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (!window.matchMedia("(hover: hover)").matches) return;

      const cards = Array.from(
        container.querySelectorAll<HTMLElement>("[data-spotlight]")
      );
      if (!cards.length) return;

      const setters = cards.map((card) => ({
        card,
        x: gsap.quickSetter(card, "--spot-x", "px"),
        y: gsap.quickSetter(card, "--spot-y", "px"),
        opacity: gsap.quickTo(card, "--spot-opacity", {
          duration: 0.4,
          ease: "power2.out",
        }),
      }));

      const onMove = (event: PointerEvent) => {
        for (const { card, x, y, opacity } of setters) {
          const box = card.getBoundingClientRect();
          const withinX = event.clientX >= box.left && event.clientX <= box.right;
          const withinY = event.clientY >= box.top && event.clientY <= box.bottom;

          if (withinX && withinY) {
            x(event.clientX - box.left);
            y(event.clientY - box.top);
            opacity(1);
          } else {
            opacity(0);
          }
        }
      };

      const onLeave = () => setters.forEach(({ opacity }) => opacity(0));

      container.addEventListener("pointermove", onMove);
      container.addEventListener("pointerleave", onLeave);

      return () => {
        container.removeEventListener("pointermove", onMove);
        container.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: root }
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
