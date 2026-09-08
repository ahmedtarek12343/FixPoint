"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import {
  ChartLineUp,
  ListChecks,
  NotePencil,
  Code,
  Sword,
} from "@phosphor-icons/react";
import { buttonStyles } from "@/components/ui/button";
import { ThemePicker } from "@/components/utils/theme-picker";

const LINKS = [
  { href: "/problems", label: "Problems", Icon: ListChecks },
  { href: "/dashboard", label: "Dashboard", Icon: ChartLineUp },
  { href: "/duels", label: "Duels", Icon: Sword },
  { href: "/notes", label: "Notes", Icon: NotePencil },
  { href: "/solutions", label: "Solutions", Icon: Code },
];

/**
 * Fixed 64px bar, one line at every width.
 *
 * The five links do not fit beside the wordmark on a phone, and a hamburger for
 * five items is a tap tax. Instead they drop to a scroll-snapping strip under
 * the bar on small screens: still one gesture away, still one line.
 */
export function SiteNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      style={{ zIndex: "var(--z-nav)" }}
      className="vt-nav sticky top-0 border-b border-border bg-background/85 backdrop-blur-md"
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8"
      >
        <Link
          href="/"
          className="vt-wordmark group flex items-center gap-2.5 text-lg font-semibold tracking-tight"
        >
          {/* Simple geometric mark: a square with the accent sweeping a quarter
              of it, which is the timer this whole app is built around. */}
          <span
            aria-hidden="true"
            className="relative size-5 overflow-hidden rounded-[5px] border border-border-strong bg-surface"
          >
            <span className="absolute inset-x-0 bottom-0 h-2/5 bg-accent transition-[height] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:h-3/5" />
          </span>
          leeeto
        </Link>

        <Show when="signed-in">
          <ul className="hidden flex-1 items-center gap-0.5 text-sm md:flex">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`relative flex items-center rounded-control px-3 py-1.5 transition-colors duration-200 ${
                    isActive(link.href)
                      ? "font-medium text-foreground after:absolute after:inset-x-3 after:-bottom-[17px] after:h-px after:bg-accent"
                      : "text-muted hover:bg-surface-sunken hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </Show>

        <div className="flex items-center gap-2">
          <ThemePicker />
          <Show when="signed-out">
            <span className={buttonStyles({ size: "sm" })}>
              <SignInButton />
            </span>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </nav>

      <Show when="signed-in">
        <ul className="flex snap-x gap-1 overflow-x-auto border-t border-border px-5 py-2 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LINKS.map(({ href, label, Icon }) => (
            <li key={href} className="snap-start">
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-control px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
                  isActive(href)
                    ? "bg-accent-wash font-medium text-accent"
                    : "text-muted"
                }`}
              >
                <Icon size={16} weight={isActive(href) ? "fill" : "regular"} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </Show>
    </header>
  );
}
