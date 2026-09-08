/**
 * The one button system.
 *
 * Exported as a class-string factory rather than only a component, because
 * about half the "buttons" in this app are really links: the Start button is an
 * anchor so the browser opens the problem tab from a real user gesture, and the
 * CSV exports are anchors so Content-Disposition does the download. Those must
 * look identical to a <button> without pretending to be one.
 *
 * Shape follows the documented scale in globals.css: controls are 10px, never
 * pills. Every variant has a hover, an active (physical push), a focus ring and
 * a disabled state, and every label/background pair passes WCAG AA.
 */

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium " +
  "transition-[background-color,border-color,color,transform,box-shadow] duration-200 " +
  "ease-[cubic-bezier(0.16,1,0.3,1)] active:translate-y-px " +
  "disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-contrast shadow-sm hover:bg-accent-hover hover:shadow-md",
  secondary:
    "border border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-sunken",
  // No border and no fill: for tertiary actions that shouldn't add visual noise.
  ghost: "text-muted hover:bg-surface-sunken hover:text-foreground",
  danger: "border border-border bg-transparent text-danger hover:bg-danger-wash",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim();
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
