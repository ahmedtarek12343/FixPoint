"use client";

import { useEffect, useRef, useState } from "react";
import { Trash, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

/**
 * Two-step delete, in place.
 *
 * Notes and solutions are the only things in this app that cannot be
 * reconstructed: a deleted attempt is a timing record you can retake, a deleted
 * note is prose that is simply gone. So deleting one asks first.
 *
 * A confirm step in the button rather than a modal, because a modal for "are
 * you sure" is a lot of ceremony for one row, and modal confirmations get
 * click-throughed precisely because they always look the same. The armed state
 * disarms itself after a few seconds, so a stray click never leaves a loaded
 * button sitting on the page.
 */
export function ConfirmButton({
  onConfirm,
  disabled,
  label = "Delete",
  confirmLabel = "Delete for good?",
  size = "sm",
}: {
  onConfirm: () => void;
  disabled?: boolean;
  label?: string;
  confirmLabel?: string;
  size?: "sm" | "md";
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!armed) return;

    timer.current = setTimeout(() => setArmed(false), 4000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [armed]);

  if (!armed) {
    return (
      <Button
        size={size}
        variant="danger"
        disabled={disabled}
        onClick={() => setArmed(true)}
      >
        <Trash size={14} />
        {label}
      </Button>
    );
  }

  return (
    <span className="flex items-center gap-1.5">
      <Button
        size={size}
        variant="danger"
        disabled={disabled}
        // aria-live so a screen reader announces that the button changed
        // meaning under the same finger.
        aria-live="polite"
        onClick={() => {
          setArmed(false);
          onConfirm();
        }}
        className="border-danger"
      >
        <Check size={14} weight="bold" />
        {confirmLabel}
      </Button>
      <Button size={size} variant="ghost" onClick={() => setArmed(false)}>
        Cancel
      </Button>
    </span>
  );
}
