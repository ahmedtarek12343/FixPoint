import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import { SiteNav } from "@/components/utils/site-nav";
import "./globals.css";

// Inter for reading, Space Grotesk for headings (it has more character at
// display sizes), JetBrains Mono for code and timers — a mono with clearly
// distinct 0/O and 1/l matters when you're reading a join code aloud.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "leeeto",
  description:
    "Time your problem practice, keep notes and solutions, track your weak topics, and duel your friends.",
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
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
      >
        {/* Deliberately NOT a flex column. As a flex container, every child of
            body became a flex item that shrinks by default, so a tall child
            (an open whiteboard) got compressed instead of extending the page.
            Normal block flow has no such failure mode. */}
        <body className="min-h-full">
          <Providers>
            <SiteNav />
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
