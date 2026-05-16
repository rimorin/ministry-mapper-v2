import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { visualizer } from "rollup-plugin-visualizer";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(() => {
  const isProduction = process.env.NODE_ENV === "production";
  const isCI = !!process.env.CI;
  const isAnalyze = !!process.env.ANALYZE;

  return {
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(packageJson.version)
    },
    build: {
      target: "esnext",
      outDir: "build",
      sourcemap: "hidden",
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Sentry SDK — large SDK, independent release cadence
            if (id.includes("/node_modules/@sentry/")) return "vendor-sentry";

            // React core — ultra-stable, isolated for long-term caching
            if (
              id.includes("/node_modules/react/") ||
              id.includes("/node_modules/react-dom/") ||
              id.includes("/node_modules/scheduler/")
            )
              return "vendor-react";

            // i18n stack — separate change cadence from react
            if (id.includes("i18next") || id.includes("react-i18next"))
              return "vendor-i18n";

            // PocketBase SDK — monolithic (no tree-shaking), separate for cache granularity
            if (id.includes("/node_modules/pocketbase/"))
              return "vendor-pocketbase";

            // nice-modal is imported at app entry (Provider) — keep it tiny and isolated
            // so vendor-ui is NOT pulled into the initial modulepreload chain
            if (id.includes("nice-modal-react")) return "vendor-nice-modal";

            // Sonner toast — tiny (~6 KB), separated for cache granularity
            if (id.includes("/node_modules/sonner/")) return "vendor-sonner";

            // Base UI + floating-ui — fully lazy (only loads when first modal/dialog opens)
            // Toast has been migrated to Sonner so this chunk is no longer on the critical path
            if (
              id.includes("@base-ui/react") ||
              id.includes("@base-ui/utils") ||
              id.includes("@floating-ui")
            )
              return "vendor-base-ui";

            // Form validation stack — all form modals are React.lazy(), never on critical path
            if (
              id.includes("/node_modules/zod/") ||
              id.includes("/node_modules/react-hook-form/") ||
              id.includes("/node_modules/@hookform/")
            )
              return "vendor-forms";

            // Icons — own release cadence, tree-shaking confirmed working (~50 icons used)
            if (id.includes("/node_modules/lucide-react/"))
              return "vendor-icons";

            // Calendar — react-day-picker + date-fns; only used in lazy-loaded modals
            if (
              id.includes("/node_modules/react-day-picker/") ||
              id.includes("/node_modules/date-fns/") ||
              id.includes("/node_modules/@date-fns/")
            )
              return "vendor-calendar";

            // Map UI + virtualization — dnd-kit, react-window
            if (id.includes("@dnd-kit") || id.includes("react-window"))
              return "vendor-ui";

            // Leaflet mapping stack
            if (id.includes("leaflet")) return "vendor-mapping";

            // Everything else from node_modules (wouter, idb, clsx, cva, etc.)
            if (id.includes("node_modules")) return "vendor-libs";
          }
        }
      }
    },
    server: {
      port: 3000
    },
    plugins: [
      tailwindcss(),
      babel({ presets: [reactCompilerPreset()] }),
      react(),
      isAnalyze && visualizer(),
      isProduction &&
        sentryVitePlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
          telemetry: false,
          release: {
            name: process.env.npm_package_version
          },
          bundleSizeOptimizations: {
            excludeDebugStatements: true,
            excludeTracing: true,
            excludeReplayIframe: true,
            excludeReplayShadowDom: true,
            excludeReplayCanvas: true,
            excludeReplayWorker: true
          },
          sourcemaps: {
            filesToDeleteAfterUpload: ["./build/**/*.map"]
          }
        }),
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        injectRegister: "auto",
        // Use the existing site.webmanifest — don't generate a new one
        manifest: false,
        workbox: {
          globPatterns: ["**/*.{js,css,html}"],
          // Exclude translation chunks from precache — they are large (~18–42 kB each)
          // and users only ever need 1 language. Runtime CacheFirst handles them instead.
          globIgnores: ["**/translation-*.js"],
          navigateFallback: "/index.html",
          // Prevent the SW from intercepting direct file navigations (e.g. .json,
          // .webmanifest, .ico) and serving index.html in their place.
          navigateFallbackDenylist: [/\.[a-z]{2,6}$/i],
          inlineWorkboxRuntime: true,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Cache translation chunks on first use; keep up to 4 (covers language
              // switching) and expire after 30 days to pick up translation updates.
              urlPattern: /\/assets\/translation-[^/]+\.js$/,
              handler: "CacheFirst",
              options: {
                cacheName: "translations",
                expiration: {
                  maxEntries: 4,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: false
        }
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    }
  };
});
