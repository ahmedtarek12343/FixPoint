import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    // Mirrors the "@/*" path alias from tsconfig.json.
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
});
