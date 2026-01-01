import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"]
      }
    })
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/setupTests.ts",
        "src/utils/test/**",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/index.tsx",
        "src/env.d.ts",
        "build/",
        "vite.config.js",
        "vitest.config.ts"
      ],
      include: ["src/**/*.{ts,tsx}"]
    },
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false
  }
});
