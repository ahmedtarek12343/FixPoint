"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CheckCircle, WarningCircle, X } from "@phosphor-icons/react";

gsap.registerPlugin(useGSAP);

/**
 * Toasts, for mutation feedback only.
 *
 * The rule this file exists to enforce: a toast reports that something
 * *happened*, it never carries information the user needs to act on. Anything
 * they must read and respond to (a validation failure, a rejected URL) stays
 * inline next to the control, because a message that disappears on a timer is
 * the wrong place for it. Errors get a longer life and no auto-dismiss on
 * hover; successes are brief.
 */

type ToastTone = "success" | "error";

type Toast = {
  id: number;
  tone: ToastTone;
  message: string;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
  /** Convenience wrappers, so callers read as prose. */
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION: Record<ToastTone, number> = {
  success: 3200,
  error: 6000,
};

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used inside <ToastProvider>.");
  }
  return value;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = nextId.current++;
    // Cap the stack. Beyond three the oldest is unreadable anyway, and a burst
    // of failed retries should not paper over the page.
    setToasts((current) => [...current.slice(-2), { id, tone, message }]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message: string) => toast(message, "success"),
      error: (message: string) => toast(message, "error"),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* aria-live="polite" so a screen reader finishes its current sentence
          before announcing. assertive would interrupt typing feedback. */}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{ zIndex: "var(--z-toast)" }}
        className="pointer-events-none fixed inset-x-4 bottom-4 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((entry) => (
          <ToastItem key={entry.id} toast={entry} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useGSAP(
    () => {
      if (!root.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(root.current, {
        opacity: 0,
        y: 16,
        scale: 0.96,
        duration: 0.42,
        ease: "back.out(1.6)",
        clearProps: "transform",
      });
    },
    { scope: root }
  );

  // Hovering pauses the countdown, which is the difference between a toast you
  // can actually read a long error out of and one that vanishes as you reach
  // for it. Re-running on `paused` restarts the full duration, deliberately.
  useEffect(() => {
    if (paused) return;

    const timer = setTimeout(() => onDismiss(toast.id), DURATION[toast.tone]);
    return () => clearTimeout(timer);
  }, [paused, toast.id, toast.tone, onDismiss]);

  const isError = toast.tone === "error";

  return (
    <div
      ref={root}
      role={isError ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto flex w-full items-start gap-2.5 rounded-panel border py-3 pr-2.5 pl-3.5 shadow-lg backdrop-blur-sm sm:w-auto sm:max-w-sm ${
        isError
          ? "border-danger/30 bg-danger-wash"
          : "border-accent/30 bg-accent-wash"
      }`}
    >
      {isError ? (
        <WarningCircle
          size={18}
          weight="fill"
          className="mt-px shrink-0 text-danger"
          aria-hidden="true"
        />
      ) : (
        <CheckCircle
          size={18}
          weight="fill"
          className="mt-px shrink-0 text-accent"
          aria-hidden="true"
        />
      )}

      <p className="flex-1 text-sm">{toast.message}</p>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="-my-0.5 flex size-6 shrink-0 items-center justify-center rounded-chip text-muted transition-colors hover:bg-surface hover:text-foreground"
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  );
}
