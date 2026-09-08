import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Required for React's <ViewTransition> to fire on route navigation.
    // The bare CSS `@view-transition { navigation: auto }` at-rule only covers
    // cross-document navigation, which an App Router app almost never does, so
    // without this flag the transitions in globals.css would never run.
    viewTransition: true,
  },
};

export default nextConfig;
