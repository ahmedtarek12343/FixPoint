"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { X } from "@phosphor-icons/react";

gsap.registerPlugin(useGSAP);

/**
 * A dialog with a real close animation.
 *
 * The awkward part of animating a modal in React is the exit: once `open` flips
 * to false the node is normally gone before a tween can run. So the component
 * keeps its own `mounted` flag. Opening mounts and plays in; closing plays out
 * and only then unmounts, from the timeline's onComplete. `useGSAP` reverts the
 * timeline if the component disappears mid-tween, so a fast open/close cannot
 * leave the page with a stuck scrim.
 *
 * Rendered through a portal into <body> deliberately: `position: fixed` is
 * relative to the nearest transformed ancestor rather than the viewport, and
 * this app animates transforms on section wrappers. A modal opened inside one
 * of those would be trapped in it.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const root = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Adjusted during render rather than in an effect. Opening has to mount the
  // node in the same commit the tween is set up in, or the first frame of the
  // entrance is missed. React supports exactly this: a conditional setState on
  // the component's own state during render re-runs the render before anything
  // is shown, with no extra paint.
  if (open && !mounted) setMounted(true);

  useGSAP(
    () => {
      if (!mounted || !scrim.current || !panel.current) return;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (open) {
        if (reduced) {
          gsap.set([scrim.current, panel.current], { opacity: 1, y: 0, scale: 1 });
          return;
        }

        const tl = gsap.timeline({
          defaults: { duration: 0.34, ease: "power3.out" },
        });

        tl.from(scrim.current, { opacity: 0, duration: 0.22 })
          .from(
            panel.current,
            { opacity: 0, y: 18, scale: 0.97, ease: "back.out(1.4)" },
            "<"
          )
          .from(
            panel.current.querySelectorAll("[data-modal-row]"),
            { opacity: 0, y: 10, duration: 0.26, stagger: 0.04 },
            "<0.08"
          );
        return;
      }

      // Closing: play out, then unmount from onComplete.
      if (reduced) {
        setMounted(false);
        return;
      }

      gsap
        .timeline({ onComplete: () => setMounted(false) })
        .to(panel.current, {
          opacity: 0,
          y: 8,
          scale: 0.98,
          duration: 0.18,
          ease: "power2.in",
        })
        .to(scrim.current, { opacity: 0, duration: 0.16 }, "<");
    },
    { dependencies: [open, mounted], scope: root }
  );

  // Escape closes, the page behind does not scroll, and focus goes into the
  // dialog on open and back where it came from on close.
  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!mounted || !open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    // Focus the first control rather than the dialog itself, so a keyboard user
    // is already where they need to type.
    const focusable = panel.current?.querySelector<HTMLElement>(
      "input, textarea, select, button"
    );
    focusable?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus?.();
    };
  }, [mounted, open, close]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div ref={root} style={{ zIndex: "var(--z-overlay)" }} className="fixed inset-0">
      <div
        ref={scrim}
        onClick={close}
        className="absolute inset-0 bg-scrim backdrop-blur-[2px]"
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-end justify-center p-4 sm:items-center">
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="w-full max-w-lg overflow-hidden rounded-panel border border-border bg-surface shadow-lg"
        >
          <div className="flex items-start gap-4 p-6 pb-0" data-modal-row>
            <div className="flex flex-1 flex-col gap-1.5">
              <h2 id="modal-title" className="text-xl font-semibold">
                {title}
              </h2>
              {description && (
                <p className="text-sm text-muted">{description}</p>
              )}
            </div>

            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="-mt-1 -mr-1 flex size-8 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-sunken hover:text-foreground"
            >
              <X size={16} weight="bold" />
            </button>
          </div>

          <div className="p-6" data-modal-row>
            {children}
          </div>

          {footer && (
            <div
              className="flex flex-wrap justify-end gap-2 border-t border-border bg-surface-sunken/60 px-6 py-4"
              data-modal-row
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
