"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

const LINKS = [
  { href: "/problems", label: "Problems" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/duels", label: "Duels" },
  { href: "/notes", label: "Notes" },
  { href: "/solutions", label: "Solutions" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-8 py-3">
        <Link href="/" className="font-display text-lg font-semibold">
          leeeto
        </Link>

        <Show when="signed-in">
          <ul className="flex flex-1 items-center gap-1 text-sm">
            {LINKS.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative rounded-md px-3 py-1.5 transition-colors hover:bg-surface ${
                      isActive
                        ? "font-medium text-foreground after:absolute after:inset-x-3 after:-bottom-px after:h-px after:bg-accent"
                        : "text-muted"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Show>

        <Show when="signed-out">
          <SignInButton />
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </nav>
    </header>
  );
}
