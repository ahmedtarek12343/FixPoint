import type { ReactNode } from "react";

/**
 * Form field scaffolding.
 *
 * Label above the input, helper text under the label, error under the input.
 * The label is a real <label>, never a placeholder: placeholder-as-label
 * disappears the moment someone starts typing, which is exactly when they most
 * need to know what the box is for.
 */

export const inputStyles =
  "w-full rounded-control border border-border bg-surface px-3 py-2 text-sm " +
  "text-foreground placeholder:text-muted transition-colors duration-200 " +
  "hover:border-border-strong focus:border-accent focus:outline-none " +
  "disabled:opacity-50";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-col gap-0.5">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>

      {children}

      {error && (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-sm text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
