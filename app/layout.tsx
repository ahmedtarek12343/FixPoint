import { ViewTransition } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import { SiteNav } from "@/components/utils/site-nav";
import { SiteFooter } from "@/components/utils/site-footer";
import { DEFAULT_THEME, themeBootstrapScript } from "@/lib/theme";
import "./globals.css";

/**
 * Geist for text, Geist Mono for every number and code block.
 *
 * One family, two cuts. A single superfamily keeps the vertical rhythm honest
 * across the app, and Geist Mono has unmistakable 0/O and 1/l shapes, which
 * matters when someone is reading a six-character duel code out loud.
 */
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "leeeto",
    template: "%s · leeeto",
  },
  description:
    "Time your problem practice, keep notes and solutions, track your weak topics, and race a friend on the same problem.",
  applicationName: "leeeto",
  openGraph: {
    title: "leeeto",
    description:
      "Practice LeetCode and Codeforces with the clock running. Times, notes, whiteboard, topic analytics and duels in one place.",
    type: "website",
    siteName: "leeeto",
  },
  twitter: {
    card: "summary_large_image",
    title: "leeeto",
    description: "Practice LeetCode and Codeforces with the clock running.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        data-theme={DEFAULT_THEME}
        className={`${geist.variable} ${geistMono.variable} h-full antialiased`}
        // The bootstrap script rewrites data-theme and data-mode before paint,
        // so the server-rendered attributes here are intentionally a guess.
        suppressHydrationWarning
      >
        <head>
          {/* Must run before first paint, or the page renders in the default
              palette for a frame and then snaps to the stored one. */}
          <script
            dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
          />
        </head>

        {/* Deliberately NOT a flex column. As a flex container, every child of
            body became a flex item that shrinks by default, so a tall child
            (an open whiteboard) got compressed instead of extending the page.
            Normal block flow has no such failure mode. */}
        <body className="min-h-full">
          <Providers>
            <a
              href="#main"
              className="skip-link rounded-control bg-accent px-4 py-2 text-sm font-medium text-accent-contrast"
            >
              Skip to content
            </a>

            <SiteNav />

            {/* Only the page body crosses. The nav and footer are in this
                layout, so they never unmount on navigation and should not be
                animated: a header that fades on every route change reads as a
                full page reload, which is the exact impression client-side
                routing exists to avoid. */}
            <ViewTransition default="page-swap">{children}</ViewTransition>

            <SiteFooter />

            {/* Fixed, non-interactive, painted once. See globals.css. */}
            <div className="grain" aria-hidden="true" />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
